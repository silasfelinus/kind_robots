// Glitch Garden depth slice 2 (conductor kr-arcade/t-089): Spring and Summer. Four gardens of five
// waves (fruit trees and apples, the sunflower maze, the drifting lily pond), the dragonfly bot,
// bee bots and the wasp-glitch, the special waves, Queen Wiggle and Mow-Bot 3000, the Compost
// Shed, golden trowels, title cards, save/resume with the garden select, laps that keep the
// difficulty climbing, and a pilot probe through both bosses.
//
//   npx tsx utils/scripts/verifyCabinetGlitchGardenSeasons.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import {
  APPLE_HP,
  APPLE_POINTS,
  CARD_TICKS,
  DRAGONFLY_POINTS,
  KIND_BONUS,
  MAX_LIVES,
  MOWER_CAPS,
  MOWER_CAP_HP,
  PAD_EVERY,
  QUEEN_ARMOUR,
  QUEEN_HEAD_HP,
  QUEEN_JOINT_EVERY,
  QUEEN_SEGMENTS_COUNT,
  WASP_POINTS,
  create,
  extraAt,
} from '../arcade/games/glitchGarden'
import {
  BOSSES,
  CAMPAIGN,
  GARDENS,
  LAYOUT_EXIT,
  LAYOUT_SUNFLOWER,
  LAYOUT_TREE,
  LILY_POND,
  ORCHARD_ROWS,
  PLAYS_PER_LAP,
  SUNFLOWER_MAZE,
  campaignPlay,
  gardenStart,
  gardenWave,
  lapWave,
  layoutCells,
} from '../arcade/games/glitchGardenGardens'
import { readGardenSave } from '../arcade/games/glitchGardenSave'
import {
  NEW_KIT,
  SHED_ITEMS,
  SHED_TICKS,
  buy,
  cannotBuy,
} from '../arcade/games/glitchGardenShed'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

const COLS = 30
const ROWS = 36
const CELL = 8
const HUD = 16
const W = COLS * CELL

type Cell = { hp: number; kind: string; glitched?: boolean } | null
type Worm = {
  trail: Array<{ x: number; y: number }>
  segments: number
  dx: 1 | -1
  dy: 1 | -1
  frozen?: number
  queen?: boolean
  armour?: number
  offset?: number
  squeeze?: number
}
type Bee = {
  x: number
  y: number
  vx: number
  wasp: boolean
  diving: boolean
  ticks: number
}
/** The cabinet's insides, for the test. */
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  grid: Cell[]
  worms: Worm[]
  flowers: Array<{ col: number; row: number; prism: string }>
  apples: Array<{ x: number; y: number }>
  dragonflies: Array<{ x: number; y: number; dart: boolean }>
  bees: Bee[]
  px: number
  py: number
  petals: number
  caught: number
  beesCrossed: number
  kindLost: boolean
  objectiveDone: boolean
  objectiveFailed: boolean
  trowels: Set<string>
  reached: number
  card: number
  clear: number
  stepIndex: number
  lap: number
  kit: typeof NEW_KIT
  garden: { id: string }
  wave: ReturnType<typeof gardenWave>
  boss: { id: string; phase: number; joints: number; defeated: boolean } | null
  queenHead: { x: number; y: number; hp: number } | null
  mower: { x: number; y: number; caps: number[] } | null
  shed: { cursor: number; ticks: number } | null
  menu: {
    items: Array<{ garden: number; resume: boolean }>
    cursor: number
  } | null
  save: ReturnType<typeof readGardenSave>
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  startWave(n: number): void
  waveFixed(): void
  hitWorm(x: number, y: number): 'fix' | 'plink' | null
  hitMower(x: number, y: number): 'cap' | 'body' | null
  hitQueenHead(x: number, y: number): boolean
  sprayBee(x: number, y: number): boolean
  hitWasp(x: number, y: number): boolean
  hitDragonfly(x: number, y: number): boolean
  segmentPos(w: Worm, k: number): { x: number; y: number }
  stepWorm(w: Worm): void
  water(col: number, row: number, ob: NonNullable<Cell>): void
  newBeam(x: number, y: number, child: boolean): { x: number; y: number }
  stepBeam(beam: { x: number; y: number }): boolean
  demoInput(): InputFrame
}

