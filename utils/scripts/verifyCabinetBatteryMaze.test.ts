// /utils/scripts/verifyCabinetBatteryMaze.test.ts
//
// Battery Maze depth pass, slice 1 (conductor kr-arcade/t-039): the rules engine. Every maze
// layout loads and is sound in every switch state; the per-maze heat tables; the four
// re-riffed hunters; overclock, shield cells, eating drag and cornering; roaming prizes; the
// dock's release counters; the Friend Train and its payout; Rewire switches re-pathing the
// gremlins; and a pilot probe showing runs still end.
//
//   npx tsx utils/scripts/verifyCabinetBatteryMaze.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import batteryMaze, { BATTERY_MAZE } from '../arcade/games/batteryMaze'
import {
  CLASSIC_LAYOUT,
  LAYOUTS,
  SWITCHYARD,
  OUTLET_LOOPS,
  mazeProblems,
  parseMaze,
  type Maze,
  type Tile,
} from '../arcade/batteryMaze/mazes'
import {
  HUNTERS,
  SNIFF_LAG,
  freshMind,
  type HuntView,
} from '../arcade/batteryMaze/roster'
import {
  HEAT_TABLE,
  MAX_HEAT,
  PRIZES,
  REWIRE_FLIPS,
  bumpPoints,
  heatRow,
  overclockStage,
  trainPayout,
} from '../arcade/batteryMaze/tables'
import { emptyInput, type InputFrame } from '../arcade/types'
import { BOARDS, boardById, type Board } from '../arcade/batteryMaze/boards'

type Dir = { x: number; y: number }
type Gremlin = {
  kind: string
  x: number
  y: number
  dir: Dir
  state: string
  sleepy: boolean
  friendly: boolean
  mind: ReturnType<typeof freshMind>
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  pause: number
  maze: Maze
  heat: number
  row: (typeof HEAT_TABLE)[number]
  sparks: Set<string>
  cells: Set<string>
  totalSparks: number
  eaten: number
  flips: number
  switchState: Array<0 | 1>
  robot: {
    x: number
    y: number
    dir: Dir
    want: Dir
    eatDrag: number
    shield: number
  }
  trail: Tile[]
  gremlins: Gremlin[]
  train: Gremlin[]
  sleepyTimer: number
  sparksSinceRelease: number
  idleTicks: number
  prizes: Array<{ kind: number; x: number; y: number; dir: Dir; t: number }>
  update(input: InputFrame): void
  demoInput(): InputFrame
  card: unknown
  stepIndex: number
  menu: unknown
  beginMaze(board: Board, index: number): void
  loadMaze(maze: Maze, heat: number, roster: readonly string[]): void
  canMove(x: number, y: number, dir: Dir, allowDoor?: boolean): boolean
  junctionAlong(dir: Dir): Tile
  moveRobot(): void
  robotSpeed(): number
  eat(): void
  collide(): void
  moveTrain(): void
  updateModes(): void
  release(): void
  tryFlip(): void
  rollPrize(): void
  updatePrizes(): void
  gremlinSpeed(g: Gremlin): number
  chooseTurn(g: Gremlin, view: HuntView): void
  huntView(): HuntView
}

const LEFT = { x: -1, y: 0 }
const UP = { x: 0, y: -1 }
const DOWN = { x: 0, y: 1 }

/** A real game with Cozy Charger's title card lifted, its first maze in play. */
function play(seed = 3): Game {
  const game = batteryMaze.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Game
  game.menu = null
  game.card = null
  game.stepIndex = 1
  return game
}

/** Jump a game to one of a board's mazes. */
function goTo(game: Game, board: string, index: number) {
  game.beginMaze(boardById(board), index)
  game.pause = 0
}

