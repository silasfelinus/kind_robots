import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  encodeMakerLevel,
  newMakerLevel,
  paintMakerTile,
} from '../arcade/games/savePlumberMaker'
import { courseFromShareCode } from '../../server/utils/plumberLevelIdentity'

const source = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8')

const first = newMakerLevel()
const code = encodeMakerLevel(first)
const identity = courseFromShareCode(code)
assert.deepEqual(identity.level, first)
assert.equal(identity.fingerprint.length, 64)
assert.deepEqual(courseFromShareCode(code), identity)
assert.deepEqual(courseFromShareCode(encodeMakerLevel(first)), identity)

const changed = paintMakerTile(first, 11, 17, 'p')
assert.notEqual(
  courseFromShareCode(encodeMakerLevel(changed)).fingerprint,
  identity.fingerprint,
  'tile edits must be different immutable review targets',
)
assert.notEqual(
  courseFromShareCode(encodeMakerLevel({ ...first, title: 'Another name' }))
    .fingerprint,
  identity.fingerprint,
  'revisions cannot reuse old course reviews',
)
for (const code of ['', 'ab:cd', 'X'.repeat(12001), null, 9]) {
  assert.throws(() => courseFromShareCode(code), /course|share|Cannot open/i)
}
const schema = source('../../prisma/schema.prisma')
const migration = source(
  '../../prisma/migrations/20261027225000_plumber_levels_reactions/migration.sql',
)
const post = source('../../server/api/plumber-levels/reviews.post.ts')
const get = source('../../server/api/plumber-levels/reviews.get.ts')
const summary = source('../../server/utils/plumberLevelReviews.ts')
const makerStore = source('../../stores/savePlumberMakerStore.ts')
const makerComponent = source('../../components/arcade/plumber-level-maker.vue')
const sidebar = source('../../components/arcade/plumber-maker-sidebar.vue')
const reactionCreate = source('../../server/api/reactions/index.post.ts')
const reactionPatch = source('../../server/api/reactions/[id].patch.ts')

for (const marker of [
  'model PlumberLevel {',
  'fingerprint  String     @unique',
  'plumberLevelId',
  '@@unique([userId, plumberLevelId])',
  'PLUMBER_LEVEL',
])
  assert.ok(schema.includes(marker), 'schema missing ' + marker)
for (const marker of [
  'CREATE TABLE `PlumberLevel`',
  'ADD COLUMN `plumberLevelId`',
  'Reaction_userId_plumberLevelId_key',
  'PLUMBER_LEVEL',
  'FOREIGN KEY',
])
  assert.ok(migration.includes(marker), 'migration missing ' + marker)
assert.match(
  post,
  /requireApiUser\(event\)/,
  'only authenticated users can rate',
)
assert.match(post, /user\.id === 10/, 'guest must not rate')
assert.match(post, /isArtReviewRating\(body\.rating\)/)
assert.match(post, /reactionTypeForRating\(body\.rating\)/)
assert.match(post, /prisma\.reaction\.upsert/, 'one row per reviewer per level')
assert.match(
  post,
  /userId_plumberLevelId:/,
  'race-safe DB uniqueness for ratings',
)
assert.match(
  post,
  /courseFromShareCode\(body\.code\)/,
  'never trust an unvalidated level id',
)
assert.match(
  post,
  /fingerprint: courseData\.fingerprint/,
  'persist canonical course revision',
)
assert.match(get, /getOptionalApiUser/, 'public reviews do not require auth')
assert.match(
  get,
  /courseFromShareCode\(code\)/,
  'GET must verify full share contents',
)
assert.match(
  get,
  /course\?\.isPublic/,
  'private courses must not reveal reviews',
)
assert.match(
  summary,
  /prisma\.reaction\.aggregate/,
  'community averages from Reaction table',
)
assert.match(summary, /reactionCategory: 'PLUMBER_LEVEL'/)
assert.match(summary, /take: 30/, 'public review list is bounded')
assert.match(makerStore, /performFetch<PlumberReviewSummary>/)
assert.match(makerStore, /async function rate\(stars: number\)/)
assert.doesNotMatch(
  makerStore,
  /ratings\.value =/,
  'local scores must not masquerade as DB ratings',
)
assert.match(makerComponent, /maker\.rate\(stars\)/)
assert.match(makerComponent, /YOUR REVIEW \(OPTIONAL\)/)
assert.match(sidebar, /maker\.reviews/)
assert.match(
  reactionCreate,
  /PLUMBER_LEVEL/,
  'generic registry aware of plumber target',
)
assert.match(
  reactionPatch,
  /existingReaction\.reactionCategory === 'PLUMBER_LEVEL'/,
  'cannot bypass review constraints through generic PATCH',
)
console.log(
  'Plumber Reaction reviews: stable course identity, unique reviewer constraint, auth and read/write contracts verified',
)
