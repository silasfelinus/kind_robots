/**
 * MONSTRIQUE, Chapter 1: The Last Call. A deterministic, adults-only
 * monster-celebrity comedy mystery set in Midnight City.
 *
 * Iris is the player: the assistant who touches everything. Norb (internal
 * key `nico`, kept for save compatibility) is Midnight City's premiere
 * blogger, a germophobe who observes, deduces and asks, but never takes, uses
 * or photographs. The murdered agent Odette and Violet, the companion she
 * hired to play a vampire, are ghosts bound to Room 205; Odette is the
 * client. Flirting is a verb, favours earn gratitude, and gratitude never
 * gates a required clue. Story canon: conductor
 * projects/monstress-convention/STORY-BIBLE.md. Chapter Two (Beach Hex) lives
 * in chapterTwo.ts and plugs into the same engine and save. The shared
 * notebook's clue comparisons, Norb's per-room deductions and the ghosts'
 * shared reactive topics live in depth.ts.
 */
import {
  CHAPTER_TWO_ENDING,
  CHAPTER_TWO_EVIDENCE,
  CHAPTER_TWO_GATES,
  CHAPTER_TWO_GRACES,
  CHAPTER_TWO_ITEMS,
  CHAPTER_TWO_LOCKED,
  CHAPTER_TWO_OPENERS,
  CHAPTER_TWO_ROOMS,
  CHAPTER_TWO_TOPICS,
  CHAPTER_TWO_TOPIC_TARGETS,
  chapterTwoCombine,
  chapterTwoFlirt,
  chapterTwoInterview,
  chapterTwoItem,
  chapterTwoMaxScore,
  chapterTwoScore,
  chapterTwoVerb,
  isChapterTwoRoom,
  type ChapterTwoRoomId,
} from './chapterTwo'
import {
  COMPARE_MISSES,
  GHOSTS_AGREE,
  ODETTE_BACKS_VIOLET,
  REACTIVE_TOPICS,
  REACTIVE_TOPIC_SOURCES,
  REACTIVE_TOPIC_TARGETS,
  VIOLET_BACKS_ODETTE,
  deductionsOf,
  findComparison,
  isDeduction,
  norbHunch,
  reactiveLine,
  type DeductionGrants,
} from './depth'

export type Investigator = 'iris' | 'nico'
export type RoomId =
  | 'motel-exterior'
  | 'front-office'
  | 'ice-alcove'
  | 'balcony'
  | 'investigators-room'
  | 'neighbor-room'
  | 'odette-room'
  | 'city-map'
  | 'convention-center'
  | ChapterTwoRoomId
export type Verb =
  'walk' | 'look' | 'talk' | 'take' | 'use' | 'photograph' | 'ask' | 'flirt'
export type CaseEnding =
  'lead-earned' | 'reckless' | 'fifth-hexblade' | 'five-knives'
export type CaseChapter = 1 | 2

/**
 * The bucket trail that turns the convention lead into the full file: the
 * knife's Beach Hex stamp, the shrine's fifth dent, the missing bucket's
 * greasepaint and Violet's cold cream. None depends on giving anything away,
 * so no earlier choice can lock it out.
 */
export const FIFTH_HEXBLADE_CLUES = [
  'knife-prop-mark',
  'shrine-photo',
  'ice-ring',
  'makeup-smear',
  'violet-scent',
] as const

/** Chapter One's three endings. */
export const CHAPTER_ONE_ENDINGS: readonly CaseEnding[] = [
  'lead-earned',
  'reckless',
  'fifth-hexblade',
]

/** Every ending a case file can record, Chapter One's first. */
export const CASE_ENDINGS: readonly CaseEnding[] = [
  ...CHAPTER_ONE_ENDINGS,
  CHAPTER_TWO_ENDING,
]

export function endingChapter(ending: CaseEnding): CaseChapter {
  return ending === CHAPTER_TWO_ENDING ? 2 : 1
}

export interface HotelHotspot {
  id: string
  label: string
  x: number
  y: number
  verbs: Verb[]
}
export interface HotelRoom {
  id: RoomId
  label: string
  /** Where in Midnight City the room is, for rooms away from the motel. */
  district?: string
  floor: number
  caption: string
  exits: RoomId[]
  hotspots: HotelHotspot[]
}
export interface CaseState {
  version: 3
  seed: number
  room: RoomId
  actor: Investigator
  flags: string[]
  evidence: string[]
  topics: string[]
  inventory: string[]
  asked: string[]
  transcript: string[]
  /** Favours done per character. Unlocks flirt payoffs, never clues. */
  gratitude: Record<string, number>
  /** How many times Norb has turned Iris down. Escalates the gag. */
  rebuffs: number
  ending: CaseEnding | null
  /** The chapter being played. Absent (Chapter One) on older saves. */
  chapter?: CaseChapter
  /** Endings of the chapters already filed in this case, oldest first. */
  filed?: CaseEnding[]
  /**
   * The shared notebook's deductions (depth.ts), oldest first. Absent on
   * saves from before the notebook could compare clues.
   */
  deductions?: string[]
}
export interface CaseAction {
  /**
   * `compare` lays two notebook clues side by side: `target` and `item`
   * are evidence keys, and either investigator may do it.
   */
  verb: Verb | 'combine' | 'compare'
  target: string
  topic?: string
  /** An inventory item used on the target (giving counts as using). */
  item?: string
}
export interface CaseResult {
  state: CaseState
  line: string
  changed: boolean
}

export const GAME_TITLE = 'MONSTRIQUE'
export const CITY_NAME = 'Midnight City'

