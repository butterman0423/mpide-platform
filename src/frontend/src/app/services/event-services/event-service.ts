import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { IdeFile } from '../../models/file.model';

@Injectable({
  providedIn: 'root',
})
export class EventService {
    
    private codeSubject = new Subject<IdeFile>();
    private clearSubject = new Subject<void>();

    event$ = this.codeSubject.asObservable();
  
    sendDeleteCode(file: IdeFile){
        this.codeSubject.next(file);
    }

    clearConsole() {
      this.clearSubject.next();
    }
}
