import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ARCADE_GAMES, LINKED_GAMES } from '../arcade/games'
import {
  ARCADE_AUDIO_GAMES,
  ARCADE_CABINET_AUDIO_THEMES,
  ARCADE_EVENT_CUES,
  ARCADE_MUSIC_BRIEFS,
  PRIORITY_ARCADE_AUDIO_GAMES,
  SHARED_ARCADE_EVENT_BRIEFS,
  VERIFIED_ARCADE_AUDIO_ASSETS,
  arcadeAudioBrief,
  arcadeAudioCandidatePath,
  arcadeAudioJobKey,
  arcadeSoundtrackEntries,
  publishedArcadeAudioPath,
  type ArcadeAudioAsset,
} from '../arcade/soundtrackBriefs'
import {
  arcadeAudioCueState,
  arcadeAudioQueueGames,
  type ArcadeAudioQueueData,
  type ArcadeAudioQueueEntry,
} from '../arcade/audioQueue'
import {
  ACESTEP_MAX_BPM,
  ACESTEP_MIN_BPM,
  ACESTEP_MIN_SECONDS,
} from '../../server/api/comfy/acestep/utils/workflow'
import {
  ARCADE_AUDIO_PROJECT_SLUG,
  arcadeAudioDedupeNeedle,
  arcadeAudioGenerationEnabled,
  arcadeAudioSeed,
  buildArcadeAudioEnqueueRequest,
  decideArcadeAudioJob,
  parseArcadeAudioTarget,
} from '../../server/utils/arcadeAudioJobs'

const knownGames = new Set(
  [...ARCADE_GAMES, ...LINKED_GAMES].map((game) => game.slug),
)
assert.equal(PRIORITY_ARCADE_AUDIO_GAMES.length, 4)
assert.ok(ARCADE_AUDIO_GAMES.length > PRIORITY_ARCADE_AUDIO_GAMES.length)

for (const game of ARCADE_AUDIO_GAMES) {
  assert.ok(knownGames.has(game), game)
  const scenes = ARCADE_MUSIC_BRIEFS[game]
  assert.notEqual(scenes.level.prompt, scenes.boss.prompt, game)
  for (const cue of Object.values(scenes)) {
    assert.equal(cue.kind, 'music')
    assert.equal(cue.loop, true)
    assert.ok(cue.bpm && cue.bpm >= 80 && cue.bpm <= 180)
    assert.ok(cue.bpm >= ACESTEP_MIN_BPM && cue.bpm <= ACESTEP_MAX_BPM)
    assert.ok(cue.seconds >= 30 && cue.seconds <= 90)
    assert.ok(cue.mood.length > 3, `${game} mood`)
    assert.ok(cue.instrumentation.length >= 2, `${game} instrumentation`)
    assert.match(cue.prompt, /no vocals/i)
    assert.match(cue.prompt, new RegExp(`${cue.bpm} BPM`))
    assert.match(cue.prompt, new RegExp(`${cue.seconds}-second loop`))
  }
  assert.notEqual(
    arcadeAudioJobKey(game, 'level'),
    arcadeAudioJobKey(game, 'boss'),
  )
}
for (const game of PRIORITY_ARCADE_AUDIO_GAMES) {
  assert.ok(ARCADE_MUSIC_BRIEFS[game]['level-2'], `${game} has a level variant`)
  assert.ok(ARCADE_CABINET_AUDIO_THEMES[game], `${game} has its own theme`)
}

assert.equal(Object.keys(SHARED_ARCADE_EVENT_BRIEFS).length, 4)
for (const cue of Object.values(SHARED_ARCADE_EVENT_BRIEFS)) {
  assert.equal(cue.kind, 'sfx')
  assert.ok(cue.seconds > 0 && cue.seconds <= 4)
  assert.ok(cue.instrumentation.length >= 1)
}

// The manifest: one entry per briefed cue, unique job keys.
const entries = arcadeSoundtrackEntries()
const keys = entries.map((entry) => entry.jobKey)
assert.equal(new Set(keys).size, keys.length, 'job keys are unique')
assert.equal(
  entries.filter((entry) => entry.owner === 'shared').length,
  ARCADE_EVENT_CUES.length,
)
for (const entry of entries)
  assert.equal(arcadeAudioBrief(entry.owner, entry.cue), entry.brief)
assert.equal(arcadeAudioBrief('gloom-invaders', 'pickup'), null)
assert.equal(arcadeAudioBrief('shared', 'level'), null)
assert.equal(arcadeAudioBrief('brick-bloom', 'level-2'), null)

assert.deepEqual(VERIFIED_ARCADE_AUDIO_ASSETS, [])
const good: ArcadeAudioAsset = {
  game: 'gloom-invaders',
  cue: 'level',
  path: '/images/arcade/audio/gloom-invaders/level.ogg',
  approvedAt: '2026-10-13T12:00:00Z',
  verifiedAt: '2026-10-13T12:10:00Z',
  contentSha256: 'a'.repeat(64),
}

