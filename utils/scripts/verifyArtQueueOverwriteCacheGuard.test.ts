// /utils/scripts/verifyArtQueueOverwriteCacheGuard.test.ts
//
// THE QUEUE'S LIVE POLL MUST NOT EMPTY ITS OWN IMAGE CACHE.
//
// Silas, 2026-09-18: "still getting artqueue elements refreshing even between
// new artimage creations" -- reported AFTER the watchEffect self-trigger fix
// deployed, which is the point: this is a second, independent cause with the
// same symptom.
//
// artJobStore.fetchJobs() calls completedOverwriteIds() on every poll, and that
// used to drop the cached bytes of EVERY DONE job carrying
// `payload.retry.mode: OVERWRITE`. A LoRA probe overwrites its resource's
// preview ArtImage in place, so that is essentially the entire queue -- all 20
// DONE jobs on page 1 on the day this was found. Every 15 seconds each card's
// image was thrown away and refetched, which looks exactly like a retry loop
// but is not one: the refetch is the correct response to a cache the poll had
// just emptied.
//
// The job's updatedAt already distinguishes an image that was replaced from the
// one we hold, and it is the same version string the cache is keyed by.
import assert from 'node:assert/strict'

import { staleOverwriteImageIds } from '../artJobFields'
import { withImageVersion } from '../artImageSource'

const OVERWRITE = { retry: { mode: 'OVERWRITE' } }

function job(
  id: number,
  artImageId: number,
  updatedAt: string,
  status = 'DONE',
  payload: unknown = OVERWRITE,
) {
  return { id, artImageId, updatedAt, status, payload }
}

function main() {
  // A DONE overwrite whose bytes we already hold at this version: NOT stale.
  // This is the whole bug -- it used to be returned, every single poll.
  assert.deepEqual(
    staleOverwriteImageIds([job(27664, 25884, '2026-09-18T09:09:46.214Z')], {
      25884: '?v=' + new Date('2026-09-18T09:09:46.214Z').getTime(),
    }),
    [],
    'a settled overwrite must not invalidate its own cache',
  )

  // The same job, cached at an OLDER version: genuinely stale, drop it. The
  // fix must not cost us the refresh it exists for.
  assert.deepEqual(
    staleOverwriteImageIds([job(27664, 25884, '2026-09-18T09:09:46.214Z')], {
      25884: '?v=' + new Date('2026-09-17T00:50:07.578Z').getTime(),
    }),
    [25884],
    'a replaced image still invalidates on the next poll',
  )

  // Nothing cached: nothing to drop. Returning it would be harmless for the
  // cache but would still report work that did not happen.
  assert.deepEqual(
    staleOverwriteImageIds([job(27664, 25884, '2026-09-18T09:09:46.214Z')], {}),
    [],
  )

  // Not DONE, not an overwrite, or no image: never touched.
  assert.deepEqual(
    staleOverwriteImageIds(
      [
        job(1, 100, '2026-09-18T09:00:00.000Z', 'RUNNING'),
        job(2, 101, '2026-09-18T09:00:00.000Z', 'DONE', {}),
        job(3, 102, '2026-09-18T09:00:00.000Z', 'DONE', {
          retry: { mode: 'NEW' },
        }),
      ],
      { 100: '?v=1', 101: '?v=1', 102: '?v=1' },
    ),
    [],
  )

  // A whole page of settled probe jobs -- the real shape of the queue, and the
  // exact input that used to return all twenty ids on every poll.
  const page = Array.from({ length: 20 }, (_, i) =>
    job(
      27650 + i,
      25884 + i,
      `2026-09-18T09:${String(10 + i).padStart(2, '0')}:00.000Z`,
    ),
  )
  const cached: Record<number, string> = {}
  for (const entry of page) {
    cached[entry.artImageId] = '?v=' + new Date(entry.updatedAt).getTime()
  }
  assert.deepEqual(
    staleOverwriteImageIds(page, cached),
    [],
    'a full page of settled overwrites invalidates nothing',
  )

  // One of those twenty gets re-rendered: only that one is dropped.
  cached[25890] = '?v=1'
  assert.deepEqual(staleOverwriteImageIds(page, cached), [25890])

  // Two jobs claiming one ArtImage id: the newest decides, so an older
  // re-probe still on the page cannot invalidate the newer render we hold.
  const newest = job(9002, 25884, '2026-09-18T09:09:46.214Z')
  const older = job(9001, 25884, '2026-09-17T00:50:07.578Z')
  const heldAtNewest = {
    25884: '?v=' + new Date('2026-09-18T09:09:46.214Z').getTime(),
  }
  assert.deepEqual(staleOverwriteImageIds([older, newest], heldAtNewest), [])
  assert.deepEqual(staleOverwriteImageIds([newest, older], heldAtNewest), [])

  // A job with no updatedAt has no version, so it cannot claim to be newer
  // than a render we hold a real version for -- but it is still a difference,
  // and the safe direction for "we cannot tell" is to refetch.
  assert.deepEqual(
    staleOverwriteImageIds(
      [
        {
          id: 5,
          artImageId: 777,
          updatedAt: null,
          status: 'DONE',
          payload: OVERWRITE,
        },
      ],
      { 777: '?v=123' },
    ),
    [777],
  )

  /*
   * THE OTHER HALF OF THE SAME BUG: an overwritten ArtImage keeps its path.
   *
   * The queue card fetches `/api/art/images/:id/file?v=<updatedAt>` and so
   * always shows the current render. Every surface handed the bare static path
   * showed whichever render the browser cached first -- the object card showing
   * the original while the card beside it showed the new one. Silas,
   * 2026-09-18: "still getting incongruity between the object card and the new
   * image".
   */
  const stamp = new Date('2026-09-18T09:09:46.214Z').getTime()
  assert.equal(
    withImageVersion(
      '/images/resources/x/x-preview-1.webp',
      '2026-09-18T09:09:46.214Z',
    ),
    `/images/resources/x/x-preview-1.webp?v=${stamp}`,
  )
  // An existing query string is kept.
  assert.equal(
    withImageVersion('/images/x.webp?crop=1', '2026-09-18T09:09:46.214Z'),
    `/images/x.webp?crop=1&v=${stamp}`,
  )
  // Already versioned: left exactly as it is, so this can be applied twice.
  assert.equal(
    withImageVersion('/images/x.webp?v=5', '2026-09-18T09:09:46.214Z'),
    '/images/x.webp?v=5',
  )
  // No timestamp, or an unparseable one: no cache-buster rather than a broken
  // one. The path still renders; it just is not versioned.
  assert.equal(withImageVersion('/images/x.webp', null), '/images/x.webp')
  assert.equal(
    withImageVersion('/images/x.webp', 'not a date'),
    '/images/x.webp',
  )
  // Nothing to stamp.
  assert.equal(withImageVersion('', '2026-09-18T09:09:46.214Z'), null)
  assert.equal(withImageVersion(null, '2026-09-18T09:09:46.214Z'), null)

  console.log('verifyArtQueueOverwriteCacheGuard: all assertions passed')
}

main()
