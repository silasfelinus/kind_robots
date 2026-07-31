// /server/utils/davinciNarration.ts
//
// Da Vinci AI-narration layer. Implements conductor's
// projects/davinci/docs/narration-layer-spec.md (davinci/t-015).
//
// BOUNDARY: this module is a *caller* of the play-loop, never a second owner
// of durable state. It reads a run, asks a narrator for the next chapter's
// prose + choice options + proposed stat deltas, and validates that response
// against app-owned bounds. It writes nothing. The client still calls
// POST /api/davinci/runs/:id/choices and .../resolve separately, so
// LifeChoice/LifeStat/LifeEnding writes and all outcome math stay exactly
// where they are in server/utils/davinci.ts.
//
// The narrator proposes; the app disposes. A narration response that invents
// an eleventh dimension, swings a stat by 40, or returns one choice is a
// schema violation — not a new rule.

import prisma from './prisma'
import { DAVINCI_DIMENSIONS, type DaVinciDimension } from './davinci'

// Narration is synchronous from the player's point of view — they are staring
// at a spinner waiting for the next chapter — so this budget is deliberately
// tighter than the async WonderLab review generator's 30s.
const NARRATION_TIMEOUT_MS = 20_000
const NARRATION_MODEL = 'gpt-4o-mini'
const DEFAULT_NARRATOR_BOT_ID = 433

// Per-choice swing bounds. A dimension passes at DAVINCI_PASS_VALUE (1), so an
// unclamped narrator could resolve a whole run in one chapter. Design default
// from the spec's open question — revisit after real playtesting.
export const NARRATION_EFFECT_MIN = -2
export const NARRATION_EFFECT_MAX = 2
export const NARRATION_MIN_CHOICES = 2
export const NARRATION_MAX_CHOICES = 4
const NARRATIVE_MIN_WORDS = 20
const NARRATIVE_MAX_WORDS = 400
const RECENT_CHOICE_WINDOW = 3

export interface DaVinciNarrator {
  name: string
  personality: string | null
  narrativeVoice: string | null
  prompt: string | null
}

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
  // The narrator's guess at a resonant ending theme. Display-only flavor —
  // resolveLifeRunEnding never reads it, and nothing is ever awarded from it.
  // Outcome math stays 100% derived from stored LifeStat rows.
  milestoneCandidate: string | null
}

const CHOICE_IDS = ['a', 'b', 'c', 'd'] as const

// OpenAI structured-output strict mode requires every property to appear in
// `required` and forbids additionalProperties, so the effects map lists all ten
// dimensions as nullable integers rather than as optional keys. Null means "this
// choice does not move that dimension" and is dropped during validation, which
// preserves the spec's "an option can be flavor with zero mechanical effect"
// rule without needing optional properties strict mode won't accept.
//
// Range and item-count bounds are deliberately NOT expressed as
// minimum/maximum/minItems/maxItems: support for those keywords under strict
// mode is uneven, and the app re-validates every bound server-side anyway.
// They live in the descriptions so the model still sees them.
function effectsSchema() {
  return {
    type: 'object',
    description:
      `Proposed stat deltas for this choice. Each value is an integer from ` +
      `${NARRATION_EFFECT_MIN} to ${NARRATION_EFFECT_MAX}, or null when the ` +
      `choice does not move that dimension. Most choices should move two or ` +
      `three dimensions, not all ten.`,
    properties: Object.fromEntries(
      DAVINCI_DIMENSIONS.map((dimension) => [
        dimension,
        {
          type: ['integer', 'null'],
          description: `Change to the ${dimension} dimension, or null.`,
        },
      ]),
    ),
    required: [...DAVINCI_DIMENSIONS],
    additionalProperties: false,
  }
}

export function narrationResponseSchema(): Record<string, unknown> {
  return {
    type: 'object',
    properties: {
      narrativeText: {
        type: 'string',
        description:
          `This chapter's prose, in second person, ${NARRATIVE_MIN_WORDS}-` +
          `${NARRATIVE_MAX_WORDS} words. End on the brink of a decision — do ` +
          `not state the options themselves.`,
      },
      choices: {
        type: 'array',
        description:
          `Between ${NARRATION_MIN_CHOICES} and ${NARRATION_MAX_CHOICES} ` +
          `distinct options the protagonist could take.`,
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              enum: [...CHOICE_IDS],
              description: 'Stable id within this chapter, in order.',
            },
            choiceText: {
              type: 'string',
              description:
                'One sentence, phrased as an action the player takes.',
            },
            effects: effectsSchema(),
          },
          required: ['id', 'choiceText', 'effects'],
          additionalProperties: false,
        },
      },
      artPrompt: {
        type: ['string', 'null'],
        description:
          'Optional image prompt for this scene, or null. Visual detail only.',
      },
      milestoneCandidate: {
        type: ['string', 'null'],
        description:
          'Optional short phrase naming the ending this life seems headed ' +
          'toward, or null. Display-only flavor; awards nothing.',
      },
    },
    required: ['narrativeText', 'choices', 'artPrompt', 'milestoneCandidate'],
    additionalProperties: false,
  }
}

