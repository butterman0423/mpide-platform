import { Component, input, inject, Output, EventEmitter } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IdeFile } from '../../models/file.model';
import { FileSelection } from '../../services/file-selection';
import { CommonModule } from '@angular/common';


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

  //Emit to parent if the user is trying to add a file at the same time. This just cancels the insertion for now
  notifyParent(): void {
    this.fileSelected.emit("true");
  }

  handleSelect(file: IdeFile){
    // alert(file.fileName)
    this.fileSelectionService.selectFile(file);
    this.notifyParent();
  }

  handleEdit(){
    alert("edit");
  }

  handleDelete(){
    alert("delete");
  }
}
