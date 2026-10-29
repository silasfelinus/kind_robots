import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HOUSE_ENTRY, HOUSE_ROOMS } from '../memoryDungeon/house'
import { darkHouseTrialFaces } from '../memoryDungeon/darkHouseChallenges'
import {
  DARK_HOUSE_ROOMS,
  newDarkHouseProgress,
  restoreDarkHouseProgress,
  canEnterDarkHouse,
  darkHouseChoose,
  darkHouseExits,
  darkHouseMove,
  darkHouseFlip,
  validateDarkHouse,
} from '../memoryDungeon/darkHouse'
import {
  DARK_BRIAR_WITNESSES,
  newDarkBriarProgress,
} from '../memoryDungeon/darkBriar'

assert.deepEqual(validateDarkHouse(), [])
assert.equal(Object.keys(DARK_HOUSE_ROOMS).length, 36)
assert.equal(HOUSE_ENTRY, 'HD-01')
for (const [id, room] of Object.entries(DARK_HOUSE_ROOMS)) {
  const base = HOUSE_ROOMS[id]!
  assert.ok(base, 'Mirrored rooms retain canonical position IDs')
  assert.equal(room.id, base.id)
  assert.equal(room.kind, base.kind)
  assert.deepEqual(room.exits, base.exits)
  assert.notEqual(
    room.title,
    base.title,
    'Every mirrored room is a new dramatic interpretation',
  )
  assert.notEqual(room.opening, base.opening)
  assert.ok(room.imagePath.endsWith('/' + id.toLowerCase() + '.webp'))
  assert.equal(room.choices.length, 2)
  assert.notEqual(room.choices[0]!.outcome, room.choices[1]!.outcome)
}

const briar = newDarkBriarProgress()
assert.equal(canEnterDarkHouse(briar), false)
const witnessChoices = Object.fromEntries(
  DARK_BRIAR_WITNESSES.map((key) => [key, 'seen']),
)
const revealed = {
  ...briar,
  waveIndex: 3,
  phase: 'exploring' as const,
  player: '6,2',
  mapCards: Array.from({ length: 16 }, (_, i) => ({
    id: i,
    pairId: Math.floor(i / 2),
    image: 'memory-' + Math.floor(i / 2),
    tile: String(i),
    flipped: true,
    matched: true,
  })),
  sceneChoices: witnessChoices,
}
assert.equal(canEnterDarkHouse(revealed), true)
assert.equal(canEnterDarkHouse({ ...revealed, player: '3,1' }), false)
assert.equal(canEnterDarkHouse({ ...revealed, sceneChoices: {} }), false)
assert.equal(canEnterDarkHouse({ ...revealed, mapCards: [] }), false)

// Inherited object keys are not authored chambers. A forged save must not
// crash while restoring decisions or fabricate a verdict.
for (const key of ['constructor', 'toString', '__proto__']) {
  const forged = {
    active: true,
    current: key,
    visited: [key],
    decisions: Object.fromEntries([[key, 'attend']]),
    trials: Object.fromEntries([[key, { matched: [] }]]),
    puzzles: Object.fromEntries([[key, { solved: true }]]),
  }
  const safe = restoreDarkHouseProgress(forged)
  assert.equal(safe.current, HOUSE_ENTRY)
  assert.deepEqual(safe.visited, [HOUSE_ENTRY])
  assert.deepEqual(safe.decisions, {})
  assert.deepEqual(safe.trials, {})
  assert.deepEqual(safe.puzzles, {})
  assert.equal(safe.ending, null)
  assert.deepEqual(darkHouseExits(safe), [])
}

const fresh = newDarkHouseProgress()
assert.equal(fresh.active, false)
assert.equal(darkHouseChoose(fresh, 'attend'), fresh)
let house = { ...fresh, active: true }
assert.deepEqual(house.visited, ['HD-01'])
assert.deepEqual(
  darkHouseExits(house),
  [],
  'Unanswered opening scene cannot be bypassed by clicking another square',
)
assert.equal(
  darkHouseMove(house, 'HD-36'),
  house,
  'Cannot teleport to the ending',
)
house = darkHouseChoose(house, 'attend')
assert.equal(house.decisions['HD-01'], 'attend')
assert.ok(darkHouseExits(house).includes('HD-02'))
assert.ok(darkHouseExits(house).includes('HD-07'))
assert.equal(
  darkHouseChoose(house, 'refuse'),
  house,
  'No reward-farming by changing a room answer',
)
house = darkHouseMove(house, 'HD-07')
assert.equal(house.current, 'HD-07')
assert.ok(house.visited.includes('HD-07'))

