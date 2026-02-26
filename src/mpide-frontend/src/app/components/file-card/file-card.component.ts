import { Component, input, inject } from '@angular/core';
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


  handleSelect(file: IdeFile){
    // alert(file.fileName)
    this.fileSelectionService.selectFile(file)
  }

  handleEdit(){
    alert("edit");
  }

  handleDelete(){
    alert("delete");
  }
}
