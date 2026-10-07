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
//
// This module is pure: which stage a match is on, where each layer sits for a camera, the stage-event
// state, and where every moving part is on a given frame. render.ts draws it; the stage component loads
// the images.

import type { FighterData, SimEvent } from './types'

export type StageSlug = 'hollow-bell' | 'watering-hole'

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
}

/** Each fighter's home stage (DESIGN-BRIEF.md "Stages with moving backgrounds"). */
export const HOME_STAGES: Partial<Record<string, StageSlug>> = {
  zuzu: 'hollow-bell',
  'coyote-vagrant': 'watering-hole',
  'river-croc': 'watering-hole',
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