const restored = restoreDarkHouseProgress(JSON.parse(JSON.stringify(house)))
assert.equal(restored.current, 'HD-07')
assert.deepEqual(restored.visited, house.visited)
assert.equal(restored.decisions['HD-01'], 'attend')
assert.equal(restored.active, true)
assert.equal(
  restoreDarkHouseProgress({
    current: 'HD-99',
    decisions: { 'HD-03': 'bogus' },
    ending: 'return',
  }).ending,
  null,
  'Unverified completion flag cannot mint a House ending',
)
assert.equal(
  restoreDarkHouseProgress({
    visited: ['HD-35'],
    decisions: { 'HD-35': 'attend' },
  }).ending,
  'return',
)
assert.equal(
  restoreDarkHouseProgress({
    visited: ['HD-35'],
    decisions: { 'HD-35': 'refuse' },
  }).ending,
  'commons',
)

// Valid choice IDs in chambers never visited must not mint a reflected
// verdict, bypass the Warden, or rewrite the player's saved decisions.
const tampered = restoreDarkHouseProgress({
  active: true,
  current: 'HD-02',
  visited: ['HD-01', 'HD-02'],
  decisions: {
    'HD-01': 'attend',
    'HD-02': 'refuse',
    'HD-32': 'attend',
    'HD-35': 'refuse',
  },
})
assert.deepEqual(tampered.decisions, {
  'HD-01': 'attend',
  'HD-02': 'refuse',
})
assert.equal(tampered.ending, null)
assert.equal(tampered.current, 'HD-02')
assert.deepEqual(tampered.visited, ['HD-01', 'HD-02'])
assert.deepEqual(
  restoreDarkHouseProgress(JSON.parse(JSON.stringify(tampered))),
  tampered,
  'Validated visits and decisions survive repeated restoration',
)

const passage = restoreDarkHouseProgress({
  active: true,
  current: 'HD-32',
  visited: ['HD-31', 'HD-32'],
})
assert.ok(
  !darkHouseExits(passage).includes('HD-33'),
  'Guardian decision opens HD-33',
)
let guardian = passage
for (const pairId of new Set(
  darkHouseTrialFaces('HD-32').map((face) => face.pair),
)) {
  for (const face of darkHouseTrialFaces('HD-32').filter(
    (item) => item.pair === pairId,
  )) {
    guardian = darkHouseFlip(guardian, face.id)
  }
}
guardian = darkHouseChoose(guardian, 'attend')
assert.ok(darkHouseExits(guardian).includes('HD-33'))
const hearth = restoreDarkHouseProgress({
  active: true,
  current: 'HD-35',
  visited: ['HD-32', 'HD-33', 'HD-34', 'HD-35'],
})
assert.ok(!darkHouseExits(hearth).includes('HD-36'))
const healed = darkHouseChoose(hearth, 'refuse')
assert.equal(healed.ending, 'commons')
assert.ok(darkHouseExits(healed).includes('HD-36'))

// All room identities are reachable by the House's authored layout when the
// Warden and memory-hearth negotiations are resolved.
const found = new Set(['HD-01'])
const queue = ['HD-01']
for (let i = 0; i < queue.length; i++) {
  const room = DARK_HOUSE_ROOMS[queue[i]!]!
  for (const next of room.exits) {
    if (found.has(next)) continue
    found.add(next)
    queue.push(next)
  }
}
assert.equal(found.size, 36, 'No disconnected dungeon chambers')

const component = readFileSync(
  'components/memory-dungeon/dark-house-stage.vue',
  'utf8',
)
const parent = readFileSync(
  'components/memory-dungeon/dark-briar-stage.vue',
  'utf8',
)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.ok(component.includes('data-testid="dark-house-console"'))
assert.ok(component.includes('data-testid="dark-house-choices"'))
assert.match(
  component,
  /v-else-if="world\.darkHouse\.decisions\[world\.darkHouse\.current\]"/,
  'An unresolved trial cannot announce a recorded decision',
)
assert.ok(component.includes('data-testid="dark-house-decision-recorded"'))
assert.ok(component.includes('data-testid="dark-house-passages"'))
assert.ok(
  component.indexOf('data-testid="dark-house-passages"') >
    component.indexOf('</aside>'),
  'Passages must remain outside the scrollable encounter panel',
)
assert.equal(
  (component.match(/v-for="door in world\.darkHouseDoors"/g) ?? []).length,
  1,
  'One fixed passage strip, not a second list buried in the encounter',
)
assert.match(component, /overflow-x-auto overscroll-x-contain/)
assert.match(component, /v-if="!world\.darkHouseDoors\.length"/)
assert.match(component, /:aria-label="`Travel to \$\{door\},/)
assert.ok(component.includes('world.walkDarkHouse(tileRoom.id)'))
assert.ok(component.includes('world.chooseDarkHouse(choice.id)'))
assert.ok(parent.includes('<memory-dungeon-dark-house-stage'))
assert.ok(parent.includes('world.enterDarkHouse()'))
assert.ok(store.includes('DARK_HOUSE_KEY'))
assert.ok(store.includes('restoreDarkHouseProgress'))
console.log(
  'Mirrored House: 36 authored rooms, gated witnesses, decisions, save roundtrip and illustrated one-screen UI pass',
)
