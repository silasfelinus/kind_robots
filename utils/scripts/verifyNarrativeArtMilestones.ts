// /utils/scripts/verifyNarrativeArtMilestones.ts
import assert from 'node:assert/strict'
import type {
  StorybookBeat,
  StorybookSession,
  StorybookStateDelta,
} from '../../stores/storybookStore'
import {
  MIN_BEATS_BETWEEN_ART,
  STORYBOOK_INTERMEDIATE_ART_LIMIT,
  selectStorybookArtMilestone,
} from '../narrativeArtMilestones'

const emptyDelta = (): StorybookStateDelta => ({
  consequences: [],
  relationshipShifts: [],
  inventoryAdd: [],
  inventoryRemove: [],
})

function storyBeat(
  id: string,
  narrative: string,
  options: {
    artMoment?: 'opening' | 'chapter' | 'location' | 'character-introduction' | 'pivotal-event' | 'finale'
    delta?: StorybookStateDelta
  } = {},
): StorybookBeat {
  return {
    id,
    sessionId: 'story-session',
    narrative,
    question: 'What now?',
    stateDelta: options.delta ?? emptyDelta(),
    art: options.artMoment
      ? ({ moment: options.artMoment } as StorybookBeat['art'])
      : undefined,
    createdAt: new Date().toISOString(),
  }
}

function storySession(beats: StorybookBeat[]): StorybookSession {
  return {
    id: 'story-session',
    userId: 1,
    bible: {
      title: 'Milestone Test',
      premise: 'A careful test of selective illustrations.',
      narratorStyle: 'cinematic',
      structure: 'chaptered',
      cast: [{ slug: 'mara-vale', title: 'Mara Vale' }],
      facets: [],
      rewards: [],
      createdAt: new Date().toISOString(),
    },
    beats,
    branchHistory: [],
    consequences: [],
    inventory: [],
    stateVersion: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const opening = storyBeat('s0', 'The story opens.', { artMoment: 'opening' })
const quiet = storyBeat('s1', 'The path continues without a major turn.')
const pivotal = storyBeat('s2', 'The bridge collapses behind them.', {
  delta: {
    ...emptyDelta(),
    consequences: ['The bridge is gone.'],
  },
})
let story = storySession([opening, quiet, pivotal])
assert.equal(
  selectStorybookArtMilestone(story, pivotal),
  'pivotal-event',
  'A state-changing beat should qualify after the cooldown',
)

const tooSoon = storyBeat('s1b', 'A consequence arrives immediately.', {
  delta: { ...emptyDelta(), consequences: ['Too soon.'] },
})
story = storySession([opening, tooSoon])
assert.equal(
  selectStorybookArtMilestone(story, tooSoon),
  null,
  'Opening art must enforce the minimum beat cooldown',
)

const castIntro = storyBeat('s2c', 'Mara Vale steps from the smoke and raises a lantern.')
story = storySession([opening, quiet, castIntro])
assert.equal(
  selectStorybookArtMilestone(story, castIntro),
  'character-introduction',
  'A selected cast member appearing for the first time should qualify',
)

const chapterBeat = storyBeat('s3', 'A new chapter begins beneath a colder moon.')
story = storySession([
  opening,
  quiet,
  storyBeat('s2q', 'The road bends.'),
  chapterBeat,
])
assert.equal(
  selectStorybookArtMilestone(story, chapterBeat),
  'chapter',
  'A deterministic chapter boundary should qualify',
)

const locationBeat = storyBeat('s2l', 'They enter the observatory beyond the ridge.')
story = storySession([opening, quiet, locationBeat])
assert.equal(
  selectStorybookArtMilestone(story, locationBeat),
  'location',
  'A clear location transition should qualify when no stronger event applies',
)

const capped = storyBeat('s5', 'Another bridge falls.', {
  delta: { ...emptyDelta(), consequences: ['A third pivot.'] },
})
story = storySession([
  opening,
  quiet,
  storyBeat('s2a', 'First pivot.', { artMoment: 'pivotal-event' }),
  storyBeat('s3q', 'A quiet interval.'),
  storyBeat('s4a', 'Second pivot.', { artMoment: 'chapter' }),
  capped,
])
assert.equal(
  selectStorybookArtMilestone(story, capped),
  null,
  'Storybook must respect its intermediate-art limit',
)
assert.equal(STORYBOOK_INTERMEDIATE_ART_LIMIT, 2)
assert.equal(MIN_BEATS_BETWEEN_ART, 2)

// The Taskmaster fixtures and cases left this suite on 2026-09-14
// (storybook/t-047) with selectTaskmasterArtMilestone() itself. They built a
// TaskmasterSession out of stores/taskmasterStore.ts types and asserted the
// one-pivot / cooldown / single-intermediate-art rules against it; that session
// shape no longer exists in the browser, because a taskmaster quest is a
// server-side run. The cooldown and cap logic they exercised is shared code
// (hasArtCooldown, intermediateArtCount) and is still covered by the Storybook
// cases above.

console.log(
  'Narrative art milestone classifier passed: deterministic evidence, cooldowns, and hard product limits are enforced.',
)
