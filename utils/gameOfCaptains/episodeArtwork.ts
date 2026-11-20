import type { EpisodeDraw, EpisodeChoice, EpisodeDeck } from './episodeConsole'
import { casinoIncident, chapterSystem } from './solarCircuit'

// Painted casino incidents are shared across systems. Keep the saved cardId
// (system + chapter) unchanged; translate only the art lookup to the authored
// incident title used by the Krea2 ledger.
export function episodeArtworkCardId(
  run: { seed: number; chapter: number },
  deck: EpisodeDeck,
  cardId: string,
): string {
  if (deck !== 'casino') return cardId
  const incident = casinoIncident(
    run.seed,
    run.chapter,
    chapterSystem(run.seed, run.chapter),
  )
  return (
    'casino-' +
    incident.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  )
}

// Expected slots only. Rendered images must be resolved with viewer permission.
export const episodeRevealArtKey = (cardId: string): string =>
  `episode/${cardId}-reveal`

export function episodeResultArtKey(
  draw: Pick<EpisodeDraw, 'cardId' | 'choice' | 'successful'>,
): string | null {
  if (draw.successful === undefined) return null
  return `episode/${draw.cardId}-${draw.choice}-${draw.successful ? 'success' : 'failure'}`
}

export function episodeChoiceArtKeys(
  cardId: string,
  choices: readonly EpisodeChoice[] = ['ask', 'document', 'override'],
): string[] {
  return [
    episodeRevealArtKey(cardId),
    ...choices.flatMap((choice) => [
      episodeResultArtKey({ cardId, choice, successful: true })!,
      episodeResultArtKey({ cardId, choice, successful: false })!,
    ]),
  ]
}
