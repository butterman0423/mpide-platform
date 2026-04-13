import { Component, PLATFORM_ID, inject, effect, OnInit, OnDestroy } from '@angular/core';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSelection } from '../../services/file-selection';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BoardSelectorComponent } from '../board-selector/board-selector';
import { Subscription } from 'rxjs';
import { EventService } from '../../services/event-service';
import { FileCompilerService } from '../../services/file-compiler';
import { FileStoreService } from '../../services/file-store';

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
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
  code: string | undefined;
  public fileSelectionService = inject(FileSelection);
  public fileCompilerService = inject(FileCompilerService);
  private eventService = inject(EventService);
  public fileStoreService = inject(FileStoreService);


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
        this.code = file.fileContent;
      }
    });
  }

  handleDelete(){
    this.fileSelectionService.clearFile();
    this.code = '';
  }

  onCodeChange(newCode: string) {
    const activeFile = this.fileSelectionService.selectedFile();
    if (activeFile && newCode !== undefined) {
      this.fileStoreService.updateFileContent(activeFile.fileName, newCode);
    }
  }

  handleCompilerRequest(){
    this.fileCompilerService.requestCompiler();
  }
}
