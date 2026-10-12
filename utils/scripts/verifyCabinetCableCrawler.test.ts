// /utils/scripts/verifyCabinetCableCrawler.test.ts
//
// Cable Crawler depth pass, slice 1 (conductor kr-arcade/t-064): the maze engine. Every Power
// Strip maze is sound; mirrored mazes and the start-length ramp; the Plug-In Surge's side sweep,
// climbing chain, glitch reboots and battery top-up; static bugs, dust bunnies and mimic sparks;
// the golden bytes, kept the moment they are found and carried through the host's save round
// trip; the Starfield Screensaver; the Surge Protector's three phases; a deterministic maze clear;
// and pilot probes showing runs still end.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawler.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  SURGE_PROTECTOR_HP,
  bossCell,
  bossPhase,
  type Boss,
} from '../arcade/cableCrawler/bosses'
import {
  BOSS_MUSIC,
  COMPONENTS,
  POWER_STRIP,
  SCREENSAVER_MUSIC,
  componentAt,
  componentSteps,
} from '../arcade/cableCrawler/components'
import {
  BUG_DOWN,
  GLITCH_POINTS,
  MIMIC_SHORT,
  bugWay,
  newGlitch,
  type Glitch,
} from '../arcade/cableCrawler/glitches'
import {
  COLS,
  ROWS,
  cellKey,
  cellX,
  cellY,
  fullRows,
  loopCells,
  mazeProblems,
  parseMaze,
  ringOf,
  type Maze,
} from '../arcade/cableCrawler/mazes'
import { readCableSave, type CableSave } from '../arcade/cableCrawler/save'
import {
  CHAIN,
  SOCKET_RECHARGE,
  SURGE_TOPUP_PER_CELL,
  chainPoints,
  surgeSweep,
} from '../arcade/cableCrawler/surge'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { parseLoop } from '../arcade/sound'
import { emptyInput, type InputFrame } from '../arcade/types'

type Dir = { dx: number; dy: number }
type Socket = { k: number; charge: number }
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  save: CableSave | null
  music: unknown
  maze: Maze
  body: number[]
  dir: Dir
  want: Dir
  grow: number
  sparks: Set<number>
  totalSparks: number
  sockets: Socket[]
  glitches: Glitch[]
  boss: Boss | null
  byte: { k: number; shown: boolean } | null
  saver: {
    ticks: number
    stars: Array<{ k: number; t: number }>
    caught: number
    total: number
  } | null
  battery: number
  batteryMax: number
  dead: number
  clear: number
  cardTicks: number
  stepIndex: number
  compIndex: number
  lap: number
  offer: CableSave | null
  bytes: Set<string>
  rng: () => number
  update(input: InputFrame): void
  crawl(): void
  advance(): void
  afterSpark(): void
  updateGlitches(): void
  demoInput(): InputFrame
}

const quiet = { play: () => {} }
const SLUG = 'cable-crawler'
const UP = { dx: 0, dy: -1 }
const DOWN = { dx: 0, dy: 1 }
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

/** Jump to a board of the Power Strip. */
function goTo(game: Game, stepIndex: number) {
  while (game.stepIndex < stepIndex) game.advance()
  game.cardTicks = 0
}

/** Lay the cable along these cells (plug first), heading `dir`, with nothing left to grow. */
function lay(game: Game, cells: Array<[number, number]>, dir: Dir) {
  game.body = cells.map(([x, y]) => at(x, y))
  game.dir = dir
  game.want = dir
  game.grow = 0
  for (const k of game.body) game.sparks.delete(k)
}

/** The host's save path: keepSave -> withSave -> JSON -> sanitizeSaves -> handed back as resume. */
function roundTrip(save: unknown): unknown {
  const record = withSave({}, SLUG, save)
  return sanitizeSaves(JSON.parse(JSON.stringify(record)))[SLUG]
}

