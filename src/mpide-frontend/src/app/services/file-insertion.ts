import { Injectable } from '@angular/core';
import { IdeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileInsertion {
    
  insertFile(fileName: string, files: IdeFile[]): IdeFile {
    if (fileName === null || !fileName.trim()){
        throw Error("File must have a name.");
    }

    const fileVersion = this.fileExists(fileName, files);
    const cppFile = fileVersion === 0 ? `${fileName.trim()}.cpp` : `${fileName.trim()}_${fileVersion}.cpp`;

    return {
        fileName: cppFile,
        fileLink: `/app/user123/${cppFile}`,
        fileContent: ""
    };
  }


  fileExists(fileName: string, files: IdeFile[]): number {
    let version = 0;

    files.forEach(f => {
        //file_1.cpp => file_1 => file
        const nameVersion = f.fileName.split(".")[0];
        const name = nameVersion.slice(0, nameVersion.lastIndexOf("_"))

        //incase the use puts file_1 or file_5_3 as the fileName
        if(fileName === name || fileName === nameVersion){
          version += 1;
        }
    })
    return version;
  }
}
