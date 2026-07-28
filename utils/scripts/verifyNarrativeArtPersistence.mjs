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
const controllerPath = 'composables/useNarrativeArtJobs.ts'
const artStorePath = 'stores/artStore.ts'
const enqueuePath = 'server/api/art/enqueue.post.ts'
const recoveryPath = 'server/api/art/queue/narrative.get.ts'
const storyStorePath = 'stores/storymakerStore.ts'
const taskStorePath = 'stores/taskmasterStore.ts'
const transcriptPath = 'components/narrative/narrative-transcript.vue'
const statusPath = 'components/narrative/narrative-art-status.vue'
const storyPagePath = 'components/conductor/storymaker-page.vue'
const taskPagePath = 'components/pages/taskmaster-page.vue'

const profiles = source(profilesPath)
const controller = source(controllerPath)
const storyStore = source(storyStorePath)
const taskStore = source(taskStorePath)

includesAll(profilesPath, [
  "engine: 'krea2'",
  'steps: 4',
  "sampler: 'euler'",
  "scheduler: 'simple'",
  "projectSlug: 'storymaker'",
  "projectSlug: 'taskmaster'",
])

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
  "data.engine === 'comfy' || data.engine === 'krea2'",
  "engine === 'comfy' || engine === 'krea2'",
  "krea2: '/api/art/enqueue'",
  'scheduler: artData?.scheduler',
  'artData?.narrativeContext',
])

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
    'useNarrativeArtJobs()',
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

includesAll(transcriptPath, [
  'art?: NarrativeArtJobState | null',
  '<slot name="after-beat" :beat="beat" />',
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
includesAll(storyPagePath, [
  '#after-beat="{ beat }"',
  '<NarrativeArtStatus',
  '@retry="store.retryBeatArt(beat.id)"',
])
includesAll(taskPagePath, [
  '#after-beat="{ beat }"',
  '<NarrativeArtStatus',
  '@retry="store.retryBeatArt(beat.id)"',
])

assert.equal(
  (profiles.match(/steps: 4/g) || []).length,
  2,
  'Storymaker and Taskmaster must both use the centralized four-step profile',
)
assert.ok(
  controller.includes('MAX_POLL_ATTEMPTS') &&
    controller.includes('resume checking when this story is opened again'),
  'Polling must stop safely and remain resumeable instead of blocking forever',
)

console.log(
  'Narrative art persistence contract passed: centralized four-step Krea profiles, authenticated recovery, enqueue idempotency, non-blocking beat jobs, resume/retry state, and shared UI are present.',
)
