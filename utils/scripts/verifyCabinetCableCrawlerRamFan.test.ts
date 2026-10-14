// /utils/scripts/verifyCabinetCableCrawlerRamFan.test.ts
//
// Cable Crawler depth pass, slice 2 (conductor kr-arcade/t-065): RAM Rows and the Cooling Fan.
// Every new maze is sound in every turn of its fans; diodes, row refresh, fan sectors, airflow
// and heat tiles; cache crabs snipping, bit flippers flipping, hot spots draining, leak drips
// leaving goo; the five pickups; the Workbench, its purchases kept the moment they are made and
// carried through the host's save round trip; Defrag and Breeze; the Memory Leak and the Big
// Whirr; and pilot probes through both new components.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerRamFan.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  BIG_WHIRR_HP,
  MEMORY_LEAK_HP,
  bladeCells,
  blobRadius,
  bossCells,
  bossPhase,
  wrapSides,
  type Boss,
} from '../arcade/cableCrawler/bosses'
import {
  BYTE_MAZES,
  COMPONENTS,
  COOLING_FAN,
  RAM_ROWS,
} from '../arcade/cableCrawler/components'
import {
  CLAW_CYCLE,
  CLAW_UP,
  GOO_TICKS,
  HOT_GROW,
  HOT_MAX,
  clawsUp,
  hotRadius,
  newGlitch,
  type Glitch,
} from '../arcade/cableCrawler/glitches'
import {
  ROWS,
  cellKey,
  cellX,
  cellY,
  mazeProblems,
  oneWayOk,
  parseMaze,
  sectorCells,
  turnCell,
  turnSector,
  type Maze,
  type Way,
} from '../arcade/cableCrawler/mazes'
import {
  CAPACITOR_TICKS,
  COIL_CELLS,
  HEATSINK_TICKS,
  MAGNET_TICKS,
  type Pickup,
} from '../arcade/cableCrawler/pickups'
import { readCableSave, type CableSave } from '../arcade/cableCrawler/save'
import {
  BENCH_ITEMS,
  buy,
  cannotBuy,
  type Kit,
} from '../arcade/cableCrawler/workbench'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { parseLoop } from '../arcade/sound'
import { emptyInput, type InputFrame } from '../arcade/types'

type Socket = { k: number; charge: number }
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  save: CableSave | null
  music: unknown
  maze: Maze
  walls: boolean[]
  diodes: Map<number, Way>
  goo: Map<number, number>
  fans: Array<{ hub: number; timer: number }>
  refreshTimer: number
  body: number[]
  dir: Way
  want: Way
  grow: number
  sparks: Set<number>
  sockets: Socket[]
  glitches: Glitch[]
  pickups: Pickup[]
  boss: Boss | null
  byte: { k: number; shown: boolean } | null
  saver: { kind: string; ticks: number; caught: number; total: number } | null
  battery: number
  batteryMax: number
  dead: number
  clear: number
  cardTicks: number
  stepIndex: number
  compIndex: number
  offer: CableSave | null
  bench: { cursor: number; note: string; t: number } | null
  copper: number
  reachBonus: number
  insulation: number
  colour: number
  finder: boolean
  finding: boolean
  slow: number
  magnet: number
  rng: () => number
  update(input: InputFrame): void
  crawl(): void
  advance(): void
  beginComponent(i: number): void
  plugCan(d: Way): boolean
  crawlTicks(): number
  stepTicks(): number
  drain(): number
  refreshRows(): void
  turnFan(hub: number): void
  updateBoard(): void
  updateGlitches(): void
  takePickup(p: Pickup): void
  demoInput(): InputFrame
  addScore(points: number, x: number, y: number, show: boolean): void
}

const quiet = { play: () => {} }
const SLUG = 'cable-crawler'
const UP = { dx: 0, dy: -1 }
const DOWN = { dx: 0, dy: 1 }
const LEFT = { dx: -1, dy: 0 }
const RIGHT = { dx: 1, dy: 0 }
const at = (x: number, y: number) => cellKey(x, y)

function play(seed = 3, resume?: unknown): Game {
  const game = cableCrawler.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as unknown as Game
  game.cardTicks = 0
  return game
}

