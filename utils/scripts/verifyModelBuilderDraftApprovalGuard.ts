// /utils/scripts/verifyModelBuilderDraftApprovalGuard.ts
//
// Regression guard (model-builder/t-029) -- draftText() is the single-item AI
// drafting path behind model-builder-item-panel.vue's "Draft with AI"
// buttons. Its own success path already discards a draft that lands after
// the user hand-edited the same field mid-flight (the `liveValue !==
// current` check), but had no equivalent check for the field's *stage*
// having been approved mid-flight. The item panel's Approve button for
// PITCH/FIELDS_AND_PROMPTS has no `isDrafting` gate of its own (unlike the
// Draft button right next to it, which does) -- `:disabled="isLocked('PITCH')
// || !pitch.trim()"` for pitch, `:disabled="isLocked('FIELDS_AND_PROMPTS')"`
// for fields/prompt -- so a user can click Draft, then Approve (pitch/fields
// already non-empty), before the draft response lands. Before this fix,
// draftText then unconditionally wrote the stale draft into item.pitch /
// item.fieldsDraft / item.promptDraft via updatePitch/updateFields/
// updatePrompt, silently rewriting an already-'approved' stage's content
// while its badge kept showing 'approved' -- no re-review. This is the same
// review-gate-bypass class isStageEditable already guards for
// batchDraftField/batchSetField, just missing here for the single-item path
// those batch functions call into.
//
// This asserts the textual shape of the fix stays in place: draftText checks
// `isStageEditable(item, stageForDraftField(field))` after its
// `result.success` branch and before it applies the draft via
// updatePitch/updateFields/updatePrompt. Deliberately scoped to this one
// function/bug, mirroring verifyModelBuilderCommitCancelledRunGuard.ts's
// preference for explicit, narrow textual checks over a general-purpose
// static analyzer.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'draftText'
const RESULT_CHECK = 'if (!result.success'
const APPLY_SETTER = "if (field === 'pitch') updatePitch(itemId, value)"
const GUARD = 'isStageEditable(item, stageForDraftField(field))'

// Checks the fix's exact shape against the full source text of a file
// containing a `draftText`-named async function. Exported (rather than only
// exercised via main()) so the self-test below can run it against synthetic
// buggy/fixed fixtures without touching the real store file.
export function checkDraftApprovalGuard(content: string): string[] {
  const errors: string[] = []

  const functions = extractFunctionBodies(content)
  const fn = functions.find((f) => f.name === FN_NAME)
  if (!fn) {
    errors.push(
      `Could not find an async function named ${FN_NAME}() -- has it been ` +
        'renamed, removed, or inlined? If so, this guard (and the bug it ' +
        'protects against) needs to move with it.',
    )
    return errors
  }

  const resultCheckIndex = fn.body.indexOf(RESULT_CHECK)
  if (resultCheckIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer branches on ${RESULT_CHECK} -- this guard's ` +
        'anchor point has moved; re-check where the /api/suggest response ' +
        'is validated.',
    )
    return errors
  }

  const setterIndex = fn.body.indexOf(APPLY_SETTER, resultCheckIndex)
  if (setterIndex === -1) {
    errors.push(
      `${FN_NAME}() no longer applies the draft via \`${APPLY_SETTER}\` -- ` +
        "this guard's anchor point has moved; re-check where the draft is " +
        'routed through updatePitch/updateFields/updatePrompt.',
    )
    return errors
  }

  const guardIndex = fn.body.indexOf(GUARD, resultCheckIndex)
  if (guardIndex === -1 || guardIndex >= setterIndex) {
    errors.push(
      `${FN_NAME}() does not check \`${GUARD}\` between its ${RESULT_CHECK} ` +
        `branch and ${APPLY_SETTER}. The Approve button for PITCH / ` +
        'FIELDS_AND_PROMPTS has no isDrafting gate, so a user can approve ' +
        "the stage while this function's own /api/suggest await is still " +
        'pending. Without this check, the draft that lands afterward ' +
        "silently rewrites the now-approved stage's content with no " +
        "re-review, even though its badge keeps showing 'approved'.",
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkDraftApprovalGuard(content)

  if (errors.length) {
    console.error(
      'Model Builder draft approval guard contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder draft approval guard contract passed: ${FN_NAME}() ` +
      'refuses to apply a draft whose stage was approved while the draft ' +
      'was still in flight.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
