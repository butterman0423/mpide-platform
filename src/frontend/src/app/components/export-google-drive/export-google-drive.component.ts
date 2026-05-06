import { Component, inject, output, signal } from '@angular/core';
import { GDriveService } from '../../services/google-service/gdrive';
import { NotificationService } from '../../services/event-services/notification-services';
import { FileStoreService } from '../../services/file-services/file-store';

@Component({
  selector: 'app-export-google-drive',
  standalone: true,
  templateUrl: './export-google-drive.component.html',
  styleUrls: ['./export-google-drive.component.css']
})
export class ExportModalComponent {
  private gdriveService = inject(GDriveService);
  private notificationService = inject(NotificationService);
  private fileStoreService = inject(FileStoreService);


  exportZip = output<void>();
  showModal = signal<boolean>(false);
  view = signal<'selection' | 'conflict'>('selection');
  exportType = signal<'zip' | 'gdrive'>('zip');
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedFolderName = signal<string>("No location selected");
  selectedFolderId = signal<string | null>(null);
  conflictingFiles = signal<string[]>([]);

  openModal() {
    this.showModal.set(true);
    this.view.set('selection');
    this.exportType.set('zip');
    this.selectedFolderId.set(null);
    this.selectedFolderName.set("No location selected");
    this.error.set(null);
    this.conflictingFiles.set([]);
  }

  closeModal() {
    this.showModal.set(false);
  }

  selectType(type: 'zip' | 'gdrive') {
    this.exportType.set(type);
  }

  triggerGooglePicker() {
    this.error.set(null);
    this.gdriveService.openFolderPicker((id, name) => {
      this.selectedFolderId.set(id);
      this.selectedFolderName.set(name);
    });
  }

  async confirmSelection() {
    if (this.exportType() === 'zip') {
      this.exportZip.emit();
      this.closeModal();
      return;
    }

    const folderId = this.selectedFolderId();
    if (!folderId) {
      this.error.set("Please select a Google Drive location.");
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const driveFiles = await this.gdriveService.getFilesInFolder(folderId);
      const localFiles = this.fileStoreService.fileList();
      const conflicts = localFiles
        .filter(local => driveFiles.some(drive => drive.name === local.fileName))
        .map(local => local.fileName);

      if (conflicts.length > 0) {
        this.conflictingFiles.set(conflicts);
        this.view.set('conflict'); 
      } else {
        await this.executeUpload(); 
      }
    } catch (err) {
      console.error("Scan failed:", err);
      this.error.set("Failed to scan Google Drive folder.");
    } finally {
      this.isLoading.set(false);
    }
  }

  async executeUpload() {
    this.isLoading.set(true);
    this.error.set(null);
    
    try {
      const folderId = this.selectedFolderId();
      if (!folderId) return;

      const filesToExport = this.fileStoreService.fileList().map(f => ({
        name: f.fileName,
        content: f.fileContent
      }));

      await this.gdriveService.exportProjectFiles(folderId, filesToExport);
      this.notificationService.show("Project exported to Google Drive successfully!", "SUCCESS");
      this.closeModal();
    } catch (err) {
      console.error("Export failed:", err);
      this.error.set("Failed to upload files to Google Drive.");
      this.notificationService.show("Failed to export to Google Drive.", "ERROR");
    } finally {
      this.isLoading.set(false);
    }
  }
}