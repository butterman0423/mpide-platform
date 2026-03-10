import { Component, forwardRef, input } from '@angular/core';
import { NzIconDirective } from "ng-zorro-antd/icon";

export type MessageData = {
  ty: "LOG"
  dat: GeneralMessageData
} | {
  ty: "ERROR"
  dat: ErrorMessageData
}

export interface GeneralMessageData {
  ty: "SYSTEM" | "SERVER"
  msg: string
}
export interface ErrorMessageData {
  header: string
  msgs: string[]
}

@Component({
  selector: 'app-console',
  imports: [
    NzIconDirective, 
    forwardRef(() => ServerMessage),
    forwardRef(() => SystemMessage),
    forwardRef(() => ErrorMessage)
  ],
  templateUrl: './console.html',
  styleUrl: './console.css',
})
export class Console {
  msgs = input.required<MessageData[]>()
}

@Component({
  selector: "app-msg-server",
  imports: [],
  templateUrl: "./messages/msg-server.html",
  styleUrl: "./console.css"
})
export class ServerMessage {
  msg = input.required<string>();

}

@Component({
  selector: "app-msg-system",
  imports: [forwardRef(() => DollarLine)],
  templateUrl: "./messages/msg-sys.html",
  styleUrl: "./console.css"
})
export class SystemMessage {
  msg = input.required<string>();
}

@Component({
  selector: "app-msg-error",
  imports: [forwardRef(() => DollarLine)],
  templateUrl: "./messages/msg-error.html",
  styleUrl: "./console.css"
})
export class ErrorMessage {
  header = input.required<string>();
  msgs = input.required<string[]>();
}

@Component({
  selector: "app-dollar-line",
  imports: [],
  templateUrl: "./dollar-line.html",
  styleUrl: "./console.css"
})
export class DollarLine {
  msg = input.required<string>();
}