// /utils/scripts/verifyComicStudioImport.test.ts
//
// Contract test for the Comic Studio import (utils/comicStudioImport.ts).
// What it protects: a ledger import cannot reference a slot or entity it did not
// declare, an ArtJob can only be claimed once, and a job's lane is read from its own
// workflow graph so a mislabelled ledger row cannot file a Krea render under an SDXL lane.
import assert from 'node:assert/strict'

import { DEFAULT_COMIC_LANES } from '../comicLanes.js'
import {
  comicJobRequestId,
  detectComicLaneForJob,
  normalizeComicImport,
} from '../comicStudioImport.js'

{
  const { payload, errors } = normalizeComicImport({
    series: { slug: 'zuzu-koala-assassin', title: 'Zuzu' },
    entities: [
      { key: 'zuzu', kind: 'character', name: 'Zuzu' },
      { key: 'zuzu', name: 'again' },
    ],
    slots: [
      { key: 'r3-maw', entityKey: 'zuzu', title: 'Maw', aspect: '16:9' },
      { key: 'orphan', entityKey: 'nobody', title: 'Orphan' },
    ],
    attempts: [
      { slotKey: 'r3-maw', artJobId: 10, laneKey: 'zimage-turbo' },
      { slotKey: 'r3-maw', artJobId: 10 },
      { slotKey: 'orphan', artJobId: 11 },
    ],
  })
  assert.ok(payload)
  assert.equal(payload!.entities.length, 1)
  assert.equal(payload!.slots.length, 1)
  assert.equal(payload!.slots[0]!.aspect, '16:9')
  assert.equal(payload!.attempts.length, 1)
  assert.equal(payload!.issueNotes, null)
  assert.equal(
    normalizeComicImport({ series: { slug: 'a' }, issueNotes: '# Script' })
      .payload?.issueNotes,
    '# Script',
  )
  assert.equal(errors.length, 4)
  assert.equal(
    normalizeComicImport({ series: { slug: 'Bad Slug' } }).payload,
    null,
  )
}
console.log('✅ imports reject unknown slots/entities and duplicate ArtJobs')

{
  assert.equal(
    detectComicLaneForJob(DEFAULT_COMIC_LANES, {
      '1': {
        class_type: 'UnetLoaderGGUF',
        inputs: { unet_name: 'Krea-2-Turbo-Q5_K_S.gguf' },
      },
    }),
    'krea2',
  )
  assert.equal(
    detectComicLaneForJob(DEFAULT_COMIC_LANES, {
      '1': {
        class_type: 'UNETLoader',
        inputs: { unet_name: 'z_image_turbo_bf16.safetensors' },
      },
    }),
    'zimage-turbo',
  )
  assert.equal(
    detectComicLaneForJob(DEFAULT_COMIC_LANES, {
      '4': {
        class_type: 'CheckpointLoaderSimple',
        inputs: { ckpt_name: 'Illustrious/furrytoonmix_xlV3.safetensors' },
      },
    }),
    'il-furrytoonmix',
  )
  assert.equal(
    detectComicLaneForJob(DEFAULT_COMIC_LANES, {
      '4': { inputs: { ckpt_name: 'SDXL/other.safetensors' } },
    }),
    null,
  )
  assert.equal(
    comicJobRequestId({
      conductorRequest: { id: 'zuzu-koala-assassin-01/kid-08-fennec' },
    }),
    'zuzu-koala-assassin-01/kid-08-fennec',
  )
  assert.equal(comicJobRequestId({ provenance: { idempotencyKey: 'k' } }), 'k')
  assert.equal(comicJobRequestId({}), null)
}
console.log(
  '✅ lanes are detected from the job graph and request ids from provenance',
)
