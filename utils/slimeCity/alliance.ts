// ALLIANCE: Slime City's two-faction Clash format.
// Silas, 2026-11-07 PT: "I want a new mode where the factions can be combined.
// 30 card decks. Needs to be supported in clash and in deck builder modes.
// Also want the idea of a faction power. So if you have two factions, one is
// the general and the deck uses their power. Power should be one time use
// during a match."
//
// A deck has a GENERAL crew (whose power it carries) and an optional ALLY crew.
// Cards come from the general, the ally and the mercenary pool. The general
// leads: its signature is required and it brings at least as many cards as
// the ally. Pure data and legality only; the power effects run in clash.ts.
import { alleyDeck } from './alleys'
import {
  CARDS,
  TEAMS,
  cardById,
  teamById,
  type Card,
  type TeamId,
} from './prototypes'

export const ALLIANCE_DECK_SIZE = 30
/** Clash needs bodies in the alleys: at least two fighters in five. */
export const ALLIANCE_MIN_CREATURES = 12
export const ALLIANCE_MIN_SPECIALS = 6
/** Three of ten in the classic deck, scaled to thirty. */
export const ALLIANCE_MAX_MERCENARIES = 9

export interface AllianceDeck {
  /** The leading crew. Its faction power is the deck's power. */
  general: TeamId
  /** The second crew, or null for a single-crew alliance deck. */
  ally: TeamId | null
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
    text: 'Every fighter you have returns to full life and shakes off its stun.',
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
    text: 'Every fighter you have gains +2 armor until your next turn.',
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
export function allianceCardPool(general: TeamId, ally: TeamId | null): Card[] {
  return CARDS.filter(
    (card) =>
      card.team === general ||
      (ally !== null && card.team === ally) ||
      card.team === 'mercenary',
  )
}

const isTeam = (v: unknown): v is TeamId =>
  typeof v === 'string' && TEAMS.some((t) => t.id === v)

/** Why an alliance deck is not legal, or an empty list. */
export function allianceProblems(deck: AllianceDeck): string[] {
  const out: string[] = []
  if (!isTeam(deck.general)) return ['Choose a general crew']
  if (deck.ally !== null && !isTeam(deck.ally)) return ['Unknown ally crew']
  if (deck.ally === deck.general) out.push('Your ally must be a different crew')
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
    out.push('Cards must belong to your general, your ally or the mercenaries')
  if (
    known.filter((card) => card.team === 'mercenary').length >
    ALLIANCE_MAX_MERCENARIES
  )
    out.push('At most ' + ALLIANCE_MAX_MERCENARIES + ' mercenaries')
  const creatures = known.filter((card) => card.kind === 'creature').length
  if (creatures < ALLIANCE_MIN_CREATURES)
    out.push('Requires at least ' + ALLIANCE_MIN_CREATURES + ' creatures')
  if (known.length - creatures < ALLIANCE_MIN_SPECIALS)
    out.push('Requires at least ' + ALLIANCE_MIN_SPECIALS + ' specials')
  if (!ids.includes(teamById(deck.general).signature))
    out.push('Requires your general’s signature')
  if (deck.ally !== null) {
    const lead = known.filter((card) => card.team === deck.general).length
    const second = known.filter((card) => card.team === deck.ally).length
    if (second > lead)
      out.push('Your general must bring at least as many cards as the ally')
  }
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
 * ten more cards, five creatures and five specials, from the ally (or from
 * the general's own reserves for a single-crew deck), spread across the cost
 * curve. Always legal.
 */
export function allianceStarter(
  general: TeamId,
  ally: TeamId | null = null,
): AllianceDeck {
  const base = alleyDeck(general)
  const byCost = (a: Card, b: Card) =>
    a.cost - b.cost || a.id.localeCompare(b.id)
  const source =
    ally === null || ally === general
      ? CARDS.filter((c) => c.team === general && !base.includes(c.id))
      : alleyDeck(ally)
          .map(cardById)
          .filter((c) => !c.signature)
  const sorted = [...source].sort(byCost)
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
    ally: ally === general ? null : ally,
    cards: [...base, ...[...creatures, ...specials].map((c) => c.id)],
  }
}

/** A seeded CPU alliance: the rival general plus an ally it picks by seed. */
export function cpuAlliance(general: TeamId, seed: number): AllianceDeck {
  const others = TEAMS.map((t) => t.id).filter((id) => id !== general)
  const ally = others[Math.abs(Math.floor(seed)) % others.length] ?? null
  return allianceStarter(general, ally)
}

/** Validate an untrusted saved alliance record (story saves). */
export function validAllianceDeck(raw: unknown): raw is AllianceDeck {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false
  const v = raw as Record<string, unknown>
  return (
    isTeam(v.general) &&
    (v.ally === null || isTeam(v.ally)) &&
    Array.isArray(v.cards) &&
    v.cards.length <= 60 &&
    v.cards.every((id) => typeof id === 'string') &&
    allianceProblems(v as unknown as AllianceDeck).length === 0
  )
}
