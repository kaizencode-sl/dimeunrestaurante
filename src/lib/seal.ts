import qrcode from "qrcode-generator"
import { moonPath } from "@/lib/moon"
import { Type } from "@/lib/seal-type"
import { url } from "@/lib/url"

/** Restaurants get a seal from this score up */
export const SEAL_MIN = 7

export type SealTheme = "noche" | "claro"

/** Alberto's personal brand: the seal carries his handle */
export const HANDLE = "@alberto_deluna"

const THEMES: Record<
  SealTheme,
  { bg: string; accent: string; text: string; lit: string; base: string }
> = {
  noche: {
    bg: "#0a0a0a",
    accent: "#f2b33d",
    text: "#ece7db",
    lit: "#f7ecd0",
    base: "#3a3632",
  },
  claro: {
    bg: "#ece7db",
    accent: "#8f5a06",
    text: "#0a0a0a",
    lit: "#e2a530",
    base: "#d6cebb",
  },
}

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  )

export const sealUrl = (id: string, theme: SealTheme = "noche") =>
  url(`/sello/${theme === "claro" ? `${id}-claro` : id}.svg`)

export const signUrl = (id: string, theme: SealTheme = "noche") =>
  url(`/sello/${id}-cartel${theme === "claro" ? "-claro" : ""}.svg`)

/** A four-point sparkle, the site's star, centred on x,y */
const sparkle = (x: number, y: number, r: number, fill: string) =>
  `<path transform="translate(${x} ${y})" d="M0,${-r}Q${r * 0.16},${-r * 0.16} ${r},0Q${r * 0.16},${r * 0.16} 0,${r}Q${-r * 0.16},${r * 0.16} ${-r},0Q${-r * 0.16},${-r * 0.16} 0,${-r}Z" fill="${fill}"/>`

// A few fixed stars around the moon, kept clear of it and of the score
const STARS: [number, number, number, number][] = [
  [126, 118, 1.3, 0.9],
  [146, 86, 0.9, 0.6],
  [262, 96, 1.1, 0.75],
  [284, 134, 0.8, 0.55],
  [114, 170, 0.8, 0.5],
  [290, 178, 1.2, 0.85],
  [232, 74, 0.8, 0.5],
  [166, 70, 0.7, 0.45],
]

/**
 * Names over 28 letters are cut at the last whole word that fits, without
 * leaving a dangling "de", "la" or "y": "García de la Navarra Restaurante y
 * Vinoteca" becomes "García de la Navarra"
 */
const shortName = (name: string, max = 28) => {
  if (name.length <= max) return name
  const words = name.split(" ")
  const out: string[] = []
  for (const w of words) {
    if ([...out, w].join(" ").length > max) break
    out.push(w)
  }
  while (
    out.length > 1 &&
    /^(de|del|la|las|el|los|y|&|en|nd|and|–|-)$/i.test(out.at(-1)!)
  )
    out.pop()
  return out.length ? out.join(" ") : `${name.slice(0, max - 1)}…`
}

/** The seal's artwork in a 400×400 box, sharing glyphs through `type` */
function sealBody(
  type: Type,
  id: string,
  { name, score, theme }: { name: string; score: number; theme: SealTheme }
) {
  const t = THEMES[theme]
  const C = 200
  const scoreText = String(score).replace(".", ",")
  // The name gets at most ~120° of the bottom arc: long names get smaller,
  // and very long ones are cut so the type never gets too small to read
  const label = shortName(name)
  const nameOpts = { face: "wide" as const, tracking: 0.24 }
  const room = 172 * ((120 * Math.PI) / 180)
  const nameSize = Math.min(
    15,
    (15 * room) / type.width(label.toUpperCase(), { ...nameOpts, size: 15 })
  )
  // "7 lunas" set as one centred line, the number big and the word small
  const big = { face: "serif" as const, size: 96 }
  const small = { face: "serif" as const, size: 34 }
  const gap = 10
  const w1 = type.width(scoreText, big)
  const w2 = type.width("lunas", small)
  const x0 = C - (w1 + gap + w2) / 2
  const moonY = 138
  const moonR = 44

  return `<defs><radialGradient id="${id}-glow"><stop offset="0" stop-color="${t.lit}" stop-opacity="${theme === "noche" ? 0.26 : 0.4}"/><stop offset="1" stop-color="${t.lit}" stop-opacity="0"/></radialGradient></defs>
  <circle cx="${C}" cy="${C}" r="199" fill="${t.bg}"/>
  <circle cx="${C}" cy="${C}" r="189" fill="none" stroke="${t.accent}" stroke-width="1.6"/>
  <circle cx="${C}" cy="${C}" r="183" fill="none" stroke="${t.accent}" stroke-width="0.6" stroke-opacity="0.7"/>
  <circle cx="${C}" cy="${C}" r="146" fill="none" stroke="${t.accent}" stroke-width="0.6" stroke-opacity="0.45"/>
  ${type.arc("ALBERTO DE LUNA", C, C, 160, "top", { face: "wide", size: 16, tracking: 0.36, fill: t.text })}
  ${type.arc(label.toUpperCase(), C, C, 172, "bottom", { ...nameOpts, size: nameSize, fill: t.text })}
  ${sparkle(C - 166, C, 5.5, t.accent)}
  ${sparkle(C + 166, C, 5.5, t.accent)}
  <circle cx="${C}" cy="${moonY}" r="${moonR * 2}" fill="url(#${id}-glow)"/>
  ${STARS.map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${t.text}" fill-opacity="${o}"/>`).join("")}
  <g transform="translate(${C} ${moonY})">
    <circle r="${moonR}" fill="${t.base}"/>
    <path d="${moonPath(score / 10, moonR)}" fill="${t.lit}"/>
  </g>
  ${type.line(scoreText, x0, 270, { ...big, fill: t.text })}
  ${type.line("lunas", x0 + w1 + gap, 270, { ...small, fill: t.accent })}
  <line x1="${C - 14}" y1="290" x2="${C + 14}" y2="290" stroke="${t.accent}" stroke-opacity="0.7"/>
  ${type.line(HANDLE, C, 314, { face: "text", size: 12, tracking: 0.04, anchor: "middle", fill: t.text })}`
}

/**
 * A round stamp a restaurant can hang on its door or website, in the manner
 * of the guides' plaques: one mark (the moon at the phase of its score), who
 * recommends it, the score and the restaurant's name. The text is outlined
 * so it looks right as an <img> anywhere.
 */
export function sealSvg({
  name,
  score,
  theme = "noche",
}: {
  name: string
  score: number
  year?: number | null
  theme?: SealTheme
}) {
  const type = new Type(`s${theme[0]}`)
  const body = sealBody(type, `s${theme[0]}`, { name, score, theme })
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escape(`${name}: ${String(score).replace(".", ",")} lunas de Alberto de Luna (${HANDLE})`)}">
  <defs>${type.defsSvg}</defs>
  ${body}
</svg>`
}

