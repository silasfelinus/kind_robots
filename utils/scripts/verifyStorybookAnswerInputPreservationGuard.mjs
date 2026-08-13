// /utils/scripts/verifyStorybookAnswerInputPreservationGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). `submitAnswer` in
// components/conductor/storybook-page.vue optimistically clears the
// composer's `answerInput` ref before awaiting `store.answerCurrentBeat()`.
// `NarrativeResponseComposer` is a fully controlled component (its textarea
// binds `:value="modelValue"` with no local text state), so `answerInput` is
// the only place the reader's typed answer lives once submitted.
//
// `answerCurrentBeat`'s own rollback (see verifyStorybookAnswerRollbackGuard)
// restores STORE consistency when the follow-up `weaveBeat` call fails --
// but it has no way to restore the composer's local text. Without a matching
// UI-level restore, a reader whose submission hits a transient generateText
// failure sees the textarea silently go blank and has to recall and retype
// their entire answer, with no indication their submission was lost rather
// than accepted.
//
// This asserts the fix's shape stays in place: `submitAnswer` captures
// `answerCurrentBeat`'s outcome and, on failure, restores `answerInput` to
// the submitted value.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const COMPONENT_PATH = 'components/conductor/storybook-page.vue'
const FN_NAME = 'submitAnswer'

function extractFunctionBody(content, name) {
  const signaturePattern = new RegExp(`^async function ${name}\\s*\\(`, 'm')
  const match = signaturePattern.exec(content)
  if (!match) {
    throw new Error(
      `Could not find \`async function ${name}(\` in ${COMPONENT_PATH} -- ` +
        'has it been renamed, removed, or inlined? If so, this guard (and ' +
        'the lost-answer bug it protects against) needs to move with it.',
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

const content = readFileSync(resolve(process.cwd(), COMPONENT_PATH), 'utf8')
const body = extractFunctionBody(content, FN_NAME)

const required = [
  [
    'const wove = await store.answerCurrentBeat(',
    "must capture answerCurrentBeat's outcome instead of discarding it",
  ],
  [
    '!wove && store.errorMessage',
    'must branch on a real weaveBeat failure (errorMessage set), not just a falsy return',
  ],
  [
    'answerInput.value = value',
    'must restore the submitted text into answerInput on failure so the reader does not have to retype it',
  ],
]

for (const [needle, why] of required) {
  assert.ok(
    body.includes(needle),
    `${FN_NAME}() no longer contains \`${needle}\` -- ${why}, or a failed ` +
      "submission silently clears the reader's typed answer with no way " +
      'to recover it.',
  )
}

console.log(
  `Storybook answer-input-preservation guard contract passed: ${FN_NAME}() ` +
    'restores the composer text on a failed submission instead of ' +
    'silently discarding it.',
)
