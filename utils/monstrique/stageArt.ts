/**
 * MONSTRIQUE stage art: painted room backgrounds, cut-out cast figures and
 * dialogue portraits delivered by round CH1-CAST-AND-MOTEL-R1. Every file is
 * general-safe (ArtImage isMature false) and served statically, so both
 * editions share it. Rooms or characters missing here keep the vector
 * fallback; the main-game standard keeps SVG only for missing art.
 *
 * Stage coordinates are percentages of the painting (1344x768), the same
 * space as hotspots and walk areas.
 */
import type { RoomId } from '../monstressConvention/prologue'
import type { MonstriqueCharacterId } from './characterModels'

export const STAGE_WIDTH = 1344
export const STAGE_HEIGHT = 768

export interface StageBackdrop {
  src: string
  alt: string
  artImageId: number
}
export interface StageFigure {
  src: string
  alt: string
  artImageId: number
  width: number
  height: number
  float?: boolean
}
/** Where a stage character stands: feet on the floor, `cut` hides the bottom. */
export interface StageMark {
  x: number
  y: number
  cut?: number
}
export interface StagePortrait {
  src: string
  alt: string
}

const ROOMS = '/monstress-convention/rooms/'
const CAST = '/monstress-convention/cast/'
const PORTRAITS = '/monstress-convention/portraits/'

export const ROOM_BACKDROPS: Partial<Record<RoomId, StageBackdrop>> = {
  'motel-exterior': {
    src: ROOMS + 'motel-exterior.webp',
    alt: 'The Last Call Motor Lodge at night in the rain: a neon MOTEL LODGE sign, a pin-up billboard, two floors of doors and a rusting sedan in the wet parking lot.',
    artImageId: 280905,
  },
  'front-office': {
    src: ROOMS + 'front-office.webp',
    alt: 'The motel front office: a long wooden counter with a cash register and bell, a key rack, a neon-lit window and a glass case of Beach Hex memorabilia.',
    artImageId: 280906,
  },
  'ice-alcove': {
    src: ROOMS + 'ice-alcove.webp',
    alt: 'A grimy stairwell alcove: a green ice machine spilling cubes, a clipboard maintenance log, a padlocked sewer hatch and a glowing pink vending machine.',
    artImageId: 280907,
  },
  balcony: {
    src: ROOMS + 'balcony.webp',
    alt: 'The rain-soaked second-floor walkway: wet footprints lead to a door crossed with yellow tape, past a window where an old TV flickers.',
    artImageId: 280908,
  },
  'odette-room': {
    src: ROOMS + 'odette-room.webp',
    alt: 'Room 205: flamingo wallpaper, a dresser with an ice bucket, a vampire cape on a chair, and a sheet-covered bed with a jewelled knife on it.',
    artImageId: 280909,
  },
  'investigators-room': {
    src: ROOMS + 'investigators-room.webp',
    alt: 'Room 207: an evidence desk of photographs and red string, one cramped bed, a plastic-wrapped suitcase and a sliding door to the balcony.',
    artImageId: 280910,
  },
  'neighbor-room': {
    src: ROOMS + 'neighbor-room.webp',
    alt: 'Room 204: a superfan’s den with a wall clock, signed headshots, a shelf of dolls, an old TV playing a beach movie and a floral armchair.',
    artImageId: 280911,
  },
}

export const CAST_FIGURES: Partial<Record<MonstriqueCharacterId, StageFigure>> =
  {
    marta: {
      src: CAST + 'marta.webp',
      alt: 'Marta, the night manager, in a red headscarf and sunglasses, holding an ice bucket.',
      artImageId: 280900,
      width: 605,
      height: 1138,
    },
    dolores: {
      src: CAST + 'dolores.webp',
      alt: 'Dolores in curlers, a pink quilted robe covered in fan buttons and fluffy slippers, remote in hand.',
      artImageId: 280901,
      width: 668,
      height: 1160,
    },
    gavin: {
      src: CAST + 'gavin.webp',
      alt: 'Gavin in a rain jacket and convention lanyards, aiming a long-lens camera.',
      artImageId: 280902,
      width: 580,
      height: 1153,
    },
    odette: {
      src: CAST + 'odette.webp',
      alt: 'Odette’s ghost, pale blue in a grey suit and pearls, fanning contracts and a cigarette holder.',
      artImageId: 280903,
      width: 677,
      height: 1122,
      float: true,
    },
    violet: {
      src: CAST + 'violet.webp',
      alt: 'Violet’s ghost in a rented vampire cape and fishnets, arms crossed, trailing violet smoke.',
      artImageId: 280904,
      width: 713,
      height: 1139,
      float: true,
    },
  }

/** Feet positions for characters standing in painted rooms, by hotspot id. */
export const STAGE_MARKS: Record<string, StageMark> = {
  gavin: { x: 60, y: 82 },
  marta: { x: 40, y: 64, cut: 0.3 },
  neighbor: { x: 70, y: 98 },
  nico: { x: 48, y: 86 },
  'odette-ghost': { x: 21, y: 90 },
  'violet-ghost': { x: 84, y: 91 },
}

export const CAST_PORTRAITS: Partial<
  Record<MonstriqueCharacterId, Record<string, StagePortrait>>
> = {
  odette: {
    neutral: { src: PORTRAITS + 'odette-neutral.webp', alt: 'Odette' },
    scheming: {
      src: PORTRAITS + 'odette-scheming.webp',
      alt: 'Odette, scheming',
    },
    'double-take': {
      src: PORTRAITS + 'odette-double-take.webp',
      alt: 'Odette, doing a double take',
    },
    annoyed: { src: PORTRAITS + 'odette-annoyed.webp', alt: 'Odette, annoyed' },
  },
  violet: {
    neutral: { src: PORTRAITS + 'violet-neutral.webp', alt: 'Violet' },
    deadpan: { src: PORTRAITS + 'violet-deadpan.webp', alt: 'Violet, deadpan' },
    'double-take': {
      src: PORTRAITS + 'violet-double-take.webp',
      alt: 'Violet, doing a double take',
    },
    laughing: {
      src: PORTRAITS + 'violet-laughing.webp',
      alt: 'Violet, laughing',
    },
  },
  marta: {
    neutral: { src: PORTRAITS + 'marta-neutral.webp', alt: 'Marta' },
  },
  dolores: {
    neutral: { src: PORTRAITS + 'dolores-neutral.webp', alt: 'Dolores' },
  },
  gavin: {
    neutral: { src: PORTRAITS + 'gavin-neutral.webp', alt: 'Gavin' },
  },
}

const EXPRESSIONS_FOR_MOOD: Record<string, string[]> = {
  shock: ['double-take'],
  smirk: ['scheming', 'laughing'],
  recoil: ['annoyed', 'deadpan'],
  deduce: ['deadpan', 'annoyed'],
}

export function backdropFor(room: RoomId): StageBackdrop | null {
  return ROOM_BACKDROPS[room] ?? null
}

export function figureFor(
  character: MonstriqueCharacterId,
): StageFigure | null {
  return CAST_FIGURES[character] ?? null
}

/** The painted dialogue portrait for a speaker's mood, or null for vector. */
export function portraitFor(
  character: MonstriqueCharacterId,
  mood?: string,
): StagePortrait | null {
  const set = CAST_PORTRAITS[character]
  if (!set) return null
  const expression = (EXPRESSIONS_FOR_MOOD[mood ?? ''] ?? []).find(
    (name) => set[name],
  )
  return set[expression ?? 'neutral'] ?? null
}
