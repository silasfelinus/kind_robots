import {
  recoverDarkBriarTurn,
  type DarkBriarProgress,
} from './darkBriar'

export function settleDarkBriarReturn(
  progress: DarkBriarProgress,
): DarkBriarProgress {
  const settled = recoverDarkBriarTurn(progress, progress).progress
  return {
    ...settled,
    mapCards: settled.mapCards.map((card) =>
      card.matched ? card : { ...card, flipped: false },
    ),
  }
}
