import type { Choice, EncounterCard } from './content'
import type { RunState } from './engine'
import type { SubstanceId } from './substanceArc'
import { openingLensChoices } from './openingLensChoices'

/**
 * The complete authored lens catalogue is for outcomes, saves and test fixtures.
 * A character at a real scene sees only what another person actually offers.
 * Never present the seven-lens collection as a single questionnaire.
 */
export function contextualOpeningChoices(
  card: EncounterCard,
  state: RunState,
): Choice[] {
  const authored = openingLensChoices(card).filter(
    (choice) =>
      !choice.requiresFlag || state.flags.includes(choice.requiresFlag),
  )
  if (card.id === 'GR-2')
    return authored.filter((choice) =>
      ['sober', 'stoned', 'tripping'].includes(choice.id),
    )
  if (card.id === 'QW-2')
    return authored.filter((choice) => ['sober', 'stoned'].includes(choice.id))
  if (card.id === 'KN-2') {
    const special =
      state.prospect === 'cedar'
        ? state.seed % 2 === 0
          ? 'fast-track'
          : 'race-meth'
        : state.prospect === 'mara'
          ? state.seed % 2 === 0
            ? 'loves-all'
            : 'fast-track'
          : state.seed % 2 === 0
            ? 'race-meth'
            : 'loves-all'
    return authored.filter((choice) =>
      ['sober', 'tipsy', special].includes(choice.id),
    )
  }
  return authored
}

/** A short, authored hand-off grounds the one optional party favor in this run. */
export function contextualOfferLine(
  card: EncounterCard,
  state: RunState,
): string | null {
  if (card.id !== 'KN-2') return null
  const choice = contextualOpeningChoices(card, state).find(
    (option) => !['sober', 'tipsy'].includes(option.id),
  )
  switch (choice?.id) {
    case 'fast-track':
      return 'Near the loading door, one of the stagehands offers a stimulant for the overnight preparations. You can refuse. The brass band is louder than anyone’s sales pitch.'
    case 'race-meth':
      return 'An exhausted radio watcher asks whether you want to join the long shift and offers a stimulant. A rested marshal is already insisting that someone else take over at dawn.'
    case 'loves-all':
      return 'A dancer in a papier-mâché shrimp costume offers an empathogen and gestures toward the crowded dance floor. The crew’s promises will still need checking tomorrow.'
    default:
      return null
  }
}

export type SceneMomentOffer = {
  id: SubstanceId
  label: string
  description: string
}

/** Ordinary scenes have no chemistry widget. Every offered moment is contextual. */
export function sceneMomentOffer(
  card: EncounterCard,
  state: RunState,
): SceneMomentOffer | null {
  if (!state.openingState || state.pending) return null
  if (card.id === 'GR-3') {
    return {
      id: 'cannabis',
      label: 'Accept a shared joint',
      description:
        'A fair volunteer passes you water, then offers a joint. You can decline without changing whom you meet.',
    }
  }
  if (card.id === 'KN-3') {
    return {
      id: 'alcohol',
      label: 'Accept a beer at the warehouse',
      description:
        'A racer offers you a beer while the repairs continue. Passing it up costs no friendship or story access.',
    }
  }
  return null
}
