// /utils/scripts/verifyCabinetBatteryMazeNight.test.ts
//
// Battery Maze depth pass, slice 3 (conductor kr-arcade/t-041): Power Phases 2 and 3, the Overload
// and the endings. The Greenhouse Grid's vines and flower gates, Cold Storage's ice and fans,
// Arcade After Hours' darkness, lamps and locks, the Rooftop Solar Farm's sun, panels and mirror
// junctions; their four special mazes; the seven new gremlins; the Glitch Train and the Overload;
// the endings, the golden bolts, the Battery Garden and Overclocked.
//
//   npx tsx utils/scripts/verifyCabinetBatteryMazeNight.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import batteryMaze, { readBatterySave } from '../arcade/games/batteryMaze'
import {
  BOARDS,
  PHASES,
  SPECIALS,
  SUNSET,
  THAW_TICKS,
  boardById,
  campaignSteps,
  heatFor,
  secretStep,
  type Board,
  type Step,
} from '../arcade/batteryMaze/boards'
import {
  GlitchTrain,
  OVERLOAD,
  Overload,
  TRAIN,
  type BossMachine,
  type BossWorld,
} from '../arcade/batteryMaze/bosses'
import type { Maze, Tile } from '../arcade/batteryMaze/mazes'
import {
  BLINK,
  GATEKEEP,
  HUNTERS,
  THORN_TICKS,
  type Mind,
} from '../arcade/batteryMaze/roster'
import { ALL_SCENES, sceneById } from '../arcade/batteryMaze/story'
import { OVERCLOCKED_HEAT } from '../arcade/batteryMaze/tables'
import { emptyInput, type InputFrame } from '../arcade/types'

type Dir = { x: number; y: number }
type Gremlin = {
  kind: string
  x: number
  y: number
  dir: Dir
  state: string
  sleepy: boolean
  friendly: boolean
  sulky: boolean
  mind: Mind
}
type Game = {
  score: number
  lives: number
  level: number
  lap: number
  over: boolean
  save: unknown
  pause: number
  dying: number
  clearing: number
  stepIndex: number
  menu: unknown
  steps: Step[]
  card: unknown
  story: { scene: { id: string }; t: number } | null
  board: Board
  maze: Maze
  heat: number
  mazeTick: number
  sparks: Set<string>
  cells: Set<string>
  totalSparks: number
  golden: string[]
  overclocked: boolean
  blocked: Set<string>
  switchState: Array<0 | 1>
  vineGrown: Map<string, number>
  vineTimer: number
  bloomed: Set<string>
  ice: Set<string>
  lit: Set<string>
  unlocked: boolean
  panelBack: Map<string, number>
  mirrorTimer: number
  thorns: Map<string, number>
  crackle: Map<string, number>
  special: { caught: number; done: boolean; failed: boolean } | null
  goldenBolt: unknown
  robot: {
    x: number
    y: number
    dir: Dir
    want: Dir
    eatDrag: number
    shield: number
  }
  gremlins: Gremlin[]
  train: Gremlin[]
  power: { kind: string; ticks: number } | null
  powerItem: unknown
  boss: BossMachine | null
  bossWorld: BossWorld
  sleepyTimer: number
  music: unknown
  update(input: InputFrame): void
  demoInput(): InputFrame
  beginMaze(board: Board, index: number): void
  beginBoss(phase: number): void
  advance(): void
  startStep(): void
  updateBoard(): void
  updatePower(): void
  updateSpecial(): void
  clearMaze(): void
  moveRobot(): void
  robotSpeed(): number
  robotCan(x: number, y: number, dir: Dir): boolean
  canMove(x: number, y: number, dir: Dir): boolean
  moveGremlin(g: Gremlin, view: unknown): void
  chooseTurn(g: Gremlin, view: unknown): void
  gremlinTricks(g: Gremlin): void
  huntView(): Parameters<(typeof HUNTERS)['chaser']['hunt']>[1]
  hiddenGremlins(): Set<Gremlin>
  collide(): void
  eat(): void
  tryFlip(): void
  sunny(): boolean
  fanOn(): boolean
}

const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }
const UP = { x: 0, y: -1 }
const key = (t: Tile) => `${t.x},${t.y}`

function create(resume?: unknown): Game {
  const game = batteryMaze.create({
    rng: mulberry32(7),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
    resume,
  }) as unknown as Game
  // Straight into the campaign, as picking it from the mode menu does.
  game.menu = null
  return game
}

