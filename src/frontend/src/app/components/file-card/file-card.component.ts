import { Component, input, inject, Output, EventEmitter, signal, computed, effect, ViewChild, ElementRef } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IdeFile } from '../../models/file.model';
import { FileSelection } from '../../services/file-services/file-selection';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileStoreService } from '../../services/file-services/file-store';


@Component({
  selector: 'app-file-card',
  imports: [NzIconModule, CommonModule, FormsModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent {
  file = input.required<IdeFile>();
  editFileKey = input<string | null>(null);
  showModal = signal<boolean>(false);
  public fileSelectionService = inject(FileSelection);

  isBeingEdited = computed(
    () => this.editFileKey() !== null && this.editFileKey() === this.file().fileName
  );

  newFileName = '';

  public fileStoreList = inject(FileStoreService);

  @Output() fileSelected = new EventEmitter<IdeFile>();
  @Output() editFile = new EventEmitter<IdeFile>();
  @Output() cancelEdit = new EventEmitter<null>();
  @Output() deleteFile = new EventEmitter<IdeFile>();
  
  @ViewChild('editFileInput') private editFileInput?: ElementRef<HTMLInputElement>;


  constructor() {
    effect(() => {
      const f = this.file();
      if (this.editFileKey() !== null && this.editFileKey() === f.fileName) {
        this.newFileName = f.fileName;
      }
    });

    effect(() => {
      if (this.isBeingEdited()) {
        queueMicrotask(() => {
          this.editFileInput?.nativeElement.focus();
          this.editFileInput?.nativeElement.select();
        });
      }
    });
  }




  //Emit to parent if the user is trying to add a file at the same time. This just cancels the insertion for now
  //Or trying to delete a file
  notifyParent<T extends IdeFile | null>(emitter: EventEmitter<T>, value: T): void {
    emitter.emit(value);
  }

  handleSelect(file: IdeFile) {
    if (this.isBeingEdited()) {
      return;
    }
    this.fileStoreList.cancelProjectRename();
    this.fileSelectionService.selectFile(file);
    this.notifyParent(this.fileSelected, file);
  }

  handleEdit(): void {
    this.fileStoreList.cancelAddFileOperation();
    this.fileStoreList.cancelProjectRename();
    this.notifyParent(this.editFile, this.file());
  }

  handleEditCancel(): void {
    this.notifyParent(this.cancelEdit, null);
  }

  handleEditFileName(oldfile: IdeFile, newFileName: string) {
    this.fileStoreList.cancelProjectRename();

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

    
    for (const file of this.fileStoreList.fileList()){
      if (file.fileName === newFileName && newFileName !== oldfile.fileName){
        return;
      }
    }

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
    this.handleEditCancel();
  }

  openModal() {
    this.fileStoreList.cancelInputs();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  handleDelete(file: IdeFile) {
    this.notifyParent(this.deleteFile, file);
    this.closeModal();
  }
}
