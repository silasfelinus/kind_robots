// /utils/arcade/butterflyJoust/bouts.ts
//
// Every champion of the Four Gardens Tourney by id (champions.ts, finalChampions.ts).

import type { ChampionId } from './arenas'
import { Bumbleton, Duchess, type Champion } from './champions'
import {
  FrostQueen,
  MirrorMoth,
  ScarecrowKite,
  Thunderhead,
} from './finalChampions'

/** A champion for its id, fresh for its bout. */
export function createChampion(id: ChampionId): Champion {
  switch (id) {
    case 'bumbleton':
      return new Bumbleton()
    case 'duchess':
      return new Duchess()
    case 'thunderhead':
      return new Thunderhead()
    case 'kite':
      return new ScarecrowKite()
    case 'queen':
      return new FrostQueen()
    case 'mirror':
      return new MirrorMoth()
  }
}