// --- the mazes ---------------------------------------------------------------------------
{
  assert.equal(COLS, 23)
  assert.equal(ROWS, 19)
  assert.equal(POWER_STRIP.mazes.length, 5, 'five authored mazes')
  const ids = new Set<string>()
  for (const layout of POWER_STRIP.mazes) {
    assert.deepEqual(mazeProblems(layout), [], `${layout.id} is sound`)
    ids.add(layout.id)
    const maze = parseMaze(layout)
    assert.ok(maze.sparks.length >= 60, `${layout.id} has plenty of sparks`)
    assert.ok(maze.sockets.length >= 2 && maze.sockets.length <= 4)
    assert.ok(maze.byte !== null, `${layout.id} hides a golden byte`)
    // One-wide corridors on a lattice: plenty of turns, not an open field.
    const corners = maze.floor.filter((k) => {
      const x = cellX(k)
      const y = cellY(k)
      const h = !maze.walls[at(x - 1, y)] || !maze.walls[at(x + 1, y)]
      const v = !maze.walls[at(x, y - 1)] || !maze.walls[at(x, y + 1)]
      return h && v
    })
    assert.ok(corners.length > 40, `${layout.id} is a maze of corridors`)
  }
  assert.equal(ids.size, 5, 'unique maze ids')
  assert.deepEqual(mazeProblems(POWER_STRIP.boss.layout, 'boss'), [])
  assert.deepEqual(mazeProblems(POWER_STRIP.screensaver.layout, 'open'), [])
  // Mirrored mazes really mirror, except the one start and the one golden byte.
  const half = POWER_STRIP.mazes[0]!
  assert.ok(half.mirror)
  for (const row of fullRows(half)) {
    assert.equal(row.length, COLS)
    for (let x = 0; x < COLS; x++) {
      const a = row[x]!
      const b = row[COLS - 1 - x]!
      if ('P$'.includes(a) || 'P$'.includes(b)) continue
      assert.equal(a === '#', b === '#', 'walls mirror')
    }
  }
  const maze = parseMaze(half)
  assert.equal(maze.sockets.length, 2, 'a socket each side')
  assert.equal(cellX(maze.start), 11, 'the plug starts in the middle')
  // The fuse box has a whole ring for the beetle to walk.
  const box = parseMaze(POWER_STRIP.boss.layout)
  assert.equal(ringOf(box).length, 2 * (COLS - 2) + 2 * (ROWS - 4))
  assert.ok(ringOf(box).includes(box.boss!), 'the beetle starts on its ring')
  // The validator catches what would trap a cable: a socket at the end of a dead-end branch.
  const trap = {
    id: 'trap',
    name: 'TRAP',
    rows: Array.from({ length: ROWS }, (_, y) => {
      if (y === 0 || y === ROWS - 1) return '#'.repeat(COLS)
      if (y === 1) return `#....S${'.'.repeat(COLS - 7)}#`
      if (y === ROWS - 2) return `#${' '.repeat(10)}P${' '.repeat(10)}#`
      if (y === 2) return `#.${'#'.repeat(9)}.${'#'.repeat(9)}.#`
      if (y === 3) return `#.${'#'.repeat(9)}S${'#'.repeat(9)}.#`
      return `#.${'#'.repeat(COLS - 4)}.#`
    }),
  }
  assert.ok(
    mazeProblems(trap).some((p) => p.startsWith('something off the loops')),
    'a socket down a dead-end branch is caught',
  )
  assert.ok(!loopCells(parseMaze(trap)).has(at(11, 3)))
  assert.ok(loopCells(parseMaze(trap)).has(at(5, 1)))
  // Glitches arrive as the component goes on: bunnies in maze 2, bugs in 3, mimics in 4.
  const roster = POWER_STRIP.mazes.map((l) => {
    const m = parseMaze(l)
    return [m.bunnies.length > 0, m.bugs.length > 0, m.mimics.length > 0]
  })
  assert.deepEqual(roster[0], [false, false, false], 'maze 1 teaches the surge')
  assert.ok(roster[1]![0], 'dust bunnies in maze 2')
  assert.ok(roster[2]![1], 'static bugs in maze 3')
  assert.ok(roster[3]![2], 'mimic sparks in maze 4')
  assert.deepEqual(roster[4], [true, true, true], 'maze 5 has all three')
}

