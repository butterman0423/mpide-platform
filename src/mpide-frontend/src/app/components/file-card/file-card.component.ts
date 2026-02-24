import { Component, input, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { IdeFile } from '../../models/file.model';


@Component({
  selector: 'app-file-card',
  imports: [NzIconModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent {
  file = input.required<IdeFile>();

  handleSelect(){
    alert(this.file().fileLink)
  }

  handleEdit(){
    alert("edit");
  }

  handleDelete(){
    alert("delete");
  }
}
