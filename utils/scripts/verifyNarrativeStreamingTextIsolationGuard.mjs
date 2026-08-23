// /utils/scripts/verifyNarrativeStreamingTextIsolationGuard.mjs
//
// Regression guard (storybook/t-010, cycle 34). storybookStore.ts and
// taskmasterStore.ts each call the shared chatStore's `generateText()` from
// their own `weaveBeat()`, and both derived their `streamingText` computed
// from `chatStore.pendingText` -- a SINGLE module-level singleton
// (`pendingChatId`) shared across every `generateText` caller in the app,
// not scoped per caller.
//
// Neither store cancels its in-flight `weaveBeat()` call when the reader
// navigates away (no AbortController, and Pinia store state outlives the
// unmounted page component). Concrete failure: a reader leaves Storybook
// mid-scene while its `weaveBeat()` is still awaiting `generateText()`, then
// answers a Taskmaster beat before Storybook's call resolves. Taskmaster's
// own `generateText()` call overwrites the shared `pendingChatId`, so while
// both calls are in flight, `chatStore.pendingText` reflects whichever
// call's chat was created LAST -- if the reader returns to Storybook while
// its own call is still streaming, `streamingText` shows Taskmaster's prose
// under Storybook's "weaving the next scene" placeholder. Worse, whichever
// call's `finally` runs first unconditionally nulls `pendingChatId`, which
// can blank a still-streaming sibling call's `streamingText` back to empty
// (the loading-dots fallback) even though it has live text arriving.
//
// Fixed by giving each store its own `weavingChatId` ref, populated via
// `generateText()`'s new `onChatId` hook (fired synchronously once the chat
// row is created, before the function's own `await` settles) and read back
// through `chatStore.chatText(id)` -- a lookup scoped to that specific chat
// id, independent of the shared singleton. This asserts the fix's shape
// stays in place in both stores, and that the chatStore side (the hook and
// the scoped reader) hasn't been quietly removed out from under them.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const CHAT_STORE_PATH = 'stores/chatStore.ts'
const NARRATIVE_STORES = [
  { path: 'stores/storybookStore.ts', fn: 'weaveBeat' },
  { path: 'stores/taskmasterStore.ts', fn: 'weaveBeat' },
]

const chatStoreContent = readFileSync(
  resolve(process.cwd(), CHAT_STORE_PATH),
  'utf8',
)

// The scoped read side must still exist and stay independent of the shared
// `pendingChatId`/`pendingChat`/`pendingText` singleton -- it looks the id
// up in `chats.value` directly rather than delegating to `pendingChat`.
assert.ok(
  /function chatText\(chatId: number \| null\): string \{/.test(
    chatStoreContent,
  ),
  `${CHAT_STORE_PATH} no longer declares chatText(chatId) with its expected ` +
    'signature -- storybookStore/taskmasterStore rely on this to read their ' +
    "own in-flight chat's text without racing the shared pendingChatId " +
    'singleton.',
)
assert.ok(
  !/function chatText\([^)]*\)[^{]*\{\s*return pendingText/.test(
    chatStoreContent,
  ),
  `${CHAT_STORE_PATH}'s chatText() must read chats.value by the given id ` +
    'directly, not delegate to the shared pendingText/pendingChat singleton ' +
    '-- delegating would silently reopen the exact cross-caller race this ' +
    'guard exists to prevent.',
)

// generateText() must still offer callers a way to learn their own chat id
// synchronously, before the stream settles.
const generateTextSignatureIndex = chatStoreContent.indexOf(
  'async function generateText(',
)
assert.ok(
  generateTextSignatureIndex !== -1,
  `Could not find \`async function generateText(\` in ${CHAT_STORE_PATH} -- ` +
    'has it been renamed or restructured? If so, this guard needs to move ' +
    'with it.',
)
const generateTextTail = chatStoreContent.slice(generateTextSignatureIndex)
assert.ok(
  /hooks\.onChatId\?\.\(newChat\.id\)/.test(
    generateTextTail.slice(0, generateTextTail.indexOf('\n\n')),
  ) || /hooks\.onChatId\?\.\(newChat\.id\)/.test(generateTextTail),
  `generateText() in ${CHAT_STORE_PATH} no longer fires an onChatId hook ` +
    'with the newly created chat id -- storybookStore/taskmasterStore have ' +
    'no other way to learn which chat is theirs before the call resolves.',
)

for (const { path, fn } of NARRATIVE_STORES) {
  const content = readFileSync(resolve(process.cwd(), path), 'utf8')

  assert.ok(
    /const weavingChatId = ref<number \| null>\(null\)/.test(content),
    `${path} no longer declares its own \`weavingChatId\` ref -- without it, ` +
      'streamingText has nothing to scope its read to and falls back to the ' +
      'shared chatStore singleton, reopening the cross-store race.',
  )

  assert.ok(
    content.includes('chatStore.chatText(weavingChatId.value)'),
    `${path}'s streamingText computed no longer reads ` +
      'chatStore.chatText(weavingChatId.value) -- has it gone back to the ' +
      'shared chatStore.pendingText singleton? That singleton is shared by ' +
      'every generateText() caller in the app and does not distinguish ' +
      "which caller's chat is currently streaming.",
  )
  assert.ok(
    !/streamingText = computed\(\s*\(\)\s*=>\s*\n?\s*isWeaving\.value \? chatStore\.pendingText/.test(
      content,
    ),
    `${path}'s streamingText computed reads chatStore.pendingText directly ` +
      '-- this is the exact shared-singleton shape the fix replaced.',
  )

  const body = extractTsFunctionBody(content, fn, {
    path,
    notFoundHint:
      `has ${fn}() been renamed, removed, or restructured? If so, this ` +
      'guard (and the cross-store streaming-text race it protects against) ' +
      'needs to move with it.',
  })

  assert.ok(
    body.includes('onChatId:'),
    `${fn}() in ${path} no longer passes an onChatId hook to ` +
      'chatStore.generateText() -- without it, weavingChatId is never set ' +
      "and streamingText can't scope itself to this call's own chat.",
  )

  // weavingChatId must be reset to null both before the call starts (so a
  // stale id from a previous call can't briefly leak into this one) and in
  // the finally block (so a completed call stops claiming a chat id at
  // all, the same discipline isWeaving.value already follows).
  const setNullCount = (body.match(/weavingChatId\.value = null/g) ?? []).length
  assert.ok(
    setNullCount >= 2,
    `${fn}() in ${path} should reset weavingChatId.value to null both ` +
      'before starting a new call and in its finally block (found ' +
      `${setNullCount} reset(s)) -- without both, a stale id from a prior ` +
      "call, or a lingering id after this call's own completion, can " +
      'attribute streaming text to the wrong beat.',
  )
}

console.log(
  'Narrative streaming-text isolation guard contract passed: ' +
    'storybookStore.ts and taskmasterStore.ts each scope streamingText to ' +
    'their own in-flight chat id via chatStore.chatText(), rather than ' +
    'racing the shared chatStore.pendingText singleton.',
)
