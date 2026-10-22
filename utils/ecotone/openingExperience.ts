import type { Choice, EncounterCard } from './content'
import type { SubstanceId } from './substanceArc'
import { openingLensChoices } from './openingLensChoices'

/**
 * The seven authored legacy lenses remain playable in old saves and available
 * to the story engine. New players see grounded choices instead of a seven-drug
 * questionnaire. Extraordinary substances aren't a default festival entry.
 */
const OPENING_ACTIONS: Record<string, Record<string, string>> = {
  'KN-2': {
    sober: 'Help photograph the sculptures, water in hand',
    tipsy: 'Join the race crew for a beer and ask who needs help tomorrow',
    'race-stoned':
      'Share a joint outside, then watch the Rainbow Shrimp rehearse',
  },
  'GR-2': {
    sober: 'Grab water and a sandwich, then help check the forest trail',
    'fair-tipsy':
      'Join the volunteers for a toast and hear what still needs doing',
    stoned: 'Accept a joint, find a quiet spot and listen beneath the music',
  },
  'QW-2': {
    sober: 'Pour some coffee, borrow binoculars and watch the marsh',
    stoned: 'Accept a joint, settle onto the bench and take the long view',
  },
}

export function visibleOpeningChoices(card: EncounterCard): Choice[] {
  const actions = OPENING_ACTIONS[card.id]
  const all = openingLensChoices(card)
  if (!actions) return all
  return all
    .filter((choice) => Object.hasOwn(actions, choice.id))
    .map((choice) => ({
      ...choice,
      label: actions[choice.id]!,
    }))
}

export type LocalTemptation = {
  intro: string
  offers: SubstanceId[]
}

/** No roaming seven-option menu. A short, optional, scene-appropriate offer. */
const SCENE_OFFERS: Record<string, LocalTemptation> = {
  'GR-4': {
    intro:
      'After the show, a friend offers a drink or a smoke. You can decline either.',
    offers: ['alcohol', 'cannabis'],
  },
  'QW-4': {
    intro:
      'At a rest stop, someone shares coffee or offers a smoke. Neither is expected.',
    offers: ['coffee', 'cannabis'],
  },
  'KN-6': {
    intro:
      'After the finish, a crew member offers a celebratory drink or a joint. The racing is over.',
    offers: ['alcohol', 'cannabis'],
  },
}

export function localTemptation(cardId: string | null): LocalTemptation | null {
  return cardId ? (SCENE_OFFERS[cardId] ?? null) : null
}
