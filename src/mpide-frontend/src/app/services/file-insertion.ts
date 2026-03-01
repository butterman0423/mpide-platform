import { Injectable } from '@angular/core';
import { IdeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileInsertion {
    
  insertFile(newFile: string, files: IdeFile[]): IdeFile {
    if (newFile === null || !newFile.trim()){
      throw Error("File must have a name.");
    }

    newFile = newFile.trim();

    const fileParts = this.extractFileInfo(newFile);

    if (!fileParts.length){
      throw Error("File isn't the right type.");
    }

    const [fileName, ext] = fileParts;

    const allowedExtensions = ['.cpp', '.c', '.h'];
    if(!allowedExtensions.includes(ext)){
      throw Error("File isn't the right type.");
    }

    let fileVersion = 0;
    const filePattern = new RegExp(`^${fileName}_\\d+${ext}$`);

    files.forEach(f => {
      console.log(f.fileName);
      console.log(filePattern);
      if(newFile === f.fileName || filePattern.test(f.fileName)){
        fileVersion += 1;
      }
    })

    const cppFile = fileVersion === 0 ? fileName : `${fileName}_${fileVersion}${ext}`;

    return {
        fileName: cppFile,
        fileLink: `/app/user123/${cppFile}`,
        fileContent: ""
    };
  }

  extractFileInfo(file: string): string[] {
    const lastExtension = file.lastIndexOf(".");

    if (lastExtension === -1) {
      return [];
    }

    const fileName = file.slice(0, lastExtension);
    const ext = file.slice(lastExtension, file.length);

    return [fileName, ext];
  }
}