// --- the campaign's shape ---------------------------------------------------------------
{
  const steps = componentSteps(POWER_STRIP)
  assert.deepEqual(
    steps.map((s) => s.kind),
    ['maze', 'maze', 'maze', 'screensaver', 'maze', 'maze', 'boss'],
    'three mazes, the Screensaver, two mazes and the boss',
  )
  assert.equal(componentAt(COMPONENTS.length).lap, 1, 'then round again')
  const game = play()
  assert.equal(game.level, 1, 'level 1 at the start')
  // Each maze starts the cable two cells longer than the last.
  const lengths: number[] = []
  for (let i = 0; i < 7; i++) {
    if (i) game.advance()
    lengths.push(game.body.length + game.grow)
    assert.equal(game.body.length, 1, 'the cable unspools from its reel')
  }
  assert.deepEqual(lengths, [4, 6, 8, 10, 10, 12, 14])
  assert.equal(game.level, 7, 'every board is a level')
  assert.equal(game.music, BOSS_MUSIC, 'the boss has its own music')
  // The cable unspools: the tail stays on the reel while it grows.
  const fresh = play()
  for (let t = 0; t < 8 * 5; t++) fresh.update(emptyInput())
  assert.equal(fresh.body[fresh.body.length - 1], fresh.maze.start)
  assert.ok(fresh.body.length >= 4)
}

// --- the Plug-In Surge ------------------------------------------------------------------
{
  assert.deepEqual([...CHAIN], [10, 20, 40, 80, 160, 320, 500])
  assert.deepEqual(
    [0, 1, 2, 6, 7, 30].map(chainPoints),
    [10, 20, 40, 500, 500, 500],
    'the chain climbs, then holds',
  )
  // The sweep: every open side of the cable, plug end first, never the cable itself.
  const box = parseMaze({
    id: 'box',
    name: 'BOX',
    open: true,
    rows: Array.from({ length: ROWS }, (_, y) =>
      y === 0 || y === ROWS - 1
        ? '#'.repeat(COLS)
        : `#${' '.repeat(COLS - 2)}#`,
    ),
  })
  const cable = [at(5, 5), at(6, 5), at(7, 5)]
  const sweep = surgeSweep(cable, box.walls, 1)
  assert.deepEqual(sweep.slice(0, 3), [at(5, 4), at(5, 6), at(4, 5)])
  assert.equal(sweep.length, 8, 'three cells of cable have eight sides')
  assert.ok(!sweep.some((k) => cable.includes(k)))
  assert.equal(
    surgeSweep([at(1, 1)], box.walls, 1).length,
    2,
    'walls are never swept',
  )
  assert.equal(
    surgeSweep(cable, box.walls).length,
    20,
    'two cells out by default',
  )
  // The current arcs across a thin wall into the next corridor.
  const outlet = parseMaze(POWER_STRIP.mazes[0]!)
  const across = surgeSweep([at(1, 3)], outlet.walls)
  assert.ok(
    outlet.walls[at(2, 3)] && across.includes(at(3, 3)),
    'over the wall',
  )

  // In play: drive the plug into the Wall Outlet's socket at (3,3).
  const game = play()
  lay(
    game,
    [
      [3, 4],
      [3, 5],
      [2, 5],
      [1, 5],
      [1, 4],
      [1, 3],
      [1, 2],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [5, 1],
    ],
    UP,
  )
  const before = new Set(game.sparks)
  game.battery = 100
  game.crawl()
  assert.equal(game.body[0], at(3, 3), 'the plug is in the socket')
  const expected = surgeSweep(game.body, game.maze.walls).filter((k) =>
    before.has(k),
  )
  assert.ok(expected.length >= 2, 'sparks swept off both sides')
  let points = 0
  expected.forEach((_, i) => (points += chainPoints(i)))
  assert.equal(game.score, points, 'every spark along the cable, as a chain')
  for (const k of expected) assert.ok(!game.sparks.has(k))
  assert.equal(game.sparks.size, before.size - expected.length)
  assert.equal(
    game.body.length + game.grow,
    12,
    'surged sparks never grow the cable',
  )
  assert.equal(
    game.battery,
    100 + 12 * SURGE_TOPUP_PER_CELL,
    'the battery tops up by the length',
  )
  const socket = game.sockets.find((s) => s.k === at(3, 3))!
  assert.equal(
    socket.charge,
    SOCKET_RECHARGE,
    'the socket recharges for ten seconds',
  )
  // A recharging socket does nothing.
  const score = game.score
  lay(
    game,
    [
      [3, 4],
      [3, 5],
      [2, 5],
    ],
    UP,
  )
  game.crawl()
  assert.equal(game.score, score, 'no surge from a spent socket')
  for (let t = 0; t < 3000 && socket.charge > 0; t++) {
    game.lives = 3
    game.update(emptyInput())
  }
  assert.equal(socket.charge, 0, 'and it charges back up')
}

