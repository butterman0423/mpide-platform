import { inject, Injectable} from '@angular/core';
import { IdeFile } from '../models/file.model';
import { FileStoreService } from './file-services/file-store';

@Injectable({
  providedIn: 'root',
})
export class OpfsService {

  fileStore = inject(FileStoreService);
  
  async saveProject(projectName: string, files:IdeFile[]) {
    const root = await navigator.storage.getDirectory();
    const projectDir = await root.getDirectoryHandle(projectName, {create: true})

    for (const file of files){
      const fileHandle = await projectDir.getFileHandle(file.fileName, {create: true});
      const writable = await fileHandle.createWritable();
      await writable.write(file.fileContent);
      await writable.close();
    }
  }

  async getProjects(){
    const root = await navigator.storage.getDirectory();
    const projects: string[] = [];
    for await (const entry of root.values()){
      if (entry.kind === 'directory') {
        projects.push(entry.name);
      }
    }
    return projects;
  }

  async selectProject(projectName: string)
  {
    const root = await navigator.storage.getDirectory();
    const projectDir = await root.getDirectoryHandle(projectName);
    const files: IdeFile[] = [];
    for await (const file of projectDir.values()){
      if (file.kind === 'file') {
        const fileHandle = await projectDir.getFileHandle(file.name);
        const fileData = await fileHandle.getFile();
        const fileCode = await fileData.text();
        files.push({
          fileName: file.name,
          fileLink: null,
          fileContent: fileCode
        });
      }
    }
    this.fileStore.projectName.set(projectName);
    this.fileStore.fileList.set(files);
  }
}
