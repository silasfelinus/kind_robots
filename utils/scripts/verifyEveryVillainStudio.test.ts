import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  STAGE_PRESETS,
  clonePreset,
  paintStage,
  stageProblems,
} from '../everyVillainTactics/studio'
import {
  availableMove,
  endTurn,
  previewShot,
  trainingState,
} from '../everyVillainTactics/training'
import { lineOfSight, tileAt } from '../everyVillainTactics/combat'

assert.equal(STAGE_PRESETS.length, 4)
for (const preset of STAGE_PRESETS) {
  assert.deepEqual(
    stageProblems(preset),
    [],
    preset.id + ' must be traversable',
  )
  assert.equal(preset.spawns.length, 6)
  assert.equal(new Set(preset.spawns.map((u) => u.id)).size, 6)
}
const quad = clonePreset('college-quad')
assert.equal(tileAt(quad.map, { x: 4, y: 2 }).wall, true)
assert.equal(tileAt(quad.map, { x: 5, y: 3 }).wall, true)
assert.equal(lineOfSight(quad.map, { x: 2, y: 2 }, { x: 7, y: 2 }), false)

const lab = clonePreset('science-lab')
assert.equal(tileAt(lab.map, { x: 3, y: 0 }).wall, true)
assert.equal(tileAt(lab.map, { x: 4, y: 2 }).cover?.west, 'full')
const picnic = clonePreset('picnic-plaza')
assert.ok(picnic.title.includes('Picnic'))

assert.equal(picnic.encounter, 'warren-wreckers')
const picnicFight = trainingState(99, picnic)
const bunnyUnits = picnicFight.units.filter((u) => u.team === 'rival')
assert.equal(bunnyUnits.length, 3)
assert.ok(bunnyUnits.every((u) => u.hp === 1 && u.maxHp === 1 && u.henchmanType === 'burrow'))
assert.equal(bunnyUnits[0]!.henchmanName, 'Foreman Thumpkin')
endTurn(picnicFight)
const targets = bunnyUnits.map((u) => u.burrowTarget)
assert.ok(targets.every(Boolean), 'Each one-hit burrower must telegraph the next tile')
assert.equal(new Set(targets.map((p) => p!.x + ',' + p!.y)).size, 3)
const replay = trainingState(99, picnic)
endTurn(replay)
assert.deepEqual(replay.units.filter((u) => u.team === 'rival').map((u) => u.burrowTarget), targets)
assert.ok(picnicFight.log.includes('dust rings'), 'Turn summary explains the warning')

const emergence = trainingState(99, picnic)
endTurn(emergence)
const planned = { ...emergence.units[3]!.burrowTarget! }
endTurn(emergence)
assert.deepEqual({ x: emergence.units[3]!.x, y: emergence.units[3]!.y }, planned)
assert.equal(emergence.units[3]!.burrowTarget, null, 'The warning resolves after a full player turn')

const sealed = trainingState(99, picnic)
endTurn(sealed)
const tunnel = sealed.units[3]!.burrowTarget!
sealed.units[2]!.x = tunnel.x
sealed.units[2]!.y = tunnel.y
const first = { x: sealed.units[3]!.x, y: sealed.units[3]!.y }
endTurn(sealed)
assert.deepEqual({ x: sealed.units[3]!.x, y: sealed.units[3]!.y }, first,
  'Occupying a marked tile must stop a burrow without overlapping fighters')
assert.equal(sealed.units[3]!.burrowTarget, null)
assert.ok(sealed.units[3]!.hp === 1, 'Blocked burrowers remain one-hit enemies')

const modified = paintStage(quad, { x: 2, y: 1 }, 'wall')
assert.equal(tileAt(modified.map, { x: 2, y: 1 }).wall, true)
assert.equal(
  tileAt(quad.map, { x: 2, y: 1 }).wall,
  undefined,
  'presets are immutable',
)
assert.equal(
  paintStage(modified, { x: 2, y: 1 }, 'erase').map.tiles['2,1'],
  undefined,
)
assert.equal(
  paintStage(quad, { x: 0, y: 4 }, 'wall'),
  quad,
  'spawns cannot be buried',
)
const secret = paintStage(quad, { x: 2, y: 0 }, 'secret')
assert.ok(secret.secrets.some((p) => p.x === 2 && p.y === 0))
assert.ok(
  !paintStage(secret, { x: 2, y: 0 }, 'secret').secrets.some(
    (p) => p.x === 2 && p.y === 0,
  ),
)

const state = trainingState(223, quad)
assert.equal(state.map.tiles['4,2']?.wall, true)
assert.equal(state.stageId, 'college-quad')
assert.equal(state.turnLimit, 9)
assert.equal(
  availableMove(state, { x: 4, y: 2 }),
  false,
  'fountain blocks movement',
)
const source = state.units[0]!
const target = state.units.find((u) => u.id === 'remy')!
const expected = previewShot(source, target, quad.map)
assert.equal(previewShot(source, target, state.map).hit, expected.hit)
assert.equal(previewShot(source, target, state.map).clear, expected.clear)

const veryShort = clonePreset('science-lab')
veryShort.turnLimit = 2
const timer = trainingState(223, veryShort)
for (let round = 0; round < 3 && timer.phase === 'active'; round++)
  endTurn(timer)
assert.equal(
  timer.phase,
  'defeat',
  'expired studio timer is enforced in combat',
)

const invalid = clonePreset('college-quad')
invalid.spawns[0]!.x = 4
invalid.spawns[0]!.y = 2
assert.ok(
  stageProblems(invalid).some((problem) => problem.includes('traversable')),
)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/everyVillainTacticsStore.ts', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-stage-studio"/)
assert.match(page, /data-testid="studio-playtest"/)
assert.match(page, /store\.paintCell\(cell\)/)
assert.match(store, /trainingState\(\s*0x53a1b7,\s*isPlaytest\.value/)
assert.match(page, /data-testid="tactics-burrow-warning"/)
assert.match(page, /data-testid="studio-encounter"/)
assert.match(store, /isBurrowWarning/)
console.log(
  'Every Villain Studio: preset maps, paint, spawns, LOS, timer and real-rules playtest verified.',
)
