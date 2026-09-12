// /server/utils/davinciNarration.ts
//
// Da Vinci AI-narration layer, now an ADAPTER over ./storybookNarration.ts.
//
// The life shape is one of Storybook's four shapes (merged 2026-09-09,
// kind_robots #2549) and one of its ending decks (`life`, ten axes, 1,024
// endings), so the narration contract it pioneered was generalized rather than
// duplicated -- storybook/t-025 and t-031. Everything this module exported
// still exists and still behaves identically, because POST
// /api/davinci/runs/:id/narrate and utils/scripts/verifyDaVinciNarration.ts
// both depend on the exact names, bounds, error strings, and response-document
// shape below.
//
// What is deliberately preserved rather than modernized here:
//   - the response document keeps `milestoneCandidate` (the shared layer calls
//     it `endingHint`) and omits `moveEffects`/`stateDelta`, because the narrate
//     endpoint has no move to score and writes no inventory;
//   - the effects map stays UNCAPPED (`maxEffectAxes: null`) while new shapes
//     cap a move at three axes -- narrowing a live game's tuning is a design
//     change, not a refactor.
//
// BOUNDARY, unchanged: a caller of the play loop, never a second owner of
// durable state. LifeChoice/LifeStat/LifeEnding writes and all outcome math
// stay in server/utils/davinci.ts. The narrator proposes; the app disposes.

import { DAVINCI_DIMENSIONS, type DaVinciDimension } from './davinciDimensions'
import { LIFE_DECK } from './endingDeckMath'
import {
  buildStorybookSystemPrompt,
  buildStorybookUserPrompt,
  generateStorybookTurn,
  storybookResponseSchema,
  validateStorybookNarration,
  PROSE_BOUNDS_BY_SHAPE,
  type StorybookNarrationRequest,
  type StoryNarrator,
} from './storybookNarration'

// The four bound constants are NOT re-exported from here on purpose. Nitro
// auto-imports every symbol under server/utils, so exporting the same name from
// two modules makes the auto-import ambiguous and warns on every build. They
// have one home now -- ./storybookNarration -- and both narration guards import
// them from there.

const RECENT_CHOICE_WINDOW = 3

/** The life shape's slice of the shared response document. */
const LIFE_NARRATION_OPTIONS = {
  includeMoveEffects: false,
  includeStateDelta: false,
  hintKey: 'milestoneCandidate',
  hintDescription:
    'Optional short phrase naming the ending this life seems headed toward, or null. Display-only flavor; awards nothing.',
  maxEffectAxes: null,
} as const

/** Narrator identity. Alias of the shared type; both spellings are in use. */
export type DaVinciNarrator = StoryNarrator

export interface DaVinciRecentChoice {
  chapter: number
  choiceText: string
  resultText: string | null
}

export interface DaVinciNarrationRequest {
  runId: number
  chapter: number
  protagonistName: string | null
  genre: string | null
  seed: string
  narrator: DaVinciNarrator
  statsSoFar: Record<string, number>
  recentChoices: DaVinciRecentChoice[]
}

export interface DaVinciChoiceOption {
  id: string
  choiceText: string
  effects: Partial<Record<DaVinciDimension, number>>
}

export interface DaVinciNarrationResult {
  narrativeText: string
  choices: DaVinciChoiceOption[]
  artPrompt: string | null
  // The narrator's guess at a resonant ending theme. Display-only flavor --
  // resolveLifeRunEnding never reads it, and nothing is ever awarded from it.
  // Outcome math stays 100% derived from stored LifeStat rows.
  milestoneCandidate: string | null
}

function isDimension(key: string): key is DaVinciDimension {
  return (DAVINCI_DIMENSIONS as readonly string[]).includes(key)
}

/**
 * Map a life narration request onto the shared one.
 *
 * The life run's seed columns become a minimal story bible: the protagonist is
 * the cast, the genre is the single creative Facet. There is no turn budget --
 * a life resolves on its own clock once MIN_CHAPTERS_BEFORE_ENDING is met -- so
 * the prompt says "Turn 4", not "Turn 4 of N".
 */
