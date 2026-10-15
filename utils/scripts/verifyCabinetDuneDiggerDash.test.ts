// Dune Digger Dash (conductor kr-arcade/t-009, approved pitch 2026-10-11-kr-cabinet-robot-digger-dunes):
// the player digs tunnels, the pump pops a sprite in four pumps and it deflates if left, sprites
// stay in open tunnel and float as eyes when walled in, boulders wobble then fall and crush, and
// the attract pilot digs toward a sprite.
//
//   npx tsx utils/scripts/verifyCabinetDuneDiggerDash.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import {
  COLS,
  DEFLATE_TICKS,
  DUNES,
  LAST_ROW,
  POP_STAGES,
  ROWS,
  SURFACE_ROW,
  W,
  boulderCount,
  buildRound,
  centre,
  chooseDir,
  crushPoints,
  create,
  depthBand,
  duneFor,
  ghostGap,
  newGrid,
  newSprite,
  open,
  popPoints,
  pump,
  pumpTarget,
  relax,
  spriteCount,
  spriteSpeed,
  unsupported,
} from '../arcade/games/duneDiggerDash'
import { emptyInput } from '../arcade/types'

assert.ok(ARCADE_GAMES.some((g) => g.slug === 'dune-digger-dash'))
assert.equal(W, COLS * 16)

// The ramp is data: harder every round, clamped.
assert.ok(spriteCount(2) > spriteCount(1))
assert.ok(boulderCount(4) > boulderCount(1))
assert.ok(spriteSpeed(3) > spriteSpeed(1))
assert.ok(ghostGap(3) < ghostGap(1))
assert.ok(spriteCount(99) <= 8 && spriteSpeed(99) <= 1 && ghostGap(99) >= 300)
assert.equal(duneFor(1), 0)
assert.equal(duneFor(DUNES.length + 1), 0)
assert.equal(new Set([1, 2, 3, 4, 5].map(duneFor)).size, DUNES.length)
assert.equal(DUNES.length, 5)

// Deeper pops pay more; a multi-crush pays more per sprite.
assert.ok(popPoints(16) > popPoints(4))
assert.equal(depthBand(SURFACE_ROW + 1), 0)
assert.equal(depthBand(LAST_ROW), 3)
assert.ok(crushPoints(2) > crushPoints(1) && crushPoints(3) > crushPoints(2))
assert.equal(crushPoints(0), 0)

// The pump pops in four, and an unpumped sprite deflates a stage at a time.
{
  const s = newSprite(4, 8, 1)
  for (let i = 1; i < POP_STAGES; i++) assert.equal(pump(s), false)
  assert.equal(pump(s), true)
  const t = newSprite(4, 8, 1)
  pump(t)
  pump(t)
  for (let i = 0; i < DEFLATE_TICKS; i++) relax(t)
  assert.equal(t.stage, 1)
  for (let i = 0; i < DEFLATE_TICKS; i++) relax(t)
  assert.equal(t.stage, 0)
}

// The hose reaches a sprite in the lane through open tunnel, but not through sand.
{
  const grid = newGrid()
  for (let c = 2; c <= 6; c++) grid.dug[8]![c] = true
  const s = newSprite(5, 8, 1)
  const px = centre(3)
  const py = centre(8)
  assert.equal(pumpTarget(grid, px, py, { dx: 1, dy: 0 }, [s]), s)
  assert.equal(pumpTarget(grid, px, py, { dx: -1, dy: 0 }, [s]), null)
  assert.equal(pumpTarget(grid, px, py, { dx: 0, dy: 1 }, [s]), null)
  grid.dug[8]![4] = false
  assert.equal(pumpTarget(grid, px, py, { dx: 1, dy: 0 }, [s]), null)
  const far = newSprite(6, 8, 1)
  grid.dug[8]![4] = true
  assert.equal(pumpTarget(grid, centre(3), py, { dx: 1, dy: 0 }, [far]), far)
  assert.equal(
    pumpTarget(grid, centre(2), py, { dx: 1, dy: 0 }, [far]),
    null,
    'four tiles is out of reach',
  )
}

// A sprite at a tile centre heads for the player and never turns straight back unless boxed in.
{
  const grid = newGrid()
  for (let c = 2; c <= 8; c++) grid.dug[8]![c] = true
  const s = { x: centre(4), y: centre(8), dx: 1, dy: 0 }
  const rng = () => 0.9
  assert.deepEqual(chooseDir(grid, s, centre(1), centre(8), rng), {
    dx: 1,
    dy: 0,
  })
  const dead = { x: centre(8), y: centre(8), dx: 1, dy: 0 }
  assert.deepEqual(chooseDir(grid, dead, centre(1), centre(8), rng), {
    dx: -1,
    dy: 0,
  })
  const sealed = { x: centre(12), y: centre(12), dx: 0, dy: 0 }
  assert.deepEqual(chooseDir(grid, sealed, 0, 0, rng), { dx: 0, dy: 0 })
}

