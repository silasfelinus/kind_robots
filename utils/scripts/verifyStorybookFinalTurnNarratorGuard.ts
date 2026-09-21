// /utils/scripts/verifyStorybookFinalTurnNarratorGuard.ts
//
// Regression guard for server/utils/storybookRuns.ts's default narrator
// (storybook/t-010 cycle 79, auditing storybookRuns.ts for the first time).
//
// buildStorybookSystemPrompt() reads `request.isFinalTurn` directly and tells
// the model, in prose, "This is the last scene ... return an empty choices
// array." But storybookResponseSchema()/validateStorybookNarration() decide
// the choice-count rule (0 on the final turn, 2-4 otherwise) from a SEPARATE
// `options.finalTurn` flag -- and storybookRuns.ts's default narrator used to
// call `generateStorybookTurn(request)` with no second argument, so
// `options.finalTurn` was always false regardless of `request.isFinalTurn`.
//
// Net effect before the fix: on the real final turn of any budgeted run, the
// prompt told the model to return 0 choices while the schema/validator still
// required 2-4. A model that obeyed the closing instruction (the intended,
// common case) failed validation with "A scene must offer 2-4 choices (got
// 0)" instead of completing the story -- and utils/scripts/
// verifyStorybookPlayLoop.ts's own stub narrator reads `request.isFinalTurn`
// directly, bypassing `generateStorybookTurn` entirely, so it could not catch
// this.
//
// No network and no database: mocks global.fetch so completeStructured()
// resolves without a real model call, and exercises
// storybookRuns.ts's exported `defaultStorybookNarrator` directly.

import {
  defaultStorybookNarrator,
  type NarrateFn,
} from '../../server/utils/storybookRuns'
import { generateStorybookTurn } from '../../server/utils/storybookNarration'
import type { StorybookNarrationRequest } from '../../server/utils/storybookNarration'

let failures = 0

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const AXIS_KEY = 'truth'

const baseRequest: StorybookNarrationRequest = {
  mode: 'open-ended',
  deck: {
    key: 'verify-final-turn',
    title: 'Verify Final Turn',
    passValue: 1,
    axes: [{ key: AXIS_KEY, label: 'Truth' }],
  },
  narrator: {
    name: 'Narrator',
    personality: null,
    narrativeVoice: null,
    prompt: null,
  },
  seed: 'verify-final-turn-seed',
  turnIndex: 3,
  turnBudget: 3,
  isFinalTurn: true,
  bible: {
    title: 'Verify Final Turn',
    cast: [],
    facets: [],
    treasures: [],
  },
  statsSoFar: { [AXIS_KEY]: 1 },
  inventory: [],
  recentTurns: [],
  move: null,
  playedReward: null,
}

/** A model response that correctly obeys the closing-scene prose instruction. */
const EMPTY_CHOICES_COMPLETION = {
  narrativeText: Array(80).fill('word').join(' '),
  choices: [],
  moveEffects: { [AXIS_KEY]: null },
  stateDelta: {
    consequences: [],
    relationshipShifts: [],
    inventoryAdd: [],
    inventoryRemove: [],
  },
  artPrompt: null,
  endingHint: null,
}

function mockFetchOnce(content: unknown): typeof fetch {
  return (async () =>
    new Response(
      JSON.stringify({
        choices: [{ message: { content: JSON.stringify(content) } }],
      }),
      { status: 200 },
    )) as unknown as typeof fetch
}

async function run() {
  const originalFetch = globalThis.fetch

  // completeStructured() calls Nitro's auto-imported `useRuntimeConfig()` when
  // no `apiKey` override reaches it, and `defaultStorybookNarrator` (the
  // production wiring under test) does not accept one. Outside a Nitro build,
  // that identifier does not exist, so this plain script provides the same
  // minimal shim a real deployment's runtime config would -- a fake key,
  // never a real one, and completeStructured never actually reaches the
  // network in this file (fetch is mocked below for every case).
  const globalWithRuntimeConfig = globalThis as unknown as {
    useRuntimeConfig?: () => { openaiApiKey?: string; anthropicApiKey?: string }
  }
  const originalUseRuntimeConfig = globalWithRuntimeConfig.useRuntimeConfig
  const originalOpenAiKey = process.env.OPENAI_API_KEY
  globalWithRuntimeConfig.useRuntimeConfig = () => ({})
  process.env.OPENAI_API_KEY = 'test-key'

  // Case 1: the production narrator must accept a correctly-empty final scene.
  globalThis.fetch = mockFetchOnce(EMPTY_CHOICES_COMPLETION)
  try {
    const result = await defaultStorybookNarrator(baseRequest)
    check(
      'defaultStorybookNarrator accepts an empty-choices final scene',
      result.choices.length === 0,
      `got ${result.choices.length} choices`,
    )
  } catch (error) {
    failures += 1
    console.error(
      `  FAIL  defaultStorybookNarrator rejected a correct final scene — ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  // Case 2 (contrast): calling generateStorybookTurn WITHOUT forwarding
  // `finalTurn` -- the pre-fix call shape -- must still reject the same
  // response, proving case 1 actually exercises the wiring rather than
  // something generateStorybookTurn would accept unconditionally.
  globalThis.fetch = mockFetchOnce(EMPTY_CHOICES_COMPLETION)
  try {
    await generateStorybookTurn(baseRequest)
    failures += 1
    console.error(
      '  FAIL  generateStorybookTurn(request) with no options resolved instead of rejecting the empty-choices scene',
    )
  } catch (error) {
    check(
      'generateStorybookTurn(request) with no options still rejects 0 choices (confirms the guard is meaningful)',
      error instanceof Error &&
        error.message.includes('must offer') &&
        error.message.includes('choices'),
      `got: ${error instanceof Error ? error.message : String(error)}`,
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  // Case 3: a non-final turn must still require 2-4 choices from the
  // production narrator -- the fix must not blanket-disable the choice count
  // rule.
  const midRunRequest: StorybookNarrationRequest = {
    ...baseRequest,
    turnIndex: 1,
    isFinalTurn: false,
  }
  globalThis.fetch = mockFetchOnce(EMPTY_CHOICES_COMPLETION)
  try {
    await defaultStorybookNarrator(midRunRequest)
    failures += 1
    console.error(
      '  FAIL  defaultStorybookNarrator accepted 0 choices on a non-final turn',
    )
  } catch (error) {
    check(
      'defaultStorybookNarrator still rejects 0 choices on a non-final turn',
      error instanceof Error &&
        error.message.includes('must offer') &&
        error.message.includes('choices'),
      `got: ${error instanceof Error ? error.message : String(error)}`,
    )
  } finally {
    globalThis.fetch = originalFetch
  }

  const _typeCheck: NarrateFn = defaultStorybookNarrator
  void _typeCheck

  globalWithRuntimeConfig.useRuntimeConfig = originalUseRuntimeConfig
  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey
  }

  if (failures) {
    console.error(`\n${failures} check(s) failed.`)
    process.exit(1)
  }
  console.log('\nAll storybook final-turn narrator checks passed.')
}

run()
