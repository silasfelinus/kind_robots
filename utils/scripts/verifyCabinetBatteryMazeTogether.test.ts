// /utils/scripts/verifyCabinetBatteryMazeTogether.test.ts
//
// Battery Maze depth pass, slice 4 (conductor kr-arcade/t-042): together and versus. The mode
// menu; two-robot co-op with the shared lives, the revive and the Pair Bonus; Gremlin Tag for
// 2-4 players through the `players` frames; Rush Hour's banking, waves and best; Classic Maze's
// rising levels and coffee breaks; and the medals, kept in the save.
//
//   npx tsx utils/scripts/verifyCabinetBatteryMazeTogether.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import batteryMaze, { readBatterySave } from '../arcade/games/batteryMaze'
import {
  BOARDS,
  boardById,
  campaignSteps,
  type Board,
} from '../arcade/batteryMaze/boards'
import type { Maze } from '../arcade/batteryMaze/mazes'
import {
  COOP_LIVES,
  MEDALS,
  RUSH_HOUR,
  TAG,
  menuModes,
  type ModeId,
} from '../arcade/batteryMaze/modes'
import { PRIZE_AT } from '../arcade/batteryMaze/tables'
import { emptyInput, type InputFrame } from '../arcade/types'
import { ARCADE_GAMES } from '../arcade/games'
import { MAX_SAVE_BYTES, sanitizeSaves, withSave } from '../arcade/saves'

type Dir = { x: number; y: number }
type Robot = {
  seat: number
  x: number
  y: number
  dir: Dir
  want: Dir
  shield: number
  down: number
  train: unknown[]
}
type Gremlin = {
  kind: string
  x: number
  y: number
  dir: Dir
  state: string
  sleepy: boolean
  seat?: number
  want?: Dir
}
type Rush = {
  t: number
  unbanked: number
  mult: number
  bar: { x: number; y: number; ticks: number } | null
  wave: number
  nextWave: number
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
  card: unknown
  offer: unknown
  story: { scene: { id: string } } | null
  menu: { cursor: number; t: number; medals: boolean } | null
  result: { text: string; lines: string[]; t: number } | null
  mode: ModeId
  rush: Rush | null
  medals: Record<string, number>
  board: Board
  maze: Maze
  heat: number
  sparks: Set<string>
  cells: Set<string>
  robots: Robot[]
  robot: Robot
  gremlins: Gremlin[]
  mazeLost: boolean
  mazeFullTrain: boolean
  prizesCaught: number
  stepIndex: number
  golden: string[]
  goldenBolt: { at: { x: number; y: number }; shown: boolean } | null
  rushBest: number
  overclocked: boolean
  music: unknown
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: unknown): void
  beginMaze(board: Board, index: number): void
  startMode(id: ModeId): void
  clearMaze(): void
  collide(): void
  lose(): void
  eat(): void
  updateDown(): void
  updateRushHour(): void
  updateSpecial(): void
  advance(): void
  steps: unknown[]
  startStep(): void
  moveGremlin(g: Gremlin, view: unknown): void
  chooseTurn(g: Gremlin, view: unknown): void
  huntView(): unknown
}

const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }
const UP = { x: 0, y: -1 }

function create(players = 1, resume?: unknown, demo = false): Game {
  return batteryMaze.create({
    rng: mulberry32(11),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
    players,
    resume,
  }) as unknown as Game
}

const idle = () => emptyInput()
const press = (button: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[button] = true
  f.pressed[button] = true
  return f
}
const hold = (button: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[button] = true
  return f
}

/** Let the menu settle, then pick the mode at the cursor. */
function pick(game: Game, id: ModeId, seats = 1, overclocked = false) {
  const list = menuModes(seats, overclocked)
  for (let i = 0; i < 20; i++) game.update(idle())
  const at = list.indexOf(id)
  assert.ok(at >= 0, `${id} is on the menu`)
  for (let i = 0; i < at; i++) game.update(press('down'))
  game.update(press('a'))
  assert.equal(game.menu, null)
  assert.equal(game.mode, id)
}