const sound = { play() {} }
const make = (
  seed: number,
  extra: { demo?: boolean; resume?: unknown; selectScreen?: boolean } = {},
) =>
  create({
    rng: mulberry32(seed),
    sound,
    demo: extra.demo ?? false,
    hiScore: 0,
    resume: extra.resume,
    selectScreen: extra.selectScreen,
  } as unknown as Parameters<typeof create>[0]) as unknown as Probe
const at = (g: Probe, col: number, row: number) => g.grid[row * COLS + col]
const put = (g: Probe, col: number, row: number, cell: Cell) => {
  g.grid[row * COLS + col] = cell
}
const press = (key: keyof InputFrame['held']): InputFrame => {
  const input = emptyInput()
  input.held[key] = true
  input.pressed[key] = true
  return input
}
const anchor = (): Worm => ({
  trail: [{ x: 0, y: HUD }],
  segments: 1,
  dx: 1,
  dy: 1,
  frozen: 999_999,
})
const registry = ARCADE_GAMES.find((g) => g.slug === 'glitch-garden')!

// --- the year as data ------------------------------------------------------------------
{
  assert.equal(GARDENS.length, 8, 'two gardens per season')
  assert.deepEqual(
    GARDENS.map((g) => g.season),
    [
      'spring',
      'spring',
      'summer',
      'summer',
      'autumn',
      'autumn',
      'winter',
      'winter',
    ],
  )
  for (const garden of GARDENS) {
    assert.equal(garden.waves.length, 5, `${garden.id}: five waves`)
    assert.equal(garden.layout.length, ROWS)
    for (const row of garden.layout) assert.equal(row.length, COLS)
    assert.ok(garden.waves[2]!.objective, `${garden.id}: wave 3 is special`)
    assert.ok(
      garden.waves.filter((w) => w.objective).length === 1,
      'one special wave per garden',
    )
    assert.ok(garden.intro.every((line) => line.length <= 36))
  }
  assert.deepEqual(
    GARDENS.map((g) => g.waves[2]!.objective!.kind),
    [
      'bloom-lanes',
      'catch-apples',
      'maze-exit',
      'escort-bees',
      'clear-leaves',
      'great-pumpkin',
      'warm-heaters',
      'snow-day',
    ],
  )
  assert.ok(layoutCells(ORCHARD_ROWS, LAYOUT_TREE).length >= 8)
  assert.ok(ORCHARD_ROWS.appleEvery! > 0)
  assert.ok(layoutCells(SUNFLOWER_MAZE, LAYOUT_SUNFLOWER).length >= 100)
  assert.equal(layoutCells(SUNFLOWER_MAZE, LAYOUT_EXIT).length, 2)
  assert.ok(LILY_POND.pondRows!.length === 2)
  assert.ok(
    gardenWave(SUNFLOWER_MAZE, 1).dragonflies > 0,
    'dragonfly in summer 3',
  )
  assert.ok(gardenWave(LILY_POND, 2).bees > 0 && gardenWave(LILY_POND, 2).wasp)
  assert.ok(
    !gardenWave(GARDENS[0]!, 1).crawlers,
    'crawlers arrive in the orchard',
  )
  assert.ok(gardenWave(ORCHARD_ROWS, 1).crawlers)

  // Waves, Queen Wiggle after Spring, the shed between gardens, Mow-Bot after Summer.
  const kinds = CAMPAIGN.map((s) => s.kind)
  assert.equal(kinds.filter((k) => k === 'wave').length, 40)
  assert.equal(kinds.filter((k) => k === 'shed').length, 8)
  assert.equal(PLAYS_PER_LAP, 44)
  const at11 = CAMPAIGN[campaignPlay(11).index]!
  assert.ok(at11.kind === 'boss' && at11.boss === 'queen-wiggle')
  const at22 = CAMPAIGN[campaignPlay(22).index]!
  assert.ok(at22.kind === 'boss' && at22.boss === 'mow-bot')
  assert.ok(CAMPAIGN[campaignPlay(11).index + 1]!.kind === 'shed')
  assert.deepEqual(campaignPlay(23), { index: gardenStart(4), lap: 0 })
  assert.deepEqual(campaignPlay(28), { index: gardenStart(5), lap: 0 })
  const at33 = CAMPAIGN[campaignPlay(33).index]!
  assert.ok(at33.kind === 'boss' && at33.boss === 'gourd-hydra')
  assert.deepEqual(campaignPlay(45), { index: 0, lap: 1 })
  assert.equal(
    gardenStart(2),
    CAMPAIGN.findIndex((s) => s.kind === 'wave' && s.garden === 2),
  )

  // The difficulty never goes flat: each garden opens faster than the last, and every lap of
  // the year is faster and busier again.
  const opening = GARDENS.map((g) => g.waves[0]!.speed)
  for (let i = 1; i < opening.length; i++)
    assert.ok(opening[i]! > opening[i - 1]!, 'each garden opens faster')
  for (const garden of GARDENS)
    for (const plan of garden.waves) {
      const one = lapWave(plan, 1)
      const two = lapWave(plan, 2)
      assert.ok(one.speed > plan.speed && two.speed > one.speed)
      assert.ok(one.heads >= plan.heads && one.snail && one.crawlers)
    }
}

