import personalCards from './personalCardsV10.json'
import { drawForCharacter, v10Pool } from './castDeckV10'
import {
  CAST_CARDS_V10,
  DEED_FLAGS,
  PERSONAL_CARDS_V10,
  V6_CARDS,
  locationHash,
  v6Card,
  v6CardProblems,
  type JourneyRules,
  type V6Card,
  type V6Choice,
} from './deckV6'
import { PREMADE_CHARACTERS, type ShiftingCharacter } from './characters'

// zuzu-shifting-lands/t-053 (Silas, 2026-11-12 PT): "Shifting lands Characters
// can still have special character only events, cards, or options ... there's
// zero reason they can't be personalized to them."
//
// A personal road is an optional layer on a V10 journey, recorded on the
// ledger as `personalDeckVersion` (saveLedgerV10.ts). V10 saves written before
// it have no such field and replay exactly as before. On a personal road:
// - each premade starts holding its identity deed, which only it can have;
// - at a location where it has its own card, that card is dealt three times in
//   four, before any cameo or shared card;
// - a shared card it can be dealt carries its own extra choices, gated on its
//   identity deed, and nobody else ever sees them.
// A custom traveler walks the shared road; it has no identity deed or cards.

export const PERSONAL_DECK_VERSION: number = personalCards.schemaVersion
const PERSONAL_ODDS = 4
const PERSONAL_SALT = 0x27d4eb2f

export type PersonalCard = V6Card & { owner: string }
export type PersonalOption = { owner: string; cardId: string; choice: V6Choice }

export const PERSONAL_CARDS: readonly PersonalCard[] = PERSONAL_CARDS_V10
export const PERSONAL_OPTIONS =
  personalCards.options as unknown as readonly PersonalOption[]

// Who you are, as a deed a gate can read. Kept beside DEED_FLAGS rather than in
// it: no shared card grants these, and the V6 deck contract checks that every
// deed in DEED_FLAGS is earned somewhere.
export const IDENTITY_DEEDS: Readonly<
  Record<string, { flag: string; label: string }>
> = {
  zuzu: {
    flag: 'deed-ronin-from-afar',
    label: 'you keep a code from a land nobody here knows',
  },
  'jeffery-mittens': {
    flag: 'deed-quartermaster-to-the-barefoot',
    label: 'you are quartermaster to the barefoot',
  },
  'fennec-siblings': {
    flag: 'deed-bao-on-your-hip',
    label: 'your little brother Bao rides on your hip',
  },
}
const identityFlags = new Set(
  Object.values(IDENTITY_DEEDS).map((deed) => deed.flag),
)

export const identityDeed = (characterId: string): string | null =>
  Object.hasOwn(IDENTITY_DEEDS, characterId)
    ? IDENTITY_DEEDS[characterId]!.flag
    : null

// The flags a personal road starts with: signature deeds, then identity.
export function personalStartFlags(
  character: Pick<ShiftingCharacter, 'id' | 'signatureFlags'>,
): string[] {
  const identity = identityDeed(character.id)
  return [
    ...character.signatureFlags,
    ...(identity && !character.signatureFlags.includes(identity)
      ? [identity]
      : []),
  ]
}

export const personalCardsFor = (characterId: string): PersonalCard[] =>
  PERSONAL_CARDS.filter((card) => card.owner === characterId)

export const personalOptionsFor = (characterId: string): PersonalOption[] =>
  PERSONAL_OPTIONS.filter((option) => option.owner === characterId)

export function personalCardAt(
  locationId: string,
  characterId: string,
): PersonalCard | null {
  return (
    PERSONAL_CARDS.find(
      (card) => card.owner === characterId && card.locationId === locationId,
    ) ?? null
  )
}

// A card as this traveler sees it: a shared card gains their own choices; a
// card owned by someone else is never theirs to see.
export function personalCardView(
  card: V6Card,
  character: Pick<ShiftingCharacter, 'id'>,
): V6Card | null {
  const owner = (card as Partial<PersonalCard>).owner
  if (owner !== undefined && owner !== character.id) return null
  const extra = PERSONAL_OPTIONS.filter(
    (option) => option.owner === character.id && option.cardId === card.id,
  ).map((option) => option.choice)
  return extra.length ? { ...card, choices: [...card.choices, ...extra] } : card
}

export function personalCardLookup(
  cardId: string,
  character: Pick<ShiftingCharacter, 'id'>,
): V6Card | null {
  const card = v6Card(cardId)
  return card ? personalCardView(card, character) : null
}

