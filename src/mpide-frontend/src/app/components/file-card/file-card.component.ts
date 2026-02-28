import { Component, input, inject, Output, EventEmitter, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IdeFile } from '../../models/file.model';
import { FileSelection } from '../../services/file-selection';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileStoreService } from '../../services/file-store';


@Component({
  selector: 'app-file-card',
  imports: [NzIconModule, CommonModule, FormsModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent {
  file = input.required<IdeFile>();
  public fileSelectionService = inject(FileSelection);
  isBeingEdited = signal<boolean>(false);
  newFileName = '';

  public fileStoreList = inject(FileStoreService);

  @Output() fileSelected = new EventEmitter<string>();

  //Emit to parent if the user is trying to add a file at the same time. This just cancels the insertion for now
  notifyParent(): void {
    this.fileSelected.emit("true");
  }

  handleSelect(file: IdeFile){
    // alert(file.fileName)
    this.fileSelectionService.selectFile(file);
    this.notifyParent();
  }

  handleEditStatus(){
    this.isBeingEdited.set(true);
    
  }
  handleEditFileName(oldfile: IdeFile, newFileName: string) {

    const trimmedName = newFileName.trim();

    if (!trimmedName) return;

    if (trimmedName.length > 50) return;

    const allowedExtensions = ['.cpp', '.c', '.h'];
    const hasValidExtension = allowedExtensions.some(ext =>
      trimmedName.endsWith(ext)
    );

    if (!hasValidExtension) return;

    if (allowedExtensions.includes(trimmedName)) return;

    const validNameRegex = /^(?![0-9-])[a-zA-Z0-9._-]+$/;

    if (!validNameRegex.test(trimmedName)) return;

    newFileName = trimmedName;
    this.newFileName = trimmedName;

    this.fileStoreList.fileList.update(files =>
      files.map(file =>
        file.fileName === oldfile.fileName
          ? { ...file, fileName: newFileName }
          : file
      )
    );
    const newSelectedFile: IdeFile | undefined = this.fileStoreList.fileList().find(item => item.fileName === newFileName);
    if (newSelectedFile){
      this.fileSelectionService.selectFile(newSelectedFile);
    }
    this.isBeingEdited.set(false);
  }

  handleEditCancel(){
    this.isBeingEdited.set(false);
  }

  handleDelete(){
    alert("delete");
  }
}
