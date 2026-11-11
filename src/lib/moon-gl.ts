/**
 * The real moon in a tiny WebGL shader: NASA's LRO albedo and elevation maps
 * (public domain, Scientific Visualization Studio, CGI Moon Kit) wrapped on a
 * sphere, lit by a light that swings from behind it (new moon) to the viewer
 * (full moon). The relief shows along the terminator, the moon sways slowly
 * (libration) so it reads as a body in space, and the surface is tinted with
 * the palette's moonlight. Returns null without WebGL; the SVG moon underneath
 * stays as the fallback until the textures are in.
 */

const VERT = `
attribute vec2 a;
varying vec2 uv;
void main() { uv = a; gl_Position = vec4(a, 0.0, 1.0); }
`

const FRAG = `
precision highp float;
varying vec2 uv;
uniform sampler2D albedo;
uniform sampler2D height;
uniform float phase;   // 0 new, 0.5 half, 1 full
uniform float scale;   // canvas half-size in moon radii
uniform float px;      // one pixel in moon radii
uniform vec2 sway;     // libration: yaw, pitch in radians
uniform vec3 lit;      // moonlight colour
uniform vec3 dark;     // the night around it
uniform vec3 halo;

const float PI = 3.14159265;

mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0, -s, 0, 1, 0, s, 0, c); }
mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1, 0, 0, 0, c, s, 0, -s, c); }

vec2 mapUv(vec3 b) {
  float lon = atan(b.x, b.z);
  float lat = asin(clamp(b.y, -1.0, 1.0));
  return vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);
}

void main() {
  vec2 p = uv * scale;
  float r = length(p);
  float disc = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);

  // View space: x right, y up, z towards the viewer
  vec3 n = vec3(p, sqrt(max(0.0, 1.0 - r * r)));
  float a = PI * phase;
  vec3 L = vec3(sin(a), 0.0, -cos(a));

  // Into the moon's own frame, which sways a little
  mat3 R = rotX(sway.y) * rotY(sway.x);
  vec3 b = R * n;
  vec3 Lb = R * L;
  vec2 t = mapUv(b);

  // Relief from the elevation map: tilt the normal along its slopes
  float lon = atan(b.x, b.z);
  float lat = asin(clamp(b.y, -1.0, 1.0));
  vec3 east = vec3(cos(lon), 0.0, -sin(lon));
  vec3 north = vec3(-sin(lon) * sin(lat), cos(lat), -cos(lon) * sin(lat));
  vec2 e = vec2(1.0 / 1024.0, 1.0 / 512.0);
  float hx = texture2D(height, t + vec2(e.x, 0.0)).r - texture2D(height, t - vec2(e.x, 0.0)).r;
  float hy = texture2D(height, t - vec2(0.0, e.y)).r - texture2D(height, t + vec2(0.0, e.y)).r;
  // Relief shows along the terminator; under a full moon it all but vanishes
  float relief = 9.0 * (1.0 - 0.8 * phase * phase);
  vec3 bn = normalize(b - relief * (hx * east + hy * north));

  // Lommel-Seeliger: the moon is almost flat at full, as it really looks
  float mu0 = dot(bn, Lb);
  float mu = max(n.z, 0.02);
  float ls = 2.0 * max(mu0, 0.0) / (max(mu0, 0.0) + mu);
  float day = smoothstep(-0.03, 0.05, dot(b, Lb)); // soft terminator
  float g = texture2D(albedo, t).r;
  float tone = mix(1.0, pow(g / 0.6, 1.1), 0.85);                  // seas darker, highlands bright
  vec3 surface = lit * clamp(tone, 0.0, 1.06) * mix(0.55, 1.0, clamp(ls, 0.0, 1.0)) * day;

  // Earthshine: the dark side just shows
  vec3 night = mix(dark, lit, 0.035) * (0.6 + 0.5 * tone) * (1.0 - day);
  vec3 moon = surface + night;

  // Halo grows with the lit part and fades to nothing well inside the canvas
  float out_ = max(0.0, r - 1.0);
  float glow = (0.04 + 0.18 * phase * phase)
    * pow(max(0.0, 1.0 - out_ / (scale - 1.05)), 3.0) * (1.0 - disc);

  gl_FragColor = vec4(moon * disc + halo * glow, disc + glow);
}
`

