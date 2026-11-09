// ALLIANCE: Slime City's two-faction Clash format.
// Silas, 2026-11-07 PT: "I want a new mode where the factions can be combined.
// Alliance decks used to hold 30 cards; all modes now use 20.
// Also want the idea of a faction power. So if you have two factions, one is
// the general and the deck uses their power. Power should be one time use
// during a match."
//
// Silas, 2026-11-07 PT, clarifying: "Factions combined means you pick two
// factions, one of them is general, and you can make a deck using
// either faction or mercs."
//
// A deck names TWO crews: the GENERAL (whose power it carries) and the ALLY.
// Any mix of either crew's cards and mercenaries is legal (Silas, 2026-11-08
// PT: "drop the 12 creature minimum").
//
// SOLO CLASH is its own format: one faction's 20-card deck, built from that
// faction and the mercenaries. It is what City and Story bouts deal. Pure data
// and legality only; the power effects run in clash.ts.
import { alleyDeck } from './alleys'
import { CLASH_DECK_SIZE, clashDeck } from './clash'
import { CARDS, TEAMS, cardById, type Card, type TeamId } from './prototypes'
export {
  FACTION_POWERS,
  factionPower,
  type FactionPower,
  type PowerTarget,
} from './factionPowers'

export const ALLIANCE_DECK_SIZE = CLASH_DECK_SIZE
/** SOLO CLASH: one faction, the canonical 20-card Clash deck. */
export const SOLO_DECK_SIZE = CLASH_DECK_SIZE

export interface AllianceDeck {
  /** The leading crew. Its faction power is the deck's power. */
  general: TeamId
  /** The second crew; always a different crew from the general. */
  ally: TeamId
  cards: string[]
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
 * A ready-to-play 20-card alliance: ten cards from each faction, spread
 * evenly across creatures and specials. Both crews matter from turn one.
 */
export function allianceStarter(general: TeamId, ally: TeamId): AllianceDeck {
  const ten = (team: TeamId): string[] => {
    const byCost = (a: Card, b: Card) =>
      a.cost - b.cost || a.id.localeCompare(b.id)
    const sorted = alleyDeck(team).map(cardById).sort(byCost)
    const creatures = spread(sorted.filter((c) => c.kind === 'creature'), 5)
    const specials = spread(sorted.filter((c) => c.kind !== 'creature'), 5)
    return [...creatures, ...specials].map((c) => c.id)
  }
  return { general, ally, cards: [...ten(general), ...ten(ally)] }
}

/** Normalize an older 30-card alliance while preserving its selected cards. */
export function normalizedAllianceDeck(deck: AllianceDeck): AllianceDeck {
  if (allianceProblems(deck).length === 0) return deck
  if (
    !isTeam(deck.general) ||
    !isTeam(deck.ally) ||
    deck.general === deck.ally ||
    !Array.isArray(deck.cards)
  )
    return allianceStarter('catgirls', 'bloodfairies')
  const allowed = new Set(allianceCardPool(deck.general, deck.ally).map((c) => c.id))
  const unique = [...new Set(deck.cards.filter((id) => allowed.has(id)))]
  const preserved = spread(unique, ALLIANCE_DECK_SIZE)
  const fill = allianceStarter(deck.general, deck.ally).cards.filter(
    (id) => !preserved.includes(id),
  )
  const candidate = {
    ...deck,
    cards: [...preserved, ...fill].slice(0, ALLIANCE_DECK_SIZE),
  }
  return allianceProblems(candidate).length
    ? allianceStarter(deck.general, deck.ally)
    : candidate
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

/** Why a SOLO CLASH deck for `team` is not legal, or an empty list. */
export function soloProblems(team: TeamId, ids: readonly string[]): string[] {
  if (!isTeam(team)) return ['Choose a faction']
  const out: string[] = []
  if (ids.length !== SOLO_DECK_SIZE)
    out.push('Requires exactly ' + SOLO_DECK_SIZE + ' cards')
  if (new Set(ids).size !== ids.length) out.push('Cannot repeat cards')
  const cards = ids.map((id) => CARDS.find((card) => card.id === id))
  if (cards.some((card) => !card)) return [...out, 'Unknown card']
  if ((cards as Card[]).some((c) => c.team !== team && c.team !== 'mercenary'))
    out.push('Cards must come from your faction or the mercenaries')
  return out
}
/** The faction's ready-to-play Solo deck: its canonical Clash deck. */
export function soloStarter(team: TeamId): string[] {
  return clashDeck(team)
}
/** Cards a Solo deck may hold: the faction's and the mercenaries'. */
export function soloCardPool(team: TeamId): Card[] {
  return CARDS.filter((c) => c.team === team || c.team === 'mercenary')
}
/** Validate an untrusted saved Solo deck (story saves). */
export function validSoloDeck(team: unknown, raw: unknown): boolean {
  return (
    isTeam(team) &&
    Array.isArray(raw) &&
    raw.length <= 60 &&
    raw.every((id) => typeof id === 'string') &&
    soloProblems(team, raw as string[]).length === 0
  )
}
