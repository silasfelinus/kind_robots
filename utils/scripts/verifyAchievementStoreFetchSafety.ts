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
  source.includes('const activeScoreFetches = ref(0)') &&
    source.includes('loadingScores.value = activeScoreFetches.value > 0'),
  'Score loading must remain accurate across concurrent leaderboard requests.',
)

console.log('Achievement store fetch safety contract passed.')
