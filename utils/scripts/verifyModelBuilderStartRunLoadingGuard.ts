// /utils/scripts/verifyModelBuilderStartRunLoadingGuard.ts
//
// Regression guard (model-builder/t-029, cycle 80) -- store.startRun() in
// stores/modelBuilderStore.ts is a real async POST to /api/model-builder/runs
// (serializes every selected output into an itemsPayload, potentially many
// items across quantity/expansion outputs) and already sets/clears
// state.startingRun around the call (also already folded into canStartRun
// to block double-submission), but the "Start build run" button in
// model-builder-recipe-selector.vue rendered no spinner, no "starting..."
// label, and no aria-busy while that request was in flight -- it just went
// visually inert. Every other async action button in this feature
// (model-builder-item-panel.vue's Auto/Draft/Generate/Execute buttons,
// model-builder-progress-matrix.vue's Auto-build all, model-builder-batch-
// editor.vue's header spinner, etc.) already shows an in-flight state; this
// was the one step-content button in the whole feature with none.
//
// Fixed by adding :aria-busy="store.startingRun" and a conditional spinner
// span (mirroring model-builder-item-panel.vue's Execute-commit button
// pattern) that replaces the icon + label while store.startingRun is true.
//
// This asserts the textual shape of that fix stays in place: the button
// carries aria-busy bound to store.startingRun, and a loading-dots spinner
// guarded by v-if="store.startingRun" appears before the icon/label
// fallback -- deliberately scoped to this fix, mirroring this project's
// other narrow textual guards over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const RECIPE_SELECTOR_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-recipe-selector.vue',
)

// The "Start build run" button: an aria-busy attribute bound to
// store.startingRun and a click handler calling store.startRun(), followed
// (within a bounded window) by a v-if="store.startingRun" loading-dots
// spinner span.
const START_RUN_LOADING_PATTERN =
  /:aria-busy="store\.startingRun"[\s\S]{0,120}?@click="store\.startRun\(\)"[\s\S]{0,120}?v-if="store\.startingRun"[\s\S]{0,60}?loading loading-dots/

export function checkStartRunLoadingGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(':aria-busy="store.startingRun"')) {
    errors.push(
      'Could not find `:aria-busy="store.startingRun"` on the "Start ' +
        'build run" button in model-builder-recipe-selector.vue -- ' +
        'without it, screen-reader users get no live-region signal that ' +
        'starting a build run (a real async POST that can take a while ' +
        'for large item selections) is in flight.',
    )
  }

  if (!START_RUN_LOADING_PATTERN.test(content)) {
    errors.push(
      'Could not find a loading-dots spinner gated on ' +
        'v-if="store.startingRun" wired into the "Start build run" ' +
        'button in model-builder-recipe-selector.vue -- without it, the ' +
        'button goes silently inert while store.startRun() is in ' +
        'flight, unlike every other async action button in this feature ' +
        '(Auto/Draft/Generate/Execute in model-builder-item-panel.vue, ' +
        'Auto-build all in model-builder-progress-matrix.vue, etc).',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(RECIPE_SELECTOR_PATH, 'utf8')
  const errors = checkStartRunLoadingGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder "Start build run" loading-state guard contract ' +
        'failed for model-builder-recipe-selector.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder "Start build run" loading-state guard contract passed: ' +
      'the button carries aria-busy bound to store.startingRun and shows a ' +
      'loading-dots spinner while the run-creation request is in flight.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
