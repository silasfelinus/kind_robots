// Memory Dungeon live achievements come from play, never a restore (memory-dungeon t-069).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import { MEMORY_BRIAR_ACHIEVEMENTS } from '../memoryDungeon/achievements'
import {
  MEMORY_COMPLETION_CODES,
  MEMORY_MEDAL_CASE,
  memoryCompletionDeeds,
  memoryMedalDeeds,
} from '../memoryDungeon/siteAchievements'

const briar = MEMORY_BRIAR_ACHIEVEMENTS.map((medal) => medal.id)
assert.equal(briar.length, 8)

assert.deepEqual(
  memoryMedalDeeds(['the-fourth-column'], ['the-fourth-column']),
  [],
)
const first = memoryMedalDeeds([], ['the-fourth-column'])
assert.ok(first.includes('memory-dungeon-first-medal'))
assert.ok(first.includes('memory-dungeon-fourth-column'))
assert.ok(!first.includes('memory-dungeon-briar-medals'))

const house = memoryMedalDeeds(
  ['the-fourth-column'],
  ['the-fourth-column', 'e01-house-renew-honesty', 'e02-bell-witness'],
)
assert.ok(house.includes('memory-dungeon-hearth-renew'))
assert.ok(house.includes('memory-dungeon-both-marches'))
assert.ok(!house.includes('memory-dungeon-hearth-release'))
assert.ok(!house.includes('memory-dungeon-fourth-column'), 'already earned')

assert.ok(
  memoryMedalDeeds(briar.slice(0, 7), briar).includes(
    'memory-dungeon-briar-medals',
  ),
)
assert.ok(
  memoryMedalDeeds([], ['e07-vesper-public-witness']).includes(
    'memory-dungeon-hoshimori',
  ),
)
assert.ok(
  memoryMedalDeeds([], ['e07-cinder-open-blank']).includes(
    'memory-dungeon-cold-oven',
  ),
)
assert.ok(
  memoryMedalDeeds([], ['e08-night-shared-exit']).includes(
    'memory-dungeon-hoshimori-night',
  ),
)
assert.ok(
  memoryMedalDeeds([], ['e04-gate-open']).includes(
    'memory-dungeon-ordinary-kindness',
  ),
)
const many = Array.from({ length: MEMORY_MEDAL_CASE }, (_, i) => `m${i}`)
assert.ok(
  memoryMedalDeeds(many.slice(1), many).includes('memory-dungeon-medal-case'),
)

assert.deepEqual(memoryCompletionDeeds(['e01'], ['e01']), [])
assert.deepEqual(memoryCompletionDeeds(['e01'], ['e01', 'e02']), [
  'memory-dungeon-other-marches',
])
assert.deepEqual(memoryCompletionDeeds([], ['e09']), [])

// Every catalog code is wired, and every wired code is in the catalog.
const helper = readFileSync('utils/memoryDungeon/siteAchievements.ts', 'utf8')
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const wired = new Set(
  [...(helper + store).matchAll(/'(memory-dungeon-[a-z0-9-]+)'/g)].map(
    (m) => m[1]!,
  ),
)
const catalog = new Set(
  achievementsForGame('memory-dungeon').map((e) => e.code),
)
assert.ok(catalog.size >= 12)
for (const code of catalog) assert.ok(wired.has(code), `${code} is awarded`)
for (const code of wired) assert.ok(catalog.has(code), `${code} is cataloged`)
for (const code of Object.values(MEMORY_COMPLETION_CODES))
  assert.ok(catalog.has(code))
assert.ok(!catalog.has('memory-master'), 'the site-level code stays separate')

// hydrate() and loadCheckpoint() reconcile with `restoring` set, so a
// restored save never reaches the award calls.
const between = (start: string, end: string) =>
  store.slice(store.indexOf(start), store.indexOf(end, store.indexOf(start)))
assert.match(
  between('function loadCheckpoint(', 'function restoreCheckpoint('),
  /restoring = true[\s\S]*restoreCheckpoint\(index\)[\s\S]*restoring = false/,
)
assert.match(
  between('function hydrate(', 'function restoreSaved('),
  /restoring = true[\s\S]*restoreSaved\(\)[\s\S]*restoring = false/,
)
assert.ok(
  store.includes('if (!restoring) awardSite(memoryMedalDeeds(before, next))'),
)
assert.ok(
  store.includes(
    'if (!restoring && knownCompleted)\n      awardSite(memoryCompletionDeeds(knownCompleted, completed))',
  ),
)

console.log(`Memory Dungeon site achievements passed: ${catalog.size}.`)
