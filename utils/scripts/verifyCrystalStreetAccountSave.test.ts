import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  accountSaveKey,
  DEFAULT_SETTINGS,
  emptyScrapbook,
  emptyStamps,
  mergeCrystalStreetSaves,
  parseCrystalStreetSave,
  type CrystalStreetSave,
} from '../crystalStreet/accountSave'
import { newRun } from '../crystalStreet/rules'
import { readingDelay, readingStops } from '../crystalStreet/reading'

const initial: CrystalStreetSave = {
  version: 1,
  stamps: emptyStamps(),
  run: null,
  scrapbook: emptyScrapbook(),
  settings: { ...DEFAULT_SETTINGS },
  tips: [],
}
const roundTrip = (save: CrystalStreetSave) =>
  parseCrystalStreetSave(JSON.stringify(save))

assert.deepEqual(roundTrip(initial), initial)
assert.equal(
  roundTrip({
    ...initial,
    settings: { ...DEFAULT_SETTINGS, readingSpeed: 'fast' },
  }).settings.readingSpeed,
  'fast',
)
assert.equal(
  parseCrystalStreetSave(JSON.stringify({ ...initial, settings: {} })).settings
    .readingSpeed,
  'instant',
)
assert.equal(readingDelay('normal', true), 0)
assert.equal(readingDelay('instant', false), 0)
assert.ok(readingDelay('normal', false) > readingDelay('fast', false))
assert.deepEqual(readingStops('Two words.'), [4, 10])
assert.deepEqual(readingStops(''), [])
assert.notEqual(accountSaveKey(11), accountSaveKey(12))
assert.throws(() => parseCrystalStreetSave('{"version":2}'))
assert.throws(() =>
  parseCrystalStreetSave(JSON.stringify({ ...initial, run: {} })),
)
assert.throws(() =>
  parseCrystalStreetSave(JSON.stringify({ ...initial, stamps: { run: -1 } })),
)
const local: CrystalStreetSave = {
  ...initial,
  stamps: { ...initial.stamps, run: 20, scrapbook: 20 },
  run: newRun({
    seed: 'account-week',
    name: 'Tester',
    pronouns: 'they/them',
    archetype: 'jock',
  }),
  scrapbook: { runs: [], endings: ['one'], friends: ['friend-one'] },
}
const remote: CrystalStreetSave = {
  ...initial,
  stamps: { ...initial.stamps, settings: 30, scrapbook: 30 },
  scrapbook: { runs: [], endings: ['two'], friends: ['friend-two'] },
  settings: { ...DEFAULT_SETTINGS, textSize: 'large' },
}
const merged = mergeCrystalStreetSaves(local, remote)
assert.equal(merged.run?.seed, 'account-week')
assert.equal(merged.settings.textSize, 'large')
assert.deepEqual(merged.scrapbook.endings, ['one', 'two'])
assert.deepEqual(merged.scrapbook.friends, ['friend-one', 'friend-two'])
assert.equal(roundTrip(merged).run?.seed, 'account-week')
const reset: CrystalStreetSave = {
  ...initial,
  stamps: { ...initial.stamps, run: 40, scrapbook: 40, reset: 40 },
}
const cleared = mergeCrystalStreetSaves(merged, reset)
assert.equal(cleared.run, null)
assert.deepEqual(cleared.scrapbook, emptyScrapbook())
assert.deepEqual(
  mergeCrystalStreetSaves(reset, merged).scrapbook,
  emptyScrapbook(),
)
for (const method of ['get', 'put']) {
  const route = readFileSync(
    `server/api/crystal-street/account-save.${method}.ts`,
    'utf8',
  )
  assert.match(route, /requireHumanApiUser\(event\)/)
  assert.match(route, /user\.isGuest \|\| user\.id === 10/)
  assert.match(route, /'Cache-Control', 'private, no-store'/)
  assert.match(route, /'Vary', 'Authorization'/)
  assert.match(route, /parseCrystalStreetSave/)
  assert.match(route, /userId: user\.id/)
}
const put = readFileSync(
  'server/api/crystal-street/account-save.put.ts',
  'utf8',
)
assert.match(put, /expectedRevision/)
assert.match(put, /input\.ownerId !== user\.id/)
assert.match(put, /revision: prior/)
assert.match(put, /P2002/)
const store = readFileSync('stores/crystalStreetStore.ts', 'utf8')
assert.match(store, /accountSaveKey\(owner\)/)
assert.match(store, /result\.data\?\.ownerId !== owner/)
assert.match(store, /generation === epoch && owner === accountOwner\.value/)
assert.match(store, /persist\('scrapbook', 'reset'\)/)
assert.match(store, /persist\('run'\)/)
assert.match(store, /importDeviceProgress/)
console.log(
  'Crystal Street account save: round trip, isolation, merge, reset, revision guards OK',
)