function goTo(game: Game, board: string, index: number) {
  game.card = null
  game.beginMaze(boardById(board), index)
  game.pause = 0
}

/** A gremlin of a kind, roaming at a spot. */
function put(game: Game, kind: string, at: Tile, dir: Dir = LEFT): Gremlin {
  const g = game.gremlins.find((x) => x.kind === kind)!
  assert.ok(g, `a ${kind} is in this maze`)
  Object.assign(g, { ...at, dir, state: 'roaming', sleepy: false })
  return g
}

// --- the whole campaign as data ------------------------------------------------------------------
{
  assert.deepEqual(
    PHASES.map((p) => [p.name, p.boss]),
    [
      ['MORNING BOOT', 'mama'],
      ['AFTERNOON LOAD', 'train'],
      ['NIGHT SHIFT', 'overload'],
    ],
  )
  const steps = campaignSteps()
  const kinds = steps.map((s) => s.kind)
  assert.equal(kinds.filter((k) => k === 'boss').length, 3)
  assert.equal(
    kinds.filter((k) => k === 'bay').length,
    2,
    'the Bay between phases',
  )
  const ending = steps.findIndex((s) => s.kind === 'ending' && !s.secret)
  assert.equal(steps[ending - 1]!.kind, 'boss', 'the Overload, then the ending')
  assert.ok(
    steps.slice(ending + 1).every(secretStep),
    'then only the secret board',
  )
  assert.equal(steps.at(-1)!.kind, 'ending', 'and the true ending last')
  // Six story breaks, one after each open board, plus the two endings.
  const open = BOARDS.filter((b) => !b.secret)
  assert.equal(open.length, 6)
  assert.equal(new Set(open.map((b) => b.story)).size, 6)
  for (const b of BOARDS) assert.equal(sceneById(b.story).id, b.story)
  assert.ok(ALL_SCENES.some((s) => s.id === 'ending' && s.credits))
  // Every open board's special maze has its golden bolt on a floor tile.
  for (const b of open) {
    const m = b.mazes[1]!
    assert.ok(m.special && SPECIALS[m.special], `${b.id} special`)
    const at = m.goldenBolt!
    assert.notEqual(m.layout.rows[at.y]![at.x], '#', `${b.id} golden bolt`)
  }
  // The roster grows to thirteen gremlins and a baby.
  const kindsSeen = new Set(
    BOARDS.flatMap((b) => b.mazes.flatMap((m) => m.roster)),
  )
  for (const k of [
    'copycat',
    'bramble',
    'blinker',
    'snowball',
    'static',
    'gatekeeper',
    'twin',
  ])
    assert.ok(kindsSeen.has(k as never), `${k} appears`)
  assert.equal(Object.keys(HUNTERS).length, 14)
  // Overclocked plays the late tables from the first maze.
  assert.equal(heatFor(boardById('cozy'), 0, 1), 1 + OVERCLOCKED_HEAT)
}

// --- Greenhouse Grid: vines, the watering can, flower gates, Bloom Run -----------------------------
{
  const game = create()
  goTo(game, 'greenhouse', 0)
  const every = boardById('greenhouse').vines!.every
  Object.assign(game.robot, { x: 11, y: 11 })
  game.vineTimer = every - 1
  game.updateBoard()
  assert.equal(game.vineGrown.size, 1, 'a vine buds')
  const [bud] = [...game.vineGrown.keys()]
  assert.ok(!game.blocked.has(bud!), 'a bud does not block yet')
  for (let t = 0; t < boardById('greenhouse').vines!.bud + 2; t++) {
    game.vineTimer = 0
    game.updateBoard()
  }
  assert.ok(game.blocked.has(bud!), 'then it grows across the corridor')
  // The watering can clears every vine.
  game.powerItem = {
    kind: 'can',
    x: game.robot.x,
    y: game.robot.y,
    dir: LEFT,
    t: 0,
    wander: 999,
  }
  game.updatePower()
  assert.equal(game.vineGrown.size, 0)
  assert.ok(!game.blocked.has(bud!), 'the can withers the vines')
  // Flower gates bloom once their beds are eaten.
  const gate = game.maze.flowers[0]!
  assert.ok(game.blocked.has(key(gate)), 'a flower gate starts shut')
  for (const b of gate.bed) game.sparks.delete(key(b))
  game.updateBoard()
  assert.ok(game.bloomed.has(key(gate)))
  assert.ok(!game.blocked.has(key(gate)), 'and opens when its bed is eaten')

  // Bloom Run: six gates before the vines win.
  const run = create()
  goTo(run, 'greenhouse', 1)
  assert.equal(run.maze.flowers.length, 6)
  for (const f of run.maze.flowers)
    for (const b of f.bed) run.sparks.delete(key(b))
  run.updateBoard()
  run.updateSpecial()
  assert.equal(run.special!.caught, 6)
  assert.ok(run.special!.done, 'all six bloomed')
  const lost = create()
  goTo(lost, 'greenhouse', 1)
  for (const v of lost.maze.vines) lost.vineGrown.set(key(v), 1)
  lost.updateSpecial()
  assert.ok(lost.special!.failed, 'the vines closed the board first')
}

