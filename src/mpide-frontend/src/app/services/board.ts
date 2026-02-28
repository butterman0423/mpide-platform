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
    } catch (e: any) {
      if (e.name === 'NotFoundError') return null;
      throw e;
    }
  }

  async connect(device: USBDevice): Promise<void> {
    if (this.connectedBoard()) await this.disconnect();

    await device.open();

    this.connectedBoard.set({
      productName: device.productName ?? 'Arduino',
      manufacturerName: device.manufacturerName ?? 'Arduino LLC',
      serialNumber: device.serialNumber ?? '',
      device
    });

    navigator.usb.addEventListener('disconnect', ((event: USBConnectionEvent) => {
      if (event.device === device) this.connectedBoard.set(null);}) as EventListener, { once: true });
  }

  async disconnect(): Promise<void> {
    const board = this.connectedBoard();
    if (!board) return;
    try { await board.device.close(); } catch {}
    this.connectedBoard.set(null);
  }
}