// --- fruit trees and apples --------------------------------------------------------------
{
  const g = make(11)
  g.startWave(6)
  assert.equal(g.garden.id, 'orchard-rows')
  assert.ok(
    g.grid.some((c) => c?.kind === 'tree'),
    'the orchard is planted',
  )
  assert.equal(g.card, CARD_TICKS, 'a new garden shows its title card')
  g.worms = [anchor()]
  // Trees drop apples; one falling onto the sprayer is caught.
  let dropped = false
  for (let i = 0; i < 400 && !dropped; i++) {
    g.update(emptyInput())
    g.worms = [anchor()]
    dropped = g.apples.length > 0
  }
  assert.ok(dropped, 'a tree dropped an apple')
  // One falling into the bed, over the sprayer.
  const apple = { x: g.px, y: g.py - 18 }
  g.apples = [apple]
  const score = g.score
  for (let i = 0; i < 40 && g.apples.includes(apple); i++) {
    g.worms = [anchor()]
    g.update(emptyInput())
  }
  assert.equal(g.caught, 1, 'caught it')
  assert.ok(g.score - score >= APPLE_POINTS)
  // An apple that falls onto a lamp stays there as an obstacle, and sprays clear in two.
  g.apples = [{ x: 4 * CELL + 4, y: HUD + 2 * CELL }]
  put(g, 4, 6, { hp: 4, kind: 'lamp' })
  put(g, 4, 5, null)
  for (let i = 0; i < 60; i++) {
    g.worms = [anchor()]
    g.update(emptyInput())
  }
  const landed = at(g, 4, 5)
  assert.equal(landed?.kind, 'apple', 'it landed on the lamp')
  for (let i = 0; i < APPLE_HP; i++) g.water(4, 5, landed!)
  assert.equal(at(g, 4, 5), null, 'and sprayed clear')
  // The Apple Harvest: ten catches meet it.
  g.startWave(8)
  assert.equal(g.wave.objective?.kind, 'catch-apples')
  g.worms = [anchor()]
  for (let i = 0; i < 10; i++) {
    g.apples = [{ x: g.px, y: g.py - 2 }]
    g.update(emptyInput())
    g.worms = [anchor()]
  }
  assert.equal(g.objectiveDone, true, 'ten apples: Apple Harvest')
}

