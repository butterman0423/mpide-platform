import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BoardDevice, BoardService } from '../../services/board-services/board';
import { FileStoreService } from '../../services/file-services/file-store';

@Component({
  selector: 'app-board-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './board-selector.html',
  styleUrl: './board-selector.css'
})
export class BoardSelectorComponent {
  boardService = inject(BoardService);
  fileStoreService = inject(FileStoreService);
  showModal = signal(false);
  selectedDevice = signal<BoardDevice | null>(null);
  error = signal<string | null>(null);

  async openModal() {
    this.fileStoreService.cancelInputs();

    this.error.set(null);
    //await this.boardService.refreshDevices();
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
    if (!device) {
      console.error("Unsupported device chosen.")
      return
    }

    this.selectedDevice.set(device)
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

  selectDevice(device: BoardDevice) {
    this.selectedDevice.set(device);
  }

  isSelected(device: BoardDevice): boolean {
    return this.selectedDevice() === device;
  }
}