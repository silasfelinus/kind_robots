// /utils/scripts/verifyNarratorSendMessageDreamSwitchGuard.mjs
//
// Regression guard (storybook/t-010, cycle 53). narratorStore.ts's
// `sendNarratorMessage()` awaits `chatStore.addChat()` and then
// `chatStore.streamResponse()` before pushing the new chat's id into
// `narratorSessionIds` -- the array `narratorSession` (and therefore
// `isNarratorResponding`/the visible chat log) is filtered against.
//
// The store also watches `activeDream.value?.id` and resets
// `narratorSessionIds.value = []` the moment the active Dream changes, on
// the assumption that a Dream's narrator session is scoped to that Dream.
// Nothing coordinated the two: if the user sends a narrator message, then
// switches to a different Dream before `addChat()`/`streamResponse()`
// resolve, the abandoned send's `.then` continuation still ran, still
// pushed the old Dream's chat id into (the now-reset) `narratorSessionIds`,
// and still streamed a response into it -- resurrecting a message from a
// Dream the user already left under the new Dream's narrator panel.
//
// Fixed with a `narratorSessionEpoch` counter, bumped by the
// `activeDream.value?.id` watch and captured by `sendNarratorMessage()`
// before its first await; every state mutation after an await re-checks it
// and bails out silently on a mismatch, the same shape as
// modelBuilderStore.ts's `openRunRequestId` guard
// (verifyModelBuilderResetOpenRunGuard.ts). This asserts the fix's textual
// shape stays in place, deliberately scoped to this one bug.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const STORE_PATH = 'stores/narratorStore.ts'
const content = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')

assert.ok(
  /let narratorSessionEpoch = 0/.test(content),
  `${STORE_PATH} no longer declares \`let narratorSessionEpoch = 0\` -- ` +
    'without it, sendNarratorMessage() has no way to tell whether the ' +
    'active Dream changed while its own addChat()/streamResponse() calls ' +
    'were still in flight.',
)

const watchIndex = content.indexOf('() => activeDream.value?.id,')
assert.ok(
  watchIndex !== -1,
  `Could not find the \`activeDream.value?.id\` watch in ${STORE_PATH} -- ` +
    'has it been renamed or restructured? If so, this guard needs to move ' +
    'with it.',
)
const watchTail = content.slice(watchIndex, watchIndex + 400)
assert.ok(
  /narratorSessionEpoch\+\+/.test(watchTail) &&
    watchTail.indexOf('narratorSessionEpoch++') <
      watchTail.indexOf('narratorSessionIds.value = []'),
  `The \`activeDream.value?.id\` watch in ${STORE_PATH} must bump ` +
    '`narratorSessionEpoch` before clearing `narratorSessionIds` -- ' +
    'bumping it anywhere else (or not at all) leaves an in-flight ' +
    'sendNarratorMessage() unable to detect the Dream switch.',
)

const body = extractTsFunctionBody(content, 'sendNarratorMessage', {
  path: STORE_PATH,
  notFoundHint:
    'has sendNarratorMessage() been renamed, removed, or restructured? If ' +
    'so, this guard (and the cross-Dream chat-leak race it protects ' +
    'against) needs to move with it.',
})

assert.ok(
  /const requestEpoch = narratorSessionEpoch/.test(body),
  'sendNarratorMessage() no longer captures `requestEpoch` from ' +
    '`narratorSessionEpoch` before its first await -- without a value ' +
    'captured up front, there is nothing to compare against after ' +
    'addChat()/streamResponse() resolve.',
)

const guardCount = (body.match(/requestEpoch !== narratorSessionEpoch/g) ?? [])
  .length
assert.ok(
  guardCount >= 3,
  'sendNarratorMessage() should re-check `requestEpoch !== ' +
    'narratorSessionEpoch` after addChat() resolves, after ' +
    'streamResponse() resolves, and in the catch block (found ' +
    `${guardCount} check(s)) -- missing any of the three lets an ` +
    "abandoned send still push its chat id into a different Dream's " +
    'narratorSessionIds, resurrect it via streamResponse(), or overwrite ' +
    "that Dream's status/emotion on failure.",
)

// The push into narratorSessionIds must happen strictly after the first
// epoch check -- guarding only streamResponse() would still let an
// abandoned send's chat id leak into the new Dream's session list.
const pushIndex = body.indexOf('narratorSessionIds.value.push(newChat.id)')
const firstGuardIndex = body.indexOf('requestEpoch !== narratorSessionEpoch')
assert.ok(
  pushIndex !== -1 && firstGuardIndex !== -1 && firstGuardIndex < pushIndex,
  'sendNarratorMessage() must check `requestEpoch !== narratorSessionEpoch` ' +
    'before pushing the new chat id into `narratorSessionIds` -- pushing ' +
    'first (or not guarding at all) is the exact cross-Dream chat-leak ' +
    'this guard exists to prevent.',
)

console.log(
  'Narrator send-message Dream-switch guard contract passed: ' +
    'sendNarratorMessage() cannot resurrect an abandoned chat under a ' +
    "different Dream's narratorSessionIds after the active Dream changes " +
    'mid-request.',
)