/** Jump to a component's board: 0-2 mazes, 3 the Screensaver, 4-5 mazes, 6 the boss. */
function goTo(game: Game, comp: number, stepIndex: number) {
  game.beginComponent(comp)
  while (game.stepIndex < stepIndex) game.advance()
  game.cardTicks = 0
}

function lay(game: Game, cells: Array<[number, number]>, dir: Way) {
  game.body = cells.map(([x, y]) => at(x, y))
  game.dir = dir
  game.want = dir
  game.grow = 0
  for (const k of game.body) game.sparks.delete(k)
}

const press = (button: 'a' | 'b' | 'up' | 'down') => {
  const f = emptyInput()
  f.pressed[button] = true
  f.held[button] = true
  return f
}

function roundTrip(save: unknown): unknown {
  return sanitizeSaves(JSON.parse(JSON.stringify(withSave({}, SLUG, save))))[
    SLUG
  ]
}

// --- the mazes ---------------------------------------------------------------------------
{
  assert.deepEqual(
    COMPONENTS.map((c) => c.id),
    ['power-strip', 'ram-rows', 'cooling-fan', 'sound-card'],
  )
  assert.equal(BYTE_MAZES.length, 20, 'five golden bytes a component')
  for (const c of [RAM_ROWS, COOLING_FAN]) {
    assert.equal(c.mazes.length, 5)
    for (const layout of c.mazes)
      assert.deepEqual(mazeProblems(layout), [], `${layout.id} is sound`)
    assert.deepEqual(mazeProblems(c.boss.layout, 'boss'), [], c.boss.name)
    assert.deepEqual(mazeProblems(c.screensaver.layout, 'open'), [])
  }
  const ram = RAM_ROWS.mazes.map(parseMaze)
  assert.ok(
    ram.every((m) => m.diodes.size > 0),
    'every RAM maze has diodes',
  )
  assert.deepEqual(
    ram.map((m) => m.refresh),
    [true, false, false, false, true],
    'the first and last banks refresh',
  )
  assert.ok(ram[1]!.crabs.length && ram[2]!.flippers.length)
  assert.ok(
    ram[3]!.crabs.length && ram[3]!.flippers.length && ram[3]!.bugs.length,
  )
  const fan = COOLING_FAN.mazes.map(parseMaze)
  assert.ok(fan[0]!.air.size > 40, 'Intake is ringed with airflow')
  assert.ok(fan[1]!.heat.length && fan[1]!.hotspots.length, 'Hot Plate')
  assert.equal(fan[2]!.fans.length, 2, 'the Spinner has two fans')
  assert.ok(fan[3]!.drips.length && fan[3]!.air.size && fan[3]!.heat.length)
  assert.ok(fan[4]!.fans.length && fan[4]!.air.size && fan[4]!.bugs.length)
  // The validator catches a maze that hangs together only through one-way diodes.
  const oneWay = {
    id: 'one-way',
    name: 'ONE WAY',
    rows: Array.from({ length: ROWS }, (_, y) =>
      y === 1
        ? `#${' '.repeat(21)}#`
        : y === 2
          ? `#v${'#'.repeat(19)}^#`
          : y === 3
            ? `#${' '.repeat(10)}P${' '.repeat(10)}#`
            : '#'.repeat(23),
    ),
  }
  assert.ok(
    mazeProblems(oneWay).some((p) => p.includes('needs its diodes')),
    'one-way only is caught',
  )
  // Mirrored arrows turn round.
  const mirrored = parseMaze({
    id: 'm',
    name: 'M',
    mirror: true,
    rows: Array.from({ length: ROWS }, (_, y) =>
      y === 0 || y === ROWS - 1
        ? '#'.repeat(12)
        : y === 5
          ? '#  >        '
          : '#           ',
    ),
  })
  assert.equal(mirrored.diodes.get(at(3, 5))?.dx, 1)
  assert.equal(mirrored.diodes.get(at(19, 5))?.dx, -1)
}

