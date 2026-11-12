import castCards from './castCardsV10.json'
import { BASE_CARD_CAST } from './castTags'
import {
  CAST_CARDS_V10,
  V6_CARDS,
  drawV6Card,
  locationHash,
  v6CardProblems,
  v6Pool,
  weightedCard,
  type JourneyRules,
  type V6Card,
} from './deckV6'
import { CAST_IDS, type ShiftingCharacter } from './characters'
import { JOURNEY_WORLD } from './journey'

// zuzu-shifting-lands/t-052: identity-aware encounters. A V10 journey deals
// from the same V6 draw as before, with two changes: at a location that holds
// cast cameos, one time in CAMEO_ODDS a cameo is dealt instead; and a card that
// features the player's own identity is swapped for its selfVariant, or, when
// it has none, the draw falls to the cards that do not feature them. You never
// meet yourself on the road.

export const CAST_DECK_VERSION = castCards.schemaVersion
const CAMEO_ODDS = 3
const CAMEO_SALT = 0x5bd1e995
const cameos = new Map(CAST_CARDS_V10.map((card) => [card.id, card]))

export function cardCast(cardId: string): readonly string[] {
  return cameos.get(cardId)?.cast ?? BASE_CARD_CAST[cardId] ?? []
}

export const meetsSelf = (
  cardId: string,
  character: Pick<ShiftingCharacter, 'identity'>,
): boolean =>
  cardCast(cardId).some((id) =>
    (character.identity as readonly string[]).includes(id),
  )

function dealtAs(
  card: V6Card,
  character: Pick<ShiftingCharacter, 'identity'>,
): V6Card | null {
  if (!meetsSelf(card.id, character)) return card
  const variantId = cameos.get(card.id)?.selfVariant
  const variant = variantId ? (cameos.get(variantId) ?? null) : null
  return variant && !meetsSelf(variant.id, character) ? variant : null
}

export function cameoPool(locationId: string): V6Card[] {
  return CAST_CARDS_V10.filter(
    (card) => !card.variantOnly && card.locationId === locationId,
  )
}

export function drawForCharacter(
  seed: number,
  locationId: string,
  character: Pick<ShiftingCharacter, 'identity'>,
): V6Card | null {
  const pool = cameoPool(locationId)
  const cameoHash = locationHash((seed ^ CAMEO_SALT) >>> 0, locationId)
  if (pool.length && cameoHash % CAMEO_ODDS === 0) {
    const pick = weightedCard(pool, Math.floor(cameoHash / CAMEO_ODDS))
    const dealt = pick && dealtAs(pick, character)
    if (dealt) return dealt
  }
  const base = drawV6Card(seed, locationId)
  if (base && !meetsSelf(base.id, character)) return base
  return weightedCard(
    v6Pool(locationId).filter((card) => !meetsSelf(card.id, character)),
    locationHash(seed, locationId),
  )
}

// Every card a character can be dealt at a location.
export function v10Pool(
  locationId: string,
  character: Pick<ShiftingCharacter, 'identity'>,
): V6Card[] {
  const dealt = [...v6Pool(locationId), ...cameoPool(locationId)]
    .map((card) => dealtAs(card, character))
    .filter((card): card is V6Card => card !== null)
  return [...new Map(dealt.map((card) => [card.id, card])).values()]
}

export function rulesForCharacter(character: ShiftingCharacter): JourneyRules {
  return {
    skills: character.skills,
    draw: (seed, locationId) => drawForCharacter(seed, locationId, character),
  }
}

// The cameo content contract: every card meets the V6 per-card floor, names a
// known cast, shares no id with the V6 deck, and a selfVariant is a
// variant-only card at the same location that does not feature the same cast.
export function validateCastCardsV10(): string[] {
  const errors: string[] = []
  const v6Ids = new Set(V6_CARDS.map((card) => card.id))
  const locations = new Set(
    JOURNEY_WORLD.lands.flatMap((land) =>
      (land.locations as Array<{ id: string }>).map((location) => location.id),
    ),
  )
  const seen = new Set<string>()
  for (const card of CAST_CARDS_V10) {
    if (seen.has(card.id) || v6Ids.has(card.id))
      errors.push(`${card.id}: repeated card id`)
    seen.add(card.id)
    errors.push(...v6CardProblems(card))
    if (!locations.has(card.locationId))
      errors.push(`${card.id}: unknown location`)
    if (!Array.isArray(card.cast))
      errors.push(`${card.id}: cameo cards list their cast`)
    for (const id of card.cast ?? [])
      if (!(CAST_IDS as readonly string[]).includes(id))
        errors.push(`${card.id}: unknown cast ${id}`)
    if (!card.variantOnly && !card.cast?.length)
      errors.push(`${card.id}: a dealt cameo features someone`)
    if (card.selfVariant) {
      const variant = cameos.get(card.selfVariant)
      if (!variant?.variantOnly)
        errors.push(`${card.id}: selfVariant is not a variant-only card`)
      else if (variant.locationId !== card.locationId)
        errors.push(`${card.id}: selfVariant is somewhere else`)
      else if (variant.cast.some((id) => card.cast.includes(id)))
        errors.push(`${card.id}: selfVariant features the same cast`)
    }
  }
  for (const card of CAST_CARDS_V10)
    if (
      card.variantOnly &&
      !CAST_CARDS_V10.some((other) => other.selfVariant === card.id)
    )
      errors.push(`${card.id}: variant-only card nobody swaps to`)
  for (const id of Object.keys(BASE_CARD_CAST))
    if (!v6Ids.has(id)) errors.push(`${id}: cast tag on an unknown card`)
  return errors
}