const audible = new Set([good.path])
const pathFor = (
  assets: readonly ArcadeAudioAsset[],
  cue: 'level' | 'boss' = 'level',
  available: ReadonlySet<string> = audible,
) => publishedArcadeAudioPath('gloom-invaders', cue, available, assets)

assert.equal(pathFor([]), null)
assert.equal(pathFor([good], 'level', new Set()), null)
assert.equal(pathFor([good]), good.path)
assert.equal(pathFor([good], 'boss'), null)
assert.equal(pathFor([{ ...good, approvedAt: '' }]), null)
assert.equal(pathFor([{ ...good, verifiedAt: '' }]), null)
assert.equal(pathFor([{ ...good, contentSha256: 'unknown' }]), null)
assert.equal(pathFor([{ ...good, path: '/admin/private.wav' }]), null)
assert.equal(
  pathFor([{ ...good, path: '/images/arcade/audio/../secret.wav' }]),
  null,
)

// Candidates: nothing without a verified asset; a game's own before shared.
assert.equal(arcadeAudioCandidatePath('gloom-invaders', 'level'), null)
assert.equal(
  arcadeAudioCandidatePath('gloom-invaders', 'level', [good]),
  good.path,
)
assert.equal(
  arcadeAudioCandidatePath('gloom-invaders', 'level', [
    { ...good, verifiedAt: '' },
  ]),
  null,
)
const sharedDanger: ArcadeAudioAsset = {
  ...good,
  game: 'shared',
  cue: 'danger',
  path: '/images/arcade/audio/shared/danger.ogg',
}
const ownDanger: ArcadeAudioAsset = {
  ...good,
  cue: 'danger',
  path: '/images/arcade/audio/gloom-invaders/danger.ogg',
}
assert.equal(
  arcadeAudioCandidatePath('pixel-hop', 'danger', [sharedDanger]),
  sharedDanger.path,
)
assert.equal(
  arcadeAudioCandidatePath('gloom-invaders', 'danger', [
    sharedDanger,
    ownDanger,
  ]),
  ownDanger.path,
)
assert.equal(
  arcadeAudioCandidatePath('pixel-hop', 'level', [sharedDanger]),
  null,
)

// Admin enqueue requests: ACE-Step, private, deduplicated, deterministic.
for (const entry of entries) {
  const request = buildArcadeAudioEnqueueRequest(entry.owner, entry.cue)!
  assert.equal(request.engine, 'acestep')
  assert.equal(request.lyrics, '')
  assert.equal(request.isPublic, false)
  assert.equal(request.designer, entry.jobKey)
  assert.equal(request.projectSlug, ARCADE_AUDIO_PROJECT_SLUG)
  assert.equal(request.promptString, entry.brief.prompt)
  assert.ok(request.durationSeconds >= ACESTEP_MIN_SECONDS)
  assert.equal(request.seed, arcadeAudioSeed(entry.jobKey))
  assert.ok(request.seed >= 0 && request.seed < 2_147_483_647)
}
assert.equal(
  buildArcadeAudioEnqueueRequest('shared', 'pickup')!.durationSeconds,
  ACESTEP_MIN_SECONDS,
  'short cues request the minimum render and are trimmed at ingestion',
)
assert.equal(
  buildArcadeAudioEnqueueRequest('zuzu-showdown', 'boss')!.durationSeconds,
  64,
)
assert.equal(
  arcadeAudioDedupeNeedle('arcade-audio:v1:shared:pickup'),
  '"designer":"arcade-audio:v1:shared:pickup"',
)
assert.ok(
  JSON.stringify({
    save: {
      designer: buildArcadeAudioEnqueueRequest('shared', 'pickup')!.designer,
    },
  }).includes(arcadeAudioDedupeNeedle(arcadeAudioJobKey('shared', 'pickup'))),
)

assert.deepEqual(parseArcadeAudioTarget('gloom-invaders', 'boss'), {
  owner: 'gloom-invaders',
  cue: 'boss',
})
assert.deepEqual(parseArcadeAudioTarget('shared', 'victory'), {
  owner: 'shared',
  cue: 'victory',
})
assert.equal(parseArcadeAudioTarget('gloom-invaders', 'victory'), null)
assert.equal(parseArcadeAudioTarget('pixel-hop', 'level'), null)
assert.equal(parseArcadeAudioTarget('gloom-invaders', 'level-9'), null)
assert.equal(parseArcadeAudioTarget(7, 'level'), null)

assert.equal(arcadeAudioGenerationEnabled({}), false)
assert.equal(
  arcadeAudioGenerationEnabled({ ARCADE_AUDIO_JOBS_ENABLED: '1' }),
  false,
)
assert.equal(
  arcadeAudioGenerationEnabled({ ARCADE_AUDIO_JOBS_ENABLED: 'true' }),
  true,
)

