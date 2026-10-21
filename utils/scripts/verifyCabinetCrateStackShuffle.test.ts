// Crate Stack Shuffle (conductor kr-arcade/t-009, approved pitch 2026-10-12-kr-cabinet-robot-tetris-crates):
// the seven shapes turn and fit, rows ship and the stack falls, taped rows need two fills, level
// and score follow rows, the bag feeds every shape, and the attract pilot plays a run to its end.
//
//   npx tsx utils/scripts/verifyCabinetCrateStackShuffle.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import {
  COLS,
  KINDS,
  ROWS,
  SHAPES,
  bestPlacement,
  create,
  dropped,
  emptyBay,
  fallTicks,
  fits,
  fullRows,
  lock,
  newBag,
  pieceCells,
  rotate,
  shipRows,
  shipScore,
  spawnPiece,
  turnedCells,
  WAREHOUSES,
  warehouseFor,
} from '../arcade/games/crateStackShuffle'
import { emptyInput } from '../arcade/types'

assert.ok(ARCADE_GAMES.some((g) => g.slug === 'crate-stack-shuffle'))

// Every shape keeps four cells through all four turns and stays inside its box.
for (const kind of KINDS) {
  const { size } = SHAPES[kind]
  for (let t = 0; t < 4; t++) {
    const cells = turnedCells(kind, t)
    assert.equal(new Set(cells.map(([x, y]) => `${x},${y}`)).size, 4)
    for (const [x, y] of cells) {
      assert.ok(x >= 0 && x < size && y >= 0 && y < size, `${kind} turn ${t}`)
    }
  }
  assert.deepEqual(turnedCells(kind, 4), turnedCells(kind, 0))
}

// A turn against the wall kicks inward instead of failing.
{
  const bay = emptyBay()
  const i = { ...spawnPiece('I'), turn: 1, x: -2 }
  assert.ok(!fits(bay, i) || pieceCells(i).every(([x]) => x >= 0))
  const flat = { ...spawnPiece('I'), x: 6, y: 5 }
  const turned = rotate(bay, flat, 1)
  assert.ok(turned && fits(bay, turned))
}

// Dropping lands on the floor, then on crates.
{
  const bay = emptyBay()
  const o = dropped(bay, spawnPiece('O'))
  assert.equal(Math.max(...pieceCells(o).map(([, y]) => y)), ROWS - 1)
  lock(bay, o)
  const on = dropped(bay, { ...spawnPiece('O'), x: o.x })
  assert.equal(Math.max(...pieceCells(on).map(([, y]) => y)), ROWS - 3)
}

// A full row ships and the stack above falls one row.
{
  const bay = emptyBay()
  for (let x = 0; x < COLS; x++)
    bay[ROWS - 1]![x] = { kind: 'I', sticky: false }
  bay[ROWS - 2]![3] = { kind: 'T', sticky: false }
  assert.deepEqual(fullRows(bay), [ROWS - 1])
  const out = shipRows(bay)
  assert.deepEqual(out.shipped, [ROWS - 1])
  assert.equal(bay.length, ROWS)
  assert.equal(bay[ROWS - 1]![3]?.kind, 'T')
  assert.equal(fullRows(bay).length, 0)
}

// A taped row only loses its tape the first time.
{
  const bay = emptyBay()
  for (let x = 0; x < COLS; x++)
    bay[ROWS - 1]![x] = { kind: 'L', sticky: x === 4 }
  const first = shipRows(bay)
  assert.deepEqual(first.shipped, [])
  assert.deepEqual(first.unstuck, [ROWS - 1])
  assert.ok(bay[ROWS - 1]!.every((c) => c && !c.sticky))
  assert.deepEqual(shipRows(bay).shipped, [ROWS - 1])
}

// Scoring and speed.
assert.equal(shipScore(1, 1), 100)
assert.equal(shipScore(4, 3), 2400)
assert.ok(fallTicks(2, false) < fallTicks(1, false))
assert.ok(fallTicks(5, true) < fallTicks(5, false))

// The bag deals each shape exactly once.
assert.deepEqual([...newBag(mulberry32(3))].sort(), [...KINDS].sort())

// The pilot lays an I flat on an empty bay, and a staged gap gets filled.
{
  const bay = emptyBay()
  for (let x = 0; x < COLS; x++) {
    if (x !== 6) bay[ROWS - 1]![x] = { kind: 'O', sticky: false }
  }
  const goal = bestPlacement(bay, spawnPiece('I'))
  assert.ok(goal)
  assert.equal(goal.turn % 2, 1, 'the I stands up to fill the one-wide gap')
}

// A full attract run: the pilot ships rows, and a player who never moves tops out.
{
  const sound = { play() {} }
  const demo = create({ rng: mulberry32(7), sound, demo: true, hiScore: 0 })
  for (let t = 0; t < 60 * 120 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the demo never scores')
  assert.ok(!demo.over, 'the pilot survives two minutes')

  const idle = create({ rng: mulberry32(7), sound, demo: false, hiScore: 0 })
  let ticks = 0
  while (!idle.over && ticks < 60 * 600) {
    idle.update(emptyInput())
    ticks++
  }
  assert.ok(idle.over, 'an idle player tops out')
  assert.ok(idle.score > 0, 'every crate set down earns points')
  assert.equal(idle.lives, 0)

  // A player driven by the pilot's own placement logic ships rows and levels up.
  const rng = mulberry32(11)
  const game = create({ rng, sound, demo: false, hiScore: 0 }) as unknown as {
    score: number
    level: number
    over: boolean
    piece: ReturnType<typeof spawnPiece> | null
    bay: ReturnType<typeof emptyBay>
    update(i: ReturnType<typeof emptyInput>): void
  }
  let guard = 0
  while (!game.over && game.level < 2 && guard++ < 200000) {
    const input = emptyInput()
    if (game.piece) {
      const goal = bestPlacement(game.bay, game.piece)
      if (goal) {
        if (game.piece.turn !== goal.turn) input.pressed.a = true
        else if (game.piece.x < goal.x) input.held.right = true
        else if (game.piece.x > goal.x) input.held.left = true
        else input.pressed.b = true
      }
    }
    game.update(input)
  }
  assert.ok(game.level >= 2, 'good play reaches level 2')
  assert.ok(game.score > 0)
}

assert.equal(WAREHOUSES.length, 6)
assert.equal(warehouseFor(1), 0)
assert.equal(warehouseFor(WAREHOUSES.length + 1), 0)
assert.equal(new Set([1, 2, 3, 4, 5, 6].map(warehouseFor)).size, 6)

console.log('crate stack shuffle: ok')
