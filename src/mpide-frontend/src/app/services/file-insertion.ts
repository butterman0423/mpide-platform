import { Injectable } from '@angular/core';
import { IdeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileInsertion {
    
  insertFile(newFile: string, currentFiles: IdeFile[]): IdeFile {
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

    let fileVersion = this.getVersion(newFile, currentFiles);
    

    const createdFile = fileVersion === 0 ? newFile : `${fileName}_${fileVersion}${ext}`;

    return {
        fileName: createdFile,
        fileLink: `/app/user123/${createdFile}`,
        fileContent: ""
    };
  }

  getVersion(newFile: string, currentFiles: IdeFile[]): number {
    const fileParts = this.extractFileInfo(newFile);
    const [fileName, ext] = fileParts;

    let version = 0;
    const filePattern = new RegExp(`^${fileName}_(\\d+)${ext}$`);

    for (const f of currentFiles){
      if(newFile === f.fileName){
        version += 1;
      }
      else if(filePattern.test(f.fileName)){
        const fileMatch = f.fileName.match(filePattern);
        console.log(fileMatch);
        if(fileMatch !== null){
          const v = parseInt(fileMatch[1]);

          if (version === (v-1)){
            break;
          }

          version += 1;
          
        }
      }
    }


    return version;
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
