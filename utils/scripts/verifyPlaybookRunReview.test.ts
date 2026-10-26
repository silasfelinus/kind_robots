import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
assert.equal(playbookRunKey({ originSeed: 144, seed: 125, log: ['many rolls'] }), '144')
const journey = collectPlaybookHistory({
  seed: 77, actions: [{ type: 'DRAW', locationId: 'mill' }],
  current: { journey: { journal: [{ text: 'The first road' }] } },
})
assert.equal((journey.actions as unknown[]).length, 1)
assert.ok(journey.current)

for (const path of [
  'components/ecotone-board.vue',
  'pages/play/emperor-of-dust.vue',
  'components/shifting-lands-journey-board.vue',
  'pages/play/zuzu-shifting-lands.vue',
  'pages/play/shifting-desks.vue',
  'pages/play/zuzu-gamebook.vue',
  'components/crystal-street/crystal-street-ending.vue',
  'pages/play/comet-city-academy.vue',
  'pages/play/game-of-captains.vue',
]) {
  const source = readFileSync(new URL('../../' + path, import.meta.url), 'utf-8')
  assert.match(source, /<PlaybookRunReview/, path + ' must offer end-of-run feedback')
}
const api = readFileSync(new URL('../../server/api/admin/playbook/reviews.get.ts', import.meta.url), 'utf-8')
assert.match(api, /requireAdminApiUser/)
const migration = readFileSync(
  new URL('../../prisma/migrations/20261026110000_playbook_run_reviews/migration.sql', import.meta.url),
  'utf-8',
)
assert.match(migration, /UNIQUE INDEX/)
console.log('Playbook end-of-run review contract and nine ending screens verified')
