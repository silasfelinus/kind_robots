// /utils/scripts/verifyStorybookNarration.ts
//
// Contract check for server/utils/storybookNarration.ts (storybook/t-031),
// the one narration layer every Storybook shape goes through.
//
// Model output reaching the play loop is the whole risk surface, so every
// app-owned bound is asserted directly: the deck's axis allowlist, the delta
// clamp, the choice band (including the final scene's empty band), the prose
// word bounds per shape, and the Reward-slug allowlists on inventory changes.
// The prompt assertions cover the two things Silas asked for by name -- direct
// prose, and a narrator style that modulates it -- plus the sheet-play block.
//
// No network and no database: this exercises the validator and the prompt/schema
// builders directly. The life shape's own bounds stay pinned by the older
// verifyDaVinciNarration.ts, which runs against the adapter.

import {
  MAX_EFFECT_AXES_PER_MOVE,
  clampEffectsToDeck,
  MAX_STATE_ITEMS,
  NARRATION_EFFECT_MAX,
  NARRATION_EFFECT_MIN,
  NARRATION_MAX_CHOICES,
  NARRATION_MIN_CHOICES,
  NARRATOR_STYLE_DIRECTIVES,
  PROSE_BOUNDS_BY_SHAPE,
  buildStorybookSystemPrompt,
  buildStorybookUserPrompt,
  storybookResponseSchema,
  validateStorybookNarration,
  type StorybookNarrationRequest,
  type StorybookNarratorStyle,
} from '../../server/utils/storybookNarration'
import {
  LIFE_DECK,
  type DeckDefinition,
} from '../../server/utils/endingDeckMath'
import { validateNarrationPayload } from '../../server/utils/davinciNarration'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