/** Run the game past a title card and its starting pause. */
function lift(game: Game) {
  game.card = null
  game.pause = 0
}

function ticks(game: Game, n: number, players?: InputFrame[]) {
  for (let i = 0; i < n && !game.over; i++) game.update(idle(), players)
}

// --- the menu ------------------------------------------------------------------------------------
{
  assert.deepEqual(menuModes(1, false), ['campaign', 'rush', 'classic'])
  assert.deepEqual(menuModes(1, true), [
    'campaign',
    'overclocked',
    'rush',
    'classic',
  ])
  assert.deepEqual(menuModes(2, false), ['campaign', 'rush', 'classic', 'tag'])
  assert.deepEqual(
    menuModes(3, true),
    ['tag'],
    'three or four seated: Tag only',
  )
  assert.deepEqual(menuModes(4, false), ['tag'])

  const game = create()
  assert.ok(game.menu, 'a real game opens on the mode menu')
  assert.equal(game.level, 1)
  assert.equal(game.music !== null, true, 'the menu has a tune')
  ticks(game, 20)
  game.update(press('down'))
  assert.equal(game.menu!.cursor, 1)
  game.update(press('up'))
  game.update(press('up'))
  assert.equal(game.menu!.cursor, 2, 'the cursor wraps')
  game.update(press('b'))
  assert.equal(game.menu!.medals, true, 'B opens the medal board')
  game.update(press('b'))
  assert.equal(game.menu!.medals, false, 'and B closes it')
  game.update(press('down'))
  game.update(press('a'))
  assert.equal(game.menu, null)
  assert.equal(game.mode, 'campaign')
  assert.ok(game.card, 'the campaign starts on its first title card')

  const demo = create(1, undefined, true)
  assert.equal(demo.menu, null, 'the attract demo skips the menu')
  assert.equal(demo.mode, 'campaign')
}

// --- the continue offer comes first; B goes to the menu, and the run stays saved ----------------------
{
  const steps = campaignSteps()
  const step = steps.findIndex(
    (s) => s.kind === 'card' && s.board === 'toaster',
  )
  const stored = {
    v: 1,
    step,
    lap: 0,
    level: 4,
    score: 1234,
    lives: 2,
    bolts: 7,
    flipBonus: 0,
    startMagnet: false,
    hint: false,
    golden: [],
    continued: false,
    rushBest: 900,
  }
  const game = create(1, stored)
  assert.ok(game.offer)
  assert.equal(game.menu, null)
  game.update(press('b'))
  assert.equal(game.offer, null)
  assert.ok(game.menu, 'B on the offer opens the menu')
  pick(game, 'rush')
  assert.equal(
    readBatterySave(game.save)!.step,
    step,
    'Rush Hour leaves the saved run alone',
  )
  assert.equal(readBatterySave(game.save)!.rushBest, 900)

  // A on the offer picks the run back up, in the campaign.
  const again = create(1, stored)
  again.update(press('a'))
  assert.equal(again.mode, 'campaign')
  assert.equal(again.score, 1234)
}

// --- Overclocked is on the menu once the campaign is cleared ------------------------------------------
{
  const cleared = {
    v: 1,
    step: 0,
    lap: 0,
    level: 1,
    score: 0,
    lives: 3,
    bolts: 0,
    flipBonus: 0,
    startMagnet: false,
    hint: false,
    golden: [],
    continued: false,
    overclocked: true,
  }
  const game = create(1, cleared)
  assert.equal(game.offer, null, 'a save at the very start offers no continue')
  assert.ok(game.menu)
  pick(game, 'overclocked', 1, true)
  assert.equal(game.lap, 1, 'Overclocked runs the grid hot from the first maze')
}

