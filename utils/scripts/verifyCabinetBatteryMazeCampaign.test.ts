// /utils/scripts/verifyCabinetBatteryMazeCampaign.test.ts
//
// Battery Maze depth pass, slice 2 (conductor kr-arcade/t-040): Power Phase 1 and the Charging
// Bay. The board engine (boards, mazes and special mazes as data) with save and resume; the Cozy
// Charger's Prize Parade; the Toaster Works' conveyors, pop-up toast, sprinter and crumb snacker
// and its Breakfast Rush; golden bolts; power-ups; Gremlin Mama's three phases; the story breaks;
// and the Charging Bay. A pilot probe shows the pilot can play all the way through to the Bay.
//
//   npx tsx utils/scripts/verifyCabinetBatteryMazeCampaign.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import batteryMaze, { readBatterySave } from '../arcade/games/batteryMaze'
import { BAY_ITEMS, BOLT_AWARDS } from '../arcade/batteryMaze/bay'
import {
  BOARDS,
  PHASES,
  RUSH,
  SPECIALS,
  boardById,
  campaignSteps,
  heatFor,
  type Board,
  type Step,
} from '../arcade/batteryMaze/boards'
import { MAMA, type GremlinMama } from '../arcade/batteryMaze/bosses'
import type { Maze, Tile } from '../arcade/batteryMaze/mazes'
import {
  HUNTERS,
  SNACKS_TO_OVERCLOCK,
  SPRINT,
  freshMind,
  type Mind,
} from '../arcade/batteryMaze/roster'
import { SCENES, actorAt, sceneById } from '../arcade/batteryMaze/story'
import {
  POWER_UPS,
  POWER_UP_ROLL,
  TURBO_BOOST,
  REWIRE_FLIPS,
} from '../arcade/batteryMaze/tables'
import { emptyInput, type InputFrame } from '../arcade/types'

type Dir = { x: number; y: number }
type Gremlin = {
  kind: string
  x: number
  y: number
  dir: Dir
  state: string
  sleepy: boolean
  mind: Mind
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  save: unknown
  pause: number
  dying: number
  clearing: number
  stepIndex: number
  menu: unknown
  steps: Step[]
  card: { t: number } | null
  story: { t: number } | null
  bay: { cursor: number; t: number } | null
  offer: unknown
  board: Board
  maze: Maze
  mazeTick: number
  sparks: Set<string>
  cells: Set<string>
  totalSparks: number
  eaten: number
  bolts: number
  flipBonus: number
  flips: number
  startMagnet: boolean
  hint: boolean
  golden: string[]
  toastUp: Set<string>
  blocked: Set<string>
  special: {
    caught: number
    spawned: number
    toast: { at: Tile; t: number } | null
  } | null
  goldenBolt: { at: Tile; shown: boolean } | null
  robot: { x: number; y: number; dir: Dir; want: Dir; eatDrag: number }
  gremlins: Gremlin[]
  prizes: Array<{ x: number; y: number; parade: boolean }>
  powerItem: { kind: string; x: number; y: number } | null
  power: { kind: string; ticks: number } | null
  decoy: Tile | null
  boss: GremlinMama | null
  sleepyTimer: number
  music: unknown
  update(input: InputFrame): void
  demoInput(): InputFrame
  beginMaze(board: Board, index: number): void
  beginBoss(phase: number): void
  openBay(): void
  maxFlips(): number
  robotSpeed(): number
  gremlinSpeed(g: Gremlin): number
  updateToast(): void
  updatePower(): void
  updatePrizes(): void
  updateSpecial(): void
  moveGremlin(g: Gremlin, view: unknown): void
  huntView(): Parameters<(typeof HUNTERS)['chaser']['hunt']>[1]
  collide(): void
  eat(): void
  canMove(x: number, y: number, dir: Dir): boolean
}

const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }
const UP = { x: 0, y: -1 }

function create(resume?: unknown, demo = false): Game {
  const game = batteryMaze.create({
    rng: mulberry32(5),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
    resume,
  }) as unknown as Game
  // Straight into the campaign, as picking it from the mode menu does.
  game.menu = null
  return game
}

const press = (button: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[button] = true
  f.pressed[button] = true
  return f
}

/** Tick until `done` (or a cap), pressing nothing. */
function until(game: Game, done: () => boolean, cap = 6000) {
  for (let t = 0; t < cap && !done(); t++) game.update(emptyInput())
  assert.ok(done(), 'reached in time')
}

