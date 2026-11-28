import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/ribbonRiders'
import { buildArena, BELL_TICKS, CONVEYOR_CELLS, SPIRAL_STEP, spiralCells } from '../arcade/ribbonRiders/arenas'
import type { ArenaSpec, BuiltArena } from '../arcade/ribbonRiders/arenas'
import { FAIRGROUNDS, RAINBOW_SPOOL, arenaById, encoreArena } from '../arcade/ribbonRiders/fairgrounds'
import type { FairArena } from '../arcade/ribbonRiders/fairgrounds'
import { GRID, T, idx, isConveyor } from '../arcade/ribbonRiders/grid'
type Bike = { id: number; seat: number; x: number; y: number; dir: number; want: number; alive: boolean; acc: number; conveyorSteps?: number }
type Probe = {
  arena: BuiltArena
  player: Bike
  bikes: Bike[]
  cells: Uint8Array
  roundTicks: number
  bellUntil: number
  spiralCount: number
  margin: number
  playArena(arena: FairArena): void
  stepBikes(bikes: Bike[]): void
  terrainSolid(i: number): boolean
  shrink(): void
}
const game = create({ rng: mulberry32(52), sound: { play: () => {} }, demo: false, hiScore: 0 }) as unknown as Probe
const bazaar = FAIRGROUNDS[2]!
const loom = FAIRGROUNDS[3]!
const base = arenaById(bazaar, 'cb-alleys')
const spec: ArenaSpec = {
  ...base,
  features: [
    { kind: 'conveyor', x: 20, y: 10, w: 1, h: 25, dir: 1 },
    { kind: 'bell', x: 24, y: 30 },
  ],
  portals: [[[30, 30], [10, 10]]],
  shrink: { every: 420, max: 26, shape: 'spiral' },
}
const built = buildArena(spec)
assert.equal(built.portalAt[idx(30, 30)], idx(10, 10))
assert.equal(built.portalAt[idx(10, 10)], idx(30, 30))
assert.ok(isConveyor(built.terrain[idx(20, 10)]!))
const spiral = spiralCells()
assert.equal(new Set(spiral).size, spiral.length)
assert.ok(spiral.every((i) => i >= 0 && i < GRID * GRID))
for (let i = 1; i < spiral.length; i++) {
  const a = spiral[i - 1]!
  const b = spiral[i]!
  assert.equal(Math.abs(a % GRID - b % GRID) + Math.abs(Math.floor(a / GRID) - Math.floor(b / GRID)), 1)
}
for (const a of [arenaById(bazaar, 'cb-stalls'), arenaById(loom, 'sl-sky'), RAINBOW_SPOOL.arenas.at(-1)!]) {
  const mirrored = buildArena(encoreArena(a))
  for (const [p, q] of a.portals ?? []) {
    assert.equal(mirrored.portalAt[idx(GRID - 1 - p[0], p[1])], idx(GRID - 1 - q[0], q[1]))
  }
}
game.playArena({ ...base, ...spec, crew: [] })
game.cells.fill(0)
const p = game.player
const place = (x: number, y: number, dir: number) => {
  p.x = x; p.y = y; p.dir = dir; p.want = dir; p.acc = 1
}
place(20, 31, 0)
p.conveyorSteps = CONVEYOR_CELLS - 1
game.stepBikes([p])
assert.deepEqual([p.x, p.y], [21, 30])
assert.equal(game.cells[idx(20, 30)], p.id)
place(24, 31, 0)
game.stepBikes([p])
assert.equal(game.bellUntil, game.roundTicks + BELL_TICKS)
assert.equal(game.cells[idx(25, 30)], p.id)
place(30, 31, 0)
game.stepBikes([p])
assert.deepEqual([p.x, p.y], [10, 10])
assert.equal(game.cells[idx(30, 30)], 0)
assert.equal(game.cells[idx(10, 10)], p.id)
game.shrink()
assert.equal(game.margin, 0)
assert.equal(game.spiralCount, SPIRAL_STEP)
assert.ok(spiral.slice(0, SPIRAL_STEP).every((i) => game.terrainSolid(i)))
assert.equal(game.terrainSolid(spiral[SPIRAL_STEP]!), false)
console.log('ribbon riders conveyor, bell, portal and spiral hazards: ok')
