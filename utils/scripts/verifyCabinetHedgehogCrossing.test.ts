// /utils/scripts/verifyCabinetHedgehogCrossing.test.ts
//
// Hedgehog Crossing depth pass, slice 1 (conductor kr-arcade/t-102): the escalation table with no
// plateau, the grass snake and its tongue-flick tell, the lost hoglet and the Family Parade
// (follow-the-leader hops, bump-back, Parade Bonus), Bristle Dash, and a pilot probe showing runs
// still end and the attract demo still scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetHedgehogCrossing.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import hedgehogCrossing from '../arcade/games/hedgehogCrossing'
import {
  DASH_COOLDOWN,
  DASH_TICKS,
  MAX_PARADE,
  OLD_PLATEAU,
  SNAKE_FLICK,
  TILE,
  canDash,
  escalation,
  landing,
  newSnake,
  paradeBonus,
  paradeMultiplier,
  snakeBites,
  stepSnake,
} from '../arcade/hedgehogCrossing/rules'
import { emptyInput, type InputFrame } from '../arcade/types'

type Thing = { x: number; len: number; dive: number }
type Lane = { row: number; kind: string; things: Thing[]; vx: number }
type Hoglet = {
  x: number
  row: number
  hop: unknown
  queue: unknown[]
  home: number
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  hx: number
  row: number
  hop: unknown
  hopWait: number
  best: number
  dead: number
  time: number
  dashCool: number
  saved: number
  lanes: Lane[]
  snakes: ReturnType<typeof newSnake>[]
  waiting: number[]
  parade: Hoglet[]
  lost: { row: number; thing: number; off: number } | null
  home: boolean[]
  fox: unknown
  foxTimer: number
  ladybug: unknown
  ladybugTimer: number
  update(input: InputFrame): void
  demoInput(): InputFrame
  joinParade(x: number, row: number, home: number): void
}

function play(seed = 3, demo = false): Game {
  return hedgehogCrossing.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Game
}

/** A still, empty world: no traffic, no snakes, one long log under every creek lane. */
function calm(game: Game): Game {
  for (const lane of game.lanes) {
    lane.vx = 0
    lane.things =
      lane.row >= 1 && lane.row <= 5 ? [{ x: -100, len: 20, dive: -1 }] : []
  }
  game.snakes = []
  game.waiting = []
  game.parade = []
  game.lost = null
  game.fox = null
  game.foxTimer = 0
  game.ladybug = null
  game.ladybugTimer = 1_000_000
  game.time = 60 * 30
  return game
}

function stand(game: Game, x: number, row: number) {
  game.hx = x
  game.row = row
  game.best = row
  game.hop = null
  game.hopWait = 0
}

function frame(
  held: Partial<InputFrame['held']> = {},
  pressed: Partial<InputFrame['pressed']> = {},
): InputFrame {
  const f = emptyInput()
  Object.assign(f.held, held)
  Object.assign(f.pressed, pressed)
  return f
}

function idle(game: Game, ticks: number) {
  for (let i = 0; i < ticks; i++) game.update(frame())
}

/** One hop in a direction, then wait for it and its repeat delay to finish. */
function hopOnce(game: Game, dir: 'up' | 'left' | 'right' | 'down') {
  game.update(frame({ [dir]: true }, { [dir]: true }))
  idle(game, 14)
}

// --- the escalation table: every level asks for something, with no plateau ---------------
{
  for (let level = 1; level < 40; level++) {
    assert.ok(
      escalation(level + 1).speed >= escalation(level).speed,
      `speed never falls (${level})`,
    )
  }
  for (let level = 1; level < 36; level++) {
    assert.ok(
      escalation(level + 1).speed > escalation(level).speed,
      `lane speed still rises at level ${level + 1}`,
    )
  }
  assert.ok(escalation(OLD_PLATEAU + 5).speed > escalation(OLD_PLATEAU).speed)
  assert.ok(escalation(80).speed <= 3.2, 'a ceiling nobody reaches by accident')
  assert.ok(
    escalation(20).snakeSpeed > escalation(12).snakeSpeed,
    'snakes keep speeding up past the old plateau',
  )
  assert.equal(escalation(OLD_PLATEAU).diveStride, 2, 'today’s divers')
  assert.equal(escalation(OLD_PLATEAU + 1).diveStride, 1, 'every group dives')
  assert.ok(escalation(30).foxEvery < escalation(OLD_PLATEAU).foxEvery)
  assert.equal(escalation(1).foxEvery, 0, 'no fox on level 1')
  assert.equal(escalation(2).foxEvery, 520, 'the fox from level 2')
  assert.deepEqual(
    [1, 2, 4, 5, 8, 9, 20].map((l) => escalation(l).snakes),
    [0, 1, 1, 2, 2, 3, 3],
    'snakes arrive from level 2, up to three',
  )
  assert.equal(escalation(1).lostHoglet, false)
  assert.equal(escalation(2).lostHoglet, true)
  for (let level = 1; level < 30; level++) {
    const n = escalation(level).hoglets
    assert.ok(n >= 1 && n <= MAX_PARADE, 'a parade of up to three')
  }
  assert.equal(escalation(OLD_PLATEAU).flipParity, null)
  assert.equal(escalation(12).flipParity, 0)
  assert.equal(escalation(13).flipParity, 1)
  const first = play(1)
  assert.equal(first.snakes.length, 0, 'level 1 has no snake')
}

