// /utils/oracle/validate.ts
//
// Content validator: length budgets, banned words, reversed != upright, and the
// "every combination resolves to complete text" completeness check for pair texts.

import { sortedPairKey } from './reading'
import { ORACLE_SPREAD_IDS } from './spreads'
import type { OracleCard, OracleContent, OracleEnergy } from './types'

export const ORACLE_ENERGIES: OracleEnergy[] = [
  'begin',
  'build',
  'hold',
  'flow',
  'shift',
  'end',
  'open',
]

const BANNED =
  /\b(die|dies|death|dead|doom|doomed|cancer|illness|lawsuit|bankrupt|curse|cursed)\b/i
const wordCount = (s: string): number =>
  s.trim().split(/\s+/).filter(Boolean).length

/** Returns a list of problems; empty means valid. */
export const validateOracle = (
  deck: readonly OracleCard[],
  content: OracleContent,
): string[] => {
  const problems: string[] = []
  const ids = new Set<string>()
  for (const card of deck) {
    if (ids.has(card.id)) problems.push(`duplicate card id ${card.id}`)
    ids.add(card.id)
    for (const o of ['upright', 'reversed'] as const) {
      const n = wordCount(card[o])
      if (n < 25 || n > 45)
        problems.push(`${card.id}.${o}: ${n} words (budget 25-45)`)
      if (BANNED.test(card[o])) problems.push(`${card.id}.${o}: banned word`)
    }
    if (card.upright === card.reversed)
      problems.push(`${card.id}: reversed equals upright`)
    const p = wordCount(card.prompt)
    if (p < 6 || p > 14)
      problems.push(`${card.id}.prompt: ${p} words (budget 6-14)`)
  }
  for (const spread of ORACLE_SPREAD_IDS) {
    if (!content.openings[spread]?.length)
      problems.push(`no openings for ${spread}`)
    if (!content.closings[spread]?.length)
      problems.push(`no closings for ${spread}`)
  }
  for (const [position, byCard] of Object.entries(content.positionText)) {
    for (const [cardId, texts] of Object.entries(byCard ?? {})) {
      if (!ids.has(cardId))
        problems.push(`positionText.${position}.${cardId}: unknown card`)
      for (const o of ['upright', 'reversed'] as const) {
        const text = texts?.[o]
        if (!text) continue
        const n = wordCount(text)
        if (n < 12 || n > 50)
          problems.push(
            `positionText.${position}.${cardId}.${o}: ${n} words (budget 12-50)`,
          )
        if (BANNED.test(text))
          problems.push(`positionText.${position}.${cardId}.${o}: banned word`)
      }
    }
  }
  for (const key of Object.keys(content.specialPairs)) {
    const [a, b] = key.split('|')
    if (!a || !b || !ids.has(a) || !ids.has(b) || sortedPairKey(a, b) !== key)
      problems.push(`special pair ${key}: unknown or unsorted card ids`)
  }
  for (const a of ORACLE_ENERGIES) {
    for (const b of ORACLE_ENERGIES) {
      if (a > b) continue
      for (const kind of ['echo', 'contrast']) {
        if (!content.energyPairs[`${sortedPairKey(a, b)}:${kind}`])
          problems.push(`missing energy pair ${a}+${b}:${kind}`)
      }
    }
  }
  return problems
}
