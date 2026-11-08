// Registry of data-driven Clash evolutions (see evolutions/dsl.ts). The first
// seventy cards keep their hand-built twists in clashTwists.ts; every other card
// evolves through a CardEvolution authored per faction in evolutions/*.ts.
import { CARDS, type Card } from './prototypes'
import { CLASH_TWISTS } from './clashTwists'
import {
  evoStageText,
  type CardEvolution,
  type EvoStage,
} from './evolutions/dsl'
import { CATGIRL_EVOLUTIONS } from './evolutions/catgirls'

export const CLASH_EVOLUTIONS: Record<string, CardEvolution> = {
  ...CATGIRL_EVOLUTIONS,
}

/** The stage a card runs at `level` (2 or 3), or undefined. Hand-built twist
 * cards never also run a data stage. */
export function clashEvolutionStage(
  id: string,
  level: number,
): EvoStage | undefined {
  if (level < 2 || CLASH_TWISTS[id]) return undefined
  const evo = CLASH_EVOLUTIONS[id]
  return evo ? evo[level >= 3 ? 3 : 2] : undefined
}

/** A card's trajectory stat changes at a level (crafted cards only). */
export function clashEvolutionStats(
  id: string,
  level: number,
): { attack?: number; hp?: number } | undefined {
  if (CLASH_TWISTS[id]) return undefined
  const lv = (level >= 3 ? 3 : level <= 1 ? 1 : 2) as 1 | 2 | 3
  return CLASH_EVOLUTIONS[id]?.stats?.[lv]
}

/** Generated rules text for a card's evolved stage ('' at level 1). */
export function clashEvolutionText(card: Card, level: number): string {
  const st = clashEvolutionStage(card.id, level)
  return st ? evoStageText(st, card.kind) : ''
}

/** The stage name a card wears at a level: its own name at level 1. */
export function clashStageTitle(id: string, level: number): string {
  const evo = CLASH_TWISTS[id] ? undefined : CLASH_EVOLUTIONS[id]
  if (!evo) return ''
  if (level < 2) return evo.base ?? CARDS.find((c) => c.id === id)?.name ?? ''
  return evo[level >= 3 ? 3 : 2].title
}