// --- diodes, refresh, fans, airflow and heat -------------------------------------------
{
  const right = { dx: 1, dy: 0 }
  assert.ok(oneWayOk(right, {}, { diode: right }))
  assert.ok(
    !oneWayOk(right, {}, { diode: { dx: -1, dy: 0 } }),
    'not against a diode',
  )
  assert.ok(
    !oneWayOk(right, { diode: { dx: 0, dy: 1 } }, {}),
    'out only the way it points',
  )
  assert.ok(
    !oneWayOk(right, {}, { air: { dx: -1, dy: 0 } }),
    'not into the wind',
  )
  assert.ok(
    oneWayOk(right, {}, { air: { dx: 0, dy: 1 } }),
    'across the wind is fine',
  )

  // The First Bank's diode at (11,2) points down: into it from below is refused.
  const game = play()
  goTo(game, 1, 0)
  assert.equal(game.music, RAM_ROWS.music)
  assert.deepEqual(game.diodes.get(at(11, 2)), DOWN)
  lay(
    game,
    [
      [11, 3],
      [12, 3],
      [13, 3],
    ],
    LEFT,
  )
  assert.ok(!game.plugCan(UP), 'the diode turns the plug away')
  lay(
    game,
    [
      [11, 1],
      [12, 1],
      [13, 1],
    ],
    LEFT,
  )
  assert.ok(game.plugCan(DOWN), 'but lets it through the way it points')
  // A bit flipper walking through a diode turns it round.
  const flipper = newGlitch('flipper', at(11, 3))
  flipper.dx = 0
  flipper.dy = -1
  flipper.timer = 1
  game.glitches = [flipper]
  game.body = [at(3, 17)]
  game.rng = () => 0
  game.updateGlitches()
  assert.equal(flipper.k, at(11, 2))
  assert.deepEqual(game.diodes.get(at(11, 2)), UP, 'flipped')

  // Refresh: each pair of rows swaps its sparks, never under the cable.
  const g2 = play()
  goTo(g2, 1, 0)
  g2.sparks = new Set([at(3, 1), at(5, 3), at(7, 1), at(7, 3), at(9, 1)])
  g2.body = [at(9, 1), at(9, 2)]
  g2.refreshRows()
  assert.deepEqual(
    [...g2.sparks].sort((a, b) => a - b),
    [at(9, 1), at(3, 3), at(5, 1), at(7, 1), at(7, 3)].sort((a, b) => a - b),
  )
  g2.body = [at(11, 17)]
  g2.refreshTimer = 1
  g2.sparks = new Set([at(1, 5)])
  g2.updateBoard()
  assert.ok(g2.sparks.has(at(1, 7)), 'on the beat')

  // A fan sector turns a quarter, walls and sparks with it, unless something is in it.
  const g3 = play()
  goTo(g3, 2, 2)
  const hub = g3.fans[0]!.hub
  const before = [...g3.walls]
  const spark = sectorCells(hub).find((k) => !before[k])!
  g3.sparks.add(spark)
  g3.body = [at(11, 17)]
  g3.glitches = []
  g3.turnFan(hub)
  assert.deepEqual(g3.walls, turnSector(before, hub))
  assert.ok(g3.sparks.has(turnCell(hub, spark)), 'the spark rides round')
  let w = before
  for (let i = 0; i < 4; i++) w = turnSector(w, hub)
  assert.deepEqual(w, before, 'four quarters make a whole turn')
  const walls = g3.walls
  g3.body = [spark, at(11, 17)]
  g3.fans[0]!.timer = 1
  g3.updateBoard()
  assert.equal(g3.walls, walls, 'a fan with the cable in it waits')
  assert.ok(g3.fans[0]!.timer > 1)

  // Airflow: twice as fast with it; nothing crawls into it against the wind.
  const g4 = play()
  goTo(g4, 2, 0)
  lay(
    g4,
    [
      [5, 1],
      [4, 1],
      [3, 1],
    ],
    RIGHT,
  )
  assert.equal(g4.crawlTicks(), g4.stepTicks() / 2, 'carried along')
  lay(
    g4,
    [
      [8, 1],
      [9, 1],
      [10, 1],
    ],
    LEFT,
  )
  assert.ok(!g4.plugCan(LEFT), 'no crawling into the wind')
  assert.ok(g4.plugCan(DOWN) || g4.walls[at(8, 2)], 'out of it is fine')

  // Heat tiles drain twice as fast; a hot spot grows, drains inside its glow, and surges cool.
  const g5 = play()
  goTo(g5, 2, 1)
  const heat = g5.maze.heat[0]!
  g5.body = [heat]
  assert.equal(g5.drain(), 2)
  const hot = g5.glitches.find((g) => g.kind === 'hotspot')!
  assert.equal(hotRadius(hot), 1)
  hot.age = HOT_GROW * 5
  assert.equal(hotRadius(hot), HOT_MAX)
  g5.body = [at(cellX(hot.k) + 2, cellY(hot.k))]
  assert.equal(g5.drain(), 2, 'inside the glow')
  g5.body = [at(cellX(hot.k) + 5, cellY(hot.k))]
  assert.equal(g5.drain(), 1, 'outside it')
}