// --- the sunflower maze ------------------------------------------------------------------
{
  const g = make(12)
  g.startWave(12)
  assert.equal(g.garden.id, 'sunflower-maze')
  // The beam slips between sunflowers to the lamp beyond; a tree stops it dead.
  g.grid.fill(null)
  g.worms = [anchor()]
  put(g, 10, 20, { hp: 1, kind: 'sunflower' })
  put(g, 10, 16, { hp: 4, kind: 'lamp' })
  let beam = g.newBeam(10 * CELL + 4, HUD + 24 * CELL, false)
  for (let i = 0; i < 30 && g.stepBeam(beam); i++);
  assert.equal(at(g, 10, 16)?.hp, 3, 'sprayed through the stalks')
  assert.equal(at(g, 10, 20)?.kind, 'sunflower', 'which never come down')
  put(g, 12, 20, { hp: 1, kind: 'tree' })
  put(g, 12, 16, { hp: 4, kind: 'lamp' })
  beam = g.newBeam(12 * CELL + 4, HUD + 24 * CELL, false)
  for (let i = 0; i < 30 && g.stepBeam(beam); i++);
  assert.equal(at(g, 12, 16)?.hp, 4, 'a tree takes the spray')

  // A wall below turns the worm back along its lane instead of down.
  g.grid.fill(null)
  for (let c = 0; c < COLS; c++) put(g, c, 6, { hp: 1, kind: 'sunflower' })
  const w: Worm = {
    trail: [{ x: (COLS - 1) * CELL, y: HUD + 5 * CELL }],
    segments: 1,
    dx: 1,
    dy: 1,
  }
  g.stepWorm(w)
  assert.equal(w.trail[0]!.y, HUD + 5 * CELL, 'turned back along row 5')
  assert.equal(w.dx, -1)
  // ...but a worm turned back again and again squeezes past rather than getting stuck.
  for (let i = 0; i < 2000 && w.trail[0]!.y === HUD + 5 * CELL; i++)
    g.stepWorm(w)
  assert.ok(w.trail[0]!.y > HUD + 5 * CELL, 'it squeezed past in the end')

  // Maze Runner: a worm that finds the exit gap drops through and the objective is missed.
  g.startWave(14)
  assert.equal(g.wave.objective?.kind, 'maze-exit')
  const [exitCol, exitRow] = layoutCells(SUNFLOWER_MAZE, LAYOUT_EXIT)[0]!
  const runner: Worm = {
    trail: [{ x: (exitCol - 2) * CELL, y: HUD + (exitRow - 1) * CELL }],
    segments: 1,
    dx: 1,
    dy: 1,
  }
  for (let i = 0; i < 40; i++) g.stepWorm(runner)
  assert.ok(
    runner.trail[0]!.y >= HUD + exitRow * CELL,
    'dropped through the gap',
  )
  assert.equal(g.objectiveFailed, true)
  // Fixing every worm before any gets out meets it instead.
  g.startWave(14)
  g.worms = []
  g.waveFixed()
  assert.equal(g.objectiveDone, true, 'Maze Runner met')
  assert.ok(g.trowels.has('sunflower-maze'), 'no sprayer lost: a golden trowel')
}

// --- the lily pond -----------------------------------------------------------------------
{
  const g = make(13)
  g.startWave(17)
  assert.equal(g.garden.id, 'lily-pond')
  const [a, b] = LILY_POND.pondRows!
  g.grid.fill(null)
  put(g, 5, a!, { hp: 4, kind: 'lamp' })
  put(g, 5, b!, { hp: 4, kind: 'lamp' })
  for (let i = 0; i < PAD_EVERY; i++) {
    g.worms = [anchor()]
    g.bees = []
    g.update(emptyInput())
  }
  assert.equal(at(g, 6, a!)?.kind, 'lamp', 'one row drifts right')
  assert.equal(at(g, 4, b!)?.kind, 'lamp', 'the other drifts left')
}

