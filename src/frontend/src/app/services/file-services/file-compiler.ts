import { inject, Injectable} from '@angular/core';
import { IdeFile } from '../../models/file.model';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpStatusCode, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { FileStoreService } from './file-store';

interface requestCompilerResp {
    id: string
}

interface ProjectFile {
    file_name: string
    extension: string
    content: string
}

@Injectable({
  providedIn: 'root'
})
export class FileCompilerService {
  private http = inject(HttpClient)
  private fileStoreService = inject(FileStoreService)


  requestCompiler(){
    const fileList: IdeFile[] = this.fileStoreService.fileList();

    const nonEmptyFiles = fileList.filter(f => f.fileContent.trim().length > 0);

    if (nonEmptyFiles.length === 0) {
      alert("No files with content to compile.");
      return;
    }

    const numFiles: number = nonEmptyFiles.length;
    const ttlBytes: number = this.getBytes(nonEmptyFiles);

    const body = {
      num_files: numFiles,
      total_bytes: ttlBytes
    };

    const url = `${environment.backendUrl}compiler/request`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post<requestCompilerResp>(url, body, {observe: "response", headers: headers}).subscribe({
      next: (data: HttpResponse<requestCompilerResp>) => {
        const id = data.body?.id;
        if (!id) {
          alert("Failed to get compiler id. Please try again.");
          return;
        }
        this.submitFiles(id, nonEmptyFiles);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status == HttpStatusCode.InsufficientStorage) {
          alert("Request unsuccessful. Please try again in a bit");
        } else {
          alert(err);
        }
      }
    });
  }

  private submitFiles(id: string, fileList: IdeFile[]) {
    const payload: ProjectFile[] = fileList
      .filter((f): f is IdeFile & { fileLink: string } => f.fileLink !== null)
      .map(f => {
        const dotIndex = f.fileName.lastIndexOf('.');
        const fileName = dotIndex !== -1 ? f.fileName.substring(0, dotIndex) : f.fileName;
        const extension = dotIndex !== -1 ? f.fileName.substring(dotIndex) : '.c'; 
        return {
          file_name: fileName,
          extension: extension,
          content: f.fileContent
        };
      });

    const url = `${environment.backendUrl}compiler/j/${id}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.http.post(url, payload, {observe: "response", responseType: 'text', headers: headers}).subscribe({
      next: () => {
        alert("Compilation successful!");
      },
      error: (err: HttpErrorResponse) => {
        alert(err.error); 
        console.error('Compiler Error Message:', err.error);
      }
    });
  }

  private getBytes(files: IdeFile[]): number {
    return files.reduce(
      (acc, cur) => acc + new TextEncoder().encode(cur.fileContent).length,
      0
    )
  }

}