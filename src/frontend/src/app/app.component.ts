import { Component, signal } from '@angular/core';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel';
import { Console } from "./components/console/console";


@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, Console],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mpide-frontend');
}