// --- the dragonfly bot ---------------------------------------------------------------------
{
  const g = make(14)
  g.startWave(12)
  let seen = false
  let darted = false
  let stopped = false
  for (let i = 0; i < 1200; i++) {
    g.worms = [anchor()]
    g.lives = 3
    g.update(emptyInput())
    const d = g.dragonflies[0]
    if (d) {
      seen = true
      if (d.dart) darted = true
      else if (darted) stopped = true
    }
  }
  assert.ok(seen && darted && stopped, 'it darts, then stops')
  g.dragonflies = [{ x: 100, y: HUD + 20 * CELL, dart: false } as never]
  const score = g.score
  assert.ok(g.hitDragonfly(100, HUD + 20 * CELL))
  assert.equal(g.dragonflies.length, 0)
  assert.ok(g.score - score >= DRAGONFLY_POINTS)
}

// --- bee bots and the wasp-glitch -----------------------------------------------------------
{
  const g = make(15)
  g.startWave(18)
  assert.ok(g.wave.bees > 0 && g.wave.wasp)
  const bee = (wasp: boolean): Bee => ({
    x: 80,
    y: HUD + 10 * CELL,
    vx: 0.6,
    wasp,
    diving: false,
    ticks: 100,
  })
  // Spraying a bee bot costs the Kind bonus and scores nothing.
  g.bees = [bee(false)]
  const score = g.score
  assert.ok(g.sprayBee(80, HUD + 10 * CELL))
  assert.equal(g.kindLost, true)
  assert.equal(g.score, score)
  // The wasp breaks off and dives once it lines up over the sprayer; fixing it pays.
  g.bees = [{ ...bee(true), x: g.px - 2 }]
  g.worms = [anchor()]
  g.update(emptyInput())
  assert.ok(g.bees[0]!.diving, 'the wasp dives')
  assert.ok(g.hitWasp(g.bees[0]!.x, g.bees[0]!.y))
  assert.ok(g.score - score >= WASP_POINTS)
  // Pollinators: three bees across, none sprayed, meets it; a wave with bees all safe pays Kind.
  g.startWave(19)
  assert.equal(g.wave.objective?.kind, 'escort-bees')
  g.worms = [anchor()]
  g.bees = [0, 1, 2].map((i) => ({ ...bee(false), x: W + 12 + i, ticks: 50 }))
  g.update(emptyInput())
  assert.equal(g.beesCrossed, 3)
  assert.equal(g.objectiveDone, true)
  const before = g.score
  g.worms = []
  g.waveFixed()
  assert.ok(g.score - before >= KIND_BONUS, 'the Kind bonus')
}