// --- copycat and bramble --------------------------------------------------------------------------
{
  const game = create()
  goTo(game, 'greenhouse', 2)
  const copy = put(game, 'copycat', { x: 3, y: 5 }, RIGHT)
  game.robot.want = LEFT
  game.chooseTurn(copy, game.huntView())
  assert.deepEqual(copy.dir, RIGHT, 'stick left, copycat goes right')
  game.robot.want = UP
  game.chooseTurn(copy, game.huntView())
  assert.deepEqual(copy.dir, UP, 'up is up')
  Object.assign(copy, { x: 1, y: 1, dir: LEFT })
  game.robot.want = UP
  game.chooseTurn(copy, game.huntView())
  assert.deepEqual(copy.dir, { x: 0, y: 0 }, 'walled in, it stands still')
  // A bramble's thorns block the robot, not the gremlins, and fade.
  const briar = put(game, 'bramble', { x: 5, y: 5 }, RIGHT)
  Object.assign(game.robot, { x: 11, y: 11 })
  game.thorns.set('6,5', THORN_TICKS)
  assert.ok(!game.robotCan(5, 5, RIGHT), 'the robot cannot walk into thorns')
  assert.ok(game.canMove(5, 5, RIGHT), 'gremlins can')
  for (let t = 0; t < THORN_TICKS; t++) game.updateBoard()
  assert.equal(game.thorns.size, 0, 'thorns fade')
  // Walking on, it leaves thorns behind.
  briar.dir = RIGHT
  for (let i = 0; i < 60; i++) game.moveGremlin(briar, game.huntView())
  assert.ok(game.thorns.size > 0, 'a thorn trail')
}

