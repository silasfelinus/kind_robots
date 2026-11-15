// /utils/scripts/verifyCabinetCocoaCounterTour.test.ts
//
// Cocoa Counter depth pass, slice 2 (conductor kr-arcade/t-123), the Snowdrop Cafe and the Seaside
// Smoothie Shack: the tour's select screen and save/resume per venue, boardwalk gaps that sink slow
// mugs, the toddler-bot, the trio, the surfer-bot, the seagull-bot and the VIP, the Snow Golem
// Regular and Captain Crab, the Marshmallow Mix-up and Catch the Coconuts, the Cafe Fund shop and
// golden mugs 1-2. Ends with a pilot probe that plays the whole tour so far and shows runs still
// end, under the registry ceiling, with the attract demo still scoring nothing.
//
//   npx tsx utils/scripts/verifyCabinetCocoaCounterTour.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import cocoaCounter, { cocoaGuide } from '../arcade/games/cocoaCounter'
import {
  CatchTheCoconuts,
  MIXUP,
  MarshmallowMixup,
} from '../arcade/cocoaCounter/bonus'
import {
  RUSH_HOUR,
  followCup,
  mugPace,
  readCocoaSave,
  shiftRules,
  shuffleSwaps,
  sinksAt,
  sinksBefore,
  tourRules,
} from '../arcade/cocoaCounter/rules'
import {
  BOSSES,
  COZY,
  ENDLESS_LADDER,
  FAST_POUR_TICKS,
  PATRONS,
  UPGRADES,
  VENUES,
} from '../arcade/cocoaCounter/tables'
import type { PatronId, Topping } from '../arcade/cocoaCounter/tables'
import { emptyInput, type InputFrame } from '../arcade/types'

type Boss = {
  kind: string
  part: string
  hp: number
  stage: number
  cool: number
  tell: number
  onRow: number
  toRow: number
}
type Robot = {
  row: number
  x: number
  state: string
  timer: number
  phase: number
  color: string
  thirsty: boolean
  patron: PatronId
  order: Topping
  stealsTips: boolean
  refills: number
  surfTo: number | null
  boss: Boss | null
}
type Mug = {
  row: number
  x: number
  full: boolean
  topping: Topping
  back: boolean
  from: number
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  row: number
  x: number
  mode: string
  stage: string
  shift: number
  venueIndex: number
  menu: { items: string[]; cursor: number } | null
  pouring: { base: number } | null
  robots: Robot[]
  mugs: Mug[]
  tips: { row: number; x: number }[]
  gulls: { row: number; state: string; target: number; carrying: boolean }[]
  snowballs: { row: number; x: number }[]
  toSpawn: number
  spawnTimer: number
  mops: number
  cozy: number
  singing: number
  fund: number
  golden: Set<string>
  upgrades: Set<string>
  shiftClean: boolean
  shopCursor: number
  stageTicks: number
  rules: ReturnType<typeof shiftRules>
  save: unknown
  music: unknown
  bonus: { done: boolean } | null
  banner: { text: string; sub?: string; note?: string } | null
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  demoInput(): InputFrame
  beginTour(from: unknown): void
  startShift(shift: number): void
  roundClear(): void
  spawn(): void
  makeRobot(row: number, x: number, patron: PatronId, color: string): Robot
  spawnBoss(kind: 'golem' | 'crab'): void
}

