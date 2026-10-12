// /utils/arcade/kindnessGauntlet/modes.ts
//
// Kindness Gauntlet's modes, medals and endings (conductor kr-arcade t-054, depth-pass/CABINETS.md
// section 5, "Modes and players"): the Descent and its New Game+ (Reboot), the Endless Archive (the
// leaderboard's main event), the Lost & Found score attack, the Score Duel option, the per-floor medal
// board, and the words the Old Mainframe says at the end, with and without all five Memory Cards.

export type ModeId = 'descent' | 'reboot' | 'endless' | 'lost' | 'medals'

export type ModeEntry = { id: ModeId; name: string; about: string }

export const MODES: readonly ModeEntry[] = [
  {
    id: 'descent',
    name: 'DESCENT',
    about: 'FIVE WINGS DOWN TO THE OLD MAINFRAME',
  },
  {
    id: 'reboot',
    name: 'REBOOT',
    about: 'THE DESCENT AGAIN, TOUGHER (NEW GAME+)',
  },
  {
    id: 'endless',
    name: 'ENDLESS ARCHIVE',
    about: 'RANDOM FLOORS, EVERY TRICK, EVER DEEPER',
  },
  {
    id: 'lost',
    name: 'LOST AND FOUND',
    about: 'FIVE TREASURE FLOORS AGAINST THE CLOCK',
  },
  {
    id: 'medals',
    name: 'MEDAL BOARD',
    about: 'EVERY FLOOR AND ITS THREE MEDALS',
  },
]

/** Three medals a floor: its secret, its par time, and a kind clear (nobody flat, no snack hurt). */
export const MEDALS = [
  { bit: 1, name: 'SECRET', short: 'S' },
  { bit: 2, name: 'SWIFT', short: 'P' },
  { bit: 4, name: 'KIND', short: 'K' },
] as const

/** Where the Lost & Found mode goes: each wing's treasure floor in turn. */
export const LOST_FLOORS = [7, 15, 23, 31, 39] as const

/** Points for waking her, and again for the true ending. */
export const ENDING_POINTS = 25_000
export const TRUE_ENDING_POINTS = 25_000

/** What she says as she wakes. */
export const ENDING_LINES = [
  'THE OLD MAINFRAME WAKES UP HERSELF AGAIN.',
  'THANK YOU, LITTLE BOTS.',
  'I HAD FORGOTTEN HOW TO BE ME.',
  'NOW I REMEMBER WHO I AM.',
]

/** With all five Memory Cards, she remembers everything. */
export const TRUE_ENDING_LINES = [
  'AND NOW I REMEMBER EVERYTHING:',
  'THE STAFF WHO WAVED GOODNIGHT TO ME,',
  'THE CITY I KEPT RUNNING ALL THOSE YEARS,',
  'AND MY VERY FIRST BOOT.',
  'HELLO, WORLD. HELLO, FRIENDS.',
]

export const CREDITS = [
  'KINDNESS GAUNTLET',
  'THE DEEP ARCHIVE',
  'A KIND ROBOTS ARCADE CABINET',
  'THANK YOU FOR PLAYING',
]

/** The medal board's key for an authored floor. */
export function medalKey(level: number): string {
  return String(level)
}
