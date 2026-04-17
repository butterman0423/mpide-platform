import { Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-new-project-modal",
  imports: [FormsModule],
  templateUrl: "./new-project-modal.html",
  styleUrl: "./new-project-modal.css",
})
export class NewProjectModalComponent implements OnInit {
  @Input() existingProjectNames: string[] = [];
  @Output() createProject = new EventEmitter<string>();
  @Output() cancelModal = new EventEmitter<void>();

  protected projectName = "";

  ngOnInit(): void {
    this.projectName = this.generateDefaultName();
  }

  protected onConfirm(): void {
    const trimmed = this.projectName.trim();
    if (!trimmed || this.isNameTaken()) return;
    this.createProject.emit(trimmed);
  }

  protected onCancel(): void {
    this.cancelModal.emit();
  }

  protected isNameTaken(): boolean {
    return this.existingProjectNames.includes(this.projectName.trim());
  }

  protected isConfirmDisabled(): boolean {
    return !this.projectName.trim() || this.isNameTaken();
  }

  private generateDefaultName(): string {
    const base = "Untitled Project";
    if (!this.existingProjectNames.includes(base)) return base;
    let i = 1;
    while (this.existingProjectNames.includes(`${base} (${i})`)) i++;
    return `${base} (${i})`;
  }
}