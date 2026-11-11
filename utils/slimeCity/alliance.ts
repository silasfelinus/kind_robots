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
// Any mix of either crew's cards and mercenaries is legal (Silas, 2026-11-08
// PT: "drop the 12 creature minimum").
//
// Silas, 2026-11-09 PT: "lets change alliance to also use 20 cards." Saves
// holding a retired 30-card deck drop just that deck (storySave.ts) instead of
// failing the whole story.
//
// SOLO CLASH is its own format: one faction's 20-card deck, built from that
// faction and the mercenaries. It is what City and Story bouts deal. Pure data
// and legality only; the power effects run in clash.ts.
import { BASE_CARD_SET } from './baseCollection'
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

/**
 * The base collection every account owns (baseCollection.ts): each crew's
 * 20-card Solo deck plus twenty mercenaries. Every starter deck fits inside it.
 */
export const STARTER_CARD_IDS: ReadonlySet<string> = BASE_CARD_SET

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

/** Creatures and specials from a crew's Clash deck, spread across the curve. */
function crewSlice(team: TeamId, creatures: number, specials: number) {
  const sorted = clashDeck(team)
    .map(cardById)
    .sort((a, b) => a.cost - b.cost || a.id.localeCompare(b.id))
  return [
    ...spread(
      sorted.filter((c) => c.kind === 'creature'),
      creatures,
    ),
    ...spread(
      sorted.filter((c) => c.kind !== 'creature'),
      specials,
    ),
  ].map((c) => c.id)
}

/**
 * A ready-to-play 20-card alliance deck, led by the general like the 30-card
 * starter it replaced: fifteen cards from the general's Clash deck (eight
 * creatures, seven specials) and a five-card splash from the second faction's
 * (two creatures, three specials), each spread across the cost curve. Even
 * splits let CALL IN THE DEBT dominate (Exchange won 64-82% of CPU games);
 * this one kept every general within 41-59% over 20 seeds a pairing. Always
 * legal.
 */
export type AllianceStarterMix = 'classic' | 'fighter-forward' | 'ally-forward'

/** Testable starting recipes made exclusively from the account's base cards.
 * These are deckbuilding options, not automatic replacements for saved decks. */
export function allianceStarterWithMix(
  general: TeamId,
  ally: TeamId,
  mix: AllianceStarterMix,
): AllianceDeck {
  const parts =
    mix === 'fighter-forward'
      ? [8, 5, 4, 3]
      : mix === 'ally-forward'
        ? [6, 5, 4, 5]
        : [8, 7, 2, 3]
  const cards = [
    ...crewSlice(general, parts[0]!, parts[1]!),
    ...crewSlice(ally, parts[2]!, parts[3]!),
  ]
  return { general, ally, cards }
}

export function allianceStarter(general: TeamId, ally: TeamId): AllianceDeck {
  return allianceStarterWithMix(general, ally, 'classic')
}

/** Preserve a valid older 30-card Alliance as a deterministic 20-card deck.
 * Reject malformed, cross-faction or repeated-card records rather than
 * silently substituting a different player's collection. */
export function normalizeLegacyAllianceDeck(
  raw: unknown,
): AllianceDeck | undefined {
  if (validAllianceDeck(raw)) return raw
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const value = raw as Record<string, unknown>
  if (
    !isTeam(value.general) ||
    !isTeam(value.ally) ||
    value.general === value.ally ||
    !Array.isArray(value.cards) ||
    value.cards.length !== 30 ||
    !value.cards.every((id) => typeof id === 'string')
  )
    return undefined
  const original: AllianceDeck = {
    general: value.general,
    ally: value.ally,
    cards: value.cards as string[],
  }
  if (
    allianceProblems(original).some(
      (problem) =>
        problem !== 'Requires exactly ' + ALLIANCE_DECK_SIZE + ' cards',
    )
  )
    return undefined
  const candidate: AllianceDeck = {
    ...original,
    cards: spread(original.cards, ALLIANCE_DECK_SIZE),
  }
  return validAllianceDeck(candidate) ? candidate : undefined
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

/**
 * The COLLECTION deck library (Silas, 2026-11-10 PT): "the user adds, copies,
 * deletes, edits decks ... no other building rules, can be loading into the
 * various game modes as appropriate" and the collection deckbuilder "should be
 * treated as alliance default". A named Alliance deck; it may be unfinished
 * (fewer than 20 cards) while it is being built, and only plays once legal.
 */
export interface LibraryDeck extends AllianceDeck {
  id: string
  name: string
}
export const LIBRARY_MAX_DECKS = 12
export const LIBRARY_NAME_MAX = 32

/** Why a library deck is malformed (an unfinished deck is fine), or ''. */
export function libraryDeckProblem(raw: unknown): string {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 'Not a deck'
  const v = raw as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id || v.id.length > 40) return 'Bad id'
  if (
    typeof v.name !== 'string' ||
    !v.name.trim() ||
    v.name.length > LIBRARY_NAME_MAX
  )
    return 'Bad name'
  if (!isTeam(v.general) || !isTeam(v.ally) || v.general === v.ally)
    return 'Pick two different factions'
  if (
    !Array.isArray(v.cards) ||
    v.cards.length > ALLIANCE_DECK_SIZE ||
    !v.cards.every((id) => typeof id === 'string')
  )
    return 'Bad cards'
  const ids = v.cards as string[]
  if (new Set(ids).size !== ids.length) return 'Cannot repeat cards'
  const pool = new Set(allianceCardPool(v.general, v.ally).map((c) => c.id))
  if (ids.some((id) => !pool.has(id)))
    return 'Cards must come from your two factions or the mercenaries'
  return ''
}
export function validLibrary(raw: unknown): raw is LibraryDeck[] {
  return (
    Array.isArray(raw) &&
    raw.length <= LIBRARY_MAX_DECKS &&
    new Set(raw.map((deck) => (deck as LibraryDeck)?.id)).size === raw.length &&
    raw.every((deck) => libraryDeckProblem(deck) === '')
  )
}
/** A library entry built from an Alliance deck. */
export function libraryDeck(
  deck: AllianceDeck,
  id: string,
  name: string,
): LibraryDeck {
  return {
    id,
    name: name.trim().slice(0, LIBRARY_NAME_MAX) || 'Deck',
    general: deck.general,
    ally: deck.ally,
    cards: [...deck.cards],
  }
}
