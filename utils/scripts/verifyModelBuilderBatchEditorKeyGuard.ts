// /utils/scripts/verifyModelBuilderBatchEditorKeyGuard.ts
//
// Regression guard (model-builder/t-029) -- model-builder-progress-matrix.vue
// mounts <model-builder-batch-editor :output-key="selectedItem.outputKey" />
// with no `:key`, while the very next element, <model-builder-item-panel>,
// does carry one (`:key="selectedItem.id"`). Without a `:key`, switching the
// selected item from one quantity/expansion group to a different one (both
// showBatch-eligible) does not remount model-builder-batch-editor.vue --
// Vue just patches the outputKey prop on the same instance. The component's
// `group`/`fields` computeds correctly re-derive from the new prop, but its
// local reactive state (`onlyEmpty`, `batchValues`) is never cleared on an
// outputKey change, so a value typed into a "Set a field on all" control for
// one group (e.g. Rewards) silently carries over into the next group's
// identically-keyed field (e.g. Scenarios' own `theme`) with no timing/race
// involved -- ordinary sequential use of the feature. Clicking Apply on the
// leaked value writes it onto every item in the new group via
// batchSetField/batchPushItems, with no warning the value came from a
// different quantity group. Concrete repro: select a Rewards item, set
// "Card theme" to `synthwave` (no Apply needed yet -- v-model already wrote
// it into batchValues.theme), click a Scenarios item instead -- Scenarios'
// own batch panel now shows `synthwave` pre-filled and Apply enabled.
//
// Fixed by adding `:key="selectedItem.outputKey"` to the
// <model-builder-batch-editor> tag in model-builder-progress-matrix.vue,
// mirroring the item-panel's own `:key="selectedItem.id"` immediately below
// it -- forces a clean remount (and therefore fresh batchValues/onlyEmpty)
// whenever the selected quantity group changes.
//
// This asserts the textual shape of that fix stays in place: a
// `:key="selectedItem.outputKey"` attribute on the
// <model-builder-batch-editor> tag, deliberately scoped to this one bug
// shape, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MATRIX_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-progress-matrix.vue',
)

const TAG_START = '<model-builder-batch-editor'
const KEY_ATTR = ':key="selectedItem.outputKey"'

// Checks the fix's exact shape against the full source text of
// model-builder-progress-matrix.vue. Exported so the self-test below can
// run it against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkBatchEditorKeyGuard(content: string): string[] {
  const errors: string[] = []

  const startIndex = content.indexOf(TAG_START)
  if (startIndex === -1) {
    errors.push(
      `Could not find \`${TAG_START}\` in model-builder-progress-matrix.vue ` +
        '-- has the batch editor mount been renamed or restructured? If so, ' +
        'this guard (and the bug it protects against) needs to move with it.',
    )
    return errors
  }

  const endIndex = content.indexOf('/>', startIndex)
  const tag = content.slice(startIndex, endIndex === -1 ? undefined : endIndex)

  if (!tag.includes(KEY_ATTR)) {
    errors.push(
      `<model-builder-batch-editor> does not carry \`${KEY_ATTR}\`. Without ` +
        'it, switching the selected item between two different quantity ' +
        'groups patches the same component instance instead of remounting ' +
        'it, so local state (batchValues, onlyEmpty) from the previous ' +
        "group leaks into the next group's batch panel -- an ordinary " +
        "batch-edit-then-switch-item flow can silently write one group's " +
        "field value onto a completely different group's items.",
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(MATRIX_PATH, 'utf8')
  const errors = checkBatchEditorKeyGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batch-editor key guard contract failed for ' +
        'model-builder-progress-matrix.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch-editor key guard contract passed: ' +
      '<model-builder-batch-editor> remounts on outputKey change, so ' +
      "switching quantity groups can no longer leak one group's batch " +
      "values into the next group's panel.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
