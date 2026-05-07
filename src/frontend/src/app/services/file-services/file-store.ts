import { effect, Injectable, signal } from '@angular/core';
import { IdeFile } from '../../models/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileStoreService {

  // This is used for the Project Name of the current project and the Filelist to store the current files
  projectName = signal<string>("Untitled Project");
  fileList = signal<IdeFile[]>([]);
  isProjectUnsaved = signal<boolean>(false);

  projectNameIsBeingEdited = signal<boolean>(false);
  private savedFilesSnapshot = signal<string>(this.serializeFiles([]));

  //Sort the files so its easier to insert new ones
  constructor(){
    effect(() => {
      this.fileList().sort((a,b) => a.fileName.localeCompare(b.fileName));
    });

    effect(() => {
      this.isProjectUnsaved.set(
        this.serializeFiles(this.fileList()) !== this.savedFilesSnapshot()
      );
    });
  }

  resetForNewProject(): IdeFile {
    const blankFile: IdeFile = {
      fileName: "main.c",
      fileLink: "/app/user123/main.c",
      fileContent: '#include <stdio.h>\n\nint main() {\n    return 0;\n}'
    };

    this.fileList.set([blankFile]);
    this.markCurrentStateAsSaved();

    return blankFile;
  }

  markCurrentStateAsSaved(): void {
    this.savedFilesSnapshot.set(this.serializeFiles(this.fileList()));
    this.isProjectUnsaved.set(false);
  }

  private serializeFiles(files: IdeFile[]): string {
    return JSON.stringify(
      [...files]
        .sort((a, b) => a.fileName.localeCompare(b.fileName))
        .map(file => ({
          fileName: file.fileName,
          fileContent: file.fileContent
        }))
    );
  }

}