import { inject, Injectable} from '@angular/core';
import { IdeFile } from '../models/file.model';
import { HttpClient, HttpHeaders, HttpStatusCode } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { FileStoreService } from './file-store';

interface requestCompilerResp {
    id: string
}
@Injectable({
  providedIn: 'root'
})
export class FileCompilerService {
  private http = inject(HttpClient)
  private fileStoreService = inject(FileStoreService)


  requestCompiler(){
    const fileList: IdeFile[] = this.fileStoreService.fileList();

    const numFiles: number = fileList.length;
    const ttlBytes: number = this.getBytes(fileList);

    const body = {
      num_files : numFiles,
      total_bytes : ttlBytes
    };
  
    const url = `${environment.backendUrl}compiler/request`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    // GET doesn't support a request body, so have to use POST
    this.http.post<requestCompilerResp>(url, body, {observe: "response", headers: headers}).subscribe({
        next: (data) => {
            alert(JSON.stringify(data))
        },
        error: (err) => {
            if (err.status == HttpStatusCode.InsufficientStorage) {
              alert("Request unsuccessful. Please try again in a bit");
            } else{
              alert(err);
              console.log(err);
            }
        }
    }
    )
  }

  private getBytes(files: IdeFile[]): number {
    return files.reduce(
      (acc, cur) => acc + new TextEncoder().encode(cur.fileContent).length,
      0
    )
  }

}