function isDimension(key: string): key is DaVinciDimension {
  return (DAVINCI_DIMENSIONS as readonly string[]).includes(key)
}

function clampEffect(value: number): number {
  return Math.max(
    NARRATION_EFFECT_MIN,
    Math.min(NARRATION_EFFECT_MAX, Math.trunc(value)),
  )
}

// App-owned enforcement. Runs on every narration response even though the
// model was called under strict mode: strict mode constrains shape, not values.
export function validateNarrationPayload(
  value: unknown,
): DaVinciNarrationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The narrator returned a non-object response.')
  }
  const payload = value as Record<string, unknown>

  const narrativeText =
    typeof payload.narrativeText === 'string'
      ? payload.narrativeText.trim()
      : ''
  const wordCount = narrativeText.split(/\s+/).filter(Boolean).length
  if (wordCount < NARRATIVE_MIN_WORDS || wordCount > NARRATIVE_MAX_WORDS) {
    throw new Error(
      `Chapter prose must be ${NARRATIVE_MIN_WORDS}-${NARRATIVE_MAX_WORDS} words (got ${wordCount}).`,
    )
  }

  if (!Array.isArray(payload.choices)) {
    throw new Error('The narrator returned no choice list.')
  }

  const choices: DaVinciChoiceOption[] = []
  const seenIds = new Set<string>()

  for (const raw of payload.choices) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('Each choice must be an object.')
    }
    const option = raw as Record<string, unknown>

    const choiceText =
      typeof option.choiceText === 'string' ? option.choiceText.trim() : ''
    if (!choiceText) throw new Error('Each choice needs non-empty choiceText.')

    const id =
      typeof option.id === 'string' && option.id.trim()
        ? option.id.trim().toLowerCase()
        : CHOICE_IDS[choices.length] || String(choices.length)
    if (seenIds.has(id)) {
      throw new Error(`Duplicate choice id "${id}" in one chapter.`)
    }
    seenIds.add(id)

    const effects: Partial<Record<DaVinciDimension, number>> = {}
    const rawEffects = option.effects
    if (
      rawEffects &&
      typeof rawEffects === 'object' &&
      !Array.isArray(rawEffects)
    ) {
      for (const [key, delta] of Object.entries(
        rawEffects as Record<string, unknown>,
      )) {
        // A response that invents an eleventh stat name is a schema violation,
        // not a new stat — reject rather than silently pass it through to
        // recordLifeChoice, which accepts arbitrary keys by design.
        if (!isDimension(key)) {
          throw new Error(
            `Choice "${id}" proposed unknown dimension "${key}". Allowed: ${DAVINCI_DIMENSIONS.join(', ')}.`,
          )
        }
        if (delta === null || delta === undefined) continue
        if (typeof delta !== 'number' || !Number.isFinite(delta)) {
          throw new Error(
            `Choice "${id}" proposed a non-numeric delta for "${key}".`,
          )
        }
        const clamped = clampEffect(delta)
        if (clamped !== 0) effects[key] = clamped
      }
    }

    choices.push({ id, choiceText, effects })
  }

  if (
    choices.length < NARRATION_MIN_CHOICES ||
    choices.length > NARRATION_MAX_CHOICES
  ) {
    throw new Error(
      `A chapter must offer ${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices (got ${choices.length}).`,
    )
  }

  const artPrompt =
    typeof payload.artPrompt === 'string' && payload.artPrompt.trim()
      ? payload.artPrompt.trim()
      : null
  const milestoneCandidate =
    typeof payload.milestoneCandidate === 'string' &&
    payload.milestoneCandidate.trim()
      ? payload.milestoneCandidate.trim()
      : null

  return { narrativeText, choices, artPrompt, milestoneCandidate }
}

