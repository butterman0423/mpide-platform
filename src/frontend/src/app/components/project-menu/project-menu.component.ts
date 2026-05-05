import { Component, HostListener, inject, output, signal, ViewChild } from "@angular/core";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NewProjectModalComponent } from "../new-project/new-project-modal.component";
import { ProjectDropDownService } from "../../services/project-service";
import { OpfsService } from "../../services/opfs";
import { FileStoreService } from "../../services/file-services/file-store";
import { ProjectModal } from "../project-modal/project-modal";
import { FileSelection } from "../../services/file-services/file-selection";
import { NotificationService } from "../../services/event-services/notification-services";
import { ImportModalComponent } from "../import-google-drive/import-google-drive.component";

@Component({
    selector: 'app-project-menu',
    imports: [NzIconModule, NzDropdownModule, ProjectModal, NewProjectModalComponent, ImportModalComponent],
    templateUrl: './project-menu.html',
    styleUrl: './project-menu.css'
  })
  export class ProjectMenuComponent {
    @ViewChild('importDriveModal') importDriveModal!: ImportModalComponent;
    private projectService = inject(ProjectDropDownService);
    public fileStoreList = inject(FileStoreService);
    public fileSelectionService = inject(FileSelection);
    
    projectCreated = output<string>();
    projectSelected = output<string>();
    protected showNewProjectModal = signal(false);
    protected projectNames = signal<string[]>(["Untitled Project"]);
    // protected currentProjectName = signal("Untitled Project");


    protected options = [
        { label: "New Project",  action: () => this.handleNewProject(), icon: `plus` },
        { label: "Open Project", action: () => this.handleOpenProject(),icon: `folder-open` },
        { label: "Import from Drive", action: () => this.handleImport(), icon: `google`},
        { label: "Save",         action: () => this.handleSave(),       icon: `save` },
        { label: "Rename",       action: () => this.handleRename(),     icon: `highlight` },
        { label: "Export",       action: () => this.handleExport(),     icon: `export`},
        { label: "Delete",       action: () => this.handleDelete(),     icon: `delete` }
      ];

    private opfsService = inject(OpfsService);
    private fileService = inject(FileStoreService);
    private notificationService = inject(NotificationService);
    public projectList: string[] = [];
    public isProjectOpen = signal<boolean>(false);

    public WarningModal = signal<boolean>(false);
    public ActionRemember = ""; 

    public successMessage = "";

    

    @HostListener('window:beforeunload', ['$event'])
    unloadNotification($event: BeforeUnloadEvent): void {
        $event.returnValue = "Any unsaved data may be lost";
    }

    handleNewProject(){
        this.ActionRemember = "new";
        this.WarningModal.set(true);
    }

    handleImport() {
        this.ActionRemember = "import";
        this.WarningModal.set(true);
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
        this.ActionRemember = "open";
        this.WarningModal.set(true);
    }

    async handleSave(){
        try {
            console.log(this.fileService.fileList())
            await this.opfsService.saveProject(this.fileService.projectName(), this.fileService.fileList());
            // alert("Project saved successfully!");
            this.successMessage = "Project saved successfully!";
            this.notificationService.show("Project saved successfully!", "SUCCESS");
        } catch (err) {
            // alert(err instanceof Error ? err.message : "An unknown error occurred.");
            const errMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            this.notificationService.show(errMessage, "ERROR");
        }
    }

    handleRename(){
        this.fileStoreList.projectNameIsBeingEdited.set(true);
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

    async handleDelete(){
        this.ActionRemember = "delete";
        this.WarningModal.set(true);
    }

    closeWarningModal() {
        this.WarningModal.set(false);
        this.ActionRemember = "";
    }

    async confirmWarn() {
        if (this.ActionRemember === "new"){
            this.showNewProjectModal.set(true);
        }
        else if (this.ActionRemember === "open"){
            this.isProjectOpen.set(true);
        }
        else if (this.ActionRemember === "delete"){
            await this.opfsService.deleteProject();
            this.fileSelectionService.clearFile();

            this.notificationService.show("Project deleted successfully!", "SUCCESS");
        }
        else if (this.ActionRemember === "import"){
            this.importDriveModal.openModal();
        }

        this.closeWarningModal();
    }

    

  }