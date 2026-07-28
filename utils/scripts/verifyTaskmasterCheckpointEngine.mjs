// /utils/scripts/verifyTaskmasterCheckpointEngine.mjs
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

const storePath = 'stores/taskmasterStore.ts'
const pagePath = 'components/pages/taskmaster-page.vue'
const store = source(storePath)
const page = source(pagePath)

includesAll(storePath, [
  'TaskmasterCheckpointOutcome',
  'TaskmasterCheckpointStatus',
  'TaskmasterCheckpoint',
  'checkpoints: TaskmasterCheckpoint[]',
  "status: 'draft'",
  'buildCheckpointPlan',
  'prepareQuest',
  'startQuest',
  'activateNextCheckpoint',
  'currentCheckpoint',
  'remainingCheckpoints',
  "'blocked'",
  "'deferred'",
  "'needs-info'",
  "'proposed-complete'",
  'Practical checkpoint ledger:',
])

includesAll(storePath, [
  "beat.answer.writeBackStatus !== 'pending-human-gate'",
  "question.realWorldKind === 'honeydo' && outcome === 'completed'",
  "checkpoint.status === 'proposed-complete'",
  "checkpoint.status = 'completed'",
  'if (!hook) return true',
])

includesAll(pagePath, [
  'Review the practical plan',
  'The quest starts with real checkpoints',
  'store.prepareQuest',
  'store.startQuest()',
  'Practical checkpoint plan',
  'Current action:',
  'What happened in the real world?',
  'checkpointOutcomes',
  "value: 'completed'",
  "value: 'blocked'",
  "value: 'deferred'",
  "value: 'needs-info'",
  'All checkpoints have an outcome',
])

assert.ok(
  page.indexOf('store.prepareQuest') < page.indexOf('store.startQuest()'),
  'Taskmaster must prepare and review checkpoints before narration starts',
)

assert.ok(
  !store.includes('task.status ='),
  'Taskmaster must not directly mutate Conductor roadmap tasks',
)
assert.ok(
  store.includes('The conductor task stays needs-human until the roadmap is deliberately edited.'),
  'Taskmaster must preserve the Conductor human gate',
)
assert.ok(
  page.includes('Nothing is written automatically. Apply only the updates you want.'),
  'Taskmaster must retain explicit write-back review language',
)

console.log(
  'Taskmaster checkpoint-engine contract passed: reviewed plans, persistent checkpoint state, honest outcomes, practical finale guidance, and explicit write-back gates are present.',
)
