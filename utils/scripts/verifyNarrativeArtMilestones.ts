// /utils/scripts/verifyNarrativeArtMilestones.ts
import assert from 'node:assert/strict'
import type {
  StorymakerBeat,
  StorymakerSession,
  StorymakerStateDelta,
} from '../../stores/storymakerStore'
import type {
  TaskmasterBeat,
  TaskmasterCheckpoint,
  TaskmasterSession,
} from '../../stores/taskmasterStore'
import {
  MIN_BEATS_BETWEEN_ART,
  STORYMAKER_INTERMEDIATE_ART_LIMIT,
  TASKMASTER_INTERMEDIATE_ART_LIMIT,
  selectStorymakerArtMilestone,
  selectTaskmasterArtMilestone,
} from '../narrativeArtMilestones'

const emptyDelta = (): StorymakerStateDelta => ({
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
    delta?: StorymakerStateDelta
  } = {},
): StorymakerBeat {
  return {
    id,
    sessionId: 'story-session',
    narrative,
    question: 'What now?',
    stateDelta: options.delta ?? emptyDelta(),
    art: options.artMoment
      ? ({ moment: options.artMoment } as StorymakerBeat['art'])
      : undefined,
    createdAt: new Date().toISOString(),
  }
}

function storySession(beats: StorymakerBeat[]): StorymakerSession {
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
  selectStorymakerArtMilestone(story, pivotal),
  'pivotal-event',
  'A state-changing beat should qualify after the cooldown',
)

const tooSoon = storyBeat('s1b', 'A consequence arrives immediately.', {
  delta: { ...emptyDelta(), consequences: ['Too soon.'] },
})
story = storySession([opening, tooSoon])
assert.equal(
  selectStorymakerArtMilestone(story, tooSoon),
  null,
  'Opening art must enforce the minimum beat cooldown',
)

const castIntro = storyBeat('s2c', 'Mara Vale steps from the smoke and raises a lantern.')
story = storySession([opening, quiet, castIntro])
assert.equal(
  selectStorymakerArtMilestone(story, castIntro),
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
  selectStorymakerArtMilestone(story, chapterBeat),
  'chapter',
  'A deterministic chapter boundary should qualify',
)

const locationBeat = storyBeat('s2l', 'They enter the observatory beyond the ridge.')
story = storySession([opening, quiet, locationBeat])
assert.equal(
  selectStorymakerArtMilestone(story, locationBeat),
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
  selectStorymakerArtMilestone(story, capped),
  null,
  'Storymaker must respect its intermediate-art limit',
)
assert.equal(STORYMAKER_INTERMEDIATE_ART_LIMIT, 2)
assert.equal(MIN_BEATS_BETWEEN_ART, 2)

function checkpoint(
  id: string,
  status: TaskmasterCheckpoint['status'],
): TaskmasterCheckpoint {
  return {
    id,
    title: `Checkpoint ${id}`,
    sourceKind: 'direct-task',
    status,
    updatedAt: new Date().toISOString(),
  }
}

function taskBeat(
  id: string,
  checkpointId: string,
  options: { artMoment?: 'opening' | 'chapter' | 'location' | 'pivotal-event' | 'finale' } = {},
): TaskmasterBeat {
  return {
    id,
    sessionId: 'task-session',
    narrative: 'The practical quest continues.',
    question: {
      prompt: 'What happened?',
      realWorldKind: 'direct-task',
      checkpointId,
    },
    art: options.artMoment
      ? ({ moment: options.artMoment } as TaskmasterBeat['art'])
      : undefined,
    createdAt: new Date().toISOString(),
  }
}

function taskSession(
  beats: TaskmasterBeat[],
  checkpoints: TaskmasterCheckpoint[],
): TaskmasterSession {
  return {
    id: 'task-session',
    userId: 1,
    seed: {
      userId: 1,
      taskTitle: 'Finish the practical test',
      vibeTags: [],
      tone: 'adventurous',
      surprise: false,
    },
    checkpoints,
    beats,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

const taskOpening = taskBeat('t0', 'cp1', { artMoment: 'opening' })
const taskMiddle = taskBeat('t1', 'cp1')
const blockedTurn = taskBeat('t2', 'cp2')
let task = taskSession(
  [taskOpening, taskMiddle, blockedTurn],
  [checkpoint('cp1', 'blocked'), checkpoint('cp2', 'active')],
)
assert.equal(
  selectTaskmasterArtMilestone(task, blockedTurn),
  'pivotal-event',
  'A blocked prior checkpoint should create the one Taskmaster pivot image',
)

const chapterTurn = taskBeat('t2c', 'cp2')
task = taskSession(
  [taskOpening, taskMiddle, chapterTurn],
  [checkpoint('cp1', 'completed'), checkpoint('cp2', 'active')],
)
assert.equal(
  selectTaskmasterArtMilestone(task, chapterTurn),
  'chapter',
  'A new checkpoint after the cooldown should create a chapter image',
)

const taskCapped = taskBeat('t4', 'cp3')
task = taskSession(
  [
    taskOpening,
    taskMiddle,
    taskBeat('t2a', 'cp2', { artMoment: 'chapter' }),
    taskBeat('t3', 'cp2'),
    taskCapped,
  ],
  [
    checkpoint('cp1', 'completed'),
    checkpoint('cp2', 'completed'),
    checkpoint('cp3', 'active'),
  ],
)
assert.equal(
  selectTaskmasterArtMilestone(task, taskCapped),
  null,
  'Taskmaster must respect its single intermediate-art limit',
)
assert.equal(TASKMASTER_INTERMEDIATE_ART_LIMIT, 1)

console.log(
  'Narrative art milestone classifier passed: deterministic evidence, cooldowns, and hard product limits are enforced.',
)