/** Jump a game to one of a board's mazes, ready to play. */
function goTo(game: Game, board: string, index: number) {
  game.card = null
  game.beginMaze(boardById(board), index)
  game.pause = 0
}

/** Empty the maze so it clears on the next tick. */
function charge(game: Game) {
  game.sparks.clear()
  game.cells.clear()
}

// --- the campaign as data ---------------------------------------------------------------------
{
  const steps = campaignSteps()
  assert.deepEqual(
    steps.slice(0, 12).map((s) => s.kind),
    [
      'card',
      'maze',
      'maze',
      'maze',
      'story',
      'card',
      'maze',
      'maze',
      'maze',
      'story',
      'boss',
      'bay',
    ],
    'Power Phase 1: two boards, Gremlin Mama, then the Bay',
  )
  assert.equal(PHASES[0]!.name, 'MORNING BOOT')
  const layouts = new Set<string>()
  BOARDS.forEach((board, b) => {
    assert.equal(board.number, b + 1)
    assert.equal(board.mazes.length, 3)
    assert.ok(sceneById(board.story).id === board.story, 'its story exists')
    board.mazes.forEach((m, i) => {
      layouts.add(m.layout.id)
      assert.equal(heatFor(board, i, 0), b * 3 + i + 1)
      assert.ok(heatFor(board, i, 1) > heatFor(board, i, 0), 'a lap is hotter')
      for (const kind of m.roster) assert.ok(HUNTERS[kind], kind)
    })
    if (board.secret) return
    const special = board.mazes[1]!
    assert.ok(special.special, `${board.id}: maze 2 is its special maze`)
    const bolt = special.goldenBolt!
    const cell = special.layout.rows[bolt.y]![bolt.x]
    assert.ok(
      cell && cell !== '#',
      `${board.id}: the golden bolt sits on floor`,
    )
    assert.ok(SPECIALS[special.special!].target > 0)
  })
  assert.ok(layouts.size >= 18, 'every board brings new layouts')
  assert.deepEqual(
    boardById('toaster').mazes[0].roster.includes('sprinter'),
    true,
  )
  assert.ok(boardById('toaster').mazes[1].roster.includes('snacker'))
  assert.equal(SCENES.length, 2, 'the first two story breaks')
}

// --- the flow: card, mazes, bolts, story, save -------------------------------------------------
{
  const game = create()
  assert.equal(game.level, 1)
  assert.ok(game.card, 'the Cozy Charger title card opens the run')
  assert.equal(game.maze.id, 'classic', 'over its first maze')
  assert.equal(game.music, boardById('cozy').music)
  assert.equal((game.save as { step: number }).step, 0, 'saved at the board')
  game.update(press('a'))
  assert.ok(game.card, 'the card holds a moment before A skips it')
  for (let t = 0; t < 45; t++) game.update(emptyInput())
  game.update(press('a'))
  assert.equal(game.card, null)
  assert.equal(game.steps[game.stepIndex]!.kind, 'maze')
  game.pause = 0
  charge(game)
  game.update(emptyInput())
  assert.ok(game.clearing > 0)
  assert.equal(game.bolts, BOLT_AWARDS.maze + BOLT_AWARDS.clean)
  until(game, () => game.clearing === 0)
  assert.equal(game.level, 2)
  assert.equal(game.maze.id, 'outlet-loops')
  assert.equal(game.special?.caught, 0, 'the Prize Parade')
  // Lose a robot here: no clean-charge bolts.
  game.pause = 0
  game.lives = 3
  const hunter = game.gremlins[0]!
  Object.assign(hunter, { x: game.robot.x, y: game.robot.y, state: 'roaming' })
  game.collide()
  until(game, () => game.dying === 0)
  const before = game.bolts
  game.pause = 0
  charge(game)
  game.update(emptyInput())
  assert.equal(game.bolts - before, BOLT_AWARDS.maze, 'no clean charge')
  until(game, () => game.clearing === 0)
  charge(game)
  game.pause = 0
  game.update(emptyInput())
  until(game, () => !!game.story)
  assert.equal(game.music !== null, true)
  for (let t = 0; t < 61; t++) game.update(emptyInput())
  game.update(press('a'))
  assert.ok(game.card, 'the next board’s card')
  assert.equal(game.board.id, 'toaster')
  assert.equal(game.level, 4)
  const saved = readBatterySave(game.save)!
  assert.equal(saved.step, 5)
  assert.equal(saved.bolts, game.bolts)
}

