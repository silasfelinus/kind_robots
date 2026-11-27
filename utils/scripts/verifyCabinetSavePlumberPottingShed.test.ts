import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  enclosedPipeRooms,
  parseStage,
  SOLID_CRATE,
  SOLID_LADDER,
  TILE,
} from '../arcade/games/savePlumberLevels'
import { PlumberRun } from '../arcade/games/savePlumberPreview'
import { emptyInput, type ArcadeButton } from '../arcade/types'

const def = CAMPAIGN.find((stage) => stage.code === '1-2')!
const stage = parseStage(def)
assert.equal(stage.doors.length, 4)
const [entrance, shed, chimneyEntrance, chimney] = stage.doors
assert.ok(entrance && shed && chimneyEntrance && chimney)
assert.equal(entrance.col, 9)
assert.equal(entrance.row, 21)
assert.equal(shed.col, 30)
assert.equal(shed.row, 5)
assert.equal(entrance.to, 1)
assert.equal(shed.to, 0)
const rooms = enclosedPipeRooms(stage)
assert.equal(rooms.length, 2)
const run = new PlumberRun(
  { rng: () => 0.5, sound: { play() {} }, demo: false, hiScore: 0 },
  { customLevel: def },
)

function walkTo(col: number) {
  const target = col * TILE + TILE / 2
  for (
    let frame = 0;
    frame < 180 && Math.abs(run.hero.x - target) > 3;
    frame++
  ) {
    const input = emptyInput()
    if (run.hero.x < target) input.held.right = true
    else input.held.left = true
    run.update(input)
    assert.equal(run.mode, 'play')
  }
  assert.ok(Math.abs(run.hero.x - target) <= 3, 'walk reaches target')
}
function press(button: ArcadeButton) {
  const input = emptyInput()
  input.pressed[button] = true
  run.update(input)
}
function rest(frames: number) {
  for (let tick = 0; tick < frames; tick++) {
    run.update(emptyInput())
    assert.equal(run.mode, 'play')
  }
}

walkTo(entrance.col)
assert.ok(run.ground)
press('down')
assert.equal(run.hero.x, shed.col * TILE + TILE / 2)
assert.deepEqual(run.activePipeRoom, rooms[0])
const tokens = run.tokens
walkTo(40)
assert.equal(run.power, 'pocket-lift')
assert.equal(run.tokens, tokens + 2)
assert.equal(run.solidAt(43, 4), SOLID_CRATE)
rest(20)
press('x')
assert.equal(run.carrying, true, 'Pocket Lift carries the practice crate')
assert.notEqual(run.solidAt(43, 4), SOLID_CRATE)
rest(20)
press('x')
assert.equal(run.carrying, false)
assert.equal(run.thrown.length, 1)
rest(60)
assert.equal(run.thrown.length, 0)
assert.ok(
  Array.from({ length: 14 }, (_, i) => 44 + i).some(
    (col) => run.solidAt(col, 4) === SOLID_CRATE,
  ),
  'thrown crate settles as a reusable step',
)
walkTo(shed.col)
press('down')
assert.equal(run.hero.x, entrance.col * TILE + TILE / 2)
assert.equal(run.activePipeRoom, undefined)
assert.equal(run.power, 'pocket-lift')
assert.equal(run.deaths, 0)
assert.equal(run.lives, 3)
assert.equal(run.save, undefined)
press('down')
walkTo(40)
assert.equal(run.tokens, tokens + 2, 'revisiting cannot farm tokens')
assert.equal(run.reserve, null, 'revisiting cannot farm powers')
walkTo(shed.col)
press('down')
assert.equal(run.activePipeRoom, undefined)

walkTo(chimneyEntrance.col)
assert.ok(run.ground)
press('down')
assert.equal(run.hero.x, chimney.col * TILE + TILE / 2)
assert.deepEqual(run.activePipeRoom, rooms[1])
assert.equal(chimney.to, 2)
for (let row = 4; row <= 11; row++)
  assert.equal(run.solidAt(74, row), SOLID_LADDER)
const chimneyTokens = run.tokens
walkTo(79)
rest(30)
assert.equal(run.hero.y + 20, 12 * TILE)
walkTo(77)
walkTo(79)
assert.equal(run.tokens, chimneyTokens + 2, 'both floor tokens are reachable')
walkTo(74)
const climb = emptyInput()
climb.held.up = true
run.update(climb)
assert.ok(run.climbing)
for (let i = 0; i < 120 && run.climbing; i++) run.update(climb)
assert.ok(run.ground)
assert.equal(run.hero.y + 20, 4 * TILE)
walkTo(chimney.col)
press('down')
assert.equal(run.hero.x, chimneyEntrance.col * TILE + TILE / 2)
assert.equal(run.activePipeRoom, undefined)
assert.equal(run.deaths, 0)
assert.equal(run.lives, 3)

console.log('Save the Plumber Copper Greenhouses shed and chimney: OK')
