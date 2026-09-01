// /utils/scripts/verifyModelBuilderItemPanelRejectWiringGuard.ts
//
// Regression guard (model-builder/t-029, cycle 78) -- rejectStage() in
// stores/modelBuilderStore.ts is a fully-built action (mirrors approveStage/
// reopenStage: flips a stage to 'rejected', invalidates downstream via
// markDownstreamStale, reverts on a failed PATCH) and badgeFor()/isEditable()
// in model-builder-item-panel.vue have handled the 'rejected' status for a
// long time (badge-error styling, textareas stay editable while rejected),
// but no component ever called store.rejectStage -- a real user session
// could never actually produce a 'rejected' stage. Found by a deliberate
// re-sweep after cycle 77 closed the run-epoch/cross-run race class this
// recurring task had concentrated on for several cycles running.
//
// Fixed by adding a `reject(stage: BuildStageKey)` wrapper (mirroring the
// existing `approve(stage)` wrapper) and a "Reject" button next to each
// review-gate stage's Approve button -- PITCH, FIELDS_AND_PROMPTS, and
// GENERATE_ASSETS. COMMIT deliberately has no Reject control: it has no
// approve/reject concept of its own, since commitItem() writes
// item.stages.COMMIT directly from the server response rather than through
// approveStage/rejectStage.
//
// This asserts the textual shape of that fix stays in place: the `reject()`
// wrapper calling store.rejectStage, and each of the three stages' Reject
// button wired to it via a gated `:disabled` attribute -- deliberately
// scoped to this one fix, mirroring this project's other narrow textual
// guards over a general-purpose static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const ITEM_PANEL_PATH = join(
  repositoryRoot,
  'components/model-builder/model-builder-item-panel.vue',
)

const REJECT_FUNCTION_DEF =
  'function reject(stage: BuildStageKey): void {\n  store.rejectStage(props.itemId, stage)\n}'

// One review-gate stage's Reject button: a `:disabled="..."` attribute
// immediately followed by `@click="reject('<STAGE>')"`. COMMIT is
// deliberately excluded -- it has no approve/reject concept of its own.
const REJECTABLE_STAGES = ['PITCH', 'FIELDS_AND_PROMPTS', 'GENERATE_ASSETS']

function rejectButtonPattern(stage: string): RegExp {
  return new RegExp(
    `:disabled="[^"]*"\\s*\\n\\s*@click="reject\\('${stage}'\\)"`,
  )
}

export function checkItemPanelRejectWiringGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(REJECT_FUNCTION_DEF)) {
    errors.push(
      'Could not find the `reject(stage: BuildStageKey)` wrapper calling ' +
        'store.rejectStage(props.itemId, stage) in model-builder-item-' +
        "panel.vue -- without it, this recurring task's own rejectStage " +
        'store action has no caller, and a real user session can never ' +
        "produce a 'rejected' stage no matter what the badge/editability " +
        'logic elsewhere in this file assumes is reachable.',
    )
  }

  for (const stage of REJECTABLE_STAGES) {
    if (!rejectButtonPattern(stage).test(content)) {
      errors.push(
        `Could not find a gated Reject button for the ${stage} stage ` +
          `(a ":disabled=\\"...\\"" attribute immediately followed by ` +
          `"@click=\\"reject('${stage}')\\"") in model-builder-item-panel.vue ` +
          "-- has this stage's button block been renamed or restructured? " +
          'If so, this guard (and the bug it protects against) needs to ' +
          'move with it.',
      )
    }
  }

  return errors
}

function main(): void {
  const content = readFileSync(ITEM_PANEL_PATH, 'utf8')
  const errors = checkItemPanelRejectWiringGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder item-panel Reject wiring guard contract failed for ' +
        'model-builder-item-panel.vue:',
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    'Model Builder item-panel Reject wiring guard contract passed: the ' +
      'reject() wrapper calls store.rejectStage, and PITCH/FIELDS_AND_' +
      'PROMPTS/GENERATE_ASSETS each carry a gated Reject button wired to it.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
