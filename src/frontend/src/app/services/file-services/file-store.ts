import { effect, Injectable, signal } from '@angular/core';
import { IdeFile } from '../../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileStoreService {

  // This is used for the Project Name of the current project and the Filelist to store the current files
  projectName = signal<string>("Untitled Project");
  fileList = signal<IdeFile[]>([]);

  projectNameIsBeingEdited = signal<boolean>(false);

  //Sort the files so its easier to insert new ones
  constructor(){
    effect(() => {
      this.fileList().sort((a,b) => a.fileName.localeCompare(b.fileName));
    })
  }

  resetForNewProject(): IdeFile {
    const blankFile: IdeFile = {
      fileName: "main.c",
      fileLink: "/app/user123/main.c",
      fileContent: '#include <stdio.h>\n\nint main() {\n    return 0;\n}'
    };

    this.fileList.set([blankFile]);

    return blankFile;
  }

}