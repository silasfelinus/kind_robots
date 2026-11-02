import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mergeAlienGuides } from '../gameOfCaptains/alienAccountMerge'
import {
  emptyAlienGuide,
  normalizeAlienGuide,
} from '../gameOfCaptains/alienFieldGuide'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'

const [a, b, c] = ALIEN_SPECIES.slice(0, 3)
assert.ok(a && b && c)
const older = normalizeAlienGuide({
  discovered: [a.id, b.id],
  friends: [a.id],
  attempted: ['135:2'],
  milestoneSeen: [5],
  milestoneDecisions: { '5': 'a' },
  contacts: { [a.id]: 'bond' },
  fieldReports: [
    { speciesId: a.id, mood: 'wary', outcome: 'bond', choice: 'observe' },
  ],
})
const otherDevice = normalizeAlienGuide({
  discovered: [b.id, c.id],
  friends: [c.id],
  attempted: ['246:3'],
  milestoneSeen: [5],
  milestoneDecisions: { '5': 'b' },
  contacts: { [c.id]: 'chaos' },
  fieldReports: [
    {
      speciesId: c.id,
      mood: 'protective',
      outcome: 'chaos',
      choice: 'approach',
    },
  ],
})
const merged = mergeAlienGuides(older, otherDevice)
assert.deepEqual(merged.discovered, [a.id, b.id, c.id])
assert.deepEqual(merged.friends, [a.id, c.id])
assert.equal(
  merged.milestoneDecisions?.['5'],
  'a',
  'server wins first committed choice',
)
assert.ok(
  merged.attempted.includes('135:2') && merged.attempted.includes('246:3'),
)
assert.equal(merged.fieldReports?.length, 2)
assert.equal(merged.contacts?.[a.id], 'bond')
assert.equal(merged.contacts?.[c.id], 'chaos')
assert.deepEqual(
  mergeAlienGuides(merged, older),
  merged,
  'stale device cannot remove discoveries',
)
assert.deepEqual(
  mergeAlienGuides(merged, otherDevice),
  merged,
  'replays are idempotent',
)
assert.deepEqual(mergeAlienGuides(null, null), emptyAlienGuide())
const legacy = normalizeAlienGuide({ discovered: [a.id], milestoneSeen: [5] })
assert.deepEqual(
  mergeAlienGuides(legacy, emptyAlienGuide()).milestoneDecisions,
  undefined,
)
assert.deepEqual(
  mergeAlienGuides(older, { discovered: ['unknown-species'] }).discovered,
  older.discovered,
  'unexpected species IDs never enter account records',
)

const root = new URL('../../', import.meta.url)
const file = (path: string) => readFileSync(new URL(path, root), 'utf8')
const schema = file('prisma/schema.prisma')
const migration = file(
  'prisma/migrations/20261102000000_space_couch_alien_guide/migration.sql',
)
const auth = file('server/utils/spaceCouchAlienAuth.ts')
const getter = file('server/api/game-of-captains/guide.get.ts')
const saver = file('server/api/game-of-captains/guide.post.ts')
const db = file('server/utils/spaceCouchAlienGuide.ts')
const store = file('stores/gameOfCaptainsStore.ts')
const scrapbook = file('components/gameOfCaptains/alien-scrapbook.vue')
assert.match(schema, /model SpaceCouchAlienGuide/)
assert.match(schema, /SpaceCouchAlienGuide\s+SpaceCouchAlienGuide\?/)
assert.match(migration, /CREATE TABLE `SpaceCouchAlienGuide`/)
assert.match(migration, /FOREIGN KEY.*`User`/)
assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i)
assert.match(auth, /requireHumanApiUser\(event\)/)
assert.match(auth, /auth\.user\.isGuest/)
assert.match(getter, /auth\.user\.id/)
assert.match(saver, /auth\.user\.id/)
assert.match(db, /version: current\.version/)
assert.match(db, /version: \{ increment: 1 \}/)
assert.match(db, /mergeAlienGuides/)
assert.match(store, /watch\(/)
assert.match(store, /ALIEN_PENDING_PREFIX/)
assert.match(store, /ALIEN_GUIDE_OWNER_KEY/)
assert.match(store, /owner === null \|\| owner === String\(id\)/)
assert.match(store, /syncAlienGuideAccount/)
assert.match(store, /retryAlienGuideSync/)
assert.match(scrapbook, /space-couch-alien-sync-status/)
assert.match(scrapbook, /space-couch-alien-retry-sync/)
console.log(
  'Space Couch account guide: owner guard, additive migration, monotonic merge, CAS and retry contracts OK',
)
