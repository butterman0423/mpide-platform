import { Injectable, signal } from '@angular/core';
import { IdeFile } from '../../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileSelection {
    
  selectedFile = signal<IdeFile | null>(null);

  selectFile(file: IdeFile) {
    this.selectedFile.set(file);
  } 

  clearFile() {
    this.selectedFile.set(null);
  }
}