// --- the grass snake: it flicks its tongue before it turns -------------------------------------
{
  const rng = mulberry32(5)
  const snake = newSnake(140, 1, 30)
  let flicks = 0
  let turns = 0
  let flickRun = 0
  for (let t = 0; t < 6000; t++) {
    const before = { dir: snake.dir, phase: snake.phase, x: snake.x }
    stepSnake(snake, 0.7, rng)
    assert.ok(snake.x >= 18 && snake.x <= 262, 'the snake stays on the verge')
    if (snake.phase === 'flick') flickRun++
    if (before.phase === 'flick' && snake.phase === 'slither') {
      assert.equal(flickRun, SNAKE_FLICK, 'the tell lasts a full flick')
      flickRun = 0
      flicks++
    }
    if (snake.dir !== before.dir) {
      turns++
      assert.equal(before.phase, 'flick', 'it never turns without flicking')
    }
    if (before.phase === 'flick' && snake.phase === 'flick') {
      assert.equal(snake.x, before.x, 'holds still while the tongue flicks')
    }
  }
  assert.ok(flicks > 20 && turns > 10, 'a snake that keeps patrolling')
  assert.equal(snakeBites(newSnake(100, 1, 9), 100), true)
  assert.equal(snakeBites(newSnake(100, 1, 9), 100 + 15 + 7), false)
  assert.equal(snakeBites(newSnake(100, 1, 9), 100 - 8), true)
}

// --- hops land, and a dash needs two rows ------------------------------------------------------
{
  assert.deepEqual(landing(150, 10, { dx: 0, drow: -1 }, 0), {
    toX: 150,
    toRow: 9,
  })
  assert.deepEqual(landing(150, 10, { dx: 0, drow: -2, dash: true }, 0), {
    toX: 150,
    toRow: 8,
  })
  assert.equal(landing(150, 0, { dx: 0, drow: -1 }, 0).toRow, 0)
  assert.equal(landing(12, 5, { dx: -TILE, drow: 0 }, 0).toX, 10, 'edges clamp')
  assert.equal(landing(150, 5, { dx: 0, drow: 0 }, 11).toX, 161, 'drift')
  assert.equal(canDash(11, 0), true)
  assert.equal(canDash(11, 5), false)
  assert.equal(canDash(1, 0), false, 'no dash from the top of the creek')
  assert.equal(paradeBonus(0), 0)
  assert.deepEqual([1, 2, 3].map(paradeBonus), [1000, 4000, 9000])
  assert.deepEqual([0, 1, 2, 3, 9].map(paradeMultiplier), [1, 2, 3, 4, 4])
}

