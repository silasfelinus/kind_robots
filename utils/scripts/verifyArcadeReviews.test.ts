import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HALL_GAMES, findArcadeGame } from '../arcade/games'
import { sortArcadeGamesByRating, validArcadeReview } from '../arcade/reviews'

const sample = HALL_GAMES.slice(0, 3)
assert.equal(sample.length, 3)
const stats = { [sample[0]!.slug]: { average: 4.5, count: 2 }, [sample[1]!.slug]: { average: 4.5, count: 6 } }
const ranked = sortArcadeGamesByRating(sample, stats)
assert.equal(ranked[0]?.slug, sample[1]?.slug, 'tie breaks by review count')
assert.equal(ranked[1]?.slug, sample[0]?.slug, 'rated titles appear before unrated')
assert.equal(ranked[2]?.slug, sample[2]?.slug, 'unrated remains visible last')
assert.ok(!HALL_GAMES.some((game) => game.slug === 'zuzu-lair'), 'private Lair cannot be rated in the public hall')
assert.ok(findArcadeGame('zuzu-lair'), 'old Lair scores keep their validation registry')
assert.ok(validArcadeReview({ rating: 1, comment: 'fun' }))
assert.ok(validArcadeReview({ rating: 5 }))
for (const rating of [0, 6, 2.5, '5', null]) assert.ok(!validArcadeReview({ rating }), 'invalid rating must reject')
assert.ok(!validArcadeReview({ rating: 5, comment: 'x'.repeat(2001) }))
assert.ok(readFileSync('content/channels/admin/zuzu-lair.md', 'utf8').includes('route: /admin/zuzu-lair'))
assert.ok(readFileSync('pages/admin/zuzu-lair.vue', 'utf8').includes('lair-stage'))
console.log('arcade reviews and private Lair contracts ok')
