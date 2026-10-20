import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type { ArtJob } from '~/prisma/generated/prisma/client'
import {
  summarizeVideoGeneratorJob,
  videoGeneratorMetadata,
} from '../../server/utils/videoGeneratorJobs'

const job = {
  id: 42,
  status: 'RUNNING',
  engine: 'COMFY',
  projectSlug: null,
  payload: JSON.stringify({
    media: 'video',
    promptString: 'slow orbit of a green robot',
    images: [{ name: 'private.png', imageData: 'secret-source-bytes' }],
    video: {
      model: 'wan',
      width: 768,
      height: 512,
      fps: 16,
      frames: 65,
      durationSeconds: 4,
      outputFormat: 'mp4',
    },
  }),
  createdAt: new Date('2026-10-20T07:00:00Z'),
  updatedAt: new Date('2026-10-20T07:05:00Z'),
  claimedAt: new Date('2026-10-20T07:01:00Z'),
  artImageId: null,
  attempts: 1,
  error: 'Relay retrying',
} as ArtJob

const summary = summarizeVideoGeneratorJob(job)
assert.equal(summary?.id, 42)
assert.equal(summary?.model, 'wan')
assert.equal(summary?.status, 'RUNNING')
assert.equal(summary?.attempts, 1)
assert.equal(summary?.frames, 65)
assert.equal(summary?.prompt, 'slow orbit of a green robot')
assert.ok(!JSON.stringify(summary).includes('secret-source-bytes'))

assert.equal(
  videoGeneratorMetadata({ ...job, projectSlug: 'scene-animator' }),
  null,
)
assert.equal(
  videoGeneratorMetadata({ ...job, projectSlug: 'music-video' }),
  null,
)
assert.equal(
  videoGeneratorMetadata({
    ...job,
    payload: JSON.stringify({ media: 'audio', video: { model: 'wan' } }),
  }),
  null,
)
assert.equal(
  videoGeneratorMetadata({
    ...job,
    payload: JSON.stringify({ media: 'video', video: { model: 'unknown' } }),
  }),
  null,
)
assert.equal(
  summarizeVideoGeneratorJob({ ...job, projectSlug: 'video-generator' })?.id,
  42,
)

const getRoute = readFileSync('server/api/video/jobs.get.ts', 'utf8')
const deleteRoute = readFileSync('server/api/video/jobs/[id].delete.ts', 'utf8')
const resubmitRoute = readFileSync(
  'server/api/video/jobs/[id]/resubmit.post.ts',
  'utf8',
)

assert.match(getRoute, /userId: auth\.user\.id/)
assert.match(getRoute, /pageCount/)
assert.match(deleteRoute, /userId: auth\.user\.id/)
assert.match(deleteRoute, /status: \{ in: \['DONE', 'FAILED', 'CANCELLED'\] \}/)
assert.match(resubmitRoute, /userId: auth\.user\.id/)
assert.match(resubmitRoute, /authAndGate\(event/)
assert.match(resubmitRoute, /prepareArtJobRetryPayload/)
assert.match(resubmitRoute, /await gate\.commit/)
console.log('Video generator history contract passed.')
