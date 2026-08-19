// /utils/scripts/verifyStorybookActiveStoryResumeGuard.ts
//
// Regression guard (storybook/t-010, front-end polish). storybook-library-page.vue
// shows the CURRENT story's own card in the "Recent stories" panel while it is
// actively playing -- storybookLibraryHelper.ts's `upsert()` archives the live
// session into the library on every mutation via its deep watcher, so the
// active story is always present (usually first, being the most recently
// updated). Its card renders the same "Resume"/"Open" button every other
// story's card does, wired straight to `storyStore.openStory(story.id)`.
//
// openStory() in storybookLibraryHelper.ts used to fall through unconditionally
// once it found a matching session -- cloning it fresh via `bridge.setSession()`
// and calling `bridge.resumeNarrativeArtJobs()` again, even when the requested
// id was already the live, active session. That is exactly the redundant-resume
// bug verifyStorybookLibraryMountReopenGuard.mjs already fixed for two other
// entry points into this same function (storybook-library-page.vue's
// onMounted() and its route.query.story watcher, both of which guard their own
// call with `=== storyStore.session?.id` before ever calling openStory()) --
// but that fix lived at the CALL SITES, not inside openStory() itself, so the
// "Resume" button on the current story's own card -- a third, independent
// caller with no such guard -- still reached the unprotected fall-through.
//
// For a beat whose art enqueue is still mid-flight (status 'queueing', no
// jobId yet -- the real window between the optimistic local status write and
// the resolved POST), two independent resumeNarrativeArtJobs() calls each
// find no existing job via recoverOrSubmit() and each submit one, billing two
// illustrations for a single beat.
//
// This exercises openStory() directly against a fake bridge (no Nuxt/Pinia
// runtime needed -- storybookLibraryHelper.ts's only non-type dependency is
// Vue's core reactivity) and asserts that requesting the id already loaded as
// the live session is a no-op: no re-clone, no second resume.
import assert from 'node:assert/strict'
import { createStorybookLibraryController } from '../../stores/helpers/storybookLibraryHelper'
import type { StorybookSession } from '../../stores/storybookStore'

function emptyStateDelta() {
  return {
    consequences: [],
    relationshipShifts: [],
    inventoryAdd: [],
    inventoryRemove: [],
  }
}

function activeSession(id: string): StorybookSession {
  return {
    id,
    userId: 1,
    bible: {
      title: 'The Clockwork Orchard',
      premise: 'A premise.',
      narratorStyle: 'cinematic',
      structure: 'chaptered',
      cast: [],
      facets: [],
      rewards: [],
      createdAt: '2026-08-17T00:00:00.000Z',
    },
    beats: [
      {
        id: 'beat-1',
        sessionId: id,
        narrative: 'The orchard hums at midnight.',
        question: 'What do you touch first?',
        stateDelta: emptyStateDelta(),
        createdAt: '2026-08-17T00:00:00.000Z',
      },
    ],
    branchHistory: [],
    consequences: [],
    inventory: [],
    stateVersion: 1,
    status: 'active',
    createdAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z',
  }
}

let current: StorybookSession | null = activeSession('story-active')
let setSessionCalls = 0
let resumeCalls = 0

const bridge = {
  getSession: () => current,
  setSession: (next: StorybookSession) => {
    setSessionCalls += 1
    current = next
  },
  isWeaving: () => false,
  resumeNarrativeArtJobs: () => {
    resumeCalls += 1
  },
  beginStory: async () => false,
  authenticatedUserId: () => 1,
}

const { openStory } = createStorybookLibraryController(bridge)

// Simulates clicking "Resume" on the current story's own card in the Recent
// Stories panel while it is the live, active session.
const result = openStory('story-active')

assert.equal(
  result,
  true,
  'openStory() should still report success when the requested id is already ' +
    'the active session, even though it now does nothing further.',
)
assert.equal(
  setSessionCalls,
  0,
  'openStory() re-cloned and re-set the already-active session -- clicking ' +
    '"Resume" on the current story\'s own card must be a no-op, not a fresh ' +
    'setSession() call.',
)
assert.equal(
  resumeCalls,
  0,
  'openStory() called resumeNarrativeArtJobs() a second time for the ' +
    'already-active session -- for a beat whose art enqueue is still ' +
    "mid-flight (status 'queueing', no jobId yet), this independently " +
    'submits a second illustration job for the same beat, billing twice.',
)

// A genuinely different id must still open normally (found via the live
// session only when ids match; anything else needs the library, which this
// guard does not populate, so a mismatched id here is expected to no-op
// rather than throw).
setSessionCalls = 0
resumeCalls = 0
const missResult = openStory('story-does-not-exist')
assert.equal(
  missResult,
  false,
  'openStory() must still fail for an id that is neither the active session ' +
    'nor in the library.',
)
assert.equal(setSessionCalls, 0)
assert.equal(resumeCalls, 0)

console.log(
  'Storybook active-story resume guard contract passed: openStory() no-ops ' +
    'when the requested id is already the live active session, so the ' +
    '"Resume" button on the current story\'s own Recent Stories card can no ' +
    'longer double-invoke resumeNarrativeArtJobs() and double-bill an ' +
    "in-flight beat's illustration.",
)
