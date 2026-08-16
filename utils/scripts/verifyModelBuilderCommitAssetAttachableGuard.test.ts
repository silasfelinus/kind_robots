// /utils/scripts/verifyModelBuilderCommitAssetAttachableGuard.test.ts
//
// Regression test for checkCommitAssetAttachableGuard() in
// verifyModelBuilderCommitAssetAttachableGuard.ts. Exercises the real check
// against synthetic route-shaped fixtures covering: the pre-fix shape (the
// import present, promoteAsset() called with no preceding
// assertArtImageAttachable call -- the exact gap this fix closed), the fixed
// shape (assertArtImageAttachable(...) called immediately before
// promoteAsset(...)), the import missing entirely, and promoteAsset() itself
// missing (route restructured beyond what this narrow checker can follow).
import assert from 'node:assert/strict'

import { checkCommitAssetAttachableGuard } from './verifyModelBuilderCommitAssetAttachableGuard.js'

const IMPORT_LINE = "import { assertArtImageAttachable } from '../../relations'"

function buggyFixture(): string {
  return `
${IMPORT_LINE}

export default defineEventHandler(async (event) => {
  try {
    let target
    try {
      if (plan.action === 'ASSET_ONLY') {
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      }
    } catch (writeError) {
      throw writeError
    }
    return { success: true }
  } catch (error) {
    return errorHandler(error)
  }
})
`
}

function fixedFixture(): string {
  return `
${IMPORT_LINE}

export default defineEventHandler(async (event) => {
  try {
    let target
    try {
      if (plan.action === 'ASSET_ONLY') {
        await assertArtImageAttachable(
          plan.value,
          auth.user.id,
          syncOptions.isAdmin,
        )
        await promoteAsset(sourceType, sourceId, plan.value)
        target = { type: sourceType, id: sourceId, created: false }
      }
    } catch (writeError) {
      throw writeError
    }
    return { success: true }
  } catch (error) {
    return errorHandler(error)
  }
})
`
}

function missingImportFixture(): string {
  return fixedFixture().replace(`${IMPORT_LINE}\n\n`, '')
}

function missingPromoteFixture(): string {
  return `
${IMPORT_LINE}

export default defineEventHandler(async (event) => {
  try {
    return { success: true }
  } catch (error) {
    return errorHandler(error)
  }
})
`
}

const buggyErrors = checkCommitAssetAttachableGuard(buggyFixture())
assert.equal(
  buggyErrors.length,
  1,
  `expected the pre-fix shape (promoteAsset present, no preceding ` +
    `assertArtImageAttachable call) to raise 1 error, got ${buggyErrors.length}: ` +
    JSON.stringify(buggyErrors),
)
assert.ok(buggyErrors[0]!.includes('assertArtImageAttachable'))

const fixedErrors = checkCommitAssetAttachableGuard(fixedFixture())
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const missingImportErrors = checkCommitAssetAttachableGuard(
  missingImportFixture(),
)
assert.equal(
  missingImportErrors.length,
  1,
  `expected the import line being absent to raise 1 error, got ` +
    `${missingImportErrors.length}: ${JSON.stringify(missingImportErrors)}`,
)
assert.ok(missingImportErrors[0]!.includes(IMPORT_LINE))

const missingPromoteErrors = checkCommitAssetAttachableGuard(
  missingPromoteFixture(),
)
assert.equal(
  missingPromoteErrors.length,
  1,
  `expected promoteAsset() being absent to raise 1 error, got ` +
    `${missingPromoteErrors.length}: ${JSON.stringify(missingPromoteErrors)}`,
)
assert.ok(missingPromoteErrors[0]!.includes('promoteAsset'))

console.log(
  'Model Builder commit asset-attachable guard checker verified: flags the ' +
    'pre-fix shape (promoteAsset present, no preceding assertArtImageAttachable ' +
    'call), clears the fully-fixed shape, and flags the import or the ' +
    'promoteAsset call being absent entirely.',
)
