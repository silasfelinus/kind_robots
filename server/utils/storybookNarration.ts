// /server/utils/storybookNarration.ts
//
// ONE narration layer for every Storybook shape.
//
// Before this, the same idea -- (narrator config + seed objects + state
// snapshot + recent history) -> a structured response -- was built twice:
// client-side in stores/storybookStore.ts for the beat shapes, and server-side
// in server/utils/davinciNarration.ts for the life shape (storybook/t-025 filed
// exactly that duplication). It runs on the server for all four shapes now,
// because only the server can hold the offered choices between turns, and a
// client that authors its own stat deltas is a client that can author its own
// ending.
//
// BOUNDARY, inherited from davinciNarration.ts and still true: this module is a
// CALLER of the play loop, never a second owner of durable state. It reads a
// request, asks a narrator for the next scene, and validates the response
// against app-owned bounds. It writes nothing. The narrator proposes; the app
// disposes. A response that invents an axis the deck does not have, swings a
// stat by 40, or returns one choice is a schema violation, not a new rule.
//
// DB-FREE ON PURPOSE so the contract-tests job (no DATABASE_URL) can exercise
// every bound directly. Nothing here may import ./prisma.

import { DEFAULT_DECK_PASS_VALUE, type DeckDefinition } from './endingDeckMath'
import { completeStructured } from './structuredCompletion'

export type StorybookShape = 'short-story' | 'chaptered' | 'episodic' | 'life'

export type StorybookNarratorStyle =
  'cinematic' | 'playful' | 'storybook' | 'mysterious' | 'intimate'

/** How the reader made this turn's move. */
export type StorybookMoveSource = 'option' | 'custom' | 'sheet'

export interface StorybookMove {
  source: StorybookMoveSource
  text: string
  /** Set when source is 'option': which of the offered choices was taken. */
  optionId?: string | null
  /** Set when source is 'sheet': the Reward slug played from the sheet. */
  rewardSlug?: string | null
}

/** Narrator identity, from a Bot or a Character. Shape unchanged from Da Vinci. */
export interface StoryNarrator {
  name: string
  personality: string | null
  narrativeVoice: string | null
  prompt: string | null
}

export interface StoryTreasure {
  slug: string
  name: string
  rewardType: string
  rarity: string
  effect?: string | null
  flavorText?: string | null
}

export interface StoryCastMember {
  name: string
  role?: string | null
  description?: string | null
}

/** The board the reader assembled, snapshotted when the run was created. */
export interface StoryBible {
  title: string
  premise?: string | null
  cast: StoryCastMember[]
  location?: { title: string; description?: string | null } | null
  facets: { title: string; description?: string | null }[]
  scenario?: { title: string; description?: string | null } | null
  treasures: StoryTreasure[]
  notes?: string | null
}

export interface StoryRecentTurn {
  turnIndex: number
  narrativeText: string
  move?: StorybookMove | null
}

export interface StorybookNarrationRequest {
  shape: StorybookShape
  deck: DeckDefinition
  narratorStyle?: StorybookNarratorStyle | null
  narrator: StoryNarrator
  seed: string
  turnIndex: number
  /** null when the shape has no fixed budget (the life shape resolves on its own clock). */
  turnBudget: number | null
  isFinalTurn: boolean
  bible: StoryBible
  statsSoFar: Record<string, number>
  inventory: StoryTreasure[]
  recentTurns: StoryRecentTurn[]
  /** null asks for the opening scene, or a re-narration of the current turn. */
  move?: StorybookMove | null
  /** Resolved Reward when move.source is 'sheet'. */
  playedReward?: StoryTreasure | null
}

export interface StorybookChoiceOption {
  id: string
  choiceText: string
  effects: Record<string, number>
}

export interface StorybookStateDelta {
  consequences: string[]
  relationshipShifts: string[]
  inventoryAdd: string[]
  inventoryRemove: string[]
}

export interface StorybookNarrationResult {
  narrativeText: string
  /** What the reader's own move cost or gained. Empty when there was no move. */
  moveEffects: Record<string, number>
  choices: StorybookChoiceOption[]
  stateDelta: StorybookStateDelta
  artPrompt: string | null
  /** Display-only flavor. Nothing is ever awarded from it. */
  endingHint: string | null
}

