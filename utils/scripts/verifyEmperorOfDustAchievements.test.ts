// Emperor of Dust achievements (conductor emperor-of-dust t-065): each deed
// earns its codes once, at the moment it happens, and every code is in the
// catalog.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  ENDING_ACHIEVEMENTS,
  codexAchievements,
  dawnAchievements,
  relicAchievements,
} from '../emperorOfDust/fortress/achievements'
import { CODEX_SIZE } from '../emperorOfDust/fortress/codex'
import { LAST_DAY } from '../emperorOfDust/fortress/content'
import { createRun } from '../emperorOfDust/fortress/engine'
import { HEAVY_LOSSES } from '../emperorOfDust/fortress/endings'
import { emptyRelicVault } from '../emperorOfDust/fortress/relics'
import type { DawnReport, FortressRun } from '../emperorOfDust/fortress/types'

const catalog = new Set(
  achievementsForGame('emperor-of-dust').map((entry) => entry.code),
)
assert.ok(catalog.size >= 12, 'Emperor of Dust carries at least 12.')

const start = createRun(4242)
const at = (day: number, flags: string[] = [], lost = 0): FortressRun => ({
  ...start,
  day,
  flags: [...start.flags, ...flags],
  memorials: Array.from({ length: lost }, (_, i) => ({
    followerId: `f${i}`,
    questId: 'q',
    day,
  })),
})

// An ordinary night earns nothing.
assert.deepEqual(dawnAchievements(at(3), at(4)), [])

// A triumph tonight counts; one filed on an earlier night does not.
const triumph = {
  quests: [{ questId: 'q-x', tier: 'triumph' }],
} as unknown as DawnReport
const withTriumph = { ...at(4), reports: [...start.reports, triumph] }
assert.deepEqual(dawnAchievements(at(3), withTriumph), [
  'emperor-of-dust-triumph',
])
assert.deepEqual(dawnAchievements(withTriumph, { ...withTriumph, day: 5 }), [])

// The crypt sealed and the Abbess unmasked, once each.
assert.deepEqual(
  dawnAchievements(at(48), at(49, ['horror-sealed', 'abbess-unmasked'])),
  ['emperor-of-dust-crypt-sealed', 'emperor-of-dust-abbess-unmasked'],
)
assert.deepEqual(
  dawnAchievements(at(49, ['horror-sealed']), at(50, ['horror-sealed'])),
  [],
)

// The last dawn: the reign, its ending, and an empty memorial row.
const sealed = ['horror-sealed']
assert.deepEqual(
  dawnAchievements(
    at(LAST_DAY, sealed),
    at(LAST_DAY + 1, [...sealed, 'peace-bell', 'bell-rung']),
  ),
  [
    'emperor-of-dust-reign-complete',
    'emperor-of-dust-bell-restored',
    'emperor-of-dust-no-names',
  ],
)
assert.deepEqual(dawnAchievements(at(LAST_DAY), at(LAST_DAY + 1, [], 1)), [
  'emperor-of-dust-reign-complete',
  'emperor-of-dust-long-night',
])
assert.ok(
  dawnAchievements(
    at(LAST_DAY, sealed),
    at(LAST_DAY + 1, [...sealed, 'peace-iron'], HEAVY_LOSSES),
  ).includes('emperor-of-dust-hundred-candles'),
)
// A finished reign that loads finished earns nothing more.
assert.deepEqual(
  dawnAchievements(at(LAST_DAY + 1, sealed), at(LAST_DAY + 1, sealed)),
  [],
)

// Relics: the first, then the full vault.
const none = emptyRelicVault()
const one = { ...none, owned: ['eye-of-elder-crow' as const] }
const both = {
  ...one,
  owned: [...one.owned, 'komodo-brass-hourglass' as const],
}
assert.deepEqual(relicAchievements(none, one), ['emperor-of-dust-first-relic'])
assert.deepEqual(relicAchievements(one, both), [
  'emperor-of-dust-first-relic',
  'emperor-of-dust-both-relics',
])
assert.deepEqual(relicAchievements(both, both), [])

// The Codex completes once.
const codex = (n: number) => ({
  version: 1,
  revealed: Array.from({ length: n }, (_, i) => `t${i}`),
})
assert.deepEqual(
  codexAchievements(codex(CODEX_SIZE - 1) as never, codex(CODEX_SIZE) as never),
  ['emperor-of-dust-codex-complete'],
)
assert.deepEqual(
  codexAchievements(codex(CODEX_SIZE) as never, codex(CODEX_SIZE) as never),
  [],
)

// Every code a helper returns is in the catalog, and nothing in the catalog
// is left unawarded.
const awarded = new Set([
  ...Object.values(ENDING_ACHIEVEMENTS),
  'emperor-of-dust-orders-carried-out',
  'emperor-of-dust-day-well-ruled',
  'emperor-of-dust-merciful-court',
  'emperor-of-dust-triumph',
  'emperor-of-dust-crypt-sealed',
  'emperor-of-dust-abbess-unmasked',
  'emperor-of-dust-reign-complete',
  'emperor-of-dust-no-names',
  'emperor-of-dust-first-relic',
  'emperor-of-dust-both-relics',
  'emperor-of-dust-codex-complete',
])
assert.deepEqual([...awarded].sort(), [...catalog].sort())

// The store fires them at the deed, never from load, a slot or a rewind.
const store = readFileSync('stores/emperorFortressStore.ts', 'utf8')
const body = (name: string) => {
  const from = store.indexOf(`function ${name}(`)
  return store.slice(from, store.indexOf('\n  }\n', from))
}
for (const name of ['load', 'loadFromSlot', 'rewind', 'newRun'])
  assert.ok(!/award/.test(body(name)), `${name}() must award nothing.`)
assert.ok(body('finish').includes('dawnAchievements(dusk, result.run)'))
assert.ok(body('claimRelic').includes('relicAchievements(before'))
for (const name of ['finish', 'talk', 'answer', 'learn'])
  assert.ok(body(name).includes('codexAchievements(known, codex.value)'))

console.log(
  `Emperor of Dust achievements passed: ${catalog.size} achievements.`,
)