// --- Queen Wiggle -----------------------------------------------------------------------
{
  const g = make(16)
  g.startWave(11)
  assert.equal(g.boss?.id, 'queen-wiggle')
  const queen = g.worms[0]!
  assert.ok(queen.queen && queen.segments === QUEEN_SEGMENTS_COUNT)
  assert.equal(queen.armour, QUEEN_ARMOUR)
  // Let her crawl onto the lawn.
  for (let i = 0; i < 260; i++) {
    g.update(emptyInput())
    g.lives = 3
  }
  const live = g.worms.find((w) => w.queen)!
  const shoot = (w: Worm, k: number) => {
    const p = g.segmentPos(w, k)
    return g.hitWorm(p.x + 4, p.y + 4)
  }
  assert.equal(shoot(live, 1), 'plink', 'a plain segment only plinks at first')
  assert.equal(live.segments, QUEEN_SEGMENTS_COUNT)
  assert.equal(shoot(live, 0), 'plink', 'her helmet takes the first hits')
  assert.equal(live.armour, QUEEN_ARMOUR - 1)
  assert.equal(shoot(live, QUEEN_JOINT_EVERY), 'fix', 'a bright joint splits')
  assert.equal(g.boss!.joints, 1)
  const piece = g.worms.find((w) => w.queen && (w.offset ?? 0) > 0)!
  assert.equal(
    shoot(piece, QUEEN_JOINT_EVERY - 1),
    'fix',
    'the next joint, behind',
  )
  assert.equal(g.boss!.phase, 2, 'two joints: three worms')
  assert.equal(g.worms.filter((w) => w.queen).length, 3)
  for (let i = 0; i < 200; i++) {
    g.update(emptyInput())
    g.lives = 3
  }
  const line = g.worms.filter((w) => w.queen)
  assert.ok(
    line.every(
      (w) => w.dx === line[0]!.dx && w.trail[0]!.y === line[0]!.trail[0]!.y,
    ),
    'they move in step',
  )
  // Fix every piece, then her head buzzes free and takes eight hits.
  g.worms = []
  g.update(emptyInput())
  assert.equal(g.boss!.phase, 3)
  const head = g.queenHead!
  assert.equal(head.hp, QUEEN_HEAD_HP)
  const score = g.score
  for (let i = 0; i < QUEEN_HEAD_HP; i++)
    assert.ok(
      g.hitQueenHead(g.queenHead?.x ?? head.x, g.queenHead?.y ?? head.y),
    )
  assert.equal(g.queenHead, null)
  assert.ok(g.boss!.defeated)
  assert.ok(g.score - score >= BOSSES['queen-wiggle'].bonus)
  g.lives = 3
  g.update(emptyInput())
  assert.ok(g.clear > 0, 'the boss wave is fixed')
}

// --- Mow-Bot 3000, and the shed after it ---------------------------------------------------
{
  const g = make(17)
  g.startWave(22)
  assert.equal(g.boss?.id, 'mow-bot')
  for (let i = 0; i < 80; i++) {
    g.update(emptyInput())
    g.lives = 3
  }
  const m = g.mower!
  assert.ok(m.x > -32, 'it drove on')
  put(g, Math.floor((m.x + 40) / CELL), Math.floor((m.y - HUD) / CELL) + 1, {
    hp: 4,
    kind: 'lamp',
  })
  assert.equal(g.hitMower(m.x + 1, m.y + 8), 'body', 'its body plinks')
  for (let cap = 0; cap < 3; cap++) {
    for (let i = 0; i < MOWER_CAP_HP; i++)
      assert.equal(
        g.hitMower(g.mower!.x + MOWER_CAPS[cap]! + 2, g.mower!.y + 2),
        'cap',
      )
    assert.equal(g.mower!.caps[cap], 0)
  }
  assert.ok(g.boss!.defeated, 'three caps: fixed')
  g.update(emptyInput())
  assert.ok(g.clear > 0)
  // After Mow-Bot the Compost Shed opens before the new Autumn garden.
  for (let i = 0; i < 200 && !g.shed; i++) g.update(emptyInput())
  assert.ok(g.shed, 'the Compost Shed opens')
  for (let i = 0; i <= SHED_TICKS && g.shed; i++) g.update(emptyInput())
  assert.equal(g.shed, null, 'and closes on its own in time')
  assert.equal(g.lap, 0)
  assert.equal(g.garden.id, 'leaf-pile-lane')
  assert.ok(g.wave.speed > GARDENS[3]!.waves[0]!.speed, 'autumn is harder')
}
{
  // The mower mows the lamps it rolls over.
  const g = make(18)
  g.startWave(22)
  for (let i = 0; i < 10; i++) g.update(emptyInput())
  const m = g.mower!
  const col = Math.floor((m.x + 48) / CELL)
  const row = Math.floor((m.y - HUD) / CELL)
  put(g, col, row, { hp: 4, kind: 'lamp' })
  for (let i = 0; i < 60; i++) {
    g.update(emptyInput())
    g.lives = 3
  }
  assert.equal(at(g, col, row), null, 'mown')
}