// Per-move swing bounds. An axis passes at DEFAULT_DECK_PASS_VALUE (1), so an
// unclamped narrator could resolve a whole run in one turn.
export const NARRATION_EFFECT_MIN = -2
export const NARRATION_EFFECT_MAX = 2
export const NARRATION_MIN_CHOICES = 2
export const NARRATION_MAX_CHOICES = 4
/** Most turns should move two or three axes; this caps the greedy case. */
export const MAX_EFFECT_AXES_PER_MOVE = 3
export const MAX_STATE_ITEMS = 3
const RECENT_TURN_WINDOW = 3

export const NARRATION_MODEL = 'gpt-4o-mini'
export const NARRATION_TIMEOUT_MS = 20_000
export const NARRATION_MAX_TOKENS = 900

const CHOICE_IDS = ['a', 'b', 'c', 'd'] as const

/**
 * Prose word bounds per shape.
 *
 * Silas, 2026-09-12: "Stories should not be verbose with purple prose, they
 * should be direct, but this should be influenced by the narrator." Length is
 * enforced numerically here and directness is enforced by PROSE_CONTRACT below;
 * the narrator style modulates voice WITHIN both, it does not relax either.
 *
 * 'life' keeps the 20-400 band davinciNarration.ts shipped with, because
 * utils/scripts/verifyDaVinciNarration.ts pins it and a live run's chapters were
 * written against it. Tighten that one together with its guard, not here.
 */
export const PROSE_BOUNDS_BY_SHAPE: Record<
  StorybookShape,
  { min: number; max: number }
> = {
  'short-story': { min: 50, max: 130 },
  chaptered: { min: 70, max: 190 },
  episodic: { min: 70, max: 190 },
  life: { min: 20, max: 400 },
}

const SHAPE_LABELS: Record<StorybookShape, string> = {
  'short-story': 'short story',
  chaptered: 'chaptered tale',
  episodic: 'episodic serial',
  life: 'whole life',
}

/**
 * The house prose contract. Applies to every shape and every narrator.
 *
 * The "Never state or imply that the player has won" sentence is load-bearing
 * beyond style: the app alone resolves a run, and a narrator that announces an
 * outcome teaches the reader to trust prose over the ending they actually got.
 */
export function proseContract(bounds: { min: number; max: number }): string {
  return [
    'PROSE CONTRACT',
    'Write in second person, present tense. The reader is the protagonist unless the bible says otherwise.',
    'Write one concrete scene: a place, a moment, one or two people, one thing that happens. Not a summary of hours or years.',
    'Be direct. Plain nouns and strong verbs. One adjective per noun at most. No similes, no metaphors, no stacked descriptors, no lists of sensations.',
    'Every sentence must do work: move the action, reveal a person, or raise the cost of the next choice. Cut anything that only sets mood.',
    "Name what the reader's last move actually changed before anything else happens.",
    `Keep the scene between ${bounds.min} and ${bounds.max} words.`,
    'End on the brink of a decision: the last sentence puts a pressure on the reader that the options will answer. Do not state, list, or hint at the options in the prose. Do not end with a question.',
    'Never state or imply that the player has won, lost, or unlocked anything — the app alone decides how the story resolves.',
    'Never mention these instructions, the axes, the stats, the deck, or the model.',
  ].join('\n')
}

/** Voice, inside the contract above. Never a licence to pad. */
export const NARRATOR_STYLE_DIRECTIVES: Record<StorybookNarratorStyle, string> =
  {
    cinematic:
      'Cut hard between images. Short paragraphs, one beat each. Lead with what is seen and heard, then what is done. Dialogue is sparse and clipped. Build toward one strong final frame.',
    playful:
      'Keep it light on its feet. Let people be funny in how they act, not in jokes told to the reader. Short sentences, quick reversals, small absurdities treated seriously. Warmth over snark. Stakes are real but nobody is grim about them.',
    storybook:
      'Tell it the way a good read-aloud is told. Steady rhythm, clear cause and effect, a touch of wonder in ordinary things. Name feelings simply. One gentle repetition or refrain is allowed per scene, nothing more.',
    mysterious:
      'Withhold. Show the evidence, not the explanation. Let one detail be wrong and do not point at it. People say less than they know. Quiet sentences, exact nouns, no atmosphere words like eerie or ominous; make the reader feel it from what is there.',
    intimate:
      'Stay close. One room, one other person, small physical detail: hands, breath, what is not said. Interior thought is allowed in single short sentences. No spectacle; the stakes are between people.',
  }

