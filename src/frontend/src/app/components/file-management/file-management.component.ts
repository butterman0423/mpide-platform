import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FileCardComponent } from '../file-card/file-card.component';
import { IdeFile } from '../../models/file.model';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileInsertion } from '../../services/file-insertion';
import { FileSelection } from '../../services/file-selection';
import { FileStoreService } from '../../services/file-store';
import { FileDeletion } from '../../services/file-deletion';
import { EventService } from '../../services/event-service';

@Component({
  selector: 'app-file-management',
  imports: [NzDividerModule, NzIconModule, FileCardComponent, ReactiveFormsModule],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css']
})
export class FileManagementComponent{
  protected addFile = false;
  protected fileError  = false;
  protected errorMessage = "";

  private fileInsertionService = inject(FileInsertion);
  private fileSelectionService = inject(FileSelection);
  private fileDeletionService = inject(FileDeletion);
  private eventService = inject(EventService);
  public fileStoreList = inject(FileStoreService);

  readonly editFile = signal<string | null>(null);

  //The browser automatically focuses on the input field
  @ViewChild('fileInput') set inputRef(content: ElementRef) {
    if (content) {
      content.nativeElement.focus();
    }
  }

  fileForm = new FormGroup({
    newFile: new FormControl('')
  })

  handleClick(): void {
    this.editFile.set(null);
    this.addFile = true;
  }

  handleAddFile(): void {
    
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
    this.fileError = false;
    this.addFile = false;
    this.fileForm.reset();
  }

  handleEditFile(file: IdeFile): void {
    this.editFile.set(file.fileName);
  }

  resetEditFile(): void {
    this.editFile.set(null);
  }


  onFileSelected(selected: IdeFile): void {
    if (this.editFile() !== null && selected.fileName !== this.editFile()) {
      this.resetEditFile();
    }
    if (this.addFile) {
      this.resetAddFile();
    }
  }

  deleteFile(file: IdeFile): void {
    this.fileStoreList.fileList.update(() => this.fileDeletionService.deleteFile(file, this.fileStoreList.fileList()));
    if(this.fileSelectionService.selectedFile() !== null && this.fileSelectionService.selectedFile()?.fileName === file.fileName){
      this.eventService.sendDeleteCode(file);
    }
  }

}