// --- the Family Parade ---------------------------------------------------------------------------
{
  // A hoglet waiting on the median joins when the hedgehog stands beside it.
  const game = calm(play(2))
  stand(game, 150, 6)
  game.waiting = [160, 40]
  idle(game, 1)
  assert.equal(game.parade.length, 1, 'picked up the one in reach')
  assert.deepEqual(game.waiting, [40], 'the far one keeps waiting')

  // The parade follows the leader’s path one hop behind, hop for hop.
  const lead = calm(play(2))
  stand(lead, 150, 6)
  lead.waiting = [150, 150]
  idle(lead, 3)
  assert.equal(lead.parade.length, 2)
  const path: Array<[number, number]> = [[150, 6]]
  for (const dir of ['up', 'left', 'up'] as const) {
    hopOnce(lead, dir)
    path.push([Math.round(lead.hx), lead.row])
  }
  assert.deepEqual(path, [
    [150, 6],
    [150, 5],
    [130, 5],
    [130, 4],
  ])
  const [first, second] = lead.parade
  assert.deepEqual([Math.round(first!.x), first!.row], [130, 5], 'one behind')
  assert.deepEqual([Math.round(second!.x), second!.row], [150, 5], 'two behind')
  assert.equal(lead.lives, 4, 'nobody was hurt on the way')

  // A bumped hoglet scurries back to the median and the multiplier drops.
  const bump = calm(play(2))
  stand(bump, 150, 6)
  bump.waiting = [150, 150]
  idle(bump, 3)
  assert.equal(paradeMultiplier(bump.parade.length), 3)
  const victim = bump.parade[1]!
  victim.row = 8
  victim.x = 150
  const road = bump.lanes.find((lane) => lane.row === 8)!
  road.things = [{ x: 140, len: 1, dive: -1 }]
  idle(bump, 1)
  assert.equal(bump.parade.length, 1, 'bumped out of the line')
  assert.equal(paradeMultiplier(bump.parade.length), 2, 'the multiplier drops')
  assert.equal(bump.waiting.length, 1, 'back on the median')
  assert.equal(bump.waiting[0], victim.home)
  assert.equal(bump.lives, 4, 'no harm done')
  assert.equal(bump.dead, 0)

  // A hoglet that falls in the creek is bumped too.
  const swim = calm(play(2))
  stand(swim, 150, 6)
  swim.waiting = [150]
  idle(swim, 2)
  swim.parade[0]!.row = 3
  swim.parade[0]!.x = 150
  swim.lanes.find((lane) => lane.row === 3)!.things = []
  idle(swim, 1)
  assert.equal(swim.parade.length, 0)
  assert.equal(swim.waiting.length, 1)

  // A snake bumps a hoglet standing on the median.
  const bite = calm(play(2))
  stand(bite, 40, 6)
  bite.waiting = [40]
  idle(bite, 2)
  bite.hx = 250
  bite.snakes = [{ x: 40, dir: 1, phase: 'flick', timer: 99 }]
  idle(bite, 1)
  assert.equal(bite.parade.length, 0, 'the snake bumped the hoglet')
  assert.equal(bite.lives, 4)

  // The lost hoglet rides a log until the hedgehog reaches it.
  const log = calm(play(2))
  log.lost = { row: 4, thing: 0, off: 200 }
  stand(log, 300, 4)
  log.hx = 100 + 80
  idle(log, 1)
  assert.ok(log.lost, 'out of reach')
  log.hx = 105
  idle(log, 1)
  assert.equal(log.lost, null, 'picked up off the log')
  assert.equal(log.parade.length, 1)
  assert.equal(log.parade[0]!.row, 4)

  // The line stops at three.
  const crowd = calm(play(2))
  stand(crowd, 150, 6)
  crowd.waiting = [150, 150, 150, 150]
  idle(crowd, 8)
  assert.equal(crowd.parade.length, MAX_PARADE)
  assert.equal(crowd.waiting.length, 1)

  // Walking the whole line into one burrow pays the Parade Bonus.
  const home = calm(play(2))
  stand(home, 140, 1)
  home.joinParade(140, 2, 100)
  home.joinParade(140, 2, 100)
  const before = home.score
  hopOnce(home, 'up')
  assert.ok(home.home[2], 'the leader is home')
  assert.equal(home.parade.length, 0, 'the line files in behind')
  assert.equal(home.saved, 2)
  const gained = home.score - before
  assert.ok(gained >= paradeBonus(2) + 3 * 50, `bonus paid (${gained})`)
  assert.ok(gained < paradeBonus(2) + 3 * 700 + 100)

  // A death sends the whole line back to the median.
  const lose = calm(play(2))
  stand(lose, 150, 6)
  lose.waiting = [150, 150]
  idle(lose, 3)
  lose.snakes = [{ x: 150, dir: 1, phase: 'flick', timer: 99 }]
  idle(lose, 1)
  assert.equal(lose.lives, 3)
  assert.equal(lose.parade.length, 0)
  assert.equal(lose.waiting.length, 2)

  // Hoglets already home do not come back this level.
  const saved = calm(play(2))
  saved.saved = 1
  stand(saved, 150, 6)
  saved.waiting = []
  saved.parade = []
  assert.equal(saved.score, 0)
}

