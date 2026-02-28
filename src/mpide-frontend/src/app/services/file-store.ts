import { Injectable, signal } from '@angular/core';
import { IdeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileStoreService {

  fileList = signal<IdeFile[]>([
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
  ]);

}