// --- crabs, drips and pickups -----------------------------------------------------------
{
  const crab = newGlitch('crab', at(5, 5))
  assert.ok(clawsUp(crab))
  crab.age = CLAW_UP
  assert.ok(!clawsUp(crab))
  crab.age = CLAW_CYCLE
  assert.ok(clawsUp(crab), 'the claw cycle repeats')

  // Claws up: the crab snips the cable where it meets it; the tail end is gone.
  const game = play()
  goTo(game, 1, 1)
  lay(
    game,
    [
      [9, 4],
      [9, 5],
      [8, 5],
      [7, 5],
      [6, 5],
      [5, 5],
      [4, 5],
      [3, 5],
      [2, 5],
      [1, 5],
    ],
    UP,
  )
  const c = newGlitch('crab', at(10, 5))
  c.dx = -1
  c.timer = 1
  game.glitches = [c]
  game.updateGlitches()
  assert.equal(game.body.length, 3, 'snipped at the third cell')
  assert.equal(c.dx, 1, 'and it turns back')
  // Claws down it only bumps.
  lay(
    game,
    [
      [9, 4],
      [9, 5],
      [8, 5],
      [7, 5],
      [6, 5],
    ],
    UP,
  )
  c.k = at(10, 5)
  c.dx = -1
  c.age = CLAW_UP + 1
  c.timer = 1
  game.updateGlitches()
  assert.equal(game.body.length, 5)
  assert.equal(c.dx, 1)

  // A leak drip leaves goo, and goo makes the plug crawl at half speed.
  const g2 = play()
  goTo(g2, 2, 3 + 1)
  const drip = g2.glitches.find((g) => g.kind === 'drip')!
  const from = drip.k
  drip.timer = 1
  drip.booting = 0
  g2.body = [at(11, 17)]
  g2.updateGlitches()
  assert.equal(g2.goo.get(from), GOO_TICKS)
  g2.body = [from]
  g2.dir = UP
  assert.equal(g2.crawlTicks(), g2.stepTicks() * 2, 'goo: two steps to cross')

  // The five pickups.
  const g3 = play()
  lay(
    g3,
    Array.from({ length: 12 }, (_, i) => [1 + i, 1] as [number, number]),
    LEFT,
  )
  g3.battery = 100
  g3.takePickup({ k: at(5, 5), kind: 'capacitor', life: 99 })
  assert.equal(g3.battery, 100 + CAPACITOR_TICKS)
  g3.takePickup({ k: at(5, 5), kind: 'heatsink', life: 99 })
  assert.equal(g3.slow, HEATSINK_TICKS)
  assert.ok(g3.crawlTicks() > g3.stepTicks(), 'slow crawl')
  g3.takePickup({ k: at(5, 5), kind: 'coil', life: 99 })
  assert.equal(g3.body.length, 12 - COIL_CELLS)
  g3.takePickup({ k: at(5, 5), kind: 'magnet', life: 99 })
  assert.equal(g3.magnet, MAGNET_TICKS)
  g3.takePickup({ k: at(5, 5), kind: 'insulation', life: 99 })
  assert.equal(g3.insulation, 1)
  // Insulation: one free pass over your own cable.
  g3.body = [at(3, 1), at(4, 1), at(2, 1), at(5, 1)]
  g3.grow = 0
  g3.dir = LEFT
  g3.want = LEFT
  const lives = g3.lives
  g3.crawl()
  assert.equal(g3.dead, 0, 'insulated')
  assert.equal(g3.insulation, 0)
  assert.equal(g3.lives, lives)
  // Rebooted glitches drop pickups now and then.
  const g4 = play()
  lay(
    g4,
    [
      [3, 4],
      [3, 5],
      [2, 5],
      [1, 5],
      [1, 4],
    ],
    UP,
  )
  g4.glitches = [newGlitch('bug', at(4, 3))]
  g4.rng = () => 0
  g4.crawl()
  assert.equal(g4.pickups.length, 1, 'a pickup where the bug was')
  assert.equal(g4.copper, 1, 'and a copper')
}

