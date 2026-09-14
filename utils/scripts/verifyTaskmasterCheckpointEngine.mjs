// /utils/scripts/verifyTaskmasterCheckpointEngine.mjs
//
// The Taskmaster checkpoint engine, pinned against the surface that now runs it
// (storybook/t-047).
//
// REWRITTEN, NOT REPLACED. Until 2026-09-14 this read stores/taskmasterStore.ts
// and components/pages/taskmaster-page.vue: a client-side beat loop behind its
// own route. Both are gone -- taskmaster is Storybook's fourth MODE and its
// quest is a server-side run (server/utils/storybookQuest.ts). The truths this
// guard has always defended did NOT move out with the files, so they are
// re-asserted here against the server engine and the two screens that show it:
//
//   1. A plan is dealt from real work before the quest starts, and the reader
//      sees it. A quest that invents its own checkpoints is not doing anyone's
//      to-do list.
//   2. Outcomes are HONEST. 'blocked', 'deferred' and 'needs-info' are
//      first-class, because a checkpoint engine that can only record success
//      teaches people to lie to it.
//   3. A proposed-but-unapplied write-back must never block finishing the
//      quest. This was the original guard's sharpest assertion and it survives
//      verbatim in intent: the old store was forbidden from putting
//      'proposed-complete' in the blocking set, and the new engine's
//      activeCheckpoint() must likewise not treat 'proposed' as open.
//   4. Conductor roadmap YAML is never mutated by the engine, and the human
//      gate is preserved in words the reader can see.
//   5. The write-back review language is explicit on screen: what applying
//      would do, said BEFORE it is done, with an unapplied proposal labelled as
//      having changed nothing.
//
// Deliberately NOT duplicated here: the "only one path writes" rules, which
// verifyStorybookTaskmasterSafety.ts owns and checks far more thoroughly.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function source(path) {
  return readFileSync(resolve(process.cwd(), path), 'utf8')
}

function includesAll(path, values) {
  const contents = source(path)
  for (const value of values) {
    assert.ok(contents.includes(value), `${path} must include ${value}`)
  }
}

const questPath = 'server/utils/storybookQuest.ts'
const runsPath = 'server/utils/storybookRuns.ts'
const tablePath = 'components/storybook/storybook-table.vue'
const readingPath = 'components/storybook/storybook-reading.vue'

const quest = source(questPath)
const runs = source(runsPath)
const table = source(tablePath)
const reading = source(readingPath)

// --- 1. the plan is dealt from real work -------------------------------------
includesAll(questPath, [
  'QuestCheckpointStatus',
  'QuestCheckpointSource',
  'export interface QuestCheckpoint',
  'checkpoints: QuestCheckpoint[]',
  'export const MAX_QUEST_CHECKPOINTS',
  'dealQuestCheckpoints',
  'activeCheckpoint',
  'normalizeObjective',
  "sourceKind: 'honeydo'",
  "sourceKind: 'needs-human'",
  "sourceKind: 'direct-task'",
  "category: 'HONEYDO'",
  "task.status === 'needs-human'",
])

assert.ok(
  /take: MAX_QUEST_CHECKPOINTS/.test(quest) &&
    /checkpoints\.slice\(0, MAX_QUEST_CHECKPOINTS\)/.test(quest),
  'A quest must stay bounded: an objective that sweeps up every loose to-do stops being an objective',
)

// The Table is where the plan is assembled, and it refuses to open a quest that
// has nothing real behind it -- said on the board rather than after a round trip.
includesAll(tablePath, [
  "isTaskmaster ? 'Objective' : 'Spark'",
  'A taskmaster quest needs an objective',
  'Deal a project into the Thread slot',
  "deckKey: isTaskmaster.value\n      ? 'taskmaster'",
  'project.conductorSlug',
])

// --- 2. outcomes are honest --------------------------------------------------
for (const outcome of ["'blocked'", "'deferred'", "'needs-info'", "'completed'"]) {
  assert.ok(
    quest.includes(outcome),
    `The quest engine must keep ${outcome} as a first-class checkpoint outcome`,
  )
}

// --- 3. a proposed write-back must not block finishing -----------------------
// The original assertion, ported: the old store was forbidden from listing
// 'proposed-complete' alongside 'pending'/'active' in its blocking set. The new
// engine expresses the same rule through activeCheckpoint(), which counts only
// 'pending' and 'needs-info' as open work. If 'proposed' ever joins that
// predicate, a reader who proposed a write-back and did not apply it could
// never finish the quest.
const activeBody = quest.slice(
  quest.indexOf('export function activeCheckpoint('),
  quest.indexOf('function openCheckpointCount('),
)
assert.ok(activeBody.length > 0, 'activeCheckpoint() must still exist')
assert.ok(
  activeBody.includes("checkpoint.status === 'pending'") &&
    activeBody.includes("checkpoint.status === 'needs-info'"),
  'activeCheckpoint() must treat pending and needs-info as the open work',
)
assert.ok(
  !activeBody.includes("'proposed'"),
  'A proposed external write-back must not prevent the user from finishing the quest',
)
assert.ok(
  runs.includes('activeCheckpoint(ledger!) === null'),
  'A quest must be closeable once every checkpoint is worked, even with turns left on the budget',
)

// --- 4. the roadmap is never written, and the gate is preserved in words -----
assert.ok(
  !/\btask\.status\s*=[^=]/.test(quest),
  'Taskmaster must not directly mutate Conductor roadmap tasks',
)
assert.ok(
  quest.includes(
    'The conductor task stays needs-human until the roadmap is deliberately edited by a person.',
  ),
  'Taskmaster must preserve the Conductor human gate',
)

// --- 5. the review language is on screen ------------------------------------
includesAll(questPath, [
  'export function describeEffect(',
  'appliedAt: null',
  'appliedTodoId: null',
])
assert.ok(
  /What applying this would actually do, in plain words, before it is done/.test(
    quest,
  ),
  'A proposal must carry its effect in plain words',
)
includesAll(readingPath, [
  'data-testid="storybook-quest-objective"',
  '{{ quest.objective }}',
  '{{ proposal.effect }}',
  'Not applied — nothing has changed yet',
  'runStore.applyProposal(proposal.id)',
])
assert.ok(
  /Every proposal says what applying would do BEFORE it is/.test(reading),
  'The Reading must retain explicit write-back review language',
)
assert.ok(
  !table.includes('applyProposal('),
  'Accepting a proposal must never become a side effect of setting up the board',
)

console.log(
  'Taskmaster checkpoint-engine contract passed: plans dealt from real work, bounded quests, honest outcomes, non-blocking write-back proposals, an intact Conductor gate, and explicit on-screen review language are all present.',
)
