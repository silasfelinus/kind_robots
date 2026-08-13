// /utils/scripts/verifyModelBuilderBatchAnyInFlightGuard.ts
//
// Regression guard (model-builder/t-029) -- model-builder-batch-editor.vue's
// action buttons (Draft pitches/fields/prompts, Approve fields, Auto-build
// group, Apply-a-field) used to gate only on `batching`, a computed scoped to
// THIS component instance's own `props.outputKey`
// (`store.batchingOutputKey === props.outputKey`). batchingOutputSingleton
// (modelBuilderStore.ts) is a single store-wide slot, not one per group --
// claiming it is an unconditional overwrite (createOwnedSingleton's own doc
// comment), so it only reliably tracks the MOST RECENTLY STARTED batch
// operation's owner, never "is a batch operation running at all."
// model-builder-progress-matrix.vue mounts this component keyed by
// `selectedItem.outputKey` (t-029's earlier batch-editor-key fix) and never
// disables the row clicks that change the selected item/group. So switching
// to a different quantity group while this group's batchDraftField/
// batchSetField/batchAutoBuild is still running unmounts this instance and
// mounts a fresh one for the new group, whose own `batching` reads false
// even though the old group's operation is still in flight -- every action
// button stayed clickable, letting the user start a second, fully
// concurrent batch operation. That races draftText's shared draftingField
// singleton, defeats batchDraftField's "sequentially, so we don't hammer the
// text server" design, and lets the two operations' unscoped setStatus()
// completion toasts silently clobber each other.
//
// Fixed by adding `anyBatching = computed(() => store.batchingOutputKey !==
// null)` and gating every action button's `:disabled` on it instead of the
// narrow `batching` (which stays only for this group's own header spinner)
// -- mirrors item-panel.vue's isAnyDraftInFlight (gates every field's
// controls on ANY draft being in flight, not just the matching one).
//
// This asserts the textual shape of that fix stays in place: an
// `anyBatching` computed keyed off `store.batchingOutputKey !== null`, and
// every action-button `:disabled` attribute in the file using it (never the
// bare `batching` alone) -- deliberately scoped to this one bug shape,
// mirroring this project's other narrow textual guards over a general-
// purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const BATCH_EDITOR_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-batch-editor.vue',
)

const ANY_BATCHING_DEF =
  'const anyBatching = computed(() => store.batchingOutputKey !== null)'

// Every `:disabled="..."` attribute in the file that references the batching
// state must use `anyBatching`, not the narrow per-group `batching` alone.
// Case-insensitive so this matches both the narrow `batching` and
// `anyBatching` itself (whose own substring is "Batching", capital B).
const DISABLED_ATTR_PATTERN = /:disabled="([^"]*batching[^"]*)"/gi

export function checkBatchAnyInFlightGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(ANY_BATCHING_DEF)) {
    errors.push(
      `Could not find \`${ANY_BATCHING_DEF}\` in model-builder-batch-editor.vue ` +
        '-- without a store-wide "is ANY batch operation in flight" computed, ' +
        "a button's :disabled can only key off this group's own narrow " +
        '`batching`, which reads false the instant a different quantity ' +
        "group's batch operation becomes the singleton's current owner, even " +
        "though THIS group's own operation may still be running.",
    )
  }

  const matches = [...content.matchAll(DISABLED_ATTR_PATTERN)]
  if (matches.length === 0) {
    errors.push(
      'Could not find any `:disabled="...batching..."` attribute in ' +
        'model-builder-batch-editor.vue -- has the batching gate been ' +
        'renamed or restructured? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
  }

  for (const match of matches) {
    const expression = match[1] ?? ''
    if (!expression.includes('anyBatching')) {
      errors.push(
        `Found \`:disabled="${expression}"\` gating on the narrow, ` +
          'per-group `batching` computed instead of `anyBatching` -- this ' +
          "button stays clickable while a DIFFERENT quantity group's batch " +
          'operation is still running, letting two batch operations run ' +
          'concurrently.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(BATCH_EDITOR_PATH, 'utf8')
  const errors = checkBatchAnyInFlightGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder batch any-in-flight guard contract failed for ' +
        'model-builder-batch-editor.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder batch any-in-flight guard contract passed: every action ' +
      "button gates on anyBatching (ANY group's batch operation in flight), " +
      'so switching quantity groups can no longer start a second, concurrent ' +
      'batch operation while the first is still running.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
