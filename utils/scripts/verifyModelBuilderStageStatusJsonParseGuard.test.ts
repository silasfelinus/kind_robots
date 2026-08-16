// /utils/scripts/verifyModelBuilderStageStatusJsonParseGuard.test.ts
//
// Regression test for checkStageStatusJsonParseGuard() in
// verifyModelBuilderStageStatusJsonParseGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic modelBuilderStore.ts-shaped
// fixtures covering: the pre-fix shape (both call sites gate on
// `typeof === 'object'` against the still-serialized raw value -- the exact
// bug found by manual read-through), the fixed shape (both routed through
// parseJsonValue() first), partial fixtures (only one of the two call sites
// fixed), and a missing-helper fixture.
//
// Also exercises the real parseJsonValue()-shaped logic behaviorally against
// the JSON-string-not-object data shape the server actually returns, so the
// bug this guard protects against is demonstrated directly, not just its
// textual signature.
import assert from 'node:assert/strict'

import {
  checkStageStatusJsonParseGuard,
  extractFunctionBody,
} from './verifyModelBuilderStageStatusJsonParseGuard.js'

const BUGGY_FIXTURE = `
function parseJsonValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeStages(raw: unknown): Record<BuildStageKey, StageState> {
  const stages = freshStages()
  if (raw && typeof raw === 'object') {
    const source = raw as Record<string, StageState>
    for (const stage of BUILD_STAGES) {
      const value = source[stage.key]
      if (value && typeof value.status === 'string') {
        stages[stage.key] = { status: value.status, note: value.note }
      }
    }
  }
  return stages
}

function adaptRun(server: ServerRun): BuildRun {
  return {
    id: String(server.id),
    sourceSnapshot:
      server.sourceSnapshot && typeof server.sourceSnapshot === 'object'
        ? (server.sourceSnapshot as Record<string, unknown>)
        : null,
    recipeKey: server.recipeKey as RecipeKey,
    items: [],
  }
}
`

const FIXED_FIXTURE = `
function parseJsonValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeStages(raw: unknown): Record<BuildStageKey, StageState> {
  const stages = freshStages()
  const parsed = parseJsonValue(raw)
  if (parsed && typeof parsed === 'object') {
    const source = parsed as Record<string, StageState>
    for (const stage of BUILD_STAGES) {
      const value = source[stage.key]
      if (value && typeof value.status === 'string') {
        stages[stage.key] = { status: value.status, note: value.note }
      }
    }
  }
  return stages
}

function adaptRun(server: ServerRun): BuildRun {
  return {
    id: String(server.id),
    sourceSnapshot: (() => {
      const parsed = parseJsonValue(server.sourceSnapshot)
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : null
    })(),
    recipeKey: server.recipeKey as RecipeKey,
    items: [],
  }
}
`

const NORMALIZE_STAGES_ONLY_FIXTURE = `
function parseJsonValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function normalizeStages(raw: unknown): Record<BuildStageKey, StageState> {
  const stages = freshStages()
  const parsed = parseJsonValue(raw)
  if (parsed && typeof parsed === 'object') {
    const source = parsed as Record<string, StageState>
    for (const stage of BUILD_STAGES) {
      const value = source[stage.key]
      if (value && typeof value.status === 'string') {
        stages[stage.key] = { status: value.status, note: value.note }
      }
    }
  }
  return stages
}

function adaptRun(server: ServerRun): BuildRun {
  return {
    id: String(server.id),
    sourceSnapshot:
      server.sourceSnapshot && typeof server.sourceSnapshot === 'object'
        ? (server.sourceSnapshot as Record<string, unknown>)
        : null,
    recipeKey: server.recipeKey as RecipeKey,
    items: [],
  }
}
`

const MISSING_HELPER_FIXTURE = `
function normalizeStages(raw: unknown): Record<BuildStageKey, StageState> {
  const stages = freshStages()
  if (raw && typeof raw === 'object') {
    return stages
  }
  return stages
}
`

function run(): void {
  const buggyErrors = checkStageStatusJsonParseGuard(BUGGY_FIXTURE)
  assert.equal(
    buggyErrors.length,
    2,
    'expected the buggy fixture (both call sites un-fixed) to fail twice, ' +
      `got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.match(buggyErrors[0]!, /normalizeStages/)
  assert.match(buggyErrors[1]!, /adaptRun/)

  const fixedErrors = checkStageStatusJsonParseGuard(FIXED_FIXTURE)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const partialErrors = checkStageStatusJsonParseGuard(
    NORMALIZE_STAGES_ONLY_FIXTURE,
  )
  assert.equal(
    partialErrors.length,
    1,
    'expected the partial fixture (normalizeStages fixed, adaptRun still ' +
      `buggy) to fail exactly once, got: ${JSON.stringify(partialErrors)}`,
  )
  assert.match(partialErrors[0]!, /adaptRun/)

  const missingHelperErrors = checkStageStatusJsonParseGuard(
    MISSING_HELPER_FIXTURE,
  )
  assert.equal(
    missingHelperErrors.length,
    1,
    'expected a fixture with no parseJsonValue() helper to fail with a ' +
      `"could not find" error, got: ${JSON.stringify(missingHelperErrors)}`,
  )
  assert.match(missingHelperErrors[0]!, /Could not find/)

  // Behavioral demonstration of the actual bug: the server always returns
  // these fields as JSON strings (ModelBuildItem.stageStatuses /
  // ModelBuildRun.sourceSnapshot are `String @db.LongText`, not native Json
  // columns), never as already-parsed objects. The pre-fix
  // `typeof raw === 'object'` check is false for a string, so it always fell
  // through to the default/null branch; the fix must actually parse first.
  const serialized = JSON.stringify({
    PITCH: { status: 'approved' },
    FIELDS_AND_PROMPTS: { status: 'ready' },
  })
  assert.equal(
    typeof serialized,
    'string',
    'sanity: JSON.stringify always produces a string',
  )
  const buggyCheck = Boolean(serialized && typeof serialized === 'object')
  assert.equal(
    buggyCheck,
    false,
    'sanity: the pre-fix `typeof === object` check is false for the ' +
      "server's actual (string) shape -- this is the root cause the fix " +
      'above addresses',
  )
  let parsed: unknown
  try {
    parsed = JSON.parse(serialized)
  } catch {
    parsed = null
  }
  const fixedCheck = Boolean(parsed && typeof parsed === 'object')
  assert.equal(
    fixedCheck,
    true,
    'sanity: parsing the string first before the object check recovers the ' +
      'real data',
  )

  // extractFunctionBody itself: confirm it finds a nested-brace function body
  // correctly (both normalizeStages and adaptRun contain nested `{ }` blocks
  // that a naive "first closing brace" scan would truncate early on).
  const body = extractFunctionBody(FIXED_FIXTURE, 'function normalizeStages(')
  assert.ok(body, 'expected extractFunctionBody to find normalizeStages')
  assert.match(body!, /return stages/)
  assert.equal(
    extractFunctionBody(FIXED_FIXTURE, 'function doesNotExist('),
    null,
    'expected extractFunctionBody to return null for a missing anchor',
  )

  console.log(
    'Model Builder stage-status JSON-parse guard self-test passed: buggy ' +
      'fixture fails twice, fixed fixture passes, partial fixtures fail ' +
      'once each, missing-helper fixture fails clearly, and the underlying ' +
      "JSON-string-vs-object behavior matches the server's actual shape.",
  )
}

run()
