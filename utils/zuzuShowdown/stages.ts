// /utils/zuzuShowdown/stages.ts
//
// Zuzu Showdown stages (conductor zuzu-showdown t-009). Each stage is a stack of parallax layers made by
// conductor's tools/stage.py from house-lane art (a backdrop, a midground keyed out of a white background,
// a procedural floor), plus moving parts drawn here in hand pixel or code, and one stage event that
// reacts to the fight:
//
//   Hollow Bell (Zuzu's): smoke drifting off the street lantern, the bell swaying in the arch, tumbleweeds, a torn
//     banner in the wind. The bell rings once by itself at round start and once at the KO (canon).
//   The Watering Hole (the Coyote's, the croc's): heat shimmer, the water's glints, circling vultures. A
//     pair of croc eyes surfaces in the water during fights the croc isn't in.
//   The Mission (the Abbess's): the candle flickers and smoke leaves the chimney under the moon. Between
//     rounds a portal flickers in the empty bell arch.
//   Storm Canyon (Storm Crow's): sheets of rain and wheeling crows. Lightning lights the sky so the
//     canyon walls and the fighters stand in silhouette (never under reduced motion).
//   The Lone Apple Tree (the Siblings'): heat shimmer over the wasteland, red leaves drifting down, a
//     dust devil crossing the street. Apples drop from the tree, rest on the ground, and fade.
//   The Dunes (Old Komodo's): a long sun, sand blowing off the crests. Now and then the dune behind the
//     fighters heaves and something vast moves under it.
//   The Thin Place (the boss's): the sky tearing at its seams, debris floating up. Light shows at the
//     edge of the lone door, wider each round.
//
// This module is pure: which stage a match is on, where each layer sits for a camera, the stage-event
// state, and where every moving part is on a given frame. render.ts draws it; the stage component loads
// the images.

import type { FighterData, MatchState, SimEvent } from './types'

export type StageSlug =
  | 'hollow-bell'
  | 'watering-hole'
  | 'the-mission'
  | 'storm-canyon'
  | 'lone-apple-tree'
  | 'the-dunes'
  | 'the-thin-place'

/** A parallax layer in the stage manifest: its screen position (game px) with the camera centred. */
export type StageLayer = {
  name: string
  file: string
  /** How far the layer scrolls per pixel of camera: 0 never moves, 1 moves with the floor. */
  factor: number
  x: number
  y: number
  w: number
  h: number
}

/** A piece cut out of a layer to be animated (the bell, the banner), at its place in that layer. */
export type StageCutout = {
  name: string
  file: string
  layer: string
  x: number
  y: number
  w: number
  h: number
}

/** A point or area in a layer the moving parts hang off (the lantern's smoke, the water, the arch board). */
export type StageAnchor = {
  layer: string
  x: number
  y: number
  w?: number
  h?: number
}

/** A stage manifest (conductor tools/stage.py writes `<slug>-<style>.json`). */
export type StageManifest = {
  stage: StageSlug
  style: 'pixel' | 'hd'
  /** Image pixels per game pixel (pixel 1, HD 4). */
  scale: number
  layers: StageLayer[]
  cutouts: StageCutout[]
  anchors: Partial<Record<string, StageAnchor>>
}

export type LoadedStage = {
  manifest: StageManifest
  layers: Record<string, CanvasImageSource>
  cutouts: Record<string, CanvasImageSource>
}

export const STAGE_ROOT = '/zuzu-showdown-stages'

export const STAGE_NAMES: Record<StageSlug, string> = {
  'hollow-bell': 'Hollow Bell',
  'watering-hole': 'The Watering Hole',
  'the-mission': 'The Mission',
  'storm-canyon': 'Storm Canyon',
  'lone-apple-tree': 'The Lone Apple Tree',
  'the-dunes': 'The Dunes',
  'the-thin-place': 'The Thin Place',
}

