// Glitch Garden depth slice 1, part 3 (conductor kr-arcade/t-088): the data-driven garden format
// (the Kitchen Plot's authored layout, waves and First Bloom objective), sprinkler cans that splash
// and chain, per-wave lamp palettes, double-density sprites, and a pilot probe through waves 1-10.
//
//   npx tsx utils/scripts/verifyCabinetGlitchGardenPlots.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import {
  CAN_POINTS,
  CHAIN_DELAY,
  CHAIN_RADIUS,
  DENSITY,
  MAX_CANS,
  SNAIL_WAVE,
  SPLASH_RADIUS,
  START_LAMPS,
  WAVE_PALETTES,
  create,
  paletteFor,
  scale2x,
} from '../arcade/games/glitchGarden'
import {
  GARDENS,
  KITCHEN_PLOT,
  LAYOUT_CAN,
  LAYOUT_LAMP,
  MAX_HEADS,
  MIN_BEETLE_EVERY,
  MIN_BODY,
  gardenWave,
  layoutCells,
} from '../arcade/games/glitchGardenGardens'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

const COLS = 30
const ROWS = 36
const CELL = 8
const HUD = 16

type Cell = {
  hp: number
  kind: 'lamp' | 'sprout' | 'can'
  glitched?: boolean
  lit?: boolean
} | null
type Worm = {
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  dy: 1 | -1
  frozen?: number
  crawler?: boolean
}
type Beam = { x: number; y: number; powers: string[]; pierce: number }
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  grid: Cell[]
  worms: Worm[]
  flowers: Array<{ col: number; row: number; prism: string }>
  beams: Beam[]
  objectiveDone: boolean
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  startWave(wave: number): void
  water(col: number, row: number, ob: NonNullable<Cell>): void
  newBeam(x: number, y: number, child: boolean): Beam
  stepBeam(beam: Beam): boolean
  demoInput(): InputFrame
}

const sound = { play() {} }
const make = (seed: number, demo = false) =>
  create({
    rng: mulberry32(seed),
    sound,
    demo,
    hiScore: 0,
  } as unknown as Parameters<typeof create>[0]) as unknown as Probe
const at = (g: Probe, col: number, row: number) => g.grid[row * COLS + col]
const put = (g: Probe, col: number, row: number, cell: Cell) => {
  g.grid[row * COLS + col] = cell
}
/** A worm parked far away and frozen, so the wave never clears mid-test. */
const anchor = (): Worm => ({
  trail: [{ x: 0, y: HUD }],
  segments: 1,
  dx: 1,
  dy: 1,
  frozen: 999_999,
})
const registry = ARCADE_GAMES.find((g) => g.slug === 'glitch-garden')!

// --- the garden format ------------------------------------------------------------
{
  assert.ok(GARDENS.includes(KITCHEN_PLOT))
  assert.equal(
    KITCHEN_PLOT.layout.length,
    ROWS,
    'one layout row per garden row',
  )
  for (const row of KITCHEN_PLOT.layout)
    assert.equal(row.length, COLS, 'every layout row is the garden wide')
  assert.equal(layoutCells(KITCHEN_PLOT, LAYOUT_LAMP).length, START_LAMPS)
  assert.equal(START_LAMPS, 34)
  const cans = layoutCells(KITCHEN_PLOT, LAYOUT_CAN)
  assert.ok(cans.length >= 2 && cans.length <= MAX_CANS)
  for (const [, row] of [...cans, ...layoutCells(KITCHEN_PLOT, LAYOUT_LAMP)])
    assert.ok(
      row >= 1 && row < 30,
      'the layout keeps the top row and bed clear',
    )

  for (let n = 1; n <= 12; n++) {
    const w = gardenWave(KITCHEN_PLOT, n)
    assert.ok(
      [1, 1.5, 2].includes(w.speed),
      `wave ${n} speed keeps whole spacing`,
    )
    assert.ok(w.segments >= MIN_BODY && w.heads >= 0 && w.heads <= MAX_HEADS)
    if (w.beetleEvery !== null) assert.ok(w.beetleEvery >= MIN_BEETLE_EVERY)
  }
  // The classic's rule past the authored waves: one more head, one fewer body segment.
  const five = gardenWave(KITCHEN_PLOT, 5)
  const six = gardenWave(KITCHEN_PLOT, 6)
  assert.equal(six.heads, five.heads + 1)
  assert.equal(six.segments, five.segments - 1)
  assert.equal(gardenWave(KITCHEN_PLOT, 99).heads, MAX_HEADS)
  assert.ok(gardenWave(KITCHEN_PLOT, 7).beetleEvery! < five.beetleEvery!)
  // The snail's first wave in the data matches the cabinet's constant.
  assert.ok(gardenWave(KITCHEN_PLOT, SNAIL_WAVE).snail)
  assert.ok(!gardenWave(KITCHEN_PLOT, SNAIL_WAVE - 1).snail)
  assert.equal(gardenWave(KITCHEN_PLOT, 1).beetleEvery, null, 'no beetle on 1')

  // The special wave's lanes each have a lamp to bloom.
  const goal = KITCHEN_PLOT.waves.find((w) => w.objective)!.objective!
  const lamps = layoutCells(KITCHEN_PLOT, LAYOUT_LAMP)
  for (const lane of goal.lanes)
    assert.ok(
      lamps.some(([c]) => c === lane),
      `lane ${lane} has a lamp`,
    )
}

