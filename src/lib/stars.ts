/**
 * Draws every [data-stars] sky (see components/stars.astro). The far and mid
 * layers are drawn once per size; the near layer is redrawn each frame while
 * the sky is on screen, for the twinkle and the odd shooting star. All three
 * drift with the scroll at different speeds.
 */

type Depth = "far" | "mid" | "near"

interface Star {
  x: number // 0–1 of the canvas
  y: number
  r: number // css px
  a: number // alpha
  c: string // "r,g,b"
  w: number // twinkle speed
  ph: number // twinkle phase
}

interface Shooting {
  x: number
  y: number
  dx: number
  dy: number
  start: number
  life: number
}

interface Sky {
  el: HTMLElement
  anchor: HTMLElement
  layers: Record<Depth, HTMLCanvasElement>
  near: Star[]
  visible: boolean
  width: number
  height: number
  shooting: Shooting | null
  nextShot: number
}

// How far each layer drifts per pixel scrolled, and how far it may go
const DRIFT: Record<Depth, number> = { far: 0.012, mid: 0.026, near: 0.045 }
const MARGIN = 0.12 // the canvases are this much taller above and below

const still = matchMedia("(prefers-reduced-motion: reduce)").matches
const skies: Sky[] = []
let frame = 0

function random(seed: number) {
  let s = seed % 2147483647 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Star colours, by temperature: a few blue-white, most warm white, some amber
function colour(rand: () => number) {
  const t = rand()
  if (t < 0.16) return "205,220,255"
  if (t < 0.78) return "255,247,232"
  return "255,222,184"
}

function gaussian(rand: () => number) {
  return (
    Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand())
  )
}

function makeStars(seed: number, density: number, w: number, h: number) {
  const rand = random(seed * 7919 + 13)
  const area = w * h
  // A band of denser sky crossing diagonally, like the Milky Way
  const tilt = -0.35 - rand() * 0.4
  const cross = 0.35 + rand() * 0.3
  const band = (u: number) => cross + tilt * (u - 0.5)

  const layer = (n: number, place: (s: Star) => Star) =>
    Array.from({ length: Math.round(n * density) }, () => {
      const m = Math.pow(rand(), 2.6) // most stars are faint
      return place({
        x: rand(),
        y: rand(),
        r: m,
        a: m,
        c: colour(rand),
        w: 0.5 + rand() * 1.6,
        ph: rand() * Math.PI * 2,
      })
    })

  const far = layer(area / 1500, (s) => {
    // Half the dust gathers in the band
    if (rand() < 0.5) s.y = band(s.x) + gaussian(rand) * 0.07
    return { ...s, r: 0.3 + s.r * 0.5, a: 0.12 + s.a * 0.4 }
  })
  const mid = layer(area / 9000, (s) => ({
    ...s,
    r: 0.55 + s.r * 0.7,
    a: 0.3 + s.a * 0.55,
  }))
  const near = layer(area / 50000, (s) => ({
    ...s,
    r: 0.9 + s.r * 1.1,
    a: 0.65 + s.a * 0.35,
  }))
  return { far, mid, near, band }
}

function fit(canvas: HTMLCanvasElement) {
  const dpr = Math.min(devicePixelRatio || 1, 2)
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  const ctx = canvas.getContext("2d")!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return { ctx, w, h }
}

function dot(
  ctx: CanvasRenderingContext2D,
  s: Star,
  w: number,
  h: number,
  a: number
) {
  ctx.fillStyle = `rgba(${s.c},${a})`
  ctx.beginPath()
  ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2)
  ctx.fill()
}

function glow(
  ctx: CanvasRenderingContext2D,
  s: Star,
  w: number,
  h: number,
  a: number
) {
  const x = s.x * w
  const y = s.y * h
  const R = s.r * 7
  const g = ctx.createRadialGradient(x, y, 0, x, y, R)
  g.addColorStop(0, `rgba(${s.c},${0.22 * a})`)
  g.addColorStop(1, `rgba(${s.c},0)`)
  ctx.fillStyle = g
  ctx.fillRect(x - R, y - R, R * 2, R * 2)
  dot(ctx, s, w, h, a)
}

