// Ecotone achievements are judged from a played step only (weird-humboldt t-073).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementsForGame } from '../achievements/gameAchievements'
import { ECOTONE_HALF_GALLERY, ecotoneDeeds } from '../ecotone/achievements'
import { COMPANION_TIME_FLAGS } from '../ecotone/companionTime'
import { createRun, type LogEntry, type RunState } from '../ecotone/engine'
import { MYSTERIES } from '../ecotone/mysteries'

const quiet = {
  endingsBefore: [],
  endingsAfter: [],
  casesBefore: 0,
  casesAfter: 0,
}
const base = createRun(4242, 'reporter')
const mid: RunState = {
  ...base,
  phase: 'beat',
  event: 'green-ribbon',
  openingState: 'sober',
  meetingOrder: ['mara'],
  activeLead: 'mara',
}

function ended(patch: Partial<RunState>): RunState {
  return { ...mid, ...patch, phase: 'end' }
}

const strong = { goodwill: 8, evidence: ['a', 'b', 'c', 'd'], nerve: 6 }

// Nothing from a fresh or swapped-in run (begin, loadSlot, importSave).
assert.deepEqual(ecotoneDeeds(null, ended(strong), quiet), [])
assert.deepEqual(
  ecotoneDeeds({ ...mid, seed: mid.seed + 1 }, ended(strong), quiet),
  [],
)
// Reaching the end again from an ended state awards nothing new.
assert.deepEqual(ecotoneDeeds(ended(strong), ended(strong), quiet), [])

const hope = ecotoneDeeds(mid, ended(strong), quiet)
for (const code of [
  'weird-humboldt-first-weekend',
  'weird-humboldt-hopeful-county',
  'weird-humboldt-mara-hope',
  'weird-humboldt-clear-eyed',
])
  assert.ok(hope.includes(code), `a sober hopeful Mara ending earns ${code}`)
assert.ok(!hope.includes('weird-humboldt-dark-county'))
assert.ok(!hope.includes('weird-humboldt-long-table'))

const tipsy = ecotoneDeeds(
  { ...mid, openingState: 'tipsy' },
  ended({ ...strong, openingState: 'tipsy' }),
  quiet,
)
assert.ok(tipsy.includes('weird-humboldt-mara-hope'))
assert.ok(
  !tipsy.includes('weird-humboldt-clear-eyed'),
  'clear-eyed needs a sober opening',
)

const dark = ecotoneDeeds(mid, ended({ goodwill: 0, evidence: [] }), quiet)
assert.ok(dark.includes('weird-humboldt-dark-county'))
assert.ok(dark.includes('weird-humboldt-first-weekend'))
assert.ok(!dark.includes('weird-humboldt-mara-hope'))

const wildStart: RunState = {
  ...mid,
  event: 'quiet',
  activeLead: null,
  meetingOrder: [],
}
const wild = ecotoneDeeds(
  wildStart,
  { ...wildStart, wild: 12, phase: 'end' },
  quiet,
)
assert.ok(wild.includes('weird-humboldt-wild-way'))

const roll = (target: number, bonus: number, success: boolean): LogEntry => ({
  step: 1,
  day: 1,
  source: 'test',
  title: 'test',
  choice: 'test',
  roll: {
    dice: [5, 5],
    bonus,
    parts: [],
    total: 10 + bonus,
    target,
    success,
    natural: null,
  },
  text: '',
  effects: {},
})
assert.ok(
  ecotoneDeeds(mid, { ...mid, log: [roll(12, 1, true)] }, quiet).includes(
    'weird-humboldt-long-shot',
  ),
)
assert.ok(
  !ecotoneDeeds(mid, { ...mid, log: [roll(7, 0, true)] }, quiet).includes(
    'weird-humboldt-long-shot',
  ),
  'an even-odds pass is not a long shot',
)
assert.ok(
  !ecotoneDeeds(mid, { ...mid, log: [roll(12, 1, false)] }, quiet).includes(
    'weird-humboldt-long-shot',
  ),
)

const allMet: RunState = {
  ...mid,
  meetingOrder: ['mara', 'kit', 'juniper', 'cedar'],
  travelCompanions: ['kit', 'juniper'],
}
const crowd = ecotoneDeeds(mid, allMet, quiet)
assert.ok(crowd.includes('weird-humboldt-all-guides'))
assert.ok(crowd.includes('weird-humboldt-full-car'))

// Free hours with three guides, then a hopeful finish: the Long Table.
const hourFlags = Object.entries(COMPANION_TIME_FLAGS)
  .filter(([, id], index, all) => all.findIndex(([, o]) => o === id) === index)
  .map(([flag]) => flag)
const family: RunState = { ...allMet, flags: hourFlags.slice(0, 1) }
assert.ok(ecotoneDeeds(mid, family, quiet).includes('weird-humboldt-free-hour'))
const familyEnd = ecotoneDeeds(
  { ...allMet, flags: hourFlags },
  ended({ ...allMet, ...strong, flags: hourFlags }),
  quiet,
)
assert.ok(familyEnd.includes('weird-humboldt-long-table'))
assert.ok(!familyEnd.includes('weird-humboldt-free-hour'), 'no new hour spent')

assert.equal(MYSTERIES.length, 12)
const ledgers = ecotoneDeeds(
  mid,
  { ...mid },
  {
    endingsBefore: Array(ECOTONE_HALF_GALLERY - 1).fill('x'),
    endingsAfter: Array(ECOTONE_HALF_GALLERY).fill('x'),
    casesBefore: 11,
    casesAfter: 12,
  },
)
assert.ok(ledgers.includes('weird-humboldt-half-gallery'))
assert.ok(ledgers.includes('weird-humboldt-all-cases'))

// Every code the helper can award is in the catalog, and the store only
// judges from update(), never from loadSlot/importSave/initialize.
const helper = readFileSync('utils/ecotone/achievements.ts', 'utf8')
const catalog = new Set(
  achievementsForGame('weird-humboldt').map((e) => e.code),
)
const awarded = [...helper.matchAll(/'(weird-humboldt-[a-z-]+)'/g)].map(
  (m) => m[1]!,
)
assert.ok(awarded.length >= 12)
for (const code of awarded)
  assert.ok(catalog.has(code), `${code} is in the catalog`)
for (const code of catalog)
  assert.ok(awarded.includes(code), `${code} is awarded by the helper`)
const store = readFileSync('stores/ecotoneStore.ts', 'utf8')
assert.equal(store.match(/ecotoneDeeds\(/g)?.length, 1)
const updateBody = store.slice(
  store.indexOf('function update('),
  store.indexOf('function begin('),
)
assert.ok(updateBody.includes('ecotoneDeeds(before, next'))
for (const fn of [
  'function loadSlot(',
  'function importSave(',
  'function initialize(',
]) {
  const start = store.indexOf(fn)
  const body = store.slice(start, store.indexOf('\n  }\n', start))
  assert.ok(!body.includes('update('), `${fn} must not replay update()`)
}

console.log(`Ecotone achievements passed: ${catalog.size} achievements.`)
