import { Component, signal } from '@angular/core';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FileCardComponent } from '../file-card/file-card.component';
import { IdeFile } from '../../models/file.model';

@Component({
  selector: 'app-file-management',
  imports: [NzDividerModule, NzIconModule, FileCardComponent],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css']
})
export class FileManagementComponent{
  //Dummy data
  fileList = signal<IdeFile[]>(
    [
    {fileName: "hi.txt", fileLink: "/app/user123/hi.txt"},
    {fileName: "main.c", fileLink: "/app/user123/main.c"},
    {fileName: "monkey.c", fileLink: "/app/user123/monkey.c"}
    ]
  );

  handleClick() {
    alert('67!');
  }

}