// --- the Compost Shed ------------------------------------------------------------------------
{
  const nozzle = SHED_ITEMS.find((i) => i.id === 'nozzle')!
  const prism = SHED_ITEMS.find((i) => i.id === 'prism')!
  assert.ok(cannotBuy(nozzle, NEW_KIT, 0))
  const bought = buy(nozzle, NEW_KIT, nozzle.cost + 5, 0)
  assert.equal(bought.kit.nozzle, true)
  assert.equal(bought.petals, 5)
  assert.ok(cannotBuy(nozzle, bought.kit, 999), 'only once')
  assert.equal(buy(prism, NEW_KIT, 999, 7).kit.prismLane, 7)

  // In the game: the shed follows the Kitchen Plot; buy a prism flower and it blooms in the
  // Orchard in the chosen lane.
  const g = make(19)
  g.startWave(5)
  g.petals = 500
  g.worms = []
  g.update(emptyInput())
  for (let i = 0; i < 200 && !g.shed; i++) g.update(emptyInput())
  assert.ok(g.shed)
  const prismAt = SHED_ITEMS.findIndex((i) => i.id === 'prism')
  for (let i = 0; i < prismAt; i++) g.update(press('down'))
  g.update(press('left'))
  g.update(press('a'))
  assert.equal(g.kit.prismLane, 14)
  const doneAt = SHED_ITEMS.findIndex((i) => i.id === 'done')
  for (let i = prismAt; i < doneAt; i++) g.update(press('down'))
  g.update(press('a'))
  assert.equal(g.shed, null)
  assert.equal(g.garden.id, 'orchard-rows')
  assert.ok(
    g.flowers.some((f) => f.col === 14),
    'the prism flower is planted',
  )
  assert.equal(g.kit.prismLane, null, 'and used up')
  assert.ok(g.save?.run?.garden === 1, 'a save point at the new garden')
  assert.equal(g.save?.reached, 2)
}

// --- save, resume and the garden select ---------------------------------------------------
{
  assert.equal(readGardenSave(null), null)
  assert.equal(readGardenSave({ v: 2, reached: 1 }), null)
  assert.equal(readGardenSave({ v: 1, reached: 9, trowels: [] }), null)
  const raw = {
    v: 1,
    reached: 3,
    trowels: ['kitchen-plot', 'nope'],
    run: {
      garden: 2,
      lap: 0,
      score: 40_000,
      lives: 2,
      petals: 33,
      kit: { nozzle: true, cans: 7 },
    },
  }
  const save = readGardenSave(raw)!
  assert.deepEqual(save.trowels, ['kitchen-plot'], 'unknown trowels dropped')
  assert.equal(save.run!.kit.cans, 0, 'a bad kit value is dropped')

  // A saved run offers to continue; picking it resumes at the start of its garden.
  const g = make(20, { resume: raw })
  assert.ok(g.menu && g.menu.items[0]!.resume)
  g.update(press('a'))
  assert.equal(g.menu, null)
  assert.equal(g.garden.id, 'sunflower-maze')
  assert.equal(g.score, 40_000)
  assert.equal(g.lives, 2)
  assert.equal(g.petals, 33)
  assert.equal(g.kit.nozzle, true)
  assert.equal(g.level, 12)
  assert.ok(g.trowels.has('kitchen-plot'))

  // The garden select lists every garden reached; a fresh start there scores from zero.
  const s = make(21, {
    resume: { ...raw, run: null },
    selectScreen: true,
  })
  assert.deepEqual(
    s.menu!.items.map((i) => i.garden),
    [0, 1, 2],
  )
  s.update(press('down'))
  s.update(press('a'))
  assert.equal(s.garden.id, 'orchard-rows')
  assert.equal(s.score, 0)
  // Demos and headless runs never open a menu.
  assert.equal(
    make(22, { demo: true, resume: raw, selectScreen: true }).menu,
    null,
  )
  assert.equal(make(23).menu, null)
  // A game over keeps the gardens and trowels but drops the run.
  const over = make(24)
  over.lives = 1
  over.trowels.add('orchard-rows')
  over.worms = [
    { trail: [{ x: over.px - 4, y: over.py - 4 }], segments: 1, dx: 1, dy: 1 },
  ]
  for (let i = 0; i < 200 && !over.over; i++) over.update(emptyInput())
  assert.ok(over.over)
  assert.equal(over.save?.run, null)
  assert.ok(over.save?.trowels.includes('orchard-rows'))
}

