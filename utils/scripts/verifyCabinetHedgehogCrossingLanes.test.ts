// /utils/scripts/verifyCabinetHedgehogCrossingLanes.test.ts
//
// Hedgehog Crossing depth pass, slice 1 (conductor kr-arcade/t-102): lanes as data. The lane-kind
// table, the Park Lane board and the per-level remix table (with parity remixes past level 11);
// the snapping log (eyes open before it yawns, the head half bites, the tail half is a safe ride);
// the delivery bot (a blinker before every lane change, a merge that covers both rows); the heron
// (the shadow sweeps toward the hedgehog's column, holds, then stabs); the newcomers' intro
// banners; and a pilot probe from level 6 up showing runs still end and the attract demo scores 0.
//
//   npx tsx utils/scripts/verifyCabinetHedgehogCrossingLanes.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import hedgehogCrossing from '../arcade/games/hedgehogCrossing'
import {
  BOT_BLINK,
  BOT_MERGE,
  LANE_KINDS,
  PARK_LANE,
  REMIXES,
  SNAP_EYES,
  SNAP_PERIOD,
  SNAP_YAWN,
  boardLanes,
  botRows,
  newArrivals,
  newBot,
  snapPhase,
  snapperTouch,
} from '../arcade/hedgehogCrossing/lanes'
import type { Bot, LaneKind } from '../arcade/hedgehogCrossing/lanes'
import {
  HERON_FROM,
  HERON_HOLD,
  HERON_STAB,
  HERON_SWEEP,
  OLD_PLATEAU,
  TILE,
  escalation,
  heronEvery,
  heronStrikes,
  newHeron,
  stepHeron,
} from '../arcade/hedgehogCrossing/rules'
import type { Heron } from '../arcade/hedgehogCrossing/rules'
import { RAMPS } from '../arcade/snes'
import { emptyInput, type InputFrame } from '../arcade/types'

type Thing = { x: number; len: number; dive: number; bot?: Bot }
type Lane = {
  row: number
  kind: LaneKind
  ramp: string
  pair?: number
  things: Thing[]
  vx: number
}
type Hoglet = {
  x: number
  row: number
  hop: unknown
  wait: number
  queue: unknown[]
  home: number
}

function hoglet(x: number, row: number): Hoglet {
  return { x, row, hop: null, wait: 0, queue: [], home: 150 }
}
type Banner = { text: string; sub?: string; ticks: number }
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  hx: number
  row: number
  hop: unknown
  hopWait: number
  best: number
  dead: number
  time: number
  lanes: Lane[]
  snakes: unknown[]
  waiting: number[]
  parade: Hoglet[]
  lost: unknown
  fox: unknown
  foxTimer: number
  ladybug: unknown
  ladybugTimer: number
  heron: Heron | null
  heronTimer: number
  banner: Banner | null
  bannerQueue: Banner[]
  update(input: InputFrame): void
  demoInput(): InputFrame
  startLevel(level: number): void
  stepLanes(): void
  safeRide(row: number, x: number, dt: number): boolean
  roadClear(row: number, x: number, from: number, to: number): boolean
}

function play(seed = 3, level = 1, demo = false): Game {
  const game = hedgehogCrossing.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Game
  if (level > 1) game.startLevel(level)
  return game
}

/** A still world on this level's board: no traffic, one long dozing ride under each creek row. */
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
  game.heron = null
  game.heronTimer = 1_000_000
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

function laneAt(game: Game, row: number): Lane {
  return game.lanes.find((lane) => lane.row === row)!
}

/** A yawn offset that puts a snapping log `into` ticks into its yawn on the game's next tick. */
function yawnOffset(game: Game, into: number): number {
  const p = SNAP_PERIOD - SNAP_YAWN + into
  return (((p - (game.tick + 1)) % SNAP_PERIOD) + SNAP_PERIOD) % SNAP_PERIOD
}

const ROAD = [7, 8, 9, 10, 11]
const CREEK = [1, 2, 3, 4, 5]