export function buildNarrationSystemPrompt(narrator: DaVinciNarrator): string {
  return [
    `You are ${narrator.name}, narrating a single human life in Kind Robots' Da Vinci life simulator.`,
    narrator.prompt || '',
    narrator.personality ? `Personality: ${narrator.personality}` : '',
    narrator.narrativeVoice
      ? `Narrative voice: ${narrator.narrativeVoice}`
      : '',
    '',
    'Write one chapter at a time, in second person, present tense. Each chapter is a',
    'concrete scene with a real decision at the end of it — not a summary of years.',
    'Let the accumulated stats colour what happens: a life already rich in wealth but',
    'poor in love should meet situations that reflect both.',
    '',
    `The ten dimensions are: ${DAVINCI_DIMENSIONS.join(', ')}.`,
    `Every choice proposes integer deltas from ${NARRATION_EFFECT_MIN} to ${NARRATION_EFFECT_MAX}`,
    'on a few of those dimensions and null on the rest. Real trade-offs beat pure',
    'upgrades: a choice that raises wealth should usually cost something else.',
    'Never state or imply that the player has won, lost, or unlocked anything — the',
    'app alone decides how a life resolves.',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

export function buildNarrationUserPrompt(
  request: DaVinciNarrationRequest,
): string {
  const stats = DAVINCI_DIMENSIONS.map(
    (dimension) => `${dimension}=${request.statsSoFar[dimension] ?? 0}`,
  ).join(', ')

  const history = request.recentChoices.length
    ? request.recentChoices
        .map(
          (choice) =>
            `- Chapter ${choice.chapter}: ${choice.choiceText}${
              choice.resultText ? ` → ${choice.resultText}` : ''
            }`,
        )
        .join('\n')
    : '- (none yet — this is the opening chapter)'

  return [
    `Protagonist: ${request.protagonistName || 'an unnamed life'}`,
    `Genre: ${request.genre || 'unspecified — pick a tone and hold it'}`,
    `Seed: ${request.seed}`,
    `Chapter to write: ${request.chapter}`,
    '',
    `Stats so far: ${stats}`,
    '',
    'Recent choices:',
    history,
    '',
    `Write chapter ${request.chapter} and offer ${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices.`,
  ].join('\n')
}

async function callNarrator(
  request: DaVinciNarrationRequest,
): Promise<DaVinciNarrationResult> {
  const config = useRuntimeConfig()
  const apiKey = String(
    config.openaiApiKey || process.env.OPENAI_API_KEY || '',
  ).trim()
  if (!apiKey) {
    throw new Error('No OpenAI API key is configured for Da Vinci narration.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), NARRATION_TIMEOUT_MS)
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey.startsWith('Bearer ')
          ? apiKey
          : `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NARRATION_MODEL,
        messages: [
          {
            role: 'system',
            content: buildNarrationSystemPrompt(request.narrator),
          },
          { role: 'user', content: buildNarrationUserPrompt(request) },
        ],
        temperature: 0.9,
        max_tokens: 900,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'davinci_chapter',
            strict: true,
            schema: narrationResponseSchema(),
          },
        },
      }),
    })

    const body = (await response.json().catch(() => null)) as {
      choices?: Array<{ message?: { content?: string | null } }>
      error?: { message?: string }
    } | null
    if (!response.ok) {
      throw new Error(
        body?.error?.message ||
          `Da Vinci narration failed (${response.status}).`,
      )
    }

    const content = body?.choices?.[0]?.message?.content?.trim()
    if (!content) throw new Error('The narrator returned an empty chapter.')

    try {
      return validateNarrationPayload(JSON.parse(content))
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          'The narrator returned invalid JSON for this chapter.',
          {
            cause: error,
          },
        )
      }
      throw error
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(
        'The narrator timed out before the serverless deadline.',
        { cause: error },
      )
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

// Two-branch narrator lookup, per the spec: LifeRun.botId wins, then
// characterId, then the default narrator bot. Reads the same columns
// GET /api/narrators/[type]/[slug] normalizes, without the self-HTTP hop.
export async function loadRunNarrator(run: {
  botId: number | null
  characterId: number | null
}): Promise<DaVinciNarrator> {
  if (run.botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: run.botId },
      select: {
        name: true,
        personality: true,
        narrativeVoice: true,
        prompt: true,
      },
    })
    if (bot) return bot
  }

  if (run.characterId) {
    const character = await prisma.character.findUnique({
      where: { id: run.characterId },
      select: {
        name: true,
        personality: true,
        quirks: true,
        presentation: true,
        backstory: true,
        drive: true,
      },
    })
    if (character) {
      return {
        name: character.name,
        personality: character.personality || character.quirks || null,
        narrativeVoice: character.presentation || null,
        prompt:
          [
            character.backstory ? `Backstory: ${character.backstory}` : '',
            character.drive ? `Drive: ${character.drive}` : '',
          ]
            .filter(Boolean)
            .join('\n') || null,
      }
    }
  }

  const fallback = await prisma.bot.findUnique({
    where: { id: DEFAULT_NARRATOR_BOT_ID },
    select: {
      name: true,
      personality: true,
      narrativeVoice: true,
      prompt: true,
    },
  })

  return (
    fallback || {
      name: 'the Narrator',
      personality: null,
      narrativeVoice: null,
      prompt: null,
    }
  )
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

// Top-level entry point used by POST /api/davinci/runs/:id/narrate.
// Retries once on a validation/parse failure — models occasionally emit a
// truncated document even under strict mode — then surfaces the error rather
// than substituting a synthetic chapter. A visible retry prompt beats a
// silently fabricated one.
export async function generateDaVinciChapter(
  request: DaVinciNarrationRequest,
): Promise<DaVinciNarrationResult> {
  try {
    return await callNarrator(request)
  } catch (firstError) {
    if (firstError instanceof Error && firstError.name === 'AbortError')
      throw firstError
    try {
      return await callNarrator(request)
    } catch {
      throw firstError
    }
  }
}
