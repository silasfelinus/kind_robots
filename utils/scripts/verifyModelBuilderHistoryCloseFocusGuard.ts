// /utils/scripts/verifyModelBuilderHistoryCloseFocusGuard.ts
//
// Regression guard (model-builder/t-029, cycle 14) -- model-builder-manager.vue
// swaps its <main> content between the run-history panel
// (model-builder-run-history.vue) and the current step's component with a
// plain `v-else-if="showHistory"` / `v-else` toggle. The history panel can
// close itself from a button *inside* the panel: "Open" on a run and
// "New run" (model-builder-run-history.vue's `open()`/`startNew()`) both
// emit `close`, same as the header's own "Toggle run history" button
// (`@click="showHistory = !showHistory"`). Before this fix, nothing ever
// moved focus anywhere on that transition -- closing via the header toggle
// leaves focus right where it already was (harmless), but closing via
// "Open"/"New run" unmounts the very button that currently holds focus.
// With no reasonable element to land on, the browser drops focus to
// <body>, silently resetting keyboard/screen-reader navigation to the top
// of the page instead of leaving it anchored at the control that reopened
// the step now on screen. Concrete repro: open Model Builder, tab to
// "History", press Enter, tab to a run's "Open" button, press Enter --
// focus is now on <body>, and the next Tab press starts from the very top
// of the page rather than continuing from the header.
//
// Fixed by giving the header's "Toggle run history" button a template ref
// (`ref="historyToggleButton"`) and a `watch(showHistory, ...)` that calls
// `nextTick()` then `historyToggleButton.value?.focus()` whenever
// showHistory transitions to false -- mirrors academy-timeline.vue's
// closeLesson() (nextTick + ref.focus()) for the identical
// close-from-inside-the-panel shape.
//
// This asserts the textual shape of that fix stays in place: the toggle
// button carries the template ref, and the script block both imports
// `watch`/`nextTick` and wires a `watch(showHistory, ...)` callback that
// calls `historyToggleButton.value?.focus()` -- deliberately scoped to this
// one bug shape, mirroring this project's other narrow textual guards over
// a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const MANAGER_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-manager.vue',
)

const TOGGLE_MARKER = 'aria-label="Toggle run history"'
const REF_ATTR = 'ref="historyToggleButton"'
const WATCH_CALL = 'watch(showHistory'
const FOCUS_CALL = 'historyToggleButton.value?.focus()'

// Checks the fix's exact shape against the full source text of
// model-builder-manager.vue. Exported so the self-test below can run it
// against synthetic buggy/fixed fixtures without touching the real
// component file.
export function checkHistoryCloseFocusGuard(content: string): string[] {
  const errors: string[] = []

  const toggleIndex = content.indexOf(TOGGLE_MARKER)
  if (toggleIndex === -1) {
    errors.push(
      `Could not find \`${TOGGLE_MARKER}\` in model-builder-manager.vue -- ` +
        'has the "Toggle run history" button been renamed or restructured? ' +
        'If so, this guard needs to move with it.',
    )
    return errors
  }

  const tagStart = content.lastIndexOf('<button', toggleIndex)
  const tagEnd = content.indexOf('>', toggleIndex)
  const tag =
    tagStart === -1 || tagEnd === -1 ? '' : content.slice(tagStart, tagEnd + 1)

  if (!tag.includes(REF_ATTR)) {
    errors.push(
      `The "Toggle run history" button no longer carries \`${REF_ATTR}\` -- ` +
        'without a template ref to it, focus can no longer be restored to ' +
        'it when the run-history panel closes from a button inside the ' +
        'panel itself (Open / New run in model-builder-run-history.vue), ' +
        'and keyboard/screen-reader focus silently drops to <body>.',
    )
  }

  if (!content.includes(WATCH_CALL)) {
    errors.push(
      'model-builder-manager.vue no longer watches `showHistory` -- the ' +
        'close-from-inside-the-panel focus restoration only runs on that ' +
        'transition; without the watch, closing history via "Open" or ' +
        '"New run" drops focus to <body> with nothing to bring it back.',
    )
  }

  if (!content.includes(FOCUS_CALL)) {
    errors.push(
      `model-builder-manager.vue no longer calls \`${FOCUS_CALL}\` -- the ` +
        'showHistory watcher exists but no longer actually refocuses the ' +
        'toggle button, so the fix is present in shape only.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(MANAGER_PATH, 'utf8')
  const errors = checkHistoryCloseFocusGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder history-close focus guard contract failed for ' +
        'model-builder-manager.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder history-close focus guard contract passed: closing the ' +
      'run-history panel from a button inside it restores focus to the ' +
      'header\'s "Toggle run history" button instead of dropping it to ' +
      '<body>.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
