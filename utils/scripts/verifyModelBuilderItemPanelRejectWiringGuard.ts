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
// Cycle 79: rejectStage()'s optional `note` param was still write-only --
// reject() never collected or passed one through, and nothing rendered
// item.stages[stage].note. Fixed by prompting for an optional note
// (window.prompt(), matching user-manager-directory.vue's onRestrict()
// convention -- Cancel aborts the reject entirely) and adding a
// `rejectionNoteFor(stage)` helper that surfaces the note only while the
// stage is actually 'rejected' (the same `note` field is reused for
// unrelated bookkeeping on other statuses, e.g. GENERATE_ASSETS's 'queued'
// marker).
//
// This asserts the textual shape of that fix stays in place: the `reject()`
// wrapper prompting for a note and calling store.rejectStage with it, each
// of the three stages' Reject button wired to it via a gated `:disabled`
// attribute, and the `rejectionNoteFor` guard scoping the note to the
// 'rejected' status -- deliberately scoped to this fix, mirroring this
// project's other narrow textual guards over a general-purpose static
// analyzer.
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
  'function reject(stage: BuildStageKey): void {\n' +
  "  const note = window.prompt('Reject this stage? Optional note for why:', '')\n" +
  '  if (note === null) return\n' +
  '  store.rejectStage(props.itemId, stage, note.trim() || undefined)\n' +
  '}'

const REJECTION_NOTE_HELPER_DEF =
  'function rejectionNoteFor(stage: BuildStageKey): string | undefined {\n' +
  '  const current = item.value?.stages[stage]\n' +
  "  return current?.status === 'rejected' ? current.note : undefined\n" +
  '}'

// One review-gate stage's Reject button: a `:disabled="..."` attribute
// immediately followed by `@click="reject('<STAGE>')"`. COMMIT is
// deliberately excluded -- it has no approve/reject concept of its own.
const REJECTABLE_STAGES = ['PITCH', 'FIELDS_AND_PROMPTS', 'GENERATE_ASSETS']

function rejectButtonPattern(stage: string): RegExp {
  return new RegExp(
    `:disabled="[^"]*"\\s*\\n\\s*@click="reject\\('${stage}'\\)"`,
  )
}

// A stage's rejection-note callout: `rejectionNoteFor('<STAGE>')` used as a
// v-if guard, with the same call rendered as the paragraph's interpolated
// content.
function rejectionNotePattern(stage: string): RegExp {
  return new RegExp(
    `v-if="rejectionNoteFor\\('${stage}'\\)"[\\s\\S]{0,300}?` +
      `\\{\\{\\s*rejectionNoteFor\\('${stage}'\\)\\s*\\}\\}`,
  )
}

export function checkItemPanelRejectWiringGuard(content: string): string[] {
  const errors: string[] = []

  if (!content.includes(REJECT_FUNCTION_DEF)) {
    errors.push(
      'Could not find the `reject(stage: BuildStageKey)` wrapper prompting ' +
        'for an optional note and calling store.rejectStage(props.itemId, ' +
        'stage, note) in model-builder-item-panel.vue -- without it, this ' +
        "recurring task's own rejectStage store action has no caller (or " +
        'no way to collect a reason), and a real user session can never ' +
        "produce a 'rejected' stage with a visible note no matter what the " +
        'badge/editability logic elsewhere in this file assumes is ' +
        'reachable.',
    )
  }

  if (!content.includes(REJECTION_NOTE_HELPER_DEF)) {
    errors.push(
      'Could not find the `rejectionNoteFor(stage)` helper in model-' +
        "builder-item-panel.vue -- without it, a rejected stage's note " +
        'has no way to reach the template, and item.stages[stage].note ' +
        '(also reused for unrelated bookkeeping on other statuses) risks ' +
        'leaking into the UI unscoped if re-added by hand later.',
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

    if (!rejectionNotePattern(stage).test(content)) {
      errors.push(
        `Could not find a rejection-note callout for the ${stage} stage ` +
          `(a "v-if=\\"rejectionNoteFor('${stage}')\\"" element rendering ` +
          `"{{ rejectionNoteFor('${stage}') }}") in model-builder-item-` +
          "panel.vue -- has this stage's markup been renamed or " +
          'restructured? If so, this guard (and the bug it protects ' +
          'against) needs to move with it.',
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
      'reject() wrapper prompts for a note and calls store.rejectStage ' +
      'with it, rejectionNoteFor() scopes the note to the rejected status, ' +
      'and PITCH/FIELDS_AND_PROMPTS/GENERATE_ASSETS each carry a gated ' +
      'Reject button and note callout wired to them.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