// --- the Workbench ------------------------------------------------------------------------
{
  const kit: Kit = {
    copper: 30,
    lives: 3,
    reach: 0,
    insulation: 0,
    colour: 0,
    finder: false,
  }
  assert.equal(
    BENCH_ITEMS[0]!.id,
    'done',
    'back to work is first, so A carries on',
  )
  const a = buy(kit, 'cable')
  assert.equal(a.lives, 4)
  assert.equal(a.copper, 20)
  const b = buy(a, 'reach')
  assert.equal(b.reach, 1)
  assert.equal(cannotBuy(b, 'reach'), 'ALREADY LONG')
  assert.equal(cannotBuy({ ...b, copper: 1 }, 'cable'), 'NOT ENOUGH COPPER')
  assert.deepEqual(
    buy({ ...b, copper: 1 }, 'cable'),
    { ...b, copper: 1 },
    'no sale',
  )
  assert.equal(buy(kit, 'colour').colour, 1)
  assert.equal(buy(kit, 'finder').finder, true)

  // In play: beat a boss, come to the bench, buy, quit; the purchase comes back.
  const game = play()
  goTo(game, 0, 6)
  game.copper = 40
  game.boss!.hp = 1
  lay(
    game,
    [
      [3, 16],
      [3, 17],
      [4, 17],
      [5, 17],
    ],
    UP,
  )
  game.boss!.at = game.boss!.ring.indexOf(at(2, 17))
  game.boss!.invuln = 0
  game.sockets = [{ k: at(3, 15), charge: 0 }]
  game.crawl()
  assert.equal(game.boss!.hp, 0)
  assert.equal(game.save!.bench, true)
  for (let t = 0; t < 400 && !game.bench; t++) game.update(emptyInput())
  assert.ok(game.bench)
  assert.equal(game.music !== null, true)
  for (let t = 0; t < 25; t++) game.update(emptyInput())
  game.update(press('down'))
  game.update(press('a'))
  assert.equal(game.lives, 4, 'an extra cable')
  game.update(press('down'))
  game.update(press('a'))
  assert.equal(game.reachBonus, 1, 'the long surge')
  assert.equal(game.save!.lives, 4, 'kept at once')
  assert.equal(game.save!.reach, 1)
  const back = play(9, roundTrip(game.save))
  assert.ok(back.offer)
  assert.ok(back.offer!.bench)
  back.update(press('a'))
  assert.ok(back.bench, 'back at the Workbench')
  assert.equal(back.lives, 4)
  assert.equal(back.reachBonus, 1)
  assert.equal(back.copper, game.copper)
  back.update(press('b'))
  for (let t = 0; t < 30 && back.bench; t++) back.update(press('b'))
  assert.equal(back.bench, null)
  assert.equal(back.compIndex, 1, 'on to RAM Rows')
  assert.equal(back.save!.comp, 1)
  assert.equal(back.save!.bench, false)
  assert.equal(back.save!.reach, 1, 'the kit rides along')
  // A wider surge sweeps three cells out.
  const g2 = play(5, roundTrip(back.save))
  g2.update(press('a'))
  assert.equal(g2.reachBonus, 1)
  // The byte finder shows the next component's golden bytes from the start.
  const g3 = play()
  g3.finder = true
  g3.beginComponent(1)
  assert.ok(g3.byte?.shown, 'shown at once')
  assert.equal(g3.save!.finder, true, 'kept for a resume of this component')
  // Junk kit is dropped.
  const junk = readCableSave({
    v: 1,
    comp: 2,
    score: 0,
    lives: 3,
    copper: -4,
    reach: 7,
    colour: 'x',
    bench: true,
  })!
  assert.equal(junk.copper, 0)
  assert.equal(junk.reach, 0)
  assert.equal(junk.colour, 0)
  assert.equal(
    readCableSave({ v: 1, comp: 0, score: 0, lives: 3, bench: true })!.bench,
    false,
  )
}