/** Shortest walking distance between two tiles in the game's current gate state. */
function walk(game: Game, from: Tile, to: Tile): number {
  const seen = new Map([[`${from.x},${from.y}`, 0]])
  const queue = [from]
  while (queue.length) {
    const t = queue.shift()!
    const d = seen.get(`${t.x},${t.y}`)!
    if (t.x === to.x && t.y === to.y) return d
    for (const dir of [UP, DOWN, LEFT, { x: 1, y: 0 }]) {
      if (!game.canMove(t.x, t.y, dir)) continue
      const n = {
        x: (t.x + dir.x + game.maze.cols) % game.maze.cols,
        y: t.y + dir.y,
      }
      const k = `${n.x},${n.y}`
      if (!seen.has(k)) {
        seen.set(k, d + 1)
        queue.push(n)
      }
    }
  }
  return Infinity
}

// --- the mazes ---------------------------------------------------------------------
{
  assert.deepEqual(BATTERY_MAZE, CLASSIC_LAYOUT.rows, 'today’s maze is kept')
  assert.ok(LAYOUTS.length >= 3, 'more than one maze')
  assert.equal(
    new Set(LAYOUTS.map((l) => l.id)).size,
    LAYOUTS.length,
    'unique maze ids',
  )
  for (const layout of LAYOUTS) {
    const maze = parseMaze(layout)
    assert.deepEqual(mazeProblems(maze), [], `${layout.id} is sound`)
    assert.ok(maze.sparks.length > 150, `${layout.id} has plenty of sparks`)
    // Boss dens drop their cells in as the fight goes on.
    const boss = layout.id === 'mamas-den' || layout.id === 'the-core'
    assert.equal(maze.cells.length, boss ? 0 : 4, `${layout.id}'s power cells`)
    assert.ok(maze.dockPads.length >= 3)
  }
  const yard = parseMaze(SWITCHYARD)
  assert.equal(yard.switches.length, 3, 'the Switchyard has three switches')
  for (const s of yard.switches) assert.equal(s.gates.length, 2)
  assert.deepEqual(parseMaze(OUTLET_LOOPS).tunnelRows, [5, 15])
  assert.deepEqual(parseMaze(CLASSIC_LAYOUT).tunnelRows, [9])
  // A broken layout is caught: a spark walled in.
  const sealed = {
    ...CLASSIC_LAYOUT,
    id: 'sealed',
    rows: CLASSIC_LAYOUT.rows.map((r, y) =>
      y === 1 ? '#.#' + r.slice(3) : y === 2 ? '#o#' + r.slice(3) : r,
    ),
  }
  assert.ok(
    mazeProblems(parseMaze(sealed)).length > 0,
    'the validator catches a bad maze',
  )
}

// --- the heat tables -------------------------------------------------------------------
{
  assert.equal(MAX_HEAT, 20)
  HEAT_TABLE.forEach((row, i) => {
    assert.equal(row.heat, i + 1)
    assert.ok(row.robot > row.gremlin, `heat ${row.heat}: the robot outruns`)
    assert.ok(row.robotEat < row.robot, 'chomping slows the robot')
    assert.ok(row.tunnel < row.gremlin, 'gremlins crawl in tunnels')
    assert.ok(row.sleepyGremlin < row.gremlin)
    assert.ok(row.schedule.length % 2 === 1, 'the schedule ends in chase')
    if (i > 0) {
      const prev = HEAT_TABLE[i - 1]!
      assert.ok(row.robot >= prev.robot && row.gremlin >= prev.gremlin)
      assert.ok(row.sleepyTicks <= prev.sleepyTicks, 'sleepy time shrinks')
      assert.ok(row.overclock[0] >= prev.overclock[0])
    }
  })
  assert.ok(HEAT_TABLE[0]!.sleepyTicks >= 300, 'a long first sleep')
  assert.equal(heatRow(MAX_HEAT).sleepyTicks, 0, 'late cells are shields')
  assert.equal(heatRow(99), heatRow(MAX_HEAT), 'past the table keeps the last')
  assert.equal(heatRow(0), heatRow(1))
  const first = heatRow(1)
  assert.deepEqual(first.overclock, [30, 15])
  assert.equal(overclockStage(first, 31), 0)
  assert.equal(overclockStage(first, 30), 1)
  assert.equal(overclockStage(first, 15), 2)
  assert.deepEqual([1, 2, 3, 4].map(trainPayout), [500, 2000, 4500, 8000])
  assert.deepEqual([1, 2, 3, 4, 5].map(bumpPoints), [200, 400, 800, 1600, 1600])
  assert.equal(PRIZES.length, 10, 'ten prizes, two past the crown')
  assert.equal(PRIZES[7]!.name, 'CROWN')
  assert.ok(PRIZES[9]!.points > PRIZES[8]!.points)
}

