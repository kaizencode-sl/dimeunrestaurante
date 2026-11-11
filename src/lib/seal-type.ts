import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as fontkit from "fontkit"
import { decompress } from "wawoff2"

/**
 * The seal is used as a plain <img> on other people's websites and printed,
 * where the site's web fonts aren't available. So at build time its text is
 * set in the site's own fonts (Archivo, Instrument Serif italic) and turned
 * into outlines: it looks the same everywhere, with no font files to load.
 */

type Glyph = { id: number; advanceWidth: number; path: { toSVG(): string } }
type Font = {
  unitsPerEm: number
  layout(text: string): {
    glyphs: Glyph[]
    positions: { xAdvance: number; xOffset: number; yOffset: number }[]
  }
  getVariation(v: Record<string, number>): Font
}

const files = join(process.cwd(), "node_modules")
const load = async (path: string) =>
  fontkit.create(
    Buffer.from(await decompress(readFileSync(join(files, path))))
  ) as unknown as Font

const archivo = await load(
  "@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2"
)
const serif = await load(
  "@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2"
)

export const FACES = {
  /** Wide and heavy, for the arcs */
  wide: archivo.getVariation({ wght: 800, wdth: 118 }),
  /** Plain, for small print */
  text: archivo.getVariation({ wght: 600, wdth: 100 }),
  serif,
} satisfies Record<string, Font>
export type Face = keyof typeof FACES

type Opts = { face: Face; size: number; tracking?: number }

/** Each glyph once in <defs>, then placed with <use> */
export class Type {
  private defs = new Map<string, string>()
  constructor(private prefix: string) {}

  private glyph(face: Face, g: Glyph) {
    const id = `${this.prefix}-${face}-${g.id}`
    if (!this.defs.has(id)) {
      const d = g.path.toSVG()
      this.defs.set(id, d ? `<path id="${id}" d="${d}"/>` : "")
    }
    return this.defs.get(id) ? id : null
  }

  private run(text: string, { face, size, tracking = 0 }: Opts) {
    const font = FACES[face]
    const k = size / font.unitsPerEm
    const { glyphs, positions } = font.layout(text)
    const track = tracking * size
    const items = glyphs.map((g, i) => ({
      id: this.glyph(face, g),
      w: positions[i].xAdvance * k + track,
    }))
    // tracking only goes between letters
    const width = items.reduce((s, it) => s + it.w, 0) - track
    return { k, items, width }
  }

  width(text: string, opts: Opts) {
    return this.run(text, opts).width
  }

  /** A line of text with its baseline at y */
  line(
    text: string,
    x: number,
    y: number,
    opts: Opts & { anchor?: "start" | "middle" | "end"; fill: string }
  ) {
    const { k, items, width } = this.run(text, opts)
    let cx =
      x -
      (opts.anchor === "middle" ? width / 2 : opts.anchor === "end" ? width : 0)
    let out = ""
    for (const it of items) {
      if (it.id)
        out += `<use href="#${it.id}" transform="translate(${cx.toFixed(2)} ${y}) scale(${k.toFixed(5)} -${k.toFixed(5)})"/>`
      cx += it.w
    }
    return `<g fill="${opts.fill}">${out}</g>`
  }

  /**
   * Text centred on the top of a circle (reading clockwise, letters upright
   * outwards) or the bottom (reading left to right, letters pointing in),
   * with the baseline on radius r
   */
  arc(
    text: string,
    cx: number,
    cy: number,
    r: number,
    side: "top" | "bottom",
    opts: Opts & { fill: string }
  ) {
    const { k, items, width } = this.run(text, opts)
    let s = -width / 2
    let out = ""
    for (const it of items) {
      const mid = s + (it.w - (opts.tracking ?? 0) * opts.size) / 2
      const a = side === "top" ? -Math.PI / 2 + mid / r : Math.PI / 2 - mid / r
      const px = cx + r * Math.cos(a)
      const py = cy + r * Math.sin(a)
      const rot = (a * 180) / Math.PI + (side === "top" ? 90 : -90)
      const half = (it.w - (opts.tracking ?? 0) * opts.size) / 2
      if (it.id)
        out += `<use href="#${it.id}" transform="translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${rot.toFixed(2)}) translate(${(-half).toFixed(2)} 0) scale(${k.toFixed(5)} -${k.toFixed(5)})"/>`
      s += it.w
    }
    return `<g fill="${opts.fill}">${out}</g>`
  }

  get defsSvg() {
    return [...this.defs.values()].join("")
  }
}