// --- co-op: two robots, one pool of lives, the revive and the Pair Bonus ------------------------------
{
  const game = create(2)
  pick(game, 'campaign', 2)
  assert.equal(game.lives, COOP_LIVES, 'two robots share a bigger pool')
  assert.equal(game.robots.length, 2)
  assert.deepEqual(
    game.robots.map((r) => r.seat),
    [0, 1],
  )
  lift(game)
  // Robot 2 follows the second seat's stick.
  game.update(idle(), [idle(), hold('up')])
  assert.deepEqual(game.robots[1]!.want, UP)
  assert.deepEqual(game.robots[0]!.want, LEFT, 'and robot 1 its own')

  // Caught: a spark bot, waiting for its partner. No life lost yet.
  const [a, b] = game.robots as [Robot, Robot]
  const g = game.gremlins[0]!
  Object.assign(g, { x: a.x, y: a.y, state: 'roaming', sleepy: false })
  a.shield = 0
  const lives = game.lives
  game.collide()
  assert.ok(a.down > 0, 'a caught robot goes down')
  assert.equal(game.lives, lives, 'its partner plays on: no life lost yet')
  assert.equal(game.dying, 0)
  // The partner touches it: revived, with a moment's shield.
  g.state = 'docked'
  b.x = a.x
  b.y = a.y
  game.updateDown()
  assert.equal(a.down, 0, 'revived by touch')
  assert.ok(a.shield > 0)

  // Left too long, a downed robot costs a life and rolls back in from the start.
  a.down = 1
  b.x = a.x + 5
  game.updateDown()
  assert.equal(a.down, 0)
  assert.equal(game.lives, lives - 1)
  assert.equal(a.x, game.maze.start.x)

  // A sleepy gremlin bumped with both robots on it pays the Pair Bonus.
  a.x = game.maze.start.x
  a.y = game.maze.start.y
  b.x = a.x + 1
  b.y = a.y
  Object.assign(g, { x: a.x, y: a.y, state: 'roaming', sleepy: true })
  const before = game.score
  game.collide()
  assert.equal(game.score - before, 200 + 1000, 'the bump, plus the Pair Bonus')
  assert.equal(g.state, 'friend')

  // Both caught: that costs a life the usual way.
  b.down = 100
  const h = game.gremlins.find((x) => x.state !== 'friend')!
  Object.assign(h, { x: a.x, y: a.y, state: 'roaming', sleepy: false })
  a.shield = 0
  const left = game.lives
  game.collide()
  assert.equal(game.lives, left - 1)
  assert.ok(game.dying > 0)
  ticks(game, 120)
  assert.ok(
    game.robots.every((r) => r.down === 0),
    'both roll back in together',
  )
}

// --- Rush Hour: sparks wait to be banked, at a rising multiplier --------------------------------------
{
  const game = create()
  pick(game, 'rush')
  const rush = game.rush!
  assert.ok(rush)
  assert.equal(game.maze.id, RUSH_HOUR.layout)
  game.pause = 0
  const spark = [...game.sparks][0]!.split(',').map(Number) as [number, number]
  game.robot.x = spark[0]
  game.robot.y = spark[1]
  game.eat()
  assert.equal(rush.unbanked, 1, 'an eaten spark waits to be banked')
  assert.equal(game.score, 0)
  rush.bar = { x: game.robot.x, y: game.robot.y, ticks: 100 }
  game.updateRushHour()
  assert.equal(game.score, RUSH_HOUR.sparkPoints, 'the battery bar banks it')
  assert.equal(rush.mult, 2, 'and the multiplier rises')
  assert.equal(rush.bar, null)

  // Caught: the unbanked sparks spill, but no robot is lost.
  rush.unbanked = 9
  game.lose()
  assert.equal(rush.unbanked, 0)
  assert.equal(game.lives, 1)
  ticks(game, 120)
  assert.equal(game.over, false)

  // Every wave, the sparks flow back and the grid runs hotter.
  const heat = game.heat
  game.sparks.clear()
  rush.t = rush.nextWave - 1
  game.updateRushHour()
  assert.equal(rush.wave, 2)
  assert.equal(game.heat, heat + RUSH_HOUR.heatPerWave)
  assert.ok(game.sparks.size >= game.maze.sparks.length - 1)

  // Time up: the result card, then over, with the best kept.
  rush.t = RUSH_HOUR.ticks - 1
  game.updateRushHour()
  assert.equal(game.result!.text, 'TIME UP!')
  ticks(game, TAG.resultTicks + 2)
  assert.ok(game.over)
  assert.equal(readBatterySave(game.save)!.rushBest, game.score)
}

