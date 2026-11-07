// ALLIANCE: Slime City's two-faction Clash format.
// Silas, 2026-11-07 PT: "I want a new mode where the factions can be combined.
// 30 card decks. Needs to be supported in clash and in deck builder modes.
// Also want the idea of a faction power. So if you have two factions, one is
// the general and the deck uses their power. Power should be one time use
// during a match."
//
// Silas, 2026-11-07 PT, clarifying: "Factions combined means you pick two
// factions, one of them is general, and you can make a 30 card deck using
// either faction or mercs."
//
// A deck names TWO crews: the GENERAL (whose power it carries) and the ALLY.
// Any mix of either crew's cards and mercenaries is legal. Pure data and
// legality only; the power effects run in clash.ts.
import { alleyDeck } from './alleys'
import { CARDS, TEAMS, cardById, type Card, type TeamId } from './prototypes'

export const ALLIANCE_DECK_SIZE = 30
/** Clash needs bodies in the alleys: at least two fighters in five. */
export const ALLIANCE_MIN_CREATURES = 12

export interface AllianceDeck {
  /** The leading crew. Its faction power is the deck's power. */
  general: TeamId
  /** The second crew; always a different crew from the general. */
  ally: TeamId
  cards: string[]
}

/** What a faction power needs pointed at it. */
export type PowerTarget = 'own' | 'enemy' | 'none'
export interface FactionPower {
  team: TeamId
  name: string
  /** Rules text: exactly what the code in clash.ts does. */
  text: string
  target: PowerTarget
  symbol: string
}

/**
 * One faction power per crew, usable once per Alliance match during your own
 * card-play phase. It does not spend a card play.
 */
export const FACTION_POWERS: Record<TeamId, FactionPower> = {
  catgirls: {
    team: 'catgirls',
    name: 'NINE LIVES',
    text: 'Every fighter you have returns to full life, shakes off its stun, gains +2 power this round and may strike this turn, even if it just landed.',
    target: 'none',
    symbol: '🐾',
  },
  bloodfairies: {
    team: 'bloodfairies',
    name: 'MOSH PIT',
    text: 'Every fighter you have gains +3 power until the round ends.',
    target: 'none',
    symbol: '🦇',
  },
  ironjaw: {
    team: 'ironjaw',
    name: 'UNION WALL',
    text: 'Every fighter you have gains +3 armor until your next turn.',
    target: 'none',
    symbol: '🛡',
  },
  riot: {
    team: 'riot',
    name: 'FUSE BOX',
    text: 'Deal 2 damage to every rival fighter.',
    target: 'none',
    symbol: '💥',
  },
  undertow: {
    team: 'undertow',
    name: 'SEWER SNIPE',
    text: 'Deal 5 damage to a rival fighter, ignoring armor, and stun it.',
    target: 'enemy',
    symbol: '🎯',
  },
  exchange: {
    team: 'exchange',
    name: 'CALL IN THE DEBT',
    text: 'The rival boss loses 5 life and your boss gains 5 (up to its maximum).',
    target: 'none',
    symbol: '💰',
  },
}

export function factionPower(team: TeamId): FactionPower {
  return FACTION_POWERS[team]
}

/** Cards an alliance deck may hold: general, ally and mercenaries. */
export function allianceCardPool(general: TeamId, ally: TeamId): Card[] {
  return CARDS.filter(
    (card) =>
      card.team === general || card.team === ally || card.team === 'mercenary',
  )
}

const isTeam = (v: unknown): v is TeamId =>
  typeof v === 'string' && TEAMS.some((t) => t.id === v)

/** Why an alliance deck is not legal, or an empty list. */
export function allianceProblems(deck: AllianceDeck): string[] {
  const out: string[] = []
  if (!isTeam(deck.general)) return ['Choose a general faction']
  if (!isTeam(deck.ally)) return ['Choose a second faction']
  if (deck.ally === deck.general) out.push('Pick two different factions')
  const ids = deck.cards
  if (ids.length !== ALLIANCE_DECK_SIZE)
    out.push('Requires exactly ' + ALLIANCE_DECK_SIZE + ' cards')
  if (new Set(ids).size !== ids.length) out.push('Cannot repeat cards')
  const cards = ids.map((id) => CARDS.find((card) => card.id === id))
  if (cards.some((card) => !card)) return [...out, 'Unknown card']
  const known = cards as Card[]
  if (
    known.some(
      (card) =>
        card.team !== deck.general &&
        card.team !== deck.ally &&
        card.team !== 'mercenary',
    )
  )
    out.push('Cards must come from your two factions or the mercenaries')
  if (
    known.filter((card) => card.kind === 'creature').length <
    ALLIANCE_MIN_CREATURES
  )
    out.push('Requires at least ' + ALLIANCE_MIN_CREATURES + ' creatures')
  return out
}

function spread<T>(items: T[], count: number): T[] {
  if (items.length <= count) return [...items]
  return Array.from(
    { length: count },
    (_, i) => items[Math.floor(((i + 0.5) * items.length) / count)]!,
  )
}

/**
 * A ready-to-play 30-card alliance deck: the general's 20-card Clash deck plus
 * five creatures and five specials from the second faction's Clash deck,
 * spread across the cost curve. Always legal.
 */
export function allianceStarter(general: TeamId, ally: TeamId): AllianceDeck {
  const base = alleyDeck(general)
  const byCost = (a: Card, b: Card) =>
    a.cost - b.cost || a.id.localeCompare(b.id)
  const sorted = alleyDeck(ally).map(cardById).sort(byCost)
  const creatures = spread(
    sorted.filter((c) => c.kind === 'creature'),
    5,
  )
  const specials = spread(
    sorted.filter((c) => c.kind !== 'creature'),
    5,
  )
  return {
    general,
    ally,
    cards: [...base, ...[...creatures, ...specials].map((c) => c.id)],
  }
}

/** The same two factions with the other one as general: same cards. */
export function swapGeneral(deck: AllianceDeck): AllianceDeck {
  return { general: deck.ally, ally: deck.general, cards: [...deck.cards] }
}

/** A seeded CPU alliance: the rival general plus an ally it picks by seed. */
export function cpuAlliance(general: TeamId, seed: number): AllianceDeck {
  const others = TEAMS.map((t) => t.id).filter((id) => id !== general)
  const ally = others[Math.abs(Math.floor(seed)) % others.length]!
  return allianceStarter(general, ally)
}

/** Validate an untrusted saved alliance record (story saves). */
export function validAllianceDeck(raw: unknown): raw is AllianceDeck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const v = raw as Record<string, unknown>
  return (
    isTeam(v.general) &&
    isTeam(v.ally) &&
    Array.isArray(v.cards) &&
    v.cards.length <= 60 &&
    v.cards.every((id) => typeof id === 'string') &&
    allianceProblems(v as unknown as AllianceDeck).length === 0
  )
}
