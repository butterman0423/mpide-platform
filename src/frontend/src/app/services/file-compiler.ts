import { inject, Injectable} from '@angular/core';
import { IdeFile } from '../models/file.model';
import { HttpClient, HttpParams, HttpStatusCode } from '@angular/common/http';
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

    const params = new HttpParams().set("n", numFiles).set("b", ttlBytes);
  
    const url = `${environment.backendUrl}/compiler/request`;
    this.http.get<requestCompilerResp | null>(url, {
      params: params,
      observe: "response"
    }).subscribe({
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