// --- lanes as data: the kind table, Park Lane, the remixes ------------------------------------
{
  assert.deepEqual(
    PARK_LANE.map((l) => l.row),
    [11, 10, 9, 8, 7, 5, 4, 3, 2, 1],
    'Park Lane: five road lanes, the median, five creek lanes',
  )
  assert.deepEqual(boardLanes(1), PARK_LANE, 'level 1 is Park Lane as it was')
  for (let level = 1; level <= 40; level++) {
    const board = boardLanes(level)
    assert.equal(board.length, 10)
    for (const spec of board) {
      const info = LANE_KINDS[spec.kind]
      assert.ok(info, `${spec.kind} is in the kind table`)
      const half = ROAD.includes(spec.row)
        ? 'road'
        : CREEK.includes(spec.row)
          ? 'creek'
          : 'median'
      assert.equal(info.half, half, `level ${level}: ${spec.kind} on its half`)
      assert.ok(spec.ramp in RAMPS, 'lanes carry a ramp')
      assert.equal('color' in spec, false, 'and no colour')
      assert.ok(spec.count >= 1 && spec.len >= 1 && spec.speed > 0)
    }
    assert.ok(
      board.some((s) => s.kind === 'log'),
      `level ${level}: a log for the lost hoglet`,
    )
    assert.ok(
      board.some((s) => s.kind === 'turtles'),
      `level ${level}: turtles still dive`,
    )
  }
  const kindAt = (level: number, row: number) =>
    boardLanes(level).find((s) => s.row === row)!.kind
  assert.equal(kindAt(2, 3), 'log')
  assert.equal(kindAt(3, 3), 'snapper', 'snapping logs on row 3 from level 3')
  assert.equal(kindAt(3, 10), 'tractor')
  assert.equal(kindAt(4, 10), 'bot', 'delivery bots from level 4')
  assert.equal(boardLanes(4).find((s) => s.row === 10)!.pair, 9, 'rows 9-10')
  assert.ok(
    !boardLanes(4).some((s) => s.kind === 'tractor'),
    'the tractor lane gives way',
  )
  assert.equal(kindAt(7, 1), 'log')
  assert.equal(kindAt(8, 1), 'snapper', 'row 1 snaps from level 8')
  assert.deepEqual(
    boardLanes(OLD_PLATEAU),
    boardLanes(OLD_PLATEAU - 1),
    'no parity remix before the old plateau',
  )
  const even = boardLanes(OLD_PLATEAU + 1)
  const odd = boardLanes(OLD_PLATEAU + 2)
  assert.notDeepEqual(even, odd, 'the board turns every level past 11')
  assert.notDeepEqual(even, boardLanes(OLD_PLATEAU), 'and differs from 11')
  assert.notDeepEqual(odd, boardLanes(OLD_PLATEAU), 'both ways')
  assert.deepEqual(boardLanes(20), even, 'even levels share a remix')
  assert.deepEqual(boardLanes(21), odd, 'odd levels share the other')
  assert.ok(REMIXES.some((r) => r.parity === 0))
  assert.ok(REMIXES.some((r) => r.parity === 1))
  assert.equal(kindAt(13, 2), 'snapper')
  assert.equal(kindAt(13, 11), 'racer')
  assert.equal(kindAt(12, 5), 'log')
  assert.equal(kindAt(12, 8), 'bus')

  assert.deepEqual(newArrivals(3), ['snapper'])
  assert.deepEqual(newArrivals(4), ['bot'])
  for (const level of [2, 5, 6, 7, 8, 12, 13, 30])
    assert.deepEqual(newArrivals(level), [], `nothing new on level ${level}`)

  // The game builds its lanes from the board, through each kind's spawn.
  for (const level of [1, 3, 4, 8, 12, 13]) {
    const game = play(5, level)
    assert.deepEqual(
      game.lanes.map((l) => [l.row, l.kind]),
      boardLanes(level).map((s) => [s.row, s.kind]),
      `level ${level} board`,
    )
    const snappers = game.lanes.filter((l) => l.kind === 'snapper')
    for (const lane of snappers) {
      assert.ok(
        lane.things.every((t) => t.len >= 3),
        'a head and a tail',
      )
      assert.ok(
        lane.things.every((t) => t.dive >= 0),
        'each wakes in turn',
      )
    }
    const bots = game.lanes.find((l) => l.kind === 'bot')
    if (bots) {
      const cars = laneAt(game, 9)
      assert.ok(bots.things.every((t) => t.bot?.at === 10))
      assert.equal(Math.sign(bots.vx), Math.sign(cars.vx), 'same way')
      assert.ok(Math.abs(bots.vx) > Math.abs(cars.vx), 'in a hurry')
    }
  }
}

