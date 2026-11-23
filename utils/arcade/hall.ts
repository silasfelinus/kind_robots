// /utils/arcade/hall.ts
//
// How the Arcade hall orders its cabinets for a visitor: finished showcase
// cabinets first, then the rest, then the ones still growing. Within each
// shelf the best-rated cabinets lead (sortArcadeGamesByRating).

import { sortArcadeGamesByRating, type ArcadeRatingSummaryMap } from './reviews'
import type { ArcadeGameMeta } from './types'

const FEATURED_CABINET = 'superkate-spectrum'

const SHELF_RANK = { showcase: 0, standard: 1, growing: 2 } as const

export function shelfRank(game: ArcadeGameMeta): number {
  return SHELF_RANK[game.shelf ?? 'standard']
}

export function arrangeArcadeHall(
  games: readonly ArcadeGameMeta[],
  summaries: ArcadeRatingSummaryMap,
): ArcadeGameMeta[] {
  return sortArcadeGamesByRating(games, summaries).sort(
    (a, b) =>
      Number(b.slug === FEATURED_CABINET) -
        Number(a.slug === FEATURED_CABINET) ||
      shelfRank(a) - shelfRank(b),
  )
}

export function isGrowingCabinet(game: ArcadeGameMeta): boolean {
  return game.shelf === 'growing'
}

export function arcadeHallShareLink(origin: string) {
  return {
    title: 'Kind Robots Arcade',
    text: 'Free arcade cabinets from Kind Robots. Pick one and press start.',
    url: `${origin}/play/arcade`,
  }
}

export function arcadeCabinetShareLink(
  origin: string,
  game: Pick<ArcadeGameMeta, 'slug' | 'title'>,
) {
  return {
    title: `${game.title} · Kind Robots Arcade`,
    url: `${origin}/play/arcade?game=${encodeURIComponent(game.slug)}`,
  }
}

export function arcadeScoreShareLink(
  origin: string,
  game: Pick<ArcadeGameMeta, 'slug' | 'title'>,
  score: number,
) {
  return {
    ...arcadeCabinetShareLink(origin, game),
    text: `I scored ${Math.floor(score).toLocaleString('en-US')} in ${game.title} at the Kind Robots Arcade. Can you beat it?`,
  }
}

export function shareButtonLabel(note: string, score: number | null): string {
  if (note) return note
  return score && score > 0
    ? `Share my ${Math.floor(score).toLocaleString('en-US')}`
    : 'Share'
}

export function shareNoteFor(
  result: 'shared' | 'copied' | 'cancelled' | 'failed',
): string {
  if (result === 'copied') return 'Link copied!'
  if (result === 'failed') return 'Copy the address bar'
  return ''
}
