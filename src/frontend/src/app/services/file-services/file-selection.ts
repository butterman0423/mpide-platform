import { inject, Injectable, signal } from '@angular/core';
import { IdeFile } from "../../models/file.model";
import { FileStoreService } from './file-store';

@Injectable({
  providedIn: 'root',
})
export class FileSelection {

  fileStore = inject(FileStoreService);
    
  selectedFile = signal<IdeFile | null>(null);
  selectedFileContent = signal<string>("");

  selectFile(file: IdeFile) {
    this.selectedFile.set(file);
    this.selectedFileContent.set(file.fileContent);
  } 

  clearFile() {
    this.selectedFile.set(null);
    this.selectedFileContent.set("");
  }

  updateSelectedFileContent(content: string) {
    const file = this.selectedFile();
    if (!file) return;

    // Update the file in the file list
    this.fileStore.fileList.update(files =>
      files.map(f => f.fileName === file.fileName 
        ? { ...f, fileContent: content } 
        : f
      )
    );

    // Keep selected file in sync too
    this.selectedFile.set({ ...file, fileContent: content });
    this.selectedFileContent.set(content);
  }

  
}
