// utils/rulerHooked/achievements.ts
//
// The Ruler Is Hooked's site achievements
// (utils/achievements/catalog/main/ruler-hooked.ts). Pure judges for the
// moments rulerHookedStore and rulerHookedQuizStore award at: a landed fish,
// a resolved card, an accepted or declined ending, a purchase, a correct
// quiz answer. init() and loadSlot() only restore a reign, so they never
// reach these.

import type { CatchResult, Effect, RunSave } from '~/types/ruler-hooked'
import { RULER_HOOKED_FISH } from './fish'

export const RULER_HOOKED_NATURALIST = Math.ceil(RULER_HOOKED_FISH.length / 2)
export const RULER_HOOKED_SCHOLAR = 25
export const RULER_HOOKED_FLUENT = 100

export const RULER_HOOKED_ENDING_CODES: Readonly<Record<string, string>> = {
  'druid-utopia': 'ruler-hooked-ending-grove',
  'warlock-metropolis': 'ruler-hooked-ending-boomtown',
  'thistlewood-empire': 'ruler-hooked-ending-empire',
  'fishers-peace': 'ruler-hooked-ending-never-ruled',
}

export const RULER_HOOKED_ARC_CODES: Readonly<Record<string, string>> = {
  'child-elopes': 'ruler-hooked-arc-elope',
  'envoy-treaty': 'ruler-hooked-arc-treaty',
  'bog-witch-bargain': 'ruler-hooked-arc-witch',
}

const species = (save: RunSave) => Object.keys(save.fishopedia).length

/** A fish landed: the turn before and after it, and what was caught. */
export function rulerHookedCatchDeeds(
  before: RunSave,
  after: RunSave,
  caught: CatchResult | null,
): string[] {
  if (!caught || before.saveId !== after.saveId) return []
  const codes = ['ruler-hooked-first-catch']
  if (caught.rarity === 'LEGENDARY' || caught.rarity === 'MYTHIC')
    codes.push('ruler-hooked-legendary-catch')
  if (caught.quality === 'TROPHY') codes.push('ruler-hooked-trophy-catch')
  const was = species(before)
  const now = species(after)
  if (was < RULER_HOOKED_NATURALIST && now >= RULER_HOOKED_NATURALIST)
    codes.push('ruler-hooked-naturalist')
  if (was < RULER_HOOKED_FISH.length && now >= RULER_HOOKED_FISH.length)
    codes.push('ruler-hooked-fishopedia-complete')
  return codes
}

/** A card choice that closes one of the story arcs. */
export function rulerHookedChoiceDeeds(effects: Effect | undefined): string[] {
  const done = effects?.arc?.complete
  const code = done ? RULER_HOOKED_ARC_CODES[done] : undefined
  return code ? [code] : []
}

/** An ending the ruler accepted. */
export function rulerHookedEndingDeeds(endingKey: string): string[] {
  const code = RULER_HOOKED_ENDING_CODES[endingKey]
  return code ? [code] : []
}

/** A correct quiz answer: running totals per subject, kept across reigns. */
export function rulerHookedQuizDeeds(module: string, total: number): string[] {
  const codes: string[] = []
  if (total >= RULER_HOOKED_SCHOLAR) codes.push('ruler-hooked-scholar')
  if (module === 'mandarin' && total >= RULER_HOOKED_FLUENT)
    codes.push('ruler-hooked-fluent')
  return codes
}
