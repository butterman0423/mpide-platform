import { Component, PLATFORM_ID, inject } from '@angular/core';
import { MonacoEditorModule } from 'ngx-monaco-editor-v2';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // 1. Import this

@Component({
  selector: 'app-editor-panel',
  imports: [MonacoEditorModule, FormsModule,],
  templateUrl: './editor-panel.html',
  styleUrl: './editor-panel.css',
})
export class EditorPanel {
  private platformId = inject(PLATFORM_ID);
  isBrowser = isPlatformBrowser(this.platformId);
    
  editorOptions = {theme: 'vs-dark', language: 'javascript'};
    
  code: string= 'function x() {\nconsole.log("Hello world!");\n}';

}
