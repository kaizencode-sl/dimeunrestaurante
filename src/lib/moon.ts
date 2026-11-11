/**
 * SVG path of the lit part of a moon of radius r centred on 0,0.
 * phase 0 is a new moon, 0.5 a half moon and 1 a full moon; the lit side is
 * on the right, as a waxing moon.
 */
export function moonPath(phase: number, r = 100): string {
  const p = Math.max(0, Math.min(1, phase))
  if (p <= 0.001) return ""
  if (p >= 0.999)
    return `M0,${-r} A${r},${r} 0 1,1 0,${r} A${r},${r} 0 1,1 0,${-r}Z`
  // The terminator is a half ellipse whose width shrinks to 0 at half moon
  const rx = Math.abs(1 - 2 * p) * r
  return `M0,${-r} A${r},${r} 0 0,1 0,${r} A${rx},${r} 0 0,${p > 0.5 ? 1 : 0} 0,${-r}Z`
}
