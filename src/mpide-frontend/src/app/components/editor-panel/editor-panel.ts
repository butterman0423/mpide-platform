import { Component, PLATFORM_ID, inject, effect } from '@angular/core';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { isPlatformBrowser} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileSelection } from '../../services/file-selection';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-editor-panel',
  imports: [MonacoEditorModule, FormsModule, NzIconModule],
  templateUrl: './editor-panel.html',
  styleUrl: './editor-panel.css',
})
export class EditorPanel {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
  code: string | undefined;
  public fileSelectionService = inject(FileSelection);

  constructor() {
    effect(() => {
      const file = this.fileSelectionService.selectedFile();

      if (file) {
        this.code = file.fileContent;
      }
    });
  }
  

}