// --- Cold Storage: ice, fans, the blinker, the snowball, Thaw --------------------------------------
{
  const game = create()
  goTo(game, 'cold', 0)
  // Row 3 is ice from x 2 to 20: no turning back once on it.
  Object.assign(game.robot, { x: 6, y: 3, dir: RIGHT, want: LEFT, eatDrag: 0 })
  const fast = game.robotSpeed()
  game.moveRobot()
  assert.deepEqual(game.robot.dir, RIGHT, 'no reversing on ice')
  assert.ok(game.robot.x > 6)
  Object.assign(game.robot, { x: 1, y: 7, dir: RIGHT })
  assert.ok(fast > game.robotSpeed() * 1.2, 'ice is quick')
  // Fans push along their rows while they blow.
  const fan = game.maze.fans[0]!
  game.mazeTick = 1
  assert.ok(game.fanOn())
  Object.assign(game.robot, {
    x: 5,
    y: fan.row,
    dir: fan.dir === 1 ? RIGHT : LEFT,
  })
  const withWind = game.robotSpeed()
  game.robot.dir = fan.dir === 1 ? LEFT : RIGHT
  assert.ok(
    withWind > game.robotSpeed() * 2,
    'the wind helps one way and hinders the other',
  )
  // A blinker blinks, then hops through a thin wall to land beside the robot.
  // Find a thin wall: floor, one wall tile, floor again below it.
  const rows = game.maze.rows
  let spot: Tile | null = null
  for (let y = 1; y < rows.length - 2 && !spot; y++)
    for (let x = 1; x < 22 && !spot; x++)
      if (
        rows[y]![x] !== '#' &&
        rows[y + 1]![x] === '#' &&
        '.oi'.includes(rows[y + 2]![x]!)
      )
        spot = { x, y }
  assert.ok(spot, 'a thin wall somewhere')
  const blink = put(game, 'blinker', spot, UP)
  Object.assign(game.robot, { x: spot.x, y: spot.y + 2 })
  const view = game.huntView()
  const hop = view.hopAcross(spot)
  assert.deepEqual(hop, { x: spot.x, y: spot.y + 2 }, 'across the wall')
  HUNTERS.blinker.sense!(blink, view)
  assert.equal(blink.mind.blink, BLINK.tell)
  for (let t = 0; t < BLINK.tell; t++) {
    HUNTERS.blinker.sense!(blink, view)
    game.gremlinTricks(blink)
  }
  assert.deepEqual([blink.x, blink.y], [spot.x, spot.y + 2], 'it hopped')
  // A snowball rolling with the wind grows.
  const ball = create()
  goTo(ball, 'cold', 1)
  ball.mazeTick = 1
  const f2 = ball.maze.fans[0]!
  const snow = put(
    ball,
    'snowball',
    { x: 8, y: f2.row },
    f2.dir === 1 ? RIGHT : LEFT,
  )
  for (let t = 0; t < 100; t++) ball.gremlinTricks(snow)
  assert.ok(snow.mind.rolling && snow.mind.size > 1, 'rolling and growing')
  // Thaw: ice melts as its sparks are eaten; clear in time for the golden bolt.
  const iceKey = [...ball.ice][0]!
  const [ix, iy] = iceKey.split(',').map(Number) as [number, number]
  Object.assign(ball.robot, { x: ix, y: iy })
  ball.eat()
  assert.ok(!ball.ice.has(iceKey), 'the ice melts')
  ball.sparks.clear()
  ball.cells.clear()
  ball.pause = 0
  ball.update(emptyInput())
  assert.ok(ball.special!.done)
  assert.deepEqual(ball.golden, ['cold'], 'a clean thaw: the golden bolt')
  const slow = create()
  goTo(slow, 'cold', 1)
  slow.mazeTick = THAW_TICKS
  slow.updateSpecial()
  assert.ok(slow.special!.failed, 'the freezer door shuts')
}

// --- Arcade After Hours: the dark, lamps, static, the gatekeeper and its locks -----------------------
{
  const game = create()
  goTo(game, 'arcade', 0)
  assert.equal(game.lit.size, game.maze.lamps.length, 'the lamps blink away')
  const cr = put(game, 'static', { x: 1, y: 1 }, RIGHT)
  Object.assign(game.robot, { x: 11, y: 11 })
  assert.ok(game.hiddenGremlins().has(cr), 'out of the light, unseen')
  Object.assign(cr, { x: 12, y: 11 })
  assert.ok(!game.hiddenGremlins().has(cr), 'in the light, seen')
  Object.assign(cr, { x: 1, y: 1 })
  for (let i = 0; i < 40; i++) game.moveGremlin(cr, game.huntView())
  assert.ok(game.crackle.size > 0, 'crackle where it walked')
  // Lamp Lighter: relight all eight.
  const dark = create()
  goTo(dark, 'arcade', 1)
  assert.equal(dark.lit.size, 0, 'the lamps start dark')
  const lamp = dark.maze.lamps[0]!
  Object.assign(dark.robot, { x: lamp.x, y: lamp.y })
  dark.eat()
  assert.ok(dark.lit.has(key(lamp)), 'eating beside a lamp relights it')
  assert.equal(dark.special!.caught, 1)
  // The gatekeeper parks on a junction; rebooting it opens the shortcuts.
  const hall = create()
  goTo(hall, 'arcade', 2)
  assert.ok(hall.maze.locks.length > 0)
  assert.ok(hall.blocked.has(key(hall.maze.locks[0]!)), 'locked')
  const gk = put(hall, 'gatekeeper', { x: 5, y: 5 })
  Object.assign(hall.robot, { x: 5, y: 7 })
  HUNTERS.gatekeeper.sense!(gk, hall.huntView())
  assert.equal(gk.mind.park, GATEKEEP.park, 'it parks')
  assert.equal(HUNTERS.gatekeeper.pace!(gk), 0)
  gk.sleepy = true
  Object.assign(gk, { x: hall.robot.x, y: hall.robot.y })
  hall.collide()
  assert.ok(hall.unlocked)
  assert.ok(!hall.blocked.has(key(hall.maze.locks[0]!)), 'shortcuts open')
}

