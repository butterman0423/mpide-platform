import { effect, Injectable, signal } from '@angular/core';
import { IdeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileStoreService {

  fileList = signal<IdeFile[]>([
    {
      fileName: "hi.cpp",
      fileLink: "/app/user123/hi.txt",
      fileContent: '#include <iostream>\nint main() { return 0; }'
    },
    {
      fileName: "main.c",
      fileLink: "/app/user123/main.c",
      fileContent: '#include <avr/io.h>\nint main() { return 0; }'
    },
    {
      fileName: "monkey.c",
      fileLink: "/app/user123/monkey.c",
      fileContent: '#include <avr/io.h>\nint main() { return 0; }'
    }
  ]);

  updateFileContent(fileName: string, newContent: string) {
    this.fileList.update(files => 
      files.map(f => f.fileName === fileName ? { ...f, fileContent: newContent } : f)
    );
  }

  //Sort the files so its easier to insert new ones
  constructor(){
    effect(() => {
      this.fileList().sort((a,b) => a.fileName.localeCompare(b.fileName));
    })
  }

}