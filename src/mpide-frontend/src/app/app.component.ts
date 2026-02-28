import { Component, signal } from '@angular/core';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel';
import { BoardSelectorComponent } from './components/board-selector/board-selector';

@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, BoardSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mpide-frontend');
}