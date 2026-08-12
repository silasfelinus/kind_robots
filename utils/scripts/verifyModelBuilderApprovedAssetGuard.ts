// /utils/scripts/verifyModelBuilderApprovedAssetGuard.ts
//
// Regression guard (model-builder/t-029, kaizen) -- pollAsyncArtJob clears
// item.artJobId/queueState before awaiting artStore.finalizeQueuedArtImage(),
// a real network round-trip. The item panel's canApproveAssets computed used
// item.artJobId (via isQueued) as its only "is a render still happening"
// signal alongside isGenerating/isLocked. During that exact span those flags
// are all false while GENERATE_ASSETS remains 'in-progress', so on a
// REGENERATE (item.artImageId already holds a prior candidate) the UI could
// briefly enable "Keep this asset" for the OLD image. The store already
// refused to overwrite an approved candidate with the newly finalized render,
// which prevented silent replacement but meant the user's accidental click
// discarded the new render. The UI now also refuses approval while the stage
// is 'in-progress', closing the race at the affordance instead of relying only
// on the store's defensive discard.
//
// The store-side guard remains necessary for non-UI/concurrent entry points.
// pollAsyncArtJob and generateItemAsset both check
// `item.stages.GENERATE_ASSETS.status === 'approved'` before writing the
// finished image. A concurrent 'stale' (upstream edit reopening an earlier
// stage) is intentionally left alone -- that's the existing way to flag
// "re-review this candidate," and should still receive the image.
//
// This checker therefore protects both halves of the contract:
// 1. Store: each render-completion path checks for an already-approved stage
//    between result validation and the artImageId write.
// 2. UI: canApproveAssets explicitly returns false while GENERATE_ASSETS is
//    'in-progress', covering the async finalization span after queueState clears.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')
const PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)

const FN_NAMES = ['pollAsyncArtJob', 'generateItemAsset']
const RESULT_BRANCH = 'if (!result.success'
const IMAGE_WRITE = 'item.artImageId = image.id'
const GUARD = "item.stages.GENERATE_ASSETS.status === 'approved'"
const UI_GUARD =
  "item.value.stages.GENERATE_ASSETS.status === 'in-progress'"

// Checks the store-side fix's exact shape against source text containing the
// pollAsyncArtJob/generateItemAsset functions. Exported for the self-test.
export function checkApprovedAssetGuard(content: string): string[] {
  const errors: string[] = []
  const functions = extractFunctionBodies(content)

  for (const fnName of FN_NAMES) {
    const fn = functions.find((f) => f.name === fnName)
    if (!fn) {
      errors.push(
        `Could not find an async function named ${fnName}() -- has it been ` +
          'renamed, removed, or inlined? If so, this guard (and the bug it ' +
          'protects against) needs to move with it.',
      )
      continue
    }

    const resultBranchIndex = fn.body.indexOf(RESULT_BRANCH)
    if (resultBranchIndex === -1) {
      errors.push(
        `${fnName}() no longer branches on ${RESULT_BRANCH} -- this guard's ` +
          'anchor point has moved.',
      )
      continue
    }

    const imageWriteIndex = fn.body.indexOf(IMAGE_WRITE, resultBranchIndex)
    if (imageWriteIndex === -1) {
      errors.push(
        `${fnName}() no longer writes \`${IMAGE_WRITE}\` after its ` +
          `${RESULT_BRANCH} branch -- this guard's anchor point has moved; ` +
          're-check where the finished render gets applied to the item.',
      )
      continue
    }

    const guardIndex = fn.body.indexOf(GUARD, resultBranchIndex)
    if (guardIndex === -1 || guardIndex >= imageWriteIndex) {
      errors.push(
        `${fnName}() does not check \`${GUARD}\` between its ${RESULT_BRANCH} ` +
          `branch and the ${IMAGE_WRITE} write. Two calls can complete for ` +
          'the same item, so without this check a render that finishes after ' +
          'the user already approved a sibling candidate silently overwrites ' +
          'the already-approved artImageId/imagePath with no re-review.',
      )
    }
  }

  return errors
}

// Checks the UI half of the same race. The stage remains 'in-progress' during
// async finalization even after queueState/artJobId have been cleared, so the
// stage status is the durable signal canApproveAssets must honor.
export function checkApprovedAssetUiGuard(content: string): string[] {
  const errors: string[] = []
  const start = content.indexOf('const canApproveAssets = computed(() => {')
  if (start === -1) {
    return [
      'Could not find canApproveAssets in model-builder-item-panel.vue -- ' +
        'has it been renamed or restructured? Re-check the approval affordance ' +
        'for the async-finalization race.',
    ]
  }

  const end = content.indexOf('\n})', start)
  if (end === -1) {
    return [
      'Could not determine the end of canApproveAssets in ' +
        'model-builder-item-panel.vue -- this guard anchor has moved.',
    ]
  }

  const body = content.slice(start, end)
  if (!body.includes(UI_GUARD)) {
    errors.push(
      `canApproveAssets does not check \`${UI_GUARD}\`. pollAsyncArtJob ` +
        'clears queueState/artJobId before its final image network round-trip; ' +
        "during that span GENERATE_ASSETS is still 'in-progress', so a " +
        'regenerate with an old artImageId would briefly make "Keep this ' +
        'asset" approve the old candidate and force the finished replacement ' +
        'to be discarded by the store safety guard.',
    )
  }

  return errors
}

function main(): void {
  const storeContent = readFileSync(STORE_PATH, 'utf8')
  const panelContent = readFileSync(PANEL_PATH, 'utf8')
  const errors = [
    ...checkApprovedAssetGuard(storeContent),
    ...checkApprovedAssetUiGuard(panelContent),
  ]

  if (errors.length) {
    console.error(
      'Model Builder approved-asset guard contract failed:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder approved-asset guard contract passed: render completion ' +
      'refuses to overwrite an approved candidate, and the item panel keeps ' +
      'the old candidate unapprovable while async finalization is in progress.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
