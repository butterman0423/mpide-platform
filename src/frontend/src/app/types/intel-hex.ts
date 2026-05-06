export interface intel_hex {
    parse: (data: string) => ({ data: Uint8Array })
}
