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
        const name = f.fileName.split(".")[0].split("_")[0];
        if(fileName === name){
            version += 1;
        }
    })
    return version;
  }
}
