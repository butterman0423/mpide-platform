import { Component, signal } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel';

@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mpide-frontend');
}
