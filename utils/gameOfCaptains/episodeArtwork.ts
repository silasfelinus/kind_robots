import type { EpisodeDraw, EpisodeChoice } from './episodeConsole'

// Expected slots only. Rendered images must be resolved with viewer permission.
export const episodeRevealArtKey = (cardId: string): string =>
  `episode/${cardId}-reveal`

export function episodeResultArtKey(
  draw: Pick<EpisodeDraw, 'cardId' | 'choice' | 'successful'>,
): string | null {
  if (draw.successful === undefined) return null
  return `episode/${draw.cardId}-${draw.choice}-${draw.successful ? 'success' : 'failure'}`
}

export function episodeChoiceArtKeys(cardId: string, choices: readonly EpisodeChoice[] = ['ask', 'document', 'override']): string[] {
  return [
    episodeRevealArtKey(cardId),
    ...choices.flatMap((choice) => [
      episodeResultArtKey({ cardId, choice, successful: true })!,
      episodeResultArtKey({ cardId, choice, successful: false })!,
    ]),
  ]
}
