import { Component, input, inject, Output, EventEmitter } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IdeFile } from '../../models/file.model';
import { FileSelection } from '../../services/file-selection';
import { CommonModule } from '@angular/common';
import { FileDeletion } from '../../services/file-deletion';


@Component({
  selector: 'app-file-card',
  imports: [NzIconModule, CommonModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent {
  file = input.required<IdeFile>();
  public fileSelectionService = inject(FileSelection);


  @Output() fileSelected = new EventEmitter<string>();
  @Output() deleteFile = new EventEmitter<IdeFile>();

  //Emit to parent if the user is trying to add a file at the same time. This just cancels the insertion for now
  //Or trying to delete a file
  notifyParent(emitter: EventEmitter<any>, value: any): void {
    emitter.emit(value);
  }

  handleSelect(file: IdeFile){
    // alert(file.fileName)
    this.fileSelectionService.selectFile(file);
    this.notifyParent(this.fileSelected, "true");
  }

  handleEdit(){
    alert("edit");
  }

  handleDelete(file: IdeFile){
    this.notifyParent(this.deleteFile, file);
  }
}