// --- the grass snake bites the hedgehog ------------------------------------------------------------
{
  const game = calm(play(4))
  stand(game, 150, 6)
  game.snakes = [{ x: 250, dir: 1, phase: 'slither', timer: 999 }]
  idle(game, 1)
  assert.equal(game.lives, 4, 'a snake across the verge is harmless')
  game.snakes = [{ x: 150, dir: 1, phase: 'flick', timer: 999 }]
  idle(game, 1)
  assert.equal(game.lives, 3, 'sharing its tile costs a hedgehog')
  assert.ok(game.dead > 0)
}

// --- Bristle Dash ------------------------------------------------------------------------------------
{
  const game = calm(play(6))
  stand(game, 150, 11)
  // A slow tractor parks across the lane the dash leaps over.
  game.lanes.find((lane) => lane.row === 10)!.things = [
    { x: 130, len: 2, dive: -1 },
  ]
  const before = game.score
  game.update(frame({}, { b: true }))
  idle(game, DASH_TICKS + 1)
  assert.equal(game.row, 9, 'two rows in one leap')
  assert.equal(game.lives, 4, 'over the traffic in between')
  assert.equal(game.score - before, 20, 'a point for each new row')
  assert.ok(game.dashCool > DASH_COOLDOWN - DASH_TICKS - 5, 'cooling down')
  // Pressing again during the cooldown does nothing.
  idle(game, 10)
  game.update(frame({}, { b: true }))
  idle(game, DASH_TICKS + 2)
  assert.equal(game.row, 9)
  idle(game, DASH_COOLDOWN)
  game.update(frame({}, { b: true }))
  idle(game, DASH_TICKS + 1)
  assert.equal(game.row, 7, 'ready again after three seconds')

  // A plain hop onto that tractor would not have been so lucky.
  const plain = calm(play(6))
  stand(plain, 150, 11)
  plain.lanes.find((lane) => lane.row === 10)!.things = [
    { x: 130, len: 2, dive: -1 },
  ]
  hopOnce(plain, 'up')
  assert.equal(plain.lives, 3)

  // And the lanes the dash lands on still count.
  const crash = calm(play(6))
  stand(crash, 150, 11)
  crash.lanes.find((lane) => lane.row === 9)!.things = [
    { x: 130, len: 2, dive: -1 },
  ]
  crash.update(frame({}, { b: true }))
  idle(crash, DASH_TICKS + 1)
  assert.equal(crash.lives, 3, 'landing in traffic is a bonk')

  // Not from the top of the creek, where there is no room for two rows.
  const top = calm(play(6))
  stand(top, 140, 1)
  top.update(frame({}, { b: true }))
  assert.equal(top.hop, null)

  // A parade follows a dash with the same leap.
  const dash = calm(play(6))
  stand(dash, 150, 6)
  dash.waiting = [150]
  idle(dash, 2)
  dash.update(frame({}, { b: true }))
  idle(dash, DASH_TICKS + 6)
  dash.update(frame({ up: true }, { up: true }))
  idle(dash, 14)
  assert.equal(dash.row, 3)
  assert.equal(dash.parade[0]!.row, 4, 'the hoglet leapt the same two rows')
}

// --- determinism and the pilot probe -----------------------------------------------------------------
{
  const run = (seed: number, ticks: number) => {
    const game = play(seed)
    for (let t = 0; t < ticks && !game.over; t++) game.update(game.demoInput())
    return [game.score, game.level, game.lives, game.hx, game.row]
  }
  assert.deepEqual(run(9, 4000), run(9, 4000), 'same seed, same game')

  // The pilot ignores the parade, but runs still end, and it clears the odd crossing.
  let homes = 0
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const game = play(seed)
    let t = 0
    for (; t < 60 * 60 * 20 && !game.over; t++) game.update(game.demoInput())
    assert.ok(game.over, `seed ${seed}: the run ends`)
    assert.ok(game.score < 2_000_000)
    homes += game.score > 0 ? 1 : 0
  }
  assert.ok(homes >= 4, 'the pilot still gets hedgehogs home')

  // The attract demo scores nothing.
  const attract = play(7, true)
  for (let t = 0; t < 60 * 60 * 4; t++) attract.update(emptyInput())
  assert.equal(attract.score, 0, 'the attract demo scores 0')
}

console.log('verifyCabinetHedgehogCrossing: ok')
