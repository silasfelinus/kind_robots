// /utils/arcade/sinkSuds/modes.ts
//
// Sink Suds' modes and medals as data (conductor kr-arcade/t-046, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 3, "Modes").
//
//   Campaign      The Big House Wash (Bubble Buddies when two to four are seated: bubbles that
//                 touch merge into one big bubble steered by everyone, and B splits it again).
//   Squeaky Clean a time attack on one basin: scrub it 95% clean as fast as you can.
//   Endless Sink  sinks forever, every shape and every pest: the leaderboard event.
//   Classic Sink  the original single kitchen sink, mites and brushes, sink after sink.
//   Suds Sumo     versus for two to four: bigger bubbles push smaller ones; the drain swallows
//                 whoever is shoved in, and the last bubble in the basin wins the round.

import type { PestKind } from './pests'

export type ModeId = 'campaign' | 'squeaky' | 'endless' | 'classic' | 'sumo'

export type ModeDef = {
  id: ModeId
  name: string
  /** The two lines under the mode on the menu. */
  about: readonly [string, string]
  /** Who can play it: solo only, two or more only, or any. */
  seats: 'solo' | 'group' | 'any'
}

export const MODES: readonly ModeDef[] = [
  {
    id: 'campaign',
    name: 'THE BIG HOUSE WASH',
    about: ['SIX ROOMS, THREE BOSSES,', 'A SAVE AT EVERY ROOM'],
    seats: 'any',
  },
  {
    id: 'squeaky',
    name: 'SQUEAKY CLEAN',
    about: ['ONE BASIN AGAINST THE CLOCK:', '95% CLEAN, AS FAST AS YOU CAN'],
    seats: 'solo',
  },
  {
    id: 'endless',
    name: 'ENDLESS SINK',
    about: ['SINKS FOREVER, EVERY PEST:', 'THE LEADERBOARD EVENT'],
    seats: 'any',
  },
  {
    id: 'classic',
    name: 'CLASSIC SINK',
    about: ['THE ORIGINAL KITCHEN SINK,', 'MITES AND BRUSHES'],
    seats: 'any',
  },
  {
    id: 'sumo',
    name: 'SUDS SUMO',
    about: ['BIG BUBBLES SHOVE SMALL ONES.', 'LAST BUBBLE IN THE BASIN WINS'],
    seats: 'group',
  },
]

/** The modes open to this many seated players. */
export function modesFor(seats: number): ModeDef[] {
  return MODES.filter((m) =>
    seats > 1 ? m.seats !== 'solo' : m.seats !== 'group',
  )
}

// --- medals -----------------------------------------------------------------------------------

/** Medal bits per basin: Squeaky Clean (95%), No Pop (no bubble lost), Quick Rinse (under par). */
export const MEDAL = { squeaky: 1, noPop: 2, quick: 4 } as const
export const MEDAL_NAMES: Record<keyof typeof MEDAL, string> = {
  squeaky: 'SQUEAKY CLEAN',
  noPop: 'NO POP',
  quick: 'QUICK RINSE',
}

/** The medals a finished basin earns. */
export function medalsFor(
  percent: number,
  pops: number,
  ticks: number,
  par: number,
): number {
  let m = 0
  if (percent >= 95) m |= MEDAL.squeaky
  if (pops === 0) m |= MEDAL.noPop
  if (ticks <= par * 60) m |= MEDAL.quick
  return m
}

export function medalKey(room: string, basin: number) {
  return `${room}:${basin + 1}`
}

/** How many medals are in a bitmask. */
export function medalCount(bits: number) {
  return (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1)
}

// --- Suds Sumo --------------------------------------------------------------------------------

/** Rounds to win the match, and how long a round runs before the biggest bubble takes it. */
export const SUMO = {
  wins: 2,
  roundTicks: 60 * 75,
  mess: 46,
  drip: 50,
} as const
/** Where each seat starts in the sumo basin. */
export const SUMO_STARTS = [
  { x: 110, y: 130 },
  { x: 310, y: 250 },
  { x: 310, y: 130 },
  { x: 110, y: 250 },
] as const

// --- Endless Sink -----------------------------------------------------------------------------

/** The level each pest joins the endless sink. */
export const ENDLESS_ROSTER: readonly { kind: PestKind; from: number }[] = [
  { kind: 'mite', from: 1 },
  { kind: 'sponge', from: 2 },
  { kind: 'brush', from: 3 },
  { kind: 'gremlin', from: 4 },
  { kind: 'slug', from: 5 },
  { kind: 'lint', from: 6 },
  { kind: 'algae', from: 7 },
  { kind: 'loofah', from: 8 },
  { kind: 'puffer', from: 9 },
  { kind: 'snail', from: 10 },
  { kind: 'leafboat', from: 11 },
  { kind: 'wax', from: 12 },
  { kind: 'strider', from: 13 },
  { kind: 'spinner', from: 14 },
  { kind: 'sock', from: 15 },
]

/** The seat colours: the bubble's ring and its player tag. */
export const SEAT_COLOURS = [
  '#5eead4',
  '#f9a8d4',
  '#fde68a',
  '#b9a5ff',
] as const
