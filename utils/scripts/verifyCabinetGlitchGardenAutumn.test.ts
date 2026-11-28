import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  CROW_EVERY,
  CROW_SWOOP_TICKS,
  CROW_TELL_TICKS,
  LEAF_GUST_TICKS,
  create,
} from '../arcade/games/glitchGarden'
import {
  CAMPAIGN,
  GARDENS,
  LAYOUT_LEAF,
  LEAF_PILE_LANE,
  PLAYS_PER_LAP,
  campaignPlay,
  gardenStart,
  layoutCells,
} from '../arcade/games/glitchGardenGardens'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

const COLS = 30
const ROWS = 36
const CELL = 8
const HUD = 16
const BED_TOP = 30
type Leaf = { col: number; row: number }
type Flower = Leaf & { prism: string }
type Crow = { x: number; y: number; phase: string; ticks: number }
type Probe = {
  score: number
  level: number
  lives: number
  lap: number
  garden: { id: string }
  leafPiles: Leaf[]
  flowers: Flower[]
  crow: Crow | null
  crowTimer: number
  rakedLeaves: number
  leafGust: number
  leafWind: 1 | -1
  objectiveDone: boolean
  clear: number
  grid: unknown[]
  worms: unknown[]
  trowels: Set<string>
  startWave(wave: number): void
  update(input: InputFrame): void
  updateLeaves(): void
  updateCrow(): void
  hitCrow(x: number, y: number): boolean
  afterDeath(): void
  newBeam(x: number, y: number, child: boolean): unknown
  stepBeam(beam: unknown): boolean
  hitLeaf(col: number, row: number): boolean
  demoInput(): InputFrame
  render(g: CanvasRenderingContext2D): void
}

const make = (seed = 45, demo = false) =>
  create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Probe

assert.equal(GARDENS.length, 8)
assert.equal(PLAYS_PER_LAP, 44)
assert.equal(GARDENS[4], LEAF_PILE_LANE)
assert.equal(gardenStart(4), campaignPlay(23).index)
assert.deepEqual(campaignPlay(28), { index: gardenStart(5), lap: 0 })
assert.ok(CAMPAIGN[campaignPlay(33).index]!.kind === 'boss')
assert.deepEqual(campaignPlay(45), { index: 0, lap: 1 })
assert.equal(CAMPAIGN.filter((step) => step.kind === 'wave').length, 40)
assert.equal(LEAF_PILE_LANE.layout.length, ROWS)
for (const row of LEAF_PILE_LANE.layout) assert.equal(row.length, COLS)
assert.equal(LEAF_PILE_LANE.waves.length, 5)
assert.equal(LEAF_PILE_LANE.waves[2]!.objective?.kind, 'clear-leaves')
assert.ok(layoutCells(LEAF_PILE_LANE, LAYOUT_LEAF).length >= 9)

{
  const game = make()
  game.startWave(23)
  assert.equal(game.garden.id, 'leaf-pile-lane')
  assert.equal(game.leafPiles.length, 4)
  assert.equal(game.rakedLeaves, 0)
  const before = game.leafPiles.map(({ col }) => col)
  game.leafWind = 1
  game.leafGust = 1
  game.updateLeaves()
  assert.equal(game.leafGust, LEAF_GUST_TICKS)
  assert.equal(game.leafWind, -1)
  assert.deepEqual(
    game.leafPiles.map(({ col }) => col),
    before.map((col) => col - 1),
    'a gust visibly shifts every leaf cover one column',
  )
}

{
  const game = make()
  game.startWave(25)
  assert.equal(game.level, 25)
  assert.equal(game.leafPiles.length, 5)
  assert.ok(
    game.leafPiles.every(({ row }) => row >= BED_TOP),
    'the Rake Up special puts every target inside the flowerbed',
  )
  const first = game.leafPiles[0]!
  const x = first.col * CELL + CELL / 2
  const y = HUD + first.row * CELL + CELL
  const index = first.row * COLS + first.col
  game.grid[index] = { hp: 4, kind: 'lamp' }
  assert.equal(game.stepBeam(game.newBeam(x, y, false)), false)
  assert.equal(game.leafPiles.length, 4, 'a shot rakes one pile away')
  assert.deepEqual(
    game.grid[index],
    { hp: 4, kind: 'lamp' },
    'the first shot cannot harm the lamp under the leaves',
  )
  assert.equal(game.stepBeam(game.newBeam(x, y, false)), false)
  assert.deepEqual(
    game.grid[index],
    { hp: 3, kind: 'lamp' },
    'the next shot reaches the uncovered lamp',
  )
  for (const { col, row } of [...game.leafPiles]) {
    assert.equal(game.hitLeaf(col, row), true)
  }
  assert.equal(game.rakedLeaves, 5)
  assert.equal(game.leafPiles.length, 0)
  assert.equal(game.objectiveDone, true, 'clearing five piles earns Rake Up')
  game.worms = []
  game.update(emptyInput())
  assert.ok(game.clear > 0)
  assert.ok(
    game.trowels.has('leaf-pile-lane'),
    'a clean special wave earns its golden trowel',
  )
  assert.ok(game.score > 4500, 'leaves and the authored objective award points')
}

{
  const a = make(47)
  const b = make(47)
  a.startWave(23)
  b.startWave(23)
  for (let i = 0; i < 1800; i++) {
    a.update(a.demoInput())
    b.update(b.demoInput())
  }
  assert.equal(a.score, b.score, 'Autumn has deterministic seeded play')
  assert.deepEqual(a.leafPiles, b.leafPiles, 'the gusts stay deterministic')
  assert.equal(a.level, b.level)
  const gradient = { addColorStop() {} }
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop) =>
        prop === 'createLinearGradient' || prop === 'createRadialGradient'
          ? () => gradient
          : prop === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as CanvasRenderingContext2D
  a.render(ctx)
}

{
  const demo = make(48, true)
  demo.startWave(23)
  for (let i = 0; i < 1800; i++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'attract-mode scores remain excluded')
}

{
  const game = make(92)
  game.startWave(24)
  const flower = { col: 4, row: 16, prism: 'cyan' }
  game.flowers = [flower]
  game.crowTimer = 1
  game.updateCrow()
  assert.equal(game.crow?.phase, 'tell', 'a marked flower warns of a swoop')
  for (let i = 0; i < CROW_TELL_TICKS; i++) game.updateCrow()
  assert.equal(game.crow?.phase, 'swoop')
  for (let i = 0; i < CROW_SWOOP_TICKS; i++) game.updateCrow()
  assert.deepEqual(game.flowers, [], 'an unopposed crow plucks the prism')
  assert.equal(game.crow?.phase, 'exit')
  game.afterDeath()
  assert.equal(game.crow, null)
  assert.equal(game.crowTimer, CROW_EVERY)

  game.flowers = [flower]
  game.crowTimer = 1
  game.updateCrow()
  for (let i = 0; i < CROW_TELL_TICKS + 20; i++) game.updateCrow()
  const crow = game.crow as Crow | null
  assert.ok(crow)
  assert.equal(game.stepBeam(game.newBeam(crow.x, crow.y + 4, false)), false)
  assert.equal(game.crow, null, 'a real beam intercepts the swoop')
  assert.deepEqual(game.flowers, [flower], 'interception preserves the prism')
  assert.equal(game.hitCrow(crow.x, crow.y), false, 'cannot score twice')
  game.startWave(28)
  game.crowTimer = 1
  game.updateCrow()
  assert.equal(game.crow, null, 'crow does not leak into the next garden')
}

console.log('Glitch Garden Autumn: fifth garden, gusts, Rake Up and replay OK')