const TAP_X = 284
const quiet = { play: () => {} }
const fakeCtx = () =>
  new Proxy(
    {},
    {
      get: (_t, k) =>
        k === 'createRadialGradient' || k === 'createLinearGradient'
          ? () => ({ addColorStop: () => {} })
          : k === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D

function open(
  opts: { seed?: number; resume?: unknown; selectScreen?: boolean } = {},
): Game {
  return cocoaCounter.create({
    rng: mulberry32(opts.seed ?? 3),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: opts.resume,
    selectScreen: opts.selectScreen,
  }) as unknown as Game
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

/** A robot's state, read fresh (the game changes it between ticks). */
const state = (r: Robot): string => r.state

const idle = (game: Game, ticks: number) => {
  for (let i = 0; i < ticks; i++) game.update(frame())
}

/** A tour shift with an empty floor and nobody walking in. */
function shiftAt(venue: number, shift: number, seed = 3): Game {
  const game = open({ seed })
  game.beginTour(null)
  game.venueIndex = venue
  game.startShift(shift)
  game.robots = []
  game.mugs = []
  game.gulls = []
  game.snowballs = []
  game.toSpawn = 1
  game.spawnTimer = 1_000_000
  game.banner = null
  return game
}

function pour(game: Game, topping: Topping, row = game.row) {
  game.row = row
  game.x = TAP_X
  game.update(frame({ a: true }, { a: true }))
  for (let t = 0; t < 40 && game.pouring; t++) {
    const b = topping === 'swirl' && t === 2
    game.update(frame({ a: topping !== 'plain', b }, { b }))
  }
}

// --- the tables -----------------------------------------------------------------
{
  assert.deepEqual(
    VENUES.map((v) => v.id),
    ['snowdrop', 'seaside'],
  )
  for (const v of VENUES) {
    assert.equal(v.shifts.length, 4, `${v.id}: four shifts`)
    assert.ok(BOSSES[v.boss], `${v.id}: a rush-hour regular`)
    assert.ok(v.menu.plain && v.menu.marshmallow, `${v.id}: tap and hold`)
    for (const s of v.shifts)
      for (const t of s.orders) assert.ok(v.menu[t], `${v.id}: orders ${t}`)
  }
  const seaside = VENUES[1]!
  assert.deepEqual(seaside.menu, { plain: 'berry', marshmallow: 'mango' })
  assert.ok(seaside.counters.every((c) => c.feature === 'boardwalk' && c.gap))
  for (const id of ['toddler', 'trio', 'surfer', 'seagull', 'vip'] as const)
    assert.ok(
      ENDLESS_LADDER.some((u) => u.kind === 'patron' && u.patron === id),
      `${id} joins the Endless Shift ladder`,
    )
  assert.equal(PATRONS.trio.group, 3)
  assert.ok(PATRONS.toddler.small && PATRONS.toddler.refills === 1)
  assert.ok(PATRONS.toddler.push < 1 && PATRONS.toddler.walk > 1)
  assert.ok(PATRONS.surfer.surfs && PATRONS.seagull.flies && PATRONS.vip.vip)
  assert.equal(UPGRADES.length, 5)
  assert.deepEqual(
    tourRules(0, 1).patrons,
    ['thirsty', 'toddler'],
    'shift 1 introduces the venue',
  )
  assert.ok(tourRules(1, 3).patrons.includes('trio'), 'shift 3 remixes')
  assert.equal(tourRules(1, 1).venue.id, 'seaside')
  assert.equal(tourRules(0, RUSH_HOUR).robots, 0)
  assert.ok(tourRules(0, 3).toppings.includes('swirl'))
  assert.ok(
    !tourRules(1, 3).toppings.includes('swirl'),
    'no swirl at the Shack',
  )
  assert.equal(shiftRules(5).venue.id, 'seaside', 'Endless visits the Shack')
  for (const page of cocoaGuide())
    for (const line of page.lines)
      assert.ok(line.length <= 52, `guide line fits: ${line}`)
}

// --- boardwalk counters -----------------------------------------------------------
{
  const [row0, row1, , row3] = VENUES[1]!.counters
  const polished = VENUES[0]!.counters[0]!
  assert.equal(mugPace(polished, 250), 1, 'a polished counter never slows')
  assert.ok(mugPace(row0!, 100) < 1, 'a boardwalk does')
  assert.ok(
    !sinksBefore(row0!, TAP_X - 8, 20),
    'row 1 gap is close: mugs clear it',
  )
  assert.ok(sinksBefore(row1!, TAP_X - 8, 40), 'row 2 gap is far: mugs sink')
  assert.ok(!sinksBefore(row1!, TAP_X - 8, 200), 'unless the robot crossed it')
  assert.ok(sinksBefore(row3!, TAP_X - 8, 30))
  assert.ok(!sinksAt(polished, 100, 0.3))

  // A mug down a far-gap counter sinks into the sand (a spill the mop-bot handles).
  const game = shiftAt(1, 1)
  const mops = game.mops
  pour(game, 'plain', 1)
  for (let t = 0; t < 200 && game.mugs.length; t++) game.update(frame())
  assert.equal(game.mugs.length, 0)
  assert.equal(game.mops, mops - 1, 'it sank: one mop used')
  assert.equal(game.shiftClean, false, 'and the golden mug is off this shift')
  // Down a near-gap counter the mug clears the gap and serves a robot past it.
  const near = shiftAt(1, 1)
  const r = near.makeRobot(0, 80, 'thirsty', '#38bdf8')
  r.order = 'plain'
  near.robots.push(r)
  pour(near, 'plain', 0)
  for (let t = 0; t < 200 && r.state === 'walk'; t++) near.update(frame())
  assert.equal(r.state, 'pushed', 'served across the gap')
  assert.equal(near.mops, mops)
}

// --- the new patrons ----------------------------------------------------------------
{
  // Toddler-bot: pushed half as far, and always back for seconds.
  const game = shiftAt(0, 1)
  const tot = game.makeRobot(0, 150, 'toddler', '#38bdf8')
  tot.order = 'plain'
  game.robots.push(tot)
  pour(game, 'plain', 0)
  for (let t = 0; t < 200 && tot.state === 'walk'; t++) game.update(frame())
  assert.equal(tot.state, 'pushed')
  const x0 = tot.x
  for (let t = 0; t < 200 && state(tot) === 'pushed'; t++) game.update(frame())
  assert.ok(
    x0 - tot.x <= game.rules.push * 0.5 + 3,
    'a toddler is pushed back half as far',
  )
  for (let t = 0; t < 200 && state(tot) === 'drink'; t++) game.update(frame())
  assert.equal(tot.state, 'walk', 'and comes back for a second mug')
  assert.equal(tot.refills, 0)

  // The trio walks in together on one counter.
  const trio = shiftAt(0, 2)
  trio.rules = { ...trio.rules, patrons: ['trio'] }
  trio.toSpawn = 3
  trio.spawnTimer = 1
  trio.update(frame())
  assert.equal(trio.robots.length, 3, 'three friends at once')
  assert.equal(new Set(trio.robots.map((r) => r.row)).size, 1, 'one counter')
  assert.equal(trio.toSpawn, 0)

  // Surfer-bot: rides in fast, then shuffles.
  const surf = shiftAt(1, 1)
  const s = surf.makeRobot(2, 20, 'surfer', '#38bdf8')
  s.surfTo = 120
  surf.robots.push(s)
  idle(surf, 30)
  assert.ok(s.x > 80, 'the wave carries it in')
  idle(surf, 40)
  assert.equal(s.surfTo, null, 'the wave breaks')
  const sx = s.x
  idle(surf, 60)
  assert.ok(s.x - sx < 40, 'then it only shuffles')

  // Seagull-bot: its shadow glides in, then it swoops on a mug under it.
  const gull = shiftAt(1, 2)
  gull.rules = { ...gull.rules, patrons: ['seagull'] }
  gull.toSpawn = 2
  gull.spawnTimer = 1
  gull.update(frame())
  assert.equal(gull.gulls.length, 1)
  const bird = gull.gulls[0]!
  assert.equal(bird.state, 'glide', 'first the shadow crosses the counter')
  gull.mugs.push({
    row: bird.row,
    x: bird.target + 2,
    full: true,
    topping: 'plain',
    back: false,
    from: bird.target + 2,
  })
  // Keep the mug parked under the swoop.
  for (let t = 0; t < 100 && !bird.carrying; t++) {
    gull.mugs.forEach((m) => {
      m.x = bird.target + 2
      m.from = m.x
    })
    gull.update(frame())
  }
  assert.ok(bird.carrying, 'it snatches a mug poured into the swoop')
  assert.equal(gull.shiftClean, false)

  // VIP: a gold bubble, always a topped drink; a perfect serve is a quarter meter, twice the points.
  const vip = shiftAt(0, 3)
  const v = vip.makeRobot(0, 160, 'vip', '#facc15')
  assert.notEqual(v.order, 'plain', 'a VIP always wants it topped')
  v.order = 'marshmallow'
  vip.robots.push(v)
  vip.cozy = 0
  pour(vip, 'marshmallow', 0)
  for (let t = 0; t < 200 && v.state === 'walk'; t++) vip.update(frame())
  assert.equal(v.state, 'pushed')
  assert.equal(vip.cozy, COZY.max / 4, 'a quarter of the Cozy meter')
  assert.equal(vip.score, 80 * 2, 'double points')
}

// --- the Snow Golem Regular -----------------------------------------------------------
{
  const game = shiftAt(0, RUSH_HOUR)
  game.robots = []
  game.spawnBoss('golem')
  const golem = game.robots[0]!
  assert.equal(golem.boss!.hp, BOSSES.golem.hp[0])
  golem.row = 0
  golem.x = 120
  // His arm winds up first (the tell), then a snowball knocks a sliding mug off.
  golem.boss!.cool = 1
  game.update(frame())
  assert.ok(golem.boss!.tell > 0, 'the arm winds up')
  for (let t = 0; t < 60 && game.snowballs.length === 0; t++) {
    golem.x = 120
    game.update(frame())
  }
  assert.equal(game.snowballs.length, 1, 'a snowball is lobbed')
  game.mugs.push({
    row: 0,
    x: game.snowballs[0]!.x + 30,
    full: true,
    topping: 'plain',
    back: false,
    from: game.snowballs[0]!.x + 30,
  })
  for (let t = 0; t < 30 && game.mugs.length; t++) {
    golem.x = 120
    game.update(frame())
  }
  assert.equal(game.mugs.length, 0, 'the snowball knocks the mug off')
  assert.equal(game.shiftClean, false)
  // Serve him: each right mug is one step back; phase 2 splits head and body.
  const serveGolem = () => {
    for (const part of game.robots.filter(
      (r) => r.boss && r.state !== 'melt',
    )) {
      if (part.state !== 'walk') continue
      part.boss!.cool = 999
      game.mugs.push({
        row: part.row,
        x: part.x + 10,
        full: true,
        topping: part.order,
        back: false,
        from: part.x + 10,
      })
      game.update(frame())
    }
    idle(game, 8)
  }
  for (let i = 0; i < 40 && game.robots.length < 2; i++) serveGolem()
  assert.equal(game.robots.length, 2, 'phase 2: the head hops off')
  assert.deepEqual(game.robots.map((r) => r.boss!.part).sort(), [
    'body',
    'head',
  ])
  assert.notEqual(game.robots[0]!.row, game.robots[1]!.row, 'two counters')
  const before = game.score
  for (let i = 0; i < 80 && game.robots.length; i++) serveGolem()
  idle(game, 130)
  assert.equal(game.robots.length, 0, 'phase 3: he melts, smiling')
  assert.ok(game.score - before >= BOSSES.golem.bonus, 'the regular bonus')
}

// --- Captain Crab ---------------------------------------------------------------------
{
  const game = shiftAt(1, RUSH_HOUR)
  game.robots = []
  game.spawnBoss('crab')
  const crab = game.robots[0]!
  crab.row = 1
  crab.x = 120
  crab.boss!.cool = 9999
  const send = (topping: Topping) => {
    game.mugs.push({
      row: crab.row,
      x: crab.x + 12,
      full: true,
      topping,
      back: false,
      from: crab.x + 12,
    })
    game.update(frame())
    idle(game, 12)
  }
  send('marshmallow')
  assert.ok(
    game.mugs.some((m) => m.back),
    'a mango is clawed back full',
  )
  game.mugs = []
  send('plain')
  send('plain')
  assert.equal(crab.boss!.onRow, 2)
  // Click-clack: he sidesteps, and the count on this row starts again.
  crab.boss!.cool = 1
  crab.boss!.toRow = 1
  for (let t = 0; t < 80 && crab.boss!.onRow > 0; t++) {
    crab.x = 120
    game.update(frame())
  }
  assert.notEqual(crab.row, 1, 'he moved to another counter')
  assert.equal(crab.boss!.onRow, 0, 'three must come on one row')
  crab.boss!.cool = 9999
  crab.boss!.tell = 0
  for (let stage = 0; stage < BOSSES.crab.hp.length; stage++)
    for (let i = 0; i < BOSSES.crab.hp[stage]!; i++) {
      crab.x = 120
      crab.state = 'walk'
      send('plain')
    }
  assert.equal(crab.state, 'leave', 'three times three: he dances home')
  const before = game.score
  idle(game, 200)
  assert.equal(game.robots.length, 0)
  assert.ok(game.score - before >= BOSSES.crab.bonus)
}

// --- bonus rounds ------------------------------------------------------------------------
{
  const swaps = shuffleSwaps(mulberry32(4), 6, 20)
  assert.ok(swaps.every(([a, b]) => a !== b && a < 6 && b < 6))
  assert.equal(followCup(2, [[2, 5]]), 5)
  assert.equal(followCup(2, [[1, 5]]), 2)

  const win = new MarshmallowMixup(mulberry32(8), 1)
  for (let t = 0; t < 5000 && !win.done; t++) win.update(win.pilot())
  assert.ok(win.done)
  assert.equal(win.result!.points, MIXUP.winPoints, 'the pilot follows the cup')
  assert.ok(win.result!.coins > 0)
  const miss = new MarshmallowMixup(mulberry32(8), 1)
  for (let t = 0; t < 5000 && !miss.done; t++) {
    const f = emptyInput()
    if (miss.phase === 'pick') {
      miss.cursor = (miss.answer + 1) % MIXUP.cups
      f.pressed.a = true
    }
    miss.update(f)
  }
  assert.equal(miss.result!.points, MIXUP.missPoints, 'a wrong cup: so close')

  const nuts = new CatchTheCoconuts(mulberry32(8), 1)
  for (let t = 0; t < 5000 && !nuts.done; t++) nuts.update(nuts.pilot())
  assert.ok(nuts.done && nuts.caught + nuts.golden > 5, 'coconuts are caught')
  assert.ok(nuts.result!.points > 0)
  const lazy = new CatchTheCoconuts(mulberry32(8), 1)
  for (let t = 0; t < 5000 && !lazy.done; t++) lazy.update(emptyInput())
  assert.ok(lazy.caught + lazy.golden < nuts.caught + nuts.golden)
  const g = fakeCtx()
  win.render(g, 1)
  nuts.render(g, 1)
}

// --- the select screen, the save and the Cafe Fund ------------------------------------------
{
  assert.equal(readCocoaSave(null), null)
  assert.equal(readCocoaSave({ v: 2 }), null)
  const junk = readCocoaSave({
    v: 1,
    golden: ['seaside', 'moon', 'seaside', 7],
    tour: { venue: 9, score: 1, lives: 2, fund: 0, upgrades: [] },
  })!
  assert.deepEqual(junk.golden, ['seaside'], 'unknown venues dropped')
  assert.equal(junk.tour, null, 'a tour past the built venues is ignored')

  const headless = open()
  assert.equal(headless.stage, 'play', 'tests and demos start playing at once')
  assert.equal(headless.mode, 'endless')

  const fresh = open({ selectScreen: true })
  assert.equal(fresh.stage, 'menu')
  assert.deepEqual(fresh.menu!.items, ['tour', 'endless'])
  fresh.update(frame({ a: true }, { a: true }))
  assert.equal(fresh.mode, 'tour')
  assert.equal(fresh.stage, 'title', "the Snowdrop Cafe's title card")
  assert.deepEqual(
    (fresh.save as { tour: { venue: number } }).tour.venue,
    0,
    'the tour saves at each venue',
  )
  idle(fresh, 220)
  assert.equal(fresh.stage, 'play')
  assert.equal(fresh.shift, 1)
  assert.equal(fresh.music !== null, true, 'each venue has its music')

  const kept = {
    v: 1,
    golden: ['snowdrop'],
    tour: { venue: 1, score: 54321, lives: 2, fund: 9, upgrades: ['mop'] },
  }
  const back = open({ selectScreen: true, resume: kept })
  assert.deepEqual(back.menu!.items, ['continue', 'tour', 'endless'])
  back.update(frame({ a: true }, { a: true }))
  assert.equal(back.venueIndex, 1, 'continues at the Seaside Smoothie Shack')
  assert.equal(back.score, 54321)
  assert.equal(back.lives, 2)
  assert.equal(back.fund, 9)
  assert.ok(back.golden.has('snowdrop'), 'golden mugs are kept')
  idle(back, 220)
  assert.equal(back.mops, 3, 'the third mop came along')

  // Endless from the menu keeps the saved tour to continue later.
  const endless = open({ selectScreen: true, resume: kept })
  endless.update(frame({ down: true }, { down: true }))
  endless.update(frame({ down: true }, { down: true }))
  endless.update(frame({ a: true }, { a: true }))
  assert.equal(endless.mode, 'endless')
  assert.deepEqual(
    (endless.save as { tour: unknown }).tour,
    kept.tour,
    'the tour save survives a game of Endless',
  )

  // A clean shift wins the venue's golden mug, and it is saved.
  const gold = shiftAt(0, 1)
  gold.shiftClean = true
  gold.roundClear()
  assert.ok(gold.golden.has('snowdrop'))
  assert.deepEqual((gold.save as { golden: string[] }).golden, ['snowdrop'])
  const spilt = shiftAt(0, 2)
  spilt.shiftClean = false
  spilt.roundClear()
  assert.ok(!spilt.golden.has('snowdrop'))

  // The Cafe Fund shop: buy what you can afford, once.
  const shop = shiftAt(0, 1)
  shop.stage = 'shop'
  shop.stageTicks = 9999
  shop.fund = 7
  shop.shopCursor = UPGRADES.findIndex((u) => u.id === 'pour')
  shop.update(frame({ a: true }, { a: true }))
  assert.ok(shop.upgrades.has('pour'))
  assert.equal(shop.fund, 1)
  shop.shopCursor = UPGRADES.findIndex((u) => u.id === 'cozy')
  shop.update(frame({ a: true }, { a: true }))
  assert.ok(!shop.upgrades.has('cozy'), 'not enough in the fund')
  shop.shopCursor = UPGRADES.length
  shop.update(frame({ a: true }, { a: true }))
  assert.equal(shop.stage, 'title', 'on to the next cafe')
  assert.equal(shop.venueIndex, 1)
  idle(shop, 220)
  shop.x = TAP_X
  shop.update(frame({ a: true }, { a: true }))
  assert.equal(shop.pouring?.base, FAST_POUR_TICKS, 'the faster pour')

  // Game over on the tour clears the resume point but keeps golden mugs.
  const over = shiftAt(0, 1)
  over.golden.add('snowdrop')
  over.lives = 1
  const r = over.makeRobot(2, 260, 'thirsty', '#38bdf8')
  over.robots.push(r)
  for (let t = 0; t < 600 && !over.over; t++) over.update(frame())
  assert.ok(over.over)
  assert.deepEqual(over.save, { v: 1, golden: ['snowdrop'], tour: null })
}

// --- pilot probe ---------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'cocoa-counter')!
  const demo = cocoaCounter.create({
    rng: mulberry32(7),
    sound: quiet,
    demo: true,
    hiScore: 0,
    selectScreen: true,
  }) as unknown as Game
  for (let t = 0; t < 60 * 60 * 3 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo never scores')
  assert.equal(demo.save, undefined, 'the demo keeps no save')

  const g = fakeCtx()
  const tour = (seed: number) => {
    const game = open({ seed, selectScreen: true })
    const stages = new Set<string>()
    let ticks = 0
    for (; ticks < 60 * 60 * 60 && !game.over; ticks++) {
      game.update(game.demoInput())
      stages.add(`${game.mode}:${game.stage}:${game.venueIndex}`)
      if (ticks % 400 === 0) game.render(g)
    }
    return { game, stages, ticks }
  }
  const one = tour(11)
  const again = tour(11)
  assert.equal(one.game.score, again.game.score, 'one seed, one score')
  assert.equal(one.ticks, again.ticks)
  assert.ok(one.game.over, 'the tour pilot run ends')
  assert.ok(one.game.score <= meta.maxPlausibleScore)
  for (const s of [
    'tour:title:0',
    'tour:bonus:0',
    'tour:shop:0',
    'tour:title:1',
    'tour:bonus:1',
    'tour:tourEnd:1',
  ])
    assert.ok(one.stages.has(s), `the pilot reaches ${s}`)
  console.log(
    `tour pilot: score ${one.game.score}, ${one.ticks} ticks, golden ${[...one.game.golden]}`,
  )
  for (const seed of [2, 5]) {
    const r = tour(seed)
    assert.ok(r.game.over && r.game.score <= meta.maxPlausibleScore)
  }
}

console.log('verifyCabinetCocoaCounterTour: ok')