// --- the four hunters, re-riffed -----------------------------------------------------------
{
  const robot = { x: 10, y: 10, dir: LEFT }
  const view = (over: Partial<HuntView> = {}): HuntView => ({
    robot,
    trail: (ticks) => ({ x: 100 + ticks, y: 0 }),
    junctionAhead: () => ({ x: 3, y: 10 }),
    junctionBehind: () => ({ x: 15, y: 10 }),
    cellNearRobot: () => ({ x: 1, y: 2 }),
    randomSpark: () => ({ x: 7, y: 7 }),
    chomping: false,
    overclock: 0,
    sees: () => false,
    nearestSpark: () => null,
    stick: LEFT,
    hopAcross: () => null,
    junction: () => false,
    ...over,
  })
  const self = (x: number, y: number) => ({ x, y, mind: freshMind() })
  // The chaser sniffs the trail a beat behind, closer as it overclocks; up close it pounces.
  assert.deepEqual(HUNTERS.chaser.hunt(self(1, 1), view()), {
    x: 100 + SNIFF_LAG[0],
    y: 0,
  })
  assert.deepEqual(
    HUNTERS.chaser.hunt(self(1, 1), view({ overclock: 2 })),
    { x: 100, y: 0 },
    'fully overclocked it reads the robot’s tile',
  )
  assert.ok(SNIFF_LAG[0] > SNIFF_LAG[1] && SNIFF_LAG[1] > SNIFF_LAG[2])
  assert.deepEqual(HUNTERS.chaser.hunt(self(11, 10), view()), {
    x: 10,
    y: 10,
  })
  // The ambusher races for the next crossroads.
  assert.deepEqual(HUNTERS.ambusher.hunt(self(1, 1), view()), { x: 3, y: 10 })
  // The flanker guards the cell, charges when the robot nears it, and cuts off the retreat
  // once the cells are gone.
  const guard = self(5, 5)
  assert.deepEqual(HUNTERS.flanker.hunt(guard, view()), { x: 1, y: 2 })
  assert.equal(guard.mind.charging, false)
  assert.deepEqual(
    HUNTERS.flanker.hunt(
      guard,
      view({ cellNearRobot: () => ({ x: 8, y: 8 }) }),
    ),
    { x: 10, y: 10 },
  )
  assert.equal(guard.mind.charging, true)
  assert.deepEqual(
    HUNTERS.flanker.hunt(guard, view({ cellNearRobot: () => null })),
    { x: 15, y: 10 },
  )
  // The wanderer potters to sparks until it hears chomping close by.
  const dozy = self(18, 18)
  assert.deepEqual(HUNTERS.wanderer.hunt(dozy, view()), { x: 7, y: 7 })
  HUNTERS.wanderer.sense!(dozy, view({ chomping: true }))
  assert.equal(dozy.mind.curious, 0, 'too far away to hear')
  const near = self(12, 12)
  HUNTERS.wanderer.sense!(near, view({ chomping: true }))
  assert.ok(near.mind.curious > 0, 'it hears chomping nearby')
  assert.deepEqual(HUNTERS.wanderer.hunt(near, view()), { x: 10, y: 10 })
  for (let i = 0; i < 200; i++) HUNTERS.wanderer.sense!(near, view())
  assert.equal(near.mind.curious, 0, 'and loses interest')
  // None of them copies another: four different targets from one position.
  const targets = (['chaser', 'ambusher', 'flanker', 'wanderer'] as const).map(
    (k) => JSON.stringify(HUNTERS[k].hunt(self(1, 1), view())),
  )
  assert.equal(new Set(targets).size, 4, 'four different rules')
}

