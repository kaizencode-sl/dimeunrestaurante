import { moonPath } from "@/lib/moon"

/** Restaurants get a seal from this score up */
export const SEAL_MIN = 7

export type SealTheme = "noche" | "claro"

const THEMES: Record<
  SealTheme,
  { bg: string; accent: string; text: string; lit: string; base: string }
> = {
  noche: {
    bg: "#0a0a0a",
    accent: "#f2b33d",
    text: "#ece7db",
    lit: "#f7ecd0",
    base: "#2a2826",
  },
  claro: {
    bg: "#ece7db",
    accent: "#8f5a06",
    text: "#0a0a0a",
    lit: "#e2a530",
    base: "#d6cebb",
  },
}

const FONT = "'Archivo Variable', Archivo, 'Helvetica Neue', Arial, sans-serif"

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  )

export const sealUrl = (id: string, theme: SealTheme = "noche") =>
  `/sello/${theme === "claro" ? `${id}-claro` : id}.svg`

/**
 * A round stamp a restaurant can hang on its door or website: the moon at the
 * phase of its score, the score, and its name around the bottom edge. Plain
 * SVG with system-font fallbacks, so it looks right as an <img> anywhere.
 */
export function sealSvg({
  name,
  score,
  year,
  theme = "noche",
}: {
  name: string
  score: number
  year?: number | null
  theme?: SealTheme
}) {
  const t = THEMES[theme]
  const label = name.length > 32 ? `${name.slice(0, 31).trimEnd()}…` : name
  // The name runs along ~70% of the bottom arc; long names get smaller type
  const nameSize = Math.min(21, 360 / (label.length * 0.78)).toFixed(1)
  const scoreText = String(score).replace(".", ",")
  const footer = year ? `LUNAS · ${year}` : "LUNAS"

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escape(`${name}: ${scoreText} lunas en Dime un restaurante`)}">
  <defs>
    <path id="top" d="M50,200 A150,150 0 0,1 350,200" />
    <path id="bottom" d="M30,200 A170,170 0 0,0 370,200" />
  </defs>
  <circle cx="200" cy="200" r="198" fill="${t.bg}" />
  <circle cx="200" cy="200" r="186" fill="none" stroke="${t.accent}" stroke-width="2.5" />
  <circle cx="200" cy="200" r="134" fill="none" stroke="${t.accent}" stroke-width="1" stroke-opacity="0.55" />
  <g font-family="${FONT}" font-weight="800" fill="${t.text}" text-anchor="middle">
    <text font-size="21" letter-spacing="4.5"><textPath href="#top" startOffset="50%">DIME UN RESTAURANTE</textPath></text>
    <text font-size="${nameSize}" letter-spacing="2.5"><textPath href="#bottom" startOffset="50%">${escape(label.toUpperCase())}</textPath></text>
  </g>
  <circle cx="40" cy="200" r="4.5" fill="${t.accent}" />
  <circle cx="360" cy="200" r="4.5" fill="${t.accent}" />
  <g transform="translate(200 162)">
    <circle r="48" fill="${t.base}" />
    <path d="${moonPath(score / 10, 48)}" fill="${t.lit}" />
  </g>
  <g font-family="${FONT}" text-anchor="middle" fill="${t.text}">
    <text x="200" y="272" font-size="66" font-weight="900" letter-spacing="-2">${scoreText}</text>
    <text x="200" y="298" font-size="13" font-weight="800" letter-spacing="3.5" fill="${t.accent}">${footer}</text>
  </g>
</svg>`
}
