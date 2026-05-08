import { Component, inject, signal, output, OnInit } from '@angular/core';
import { OpfsService } from '../../services/opfs';
import { FileSelection } from '../../services/file-services/file-selection';
import { FileStoreService } from '../../services/file-services/file-store';

@Component({
  selector: 'app-project-modal',
  imports: [],
  templateUrl: './project-modal.html',
  styleUrl: './project-modal.css',
})
export class ProjectModal implements OnInit {
  closed = output<void>();
  projectSelected = output<string>();

  opfsService = inject(OpfsService);
  fileSelectionService = inject(FileSelection);
  fileStoreService = inject(FileStoreService);

  projects = signal<string[]>([]);
  selectedProject = signal<string | null>(null);
  isLoading = signal(true);

  async ngOnInit() {
    this.projects.set(await this.opfsService.getProjects());
    this.isLoading.set(false);
  }

  selectProject(projectName: string) {
    this.fileStoreService.cancelProjectRename();
    this.selectedProject.set(projectName);
  }

  onCancel() {
    this.fileStoreService.cancelProjectRename();
    this.closed.emit();
  }

  onProjectSelected() {
    this.fileSelectionService.selectedFileContent.set("");
    this.fileSelectionService.selectedFile.set(null);

    this.opfsService.selectProject(this.selectedProject()!);
    this.closed.emit();
    this.projectSelected.emit(this.selectedProject()!);
  }
}