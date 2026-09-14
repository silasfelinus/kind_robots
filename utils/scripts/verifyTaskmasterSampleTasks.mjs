// /utils/scripts/verifyTaskmasterSampleTasks.mjs
//
// Where a taskmaster quest's work comes from, pinned against the surface that
// now deals it (storybook/t-047).
//
// REWRITTEN, NOT REPLACED. Until 2026-09-14 this read content/taskmaster.md and
// components/taskmaster/taskmaster-sample-tasks.vue: four hand-written sample
// objectives on a standalone route, one of which ("Look at my conductor repo and
// help me clear any current human gates.") pulled the reader's real needs-human
// tasks in. All three files are gone with the route. What they were really
// guarding was never the four sample strings -- it was this:
//
//   1. A quest is built from the reader's OWN real work, not from invented
//      filler. A story that pretends to be about your to-do list, and isn't, is
//      worse than no story.
//   2. Only projects that actually have a Conductor side may be dealt, because
//      the server deals checkpoints from `conductorSlug`. A project without one
//      puts an objective on the board with nothing behind it.
//   3. Choosing work NEVER approves anything. The old guard said this by
//      forbidding `startQuest`/`beginStory`/`applyWriteBack` on the sample
//      component and banning the strings `approved_by_human`/`approvedByHuman`
//      outright. Setting up a board must still not be a write.
//
// All three are now properties of components/storybook/storybook-table.vue (the
// board) and server/utils/storybookQuest.ts (the dealer).

import assert from 'node:assert/strict'
import fs from 'node:fs'

const TABLE_PATH = 'components/storybook/storybook-table.vue'
const QUEST_PATH = 'server/utils/storybookQuest.ts'

const table = fs.readFileSync(TABLE_PATH, 'utf8')
const quest = fs.readFileSync(QUEST_PATH, 'utf8')

// --- 1 & 2. real work, and only work with a Conductor side behind it ---------

assert.match(
  table,
  /projectStore\.projects/,
  `${TABLE_PATH} must deal the reader's own projects into the Thread slot in taskmaster mode, not invented samples.`,
)
assert.match(
  table,
  /\.filter\(\(project\) => project\.conductorSlug\)/,
  `${TABLE_PATH} must offer ONLY projects carrying a conductorSlug -- that slug is what the server deals checkpoints from, so a project without one is an objective with nothing behind it.`,
)
assert.match(
  table,
  /if \(isTaskmaster\.value && !board\.value\.thread\[0\]\)/,
  `${TABLE_PATH} must refuse to open a taskmaster quest with no project dealt.`,
)
assert.match(
  table,
  /if \(isTaskmaster\.value && !spark\.value\.trim\(\)\)/,
  `${TABLE_PATH} must refuse to open a taskmaster quest with no objective.`,
)

// The needs-human pull the old 'conductor-gates' sample existed for, now
// server-side and applied to every quest rather than one canned starting point.
assert.match(
  quest,
  /task\.status === 'needs-human'/,
  `${QUEST_PATH} must still deal the project's needs-human conductor tasks as checkpoints.`,
)
assert.match(
  quest,
  /category: 'HONEYDO'/,
  `${QUEST_PATH} must still deal the project's open HONEYDO todos as checkpoints.`,
)
assert.match(
  quest,
  /status: 'OPEN'/,
  `${QUEST_PATH} must deal only OPEN todos -- a quest built from finished work is filler.`,
)

// --- 3. choosing work approves nothing ---------------------------------------

for (const [label, source] of [
  [TABLE_PATH, table],
  [QUEST_PATH, quest],
]) {
  assert.doesNotMatch(
    source,
    /approved_by_human|approvedByHuman/,
    `${label} must never read or write a human-approval flag: picking work for a story is not approving it.`,
  )
}

assert.doesNotMatch(
  table,
  /applyProposal\(|applyQuestProposal\(/,
  `${TABLE_PATH} must not apply anything. Setting up the board is not a write -- the accept step lives in the Reading.`,
)

console.log(
  'Taskmaster sample-task contract passed: quests are built from the reader\'s own conductor-backed work, an objective and a project are both required, and choosing work approves nothing.',
)
