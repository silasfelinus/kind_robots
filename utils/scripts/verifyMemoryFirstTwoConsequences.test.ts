import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { newBriarSave } from '../memoryDungeonWorld'
import { newHouseProgress } from '../memoryDungeon/house'
import { newDarkHouseProgress } from '../memoryDungeon/darkHouse'
import {
  newDarkBriarProgress,
  darkBriarCanTravel,
} from '../memoryDungeon/darkBriar'
import {
  firstTwoWorldFrames,
  firstTwoSceneCallbacks,
  firstTwoPhysicalConsequence,
  darkBriarExtraBridge,
  crossRealmConsequenceLedger,
  crossRealmHouseEpilogue,
} from '../memoryDungeon/firstTwoConsequences'

const base = newBriarSave()
const house = newHouseProgress()
const mirror = newDarkHouseProgress()
assert.deepEqual(firstTwoWorldFrames(base, mirror), {
  memoryCustody: 'unset',
  crossingAccord: 'unset',
  combination: 'unset:unset',
})
const combinations = new Set<string>()
for (const custody of ['release', 'renew', 'break'] as const) {
  for (const crossing of ['return', 'commons'] as const) {
    const frame = firstTwoWorldFrames(
      { ...base, house: { ...house, ending: custody } },
      { ...mirror, ending: crossing },
    )
    assert.equal(frame.memoryCustody, custody)
    assert.equal(frame.crossingAccord, crossing)
    combinations.add(frame.combination)
    const projection = firstTwoPhysicalConsequence('2,4', frame)
    assert.ok(projection && projection.length > 75)
    assert.equal(firstTwoPhysicalConsequence('8,8', frame), null)
  }
}
assert.equal(
  combinations.size,
  6,
  'Only two global switches yield six worldframes',
)

const choiceChannels = [
  ['2,4', 'lend', 'copy'],
  ['4,3', 'plan', 'load'],
  ['3,2', 'ask', 'offer'],
  ['5,4', 'truth', 'errand'],
  ['6,4', 'carry', 'read'],
  ['2,6', 'trace', 'listen'],
  ['3,5', 'light', 'listen'],
  ['6,3', 'remember', 'protect'],
  ['2,5', 'archive', 'grieve'],
] as const
for (const [site, left, right] of choiceChannels) {
  const a = firstTwoSceneCallbacks(
    site,
    { [site]: left },
    newDarkBriarProgress(),
  )
  const b = firstTwoSceneCallbacks(
    site,
    { [site]: right },
    newDarkBriarProgress(),
  )
  assert.equal(a.length, 1)
  assert.equal(b.length, 1)
  assert.notEqual(
    a[0],
    b[0],
    site + ' should remember the actual earlier approach',
  )
  assert.deepEqual(firstTwoSceneCallbacks(site, {}, newDarkBriarProgress()), [])
}
assert.deepEqual(
  firstTwoSceneCallbacks('1,1', { '3,2': 'ask' }, newDarkBriarProgress()),
  [],
)
assert.deepEqual(
  firstTwoSceneCallbacks('3,2', { '3,2': 'ask' }, newDarkBriarProgress(), 0),
  [],
)
assert.equal(
  firstTwoSceneCallbacks('3,2', { '3,2': 'ask' }, newDarkBriarProgress(), 50)
    .length,
  1,
  'High requested callback budget cannot multiply the script',
)
const allUnrelated = Object.fromEntries(
  choiceChannels.map(([key, left]) => [key, left]),
)
assert.equal(
  firstTwoSceneCallbacks('4,3', allUnrelated, newDarkBriarProgress()).length,
  1,
  'A huge choice ledger never dumps all historical callbacks into one encounter',
)