// --- glitches: the surge reboots them ---------------------------------------------------
{
  const game = play()
  lay(
    game,
    [
      [3, 4],
      [3, 5],
      [2, 5],
      [1, 5],
      [1, 4],
    ],
    UP,
  )
  const bug = newGlitch('bug', at(4, 3))
  const bunny = newGlitch('bunny', at(3, 6))
  const mimic = newGlitch('mimic', at(1, 3))
  const far = newGlitch('bug', at(21, 17))
  game.glitches = [bug, bunny, mimic, far]
  game.sparks = new Set()
  game.sparks.add(at(20, 1))
  game.crawl()
  assert.equal(bug.down, BUG_DOWN, 'a static bug reboots')
  assert.ok(bunny.gone && mimic.gone, 'the bunny and the mimic are swept away')
  assert.equal(far.down, 0, 'a glitch off the cable is untouched')
  assert.equal(
    game.score,
    (GLITCH_POINTS.bug + GLITCH_POINTS.bunny + GLITCH_POINTS.mimic) * 1,
  )
  // A rebooted bug boots back up at home after a while.
  game.body = [at(11, 17)]
  for (let t = 0; t < BUG_DOWN; t++) game.updateGlitches()
  assert.equal(bug.down, 0)
  assert.equal(bug.k, bug.home)
}

