import assert from 'node:assert/strict'
import { collectPlaybookHistory, playbookRunKey, validateRunReview, REVIEW_GAME_SLUGS } from '../playbook/runReview'

assert.equal(REVIEW_GAME_SLUGS.length, 8)
assert.equal(playbookRunKey({ seed: 144, log: ['choice'] }), '144')
const trace = collectPlaybookHistory({
  seed: 144, log: ['A choice'], playerName: 'Private', email: 'secret@example.com',
  stats: { empathy: 4, token: 'hidden', name: 'Private' },
})
assert.deepEqual(trace, { seed: 144, stats: { empathy: 4 }, log: ['A choice'] })
const good = {
  game: 'ecotone', runId: '12345678-1234-4234-a234-123456789abc',
  ending: 'The hopeful road', stars: 5, comment: '',
  history: { seed: 144, log: ['A choice'], playerName: 'Private' },
}
assert.deepEqual(validateRunReview(good).history, { seed: 144, log: ['A choice'] })
for (const stars of [0, 6, 1.2, '5', null]) {
  assert.throws(() => validateRunReview({ ...good, stars }))
}
assert.throws(() => validateRunReview({ ...good, game: 'unknown' }))
assert.throws(() => validateRunReview({ ...good, comment: 'x'.repeat(2001) }))
console.log('Playbook end-of-run review contract verified')