// --- save and resume --------------------------------------------------------------------------
{
  assert.equal(readBatterySave(null), null)
  assert.equal(readBatterySave({ v: 2 }), null)
  const good = {
    v: 1,
    step: 5,
    lap: 0,
    level: 4,
    score: 12345,
    lives: 2,
    bolts: 9,
    flipBonus: 1,
    startMagnet: false,
    hint: true,
    golden: ['cozy', 'bogus'],
    continued: false,
  }
  assert.equal(readBatterySave({ ...good, step: 2 }), null, 'not a board start')
  assert.equal(readBatterySave({ ...good, score: -5 }), null)
  assert.deepEqual(
    readBatterySave(good)!.golden,
    ['cozy'],
    'unknown bolts drop',
  )
  // A continue picks the run up at its board.
  const game = create(good)
  assert.ok(game.offer, 'offers to continue')
  assert.equal(game.music, null)
  game.update(press('a'))
  assert.equal(game.offer, null)
  assert.equal(game.board.id, 'toaster')
  assert.equal(game.score, 12345)
  assert.equal(game.bolts, 9)
  assert.equal(game.flipBonus, 1)
  assert.equal(game.maxFlips(), REWIRE_FLIPS + 1)
  assert.deepEqual(game.golden, ['cozy'])
  // A new run starts over but keeps the golden bolts found.
  const fresh = create(good)
  fresh.update(press('b'))
  assert.equal(fresh.board.id, 'cozy')
  assert.equal(fresh.score, 0)
  assert.deepEqual(fresh.golden, ['cozy'])
  // After a game over the save is a continue: the board stays, the score does not.
  const ended = create(good)
  ended.update(press('a'))
  goTo(ended, 'toaster', 0)
  ended.lives = 1
  const g = ended.gremlins[0]!
  Object.assign(g, { x: ended.robot.x, y: ended.robot.y, state: 'roaming' })
  ended.collide()
  until(ended, () => ended.over)
  const after = readBatterySave(ended.save)!
  assert.equal(after.continued, true)
  const again = create(after)
  again.update(press('a'))
  assert.equal(again.score, 0)
  assert.equal(again.board.id, 'toaster')
  // The attract demo never saves.
  assert.equal(create(undefined, true).save, null)
}

// --- the Toaster Works: conveyors and pop-up toast ----------------------------------------------
{
  const game = create()
  goTo(game, 'toaster', 0)
  assert.equal(game.maze.id, 'crumb-tray')
  // Row 3 carries things right from x 7 to 10.
  Object.assign(game.robot, { x: 8, y: 3, dir: RIGHT, eatDrag: 0 })
  const withBelt = game.robotSpeed()
  game.robot.dir = LEFT
  const against = game.robotSpeed()
  Object.assign(game.robot, { x: 1, y: 3, dir: RIGHT })
  const plain = game.robotSpeed()
  assert.ok(withBelt > plain * 1.4 && against < plain * 0.7, 'conveyors carry')
  // The toast keeps the board's beat: a glow first, then it pops and blocks the slot.
  const beat = boardById('toaster').toastBeat!
  const slot = game.maze.toast.find((t) => t.group === 0)!
  const key = `${slot.x},${slot.y}`
  Object.assign(game.robot, { x: 1, y: 1 })
  game.mazeTick = beat.period - beat.up - 1
  game.updateToast()
  assert.ok(!game.blocked.has(key))
  game.mazeTick = beat.period - beat.up
  game.updateToast()
  assert.ok(game.blocked.has(key), 'toast up')
  assert.ok(!game.canMove(slot.x - 1, slot.y, RIGHT), 'and in the way')
  game.mazeTick = 0
  game.updateToast()
  assert.ok(!game.blocked.has(key), 'and down again')
  // It never pops onto anyone.
  Object.assign(game.robot, { x: slot.x, y: slot.y })
  game.mazeTick = beat.period - beat.up
  game.updateToast()
  assert.ok(!game.blocked.has(key), 'it waits for the slot to clear')
  Object.assign(game.robot, { x: 1, y: 1 })
  game.updateToast()
  assert.ok(game.blocked.has(key))
}

