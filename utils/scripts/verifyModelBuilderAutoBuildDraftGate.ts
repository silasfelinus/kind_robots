// /utils/scripts/verifyModelBuilderAutoBuildDraftGate.ts
//
// Regression guard (model-builder/t-029) -- autoBuildItem() drives an item
// through every stage "with sensible defaults": draft whatever's empty, then
// approve. draftText() can fail (a thrown /api/suggest error, "the model
// returned nothing useful", or its own isStageEditable/live-value guards) and
// still leave the field's content unchanged (e.g. an empty pitch). Before
// this fix, autoBuildItem awaited draftText() but discarded its boolean
// result, then called approveStage() unconditionally right after -- silently
// marking PITCH/FIELDS_AND_PROMPTS 'approved' even when the draft that was
// supposed to fill them never landed. The single-item Approve button in
// model-builder-item-panel.vue treats an approved-but-empty PITCH as
// impossible (`:disabled="isLocked('PITCH') || !pitch.trim()"`), so
// auto-build silently producing exactly that state is a real review-gate
// bypass, the same class of bug this store has repeatedly needed to close
// (canApproveAssets, batchDraftField/batchSetField, draftText's own
// approval-while-drafting guard) -- just reached via a discarded return value
// instead of a concurrency race. The GENERATE_ASSETS stage two lines below
// already gets this right (`const generated = await generateItemAsset(itemId
// ); if (!generated) return 'failed'`), which is exactly the shape this
// checker requires for the PITCH and FIELDS_AND_PROMPTS drafts too.
//
// This asserts the textual shape of the fix stays in place: every
// `await draftText(itemId, 'FIELD')` call inside autoBuildItem() is assigned
// to a local (not a bare/discarded statement), and an `if (!VAR) return
// 'failed'` guard on that same local appears strictly between the draftText
// call and the next call to approveStage() for that field's stage --
// deliberately scoped to this one function/bug, mirroring
// verifyModelBuilderCompletionGate.ts's preference for explicit, narrow
// textual checks over a general-purpose static analyzer.
//
// Also asserts a second, adjacent guard (same task, later cycle): before
// claiming autoBuildingItemSingleton, autoBuildItem() must bail out if a
// manual single-stage action (generatingItemId/committingItemId/
// draftingField) is already in flight for this item. Without it, clicking
// "Auto" while a manual "Generate candidate"/"Draft with AI"/"Execute
// commit" click is still running fires a second, concurrent request for the
// same stage -- the GENERATE_ASSETS case burns a real duplicate art
// generation call, since neither call's in-flight state blocks the other.
// Both of these entry guards return 'skipped' (not 'failed') -- t-037 gave
// autoBuildItem() a three-way outcome ('committed' | 'skipped' | 'failed') so
// batchAutoBuild/autoBuildRun can tell "busy, try again" apart from "broken."
//
// Also asserts a third, unrelated guard (same task, later cycle still): the
// function's own doc comment promises "draft what's empty," and the PITCH
// branch honors that (`if (!item.pitch.trim())` before drafting), but the
// artPrompt draftText call used to fire unconditionally whenever `wantArt`
// was true -- regardless of whether item.promptDraft already held content.
// promptDraft starts genuinely empty (unlike fieldsDraft, which is always
// pre-filled with a non-empty defaultFieldsTemplate skeleton and so can't
// use the same empty check), so a non-empty value there can only mean the
// user already typed their own generation prompt via the "Generation
// prompt" textarea before clicking Auto. Drafting over it unconditionally
// silently discarded that hand-typed prompt for a fresh, unreviewed AI one
// -- and generateItemAsset immediately renders art from it instead of what
// the user wrote. Fixed by gating the artPrompt draft behind
// `!item.promptDraft.trim()`, mirroring the PITCH branch.
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { extractFunctionBodies } from './verifyModelBuilderCompletionGate.js'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const repositoryRoot = resolve(scriptDirectory, '../..')

