// /utils/scripts/verifyStorybookAnswerInputPreservationGuard.mjs
//
// Regression guard for the server-backed Storybook turn loop. The retired
// client beat loop's `submitAnswer` (components/conductor/storybook-page.vue)
// optimistically cleared the composer's `answerInput` ref before awaiting
// `store.answerCurrentBeat()`, so a failed submission silently blanked the
// reader's typed answer with no way to recover it -- the bug
// verifyStorybookAnswerRollbackGuard's sibling guard protected against.
//
// The new engine's equivalent entry point, `submitWritten()` in
// components/storybook/storybook-reading.vue, never optimistically clears:
// it holds the typed text in a local `written` ref, awaits
// `runStore.writeMove()`, and only clears the ref once that call reports
// success. A failed move therefore leaves the reader's text exactly where
// they left it, with nothing to roll back.
//
// This asserts that shape stays in place: `submitWritten` captures
// `writeMove`'s outcome and clears `written` only inside the success branch,
// never unconditionally or before the await resolves.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const COMPONENT_PATH = 'components/storybook/storybook-reading.vue'
const FN_NAME = 'submitWritten'

const content = readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf8')
const body = extractTsFunctionBody(content, FN_NAME, {
  path: COMPONENT_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard (and the ' +
    'lost-answer bug it protects against) needs to move with it.',
})

const writeCall = body.indexOf('await runStore.writeMove(')
assert.ok(
  writeCall >= 0,
  `${FN_NAME}() no longer awaits runStore.writeMove() -- has the written-move ` +
    'call been renamed, inlined, or made fire-and-forget? A submission whose ' +
    'outcome is not awaited/captured cannot gate the input clear on success.',
)

const clearCall = body.indexOf("written.value = ''")
assert.ok(
  clearCall > writeCall,
  `${FN_NAME}() must not clear \`written\` before or without checking ` +
    "writeMove()'s outcome -- clearing unconditionally silently discards the " +
    "reader's typed answer on a failed submission with no way to recover it.",
)

const clearLine = body
  .slice(0, clearCall)
  .split('\n')
  .pop()
assert.ok(
  /\bif\s*\(\s*ok\s*\)/.test(clearLine ?? ''),
  `${FN_NAME}() must guard the \`written.value = ''\` clear on the captured ` +
    'writeMove() outcome (e.g. `if (ok) written.value = \'\'`), or a failed ' +
    "submission silently clears the reader's typed answer.",
)

console.log(
  `Storybook answer-input-preservation guard contract passed: ${FN_NAME}() ` +
    'clears the composer text only after a successful move, so a failed ' +
    'submission never discards what the reader typed.',
)