// --- extra sprayers get dearer, and stop piling up --------------------------------------------
{
  assert.deepEqual([1, 2, 3, 4].map(extraAt), [12_000, 30_000, 54_000, 84_000])
  const g = make(25)
  g.lives = MAX_LIVES
  g.worms = [anchor()]
  g.water(0, 0, { hp: 1, kind: 'lamp' })
  ;(
    g as unknown as { addScore(p: number, x: number, y: number): void }
  ).addScore(100_000, 0, 0)
  assert.equal(g.lives, MAX_LIVES)
}

// --- every garden, boss and screen draws --------------------------------------------------------
{
  const gradient = { addColorStop: () => {} }
  const ctx = new Proxy(
    {},
    {
      get(_t, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
  for (let n = 1; n <= PLAYS_PER_LAP; n++) {
    const g = make(26 + n)
    g.startWave(n)
    const step = CAMPAIGN[campaignPlay(n).index]!
    assert.equal(g.garden.id, GARDENS[step.garden]!.id)
    if (step.kind === 'boss') assert.equal(g.boss?.id, step.boss)
    for (let i = 0; i < 120; i++) {
      g.update(g.demoInput())
      g.lives = 3
    }
    g.render(ctx)
  }
  const g = make(26)
  g.startWave(5)
  g.worms = []
  for (let i = 0; i < 200 && !g.shed; i++) g.update(emptyInput())
  g.render(ctx)
  make(27, {
    resume: { v: 1, reached: 4, trowels: [], run: null },
    selectScreen: true,
  }).render(ctx)
}

// --- pilot probe: through both bosses; runs end; the demo scores 0 ------------------------------
{
  const g = make(28)
  const seen = new Set<number>()
  let ticks = 0
  while (g.level <= PLAYS_PER_LAP && ticks < 3_000_000) {
    seen.add(g.level)
    g.lives = 3
    g.update(g.demoInput())
    ticks++
  }
  for (let n = 1; n <= PLAYS_PER_LAP; n++)
    assert.ok(seen.has(n), `the pilot reached wave ${n}`)
  assert.ok(
    g.level === PLAYS_PER_LAP + 1 && g.lap === 1,
    'and reached the second year after the Frost Millipede',
  )
  assert.ok(g.score > 0 && g.score < registry.maxPlausibleScore)
  console.log(
    `  pilot: all ${PLAYS_PER_LAP} waves and bosses in ${ticks} ticks, ${g.score} points`,
  )
}
for (const seed of [29, 30]) {
  const a = make(seed)
  const b = make(seed)
  let ticks = 0
  while (!a.over && ticks < 900_000) {
    a.update(a.demoInput())
    b.update(b.demoInput())
    ticks++
  }
  assert.ok(a.over, `seed ${seed} ends`)
  assert.equal(a.score, b.score, 'deterministic')
  assert.ok(a.score < registry.maxPlausibleScore)
  console.log(
    `  seed ${seed}: over at wave ${a.level} (lap ${a.lap + 1}), ${a.score} points`,
  )
}
{
  const d = make(31, { demo: true })
  for (let i = 0; i < 40_000; i++) d.update(emptyInput())
  assert.equal(d.score, 0, 'the attract demo scores 0')
}

console.log('glitch garden seasons: ok')