/** Each fighter's home stage (DESIGN-BRIEF.md "Stages with moving backgrounds"). */
export const HOME_STAGES: Partial<Record<string, StageSlug>> = {
  zuzu: 'hollow-bell',
  'coyote-vagrant': 'watering-hole',
  'river-croc': 'watering-hole',
  'the-abbess': 'the-mission',
  'storm-crow': 'storm-canyon',
  'the-siblings': 'lone-apple-tree',
  'old-komodo': 'the-dunes',
  'thing-behind-the-door': 'the-thin-place',
}

/** The fighters whose presence keeps the croc's eyes out of the Watering Hole. */
const CROC = 'river-croc'

/** Street Fighter style, the fight is on the challenger's home ground (P2's, else P1's). */
export function stageFor(roster: [FighterData, FighterData]): StageSlug {
  return (
    HOME_STAGES[roster[1].slug] ?? HOME_STAGES[roster[0].slug] ?? 'hollow-bell'
  )
}

export function stageFile(slug: StageSlug, style: 'pixel' | 'hd'): string {
  return `${slug}-${style}.json`
}

/** A layer's screen x for a camera offset in game pixels (0 = centred). */
export function layerX(layer: StageLayer, cameraPx: number): number {
  return Math.round(layer.x - cameraPx * layer.factor)
}

// ---------------------------------------------------------------- the stage event

export type StageFx = {
  /** Frames since the bell last rang by itself, or null before it ever has. */
  bell: number | null
}

export const BELL_RING_FRAMES = 150

export function newStageFx(): StageFx {
  return { bell: null }
}

/** Age the stage event a frame; the bell rings at each round start and at the KO. */
export function advanceStageFx(fx: StageFx, events: SimEvent[]): StageFx {
  const rang = events.some((e) => e.type === 'roundStart' || e.type === 'ko')
  if (rang) return { bell: 0 }
  return { bell: fx.bell === null ? null : fx.bell + 1 }
}

/**
 * The bell's swing in degrees: a lazy sway in the wind, and a hard swing that dies away after it
 * rings by itself.
 */
export function bellAngle(
  frame: number,
  fx: StageFx,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0
  const breeze = Math.sin(frame / 50) * 2
  if (fx.bell === null || fx.bell >= BELL_RING_FRAMES) return breeze
  const t = fx.bell
  return breeze + 16 * Math.exp(-t / 45) * Math.sin(t / 7)
}

// ---------------------------------------------------------------- hand pixel

/** A hand-pixel sprite: rows of palette keys, '.' empty. */
export type PixelSprite = readonly string[]

export const TUMBLEWEED: readonly PixelSprite[] = [
  [
    '...bbbbb...',
    '..b.c.b.b..',
    '.b.bb.c..b.',
    'bc..b.bb..b',
    'b.bb.c..c.b',
    'b..c.bb.b.b',
    'b.b.b..bb.b',
    '.b..c.b..b.',
    '..b.bb.cb..',
    '...bbbbb...',
  ],
  [
    '...bbbbb...',
    '..bb.c.bb..',
    '.b..b.bb.b.',
    'b.cb..c..bb',
    'b..b.bb.b.b',
    'bb.c.b..c.b',
    'b.b..bc.b.b',
    '.b.bb..b.b.',
    '..b.c.bb...',
    '...bbbbb...',
  ],
]

export const VULTURE: readonly PixelSprite[] = [
  ['kk.......kk', '.kkk.h.kkk.', '...kkkkk...', '....kkk....'],
  ['...........', '....khk....', '.kkkkkkkkk.', 'kk..kkk..kk'],
]

export const CROC_EYES: readonly PixelSprite[] = [
  // surfacing: brows only
  ['.gg....gg.', 'gggg..gggg'],
  // eyes open
  ['.gg....gg.', 'gyyg..gyyg', 'gykg..gykg', 'gggg..gggg'],
  // blink
  ['.gg....gg.', 'gggg..gggg', 'gggg..gggg', 'gggg..gggg'],
]

export const STAGE_INK: Record<string, string> = {
  b: '#8a6a3c',
  c: '#5c4424',
  k: '#1c1410',
  h: '#c9b8a0',
  g: '#3d5a2a',
  y: '#e8d64a',
  w: '#ffffff',
}

