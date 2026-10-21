// Glitch Garden depth slice 1, part 2 (conductor kr-arcade/t-088): the Prism Garden (bloom colour
// chosen by the source cell, beam powers, up to two per beam) and the patch multiplier.
//
//   npx tsx utils/scripts/verifyCabinetGlitchGardenPrism.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  HITS_PER_STEP,
  MAX_MULTIPLIER,
  PRISM_ORDER,
  create,
  multiplierFor,
  prismFor,
  streakAfterMiss,
} from '../arcade/games/glitchGarden'
import { emptyInput } from '../arcade/types'

type Cell = { hp: number; kind: 'lamp' | 'sprout'; glitched?: boolean } | null
type Worm = {
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  dy: 1 | -1
  frozen?: number
}
type Beam = {
  x: number
  y: number
  powers: string[]
  pierce: number
  child: boolean
  lastMoth: unknown
  lastCell: number
}
type Probe = {
  grid: Cell[]
  worms: Worm[]
  flowers: Array<{ col: number; row: number; prism: string }>
  beams: Beam[]
  streak: number
  px: number
  py: number
  update(input: ReturnType<typeof emptyInput>): void
  newBeam(x: number, y: number, child: boolean): Beam
  stepBeam(beam: Beam): boolean
  water(col: number, row: number, ob: NonNullable<Cell>): void
  readonly multiplier: number
}

const COLS = 30
const ROWS = 36
const CELL = 8
const HUD = 16
const sound = { play() {} }
const make = (seed: number) =>
  create({
    rng: mulberry32(seed),
    sound,
    demo: false,
    hiScore: 0,
  } as unknown as Parameters<typeof create>[0]) as unknown as Probe
const clearField = (g: Probe) => {
  g.grid.fill(null)
  g.worms = []
  g.flowers = []
}

// Bloom colour is set by the source cell, not by chance.
{
  assert.equal(prismFor(3, 5), prismFor(3, 5))
  const seen = new Set<string>()
  for (let c = 0; c < 4; c++) seen.add(prismFor(c, 0))
  assert.equal(seen.size, 4, 'all four prism colours appear in a row of cells')
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      assert.ok(PRISM_ORDER.includes(prismFor(c, r)))
}

// Patch multiplier: x1 to x5, one step per run of hits, a miss drops one step.
{
  assert.equal(multiplierFor(0), 1)
  assert.equal(multiplierFor(HITS_PER_STEP), 2)
  assert.equal(multiplierFor(HITS_PER_STEP * 99), MAX_MULTIPLIER)
  assert.equal(multiplierFor(streakAfterMiss(HITS_PER_STEP * 3)), 3)
  assert.equal(streakAfterMiss(0), 0)
  assert.equal(multiplierFor(streakAfterMiss(HITS_PER_STEP - 1)), 1)
}

// A lamp blooms in the colour of its cell.
{
  const g = make(21)
  clearField(g)
  const ob = { hp: 1, kind: 'lamp' as const }
  g.grid[10 * COLS + 6] = ob
  g.water(6, 10, ob)
  assert.equal(g.flowers.length, 1)
  assert.equal(g.flowers[0]!.prism, prismFor(6, 10))
}

// A beam through a flower takes its power; two at most.
{
  const g = make(22)
  clearField(g)
  g.flowers.push({ col: 10, row: 20, prism: 'gold' })
  g.flowers.push({ col: 10, row: 19, prism: 'cyan' })
  g.flowers.push({ col: 10, row: 18, prism: 'violet' })
  const beam = g.newBeam(10 * CELL + 4, HUD + 21 * CELL + 7, false)
  g.beams = [beam]
  for (let i = 0; i < 12; i++) g.stepBeam(beam)
  assert.deepEqual(beam.powers, ['gold', 'cyan'], 'two powers, in pass order')
  assert.equal(beam.pierce, 3, 'gold arms a three-target pierce')
}

// Pink splits the beam in two.
{
  const g = make(23)
  clearField(g)
  g.flowers.push({ col: 10, row: 20, prism: 'pink' })
  const beam = g.newBeam(10 * CELL + 4, HUD + 21 * CELL + 7, false)
  g.beams = [beam]
  for (let i = 0; i < 4; i++) g.stepBeam(beam)
  assert.equal(g.beams.length, 2, 'the beam split')
  assert.ok(g.beams[1]!.child)
  assert.notEqual(g.beams[1]!.x, beam.x)
}

// Gold pierces three lamps, then stops at the fourth.
{
  const g = make(24)
  clearField(g)
  for (const row of [20, 18, 16, 14])
    g.grid[row * COLS + 10] = { hp: 4, kind: 'lamp' }
  const beam = g.newBeam(10 * CELL + 4, HUD + 22 * CELL, false)
  beam.powers = ['gold']
  beam.pierce = 3
  let alive = true
  for (let i = 0; i < 60 && alive; i++) alive = g.stepBeam(beam)
  assert.equal(alive, false)
  for (const row of [20, 18, 16, 14])
    assert.equal(
      g.grid[row * COLS + 10]!.hp,
      3,
      `lamp at row ${row} was sprayed once`,
    )
  assert.ok(beam.y < HUD + 14 * CELL + 8, 'it stopped at the fourth lamp')
}

// Cyan freezes the worm pieces it fixes.
{
  const g = make(25)
  clearField(g)
  g.worms = [
    {
      trail: Array.from({ length: 4 * 8 + 1 }, (_, i) => ({
        x: 12 * CELL,
        y: HUD + 5 * CELL - i,
      })),
      segments: 4,
      dx: 1,
      dy: 1,
    },
  ]
  const beam = g.newBeam(12 * CELL + 4, HUD + 5 * CELL + 14, false)
  beam.powers = ['cyan']
  for (let i = 0; i < 6 && g.worms.length === 1; i++) g.stepBeam(beam)
  assert.ok(g.worms.length >= 1)
  assert.ok(
    g.worms.every((w) => (w.frozen ?? 0) > 0),
    'every piece is frozen',
  )
}

// Violet bends the beam toward a worm segment within range.
{
  const g = make(26)
  clearField(g)
  g.worms = [
    {
      trail: Array.from({ length: 9 }, (_, i) => ({
        x: 14 * CELL,
        y: HUD + 6 * CELL - i,
      })),
      segments: 1,
      dx: 1,
      dy: 1,
    },
  ]
  const beam = g.newBeam(12 * CELL + 2, HUD + 20 * CELL, false)
  beam.powers = ['violet']
  const startX = beam.x
  for (let i = 0; i < 10; i++) g.stepBeam(beam)
  assert.ok(beam.x > startX, 'the beam leans toward the worm')
}

// A clean miss lowers the multiplier one step.
{
  const g = make(27)
  clearField(g)
  g.worms = [
    {
      trail: [{ x: 0, y: HUD }],
      segments: 1,
      dx: 1,
      dy: 1,
      frozen: 99_999,
    },
  ]
  g.streak = HITS_PER_STEP * 2
  assert.equal(g.multiplier, 3)
  g.px = 15 * CELL
  g.py = HUD + 34 * CELL
  const held = emptyInput()
  held.held.a = true
  g.update(held)
  for (let i = 0; i < 200 && g.beams.length; i++) g.update(emptyInput())
  assert.equal(g.beams.length, 0)
  assert.equal(g.multiplier, 2, 'a shot into the open drops one step')
}

console.log('glitch garden prism: ok')