// --- glitches: static bugs, dust bunnies, mimic sparks ----------------------------------
{
  // A bug meeting the plug head-on unplugs it.
  const game = play()
  goTo(game, 2)
  lay(
    game,
    [
      [2, 1],
      [1, 1],
      [1, 2],
    ],
    RIGHT,
  )
  game.glitches = [newGlitch('bug', at(3, 1))]
  game.crawl()
  assert.ok(game.dead > 0, 'static shock')
  assert.equal(game.lives, 2)

  // A bug walking into the body bounces off it.
  const g2 = play()
  goTo(g2, 2)
  lay(
    g2,
    [
      [5, 1],
      [4, 1],
      [3, 1],
      [2, 1],
      [1, 1],
    ],
    RIGHT,
  )
  const bug = newGlitch('bug', at(1, 3))
  bug.dx = 0
  bug.dy = -1
  bug.timer = 1
  g2.glitches = [bug]
  g2.rng = () => 0
  // (1,2) lies between: the bug steps to it, then up into the cable.
  g2.updateGlitches()
  assert.equal(bug.k, at(1, 2))
  bug.timer = 1
  g2.updateGlitches()
  assert.equal(bug.k, at(1, 2), 'it does not go through the cable')
  assert.deepEqual([bug.dx, bug.dy], [0, 1], 'it turns back')
  assert.equal(g2.dead, 0)
  // bugWay keeps a bug going straight, and back the way it came only from a dead end.
  const lone = newGlitch('bug', at(5, 5))
  lone.dx = 1
  lone.dy = 0
  assert.deepEqual(
    bugWay(
      lone,
      () => 'open',
      () => 0,
    ),
    { dx: 1, dy: 0 },
  )
  assert.deepEqual(
    bugWay(
      lone,
      (k) => (k === at(4, 5) ? 'open' : 'wall'),
      () => 0,
    ),
    { dx: -1, dy: 0 },
  )

  // Dust bunnies: pushed Sokoban-style, rolling up sparks, a wall when they can't move.
  const g3 = play()
  goTo(g3, 1)
  const bunny = g3.glitches.find(
    (g) => g.kind === 'bunny' && g.k === at(10, 7),
  )!
  assert.ok(bunny, 'Dust Corner has its bunny')
  lay(
    g3,
    [
      [9, 7],
      [8, 7],
      [7, 7],
    ],
    RIGHT,
  )
  const spark = g3.sparks.has(at(11, 7))
  g3.crawl()
  assert.equal(bunny.k, at(11, 7), 'pushed along')
  assert.equal(g3.body[0], at(10, 7))
  assert.ok(spark && !g3.sparks.has(at(11, 7)), 'it rolls up the spark')
  assert.equal(g3.score, 10)
  assert.equal(g3.body.length + g3.grow, 3, 'a rolled-up spark grows nothing')
  g3.crawl()
  g3.crawl()
  assert.equal(bunny.k, at(13, 7), 'up against the wall')
  const head = g3.body[0]
  g3.crawl()
  assert.equal(g3.body[0], head, 'a stuck bunny stops the plug')
  for (let i = 0; i < 12; i++) g3.crawl()
  assert.ok(g3.dead > 0, 'boxed in with no way on: tangled up')

  // Mimic sparks short the battery.
  const g4 = play()
  goTo(g4, 4)
  const mimic = g4.glitches.find((g) => g.kind === 'mimic' && g.k === at(1, 9))!
  assert.ok(mimic, 'Spark or Short has a mimic')
  lay(
    g4,
    [
      [1, 10],
      [1, 11],
      [2, 11],
    ],
    UP,
  )
  g4.battery = 3000
  const sparks = g4.sparks.size
  g4.crawl()
  assert.ok(mimic.gone)
  assert.equal(g4.battery, 3000 - MIMIC_SHORT, 'ten seconds shorted')
  assert.equal(g4.sparks.size, sparks)
  assert.equal(g4.body.length + g4.grow, 3, 'it is no spark: no growth')
}

