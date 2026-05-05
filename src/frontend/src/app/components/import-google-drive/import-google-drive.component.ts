import { Component, inject, signal } from '@angular/core';
import { GDriveService } from '../../services/google-service/gdrive';
import { NotificationService } from '../../services/event-services/notification-services';
import { FileStoreService } from '../../services/file-services/file-store';
import { FileSelection } from '../../services/file-services/file-selection';

@Component({
  selector: 'app-import-google-drive',
  standalone: true,
  templateUrl: './import-google-drive.component.html', 
  styleUrls: ['./import-google-drive.component.css']  
})
export class ImportModalComponent {
  private gdriveService = inject(GDriveService);
  private notificationService = inject(NotificationService);
  private fileStoreService = inject(FileStoreService);
  private fileSelectionService = inject(FileSelection);
  
  showModal = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedFolderName = signal<string>("No folder selected");
  selectedFolderId = signal<string | null>(null);

  openModal() {
    this.showModal.set(true);
    this.error.set(null);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedFolderId.set(null);
    this.selectedFolderName.set("No folder selected");
    this.error.set(null);
  }

  triggerGooglePicker() {
    this.error.set(null);
    this.gdriveService.openFolderPicker((id, name) => {
      this.selectedFolderId.set(id);
      this.selectedFolderName.set(name);
    });
  }

  async confirmImport() {
    const folderId = this.selectedFolderId();
    if (!folderId) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const files = await this.gdriveService.fetchProjectFiles(folderId);

      if (files.length === 0) {
        this.error.set("No valid source files (.c, .cpp, .h) found in this directory.");
        this.isLoading.set(false);
        return;
      }

      this.fileStoreService.projectName.set(this.selectedFolderName());

      const formattedFiles = files.map(file => {
          return {
              fileName: file.name,
              fileLink: `/app/drive-import/${file.name}`, 
              fileContent: file.content
          };
      });

      this.fileStoreService.fileList.set(formattedFiles);

      if (formattedFiles.length > 0) {
          this.fileSelectionService.selectFile(formattedFiles[0]);
      }
      this.notificationService.show("Project imported successfully!", "SUCCESS");
      this.closeModal();
    } catch (err) {
      console.error("Import failed:", err);
      this.error.set("Failed to fetch files from Google Drive. Please try again.");
      this.notificationService.show("Failed to import from Google Drive due to permissions.", "ERROR");
    } finally {
      this.isLoading.set(false);
    }
  }
}