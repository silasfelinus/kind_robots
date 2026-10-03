// /utils/scripts/verifyComicStudio.test.ts
//
// Contract test for comic-creator/t-013 vetting rules (utils/comicStudio.ts).
// What it protects: one selected attempt per slot (the previous pick drops to liked,
// it is never thrown away), clicking an active verdict again clears it, attempt
// status follows the ArtJob without ever pretending an undelivered render is ready,
// and update bodies cannot write fields the route does not allow.
import assert from 'node:assert/strict'

import {
  applyComicVerdict,
  COMIC_QUEUING_TIMEOUT_MS,
  COMIC_SLOT_FIELDS,
  comicArrangementDiff,
  comicDisplayStatus,
  comicLaneHero,
  comicSlotCover,
  normalizeComicUpdate,
  reconcileComicAttemptStatus,
} from '../comicStudio.js'

const at = (n: number) => new Date(Date.UTC(2026, 9, 3, 0, n)).toISOString()
const attempts = [
  {
    id: 1,
    slotId: 9,
    laneKey: 'a',
    status: 'DONE',
    verdict: 'selected',
    artImageId: 11,
    createdAt: at(1),
  },
  {
    id: 2,
    slotId: 9,
    laneKey: 'a',
    status: 'DONE',
    verdict: 'none',
    artImageId: 12,
    createdAt: at(2),
  },
  {
    id: 3,
    slotId: 9,
    laneKey: 'b',
    status: 'DONE',
    verdict: 'rejected',
    artImageId: 13,
    createdAt: at(3),
  },
  {
    id: 4,
    slotId: 8,
    laneKey: 'a',
    status: 'DONE',
    verdict: 'selected',
    artImageId: 14,
    createdAt: at(4),
  },
]

{
  const next = applyComicVerdict(attempts, 2, 'selected')
  assert.equal(next.find((a) => a.id === 2)!.verdict, 'selected')
  assert.equal(next.find((a) => a.id === 1)!.verdict, 'liked')
  assert.equal(next.find((a) => a.id === 4)!.verdict, 'selected')
  const cleared = applyComicVerdict(next, 2, 'selected')
  assert.equal(cleared.find((a) => a.id === 2)!.verdict, 'none')
  assert.deepEqual(applyComicVerdict(attempts, 99, 'liked'), attempts)
}
console.log('✅ one selected attempt per slot; repeating a verdict clears it')

{
  const now = Date.parse(at(10))
  assert.equal(
    reconcileComicAttemptStatus(
      { status: 'QUEUING', createdAt: at(9) },
      null,
      now,
    ),
    null,
  )
  assert.equal(
    reconcileComicAttemptStatus(
      {
        status: 'QUEUING',
        createdAt: new Date(now - COMIC_QUEUING_TIMEOUT_MS - 1).toISOString(),
      },
      null,
      now,
    )?.status,
    'FAILED',
  )
  assert.equal(
    reconcileComicAttemptStatus(
      { status: 'PENDING', artJobId: 5, createdAt: at(1) },
      null,
      now,
    )?.status,
    'FAILED',
  )
  assert.deepEqual(
    reconcileComicAttemptStatus(
      { status: 'PENDING', artJobId: 5, createdAt: at(1) },
      { status: 'DONE', artImageId: 77 },
      now,
    ),
    { status: 'DONE', artImageId: 77, error: null },
  )
  assert.equal(
    reconcileComicAttemptStatus(
      { status: 'DONE', artJobId: 5, artImageId: 77, createdAt: at(1) },
      { status: 'DONE', artImageId: 77 },
      now,
    ),
    null,
  )
  assert.equal(
    reconcileComicAttemptStatus(
      { status: 'FAILED', artJobId: 5, createdAt: at(1) },
      { status: 'PENDING' },
      now,
    )?.status,
    'PENDING',
  )
  assert.equal(
    comicDisplayStatus({ status: 'DONE', artImageId: null }),
    'undelivered',
  )
  assert.equal(comicDisplayStatus({ status: 'DONE', artImageId: 3 }), 'ready')
  assert.equal(comicDisplayStatus({ status: 'RUNNING' }), 'rendering')
}
console.log(
  '✅ attempt status follows the ArtJob; DONE without an image stays undelivered',
)

{
  const slot9 = attempts.filter((a) => a.slotId === 9)
  assert.equal(comicLaneHero(slot9, 'a')?.id, 1)
  assert.equal(comicLaneHero(slot9, 'b')?.id, 3)
  assert.equal(comicLaneHero(slot9, 'z'), null)
  assert.equal(comicSlotCover(slot9)?.id, 1)
  assert.equal(comicSlotCover(slot9.filter((a) => a.id === 3)), null)
}
console.log(
  '✅ lane hero and slot cover prefer the pick, then likes, never a rejection for the cover',
)

{
  const { data, errors } = normalizeComicUpdate(
    { title: 'Maw', promptTags: '', status: 'final', userId: 7, aspect: 4 },
    COMIC_SLOT_FIELDS,
  )
  assert.deepEqual(data, { title: 'Maw', promptTags: null, status: 'final' })
  assert.equal(errors.length, 2)
  assert.equal(
    normalizeComicUpdate({ status: 'bogus' }, COMIC_SLOT_FIELDS).errors.length,
    1,
  )
  assert.deepEqual(
    normalizeComicUpdate({ entityId: null }, COMIC_SLOT_FIELDS).data,
    { entityId: null },
  )
}
console.log('✅ update bodies are limited to allowed fields')

{
  const current = [
    { id: 1, sortOrder: 0, entityId: 5 },
    { id: 2, sortOrder: 1, entityId: 5 },
    { id: 3, sortOrder: 2, entityId: 5 },
  ]
  assert.deepEqual(
    comicArrangementDiff(current, [{ id: 1 }, { id: 2 }, { id: 3 }]),
    [],
  )
  assert.deepEqual(
    comicArrangementDiff(current, [
      { id: 2 },
      { id: 1 },
      { id: 3, entityId: 6 },
    ]),
    [
      { id: 2, sortOrder: 0 },
      { id: 1, sortOrder: 1 },
      { id: 3, sortOrder: 2, entityId: 6 },
    ],
  )
}
console.log('✅ arrangement diffs write only rows that moved')
