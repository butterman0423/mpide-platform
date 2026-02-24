import { Component, input, OnInit, signal } from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { IdeFile } from '../../models/file.model';


@Component({
  selector: 'app-file-card',
  imports: [NzIconModule, NzButtonModule],
  templateUrl: './file-card.component.html',
  styleUrls: ['./file-card.component.css']
})
export class FileCardComponent {
  file = input.required<IdeFile>();

  handleSelect(){
    alert(this.file().fileLink)
  }

  handleEdit(){
    alert("Edit");
  }

  handleDelete(){
    alert("delete");
  }
}
