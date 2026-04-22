import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Notification {
    message: string;
    ty: 'SUCCESS' | 'ERROR';
  }

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
    
    private notificationSubject = new Subject<Notification>();
  
    notification$ = this.notificationSubject.asObservable();

  show(message: string, ty: "SUCCESS" | "ERROR") {
    this.notificationSubject.next({message, ty});
  }
}
