import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { mergeRecordsById } from '../../stores/helpers/recordMerge'

type AchievementRow = {
  id: number
  label: string
  tooltip?: string | null
}

const cached: AchievementRow[] = [
  { id: 1, label: 'Cached label', tooltip: 'rich cached detail' },
  { id: 2, label: 'Local row' },
]
const incoming: AchievementRow[] = [
  { id: 1, label: 'Fresh label', tooltip: undefined },
  { id: 3, label: 'New remote row' },
]
const merged = mergeRecordsById(cached, incoming)

assert.equal(merged.length, 3)
assert.equal(merged.find((row) => row.id === 1)?.label, 'Fresh label')
assert.equal(
  merged.find((row) => row.id === 1)?.tooltip,
  'rich cached detail',
)
assert.equal(merged.find((row) => row.id === 2)?.label, 'Local row')

const source = readFileSync('stores/achievementStore.ts', 'utf8')
assert.ok(
  source.includes(
    'achievements.value = mergeRecordsById(achievements.value, res.data)',
  ),
  'Achievement catalog refreshes must merge by ID.',
)
assert.ok(
  source.indexOf('if (fetchAchievementsPromise.value)') <
    source.indexOf('if (!force && achievements.value.length)'),
  'An in-flight catalog request must win even when force is requested.',
)
assert.ok(
  source.indexOf('if (fetchRecordsPromise.value)') <
    source.indexOf('if (!force && achievementRecords.value.length)'),
  'An in-flight record request must win even when force is requested.',
)
assert.ok(
  source.includes('achievementRecords.value = res.data'),
  'Authenticated award records must remain an authoritative scoped snapshot.',
)
assert.ok(
  source.includes('fetchAchievements(true)') &&
    source.includes('fetchAchievementRecords(true)'),
  'Explicit remote initialization must still refresh both catalog and award records when requested.',
)
assert.ok(
  source.includes('const activeScoreFetches = ref(0)') &&
    source.includes('loadingScores.value = activeScoreFetches.value > 0'),
  'Score loading must remain accurate across concurrent leaderboard requests.',
)

const loaderSource = readFileSync('components/admin/kind-loader.vue', 'utf8')
const userInitializeIndex = loaderSource.indexOf('userStore.initialize?.()')
const achievementInitializeIndex = loaderSource.indexOf('achievementStore.initialize?.()')
const migrationIndex = loaderSource.indexOf(
  'achievementStore.migratePendingGuestAchievements()',
)
const routeAwardIndex = loaderSource.indexOf(
  'achievementStore.rewardAchievementForPath(route.path)',
)

assert.ok(
  userInitializeIndex >= 0 &&
    achievementInitializeIndex >= 0 &&
    userInitializeIndex < achievementInitializeIndex,
  'Startup must resolve user identity before hydrating achievement state.',
)
assert.ok(
  !loaderSource.includes('achievementStore.fetchAchievements(true)') &&
    !loaderSource.includes('achievementStore.fetchAchievementRecords(true)'),
  'Global startup must not force remote achievement catalog or record refreshes.',
)
assert.match(
  loaderSource,
  /userStore\.isLoggedIn\s*\?\s*achievementStore\.migratePendingGuestAchievements\(\)\s*:\s*undefined/,
  'Pending guest achievements must only migrate after authentication.',
)
assert.ok(
  achievementInitializeIndex < migrationIndex && migrationIndex < routeAwardIndex,
  'Local achievement hydration must precede pending migration and route awards.',
)
assert.match(
  source,
  /if \(!achievements\.value\.length\)\s*{\s*await fetchAchievements\(\)/,
  'Route/code awards must lazily fetch the catalog when local state cannot resolve the trigger.',
)
assert.match(
  source,
  /if \(!achievement\)\s*{[\s\S]*await fetchAchievementById\(achievementId\)/,
  'Direct achievement awards must lazily fetch a missing achievement by ID.',
)

const recordsRouteSource = readFileSync(
  'server/api/achievements/records.get.ts',
  'utf8',
)
assert.ok(
  recordsRouteSource.includes('getOptionalApiUser(event)'),
  'Achievement records GET must tolerate unauthenticated guest requests.',
)
assert.ok(
  !recordsRouteSource.includes('requireApiUser(event)'),
  'Achievement records GET must not turn guest reads into 401 responses.',
)
assert.match(
  recordsRouteSource,
  /if \(!auth\)[\s\S]*statusCode = 200[\s\S]*data: \[\][\s\S]*statusCode: 200/,
  'Guest achievement record reads must return a successful empty list.',
)

console.log('Achievement store fetch safety contract passed.')