function paint(sky: Sky) {
  const seed = Number(sky.el.dataset.seed) || 7
  const density = Number(sky.el.dataset.density) || 1
  const far = fit(sky.layers.far)
  const mid = fit(sky.layers.mid)
  fit(sky.layers.near)
  sky.width = far.w
  sky.height = far.h
  const stars = makeStars(seed, density, far.w, far.h)

  // The band's faint light first, as a few very soft clouds
  const rand = random(seed * 31 + 5)
  for (let i = 0; i < 7; i++) {
    const u = rand()
    const x = u * far.w
    const y = stars.band(u) * far.h
    const R = (0.12 + rand() * 0.16) * Math.max(far.w, far.h)
    const g = far.ctx.createRadialGradient(x, y, 0, x, y, R)
    g.addColorStop(0, `rgba(235,225,205,${0.018 + rand() * 0.018})`)
    g.addColorStop(1, "rgba(235,225,205,0)")
    far.ctx.fillStyle = g
    far.ctx.fillRect(x - R, y - R, R * 2, R * 2)
  }
  stars.far.forEach((s) => dot(far.ctx, s, far.w, far.h, s.a))
  stars.mid.forEach((s) => dot(mid.ctx, s, mid.w, mid.h, s.a))
  sky.near = stars.near
  drawNear(sky, performance.now())
}

function drawNear(sky: Sky, now: number) {
  const canvas = sky.layers.near
  const ctx = canvas.getContext("2d")!
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  ctx.clearRect(0, 0, w, h)
  const t = now / 1000
  sky.near.forEach((s) => {
    // Gentle scintillation, never off
    const k = still ? 1 : 0.72 + 0.28 * Math.sin(t * s.w + s.ph)
    glow(ctx, s, w, h, s.a * k)
  })

  if (still) return
  // Now and then a shooting star crosses the upper sky
  if (!sky.shooting && now > sky.nextShot) {
    const right = Math.random() < 0.5
    sky.shooting = {
      x: (0.15 + Math.random() * 0.7) * w,
      y: (0.15 + Math.random() * 0.3) * h,
      dx: (right ? 1 : -1) * (0.5 + Math.random() * 0.3),
      dy: 0.32 + Math.random() * 0.2,
      start: now,
      life: 700 + Math.random() * 400,
    }
  }
  const sh = sky.shooting
  if (sh) {
    const p = (now - sh.start) / sh.life
    if (p >= 1) {
      sky.shooting = null
      sky.nextShot = now + 9000 + Math.random() * 12000
      return
    }
    const travel = Math.min(w, h) * 0.45
    const len = 140 * Math.sin(Math.PI * p) + 10
    const hx = sh.x + sh.dx * travel * p
    const hy = sh.y + sh.dy * travel * p
    const tx = hx - sh.dx * len
    const ty = hy - sh.dy * len
    const a = Math.sin(Math.PI * p) * 0.75
    const g = ctx.createLinearGradient(hx, hy, tx, ty)
    g.addColorStop(0, `rgba(255,248,235,${a})`)
    g.addColorStop(1, "rgba(255,248,235,0)")
    ctx.strokeStyle = g
    ctx.lineWidth = 1.2
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(hx, hy)
    ctx.lineTo(tx, ty)
    ctx.stroke()
  }
}

function drift(sky: Sky) {
  const top = sky.anchor.getBoundingClientRect().top
  const limit = sky.height * MARGIN * 0.9
  ;(Object.keys(DRIFT) as Depth[]).forEach((d) => {
    const y = Math.max(-limit, Math.min(limit, top * DRIFT[d]))
    sky.layers[d].style.transform = `translate3d(0,${y.toFixed(1)}px,0)`
  })
}

function tick(now: number) {
  let any = false
  skies.forEach((sky) => {
    if (!sky.visible) return
    any = true
    drift(sky)
    drawNear(sky, now)
  })
  frame = any ? requestAnimationFrame(tick) : 0
}

function wake() {
  if (!still && !frame) frame = requestAnimationFrame(tick)
}

export function initStars() {
  document.querySelectorAll<HTMLElement>("[data-stars]").forEach((el) => {
    if (el.dataset.ready) return
    el.dataset.ready = "1"
    const get = (d: Depth) =>
      el.querySelector<HTMLCanvasElement>(`canvas[data-depth="${d}"]`)!
    const sky: Sky = {
      el,
      anchor: el.closest<HTMLElement>("section") ?? el.parentElement ?? el,
      layers: { far: get("far"), mid: get("mid"), near: get("near") },
      near: [],
      visible: false,
      width: 0,
      height: 0,
      shooting: null,
      nextShot: performance.now() + 4000 + Math.random() * 8000,
    }
    skies.push(sky)
    let size = ""
    new ResizeObserver(() => {
      const next = `${el.clientWidth}x${el.clientHeight}`
      if (next === size || !el.clientWidth) return
      size = next
      paint(sky)
      drift(sky)
    }).observe(el)
    new IntersectionObserver(([entry]) => {
      sky.visible = entry.isIntersecting
      if (sky.visible) wake()
    }).observe(el)
  })
}
