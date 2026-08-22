// /utils/scripts/verifyModelBuilderCommitStaleGateGuard.ts
//
// Regression guard (model-builder/t-029, cycle 50) -- the Execute-commit
// button in model-builder-item-panel.vue previously disabled only on
// isLocked('COMMIT') || COMMIT.status === 'approved' || isCommitting. It
// stayed clickable while COMMIT.status === 'stale' (an upstream edit
// reopened an earlier stage after this item had already been ready/approved
// to commit -- see modelBuilderStore.ts's markDownstreamStale).
// server/api/model-builder/items/[id]/commit.post.ts independently requires
// every OTHER stage to be status === 'approved' before committing (dryRun
// aside), so a stale-commit click was a guaranteed round-trip to that 400 --
// and the caught error reset COMMIT to 'ready' via finishCommit, silently
// discarding the accurate "an upstream stage still needs to be redone"
// signal the 'stale' badge was showing.
//
// The correct fix must NOT simply add `COMMIT.status === 'stale'` to the
// disabled list. 'stale' is COMMIT's only recovery path in this store:
// approveStage's "unlock the next stage" branch only flips a *locked* next
// stage to 'ready' -- it never un-stales one, so once COMMIT goes 'stale'
// there is no other code path that ever moves it back to 'ready'/'approved'
// short of a commitItem() call itself succeeding. Disabling on
// `status === 'stale'` verbatim would permanently soft-lock the item:
// re-approving the upstream stage that caused the staleness would leave
// COMMIT stuck at 'stale' forever with no enabled button left to clear it.
//
// The fix instead mirrors the server's own gate -- every OTHER build stage
// must be 'approved' -- via a BUILD_STAGES-driven `isCommitBlocked` computed.
// This closes the guaranteed-400 round-trip without the soft-lock: the
// button re-enables the instant the real prerequisite is satisfied,
// regardless of whether COMMIT's own badge still reads 'stale' or 'ready'.
//
// This checker protects three things:
// 1. The Execute-commit button's :disabled includes isCommitBlocked.
// 2. isCommitBlocked is derived from BUILD_STAGES (every stage but COMMIT
//    must be 'approved'), not a naive `COMMIT.status === 'stale'` check that
//    would soft-lock the item.
// 3. The server route still enforces the identical rule, so the UI gate and
//    the authoritative check can never drift apart silently.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)
const COMMIT_ROUTE_PATH = join(
  repositoryRoot,
  'server/api/model-builder/items/[id]/commit.post.ts',
)

const CLICK_ANCHOR = '@click="store.commitItem(item.id)"'
const SOFT_LOCK_SHAPE = "item.stages.COMMIT.status === 'stale'"

// Checks the item panel's template + script halves. Exported for the self-test.
export function checkCommitStaleGateGuard(content: string): string[] {
  const errors: string[] = []

  const clickIndex = content.indexOf(CLICK_ANCHOR)
  if (clickIndex === -1) {
    errors.push(
      `Could not find \`${CLICK_ANCHOR}\` in model-builder-item-panel.vue -- ` +
        'has the Execute-commit button been renamed or restructured? Re-check ' +
        'the stale-commit gate.',
    )
    return errors
  }

  // The button's opening <button ...> tag sits just before its @click, so the
  // :disabled attribute is a short window back from this anchor, not the
  // whole file -- keeps a coincidental isCommitBlocked mention elsewhere from
  // passing this check.
  const buttonStart = content.lastIndexOf('<button', clickIndex)
  if (buttonStart === -1) {
    errors.push(
      'Could not find the opening <button> tag before the Execute-commit ' +
        '@click -- this guard anchor has moved.',
    )
    return errors
  }
  const disabledBlock = content.slice(buttonStart, clickIndex)

  if (disabledBlock.includes(SOFT_LOCK_SHAPE)) {
    errors.push(
      `Execute-commit's :disabled checks \`${SOFT_LOCK_SHAPE}\` directly. ` +
        "'stale' is COMMIT's only recovery path -- approveStage never " +
        "un-stales a next stage, only unlocks a 'locked' one -- so gating on " +
        'this literally soft-locks the item: once COMMIT goes stale, no ' +
        'button can ever re-enable it, even after the real upstream stage is ' +
        're-approved. Use the BUILD_STAGES-driven isCommitBlocked computed ' +
        'instead.',
    )
    return errors
  }

  if (!disabledBlock.includes('isCommitBlocked')) {
    errors.push(
      "Execute-commit's :disabled no longer includes isCommitBlocked -- " +
        'without it, clicking while an upstream stage is unapproved (COMMIT ' +
        "showing 'stale' after markDownstreamStale, or reached some other " +
        "way) is a guaranteed round-trip to the server's 400 in " +
        'commit.post.ts.',
    )
  }

  const computedStart = content.indexOf('const commitBlockedStage = computed(')
  if (computedStart === -1) {
    errors.push(
      'Could not find the commitBlockedStage computed in ' +
        'model-builder-item-panel.vue -- this guard anchor has moved.',
    )
    return errors
  }
  const computedEnd = content.indexOf('\n})', computedStart)
  const computedBody =
    computedEnd === -1
      ? content.slice(computedStart)
      : content.slice(computedStart, computedEnd)

  if (
    !computedBody.includes('BUILD_STAGES.find(') ||
    !computedBody.includes("stage.key !== 'COMMIT'") ||
    !computedBody.includes("!== 'approved'")
  ) {
    errors.push(
      'commitBlockedStage no longer derives from BUILD_STAGES checking every ' +
        "stage but COMMIT for status !== 'approved' -- this must mirror " +
        "commit.post.ts's own unapprovedStage check exactly, or the UI gate " +
        'and the server rule can silently drift apart (either soft-locking ' +
        'the button when the server would actually accept the commit, or ' +
        're-opening the guaranteed-400 round-trip this guard exists to close).',
    )
  }

  return errors
}

// The server route is the authoritative half of the contract this UI gate
// mirrors -- if its own unapproved-stage check moves or is removed, the UI
// gate silently stops matching the real rule.
export function checkCommitRouteStageGate(content: string): string[] {
  const errors: string[] = []
  if (
    !content.includes("stage.key !== 'COMMIT'") ||
    !content.includes("?.status !== 'approved'")
  ) {
    errors.push(
      'commit.post.ts no longer rejects a commit when a non-COMMIT stage is ' +
        "not 'approved' -- this is the server-side rule " +
        "model-builder-item-panel.vue's isCommitBlocked computed mirrors; if " +
        'it moved or changed shape, the UI gate needs to follow it.',
    )
  }
  return errors
}

function main(): void {
  const panelContent = readFileSync(PANEL_PATH, 'utf8')
  const routeContent = readFileSync(COMMIT_ROUTE_PATH, 'utf8')
  const errors = [
    ...checkCommitStaleGateGuard(panelContent),
    ...checkCommitRouteStageGate(routeContent),
  ]

  if (errors.length) {
    console.error('Model Builder commit stale-gate guard contract failed:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder commit stale-gate guard contract passed: Execute-commit ' +
      'stays disabled whenever any non-COMMIT stage is unapproved (mirroring ' +
      "commit.post.ts's own rule), without soft-locking on COMMIT's own " +
      "'stale' status.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