const STORE_PATH = join(repositoryRoot, 'stores/modelBuilderStore.ts')

const FN_NAME = 'autoBuildItem'

const DRAFT_GATES = [
  { field: 'pitch', stageKey: 'PITCH' },
  { field: 'fields', stageKey: 'FIELDS_AND_PROMPTS' },
  { field: 'artPrompt', stageKey: 'FIELDS_AND_PROMPTS' },
] as const

// Checks the fix's exact shape against the full source text of a file
// containing an `autoBuildItem`-named async function. Exported (rather than
// only exercised via main()) so the self-test below can run it against
// synthetic buggy/fixed fixtures without touching the real store file.
export function checkAutoBuildDraftGate(content: string): string[] {
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

  const claimIndex = fn.body.indexOf('autoBuildingItemSingleton.claim(item.id)')
  const reentrancyGuard =
    /if\s*\(\s*state\.autoBuildingItemId\s*===\s*item\.id\s*\)\s*return 'skipped'/.exec(
      fn.body,
    )
  if (
    claimIndex < 0 ||
    !reentrancyGuard ||
    reentrancyGuard.index > claimIndex
  ) {
    errors.push(
      `${FN_NAME}() must return 'skipped' when state.autoBuildingItemId ` +
        'already equals item.id before claiming autoBuildingItemSingleton. ' +
        'Without that entry guard, the item-level Auto action can overlap ' +
        'with batch or run-level auto-build for the same item and duplicate ' +
        'draft, render, or commit work.',
    )
  }

  // Accepts either the original inline three-condition check, or a call to
  // the shared isItemManualActionInFlight(item.id) helper (added later, same
  // task, to also cover item.queueState -- see
  // verifyModelBuilderAutoBuildQueuedGuard.ts for that half of the contract).
  // Both shapes return 'skipped' when a manual single-stage action is
  // already in flight for this item; which one is in place is not this
  // guard's concern, only that one of them is.
  const manualActionGuardInline =
    /state\.generatingItemId\s*===\s*item\.id[\s\S]{0,200}state\.committingItemId\s*===\s*item\.id[\s\S]{0,200}draftingField\.value\?\.itemId\s*===\s*item\.id[\s\S]{0,80}return 'skipped'/.exec(
      fn.body,
    )
  const manualActionGuardShared =
    /isItemManualActionInFlight\(item\.id\)[\s\S]{0,80}return 'skipped'/.exec(
      fn.body,
    )
  const manualActionGuard = manualActionGuardInline ?? manualActionGuardShared
  if (
    claimIndex < 0 ||
    !manualActionGuard ||
    manualActionGuard.index > claimIndex
  ) {
    errors.push(
      `${FN_NAME}() must return 'skipped' when a manual single-stage action ` +
        '(state.generatingItemId, state.committingItemId, or ' +
        "draftingField.value's itemId already matching item.id -- directly " +
        'or via the shared isItemManualActionInFlight(item.id) helper) is ' +
        'in flight for this item, before claiming autoBuildingItemSingleton. ' +
        'Without that guard, clicking Auto while a manual "Generate ' +
        'candidate" / "Draft with AI" / "Execute commit" is still running ' +
        'fires a second, concurrent request for the same stage -- for ' +
        'GENERATE_ASSETS this burns a real duplicate art-generation call. ' +
        "Returning 'skipped' (not 'failed') here also matters for " +
        'batchAutoBuild/autoBuildRun: it lets them report this item as busy ' +
        'rather than broken.',
    )
  }

  for (const { field, stageKey } of DRAFT_GATES) {
    const callPattern = new RegExp(
      `(?:const\\s+(\\w+)\\s*=\\s*)?await draftText\\(itemId, '${field}'\\)`,
    )
    const callMatch = callPattern.exec(fn.body)
    if (!callMatch) {
      errors.push(
        `${FN_NAME}() no longer calls await draftText(itemId, '${field}') -- ` +
          "this guard's anchor point has moved; re-check how this stage is " +
          'auto-drafted.',
      )
      continue
    }

    const varName = callMatch[1]
    if (!varName) {
      errors.push(
        `${FN_NAME}() calls await draftText(itemId, '${field}') without ` +
          'capturing its return value. draftText() can fail and leave the ' +
          "field's content unchanged (e.g. an empty pitch); a discarded " +
          `result means the '${stageKey}' stage below can still be ` +
          'approved even though the draft never actually landed.',
      )
      continue
    }

    const callEnd = callMatch.index + callMatch[0].length
    const approvePattern = new RegExp(`approveStage\\(itemId, '${stageKey}'\\)`)
    const approveMatch = approvePattern.exec(fn.body.slice(callEnd))
    if (!approveMatch) {
      errors.push(
        `${FN_NAME}() no longer calls approveStage(itemId, '${stageKey}') ` +
          `after drafting '${field}' -- this guard's anchor point has moved.`,
      )
      continue
    }
    const between = fn.body.slice(callEnd, callEnd + approveMatch.index)

    const guardPattern = new RegExp(`if \\(!${varName}\\)\\s*return 'failed'`)
    if (!guardPattern.test(between)) {
      errors.push(
        `${FN_NAME}() does not check \`if (!${varName}) return 'failed'\` ` +
          `between drafting '${field}' and approveStage(itemId, ` +
          `'${stageKey}'). Without this guard, a failed '${field}' draft ` +
          '(network error, "the model returned nothing useful", or an ' +
          "approval/edit race caught by draftText's own guards) still lets " +
          `'${stageKey}' be approved with the field's unchanged (possibly ` +
          'empty) content -- a state the manual Approve button in ' +
          'model-builder-item-panel.vue refuses to allow.',
      )
    }
  }

  // artPrompt-specific: draftText(itemId, 'artPrompt') must be gated behind
  // `!item.promptDraft.trim()` (immediately, not just "called somewhere in
  // the function") -- see the doc comment above for why promptDraft (unlike
  // fieldsDraft) is a reliable "did the user already type one?" signal.
  // Anchored to `wantArt && !item.promptDraft.trim()` as one condition,
  // mirroring the exact shape of the fix, rather than accepting the check
  // anywhere in an enclosing scope -- a `wantArt`-only outer if with the
  // promptDraft check missing must still fail.
  const artPromptEmptyGuard =
    /if \(\s*wantArt\s*&&\s*!item\.promptDraft\.trim\(\)\s*\)\s*\{[\s\S]{0,1200}?await draftText\(itemId, 'artPrompt'\)/.exec(
      fn.body,
    )
  if (!artPromptEmptyGuard) {
    errors.push(
      `${FN_NAME}() calls await draftText(itemId, 'artPrompt') without ` +
        'gating it behind `if (wantArt && !item.promptDraft.trim())`. ' +
        'promptDraft starts genuinely empty (unlike fieldsDraft, which is ' +
        'always pre-filled with a non-empty defaultFieldsTemplate skeleton), ' +
        'so a non-empty value can only mean the user already typed their ' +
        'own generation prompt via the "Generation prompt" textarea before ' +
        'clicking Auto. Drafting over it unconditionally silently discards ' +
        'that hand-typed prompt for a fresh, unreviewed AI one, and ' +
        'generateItemAsset then renders art from it instead of what the ' +
        'user wrote.',
    )
  }

  return errors
}

function main(): void {
  const content = readFileSync(STORE_PATH, 'utf8')
  const errors = checkAutoBuildDraftGate(content)

  if (errors.length) {
    console.error(
      'Model Builder auto-build draft gate contract failed for ' +
        `${FN_NAME}() in modelBuilderStore.ts:`,
    )
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log(
    `Model Builder auto-build draft gate contract passed: ${FN_NAME}() only ` +
      'approves a stage after confirming its draft actually succeeded.',
  )
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main()
}
