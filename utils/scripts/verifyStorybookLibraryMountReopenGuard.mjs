// /utils/scripts/verifyStorybookLibraryMountReopenGuard.mjs
//
// Regression guard (storybook/t-010, front-end polish). storybook-library-page.vue
// keeps `?story=<id>` in sync with the active session while playing: every time
// `storyStore.session?.id` changes, a watcher writes it into the route query via
// `updateStoryQuery()`. That means on ANY ordinary page reload mid-story -- not
// a rare case, the normal one -- `route.query.story` already equals the id of
// the session `restoreFromLocalStorage()` is about to restore from
// STORAGE_KEY.
//
// `onMounted()` used to call `storyStore.openStory(directId)` unconditionally
// whenever a `?story=` query param was present, with no check for whether it
// already matched the session `restoreFromLocalStorage()` just restored. Since
// that is true on every normal reload with an active story, `openStory()` ran
// redundantly every time: it re-clones the just-restored session into a new
// object and, critically, calls `resumeNarrativeArtJobs()` a SECOND time on
// top of the one `restoreFromLocalStorage()` already performed.
//
// For a beat whose illustration was still `queued`/`rendering`, that just
// doubles a status poll. But for a beat whose art enqueue never reached the
// server before the reload -- status still `queueing`, no `jobId` yet, the
// real window between the optimistic local update and the resolved POST --
// `resume()` routes through `recoverOrSubmit()`, which GETs for an existing
// job and, finding none, submits a fresh one. Two concurrent
// `resumeNarrativeArtJobs()` calls for the same beat independently repeat that
// GET-then-submit sequence, so both can find nothing and both submit --
// generating and billing two illustrations for one beat instead of one.
//
// The reactive counterpart just below in the same file (the
// `route.query.story` watcher) already guards this exact call with
// `value === storyStore.session?.id`; only the mount-time call lacked it. This
// asserts mount uses the same guard, so opening only actually happens when it
// would switch sessions.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PAGE_PATH = 'components/pages/storybook-library-page.vue'

function extractOnMountedBody(content) {
  const signature = /onMounted\(\(\)\s*=>\s*\{/
  const match = signature.exec(content)
  if (!match) {
    throw new Error(
      `Could not find \`onMounted(() => {\` in ${PAGE_PATH} -- has it been ` +
        'renamed, removed, or restructured? If so, this guard (and the ' +
        'redundant-reopen bug it protects against) needs to move with it.',
    )
  }
  const braceOpen = match.index + match[0].length - 1
  let braceDepth = 0
  let i = braceOpen
  for (; i < content.length; i++) {
    if (content[i] === '{') braceDepth++
    else if (content[i] === '}') {
      braceDepth--
      if (braceDepth === 0) break
    }
  }
  return content.slice(braceOpen, i + 1)
}

const content = readFileSync(resolve(process.cwd(), PAGE_PATH), 'utf8')
const body = extractOnMountedBody(content)

assert.ok(
  /if\s*\(\s*directId\s*&&\s*directId\s*!==\s*storyStore\.session\?\.id\s*\)/.test(
    body,
  ),
  `onMounted() in ${PAGE_PATH} must only call storyStore.openStory(directId) ` +
    'when directId differs from the session restoreFromLocalStorage() just ' +
    'restored -- otherwise every ordinary reload mid-story (where ?story= ' +
    "already matches the restored session, since the page's own watcher " +
    'keeps them in sync while playing) calls openStory() redundantly, ' +
    'double-invoking resumeNarrativeArtJobs() and risking two billed art ' +
    'jobs for one beat whose enqueue POST was still in flight at reload.',
)

assert.ok(
  /storyStore\.openStory\(directId\)/.test(body),
  `onMounted() in ${PAGE_PATH} no longer calls storyStore.openStory(directId) ` +
    'at all -- has direct-link story opening moved elsewhere? If so, this ' +
    'guard needs to move with it.',
)

// The reactive counterpart must keep the same guard shape it already had --
// otherwise this fix only covers the mount path while a future edit could
// reintroduce the redundant call on the reactive one.
assert.ok(
  /value === storyStore\.session\?\.id/.test(content),
  `${PAGE_PATH} must still guard the route.query.story watcher's ` +
    'storyStore.openStory() call against re-opening the already-active ' +
    'session, matching the guard mount now uses.',
)

console.log(
  'Storybook library mount-reopen guard contract passed: onMounted() only ' +
    'opens a story from ?story= when it would actually switch sessions, so ' +
    'an ordinary reload mid-story no longer double-invokes ' +
    'resumeNarrativeArtJobs() and risks double-billing an in-flight ' +
    "beat's illustration.",
)
