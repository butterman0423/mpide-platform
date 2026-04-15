import { Injectable } from '@angular/core';
import { IdeFile } from '../../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileDeletion {
    
  deleteFile(file: IdeFile, currentFiles: IdeFile[]): IdeFile[] {
    return currentFiles.filter(f => f.fileName !== file.fileName);
  }
}
