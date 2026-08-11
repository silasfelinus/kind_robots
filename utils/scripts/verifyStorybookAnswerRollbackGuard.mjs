// /utils/scripts/verifyStorybookAnswerRollbackGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). `answerCurrentBeat`
// records the reader's answer on the current beat and a new branchHistory
// entry, then calls `weaveBeat` to generate the next scene. If `weaveBeat`
// fails (a transient generateText error, an unparsable response, or a thrown
// error), the beat is left with an `answer` already set. That makes
// `awaitingAnswer` false (it requires `currentBeat && !currentBeat.answer`),
// disabling the composer -- and if the failure happens right after the
// opening beat, `canFinish` is also false (it requires >= 2 beats), so no
// "Finish this tale" escape exists either. The reader is soft-locked with no
// way forward except discarding the entire session.
//
// This asserts the fix's shape stays in place: `answerCurrentBeat` awaits
// `weaveBeat`'s result before returning, and on failure rolls the recorded
// answer and branchHistory entry back out so `awaitingAnswer` becomes true
// again and the reader can retry the same answer.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STORE_PATH = 'stores/storybookStore.ts'
const FN_NAME = 'answerCurrentBeat'

function extractFunctionBody(content, name) {
  const signaturePattern = new RegExp(`^ {2}async function ${name}\\s*\\(`, 'm')
  const match = signaturePattern.exec(content)
  if (!match) {
    throw new Error(
      `Could not find \` async function ${name}(\` in ${STORE_PATH} -- has ` +
        'it been renamed, removed, or inlined? If so, this guard (and the ' +
        'soft-lock it protects against) needs to move with it.',
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

const required = [
  [
    'const wove = await weaveBeat(',
    'must await weaveBeat and keep its result before deciding to roll back',
  ],
  ['if (!wove) {', 'must branch on a failed weaveBeat call'],
  [
    'beat.answer = undefined',
    'must clear the recorded answer on failure so awaitingAnswer can become true again',
  ],
  [
    'active.branchHistory.splice(historyIndex, 1)',
    'must remove the branchHistory entry it just pushed on failure',
  ],
  [
    'return wove',
    'must return the actual weaveBeat outcome, not a value computed before the rollback',
  ],
]

for (const [needle, why] of required) {
  assert.ok(
    body.includes(needle),
    `${FN_NAME}() no longer contains \`${needle}\` -- ${why}, or a failed ` +
      'weaveBeat call soft-locks the reader (composer disabled, no Finish ' +
      'button if the failure happens on the opening beat) with no way ' +
      'forward except discarding the whole session.',
  )
}

console.log(
  `Storybook answer-rollback guard contract passed: ${FN_NAME}() rolls back ` +
    'a failed weaveBeat call so the reader can retry instead of getting ' +
    'soft-locked.',
)
