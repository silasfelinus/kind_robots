import assert from 'node:assert/strict'
import {
  CAMPAIGN,
  enclosedPipeRooms,
  parseStage,
  TILE,
} from '../arcade/games/savePlumberLevels'
import { PlumberRun } from '../arcade/games/savePlumberPreview'
import { emptyInput } from '../arcade/types'

const def = CAMPAIGN[0]!
const stage = parseStage(def)
assert.equal(stage.code, '1-1')
assert.equal(stage.doors.length, 2)
const [entrance, cellar] = stage.doors
assert.ok(entrance && cellar)
assert.equal(entrance.col, 5)
assert.equal(entrance.row, 21)
assert.equal(cellar.col, 27)
assert.equal(cellar.row, 8)
assert.equal(entrance.to, 1)
assert.equal(cellar.to, 0)
const rooms = enclosedPipeRooms(stage)
assert.equal(rooms.length, 1)
assert.equal(rooms[0]!.left, 24 * TILE)
assert.equal(rooms[0]!.right, 44 * TILE)
assert.equal(rooms[0]!.top, 3 * TILE)
assert.equal(rooms[0]!.bottom, 10 * TILE)

const run = new PlumberRun(
  { rng: () => 0.5, sound: { play() {} }, demo: false, hiScore: 0 },
  { customLevel: def },
)
function walkTo(col: number) {
  const x = col * TILE + TILE / 2
  for (let frame = 0; frame < 180 && Math.abs(run.hero.x - x) > 3; frame++) {
    const input = emptyInput()
    if (run.hero.x < x) input.held.right = true
    else input.held.left = true
    run.update(input)
    assert.equal(run.mode, 'play')
  }
  assert.ok(Math.abs(run.hero.x - x) <= 3, 'walk reaches pipe or pickup')
}

function pipe() {
  const input = emptyInput()
  input.pressed.down = true
  run.update(input)
}

walkTo(entrance.col)
assert.equal(run.ground, true)
assert.equal(run.activePipeRoom, undefined)
const tokens = run.tokens
pipe()
assert.equal(run.hero.x, cellar.col * TILE + TILE / 2)
assert.deepEqual(run.activePipeRoom, rooms[0])
assert.ok(run.cameraY < 0, 'camera centers the enclosed upper room')
walkTo(38)
assert.equal(run.power, 'springstep')
assert.equal(run.tokens, tokens + 3)
walkTo(cellar.col)
pipe()
assert.equal(run.hero.x, entrance.col * TILE + TILE / 2)
assert.equal(run.activePipeRoom, undefined)
assert.equal(run.power, 'springstep')
assert.equal(run.lives, 3)
assert.equal(run.deaths, 0)
assert.equal(run.save, undefined)

// The optional room cannot duplicate its reward through repeated pipe travel.
pipe()
walkTo(38)
assert.equal(run.tokens, tokens + 3)
assert.equal(run.reserve, null)
walkTo(cellar.col)
pipe()
assert.equal(run.activePipeRoom, undefined)

console.log('Save the Plumber Rainy Courtyard cellar: OK')
