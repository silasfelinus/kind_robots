// /utils/scripts/verifyDaVinciNarration.ts
//
// Contract check for the Da Vinci AI-narration layer (davinci/t-016,
// implementing conductor projects/davinci/docs/narration-layer-spec.md).
//
// The narration layer is the only place where model output reaches the play
// loop, so every app-owned bound it claims to enforce is asserted here: the
// dimension allowlist, the per-choice delta clamp, the 2-4 choice band, and
// the prose word bounds. No network and no database — this exercises
// validateNarrationPayload and the prompt/schema builders directly.

import {
  buildNarrationRequest,
  buildNarrationSystemPrompt,
  buildNarrationUserPrompt,
  narrationResponseSchema,
  validateNarrationPayload,
  NARRATION_EFFECT_MAX,
  NARRATION_EFFECT_MIN,
  NARRATION_MAX_CHOICES,
  NARRATION_MIN_CHOICES,
} from '../../server/utils/davinciNarration'
// Imported from davinciDimensions, not davinci: this suite must stay free of
// ./prisma, which throws at module load when DATABASE_URL is unset (as it is in
// the contract-tests job).
import { DAVINCI_DIMENSIONS } from '../../server/utils/davinciDimensions'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function rejects(name: string, payload: unknown, expectedFragment: string) {
  try {
    validateNarrationPayload(payload)
    failures += 1
    console.error(`  FAIL  ${name} — expected a rejection, got none`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.toLowerCase().includes(expectedFragment.toLowerCase())) {
      console.log(`  PASS  ${name}`)
    } else {
      failures += 1
      console.error(
        `  FAIL  ${name} — rejected for the wrong reason: "${message}"`,
      )
    }
  }
}

const prose = Array.from({ length: 40 }, (_, index) => `word${index}`).join(' ')

function payload(overrides: Record<string, unknown> = {}) {
  return {
    narrativeText: prose,
    choices: [
      {
        id: 'a',
        choiceText: 'Take the commission.',
        effects: { wealth: 2, freedom: -1 },
      },
      {
        id: 'b',
        choiceText: 'Walk away.',
        effects: { freedom: 1, wealth: -1 },
      },
    ],
    artPrompt: null,
    milestoneCandidate: null,
    ...overrides,
  }
}

console.log('Da Vinci narration — happy path')

const valid = validateNarrationPayload(payload())
check('accepts a well-formed chapter', valid.choices.length === 2)
check(
  'preserves in-range deltas unchanged',
  valid.choices[0]!.effects.wealth === 2 &&
    valid.choices[0]!.effects.freedom === -1,
  JSON.stringify(valid.choices[0]!.effects),
)
check('trims prose', valid.narrativeText === prose)
check(
  'normalizes empty artPrompt/milestoneCandidate to null',
  validateNarrationPayload(
    payload({ artPrompt: '   ', milestoneCandidate: '' }),
  ).artPrompt === null,
)
check(
  'keeps a non-empty milestoneCandidate as display-only flavor',
  validateNarrationPayload(payload({ milestoneCandidate: 'the quiet legacy' }))
    .milestoneCandidate === 'the quiet legacy',
)

console.log('Da Vinci narration — app-owned bounds')

// The core safety property: the model cannot invent an eleventh stat. Without
// this guard the key would flow straight into recordLifeChoice, which accepts
// arbitrary stat keys by design and would happily persist it.
rejects(
  'rejects a dimension outside DAVINCI_DIMENSIONS',
  payload({
    choices: [
      { id: 'a', choiceText: 'One', effects: { charisma: 1 } },
      { id: 'b', choiceText: 'Two', effects: { wealth: 1 } },
    ],
  }),
  'unknown dimension',
)

const clamped = validateNarrationPayload(
  payload({
    choices: [
      { id: 'a', choiceText: 'One', effects: { wealth: 40, love: -99 } },
      { id: 'b', choiceText: 'Two', effects: { fame: 3 } },
    ],
  }),
)
check(
  `clamps an overpowered positive delta to +${NARRATION_EFFECT_MAX}`,
  clamped.choices[0]!.effects.wealth === NARRATION_EFFECT_MAX,
  String(clamped.choices[0]!.effects.wealth),
)
check(
  `clamps an overpowered negative delta to ${NARRATION_EFFECT_MIN}`,
  clamped.choices[0]!.effects.love === NARRATION_EFFECT_MIN,
  String(clamped.choices[0]!.effects.love),
)

const nulled = validateNarrationPayload(
  payload({
    choices: [
      {
        id: 'a',
        choiceText: 'Pure flavor, no mechanical effect.',
        effects: Object.fromEntries(DAVINCI_DIMENSIONS.map((d) => [d, null])),
      },
      { id: 'b', choiceText: 'Two', effects: { wisdom: 1 } },
    ],
  }),
)
check(
  'drops null deltas so a flavor-only choice carries no effects',
  Object.keys(nulled.choices[0]!.effects).length === 0,
  JSON.stringify(nulled.choices[0]!.effects),
)
check(
  'drops zero deltas rather than writing a no-op stat row',
  Object.keys(
    validateNarrationPayload(
      payload({
        choices: [
          { id: 'a', choiceText: 'One', effects: { wealth: 0, love: 1 } },
          { id: 'b', choiceText: 'Two', effects: { fame: 1 } },
        ],
      }),
    ).choices[0]!.effects,
  ).join(',') === 'love',
)

