import { Component, PLATFORM_ID, inject, effect, OnInit, OnDestroy, output, untracked } from '@angular/core';
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

  private compilerId: string | undefined;

  executeRequest = output<string>();
  
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

    effect(() => {
      this.fileStoreService.fileList();
      // If fileList is updated in anyway, revoke compiler Id request
      untracked(() => {
      this.compilerId = undefined;
    });
    })
  }

  handleDelete(){
    this.fileSelectionService.clearFile();
    this.code = "";
  }

  handleCompilerRequest(){
    this.fileCompilerService.requestCompiler().subscribe({
      next: (id) => {
        this.compilerId = id;
        alert("request success");
      },
      error: (err) => console.log(err)
    });
  }

  handleExecuteRequest() {
    if(!this.compilerId || this.compilerId.trim().length <= 0){
      alert("Request to compile first.");
      return;
    }

    this.executeRequest.emit(this.compilerId);
  }

  onCodeChange(newCode: string) {
    this.fileSelectionService.updateSelectedFileContent(newCode);
  }
}
