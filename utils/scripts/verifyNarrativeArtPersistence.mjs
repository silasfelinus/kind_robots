// /utils/scripts/verifyNarrativeArtPersistence.mjs
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

const profilesPath = 'utils/narrativeArtProfiles.ts'
const jobsPath = 'utils/narrativeArtJobs.ts'
const controllerPath = 'stores/helpers/narrativeArtJobsHelper.ts'
const artStorePath = 'stores/artStore.ts'
const enqueuePath = 'server/api/art/enqueue.post.ts'
const recoveryPath = 'server/api/art/queue/narrative.get.ts'
const storyStorePath = 'stores/storybookStore.ts'
const taskStorePath = 'stores/taskmasterStore.ts'
const turnsPath = 'utils/narrativeTurns.ts'
const statusPath = 'components/narrative/narrative-art-status.vue'
const storyPagePath = 'components/conductor/storybook-page.vue'
const taskPagePath = 'components/pages/taskmaster-page.vue'

const profiles = source(profilesPath)
const controller = source(controllerPath)
const artStore = source(artStorePath)
const storyStore = source(storyStorePath)
const taskStore = source(taskStorePath)

includesAll(profilesPath, [
  "engine: 'krea2'",
  'steps: 4',
  "sampler: 'euler'",
  "scheduler: 'simple'",
  "key: 'storybook-narrative-krea4'",
  "product: 'storybook'",
  "projectSlug: 'storybook'",
  "key: 'taskmaster-narrative-krea4'",
  "product: 'taskmaster'",
  "projectSlug: 'taskmaster'",
])

const storybookProfile = profiles.slice(
  profiles.indexOf('  storybook: {'),
  profiles.indexOf('  taskmaster: {'),
)
const taskmasterProfile = profiles.slice(
  profiles.indexOf('  taskmaster: {'),
  profiles.indexOf('\n  },\n}', profiles.indexOf('  taskmaster: {')) + 5,
)
for (const [label, profile] of [
  ['Storybook', storybookProfile],
  ['Taskmaster', taskmasterProfile],
]) {
  assert.ok(
    profile.includes("engine: 'krea2'") &&
      profile.includes('steps: 4') &&
      profile.includes("sampler: 'euler'") &&
      profile.includes("scheduler: 'simple'"),
    `${label} must retain its centralized four-step Krea profile`,
  )
}

includesAll(jobsPath, [
  'NarrativeArtJobState',
  'sessionId: string',
  'beatId: string',
  'buildNarrativeArtDedupeKey',
  'buildNarrativeArtPrompt',
  'createNarrativeArtJobState',
  'buildNarrativeArtGenerationData',
  'narrativeContext:',
  "isPublic: false",
  "isMature: false",
])

includesAll(artStorePath, [
  "| 'krea2'",
  'NarrativeArtEnqueueContext',
  'scheduler?: string',
  'projectSlug?: string | null',
  'narrativeContext?: NarrativeArtEnqueueContext | null',
  "krea2: '/api/art/enqueue'",
  'scheduler: artData?.scheduler',
  'artData?.narrativeContext',
])

for (const engine of ['comfy', 'krea2', 'flux2']) {
  assert.ok(
    artStore.includes(`data.engine === '${engine}'`),
    `${engine} requests must be recognized as Comfy-native generation requirements`,
  )
  assert.ok(
    artStore.includes(`engine === '${engine}'`),
    `${engine} must remain a supported Comfy-native execution lane`,
  )
}

includesAll(enqueuePath, [
  'NarrativeEnqueueContext',
  'narrativeRequest(',
  'const expectedKey = [product, sessionId, beatId, moment].join(\':\')',
  'Existing narrative art job reused.',
  "status: { notIn: ['FAILED', 'CANCELLED'] }",
  'deduplicated: true',
  'mana: { charged: 0 }',
  'payload.narrativeContext = narrativeContext',
  'deduplicated: false',
])

includesAll(recoveryPath, [
  'requireMachineUser(event)',
  'const expectedKey = [product, sessionId, beatId, moment].join(\':\')',
  "status: { notIn: ['FAILED', 'CANCELLED'] }",
  'Existing narrative art job found.',
  'No existing narrative art job found.',
  'data: { job }',
])

includesAll(controllerPath, [
  'ensureQueueReady',
  'serverStore.initialize({ fetchRemote: true })',
  'recoverExistingJob',
  '/api/art/queue/narrative?',
  'recoverOrSubmit',
  'Recover the already-paid job before invoking the mana-gated enqueue path.',
  'artStore.enqueueArtGeneration',
  'artStore.getArtJobStatus',
  'artStore.getArtImageById',
  'resume(',
  'retry(',
])

const recoveryStart = controller.indexOf('async function recoverOrSubmit')
const recoveryEnd = controller.indexOf('\n  function resume(', recoveryStart)
const recoveryBlock = controller.slice(recoveryStart, recoveryEnd)
assert.ok(
  recoveryStart >= 0 &&
    recoveryEnd > recoveryStart &&
    recoveryBlock.indexOf('recoverExistingJob(state)') >= 0 &&
    recoveryBlock.indexOf('recoverExistingJob(state)') <
      recoveryBlock.indexOf('await submit(state, update)'),
  'Interrupted sessions must attempt authenticated job recovery before re-enqueue',
)

for (const storePath of [storyStorePath, taskStorePath]) {
  includesAll(storePath, [
    'art?: NarrativeArtJobState',
    'createNarrativeArtJobsController()',
    'updateBeatArt',
    'requestBeatArt',
    'resumeNarrativeArtJobs',
    'retryBeatArt',
    "? 'finale'",
    "? 'opening'",
  ])
}

assert.ok(
  !storyStore.includes('await requestBeatArt(') &&
    !taskStore.includes('await requestBeatArt('),
  'Narrative text generation must not wait for scene art rendering',
)

includesAll(turnsPath, [
  'beatIdFromTurnId',
  'null for anything else',
])
includesAll(statusPath, [
  "art.status === 'queueing'",
  "art.status === 'queued'",
  "art.status === 'rendering'",
  "art.status === 'done'",
  "art.status === 'failed'",
  "art.status === 'cancelled'",
  "@click=\"$emit('retry')\"",
  'Automatic story art',
])
for (const pagePath of [storyPagePath, taskPagePath]) {
  includesAll(pagePath, [
    '#after-turn="{ turn }"',
    '<NarrativeArtStatus',
    'v-if="beatForTurn(turn)"',
    ':art="beatForTurn(turn)?.art"',
    '@retry="store.retryBeatArt(beatForTurn(turn)!.id)"',
  ])
}

assert.ok(
  controller.includes('MAX_POLL_ATTEMPTS') &&
    controller.includes('resume checking when this story is opened again'),
  'Polling must stop safely and remain resumeable instead of blocking forever',
)

console.log(
  'Narrative art persistence contract passed: centralized four-step Krea profiles, authenticated recovery, enqueue idempotency, non-blocking beat jobs, resume/retry state, and shared UI are present.',
)