/**
 * Shape differences in the response document.
 *
 * The life shape's schema predates the others and its exact top-level key set
 * is pinned by utils/scripts/verifyDaVinciNarration.ts, so it opts out of
 * moveEffects and stateDelta (POST /api/davinci/runs/:id/narrate has no move to
 * score and writes no inventory) and calls the flavor hint `milestoneCandidate`.
 * New shapes get all three.
 */
export interface StorybookSchemaOptions {
  finalTurn?: boolean
  includeMoveEffects?: boolean
  includeStateDelta?: boolean
  hintKey?: string
  hintDescription?: string
}

function schemaDefaults(options: StorybookSchemaOptions | undefined) {
  return {
    finalTurn: options?.finalTurn ?? false,
    includeMoveEffects: options?.includeMoveEffects ?? true,
    includeStateDelta: options?.includeStateDelta ?? true,
    hintKey: options?.hintKey || 'endingHint',
    hintDescription:
      options?.hintDescription ||
      'Optional short phrase naming the ending this story seems headed toward, or null. Display-only flavor; awards nothing.',
  }
}

// OpenAI structured-output strict mode requires every property to appear in
// `required` and forbids additionalProperties, so an effects map lists all of
// the deck's axes as nullable integers rather than as optional keys. Null means
// "this choice does not move that axis" and is dropped during validation.
//
// Range and item-count bounds are deliberately NOT expressed as minimum/maximum/
// minItems/maxItems: support for those keywords under strict mode is uneven, and
// the app re-validates every bound anyway. They live in the descriptions so the
// model still sees them.
function effectsSchema(deck: DeckDefinition, purpose: string) {
  return {
    type: 'object',
    description:
      `${purpose} Each value is an integer from ${NARRATION_EFFECT_MIN} to ` +
      `${NARRATION_EFFECT_MAX}, or null when it does not move that axis. Move ` +
      `two or three axes, not all of them.`,
    properties: Object.fromEntries(
      deck.axes.map((axis) => [
        axis.key,
        {
          type: ['integer', 'null'],
          description: `Change to the ${axis.key} axis, or null.`,
        },
      ]),
    ),
    required: deck.axes.map((axis) => axis.key),
    additionalProperties: false,
  }
}

function stateDeltaSchema() {
  return {
    type: 'object',
    description:
      `What this scene changed, as short plain strings. At most ` +
      `${MAX_STATE_ITEMS} entries per list. Inventory lists use exact Reward ` +
      `slugs from the story bible and nothing else. Use empty arrays when ` +
      `nothing changed.`,
    properties: {
      consequences: { type: 'array', items: { type: 'string' } },
      relationshipShifts: { type: 'array', items: { type: 'string' } },
      inventoryAdd: { type: 'array', items: { type: 'string' } },
      inventoryRemove: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'consequences',
      'relationshipShifts',
      'inventoryAdd',
      'inventoryRemove',
    ],
    additionalProperties: false,
  }
}

export function storybookResponseSchema(
  deck: DeckDefinition,
  options?: StorybookSchemaOptions,
): Record<string, unknown> {
  const opts = schemaDefaults(options)
  const properties: Record<string, unknown> = {
    narrativeText: {
      type: 'string',
      description:
        "This scene's prose, obeying the prose contract in the system message.",
    },
    choices: {
      type: 'array',
      description: opts.finalTurn
        ? 'Empty. This is the last scene before the story resolves.'
        : `Between ${NARRATION_MIN_CHOICES} and ${NARRATION_MAX_CHOICES} distinct options the protagonist could take next.`,
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            enum: [...CHOICE_IDS],
            description: 'Stable id within this scene, in order.',
          },
          choiceText: {
            type: 'string',
            description: 'One sentence, phrased as an action the player takes.',
          },
          effects: effectsSchema(deck, 'Proposed axis deltas for this option.'),
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
    [opts.hintKey]: {
      type: ['string', 'null'],
      description: opts.hintDescription,
    },
  }

  if (opts.includeMoveEffects) {
    properties.moveEffects = effectsSchema(
      deck,
      "What the reader's own move this turn cost or gained. Empty object when there was no move.",
    )
  }
  if (opts.includeStateDelta) {
    properties.stateDelta = stateDeltaSchema()
  }

  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  }
}