// --- golden bytes, saved the moment they are found --------------------------------------
{
  const game = play()
  assert.ok(game.byte && !game.byte.shown, 'hidden at first')
  const byte = game.byte!.k
  for (const k of [...game.sparks]) {
    if (game.sparks.size * 2 <= game.totalSparks) break
    game.sparks.delete(k)
  }
  game.afterSpark()
  assert.ok(game.byte!.shown, 'it blinks in once half the sparks are gone')
  const x = cellX(byte)
  const y = cellY(byte)
  lay(
    game,
    [
      [x - 1, y],
      [x - 2, y],
      [x - 3, y],
    ],
    RIGHT,
  )
  const score = game.score
  game.crawl()
  assert.equal(game.byte, null)
  assert.equal(game.score - score, 1000)
  assert.ok(game.save, 'kept at once')
  assert.deepEqual(game.save!.bytes, ['ps-1'])
  // Quit right now: the byte comes back through the host's save path.
  const back = play(4, roundTrip(game.save))
  assert.ok(back.bytes.has('ps-1'))
  assert.equal(back.offer, null, 'nothing to continue on the first component')
  assert.equal(readCableSave(roundTrip(game.save))!.bytes.length, 1)
  // The attract demo never saves.
  const demo = cableCrawler.create({
    rng: mulberry32(2),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Game
  for (let t = 0; t < 60 * 60; t++) demo.update(emptyInput())
  assert.equal(demo.save, null)
  assert.equal(demo.score, 0)
}

// --- the Starfield Screensaver ----------------------------------------------------------
{
  const game = play()
  goTo(game, 3)
  assert.ok(game.saver, 'the Screensaver after maze 3')
  assert.equal(game.music, SCREENSAVER_MUSIC)
  const battery = game.battery
  for (let t = 0; t < 120; t++) game.update(emptyInput())
  assert.equal(game.battery, battery, 'the battery never drains')
  assert.ok(game.saver!.stars.length > 0, 'stars stream in')
  lay(
    game,
    [
      [10, 9],
      [10, 10],
      [10, 11],
    ],
    UP,
  )
  game.saver!.stars.push({ k: at(10, 8), t: 99 })
  const score = game.score
  game.crawl()
  assert.equal(game.score - score, 50, 'a star caught')
  // Biting yourself only wakes the screen: no cable lost.
  lay(
    game,
    [
      [10, 9],
      [11, 9],
      [11, 10],
      [10, 10],
      [9, 10],
    ],
    UP,
  )
  game.dir = DOWN
  game.want = DOWN
  game.crawl()
  assert.ok(game.clear > 0, 'the Screensaver ends')
  assert.equal(game.lives, 3)
  assert.equal(game.dead, 0)
  // Played out on time, every star caught pays a bonus.
  const g2 = play()
  goTo(g2, 3)
  g2.saver!.ticks = 1
  g2.saver!.total = 3
  g2.saver!.caught = 3
  g2.update(emptyInput())
  assert.equal(g2.score, 5000)
}

// --- the Surge Protector ----------------------------------------------------------------
{
  const game = play()
  goTo(game, 6)
  const boss = game.boss!
  assert.ok(boss, 'the boss board')
  assert.equal(boss.hp, SURGE_PROTECTOR_HP)
  assert.equal(bossPhase(boss), 1)
  const ring = boss.ring
  // Its ring is the fuse box's outer corridor; it walks it.
  const start = bossCell(boss)
  boss.stun = 0
  for (let t = 0; t < 200; t++) game.update(emptyInput())
  assert.notEqual(bossCell(boss), start, 'it walks')
  assert.ok(ring.includes(bossCell(boss)))
  // Surge with it touching the cable: a hit.
  const hit = (fresh = true) => {
    boss.at = ring.indexOf(at(2, 17))
    if (fresh) boss.invuln = 0
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
    game.sockets = [{ k: at(3, 15), charge: 0 }]
    game.crawl()
  }
  hit()
  assert.equal(boss.hp, SURGE_PROTECTOR_HP - 1, 'one surge, one hit')
  assert.ok(boss.invuln > 0 && boss.stun > 0)
  hit(false)
  assert.equal(
    boss.hp,
    SURGE_PROTECTOR_HP - 1,
    'it shrugs off a surge straight after',
  )
  hit()
  hit()
  assert.equal(bossPhase(boss), 2, 'three hits: phase 2')
  // Phase 2: it pulls the sockets round the board.
  game.sockets = game.maze.sockets.map((k) => ({ k, charge: 0 }))
  const was = game.sockets.map((s) => s.k).join()
  game.body = [at(11, 9)]
  boss.stun = 0
  boss.shuffle = 1
  game.update(emptyInput())
  assert.notEqual(game.sockets.map((s) => s.k).join(), was, 'the sockets move')
  hit()
  hit()
  assert.equal(bossPhase(boss), 3)
  // Phase 3: a plug in sight down the ring and it charges, after a glowing tell.
  boss.stun = 0
  boss.invuln = 0
  boss.at = ring.indexOf(at(1, 1))
  boss.dir = 1
  boss.timer = 1
  lay(
    game,
    [
      [5, 1],
      [5, 2],
      [5, 3],
    ],
    UP,
  )
  game.update(emptyInput())
  assert.ok(boss.tell > 0, 'it glows')
  for (let t = 0; t < 40 && !boss.charging; t++) game.update(emptyInput())
  assert.ok(boss.charging > 0, 'then charges')
  // The last surge reboots it, and the run goes round to the next component.
  boss.charging = 0
  boss.tell = 0
  game.dead = 0
  game.lives = 3
  hit()
  assert.equal(boss.hp, 1, 'phase 3 takes two')
  game.clear = 0
  hit()
  assert.equal(boss.hp, 0)
  assert.ok(game.clear > 0, 'REBOOTED!')
  const level = game.level
  for (let t = 0; t < 200 && game.stepIndex !== 0; t++)
    game.update(emptyInput())
  assert.equal(game.compIndex, 1)
  assert.equal(game.level, level + 1)
  assert.equal(game.save!.comp, 1, 'saved at the next component start')
}

// --- saves: component starts, continues, new runs ---------------------------------------
{
  const game = play()
  goTo(game, 6)
  game.score = 12_345
  game.lives = 4
  game.bytes.add('ps-2')
  game.advance()
  const save = roundTrip(game.save)
  const back = play(5, save)
  assert.ok(back.offer, 'CONTINUE? on the way back in')
  assert.equal(back.music, null)
  const a = emptyInput()
  a.pressed.a = true
  back.update(a)
  assert.equal(back.offer, null)
  assert.equal(back.compIndex, 1)
  assert.equal(back.score, 12_345)
  assert.equal(back.lives, 4)
  assert.equal(back.level, 8)
  assert.ok(back.bytes.has('ps-2'))
  // A new run keeps the golden bytes but starts the campaign over.
  const fresh = play(5, save)
  const b = emptyInput()
  b.pressed.b = true
  fresh.update(b)
  assert.equal(fresh.compIndex, 0)
  assert.equal(fresh.save!.comp, 0)
  assert.deepEqual(fresh.save!.bytes, ['ps-2'])
  // A game over keeps the component reached, never the score.
  back.lives = 1
  back.cardTicks = 0
  back.dead = 0
  back.clear = 0
  back.battery = 1
  for (let t = 0; t < 200 && !back.over; t++) back.update(emptyInput())
  assert.ok(back.over)
  assert.equal(back.save!.continued, true)
  const again = play(6, roundTrip(back.save))
  again.update(a)
  assert.equal(again.compIndex, 1)
  assert.equal(again.score, 0)
  assert.equal(again.lives, 3)
  // Junk is ignored.
  for (const junk of [
    null,
    7,
    'x',
    [],
    { v: 2 },
    { v: 1, comp: -1 },
    { v: 1, comp: 1, score: 1.5, lives: 3 },
  ])
    assert.equal(readCableSave(junk), null)
  assert.deepEqual(
    readCableSave({
      v: 1,
      comp: 0,
      score: 0,
      lives: 3,
      bytes: ['ps-1', 'nope', 'ps-1', 4],
    })!.bytes,
    ['ps-1'],
  )
}

// --- music ------------------------------------------------------------------------------
for (const loop of [POWER_STRIP.music, BOSS_MUSIC, SCREENSAVER_MUSIC]) {
  const parsed = parseLoop(loop)
  assert.ok(parsed.notes.length > 20)
  assert.equal(parsed.length, 64, 'eight bars of eight')
}

// --- a deterministic maze clear, and pilot probes ---------------------------------------
{
  /** The pilot playing for real; `keep` holds the spare cables up. */
  const run = (
    seed: number,
    ticks: number,
    keep: boolean,
    stop?: (g: Game) => boolean,
  ) => {
    const game = play(seed)
    let t = 0
    for (; t < ticks && !game.over; t++) {
      if (keep) game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
      if (stop?.(game)) break
    }
    return { game, t }
  }
  const one = run(7, 60 * 60 * 3, true, (g) => g.level === 2)
  const two = run(7, 60 * 60 * 3, true, (g) => g.level === 2)
  assert.equal(one.game.level, 2, 'the pilot clears the Wall Outlet')
  assert.equal(one.t, two.t, 'the same seed clears on the same tick')
  assert.equal(one.game.score, two.game.score)
  assert.ok(one.t < 60 * 90, 'in good time')
  // With real cables, runs end.
  for (const seed of [1, 2, 3]) {
    const { game, t } = run(seed, 60 * 60 * 30, false)
    assert.ok(game.over, `seed ${seed}: the run ends`)
    assert.ok(t > 60 * 30, `seed ${seed}: but not at once`)
  }
  // With cables held up, the pilot gets through the Power Strip and its boss.
  for (const seed of [1, 3]) {
    const { game } = run(seed, 60 * 60 * 15, true)
    assert.ok(
      game.level >= 8,
      `seed ${seed}: past the Surge Protector (level ${game.level})`,
    )
    assert.ok(game.score < 2_000_000)
  }
}

console.log('verifyCabinetCableCrawler: ok')
