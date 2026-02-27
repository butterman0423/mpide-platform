import { Injectable } from '@angular/core';
import { IdeFile } from '../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class FileInsertion {
    
  insertFile(fileName: string): IdeFile {
    if (fileName === null || !fileName.trim()){
        throw Error("fileName can't be empty");
    }

    const cppFile = `${fileName.trim()}.cpp`;

    return {
        fileName: cppFile,
        fileLink: `/app/user123/${cppFile}`,
        fileContent: ""
    };
  }
}