// --- the sprinter and the crumb snacker ---------------------------------------------------------------
{
  const game = create()
  goTo(game, 'toaster', 2)
  const dash = { x: 1, y: 3, mind: freshMind() }
  Object.assign(game.robot, { x: 6, y: 3 })
  const sees = game.huntView()
  assert.ok(sees.sees({ x: 1, y: 3 }), 'down a straight corridor')
  assert.ok(!sees.sees({ x: 1, y: 5 }), 'not round a corner')
  HUNTERS.sprinter.sense!(dash, sees)
  assert.equal(dash.mind.aim, SPRINT.aim, 'ears flat')
  assert.equal(HUNTERS.sprinter.pace!(dash), 0, 'it stops dead to wind up')
  for (let i = 0; i < SPRINT.aim; i++) HUNTERS.sprinter.sense!(dash, sees)
  assert.equal(HUNTERS.sprinter.pace!(dash), SPRINT.pace, 'then dashes')
  for (let i = 0; i < SPRINT.dash; i++) HUNTERS.sprinter.sense!(dash, sees)
  assert.equal(HUNTERS.sprinter.pace!(dash), 1)
  assert.ok(dash.mind.cool > 0, 'and catches its breath')
  // Out of sight, it works its way into line with the robot.
  const lining = HUNTERS.sprinter.hunt({ x: 3, y: 9, mind: freshMind() }, sees)
  assert.ok(lining.x === game.robot.x || lining.y === game.robot.y, 'into line')
  // The snacker eats sparks as it goes; fifteen and it turns red and comes for you.
  const munch = game.gremlins.find((g) => g.kind === 'snacker')!
  Object.assign(munch, { x: 1, y: 7, dir: UP, state: 'roaming', sleepy: false })
  const sparks = game.sparks.size
  game.sparks.add('1,6')
  for (let i = 0; i < 20; i++) game.moveGremlin(munch, game.huntView())
  assert.ok(munch.mind.snacks >= 1, 'it eats')
  assert.ok(game.sparks.size <= sparks)
  munch.mind.snacks = SNACKS_TO_OVERCLOCK
  const calm = { ...munch, mind: freshMind() }
  assert.ok(game.gremlinSpeed(munch) > game.gremlinSpeed(calm), 'faster red')
  assert.deepEqual(
    HUNTERS.snacker.hunt(munch, game.huntView()),
    { x: game.robot.x, y: game.robot.y },
    'and hunting you',
  )
  // Bumped while sleepy, it reboots its appetite.
  munch.sleepy = true
  Object.assign(munch, { x: game.robot.x, y: game.robot.y })
  game.collide()
  assert.equal(munch.mind.snacks, 0)
}

// --- special mazes and golden bolts ------------------------------------------------------------------
{
  const game = create()
  goTo(game, 'cozy', 1)
  Object.assign(game.robot, { x: 11, y: 11 })
  for (let t = 0; t < 60 * 70 && game.special!.spawned < 8; t++) {
    game.mazeTick++
    game.updateSpecial()
    game.prizes = []
  }
  assert.equal(game.special!.spawned, 8, 'the parade brings all eight')
  game.special!.caught = 8
  game.updateSpecial()
  assert.ok(game.goldenBolt?.shown, 'a clean parade shows the golden bolt')
  const bolt = game.goldenBolt!.at
  const score = game.score
  Object.assign(game.robot, bolt)
  game.updateSpecial()
  assert.deepEqual(game.golden, ['cozy'])
  assert.ok(game.score - score >= 5000)
  // Found once, it stays found.
  goTo(game, 'cozy', 1)
  assert.equal(game.goldenBolt, null)
  // A robot lost on the way: the parade still pays, but no golden bolt.
  const lossy = create()
  goTo(lossy, 'cozy', 1)
  ;(lossy as unknown as { mazeLost: boolean }).mazeLost = true
  lossy.special!.caught = 8
  lossy.updateSpecial()
  assert.equal(lossy.goldenBolt?.shown, false)

  // Breakfast Rush: golden toast pops as the maze empties; grab it from its slot.
  const rush = create()
  goTo(rush, 'toaster', 1)
  rush.eaten = Math.ceil(rush.totalSparks * RUSH.at[0]!)
  rush.updateSpecial()
  const toast = rush.special!.toast!
  assert.ok(toast, 'golden toast!')
  assert.ok(!rush.blocked.has(`${toast.at.x},${toast.at.y}`), 'it never blocks')
  const before = rush.score
  Object.assign(rush.robot, toast.at)
  rush.updateSpecial()
  assert.equal(rush.score - before, RUSH.points[0])
  assert.equal(rush.special!.caught, 1)
}

