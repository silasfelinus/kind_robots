// /utils/scripts/verifyModelBuilderCompletionGate.test.ts
//
// Regression test for findUngatedCompletionWrites() in
// verifyModelBuilderCompletionGate.ts (model-builder/t-036). Exercises the
// real extraction/scan logic -- not a reimplementation -- against a
// synthetic store-shaped fixture covering: a gated write via a named helper
// call, a gated inline guard, an unguarded post-await write (the exact bug
// class t-029/PR #1114 fixed ad hoc), a pre-await write (never a race, must
// not be flagged), and a synchronous function with no `await` at all (must
// not be flagged even though it writes item.stages unconditionally, matching
// approveStage/rejectStage/reopenStage's real shape).
import assert from 'node:assert/strict'

import {
  extractFunctionBodies,
  findGuardIntervals,
  findUngatedCompletionWrites,
} from './verifyModelBuilderCompletionGate.js'

const FIXTURE = `
  function finishGenerateAssets(item: BuildItem, next: StageState): void {
    if (item.stages.GENERATE_ASSETS.status === 'in-progress') {
      item.stages.GENERATE_ASSETS = next
    }
  }

  function approveStage(itemId: string, stageKey: BuildStageKey): void {
    const item = findItem(itemId)
    if (!item) return
    item.stages[stageKey] = { status: 'approved' }
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false

    if (item.generation !== 'image') {
      item.stages.GENERATE_ASSETS = { status: 'ready' }
      return false
    }

    item.stages.GENERATE_ASSETS = { status: 'in-progress' }

    try {
      const result = await artStore.generateCurrentArt({ promptString: 'x' })
      item.artImageId = result.data.id
      finishGenerateAssets(item, { status: 'ready' })
      return true
    } catch (error) {
      finishGenerateAssets(item, { status: 'ready' })
      return false
    }
  }

  async function commitItemInlineGuard(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false
    item.stages.COMMIT = { status: 'in-progress' }
    const response = await performFetch('/x', {})
    if (item.stages.COMMIT.status === 'in-progress') {
      item.stages.COMMIT = { status: 'approved' }
    }
    return true
  }

  async function commitItemBuggy(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false
    const response = await performFetch('/x', {})
    item.stages.COMMIT = { status: 'approved' }
    return true
  }
`

const functions = extractFunctionBodies(FIXTURE)
assert.equal(
  functions.map((f) => f.name).join(','),
  'finishGenerateAssets,approveStage,generateItemAsset,commitItemInlineGuard,commitItemBuggy',
  `expected all 5 fixture functions to be extracted in order, got: ${functions
    .map((f) => f.name)
    .join(',')}`,
)
assert.equal(functions[2]!.isAsync, true)
assert.equal(functions[1]!.isAsync, false)

const generateAssetsGuards = findGuardIntervals(functions[0]!.body)
assert.equal(
  generateAssetsGuards.length,
  1,
  "expected finishGenerateAssets' own body to contain exactly one guard interval",
)
assert.equal(generateAssetsGuards[0]!.key, 'GENERATE_ASSETS')

const violations = findUngatedCompletionWrites(FIXTURE)

assert.equal(
  violations.length,
  1,
  `expected exactly 1 ungated post-await write, got ${violations.length}: ${JSON.stringify(violations)}`,
)
assert.equal(violations[0]!.functionName, 'commitItemBuggy')
assert.equal(violations[0]!.key, 'COMMIT')

// approveStage writes item.stages unconditionally with no await anywhere in
// its body -- never a completion-write race, must never be flagged.
assert.ok(
  !violations.some((v) => v.functionName === 'approveStage'),
  'a synchronous function with no await must never be flagged',
)

// generateItemAsset's early-return write (before its own first await) and
// its two finishGenerateAssets(...) calls (after the await, but gated via
// the named-helper idiom) must never be flagged.
assert.ok(
  !violations.some((v) => v.functionName === 'generateItemAsset'),
  'a pre-await write and gated post-await writes via a named helper must never be flagged',
)

// commitItemInlineGuard's post-await write is gated by its own inline
// `if (item.stages.COMMIT.status === 'in-progress')` guard -- must clear.
assert.ok(
  !violations.some((v) => v.functionName === 'commitItemInlineGuard'),
  'a post-await write wrapped in an equivalent inline guard must never be flagged',
)

console.log(
  'Model Builder completion-gate checker verified: flags an unguarded ' +
    'post-await stage-status write, clears the named-helper and inline-' +
    'guard shapes, and never flags a pre-await write or a synchronous ' +
    'function with no await.',
)
