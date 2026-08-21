// /utils/scripts/verifyStorybookLibraryNewStoryConfirmGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish, cycle 24). Every other
// destructive control in storybook-library-page.vue's persistent header --
// its own "Restart" button, and storybook-page.vue's own "New story" button
// (see verifyStorybookConfirmArmScopeGuard.mjs) -- uses an arm-then-confirm
// pattern: one click swaps the button to a warning-colored confirmation, and
// only a SECOND click on that same control fires the destructive action.
//
// storybook-library-page.vue's OWN "New story" button (`startNewStory()`) had
// no such guard at all: it fired immediately on a single click, ending the
// active session with zero confirmation, right next to a "Restart" button
// that requires two clicks for what is an equally disruptive action (both
// archive the outgoing session to the library first via
// upsert()/archiveCurrent(), so this was never about data loss -- it was
// about an unconfirmed, single-click destructive action sitting beside its
// own two-click sibling in the same header, and inconsistent with
// storybook-page.vue's own "New story" button, which the very comment in
// that file's code explains exists specifically "so an in-progress or
// finished tale can't be discarded by a single stray click"). The prior
// arm-scope guard's own commentary even names storybook-library-page.vue's
// "New story" button as a HAZARD to other components' armed state, without
// ever noticing this button had no arm state of its own to go stale.
//
// Fix: startNewStory() now sits behind the same v-if="!newStoryArmed" /
// v-else two-button pattern as "Restart", with its own `newStoryArmed` ref
// reset inside the same session-id watcher that already resets
// `restartArmed` -- so an armed-but-unconfirmed "Discard this tale?" can't
// survive a session-identity change either, extending the exact fix
// verifyStorybookConfirmArmScopeGuard.mjs already protects to this third
// control.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

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
const libraryPage = source(LIBRARY_PAGE_PATH)

// --- the ref exists ---

assert.ok(
  /const\s+newStoryArmed\s*=\s*ref\(false\)/.test(libraryPage),
  `${LIBRARY_PAGE_PATH} must declare \`const newStoryArmed = ref(false)\` -- ` +
    'the arm state for its own "New story" confirmation.',
)

// --- the template renders the two-button arm-then-confirm pair ---

const armedButtonIndex = libraryPage.indexOf('v-if="!newStoryArmed"')
assert.ok(
  armedButtonIndex >= 0,
  `${LIBRARY_PAGE_PATH}'s "New story" button must be gated behind ` +
    '`v-if="!newStoryArmed"` -- without it, the button has no first-press ' +
    'state distinct from its destructive, confirmed state.',
)

const confirmButtonSlice = libraryPage.slice(
  armedButtonIndex,
  armedButtonIndex + 1200,
)
assert.ok(
  /@click="newStoryArmed = true"/.test(confirmButtonSlice),
  `${LIBRARY_PAGE_PATH}'s unarmed "New story" button must arm on click ` +
    '(`newStoryArmed = true`) rather than firing `startNewStory()` directly ' +
    '-- a single accidental click must not end the active session.',
)
assert.ok(
  /v-else[\s\S]{0,300}@click="startNewStory"[\s\S]{0,120}@blur="newStoryArmed = false"/.test(
    confirmButtonSlice,
  ),
  `${LIBRARY_PAGE_PATH} must render a \`v-else\` confirmation button that ` +
    'calls `startNewStory()` on click and resets `newStoryArmed` on blur, ' +
    'matching the "Restart" button\'s established two-click pattern right ' +
    'beside it.',
)

// --- startNewStory() resets its own arm on every call ---

const startNewStoryMatch = libraryPage.match(
  /function startNewStory\(\)[^{]*\{([\s\S]*?)\n\}/,
)
assert.ok(
  startNewStoryMatch,
  `Could not find \`function startNewStory()\` in ${LIBRARY_PAGE_PATH} -- ` +
    'has it been renamed or restructured?',
)
assert.ok(
  startNewStoryMatch[1].includes('newStoryArmed.value = false'),
  `${LIBRARY_PAGE_PATH}'s startNewStory() must reset ` +
    "`newStoryArmed.value = false` (matching restartCurrent()'s own " +
    'reset of `restartArmed`), so the button returns to its unarmed state ' +
    'once the action has fired.',
)

// --- the session-id watcher resets newStoryArmed too, alongside restartArmed ---

const sessionWatch = extractWatchCall(
  libraryPage,
  'watch(\n  () => storyStore.session?.id ?? null,\n  (sessionId) => {',
  { path: LIBRARY_PAGE_PATH },
)

assert.ok(
  sessionWatch.includes('restartArmed.value = false') &&
    sessionWatch.includes('newStoryArmed.value = false'),
  `${LIBRARY_PAGE_PATH}'s session-id watcher must reset BOTH ` +
    '`restartArmed.value = false` and `newStoryArmed.value = false` -- ' +
    'without the latter, an armed "Discard this tale?" button survives ' +
    'opening a different story, duplicating, or restarting, and stays ' +
    'primed to fire on the next session with a single, unconfirmed click.',
)

console.log(
  'Storybook library "New story" confirm guard contract passed: the ' +
    'library page\'s own "New story" control now requires the same ' +
    'arm-then-confirm two-click pattern as its "Restart" sibling and ' +
    "storybook-page.vue's own control, and its arm resets whenever the " +
    'active session id changes.',
)