// The cabinet plants exactly the authored layout, and each wave brings the worm the data asks for.
{
  const g = make(1)
  for (const [c, r] of layoutCells(KITCHEN_PLOT, LAYOUT_LAMP))
    assert.equal(at(g, c, r)?.kind, 'lamp')
  for (const [c, r] of layoutCells(KITCHEN_PLOT, LAYOUT_CAN))
    assert.equal(at(g, c, r)?.kind, 'can')
  assert.equal(
    g.grid.filter(Boolean).length,
    START_LAMPS + layoutCells(KITCHEN_PLOT, LAYOUT_CAN).length,
  )
  for (let n = 1; n <= 10; n++) {
    g.startWave(n)
    const plan = gardenWave(KITCHEN_PLOT, n)
    assert.equal(g.worms.length, 1 + plan.heads, `wave ${n} heads`)
    assert.equal(g.worms[0]!.segments, plan.segments, `wave ${n} body`)
    assert.ok(
      g.grid.filter((c) => c?.kind === 'can').length <= MAX_CANS,
      'the can cap holds',
    )
  }
}

// --- sprinkler cans -------------------------------------------------------------------
{
  const g = make(2)
  g.grid.fill(null)
  g.flowers = []
  const can = { hp: 1, kind: 'can' as const }
  put(g, 10, 10, can)
  put(g, 11, 10, { hp: 4, kind: 'lamp' })
  put(g, 10, 12, { hp: 4, kind: 'lamp', glitched: true })
  put(g, 10, 14, { hp: 4, kind: 'lamp' })
  put(g, 15, 12, { hp: 1, kind: 'can' })
  put(g, 27, 3, { hp: 1, kind: 'can' })
  // A three-segment worm crossing just above the can, and the anchor far away.
  const worm: Worm = {
    trail: Array.from({ length: 3 * 8 + 1 }, (_, i) => ({
      x: 12 * CELL - i,
      y: HUD + 9 * CELL,
    })),
    segments: 3,
    dx: 1,
    dy: 1,
  }
  g.worms = [worm, anchor()]
  const before = g.score
  g.water(10, 10, can)
  assert.equal(at(g, 10, 10), null, 'the can is spent')
  assert.equal(at(g, 11, 10), null, 'a lamp in reach bloomed')
  assert.equal(at(g, 10, 12), null, 'a glitched lamp in reach bloomed too')
  assert.ok(g.flowers.some((f) => f.col === 11 && f.row === 10))
  assert.equal(at(g, 10, 14)?.hp, 4, 'a lamp out of reach is untouched')
  assert.ok(!g.worms.includes(worm), 'the worm in reach was fixed')
  assert.equal(
    g.worms.filter((w) => w.frozen !== 999_999).length,
    0,
    'every segment in reach was fixed',
  )
  assert.ok(at(g, 15, 12)?.lit, `a can within ${CHAIN_RADIUS} cells is lit`)
  assert.ok(!at(g, 27, 3)?.lit, 'a far can waits')
  const afterFirst = g.score
  assert.ok(afterFirst - before >= CAN_POINTS)
  for (let i = 0; i < CHAIN_DELAY; i++) {
    g.worms = [anchor()]
    g.update(emptyInput())
  }
  assert.equal(at(g, 15, 12), null, 'the chained can burst in turn')
  assert.ok(g.score - afterFirst >= CAN_POINTS * 2, 'and paid double')
  assert.equal(at(g, 27, 3)?.kind, 'can')
  assert.ok(SPLASH_RADIUS >= 2 && SPLASH_RADIUS < CHAIN_RADIUS)
}
// A fix-it beam sets a can off.
{
  const g = make(3)
  g.grid.fill(null)
  g.worms = [anchor()]
  put(g, 15, 20, { hp: 1, kind: 'can' })
  put(g, 16, 20, { hp: 4, kind: 'lamp' })
  const beam = g.newBeam(15 * CELL + 4, HUD + 24 * CELL, false)
  g.beams = [beam]
  for (let i = 0; i < 20 && g.stepBeam(beam); i++);
  assert.equal(at(g, 15, 20), null, 'the beam burst the can')
  assert.equal(at(g, 16, 20), null, 'its splash bloomed the lamp beside it')
}

