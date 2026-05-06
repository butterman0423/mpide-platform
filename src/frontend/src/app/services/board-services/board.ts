import { Injectable, signal } from '@angular/core';
import { BoardOpts } from '../../types/stk500';
import { BOARD_IDS, BOARD_OPTIONS, getBoardKey } from './board-opts';
import { ReadableWebToNodeStream } from 'readable-web-to-node-stream';

// @ts-expect-error Libs below only support ES5 with no typing defs, so typescript throws errors
import Stk500 from 'stk500'

// @ts-expect-error Libs below only support ES5 with no typing defs, so typescript throws errors
import * as intel_hex from 'intel-hex'

// Here are their manual type interfaces
import type { Stk500 as Stk500_t } from '../../types/stk500';
import type { intel_hex as intel_hex_t } from '../../types/intel-hex';


export interface BoardDevice {
  opts: BoardOpts,
  name: string,
  device: SerialPort
}

@Injectable({ providedIn: 'root' })
export class BoardService {
  readonly ARDUINO_VENDOR_ID = 0x2341;
  private stk500: Stk500_t = new Stk500()

  connectedBoard = signal<BoardDevice | null>(null);
  availableDevices = signal<BoardDevice[]>([]);

  constructor() {
    if (!this.isWebSerialSupported()) {
      console.error("WebSerial not found: use a different browser.")
    }

    //@ts-expect-error stk500 relies on the global variable "match" to be defined.
    global.match = ""
  }

  isWebSerialSupported(): boolean {
    return 'serial' in navigator;
  }

  async requestNewDevice(): Promise<BoardDevice | null> {
    const device =  await navigator.serial.requestPort({
      filters: BOARD_IDS
    })

    const boardKey = getBoardKey(device.getInfo())
    if (boardKey in BOARD_OPTIONS) {
      const opt = BOARD_OPTIONS[boardKey]
      const boardMeta: BoardDevice = {
        opts: opt,
        name: opt.name,
        device: device
      }

      this.availableDevices.update((p) => [
        boardMeta, ...p
      ])

      return boardMeta
      
    } else {
      await device.close()
      await device.forget()
    }

    return null
  }

  async connect(device: BoardDevice): Promise<void> {
    const { opts, device: serial } = device
    await serial.open({ baudRate: opts.baudRate })

    this.connectedBoard.set(device)
    serial.addEventListener("disconnect", () => {
      this.disconnect()
    }, { once: true })
  }

  async disconnect(): Promise<void> {
    const pboard = this.connectedBoard()
    if (!pboard) return

    this.connectedBoard.set(null);
    const { device } = pboard;

    // Force unlocks if needed:
    if (device.writable && device.writable.locked) {
      await device.writable.abort()
      await device.writable.close()
    }

    if (device.readable && device.readable.locked) {
      await device.readable.cancel()
    }

    await device.close();
    await device.forget();
  }

  async uploadExecutable(blob: Blob): Promise<void> {
    const board = this.connectedBoard();
    if (!board) {
      throw new Error("No connected board found.")
    }

    const { opts, device } = board
    const bin = await blob.text()
    const { data: hex } = (intel_hex as intel_hex_t).parse(bin)

    const reader = new ReadableWebToNodeStream(device.readable)
    const writer = device.writable.getWriter()

    // Hack to make a duplex stream for stk500
    // Credit: https://github.com/dbuezas/arduino-web-uploader/tree/master
    const stream = (reader as unknown) as NodeJS.ReadWriteStream

    // @ts-expect-error The below definition does not match NodeJS.ReadWriteStream, but needed for WebSerial conversion
    stream.write = (buffer: string | Uint8Array, onDone: (err: Error | null | undefined) => void) => {
      writer!.write(buffer).then(() => onDone(null), onDone)
      return true
    }

    this.stk500.bootload(stream, hex, opts, (e) => {
      // Propagate any errors
      if (e) throw e
    })
  }
}