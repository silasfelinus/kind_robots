// /utils/scripts/verifyStorybookAnswerRollbackGuard.mjs
//
// Regression guard for the server-backed Storybook turn loop. The retired
// client beat loop used to optimistically write an answer and branch-history
// entry before narration completed, so its guard had to prove those mutations
// were rolled back when generation failed. The new engine keeps canonical turn
// state on the server: submitMove() sends the move, waits for a successful
// response, and only then appends the returned turn and applies the next-turn
// payload. A failed request therefore has nothing local to roll back.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STORE_PATH = 'stores/storybookRunStore.ts'
const FN_NAME = 'submitMove'

function extractFunctionBody(content, name) {
  const signaturePattern = new RegExp(`^  async function ${name}\\s*\\(`, 'm')
  const match = signaturePattern.exec(content)
  if (!match) {
    throw new Error(
      `Could not find async function ${name}( in ${STORE_PATH}; move this guard ` +
        'with the server-backed turn submission path if it is renamed.',
    )
  }

  const parenOpen = match.index + match[0].length - 1
  let parenDepth = 0
  let i = parenOpen
  for (; i < content.length; i++) {
    if (content[i] === '(') parenDepth++
    else if (content[i] === ')') {
      parenDepth--
      if (parenDepth === 0) break
    }
  }
  const braceOpen = content.indexOf('{', i)
  let braceDepth = 0
  let j = braceOpen
  for (; j < content.length; j++) {
    if (content[j] === '{') braceDepth++
    else if (content[j] === '}') {
      braceDepth--
      if (braceDepth === 0) break
    }
  }
  return content.slice(braceOpen, j + 1)
}

const content = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')
const body = extractFunctionBody(content, FN_NAME)

const failureCheck = body.indexOf('if (!response.success || !response.data)')
const turnRead = body.indexOf('const turn = payload.turn as StorybookRunTurn | null')
const turnAppend = body.indexOf('turns.value = [...turns.value, turn]')
const payloadApply = body.indexOf('applyTurnPayload(payload)')

assert.ok(failureCheck >= 0, 'submitMove() must reject an unsuccessful server response')
assert.ok(turnRead > failureCheck, 'returned turn state must be read only after success')
assert.ok(turnAppend > turnRead, 'turn history must append only after a returned turn exists')
assert.ok(payloadApply > turnAppend, 'next-turn state must apply only after the successful turn append')

for (const staleMutation of [
  'beat.answer =',
  'branchHistory.push',
  'branchHistory.splice',
]) {
  assert.ok(
    !body.includes(staleMutation),
    `submitMove() must not revive client beat-loop mutation ${staleMutation}`,
  )
}

console.log(
  'Storybook failed-turn recovery contract passed: the server-backed run store ' +
    'mutates local turn state only after a successful response, so a failed ' +
    'narration leaves the current scene retryable without client rollback.',
)
