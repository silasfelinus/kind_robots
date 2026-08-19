// /utils/scripts/verifyStorybookConfirmArmScopeGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). Two destructive
// actions -- "New story" (storybook-page.vue) and "Restart" (storybook-
// library-page.vue) -- use an arm-then-confirm pattern: one click swaps the
// button to a warning-colored "Discard this tale?" / "Restart from the
// beginning?" confirmation, and only a SECOND click on that same control
// fires the destructive action (`startAnother()` / `restartCurrent()`).
//
// Both `newStoryArmed` and `restartArmed` are plain component-local refs with
// no concept of which session they were armed for. Several ordinary actions
// swap `store.session` out from under an armed-but-unconfirmed button without
// ever running the confirm handler that resets it:
//   - storybook-library-page.vue's "New story" button (`startNewStory()`)
//     while storybook-page.vue's own "New story" control is armed.
//   - Opening a different story, duplicating the current one, or restarting
//     successfully, all from storybook-library-page.vue, while its OWN
//     "Restart" control is armed.
// `v-if="store.session"` / `v-if="storyStore.session"` keeps the toolbar
// visible across every one of those transitions (a session still exists --
// just a different one), so the armed button renders straight into the next
// session: a single click that looks like the plain, first-press "New
// story"/"Restart" affordance (in a reader's memory of what that region
// usually shows) instead fires the destructive action immediately, with no
// fresh confirmation ever given for the story actually on screen.
//
// This asserts the fix's shape stays in place: both components reset their
// arm ref to `false` inside a `watch()` on the active session's id, so ANY
// session-identity change -- regardless of which action caused it -- clears
// a stale arm before the reader can land on it.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

// Pulls the full `watch(...)` call starting at a literal anchor found inside
// it, by paren-depth matching forward from the `watch(` that precedes the
// anchor. Anchors below are written to start with `watch(` itself so the
// opening paren's position is unambiguous.
function extractWatchCall(content, anchor, { path } = {}) {
  const anchorIndex = content.indexOf(anchor)
  assert.ok(
    anchorIndex >= 0,
    `Could not find \`${anchor}\` in ${path} -- has this watcher been ` +
      'renamed, removed, or restructured? If so, this guard (and the ' +
      'stale-arm bug it protects against) needs to move with it.',
  )
  const openParen = anchorIndex + anchor.indexOf('(')
  let depth = 0
  let i = openParen
  for (; i < content.length; i++) {
    if (content[i] === '(') depth++
    else if (content[i] === ')') {
      depth--
      if (depth === 0) break
    }
  }
  return content.slice(openParen, i + 1)
}

const LIBRARY_PAGE_PATH = 'components/pages/storybook-library-page.vue'
const STUDIO_PAGE_PATH = 'components/conductor/storybook-page.vue'

const libraryPage = source(LIBRARY_PAGE_PATH)
const studioPage = source(STUDIO_PAGE_PATH)

// --- storybook-library-page.vue: restartArmed scoped to session id ---

const restartWatch = extractWatchCall(
  libraryPage,
  'watch(\n  () => storyStore.session?.id ?? null,\n  (sessionId) => {',
  { path: LIBRARY_PAGE_PATH },
)

assert.ok(
  restartWatch.includes('restartArmed.value = false'),
  `The session-id watcher in ${LIBRARY_PAGE_PATH} no longer resets ` +
    '`restartArmed.value = false` -- without it, an armed "Restart from ' +
    'the beginning?" button survives opening a different story, ' +
    'duplicating, or restarting, and stays primed to fire on the next ' +
    'session with a single, unconfirmed click.',
)

const restartResetIndex = restartWatch.indexOf('restartArmed.value = false')
const restartQueryIndex = restartWatch.indexOf(
  'if (sessionId !== queryStoryId()) updateStoryQuery(sessionId)',
)
assert.ok(
  restartResetIndex >= 0 && restartQueryIndex > restartResetIndex,
  `${LIBRARY_PAGE_PATH}'s session-id watcher must reset \`restartArmed\` ` +
    'unconditionally on every session change (ahead of the `?story=` sync), ' +
    'not only on the branch that also happens to touch the query string.',
)

// --- storybook-page.vue: newStoryArmed scoped to session id ---

assert.ok(
  /import\s*\{[^}]*\bwatch\b[^}]*\}\s*from\s*'vue'/.test(studioPage),
  `${STUDIO_PAGE_PATH} must import \`watch\` from 'vue' to scope ` +
    '`newStoryArmed` to the active session.',
)

const newStoryWatch = extractWatchCall(
  studioPage,
  'watch(\n  () => store.session?.id ?? null,\n  () => {',
  { path: STUDIO_PAGE_PATH },
)

assert.ok(
  newStoryWatch.includes('newStoryArmed.value = false'),
  `The session-id watcher in ${STUDIO_PAGE_PATH} no longer resets ` +
    '`newStoryArmed.value = false` -- without it, an armed "Discard this ' +
    'tale?" button survives storybook-library-page.vue swapping the active ' +
    'session (open/duplicate/restart), and stays primed to fire on the ' +
    'next session with a single, unconfirmed click.',
)

console.log(
  'Storybook confirm-arm session-scope guard contract passed: both ' +
    '`newStoryArmed` and `restartArmed` reset whenever the active session ' +
    "id changes, so a stale confirmation can't survive onto a different " +
    'story.',
)