// --- Classic Maze: today's maze, hotter each level, with a coffee break every three -------------------
{
  const game = create()
  pick(game, 'classic')
  assert.equal(game.maze.id, 'classic')
  assert.equal(game.level, 1)
  assert.equal(game.heat, 1)
  const clear = () => {
    game.clearMaze()
    ticks(game, 130)
  }
  clear()
  assert.equal(game.level, 2)
  assert.equal(game.heat, 2)
  clear()
  assert.equal(game.level, 3)
  clear()
  assert.equal(
    game.story?.scene.id,
    'coffee-break',
    'a coffee break after the third',
  )
  for (let i = 0; i < 2000 && game.story; i++) game.update(idle())
  assert.equal(game.level, 4)
  assert.equal(game.heat, 4)
  assert.equal(game.maze.id, 'classic')
}

// --- Gremlin Tag: the other seats steer gremlins ---------------------------------------------------
{
  const game = create(3)
  pick(game, 'tag', 3)
  assert.equal(game.robots.length, 1, 'in Tag there is one robot')
  assert.equal(game.lives, TAG.lives)
  const seated = game.gremlins.filter((g) => g.seat)
  assert.deepEqual(
    seated.map((g) => g.seat),
    [1, 2],
  )
  assert.equal(game.gremlins.length, 4, 'the AI makes up the four')
  assert.ok(
    seated.every((g) => g.state !== 'docked'),
    'player gremlins leave at once',
  )
  game.pause = 0
  const frames = [idle(), hold('up'), hold('right')]
  game.update(frames[0]!, frames)
  assert.deepEqual(seated[0]!.want, UP)
  assert.deepEqual(seated[1]!.want, RIGHT)

  // A player's gremlin turns straight round when its player pulls back.
  const g = seated[0]!
  Object.assign(g, { x: g.x + 0.5, state: 'roaming', dir: LEFT, want: RIGHT })
  game.moveGremlin(g, game.huntView())
  assert.deepEqual(g.dir, RIGHT)

  // The robot clears the maze: it wins.
  game.sparks.clear()
  game.cells.clear()
  game.update(idle(), frames)
  assert.equal(game.result?.text, 'ROBOT WINS!')
  ticks(game, TAG.resultTicks + 2)
  assert.ok(game.over)

  // Tagged three times: the gremlins win.
  const other = create(2)
  pick(other, 'tag', 2)
  other.pause = 0
  for (let i = 0; i < TAG.lives; i++) {
    other.lose()
    ticks(other, 115)
  }
  assert.equal(other.result?.text, 'GREMLINS WIN!')
}

// --- medals: per campaign maze, kept in the save -------------------------------------------------
{
  const game = create()
  pick(game, 'campaign')
  game.card = null
  game.beginMaze(boardById('cozy'), 0)
  game.mazeLost = false
  game.mazeFullTrain = true
  game.prizesCaught = PRIZE_AT.length
  game.clearMaze()
  const all = MEDALS.reduce((n, m) => n | m.bit, 0)
  assert.equal(
    game.medals['cozy:0'],
    all,
    'a clean, full-train, every-prize clear',
  )
  assert.equal(readBatterySave(game.save)!.medals!['cozy:0'], all)
  // A worse clear never takes a medal away.
  game.beginMaze(boardById('cozy'), 0)
  game.mazeLost = true
  game.clearMaze()
  assert.equal(game.medals['cozy:0'], all)
  // A lost maze wins no Clean Charge.
  game.beginMaze(boardById('cozy'), 1)
  game.mazeLost = true
  game.mazeFullTrain = false
  game.prizesCaught = 0
  game.clearMaze()
  assert.equal(game.medals['cozy:1'] ?? 0, 0)

  // The save keeps only medals for real mazes, and only real medal bits.
  const read = readBatterySave({
    ...(game.save as object),
    medals: { 'nope:0': 7, 'cozy:2': 9, 'cozy:1': 'x' },
  })!
  assert.deepEqual(read.medals, { 'cozy:2': 1 })
  // Classic Maze and Rush Hour award no medals and no bolts.
  const classic = create()
  pick(classic, 'classic')
  classic.clearMaze()
  assert.deepEqual(classic.medals, {})
}