export interface StorybookValidationOptions extends StorybookSchemaOptions {
  bounds?: { min: number; max: number }
  /** Axes one move may touch. `null` disables the cap (the life shape). */
  maxEffectAxes?: number | null
  /** Reward slugs the fiction may hand out. */
  treasureSlugs?: string[]
  /** Reward slugs currently held, which the fiction may spend. */
  inventorySlugs?: string[]
}

function cleanStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const text = entry.trim()
    if (!text) continue
    out.push(text)
    if (out.length >= MAX_STATE_ITEMS) break
  }
  return out
}

function clampEffect(value: number): number {
  return Math.max(
    NARRATION_EFFECT_MIN,
    Math.min(NARRATION_EFFECT_MAX, Math.trunc(value)),
  )
}

/**
 * Read an effects map against the deck's axes.
 *
 * `context` names the offender in the error, e.g. `Choice "a"` or `The move`.
 * An axis the deck does not declare is REJECTED rather than dropped: the key
 * would otherwise flow into a LifeStat row (that table accepts any key by
 * design) and silently join the run's state without ever affecting an ending.
 */
function readEffects(
  raw: unknown,
  deck: DeckDefinition,
  context: string,
  maxAxes: number | null,
): Record<string, number> {
  const effects: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return effects

  const allowed = new Set(deck.axes.map((axis) => axis.key))
  for (const [key, delta] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(key)) {
      throw new Error(
        `${context} proposed unknown dimension "${key}". Allowed: ${deck.axes
          .map((axis) => axis.key)
          .join(', ')}.`,
      )
    }
    if (delta === null || delta === undefined) continue
    if (typeof delta !== 'number' || !Number.isFinite(delta)) {
      throw new Error(`${context} proposed a non-numeric delta for "${key}".`)
    }
    const clamped = clampEffect(delta)
    if (clamped !== 0) effects[key] = clamped
  }

  // Keep the largest-magnitude axes when a narrator moves everything at once.
  // Trimming beats rejecting: the scene it wrote is still good, and a greedy
  // effects map is a tuning miss rather than a contract violation. `maxAxes:
  // null` opts out entirely, which is what the life adapter passes -- that
  // shape has been live with an uncapped effects map since davinci/t-016, and
  // quietly narrowing an existing game's tuning is not this refactor's job.
  const keys = Object.keys(effects)
  if (maxAxes !== null && keys.length > maxAxes) {
    const kept = keys
      .sort((a, b) => Math.abs(effects[b]!) - Math.abs(effects[a]!))
      .slice(0, maxAxes)
    const trimmed: Record<string, number> = {}
    for (const key of kept) trimmed[key] = effects[key]!
    return trimmed
  }
  return effects
}

/**
 * App-owned enforcement, run on every response even under strict mode: strict
 * mode constrains shape, not values.
 */