export function drawPersonal(
  seed: number,
  locationId: string,
  character: ShiftingCharacter,
): V6Card | null {
  const own = personalCardAt(locationId, character.id)
  if (
    own &&
    locationHash((seed ^ PERSONAL_SALT) >>> 0, locationId) % PERSONAL_ODDS !== 0
  )
    return own
  return drawForCharacter(seed, locationId, character)
}

// Every card this traveler can be dealt at a location on a personal road.
export function personalPool(
  locationId: string,
  character: ShiftingCharacter,
): V6Card[] {
  const own = personalCardAt(locationId, character.id)
  return [...(own ? [own] : []), ...v10Pool(locationId, character)]
}

export function personalRulesFor(character: ShiftingCharacter): JourneyRules {
  return {
    skills: character.skills,
    draw: (seed, locationId) => drawPersonal(seed, locationId, character),
    card: (cardId) => personalCardLookup(cardId, character),
  }
}

// The personal content contract: every own card meets the deck's per-card
// floor at a known location, one per traveler per location, owned by a
// premade; every own choice sits on a real shared card, keeps that card's
// choice ids unique, is gated on the owner's identity deed, and meets the same
// per-choice floor as any other route.
export function validatePersonalDeckV10(): string[] {
  const errors: string[] = []
  const premades = new Set<string>(PREMADE_CHARACTERS.map((entry) => entry.id))
  const taken = new Set([
    ...V6_CARDS.map((card) => card.id),
    ...CAST_CARDS_V10.map((card) => card.id),
  ])
  const placed = new Set<string>()
  for (const card of PERSONAL_CARDS) {
    if (taken.has(card.id)) errors.push(`${card.id}: repeated card id`)
    taken.add(card.id)
    if (!premades.has(card.owner) || !identityDeed(card.owner))
      errors.push(`${card.id}: owned by ${card.owner}, not a premade`)
    const slot = `${card.owner}@${card.locationId}`
    if (placed.has(slot)) errors.push(`${card.id}: second own card at ${slot}`)
    placed.add(slot)
    if ((card as { cast?: unknown }).cast)
      errors.push(`${card.id}: own cards feature no cast`)
    if (typeof card.art !== 'string' || !card.art.startsWith('/'))
      errors.push(`${card.id}: needs a card face`)
    errors.push(...v6CardProblems(card))
  }
  for (const option of PERSONAL_OPTIONS) {
    const where = `${option.cardId}/${option.choice.id}`
    const card = V6_CARDS.find((entry) => entry.id === option.cardId)
    if (!card) {
      errors.push(`${where}: not a shared card`)
      continue
    }
    const deed = identityDeed(option.owner)
    if (!premades.has(option.owner) || !deed)
      errors.push(`${where}: owned by ${option.owner}, not a premade`)
    if (/\bZuzu\b/.test(JSON.stringify(option.choice)))
      errors.push(`${where}: names the hero`)
    // Where the owner has a card of their own, it is dealt three times in
    // four, which would leave a choice there all but unreachable.
    if (personalCardAt(card.locationId, option.owner))
      errors.push(`${where}: shares a location with ${option.owner}'s own card`)
    if (!option.choice.requires?.anyFlags.includes(deed ?? ''))
      errors.push(`${where}: own choices are gated on the owner's identity`)
    for (const flag of option.choice.requires?.anyFlags ?? [])
      if (!Object.hasOwn(DEED_FLAGS, flag) && !identityFlags.has(flag))
        errors.push(`${where}: gate on non-deed flag ${flag}`)
    const ids = [
      ...card.choices,
      ...PERSONAL_OPTIONS.filter(
        (other) =>
          other.cardId === option.cardId && other.owner === option.owner,
      ).map((other) => other.choice),
    ].map((choice) => choice.id)
    if (ids.filter((id) => id === option.choice.id).length !== 1)
      errors.push(`${where}: repeated choice id`)
    // The shared floor, run on a one-choice copy of the card with a free
    // route beside it so only this choice's own problems are reported.
    const probe: V6Card = {
      ...card,
      choices: [option.choice, ...card.choices.slice(0, 2)],
    }
    errors.push(
      ...v6CardProblems(probe).filter(
        (problem) =>
          problem.startsWith(`${card.id}/${option.choice.id}:`) &&
          !problem.includes('gate on non-deed flag'),
      ),
    )
  }
  for (const card of PERSONAL_CARDS)
    for (const choice of card.choices)
      for (const flag of choice.requires?.anyFlags ?? [])
        if (identityFlags.has(flag))
          errors.push(
            `${card.id}/${choice.id}: own cards need no identity gate`,
          )
  return errors
}