// --- the snapping log: eyes open, then a yawn; ride the tail -------------------------------------
{
  let eyesRun = 0
  let yawns = 0
  const counts = { doze: 0, eyes: 0, yawn: 0 }
  let prev = snapPhase(17, 0)
  for (let t = 1; t <= SNAP_PERIOD * 4; t++) {
    const phase = snapPhase(17, t)
    counts[phase]++
    if (phase === 'eyes') eyesRun++
    if (phase === 'yawn' && prev !== 'yawn') {
      assert.equal(prev, 'eyes', 'it never yawns without opening its eyes')
      assert.equal(eyesRun, SNAP_EYES, 'a full second of open eyes first')
      yawns++
    }
    if (phase !== 'eyes') eyesRun = 0
    prev = phase
  }
  assert.equal(yawns, 4)
  assert.equal(counts.eyes, SNAP_EYES * 4)
  assert.equal(counts.yawn, SNAP_YAWN * 4)
  assert.equal(snapPhase(-1, 12345), 'doze', 'an offset of -1 never wakes')

  // A four-tile snapper at x 100 swimming right: head 140..180, tail 100..140.
  assert.equal(snapperTouch(100, 4, 1, 170, 'yawn'), 'bite', 'the jaws')
  assert.equal(snapperTouch(100, 4, 1, 120, 'yawn'), 'ride', 'the tail is safe')
  assert.equal(snapperTouch(100, 4, 1, 170, 'eyes'), 'ride', 'only the yawn')
  assert.equal(snapperTouch(100, 4, 1, 170, 'doze'), 'ride')
  assert.equal(snapperTouch(100, 4, 1, 60, 'yawn'), null, 'off the log')
  // Swimming left, the head is the left half.
  assert.equal(snapperTouch(100, 4, -1, 110, 'yawn'), 'bite')
  assert.equal(snapperTouch(100, 4, -1, 170, 'yawn'), 'ride')
  // A cautious margin widens the jaws.
  assert.equal(snapperTouch(100, 4, 1, 138, 'yawn'), 'ride')
  assert.equal(snapperTouch(100, 4, 1, 138, 'yawn', 3), 'bite')

  // In the game: riding the head into a yawn is a bonk, never a splash.
  const head = calm(play(3, 3))
  const lane = laneAt(head, 3)
  assert.equal(lane.kind, 'snapper')
  lane.things = [{ x: 100, len: 4, dive: yawnOffset(head, 2) }]
  stand(head, 170, 3)
  idle(head, 1)
  assert.equal(head.lives, 3, 'SNAP')
  assert.ok(head.dead > 0)
  assert.equal(head.banner?.text, 'SNAP! RIDE THE TAIL')

  const tail = calm(play(3, 3))
  laneAt(tail, 3).things = [{ x: 100, len: 4, dive: yawnOffset(tail, 2) }]
  stand(tail, 115, 3)
  idle(tail, SNAP_YAWN)
  assert.equal(tail.lives, 4, 'riding the tail through the whole yawn')

  // A hoglet on the head is bumped back to the median; the leader on the tail is fine.
  const pup = calm(play(3, 3))
  laneAt(pup, 3).things = [{ x: 100, len: 4, dive: yawnOffset(pup, 2) }]
  stand(pup, 115, 3)
  pup.parade = [hoglet(170, 3)]
  idle(pup, 1)
  assert.equal(pup.parade.length, 0)
  assert.equal(pup.waiting.length, 1)
  assert.equal(pup.lives, 4)

  // The pilot reads the eyes: it will not land on a head that is about to yawn.
  const look = calm(play(3, 3))
  laneAt(look, 3).things = [
    { x: 100, len: 4, dive: yawnOffset(look, -SNAP_EYES + 30) },
  ]
  assert.equal(look.safeRide(3, 170, 8), false, 'head: eyes are open')
  assert.equal(look.safeRide(3, 115, 8), true, 'tail: fine')
}

