import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HALL_GAMES, findArcadeGame } from '../arcade/games'
import { sortArcadeGamesByRating, validArcadeReview } from '../arcade/reviews'
import {
  GUEST_COMMENT_MAX,
  mergeRatingSummaries,
  validGuestRating,
} from '../arcade/guestRatings'
import {
  allowGuestRating,
  guestVoterHash,
} from '../../server/utils/guestRatingDamping'

const sample = HALL_GAMES.slice(0, 3)
assert.equal(sample.length, 3)
const stats = {
  [sample[0]!.slug]: { average: 4.5, count: 2 },
  [sample[1]!.slug]: { average: 4.5, count: 6 },
}
const ranked = sortArcadeGamesByRating(sample, stats)
assert.equal(ranked[0]?.slug, sample[1]?.slug, 'tie breaks by review count')
assert.equal(
  ranked[1]?.slug,
  sample[0]?.slug,
  'rated titles appear before unrated',
)
assert.equal(ranked[2]?.slug, sample[2]?.slug, 'unrated remains visible last')
assert.ok(
  !HALL_GAMES.some((game) => game.slug === 'zuzu-lair'),
  'private Lair cannot be rated in the public hall',
)
assert.ok(
  findArcadeGame('zuzu-lair'),
  'old Lair scores keep their validation registry',
)
assert.ok(validArcadeReview({ rating: 1, comment: 'fun' }))
assert.ok(validArcadeReview({ rating: 5 }))
for (const rating of [0, 6, 2.5, '5', null])
  assert.ok(!validArcadeReview({ rating }), 'invalid rating must reject')
assert.ok(!validArcadeReview({ rating: 5, comment: 'x'.repeat(2001) }))
assert.ok(
  readFileSync('content/channels/admin/zuzu-lair.md', 'utf8').includes(
    'route: /admin/zuzu-lair',
  ),
)
assert.ok(
  readFileSync('pages/admin/zuzu-lair.vue', 'utf8').includes('lair-stage'),
)
console.log('arcade reviews and private Lair contracts ok')

const token = 'abcdef0123456789-guest'
assert.ok(validGuestRating({ rating: 4, token }))
assert.ok(validGuestRating({ rating: 1, token, comment: 'fun' }))
for (const bad of [
  { rating: 0, token },
  { rating: 6, token },
  { rating: 3.5, token },
  { rating: 3 },
  { rating: 3, token: 'short' },
  { rating: 3, token: 'has spaces and symbols!!' },
  { rating: 3, token, comment: 'x'.repeat(GUEST_COMMENT_MAX + 1) },
  { rating: 3, token, comment: 7 },
])
  assert.ok(!validGuestRating(bad), 'invalid guest rating must reject')
assert.notEqual(guestVoterHash(token), token, 'raw token is never stored')
assert.equal(guestVoterHash(token), guestVoterHash(token))
assert.match(guestVoterHash(token), /^[0-9a-f]{64}$/)
const merged = mergeRatingSummaries(
  { a: { average: 5, count: 1 } },
  { a: { average: 3, count: 3 }, b: { average: 4, count: 2 } },
)
assert.equal(merged.a?.count, 4)
assert.equal(merged.a?.average, 3.5)
assert.deepEqual(merged.b, { average: 4, count: 2 })
const t0 = 1_000_000
for (let i = 0; i < 20; i++) assert.ok(allowGuestRating('203.0.113.9', t0 + i))
assert.ok(!allowGuestRating('203.0.113.9', t0 + 50), 'burst is damped')
assert.ok(allowGuestRating('203.0.113.9', t0 + 3_700_000), 'window resets')
assert.ok(allowGuestRating('203.0.113.10', t0), 'other clients unaffected')
console.log('guest rating checks ok')