// --- the First Bloom objective ----------------------------------------------------------
{
  const g = make(4)
  const special = KITCHEN_PLOT.waves.findIndex((w) => w.objective) + 1
  const goal = KITCHEN_PLOT.waves[special - 1]!.objective!
  g.startWave(special)
  g.grid.fill(null)
  g.worms = [anchor()]
  const bloomAt = (col: number) => {
    const ob = { hp: 1, kind: 'lamp' as const }
    put(g, col, 8, ob)
    g.water(col, 8, ob)
  }
  bloomAt(goal.lanes[0]! + 1)
  for (const lane of goal.lanes.slice(0, -1)) bloomAt(lane)
  assert.equal(g.objectiveDone, false, 'one lane is still bare')
  const before = g.score
  bloomAt(goal.lanes[goal.lanes.length - 1]!)
  assert.equal(g.objectiveDone, true)
  assert.ok(g.score - before >= goal.bonus, 'the bonus is paid')
  const after = g.score
  bloomAt(goal.lanes[0]!)
  assert.ok(g.score - after < goal.bonus, 'and only once')
  // The next wave has no objective.
  g.startWave(special + 1)
  assert.equal(g.objectiveDone, false)
}

// --- wave palettes and double density -----------------------------------------------------
{
  for (let n = 1; n < WAVE_PALETTES.length; n++)
    assert.notEqual(
      paletteFor(n).lamp,
      paletteFor(n + 1).lamp,
      'lamps recolour',
    )
  assert.equal(registry.width, COLS * CELL * DENSITY)
  assert.equal(registry.height, (HUD + ROWS * CELL) * DENSITY)
  assert.deepEqual(scale2x(['a']), ['aa', 'aa'])
  const art = ['.ab.', 'abba', '.bb.']
  const big = scale2x(art)
  assert.equal(big.length, art.length * 2)
  assert.ok(big.every((r) => r.length === 8))
  assert.deepEqual(
    new Set(big.join('')),
    new Set(art.join('')),
    'smoothing never invents a colour',
  )
  // A stair-step's inside corner fills in (a plain 2x would leave 'aa..').
  assert.equal(scale2x(['a.', 'aa'])[1], 'aaa.')

  // The whole scene draws under one 2x transform.
  const calls: Array<[string, unknown[]]> = []
  const gradient = { addColorStop: () => {} }
  const ctx = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return (...args: unknown[]) => {
          calls.push([String(prop), args])
        }
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
  const g = make(5)
  g.render(ctx)
  const firstScale = calls.find(([name]) => name === 'scale')
  assert.deepEqual(firstScale?.[1], [DENSITY, DENSITY])
}

// --- pilot probe: waves 1-10 play through, runs still end, the demo scores 0 ------------------
{
  // The attract pilot, flying a real (scoring) cabinet that is kept alive, clears waves 1-10.
  const g = make(6)
  const seen = new Set<number>()
  let ticks = 0
  while (g.level <= 10 && ticks < 400_000) {
    seen.add(g.level)
    g.lives = 3
    g.update(g.demoInput())
    ticks++
  }
  for (let n = 1; n <= 10; n++)
    assert.ok(seen.has(n), `the pilot reached wave ${n}`)
  assert.ok(g.level >= 11, 'and fixed wave 10')
  assert.ok(g.score > 0 && g.score < registry.maxPlausibleScore)
  console.log(`  pilot: waves 1-10 in ${ticks} ticks, ${g.score} points`)
}
for (const seed of [7, 8]) {
  // Left to itself the pilot still loses its sprayers in the end.
  const a = make(seed)
  const b = make(seed)
  let ticks = 0
  while (!a.over && ticks < 600_000) {
    a.update(a.demoInput())
    b.update(b.demoInput())
    ticks++
  }
  assert.ok(a.over, `seed ${seed} ends`)
  assert.equal(a.score, b.score, 'deterministic')
  assert.ok(a.score < registry.maxPlausibleScore)
  console.log(`  seed ${seed}: over at wave ${a.level}, ${a.score} points`)
}
{
  const d = make(9, true)
  for (let i = 0; i < 30_000; i++) d.update(emptyInput())
  assert.equal(d.score, 0, 'the attract demo scores 0')
}

console.log('glitch garden plots: ok')
