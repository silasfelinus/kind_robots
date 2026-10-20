import { buildEcotonePlaybook } from './ecotone'
import { buildEmperorOfDustPlaybook } from './emperorOfDust'
import { buildGamebookPlaybook } from './gamebook'
import { buildShiftingDesksPlaybook } from './shiftingDesks'
import { buildShiftingLandsPlaybook } from './shiftingLands'
import type { Playbook } from './types'

// Every story game the Playbook Manager can open. Each builder reads that
// game's authored source; only games whose engines read live overlays are
// editable (see Playbook.editable).

export const PLAYBOOK_GAMES = [
  { id: 'ecotone', title: 'Ecotone', build: buildEcotonePlaybook },
  {
    id: 'emperor-of-dust',
    title: 'Emperor of Dust',
    build: buildEmperorOfDustPlaybook,
  },
  {
    id: 'shifting-lands',
    title: 'Zuzu: Shifting Lands',
    build: buildShiftingLandsPlaybook,
  },
  {
    id: 'shifting-desks',
    title: 'Shifting Desks',
    build: buildShiftingDesksPlaybook,
  },
  { id: 'zuzu-gamebook', title: 'Zuzu Gamebook', build: buildGamebookPlaybook },
] as const

export type PlaybookGame = (typeof PLAYBOOK_GAMES)[number]['id']

const cache = new Map<string, Playbook>()

export function isPlaybookGame(id: unknown): id is PlaybookGame {
  return PLAYBOOK_GAMES.some((game) => game.id === id)
}

export function buildPlaybook(game: PlaybookGame): Playbook {
  const cached = cache.get(game)
  if (cached) return cached
  const entry = PLAYBOOK_GAMES.find((g) => g.id === game)
  if (!entry) throw new Error(`Unknown playbook game ${game}`)
  const playbook = entry.build()
  cache.set(game, playbook)
  return playbook
}
