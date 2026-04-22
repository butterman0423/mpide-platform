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
import { BoardService } from './services/board-services/board';

@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, Console, ProjectMenuComponent, FormsModule, NzIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy{
  protected readonly title = signal('mpide-frontend');
  protected activeProjectName = signal("Untitled Project");
  protected consoleMsgs = signal<MessageData[]>([]);
  private compiledExecutable = signal<Uint8Array | null>(null);

  private isExecuting = false;
  private sseSubscription?: Subscription;
  private fileCompileService = inject(FileCompilerService)
  private boardService = inject(BoardService)

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

  handleCompile(compilerId: string) {
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
        this.consoleMsgs.update((msgs) => [...msgs, row]);
      },
      error: () => {
        this.stopListening();
      },
      complete: () => {
        this.stopListening();
      },
    });
  }

  handleExecute(compilerId: string) {
    if (this.isExecuting) {
      return;
    }
    this.getExecutable(compilerId);
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
      next: async (blob: Blob) => {
        try {
          const binary = await blob.arrayBuffer();
          this.compiledExecutable.set(new Uint8Array(binary));
          await this.boardService.uploadExecutable(binary);
        } catch (e) {
          console.error('Failed to upload executable to board:', e);
        }
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