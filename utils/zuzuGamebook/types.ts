export type Attribute = 'steel' | 'sense' | 'shadow' | 'mercy'
export type Choice = {
  id: string
  label: string
  to: string
  requires?: string
  gain?: string
  spend?: string
  flag?: string
  /** Extra journal flags (deeds, debts, clues) recorded when the choice is taken. */
  flags?: string[]
  heal?: number
  cost?: number
  /** Minimum Honor / Taint the choice needs; below it the choice shows disabled with `hint`. */
  needsHonor?: number
  needsTaint?: number
  /** Most Taint the choice allows; above it the choice shows disabled with `hint` (the best ending's clean hands). */
  maxTaint?: number
  /** A journal flag the choice needs; without it the choice shows disabled with `hint`. */
  needs?: string
  hint?: string
  /** A journal flag that retires the choice; once set, the choice is not offered. */
  unless?: string
  check?: {
    attribute: Attribute
    target: number
    success: string
    failure: string
    /** Knowledge that helps: +amount to the roll when the flag is held. */
    bonus?: { flag: string; amount: number }
  }
}
/** Consequences applied when a scene is entered. Damage never drops Zuzu below 1 HP outside combat. */
export type SceneEffects = {
  flag?: string
  flags?: string[]
  /** Lasting change to an attribute, one step at a time, clamped to -2..4. */
  attr?: { attribute: Attribute; amount: number }
  gain?: string
  heal?: number
  hurt?: number
  resolve?: number
}
export type Scene = {
  id: string
  chapter: string
  title: string
  text: string
  art: string
  choices?: Choice[]
  effects?: SceneEffects
  battle?: {
    name: string
    hp: number
    guard: number
    attack: number
    win: string
    lose: string
  }
  ending?: 'hope' | 'bittersweet' | 'dark'
}
export type Roll = {
  dice: [number, number]
  modifier: number
  target: number
  total: number
  success: boolean
  label: string
}
export type Battle = { hp: number; exposed: boolean; turn: number; log: string }
export type Run = {
  version: 1
  sceneId: string
  health: number
  resolve: number
  attributes: Record<Attribute, number>
  items: string[]
  flags: string[]
  seed: number
  visited: string[]
  endings: string[]
  battle: Battle | null
  lastRoll: Roll | null
}

/**
 * An act module (BOOK-ONE-OUTLINE.md, conductor projects/zuzu-gamebook): its own new sections, choices it adds to
 * sections that already exist, and existing choices it reroutes into itself, keyed 'sceneId/choiceId'
 * (or 'sceneId/choiceId#success' / '#failure' for a checked choice).
 */
export type Act = {
  scenes: Scene[]
  extend?: Record<string, Choice[]>
  reroute?: Record<string, string>
}
