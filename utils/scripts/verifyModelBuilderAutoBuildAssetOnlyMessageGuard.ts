// /utils/scripts/verifyModelBuilderAutoBuildAssetOnlyMessageGuard.ts
//
// Regression guard (model-builder/t-029, cycle 20) -- autoBuildItem()'s
// "an ASSET_ONLY item is nothing but its art" guard fires whenever
// `isAsset && !wantArt`, and `wantArt` is defined as
// `state.includeArt && item.generation === 'image'`. That single boolean
// collapses two genuinely different situations into one message:
//
//   1. generation === 'image' but state.includeArt is off -- "enable art
//      to auto-build it" is real, actionable advice: toggle Include Art on
//      the recipe step and retry.
//   2. generation !== 'image' (the OUTPUT_CATALOG entries with generation
//      'plan' or 'three-d' -- photo-shoot-plan, video-shot-list,
//      commercial-treatment, launch-plan [defaultOn: true, so every default
//      Marketing Deck run creates one], three-d-reference, reward-3d) --
//      wantArt can NEVER become true for these no matter what includeArt is
//      set to, since generation is never 'image'. "Enable art" describes an
//      action that cannot possibly fix the item -- these generation kinds
//      simply have no generator wired into this front-end slice at all (see
//      model-builder-item-panel.vue's own GENERATE_ASSETS section, which
//      shows exactly that explanation instead of a generate button for
//      them).
//
// Before this fix, autoBuildItem() reported the same "enable art" message
// for both cases -- a real user clicking Auto on launch-plan (or any other
// plan/three-d ASSET_ONLY item) got a wrong, unhelpful instruction with no
// indication the generation kind itself is simply unimplemented rather than
// something they mis-configured.
//
// This asserts the textual shape of the fix stays in place: autoBuildItem()
// branches on `item.generation === 'image'` before choosing its failure
// message, and the non-image branch's message does not contain the
// misleading "enable art" phrasing.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'autoBuildItem'

// Checks the fix's exact shape against the full source text of a file
// containing an `autoBuildItem`-named function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkAutoBuildAssetOnlyMessageGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find a function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  const guardBlockMatch = fn.body.match(
    /if\s*\(\s*isAsset\s*&&\s*!wantArt\s*\)\s*\{([\s\S]*?)\n {4}\}/,
  )
  if (!guardBlockMatch) {
    errors.push(
      `${FN_NAME}() no longer contains an \`if (isAsset && !wantArt)\` ` +
        "block -- this guard's anchor point has moved; re-check where the " +
        'asset-only-without-art failure is reported.',
    )
    return errors
  }
  const guardBlock = guardBlockMatch[1]!

  const branchesOnGeneration = /item\.generation\s*===\s*'image'/.test(
    guardBlock,
  )
  if (!branchesOnGeneration) {
    errors.push(
      `${FN_NAME}()'s \`isAsset && !wantArt\` block does not branch on ` +
        "`item.generation === 'image'` -- it reports one message for " +
        'both "art is off" (fixable by enabling Include Art) and ' +
        '"this generation kind has no generator at all" (not fixable by ' +
        'enabling art, since wantArt can never become true for it), which ' +
        'is misleading for the second case.',
    )
  }

  const mentionsEnableArt = /enable art/.test(guardBlock)
  if (!mentionsEnableArt) {
    errors.push(
      `${FN_NAME}()'s \`isAsset && !wantArt\` block no longer mentions ` +
        '"enable art" at all -- the image-generation, includeArt-is-off ' +
        'case (where that advice IS actionable) appears to have lost its ' +
        'message entirely.',
    )
  }

  // The non-image (else) branch's message can legitimately be built from
  // several concatenated template-literal fragments (` + `), so this can't
  // just grab a single backtick pair -- it captures everything from the
  // ternary's own `:` through the next `setStatus(` call, regardless of how
  // many literals/pluses sit in between.
  const nonImageBranchMatch = guardBlock.match(
    /item\.generation === 'image'[\s\S]*?\?[\s\S]*?:([\s\S]*?)(?=\n\s*setStatus\()/,
  )
  const nonImageBranchText = nonImageBranchMatch?.[1] ?? ''
  const hasDistinctNonImageMessage = /generation is not yet wired/.test(
    nonImageBranchText,
  )
  if (!hasDistinctNonImageMessage) {
    errors.push(
      `${FN_NAME}()'s \`isAsset && !wantArt\` block does not have a ` +
        'distinct message explaining that this generation kind is not ' +
        'wired into the front-end slice yet -- the non-image branch must ' +
        'not just reuse the "enable art" text (see this guard\'s own file ' +
        "header for why that's actively wrong for plan/three-d outputs).",
    )
  } else if (/enable art/.test(nonImageBranchText)) {
    errors.push(
      `${FN_NAME}()'s non-image failure message still mentions "enable ` +
        'art" -- that advice cannot fix a generation kind with no ' +
        'generator wired at all, regardless of includeArt.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildAssetOnlyMessageGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build asset-only message guard contract failed ' +
        `for ${FN_NAME}() in stores/modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder auto-build asset-only message guard contract passed: ' +
      `${FN_NAME}() reports a distinct, accurate message for ASSET_ONLY ` +
      "items whose generation kind isn't wired in at all, instead of the " +
      'misleading "enable art" advice.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