// ---------------------------------------------------------------- where the moving parts are

/** A tumbleweed rolling across the street: on screen for a stretch of each 900-frame cycle. */
export function tumbleweedAt(
  frame: number,
): { x: number; y: number; spin: number } | null {
  const cycle = frame % 900
  if (cycle >= 420) return null
  const t = cycle / 420
  const x = Math.round(-30 + t * 900)
  // Bounces along the ground.
  const y = Math.round(-Math.abs(Math.sin(cycle / 18)) * 10)
  return { x, y, spin: Math.floor(cycle / 6) % 4 }
}

/** Smoke puffs drifting up and away from a lantern: offsets from it and a size for each puff. */
export function smokePuffs(
  frame: number,
  reducedMotion: boolean,
): Array<{ dx: number; dy: number; r: number }> {
  const puffs: Array<{ dx: number; dy: number; r: number }> = []
  const count = reducedMotion ? 2 : 6
  for (let i = 0; i < count; i += 1) {
    const age = (frame + i * 40) % 240
    puffs.push({
      dx: Math.round(age * 0.18 + Math.sin((frame + i * 37) / 30) * 2),
      dy: -Math.round(age * 0.22),
      r: 1 + Math.floor(age / 60),
    })
  }
  return puffs
}

/** Three vultures circling high over the Watering Hole. */
export function vulturesAt(
  frame: number,
): Array<{ x: number; y: number; flap: number }> {
  return [0, 1, 2].map((i) => {
    const a = frame / (260 + i * 40) + (i * Math.PI * 2) / 3
    return {
      x: Math.round(240 + Math.cos(a) * (70 + i * 18) + i * 30 - 30),
      y: Math.round(48 + Math.sin(a) * (14 + i * 4) + i * 6),
      flap: Math.floor((frame + i * 11) / 14) % 2,
    }
  })
}

/** Glints on the water: points in a water area of `w` x `h` that sparkle this frame. */
export function waterGlints(
  frame: number,
  w: number,
  h: number,
): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 9; i += 1) {
    const phase = (frame + i * 53) % 90
    if (phase > 18) continue
    out.push({
      x: Math.round(
        ((i * 97 + Math.floor((frame + i * 53) / 90) * 41) % 100) * (w / 100),
      ),
      y: Math.round(((i * 37) % 100) * (h / 100)),
    })
  }
  return out
}

/**
 * The croc's eyes in the water: surfacing every 12 seconds in a fight the croc isn't in, at a spot
 * across the water that changes each time; null when they are under.
 */
export function crocEyesAt(
  frame: number,
  roster: [FighterData, FighterData],
  waterWidth: number,
): { x: number; sprite: number } | null {
  if (roster.some((f) => f.slug === CROC)) return null
  const cycle = Math.floor(frame / 720)
  const t = frame % 720
  if (t < 480 || t >= 660) return null
  const into = t - 480
  const sprite = into < 20 || into >= 160 ? 0 : into % 90 < 6 ? 2 : 1
  const x = Math.round((((cycle * 61) % 80) / 100 + 0.1) * waterWidth)
  return { x, sprite }
}

// ---------------------------------------------------------------- the Mission

/** The candle's flame this frame: its height in pixels (2 to 4) and whether it burns bright. */
export function candleFlame(
  frame: number,
  reducedMotion: boolean,
): { h: number; bright: boolean } {
  if (reducedMotion) return { h: 3, bright: true }
  const n = Math.floor(frame / 5)
  const wobble = (n * 7 + ((n * n) % 5)) % 6
  return { h: 2 + (wobble % 3), bright: wobble !== 4 }
}

/**
 * The portal in the bell arch: how strongly it shows (0 to 1) between rounds (the KO and the next
 * round's intro), or 0 while a round is on. Under reduced motion it glows steadily instead.
 */
