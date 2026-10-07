// /utils/zuzuShowdown/recolour.ts
//
// P2's alternate colours, made in the browser (conductor zuzu-showdown t-027). The pixel style ships a
// P2 atlas; the HD style ships only the rules (its frame map's `p2_rules`, the rig's P2_RULES) and
// recolours its own atlas when a mirror match needs it, which halves what HD costs to download. The
// rule is the one conductor tools/rig.py p2_recolour applies: every visible pixel whose hue,
// saturation and value fall inside a rule is hue-rotated and optionally re-saturated, its value kept.

/** One recolour rule: hues in [lo, hi] degrees, above the floors, below the ceiling. */
export type P2Rule = {
  hue: [number, number]
  sat_min?: number
  val_min?: number
  val_max?: number
  /** Degrees to rotate the hue by. */
  shift?: number
  /** Saturation multiplier. */
  sat?: number
}

function hsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return [h, max === 0 ? 0 : d / max, max / 255]
}

function rgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x]
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

/** Recolour RGBA pixels in place (an ImageData's `data`). */
export function recolourPixels(data: Uint8ClampedArray, rules: P2Rule[]): void {
  if (!rules.length) return
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    const [h, s, v] = hsv(data[i]!, data[i + 1]!, data[i + 2]!)
    // Every rule tests the original colour; where two match, the later wins (as in rig.py).
    const rule = rules.findLast(
      (r) =>
        h >= r.hue[0] &&
        h <= r.hue[1] &&
        s >= (r.sat_min ?? 0) &&
        v >= (r.val_min ?? 0) &&
        v <= (r.val_max ?? 1),
    )
    if (!rule) continue
    const hue = (((h + (rule.shift ?? 0)) % 360) + 360) % 360
    const sat = Math.min(1, Math.max(0, s * (rule.sat ?? 1)))
    const [r, g, b] = rgb(hue, sat, v)
    data[i] = r
    data[i + 1] = g
    data[i + 2] = b
  }
}