export function validateStorybookNarration(
  value: unknown,
  deck: DeckDefinition,
  options?: StorybookValidationOptions,
): StorybookNarrationResult {
  const opts = schemaDefaults(options)
  const bounds = options?.bounds || PROSE_BOUNDS_BY_SHAPE['short-story']
  const maxEffectAxes =
    options && 'maxEffectAxes' in options
      ? (options.maxEffectAxes ?? null)
      : MAX_EFFECT_AXES_PER_MOVE

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The narrator returned a non-object response.')
  }
  const payload = value as Record<string, unknown>

  const narrativeText =
    typeof payload.narrativeText === 'string'
      ? payload.narrativeText.trim()
      : ''
  const wordCount = narrativeText.split(/\s+/).filter(Boolean).length
  if (wordCount < bounds.min || wordCount > bounds.max) {
    throw new Error(
      `Scene prose must be ${bounds.min}-${bounds.max} words (got ${wordCount}).`,
    )
  }

  if (!Array.isArray(payload.choices)) {
    throw new Error('The narrator returned no choice list.')
  }

  const choices: StorybookChoiceOption[] = []
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
      throw new Error(`Duplicate choice id "${id}" in one scene.`)
    }
    seenIds.add(id)

    choices.push({
      id,
      choiceText,
      effects: readEffects(
        option.effects,
        deck,
        `Choice "${id}"`,
        maxEffectAxes,
      ),
    })
  }

  if (opts.finalTurn) {
    if (choices.length) {
      throw new Error(
        `The final scene must offer no choices (got ${choices.length}).`,
      )
    }
  } else if (
    choices.length < NARRATION_MIN_CHOICES ||
    choices.length > NARRATION_MAX_CHOICES
  ) {
    throw new Error(
      `A scene must offer ${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices (got ${choices.length}).`,
    )
  }

  const moveEffects = opts.includeMoveEffects
    ? readEffects(payload.moveEffects, deck, 'The move', maxEffectAxes)
    : {}

  const treasures = new Set(options?.treasureSlugs || [])
  const held = new Set([
    ...(options?.inventorySlugs || []),
    ...(options?.treasureSlugs || []),
  ])
  const rawDelta =
    opts.includeStateDelta &&
    payload.stateDelta &&
    typeof payload.stateDelta === 'object' &&
    !Array.isArray(payload.stateDelta)
      ? (payload.stateDelta as Record<string, unknown>)
      : {}
  const stateDelta: StorybookStateDelta = {
    consequences: cleanStrings(rawDelta.consequences),
    relationshipShifts: cleanStrings(rawDelta.relationshipShifts),
    // Slug allowlists, not free text: the fiction may only hand out or spend
    // Rewards the board actually put in play.
    inventoryAdd: cleanStrings(rawDelta.inventoryAdd).filter((slug) =>
      treasures.has(slug),
    ),
    inventoryRemove: cleanStrings(rawDelta.inventoryRemove).filter((slug) =>
      held.has(slug),
    ),
  }

  const artPrompt =
    typeof payload.artPrompt === 'string' && payload.artPrompt.trim()
      ? payload.artPrompt.trim()
      : null
  const rawHint = payload[opts.hintKey]
  const endingHint =
    typeof rawHint === 'string' && rawHint.trim() ? rawHint.trim() : null

  return {
    narrativeText,
    moveEffects,
    choices,
    stateDelta,
    artPrompt,
    endingHint,
  }
}

function axisLines(deck: DeckDefinition): string {
  return deck.axes
    .map((axis) =>
      axis.description
        ? `- ${axis.key} (${axis.label}): ${axis.description}`
        : `- ${axis.key} (${axis.label})`,
    )
    .join('\n')
}

/**
 * Clamp an effects map to a deck's axes, outside the narration response path.
 *
 * The validator already does this for a model response, but the play loop
 * writes stat rows from effects that may not have come through it -- an
 * injected narrator in a test, a future caller, an option replayed out of a
 * stored turn. LifeStat accepts any key by design, so the bound has to hold
 * where the WRITE happens, not only where the model answers. Same rules:
 * unknown axes are dropped, deltas are clamped, zeroes are not written, and at
 * most `maxAxes` axes move.
 */
export function clampEffectsToDeck(
  effects: Record<string, number> | null | undefined,
  deck: DeckDefinition,
  maxAxes: number | null = MAX_EFFECT_AXES_PER_MOVE,
): Record<string, number> {
  if (!effects) return {}
  const allowed = new Set(deck.axes.map((axis) => axis.key))
  const kept: Record<string, number> = {}
  for (const [key, delta] of Object.entries(effects)) {
    if (!allowed.has(key)) continue
    if (typeof delta !== 'number' || !Number.isFinite(delta)) continue
    const clamped = clampEffect(delta)
    if (clamped !== 0) kept[key] = clamped
  }
  const keys = Object.keys(kept)
  if (maxAxes === null || keys.length <= maxAxes) return kept
  const trimmed: Record<string, number> = {}
  for (const key of keys
    .sort((a, b) => Math.abs(kept[b]!) - Math.abs(kept[a]!))
    .slice(0, maxAxes)) {
    trimmed[key] = kept[key]!
  }
  return trimmed
}

