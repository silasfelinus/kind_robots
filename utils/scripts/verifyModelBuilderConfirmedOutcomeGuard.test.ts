// /utils/scripts/verifyModelBuilderConfirmedOutcomeGuard.test.ts
//
// Regression test for checkConfirmedOutcomeGuard()/findPromiseReturningHelpers()
// in verifyModelBuilderConfirmedOutcomeGuard.ts (model-builder/t-042).
// Exercises the real check against synthetic store-shaped fixtures: a
// helper's own Promise<...>-vs-void signature detection, the pre-fix
// batchSetField shape (bare unawaited call, unconditional success toast),
// the fixed shape (awaited + gated), the intentional `void`-marked
// fire-and-forget shape (generateItemAssetAsync/pollAsyncArtJob), and the
// established "fire a void-returning helper, then toast on separately-
// confirmed work" shape (generateItemAsset/pushItem) that must never be
// flagged.
import assert from 'node:assert/strict'

import {
  checkConfirmedOutcomeGuard,
  findPromiseReturningHelpers,
} from './verifyModelBuilderConfirmedOutcomeGuard.js'

function run(): void {
  // --- findPromiseReturningHelpers -----------------------------------------

  const helpers = findPromiseReturningHelpers(`
  function pushItem(item: BuildItem): void {
    performFetch('/x')
  }

  function batchPushItems(entries: unknown[]): Promise<boolean> {
    return performFetch('/x').then(() => true)
  }

  async function draftText(itemId: string): Promise<boolean> {
    return true
  }

  function groupItems(outputKey: string): BuildItem[] {
    return []
  }
`)
  const helperNames = helpers.map((h) => h.name).sort()
  assert.deepEqual(
    helperNames,
    ['batchPushItems', 'draftText'],
    `expected only the Promise-returning helpers, got: ${JSON.stringify(helperNames)}`,
  )
  assert.ok(
    !helperNames.includes('pushItem'),
    'pushItem returns void and must not be treated as a confirmed-outcome helper',
  )
  assert.ok(
    !helperNames.includes('groupItems'),
    'groupItems returns a plain array (no Promise) and must not be flagged',
  )

  // --- checkConfirmedOutcomeGuard -------------------------------------------

  const BUGGY = `
  function batchPushItems(entries: unknown[]): Promise<boolean> {
    return performFetch('/x').then(() => true)
  }

  function batchSetField(outputKey: string, fieldKey: string): void {
    const entries = groupItems(outputKey)
    batchPushItems(entries)
    setStatus(
      'success',
      \`Set \${fieldKey} on \${entries.length} items.\`,
    )
  }
`
  const buggyErrors = checkConfirmedOutcomeGuard(BUGGY)
  assert.equal(
    buggyErrors.length,
    1,
    `expected the bare-unawaited-call fixture to fail once, got: ${JSON.stringify(buggyErrors)}`,
  )
  assert.ok(/batchSetField\(\) line/.test(buggyErrors[0]!))
  assert.ok(/without `await`/.test(buggyErrors[0]!))

  const FIXED = `
  function batchPushItems(entries: unknown[]): Promise<boolean> {
    return performFetch('/x').then(() => true)
  }

  async function batchSetField(outputKey: string, fieldKey: string): Promise<void> {
    const entries = groupItems(outputKey)
    const ok = await batchPushItems(entries)
    if (ok) {
      setStatus(
        'success',
        \`Set \${fieldKey} on \${entries.length} items.\`,
      )
    }
  }
`
  assert.deepEqual(
    checkConfirmedOutcomeGuard(FIXED),
    [],
    'an awaited, result-gated call must not be flagged',
  )

  const VOID_MARKED = `
  async function pollAsyncArtJob(item: BuildItem): Promise<void> {
    setStatusForRun(item.runId, 'success', 'Generated a candidate.')
  }

  async function generateItemAssetAsync(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    void pollAsyncArtJob(item)
    return true
  }
`
  assert.deepEqual(
    checkConfirmedOutcomeGuard(VOID_MARKED),
    [],
    'an explicitly `void`-marked fire-and-forget call must not be flagged, ' +
      "and a helper's OWN internal, already-gated success toast must not " +
      'be confused with its caller firing it unawaited',
  )

  const VOID_RETURNING_HELPER_FIRE_AND_FORGET = `
  function pushItem(item: BuildItem): void {
    performFetch('/x')
  }

  async function generateItemAsset(itemId: string): Promise<boolean> {
    const item = findItem(itemId)
    await artStore.generateCurrentArt({})
    pushItem(item)
    setStatusForRun(
      item.runId,
      'success',
      \`Generated a candidate for \${item.label}.\`,
    )
    return true
  }
`
  assert.deepEqual(
    checkConfirmedOutcomeGuard(VOID_RETURNING_HELPER_FIRE_AND_FORGET),
    [],
    'firing a void-returning (non-Promise) helper before a toast reporting ' +
      'separately-awaited, already-confirmed work is the established ' +
      'correct pattern and must not be flagged',
  )

  const TOAST_BEFORE_BARE_CALL = `
  function batchPushItems(entries: unknown[]): Promise<boolean> {
    return performFetch('/x').then(() => true)
  }

  async function mixedOrder(outputKey: string): Promise<void> {
    setStatus('success', 'Unrelated earlier success.')
    const entries = groupItems(outputKey)
    batchPushItems(entries)
  }
`
  assert.deepEqual(
    checkConfirmedOutcomeGuard(TOAST_BEFORE_BARE_CALL),
    [],
    'a success toast that occurs BEFORE the bare call is not describing ' +
      "that call's outcome and must not be flagged",
  )

  console.log(
    'Model Builder confirmed-outcome-before-toast meta-guard self-test ' +
      'passed: Promise-vs-void helper detection is correct, the bare-' +
      'unawaited-call shape fails, the awaited+gated shape passes, `void`-' +
      'marked fire-and-forget passes, firing a void-returning helper ' +
      'before a toast on separately-confirmed work passes, and toast-' +
      'before-call ordering is not flagged.',
  )
}

run()