const ready = { ready: true, agentIds: ['relay'], reason: 'ok' }
const notReady = {
  ready: false,
  agentIds: [],
  reason: 'No relay has polled recently.',
}
const target = { owner: 'gloom-invaders' as const, cue: 'level' as const }
const decide = (
  overrides: Partial<Parameters<typeof decideArcadeAudioJob>[0]>,
) =>
  decideArcadeAudioJob({
    ...target,
    approved: true,
    enabled: true,
    readiness: ready,
    existing: null,
    ...overrides,
  })
assert.equal(decide({}).action, 'enqueue')
assert.deepEqual(decide({ approved: false }), {
  action: 'refuse',
  statusCode: 400,
  message: 'Approve this cue explicitly (approve: true) to enqueue it.',
})
assert.equal(
  (decide({ enabled: false }) as { statusCode: number }).statusCode,
  403,
)
assert.deepEqual(decide({ readiness: notReady }), {
  action: 'refuse',
  statusCode: 409,
  message: notReady.reason,
})
assert.deepEqual(decide({ existing: { id: 42, status: 'DONE' } }), {
  action: 'reuse',
  jobId: 42,
  status: 'DONE',
})

const sampleCue: ArcadeAudioQueueEntry = {
  game: 'gloom-invaders',
  cue: 'level',
  jobKey: arcadeAudioJobKey('gloom-invaders', 'level'),
  brief: ARCADE_MUSIC_BRIEFS['gloom-invaders'].level,
  job: null,
}
const sampleQueue: ArcadeAudioQueueData = {
  generationEnabled: true,
  relay: ready,
  entries: [sampleCue],
}
assert.equal(arcadeAudioCueState(sampleCue, sampleQueue).eligible, true)
assert.equal(
  arcadeAudioCueState(sampleCue, {
    ...sampleQueue,
    generationEnabled: false,
  }).eligible,
  false,
  'Disabled server cannot be overridden by the admin interface',
)
assert.equal(
  arcadeAudioCueState(sampleCue, {
    ...sampleQueue,
    relay: notReady,
  }).eligible,
  false,
  'No live audio-capable relay means no Approve button',
)
for (const status of ['PENDING', 'RUNNING', 'DONE']) {
  const covered = {
    ...sampleCue,
    job: { id: 17, status, createdAt: '2026-11-23T08:00:00Z' },
  }
  assert.equal(
    arcadeAudioCueState(covered, sampleQueue).eligible,
    false,
    'Existing in-flight or completed jobs are never re-enqueued',
  )
}
assert.equal(
  arcadeAudioCueState(
    {
      ...sampleCue,
      job: { id: 18, status: 'FAILED', createdAt: '2026-11-23T08:00:00Z' },
    },
    sampleQueue,
  ).eligible,
  true,
  'A failed job can be retried with explicit approval',
)
assert.deepEqual(
  arcadeAudioQueueGames([
    sampleCue,
    { ...sampleCue, game: 'shared', cue: 'victory' },
    sampleCue,
  ]),
  ['gloom-invaders', 'shared'],
)
const audioPage = readFileSync('pages/admin/arcade-audio.vue', 'utf8')
const audioStore = readFileSync('stores/arcadeAudioQueueStore.ts', 'utf8')
const audioNav = readFileSync('content/channels/admin/arcade-audio.md', 'utf8')
assert.match(audioNav, /requiredRole: ADMIN/)
assert.match(audioNav, /route: \/admin\/arcade-audio/)
assert.match(audioPage, /data-testid="arcade-audio-queue"/)
assert.match(audioPage, /useArcadeAudioQueueStore/)
assert.match(audioPage, /audio\.canApprove\(entry\)/)
assert.doesNotMatch(audioPage, /\$fetch\(|localStorage\.|fetch\(/)
assert.match(audioStore, /performFetch<ArcadeAudioQueueData>/)
assert.match(audioStore, /approve: true/)
assert.match(audioStore, /if \(!response\.success/)
assert.doesNotMatch(
  audioStore,
  /setInterval\(|onMounted\(/,
  'The admin queue does not auto-submit or poll for production jobs',
)

const sceneSources = {
  gloom: readFileSync('utils/arcade/games/gloomInvaders.ts', 'utf8'),
  prize: readFileSync('utils/arcade/games/prizeShowPanic.ts', 'utf8'),
  ghost: readFileSync('utils/arcade/games/zuzuGhostTrail.ts', 'utf8'),
}
for (const source of Object.values(sceneSources)) {
  assert.match(
    source,
    /get musicScene\(\)/,
    'Every soundtrack priority cabinet declares a scene for the mixer',
  )
}
assert.match(sceneSources.gloom, /heartbeatTier\(this\.stepEvery\) >= 2/)
assert.match(sceneSources.prize, /if \(this\.boss \|\| this\.ending\) return 'boss'/)
assert.match(sceneSources.prize, /this\.episodeIndex >= 2/)
assert.match(sceneSources.ghost, /this\.act\.stage >= 4/)
assert.match(
  sceneSources.ghost,
  /this\.boss && this\.boss\.dying === 0/,
)

console.log('verifyArcadeSoundtrackBriefs: ok')
