// /utils/arcade/burrowBuddy/rules.ts
//
// Burrow Buddy's rules as data (conductor kr-arcade/t-106): slump physics and chain scoring, the
// twelve-veggie ladder and the Golden Beet, the grump roster with its moods, and the six bubble
// tools that come out of cracked stones.

import type { Cell, GrumpKind, ToolKind } from './gardens'

// --- slumps ----------------------------------------------------------------------------------

/** What a slump block needs to know about the soil around it. */
export type SlumpWorld = {
  /** The cell beside a block is cut: dug out, or off the side of the field. */
  cut(x: number, y: number): boolean
  /** The cell under a block is open: dug, inside the field, with nothing solid in it. */
  open(x: number, y: number): boolean
}

const has = (cells: readonly Cell[], x: number, y: number) =>
  cells.some((c) => c.x === x && c.y === y)

/** Cut free on both sides: every cell beside the block is dug out. */
export function sidesCut(cells: readonly Cell[], world: SlumpWorld): boolean {
  return cells.every(
    ({ x, y }) =>
      (has(cells, x - 1, y) || world.cut(x - 1, y)) &&
      (has(cells, x + 1, y) || world.cut(x + 1, y)),
  )
}

/** Undercut: every cell under the block is open, so there is room to slide. */
export function undercut(cells: readonly Cell[], world: SlumpWorld): boolean {
  return cells.every(({ x, y }) => has(cells, x, y + 1) || world.open(x, y + 1))
}

/** A block is held up by what's around it; cut it free and undercut it and it slides. */
export function slumpFree(cells: readonly Cell[], world: SlumpWorld): boolean {
  return sidesCut(cells, world) && undercut(cells, world)
}

/** The cells a block slides into on its next row. */
export function leadingCells(cells: readonly Cell[]): Cell[] {
  return cells
    .filter((c) => !has(cells, c.x, c.y + 1))
    .map((c) => ({ x: c.x, y: c.y + 1 }))
}

/** The cells just above a block, where a grump standing on it rides down with it. */
export function topCells(cells: readonly Cell[]): Cell[] {
  return cells
    .filter((c) => !has(cells, c.x, c.y - 1))
    .map((c) => ({ x: c.x, y: c.y - 1 }))
}

export const CRUSH_BONUS = [0, 1000, 2500, 4000, 6000, 8000, 10_000, 12_000]
export const CREAK_TICKS = 45
export const SLUMP_FALL = 2
/** Ticks after a slump moves in which another block it frees counts as a chain. */
export const CHAIN_WINDOW = 60
export const CHAIN_CAP = 4

export function crushBonus(crushed: number): number {
  return CRUSH_BONUS[Math.min(crushed, CRUSH_BONUS.length - 1)]!
}

/** A slump pays the crush bonus, multiplied by how far down a chain of slumps it came. */
export function slumpBonus(crushed: number, chain: number): number {
  return crushBonus(crushed) * Math.max(1, Math.min(CHAIN_CAP, chain))
}

// --- the veggie ladder -------------------------------------------------------------------------

/** Twelve prizes in Season order, two gardens a rung, so dropping turnips keeps paying more. */
export const VEGGIE_LADDER = [
  { from: 1, name: 'RADISH', points: 400 },
  { from: 3, name: 'CARROT', points: 600 },
  { from: 5, name: 'TURNIP GREENS', points: 800 },
  { from: 7, name: 'MUSHROOM', points: 1000 },
  { from: 9, name: 'CUCUMBER', points: 1500 },
  { from: 11, name: 'EGGPLANT', points: 2000 },
  { from: 13, name: 'PEPPER', points: 2500 },
  { from: 15, name: 'TOMATO', points: 3000 },
  { from: 17, name: 'ONION', points: 4000 },
  { from: 19, name: 'PUMPKIN', points: 5000 },
  { from: 21, name: 'WATERMELON', points: 6000 },
  { from: 23, name: 'STAR FRUIT', points: 8000 },
] as const

export type Veggie = { from: number; name: string; points: number }

/** Off the ladder: it appears only after one crush catches five grumps. */
export const GOLDEN_BEET: Veggie = {
  from: 0,
  name: 'GOLDEN BEET',
  points: 10_000,
}
export const GOLDEN_BEET_CRUSH = 5

