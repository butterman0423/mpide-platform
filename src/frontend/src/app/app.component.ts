import { Component, inject, OnDestroy, signal } from '@angular/core';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel.component';
import { Console, MessageData } from "./components/console/console";
import { ProjectMenuComponent } from './components/project-menu/project-menu.component';
import { Subscription } from 'rxjs';
import { FileCompilerService, CompileStreamEvent } from './services/file-services/file-compiler';


@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, Console, ProjectMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnDestroy{
  protected readonly title = signal('mpide-frontend');
  protected activeProjectName = signal("Untitled Project");
  protected consoleMsgs = signal<MessageData[]>([]);

  private isExecuting: boolean = false;
  private sseSubscription?: Subscription;
  private fileCompileService = inject(FileCompilerService)

  handleProjectCreated(newName: string){
    this.activeProjectName.set(newName);
  }

  handleExecute(compilerId: string) {
    if (this.isExecuting) {
      return
    }
    this.isExecuting = true;
    this.consoleMsgs.set([]);

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

  private stopListening() {
    this.sseSubscription?.unsubscribe();
    this.isExecuting = false;
  }

  ngOnDestroy(): void {
    // Just to be safe
    this.stopListening()
  }
}