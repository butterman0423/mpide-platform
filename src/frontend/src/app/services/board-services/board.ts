import { Injectable, signal } from '@angular/core';

export interface BoardDevice {
  productName: string;
  manufacturerName: string;
  serialNumber: string;
  device: USBDevice;
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  readonly ARDUINO_VENDOR_ID = 0x2341;
  private readonly MAX_PACKET_SIZE = 64;

  connectedBoard = signal<BoardDevice | null>(null);
  availableDevices = signal<USBDevice[]>([]);

  isWebUSBSupported(): boolean {
    return 'usb' in navigator;
  }

  async refreshDevices(): Promise<void> {
    const devices = await navigator.usb.getDevices();
    this.availableDevices.set(
      devices.filter(d => d.vendorId === this.ARDUINO_VENDOR_ID)
    );
  }

async requestNewDevice(): Promise<USBDevice | null> {
  try {
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: this.ARDUINO_VENDOR_ID }]
    });
    await this.refreshDevices();
    return device;
  } catch (e: Error | unknown) {
    if (e instanceof Error && e.name === 'NotFoundError') return null;
    throw e;
  }
}

  async connect(device: USBDevice): Promise<void> {
    if (this.connectedBoard()) await this.disconnect();

    await device.open();
    await this.prepareForTransfer(device);

    this.connectedBoard.set({
      productName: device.productName ?? 'Arduino',
      manufacturerName: device.manufacturerName ?? 'Arduino LLC',
      serialNumber: device.serialNumber ?? '',
      device
    });

    navigator.usb.addEventListener('disconnect', ((event: USBConnectionEvent) => {if (event.device === device) this.connectedBoard.set(null);}) as EventListener, { once: true });
  }

async disconnect(): Promise<void> {
  const board = this.connectedBoard();
  if (!board) return;
  try {
    await board.device.close();
  } catch (e: Error | unknown) {
    console.error('Error closing device:', e);
  }
  this.connectedBoard.set(null);
}

  async uploadExecutable(binary: ArrayBuffer): Promise<void> {
    const board = this.connectedBoard();
    if (!board) {
      throw new Error('No connected Arduino board found.');
    }

    const device = board.device;
    await this.prepareForTransfer(device);

    const endpointNumber = this.getOutEndpointNumber(device);
    if (endpointNumber === null) {
      throw new Error('No writable USB OUT endpoint found for connected board.');
    }

    const bytes = new Uint8Array(binary);
    for (let offset = 0; offset < bytes.length; offset += this.MAX_PACKET_SIZE) {
      const chunk = bytes.slice(offset, offset + this.MAX_PACKET_SIZE);
      await device.transferOut(endpointNumber, chunk);
    }
  }

  private async prepareForTransfer(device: USBDevice): Promise<void> {
    if (!device.opened) {
      await device.open();
    }

    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }

    const interfaceNumber = this.getWritableInterfaceNumber(device);
    if (interfaceNumber === null) {
      return;
    }

    const usbInterface = device.configuration?.interfaces.find(
      confInterface => confInterface.interfaceNumber === interfaceNumber
    );
    const alreadyClaimed = usbInterface?.claimed ?? false;
    if (!alreadyClaimed) {
      await device.claimInterface(interfaceNumber);
    }
  }

  private getWritableInterfaceNumber(device: USBDevice): number | null {
    const interfaces = device.configuration?.interfaces ?? [];
    for (const usbInterface of interfaces) {
      const hasOutEndpoint = usbInterface.alternate.endpoints.some(
        endpoint => endpoint.direction === 'out'
      );
      if (hasOutEndpoint) {
        return usbInterface.interfaceNumber;
      }
    }
    return null;
  }

  private getOutEndpointNumber(device: USBDevice): number | null {
    const interfaces = device.configuration?.interfaces ?? [];
    for (const usbInterface of interfaces) {
      const endpoint = usbInterface.alternate.endpoints.find(
        value => value.direction === 'out'
      );
      if (endpoint) {
        return endpoint.endpointNumber;
      }
    }
    return null;
  }
}