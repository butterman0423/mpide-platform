import { inject, Injectable } from "@angular/core";
import { FileStoreService } from "./file-services/file-store";
import { IdeFile } from "../models/file.model";
import JSZip from "jszip";


@Injectable({
  providedIn: 'root'
})
export class ProjectDropDownService {
    private fileStoreSerivce = inject(FileStoreService)


    exportProject(): Promise<Blob> {

        const files: IdeFile[] = this.fileStoreSerivce.fileList()

        const zip = new JSZip();
        files.forEach(file => {
            zip.file(file.fileName, file.fileContent);
        });

        return zip.generateAsync({type: "blob"});

    }
}