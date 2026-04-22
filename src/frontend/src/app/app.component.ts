import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel.component';
import { Console, MessageData } from "./components/console/console";
import { ProjectMenuComponent } from './components/project-menu/project-menu.component';
import { Subscription } from 'rxjs';
import { FileCompilerService, CompileStreamEvent } from './services/file-services/file-compiler';
import { OpfsService } from './services/opfs';
import { FileStoreService } from './services/file-services/file-store';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';
import { NotificationComponent } from './components/notification/notification.component';
import { NotificationService } from './services/event-services/notification-services';


@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, Console, ProjectMenuComponent, NotificationComponent, FormsModule, NzIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy{
  protected readonly title = signal('mpide-frontend');
  protected activeProjectName = signal("Untitled Project");
  protected consoleMsgs = signal<MessageData[]>([]);

  private isExecuting = false;
  private sseSubscription?: Subscription;
  private fileCompileService = inject(FileCompilerService)
  private notificationService = inject(NotificationService)

  fileStoreService = inject(FileStoreService);
  opfsService = inject(OpfsService);

  renamedProject = "";

  handleProjectCreated(newName: string){
    this.activeProjectName.set(newName);
  }

  handleSelectedProject(projectName: string){
    this.activeProjectName.set(projectName);
    this.consoleMsgs.set([]);
  }

  handleExecute(compilerId: string) {
    if (this.isExecuting) {
      return
    }
    this.isExecuting = true;
    this.consoleMsgs.set([
      {
        ty: 'LOG',
        dat: {
          ty: "SYSTEM",
          msg: "Compiling project..."
        },
      }
  ]);
    let failed = false;
    this.sseSubscription = this.fileCompileService.submitFiles(compilerId).subscribe({
      next: (event: CompileStreamEvent) => {
        const row: MessageData = {
          ty: 'BUILD',
          dat: {
            stage: event.stage,
            message: event.message,
            is_error: event.is_error,
          },
        };
        if(event.is_error){
          failed = true;
        }
        this.consoleMsgs.update((msgs) => [...msgs, row]);
      },
      error: () => {
        this.stopListening();
      },
      complete: () => {
        this.stopListening();

        if(!failed){
          this.getExecutable(compilerId);
        }
      },
    });
  }

  private async getExecutable(compilerId: string) {
            this.consoleMsgs.update((msgs) => 
          [
            ...msgs,
            {
              ty: 'LOG',
              dat: {
                ty: "SYSTEM",
                msg: "Retrieving executable..."
              },
            }
          ]
        )
    this.fileCompileService.getExecutable(compilerId).subscribe({
      next: (blob: Blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Path = reader.result as string;
          try {
            localStorage.setItem(`${this.activeProjectName()}_executable`, base64Path);
          } catch (e) {
            console.error(e);
          }
        };
        reader.readAsDataURL(blob);
      },
      error: (err) => {
        console.log(err);
      },
      complete: () => {
        this.consoleMsgs.update((msgs) => 
          [
            ...msgs,
            {
              ty: 'LOG',
              dat: {
                ty: "SYSTEM",
                msg: "Successfully retrieved executable"
              },
            }
          ]
        )
      }
    });
  }
  private stopListening() {
    this.sseSubscription?.unsubscribe();
    this.isExecuting = false;
  }

  ngOnDestroy(): void {
    // Just to be safe
    this.stopListening()
  }

  async acceptRename(){
    const projects = await this.opfsService.getProjects();
    if (projects.includes(this.renamedProject)){
      this.notificationService.show("Project with that name already exists", "ERROR");
      return;
    }
    else if (this.renamedProject.trim() === ""){
      this.notificationService.show("Project name cannot be empty", "ERROR");
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