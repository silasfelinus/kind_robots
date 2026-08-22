// /utils/scripts/verifyModelBuilderCommitStaleGateGuard.test.ts
//
// Regression test for checkCommitStaleGateGuard()/checkCommitRouteStageGate()
// in verifyModelBuilderCommitStaleGateGuard.ts (model-builder/t-029, cycle
// 50). Exercises the real checks against synthetic panel/route-shaped
// fixtures covering: the original pre-fix shape (no isCommitBlocked gate at
// all -- a guaranteed round-trip to the server's 400 while stale), the
// tempting-but-wrong soft-lock shape (gating directly on
// `status === 'stale'`, which permanently disables the only recovery path),
// and the actual fixed shape (a BUILD_STAGES-driven isCommitBlocked).
import assert from 'node:assert/strict'

import {
  checkCommitStaleGateGuard,
  checkCommitRouteStageGate,
} from './verifyModelBuilderCommitStaleGateGuard.js'

const PRE_FIX_PANEL = `
        <button
          type="button"
          class="btn btn-xs btn-success rounded-lg"
          :disabled="
            isLocked('COMMIT') ||
            item.stages.COMMIT.status === 'approved' ||
            isCommitting
          "
          title="Execute commit"
          @click="store.commitItem(item.id)"
        >
        </button>
`

const SOFT_LOCK_PANEL = `
        <button
          type="button"
          class="btn btn-xs btn-success rounded-lg"
          :disabled="
            isLocked('COMMIT') ||
            item.stages.COMMIT.status === 'approved' ||
            item.stages.COMMIT.status === 'stale' ||
            isCommitting
          "
          title="Execute commit"
          @click="store.commitItem(item.id)"
        >
        </button>

        const isCommitBlocked = computed(() => item.value?.stages.COMMIT.status === 'stale')
`

const FIXED_PANEL = `
        <button
          type="button"
          class="btn btn-xs btn-success rounded-lg"
          :disabled="
            isLocked('COMMIT') ||
            item.stages.COMMIT.status === 'approved' ||
            isCommitting ||
            isCommitBlocked
          "
          :title="commitButtonTitle"
          @click="store.commitItem(item.id)"
        >
        </button>

const commitBlockedStage = computed(() => {
  if (!item.value) return undefined
  const stages = item.value.stages
  return BUILD_STAGES.find(
    (stage) => stage.key !== 'COMMIT' && stages[stage.key].status !== 'approved',
  )
})
const isCommitBlocked = computed(() => Boolean(commitBlockedStage.value))
`

const MISSING_BUTTON = `
  <div>no commit button here</div>
`

const preFixErrors = checkCommitStaleGateGuard(PRE_FIX_PANEL)
assert.equal(
  preFixErrors.length,
  2,
  `expected the pre-fix shape (missing isCommitBlocked in the button AND no ` +
    `commitBlockedStage computed at all) to raise 2 errors, got ` +
    `${preFixErrors.length}: ${JSON.stringify(preFixErrors)}`,
)
assert.ok(
  preFixErrors.some((e) => e.includes('isCommitBlocked')),
  'expected a violation naming isCommitBlocked as missing from the button',
)
assert.ok(
  preFixErrors.some((e) => e.includes('commitBlockedStage')),
  'expected a violation for the missing commitBlockedStage computed',
)

const softLockErrors = checkCommitStaleGateGuard(SOFT_LOCK_PANEL)
assert.equal(
  softLockErrors.length,
  1,
  `expected the soft-lock shape (naive status === 'stale' check) to raise 1 ` +
    `error, got ${softLockErrors.length}: ${JSON.stringify(softLockErrors)}`,
)
assert.ok(
  softLockErrors[0]!.includes('soft-lock'),
  'expected a violation calling out the soft-lock risk',
)

const fixedErrors = checkCommitStaleGateGuard(FIXED_PANEL)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkCommitStaleGateGuard(MISSING_BUTTON)
assert.equal(
  missingErrors.length,
  1,
  'expected a single "button not found" violation when the commit button is absent',
)
assert.ok(missingErrors[0]!.includes('Execute-commit'))

const FIXED_ROUTE = `
      const unapprovedStage = BUILD_STAGES.find(
        (stage) =>
          stage.key !== 'COMMIT' &&
          currentStages[stage.key]?.status !== 'approved',
      )
      if (unapprovedStage) {
        throw createError({ statusCode: 400, message: 'nope' })
      }
`
const BROKEN_ROUTE = `
      // no stage gate at all anymore
      const target = { type: 'Dream', id: 1 }
`

const routeFixedErrors = checkCommitRouteStageGate(FIXED_ROUTE)
assert.equal(
  routeFixedErrors.length,
  0,
  `expected the real route shape to raise no errors, got: ${JSON.stringify(routeFixedErrors)}`,
)

const routeBrokenErrors = checkCommitRouteStageGate(BROKEN_ROUTE)
assert.equal(
  routeBrokenErrors.length,
  1,
  'expected a violation when the route no longer gates on unapproved stages',
)

console.log(
  'Model Builder commit stale-gate guard checker verified: flags the ' +
    'pre-fix shape (no isCommitBlocked gate), flags the tempting soft-lock ' +
    "shape (naive status === 'stale' check), clears the real fixed shape, " +
    'flags the commit button being absent, and cross-checks the server ' +
    'route half of the same contract.',
)