// --- power-ups ------------------------------------------------------------------------------------------
{
  const game = create()
  goTo(game, 'cozy', 0)
  Object.assign(game.robot, { x: 1, y: 1 })
  game.mazeTick = POWER_UP_ROLL.first
  game.updatePower()
  const item = game.powerItem!
  assert.ok(item, 'a power-up rolls out of the dock')
  // Turbo.
  Object.assign(game.robot, { x: 1, y: 3, dir: RIGHT, eatDrag: 0 })
  const plain = game.robotSpeed()
  game.power = { kind: 'turbo', ticks: 100 }
  assert.ok(Math.abs(game.robotSpeed() - plain * TURBO_BOOST) < 1e-9)
  // Magnet: nearby sparks fly in.
  game.power = { kind: 'magnet', ticks: POWER_UPS.magnet.ticks }
  const sparks = game.sparks.size
  for (let i = 0; i < 12; i++) game.updatePower()
  assert.ok(game.sparks.size < sparks, 'the magnet pulls sparks')
  // Decoy: the gremlins go after the cardboard robot.
  game.power = { kind: 'decoy', ticks: 100 }
  game.decoy = { x: 21, y: 19 }
  const chaser = game.gremlins[0]!
  Object.assign(chaser, { x: 11, y: 7, state: 'roaming', sleepy: false })
  const target = (
    game as unknown as { target(g: Gremlin, v: unknown): Tile }
  ).target(chaser, game.huntView())
  assert.deepEqual(target, { x: 21, y: 19 })
  // Freeze Pop: nobody moves, and touching a frozen gremlin is harmless.
  game.decoy = null
  game.power = { kind: 'freeze', ticks: 100 }
  Object.assign(chaser, { x: game.robot.x, y: game.robot.y })
  const lives = game.lives
  game.collide()
  assert.equal(game.lives, lives)
  assert.equal(game.dying, 0)
}

// --- the Charging Bay -------------------------------------------------------------------------------
{
  const game = create()
  game.openBay()
  assert.equal(
    game.bay!.cursor,
    BAY_ITEMS.length,
    'no bolts: the cursor waits on LEAVE',
  )
  game.bay = null
  game.bolts = 38
  game.openBay()
  assert.equal(game.bay!.cursor, 0)
  for (let t = 0; t < 25; t++) game.update(emptyInput())
  const lives = game.lives
  game.update(press('a'))
  assert.equal(game.lives, lives + 1, 'a spare robot')
  assert.equal(game.bolts, 26)
  game.update(press('down'))
  game.update(press('a'))
  assert.equal(game.flipBonus, 1)
  game.update(press('a'))
  assert.equal(game.flipBonus, 2, 'two at most')
  assert.notEqual(game.bay!.cursor, 1, 'the cursor moves off a maxed item')
  game.bay!.cursor = 2
  game.update(press('a'))
  assert.equal(game.startMagnet, true)
  const bolts = game.bolts
  game.bay!.cursor = 3
  game.update(press('a'))
  assert.equal(game.bolts, bolts, 'cannot afford the hint')
  game.update(press('b'))
  assert.equal(game.bay, null, 'B leaves the Bay')
  // The Starting Magnet waits for the next board's first maze (here, the very next step).
  assert.equal(game.steps[game.stepIndex]!.kind, 'maze')
  assert.equal(game.power?.kind, 'magnet')
  assert.equal(game.startMagnet, false)
}

