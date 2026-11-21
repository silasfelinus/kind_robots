import { audienceChoiceImages } from './audienceChoiceArt'
import type { AudienceDef, AudienceOption, FortressRun } from './types'

type AuthoredAnswer = {
  option: AudienceOption
  npc: string | undefined
  cardIndex: number
}

export type AudienceAftermath = {
  option: AudienceOption
  images: string[]
}

/**
 * The engine already saves one `chose:<audience>:<option>` flag for every
 * answer, including nested beats. Reconstruct the last answer from those
 * canonical flags so a loaded or rewound reign still shows its consequence.
 * Never add a separate ephemeral image/save key to represent a choice.
 */
export function audienceAftermath(
  run: Pick<FortressRun, 'flags'>,
  audience: AudienceDef,
): AudienceAftermath | null {
  const prefix = `chose:${audience.id}:`
  const chosenIds = run.flags
    .filter((flag) => flag.startsWith(prefix))
    .map((flag) => flag.slice(prefix.length))
  if (!chosenIds.length) return null

  const opening = audience.options.map((option, cardIndex) => ({
    option,
    npc: audience.npc,
    cardIndex,
  }))
  const beats = (audience.beats ?? []).flatMap((beat) =>
    beat.options.map((option, cardIndex) => ({
      option,
      npc: beat.npc ?? audience.npc,
      cardIndex,
    })),
  )
  let available: AuthoredAnswer[] = opening
  let answer: AuthoredAnswer | undefined

  for (const id of chosenIds) {
    // `repair` can occur in both an opening and a later beat with genuinely
    // different responses. Replay the saved choice sequence through the scene
    // graph to recover the exact option the player saw, not the first id match.
    answer =
      available.find((entry) => entry.option.id === id) ??
      [...opening, ...beats].find((entry) => entry.option.id === id)
    if (!answer) return null
    const next = audience.beats?.find((beat) => beat.id === answer?.option.next)
    available = next
      ? next.options.map((option, cardIndex) => ({
          option,
          npc: next.npc ?? audience.npc,
          cardIndex,
        }))
      : opening
  }

  if (!answer) return null
  return {
    option: answer.option,
    images: audienceChoiceImages(
      audience.id,
      answer.option.id,
      answer.npc,
      answer.cardIndex,
    ),
  }
}