// --- the robot: crossroads, cornering, chomping drag ----------------------------------------
{
  const game = play()
  game.pause = 0
  assert.equal(game.maze.id, 'classic')
  assert.deepEqual(game.junctionAlong(LEFT), { x: 7, y: 11 })
  // Cornering: approaching a junction with up held, the robot turns before the centre.
  Object.assign(game.robot, { x: 5.3, y: 3, dir: LEFT, want: UP })
  game.moveRobot()
  assert.deepEqual(game.robot.dir, UP, 'the robot turns early')
  assert.ok(game.robot.y < 3 && game.robot.x < 5.3, 'cutting the corner')
  for (let i = 0; i < 5; i++) game.moveRobot()
  assert.equal(game.robot.x, 5, 'back on the centre line')
  // A gremlin at the same spot holds its line until the centre.
  const g = game.gremlins[0]!
  Object.assign(g, { x: 5.3, y: 3, dir: LEFT, state: 'roaming' })
  game.update(emptyInput())
  assert.deepEqual(g.dir, LEFT)
  // Chomping drag.
  game.robot.eatDrag = 0
  const free = game.robotSpeed()
  game.robot.eatDrag = 3
  assert.ok(game.robotSpeed() < free, 'chomping slows the robot')
  // Gremlins crawl in the tunnel.
  Object.assign(g, { x: 1, y: 9, state: 'roaming', sleepy: false })
  const crawl = game.gremlinSpeed(g)
  Object.assign(g, { x: 5, y: 3 })
  assert.ok(crawl < game.gremlinSpeed(g))
}

// --- overclock: the chaser speeds up as the sparks run out --------------------------------
{
  const game = play()
  const chaser = game.gremlins.find((g) => g.kind === 'chaser')!
  Object.assign(chaser, { x: 5, y: 3, state: 'roaming' })
  const calm = game.gremlinSpeed(chaser)
  const keep = [...game.sparks].slice(0, 10)
  game.sparks = new Set(keep)
  game.cells = new Set()
  assert.ok(game.gremlinSpeed(chaser) > calm * 1.09, 'overclocked by 10%')
  const ambusher = game.gremlins.find((g) => g.kind === 'ambusher')!
  Object.assign(ambusher, { x: 5, y: 3, state: 'roaming' })
  assert.ok(Math.abs(game.gremlinSpeed(ambusher) - calm) < 1e-9)
}

// --- the dock: release counters ------------------------------------------------------------
{
  const game = play()
  const docked = () => game.gremlins.filter((g) => g.state === 'docked').length
  assert.equal(docked(), 3)
  game.release()
  assert.equal(docked(), 2, 'the first steps straight out')
  game.sparksSinceRelease = heatRow(1).release[1]! - 1
  game.release()
  assert.equal(docked(), 2, 'the next waits for its sparks')
  game.sparksSinceRelease++
  game.release()
  assert.equal(docked(), 1)
  game.idleTicks = heatRow(1).idleRelease
  game.release()
  assert.equal(docked(), 0, 'a quiet spell lets the last one out')
}

