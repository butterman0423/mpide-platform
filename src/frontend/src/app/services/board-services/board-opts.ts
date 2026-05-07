import type { BoardOpts } from '../../types/stk500'

const BOARD_IDMAP = {
    "inland-nano-ft232": {usbProductId: 24577, usbVendorId: 1027},
    "inland-uno": {usbProductId: 67, usbVendorId: 9025}
}

const NANO_KEY = getBoardKey(BOARD_IDMAP["inland-nano-ft232"])
const UNO_KEY = getBoardKey(BOARD_IDMAP["inland-uno"])

export function getBoardKey(portId: Partial<SerialPortInfo>): string {
    const { usbProductId, usbVendorId } = portId
    return `${usbProductId}-${usbVendorId}`
}

export function idGrab(portId: Partial<SerialPortInfo>): string {
    const map = BOARD_IDMAP as Record<string, Partial<SerialPortInfo>>
    for (const k in map) {
        const { usbProductId, usbVendorId } = map[k]

        if (usbProductId === portId.usbProductId && usbVendorId === portId.usbVendorId) {
            return k
        }
    }
    return "Unknown"
}


export const BOARD_IDS: SerialPortFilter[] = 
    (Object.values(BOARD_IDMAP) as unknown) as SerialPortFilter[]

export const BOARD_OPTIONS: Record<string, BoardOpts> = {
    [NANO_KEY]: {
        name: "Arduino Nano",
        baudRate: 115200,
        signature: new Uint8Array([0x1e, 0x95, 0x0f]),
        pageSize: 128,
        timeout: 400,
    },
    [UNO_KEY]: {
        name: "Arduino Uno",
        baudRate: 115200,
        signature: new Uint8Array([0x1e, 0x95, 0x0f]),
        pageSize: 128,
        timeout: 400,
    }
}