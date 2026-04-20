import { Component, inject, signal } from '@angular/core';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel';
import { Console } from "./components/console/console";
import { ProjectMenuComponent } from './components/project-menu/project-menu.component';
import { FileStoreService } from './services/file-services/file-store';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { OpfsService } from './services/opfs';


@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, Console, ProjectMenuComponent, FormsModule, NzIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

  fileStoreService = inject(FileStoreService);
  opfsService = inject(OpfsService);

  protected readonly title = signal('mpide-frontend');
  protected activeProjectName = signal("Untitled Project");

  renamedProject = "";

  handleProjectCreated(newName: string){
    this.activeProjectName.set(newName);
  }

  async acceptRename(){
    const projects = await this.opfsService.getProjects();
    if (projects.includes(this.renamedProject)){
      alert("Project with that name already exists");
      return;
    }
    else if (this.renamedProject.trim() === ""){
      alert("Project name cannot be empty");
      return;
    }
    else{
      const oldProjectName = this.fileStoreService.projectName();
      this.fileStoreService.projectName.set(this.renamedProject);
      this.renamedProject = "";
      await this.opfsService.renameProject(oldProjectName, this.fileStoreService.projectName(), this.fileStoreService.fileList());
      this.fileStoreService.projectNameIsBeingEdited.set(false);
    }
  }

  cancelRename(){
    this.renamedProject = "";
    this.fileStoreService.projectNameIsBeingEdited.set(false);
  }
  
  

  
}