import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardService } from '../../services/board-services/board';

@Component({
  selector: 'app-board-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-selector.html',
  styleUrl: './board-selector.css'
})
export class BoardSelectorComponent {
  boardService = inject(BoardService);
  showModal = signal(false);
  selectedDevice = signal<USBDevice | null>(null);
  error = signal<string | null>(null);

  async openModal() {
    this.error.set(null);
    await this.boardService.refreshDevices();
    const devices = this.boardService.availableDevices();
    this.selectedDevice.set(devices.length > 0 ? devices[0] : null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedDevice.set(null);
  }

  async addDevice() {
    const device = await this.boardService.requestNewDevice();
    if (device) this.selectedDevice.set(device);
  }

  async connect() {
    const device = this.selectedDevice();
    if (!device) return;
    try {
      await this.boardService.connect(device);
      this.closeModal();
    } catch (e: Error | unknown) {
      this.error.set(e instanceof Error ? e.message : 'Failed to connect');
    }
  }

  async disconnect() {
    await this.boardService.disconnect();
  }

  selectDevice(device: USBDevice) {
    this.selectedDevice.set(device);
  }

  isSelected(device: USBDevice): boolean {
    return this.selectedDevice() === device;
  }
}