// /utils/arcade/pinball/rules/leds.ts
//
// The addressable LED rail (conductor zuzu-pinball/t-012): a strip of LEDs
// round the inside of the cabinet, each set to one colour per frame. A
// table's ruleset says what the strip shows (a pure function of its state
// and the physics step), so the shows are tested without WebGL. These are
// the shared helpers, and the attract show the strip runs in a demo.
//
// Restraint is part of the grammar: nothing here flashes faster than three
// times a second, and with reduced motion (`still`) the strip never flashes
// or chases at all, only holds or slowly changes its colours.

import { PHYSICS_HZ } from '../clock'

/** One colour per LED, 0xRRGGBB; 0 is off. */
export type LedFrame = number[]

/** The fastest any flash on the strip may repeat, in hertz. */
export const MAX_FLASH_HZ = 3

/** A colour at `level` (0..1) of its full brightness. */
export function dim(color: number, level: number): number {
  const k = Math.max(0, Math.min(1, level))
  const r = Math.round(((color >> 16) & 0xff) * k)
  const g = Math.round(((color >> 8) & 0xff) * k)
  const b = Math.round((color & 0xff) * k)
  return (r << 16) | (g << 8) | b
}

/** The brighter of two colours, channel by channel (overlays add light). */
export function lighten(a: number, b: number): number {
  const r = Math.max((a >> 16) & 0xff, (b >> 16) & 0xff)
  const g = Math.max((a >> 8) & 0xff, (b >> 8) & 0xff)
  const bl = Math.max(a & 0xff, b & 0xff)
  return (r << 16) | (g << 8) | bl
}

/** A colour's brightness, 0..1 (its strongest channel). */
export function brightness(color: number): number {
  return Math.max((color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff) / 255
}

/**
 * A chase: how lit LED `i` of `n` is while a comet of `length` LEDs runs
 * round the strip at `lapsPerSecond`, at physics step `step`.
 */
export function chase(
  i: number,
  n: number,
  step: number,
  lapsPerSecond: number,
  length: number,
): number {
  const head = ((step / PHYSICS_HZ) * lapsPerSecond * n) % n
  const behind = (head - i + n) % n
  return behind < length ? 1 - behind / length : 0
}

/** A slow swell between `low` and 1, `period` seconds round. */
export function swell(step: number, period: number, low = 0.4): number {
  const phase = (step / PHYSICS_HZ / period) * Math.PI * 2
  return low + (1 - low) * (0.5 + 0.5 * Math.sin(phase))
}

/** On for the first part of each beat at `hz` (at most MAX_FLASH_HZ). */
export function flash(step: number, hz: number, duty = 0.35): boolean {
  const rate = Math.min(hz, MAX_FLASH_HZ)
  const t = (step / PHYSICS_HZ) * rate
  return t - Math.floor(t) < duty
}

/** The demo's attract show: a slow rainbow drifting round the strip. */
export function attractLeds(
  count: number,
  step: number,
  still: boolean,
): LedFrame {
  const drift = still ? 0 : step / PHYSICS_HZ / 8
  return Array.from({ length: count }, (_, i) =>
    hue((i / count + drift) % 1, 0.55),
  )
}

/** A fully saturated colour at hue `h` (0..1), at `level` brightness. */
export function hue(h: number, level = 1): number {
  const k = (n: number) => (n + h * 6) % 6
  const f = (n: number) =>
    Math.round(255 * level * (1 - Math.max(0, Math.min(k(n), 4 - k(n), 1))))
  return (f(5) << 16) | (f(3) << 8) | f(1)
}

/** Whether the viewer asked for reduced motion (false outside a browser). */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Where along a rail polyline (0..1 of its length) the point nearest
 * (x, z) lies: which LEDs sit beside a toy, for cues local to it.
 */
export function railFraction(
  points: ReadonlyArray<readonly [number, number]>,
  x: number,
  z: number,
): number {
  const lengths = points
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]))
  const total = lengths.reduce((a, b) => a + b, 0)
  let best = Number.POSITIVE_INFINITY
  let bestAt = 0
  let walked = 0
  for (let i = 1; i < points.length; i++) {
    const [ax, az] = points[i - 1]!
    const [bx, bz] = points[i]!
    const len = lengths[i - 1]!
    const t =
      len > 0
        ? Math.max(
            0,
            Math.min(
              1,
              ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / len ** 2,
            ),
          )
        : 0
    const d = Math.hypot(x - (ax + (bx - ax) * t), z - (az + (bz - az) * t))
    if (d < best) {
      best = d
      bestAt = walked + len * t
    }
    walked += len
  }
  return total > 0 ? bestAt / total : 0
}