export function portalGlow(s: MatchState, reducedMotion: boolean): number {
  const between = s.phase === 'ko' || (s.phase === 'intro' && s.round > 1)
  if (!between) return 0
  if (reducedMotion) return 0.6
  const flicker = (Math.floor(s.frame / 3) * 13) % 7
  return flicker < 2 ? 0.25 : flicker < 5 ? 0.7 : 1
}

// ---------------------------------------------------------------- Storm Canyon

/** Frames between lightning strikes. */
export const LIGHTNING_EVERY = 420

/**
 * The lightning flash this frame (0 to 1): a double flicker at a different moment of each cycle, at
 * most twice in 12 frames. None under reduced motion.
 */
export function lightningAt(frame: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0
  const cycle = Math.floor(frame / LIGHTNING_EVERY)
  const at = 60 + ((cycle * 151) % 240)
  const t = (frame % LIGHTNING_EVERY) - at
  if (t >= 0 && t < 3) return 1
  if (t >= 7 && t < 10) return 0.6
  return 0
}

/** Rain streaks on screen this frame: a start point for each slanting streak. */
export function rainAt(
  frame: number,
  reducedMotion: boolean,
  width: number,
  height: number,
): Array<{ x: number; y: number }> {
  const count = reducedMotion ? 24 : 70
  // Under reduced motion the rain hangs still.
  const t = reducedMotion ? 0 : frame
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < count; i += 1) {
    const speed = 5 + (i % 3)
    const y = ((i * 53 + t * speed) % (height + 20)) - 10
    const x = ((i * 97 + t * 2) % (width + 40)) - 20
    out.push({ x: Math.round(x), y: Math.round(y) })
  }
  return out
}

/** Four crows wheeling over the canyon, smaller and faster than the vultures. */
export function crowsAt(
  frame: number,
): Array<{ x: number; y: number; flap: number }> {
  return [0, 1, 2, 3].map((i) => {
    const a = frame / (120 + i * 25) + (i * Math.PI) / 2
    return {
      x: Math.round(250 + Math.cos(a) * (50 + i * 22)),
      y: Math.round(40 + Math.sin(a * 1.3) * (10 + i * 3) + i * 5),
      flap: Math.floor((frame + i * 7) / 8) % 2,
    }
  })
}

// ---------------------------------------------------------------- the Lone Apple Tree

/** Frames between apples, frames an apple falls, and frames it rests on the ground before it fades. */
export const APPLE_EVERY = 360
export const APPLE_FALL = 30
export const APPLE_REST = 150

/**
 * The apple dropping this frame, if any: where across the canopy it fell from (0 to `width`), how far
 * it has fallen as a share of the drop (0 at the branch, 1 on the ground), and how visible it is.
 */
export function appleAt(
  frame: number,
  width: number,
): { x: number; fall: number; alpha: number } | null {
  const cycle = Math.floor(frame / APPLE_EVERY)
  const t = frame % APPLE_EVERY
  if (t >= APPLE_FALL + APPLE_REST) return null
  const x = Math.round((((cycle * 67) % 90) / 100 + 0.05) * width)
  if (t < APPLE_FALL) {
    // It falls the way things fall: slow off the branch, fast at the ground.
    const u = t / APPLE_FALL
    return { x, fall: u * u, alpha: 1 }
  }
  const rest = t - APPLE_FALL
  const fade = rest > APPLE_REST - 30 ? (APPLE_REST - rest) / 30 : 1
  return { x, fall: 1, alpha: Math.max(0, fade) }
}

/** Leaves drifting down from the canopy band (`w` wide), swaying as they go: offsets from its corner. */
export function leavesAt(
  frame: number,
  w: number,
  reducedMotion: boolean,
): Array<{ x: number; y: number }> {
  if (reducedMotion) return []
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 4; i += 1) {
    const life = 240
    const age = (frame + i * 61) % life
    const start =
      ((i * 37 + Math.floor((frame + i * 61) / life) * 23) % 100) / 100
    out.push({
      x: Math.round(start * w + Math.sin((age + i * 20) / 14) * 4 + age * 0.08),
      y: Math.round(age * 0.35),
    })
  }
  return out
}