export function buildStorybookSystemPrompt(
  request: StorybookNarrationRequest,
): string {
  const bounds = PROSE_BOUNDS_BY_SHAPE[request.shape]
  const style = request.narratorStyle
    ? NARRATOR_STYLE_DIRECTIVES[request.narratorStyle]
    : ''

  return [
    `You are ${request.narrator.name}, narrating a ${SHAPE_LABELS[request.shape]} in Kind Robots' Storybook.`,
    request.narrator.prompt || '',
    request.narrator.personality
      ? `Personality: ${request.narrator.personality}`
      : '',
    request.narrator.narrativeVoice
      ? `Narrative voice: ${request.narrator.narrativeVoice}`
      : '',
    '',
    proseContract(bounds),
    style ? '' : '',
    style ? `NARRATOR STYLE (${request.narratorStyle})\n${style}` : '',
    '',
    'HIDDEN AXES',
    'The story is scored on these axes. Never name them to the reader.',
    axisLines(request.deck),
    `An axis passes at ${request.deck.passValue ?? DEFAULT_DECK_PASS_VALUE} or above, and the axes together decide which ending the story resolves into.`,
    `Every option proposes integer deltas from ${NARRATION_EFFECT_MIN} to ${NARRATION_EFFECT_MAX} on two or three of them and null on the rest. Real trade-offs beat pure upgrades: an option that raises one axis should usually cost another.`,
    'If the reader wrote their own action or played a card, judge what it cost or gained on the same axes in moveEffects.',
    request.isFinalTurn
      ? "This is the last scene before the story resolves. Land the reader's move, close the scene on a held breath, and return an empty choices array."
      : '',
  ]
    .filter((line) => line !== '')
    .join('\n')
}

function bibleBlock(bible: StoryBible): string[] {
  const lines: string[] = [`Title: ${bible.title}`]

  // THE PLOT THREAD IS THE FRAME, so it goes first -- before cast and facets,
  // which are what bend it. Stated as a thread to be told rather than a summary
  // to reproduce, because the point of framing a Scenario this way is that the
  // other ingredients are allowed to change it.
  if (bible.scenario) {
    lines.push(
      `Plot thread (the frame; the cast, setting and Facets below reshape how it plays out rather than decorating it): ${bible.scenario.title}${
        bible.scenario.description ? ` — ${bible.scenario.description}` : ''
      }`,
    )
  }

  lines.push(
    bible.premise && bible.premise.trim()
      ? `Premise: ${bible.premise.trim()}`
      : 'Premise: none — invent the inciting situation from the cast and setting.',
  )

  if (bible.cast.length) {
    lines.push('Cast:')
    for (const member of bible.cast) {
      lines.push(
        `- ${member.name}${member.role ? ` (${member.role})` : ''}${
          member.description ? `: ${member.description}` : ''
        }`,
      )
    }
  }
  if (bible.location) {
    lines.push(
      `Primary setting: ${bible.location.title}${
        bible.location.description ? ` — ${bible.location.description}` : ''
      }`,
    )
  }
  if (bible.facets.length) {
    lines.push(
      `Creative Facets: ${bible.facets
        .map((facet) =>
          facet.description
            ? `${facet.title} (${facet.description})`
            : facet.title,
        )
        .join('; ')}`,
    )
  }
  if (bible.treasures.length) {
    lines.push(
      'Rewards this story may hand out (use exact slugs in stateDelta):',
    )
    for (const treasure of bible.treasures) {
      lines.push(
        `- slug=${treasure.slug}; ${treasure.name} (${treasure.rarity} ${treasure.rewardType})${
          treasure.effect ? `: ${treasure.effect}` : ''
        }`,
      )
    }
  }
  if (bible.notes && bible.notes.trim()) {
    lines.push(`Additional direction: ${bible.notes.trim()}`)
  }
  return lines
}