// --- earned spare cables keep a valid checkpoint independently of the purchase limit -----------------
{
  for (const count of [8, 9, 10, 98, 99]) {
    const game = play(17)
    for (let i = 3; i < count; i++) game.addScore(100_000, 0, 0, false)
    assert.equal(game.lives, count, 'spares are earned through the score path')
    game.copper = 42
    game.reachBonus = 1
    game.insulation = 2
    game.colour = 3
    game.finder = true
    game.beginComponent(1)
    // Stage only the byte location; normal collection earns and persists the authored byte.
    game.byte!.shown = true
    game.body = [game.byte!.k]
    const collect = game as Game & { takeByte(): void }
    collect.takeByte()
    const saved = roundTrip(game.save)
    for (const button of ['a', 'start'] as const) {
      const back = play(18, saved)
      assert.ok(
        back.offer,
        'earned spares keep the later-component Continue offer',
      )
      const frame = emptyInput()
      frame.pressed[button] = true
      back.update(frame)
      assert.equal(
        back.lives,
        count,
        'legitimate earned spare count survives Continue',
      )
      assert.equal(back.compIndex, 1)
      assert.equal(back.score, game.save!.score)
      assert.equal(back.copper, 42)
      assert.equal(back.reachBonus, 1)
      assert.equal(back.insulation, 2)
      assert.equal(back.colour, 3)
      assert.ok(back.finding)
      assert.deepEqual(back.save!.bytes, game.save!.bytes)
      assert.equal(readCableSave(roundTrip(back.save))!.lives, count)
    }
    assert.equal(
      cannotBuy(
        {
          copper: 30,
          lives: count,
          reach: 0,
          insulation: 0,
          colour: 0,
          finder: false,
        },
        'cable',
      ),
      count < 9 ? null : 'CABLES FULL',
    )
  }

  const capped = play(19)
  for (let i = 0; i < 97; i++) capped.addScore(100_000, 0, 0, false)
  assert.equal(capped.score, 9_700_000, 'below the existing score ceiling')
  assert.equal(
    capped.lives,
    99,
    'score awards respect the existing save domain',
  )
  capped.beginComponent(1)
  const back = play(20, roundTrip(capped.save))
  assert.ok(back.offer, 'the former 100-cable checkpoint remains resumable')
  back.update(press('a'))
  assert.equal(back.lives, 99)
  // A real battery loss creates room for the next earned cable; awards do not stall at the cap.
  back.cardTicks = 0
  back.battery = 0
  back.update(emptyInput())
  assert.equal(back.lives, 98)
  back.addScore(100_000, 0, 0, false)
  assert.equal(back.lives, 99)
  for (let i = 0; i < 4; i++) back.addScore(100_000, 0, 0, false)
  assert.equal(back.lives, 99)
  back.beginComponent(2)
  assert.equal(readCableSave(roundTrip(back.save))!.lives, 99)
  for (const invalid of [
    100,
    -1,
    3.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    '9',
  ]) {
    assert.equal(
      readCableSave({ ...capped.save, lives: invalid }),
      null,
      'strict invalid-count rejection stays intact',
    )
  }
}

