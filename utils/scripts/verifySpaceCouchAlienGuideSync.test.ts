import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ALIEN_SPECIES } from '../gameOfCaptains/alienSpecies'
import { emptyAlienGuide } from '../gameOfCaptains/alienFieldGuide'
import { mergeAlienGuideSnapshots } from '../gameOfCaptains/alienGuideSync'

const [a, b, c] = ALIEN_SPECIES.map((species) => species.id)
assert.ok(a && b && c)
const remote = {
  ...emptyAlienGuide(),
  discovered: [a, b],
  friends: [a],
  milestoneSeen: [5],
  milestoneDecisions: { '5': 'a' as const },
  fieldReports: [{ speciesId: a, mood: 'wary' as const, outcome: 'bond' as const, choice: 'observe' as const }],
}
const incoming = {
  ...emptyAlienGuide(),
  discovered: [b, c],
  friends: [b],
  milestoneSeen: [5, 12],
  milestoneDecisions: { '5': 'c' as const, '12': 'b' as const },
  fieldReports: [{ speciesId: c, mood: 'playful' as const, outcome: 'chaos' as const, choice: 'observe' as const }],
}
const merged = mergeAlienGuideSnapshots(remote, incoming)
assert.deepEqual(merged.discovered, [a, b, c])
assert.deepEqual(merged.friends, [a, b])
assert.deepEqual(merged.milestoneSeen, [5, 12])
assert.deepEqual(merged.milestoneDecisions, { '5': 'a', '12': 'b' })
assert.equal(merged.fieldReports?.length, 2)
assert.deepEqual(mergeAlienGuideSnapshots(merged, incoming), merged, 'repeat sync is idempotent')
assert.deepEqual(mergeAlienGuideSnapshots(emptyAlienGuide(), remote).discovered, [a, b])
assert.deepEqual(mergeAlienGuideSnapshots(remote, null).discovered, [a, b])
assert.deepEqual(
  mergeAlienGuideSnapshots({ discovered: ['forged', a], milestoneDecisions: { '999': 'a' } }, null).discovered,
  [a],
)
console.log('Space Couch: cross-device scrapbook unions and first-earned collector decisions stable')
const root = new URL('../../', import.meta.url)
const store = readFileSync(new URL('stores/gameOfCaptainsStore.ts', root), 'utf8')
const page = readFileSync(new URL('pages/play/game-of-captains.vue', root), 'utf8')
const ui = readFileSync(new URL('components/gameOfCaptains/alien-scrapbook.vue', root), 'utf8')
const get = readFileSync(new URL('server/api/game-of-captains/alien-guide.get.ts', root), 'utf8')
const post = readFileSync(new URL('server/api/game-of-captains/alien-guide.post.ts', root), 'utf8')
const db = readFileSync(new URL('server/utils/spaceCouchAlienGuide.ts', root), 'utf8')
assert.match(store, /ALIEN_GUIDE_OWNER_KEY/)
assert.match(store, /mergeAlienGuideSnapshots/)
assert.match(store, /syncAlienGuideToAccount/)
assert.match(page, /alienGuideSyncStatus/)
assert.match(ui, /Retry sync/)
assert.match(get, /requireHumanApiUser\(event\)/)
assert.match(post, /requireHumanApiUser\(event\)/)
assert.match(db, /version: row.version/)
assert.match(db, /prisma\.\$transaction/)
console.log('Space Couch: account owner isolation, save merge, and recovery UI OK')
