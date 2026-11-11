// Build-time only libraries without their own types (used by the seal)
declare module "wawoff2" {
  export function decompress(woff2: Uint8Array): Promise<Uint8Array>
}
declare module "fontkit" {
  export function create(buffer: Uint8Array): unknown
}