// --- Rooftop Solar Farm: sun, panels, Sunset Charge, mirrors, the twins -----------------------------
{
  const game = create()
  goTo(game, 'solar', 0)
  const sun = boardById('solar').sun!
  assert.ok(game.sunny())
  const panel = game.maze.panels[0]!
  Object.assign(game.robot, panel)
  game.eat()
  assert.ok(!game.sparks.has(key(panel)))
  for (let t = 0; t < sun.respawn + 1; t++) game.updateBoard()
  assert.ok(game.sparks.has(key(panel)), 'the sun grows it back')
  game.mazeTick = sun.day + 10
  assert.ok(!game.sunny(), 'night falls')
  Object.assign(game.robot, panel)
  game.eat()
  for (let t = 0; t < sun.respawn + 1; t++) game.updateBoard()
  assert.ok(!game.sparks.has(key(panel)), 'nothing grows at night')
  // Mirror junctions turn on the clock, and the robot can't throw them.
  const mirror = game.maze.switches.findIndex((s) => s.auto)
  assert.ok(mirror >= 0)
  const before = game.switchState[mirror]
  game.mirrorTimer = boardById('solar').mirrors! - 1
  game.updateBoard()
  assert.notEqual(game.switchState[mirror], before, 'the mirror turned')
  const m = game.maze.switches[mirror]!
  Object.assign(game.robot, { x: m.x, y: m.y })
  const now = game.switchState[mirror]
  game.tryFlip()
  assert.equal(game.switchState[mirror], now)
  // The twins pincer; reboot one and the other sulks home.
  const twins = game.gremlins.filter((g) => g.kind === 'twin')
  assert.deepEqual(
    twins.map((t) => t.mind.side),
    [0, 1],
  )
  for (const t of twins) Object.assign(t, { state: 'roaming', x: 5, y: 5 })
  Object.assign(twins[0]!, { x: game.robot.x, y: game.robot.y, sleepy: true })
  game.collide()
  assert.equal(twins[1]!.state, 'eyes')
  assert.ok(twins[1]!.sulky)
  // Sunset Charge: bank panel sparks before the sun goes down.
  const deck = create()
  goTo(deck, 'solar', 1)
  const p2 = deck.maze.panels[0]!
  Object.assign(deck.robot, p2)
  deck.eat()
  assert.equal(deck.special!.caught, 1, 'banked')
  deck.mazeTick = SUNSET.day
  deck.updateSpecial()
  assert.ok(deck.special!.failed, 'the sun set first')
}

// --- the Glitch Train ----------------------------------------------------------------------------
{
  const game = create()
  game.card = null
  game.beginBoss(2)
  game.pause = 0
  const train = game.boss as GlitchTrain
  assert.ok(train instanceof GlitchTrain)
  assert.equal(game.maze.id, 'train-yard')
  assert.equal(train.carsLeft, TRAIN.cars)
  for (let t = 0; t < 200; t++) train.update(game.bossWorld)
  const head = train.trains[0]!
  const cars = train.carsOf(head)
  assert.equal(cars.length, TRAIN.cars, 'the cars follow the head')
  // Awake, it hurts; sleepy, only the caboose can be bumped.
  const caboose = cars.at(-1)!
  assert.equal(train.contact(head.x, head.y), 'hurt')
  game.sleepyTimer = 100
  train.update(game.bossWorld)
  assert.equal(train.contact(caboose.x, caboose.y), 'bump')
  assert.equal(train.contact(cars[1]!.x, cars[1]!.y), null)
  train.bump(game.bossWorld, caboose.x, caboose.y)
  assert.equal(train.carsLeft, TRAIN.cars - 1)
  train.update(game.bossWorld)
  assert.equal(train.sleepy, false, 'one bump per cell')
  // Down to five cars: phase 2; down to two: it splits.
  game.sleepyTimer = 0
  train.update(game.bossWorld)
  while (train.phase < 3) {
    game.sleepyTimer = 100
    train.update(game.bossWorld)
    const t0 = train.trains[0]!
    const c = train.carsOf(t0).at(-1) ?? t0
    train.bump(game.bossWorld, c.x, c.y)
    game.sleepyTimer = 0
    train.update(game.bossWorld)
  }
  assert.equal(train.trains.length, 2, 'two trains')
  // The heads meet: both reboot.
  const [a, b] = train.trains as [typeof head, typeof head]
  Object.assign(b, { x: a.x, y: a.y })
  train.update(game.bossWorld)
  assert.equal(train.trains.length, 0)
  for (let t = 0; t < 130; t++) train.update(game.bossWorld)
  assert.ok(train.done)
}

