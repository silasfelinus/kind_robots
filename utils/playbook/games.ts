import { buildCrystalStreetPlaybook } from './crystalStreet'
import { buildEcotonePlaybook } from './ecotone'
import { buildEmperorOfDustPlaybook } from './emperorOfDust'
import { buildGamebookPlaybook } from './gamebook'
import { buildShiftingDesksPlaybook } from './shiftingDesks'
import { buildShiftingLandsPlaybook } from './shiftingLands'
import { sanitizeCardEdit, type CardEdit } from './edits'
import { sanitizeTextEdit } from './textOverlay'
import type { Playbook } from './types'

// Every story game the Playbook Manager can open. Each builder reads that
// game's authored source. Ecotone takes full card edits; every other game
// takes the text overlay (utils/playbook/textOverlay.ts).

// `cover` is the game's own key art: the manager's game switcher, and the
// backdrop for any beat that has no picture yet.
export const PLAYBOOK_GAMES = [
  {
    id: 'ecotone',
    title: 'Ecotone',
    cover: '/ecotone/title/key-art.webp',
    build: buildEcotonePlaybook,
  },
  {
    id: 'emperor-of-dust',
    title: 'Emperor of Dust',
    cover: '/emperor-of-dust/map/wasteland.webp',
    build: buildEmperorOfDustPlaybook,
  },
  {
    id: 'shifting-lands',
    title: 'Zuzu: Shifting Lands',
    cover: '/shifting-lands/cards/the-map-in-ashes.webp',
    build: buildShiftingLandsPlaybook,
  },
  {
    id: 'shifting-desks',
    title: 'Shifting Desks',
    cover: '/shifting-desks/front-poster.svg',
    build: buildShiftingDesksPlaybook,
  },
  {
    id: 'zuzu-gamebook',
    title: 'Zuzu Gamebook',
    cover: '/zuzu-gamebook/scenes/bell-tower.webp',
    build: buildGamebookPlaybook,
  },
  {
    id: 'crystal-street',
    title: 'Nightmare on Crystal Street',
    cover: '/crystal-street/poster.svg',
    build: buildCrystalStreetPlaybook,
  },
] as const

export type PlaybookGame = (typeof PLAYBOOK_GAMES)[number]['id']

const cache = new Map<string, Playbook>()

export function isPlaybookGame(id: unknown): id is PlaybookGame {
  return PLAYBOOK_GAMES.some((game) => game.id === id)
}

/** One beat's edit, cleaned for its game. A text edit is a CardEdit subset. */
export function sanitizePlaybookEdit(
  game: PlaybookGame,
  raw: unknown,
): CardEdit {
  return game === 'ecotone' ? sanitizeCardEdit(raw) : sanitizeTextEdit(raw)
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
