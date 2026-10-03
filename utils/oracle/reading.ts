// /utils/oracle/reading.ts
//
// Pure, seedable draw and reading assembly. Every layer is looked up from authored
// content, never generated: opening, per-card passage, pair text, closing.

import { seededRandom } from './rng'
import { ORACLE_SPREADS } from './spreads'
import type {
  OracleCard,
  OracleContent,
  OracleDrawnCard,
  OracleOrientation,
  OraclePairKind,
  OracleReading,
  OracleSpreadId,
} from './types'

export const sortedPairKey = (a: string, b: string): string => (a <= b ? `${a}|${b}` : `${b}|${a}`)

/** Draw without replacement; each card is reversed with probability 1/2. */
export const drawSpread = (
  deck: readonly OracleCard[],
  spreadId: OracleSpreadId,
  seed: string,
): OracleDrawnCard[] => {
  const spread = ORACLE_SPREADS[spreadId]
  if (deck.length < spread.positions.length) {
    throw new Error(`deck of ${deck.length} cannot fill ${spread.positions.length} positions`)
  }
  const rand = seededRandom(`${seed}:${spreadId}`)
  const pool = [...deck]
  return spread.positions.map((position) => {
    const card = pool.splice(Math.floor(rand() * pool.length), 1)[0]
    const orientation: OracleOrientation = rand() < 0.5 ? 'upright' : 'reversed'
    return { card, orientation, position }
  })
}

const pick = <T>(items: readonly T[], seed: string, salt: string): T => {
  if (!items.length) throw new Error(`no variants for ${salt}`)
  return items[Math.floor(seededRandom(`${seed}:${salt}`)() * items.length)]
}

/** Bespoke passage if authored, else the position frame wrapping the card's own text. */
export const passageFor = (content: OracleContent, drawn: OracleDrawnCard): string => {
  const { card, orientation, position } = drawn
  const bespoke = content.positionText[position.id]?.[card.id]?.[orientation]
  if (bespoke) return bespoke
  const name = `${card.title}${orientation === 'reversed' ? ' (reversed)' : ''}`
  return `${position.frame.replace('{card}', name)} ${card[orientation]}`
}

/** Special pair first, then the energy pair keyed by shared/differing orientation. */
export const pairTextFor = (
  content: OracleContent,
  a: OracleDrawnCard,
  b: OracleDrawnCard,
): string | null => {
  const special = content.specialPairs[sortedPairKey(a.card.id, b.card.id)]
  if (special) return special
  const kind: OraclePairKind = a.orientation === b.orientation ? 'echo' : 'contrast'
  return content.energyPairs[`${sortedPairKey(a.card.energy, b.card.energy)}:${kind}`] ?? null
}

export const buildReading = (
  deck: readonly OracleCard[],
  content: OracleContent,
  spreadId: OracleSpreadId,
  seed: string,
): OracleReading => {
  const cards = drawSpread(deck, spreadId, seed)
  const opening = pick(content.openings[spreadId], seed, `open:${spreadId}`)
  const passages = cards.map((c) => passageFor(content, c))
  const pairs: string[] = []
  const body: string[] = [opening]
  cards.forEach((c, i) => {
    body.push(passages[i])
    const pair = i < cards.length - 1 ? pairTextFor(content, c, cards[i + 1]) : null
    if (pair) {
      pairs.push(pair)
      body.push(pair)
    }
  })
  const last = cards[cards.length - 1].card
  const closing = `${pick(content.closings[spreadId], seed, `close:${spreadId}`)} ${last.prompt}`
  body.push(closing)
  return { seed, spread: spreadId, cards, opening, passages, pairs, closing, text: body.join('\n\n') }
}
