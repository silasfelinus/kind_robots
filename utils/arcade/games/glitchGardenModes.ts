// Glitch Garden's standalone modes share the authored garden engine, not campaign saves.
import { mulberry32 } from '../curve'
import { GARDENS, gardenStart } from './glitchGardenGardens'

export type GardenMode = 'campaign' | 'endless' | 'daily'

export function endlessGardenStep(level: number) {
  const n = Math.max(0, Math.floor(level) - 1)
  const block = Math.floor(n / 5)
  const garden = (block % 4) * 2 + (Math.floor(block / 4) % 2)
  return {
    index: gardenStart(garden) + (n % 5),
    lap: Math.floor(n / 40),
  }
}

/** UTC makes the daily challenge identical for players in every time zone. */
export function dailyGardenPlan(day: string) {
  const seed = Number(day.replaceAll('-', '')) >>> 0
  const rng = mulberry32(seed)
  const garden = Math.floor(rng() * GARDENS.length)
  const wave = 1 + Math.floor(rng() * 5)
  return {
    day,
    seed,
    garden,
    wave,
    index: gardenStart(garden) + wave - 1,
    layout: GARDENS[garden]!.layout.map((row, y) =>
      [...row]
        .map((cell) =>
          cell === '.' && y > 1 && y < 27 && rng() < 0.035 ? 'o' : cell,
        )
        .join(''),
    ),
  }
}

export const GARDEN_MEDALS = {
  clean: 1,
  kind: 2,
  full: 4,
} as const

export function gardenMedals(clean: boolean, kind: boolean, full: boolean) {
  return (clean ? 1 : 0) | (kind ? 2 : 0) | (full ? 4 : 0)
}

export const GARDEN_MASTERY = [
  {
    id: 'clean-patch',
    title: 'Clean Patch',
    hint: 'Finish a wave without losing a sprayer',
  },
  {
    id: 'kind-pollinator',
    title: 'Kind Pollinator',
    hint: 'Finish a bee wave without spraying a friendly bee',
  },
  {
    id: 'full-patch',
    title: 'Full Patch',
    hint: 'Reach a five-times patch multiplier',
  },
  {
    id: 'golden-gardener',
    title: 'Golden Gardener',
    hint: 'Earn all eight golden trowels',
  },
  { id: 'four-seasons', title: 'Four Seasons', hint: 'Restore the whole year' },
  {
    id: 'midnight-bloom',
    title: 'Midnight Bloom',
    hint: 'Restore the Root Kernel',
    secret: true,
  },
  {
    id: 'endless-twenty',
    title: 'Season Spinner',
    hint: 'Clear twenty Endless Lawn waves',
  },
  {
    id: 'daily-bloom',
    title: 'Daily Bloom',
    hint: 'Complete a Daily Garden challenge',
  },
] as const