const before = newDarkBriarProgress()
assert.equal(darkBriarExtraBridge('5,4', '7,4', before), false)
assert.equal(
  darkBriarCanTravel('5,4', '7,4', ['5,4', '7,4'], before),
  false,
  'Bridge shortcut is absent before labor is actually undertaken',
)
const built = { ...before, sceneChoices: { '5,4': 'draw' } }
assert.equal(darkBriarExtraBridge('5,4', '7,4', built), true)
assert.equal(darkBriarExtraBridge('7,4', '5,4', built), true)
assert.equal(darkBriarExtraBridge('2,4', '8,4', built), false)
assert.equal(darkBriarCanTravel('5,4', '7,4', ['5,4', '7,4'], built), true)
assert.equal(darkBriarCanTravel('7,4', '5,4', ['5,4', '7,4'], built), true)
assert.equal(
  darkBriarCanTravel('5,4', '7,4', ['5,4'], built),
  false,
  'Cannot travel to unrevealed land even with a repaired bridge',
)
const released = { ...before, sceneChoices: { '5,4': 'release' } }
assert.equal(darkBriarExtraBridge('5,4', '7,4', released), false)
assert.ok(
  firstTwoSceneCallbacks('5,4', { '5,4': 'truth' }, built).some((line) =>
    line.includes('shorter physical route'),
  ),
)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
const stage = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
assert.ok(store.includes('firstTwoWorldFrames(state.value, darkHouse.value)'))
assert.match(store, /firstTwoSceneCallbacks\(\s*dark\.value\.player/)
assert.match(
  store,
  /darkBriarCanTravel\([\s\S]*?dark\.value\.revealed,[\s\S]*?dark\.value/,
)
assert.ok(stage.includes('data-testid="dark-briar-earned-callbacks"'))
assert.ok(stage.includes('data-testid="dark-briar-custody-world-change"'))

const earnedHouseEpilogues = new Set<string>()
for (const witnessChoice of ['remember', 'protect'] as const) {
  for (const ending of ['return', 'commons'] as const) {
    const original = {
      ...base,
      house: { ...house, ending: 'release' as const },
      sceneChoices: { '6,3': witnessChoice, '4,3': 'plan' },
    }
    const reflected = { ...mirror, ending }
    const ledger = crossRealmConsequenceLedger(original, reflected)
    assert.equal(ledger.memoryCustody, 'release')
    assert.equal(ledger.crossingAccord, ending)
    assert.equal(
      ledger.witnessRecord,
      witnessChoice === 'remember' ? 'copied' : 'protected',
    )
    assert.equal(ledger.orensProvision, 'route')
    const text = crossRealmHouseEpilogue(original, reflected)
    assert.ok(text.includes('Oren'), 'Earned logistics must affect the ending')
    assert.ok(
      witnessChoice === 'remember'
        ? text.includes('names you copied') || text.includes('copied names')
        : text.includes('names you protected') ||
            text.includes('shielded the names'),
      'The original witness decision must survive into the ending',
    )
    assert.equal(
      crossRealmHouseEpilogue(
        JSON.parse(JSON.stringify(original)),
        JSON.parse(JSON.stringify(reflected)),
      ),
      text,
      'An existing save round-trip must not invent new ledger fields',
    )
    earnedHouseEpilogues.add(text)
  }
}
assert.equal(earnedHouseEpilogues.size, 4, 'Both House endings react to both witness policies')
const supplies = crossRealmHouseEpilogue(
  { ...base, sceneChoices: { '4,3': 'load' } },
  { ...mirror, ending: 'commons' },
)
assert.ok(supplies.includes('provisions'))
assert.ok(!supplies.includes('route you planned'))
assert.equal(
  crossRealmHouseEpilogue(
    { ...base, sceneChoices: { '4,3': 'invented', '6,3': 'invented' } },
    { ...mirror, ending: 'return' },
  ),
  '',
  'Unrecognized source choices must never earn an epilogue',
)
assert.equal(
  crossRealmHouseEpilogue(
    { ...base, sceneChoices: { '4,3': 'plan', '6,3': 'remember' } },
    mirror,
  ),
  '',
  'No future ending content may appear before the mirrored House resolves',
)
assert.equal(
  crossRealmConsequenceLedger(base, mirror).witnessRecord,
  'unset',
  'Old saves without the portable clue remain playable',
)
assert.match(
  store,
  /crossRealmHouseEpilogue\(state\.value, darkHouse\.value\)/,
  'The real mirrored House verdict must render the earned epilogue',
)

console.log(
  'Six earned worldframes, bounded relationship callbacks, and physical bridge shortcut pass',
)