export const HOTEL_ROOMS: Record<RoomId, HotelRoom> = {
  'motel-exterior': {
    id: 'motel-exterior',
    label: 'Last Call Motor Lodge',
    floor: 0,
    caption:
      'Midnight City, where it is always last call. Rain sizzles on the neon, and a MONSTRIQUE: REAWAKENED billboard leers over a motel that rents by the night, the hour or the confession.',
    exits: ['front-office', 'ice-alcove', 'city-map'],
    hotspots: [
      {
        id: 'motel-sign',
        label: 'Flickering motel sign',
        x: 51,
        y: 20,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'gavin',
        label: 'Gavin, the fan with the long lens',
        x: 57,
        y: 70,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'fan-camera',
        label: 'Gavin’s camera',
        x: 64,
        y: 57,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'billboard',
        label: 'MONSTRIQUE: REAWAKENED billboard',
        x: 20,
        y: 20,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'front-office': {
    id: 'front-office',
    label: 'Motel Front Office',
    floor: 1,
    caption:
      'A counter sticky with sixty years of spilled cocktails, a key rack, a guest register and a lobby shrine to the 1964 Beach Hex line-up. Norb declines the complimentary pen. And the mint. And the air.',
    exits: ['motel-exterior', 'balcony'],
    hotspots: [
      {
        id: 'marta',
        label: 'Marta, night manager',
        x: 40,
        y: 38,
        verbs: ['look', 'talk', 'ask', 'use', 'flirt'],
      },
      {
        id: 'guest-ledger',
        label: 'Guest register',
        x: 43,
        y: 68,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'memorabilia-case',
        label: 'Beach Hex shrine',
        x: 76,
        y: 30,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'ice-alcove': {
    id: 'ice-alcove',
    label: 'Ice Machine Alcove',
    floor: 1,
    caption:
      'The ice machine clanks twice every so often, like it is trying to tell you something. A sign promises FREE ICE. Nothing at the Last Call is free.',
    exits: ['motel-exterior', 'balcony'],
    hotspots: [
      {
        id: 'ice-machine',
        label: 'Temperamental ice machine',
        x: 44,
        y: 42,
        verbs: ['look', 'use', 'photograph'],
      },
      {
        id: 'maintenance-log',
        label: 'Pip’s maintenance log',
        x: 10,
        y: 34,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'sewer-hatch',
        label: 'Locked sewer hatch',
        x: 68,
        y: 87,
        verbs: ['look', 'use'],
      },
      {
        id: 'vending-machine',
        label: 'Last Call Lovin’ vending machine',
        x: 91,
        y: 46,
        verbs: ['look', 'use'],
      },
    ],
  },
  balcony: {
    id: 'balcony',
    label: 'Second-Floor Balcony',
    floor: 2,
    caption:
      'Wet concrete, thin walls and a row of doors with stories. Somewhere a TV plays the 1964 Beach Hex movie, badly dubbed.',
    exits: [
      'front-office',
      'ice-alcove',
      'investigators-room',
      'neighbor-room',
      'odette-room',
    ],
    hotspots: [
      {
        id: 'room-door',
        label: 'Door to Room 205',
        x: 57,
        y: 42,
        verbs: ['look', 'use'],
      },
      {
        id: 'footprints',
        label: 'Wet prints on the balcony',
        x: 32,
        y: 76,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'investigators-room': {
    id: 'investigators-room',
    label: 'Room 207: The Unwashed Truth',
    floor: 2,
    caption:
      'The field office of Norb’s blog, The Unwashed Truth: two suitcases, one cramped bed, an evidence desk and an empty can of disinfectant Norb used on the bedspread.',
    exits: ['balcony'],
    hotspots: [
      {
        id: 'desk',
        label: 'Evidence desk',
        x: 22,
        y: 80,
        verbs: ['look', 'use'],
      },
      {
        id: 'nico',
        label: 'Norb, gloved and unimpressed',
        x: 48,
        y: 66,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'bedspread',
        label: 'The one cramped bed',
        x: 58,
        y: 57,
        verbs: ['look', 'use'],
      },
    ],
  },
  'neighbor-room': {
    id: 'neighbor-room',
    label: 'Next Door, Room 204',
    floor: 2,
    caption:
      'Dolores, a retired Monstrique superfan, watches the Beach Hex reissue at full volume. She heard everything through the wall and has opinions about all of it.',
    exits: ['balcony'],
    hotspots: [
      {
        id: 'neighbor',
        label: 'Dolores, superfan next door',
        x: 70,
        y: 52,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'wall-clock',
        label: 'Clock beside the TV',
        x: 13,
        y: 16,
        verbs: ['look', 'photograph'],
      },
    ],
  },
  'odette-room': {
    id: 'odette-room',
    label: 'Room 205',
    floor: 2,
    caption:
      'A rented cape, a bottle of good gin, two bodies on the bedspread and one jewelled knife. In the mirror, two women argue about whose fault this is. They are also the bodies.',
    exits: ['balcony'],
    hotspots: [
      {
        id: 'knife',
        label: 'Jewelled prop knife',
        x: 53,
        y: 75,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'odette-body',
        label: 'Odette’s body',
        x: 36,
        y: 68,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'violet-body',
        label: 'Violet’s body',
        x: 64,
        y: 62,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'odette-purse',
        label: 'Odette’s purse',
        x: 3,
        y: 56,
        verbs: ['look', 'take'],
      },
      {
        id: 'ice-ring',
        label: 'Wet ring on the nightstand',
        x: 50,
        y: 50,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'odette-ghost',
        label: 'Odette, ghost and client',
        x: 21,
        y: 42,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
      {
        id: 'violet-ghost',
        label: 'Violet, ghost in a rented cape',
        x: 84,
        y: 44,
        verbs: ['look', 'talk', 'ask', 'flirt'],
      },
    ],
  },
  'city-map': {
    id: 'city-map',
    label: 'Midnight City Map',
    floor: 0,
    caption:
      'Midnight City by night, which is the only way it comes: a convention hall, a joke shop, a vampire’s mansion, a drive-in by the beach and something under the drains.',
    exits: [
      'motel-exterior',
      'convention-center',
      'drive-in',
      'science-cinema',
    ],
    hotspots: [
      {
        id: 'drive-in',
        label: 'Starlite Drive-In, Hexwater Beach',
        x: 18,
        y: 70,
        verbs: ['look'],
      },
      {
        id: 'joke-shop',
        label: 'Hex & Giggles joke shop',
        x: 35,
        y: 49,
        verbs: ['look'],
      },
      {
        id: 'mansion',
        label: 'Draculina’s mansion',
        x: 78,
        y: 22,
        verbs: ['look'],
      },
      {
        id: 'sewers',
        label: 'Sewer entrance',
        x: 66,
        y: 82,
        verbs: ['look'],
      },
    ],
  },
  'convention-center': {
    id: 'convention-center',
    label: 'MONSTRIQUE Convention Center',
    floor: 1,
    caption:
      'Sixty years of Monstrique under one roof: idols, dolls, contracts and fans who should have showered. Cleo Pappatra signs headshots at a table draped in her own spare bandages.',
    exits: ['city-map'],
    hotspots: [
      {
        id: 'idol-poster',
        label: 'Six Decades of Screams tour poster',
        x: 51,
        y: 42,
        verbs: ['look', 'photograph'],
      },
      {
        id: 'mummy-actress',
        label: 'Cleo Pappatra, the mummy star',
        x: 75,
        y: 58,
        verbs: ['look', 'talk', 'flirt'],
      },
    ],
  },
  ...CHAPTER_TWO_ROOMS,
}

export const CITY_DESTINATIONS = [
  {
    id: 'convention-center',
    label: 'MONSTRIQUE Convention',
    availableInOpening: true,
  },
  {
    id: 'drive-in',
    label: 'Starlite Drive-In, Hexwater Beach',
    availableInOpening: false,
  },
  {
    id: 'joke-shop',
    label: 'Hex & Giggles Joke Shop',
    availableInOpening: false,
  },
  { id: 'mansion', label: 'Draculina’s Mansion', availableInOpening: false },
  {
    id: 'sewers',
    label: 'Sewers Beneath the Motel',
    availableInOpening: false,
  },
] as const

export const TOPICS: Record<string, string> = {
  'room-access': 'Access to Room 205',
  'unknown-visitor': 'Who else came to 205',
  'ice-clank': 'The double ice-machine clank',
  'knife-origin': 'Where the jewelled knife came from',
  'agent-deals': 'Everyone Odette ever cheated',
  'violet-witness': 'What Violet saw',
  'fan-alibi': 'Where Gavin was',
  'idol-schedule': 'Who is at the convention',
  'ghost-accounts': 'Why the ghosts disagree',
  'harker-files': 'The Harker Files',
  'violet-fee': 'Violet’s unpaid fee',
  'missing-fangs': 'Violet’s missing fangs',
  shrine: 'The Beach Hex shrine',
  'iris-neck': 'The plaster on Iris’s neck',
  'iris-tattoo': 'Iris’s lower-back tattoo',
  'norb-shirt': 'Norb’s MONSTRIQUE T-shirt',
  'workplace-conduct': 'Workplace conduct',
  'power-structures': 'Who has power over whom',
  ...REACTIVE_TOPICS,
  ...CHAPTER_TWO_TOPICS,
}

export const EVIDENCE: Record<string, string> = {
  'motel-photo': 'Photograph of the Last Call Motor Lodge',
  'guest-ledger': 'Register: Room 205, checked in by Marta personally',
  'double-murder': 'Two women dead in Room 205',
  'knife-photo': 'Jewelled knife photographed where it fell',
  'odette-photo': 'Odette’s position documented',
  'violet-photo': 'Violet’s position documented',
  'ice-timing': 'The double clank, timed',
  'neighbor-testimony': 'Dolores heard the ice arrive, then nothing',
  'ghost-odette': 'Odette: every Monstrique star had a motive',
  'ghost-violet': 'Violet: after the ice came, the door never opened',
  'odette-floating': 'Odette: “the knife floated, darling”',
  'fan-photo': 'Gavin’s time-stamped courtyard photographs',
  'fan-exonerated': 'Gavin’s alibi for the murders',
  'knife-prop-mark': 'Stamped STARLITE PICTURES · BEACH HEX · 1964',
  'idol-poster': 'Six Decades of Screams tour: who is in town',
  'harker-file': 'Harker File #1: the Beach Hex contracts',
  'shrine-photo': 'Lobby shrine: four Hexblades, five dents in the velvet',
  'ice-ring': 'An ice bucket was taken out of 205 after the murders',
  'makeup-smear': 'Skin-tone foundation on the missing ice bucket',
  'violet-scent': 'Violet smelled cold cream when the ice came',
  'fangs-detail': 'A rental serial number on Violet’s costume fangs',
  'compact-shade':
    'Odette’s compact is porcelain powder; the bucket smear is old tan greasepaint',
  ...CHAPTER_TWO_EVIDENCE,
}

export const ITEMS: Record<string, string> = {
  camera: 'Camera',
  'motel-key': 'Emergency key',
  'odette-purse': 'Odette’s purse',
  'plastic-fangs': 'Violet’s rental fangs',
  'garlic-protection': 'Garlic-scented protection',
  ...CHAPTER_TWO_ITEMS,
}

/** Characters whose good graces can be earned in this chapter. */
export const GRACES: Record<string, { name: string; max: number }> = {
  violet: { name: 'Violet Wisp', max: 2 },
  ...CHAPTER_TWO_GRACES,
}

const NORB_REBUFFS = [
  'Iris: Buy you a drink, boss? Norb: Fraternisation between staff is covered on page four of the handbook. I wrote the handbook. Focus.',
  'Iris: You’re cute when you deduce. Norb: Thank you for your feedback. It has been logged and will not be actioned.',
  'Iris: Share the bed tonight? Strictly for warmth. Norb: I have seen that bedspread under a blacklight. Also, I am your employer. Also, no.',
  'Iris: I could rub your shoulders. Norb: That is my hump, Iris. It is not a shoulder, and it is not available for rubbing.',
  'Iris: One kiss, for luck? Norb: Luck is not a recognised business expense. Neither is your mouth.',
  'Iris: You’re all about the case. What if I were the case? Norb: Then I would recuse myself.',
  'Iris: I’m wearing nothing under this trench coat. Norb: Then please button it. That is a workplace instruction, not a remark.',
]

/**
 * Sierra-style points: a running score out of 205, one point per room number.
 * Derived from evidence and flags, so saves need no new field. Points marked
 * `mature` come from optional mature-edition gags and never block anything.
 */
export const SCORE_TABLE: Array<{
  key: string
  points: number
  mature?: true
}> = [
  { key: 'motel-photo', points: 3 },
  { key: 'guest-ledger', points: 5 },
  { key: 'double-murder', points: 10 },
  { key: 'knife-photo', points: 10 },
  { key: 'odette-photo', points: 3 },
  { key: 'violet-photo', points: 3 },
  { key: 'ice-timing', points: 10 },
  { key: 'neighbor-testimony', points: 5 },
  { key: 'ghost-odette', points: 10 },
  { key: 'ghost-violet', points: 10 },
  { key: 'odette-floating', points: 8 },
  { key: 'fan-photo', points: 5 },
  { key: 'fan-exonerated', points: 10 },
  { key: 'knife-prop-mark', points: 12 },
  { key: 'idol-poster', points: 10 },
  { key: 'harker-file', points: 8 },
  { key: 'shrine-photo', points: 8 },
  { key: 'ice-ring', points: 6 },
  { key: 'makeup-smear', points: 8 },
  { key: 'violet-scent', points: 8 },
  { key: 'crime-room-access', points: 5 },
  { key: 'odette-hired-us', points: 5 },
  { key: 'stalker-reported', points: 5 },
  { key: 'fangs-found', points: 5 },
  { key: 'fangs-returned', points: 5 },
  { key: 'violet-paid', points: 5 },
  { key: 'city-lead', points: 10 },
  { key: 'billboard-shot', points: 2 },
  { key: 'ghost-kiss', points: 5, mature: true },
  { key: 'bought-protection', points: 3, mature: true },
  { key: 'rebuff-collector', points: 3, mature: true },
]

export function maxScore(audience: 'general' | 'mature' = 'mature'): number {
  return SCORE_TABLE.filter(
    (row) => audience === 'mature' || !row.mature,
  ).reduce((sum, row) => sum + row.points, 0)
}

export function caseScore(state: CaseState): number {
  return SCORE_TABLE.reduce((sum, row) => {
    const earned =
      row.key === 'rebuff-collector'
        ? state.rebuffs >= NORB_REBUFFS.length
        : state.evidence.includes(row.key) || state.flags.includes(row.key)
    return earned ? sum + row.points : sum
  }, 0)
}

export function chapterOf(state: Pick<CaseState, 'chapter'>): CaseChapter {
  return state.chapter === 2 ? 2 : 1
}

/** The running score for the chapter being played. */
export function chapterScore(
  state: CaseState,
  audience: 'general' | 'mature' = 'mature',
): number {
  return chapterOf(state) === 2
    ? chapterTwoScore(state, audience)
    : caseScore(state)
}

/** The most the chapter being played can score in this edition. */
export function chapterMaxScore(
  state: Pick<CaseState, 'chapter'>,
  audience: 'general' | 'mature' = 'mature',
): number {
  return chapterOf(state) === 2
    ? chapterTwoMaxScore(audience)
    : maxScore(audience)
}

/** "Chapter One has gone to press", in the chapter's own words. */
function pressLine(state: CaseState): string {
  return chapterOf(state) === 2
    ? 'Chapter Two has gone to press.'
    : 'Chapter One has gone to press.'
}

/** The sardonic narrator who answers when nothing sensible happens. */
const NARRATOR: Record<'look' | 'take' | 'use' | 'talk' | 'other', string[]> = {
  look: [
    'You look at the {t}. The {t} does not look back. Small mercies.',
    'It is exactly as seedy as everything else at the Last Call.',
  ],
  take: [
    'You can’t take the {t}. Well, you could, but Marta keeps a shotgun under the counter and a grudge in her heart.',
    'Iris reaches for the {t}. Somewhere, Norb feels a disturbance in the hygiene.',
    'Even by your standards, pocketing the {t} would be a lot.',
  ],
  use: [
    'You use the {t}. Nothing happens, which is the Last Call’s house speciality.',
    'Iris fiddles with the {t}. Norb sighs from a safe distance.',
    'That is not what the {t} is for. Probably. Nobody here reads instructions.',
  ],
  talk: [
    'You make conversation with the {t}. It is the best listener you’ve met tonight.',
    'The {t} has nothing to say. Rare, in this motel.',
  ],
  other: [
    'Good idea. Wrong motel.',
    'The narrator would love to help, but union rules forbid it.',
    'Nice try. That is worth zero points, but full marks for confidence.',
  ],
}

function narrate(state: CaseState, verb: Verb, label: string): string {
  const pool =
    verb === 'look' || verb === 'take' || verb === 'use' || verb === 'talk'
      ? NARRATOR[verb]
      : NARRATOR.other
  const line = pool[(state.transcript.length + state.seed) % pool.length]!
  return line.replaceAll('{t}', label.toLowerCase())
}

/** Every wrong combination gets a joke (Thimbleweed rule). */
const WRONG_ITEM: Record<string, Record<string, string>> = {
  'plastic-fangs': {
    marta:
      'Marta: Put those away, honey. I’ve seen fangs. I’ve seen worse than fangs. I’ve seen the 1974 reunion special.',
    'odette-ghost':
      'Odette: Darling, the whole point was that SHE wore them. Do keep up.',
    gavin: 'Iris: No. He’d sell them online before the ice melted.',
    neighbor:
      'Dolores: Oh, are those from the Beach Hex collector set? No? Then keep them, sweetie.',
  },
  'odette-purse': {
    marta:
      'Iris slides a fifty across the counter. Marta: Bribes go through the front desk, honey, and I am the front desk. Keep it. I like you.',
    nico: 'Norb: Money is the dirtiest object in America. Do not hand me a purse full of it.',
    gavin:
      'Iris: I am not paying you to stop being a creep. That should be free.',
    neighbor:
      'Dolores: Keep your money, sweetie. I’d gossip for free. I DO gossip for free.',
  },
  'motel-key': {
    nico: 'Norb: Forty years of guests have held that key. Hang it on the door, not near my person.',
    'odette-ghost':
      'Odette: I already have a room, darling. Forever, apparently.',
  },
  'garlic-protection': {
    nico: 'Norb: I am already wearing two layers of protection, Iris. They are called gloves.',
    'violet-ghost':
      'Violet: Garlic flavour? On a vampire job? Honey, I’m a ghost now. That ship sailed straight through the wall.',
    'odette-ghost':
      'Odette: Garlic? I hired a vampire, darling, not an Italian restaurant.',
    marta: 'Marta: We sell those, hon. No refunds. Nobody wants to know why.',
    neighbor: 'Dolores: At my age? Sweetie, I wish.',
    gavin:
      'Iris: Absolutely not. Not even as a joke. Especially not as a joke.',
    'mummy-actress':
      'Cleo: I have been wrapped for three thousand years, darling. I do not need another layer.',
  },
}

export function newCase(seed = 1): CaseState {
  return {
    version: 3,
    seed,
    room: 'motel-exterior',
    actor: 'iris',
    flags: [],
    evidence: [],
    topics: [],
    inventory: ['camera'],
    asked: [],
    transcript: [
      'Norb: Our client is in Room 205, Iris. She is also dead. You will handle every object. I will handle the thinking.',
    ],
    gratitude: {},
    rebuffs: 0,
    ending: null,
  }
}

function copyState(state: CaseState): CaseState {
  const next: CaseState = {
    ...state,
    flags: [...state.flags],
    evidence: [...state.evidence],
    topics: [...state.topics],
    inventory: [...state.inventory],
    asked: [...state.asked],
    transcript: [...state.transcript],
    gratitude: { ...state.gratitude },
  }
  if (state.filed) next.filed = [...state.filed]
  if (state.deductions) next.deductions = [...state.deductions]
  return next
}
function add(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value)
}
function drop(list: string[], value: string): void {
  const index = list.indexOf(value)
  if (index >= 0) list.splice(index, 1)
}
function has(state: CaseState, value: string): boolean {
  return (
    state.evidence.includes(value) ||
    state.flags.includes(value) ||
    state.inventory.includes(value)
  )
}
function grace(state: CaseState, who: string): number {
  return state.gratitude[who] ?? 0
}
function thank(state: CaseState, who: string): void {
  const max = GRACES[who]?.max ?? 0
  state.gratitude[who] = Math.min(max, grace(state, who) + 1)
}
function withLine(state: CaseState, line: string, changed = true): CaseResult {
  if (!changed) return { state, line, changed: false }
  return {
    state: { ...state, transcript: [...state.transcript, line] },
    line,
    changed,
  }
}

export function switchInvestigator(state: CaseState): CaseResult {
  if (state.ending)
    return withLine(state, 'This report has already gone to press.', false)
  const actor: Investigator = state.actor === 'iris' ? 'nico' : 'iris'
  const line =
    actor === 'nico'
      ? 'Norb: I will investigate with my eyes. Nobody touch the carpet.'
      : 'Iris: I’ll do the touching. You keep having brilliant thoughts at a safe distance.'
  return withLine({ ...state, actor }, line)
}

/**
 * Why a room is closed to this case right now, or null when Iris may enter.
 * Chapter Two rooms need Chapter Two plus their own lead.
 */
export function roomLock(state: CaseState, room: RoomId): string | null {
  if (isChapterTwoRoom(room)) {
    if (chapterOf(state) !== 2) return CHAPTER_TWO_LOCKED['drive-in']
    return has(state, CHAPTER_TWO_GATES[room].flag)
      ? null
      : CHAPTER_TWO_LOCKED[room]
  }
  if (room === 'odette-room' && !has(state, 'crime-room-access'))
    return 'Room 205 is sealed. Find a legitimate way in, or at least a plausible one.'
  if (
    (room === 'city-map' || room === 'convention-center') &&
    !has(state, 'city-lead')
  )
    return 'Norb: The city can wait until the motel evidence points somewhere.'
  return null
}

export function travel(state: CaseState, destination: RoomId): CaseResult {
  if (state.ending) return withLine(state, pressLine(state), false)
  if (!HOTEL_ROOMS[state.room].exits.includes(destination))
    return withLine(
      state,
      'There is no direct way there from this room.',
      false,
    )
  const lock = isChapterTwoRoom(destination)
    ? roomLock(state, destination)
    : null
  if (lock) return withLine(state, lock, false)
  if (destination === 'odette-room' && !has(state, 'crime-room-access'))
    return withLine(
      state,
      'Room 205 is sealed. Find a legitimate way in, or at least a plausible one.',
      false,
    )
  if (destination === 'city-map' && !has(state, 'city-lead'))
    return withLine(
      state,
      'Norb: The city can wait until the motel evidence points somewhere.',
      false,
    )
  const next = copyState(state)
  next.room = destination
  if (destination === 'odette-room') {
    add(next.flags, 'double-murder-discovered')
    add(next.evidence, 'double-murder')
    add(next.topics, 'ghost-accounts')
    add(next.topics, 'knife-origin')
  }
  return withLine(next, HOTEL_ROOMS[destination].caption)
}

/** Who answers which Chapter One topic. */
export const CHAPTER_ONE_TOPIC_TARGETS: Record<string, string[]> = {
  marta: [
    'room-access',
    'unknown-visitor',
    'shrine',
    'iris-neck',
    'norb-shirt',
  ],
  neighbor: ['unknown-visitor', 'ice-clank', 'iris-neck', 'iris-tattoo'],
  nico: [
    'knife-origin',
    'ghost-accounts',
    'ice-clank',
    'harker-files',
    'norb-shirt',
    'iris-neck',
    'workplace-conduct',
    'power-structures',
  ],
  gavin: ['fan-alibi'],
  'odette-ghost': [
    'agent-deals',
    'ghost-accounts',
    'knife-origin',
    'harker-files',
    'violet-fee',
    'iris-neck',
    'iris-tattoo',
  ],
  'violet-ghost': [
    'violet-witness',
    'ice-clank',
    'ghost-accounts',
    'missing-fangs',
    'violet-fee',
    'iris-neck',
  ],
}

/** Every topic a character can be asked about, in any chapter. */
export function topicsFor(target: string): string[] {
  return [
    ...(CHAPTER_ONE_TOPIC_TARGETS[target] ?? []),
    ...(REACTIVE_TOPIC_TARGETS[target] ?? []),
    ...(CHAPTER_TWO_TOPIC_TARGETS[target] ?? []),
  ]
}

export function availableTopics(state: CaseState, target: string): string[] {
  return topicsFor(target).filter(
    (topic) =>
      state.topics.includes(topic) &&
      !state.asked.includes(state.actor + ':' + target + ':' + topic),
  )
}

/** Characters who live in a Chapter Two room answer from Chapter Two on. */
const CHAPTER_TWO_TARGETS = new Set(
  Object.values(HOTEL_ROOMS)
    .filter((room) => isChapterTwoRoom(room.id))
    .flatMap((room) => room.hotspots.map((hotspot) => hotspot.id)),
)

/** The characters who can answer a topic in the chapter being played. */
export function topicAnswerers(
  topic: string,
  chapter: CaseChapter = 1,
): string[] {
  const targets = new Set([
    ...Object.keys(CHAPTER_ONE_TOPIC_TARGETS),
    ...Object.keys(REACTIVE_TOPIC_TARGETS),
    ...Object.keys(CHAPTER_TWO_TOPIC_TARGETS),
  ])
  return [...targets].filter(
    (target) =>
      topicsFor(target).includes(topic) &&
      (chapter === 2 || !CHAPTER_TWO_TARGETS.has(target)),
  )
}

function askedBy(state: CaseState, target: string, topic: string) {
  return (['iris', 'nico'] as const).filter((actor) =>
    state.asked.includes(actor + ':' + target + ':' + topic),
  )
}

/**
 * How a discovered topic reads on a character's question list: `new` when
 * nobody has asked them, `echo` when the other investigator already has
 * (this one can still ask, for a second opinion), `spent` when this one has.
 */
export type TopicStatus = 'new' | 'echo' | 'spent'
export function topicChips(
  state: CaseState,
  target: string,
): Array<{ topic: string; status: TopicStatus }> {
  return topicsFor(target)
    .filter((topic) => state.topics.includes(topic))
    .map((topic) => {
      const asked = askedBy(state, target, topic)
      const status: TopicStatus = asked.includes(state.actor)
        ? 'spent'
        : asked.length
          ? 'echo'
          : 'new'
      return { topic, status }
    })
}

/**
 * Dialogue exhaustion: a discovered topic is exhausted once everyone who can
 * answer it in this chapter has been asked by Iris or Norb. A note with no
 * one to ask (a lead) is never exhausted.
 */
export function topicExhausted(state: CaseState, topic: string): boolean {
  if (!state.topics.includes(topic)) return false
  const answerers = topicAnswerers(topic, chapterOf(state))
  return (
    answerers.length > 0 &&
    answerers.every((target) => askedBy(state, target, topic).length > 0)
  )
}

function interview(
  state: CaseState,
  target: string,
  topic: string,
): CaseResult {
  if (!availableTopics(state, target).includes(topic))
    return withLine(
      state,
      'You have not discovered that question or already asked it.',
      false,
    )
  const next = copyState(state)
  add(next.asked, state.actor + ':' + target + ':' + topic)
  const iris = state.actor === 'iris'
  const key = target + ':' + topic
  const chapterTwo = chapterTwoInterview(state, next, target, topic)
  if (chapterTwo) return chapterTwo
  const reaction = reactiveLine(next, target, topic)
  if (reaction) {
    if (reaction.flag) add(next.flags, reaction.flag)
    return withLine(next, reaction.line)
  }

  switch (key) {
    case 'marta:room-access':
      add(next.flags, 'crime-room-access')
      add(next.inventory, 'motel-key')
      return withLine(
        next,
        iris
          ? 'Marta: Press badge, dead guest, man in gloves. Fine. Emergency key. Bring it back without fingerprints, or with yours.'
          : 'Marta: I’ll give the key to Iris, Norb. You asked if I’d boiled it.',
      )
    case 'marta:unknown-visitor':
      add(next.evidence, 'guest-ledger')
      return withLine(
        next,
        'Marta: Nobody signed in after them. I brought their ice up myself at ten and went straight back down. Ask the machine, it keeps better time than I do.',
      )
    case 'marta:shrine':
      return withLine(
        next,
        'Marta: The Beach Hex girls stayed here in ’64, shooting the drive-in pictures. Before they were famous. I was a fan. Everybody was. Now sign the register or stop leaning on my counter.',
      )
    case 'neighbor:unknown-visitor':
      add(next.evidence, 'neighbor-testimony')
      add(next.flags, 'crime-room-access')
      add(next.topics, 'ice-clank')
      return withLine(
        next,
        iris
          ? 'Dolores: Two women, giggling. Room service with the ice. Then giggling of a more professional kind. Then a thump. Nobody knocked and nobody left. The fire escape goes past their window, if you’re nosy.'
          : 'Dolores: Two voices, then none, young man. You can stand right there. I don’t bite. Unlike her costume.',
      )
    case 'neighbor:ice-clank':
      add(next.evidence, 'ice-timing')
      return withLine(
        next,
        'Dolores: The ice machine clanked twice right before the thump. My clock runs five minutes fast, same as my mouth.',
      )
    case 'nico:knife-origin':
      if (has(next, 'knife-photo')) add(next.evidence, 'knife-prop-mark')
      return withLine(
        next,
        has(next, 'knife-photo')
          ? 'Norb: Enlarge your photo. STARLITE PICTURES, BEACH HEX, 1964. A Beach Hex stage prop. And a smudge of skin-tone makeup on the hilt.'
          : 'Norb: Photograph the knife where it fell. I am not going within arm’s length of a blade with history.',
      )
    case 'nico:ice-clank':
      add(next.topics, 'ghost-accounts')
      return withLine(
        next,
        'Norb: The ice machine gives us a clock. Now we ask both dead women what happened on it.',
      )
    case 'nico:ghost-accounts':
      return withLine(
        next,
        'Norb: Two witnesses, two halves. Odette watched Violet; Violet watched the door. Neither saw a killer come in. So either nobody did, or somebody did and nobody saw.',
      )
    case 'nico:harker-files':
      return withLine(
        next,
        'Norb: Blackmail is a deplorable currency. File it alphabetically.',
      )
    case 'odette-ghost:agent-deals':
      add(next.evidence, 'ghost-odette')
      add(next.topics, 'idol-schedule')
      return withLine(
        next,
        iris
          ? 'Odette: Every star in Monstrique wanted me dead, darling. That’s how you know I was good at my job. Start with the girls at the convention.'
          : 'Odette: My clients were monsters, little man. Not all of them supernatural.',
      )
    case 'odette-ghost:ghost-accounts':
      add(next.evidence, 'odette-floating')
      return withLine(
        next,
        'Odette: I was looking at her. Who wouldn’t? Then the knife floated, darling. I assumed it was the gin.',
      )
    case 'odette-ghost:knife-origin':
      return withLine(
        next,
        'Odette: Darling, I’ve been stabbed in the back by every girl in that band. This is the first time anyone used cutlery.',
      )
    case 'odette-ghost:harker-files':
      add(next.evidence, 'harker-file')
      add(next.evidence, 'ghost-odette')
      add(next.topics, 'idol-schedule')
      return withLine(
        next,
        iris
          ? 'Odette: Sixty years of who’s older than her bio, who can’t sing and who slept with which director. File One is yours: the Beach Hex contracts. Norb: This is unethical. Iris, take notes.'
          : 'Odette: My files, little man. Retainer paid. Don’t look so pale, I’m the one who’s dead.',
      )
    case 'odette-ghost:violet-fee':
      add(next.flags, 'odette-refused-fee')
      return withLine(
        next,
        'Odette: Pay her? She didn’t finish the job. Violet: You DIED. Odette: Details. My purse stays where it is.',
      )
    case 'violet-ghost:violet-witness':
      add(next.evidence, 'ghost-violet')
      add(next.topics, 'ice-clank')
      return withLine(
        next,
        iris
          ? 'Violet: The ice came. Then nobody came in. I was watching the door in the mirror the whole time, professional habit. The door never opened. The knife came anyway.'
          : 'Violet: I count exits, honey. One door, one window, zero people. And still.',
      )
    case 'violet-ghost:ice-clank':
      return withLine(
        next,
        'Violet: Two clanks downstairs, right before. I remember thinking it sounded like applause.',
      )
    case 'violet-ghost:ghost-accounts':
      return withLine(
        next,
        'Violet: She was looking at me. I was looking at the door. That’s the part that scares me, and I’m a ghost.',
      )
    case 'violet-ghost:missing-fangs':
      add(next.flags, 'fangs-lost')
      if (has(next, 'fangs-found'))
        return withLine(
          next,
          'Violet: My fangs fell in the ice bucket when I laughed. Wait. Is that them in your pocket? Forty-dollar deposit, honey. Hand them over.',
        )
      return withLine(
        next,
        'Violet: My fangs fell in the ice bucket when I laughed. Rental, forty-dollar deposit. Now the bucket’s gone, and I’d love to know who tidies up at a murder.',
      )
    case 'violet-ghost:violet-fee':
      return withLine(
        next,
        'Violet: Four hundred for the night, cape included. She didn’t book a vampire, she booked Draculina: the wig, the accent, the whole Countess. A lifetime of pent-up whatever. I gave a great performance. I’d like to be paid for it.',
      )
    case 'nico:norb-shirt':
      return withLine(
        next,
        'Iris: Nice shirt, boss. Big Monstrique fan? Norb: A woman in a fly costume handed it to me at the convention. My hands were full. Wearing it was the most efficient way to carry it. Iris: That was three days ago. Norb: It is still being carried.',
      )
    case 'marta:norb-shirt':
      return withLine(
        next,
        'Marta: Your boss wears a hot-pink souvenir shirt under a bow tie. Norb: It is not a fashion statement, madam. It is a logistics solution. Marta: Honey, it is both, and both are bad.',
      )
    case 'nico:iris-neck':
      return withLine(
        next,
        'Norb: Iris, that plaster is not sterile and neither, I suspect, is the situation beneath it. Iris: New boyfriend. He’s a real necker. Can’t get enough. Norb: I did not ask about the boyfriend. I asked about the plaster. Change it.',
      )
    case 'marta:iris-neck':
      return withLine(
        next,
        'Marta: That a shaving cut, hon? Iris: Boyfriend. Real necker. Marta: In my day we called that a turtleneck and kept quiet about it.',
      )
    case 'neighbor:iris-neck':
      return withLine(
        next,
        'Dolores: Is that a love bite under there? In 1974 we called the police. In 1975 we called him back.',
      )
    case 'odette-ghost:iris-neck':
      return withLine(
        next,
        'Odette: Darling, who has been chewing on my investigator? Iris: New boyfriend. Real necker. Odette: Get him to sign something before he draws blood. Everybody signs something.',
      )
    case 'violet-ghost:iris-neck':
      return withLine(
        next,
        'Violet: I wore fangs for a living, honey. That’s not a hickey, that’s a lease. Does he ever come out in daylight? Iris: He works nights. Violet: Mm-hm.',
      )
    case 'neighbor:iris-tattoo':
      return withLine(
        next,
        'Dolores: Is that the Silver Bite logo on your lower back? Iris: Midnight High. Everybody got one. I rocked it. Dolores: Sweetie, you still do.',
      )
    case 'odette-ghost:iris-tattoo':
      return withLine(
        next,
        'Odette: That logo is a registered trademark, darling. You owe the estate ten percent of your lower back. Iris: Sue me. Odette: I would, but I’m dead and you’re the only one who can pick up a pen.',
      )
    case 'nico:workplace-conduct':
      add(next.topics, 'power-structures')
      return withLine(
        next,
        'Norb: Iris, that is the third advance this shift. I am obliged to inform you that this constitutes sexual harassment. Probably. I will not be filing. Iris: Harassment? Boss, you sign my paycheques. Power runs downhill, and I live at the bottom of the hill.',
      )
    case 'nico:power-structures':
      return withLine(
        next,
        'Norb: You assume power is purely positional. You hold the camera, the car keys and the only working pair of hands at The Unwashed Truth. Withdraw your labour and I am a man in gloves shouting at a crime scene. Iris: So the worker controls the means of production. Norb: The means of photography. Capital still owns us both, Iris, but leverage is not ownership. Which is why I ask you, as your employer, to stop, and, as a materialist, to unionise. Iris: Is that a no on dinner? Norb: It is a no on dinner. Clock in.',
      )
    case 'gavin:fan-alibi':
      add(next.evidence, 'fan-photo')
      if (has(next, 'ice-timing') || has(next, 'neighbor-testimony'))
        add(next.evidence, 'fan-exonerated')
      return withLine(
        next,
        'Gavin: I was out front shooting the billboard. The timestamps prove it! Iris: They also prove you shoot through windows. I’m reporting you either way.',
      )
  }
  return withLine(
    next,
    iris
      ? 'Iris: Noted. I’ll check it against the other witness.'
      : 'Norb: A hypothesis is not evidence, however tidily arranged.',
  )
}

function flirt(state: CaseState, target: string): CaseResult {
  if (state.actor === 'nico')
    return withLine(
      state,
      'Norb: I do not flirt. I make eye contact in short, sanitary bursts.',
      false,
    )
  if (target === 'gavin')
    return withLine(state, 'Iris: No. Not even for the plot.', false)
  const next = copyState(state)
  add(next.flags, 'flirted-' + target)
  const chapterTwo = chapterTwoFlirt(state, next, target)
  if (chapterTwo) return chapterTwo
  if (target === 'nico') {
    const line = NORB_REBUFFS[next.rebuffs % NORB_REBUFFS.length]!
    next.rebuffs += 1
    if (next.rebuffs >= 3) add(next.topics, 'workplace-conduct')
    return withLine(next, line)
  }
  if (target === 'violet-ghost') {
    const level = grace(next, 'violet')
    if (level >= 2 && !has(next, 'ghost-kiss')) {
      add(next.flags, 'ghost-kiss')
      return withLine(
        next,
        'Violet: Fangs back, fee paid. Come here, you. The kiss is cold as the ice machine and twice as loud. When Iris opens her eyes her lips are numb, Odette is clapping sarcastically, and Norb is in the hallway, facing the wall.',
      )
    }
    if (level >= 2)
      return withLine(
        next,
        'Violet: Same time tomorrow? I’m not going anywhere. Literally.',
      )
    if (level === 1)
      return withLine(
        next,
        'Violet: You’re sweet. Square the rest of my night, and maybe I’ll show you why I charge what I charge.',
      )
    return withLine(
      next,
      'Violet: Honey, I’m off the clock AND dead. That’s two reasons.',
    )
  }
  const lines: Record<string, string> = {
    'odette-ghost': has(next, 'ghost-kiss')
      ? 'Odette: Oh, she gets a kiss and I get a murder. Typical.'
      : 'Odette: Darling, I represent girls like you. I don’t date them.',
    marta:
      'Marta: Honey, nobody’s looked at me in sixty years. I’d like to keep it that way.',
    neighbor:
      'Dolores: I’m seventy-four, sweetie, and I heard what went on in 205. You couldn’t keep up.',
    'mummy-actress':
      'Cleo: Three thousand years, sweetheart, and you’re the first to try a bandage joke this hour. Take a number behind the pharaohs.',
  }
  return withLine(
    next,
    lines[target] ?? 'Iris winks. Nobody notices. Story of her week.',
  )
}

function useItem(state: CaseState, item: string, target: string): CaseResult {
  if (!state.inventory.includes(item))
    return withLine(state, 'You are not carrying that.', false)
  if (state.actor === 'nico')
    return withLine(
      state,
      'Norb: Hand it to Iris. I do not hold things. I hold opinions.',
      false,
    )
  const next = copyState(state)
  const chapterTwo = chapterTwoItem(state, next, item, target)
  if (chapterTwo) return chapterTwo
  if (item === 'plastic-fangs' && target === 'violet-ghost') {
    drop(next.inventory, item)
    add(next.flags, 'fangs-returned')
    add(next.evidence, 'violet-scent')
    thank(next, 'violet')
    return withLine(
      next,
      'Violet: My fangs! You’re a doll. Funny, holding them I remember: when the ice came in, I smelled cold cream. Like a dressing room.',
    )
  }
  if (item === 'odette-purse' && target === 'violet-ghost') {
    drop(next.inventory, item)
    add(next.flags, 'violet-paid')
    thank(next, 'violet')
    return withLine(
      next,
      has(next, 'odette-refused-fee')
        ? 'Iris counts four hundred in fifties onto the bed. Violet: Paid in full. Odette: That was my cab fare to the afterlife! Iris: You’re not going anywhere.'
        : 'Violet: Paid in full, and the client didn’t even argue. Odette: I would have, if anybody had asked me.',
    )
  }
  if (item === 'odette-purse' && target === 'odette-ghost')
    return withLine(
      state,
      'Odette: Darling, I can’t hold it. That’s rather the problem with being dead.',
      false,
    )
  if (item === 'plastic-fangs' && target === 'nico')
    return withLine(
      state,
      'Norb: Those have been in a stranger’s mouth AND an ice machine. Take three steps back.',
      false,
    )
  if (item === 'motel-key' && target === 'room-door')
    return withLine(
      state,
      has(state, 'crime-room-access')
        ? 'Iris: It’s unlocked now. Just walk in from the balcony.'
        : 'The key turns. Somebody will want to know who gave it to you.',
      false,
    )
  if (item === 'garlic-protection' && target === 'vending-machine')
    return withLine(
      state,
      'Iris tries to return it. The machine eats the receipt and clanks twice in contempt.',
      false,
    )
  const joke = WRONG_ITEM[item]?.[target]
  if (joke) return withLine(state, joke, false)
  return withLine(
    state,
    'Iris tries the ' +
      (ITEMS[item] ?? item).toLowerCase() +
      ' on it. Nothing happens, except Norb sighing.',
    false,
  )
}

/**
 * Two-clue combination: Odette's compact, photographed beside the camera's
 * colour card, only means something once Iris has seen the bucket smear.
 */
function photographCompact(state: CaseState): CaseResult {
  if (state.evidence.includes('compact-shade'))
    return withLine(
      state,
      'Iris already has the compact on film. Norb: Twice would be vanity.',
      false,
    )
  if (!state.evidence.includes('makeup-smear'))
    return withLine(
      state,
      'Iris snaps Odette’s powder compact against the camera’s colour card: porcelain, shade “Hex White”. Norb: A colour with nothing to compare it to is just a colour. Find me a second sample.',
      false,
    )
  const next = copyState(state)
  add(next.evidence, 'compact-shade')
  return withLine(
    next,
    'Iris photographs Odette’s compact against the camera’s colour card, then the bucket smear beside it. Porcelain powder on one; thick tan greasepaint on the other, a shade nobody has sold since 1965. Norb: Not the victim’s face, then. Somebody who still paints on an old-fashioned face carried that bucket.',
  )
}

/** Records a deduction and whatever it adds to the case. */
function noteDeduction(
  state: CaseState,
  id: string,
  grants?: DeductionGrants,
): void {
  const deductions = [...deductionsOf(state)]
  add(deductions, id)
  state.deductions = deductions
  for (const clue of grants?.evidence ?? []) add(state.evidence, clue)
  for (const flag of grants?.flags ?? []) add(state.flags, flag)
  for (const topic of grants?.topics ?? []) add(state.topics, topic)
}

/**
 * The shared notebook: two clues side by side. Comparing is thinking, not
 * touching, so Norb may do it too. Misses get a joke and change nothing.
 */
function compareClues(
  state: CaseState,
  first: string,
  second: string,
): CaseResult {
  if (
    first === second ||
    !state.evidence.includes(first) ||
    !state.evidence.includes(second)
  )
    return withLine(
      state,
      'Pick two different clues from the notebook to compare.',
      false,
    )
  const comparison = findComparison(first, second)
  if (!comparison)
    return withLine(
      state,
      COMPARE_MISSES[
        (state.transcript.length + state.seed) % COMPARE_MISSES.length
      ]!,
      false,
    )
  if (deductionsOf(state).includes(comparison.id))
    return withLine(
      state,
      'Norb: That deduction is already in the notebook, Iris. In ink.',
      false,
    )
  const next = copyState(state)
  noteDeduction(next, comparison.id, comparison.grants)
  return withLine(next, comparison.line)
}

/**
 * The ghosts' shared topics open as soon as the testimony they react to is
 * in the notebook, and once each ghost has vouched for the other, their
 * agreement is a deduction of its own.
 */
function noteReactions(result: CaseResult): CaseResult {
  const state = result.state
  const topics = Object.entries(REACTIVE_TOPIC_SOURCES)
    .filter(
      ([topic, source]) =>
        state.evidence.includes(source) && !state.topics.includes(topic),
    )
    .map(([topic]) => topic)
  const agree =
    state.flags.includes(VIOLET_BACKS_ODETTE) &&
    state.flags.includes(ODETTE_BACKS_VIOLET) &&
    !deductionsOf(state).includes(GHOSTS_AGREE.id)
  if (!topics.length && !agree) return result
  return {
    ...result,
    state: {
      ...state,
      topics: [...state.topics, ...topics],
      ...(agree
        ? { deductions: [...deductionsOf(state), GHOSTS_AGREE.id] }
        : {}),
    },
  }
}

function combineItems(
  state: CaseState,
  first: string,
  second: string,
): CaseResult {
  if (state.actor === 'nico')
    return withLine(
      state,
      'Norb: My gloves are not rated for arts and crafts, Iris.',
      false,
    )
  if (
    first === second ||
    !state.inventory.includes(first) ||
    !state.inventory.includes(second)
  )
    return withLine(
      state,
      'Iris needs two different items from her own pockets.',
      false,
    )
  const chapterTwo = chapterTwoCombine(state, first, second)
  if (chapterTwo) return chapterTwo
  if (
    (first === 'camera' && second === 'plastic-fangs') ||
    (first === 'plastic-fangs' && second === 'camera')
  ) {
    if (state.evidence.includes('fangs-detail'))
      return withLine(
        state,
        'Iris already has a close-up of the rental stamp.',
        false,
      )
    const next = copyState(state)
    add(next.evidence, 'fangs-detail')
    return withLine(
      next,
      'Iris photographs the fangs beside her camera lens. A tiny costume-rental number is scratched into the hinge. Norb: Finally, a lead with decent lighting.',
    )
  }
  if (
    (first === 'camera' && second === 'odette-purse') ||
    (first === 'odette-purse' && second === 'camera')
  )
    return photographCompact(state)
  return withLine(
    state,
    'Iris tries the ' +
      (ITEMS[first] ?? first).toLowerCase() +
      ' with the ' +
      (ITEMS[second] ?? second).toLowerCase() +
      '. The laws of chemistry and comedy decline to cooperate.',
    false,
  )
}

export function performAction(
  state: CaseState,
  action: CaseAction,
): CaseResult {
  const result = performCaseAction(state, action)
  return result.changed ? noteReactions(result) : result
}

function performCaseAction(state: CaseState, action: CaseAction): CaseResult {
  if (state.ending) return withLine(state, pressLine(state), false)
  if (action.verb === 'compare')
    return compareClues(state, action.target, action.item ?? '')
  if (action.verb === 'combine')
    return combineItems(state, action.item ?? '', action.target)
  const hotspot = HOTEL_ROOMS[state.room].hotspots.find(
    (item) => item.id === action.target,
  )
  if (hotspot && action.item) return useItem(state, action.item, action.target)
  if (!hotspot)
    return withLine(
      state,
      'There is nothing useful to do with that here.',
      false,
    )
  if (!hotspot.verbs.includes(action.verb))
    return withLine(state, narrate(state, action.verb, hotspot.label), false)
  if (
    state.actor === 'nico' &&
    ['take', 'use', 'photograph'].includes(action.verb)
  )
    return withLine(
      state,
      'Norb: Touch that? Absolutely not. Iris, please.',
      false,
    )
  if (action.verb === 'ask')
    return interview(state, action.target, action.topic ?? '')
  if (action.verb === 'flirt') return flirt(state, action.target)
  const next = copyState(state)
  const target = action.target
  const verb = action.verb
  const iris = state.actor === 'iris'
  const chapterTwo = chapterTwoVerb(state, next, verb, target)
  if (chapterTwo) return chapterTwo

  const hunch = verb === 'look' && !iris ? norbHunch(state) : null
  if (hunch && hunch.hotspot === target) {
    noteDeduction(next, hunch.id, hunch.grants)
    return withLine(next, hunch.line)
  }

  if (verb === 'look') {
    if (target === 'guest-ledger') {
      add(next.evidence, 'guest-ledger')
      add(next.topics, 'room-access')
    } else if (target === 'ice-machine' || target === 'maintenance-log') {
      add(next.topics, 'ice-clank')
    } else if (target === 'memorabilia-case') {
      add(next.topics, 'shrine')
    } else if (target === 'odette-purse') {
      add(next.topics, 'violet-fee')
    } else if (target === 'nico') {
      add(next.topics, 'norb-shirt')
    } else if (target === 'ice-ring') {
      add(next.evidence, 'ice-ring')
    } else if (target === 'knife') {
      add(next.topics, 'knife-origin')
      if (!iris && has(next, 'knife-photo'))
        add(next.evidence, 'knife-prop-mark')
    } else if (target === 'drive-in' && chapterOf(state) === 2) {
      return withLine(
        next,
        'Iris: The Starlite Drive-In, out on Hexwater Beach, where the 1964 Beach Hex pictures still play. Norb: Use the exits, Iris. I will sit on the towel.',
      )
    } else if (
      target === 'mansion' ||
      target === 'joke-shop' ||
      target === 'sewers' ||
      target === 'drive-in'
    ) {
      return withLine(
        state,
        'Norb: A later chapter. Tonight we follow the only lead we have earned.',
        false,
      )
    }
    const observations: Record<string, string> = {
      knife: iris
        ? 'Iris: A jewelled show knife, gaudy as a showgirl. I should photograph it right where it fell.'
        : has(state, 'knife-photo')
          ? 'Norb: In your photograph: a studio stamp on the guard, and makeup on the hilt. Skin tone. Not Violet’s white vampire base.'
          : 'Norb: Photograph it first. I will study the picture, not the weapon.',
      'odette-body':
        'Iris: Fifty-eight, they say. Her ghost looks thirty-five. Violet: Ghosts look how they feel. She always felt thirty-five.',
      'violet-body':
        'Iris: Violet, still in the cape. She deserves this solved as much as her client does.',
      'odette-purse':
        'Iris: Lipstick, a flask, a powder compact and four hundred dollars in fifties. Odette: Don’t you dare.',
      'ice-ring':
        'Iris: A wet ring where an ice bucket stood. The bucket’s gone. Somebody came back for it. Or never left.',
      'ice-machine':
        'Norb: A distinct double clank, every few minutes. A very unromantic metronome.',
      'memorabilia-case':
        'Iris: The 1964 Beach Hex line-up: vampire, werewolf, lagoon girl, mummy. Four jewelled Hexblades on velvet. Marta: Don’t smudge the glass.',
      gavin:
        'Iris: A creep with a telephoto lens. Creepy isn’t the same as killer.',
      'sewer-hatch':
        'Something large is singing Monstrique songs under the grate, slightly flat.',
      nico: 'Iris: Four foot eleven of hump, shuffle and pure deduction, double-gloved, in a hot-pink MONSTRIQUE T-shirt under a bow tie. Somehow he’s even cuter when he’s horrified.',
      'odette-ghost':
        'Iris: Silver-blue, impatient and fabulous. She keeps trying to fix her hair in a mirror she no longer appears in.',
      'violet-ghost':
        'Iris: Rented cape, bare gums, sharp eyes. She keeps glancing at the door, like she’s still on the job.',
      marta:
        'Iris: Gloves, scarf and thick foundation in July. Very old Hollywood.',
      'mummy-actress':
        'Iris: Cleo Pappatra. Three thousand years old, and the paparazzi still can’t find her bad side.',
      billboard:
        'Iris: Four monster girls forty feet tall, and the caption says REAWAKENED. Odette signed off on that pun. It shows.',
      'vending-machine':
        'Iris: Mints, aspirin, one sad comb, and “NIGHT SHIFT PROTECTION: Garlic Scented, For the Monster in Your Life.” Norb: Do not read the rest aloud.',
      bedspread:
        'Iris: One bed, two investigators. Norb: I will be sleeping in the bathtub. In my coat. Fully sealed.',
    }
    return withLine(
      next,
      observations[target] ?? HOTEL_ROOMS[state.room].caption,
    )
  }
  if (target === 'motel-sign' && verb === 'photograph') {
    add(next.evidence, 'motel-photo')
    return withLine(
      next,
      'Iris: LAST CALL MOTOR LODGE, with the L burnt out. AST CALL. Norb: Do not put that in the headline.',
    )
  }
  if (target === 'billboard' && verb === 'photograph') {
    add(next.flags, 'billboard-shot')
    return withLine(
      next,
      'Iris: Click. Forty-foot Monstrique girls over a murder motel. Norb: Crop the motel. Our readers have weak stomachs.',
    )
  }
  if (target === 'vending-machine' && verb === 'use') {
    if (has(next, 'bought-protection'))
      return withLine(
        state,
        'Iris: One pack is optimism. Two is a strategy. Norb: Neither is a clue.',
        false,
      )
    add(next.flags, 'bought-protection')
    add(next.inventory, 'garlic-protection')
    return withLine(
      next,
      'Iris thumps the machine. It drops a free pack of garlic-scented protection. Norb: I am not going to ask. Iris: You never do, boss.',
    )
  }
  if (target === 'bedspread' && verb === 'use') {
    if (!iris)
      return withLine(
        state,
        'Norb: I have seen that bedspread under a blacklight. I will not be using it in any sense of the word.',
        false,
      )
    return withLine(
      next,
      'Iris flops onto the bed and pats the space beside her. Norb steps onto the balcony and closes the door. Through the wall: “The CASE, Iris.”',
    )
  }
  if (target === 'guest-ledger' && verb === 'photograph') {
    add(next.evidence, 'guest-ledger')
    add(next.topics, 'room-access')
    return withLine(
      next,
      'Iris: ODETTE HARKER + GUEST, Room 205. Checked in by Marta herself, and our room’s just down the balcony.',
    )
  }
  if (target === 'memorabilia-case' && verb === 'photograph') {
    add(next.evidence, 'shrine-photo')
    add(next.topics, 'shrine')
    return withLine(
      next,
      'Iris: Four Hexblades on the velvet. Under the flash, five dents in it. Marta: Dust.',
    )
  }
  if (target === 'ice-ring' && verb === 'photograph') {
    add(next.evidence, 'ice-ring')
    return withLine(
      next,
      'Iris: Wet ring, no bucket. Somebody tidied a murder scene, and only the ice.',
    )
  }
  if (target === 'marta' && verb === 'talk') {
    add(next.topics, 'room-access')
    add(next.topics, 'unknown-visitor')
    return withLine(
      next,
      'Marta: Two guests in 205 aren’t answering, and the cops won’t come out before dawn. Nobody does at the Last Call. Ask nicely and maybe I’ll find a key.',
    )
  }
  if (target === 'marta' && verb === 'use') {
    if (!has(next, 'guest-ledger'))
      return withLine(
        state,
        'Marta: Read the register before you go grabbing for keys, honey.',
        false,
      )
    add(next.flags, 'crime-room-access')
    add(next.inventory, 'motel-key')
    return withLine(
      next,
      'Marta: Here. Iris holds the key. Norb can stand somewhere hygienic, if he finds one.',
    )
  }
  if (target === 'neighbor' && verb === 'talk') {
    add(next.topics, 'unknown-visitor')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      'Dolores: You’re the blog people! I read The Unwashed Truth on the toilet. Ask me about last night. I’ve been rehearsing.',
    )
  }
  if (target === 'wall-clock' && verb === 'photograph') {
    add(next.evidence, 'ice-timing')
    return withLine(
      next,
      'Iris: Clock plus Dolores’s account times the double clank to the minute.',
    )
  }
  if (target === 'ice-machine' && verb === 'photograph') {
    add(next.evidence, 'ice-timing')
    add(next.topics, 'ice-clank')
    return withLine(
      next,
      'Iris: I timed both clanks. Our murder mystery now has a clock.',
    )
  }
  if (target === 'maintenance-log' && verb === 'photograph') {
    add(next.evidence, 'ice-timing')
    return withLine(
      next,
      'Iris: Pip logs every clank like a lovesick poet. There’s last night, to the minute.',
    )
  }
  if (target === 'ice-machine' && verb === 'use') {
    add(next.topics, 'ice-clank')
    if (
      (has(next, 'fangs-lost') || has(next, 'bucket-traced')) &&
      !has(next, 'fangs-found')
    ) {
      add(next.flags, 'fangs-found')
      add(next.inventory, 'plastic-fangs')
      add(next.evidence, 'makeup-smear')
      add(next.topics, 'iris-tattoo')
      return withLine(
        next,
        'Iris digs elbow-deep: one ice bucket from 205, two plastic fangs and a smear of skin-tone foundation on the handle. Norb: Do NOT bring that arm anywhere near me.',
      )
    }
    return withLine(
      next,
      'Iris: Clank, clank. Norb: Splendid. Now wash your hands. Then wash them again.',
    )
  }
  if (target === 'sewer-hatch' && verb === 'use')
    return withLine(
      state,
      'Locked. Below, a husky voice belts a Monstrique chorus, then shouts “Five, six, seven, eight!” to nobody.',
      false,
    )
  if (target === 'room-door' && verb === 'use')
    return withLine(
      next,
      has(next, 'crime-room-access')
        ? 'Iris: 205 is open. Our client is waiting, and so is her date.'
        : 'Iris: Locked. Marta has keys, and the neighbor has a view of the fire escape.',
    )
  if (target === 'odette-purse' && verb === 'take') {
    if (has(next, 'odette-purse') || has(next, 'violet-paid'))
      return withLine(
        state,
        'Iris: Already took it. Low morals, high efficiency.',
        false,
      )
    add(next.inventory, 'odette-purse')
    add(next.topics, 'violet-fee')
    return withLine(
      next,
      'Iris pockets the purse. Odette: Put that DOWN. Iris: You can’t hold it anyway, and someone here is owed four hundred dollars.',
    )
  }
  if (target === 'gavin' && verb === 'talk') {
    add(next.flags, 'stalker-reported')
    add(next.topics, 'fan-alibi')
    return withLine(
      next,
      'Iris: Following women around with a lens isn’t fandom, Gavin. Gavin: But my pictures prove where I was!',
    )
  }
  if (target === 'fan-camera' && verb === 'photograph') {
    add(next.evidence, 'fan-photo')
    add(next.topics, 'fan-alibi')
    if (has(next, 'ice-timing') || has(next, 'neighbor-testimony'))
      add(next.evidence, 'fan-exonerated')
    return withLine(
      next,
      'Iris: The billboard and his time display put Gavin out front, nowhere near 205. Still a creep. Just not our killer. Two frames show fog curling up the stairs. Cheap lens.',
    )
  }
  if (target === 'knife' && verb === 'photograph') {
    add(next.evidence, 'knife-photo')
    add(next.topics, 'knife-origin')
    return withLine(
      next,
      'Iris: One jewelled knife, two victims. There’s a studio stamp on the guard. Norb should see this. From over there.',
    )
  }
  if (
    (target === 'odette-body' || target === 'violet-body') &&
    verb === 'photograph'
  ) {
    add(
      next.evidence,
      target === 'odette-body' ? 'odette-photo' : 'violet-photo',
    )
    return withLine(
      next,
      'Iris: Documented, with care. They get a real investigation, not a lurid headline.',
    )
  }
  if (target === 'odette-ghost' && verb === 'talk') {
    add(next.topics, 'iris-neck')
    add(next.flags, 'odette-met')
    add(next.flags, 'odette-hired-us')
    add(next.topics, 'agent-deals')
    add(next.topics, 'ghost-accounts')
    add(next.topics, 'harker-files')
    return withLine(
      next,
      iris
        ? 'Odette: Yes, I’m dead. Yes, I look fabulous. I’m retaining your boss. Norb: We don’t take money from the deceased. Odette: My estate pays in blackmail. Norb: ...Iris, get a pen.'
        : 'Odette: The little germ-phobe! I called you, I’m hiring you. Norb: From two metres away, madam, I accept.',
    )
  }
  if (target === 'violet-ghost' && verb === 'talk') {
    add(next.flags, 'violet-met')
    add(next.topics, 'violet-witness')
    add(next.topics, 'ghost-accounts')
    add(next.topics, 'missing-fangs')
    add(next.topics, 'violet-fee')
    return withLine(
      next,
      'Violet: Booked for one night, cape and fangs, and now I’m haunting the Last Call with my client forever. Worst. Overnight. Ever. And she still owes me.',
    )
  }
  if (target === 'nico' && verb === 'talk') {
    add(next.topics, 'knife-origin')
    add(next.topics, 'ice-clank')
    add(next.topics, 'iris-neck')
    return withLine(
      next,
      'Iris: Where do we start, boss? Norb: With the clock, the knife and the two women who were there. And you are leaning on an unsterilized lamp.',
    )
  }
  if (target === 'mummy-actress' && verb === 'talk') {
    add(next.topics, 'idol-schedule')
    return withLine(
      next,
      'Cleo: Odette took fifteen percent of my afterlife, darling. I’m not sorry she’s dead. I’m sorry I didn’t get to watch. Bring me evidence, not gossip.',
    )
  }
  if (target === 'desk' && verb === 'use') {
    if (chapterOf(state) === 2)
      return withLine(
        state,
        'Norb: Chapter One is filed. Chapter Two goes to press when Francesca Stein tells us about the knives, not before.',
        false,
      )
    if (!has(next, 'double-murder'))
      return withLine(
        state,
        'Norb: We haven’t seen the scene. I won’t publish a headline about a room I haven’t refused to enter.',
        false,
      )
    if (!has(next, 'ghost-odette') || !has(next, 'ghost-violet'))
      return withLine(
        state,
        'Iris: Two women were in that room. We hear both of them before we file.',
        false,
      )
    const ready = ['knife-photo', 'ice-timing', 'fan-exonerated'].every((key) =>
      has(next, key),
    )
    if (!ready) {
      next.ending = 'reckless'
      return withLine(
        next,
        'Norb: We named a suspect without the knife, the time or the alibi. The comments section is already on fire. So is my reputation.',
      )
    }
    add(next.flags, 'city-lead')
    add(next.topics, 'idol-schedule')
    return withLine(
      next,
      'Iris: The knife’s a 1964 Beach Hex stage prop, a jewelled Hexblade. Norb: Then the case starts where Monstrique started. Get the car. I’ll sit in the back. On a towel.',
    )
  }
  if (target === 'idol-poster' && verb === 'photograph') {
    if (chapterOf(state) === 2)
      return withLine(
        state,
        'Iris: Six Decades of Screams, still on the wall. Norb: We have this one on file, Iris. The knife points at the beach now.',
        false,
      )
    if (!has(next, 'city-lead'))
      return withLine(
        state,
        'The convention is not part of this investigation yet.',
        false,
      )
    add(next.evidence, 'idol-poster')
    if (FIFTH_HEXBLADE_CLUES.every((clue) => has(next, clue))) {
      next.ending = 'fifth-hexblade'
      return withLine(
        next,
        'Iris: Four Hexblades in the lobby shrine, five dents in the velvet. Whoever carried that ice bucket away wore skin-tone greasepaint and smelled of cold cream. Norb: Then the knife was never brought to the Last Call. It was borrowed from downstairs, by someone who still paints on a stage face. Chapter One is filed in full. Tomorrow we find out who made five knives.',
      )
    }
    next.ending = 'lead-earned'
    return withLine(
      next,
      'Iris: Seven albums, seven women Monstrique erased, and every one had a reason. Half of them are signing autographs right here. Norb: Chapter One is filed. Tomorrow, we follow Monstrique back to 1964.',
    )
  }
  return withLine(state, HOTEL_ROOMS[state.room].caption, false)
}

const LIST_KEYS = [
  'flags',
  'evidence',
  'topics',
  'inventory',
  'asked',
  'transcript',
] as const

/** Accepts version 3 saves and upgrades version 2 (pre-Monstrique) saves. */
export function restoreCase(value: unknown): CaseState | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<Omit<CaseState, 'version'>> & {
    version?: number
  }
  if (raw.version !== 2 && raw.version !== 3) return null
  if (
    typeof raw.room !== 'string' ||
    !Object.prototype.hasOwnProperty.call(HOTEL_ROOMS, raw.room)
  )
    return null
  if (raw.actor !== 'iris' && raw.actor !== 'nico') return null
  for (const key of LIST_KEYS) {
    const list = raw[key]
    if (!Array.isArray(list) || !list.every((part) => typeof part === 'string'))
      return null
  }
  if (raw.ending !== null && !CASE_ENDINGS.includes(raw.ending as CaseEnding))
    return null
  if (raw.chapter !== undefined && raw.chapter !== 1 && raw.chapter !== 2)
    return null
  if (
    raw.filed !== undefined &&
    (!Array.isArray(raw.filed) ||
      !raw.filed.every((ending) => CASE_ENDINGS.includes(ending)))
  )
    return null
  if (
    raw.deductions !== undefined &&
    (!Array.isArray(raw.deductions) ||
      !raw.deductions.every((id) => typeof id === 'string'))
  )
    return null
  if (!Number.isInteger(raw.seed)) return null
  const gratitude: Record<string, number> = {}
  if (raw.version === 3) {
    if (!raw.gratitude || typeof raw.gratitude !== 'object') return null
    for (const [who, level] of Object.entries(raw.gratitude)) {
      const cap = GRACES[who]?.max
      if (cap === undefined || !Number.isInteger(level)) return null
      gratitude[who] = Math.max(0, Math.min(cap, level))
    }
    if (!Number.isInteger(raw.rebuffs) || (raw.rebuffs ?? -1) < 0) return null
  }
  return repairCase(
    copyState({
      ...(raw as CaseState),
      version: 3,
      gratitude,
      rebuffs: raw.version === 3 ? (raw.rebuffs as number) : 0,
    }),
  )
}

const ROOM_FALLBACKS: Partial<Record<RoomId, RoomId>> = {
  'odette-room': 'balcony',
  'city-map': 'motel-exterior',
  'convention-center': 'motel-exterior',
  ...(Object.fromEntries(
    Object.entries(CHAPTER_TWO_GATES).map(([room, gate]) => [
      room,
      gate.fallback,
    ]),
  ) as Partial<Record<RoomId, RoomId>>),
}

function unique(list: string[]): string[] {
  return [...new Set(list)]
}

/**
 * Reload edge cases: a hand-edited, truncated or older save never strands
 * Iris behind a gate she has not opened, never carries an item or clue the
 * game no longer knows, never duplicates entries and never loses the camera
 * every photograph needs.
 */
function repairCase(state: CaseState): CaseState {
  state.inventory = unique(state.inventory).filter((item) => item in ITEMS)
  if (!state.inventory.includes('camera')) state.inventory.unshift('camera')
  state.evidence = unique(state.evidence).filter((clue) => clue in EVIDENCE)
  state.topics = unique(state.topics).filter((topic) => topic in TOPICS)
  state.flags = unique(state.flags)
  state.asked = unique(state.asked)
  if (state.deductions)
    state.deductions = unique(state.deductions).filter(isDeduction)
  repairChapter(state)
  for (let hop = 0; hop < 4; hop++) {
    const fallback = ROOM_FALLBACKS[state.room]
    if (!fallback || !roomLock(state, state.room)) break
    state.room = fallback
  }
  if (!state.transcript.length) state.transcript = [...newCase().transcript]
  return state
}

/**
 * A Chapter Two save must have filed a Chapter One lead; an ending always
 * belongs to the chapter being played. Saves from before Chapter Two carry
 * neither field and come back exactly as they were.
 */
function repairChapter(state: CaseState): void {
  const filed = unique(state.filed ?? []) as CaseEnding[]
  if (
    state.chapter === 2 &&
    !filed.some((ending) => CHAPTER_TWO_OPENERS.includes(ending))
  )
    state.chapter = 1
  if (state.chapter === 2) state.filed = filed
  else {
    delete state.chapter
    delete state.filed
  }
  if (state.ending && endingChapter(state.ending) !== chapterOf(state))
    state.ending = null
}

/** Chapter One evidence a case needs to have earned the drive-in lead. */
const CHAPTER_ONE_LEAD = {
  flags: [
    'crime-room-access',
    'double-murder-discovered',
    'odette-met',
    'odette-hired-us',
    'violet-met',
    'city-lead',
  ],
  evidence: [
    'double-murder',
    'knife-photo',
    'knife-prop-mark',
    'ice-timing',
    'fan-photo',
    'fan-exonerated',
    'ghost-odette',
    'ghost-violet',
    'idol-poster',
  ],
  topics: [
    'ghost-accounts',
    'knife-origin',
    'agent-deals',
    'harker-files',
    'violet-fee',
    'violet-witness',
    'missing-fangs',
    'idol-schedule',
  ],
}

/**
 * Carries a case whose Chapter One lead is filed (`lead-earned` or
 * `fifth-hexblade`) into Chapter Two. Everything found so far stays in the
 * notebook; the ending is kept in `filed` and the case reopens on the city
 * map with the drive-in lead.
 */
export function beginChapterTwo(state: CaseState): CaseResult {
  if (
    chapterOf(state) !== 1 ||
    !state.ending ||
    !CHAPTER_TWO_OPENERS.includes(state.ending)
  )
    return withLine(
      state,
      'Norb: Chapter Two needs a lead we can stand behind. File one first.',
      false,
    )
  const next = copyState(state)
  next.chapter = 2
  next.filed = [...(state.filed ?? []), state.ending]
  next.ending = null
  next.room = 'city-map'
  add(next.flags, 'city-lead')
  add(next.flags, 'beach-lead')
  add(next.topics, 'harker-file-two')
  add(next.topics, 'hexblades')
  return withLine(
    next,
    state.ending === 'fifth-hexblade'
      ? 'Norb: Four knives in the shrine, five dents in the velvet, and a stamp that says STARLITE PICTURES, BEACH HEX, 1964. The Starlite Drive-In still runs at Hexwater Beach. Chapter Two, Iris. Get the car. I will sit on the towel.'
      : 'Norb: STARLITE PICTURES, BEACH HEX, 1964. The Starlite Drive-In still runs at Hexwater Beach, and the 1964 pictures still play there. Chapter Two, Iris. Get the car. I will sit on the towel.',
  )
}

/**
 * A fresh Chapter Two case for a player whose case files already hold a
 * Chapter One lead: the minimum Chapter One evidence, filed as `lead-earned`.
 */
export function newChapterTwo(seed = 1): CaseState {
  const base = newCase(seed)
  return beginChapterTwo({
    ...base,
    room: 'convention-center',
    flags: [...CHAPTER_ONE_LEAD.flags],
    evidence: [...CHAPTER_ONE_LEAD.evidence],
    topics: [...CHAPTER_ONE_LEAD.topics],
    ending: 'lead-earned',
  }).state
}

export const monstrexxKitId = (accountId: string | number): string =>
  `monstress-convention-user-${accountId}`
/** Monstrique name for the same stable, account-scoped kit id. */
export const monstriqueKitId = monstrexxKitId