function toStorybookRequest(
  request: DaVinciNarrationRequest,
): StorybookNarrationRequest {
  return {
    shape: 'life',
    deck: LIFE_DECK,
    narratorStyle: null,
    narrator: request.narrator,
    seed: request.seed,
    turnIndex: request.chapter,
    turnBudget: null,
    isFinalTurn: false,
    bible: {
      title: request.protagonistName || 'An unwritten life',
      premise: null,
      cast: request.protagonistName
        ? [{ name: request.protagonistName, role: 'protagonist' }]
        : [],
      location: null,
      facets: request.genre
        ? [{ title: request.genre }]
        : [{ title: 'unspecified — pick a tone and hold it' }],
      scenario: null,
      treasures: [],
    },
    statsSoFar: request.statsSoFar,
    inventory: [],
    recentTurns: request.recentChoices.map((choice) => ({
      turnIndex: choice.chapter,
      narrativeText: choice.resultText || 'That scene is not recorded.',
      move: { source: 'option' as const, text: choice.choiceText },
    })),
    move: null,
  }
}

export function narrationResponseSchema(): Record<string, unknown> {
  return storybookResponseSchema(LIFE_DECK, LIFE_NARRATION_OPTIONS)
}

// App-owned enforcement. Runs on every narration response even though the
// model was called under strict mode: strict mode constrains shape, not values.
export function validateNarrationPayload(
  value: unknown,
): DaVinciNarrationResult {
  const result = validateStorybookNarration(value, LIFE_DECK, {
    ...LIFE_NARRATION_OPTIONS,
    bounds: PROSE_BOUNDS_BY_SHAPE.life,
  })
  return {
    narrativeText: result.narrativeText,
    choices: result.choices.map((choice) => ({
      id: choice.id,
      choiceText: choice.choiceText,
      effects: choice.effects as Partial<Record<DaVinciDimension, number>>,
    })),
    artPrompt: result.artPrompt,
    milestoneCandidate: result.endingHint,
  }
}

export function buildNarrationSystemPrompt(narrator: DaVinciNarrator): string {
  return buildStorybookSystemPrompt(
    toStorybookRequest({
      runId: 0,
      chapter: 1,
      protagonistName: null,
      genre: null,
      seed: '',
      narrator,
      statsSoFar: {},
      recentChoices: [],
    }),
  )
}

export function buildNarrationUserPrompt(
  request: DaVinciNarrationRequest,
): string {
  return buildStorybookUserPrompt(toStorybookRequest(request))
}

export function buildNarrationRequest(
  run: {
    id: number
    seed: string
    protagonistName: string | null
    genre: string | null
    currentChapter: number
    Stats?: Array<{ key: string; value: number }>
    Choices?: Array<{
      chapter: number
      choiceText: string
      resultText: string | null
    }>
  },
  narrator: DaVinciNarrator,
  chapter?: number,
): DaVinciNarrationRequest {
  const statsSoFar: Record<string, number> = {}
  for (const stat of run.Stats ?? []) {
    if (isDimension(stat.key)) statsSoFar[stat.key] = stat.value
  }

  const recentChoices = (run.Choices ?? [])
    .slice(-RECENT_CHOICE_WINDOW)
    .map((choice) => ({
      chapter: choice.chapter,
      choiceText: choice.choiceText,
      resultText: choice.resultText,
    }))

  return {
    runId: run.id,
    chapter:
      typeof chapter === 'number' && chapter > 0 ? chapter : run.currentChapter,
    protagonistName: run.protagonistName,
    genre: run.genre,
    seed: run.seed,
    narrator,
    statsSoFar,
    recentChoices,
  }
}

// Top-level entry point used by POST /api/davinci/runs/:id/narrate. Retry and
// timeout behaviour live in generateStorybookTurn and are unchanged: one retry
// on a validation/parse failure, none on a timeout, and never a synthetic
// chapter substituted for a failed one.
export async function generateDaVinciChapter(
  request: DaVinciNarrationRequest,
): Promise<DaVinciNarrationResult> {
  const result = await generateStorybookTurn(
    toStorybookRequest(request),
    LIFE_NARRATION_OPTIONS,
  )
  return {
    narrativeText: result.narrativeText,
    choices: result.choices.map((choice) => ({
      id: choice.id,
      choiceText: choice.choiceText,
      effects: choice.effects as Partial<Record<DaVinciDimension, number>>,
    })),
    artPrompt: result.artPrompt,
    milestoneCandidate: result.endingHint,
  }
}
