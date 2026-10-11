// /utils/arcade/pinball/tables/zuzuLastBell/chapters.ts
//
// The Last Bell's five story chapters (conductor zuzu-pinball/t-008). The
// Mortuary scoop tells the next chapter in order; each is a timed mode with
// its own lit shots, and finishing it breaks one of the five seals on the
// progress track. A chapter cut short (the timer, a drain) keeps its progress
// for the next telling: losing a ball is never a narrative reset. Sealing
// the fifth, The Last Bell, starts the story again at double value.

import { PHYSICS_HZ } from '../../clock'

/**
 * How a chapter lights its shots:
 *   each       every listed shot once, in any order
 *   alternate  back and forth between the listed shots
 *   repeat     the same shots again and again
 *   roving     one shot at a time, moving along the list every few seconds
 */
export type ChapterStyle = 'each' | 'alternate' | 'repeat' | 'roving'

export type ChapterDef = {
  id: string
  /** The DMD's name for it (two short lines at most). */
  name: string
  /** What the player does, for the mode intro. */
  goal: string
  style: ChapterStyle
  shots: readonly string[]
  /** Hits that seal the chapter. */
  need: number
  seconds: number
}

export const CHAPTERS: readonly ChapterDef[] = [
  {
    id: 'homestead',
    name: 'HOMESTEAD IN ASH',
    goal: 'DOUSE THREE FIRES',
    style: 'each',
    shots: ['village-switchback', 'left-orbit', 'right-orbit', 'croc-mouth'],
    need: 3,
    seconds: 45,
  },
  {
    id: 'storm-crow',
    name: 'STORM CROW CANYON',
    goal: 'ORBITS SCATTER CROWS',
    style: 'alternate',
    shots: ['left-orbit', 'right-orbit'],
    need: 5,
    seconds: 45,
  },
  {
    id: 'abbey',
    name: 'ABBEY OF HOLLOW BELLS',
    goal: 'RIDE ALL THREE RAMPS',
    style: 'each',
    shots: ['village-switchback', 'abbey-crossover', 'bell-spiral'],
    need: 3,
    seconds: 45,
  },
  {
    id: 'names',
    name: "THE CHILDREN'S NAMES",
    goal: 'FIND EACH CHILD',
    style: 'roving',
    shots: [
      'left-orbit',
      'village-switchback',
      'bell-spiral',
      'abbey-crossover',
      'right-orbit',
      'croc-mouth',
    ],
    need: 5,
    seconds: 50,
  },
  {
    id: 'last-bell',
    name: 'THE LAST BELL',
    goal: 'RING IT THREE TIMES',
    style: 'repeat',
    shots: ['bell-spiral'],
    need: 3,
    seconds: 60,
  },
]

/**
 * Strikes on the captive relic ball that wake the crypt under the Abbey: the
 * hidden undercrypt (t-010) opens on it.
 */
export const RELICS_FOR_CRYPT = 3

/** The Abbey seal drop targets; all down bares the relic. */
export const SEAL_COUNT = 4

/** A roving chapter's lit shot moves on this often (physics steps). */
export const ROVE_STEPS = PHYSICS_HZ * 4

/** A chapter's first hit is worth this, times its place in the story. */
export const CHAPTER_HIT = 250_000
/** Each further hit in the same chapter is worth this much more. */
export const CHAPTER_HIT_RAISE = 0.5
/** Sealing a chapter, times its place in the story. */
export const CHAPTER_SEAL = 1_000_000

/** A chapter's progress: what has been made toward its seal so far. */
export type ChapterProgress = {
  hits: number
  /** Shots made, in order (each: which are done; alternate: the last). */
  made: string[]
}

/** The shots lit for a chapter now. */
export function litShots(
  def: ChapterDef,
  progress: ChapterProgress,
  rove: number,
): string[] {
  switch (def.style) {
    case 'each':
      return def.shots.filter((s) => !progress.made.includes(s))
    case 'alternate': {
      const last = progress.made.at(-1)
      return def.shots.filter((s) => s !== last)
    }
    case 'repeat':
      return [...def.shots]
    case 'roving':
      return [def.shots[rove % def.shots.length]!]
  }
}

/** What the next hit in a chapter pays, in story round `round` (from 1). */
export function hitValue(index: number, hits: number, round: number): number {
  return Math.round(
    CHAPTER_HIT * (index + 1) * (1 + hits * CHAPTER_HIT_RAISE) * round,
  )
}

export function sealValue(index: number, round: number): number {
  return CHAPTER_SEAL * (index + 1) * round
}
