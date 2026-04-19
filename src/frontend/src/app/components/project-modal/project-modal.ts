import { Component, inject, signal, output } from '@angular/core';
import { OpfsService } from '../../services/opfs';
import { FileStoreService } from '../../services/file-services/file-store';
import { FileSelection } from '../../services/file-services/file-selection';

@Component({
  selector: 'app-project-modal',
  imports: [],
  templateUrl: './project-modal.html',
  styleUrl: './project-modal.css',
})
export class ProjectModal {
  closed = output<void>();

  opfsService = inject(OpfsService);
  fileSelectionService = inject(FileSelection);

  projects = signal<string[]>([]);
  selectedProject = signal<string | null>(null);
  isLoading = signal(true);

  async ngOnInit() {
    this.projects.set(await this.opfsService.getProjects());
    this.isLoading.set(false);
  }

  selectProject(projectName: string) {
    this.selectedProject.set(projectName);
  }

  onCancel() {
    this.closed.emit();
  }

  onProjectSelected() {
    this.fileSelectionService.selectedFileContent.set("");
    this.fileSelectionService.selectedFile.set(null);

    this.opfsService.selectProject(this.selectedProject()!);
    this.closed.emit();
  }
}