// --- Defrag and Breeze --------------------------------------------------------------------
{
  const game = play()
  goTo(game, 1, 3)
  assert.equal(game.saver!.kind, 'defrag')
  assert.equal(game.saver!.total, 6)
  const block = game.glitches.find(
    (g) => g.kind === 'block' && g.k === at(15, 5),
  )!
  // Shove it up into its slot.
  lay(
    game,
    [
      [15, 7],
      [15, 8],
      [15, 9],
    ],
    UP,
  )
  game.battery = 9999
  for (let i = 0; i < 6; i++) game.crawl()
  assert.ok(block.locked, 'settled in its slot')
  assert.equal(block.k, at(15, 1))
  assert.equal(game.saver!.caught, 1)
  assert.ok(!game.plugCan(UP), 'a settled block is solid')
  for (const g of game.glitches)
    if (g.kind === 'block' && !g.locked) g.k = at(cellX(g.k), 2)
  const left = game.glitches.filter((g) => g.kind === 'block' && !g.locked)
  for (const g of left) {
    game.body = [at(cellX(g.k), 3), at(cellX(g.k), 4)]
    game.dir = UP
    game.want = UP
    game.crawl()
  }
  assert.ok(game.clear > 0, 'all six in: the screen wakes')
  assert.ok(game.score >= 5000 * 2, 'with the perfect bonus')

  const g2 = play()
  goTo(g2, 2, 3)
  assert.equal(g2.saver!.kind, 'breeze')
  g2.body = [at(11, 17)]
  for (let t = 0; t < 400; t++) {
    g2.body = [at(11, 17)]
    g2.update(emptyInput())
  }
  assert.ok(g2.sparks.size > 0, 'flakes settle on the airflow')
  for (const k of g2.sparks) assert.ok(g2.maze.air.has(k))
  const flake = [...g2.sparks][0]!
  lay(g2, [[cellX(flake), cellY(flake) + 1]], UP)
  g2.body = [at(cellX(flake), cellY(flake) + 1)]
  const caught = g2.saver!.caught
  g2.dir = UP
  g2.want = UP
  if (g2.plugCan(UP)) {
    g2.crawl()
    assert.equal(g2.saver!.caught, caught + 1)
    assert.equal(g2.grow, 0, 'a caught flake grows nothing')
  }
}

// --- the Memory Leak ------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 1, 6)
  const boss = game.boss!
  assert.equal(boss.kind, 'memory-leak')
  assert.equal(boss.hp, MEMORY_LEAK_HP)
  assert.equal(blobRadius(boss), 2)
  assert.equal(bossCells(boss).length, 13)
  // It drips leak drips out onto the rows.
  game.body = [at(11, 17)]
  boss.timer = 1
  game.update(emptyInput())
  assert.ok(
    game.glitches.some((g) => g.kind === 'drip'),
    'a drip squeezes out',
  )
  // Surge with the cable against it: it shrinks.
  const hit = (cable: Array<[number, number]>, socket: [number, number]) => {
    boss.invuln = 0
    game.sockets = [{ k: at(...socket), charge: 0 }]
    game.body = cable.map(([x, y]) => at(x, y))
    game.grow = 0
    game.dir = RIGHT
    game.want = RIGHT
    game.crawl()
  }
  hit(
    [
      [10, 5],
      [9, 5],
      [8, 5],
    ],
    [11, 5],
  )
  assert.equal(boss.hp, MEMORY_LEAK_HP - 1)
  hit(
    [
      [10, 5],
      [9, 5],
      [8, 5],
    ],
    [11, 5],
  )
  assert.equal(blobRadius(boss), 1, 'smaller')
  hit(
    [
      [10, 5],
      [9, 5],
      [8, 5],
    ],
    [11, 5],
  )
  assert.equal(boss.hp, 2, 'out of reach now')
  hit(
    [
      [10, 7],
      [9, 7],
      [8, 7],
    ],
    [11, 7],
  )
  assert.equal(boss.hp, 1)
  assert.equal(bossPhase(boss), 3)
  assert.equal(boss.splits.length, 3, 'it splits into three drips')
  // Catching only some: they run back and re-form.
  boss.invuln = 0
  boss.splits[0]!.k = at(5, 7)
  boss.splits[1]!.k = at(20, 9)
  boss.splits[2]!.k = at(20, 11)
  game.body = [at(6, 5), at(5, 5), at(4, 5)]
  game.sockets = [{ k: at(7, 5), charge: 0 }]
  game.dir = RIGHT
  game.want = RIGHT
  game.crawl()
  assert.equal(boss.hp, 1, 'not all at once: no hit')
  assert.ok(boss.splits[0]!.down > 0, 'the caught one re-forms')
  // All three in one sweep: rebooted.
  for (const s of boss.splits) s.down = 0
  boss.splits[0]!.k = at(10, 7)
  boss.splits[1]!.k = at(9, 9)
  boss.splits[2]!.k = at(10, 11)
  game.body = [at(11, 10), at(11, 9), at(11, 8), at(11, 7)]
  game.sockets = [{ k: at(11, 11), charge: 0 }]
  game.dir = DOWN
  game.want = DOWN
  game.crawl()
  assert.equal(boss.hp, 0, 'all three swept at once')
  assert.ok(game.clear > 0)
}

