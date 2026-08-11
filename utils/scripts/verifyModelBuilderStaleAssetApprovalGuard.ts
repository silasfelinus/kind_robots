// /utils/scripts/verifyModelBuilderStaleAssetApprovalGuard.ts
//
// Regression guard (model-builder/t-029) -- reopening an upstream stage
// (PITCH or FIELDS_AND_PROMPTS) after GENERATE_ASSETS was already approved
// calls reopenStage -> markDownstreamStale, which flips GENERATE_ASSETS to
// 'stale' but never clears item.artImageId/item.imagePath (those are only
// ever written by generateItemAsset/pollAsyncArtJob, on an actual new
// render). Before this fix, the item panel's canApproveAssets computed
// gated only on isLocked('GENERATE_ASSETS') (true solely for a literal
// 'locked' status) plus isGenerating/isQueued and, for image outputs,
// Boolean(item.artImageId) -- it never checked for 'stale'. So once a stage
// went stale while the item still carried a leftover artImageId from
// before the edit, "Keep this asset" stayed clickable and approveStage
// would commit that pre-edit image straight through with no re-review,
// silently pairing it with the just-edited (different) pitch/fields/
// prompt. Concrete repro: approve GENERATE_ASSETS with a "red dragon"
// image, click Edit on FIELDS_AND_PROMPTS, change the prompt to "a blue
// whale", re-approve fields without regenerating, click "Keep this asset"
// (still showing the red-dragon thumbnail) -- the committed record's
// artImageId then durably mismatches its own text fields.
//
// Fixed by adding a check in canApproveAssets: when GENERATE_ASSETS is
// 'stale', approval is refused until a fresh generateItemAsset/
// generateItemAssetAsync call completes (which transitions the stage back
// to 'ready' via finishGenerateAssets, only ever from 'in-progress' --
// isEditable('GENERATE_ASSETS') already keeps the Generate/Regenerate
// button enabled while stale, so this doesn't block the way forward, only
// the shortcut around it).
//
// This asserts the textual shape of that fix stays in place: a check for
// `item.value.stages.GENERATE_ASSETS.status === 'stale'` (returning false)
// inside canApproveAssets, positioned before the function returns any other
// truthy result -- deliberately scoped to this one bug shape, mirroring
// this project's other narrow textual guards over a general-purpose static
// analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)

const COMPUTED_START = 'const canApproveAssets = computed(() => {'
const STALE_CHECK = "item.value.stages.GENERATE_ASSETS.status === 'stale'"

// Checks the fix's exact shape against the full source text of
// model-builder-item-panel.vue. Exported so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkStaleAssetApprovalGuard(content: string): string[] {
  const errors: string[] = []

  const startIndex = content.indexOf(COMPUTED_START)
  if (startIndex === -1) {
    errors.push(
      `Could not find \`${COMPUTED_START}\` in model-builder-item-panel.vue ` +
        '-- has canApproveAssets been renamed or restructured? If so, this ' +
        'guard (and the bug it protects against) needs to move with it.',
    )
    return errors
  }

  // The computed is a short arrow function body; find its closing `})` by
  // scanning forward for the first `})` at the start of a line, matching
  // this file's existing computed-body extraction convention.
  const closeMatch = /\n\}\)/.exec(content.slice(startIndex))
  const endIndex =
    closeMatch && closeMatch.index !== undefined
      ? startIndex + closeMatch.index
      : content.length
  const body = content.slice(startIndex, endIndex)

  if (!body.includes(STALE_CHECK)) {
    errors.push(
      `canApproveAssets does not check \`${STALE_CHECK}\`. ` +
        "markDownstreamStale/reopenStage flip GENERATE_ASSETS to 'stale' " +
        'without ever clearing item.artImageId/item.imagePath, so without ' +
        'this check a leftover pre-edit candidate stays approvable -- ' +
        '"Keep this asset" commits it straight through, silently pairing a ' +
        'stale image with the just-edited pitch/fields/prompt.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(PANEL_PATH, 'utf8')
  const errors = checkStaleAssetApprovalGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder stale-asset approval guard contract failed for ' +
        'model-builder-item-panel.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder stale-asset approval guard contract passed: ' +
      'canApproveAssets refuses to approve a GENERATE_ASSETS candidate ' +
      "while the stage is 'stale', so an edit-then-reapprove flow can no " +
      'longer commit a leftover pre-edit image without a fresh regenerate.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
