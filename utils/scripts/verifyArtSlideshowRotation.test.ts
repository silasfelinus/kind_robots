// /utils/scripts/verifyArtSlideshowRotation.test.ts
//
// Self-test for utils/artSlideshowRotation.ts -- the pure "what plays next"
// arithmetic behind the fullscreen ArtJob slideshow.
//
// The cases that matter here are the ones a hand-check misses: a job that
// reaches DONE out of id order (so a max-id watermark would swallow it), a
// pool smaller than the no-repeat window (so a naive exclusion leaves no
// candidate and the slideshow freezes), and a depth reduction that has to drop
// the oldest rows rather than the newest.
import assert from 'node:assert/strict'

import {
  historyLimit,
  mergeSlideshowPool,
  pickRandomJobId,
  rememberShownId,
  unseenJobIds,
} from '../artSlideshowRotation.js'

function job(id: number, tag = ''): { id: number; tag: string } {
  return { id, tag }
}

function run(): void {
  // --- mergeSlideshowPool ---
  const merged = mergeSlideshowPool([job(3), job(1)], [job(4), job(2)], 10)
  assert.deepEqual(
    merged.map((entry) => entry.id),
    [4, 3, 2, 1],
    'merged pool is ordered newest id first',
  )

  const replaced = mergeSlideshowPool([job(2, 'stale')], [job(2, 'fresh')], 10)
  assert.equal(replaced.length, 1, 'a re-fetched id does not duplicate')
  assert.equal(
    replaced[0]?.tag,
    'fresh',
    'the incoming row wins on id collision',
  )

  const trimmed = mergeSlideshowPool([job(1), job(2), job(3)], [job(4)], 2)
  assert.deepEqual(
    trimmed.map((entry) => entry.id),
    [4, 3],
    'depth trims the oldest rows, not the newest',
  )
  assert.equal(
    mergeSlideshowPool([job(1), job(2)], [], 0).length,
    1,
    'a nonsense depth still leaves one slide rather than an empty pool',
  )

  // --- unseenJobIds ---
  assert.deepEqual(
    unseenJobIds([5, 4], [job(7), job(6), job(5), job(4)]),
    [6, 7],
    'new arrivals come back oldest first so they play in finish order',
  )
  assert.deepEqual(
    unseenJobIds([9, 8, 7], [job(9), job(8)]),
    [],
    'a poll with nothing new announces nothing',
  )
  assert.deepEqual(
    unseenJobIds([9], [job(9), job(3)]),
    [3],
    'a job that finishes out of id order is still announced (no max-id watermark)',
  )
  assert.deepEqual(
    unseenJobIds([], [job(2), job(2)]),
    [2],
    'a duplicated row in one response is announced once',
  )

  // --- pickRandomJobId ---
  assert.equal(
    pickRandomJobId([], [], () => 0),
    null,
    'an empty pool picks nothing',
  )
  assert.equal(
    pickRandomJobId([11], [11], () => 0),
    11,
    'a single-image pool keeps showing its one image',
  )
  assert.equal(
    pickRandomJobId([11, 12], [12], () => 0),
    11,
    'a two-image pool alternates instead of repeating',
  )
  assert.equal(
    pickRandomJobId([11, 12], [11, 12], () => 0),
    11,
    'an exhausted no-repeat window falls back to everything but the current slide',
  )
  assert.equal(
    pickRandomJobId([1, 2, 3, 4], [4], () => 0.99),
    3,
    'a roll of ~1 lands on the last candidate rather than past the end',
  )
  assert.equal(
    pickRandomJobId([1, 2, 3], [], () => Number.NaN),
    1,
    'a broken random source still yields a slide',
  )

  const draws = new Set<number>()
  for (const roll of [0, 0.25, 0.5, 0.75, 0.99]) {
    const picked = pickRandomJobId([1, 2, 3, 4, 5], [], () => roll)
    assert.ok(picked !== null, 'every roll yields a slide')
    draws.add(picked as number)
  }
  assert.equal(draws.size, 5, 'the draw spreads across the whole pool')

  // --- historyLimit / rememberShownId ---
  assert.equal(historyLimit(1), 0, 'a one-image pool blocks nothing')
  assert.equal(historyLimit(4), 3, 'a small pool blocks all but one')
  assert.equal(historyLimit(500), 25, 'the no-repeat window is capped')

  assert.deepEqual(rememberShownId([1, 2], 3), [1, 2, 3])
  assert.deepEqual(
    rememberShownId([1, 2, 3], 4, 3),
    [2, 3, 4],
    'history is capped from the front',
  )
  assert.deepEqual(
    rememberShownId([1, 2, 3], 4, 0),
    [4],
    'a nonsense cap keeps at least the current slide',
  )

  console.log(
    'Art slideshow rotation self-test passed: pool merge/trim, out-of-order ' +
      'arrival detection, no-repeat draw with small-pool fallback, and ' +
      'history capping all behave.',
  )
}

run()
