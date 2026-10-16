/**
 * Save the Plumber run-stable heroine: one seed, chosen at New Game, picks a
 * young adult heroine's name and look from authored palettes. Appearance is
 * cosmetic only; every heroine shares HEROINE_HITBOX and the same abilities
 * (conductor save-the-plumber DESIGN-BRIEF.md, "The premise").
 */

export type HairStyle =
  'curls' | 'bob' | 'braids' | 'ponytail' | 'locs' | 'pixie' | 'bun'

export type Heroine = {
  seed: number
  name: string
  skin: string
  skinShade: string
  hair: string
  hairStyle: HairStyle
  outfit: string
  shirt: string
  scarf: string
  boots: string
  /** Painted roster member key (savePlumberRoster); absent for code-only looks. */
  roster?: string
}

/** Collision box in movement-lab pixels; identical for every heroine. */
export const HEROINE_HITBOX = Object.freeze({ width: 22, height: 27 })

export const HEROINE_FIRST_NAMES = [
  'Rosa',
  'Imani',
  'Mei',
  'Priya',
  'Nadia',
  'Juniper',
  'Ximena',
  'Aiyana',
  'Saoirse',
  'Thandi',
  'Lucía',
  'Hana',
  'Zara',
  'Marisol',
  'Keiko',
  'Amara',
  'Ingrid',
  'Leilani',
  'Noor',
  'Valentina',
  'Odessa',
  'Tamsin',
  'Yara',
  'Wren',
] as const

export const HEROINE_LAST_NAMES = [
  'Delgado',
  'Okafor',
  'Lindqvist',
  'Nakamura',
  'Haddad',
  'Moreau',
  'Castillo',
  'Mensah',
  'Kapoor',
  'Reyes',
  'Whitehorse',
  'Novak',
  'Abara',
  'Fitzgerald',
  'Tanaka',
  'Quispe',
] as const

/** [skin, shade] pairs. */
export const HEROINE_SKIN_TONES: [string, string][] = [
  ['#fbd9c0', '#e9b897'],
  ['#f1c4a0', '#dba37d'],
  ['#e0ab83', '#c48c63'],
  ['#c98e64', '#a9714b'],
  ['#a86e48', '#8b5637'],
  ['#8a5636', '#6e4128'],
  ['#6b3f27', '#55301c'],
  ['#4e2c1c', '#3b1f13'],
]

export const HEROINE_HAIR_STYLES: HairStyle[] = [
  'curls',
  'bob',
  'braids',
  'ponytail',
  'locs',
  'pixie',
  'bun',
]

/** Natural shades plus salon colour: rainbow hair is very welcome here. */
export const HEROINE_HAIR_COLOURS = [
  '#1f1a1c',
  '#3a2620',
  '#5b3524',
  '#8c3b23',
  '#c76a2b',
  '#e5c27a',
  '#2bb5b0',
  '#d9468f',
  '#9b7be0',
  '#ff8a3d',
] as const

export const HEROINE_OUTFITS = [
  '#1f9aa2',
  '#e8705f',
  '#e3a92f',
  '#3f6fd1',
  '#7d4f9e',
  '#2f9a62',
] as const

export const HEROINE_SHIRTS = [
  '#fff4dc',
  '#f7d6e3',
  '#d8f1ec',
  '#fde8a8',
] as const

export const HEROINE_SCARVES = [
  '#f2786a',
  '#ffd166',
  '#ef5da8',
  '#5ed1c3',
  '#ffffff',
  '#8ad66b',
] as const

export const HEROINE_BOOTS = [
  '#3a3245',
  '#6b3b2a',
  '#2f4b5a',
  '#7a2f3f',
] as const

/** mulberry32: small, fast and identical on every platform. */
export function heroineRng(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function createHeroine(seed: number): Heroine {
  const rng = heroineRng(seed)
  const pick = <T>(list: readonly T[]): T =>
    list[Math.floor(rng() * list.length)]!
  const first = pick(HEROINE_FIRST_NAMES)
  const last = pick(HEROINE_LAST_NAMES)
  const [skin, skinShade] = pick(HEROINE_SKIN_TONES)
  return {
    seed: seed >>> 0,
    name: `${first} ${last}`,
    skin,
    skinShade,
    hair: pick(HEROINE_HAIR_COLOURS),
    hairStyle: pick(HEROINE_HAIR_STYLES),
    outfit: pick(HEROINE_OUTFITS),
    shirt: pick(HEROINE_SHIRTS),
    scarf: pick(HEROINE_SCARVES),
    boots: pick(HEROINE_BOOTS),
  }
}

/** A fresh seed for New Game / reroll. */
export function rollHeroineSeed(random: () => number = Math.random): number {
  return Math.floor(random() * 4294967296) >>> 0
}

/** Human-readable run code, e.g. "3FA9-12C0". */
export function heroineRunCode(seed: number): string {
  const hex = (seed >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return `${hex.slice(0, 4)}-${hex.slice(4)}`
}

/** The seed the page shows before anyone rolls: a fixed, friendly default. */
export const DEFAULT_HEROINE_SEED = 0x5a7e0001