export function veggieForGarden(garden: number): Veggie {
  let rung: Veggie = VEGGIE_LADDER[0]
  for (const r of VEGGIE_LADDER) if (garden >= r.from) rung = r
  return rung
}

// --- the grumps ---------------------------------------------------------------------------------

export type GrumpRules = {
  name: string
  /** Puffs to pop (a mimic turns back into a real turnip instead). */
  popAt: number
  /** Gets bored and drifts through the soil as a ghost. */
  ghosts: boolean
  /** Crawl speed as a share of the garden's grump speed. */
  pace: number
  /** Pop points as a share of the depth points. */
  worth: number
}

export const GRUMPS: Record<GrumpKind, GrumpRules> = {
  grub: { name: 'GRUB', popAt: 4, ghosts: true, pace: 1, worth: 1 },
  beetle: { name: 'BEETLE', popAt: 4, ghosts: true, pace: 1, worth: 1 },
  pillbug: { name: 'PILL BUG', popAt: 4, ghosts: true, pace: 0.9, worth: 1.5 },
  cricket: {
    name: 'MOLE CRICKET',
    popAt: 4,
    ghosts: false,
    pace: 0.85,
    worth: 1.5,
  },
  mimic: { name: 'MIMIC TURNIP', popAt: 2, ghosts: false, pace: 1.1, worth: 1 },
}

export type Mood = 'calm' | 'restless' | 'ghost'

/** Ticks left on the boredom timer when a grump turns restless (its colour shifts). */
export const RESTLESS_AT = 150

export function moodFor(ghost: boolean, boredIn: number): Mood {
  if (ghost) return 'ghost'
  return boredIn <= RESTLESS_AT ? 'restless' : 'calm'
}

/** A pill bug curls up when Buddy faces it from this close. */
export const CURL_RANGE = 4
export const CURL_TICKS = 100
/** After uncurling it stays open this long: the window to puff it. */
export const CURL_REST = 120
/** The spray of dirt a mole cricket throws before it digs a cell. */
export const SPRAY_TICKS = 36
/** Cells a mole cricket digs toward Buddy each time it gets restless. */
export const CRICKET_DIG = 4
/** A mimic wakes when Buddy comes within this many tiles. */
export const MIMIC_RANGE = 2
export const MIMIC_AWAKE = 240
/** A mimic's eyes open this often (and for MIMIC_BLINK ticks) while it pretends. */
export const MIMIC_BLINK_EVERY = 150
export const MIMIC_BLINK = 14
export const MIMIC_POINTS = 500

// --- bubble tools -------------------------------------------------------------------------------

export type ToolRules = {
  name: string
  /** Ticks it lasts; 0 lasts the rest of the garden. */
  ticks: number
  /** Uses (the sprinkler), or 0 for a timed tool. */
  charges: number
}

export const TOOLS: Record<ToolKind, ToolRules> = {
  wide: { name: 'WIDE PUFF', ticks: 900, charges: 0 },
  long: { name: 'LONG PUFF', ticks: 900, charges: 0 },
  quick: { name: 'QUICK PUFF', ticks: 900, charges: 0 },
  drill: { name: 'DRILL BOOTS', ticks: 600, charges: 0 },
  headlamp: { name: 'HEADLAMP', ticks: 0, charges: 0 },
  sprinkler: { name: 'SPRINKLER', ticks: 0, charges: 3 },
}

export const BASE_REACH = 3
export const LONG_REACH = 5
export const QUICK_POP = 3
export const SPRINKLER_REACH = 6
/** Ticks of pushing to crack a cracked stone open. */
export const CRACK_PUSH = 30
export const LAMP_RADIUS = 2
export const HEADLAMP_RADIUS = 4

export type PuffStats = { reach: number; wide: boolean; quick: boolean }

export function puffStats(active: (tool: ToolKind) => boolean): PuffStats {
  return {
    reach: active('long') ? LONG_REACH : BASE_REACH,
    wide: active('wide'),
    quick: active('quick'),
  }
}

/** Puffs to pop a grump: Quick Puff makes it three (a mimic only ever takes two). */
export function popAt(kind: GrumpKind, quick: boolean): number {
  const base = GRUMPS[kind].popAt
  return quick ? Math.min(base, QUICK_POP) : base
}
