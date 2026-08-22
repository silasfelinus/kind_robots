// /utils/scripts/verifyStorybookRestoreIdempotencyGuard.mjs
//
// Regression guard (storybook/t-010, cycle 28). content/storybook.md mounts
// `:storybook-library-page`, which renders `<StorybookPage />` as a child --
// so both components' onMounted() hooks run on the same page load, the
// child's (storybook-page.vue) first, then the parent's
// (storybook-library-page.vue), same synchronous tick, no await between them
// (the exact mount-order proven in verifyStorybookSeedQueryRaceGuard's own
// header comment). BOTH onMounted hooks call `storyStore.restoreFromLocalStorage()`.
//
// storybook-page.vue's onMounted also calls seedFromQuery() immediately after
// that first restore, mutating `setupDraft` in place to seed an ingredient
// from a deep link such as `?character=<slug>` (character-manager.vue's
// "Start a story with this character" link sends exactly this). That
// mutation only *schedules* persist() -- the store's deep watch on
// `setupDraft` -- as a microtask; it does not flush until after both
// onMounted hooks return.
//
// Before this fix, restoreFromLocalStorage() re-read and overwrote
// `setupDraft.value` unconditionally on every call, with no guard against
// being called twice (unlike the session-restore branch inside the same
// function, which already checked `!session.value`). So the parent's
// redundant second call re-read the *pre-seed* draft still sitting in
// localStorage and clobbered the just-seeded setupDraft, silently discarding
// the deep-linked ingredient on every visit where the reader had ever saved a
// setup draft before -- routine, since the draft persists continuously while
// the setup form is open.
//
// This asserts the fix's shape stays in place: restoreFromLocalStorage()
// guards its own entry with a one-time flag (the same pattern
// hydrateStorybookMode() already uses via `modeHydrated`), so a second call
// within the same app session -- regardless of which caller wins the mount
// race -- is a no-op rather than re-reading and overwriting setupDraft.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { extractTsFunctionBody } from './lib/extractTsFunctionBody.mjs'

const STORE_PATH = 'stores/storybookStore.ts'
const PAGE_PATH = 'components/pages/storybook-library-page.vue'
const COMPONENT_PATH = 'components/conductor/storybook-page.vue'
const FN_NAME = 'restoreFromLocalStorage'

const storeContent = readFileSync(resolve(process.cwd(), STORE_PATH), 'utf8')

const body = extractTsFunctionBody(storeContent, FN_NAME, {
  path: STORE_PATH,
  notFoundHint:
    'has it been renamed, removed, or inlined? If so, this guard (and the ' +
    'restore-idempotency race it protects against) needs to move with it.',
})

// The guard clause must reject a second call outright, before any
// localStorage read happens -- not just re-guard the session branch the way
// it already did before this fix.
assert.ok(
  /if\s*\(\s*restoredFromStorage\s*\|\|\s*typeof localStorage === 'undefined'\s*\)\s*return/.test(
    body,
  ),
  `${FN_NAME}() in ${STORE_PATH} must start with ` +
    `\`if (restoredFromStorage || typeof localStorage === 'undefined') return\` -- ` +
    'without it, a second call (from either onMounted hook in the ' +
    'storybook-library-page.vue / storybook-page.vue mount-order race) ' +
    're-reads and overwrites setupDraft.value from localStorage, silently ' +
    'discarding whatever seedFromQuery() just seeded into it from the URL.',
)

assert.ok(
  /restoredFromStorage\s*=\s*true/.test(body),
  `${FN_NAME}() in ${STORE_PATH} must set \`restoredFromStorage = true\` so ` +
    'the guard above actually takes effect on the next call.',
)

// The flag must be declared once at store-setup scope (matching
// modeHydrated's own pattern), not re-declared inside the function itself --
// a local redeclaration would reset to false on every call and defeat the
// guard entirely.
assert.ok(
  /let restoredFromStorage = false/.test(storeContent) &&
    !/function restoreFromLocalStorage\(\)\s*\{\s*\n\s*let restoredFromStorage/.test(
      storeContent,
    ),
  `${STORE_PATH} must declare \`let restoredFromStorage = false\` once at ` +
    'the store-setup scope that closes over ' +
    `${FN_NAME}(), the same way it already declares \`modeHydrated\` -- a ` +
    'flag re-declared inside the function body would reset on every call ' +
    'and never guard anything.',
)

// The session-restore branch's own narrower guard must still be in place --
// this fix adds a function-level guard, it does not replace the existing
// `!session.value` check the session branch relies on.
assert.ok(
  body.includes('sessionRaw && !session.value'),
  `${FN_NAME}() in ${STORE_PATH} must still gate session restoration on ` +
    '`sessionRaw && !session.value` -- this fix guards the whole function ' +
    'entry additionally, it does not replace that existing check.',
)

// Both real-world callers must still exist -- otherwise this guard is
// asserting a fix for a race that no caller can actually trigger anymore.
const pageContent = readFileSync(resolve(process.cwd(), PAGE_PATH), 'utf8')
const componentContent = readFileSync(
  resolve(process.cwd(), COMPONENT_PATH),
  'utf8',
)
assert.ok(
  pageContent.includes('storyStore.restoreFromLocalStorage()'),
  `${PAGE_PATH} no longer calls storyStore.restoreFromLocalStorage() from ` +
    'its onMounted() -- if this changed, confirm the mount-order race this ' +
    'guard protects against is still reachable, or retire this guard.',
)
assert.ok(
  componentContent.includes('store.restoreFromLocalStorage()'),
  `${COMPONENT_PATH} no longer calls store.restoreFromLocalStorage() from ` +
    'its onMounted() -- if this changed, confirm the mount-order race this ' +
    'guard protects against is still reachable, or retire this guard.',
)

console.log(
  'Storybook restore-idempotency guard contract passed: ' +
    `${FN_NAME}() guards its own entry with a one-time flag, so the ` +
    'parent/child onMounted mount-order race can no longer re-read and ' +
    "overwrite a just-seeded setupDraft with localStorage's stale, " +
    'pre-seed contents.',
)
