// /utils/scripts/verifyModelBuilderSingleItemRevertGuard.test.ts
//
// Regression test for checkSingleItemRevertGuard() in
// verifyModelBuilderSingleItemRevertGuard.ts (model-builder/t-029 cycle 10).
// Exercises the real check against synthetic store-shaped fixtures covering:
// the pre-fix shape (pushItem has no onFailure param/calls, none of the six
// single-item mutators snapshot or revert), the fixed shape (all six do), and
// a partially-regressed shape (only one mutator lost its revert).
import assert from 'node:assert/strict'

import { checkSingleItemRevertGuard } from './verifyModelBuilderSingleItemRevertGuard.js'

function pushItemFixture(hasOnFailure: boolean): string {
  return hasOnFailure
    ? `
  function pushItem(
    item: BuildItem,
    payload: Record<string, unknown>,
    meta?: { stage?: string; reason?: string },
    onFailure?: () => void,
  ): void {
    performFetch('/api/model-builder/items/' + item.id, {})
      .then((response) => {
        if (!response.success) {
          onFailure?.()
          if (runId) setStatusForRun(runId, 'error', response.message)
        }
      })
      .catch((error) => {
        onFailure?.()
        if (runId) setStatusForRun(runId, 'error', 'failed')
      })
  }
`
    : `
  function pushItem(
    item: BuildItem,
    payload: Record<string, unknown>,
    meta?: { stage?: string; reason?: string },
  ): void {
    performFetch('/api/model-builder/items/' + item.id, {})
      .then((response) => {
        if (!response.success && runId) {
          setStatusForRun(runId, 'error', response.message)
        }
      })
      .catch((error) => {
        if (runId) setStatusForRun(runId, 'error', 'failed')
      })
  }
`
}

function stageCallerFixture(opts: { name: string; reverts: boolean }): string {
  const body = opts.reverts
    ? `
    const previousStages = { ...item.stages }
    item.stages[stageKey] = { status: 'approved' }
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey }, () => {
      item.stages = previousStages
    })`
    : `
    item.stages[stageKey] = { status: 'approved' }
    pushItem(item, { stageStatuses: item.stages }, { stage: stageKey })`
  return `
  function ${opts.name}(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    ${body}
  }
`
}

function textCallerFixture(opts: {
  name: string
  field: string
  reverts: boolean
}): string {
  const body = opts.reverts
    ? `
    const previous${cap(opts.field)} = item.${opts.field}
    item.${opts.field} = value
    pushItem(item, { ${opts.field}: item.${opts.field} }, { stage: 'PITCH' }, () => {
      item.${opts.field} = previous${cap(opts.field)}
    })`
    : `
    item.${opts.field} = value
    pushItem(item, { ${opts.field}: item.${opts.field} }, { stage: 'PITCH' })`
  return `
  function ${opts.name}(itemId: string, value: string): void {
    const item = findItem(itemId)
    if (!item) return
    ${body}
  }
`
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function allCallers(reverts: boolean): string {
  return [
    stageCallerFixture({ name: 'approveStage', reverts }),
    stageCallerFixture({ name: 'rejectStage', reverts }),
    stageCallerFixture({ name: 'reopenStage', reverts }),
    textCallerFixture({ name: 'updatePitch', field: 'pitch', reverts }),
    textCallerFixture({
      name: 'updateFields',
      field: 'fieldsDraft',
      reverts,
    }),
    textCallerFixture({
      name: 'updatePrompt',
      field: 'promptDraft',
      reverts,
    }),
  ].join('\n')
}

const BUGGY = [pushItemFixture(false), allCallers(false)].join('\n')
const FIXED = [pushItemFixture(true), allCallers(true)].join('\n')

// Regressed: pushItem still supports onFailure and five of the six mutators
// still revert, but updatePitch was edited back to the old no-snapshot,
// no-revert shape (e.g. a bad merge that only carried the fix forward
// partially).
const PARTIALLY_REGRESSED = [
  pushItemFixture(true),
  stageCallerFixture({ name: 'approveStage', reverts: true }),
  stageCallerFixture({ name: 'rejectStage', reverts: true }),
  stageCallerFixture({ name: 'reopenStage', reverts: true }),
  textCallerFixture({ name: 'updatePitch', field: 'pitch', reverts: false }),
  textCallerFixture({
    name: 'updateFields',
    field: 'fieldsDraft',
    reverts: true,
  }),
  textCallerFixture({
    name: 'updatePrompt',
    field: 'promptDraft',
    reverts: true,
  }),
].join('\n')

function run(): void {
  const buggyErrors = checkSingleItemRevertGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    14,
    'expected the pre-fix fixture (no onFailure anywhere, no mutator ' +
      `reverts) to fail 14 times (2 for pushItem + 2 for each of 6 ` +
      `callers), got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(buggyErrors.some((e) => /no longer declares an `onFailure/.test(e)))
  assert.ok(buggyErrors.some((e) => /no longer invokes onFailure\(\)/.test(e)))
  assert.ok(
    buggyErrors.filter((e) => /no longer snapshots/.test(e)).length === 6,
  )
  assert.ok(
    buggyErrors.filter((e) => /no longer passes a revert closure/.test(e))
      .length === 6,
  )

  const fixedErrors = checkSingleItemRevertGuard(FIXED)
  assert.deepEqual(
    fixedErrors,
    [],
    `expected the fixed fixture to pass, got: ${JSON.stringify(fixedErrors)}`,
  )

  const regressedErrors = checkSingleItemRevertGuard(PARTIALLY_REGRESSED)
  assert.equal(
    regressedErrors.length,
    2,
    'expected a fixture where only updatePitch regressed to fail exactly ' +
      `twice (snapshot + revert-check), got: ${JSON.stringify(regressedErrors)}`,
  )
  assert.ok(regressedErrors.every((e) => e.startsWith('updatePitch()')))

  const missingFnErrors = checkSingleItemRevertGuard(
    'function someOtherFunction(): void {}',
  )
  assert.equal(missingFnErrors.length, 7)
  assert.ok(
    missingFnErrors.every((e) => /Could not find a function named/.test(e)),
  )

  console.log(
    'Model Builder single-item revert-on-failure guard self-test passed: ' +
      'buggy fixture fails, fixed fixture passes, a partially-regressed ' +
      'fixture fails only for the still-broken mutator, missing-function ' +
      'fixture fails clearly.',
  )
}

run()
