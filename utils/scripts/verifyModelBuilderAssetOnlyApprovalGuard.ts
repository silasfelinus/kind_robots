// /utils/scripts/verifyModelBuilderAssetOnlyApprovalGuard.ts
//
// Regression guard (model-builder/t-029) -- canApproveAssets gated its final
// "does this candidate exist" check on `item.value.generation === 'image'`,
// falling through to `return true` unconditionally for every other
// GenerationKind. Several real, catalogued recipe outputs are
// `action: 'ASSET_ONLY'` paired with a non-image generation kind that has no
// wired generator yet ('plan': photo-shoot-plan, video-shot-list,
// commercial-treatment, launch-plan; 'three-d': three-d-reference,
// reward-3d) -- and launch-plan is defaultOn inside marketing-deck, the
// default recipe for a Project source, so an ordinary default build run
// reaches this. For those items the "Generate Assets" section shows only a
// "not yet wired into this front-end slice" message with no Generate
// button, but "Keep this asset" sat enabled regardless. Clicking it flipped
// GENERATE_ASSETS to 'approved' with item.artImageId still null; clicking
// Execute commit then hit the server's ASSET_ONLY precondition in
// server/api/model-builder/items/[id]/commit.post.ts ("Generate and keep an
// asset before committing"), a dead end -- reopening the stage just re-shows
// the same always-enabled button, so the item can never be committed.
//
// Fixed by keying the final check off `item.value.action === 'ASSET_ONLY'`
// instead of `item.value.generation === 'image'`, matching what the server
// actually requires at commit time: every ASSET_ONLY item needs a real
// artImageId regardless of generation kind, while UPDATE/CREATE
// (text-generation) items never need one and must stay unconditionally
// approvable.
//
// This asserts the textual shape of that fix stays in place: a check for
// `item.value.action === 'ASSET_ONLY'` (returning `Boolean(item.value.artImageId)`)
// inside canApproveAssets, and that the old generation-keyed check is gone --
// deliberately scoped to this one bug shape, mirroring this project's other
// narrow textual guards over a general-purpose static analyzer.
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
const ACTION_CHECK =
  "item.value.action === 'ASSET_ONLY') return Boolean(item.value.artImageId)"
const STALE_GENERATION_CHECK =
  "item.value.generation === 'image') return Boolean("

// Checks the fix's exact shape against the full source text of
// model-builder-item-panel.vue. Exported so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkAssetOnlyApprovalGuard(content: string): string[] {
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

  if (!body.includes(ACTION_CHECK)) {
    errors.push(
      `canApproveAssets does not check \`${ACTION_CHECK}\`. Every ` +
        'ASSET_ONLY item writes artImageId on commit regardless of ' +
        'generation kind (see commit.post.ts) -- without this check, an ' +
        "ASSET_ONLY item whose generation kind isn't 'image' (e.g. " +
        "'plan'/'three-d' recipe outputs like launch-plan or " +
        'three-d-reference, several defaultOn) can approve GENERATE_ASSETS ' +
        'with no candidate ever generated, then dead-end at commit with ' +
        '"Generate and keep an asset before committing".',
    )
  }

  if (body.includes(STALE_GENERATION_CHECK)) {
    errors.push(
      'canApproveAssets still keys its final check off ' +
        "`item.value.generation === 'image'` -- this is the pre-fix shape " +
        'that let every non-image generation kind fall through to ' +
        '`return true` unconditionally. Replace it with the ' +
        "`item.value.action === 'ASSET_ONLY'` check instead.",
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(PANEL_PATH, 'utf8')
  const errors = checkAssetOnlyApprovalGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder ASSET_ONLY approval guard contract failed for ' +
        'model-builder-item-panel.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder ASSET_ONLY approval guard contract passed: ' +
      'canApproveAssets requires a real artImageId for every ASSET_ONLY ' +
      'item regardless of generation kind, so a non-image-kind ASSET_ONLY ' +
      'output can no longer be approved and then dead-end at commit.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
