import { Component, inject, output, signal } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NewProjectModalComponent } from "../new-project/new-project-modal.component";
import { ProjectDropDownService } from "../../services/project-service";
import { OpfsService } from "../../services/opfs";
import { FileStoreService } from "../../services/file-services/file-store";
import { ProjectModal } from "../project-modal/project-modal";
import { FileSelection } from "../../services/file-services/file-selection";

@Component({
    selector: 'app-project-menu',
    imports: [NzIconModule, NzDropdownModule, ProjectModal, NewProjectModalComponent],
    templateUrl: './project-menu.html',
    styleUrl: './project-menu.css'
  })
  export class ProjectMenuComponent {
    // Both sets of injected services are kept
    private projectService = inject(ProjectDropDownService);
    public fileStoreList = inject(FileStoreService);
    public fileSelectionService = inject(FileSelection);
    
    projectCreated = output<string>();
    protected showNewProjectModal = signal(false);
    protected projectNames = signal<string[]>(["Untitled Project"]);
    // protected currentProjectName = signal("Untitled Project");

    protected options = [
        { label: "New Project",  action: () => this.handleNewProject(), icon: `plus` },
        { label: "Open Project", action: () => this.handleOpenProject(),icon: `folder-open` },
        { label: "Save",         action: () => this.handleSave(),       icon: `save` },
        { label: "Rename",       action: () => this.handleRename(),     icon: `highlight` },
        { label: "Export",       action: () => this.handleExport(),     icon: `export`},
        { label: "Delete",       action: () => this.handleDelete(),     icon: `delete` }
      ];

    private opfsService = inject(OpfsService);
    private fileService = inject(FileStoreService);
    public projectList: string[] = [];
    public isProjectOpen = signal<boolean>(false);

    handleNewProject(){
        this.showNewProjectModal.set(true);
    }

    private getUniqueName(name: string): string {
        let finalName = name;
        let counter = 1;
        const existingNames = this.projectNames();

        while (existingNames.includes(finalName)) {
            finalName = `${name} (${counter})`;
            counter++;
        }
        return finalName;
    }

    handleCreateProject(name: string) {
        const uniqueName = this.getUniqueName(name);
        this.projectNames.update(names => [...names, uniqueName]);
        // this.currentProjectName.set(uniqueName);
        this.fileStoreList.projectName.set(uniqueName);
        
        const newMainFile = this.fileStoreList.resetForNewProject();
        this.fileSelectionService.selectFile(newMainFile);
        
        this.showNewProjectModal.set(false);
        this.projectCreated.emit(uniqueName); 
    }

    onNewProjectCancel() {
        this.showNewProjectModal.set(false);
    }

    async handleOpenProject(){
        this.isProjectOpen.set(true);
    }

    async handleSave(){
        try {
            console.log(this.fileService.fileList())
            await this.opfsService.saveProject(this.fileService.projectName(), this.fileService.fileList());
            alert("Project saved successfully!");
        } catch (err) {
            alert("Save failed)");
        }
    }

    handleRename(){
        alert("Rename")
    }

    async handleExport(){
        const zippedFiles: Blob = await this.projectService.exportProject();

        const link = document.createElement("a")
        link.href = URL.createObjectURL(zippedFiles);
        // Updated this to use your new currentProjectName signal
        link.download = `${this.fileStoreList.projectName()}.zip`;
        link.click()
        link.remove()

    }

    handleDelete(){
        alert("Delete")
    }
  }