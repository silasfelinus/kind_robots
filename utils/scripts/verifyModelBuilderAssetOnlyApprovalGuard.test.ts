// /utils/scripts/verifyModelBuilderAssetOnlyApprovalGuard.test.ts
//
// Regression test for checkAssetOnlyApprovalGuard() in
// verifyModelBuilderAssetOnlyApprovalGuard.ts (model-builder/t-029).
// Exercises the real check against synthetic component-shaped fixtures
// covering: the pre-fix shape (canApproveAssets keyed off
// generation === 'image', letting every other generation kind fall through
// to `return true` unconditionally -- the exact bug found by manual
// read-through), the fixed shape (keyed off action === 'ASSET_ONLY'), and
// the computed being absent entirely.
import assert from 'node:assert/strict'

import { checkAssetOnlyApprovalGuard } from './verifyModelBuilderAssetOnlyApprovalGuard.js'

const BUGGY_FIXTURE = `
<script setup lang="ts">
const canApproveAssets = computed(() => {
  if (!item.value) return false
  if (isLocked('GENERATE_ASSETS')) return false
  if (item.value.stages.GENERATE_ASSETS.status === 'in-progress') return false
  if (isGenerating.value || isQueued.value) return false
  if (item.value.stages.GENERATE_ASSETS.status === 'stale') return false
  // For image outputs, require a generated candidate first.
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
  if (item.value.stages.GENERATE_ASSETS.status === 'in-progress') return false
  if (isGenerating.value || isQueued.value) return false
  if (item.value.stages.GENERATE_ASSETS.status === 'stale') return false
  if (item.value.action === 'ASSET_ONLY') return Boolean(item.value.artImageId)
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

const buggyErrors = checkAssetOnlyApprovalGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  `expected the pre-fix shape to raise 2 errors (missing action check + ` +
    `stale generation-keyed check present), got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors[0]!.includes("action === 'ASSET_ONLY'"))
assert.ok(buggyErrors[1]!.includes("generation === 'image'"))

const fixedErrors = checkAssetOnlyApprovalGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingErrors = checkAssetOnlyApprovalGuard(MISSING_FIXTURE)
assert.equal(
  missingErrors.length,
  1,
  'expected a single "not found" violation when canApproveAssets is absent ' +
    `entirely, got ${missingErrors.length}: ${JSON.stringify(missingErrors)}`,
)
assert.ok(missingErrors[0]!.includes('Could not find'))

console.log(
  'Model Builder ASSET_ONLY approval guard checker verified: flags the ' +
    "pre-fix shape (canApproveAssets keyed off generation === 'image'), " +
    "clears the fixed shape (keyed off action === 'ASSET_ONLY'), and " +
    'flags the computed being absent entirely.',
)
