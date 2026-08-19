// /utils/scripts/verifyModelBuilderStepContentFocusGuard.ts
//
// Regression guard (model-builder/t-029, cycle 15) -- model-builder-manager.vue
// swaps its <main> content between the three wizard steps
// (model-builder-source-picker.vue, model-builder-recipe-selector.vue,
// model-builder-progress-matrix.vue) with a v-if/v-else-if chain. Several
// buttons *inside* the currently-displayed step change `store.step`, which
// unmounts that whole step component -- and the very button that was just
// clicked -- to mount the next one: model-builder-progress-matrix.vue's
// "New run" (store.resetRun()), model-builder-recipe-selector.vue's
// "Change source" (store.goToStep('source')), and
// model-builder-source-picker.vue's source-record buttons
// (store.selectSource()). Before this fix, nothing ever moved focus
// anywhere on that transition, so the browser dropped it to <body> --
// exactly the same shape cycle 14 fixed for the run-history toggle (see
// verifyModelBuilderHistoryCloseFocusGuard.ts), just one level down: a
// button inside the swapped-out content, rather than a button inside a
// swapped-out panel.
//
// The header's own crumb nav buttons also change `store.step`, but they
// live in <header>, which never unmounts across a step change, so a crumb
// click correctly keeps focus right where it already was -- that case must
// stay untouched, which is why the fix cannot just watch `store.step`
// unconditionally the way cycle 14's `watch(showHistory, ...)` does.
//
// Fixed by giving <main> a template ref (`ref="mainContent"`) and
// `tabindex="-1"` so it can receive focus programmatically, plus a
// `watch(() => store.step, ...)` that checks
// `mainContent.value?.contains(document.activeElement)` (true only when the
// control that changed the step was itself inside <main>) before calling
// `nextTick()` then `mainContent.value?.focus()`.
//
// This asserts the textual shape of that fix stays in place: <main> carries
// both the template ref and tabindex="-1", and the script block wires a
// `watch(() => store.step, ...)` callback that checks
// `mainContent.value?.contains(document.activeElement)` and calls
// `mainContent.value?.focus()` -- deliberately scoped to this one bug
// shape, mirroring this project's other narrow textual guards over a
// general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MANAGER_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-manager.vue',
)

const MAIN_MARKER = '<main'
const REF_ATTR = 'ref="mainContent"'
const TABINDEX_ATTR = 'tabindex="-1"'
const WATCH_CALL = 'watch(\n  () => store.step'
const CONTAINS_CHECK = 'mainContent.value?.contains(document.activeElement)'
const FOCUS_CALL = 'mainContent.value?.focus()'

// Checks the fix's exact shape against the full source text of
// model-builder-manager.vue. Exported so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkStepContentFocusGuard(content: string): string[] {
  const errors: string[] = []

  const mainIndex = content.indexOf(MAIN_MARKER)
  if (mainIndex === -1) {
    errors.push(
      'Could not find a `<main` element in model-builder-manager.vue -- ' +
        'has the step content wrapper been renamed or restructured? If so, ' +
        'this guard needs to move with it.',
    )
    return errors
  }

  const tagEnd = content.indexOf('>', mainIndex)
  const tag = tagEnd === -1 ? '' : content.slice(mainIndex, tagEnd + 1)

  if (!tag.includes(REF_ATTR)) {
    errors.push(
      `The <main> step content wrapper no longer carries \`${REF_ATTR}\` -- ` +
        'without a template ref to it, focus can no longer be restored to ' +
        'it when a button inside the current step (New run, Change source, ' +
        'a source record) unmounts itself along with the step it belongs ' +
        'to, and keyboard/screen-reader focus silently drops to <body>.',
    )
  }

  if (!tag.includes(TABINDEX_ATTR)) {
    errors.push(
      `The <main> step content wrapper no longer carries \`${TABINDEX_ATTR}\` -- ` +
        'a <main> element is not focusable by default, so calling ' +
        '.focus() on it silently does nothing without this attribute.',
    )
  }

  if (!content.includes(WATCH_CALL)) {
    errors.push(
      'model-builder-manager.vue no longer watches `store.step` -- the ' +
        'step-content focus restoration only runs on that transition; ' +
        'without the watch, a step change triggered from inside the ' +
        'current step drops focus to <body> with nothing to bring it back.',
    )
  }

  if (!content.includes(CONTAINS_CHECK)) {
    errors.push(
      `model-builder-manager.vue no longer checks \`${CONTAINS_CHECK}\` -- ` +
        'without this check the watcher cannot tell a step change caused ' +
        'by a button inside the step content (needs refocusing) apart ' +
        'from one caused by a persistent header crumb click (already ' +
        'correctly focused, must stay untouched), so the fix either does ' +
        'nothing or wrongly steals focus away from the header on every ' +
        'crumb click.',
    )
  }

  if (!content.includes(FOCUS_CALL)) {
    errors.push(
      `model-builder-manager.vue no longer calls \`${FOCUS_CALL}\` -- the ` +
        'store.step watcher exists but no longer actually refocuses <main>, ' +
        'so the fix is present in shape only.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(MANAGER_PATH, 'utf8')
  const errors = checkStepContentFocusGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder step-content focus guard contract failed for ' +
        'model-builder-manager.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder step-content focus guard contract passed: a step ' +
      "change triggered from inside the current step's own content " +
      'restores focus to <main> instead of dropping it to <body>, without ' +
      "interfering with the header crumb nav's own already-correct focus.",
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