// --- the delivery bot: a blinker before every lane change ---------------------------------------
{
  // Rows covered.
  const bot = newBot(10, 50)
  assert.deepEqual(botRows(bot), [10])
  bot.to = 9
  bot.blink = 30
  assert.deepEqual(botRows(bot), [10], 'blinking is a tell, not a move')
  bot.blink = 0
  bot.merge = 10
  assert.deepEqual(botRows(bot), [10, 9], 'a merge straddles both rows')

  for (const seed of [1, 2, 3, 4]) {
    const game = play(seed, 4)
    const lane = laneAt(game, 10)
    const cars = laneAt(game, 9)
    assert.equal(lane.kind, 'bot')
    const runs = new Map<Thing, number>()
    const merging = new Map<Thing, number>()
    let into9 = 0
    let back = 0
    let overlaps = 0
    for (let t = 0; t < 60 * 60 * 3; t++) {
      const before = lane.things.map((th) => ({ ...th.bot! }))
      game.tick++
      game.stepLanes()
      lane.things.forEach((th, i) => {
        const b = th.bot!
        const was = before[i]!
        if (b.blink > 0) runs.set(th, (runs.get(th) ?? 0) + 1)
        if (was.merge === 0 && b.merge > 0) {
          assert.ok(
            (runs.get(th) ?? 0) >= BOT_BLINK,
            `seed ${seed}: blinked ${runs.get(th)} ticks before merging`,
          )
          assert.notEqual(b.to, b.at, 'a merge changes rows')
          if (b.to === 9) into9++
          else back++
          runs.set(th, 0)
          merging.set(th, 0)
        }
        if (b.merge > 0) {
          merging.set(th, (merging.get(th) ?? 0) + 1)
          assert.equal(botRows(b).length, 2, 'both rows while it merges')
        }
        if (was.merge > 0 && b.merge === 0) {
          assert.equal(merging.get(th), BOT_MERGE, 'a merge takes its time')
          assert.equal(b.at, was.to, 'and lands in the new row')
        }
        assert.ok(b.at === 9 || b.at === 10, 'it stays on rows 9-10')
        if (b.at === 9 && b.merge === 0) {
          const hit = cars.things.some(
            (c) => th.x < c.x + c.len * TILE && c.x < th.x + th.len * TILE,
          )
          if (hit) overlaps++
        }
      })
    }
    assert.ok(into9 >= 4, `seed ${seed}: bots weave into the car lane`)
    assert.ok(back >= 4, `seed ${seed}: and back out before the car ahead`)
    assert.ok(overlaps < 60, `seed ${seed}: bots slot into gaps (${overlaps})`)
  }

  // A bot in its own row is no danger to the row above -- until it merges.
  const game = calm(play(2, 4))
  const lane = laneAt(game, 10)
  const cruising = newBot(10, 999)
  lane.things = [{ x: 140, len: 1, dive: -1, bot: cruising }]
  stand(game, 150, 9)
  idle(game, 1)
  assert.equal(game.lives, 4, 'blinking or not, it is still in row 10')
  cruising.to = 9
  cruising.blink = 0
  cruising.merge = 10
  idle(game, 1)
  assert.equal(game.lives, 3, 'the merge covers row 9 too')
  assert.equal(game.banner?.text, LANE_KINDS.bot.bonk)

  // The pilot treats a blinker about to finish as a merge.
  const wary = calm(play(2, 4))
  const blinking = newBot(10, 999)
  blinking.to = 9
  blinking.blink = 6
  laneAt(wary, 10).things = [{ x: 140, len: 1, dive: -1, bot: blinking }]
  assert.equal(wary.roadClear(9, 150, 0, 24), false, 'reads the blinker')
  blinking.blink = 0
  blinking.to = 10
  assert.equal(wary.roadClear(9, 150, 0, 24), true, 'no blinker, no worry')
}