/** QR as one SVG path of unit squares, `size` wide, with no quiet zone */
function qrPath(url: string, size: number) {
  const qr = qrcode(0, "M")
  qr.addData(url)
  qr.make()
  const n = qr.getModuleCount()
  const u = size / n
  // one rectangle per run of dark modules in a row keeps the path short
  const f = (v: number) => +v.toFixed(2)
  let d = ""
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c)) continue
      let end = c
      while (end + 1 < n && qr.isDark(r, end + 1)) end++
      d += `M${f(c * u)} ${f(r * u)}h${f((end - c + 1) * u)}v${f(u)}H${f(c * u)}z`
      c = end
    }
  return d
}

/**
 * The printable version for a door or a menu: the seal on top, and a QR to
 * the review with Alberto's handle underneath. A6 proportions.
 */
export function signSvg({
  name,
  score,
  url,
  theme = "noche",
}: {
  name: string
  score: number
  year?: number | null
  url: string
  theme?: SealTheme
}) {
  const t = THEMES[theme]
  const type = new Type(`c${theme[0]}`)
  const body = sealBody(type, `c${theme[0]}`, { name, score, theme })
  // The QR is always dark on light, which every phone reads
  const qrBg = theme === "noche" ? t.text : "#ffffff"
  const q = 132
  const qx = 92
  const qy = 586
  const tx = qx + q + 24 + 26
  const lines = [
    type.line("ESCANEA", tx, qy + 30, {
      face: "wide",
      size: 11,
      tracking: 0.32,
      fill: t.accent,
    }),
    type.line("y lee la reseña", tx, qy + 72, {
      face: "serif",
      size: 36,
      fill: t.text,
    }),
    type.line(HANDLE, tx, qy + 112, {
      face: "text",
      size: 15,
      tracking: 0.02,
      fill: t.text,
    }),
    type.line("DIMEUNRESTAURANTE.COM", tx, qy + 138, {
      face: "wide",
      size: 8.5,
      tracking: 0.3,
      fill: t.text,
    }),
  ].join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 850" width="600" height="850" role="img" aria-label="${escape(`${name}: ${String(score).replace(".", ",")} lunas de Alberto de Luna (${HANDLE}). Escanea para leer la reseña.`)}">
  <defs>${"__DEFS__"}</defs>
  <rect width="600" height="850" fill="${t.bg}"/>
  <rect x="22" y="22" width="556" height="806" fill="none" stroke="${t.accent}" stroke-width="1.2"/>
  <rect x="28" y="28" width="544" height="794" fill="none" stroke="${t.accent}" stroke-width="0.5" stroke-opacity="0.6"/>
  <svg x="92" y="70" width="416" height="416" viewBox="0 0 400 400">${body}</svg>
  <line x1="92" y1="${qy - 34}" x2="508" y2="${qy - 34}" stroke="${t.accent}" stroke-opacity="0.45"/>
  <rect x="${qx}" y="${qy}" width="${q + 24}" height="${q + 24}" rx="8" fill="${qrBg}"/>
  <path transform="translate(${qx + 12} ${qy + 12})" d="${qrPath(url, q)}" fill="#0a0a0a"/>
  ${lines}
  ${sparkle(300, 790, 5, t.accent)}
</svg>`.replace("__DEFS__", type.defsSvg)
}
