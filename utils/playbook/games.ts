import { buildCrystalStreetPlaybook } from './crystalStreet'
import { buildCthulhuquariumPlaybook } from './cthulhuquarium'
import { buildEcotonePlaybook } from './ecotone'
import { buildEmperorOfDustPlaybook } from './emperorOfDust'
import { buildGamebookPlaybook } from './gamebook'
import { buildMemoryDungeonPlaybook } from './memoryDungeon'
import { KIT_STUDIO_PREFIX, buildKitPlaybook } from './kit'
import { buildPromOfDoomPlaybook } from './promOfDoom'
import { buildRulerHookedPlaybook } from './rulerHooked'
import { buildShiftingDesksPlaybook } from './shiftingDesks'
import { buildShiftingLandsPlaybook } from './shiftingLands'
import { buildThisMeansWarpPlaybook } from './thisMeansWarp'
import { sanitizeCardEdit, type CardEdit } from './edits'
import { sanitizeTextEdit } from './textOverlay'
import { KIT_PLAYBOOKS } from '../playbookKit/games'
import type { Playbook } from './types'

// Every story game the Playbook Manager can open. Each builder reads that
// game's authored source. Ecotone takes full card edits; every other game
// takes the text overlay (utils/playbook/textOverlay.ts).

// `cover` is the game's own key art: the manager's game switcher, and the
// backdrop for any beat that has no picture yet.
const AUTHORED_GAMES = [
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
    title: 'Terrors on Crystal Street',
    cover: '/crystal-street/cover.webp',
    build: buildCrystalStreetPlaybook,
  },
  {
    id: 'game-of-captains',
    title: 'Space Couch',
    cover: '/game-of-captains/front/splash.webp',
    build: buildThisMeansWarpPlaybook,
  },
  {
    id: 'comet-city-academy',
    title: 'Prom of Doom',
    cover: '/comet-city-academy/front/splash.webp',
    build: buildPromOfDoomPlaybook,
  },
  {
    id: 'memory-dungeon',
    title: 'Memory Dungeon',
    cover: '/memory-dungeon/front/hero.webp',
    build: buildMemoryDungeonPlaybook,
  },
  {
    id: 'cthulhuquarium',
    title: 'Cthulhuquarium',
    cover: '/cthulhuquarium-front/hero.webp',
    build: buildCthulhuquariumPlaybook,
  },
  {
    id: 'ruler-hooked',
    title: 'The Ruler Is Hooked',
    cover: '/ruler-hooked/hero.webp',
    build: buildRulerHookedPlaybook,
  },
] as const

/** A game built on the Playbook Kit, listed in Studio as kit-<spec id>. */
export type KitPlaybookGame = `${typeof KIT_STUDIO_PREFIX}${string}`
export type PlaybookGame =
  (typeof AUTHORED_GAMES)[number]['id'] | KitPlaybookGame

type StudioGame = {
  id: PlaybookGame
  title: string
  cover: string
  build: () => Playbook
}

/**
 * Authored games, then every Playbook Kit game: one manager for all of them.
 * A kit spec for a game with its own authored adapter (Space Couch) is that
 * game's rehearsal in the Kit console, not a second set of beats.
 */
export const PLAYBOOK_GAMES: readonly StudioGame[] = [
  ...AUTHORED_GAMES,
  ...KIT_PLAYBOOKS.filter(
    (spec) => !AUTHORED_GAMES.some((game) => game.id === spec.id),
  ).map((spec) => ({
    id: `${KIT_STUDIO_PREFIX}${spec.id}` as KitPlaybookGame,
    title: spec.title,
    cover: spec.keyArt.src ?? '',
    build: () => buildKitPlaybook(spec),
  })),
]

export function isKitGame(id: string): id is KitPlaybookGame {
  return id.startsWith(KIT_STUDIO_PREFIX)
}

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
