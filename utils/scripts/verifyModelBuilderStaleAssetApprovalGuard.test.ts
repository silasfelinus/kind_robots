// /utils/scripts/verifyModelBuilderStaleAssetApprovalGuard.test.ts
//
// Regression test for checkStaleAssetApprovalGuard() in
// verifyModelBuilderStaleAssetApprovalGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic component-shaped fixtures
// covering: the pre-fix shape (canApproveAssets with no 'stale' check --
// the exact bug found by manual read-through), the fixed shape, and the
// computed being absent entirely.
import assert from 'node:assert/strict'

import { checkStaleAssetApprovalGuard } from './verifyModelBuilderStaleAssetApprovalGuard.js'

const BUGGY_FIXTURE = `
<script setup lang="ts">
const canApproveAssets = computed(() => {
  if (!item.value) return false
  if (isLocked('GENERATE_ASSETS')) return false
  if (isGenerating.value || isQueued.value) return false
  if (item.value.generation === 'image') return Boolean(item.value.artImageId)
  return true
})

function isLocked(stage: BuildStageKey): boolean {
  const status = item.value?.stages[stage].status
  return status === 'locked'
}
</script>
`

const FIXED_FIXTURE = `
<script setup lang="ts">
const canApproveAssets = computed(() => {
  if (!item.value) return false
  if (isLocked('GENERATE_ASSETS')) return false
  if (isGenerating.value || isQueued.value) return false
  if (item.value.stages.GENERATE_ASSETS.status === 'stale') return false
  if (item.value.generation === 'image') return Boolean(item.value.artImageId)
  return true
})

function isLocked(stage: BuildStageKey): boolean {
  const status = item.value?.stages[stage].status
  return status === 'locked'
}
</script>
`

const MISSING_FIXTURE = `
<script setup lang="ts">
function isLocked(stage: BuildStageKey): boolean {
  const status = item.value?.stages[stage].status
  return status === 'locked'
}
</script>
`

const buggyErrors = checkStaleAssetApprovalGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape to raise 1 error, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes("status === 'stale'"))

const fixedErrors = checkStaleAssetApprovalGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkStaleAssetApprovalGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  1,
  'expected a single "not found" violation when canApproveAssets is absent ' +
    `entirely, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)
assert.ok(missingErrors[0]!.includes('Could not find'))

console.log(
  'Model Builder stale-asset approval guard checker verified: flags the ' +
    "pre-fix shape (canApproveAssets missing the 'stale' check), clears the " +
    'fixed shape, and flags the computed being absent entirely.',
)
