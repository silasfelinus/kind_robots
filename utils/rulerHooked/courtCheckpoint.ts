import type { Card, ContentBundle, RunSave } from '~/types/ruler-hooked'
import { allDeckCards, dismissedFinaleFlag, findArcStep } from './loop'

export interface CourtCheckpoint {
  card: Card | null
  arcId: string | null
  ending: string | null
}

export function readCourtCheckpoint(
  bundle: ContentBundle,
  save: RunSave,
): CourtCheckpoint {
  const empty: CourtCheckpoint = { card: null, arcId: null, ending: null }
  if (save.status !== 'ACTIVE') return empty
  const id = save.pendingCardId
  if (typeof id === 'string') {
    const arc = findArcStep(bundle, id)
    const seen = save.deckState.seenCardIds.includes(id)
    if (arc && !seen && save.deckState.activeArcs[arc.arcId]?.step === id) {
      return { ...empty, card: arc.card, arcId: arc.arcId }
    }
    const card = allDeckCards(bundle).find((item) => item.id === id)
    if (card && (!card.once || !seen)) return { ...empty, card }
  }
  const ending = save.pendingFinaleKey
  if (
    typeof ending === 'string' &&
    !save.flags[dismissedFinaleFlag(ending)] &&
    bundle.endings.some((item) => item.outcomeKey === ending)
  ) {
    return { ...empty, ending }
  }
  return empty
}