// --- the Big Whirr --------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 2, 6)
  const boss = game.boss!
  assert.equal(boss.kind, 'big-whirr')
  assert.equal(boss.hp, BIG_WHIRR_HP)
  assert.equal(bossCells(boss).length, 9, 'the hub')
  const blades = bladeCells(boss.center, 0)
  assert.ok(
    blades.length >= 18 && blades.every((k) => game.walls[k]),
    'the blades are walls',
  )
  // It turns.
  game.body = [at(1, 17)]
  boss.stun = 0
  boss.timer = 1
  game.update(emptyInput())
  assert.equal(boss.angle, 1)
  assert.ok(bladeCells(boss.center, 1).every((k) => game.walls[k]))
  assert.ok(
    !game.walls[blades.find((k) => !bladeCells(boss.center, 1).includes(k))!],
  )
  // A blade that would cut the cable jams.
  const next = bladeCells(boss.center, 2).find((k) => !game.walls[k])!
  game.body = [next, at(1, 17)]
  boss.timer = 1
  game.update(emptyInput())
  assert.equal(boss.angle, 1, 'jammed')
  assert.ok(boss.jam > 0)
  // A surge from a hub socket hits; the last phase wants the cable round two sides.
  const hubHit = (
    cable: Array<[number, number]>,
    socket: [number, number],
    d: Way,
  ) => {
    boss.invuln = 0
    game.sockets = [{ k: at(...socket), charge: 0 }]
    game.body = cable.map(([x, y]) => at(x, y))
    game.dir = d
    game.want = d
    game.dead = 0
    game.clear = 0
    game.crawl()
  }
  hubHit(
    [
      [11, 6],
      [11, 5],
      [11, 4],
    ],
    [11, 7],
    DOWN,
  )
  assert.equal(boss.hp, BIG_WHIRR_HP - 1)
  boss.hp = 2
  assert.equal(bossPhase(boss), 3)
  hubHit(
    [
      [11, 6],
      [11, 5],
      [11, 4],
    ],
    [11, 7],
    DOWN,
  )
  assert.equal(boss.hp, 2, 'one side is not enough now')
  assert.equal(wrapSides(boss, [at(9, 8), at(9, 7), at(10, 7)]), 2)
  hubHit(
    [
      [9, 7],
      [9, 8],
      [9, 9],
    ],
    [10, 7],
    RIGHT,
  )
  assert.equal(boss.hp, 1, 'wrapped round two sides: a hit')
}

// --- music ------------------------------------------------------------------------------
for (const c of [RAM_ROWS, COOLING_FAN]) {
  const parsed = parseLoop(c.music)
  assert.equal(parsed.length, 64)
  assert.ok(parsed.notes.length > 30)
}

// --- pilot probes ---------------------------------------------------------------------------
{
  const run = (seed: number, ticks: number, keep: boolean) => {
    const game = play(seed)
    let t = 0
    for (; t < ticks && !game.over; t++) {
      if (keep) game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
    }
    return { game, t }
  }
  // With cables held up, the pilot gets through RAM Rows, the Cooling Fan and the Big Whirr.
  for (const seed of [1, 3]) {
    const { game } = run(seed, 60 * 60 * 30, true)
    assert.ok(
      game.level >= 22,
      `seed ${seed}: round the Mainframe (level ${game.level})`,
    )
    assert.ok(game.score < 60_000_000)
  }
  // The attract demo still scores nothing and saves nothing, even at the Workbench.
  const demo = cableCrawler.create({
    rng: mulberry32(4),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Game
  demo.beginComponent(0)
  while (demo.stepIndex < 7) demo.advance()
  assert.ok(demo.bench)
  for (let t = 0; t < 200; t++) demo.update(emptyInput())
  assert.equal(demo.bench, null, 'the demo leaves the bench by itself')
  assert.equal(demo.score, 0)
  assert.equal(demo.save, null)
  assert.equal(demo.copper, 0)
}

console.log('verifyCabinetCableCrawlerRamFan: ok')
