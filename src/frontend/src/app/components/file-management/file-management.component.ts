import { Component, effect, ElementRef, inject, ViewChild } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FileCardComponent } from '../file-card/file-card.component';
import { IdeFile } from '../../models/file.model';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileInsertion } from '../../services/file-services/file-insertion';
import { FileSelection } from '../../services/file-services/file-selection';
import { FileStoreService } from '../../services/file-services/file-store';
import { FileDeletion } from '../../services/file-services/file-deletion';
import { EventService } from '../../services/event-services/event-service';

@Component({
  selector: 'app-file-management',
  imports: [NzDividerModule, NzIconModule, FileCardComponent, ReactiveFormsModule],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css']
})
export class FileManagementComponent{
  protected fileError  = false;
  protected errorMessage = "";

  private fileInsertionService = inject(FileInsertion);
  private fileSelectionService = inject(FileSelection);
  private fileDeletionService = inject(FileDeletion);
  private eventService = inject(EventService);
  public fileStoreList = inject(FileStoreService);

  //The browser automatically focuses on the input field
  @ViewChild('fileInput') set inputRef(content: ElementRef) {
    if (content) {
      content.nativeElement.focus();
    }
  }

  fileForm = new FormGroup({
    newFile: new FormControl('')
  })

  constructor() {
    effect(() => {
      if (!this.fileStoreList.addFileIsBeingAdded()) {
        this.fileError = false;
        this.fileForm.reset();
      }
    });
  }

  handleClick(): void {
    this.fileStoreList.cancelProjectRename();
    this.fileStoreList.addFileIsBeingAdded.set(true);
    this.fileStoreList.cancelEditFileOperation();
  }

  handleAddFile(): void {
    this.fileStoreList.cancelProjectRename();
    
    const name = this.fileForm.get("newFile")?.value?.toLowerCase() ?? "";

    try{
      const newFile: IdeFile = this.fileInsertionService.insertFile(name, this.fileStoreList.fileList());

      //reset everything
      this.resetAddFile();

      this.fileStoreList.fileList.update(files => [...files, newFile]);
      this.fileSelectionService.selectFile(newFile)
    }

    catch(e: unknown ){
      this.fileError = true;

      if (e instanceof Error) {
        this.errorMessage = e.message;
      } 
      else {
        //Fallback
        this.errorMessage = "File must have a name.";
      }
    }
    
  }
  
  resetAddFile(): void {
    this.fileStoreList.cancelAddFileOperation();
  }

  handleEditFile(file: IdeFile): void {
    this.fileStoreList.cancelProjectRename();
    if (this.fileStoreList.addFileIsBeingAdded()) {
      this.resetAddFile();
    }
    this.fileStoreList.editFileKey.set(file.fileName);
  }

  resetEditFile(): void {
    this.fileStoreList.cancelEditFileOperation();
  }


  onFileSelected(selected: IdeFile): void {
    this.fileStoreList.cancelProjectRename();
    if (this.fileStoreList.editFileKey() !== null && selected.fileName !== this.fileStoreList.editFileKey()) {
      this.resetEditFile();
    }
    if (this.fileStoreList.addFileIsBeingAdded()) {
      this.resetAddFile();
    }
  }

  deleteFile(file: IdeFile): void {
    this.fileStoreList.cancelProjectRename();
    this.fileStoreList.fileList.update(() => this.fileDeletionService.deleteFile(file, this.fileStoreList.fileList()));
    if(this.fileSelectionService.selectedFile() !== null && this.fileSelectionService.selectedFile()?.fileName === file.fileName){
      this.eventService.sendDeleteCode(file);
    }
  }

}