export interface MoonGL {
  render(phase: number): void
}

const mounted = new WeakMap<HTMLCanvasElement, MoonGL | null>()

/** The canvas's renderer, created on first use */
export function moonGL(canvas: HTMLCanvasElement): MoonGL | null {
  if (mounted.has(canvas)) return mounted.get(canvas)!
  const instance = mount(canvas)
  mounted.set(canvas, instance)
  return instance
}

function rgb(value: string): [number, number, number] {
  const hex = value.trim().replace("#", "")
  const full = hex.length === 3 ? hex.replace(/./g, (c) => c + c) : hex
  const n = parseInt(full.slice(0, 6), 16)
  if (Number.isNaN(n)) return [1, 1, 1]
  return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function mount(canvas: HTMLCanvasElement): MoonGL | null {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    antialias: false,
    alpha: true,
  })
  if (!gl) return null

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null
  }
  const vs = shader(gl.VERTEX_SHADER, VERT)
  const fs = shader(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return null
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  )
  const loc = gl.getAttribLocation(prog, "a")
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const u = (name: string) => gl.getUniformLocation(prog, name)
  const uPhase = u("phase")
  const uScale = u("scale")
  const uPx = u("px")
  const uSway = u("sway")
  const uLit = u("lit")
  const uDark = u("dark")
  const uHalo = u("halo")

  // The canvas is wider than the moon to leave room for the halo
  const scale = Number(canvas.dataset.scale) || 1.7
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches

  const readColours = () => {
    const css = getComputedStyle(document.documentElement)
    gl.uniform3fv(uLit, rgb(css.getPropertyValue("--moon")))
    gl.uniform3fv(uDark, rgb(css.getPropertyValue("--ink")))
    gl.uniform3fv(uHalo, rgb(css.getPropertyValue("--moon")))
  }

  let ready = false
  let phase = 1
  let time = 0
  const draw = () => {
    if (!ready) return
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform1f(uPhase, phase)
    gl.uniform1f(uScale, scale)
    gl.uniform1f(uPx, (2 * scale) / canvas.width)
    // A slow sway, like libration seen in a time-lapse
    gl.uniform2f(
      uSway,
      0.16 * Math.sin(time * 0.21) + 0.05 * Math.sin(time * 0.53),
      0.07 * Math.sin(time * 0.17 + 1.3)
    )
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const size = Math.round(canvas.clientWidth * dpr)
    if (size > 0 && size !== canvas.width) {
      canvas.width = canvas.height = size
      draw()
    }
  }

  const texture = (unit: number, img: HTMLImageElement, name: string) => {
    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      gl.LINEAR_MIPMAP_LINEAR
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.uniform1i(u(name), unit)
  }

  // Only animate while the moon is on screen
  let visible = false
  let frame = 0
  let start = 0
  const loop = (now: number) => {
    if (!start) start = now - time * 1000
    time = (now - start) / 1000
    draw()
    frame = visible ? requestAnimationFrame(loop) : 0
  }
  const play = () => {
    if (still || frame || !ready) return
    start = 0
    frame = requestAnimationFrame(loop)
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting
    if (visible) play()
  }).observe(canvas)

  Promise.all([
    loadImage("/textures/moon-albedo.webp"),
    loadImage("/textures/moon-height.webp"),
  ])
    .then(([a, h]) => {
      texture(0, a, "albedo")
      texture(1, h, "height")
      readColours()
      ready = true
      // Swap the flat moon for this one, then size the canvas
      canvas.closest("[data-moon-gl-wrap]")?.classList.add("is-gl")
      resize()
      draw()
      play()
    })
    .catch(() => {
      /* the flat moon stays */
    })

  new ResizeObserver(resize).observe(canvas)
  // The palette switch changes the colours
  new MutationObserver(() => {
    readColours()
    draw()
  }).observe(document.documentElement, { attributeFilter: ["data-palette"] })

  return {
    render(next: number) {
      phase = Math.max(0, Math.min(1, next))
      draw()
    },
  }
}
