// /server/utils/brainstorm/brainstormSourceContextKit.ts
//
// The pure half of brainstormSourceContext.ts's entity-grounding logic --
// no Prisma/canView/Nuxt alias imports, so it can be exercised directly by
// utils/scripts/verifyBrainstormSourceContext.ts with plain tsx, the same
// split brainstormSourceAdapterKit.ts uses for the client-side adapter
// registry (no Pinia imports there either, for the identical reason).
//
// conductor brainstorm/t-014: added formatDreamContext and
// formatScenarioContext alongside the original formatCharacterContext
// (brainstorm/t-013), same shape -- a plain row type plus a joinFacts-based
// composer bounded to MAX_CONTEXT_LENGTH. To ground a further entity type
// (Reward, Bot, Project, Prompt are the documented remaining candidates —
// see brainstormSourceContext.ts), add its row type and formatXContext here,
// then a matching fetch+canView resolver in brainstormSourceContext.ts's
// SOURCE_CONTEXT_RESOLVERS -- no other change needed.

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

/** A Scenario row as linked from a Dream, or fetched directly for its own context. */
export type DreamScenarioRow = {
  title: string
  description?: string | null
  locations?: string | null
  tier?: string | null
  difficulty?: number | null
}

/** A Reward row as linked from a Dream. */
export type DreamRewardRow = {
  name: string
  rewardType: string
}

/** A Character row as linked from a Dream. */
export type DreamCharacterRow = {
  name: string
}

/** The Dream fields formatDreamContext actually reads. */
export type DreamContextRow = {
  title: string
  dreamType: string
  description?: string | null
  pitch?: string | null
  flavorText?: string | null
  artPrompt?: string | null
  Characters?: DreamCharacterRow[]
  Rewards?: DreamRewardRow[]
  Scenarios?: DreamScenarioRow[]
}

const MAX_LINKED_ROWS = 6

/** Compose one Scenario's tier/difficulty/locations/description into one line. */
function formatScenarioLine(scenario: DreamScenarioRow): string {
  const meta = joinFacts(
    scenario.tier && `tier: ${scenario.tier}`,
    typeof scenario.difficulty === 'number' &&
      `difficulty: ${scenario.difficulty}`,
  )
  const heading = [
    scenario.title,
    scenario.locations && `@ ${scenario.locations}`,
    meta && `(${meta})`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' ')
  return joinFacts(heading, scenario.description)
}

/**
 * Compose a Dream row into a compact, multi-facet summary for the prompt:
 * the title/type, its premise and sensory atmosphere, its visual concept,
 * and the locations/encounters/threats/rewards/characters carried by its
 * linked Scenarios, Rewards, and Characters. Bounded to MAX_CONTEXT_LENGTH
 * so one richly-linked Dream cannot blow out the prompt/cost budget.
 */
export function formatDreamContext(dream: DreamContextRow): string {
  const premise = joinFacts(dream.pitch, dream.description)
  const characters = (dream.Characters || [])
    .map((character) => character.name)
    .filter(Boolean)
    .slice(0, MAX_LINKED_ROWS)
    .join(', ')
  const rewards = (dream.Rewards || [])
    .map((reward) => `${reward.name} (${reward.rewardType.toLowerCase()})`)
    .slice(0, MAX_LINKED_ROWS)
    .join(', ')
  const scenarioLines = (dream.Scenarios || [])
    .slice(0, MAX_LINKED_ROWS)
    .map(formatScenarioLine)
    .filter(Boolean)

  const lines = [
    `Dream: ${dream.title} (${dream.dreamType.toLowerCase()}).`,
    // Premise/sensory detail/visual concept are freeform prose (like
    // Character.backstory below) and are not given a forced trailing
    // period -- the source text supplies its own punctuation.
    premise && `Premise: ${premise}`,
    dream.flavorText && `Sensory detail: ${dream.flavorText}`,
    dream.artPrompt && `Visual concept: ${dream.artPrompt}`,
    // Characters/Rewards are joined fragments (like Traits/Voice above),
    // so a forced trailing period is correct here.
    characters && `Characters: ${characters}.`,
    rewards && `Rewards: ${rewards}.`,
    scenarioLines.length &&
      `Locations, encounters and threats: ${scenarioLines.join(' / ')}`,
  ].filter((line): line is string => Boolean(line))

  return lines.join('\n').slice(0, MAX_CONTEXT_LENGTH)
}

/** The Scenario fields formatScenarioContext actually reads. */
export type ScenarioContextRow = DreamScenarioRow & {
  genres?: string | null
  Characters?: DreamCharacterRow[]
}

/**
 * Compose a Scenario row into a compact encounter summary for the prompt:
 * the location/tier/difficulty heading, its genre, its description, and any
 * linked Characters. Bounded to MAX_CONTEXT_LENGTH like every other
 * formatXContext helper.
 */
export function formatScenarioContext(scenario: ScenarioContextRow): string {
  const characters = (scenario.Characters || [])
    .map((character) => character.name)
    .filter(Boolean)
    .slice(0, MAX_LINKED_ROWS)
    .join(', ')

  // formatScenarioLine ends in freeform description prose when one is
  // present (already self-punctuated, like Character.backstory) but in a
  // bare title/fragment when it's not -- only the fragment case gets a
  // forced trailing period.
  const heading = `Scenario: ${formatScenarioLine(scenario)}`

  const lines = [
    scenario.description ? heading : `${heading}.`,
    scenario.genres && `Genre: ${scenario.genres}.`,
    characters && `Characters: ${characters}.`,
  ].filter((line): line is string => Boolean(line))

  return lines.join('\n').slice(0, MAX_CONTEXT_LENGTH)
}