/** A dust devil crossing the street: its centre x on screen and its height, or null when there isn't one. */
export function dustDevilAt(
  frame: number,
  reducedMotion: boolean,
): { x: number; h: number; spin: number } | null {
  if (reducedMotion) return null
  const cycle = frame % 1200
  if (cycle < 700 || cycle >= 1100) return null
  const t = (cycle - 700) / 400
  return {
    x: Math.round(520 - t * 560),
    h: Math.round(18 + Math.sin(t * Math.PI) * 10),
    spin: frame,
  }
}

// ---------------------------------------------------------------- the Dunes

/** Sand lifting off the crests (a band `w` wide): offsets from its corner, streaming downwind. */
export function sandBlowAt(
  frame: number,
  w: number,
  h: number,
  reducedMotion: boolean,
): Array<{ x: number; y: number }> {
  if (reducedMotion) return []
  const out: Array<{ x: number; y: number }> = []
  for (let i = 0; i < 18; i += 1) {
    const life = 90
    const age = (frame + i * 17) % life
    const lap = Math.floor((frame + i * 17) / life)
    const start = ((i * 53 + lap * 29) % 100) / 100
    out.push({
      x: Math.round(start * w + age * 0.9),
      y: Math.round((((i * 7) % 10) / 10) * h - age * 0.12),
    })
  }
  return out
}

/** Frames between the dune heaving, and how long something takes to pass under it. */
export const SLUMP_EVERY = 900
export const SLUMP_FRAMES = 300

/**
 * The dune heaving behind the fighters: where the hump is on screen (it crosses right to left) and how
 * high it stands, or null when the sand lies still.
 */
export function duneSlumpAt(
  frame: number,
  width: number,
): { x: number; h: number } | null {
  const t = frame % SLUMP_EVERY
  const start = SLUMP_EVERY - SLUMP_FRAMES
  if (t < start) return null
  const u = (t - start) / SLUMP_FRAMES
  return {
    x: Math.round(width + 40 - u * (width + 80)),
    h: Math.round(Math.sin(u * Math.PI) * 10),
  }
}

// ---------------------------------------------------------------- the Thin Place

/** The tears in the sky: jagged seams in screen pixels, each a list of points. */
export const RIFTS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  [
    [40, 30],
    [70, 44],
    [96, 38],
    [130, 60],
    [150, 56],
  ],
  [
    [300, 20],
    [322, 36],
    [318, 52],
    [350, 66],
    [380, 62],
    [410, 80],
  ],
  [
    [190, 92],
    [214, 100],
    [236, 96],
    [262, 110],
  ],
]

/** How brightly the tears glow this frame (0.4 to 1): they breathe. Steady under reduced motion. */
export function riftGlow(frame: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0.7
  return 0.7 + Math.sin(frame / 40) * 0.3
}

/** Debris floating up off the ground and sinking again: screen positions and sizes. */
export function debrisAt(
  frame: number,
  reducedMotion: boolean,
): Array<{ x: number; y: number; size: number }> {
  const out: Array<{ x: number; y: number; size: number }> = []
  for (let i = 0; i < 7; i += 1) {
    const bob = reducedMotion
      ? 0
      : Math.sin((frame + i * 50) / (60 + i * 7)) * 6
    out.push({
      x: 30 + ((i * 71) % 420),
      y: Math.round(150 + ((i * 37) % 60) + bob),
      size: 1 + (i % 3),
    })
  }
  return out
}

/**
 * How far the door stands open (0 to 1 of its gap): a sliver in the first round, wider each round
 * after, and it flickers. The boss's phases (t-021) will drive it in Arcade mode.
 */
export function doorOpen(
  round: number,
  frame: number,
  reducedMotion: boolean,
): number {
  const base = Math.min(1, 0.2 + (round - 1) * 0.35)
  if (reducedMotion) return base
  return Math.min(1, base * (0.85 + ((Math.floor(frame / 4) * 7) % 5) * 0.06))
}