function rejects(name: string, run: () => unknown, expectedFragment: string) {
  try {
    run()
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

const deck: DeckDefinition = {
  key: 'genre-mystery',
  title: 'Mystery',
  passValue: 1,
  axes: [
    {
      key: 'truth',
      label: 'Truth',
      description: 'How much of the case is solved.',
    },
    {
      key: 'trust',
      label: 'Trust',
      description: 'Whether allies are still allies.',
    },
    {
      key: 'nerve',
      label: 'Nerve',
      description: 'What holding steady has cost.',
    },
  ],
}

const shape = 'short-story' as const
const bounds = PROSE_BOUNDS_BY_SHAPE[shape]
const prose = Array.from({ length: 80 }, (_, index) => `word${index}`).join(' ')
const treasureSlugs = ['brass-key', 'cousin-who-knows-a-guy']

function payload(overrides: Record<string, unknown> = {}) {
  return {
    narrativeText: prose,
    moveEffects: { truth: 1, nerve: -1 },
    choices: [
      {
        id: 'a',
        choiceText: 'Open the ledger.',
        effects: { truth: 2, trust: -1 },
      },
      {
        id: 'b',
        choiceText: 'Ask her instead.',
        effects: { trust: 1, truth: -1 },
      },
    ],
    stateDelta: {
      consequences: ['The clerk saw you.'],
      relationshipShifts: [],
      inventoryAdd: ['brass-key'],
      inventoryRemove: [],
    },
    artPrompt: null,
    endingHint: null,
    ...overrides,
  }
}

function validate(value: unknown, options: Record<string, unknown> = {}) {
  return validateStorybookNarration(value, deck, {
    bounds,
    treasureSlugs,
    inventorySlugs: [],
    ...options,
  })
}

console.log('Storybook narration — happy path')

const valid = validate(payload())
check('accepts a well-formed scene', valid.choices.length === 2)
check(
  'preserves in-range deltas unchanged',
  valid.choices[0]!.effects.truth === 2 &&
    valid.choices[0]!.effects.trust === -1,
  JSON.stringify(valid.choices[0]!.effects),
)
check(
  "scores the reader's own move separately from the options",
  valid.moveEffects.truth === 1 && valid.moveEffects.nerve === -1,
  JSON.stringify(valid.moveEffects),
)
check('trims prose', valid.narrativeText === prose)
check(
  'normalizes an empty artPrompt/endingHint to null',
  validate(payload({ artPrompt: '   ', endingHint: '' })).artPrompt === null,
)
check(
  'keeps a non-empty endingHint as display-only flavor',
  validate(payload({ endingHint: 'the cold case' })).endingHint ===
    'the cold case',
)

console.log('Storybook narration — the deck owns the axes')

// The core safety property, now deck-scoped: a genre deck's narrator cannot
// reach the Life deck's axes, and no narrator can invent one. Without this the
// key flows into a LifeStat row (that table accepts any key by design) and
// joins the run's state without ever affecting an ending.
rejects(
  'rejects an axis the deck does not declare',
  () =>
    validate(
      payload({
        choices: [
          { id: 'a', choiceText: 'One', effects: { charisma: 1 } },
          { id: 'b', choiceText: 'Two', effects: { truth: 1 } },
        ],
      }),
    ),
  'unknown dimension',
)
rejects(
  "rejects another deck's axis on this deck",
  () =>
    validate(
      payload({
        choices: [
          { id: 'a', choiceText: 'One', effects: { legacy: 1 } },
          { id: 'b', choiceText: 'Two', effects: { truth: 1 } },
        ],
      }),
    ),
  'unknown dimension',
)
rejects(
  "rejects an unknown axis in the move's own effects",
  () => validate(payload({ moveEffects: { charisma: 2 } })),
  'unknown dimension',
)
check(
  'the same payload validates against a deck that does declare the axis',
  validateStorybookNarration(
    payload({
      moveEffects: { legacy: 1 },
      choices: [
        { id: 'a', choiceText: 'One', effects: { legacy: 1 } },
        { id: 'b', choiceText: 'Two', effects: { love: 1 } },
      ],
      stateDelta: undefined,
    }),
    LIFE_DECK,
    { bounds: PROSE_BOUNDS_BY_SHAPE.life },
  ).moveEffects.legacy === 1,
)

console.log('Storybook narration — app-owned bounds')

const clamped = validate(
  payload({
    choices: [
      { id: 'a', choiceText: 'One', effects: { truth: 40, trust: -99 } },
      { id: 'b', choiceText: 'Two', effects: { nerve: 3 } },
    ],
  }),
)
check(
  `clamps an overpowered positive delta to +${NARRATION_EFFECT_MAX}`,
  clamped.choices[0]!.effects.truth === NARRATION_EFFECT_MAX,
  String(clamped.choices[0]!.effects.truth),
)
check(
  `clamps an overpowered negative delta to ${NARRATION_EFFECT_MIN}`,
  clamped.choices[0]!.effects.trust === NARRATION_EFFECT_MIN,
  String(clamped.choices[0]!.effects.trust),
)
check(
  'drops null deltas so a flavor-only choice carries no effects',
  Object.keys(
    validate(
      payload({
        choices: [
          {
            id: 'a',
            choiceText: 'Pure flavor.',
            effects: { truth: null, trust: null, nerve: null },
          },
          { id: 'b', choiceText: 'Two', effects: { truth: 1 } },
        ],
      }),
    ).choices[0]!.effects,
  ).length === 0,
)
check(
  'drops zero deltas rather than writing a no-op stat row',
  Object.keys(
    validate(
      payload({
        choices: [
          { id: 'a', choiceText: 'One', effects: { truth: 0, trust: 1 } },
          { id: 'b', choiceText: 'Two', effects: { nerve: 1 } },
        ],
      }),
    ).choices[0]!.effects,
  ).join(',') === 'trust',
)

const greedy = validateStorybookNarration(
  payload({
    moveEffects: { legacy: 1, wealth: 2, love: 1, wisdom: 2, health: 1 },
    choices: [
      { id: 'a', choiceText: 'One', effects: { legacy: 1 } },
      { id: 'b', choiceText: 'Two', effects: { love: 1 } },
    ],
    stateDelta: undefined,
  }),
  LIFE_DECK,
  { bounds: PROSE_BOUNDS_BY_SHAPE.life },
)
check(
  `trims a greedy effects map to ${MAX_EFFECT_AXES_PER_MOVE} axes, keeping the largest swings`,
  Object.keys(greedy.moveEffects).length === MAX_EFFECT_AXES_PER_MOVE &&
    greedy.moveEffects.wealth === 2 &&
    greedy.moveEffects.wisdom === 2,
  JSON.stringify(greedy.moveEffects),
)
// The life shape has been live with an uncapped effects map since davinci/t-016;
// the adapter opts out so this refactor does not quietly retune a running game.
check(
  'the life adapter leaves an uncapped effects map alone',
  Object.keys(
    validateNarrationPayload({
      narrativeText: prose,
      choices: [
        {
          id: 'a',
          choiceText: 'One',
          effects: { legacy: 1, wealth: 1, love: 1, wisdom: 1, health: 1 },
        },
        { id: 'b', choiceText: 'Two', effects: { fame: 1 } },
      ],
      artPrompt: null,
      milestoneCandidate: null,
    }).choices[0]!.effects,
  ).length === 5,
)
check(
  'the life adapter still answers with milestoneCandidate, not endingHint',
  validateNarrationPayload({
    narrativeText: prose,
    choices: [
      { id: 'a', choiceText: 'One', effects: { legacy: 1 } },
      { id: 'b', choiceText: 'Two', effects: { love: 1 } },
    ],
    artPrompt: null,
    milestoneCandidate: 'the quiet legacy',
  }).milestoneCandidate === 'the quiet legacy',
)

rejects(
  `rejects fewer than ${NARRATION_MIN_CHOICES} choices`,
  () =>
    validate(
      payload({ choices: [{ id: 'a', choiceText: 'Only one', effects: {} }] }),
    ),
  `${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices`,
)
rejects(
  `rejects more than ${NARRATION_MAX_CHOICES} choices`,
  () =>
    validate(
      payload({
        choices: Array.from({ length: NARRATION_MAX_CHOICES + 1 }, (_, i) => ({
          id: String.fromCharCode(97 + i),
          choiceText: `Option ${i}`,
          effects: {},
        })),
      }),
    ),
  `${NARRATION_MIN_CHOICES}-${NARRATION_MAX_CHOICES} choices`,
)
rejects(
  'rejects duplicate choice ids',
  () =>
    validate(
      payload({
        choices: [
          { id: 'a', choiceText: 'One', effects: {} },
          { id: 'a', choiceText: 'Two', effects: {} },
        ],
      }),
    ),
  'duplicate choice id',
)
rejects(
  'rejects an empty choiceText',
  () =>
    validate(
      payload({
        choices: [
          { id: 'a', choiceText: '   ', effects: {} },
          { id: 'b', choiceText: 'Two', effects: {} },
        ],
      }),
    ),
  'non-empty choiceText',
)
rejects('rejects a non-object response', () => validate('nope'), 'non-object')
rejects(
  'rejects a missing choice list',
  () => validate(payload({ choices: undefined })),
  'no choice list',
)
rejects(
  'rejects a non-numeric delta',
  () =>
    validate(
      payload({
        choices: [
          { id: 'a', choiceText: 'One', effects: { truth: 'lots' } },
          { id: 'b', choiceText: 'Two', effects: {} },
        ],
      }),
    ),
  'non-numeric delta',
)

console.log('Storybook narration — clamping at the write boundary')

// The play loop writes stat rows from effects that did not necessarily come
// through validateStorybookNarration (a stored turn, an injected narrator), and
// LifeStat accepts any key by design. verifyStorybookPlayLoop.ts caught exactly
// this on its first real run: a +-9 proposal reached the row unclamped.
check(
  'clamps an out-of-range delta',
  clampEffectsToDeck({ truth: 9, nerve: -9 }, deck).truth ===
    NARRATION_EFFECT_MAX &&
    clampEffectsToDeck({ truth: 9, nerve: -9 }, deck).nerve ===
      NARRATION_EFFECT_MIN,
  JSON.stringify(clampEffectsToDeck({ truth: 9, nerve: -9 }, deck)),
)
check(
  'drops an axis the deck does not declare rather than writing a stray stat',
  clampEffectsToDeck({ truth: 1, legacy: 2, charisma: 3 }, deck).legacy ===
    undefined && clampEffectsToDeck({ truth: 1, legacy: 2 }, deck).truth === 1,
)
check(
  'drops a zero rather than writing a no-op stat row',
  Object.keys(clampEffectsToDeck({ truth: 0, trust: 1 }, deck)).join(',') ===
    'trust',
)
check(
  'drops a non-numeric delta',
  Object.keys(
    clampEffectsToDeck(
      { truth: Number.NaN, trust: 1 } as Record<string, number>,
      deck,
    ),
  ).join(',') === 'trust',
)
check(
  'a null or absent effects map is an empty one',
  Object.keys(clampEffectsToDeck(null, deck)).length === 0,
)
check(
  `caps a greedy map at ${MAX_EFFECT_AXES_PER_MOVE} axes`,
  Object.keys(
    clampEffectsToDeck(
      { legacy: 1, wealth: 2, love: 1, wisdom: 2, health: 1 },
      LIFE_DECK,
    ),
  ).length === MAX_EFFECT_AXES_PER_MOVE,
)

console.log('Storybook narration — the turn budget ends the story')

check(
  'the final scene accepts an empty choice list',
  validate(payload({ choices: [] }), { finalTurn: true }).choices.length === 0,
)
rejects(
  'the final scene refuses to offer another choice',
  () => validate(payload(), { finalTurn: true }),
  'no choices',
)

console.log('Storybook narration — prose length is per shape')

const shortProse = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ')
rejects(
  'rejects prose under the shape minimum',
  () => validate(payload({ narrativeText: shortProse })),
  'words',
)
check(
  'the same prose is fine for a shape with a lower floor',
  validateStorybookNarration(
    payload({
      narrativeText: shortProse,
      moveEffects: {},
      stateDelta: undefined,
    }),
    deck,
    { bounds: PROSE_BOUNDS_BY_SHAPE.life, treasureSlugs },
  ).narrativeText === shortProse,
)
rejects(
  'rejects prose over the shape maximum',
  () =>
    validate(
      payload({
        narrativeText: Array.from(
          { length: bounds.max + 10 },
          (_, i) => `word${i}`,
        ).join(' '),
      }),
    ),
  'words',
)
check(
  'every shape declares a band, and none of them invites purple prose',
  Object.values(PROSE_BOUNDS_BY_SHAPE).every(
    (band) => band.min > 0 && band.max > band.min,
  ),
)

console.log('Storybook narration — inventory changes are slug allowlists')

check(
  'accepts an add of a Reward the board actually put in play',
  validate(payload()).stateDelta.inventoryAdd.join(',') === 'brass-key',
)
check(
  'drops an invented Reward slug rather than granting it',
  validate(
    payload({
      stateDelta: {
        consequences: [],
        relationshipShifts: [],
        inventoryAdd: ['sword-of-nothing'],
        inventoryRemove: [],
      },
    }),
  ).stateDelta.inventoryAdd.length === 0,
)
check(
  'drops a removal of something the protagonist never held',
  validate(
    payload({
      stateDelta: {
        consequences: [],
        relationshipShifts: [],
        inventoryAdd: [],
        inventoryRemove: ['sword-of-nothing'],
      },
    }),
  ).stateDelta.inventoryRemove.length === 0,
)
check(
  'allows spending something currently held',
  validate(
    payload({
      stateDelta: {
        consequences: [],
        relationshipShifts: [],
        inventoryAdd: [],
        inventoryRemove: ['lantern'],
      },
    }),
    { inventorySlugs: ['lantern'] },
  ).stateDelta.inventoryRemove.join(',') === 'lantern',
)
check(
  `caps each state list at ${MAX_STATE_ITEMS} entries`,
  validate(
    payload({
      stateDelta: {
        consequences: ['a', 'b', 'c', 'd', 'e'],
        relationshipShifts: [],
        inventoryAdd: [],
        inventoryRemove: [],
      },
    }),
  ).stateDelta.consequences.length === MAX_STATE_ITEMS,
)
check(
  'a missing stateDelta is an empty one, not a crash',
  validate(payload({ stateDelta: undefined })).stateDelta.consequences
    .length === 0,
)

console.log('Storybook narration — response schema')

/* eslint-disable @typescript-eslint/no-explicit-any --
   The schema is a plain JSON Schema document; asserting on its nested shape is
   the point of these checks. */
const schema = storybookResponseSchema(deck) as Record<string, any>
check(
  'schema forbids additional top-level properties',
  schema.additionalProperties === false,
)
check(
  'schema requires every top-level field (OpenAI strict mode)',
  [
    'narrativeText',
    'choices',
    'artPrompt',
    'endingHint',
    'moveEffects',
    'stateDelta',
  ].every((key) => schema.required.includes(key)),
  JSON.stringify(schema.required),
)
const effectsProps = schema.properties.choices.items.properties.effects
check(
  "schema exposes exactly this deck's axes, not the Life deck's",
  Object.keys(effectsProps.properties).join(',') === 'truth,trust,nerve',
  Object.keys(effectsProps.properties).join(','),
)
check(
  'schema requires every axis key and forbids others',
  effectsProps.required.length === deck.axes.length &&
    effectsProps.additionalProperties === false,
)
check(
  'schema types axes as nullable integers so a choice can be flavor-only',
  deck.axes.every(
    (axis) =>
      Array.isArray(effectsProps.properties[axis.key].type) &&
      effectsProps.properties[axis.key].type.includes('null') &&
      effectsProps.properties[axis.key].type.includes('integer'),
  ),
)
check(
  'the final-scene schema tells the narrator the choice list is empty',
  String(
    (storybookResponseSchema(deck, { finalTurn: true }) as any).properties
      .choices.description,
  )
    .toLowerCase()
    .includes('empty'),
)
/* eslint-enable @typescript-eslint/no-explicit-any */

console.log('Storybook narration — prompts')

function request(
  overrides: Partial<StorybookNarrationRequest> = {},
): StorybookNarrationRequest {
  return {
    shape,
    deck,
    narratorStyle: 'mysterious',
    narrator: {
      name: 'Amri',
      personality: 'wry',
      narrativeVoice: 'close third',
      prompt: null,
    },
    seed: 'run-abc',
    turnIndex: 3,
    turnBudget: 5,
    isFinalTurn: false,
    bible: {
      title: 'The Clockwork Orchard',
      premise: 'A letter arrives from a star that should not exist.',
      cast: [
        {
          name: 'Wren',
          role: 'protagonist',
          description: 'A tired archivist.',
        },
      ],
      location: { title: 'The Abandoned Observatory' },
      facets: [{ title: 'Mystery' }],
      scenario: { title: 'The Midnight Letters' },
      treasures: [
        {
          slug: 'brass-key',
          name: 'Brass Key',
          rewardType: 'ITEM',
          rarity: 'COMMON',
          effect: 'Opens one locked thing.',
        },
      ],
    },
    statsSoFar: { truth: 2 },
    inventory: [],
    recentTurns: [
      {
        turnIndex: 2,
        narrativeText: 'The ledger was already open.',
        move: { source: 'option', text: 'Follow the clerk.' },
      },
    ],
    move: { source: 'custom', text: 'Read the letter aloud.' },
    ...overrides,
  }
}

const system = buildStorybookSystemPrompt(request())
check('system prompt names the narrator', system.includes('Amri'))
check(
  'system prompt names the shape being told',
  system.includes('short story'),
)
check(
  'system prompt carries the direct-prose contract',
  system.includes('PROSE CONTRACT') &&
    system.includes('No similes, no metaphors') &&
    system.includes('Plain nouns and strong verbs'),
)
check(
  'system prompt states the shape word band',
  system.includes(`between ${bounds.min} and ${bounds.max} words`),
)
check(
  'system prompt forbids ending the scene on a question or listing the options',
  system.includes('Do not end with a question') &&
    system.includes('Do not state, list, or hint at the options'),
)
check(
  'system prompt forbids the narrator from awarding anything',
  system.includes('Never state or imply that the player has won'),
)
check(
  'system prompt carries the selected narrator style directive',
  system.includes(NARRATOR_STYLE_DIRECTIVES.mysterious),
)
check(
  'system prompt carries no other style directive',
  (Object.keys(NARRATOR_STYLE_DIRECTIVES) as StorybookNarratorStyle[])
    .filter((style) => style !== 'mysterious')
    .every((style) => !system.includes(NARRATOR_STYLE_DIRECTIVES[style])),
)
check(
  'every narrator style has a directive, so none silently falls back to none',
  (
    ['cinematic', 'playful', 'storybook', 'mysterious', 'intimate'] as const
  ).every((style) => NARRATOR_STYLE_DIRECTIVES[style].length > 40),
)
check(
  'a style-less request still gets the prose contract',
  buildStorybookSystemPrompt(request({ narratorStyle: null })).includes(
    'PROSE CONTRACT',
  ),
)
check(
  "system prompt lists this deck's axes and keeps them from the reader",
  deck.axes.every((axis) => system.includes(axis.key)) &&
    system.includes('Never name them to the reader'),
)
check(
  'the final scene is told to close rather than branch',
  buildStorybookSystemPrompt(request({ isFinalTurn: true })).includes(
    'return an empty choices array',
  ),
)

const userPrompt = buildStorybookUserPrompt(request())
check('user prompt includes the seed', userPrompt.includes('run-abc'))
check(
  'user prompt places the turn inside its budget',
  userPrompt.includes('Turn 3 of 5'),
)
check(
  'user prompt frames the plot thread before the ingredients that bend it',
  userPrompt.indexOf('Plot thread') < userPrompt.indexOf('Cast:'),
)
check(
  'user prompt includes every axis value, defaulting the unset ones to zero',
  userPrompt.includes('truth=2') && userPrompt.includes('nerve=0'),
)
check(
  'user prompt lists treasures with the exact slugs stateDelta must use',
  userPrompt.includes('slug=brass-key'),
)
check(
  'user prompt includes recent turns and what the reader did',
  userPrompt.includes('The ledger was already open.') &&
    userPrompt.includes('Follow the clerk.'),
)
check(
  "user prompt carries the reader's own move",
  userPrompt.includes('Read the letter aloud.'),
)
check(
  'an absent premise asks the narrator to invent one rather than stalling',
  buildStorybookUserPrompt(
    request({
      bible: { ...request().bible, premise: null },
    }),
  ).includes('invent the inciting situation'),
)
check(
  'the opening turn asks for an opening scene',
  buildStorybookUserPrompt(request({ move: null, turnIndex: 1 })).includes(
    'Write the opening scene.',
  ),
)

const sheetPrompt = buildStorybookUserPrompt(
  request({
    move: {
      source: 'sheet',
      text: 'I want the door open.',
      rewardSlug: 'brass-key',
    },
    playedReward: {
      slug: 'brass-key',
      name: 'Brass Key',
      rewardType: 'ITEM',
      rarity: 'COMMON',
      effect: 'Opens one locked thing.',
      flavorText: 'Warm from a pocket.',
    },
  }),
)
check(
  'a character-sheet play names the card and its effect',
  sheetPrompt.includes('Brass Key') &&
    sheetPrompt.includes('Opens one locked thing.'),
)
check(
  'a character-sheet play insists the card is actually used',
  sheetPrompt.includes('genuinely used this turn'),
)
check(
  'rarity is what sets how decisively a card works',
  sheetPrompt.includes('COMMON nudges'),
)
check(
  'an ITEM is spent by the end of the scene',
  sheetPrompt.includes('The item is spent'),
)
check(
  'a SKILL stays with the protagonist instead',
  buildStorybookUserPrompt(
    request({
      move: { source: 'sheet', text: '', rewardSlug: 'quick-tongue' },
      playedReward: {
        slug: 'quick-tongue',
        name: 'Quick Tongue',
        rewardType: 'SKILL',
        rarity: 'RARE',
        effect: 'Talk past one closed door.',
      },
    }),
  ).includes('The card stays with the protagonist.'),
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll Storybook narration checks passed.')