// --- saves: earned progress survives a quit at any moment ------------------------------------------
// The host keeps `save` whenever it changes (and again when the player leaves), through the
// arcade store: withSave, JSON in local storage, sanitizeSaves, then `resume` next time.
{
  const reopen = (game: Game, players = 1): Game => {
    const record = withSave(
      { 'another-game': { v: 9 } },
      'battery-maze',
      game.save,
    )
    const stored = sanitizeSaves(JSON.parse(JSON.stringify(record)))
    assert.deepEqual(
      stored['another-game'],
      { v: 9 },
      'other games keep theirs',
    )
    assert.ok(stored['battery-maze'], 'the save survives the store')
    return create(players, stored['battery-maze'])
  }
  const steps = campaignSteps()
  const cardOf = (board: string) =>
    steps.findIndex((s) => s.kind === 'card' && s.board === board)
  const endingAt = steps.findIndex((s) => s.kind === 'ending' && !s.secret)

  // The campaign clear counts the moment the ending starts, not when the credits end: the
  // checkpoint moves to the card the credits lead to (save audit BM-2).
  const SIX = ['cozy', 'toaster', 'greenhouse', 'cold', 'arcade', 'solar']
  const gardenCard = cardOf('garden')
  const toEnding = (game: Game, golden: string[]) => {
    game.golden = [...golden]
    game.stepIndex = cardOf('solar')
    game.startStep()
    game.stepIndex = endingAt
    game.startStep()
    assert.equal(game.story?.scene.id, 'ending')
  }
  {
    const game = create()
    pick(game, 'campaign')
    toEnding(game, SIX.slice(0, 3))
    const back = reopen(game)
    const s = readBatterySave(back.save)!
    assert.deepEqual([s.step, s.lap, s.overclocked], [0, 1, true])
    assert.deepEqual(s.golden, SIX.slice(0, 3))
    // A save at step 0 on a later lap is still offered (save audit BM-1).
    assert.ok(back.offer, 'Overclocked from the top is offered')
    back.update(press('a'))
    assert.equal(back.lap, 1)
    assert.equal(back.mode, 'overclocked')
    assert.deepEqual(back.golden, SIX.slice(0, 3))
  }
  {
    // With six golden bolts the credits lead to the Battery Garden.
    const game = create()
    pick(game, 'campaign')
    toEnding(game, SIX)
    const back = reopen(game)
    assert.equal(readBatterySave(back.save)!.step, gardenCard)
    back.update(press('a'))
    assert.equal(back.board.id, 'garden')
  }
  {
    // The true ending's credits lead round the grid again (save audit BM-3).
    const game = create()
    pick(game, 'campaign')
    game.golden = [...SIX]
    game.stepIndex = gardenCard
    game.startStep()
    game.stepIndex = game.steps.length - 1
    game.startStep()
    assert.equal(game.story?.scene.id, 'true-ending')
    const s = readBatterySave(reopen(game).save)!
    assert.deepEqual([s.step, s.lap, s.overclocked], [0, 1, true])
  }
  {
    // Credits finished: the same checkpoint, and reloading never wipes it (save audit BM-1).
    const game = create()
    pick(game, 'campaign')
    toEnding(game, SIX.slice(0, 2))
    game.advance()
    assert.deepEqual([game.stepIndex, game.lap], [0, 1])
    const back = reopen(game)
    back.update(idle())
    const s = readBatterySave(back.save)!
    assert.deepEqual([s.step, s.lap, s.overclocked], [0, 1, true])
    assert.deepEqual(s.golden, SIX.slice(0, 2))
  }
  {
    // A new game keeps the golden bolts and Overclocked, through a quit on its first board
    // (save audit BM-1 and BM-4).
    const game = create()
    pick(game, 'campaign')
    toEnding(game, SIX.slice(0, 4))
    const back = reopen(game)
    back.update(press('b'))
    pick(back, 'campaign', 1, true)
    assert.equal(back.lap, 0)
    for (let i = 0; i < 10; i++) back.update(idle())
    const again = reopen(back)
    const s = readBatterySave(again.save)!
    assert.deepEqual([s.step, s.lap], [0, 0])
    assert.deepEqual(s.golden, SIX.slice(0, 4))
    assert.equal(s.overclocked, true)
    assert.equal(
      again.offer,
      null,
      'a fresh run at the very start needs no offer',
    )
    assert.deepEqual(again.golden, SIX.slice(0, 4))
    assert.equal(again.overclocked, true)
    again.update(idle())
    assert.deepEqual(
      readBatterySave(again.save)!.golden,
      SIX.slice(0, 4),
      'and the next frame keeps them',
    )
  }

  // A medal counts the moment it is won.
  {
    const game = create()
    pick(game, 'campaign')
    game.card = null
    game.beginMaze(boardById('toaster'), 1)
    game.mazeLost = false
    game.mazeFullTrain = false
    game.prizesCaught = 0
    game.clearMaze()
    const back = reopen(game)
    assert.equal(back.medals['toaster:1'], 1, 'Clean Charge kept straight away')
  }

  // So does a golden bolt.
  {
    const game = create()
    pick(game, 'campaign')
    game.card = null
    const board = BOARDS.find((b) => b.mazes.some((m) => m.goldenBolt))!
    const index = board.mazes.findIndex((m) => m.goldenBolt)
    game.beginMaze(board, index)
    const at = game.maze.start
    game.robot.x = at.x
    game.robot.y = at.y
    game.goldenBolt = { at: { ...at }, shown: true }
    game.updateSpecial()
    assert.ok(game.golden.includes(board.id))
    assert.ok(readBatterySave(reopen(game).save)!.golden.includes(board.id))
  }

  // Rush Hour keeps its best as the run goes, and at time up.
  {
    const game = create()
    pick(game, 'rush')
    game.score = 5000
    game.rush!.t = 59
    game.updateRushHour()
    assert.equal(
      readBatterySave(reopen(game).save)!.rushBest,
      5000,
      'a quit mid-run keeps it',
    )
    game.score = 7200
    game.rush!.t = RUSH_HOUR.ticks - 1
    game.updateRushHour()
    assert.ok(game.result!.lines.includes('A NEW BEST!'))
    const back = reopen(game)
    assert.equal(back.rushBest, 7200)
    pick(back, 'rush')
    back.rush!.t = RUSH_HOUR.ticks - 1
    back.updateRushHour()
    assert.equal(
      back.result!.lines[1],
      'BEST 7200',
      'a lower score leaves the best',
    )
    assert.equal(readBatterySave(back.save)!.rushBest, 7200)
  }

  // A bank that sets a new best is kept that very frame, not at the next whole second.
  {
    const game = create()
    pick(game, 'rush')
    const rush = game.rush!
    rush.t = 100
    rush.unbanked = 40
    rush.bar = { x: game.robot.x, y: game.robot.y, ticks: 100 }
    game.updateRushHour()
    assert.ok(game.score > 0)
    assert.notEqual(rush.t % 60, 0)
    assert.equal(readBatterySave(reopen(game).save)!.rushBest, game.score)
  }

  // A save past the lap cap is clamped, never thrown away with its medals and bolts.
  {
    const game = create()
    pick(game, 'campaign')
    const late = {
      ...(game.save as object),
      lap: 51,
      level: 12_000,
      golden: ['cozy'],
      medals: { 'cozy:0': 7 },
      rushBest: 900,
    }
    const read = readBatterySave(late)!
    assert.ok(read, 'a lap 51 save still loads')
    assert.equal(read.lap, 50)
    assert.equal(read.level, 9999)
    assert.deepEqual(read.golden, ['cozy'])
    assert.equal(read.medals!['cozy:0'], 7)
    assert.equal(read.rushBest, 900)
    game.lap = 70
    game.stepIndex = 0
    game.startStep()
    assert.equal(
      readBatterySave(reopen(game).save)!.lap,
      50,
      'and never written past it',
    )
  }

  // Three or four seated get the menu (Tag only), never the one-robot campaign offer.
  {
    const first = create()
    pick(first, 'campaign')
    first.stepIndex = cardOf('toaster')
    first.startStep()
    const record = withSave({}, 'battery-maze', first.save)
    const stored = sanitizeSaves(JSON.parse(JSON.stringify(record)))[
      'battery-maze'
    ]
    for (const seats of [3, 4]) {
      const game = create(seats, stored)
      assert.equal(game.offer, null)
      assert.ok(game.menu)
    }
    // A co-op checkpoint's pool of six doesn't carry into a solo continue.
    const coop = create(2)
    pick(coop, 'campaign', 2)
    coop.stepIndex = cardOf('toaster')
    coop.startStep()
    const solo = reopen(coop)
    solo.update(press('a'))
    assert.equal(solo.lives, 3)
    const pair = reopen(coop, 2)
    pair.update(press('a'))
    assert.equal(pair.lives, COOP_LIVES)
  }

  // A new game from a checkpoint: Rush Hour and Classic Maze write their keepings onto it.
  {
    const first = create()
    pick(first, 'campaign')
    first.stepIndex = cardOf('cold')
    first.startStep()
    const checkpoint = reopen(first)
    assert.ok(checkpoint.offer)
    checkpoint.update(press('b'))
    pick(checkpoint, 'rush')
    checkpoint.score = 3100
    checkpoint.rush!.t = RUSH_HOUR.ticks - 1
    checkpoint.updateRushHour()
    const back = reopen(checkpoint)
    assert.ok(back.offer, 'the campaign checkpoint survives a Rush Hour')
    assert.equal(readBatterySave(back.save)!.step, cardOf('cold'))
    assert.equal(readBatterySave(back.save)!.rushBest, 3100)
    back.update(press('b'))
    pick(back, 'classic')
    back.clearMaze()
    ticks(back, 130)
    const again = reopen(back)
    assert.equal(readBatterySave(again.save)!.step, cardOf('cold'))
    assert.equal(readBatterySave(again.save)!.rushBest, 3100)
  }

  // Every medal on every maze still fits the store's size limit.
  {
    const game = create()
    pick(game, 'campaign')
    for (const b of BOARDS)
      b.mazes.forEach((_, i) => (game.medals[`${b.id}:${i}`] = 7))
    game.score = 99_999_999
    game.rush = null
    game.card = null
    game.medals['cozy:0'] = 0
    game.beginMaze(boardById('cozy'), 0)
    game.mazeFullTrain = true
    game.prizesCaught = PRIZE_AT.length
    game.mazeLost = false
    game.clearMaze()
    assert.ok(JSON.stringify(game.save).length < MAX_SAVE_BYTES)
    const back = reopen(game)
    assert.equal(
      Object.keys(back.medals).length,
      BOARDS.flatMap((b) => b.mazes).length,
    )
  }
}

// --- the registry: up to four seated, short how-to lines ------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'battery-maze')!
  assert.equal(meta.maxPlayers, 4)
  for (const line of meta.howTo ?? []) assert.ok(line.length <= 26, line)
}

// --- every seat count plays and draws, and co-op scores stay plausible ------------------------------------
{
  const stub = new Proxy(
    {},
    {
      get: (_, key) =>
        key === 'measureText'
          ? () => ({ width: 1 })
          : key === 'createLinearGradient' || key === 'createRadialGradient'
            ? () => ({ addColorStop: () => {} })
            : () => {},
      set: () => true,
    },
  )
  for (let seats = 1; seats <= 4; seats++) {
    const game = create(seats)
    for (let t = 0; t < 60 * 90 && !game.over; t++) {
      const frames = Array.from({ length: seats }, (_, i) => {
        const f = emptyInput()
        f.held.right = (t + i * 70) % 240 < 60
        f.held.up = (t + i * 30) % 300 < 40
        f.pressed.a = t % 9 === 0
        return f
      })
      game.update(frames[0]!, frames)
      if (t % 97 === 0) game.render(stub)
    }
    assert.ok(game.score >= 0)
  }
}

console.log('verifyCabinetBatteryMazeTogether: ok')