// --- Gremlin Mama ----------------------------------------------------------------------------------------
{
  const game = create()
  game.card = null
  game.beginBoss(1)
  game.pause = 0
  const mama = game.boss!
  assert.equal(game.maze.id, 'mamas-den')
  assert.equal(game.gremlins.length, 0, 'only Mama and her babies here')
  assert.equal(game.music, MAMA.music)
  const world = (
    game as unknown as { bossWorld: Parameters<GremlinMama['update']>[0] }
  ).bossWorld
  const fits = (
    mama as unknown as { fits(w: unknown, x: number, y: number): boolean }
  ).fits.bind(mama)
  assert.ok(fits(world, 1, 1), 'the wide halls fit her')
  assert.ok(!fits(world, 4, 4), 'the narrow corridors do not')
  // Phase 1: she drops babies.
  Object.assign(game.robot, { x: 4, y: 11 })
  for (let t = 0; t < MAMA.dropEvery + 2; t++) {
    game.robot.x = 4
    game.robot.y = 11
    mama.update(world)
  }
  assert.ok(
    game.gremlins.some((g) => g.kind === 'baby'),
    'a baby',
  )
  // Eat enough and she's cranky: phase 2, and three cells appear.
  game.eaten = Math.ceil(game.totalSparks * MAMA.crankyAt)
  mama.update(world)
  assert.equal(mama.phase, 2)
  assert.equal(game.cells.size, MAMA.cellSpots.length)
  // A cell makes her sleepy; each bump sends her round backwards, dazed.
  for (let hit = 1; hit <= MAMA.hits; hit++) {
    const spot = [...game.cells][0]!.split(',').map(Number) as [number, number]
    Object.assign(game.robot, { x: spot[0], y: spot[1] })
    game.eat()
    mama.update(world)
    assert.equal(mama.state, 'sleepy', 'sleepy')
    Object.assign(game.robot, { x: mama.x + 0.5, y: mama.y + 0.5 })
    game.collide()
    assert.equal(mama.hits, hit)
    if (hit < MAMA.hits) {
      assert.equal(mama.state, 'dazed')
      mama.timer = 1
      game.sleepyTimer = 0
      mama.update(world)
      if (!game.cells.size) for (const s of MAMA.cellSpots) world.spawnCell(s)
    }
  }
  assert.equal(mama.phase, 3, 'three bumps: she plugs the dock')
  assert.equal(mama.state, 'plug')
  assert.ok(!game.gremlins.some((g) => g.kind === 'baby'), 'the babies go home')
  // In the bay with its gates shut, she's trapped; bump her home.
  game.robot.x = 18
  game.robot.y = 13
  Object.assign(mama, { x: 15, y: 13, state: 'chase', timer: 600 })
  mama.update(world)
  assert.equal(mama.state, 'chase', 'gates open: not trapped')
  const sw = game.maze.switches[0]!
  Object.assign(game.robot, { x: sw.x, y: sw.y })
  ;(game as unknown as { tryFlip(): void }).tryFlip()
  mama.update(world)
  assert.equal(mama.state, 'trapped')
  assert.ok(!mama.harmful && mama.bumpable)
  Object.assign(game.robot, { x: 16, y: 14 })
  const score = game.score
  game.collide()
  assert.equal(mama.state, 'home')
  assert.ok(game.score - score >= MAMA.points.home)
  for (let t = 0; t < 160; t++) mama.update(world)
  assert.ok(mama.done)
  game.pause = 0
  game.update(emptyInput())
  assert.ok(game.clearing > 0, 'the den is cleared')
  assert.ok(game.bolts >= BOLT_AWARDS.boss)
  // Caught by her, the robot loses a life.
  const other = create()
  other.card = null
  other.beginBoss(1)
  other.pause = 0
  const m2 = other.boss!
  Object.assign(other.robot, { x: m2.x + 0.5, y: m2.y + 0.5 })
  const lives = other.lives
  other.collide()
  assert.equal(other.lives, lives - 1)
}

// --- story breaks ------------------------------------------------------------------------------------
{
  for (const scene of SCENES) {
    for (const actor of scene.actors) {
      const keys = actor.keys
      for (let i = 1; i < keys.length; i++)
        assert.ok(keys[i]![0] >= keys[i - 1]![0], `${scene.id}: keys in order`)
    }
  }
  const coffee = sceneById('coffee-break')
  const robot = coffee.actors[0]!
  const mid = actorAt(robot, 75)
  assert.ok(mid.x < 342 && mid.x > -20, 'between its keys')
  assert.equal(
    actorAt(robot, 200).scale,
    3,
    'charged up to three times its size',
  )
}

// --- pilot probe: the attract pilot can play Power Phase 1 through to the Bay -----------------------------
{
  const game = create()
  let reachedBay = false
  for (let t = 0; t < 60 * 60 * 20 && !reachedBay; t++) {
    game.lives = Math.max(game.lives, 2)
    game.update(game.demoInput())
    reachedBay = !!game.bay
  }
  assert.ok(reachedBay, 'Mama beaten, the Bay opens')
  // With its own three robots, the run still ends.
  const real = create()
  for (let t = 0; t < 60 * 60 * 20 && !real.over; t++)
    real.update(real.demoInput())
  assert.ok(real.over, 'a real run ends')
}

console.log('verifyCabinetBatteryMazeCampaign: ok')