// Rounds: caves for every sprite, boulders in sand with solid footing, none over a cave.
for (const level of [1, 2, 5, 9]) {
  const { grid, sprites, boulders } = buildRound(level, mulberry32(level))
  assert.equal(sprites.length, spriteCount(level))
  assert.ok(boulders.length > 0)
  for (const s of sprites)
    assert.ok(open(grid, Math.floor(s.x / 16), Math.floor(s.y / 16)))
  for (const b of boulders) {
    assert.ok(grid.rock[b.r]![b.c])
    assert.ok(!grid.dug[b.r]![b.c])
    assert.ok(!unsupported(grid, b), 'a fresh boulder is held up')
    assert.notEqual(b.c, 8, 'the start shaft is clear')
  }
  for (let r = 0; r <= SURFACE_ROW; r++) assert.ok(grid.dug[r]!.every(Boolean))
  assert.equal(grid.dug.length, ROWS)
}

const sound = { play() {} }
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  x: number
  y: number
  mode: string
  invuln: number
  popped: number
  grid: ReturnType<typeof newGrid>
  sprites: ReturnType<typeof newSprite>[]
  boulders: Array<{
    c: number
    r: number
    state: string
    t: number
    y: number
    crushed: number
  }>
  update(i: ReturnType<typeof emptyInput>): void
}
/** A sprite sealed in a far corner, so a round with no other prey does not clear. */
const parked = () => {
  const s = newSprite(0, LAST_ROW, 1)
  s.ghostIn = 1e9
  return s
}
const make = (seed: number, demo = false) =>
  create({ rng: mulberry32(seed), sound, demo, hiScore: 0 }) as unknown as Probe

// Digging down opens tunnel and scores; the player cannot walk off the grid or into a boulder.
{
  const game = make(3)
  game.invuln = 99999
  game.sprites = [parked()]
  game.boulders = []
  const down = emptyInput()
  down.held.down = true
  for (let i = 0; i < 120; i++) game.update(down)
  assert.ok(game.y > centre(SURFACE_ROW) + 32)
  assert.ok(game.grid.dug[5]![8])
  assert.ok(game.score >= 20)
  const left = emptyInput()
  left.held.left = true
  for (let i = 0; i < 600; i++) game.update(left)
  assert.ok(game.x >= 8)
  assert.ok(game.grid.dug[Math.floor(game.y / 16)]![0])
}

// A boulder over a dug tile wobbles, falls, crushes a sprite below, and pays.
{
  const game = make(4)
  game.invuln = 99999
  game.grid = newGrid()
  game.sprites = []
  game.boulders = [
    { c: 3, r: 5, state: 'rest', t: 0, y: centre(5), crushed: 0 },
  ]
  game.grid.rock[5]![3] = true
  for (let r = 6; r <= 9; r++) game.grid.dug[r]![3] = true
  const prey = newSprite(3, 9, 1)
  prey.ghostIn = 1e9
  game.sprites = [prey, newSprite(12, 14, 1)]
  game.sprites[1]!.ghostIn = 1e9
  const idle = emptyInput()
  game.update(idle)
  assert.equal(game.boulders[0]!.state, 'wobble')
  const before = game.score
  for (let i = 0; i < 200 && game.boulders.length > 0; i++) game.update(idle)
  assert.equal(game.boulders.length, 0, 'it shatters on landing')
  assert.equal(game.sprites.length, 1, 'the sprite below is crushed')
  assert.ok(game.score - before >= crushPoints(1))
}

// Pumping a sprite four times pops it for points; the round clears when all are gone.
{
  const game = make(5)
  game.invuln = 99999
  game.boulders = []
  game.grid = newGrid()
  for (let c = 6; c <= 12; c++) game.grid.dug[SURFACE_ROW]![c] = true
  const prey = newSprite(8, SURFACE_ROW, 1)
  prey.ghostIn = 1e9
  game.sprites = [prey]
  game.x = centre(6)
  game.y = centre(SURFACE_ROW)
  const right = emptyInput()
  right.held.right = true
  game.update(right)
  const pumpIt = emptyInput()
  pumpIt.pressed.a = true
  for (let i = 0; i < POP_STAGES; i++) {
    game.update(pumpIt)
    for (let k = 0; k < 8; k++) game.update(emptyInput())
  }
  assert.equal(game.popped, 1)
  assert.equal(game.sprites.length, 0)
  assert.ok(game.score >= popPoints(SURFACE_ROW))
  for (let i = 0; i < 300; i++) game.update(emptyInput())
  assert.equal(game.level, 2, 'the next round starts')
  assert.equal(game.sprites.length, spriteCount(2))
}

// A sprite that touches you costs a life; with no lives left the game ends.
{
  const game = make(6)
  game.boulders = []
  game.invuln = 0
  const s = newSprite(8, SURFACE_ROW, 1)
  s.ghostIn = 1e9
  game.sprites = [s]
  game.update(emptyInput())
  assert.equal(game.lives, 2)
  assert.equal(game.mode, 'dying')
}

// Walled-in sprites float as eyes and dig in; an idle player is eventually caught.
{
  const idle = make(7)
  let ticks = 0
  while (!idle.over && ticks < 60 * 600) {
    idle.update(emptyInput())
    ticks++
  }
  assert.ok(idle.over, 'an idle player loses all lives')
}

// The attract pilot never scores and pops sprites.
{
  let pops = 0
  for (const seed of [11, 12, 13, 14]) {
    const demo = make(seed, true)
    for (let t = 0; t < 60 * 60 && !demo.over; t++) demo.update(emptyInput())
    assert.equal(demo.score, 0, 'the demo never scores')
    pops += demo.popped
  }
  assert.ok(pops >= 5, 'the pilot pops sprites')
}

console.log('dune digger dash: ok')
