// /utils/scripts/verifyModelBuilderRunSwapSingletonLeakGuard.ts
//
// Regression guard (model-builder/t-029, cycle 57) -- resetRun()/resetAll()
// already clear the store-wide "who's in flight" singletons
// (generatingItemId/committingItemId/autoBuilding/autoBuildingItemId/
// batchingOutputKey/draftingField) whenever they drop or replace the active
// run, specifically because an async op abandoned on the old run (a batch
// action, a single-item generate/commit, an auto-build) can otherwise leak
// a false "busy" indicator into whichever run replaces it. batchingOutputKey
// is a bare recipe output key (e.g. "rewards"), not scoped to a run, so two
// runs sharing a recipe collide on it directly -- resetRun's own comment
// documents the exact scenario this was first fixed for. See
// verifyModelBuilderResetRunGuard.ts / verifyModelBuilderResetAllGuard.ts
// for the existing guards covering resetRun()/resetAll() themselves; this
// guard covers the three sites found (cycle 57) to perform the identical
// run-swap without ever going through either:
//
// - startRun() (Change-source / the always-enabled Source crumb, then
//   Start build run, creates a fresh run while an old one's async op may
//   still be in flight)
// - openRun()'s two "adopt a different run" branches (opening a different
//   run from History, either already cached or freshly fetched)
// - resumeRun()'s "adopt a different run" branch (a remount picking up a
//   different remembered/latest run)
//
// Each leaked the same stale-busy-indicator bug through its own path. Fixed
// by inlining the same six-line clear at each site (matching resetRun's own
// inline shape, rather than introducing a shared helper that would have
// required rewriting the existing resetRun/resetAll guards' literal-shape
// checks). This asserts each site still clears every one of the six
// singletons, keyed off text immediately adjacent to where each swap
// actually happens so a refactor that silently drops the clear (rather than
// moving it) gets caught.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const CLEARED_LINES = [
  'state.generatingItemId = null',
  'state.committingItemId = null',
  'state.autoBuilding = false',
  'state.autoBuildingItemId = null',
  'state.batchingOutputKey = null',
  'draftingField.value = null',
]

interface SwapSite {
  name: string
  anchor: string
  windowSize: number
  hint: string
}

const SWAP_SITES: SwapSite[] = [
  {
    name: "startRun()'s success path",
    anchor: "throw new Error(response.message || 'Failed to start build run.')",
    windowSize: 900,
    hint:
      'startRun() creates a fresh run that replaces state.run -- an in-flight op abandoned ' +
      'on the old run can leak a false-busy indicator into the new one unless the singletons ' +
      'are cleared right before `state.run = adaptRun(response.data)`.',
  },
  {
    name: "openRun()'s cached-run branch",
    anchor: "if (cached && cached.status !== 'CANCELLED') {",
    windowSize: 700,
    hint:
      'openRun() adopting a different, already-cached run must clear the in-flight singletons ' +
      'the same way resetRun/resetAll do.',
  },
  {
    name: "openRun()'s freshly-fetched-run branch",
    anchor: '// See the comment on the cached branch above.',
    windowSize: 300,
    hint:
      'openRun() adopting a different run fetched from the server must clear the in-flight ' +
      'singletons the same way its cached-run branch does.',
  },
  {
    name: "resumeRun()'s adopt-a-different-run branch",
    anchor: 'if (state.run?.id === String(data.id)) {',
    windowSize: 900,
    hint:
      "resumeRun()'s else branch (adopting a different remembered/latest run) must clear the " +
      'in-flight singletons the same way resetRun/resetAll do.',
  },
]

// Checks that every run-swap site still clears all six in-flight
// singletons, against the full source text of a file shaped like
// modelBuilderStore.ts. Exported so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkRunSwapSingletonLeakGuard(content: string): string[] {
  const errors: string[] = []

  for (const site of SWAP_SITES) {
    const anchorIndex = content.indexOf(site.anchor)
    if (anchorIndex === -1) {
      errors.push(
        `Could not find the anchor for ${site.name} (\`${site.anchor}\`) -- has this ` +
          'function been renamed or restructured? If so, this guard needs to move with it.',
      )
      continue
    }

    const window = content.slice(anchorIndex, anchorIndex + site.windowSize)
    const missing = CLEARED_LINES.filter((line) => !window.includes(line))
    if (missing.length) {
      errors.push(
        `${site.name} does not clear: ${missing.join(', ')}. ${site.hint}`,
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkRunSwapSingletonLeakGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder run-swap singleton-leak guard contract failed for ' +
        'modelBuilderStore.ts:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder run-swap singleton-leak guard contract passed: ' +
      "startRun(), both openRun() run-swap branches, and resumeRun()'s " +
      'adopt-a-different-run branch all clear the store-wide in-flight ' +
      "singletons, so an abandoned run's async op can't leak a " +
      'false-busy indicator into whatever run replaces it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
