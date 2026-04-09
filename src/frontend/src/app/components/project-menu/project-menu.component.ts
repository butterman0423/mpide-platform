import { Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { NzIconModule } from "ng-zorro-antd/icon";

@Component({
    selector: 'app-project-menu',
    imports: [NzIconModule, MatMenuModule, MatButtonModule],
    templateUrl: './project-menu.html',
    styleUrl: './project-menu.css'
  })
  export class ProjectMenuComponent {
    protected options = [
        { label: "New Project",  action: () => this.handleNewProject(), icon: `plus` },
        { label: "Open Project", action: () => this.handleOpenProject(),icon: `folder-open` },
        { label: "Save",         action: () => this.handleSave(),       icon: `save` },
        { label: "Rename",       action: () => this.handleRename(),     icon: `highlight` },
        { label: "Export",       action: () => this.handleExport(),     icon: `export`},
        { label: "Delete",       action: () => this.handleDelete(),     icon: `delete` }
      ];

    handleNewProject(){
        alert("New Project")
    }

    handleOpenProject(){
        alert("Open Project")
    }

    handleSave(){
        alert("Save")
    }

    handleRename(){
        alert("Rename")
    }

    handleExport(){
        alert("Export")
    }

    handleDelete(){
        alert("Delete")
    }
  }