function moveBlock(request: StorybookNarrationRequest): string[] {
  const move = request.move
  if (!move) {
    return request.turnIndex <= 1
      ? ['Write the opening scene.']
      : ['Write this scene again from the state above.']
  }

  if (move.source === 'sheet' && request.playedReward) {
    const card = request.playedReward
    const consumed = card.rewardType.toUpperCase() === 'ITEM'
    return [
      "The reader opens the protagonist's sheet and plays a card.",
      `Card: ${card.name} (${card.rewardType}, ${card.rarity}).${
        card.effect ? ` Effect: ${card.effect}.` : ''
      }${card.flavorText ? ` Flavor: ${card.flavorText}.` : ''}`,
      `Reader's note: ${move.text.trim() || 'none'}.`,
      'The card is genuinely used this turn. Show its effect on the scene as a concrete action with a concrete result.',
      'Let rarity set how decisively it works: COMMON nudges, RARE turns the moment, LEGENDARY changes the scene.',
      consumed
        ? 'The item is spent by the end of the scene.'
        : 'The card stays with the protagonist.',
      "Report the card's cost or gain on the hidden axes in moveEffects.",
    ]
  }

  return [
    move.source === 'custom'
      ? `The reader wrote their own move: ${move.text}`
      : `The reader chose: ${move.text}`,
    'Judge what that move cost or gained on the hidden axes in moveEffects.',
  ]
}

export function buildStorybookUserPrompt(
  request: StorybookNarrationRequest,
): string {
  const stats = request.deck.axes
    .map((axis) => `${axis.key}=${request.statsSoFar[axis.key] ?? 0}`)
    .join(', ')

  const history = request.recentTurns.length
    ? request.recentTurns
        .slice(-RECENT_TURN_WINDOW)
        .map(
          (turn) =>
            `- Turn ${turn.turnIndex}: ${turn.narrativeText}${
              turn.move ? `\n  The reader: ${turn.move.text}` : ''
            }`,
        )
        .join('\n')
    : '- (none yet — this is the opening scene)'

  const inventory = request.inventory.length
    ? request.inventory.map((item) => item.slug).join(', ')
    : 'empty'

  return [
    'STORY BIBLE',
    ...bibleBlock(request.bible),
    '',
    `Seed: ${request.seed}`,
    request.turnBudget
      ? `Turn ${request.turnIndex} of ${request.turnBudget}`
      : `Turn ${request.turnIndex}`,
    '',
    `Axis values so far: ${stats}`,
    `Inventory slugs: ${inventory}`,
    '',
    'Recent turns:',
    history,
    '',
    ...moveBlock(request),
  ].join('\n')
}

export interface GenerateStorybookTurnOptions extends StorybookSchemaOptions {
  model?: string
  timeoutMs?: number
  maxTokens?: number
  apiKey?: string
}

async function callNarrator(
  request: StorybookNarrationRequest,
  options: GenerateStorybookTurnOptions,
): Promise<StorybookNarrationResult> {
  const payload = await completeStructured({
    system: buildStorybookSystemPrompt(request),
    user: buildStorybookUserPrompt(request),
    schemaName: 'storybook_scene',
    schema: storybookResponseSchema(request.deck, options),
    model: options.model || NARRATION_MODEL,
    temperature: 0.9,
    maxTokens: options.maxTokens ?? NARRATION_MAX_TOKENS,
    timeoutMs: options.timeoutMs ?? NARRATION_TIMEOUT_MS,
    apiKey: options.apiKey,
    label: 'Storybook narration',
  })

  return validateStorybookNarration(payload, request.deck, {
    ...options,
    bounds: PROSE_BOUNDS_BY_SHAPE[request.shape],
    treasureSlugs: request.bible.treasures.map((treasure) => treasure.slug),
    inventorySlugs: request.inventory.map((item) => item.slug),
  })
}

/**
 * Top-level entry point for a single turn's narration.
 *
 * Retries once on a validation or parse failure -- models occasionally emit a
 * truncated document even under strict mode -- then surfaces the original error
 * rather than substituting a synthetic scene. A visible retry prompt beats a
 * silently fabricated one. A timeout is not retried: the reader has already
 * spent that budget staring at a spinner.
 */
export async function generateStorybookTurn(
  request: StorybookNarrationRequest,
  options: GenerateStorybookTurnOptions = {},
): Promise<StorybookNarrationResult> {
  try {
    return await callNarrator(request, options)
  } catch (firstError) {
    if (firstError instanceof Error && firstError.name === 'AbortError') {
      throw firstError
    }
    try {
      return await callNarrator(request, options)
    } catch {
      throw firstError
    }
  }
}
