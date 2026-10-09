export type Attribute = 'steel' | 'sense' | 'shadow' | 'mercy'
export type Choice = {
  id: string
  label: string
  to: string
  requires?: string
  gain?: string
  spend?: string
  flag?: string
  heal?: number
  cost?: number
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
