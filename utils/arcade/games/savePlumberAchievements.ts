// Save the Plumber achievements (main-game standard). The run queues each
// key at its deed (never in the demo or a Maker course) and the cabinet
// drains it (drainFeats -> arcadeStore.awardFeats). Every key the run earns is
// also reported as a mastery id, so arcadeStore.awardMasteryAchievements
// backfills it, and the roster parts add up across sessions. Codes keep the
// cabinet's arcade- prefix (utils/achievements/gameAchievements.ts).

import {
  OVERWORLD,
  worldCompletion,
  completionPercent,
} from './savePlumberOverworld'
import type { MapProgress } from './savePlumberOverworld'
import { PLUMBER_ROSTER } from './savePlumberRoster'

export const PLUMBER_ACHIEVEMENT_CODES = {
  'first-valve': 'arcade-save-the-plumber-first-valve',
  'madame-pressure': 'arcade-save-the-plumber-madame-pressure',
  halfway: 'arcade-save-the-plumber-halfway',
  'rain-check': 'arcade-save-the-plumber-rain-check',
  'teo-freed': 'arcade-save-the-plumber-teo-freed',
  'first-gear': 'arcade-save-the-plumber-first-gear',
  'gear-world': 'arcade-save-the-plumber-gear-world',
  'all-gears': 'arcade-save-the-plumber-all-gears',
  'hundred-tokens': 'arcade-save-the-plumber-hundred-tokens',
  'full-hearts': 'arcade-save-the-plumber-full-hearts',
  'deathless-world': 'arcade-save-the-plumber-deathless-world',
  'endless-500': 'arcade-save-the-plumber-endless-500',
  'full-roster': 'arcade-save-the-plumber-full-roster',
  'hundred-percent': 'arcade-save-the-plumber-hundred-percent',
  maker: 'arcade-save-the-plumber-maker',
} as const

export type PlumberFeat = keyof typeof PLUMBER_ACHIEVEMENT_CODES

/** The world bosses with an achievement of their own, by world. */
export const PLUMBER_BOSS_FEATS: Readonly<Record<number, PlumberFeat>> = {
  1: 'madame-pressure',
  4: 'halfway',
  7: 'rain-check',
}

/** Metres an Endless run must reach for Long Haul. */
export const PLUMBER_ENDLESS_GOAL = 500

/** One mastery part per heroine, earned by clearing 1-1 with her. */
export const PLUMBER_ROSTER_PARTS: readonly string[] = PLUMBER_ROSTER.map(
  (heroine) => `roster-${heroine.key}`,
)

export function rosterComplete(held: ReadonlySet<string>): boolean {
  return PLUMBER_ROSTER_PARTS.every((part) => held.has(part))
}

/** The completion achievements a slot's progress proves, given the world just played. */
export function plumberProgressFeats(
  progress: MapProgress,
  world: number,
): PlumberFeat[] {
  const feats: PlumberFeat[] = []
  const here = worldCompletion(world, progress)
  if (here.gears > 0 && here.gearsFound === here.gears) feats.push('gear-world')
  const all = OVERWORLD.map((map) => worldCompletion(map.world, progress))
  const gears = all.reduce((n, c) => n + c.gears, 0)
  const found = all.reduce((n, c) => n + c.gearsFound, 0)
  if (gears > 0 && found === gears) feats.push('all-gears')
  if (completionPercent(progress) === 100) feats.push('hundred-percent')
  return feats
}
