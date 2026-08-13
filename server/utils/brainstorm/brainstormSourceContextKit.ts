// /server/utils/brainstorm/brainstormSourceContextKit.ts
//
// The pure half of brainstormSourceContext.ts's Character-grounding logic --
// no Prisma/canView/Nuxt alias imports, so it can be exercised directly by
// utils/scripts/verifyBrainstormSourceContext.ts with plain tsx, the same
// split brainstormSourceAdapterKit.ts uses for the client-side adapter
// registry (no Pinia imports there either, for the identical reason).

/** The Character fields formatCharacterContext actually reads. */
export type CharacterContextRow = {
  name: string
  honorific?: string | null
  title?: string | null
  role?: string | null
  class?: string | null
  species?: string | null
  gender?: string | null
  alignment?: string | null
  genre?: string | null
  personality?: string | null
  voice?: string | null
  drive?: string | null
  quirks?: string | null
  backstory?: string | null
}

const MAX_CONTEXT_LENGTH = 2_000

function joinFacts(...parts: Array<string | null | undefined | false>): string {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim())
    .join(' | ')
}

/**
 * Compose a Character row into a compact trait summary for the prompt.
 * Bounded to MAX_CONTEXT_LENGTH so one verbose Character cannot blow out the
 * prompt/cost budget.
 */
export function formatCharacterContext(character: CharacterContextRow): string {
  const identity = joinFacts(
    character.honorific,
    character.title,
    character.role,
  )
  const traits = joinFacts(
    character.class && `class: ${character.class}`,
    character.species && `species: ${character.species}`,
    character.gender && `gender: ${character.gender}`,
    character.alignment && `alignment: ${character.alignment}`,
    character.genre && `genre: ${character.genre}`,
  )
  const voice = joinFacts(
    character.personality && `personality: ${character.personality}`,
    character.voice && `voice: ${character.voice}`,
    character.drive && `drive: ${character.drive}`,
    character.quirks && `quirks: ${character.quirks}`,
  )

  const lines = [
    `Character: ${character.name}${identity ? ` (${identity})` : ''}.`,
    traits && `Traits: ${traits}.`,
    voice && `Voice: ${voice}.`,
    character.backstory && `Backstory: ${character.backstory}`,
  ].filter((line): line is string => Boolean(line))

  return lines.join('\n').slice(0, MAX_CONTEXT_LENGTH)
}
