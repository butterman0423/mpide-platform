import { Component, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FileCardComponent } from '../file-card/file-card.component';
import { IdeFile } from '../../models/file.model';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FileInsertion } from '../../services/file-insertion';
import { FileSelection } from '../../services/file-selection';

@Component({
  selector: 'app-file-management',
  imports: [NzDividerModule, NzIconModule, FileCardComponent, ReactiveFormsModule],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css']
})
export class FileManagementComponent{
  protected addFile = false;
  protected fileError = false;
  private fileInsertionService = inject(FileInsertion);
  private fileSelectionService = inject(FileSelection);
  //Dummy data
  

  fileList = signal<IdeFile[]>(
    [
      {
        fileName: "hi.txt", 
        fileLink: "/app/user123/hi.txt", 
        fileContent: 'function x() {\nconsole.log("Hello world!");\n}'
      },
      {
        fileName: "main.c", 
        fileLink: "/app/user123/main.c",
        fileContent: 'function x() {\nconsole.log("YERRRRRR");\n}'
      },
      {
        fileName: "monkey.c", 
        fileLink: "/app/user123/monkey.c", 
        fileContent: 'function x() {\nconsole.log("le butter is le butter");\n}'
      }
    ]
  );

  @ViewChild('fileInput') set inputRef(content: ElementRef) {
    if (content) {
      content.nativeElement.focus();
    }
  }

  fileForm = new FormGroup({
    newFile: new FormControl('')
  })

  handleClick(): void {
    this.addFile = true;
  }

  handleAddFile(e: Event): void {
    e.preventDefault();
    
    const name = this.fileForm.get("newFile")?.value ?? "";

    try{
      const newFile: IdeFile = this.fileInsertionService.insertFile(name);

      //reset everything
      this.fileError = false;
      this.addFile = false;
      this.fileForm.reset();

      this.fileList.update(files => [...files, newFile]);
      this.fileSelectionService.selectFile(newFile)
    }

    catch(e){
      this.fileError = true;
    }
    
  }

}