// --- the Friend Train ---------------------------------------------------------------------------
{
  const game = play()
  game.pause = 0
  const cell = game.maze.cells[0]!
  Object.assign(game.robot, { x: cell.x, y: cell.y, dir: DOWN, want: DOWN })
  for (const g of game.gremlins) g.state = 'roaming'
  game.eat()
  assert.ok(game.sleepyTimer > 0)
  assert.ok(game.gremlins.every((g) => g.sleepy))
  const before = game.score
  for (const g of game.gremlins) {
    Object.assign(g, { x: game.robot.x, y: game.robot.y })
    game.collide()
  }
  assert.equal(game.train.length, 4, 'four friends ride the train')
  assert.ok(game.train.every((g) => g.state === 'friend' && !g.sleepy))
  assert.equal(game.score - before, 200 + 400 + 800 + 1600, 'the bump chain')
  // The robot runs on; the friends ride its trail a tile apart and eat what they pass.
  game.trail = Array.from({ length: 40 }, (_, i) => ({ x: 1, y: 3 + i * 0.25 }))
  game.trail.reverse()
  for (let i = 0; i < 25; i++) game.moveTrain()
  const [lead, second] = game.train
  assert.deepEqual([lead!.x, lead!.y], [1, 4], 'the first friend a tile back')
  assert.deepEqual([second!.x, second!.y], [1, 5], 'the next a tile further')
  const sparksBefore = game.sparks.size
  game.sparks.add(`${Math.round(lead!.x)},${Math.round(lead!.y)}`)
  game.moveTrain()
  assert.equal(
    game.sparks.size,
    sparksBefore,
    'a friend eats the spark it rides over',
  )
  // The cell runs down: the train pays 500 x length squared and the friends stroll home.
  const preTrain = game.score
  game.sleepyTimer = 1
  game.updateModes()
  assert.equal(game.score - preTrain, trainPayout(4))
  assert.equal(game.train.length, 0)
  assert.ok(game.gremlins.every((g) => g.state === 'eyes' && g.friendly))
  // A caught robot loses its train unpaid.
  const caught = play()
  caught.pause = 0
  for (const g of caught.gremlins) g.state = 'roaming'
  const c = caught.maze.cells[0]!
  Object.assign(caught.robot, { x: c.x, y: c.y })
  caught.eat()
  const [a, b] = caught.gremlins
  Object.assign(a!, { x: c.x, y: c.y })
  caught.collide()
  Object.assign(b!, { x: c.x, y: c.y, sleepy: false })
  const score = caught.score
  caught.collide()
  assert.equal(caught.train.length, 0)
  assert.equal(caught.score, score, 'no payout when caught')
}

// --- shield cells ---------------------------------------------------------------------------------
{
  const game = play()
  game.loadMaze(parseMaze(CLASSIC_LAYOUT), MAX_HEAT, [
    'chaser',
    'ambusher',
    'flanker',
    'wanderer',
  ])
  game.pause = 0
  for (const g of game.gremlins) g.state = 'roaming'
  const cell = game.maze.cells[0]!
  Object.assign(game.robot, { x: cell.x, y: cell.y })
  game.eat()
  assert.equal(game.sleepyTimer, 0, 'nobody gets sleepy')
  assert.ok(game.robot.shield > 0, 'the robot is shielded')
  const g = game.gremlins[0]!
  Object.assign(g, { x: cell.x, y: cell.y - 0.3, dir: DOWN, sleepy: false })
  const lives = game.lives
  game.collide()
  assert.equal(game.lives, lives, 'a shielded robot is safe')
  assert.deepEqual(g.dir, UP, 'and the gremlin bounces off')
}

// --- Rewire: switches swing gates and the gremlins re-path ---------------------------------------
{
  const game = play()
  goTo(game, 'cozy', 2)
  assert.equal(game.maze.id, 'switchyard')
  game.pause = 0
  const sw = game.maze.switches.find((s) => s.x === 11 && s.y === 3)!
  assert.ok(sw)
  assert.equal(game.flips, REWIRE_FLIPS)
  assert.ok(game.canMove(11, 3, DOWN) && !game.canMove(11, 3, UP))
  const upTop = walk(game, { x: 11, y: 3 }, { x: 11, y: 1 })
  // A gremlin walking down into the lower gate.
  const g = game.gremlins.find((x) => x.kind === 'ambusher')!
  Object.assign(g, { x: 11, y: 3.5, dir: DOWN, state: 'roaming' })
  Object.assign(game.robot, { x: 11, y: 3, dir: LEFT, want: LEFT })
  game.tryFlip()
  assert.equal(game.flips, REWIRE_FLIPS - 1)
  assert.equal(game.switchState[game.maze.switches.indexOf(sw)], 1)
  assert.ok(!game.canMove(11, 3, DOWN) && game.canMove(11, 3, UP))
  assert.deepEqual(g.dir, UP, 'the gremlin turns back from the shut gate')
  assert.ok(
    walk(game, { x: 11, y: 3 }, { x: 11, y: 1 }) < upTop,
    'the flip opened a shorter way',
  )
  // At the switch with the gate shut below, a chasing gremlin aims another way.
  Object.assign(g, { x: 11, y: 3, dir: LEFT, state: 'roaming', sleepy: false })
  game.chooseTurn(g, game.huntView())
  assert.notDeepEqual(g.dir, DOWN, 'it never walks into the shut gate')
  // Flips run out, and a power cell tops them up.
  game.tryFlip()
  game.tryFlip()
  game.tryFlip()
  assert.equal(game.flips, 0)
  const state = [...game.switchState]
  game.tryFlip()
  assert.deepEqual(game.switchState, state, 'no flips left')
  const cell = game.maze.cells[0]!
  Object.assign(game.robot, { x: cell.x, y: cell.y })
  game.eat()
  assert.equal(game.flips, REWIRE_FLIPS)
  // Away from a switch, A does nothing.
  Object.assign(game.robot, { x: 1, y: 7 })
  game.tryFlip()
  assert.equal(game.flips, REWIRE_FLIPS)
}

