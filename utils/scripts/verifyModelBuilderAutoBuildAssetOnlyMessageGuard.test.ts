// /utils/scripts/verifyModelBuilderAutoBuildAssetOnlyMessageGuard.test.ts
//
// Regression test for checkAutoBuildAssetOnlyMessageGuard() in
// verifyModelBuilderAutoBuildAssetOnlyMessageGuard.ts (model-builder/t-029,
// cycle 20). Exercises the real check against synthetic store-shaped
// fixtures covering: the pre-fix shape (one "enable art" message for both
// causes), the fixed shape, a shape that branches on generation but still
// reuses "enable art" text in the non-image branch, and a shape missing the
// function entirely.
import assert from 'node:assert/strict'

import { checkAutoBuildAssetOnlyMessageGuard } from './verifyModelBuilderAutoBuildAssetOnlyMessageGuard.js'

const BUGGY_FIXTURE = `
export const useModelBuilderStore = defineStore('modelBuilderStore', () => {
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    // An ASSET_ONLY item is nothing but its art — can't auto-build without it.
    if (isAsset && !wantArt) {
      setStatus(
        'error',
        \`\${item.label} is asset-only — enable art to auto-build it.\`,
      )
      return 'failed'
    }

    return 'committed'
  }

  return { autoBuildItem }
})
`

const FIXED_FIXTURE = `
export const useModelBuilderStore = defineStore('modelBuilderStore', () => {
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    if (isAsset && !wantArt) {
      const message =
        item.generation === 'image'
          ? \`\${item.label} is asset-only — enable art to auto-build it.\`
          : \`\${item.label}: \${item.generation} generation is not yet wired \` +
            \`into this front-end slice, so it can't be auto-built or \` +
            \`committed yet.\`
      setStatus('error', message)
      return 'failed'
    }

    return 'committed'
  }

  return { autoBuildItem }
})
`

const STILL_MENTIONS_ENABLE_ART_FIXTURE = `
export const useModelBuilderStore = defineStore('modelBuilderStore', () => {
  async function autoBuildItem(itemId: string): Promise<AutoBuildOutcome> {
    const item = findItem(itemId)
    if (!item || !state.run) return 'failed'

    const isAsset = item.action === 'ASSET_ONLY'
    const wantArt = state.includeArt && item.generation === 'image'

    if (isAsset && !wantArt) {
      const message =
        item.generation === 'image'
          ? \`\${item.label} is asset-only — enable art to auto-build it.\`
          : \`\${item.label} generation is not yet wired into this front-end \` +
            \`slice — enable art to auto-build it.\`
      setStatus('error', message)
      return 'failed'
    }

    return 'committed'
  }

  return { autoBuildItem }
})
`

const MISSING_FUNCTION_FIXTURE = `
export const useModelBuilderStore = defineStore('modelBuilderStore', () => {
  function commitItem(itemId: string): Promise<boolean> {
    return Promise.resolve(true)
  }

  return { commitItem }
})
`

const buggyErrors = checkAutoBuildAssetOnlyMessageGuard(BUGGY_FIXTURE)
assert.equal(
  buggyErrors.length,
  2,
  `expected the pre-fix shape (single message, no generation branch, no ` +
    `distinct non-image message) to raise 2 errors, got ${buggyErrors.length}: ` +
    `${JSON.stringify(buggyErrors)}`,
)
assert.ok(buggyErrors.some((error) => error.includes("generation === 'image'")))
assert.ok(
  buggyErrors.some((error) => error.includes('not wired into the front-end')),
)

const fixedErrors = checkAutoBuildAssetOnlyMessageGuard(FIXED_FIXTURE)
assert.equal(
  fixedErrors.length,
  0,
  `expected the fixed shape to raise no errors, got: ${JSON.stringify(fixedErrors)}`,
)

const stillMentionsEnableArtErrors = checkAutoBuildAssetOnlyMessageGuard(
  STILL_MENTIONS_ENABLE_ART_FIXTURE,
)
assert.equal(
  stillMentionsEnableArtErrors.length,
  1,
  'expected the shape that branches correctly but still says "enable art" ' +
    `in the non-image message to raise 1 error, got ` +
    `${stillMentionsEnableArtErrors.length}: ` +
    `${JSON.stringify(stillMentionsEnableArtErrors)}`,
)
assert.ok(stillMentionsEnableArtErrors[0]!.includes('cannot fix'))

const missingFunctionErrors = checkAutoBuildAssetOnlyMessageGuard(
  MISSING_FUNCTION_FIXTURE,
)
assert.equal(
  missingFunctionErrors.length,
  1,
  `expected the missing-function shape to raise 1 error, got ` +
    `${missingFunctionErrors.length}: ${JSON.stringify(missingFunctionErrors)}`,
)
assert.ok(missingFunctionErrors[0]!.includes('autoBuildItem'))

console.log(
  'Model Builder auto-build asset-only message guard checker verified: ' +
    'flags the pre-fix single-message shape, clears the fixed shape, flags ' +
    'a shape that branches but still gives misleading "enable art" advice ' +
    'in the non-image case, and flags a missing autoBuildItem() function.',
)
