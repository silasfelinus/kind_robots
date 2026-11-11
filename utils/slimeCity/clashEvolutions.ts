// Registry of data-driven Clash evolutions (see evolutions/dsl.ts). The first
// seventy cards keep their hand-built twists in clashTwists.ts; every other card
// evolves through a CardEvolution authored per faction in evolutions/*.ts.
import { CARDS, type Card } from './prototypes'
import { CLASH_TWISTS } from './clashTwists'
import {
  evoStageText,
  type CardEvolution,
  type EvoCondition,
  type EvoStage,
} from './evolutions/dsl'
import { CATGIRL_EVOLUTIONS } from './evolutions/catgirls'
import { BLOODFAIRY_EVOLUTIONS } from './evolutions/bloodfairies'
import { IRONJAW_EVOLUTIONS } from './evolutions/ironjaw'
import { RIOT_EVOLUTIONS } from './evolutions/riot'
import { UNDERTOW_EVOLUTIONS } from './evolutions/undertow'
import { EXCHANGE_EVOLUTIONS } from './evolutions/exchange'
import { MERCENARY_A_EVOLUTIONS } from './evolutions/mercenaryA'
import { MERCENARY_B_EVOLUTIONS } from './evolutions/mercenaryB'

export const CLASH_EVOLUTIONS: Record<string, CardEvolution> = {
  ...CATGIRL_EVOLUTIONS,
  ...BLOODFAIRY_EVOLUTIONS,
  ...IRONJAW_EVOLUTIONS,
  ...RIOT_EVOLUTIONS,
  ...UNDERTOW_EVOLUTIONS,
  ...EXCHANGE_EVOLUTIONS,
  ...MERCENARY_A_EVOLUTIONS,
  ...MERCENARY_B_EVOLUTIONS,
}

/** Which level-three option a play picks: 0 is the card's main level
 * three, 1 its alternative (only on cards with a choose-one level three). */
export type EvoPick = 0 | 1

/** The two level-three options of a choose-one card, else undefined. */
export function clashEvolutionChoice(
  id: string,
  level: number,
): [EvoStage, EvoStage] | undefined {
  if (level < 3 || CLASH_TWISTS[id]) return undefined
  const evo = CLASH_EVOLUTIONS[id]
  return evo?.choice ? [evo[3], evo.choice.stage] : undefined
}

/** The condition under which the CPU takes the main level three. */
export function clashEvolutionCpuPick(id: string): EvoCondition | undefined {
  return CLASH_TWISTS[id] ? undefined : CLASH_EVOLUTIONS[id]?.choice?.cpu
}

/** The authored stage at level 1, 2 or 3 (if present). A level-one
 * signature is optional: existing cards still use their base keywords.
 * Hand-built twists never also run a data stage. */
export function clashEvolutionStage(
  id: string,
  level: number,
  pick: EvoPick = 0,
): EvoStage | undefined {
  if (CLASH_TWISTS[id]) return undefined
  const evo = CLASH_EVOLUTIONS[id]
  if (!evo) return undefined
  if (level < 2) return evo[1]
  if (level < 3) return evo[2]
  return pick === 1 && evo.choice ? evo.choice.stage : evo[3]
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

/** Generated rules text for a card's evolved stage ('' at level 1). A
 * choose-one level three with no pick yet shows both options. */
export function clashEvolutionText(
  card: Card,
  level: number,
  pick?: EvoPick,
): string {
  const both =
    pick === undefined ? clashEvolutionChoice(card.id, level) : undefined
  // The card face names both; the play picker shows each option's rules.
  if (both)
    return (
      'Choose: ' + both[0].title + ' / ' + both[1].title + '.'
    )
  const st = clashEvolutionStage(card.id, level, pick ?? 0)
  return st ? evoStageText(st, card.kind) : ''
}

/** The stage name a card wears at a level: its own name at level 1. */
export function clashStageTitle(
  id: string,
  level: number,
  pick?: EvoPick,
): string {
  const evo = CLASH_TWISTS[id] ? undefined : CLASH_EVOLUTIONS[id]
  if (!evo) return ''
  if (level < 2) return evo.base ?? CARDS.find((c) => c.id === id)?.name ?? ''
  if (level < 3) return evo[2].title
  if (evo.choice && pick === undefined)
    return evo[3].title + ' / ' + evo.choice.stage.title
  return clashEvolutionStage(id, 3, pick ?? 0)!.title
}
