import { Component, signal } from '@angular/core';
import { FileManagementComponent } from "./components/file-management/file-management.component";
import { EditorPanel } from './components/editor-panel/editor-panel';
import { Console } from "./components/console/console";
import { ProjectMenuComponent } from './components/project-menu/project-menu.component';


@Component({
  selector: 'app-root',
  imports: [FileManagementComponent, EditorPanel, Console, ProjectMenuComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mpide-frontend');
  protected activeProjectName = signal("Untitled Project");

  handleProjectCreated(newName: string){
    this.activeProjectName.set(newName);
  }
}