// --- the heron: the shadow sweeps toward the hedgehog's column, holds, then stabs ------------------
{
  assert.equal(heronEvery(HERON_FROM - 1), 0, 'no heron before level 6')
  assert.equal(heronEvery(HERON_FROM), 720, 'every 12 s at first')
  for (let level = HERON_FROM; level < 30; level++) {
    assert.ok(heronEvery(level + 1) <= heronEvery(level))
    assert.ok(heronEvery(level) >= 300, 'never more than every 5 s')
  }
  assert.equal(heronEvery(30), 300)
  assert.equal(escalation(HERON_FROM).heronEvery, 720)

  const heron = newHeron(true)
  const xs: number[] = []
  let life = 0
  let strikes = 0
  while (stepHeron(heron, 150)) {
    life++
    if (heron.phase === 'sweep') {
      xs.push(heron.x)
      assert.equal(
        heronStrikes(heron, heron.x),
        false,
        'no beak while it sweeps',
      )
    }
    if (heron.phase === 'hold') {
      assert.equal(heron.x, 150, 'settled on the column')
      assert.equal(heronStrikes(heron, 150), false, 'the hold is the tell')
    }
    if (heron.phase === 'stab') {
      assert.equal(heronStrikes(heron, 150), true)
      assert.equal(
        heronStrikes(heron, 150 + TILE),
        false,
        'next column is safe',
      )
      strikes++
    }
  }
  assert.equal(life + 1, HERON_SWEEP + HERON_HOLD + HERON_STAB)
  assert.equal(strikes, HERON_STAB, 'the beak stays down')
  for (let i = 1; i < xs.length; i++)
    assert.ok(xs[i]! >= xs[i - 1]!, 'the shadow closes on the column')

  // Following a moving hedgehog while it sweeps, then holding still.
  const chase = newHeron(false)
  let target = 200
  for (let t = 0; t < HERON_SWEEP; t++) stepHeron(chase, (target -= 1))
  assert.equal(chase.phase, 'hold')
  assert.equal(chase.x, target, 'locked on where the hedgehog was')
  for (let t = 0; t < 10; t++) stepHeron(chase, 40)
  assert.equal(chase.x, target, 'the hold does not follow')

  // In the game: on a still log in the column when the beak comes down is a bonk.
  const stay = calm(play(4, HERON_FROM))
  stand(stay, 150, 3)
  stay.heronTimer = 1
  idle(stay, 1 + HERON_SWEEP + HERON_HOLD)
  assert.ok(stay.heron, 'the heron came')
  assert.equal(stay.lives, 3, 'PECK')
  assert.equal(stay.banner?.text, 'PECK! LEAVE THE SHADOW')

  // Hopping out of the column during the hold is enough; a hoglet left in it is bumped.
  const leave = calm(play(4, HERON_FROM))
  stand(leave, 150, 3)
  leave.parade = [hoglet(150, 4)]
  leave.heronTimer = 1
  idle(leave, 1 + HERON_SWEEP + 4)
  assert.equal(leave.heron?.phase, 'hold')
  leave.update(frame({ right: true }, { right: true }))
  idle(leave, HERON_HOLD + HERON_STAB)
  assert.equal(leave.lives, 4, 'out of the shadow in time')
  assert.equal(Math.round(leave.hx), 170)
  assert.equal(leave.parade.length, 0, 'the hoglet in the column was bumped')
  assert.equal(leave.waiting.length, 1, 'back on the median, no harm done')

  // The heron only fishes the creek: the road below its column is safe.
  const road = calm(play(4, HERON_FROM))
  stand(road, 150, 8)
  road.heronTimer = 1
  idle(road, 1 + HERON_SWEEP + HERON_HOLD + HERON_STAB)
  assert.equal(road.lives, 4)
  // No heron on level 5.
  const early = calm(play(4, HERON_FROM - 1))
  early.heronTimer = 1
  idle(early, 2000)
  assert.equal(early.heron, null)
}

// --- newcomers introduce themselves -----------------------------------------------------------------
{
  const intro = (level: number) => play(1, level).bannerQueue.map((b) => b.text)
  assert.deepEqual(intro(2), ['GRASS SNAKE'])
  assert.deepEqual(intro(3), ['SNAPPING LOG'])
  assert.deepEqual(intro(4), ['DELIVERY BOT'])
  assert.deepEqual(intro(5), [])
  assert.deepEqual(intro(6), ['HERON!'])
  assert.deepEqual(intro(12), [])
  const game = play(1, 3)
  assert.equal(game.banner?.text, 'LEVEL 3', 'the level banner first')
  idle(game, 91)
  assert.equal(game.banner?.text, 'SNAPPING LOG', 'then the newcomer')
  assert.ok(game.banner?.sub && game.banner.sub.length <= 44, 'fits the board')
}

// --- the pilot from level 6 up: runs still end, the attract demo scores nothing --------------------
{
  const run = (seed: number, level: number, ticks: number) => {
    const game = play(seed, level)
    for (let t = 0; t < ticks && !game.over; t++) game.update(game.demoInput())
    return [game.score, game.level, game.lives, game.hx, game.row]
  }
  assert.deepEqual(run(9, 8, 4000), run(9, 8, 4000), 'same seed, same game')

  let scored = 0
  for (const [seed, level] of [
    [1, 6],
    [2, 6],
    [3, 8],
    [4, 9],
    [5, 12],
    [6, 13],
  ] as const) {
    const game = play(seed, level)
    for (let t = 0; t < 60 * 60 * 20 && !game.over; t++)
      game.update(game.demoInput())
    assert.ok(game.over, `seed ${seed}, level ${level}: the run ends`)
    assert.ok(game.score < 2_000_000)
    if (game.score > 0) scored++
  }
  assert.ok(scored >= 3, `the pilot still gets across late boards (${scored})`)

  for (const level of [HERON_FROM, 13]) {
    const attract = play(7, level, true)
    for (let t = 0; t < 60 * 60 * 4; t++) attract.update(emptyInput())
    assert.equal(attract.score, 0, `level ${level}: the attract demo scores 0`)
  }
}

console.log('verifyCabinetHedgehogCrossingLanes: ok')
