import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileManagementComponent } from "./components/file-management/file-management.component";

@Component({
  selector: 'app-root',
  imports: [FileManagementComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('mpide-frontend');
}