rejects(
  `rejects fewer than ${NARRATION_MIN_CHOICES} choices`,
  payload({ choices: [{ id: 'a', choiceText: 'Only one', effects: {} }] }),
  `${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices`,
)
rejects(
  `rejects more than ${NARRATION_MAX_CHOICES} choices`,
  payload({
    choices: Array.from({ length: NARRATION_MAX_CHOICES + 1 }, (_, i) => ({
      id: String.fromCharCode(97 + i),
      choiceText: `Option ${i}`,
      effects: {},
    })),
  }),
  `${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices`,
)
rejects(
  'rejects duplicate choice ids',
  payload({
    choices: [
      { id: 'a', choiceText: 'One', effects: {} },
      { id: 'a', choiceText: 'Two', effects: {} },
    ],
  }),
  'duplicate choice id',
)
rejects(
  'rejects an empty choiceText',
  payload({
    choices: [
      { id: 'a', choiceText: '   ', effects: {} },
      { id: 'b', choiceText: 'Two', effects: {} },
    ],
  }),
  'non-empty choiceText',
)
rejects(
  'rejects truncated prose',
  payload({ narrativeText: 'Too short.' }),
  'words',
)
rejects('rejects a non-object response', 'not an object', 'non-object')
rejects(
  'rejects a missing choice list',
  payload({ choices: undefined }),
  'no choice list',
)
rejects(
  'rejects a non-numeric delta',
  payload({
    choices: [
      { id: 'a', choiceText: 'One', effects: { wealth: 'lots' } },
      { id: 'b', choiceText: 'Two', effects: {} },
    ],
  }),
  'non-numeric delta',
)

console.log('Da Vinci narration — response schema')

/* eslint-disable @typescript-eslint/no-explicit-any --
   The schema is a plain JSON Schema document; asserting on its nested shape is
   the point of these checks, and threading a typed model through it would only
   restate the literal below it. */
const schema = narrationResponseSchema() as Record<string, any>
check(
  'schema forbids additional top-level properties',
  schema.additionalProperties === false,
)
check(
  'schema requires every top-level field (OpenAI strict mode)',
  ['narrativeText', 'choices', 'artPrompt', 'milestoneCandidate'].every((key) =>
    schema.required.includes(key),
  ),
  JSON.stringify(schema.required),
)
const effectsProps = schema.properties.choices.items.properties.effects
check(
  'schema exposes exactly the ten Da Vinci dimensions',
  Object.keys(effectsProps.properties).join(',') ===
    DAVINCI_DIMENSIONS.join(','),
  Object.keys(effectsProps.properties).join(','),
)
check(
  'schema requires all ten dimension keys and forbids others',
  effectsProps.required.length === DAVINCI_DIMENSIONS.length &&
    effectsProps.additionalProperties === false,
)
check(
  'schema types dimensions as nullable integers so a choice can be flavor-only',
  DAVINCI_DIMENSIONS.every(
    (dimension) =>
      Array.isArray(effectsProps.properties[dimension].type) &&
      effectsProps.properties[dimension].type.includes('null') &&
      effectsProps.properties[dimension].type.includes('integer'),
  ),
)

console.log('Da Vinci narration — request assembly')

const request = buildNarrationRequest(
  {
    id: 7,
    seed: 'run-abc',
    protagonistName: 'Vitruvia',
    genre: 'quiet epic',
    currentChapter: 4,
    Stats: [
      { key: 'wealth', value: 3 },
      // A stat key outside the ten dimensions (recordLifeChoice permits any
      // key) must not leak into the narrator's view of the run.
      { key: 'notoriety', value: 9 },
    ],
    Choices: [
      { chapter: 1, choiceText: 'First', resultText: null },
      { chapter: 2, choiceText: 'Second', resultText: 'It cost you.' },
      { chapter: 3, choiceText: 'Third', resultText: null },
      { chapter: 4, choiceText: 'Fourth', resultText: null },
    ],
  },
  {
    name: 'Amri',
    personality: 'wry',
    narrativeVoice: 'close third',
    prompt: null,
  },
)

check('carries the run chapter through by default', request.chapter === 4)
check(
  'filters non-dimension stat keys out of statsSoFar',
  request.statsSoFar.wealth === 3 && !('notoriety' in request.statsSoFar),
  JSON.stringify(request.statsSoFar),
)
check(
  'sends only the last three choices for continuity',
  request.recentChoices.length === 3 &&
    request.recentChoices[0]!.chapter === 2 &&
    request.recentChoices[2]!.chapter === 4,
  JSON.stringify(request.recentChoices.map((c) => c.chapter)),
)
check(
  'an explicit chapter override wins',
  buildNarrationRequest(
    { id: 7, seed: 's', protagonistName: null, genre: null, currentChapter: 4 },
    { name: 'Amri', personality: null, narrativeVoice: null, prompt: null },
    9,
  ).chapter === 9,
)

const system = buildNarrationSystemPrompt(request.narrator)
check('system prompt names the narrator', system.includes('Amri'))
check(
  'system prompt lists all ten dimensions',
  DAVINCI_DIMENSIONS.every((dimension) => system.includes(dimension)),
)
check(
  'system prompt forbids the narrator from awarding anything',
  system.includes('Never state or imply that the player has won'),
)

const userPrompt = buildNarrationUserPrompt(request)
check('user prompt includes the seed', userPrompt.includes('run-abc'))
check(
  'user prompt includes every dimension value',
  userPrompt.includes('wealth=3'),
)
check(
  'user prompt defaults unset dimensions to zero',
  userPrompt.includes('mystery=0'),
)
check(
  'user prompt includes recent choice history',
  userPrompt.includes('It cost you.'),
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll Da Vinci narration checks passed.')
