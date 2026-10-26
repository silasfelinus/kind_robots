import { ENCOUNTERS, ENDING_IDS, type EventId } from './content'
import { BEATS, EVENTS } from './story'
import { openingLensChoices } from './openingLensChoices'

/**
 * Ecotone's art standard (conductor weird-humboldt t-042). Silas, 2026-10-20:
 * every story card, every choice outcome (success and failure) and every
 * ending gets its own picture, in each art style. These are the asset keys;
 * a style that has rendered one lists it in artManifest.ts and serves it from
 * /ecotone/styles/<style>/<key>.webp. Until then each slot falls back to the
 * card's shared art, then to the drawn scene.
 */

export type OutcomeResult = 'success' | 'failure'

export function eventArtKey(eventId: EventId): string {
  return 'events/' + eventId
}

export function cardArtKey(cardId: string): string {
  return `cards/${cardId.toLowerCase()}`
}

/** A choice with no roll has one outcome, keyed as its success. */
export function outcomeArtKey(
  cardId: string,
  choiceId: string,
  result: OutcomeResult,
): string {
  return `outcomes/${cardId.toLowerCase()}/${choiceId}-${result}`
}

export function endingArtKey(endingId: string): string {
  return `endings/${endingId.replaceAll('.', '-')}`
}

/** Every slot the standard asks for, cards first, then outcomes, then endings. */
export function ecotoneArtSlots(): {
  events: string[]
  cards: string[]
  outcomes: string[]
  endings: string[]
} {
  const all = [...BEATS, ...ENCOUNTERS]
  return {
    events: EVENTS.map((event) => eventArtKey(event.id)),
    cards: all.map((card) => cardArtKey(card.id)),
    outcomes: [
      ...all.flatMap((card) =>
        openingLensChoices(card)
          .filter((choice) => !choice.locked)
          .flatMap((choice) => [
            outcomeArtKey(card.id, choice.id, 'success'),
            ...(choice.failure
              ? [outcomeArtKey(card.id, choice.id, 'failure')]
              : []),
          ]),
      ),
      ...['dot-bailout', 'shore-relay'].flatMap((choiceId) => [
        outcomeArtKey('KN-5', choiceId, 'success'),
        outcomeArtKey('KN-5', choiceId, 'failure'),
      ]),
      ...['shared-wheel', 'tandem-tow'].flatMap((choiceId) => [
        outcomeArtKey('KN-6', choiceId, 'success'),
        outcomeArtKey('KN-6', choiceId, 'failure'),
      ]),
    ],
    endings: ENDING_IDS.map(endingArtKey),
  }
}
