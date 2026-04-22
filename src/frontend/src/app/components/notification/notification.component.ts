import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from "@angular/core";
import { NotificationService, Notification} from "../../services/event-services/notification-services";
import { Subscription } from "rxjs";
import { NzIconModule } from "ng-zorro-antd/icon";

@Component({
    selector: 'app-notification',
    imports: [NzIconModule],
    templateUrl: './notification.html',
    styleUrl: './notification.css'
  })
  export class NotificationComponent implements OnInit, OnDestroy{
    protected currentNotification: Notification | null = null;
    private notifyService = inject(NotificationService)
    private notifySub!: Subscription;
    private cdr = inject(ChangeDetectorRef);
    private hideTimer: ReturnType<typeof setTimeout> | null = null;


    ngOnInit() {
        this.notifySub = this.notifyService.notification$.subscribe(notif => {

        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }

        this.currentNotification = null;
        this.cdr.markForCheck();

        setTimeout(() => {

          this.currentNotification = notif;
          this.cdr.markForCheck();

          this.hideTimer = setTimeout(() => {
            this.currentNotification = null;
            this.hideTimer = null;
            this.cdr.markForCheck();
          }, 2000);
        }, 0);
        });
      }

    ngOnDestroy(): void {
      this.notifySub.unsubscribe();
      if (this.hideTimer) {
        clearTimeout(this.hideTimer);
      }
    }
  }