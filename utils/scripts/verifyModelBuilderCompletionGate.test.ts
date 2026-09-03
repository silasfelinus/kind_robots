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
//
// Also covers the comment/string-brace parser blind spot (model-builder/t-029
// cycle 88, kaizen from OpenAI cycle 87's guard-integrity audit): before
// computeCodeMask existed, a `}` inside a `//` comment silently truncated a
// function's extracted body (a real violation inside the truncated-away tail
// would go undetected -- a false negative), and a `{` inside a string
// literal made the brace scan overrun looking for a closing brace that was
// never coming, throwing on a file whose shape hadn't actually changed.
import assert from 'node:assert/strict'

import {
  computeCodeMask,
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

// --- comment/string-brace parser blind spot ---------------------------

// A `}` inside a `//` line comment, before the function's real closing
// brace, must not be counted as the end of the body -- the real write two
// lines later must still be captured.
const COMMENT_BRACE_FIXTURE = `
  async function commentBraceTruncation(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false
    // note: unrelated aside mentioning a curly brace }
    const response = await performFetch('/x', {})
    item.stages.COMMIT = { status: 'approved' }
    return true
  }

  function afterCommentBrace(): void {
    doSomething()
  }
`

const commentBraceFunctions = extractFunctionBodies(COMMENT_BRACE_FIXTURE)
assert.equal(
  commentBraceFunctions.map((f) => f.name).join(','),
  'commentBraceTruncation,afterCommentBrace',
  `a '}' inside a comment must not truncate extraction, got: ${commentBraceFunctions
    .map((f) => f.name)
    .join(',')}`,
)
assert.ok(
  commentBraceFunctions[0]!.body.includes('item.stages.COMMIT'),
  "commentBraceTruncation's body must include its real write, not stop at the comment's stray '}'",
)

const commentBraceViolations = findUngatedCompletionWrites(
  COMMENT_BRACE_FIXTURE,
)
assert.equal(
  commentBraceViolations.length,
  1,
  `expected the real ungated write past the comment to still be flagged, got ${commentBraceViolations.length}: ${JSON.stringify(commentBraceViolations)}`,
)
assert.equal(commentBraceViolations[0]!.functionName, 'commentBraceTruncation')

// A `{` inside a string literal must not be counted as opening a real
// block -- it must not make the scan overrun into (or swallow) the next
// function looking for a closing brace that was never coming.
const STRING_BRACE_FIXTURE = `
  async function stringBraceOverextension(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    if (!item) return false
    const note = 'unexpected token: {'
    const response = await performFetch('/x', {})
    item.stages.COMMIT = { status: 'approved' }
    return true
  }

  function afterStringBrace(): void {
    doSomething()
  }
`

const stringBraceFunctions = extractFunctionBodies(STRING_BRACE_FIXTURE)
assert.equal(
  stringBraceFunctions.map((f) => f.name).join(','),
  'stringBraceOverextension,afterStringBrace',
  `a '{' inside a string literal must not extend a function's body into ` +
    `the next function, got: ${stringBraceFunctions.map((f) => f.name).join(',')}`,
)
assert.ok(
  !stringBraceFunctions[0]!.body.includes('afterStringBrace'),
  "stringBraceOverextension's body must not swallow the next function's source",
)

// A guard condition inside a function whose body also contains a
// comment/string brace must still resolve correctly (findGuardIntervals
// shares the same masking).
const guardWithStringBrace = findGuardIntervals(
  `if (item.stages.COMMIT.status === 'in-progress') { const n = 'note: {'; item.stages.COMMIT = { status: 'approved' } }`,
)
assert.equal(
  guardWithStringBrace.length,
  1,
  'a guard interval containing a string-literal brace must still resolve to exactly one interval',
)
assert.equal(guardWithStringBrace[0]!.key, 'COMMIT')

// computeCodeMask itself: spot-check that comment/string content is masked
// out and real code is not.
const maskSample = "a{'{'}b" // code, quote, code, quote, code -- only the outer a/{/}/b are real code
const mask = computeCodeMask(maskSample)
assert.equal(mask[0], true, "'a' is real code")
assert.equal(mask[1], true, "the first '{' is real code")
assert.equal(mask[2], false, 'the opening quote starts a string and is masked')
assert.equal(mask[3], false, "the '{' inside the string is masked")
assert.equal(mask[4], false, 'the closing quote is masked')
assert.equal(mask[5], true, "the second '}' is real code")
assert.equal(mask[6], true, "'b' is real code")

console.log(
  'Model Builder completion-gate checker verified: a comment/string ' +
    "literal's brace no longer truncates or overruns function extraction, " +
    'and a real violation past such a comment is still flagged.',
)
