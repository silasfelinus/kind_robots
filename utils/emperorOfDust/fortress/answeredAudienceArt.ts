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
  const history = [...run.flags].reverse().find((flag) =>
    flag.startsWith(prefix),
  )
  if (!history) return null
  const chosenId = history.slice(prefix.length)
  const answers: AuthoredAnswer[] = [
    ...audience.options.map((option, cardIndex) => ({
      option,
      npc: audience.npc,
      cardIndex,
    })),
    ...(audience.beats ?? []).flatMap((beat) =>
      beat.options.map((option, cardIndex) => ({
        option,
        npc: beat.npc ?? audience.npc,
        cardIndex,
      })),
    ),
  ]
  const answer = answers.find((entry) => entry.option.id === chosenId)
  if (!answer) return null
  return {
    option: answer.option,
    images: audienceChoiceImages(
      audience.id,
      chosenId,
      answer.npc,
      answer.cardIndex,
    ),
  }
}
