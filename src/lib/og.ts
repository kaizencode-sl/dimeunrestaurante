import { Resvg } from "@resvg/resvg-js"
import { moonPath } from "@/lib/moon"
import { Type } from "@/lib/seal-type"

/**
 * Share cards (1200×630 PNG) for pages with no photo of their own: the
 * moon at the phase of the score, the restaurant and its lunas, in the
 * site's type. Rendered at build time.
 */

const W = 1200
const H = 630
const C = {
  bg: "#0a0a0a",
  text: "#ece7db",
  accent: "#f2b33d",
  lit: "#f7ecd0",
  base: "#3a3632",
}

// Fixed stars, kept to the moon's side of the card
const STARS: [number, number, number, number][] = [
  [700, 90, 1.6, 0.8],
  [760, 520, 1.2, 0.6],
  [1110, 110, 1.4, 0.7],
  [1140, 470, 1.8, 0.9],
  [690, 330, 1, 0.5],
  [1060, 560, 1, 0.5],
  [830, 60, 1, 0.45],
  [1170, 300, 1.1, 0.55],
]

const png = (svg: string) =>
  new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng()

/** Lines of at most `max` px, breaking between words */
function wrap(
  type: Type,
  text: string,
  opts: Parameters<Type["width"]>[1],
  max: number
) {
  const lines: string[] = []
  let line = ""
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word
    if (line && type.width(next, opts) > max) {
      lines.push(line)
      line = word
    } else line = next
  }
  if (line) lines.push(line)
  return lines
}

function card(body: (type: Type) => string, phase: number) {
  const type = new Type("og")
  const content = body(type)
  const mx = 930
  const my = 315
  const r = 168
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <radialGradient id="glow"><stop offset="0" stop-color="${C.lit}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.lit}" stop-opacity="0"/></radialGradient>
    ${type.defsSvg}
  </defs>
  <rect width="${W}" height="${H}" fill="${C.bg}"/>
  <circle cx="${mx}" cy="${my}" r="${r * 1.9}" fill="url(#glow)"/>
  ${STARS.map(([x, y, s, o]) => `<circle cx="${x}" cy="${y}" r="${s}" fill="${C.text}" fill-opacity="${o}"/>`).join("")}
  <circle cx="${mx}" cy="${my}" r="${r}" fill="${C.base}"/>
  <path transform="translate(${mx} ${my})" d="${moonPath(phase, r)}" fill="${C.lit}"/>
  ${content}
</svg>`
}

/** The card for a review that has no photo */
export function reviewCard({
  name,
  city,
  score,
}: {
  name: string
  city: string
  score: number | null
}) {
  return png(
    card(
      (type) => {
        const x = 80
        const nameOpts = { face: "wide" as const, size: 64, tracking: -0.01 }
        const lines = wrap(type, name.toUpperCase(), nameOpts, 560).slice(0, 3)
        const size = lines.length > 2 ? 52 : 64
        const top = 300 - ((lines.length - 1) * size * 0.95) / 2
        const scoreText =
          score === null ? null : String(score).replace(".", ",")
        const big = { face: "serif" as const, size: 92 }
        return [
          type.line("ALBERTO DE LUNA", x, 96, {
            face: "wide",
            size: 16,
            tracking: 0.3,
            fill: C.accent,
          }),
          ...lines.map((l, i) =>
            type.line(l, x, top + i * size * 0.95, {
              ...nameOpts,
              size,
              fill: C.text,
            })
          ),
          scoreText
            ? type.line(scoreText, x, 470, { ...big, fill: C.text }) +
              type.line("lunas", x + type.width(scoreText, big) + 14, 470, {
                face: "serif",
                size: 40,
                fill: C.accent,
              })
            : type.line("Sin puntuar", x, 470, {
                face: "serif",
                size: 52,
                fill: C.text,
              }),
          type.line(`${city.toUpperCase()}  ·  DIMEUNRESTAURANTE.COM`, x, 548, {
            face: "text",
            size: 15,
            tracking: 0.16,
            fill: C.text,
          }),
        ].join("")
      },
      (score ?? 0) / 10
    )
  )
}

/** The card for the site itself and pages with no image of their own */
export function siteCard(count: number) {
  return png(
    card((type) => {
      const x = 80
      const title = { face: "wide" as const, size: 64, tracking: -0.01 }
      return [
        type.line("ALBERTO DE LUNA", x, 96, {
          face: "wide",
          size: 16,
          tracking: 0.3,
          fill: C.accent,
        }),
        type.line("DIME UN", x, 270, { ...title, fill: C.text }),
        type.line("RESTAURANTE", x, 334, { ...title, fill: C.text }),
        type.line(`${count} restaurantes puntuados en lunas`, x, 420, {
          face: "serif",
          size: 40,
          fill: C.accent,
        }),
        type.line("@ALBERTO_DELUNA  ·  DIMEUNRESTAURANTE.COM", x, 548, {
          face: "text",
          size: 15,
          tracking: 0.16,
          fill: C.text,
        }),
      ].join("")
    }, 0.75)
  )
}

/** The iPhone home-screen icon, from the favicon's moon */
export function touchIcon() {
  const r = 58
  return new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180"><rect width="180" height="180" fill="${C.bg}"/><circle cx="90" cy="90" r="${r}" fill="${C.base}"/><path transform="translate(90 90)" d="${moonPath(0.72, r)}" fill="${C.accent}"/></svg>`
  )
    .render()
    .asPng()
}