// --- the Overload ---------------------------------------------------------------------------------
{
  const game = create()
  game.card = null
  game.beginBoss(3)
  game.pause = 0
  const core = game.boss as Overload
  assert.ok(core instanceof Overload)
  assert.equal(game.music, OVERLOAD.music)
  // A surge lights its line, then hurts anyone on it.
  Object.assign(game.robot, { x: 1, y: 3 })
  core.surgeTimer = 1
  core.update(game.bossWorld)
  assert.ok(core.surge && !core.surgeLive(), 'lit up first')
  const lives = game.lives
  for (let t = 0; t < OVERLOAD.surge.tell + 2; t++) core.update(game.bossWorld)
  assert.ok(core.surgeLive())
  assert.equal(game.lives, lives - 1, 'caught in the surge')
  // Phase 2 rewires: it throws a switch.
  game.dying = 0
  const n = Math.ceil(game.totalSparks * OVERLOAD.phase2At)
  ;(game as unknown as { eaten: number }).eaten = n
  core.update(game.bossWorld)
  assert.equal(core.phase, 2)
  const state = [...game.switchState]
  core.rewireTimer = 1
  core.update(game.bossWorld)
  assert.notDeepEqual(game.switchState, state, 'a switch thrown')
  // Phase 3: it climbs out, plug cells appear; sleepy, bump a plug out, one per cell.
  ;(game as unknown as { eaten: number }).eaten = Math.ceil(
    game.totalSparks * OVERLOAD.phase3At,
  )
  core.update(game.bossWorld)
  assert.equal(core.phase, 3)
  assert.equal(game.cells.size, OVERLOAD.plugSpots.length)
  assert.equal(core.contact(core.x, core.y), 'hurt')
  for (let plug = OVERLOAD.plugs; plug > 0; plug--) {
    game.sleepyTimer = 0
    core.update(game.bossWorld)
    game.sleepyTimer = 200
    core.dazed = 0
    core.update(game.bossWorld)
    assert.equal(core.contact(core.x, core.y), 'bump')
    core.bump(game.bossWorld)
    assert.equal(core.plugs, plug - 1)
    core.update(game.bossWorld)
    assert.equal(core.contact(core.x, core.y), null, 'one plug per cell')
  }
  for (let t = 0; t < 160; t++) core.update(game.bossWorld)
  assert.ok(core.done, 'unplugged')
}

// --- the endings, the Battery Garden and Overclocked ------------------------------------------------
{
  const steps = campaignSteps()
  const finale = steps.findIndex(
    (s) => s.kind === 'boss' && s.id === 'overload',
  )
  // Without all six golden bolts: credits, then round again Overclocked.
  const game = create()
  game.card = null
  game.stepIndex = finale
  game.startStep()
  game.advance()
  assert.equal(game.story?.scene.id, 'ending')
  assert.ok(game.overclocked, 'Overclocked opens')
  game.advance()
  assert.equal(game.lap, 1)
  assert.equal(game.board.id, 'cozy')
  assert.equal(
    game.heat,
    1 + OVERCLOCKED_HEAT,
    'the late tables from the first maze',
  )
  assert.equal(readBatterySave(game.save)!.overclocked, true)
  // With all six: the secret board, then the true ending.
  const gold = create()
  gold.golden = ['cozy', 'toaster', 'greenhouse', 'cold', 'arcade', 'solar']
  gold.card = null
  gold.stepIndex = finale
  gold.startStep()
  gold.advance()
  gold.advance()
  assert.equal(gold.board.id, 'garden', 'the Battery Garden opens')
  assert.ok(gold.card)
  assert.equal(readBatterySave(gold.save)!.step, gold.stepIndex)
  while (gold.steps[gold.stepIndex]!.kind !== 'ending') gold.advance()
  assert.equal(gold.story?.scene.id, 'true-ending')
}

// --- pilot probes: the pilot can beat the Train and the Overload ------------------------------------
{
  for (const phase of [2, 3]) {
    const game = create()
    game.card = null
    game.beginBoss(phase)
    let t = 0
    for (; t < 60 * 60 * 5 && !game.boss!.done; t++) {
      game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
    }
    assert.ok(game.boss!.done, `phase ${phase}: the pilot beats the boss`)
  }
}

console.log('verifyCabinetBatteryMazeNight: ok')
