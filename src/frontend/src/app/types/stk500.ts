export type BoardOpts = {
    name: string,
    baudRate: number,
    signature: Uint8Array,
    pageSize: number,
    timeout: number
}

export interface Stk500 {
    bootload: (
        stream: NodeJS.ReadWriteStream,
        hex: Uint8Array,
        opts: BoardOpts,
        done: ((err: Error) => void) | ((err: Error) => Promise<void>)
    ) => void
}