// --- roaming prizes -----------------------------------------------------------------------------
{
  const game = play()
  assert.equal(game.maze.id, 'classic')
  game.rollPrize()
  assert.equal(game.prizes.length, 0, 'no prize before the maze is under way')
  game.eaten = Math.ceil(game.totalSparks * 0.3)
  game.rollPrize()
  const roaming = () => (game as Game).prizes[0]
  const p = roaming()!
  assert.ok(p, 'a prize rolls in')
  assert.equal(p.kind, 0, 'the heat-1 prize')
  assert.ok(p.y === 9 && (p.x === 0 || p.x === 22), 'from the tunnel')
  const start = { x: p.x, y: p.y }
  Object.assign(game.robot, { x: 11, y: 11 })
  for (let i = 0; i < 120; i++) game.updatePrizes()
  const moved = roaming()!
  assert.ok(
    moved && (moved.x !== start.x || moved.y !== start.y),
    'it wanders into the maze',
  )
  Object.assign(game.robot, { x: moved.x, y: moved.y })
  const score = game.score
  game.updatePrizes()
  assert.equal(game.score - score, PRIZES[0]!.points, 'caught')
  assert.equal(game.prizes.length, 0)
  // Left alone, it wanders off again.
  const other = play()
  other.eaten = Math.ceil(other.totalSparks * 0.3)
  other.rollPrize()
  Object.assign(other.robot, { x: -50, y: -50 })
  for (let i = 0; i < 60 * 20 && other.prizes.length; i++) other.updatePrizes()
  assert.equal(other.prizes.length, 0, 'an uncaught prize leaves')
}

// --- each maze its own layout, a hotter table ------------------------------------------------------
{
  const game = play()
  const seen = new Set<string>()
  let heat = 0
  const open = BOARDS.filter((b) => !b.secret)
  for (const board of open) {
    for (let i = 0; i < 3; i++) {
      goTo(game, board.id, i)
      seen.add(game.maze.id)
      heat++
      assert.equal(
        game.row,
        heatRow(heat),
        `${board.id} ${i + 1} is heat ${heat}`,
      )
    }
  }
  assert.equal(seen.size, open.length * 3, 'every maze its own layout')
  assert.ok(LAYOUTS.length > seen.size, 'plus the boss mazes')
}

// --- determinism and the pilot probe -------------------------------------------------------------
{
  const run = (seed: number, ticks: number) => {
    const game = play(seed)
    for (let t = 0; t < ticks && !game.over; t++) game.update(game.demoInput())
    return [game.score, game.level, game.lives, game.robot.x, game.robot.y]
  }
  assert.deepEqual(run(9, 3000), run(9, 3000), 'same seed, same game')

  // The pilot plays for real with its three robots: runs end, after clearing mazes.
  for (const seed of [1, 2]) {
    const game = play(seed)
    let t = 0
    for (; t < 60 * 60 * 25 && !game.over; t++) game.update(game.demoInput())
    assert.ok(game.over, `seed ${seed}: the run ends`)
    assert.ok(game.level >= 2, `seed ${seed}: the pilot clears a maze`)
    assert.ok(game.score > 2000)
  }
}

console.log('verifyCabinetBatteryMaze: ok')
