// utils/rulerHooked/tutorial.ts
//
// The first-reign tutorial (2026-11-05 illustrated overhaul). Quill the Steward
// teaches by situation, not by slideshow: each lesson appears the first time
// its moment arrives, says one thing, and is remembered in the save's flags so
// it never repeats. One tap on "Skip lessons" retires them all.
//
// Pure: the console asks `currentLesson(save, ctx)` what to show and calls
// `learn(save, id)` when a lesson's action is done or dismissed.

import type { RunSave } from '~/types/ruler-hooked'

export type ConsoleScreen =
  'lake' | 'map' | 'court' | 'gear' | 'fishopedia' | 'chronicle' | 'saves'

export interface TutorialContext {
  screen: ConsoleScreen
  fishing: boolean
  hasCatch: boolean
  hasPetition: boolean
  hasProclamation: boolean
}

export interface Lesson {
  id: string
  /** Quill's line. */
  text: string
  /** Which screen the lesson points at; shown on the matching nav tab. */
  points?: ConsoleScreen
  /** True when the player's own action completes it (no "Got it" button). */
  byAction?: boolean
  when: (ctx: TutorialContext, save: RunSave) => boolean
}

export const SKIP_FLAG = 'tutorial:skipped'
const flagFor = (id: string) => `tutorial:${id}`

export const LESSONS: Lesson[] = [
  {
    id: 'crier',
    text: 'Each new day starts with the Town Crier. Hear the news. Small things, but they add up.',
    byAction: true,
    when: (ctx) => ctx.hasProclamation,
  },
  {
    id: 'cast',
    text: 'Your Majesty, the lake is yours. Tap Cast a line and stop the bobber in the gold band.',
    points: 'lake',
    byAction: true,
    when: (ctx) => ctx.screen === 'lake' && !ctx.fishing && !ctx.hasPetition,
  },
  {
    id: 'reel',
    text: 'Stop the marker twice to cast and hook. Then tap to reel, and ease off when the line runs red.',
    byAction: true,
    when: (ctx) => ctx.fishing,
  },
  {
    id: 'fishopedia',
    text: 'A new specimen! Every species you land is painted into the Fishopedia.',
    points: 'fishopedia',
    when: (ctx) => ctx.hasCatch && !ctx.fishing,
  },
  {
    id: 'petition',
    text: 'The court has a petition. Every answer tips the kingdom, so watch the health crest at the top left.',
    points: 'court',
    byAction: true,
    when: (ctx) => ctx.hasPetition,
  },
  {
    id: 'atlas',
    text: 'Your decrees repaint the land. The Map shows how each corner of the kingdom is faring.',
    points: 'map',
    when: (_ctx, save) => (save.counters.cardsResolved ?? 0) >= 1,
  },
  {
    id: 'gear',
    text: 'Coins from your catches buy better tackle and kingdom works in the Gear room.',
    points: 'gear',
    when: (_ctx, save) => (save.counters.coins ?? 0) >= 40,
  },
]

export function learned(save: RunSave, id: string): boolean {
  return !!save.flags[SKIP_FLAG] || !!save.flags[flagFor(id)]
}

/** The first unlearned lesson whose moment is now, or null. */
export function currentLesson(
  save: RunSave | null,
  ctx: TutorialContext,
): Lesson | null {
  if (!save || save.flags[SKIP_FLAG]) return null
  return LESSONS.find((l) => !learned(save, l.id) && l.when(ctx, save)) ?? null
}

/** Mark a lesson learned (mutates and returns the save, which the store persists). */
export function learn(save: RunSave, id: string): RunSave {
  save.flags[flagFor(id)] = true
  return save
}

export function skipAll(save: RunSave): RunSave {
  save.flags[SKIP_FLAG] = true
  return save
}

export function lessonsRemaining(save: RunSave): number {
  if (save.flags[SKIP_FLAG]) return 0
  return LESSONS.filter((l) => !save.flags[flagFor(l.id)]).length
}
