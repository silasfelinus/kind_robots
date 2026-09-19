// /utils/scripts/verifyPickLatestArchiveEntryJobs.test.ts
//
// art-archive/t-028: pure unit coverage for pickLatestArchiveEntryJobs, the
// selector behind GET /api/admin/art-archive/entries/jobs. No Prisma import
// in the module under test, so this runs without a live DATABASE_URL.
//
//   npx tsx utils/scripts/verifyPickLatestArchiveEntryJobs.test.ts
import assert from 'node:assert/strict'
import { pickLatestArchiveEntryJobs } from '../../server/utils/pickLatestArchiveEntryJobs'

{
  // newest-first input, matching the endpoint's `orderBy: { id: 'desc' }`
  const rows = [
    {
      id: 30,
      status: 'DONE',
      payload: JSON.stringify({ archiveEntryId: 5, archivePresetId: 2, actionType: 'ADD_LORA' }),
      updatedAt: '2026-09-19T10:00:00.000Z',
      error: null,
    },
    {
      id: 20,
      status: 'FAILED',
      payload: JSON.stringify({ archiveEntryId: 5, archivePresetId: 1 }),
      updatedAt: '2026-09-19T09:00:00.000Z',
      error: 'relay timeout',
    },
    {
      id: 15,
      status: 'PENDING',
      payload: JSON.stringify({ archiveEntryId: 7 }),
      updatedAt: null,
      error: null,
    },
    {
      id: 10,
      status: 'DONE',
      payload: JSON.stringify({ notAnArchiveJob: true }),
      updatedAt: '2026-09-19T08:00:00.000Z',
      error: null,
    },
  ]

  const result = pickLatestArchiveEntryJobs(rows, [5, 7, 999])
  assert.equal(result[5]?.jobId, 30, 'keeps the newest (first-seen) job per entry id, not the last')
  assert.equal(result[5]?.status, 'DONE')
  assert.equal(result[5]?.archivePresetId, 2)
  assert.equal(result[5]?.actionType, 'ADD_LORA', 'actionType is read directly from the payload, independent of archivePresetId')
  assert.equal(result[7]?.jobId, 15)
  assert.equal(result[7]?.archivePresetId, null, 'a missing archivePresetId in the payload stays null, never throws')
  assert.equal(result[7]?.actionType, null, 'a missing actionType in the payload stays null, never throws')
  assert.equal(result[999], undefined, 'an entry id with no matching job is simply absent from the result')
  assert.equal(Object.keys(result).length, 2, 'a row with no archiveEntryId at all is ignored')
}

{
  // a row whose payload can't be parsed as JSON must not crash the scan
  const malformed = [{ id: 1, status: 'PENDING', payload: '{not json', updatedAt: null, error: null }]
  const result = pickLatestArchiveEntryJobs(malformed, [1])
  assert.deepEqual(result, {}, 'a malformed payload is skipped, not matched to any entry id')
}

{
  // Date instances (what Prisma actually returns for updatedAt) serialize to ISO strings
  const dateRow = [
    {
      id: 2,
      status: 'DONE',
      payload: JSON.stringify({ archiveEntryId: 9 }),
      updatedAt: new Date('2026-09-19T12:00:00.000Z'),
      error: null,
    },
  ]
  const result = pickLatestArchiveEntryJobs(dateRow, [9])
  assert.equal(result[9]?.updatedAt, '2026-09-19T12:00:00.000Z')
}

console.log(
  'pickLatestArchiveEntryJobs: newest-first selection, missing ids, and malformed payloads all verified.',
)
