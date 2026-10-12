// /utils/arcade/butterflyJoust/credits.ts
//
// The credits that roll after the Four Gardens Tourney is won (conductor kr-arcade/t-049): the
// gardens, the champions and every rider, from the tourney's own data. Lines starting with '-'
// are headings.

import { ARENAS, CHAMPIONS, RAINBOW_LISTS } from './arenas'
import { ROSTER } from './roster'

export const CREDITS: readonly string[] = [
  '-BUTTERFLY JOUST',
  'THE FOUR GARDENS TOURNEY',
  '',
  '-THE GARDENS',
  ...ARENAS.map((a) => a.name),
  RAINBOW_LISTS.name,
  '',
  '-THE CHAMPIONS',
  ...Object.values(CHAMPIONS).map((c) => c.name),
  '',
  '-THE RIDERS',
  ...Object.values(ROSTER).map((r) => r.name),
  'THE CARRIER',
  'THE THUNDERCAP',
  'THE POND FROG AND HER COUSIN',
  '',
  '-AND',
  'THE TEAL ROBOT',
  'AND THE RAINBOW BUTTERFLY',
  '',
  '-A KIND ROBOTS ARCADE GAME',
  '',
  'THANK YOU FOR FLYING',
]
