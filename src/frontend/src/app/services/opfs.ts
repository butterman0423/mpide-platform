import { inject, Injectable} from '@angular/core';
import { IdeFile } from '../models/file.model';
import { FileStoreService } from './file-services/file-store';
import { NotificationService } from './event-services/notification-services';

@Injectable({
  providedIn: 'root',
})
export class OpfsService {

  fileStore = inject(FileStoreService);
  private notificationService = inject(NotificationService);
  
  async saveProject(projectName: string, files:IdeFile[]) {
    const root = await navigator.storage.getDirectory();
    const projectDir = await root.getDirectoryHandle(projectName, {create: true})

    const fileNames: string[] = [];

    for (const file of files){
      fileNames.push(file.fileName);
    }

    for (const file of files){
      const fileHandle = await projectDir.getFileHandle(file.fileName, {create: true});
      const writable = await fileHandle.createWritable();
      await writable.write(file.fileContent);
      await writable.close();
    }

    // To remove files that were deleted in editor
    for await (const [name, handle] of projectDir.entries()) {
      if (handle.kind === 'file' && !fileNames.includes(name)) {
        await projectDir.removeEntry(name);
      }
    }

    this.notificationService.show("Project saved successfully!", "SUCCESS");
    this.fileStore.markCurrentStateAsSaved();

  }

  async getProjects(): Promise<string[]> {
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
    this.fileStore.markCurrentStateAsSaved();
  }

  async renameProject(oldName: string, newName: string, files: IdeFile[]){
    const root = await navigator.storage.getDirectory();
    
    const projectsStored = await this.getProjects();

    // If project is already saved in OPFS
    if (projectsStored.includes(oldName)){
      root.removeEntry(oldName, {recursive: true});
      await this.saveProject(newName, files);
    }
  }

  async deleteProject(){
      const root = await navigator.storage.getDirectory();

      const currentProjectName = this.fileStore.projectName();

      const projectsStored = await this.getProjects();

      if (projectsStored.includes(currentProjectName)){
        root.removeEntry(currentProjectName, {recursive: true});
      }
      this.fileStore.projectName.set("Untitled Project");
      this.fileStore.fileList.set([]);
      this.fileStore.markCurrentStateAsSaved();
  }
}
