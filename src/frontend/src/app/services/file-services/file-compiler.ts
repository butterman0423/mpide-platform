import { inject, Injectable, NgZone} from '@angular/core';
import { IdeFile } from '../../models/file.model';
import { HttpClient, HttpHeaders, HttpErrorResponse, } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { FileStoreService } from './file-store';
import { catchError, map, Observable, of, throwError } from 'rxjs';
import { BoardDevice, BoardService } from '../board-services/board';

interface requestCompilerResp {
  id: string
}

interface ProjectFile {
  file_name: string
  extension: string
  content: string
}

interface ExecutePayload {
  files: ProjectFile[]
  arduino_board: string
}

/** Payload from compiler SSE (`data:` JSON). */
export interface CompileStreamEvent {
  stage: string
  message: string
  is_error: boolean
}

@Injectable({
  providedIn: 'root'
})
export class FileCompilerService {
  private http = inject(HttpClient)
  private fileStoreService = inject(FileStoreService)
  private boardService = inject(BoardService)
  private _zone = inject(NgZone)


  requestCompiler(): Observable<string> {
    const fileList: IdeFile[] = this.fileStoreService.fileList();

    const nonEmptyFiles = fileList.filter(f => f.fileContent.trim().length > 0);

    if (nonEmptyFiles.length === 0) {
      return throwError(() => new Error("No files with content to compile."));
    }

    const numFiles: number = nonEmptyFiles.length;
    const ttlBytes: number = this.getBytes(nonEmptyFiles);

    const body = {
      num_files: numFiles,
      total_bytes: ttlBytes
    };

    const url = `${environment.backendUrl}compiler/request`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http.post<requestCompilerResp>(url, body, {headers: headers}).pipe(
      map(res => res.id),
      catchError(err => {
        console.log(err)
        return of("")
      })
    )
  }

  /**
   * Opens the compile log SSE immediately and POSTs project files in parallel.
   * Emits one value per SSE message until stage DONE, then completes.
   */
  submitFiles(id: string, board: BoardDevice): Observable<CompileStreamEvent> {
    if ( board === null) {
      return throwError(() => new Error("Connect to an arduino board first."))
    }

    const fileList: IdeFile[] = this.fileStoreService.fileList();

    const nonEmptyFiles = fileList.filter(f => f.fileContent.trim().length > 0);

    if (nonEmptyFiles.length === 0) {
      return throwError(() => new Error("No files with content to compile."));
    }

    const requestFiles: ProjectFile[] = nonEmptyFiles
      .map(f => {
        const dotIndex = f.fileName.lastIndexOf('.');
        const fileName = dotIndex !== -1 ? f.fileName.substring(0, dotIndex) : f.fileName;
        const extension = dotIndex !== -1 ? f.fileName.substring(dotIndex).toLowerCase() : '.c';
        return {
          file_name: fileName,
          extension: extension,
          content: f.fileContent
        };
      });

    if (requestFiles.length === 0) {
      return throwError(() => new Error("No valid files to compile."));
    }

    const postUrl = `${environment.backendUrl}compiler/j/${id}`;
    const sseUrl = `${environment.backendUrl}compiler/poll?id=${encodeURIComponent(id)}`;
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return new Observable<CompileStreamEvent>(observer => {
      const eventSource = new EventSource(sseUrl);
      let finished = false;

      const end = () => {
        if (finished) {
          return;
        }
        finished = true;
        eventSource.close();
      };

      const parseAndEmit = (raw: string) => {
        const ev = JSON.parse(raw) as CompileStreamEvent;
        this._zone.run(() => {
          observer.next(ev);
          if (ev.stage === 'DONE') {
            end();
            observer.complete();
          }
        });
      };

      eventSource.onmessage = (event: MessageEvent) => {
        try {
          parseAndEmit(event.data);
        } catch (e) {
          this._zone.run(() => {
            end();
            observer.error(e);
          });
        }
      };

      eventSource.onerror = () => {
        this._zone.run(() => {
          if (finished) {
            return;
          }
          end();
          observer.error(new Error('EventSource connection error'));
        });
      };

      const payload: ExecutePayload = {
        files: requestFiles,
        arduino_board: board.id
      }


      const postSub = this.http.post(postUrl, payload, {
        observe: 'response',
        responseType: 'text',
        headers
      }).subscribe({
        error: (err: HttpErrorResponse) => {
          this._zone.run(() => {
            end();
            observer.error(err);
          });
        }
      });

      return () => {
        end();
        postSub.unsubscribe();
      };
    });
  }

  getExecutable(compilerId: string): Observable<Blob> {
    if(compilerId.trim().length <= 0) {
      return throwError(() => new Error("Missing id"));
    }

    const url = `${environment.backendUrl}compiler/j/${compilerId}`

    return this.http.get(url, {responseType: "blob"}).pipe(
      catchError(error => {
        return throwError(() => new Error(error.message));
      }) 
    )


  }

  private getBytes(files: IdeFile[]): number {
    return files.reduce(
      (acc, cur) => acc + new TextEncoder().encode(cur.fileContent).length,
      0
    )
  }

}
