import { Component, PLATFORM_ID, inject, effect, OnInit, OnDestroy, output } from '@angular/core';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSelection } from '../../services/file-services/file-selection';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BoardSelectorComponent } from '../board-selector/board-selector';
import { Subscription } from 'rxjs';
import { EventService } from '../../services/event-services/event-service';
import { FileCompilerService } from '../../services/file-services/file-compiler';
import { FileStoreService } from '../../services/file-services/file-store';
import { BoardService } from '../../services/board-services/board';
import { NotificationService } from '../../services/event-services/notification-services';

@Component({
  selector: 'app-editor-panel',
  imports: [MonacoEditorModule, FormsModule, NzIconModule, BoardSelectorComponent],
  templateUrl: './editor-panel.html',
  styleUrl: './editor-panel.css',
})
export class EditorPanel implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private eventSub!: Subscription;
  isBrowser = isPlatformBrowser(this.platformId);
  editorOptions = {theme: 'vs-dark', language: 'cpp'};
  code: string | undefined;
  public fileSelectionService = inject(FileSelection);
  public fileCompilerService = inject(FileCompilerService);
  private eventService = inject(EventService);
  public fileStoreService = inject(FileStoreService);
  private boardService = inject(BoardService);
  private notificationService = inject(NotificationService);

  private compilerId: string | undefined;

  uploadRequest = output<string>();
  
  ngOnInit(): void {
      this.eventSub = this.eventService.event$.subscribe(() => {
        this.handleDelete();
      })
  }

  ngOnDestroy(): void {
      this.eventSub.unsubscribe();
  }
  
  constructor() {
    effect(() => {
      const file = this.fileSelectionService.selectedFile();
      if (file) {
        this.code = this.fileSelectionService.selectedFileContent();
      } else {
        this.code = '';
      }
    })

  }

  handleDelete(){
    this.fileSelectionService.clearFile();
    this.code = "";
  }

  handleUploadRequest(){
    this.fileStoreService.cancelInputs();

    if (!this.boardService.connectedBoard()) {
      console.error('Cannot compile: no connected Arduino board.');
      this.notificationService.show('Connect an Arduino board first.', 'ERROR');
      return;
    }

    this.fileCompilerService.requestCompiler().subscribe({
      next: (id) => {
        if (!id || id.trim().length === 0) {
          this.compilerId = undefined;
          this.notificationService.show('Failed to request compiler. Make sure backend/compiler services are running.', 'ERROR');
          return;
        }
        this.compilerId = id;
        this.uploadRequest.emit(this.compilerId);
      },
      error: () => this.notificationService.show('Failed to request compiler. Make sure backend/compiler services are running.', 'ERROR')
    });
  }

  onCodeChange(newCode: string) {
    this.compilerId = undefined;
    this.fileSelectionService.updateSelectedFileContent(newCode);
  }

  handleFocusOnEditor() {
    this.fileStoreService.cancelInputs();
  }
}
