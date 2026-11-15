// /utils/scripts/verifyCabinetCocoaCounterOrders.test.ts
//
// Cocoa Counter depth pass, slice 1 (conductor kr-arcade/t-122), Orders and the Cozy core:
// tap / hold / hold-and-B pours, wrong drinks handed back full, the Cozy meter and Sing-along,
// tips that fill the meter and the Cafe Fund (and the tip-stealing hook), the Rush combo, the
// Juggle bonus, extra mug-bots, the data tables and the Endless Shift ladder that keeps climbing
// past the old round-12 plateau. Ends with a pilot probe that serves mixed orders, shows runs
// still end, stay under the registry ceiling, and that the attract demo scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetCocoaCounterOrders.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import cocoaCounter, { cocoaGuide } from '../arcade/games/cocoaCounter'
import {
  COCOA_CURVES,
  POUR_TICKS,
  RUSH_AFTER,
  TOPPING_TICKS,
  comboMultiplier,
  extraMugBotsBetween,
  isJuggle,
  newPour,
  pickOrder,
  pourStep,
  rushCounts,
  shiftRules,
  venueForRound,
} from '../arcade/cocoaCounter/rules'
import {
  COUNTER_FEATURES,
  COZY,
  ENDLESS_LADDER,
  HANDBACK_CATCH_POINTS,
  JUGGLE_POINTS,
  OLD_PLATEAU,
  PATRONS,
  RUSH_STEPS,
  TOPPINGS,
  VENUES,
} from '../arcade/cocoaCounter/tables'
import type { Topping } from '../arcade/cocoaCounter/tables'
import { emptyInput, type InputFrame } from '../arcade/types'

type Robot = {
  row: number
  x: number
  state: string
  timer: number
  phase: number
  color: string
  thirsty: boolean
  patron: 'thirsty'
  order: Topping
  stealsTips: boolean
}
type Mug = {
  row: number
  x: number
  full: boolean
  topping: Topping
  back: boolean
}
type Tip = {
  row: number
  x: number
  life: number
  points: number
  coins: number
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  row: number
  x: number
  pouring: { ticks: number } | null
  robots: Robot[]
  mugs: Mug[]
  tips: Tip[]
  toSpawn: number
  spawnTimer: number
  cozy: number
  singing: number
  streak: number
  fund: number
  cleanRound: boolean
  lastCatchTick: number
  banner: { text: string; sub?: string; note?: string } | null
  rules: ReturnType<typeof shiftRules>
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  demoInput(): InputFrame
  serve(robot: Robot, mug: Mug): void
  handBack(robot: Robot, mug: Mug): void
  roundClear(): void
  startRound(round: number): void
}

const quiet = { play: () => {} }
const TAP_X = 284
const REACH_X = TAP_X - 14

/** A drawing context that accepts every call: enough to prove a frame paints without throwing. */
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

function play(seed = 3, demo = false): Game {
  return cocoaCounter.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as unknown as Game
}

/** An empty cafe where nobody walks in (one robot waits, forever, so the round never clears). */
function calm(game: Game): Game {
  game.robots = []
  game.mugs = []
  game.tips = []
  game.toSpawn = 1
  game.spawnTimer = 1_000_000
  game.banner = null
  game.row = 0
  game.x = TAP_X
  return game
}

function robot(row: number, x: number, order: Topping): Robot {
  return {
    row,
    x,
    state: 'walk',
    timer: 0,
    phase: 0,
    color: '#38bdf8',
    thirsty: false,
    patron: 'thirsty',
    order,
    stealsTips: false,
  }
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

/** Pour one mug the way a player would: tap, hold, or hold and press B. */
function pour(game: Game, topping: Topping) {
  game.update(frame({ a: true }, { a: true }))
  assert.ok(game.pouring, 'A at the urn starts a pour')
  for (let t = 0; t < POUR_TICKS + TOPPING_TICKS + 2 && game.pouring; t++) {
    const held = topping !== 'plain'
    const b = topping === 'swirl' && t === 2
    game.update(frame({ a: held, b }, { b }))
  }
  assert.equal(game.pouring, null, 'the pour finishes')
}

// --- the pour: tap, hold, hold-and-B ----------------------------------------
{
  const tap = newPour()
  let out: Topping | null = null
  for (let t = 0; t < POUR_TICKS && !out; t++) out = pourStep(tap, false, false)
  assert.equal(out, 'plain', 'a tap pours plain cocoa once the cocoa is in')
  assert.equal(tap.ticks, POUR_TICKS)

  const hold = newPour()
  out = null
  let t = 0
  for (; t < 100 && !out; t++) out = pourStep(hold, true, false)
  assert.equal(out, 'marshmallow', 'holding A heaps marshmallows on')
  assert.equal(t, POUR_TICKS + TOPPING_TICKS, 'the topping is a longer pour')

  const early = newPour()
  out = null
  for (t = 0; t < 100 && !out; t++)
    out = pourStep(early, t < POUR_TICKS + 4, false)
  assert.equal(out, 'plain', 'letting go before the topping is in pours plain')

  const swirl = newPour()
  out = null
  for (t = 0; t < 100 && !out; t++) out = pourStep(swirl, true, t === 3)
  assert.equal(out, 'swirl', 'hold A and press B: a peppermint swirl')
  assert.equal(t, POUR_TICKS, 'a swirl goes out as soon as the cocoa is in')

  const late = newPour()
  out = null
  for (t = 0; t < 100 && !out; t++) out = pourStep(late, t < 1, t === 3)
  assert.equal(out, 'plain', 'B after letting go of A is no swirl')
}

// --- rules: combo, extra mug-bots, juggles ----------------------------------
{
  assert.equal(comboMultiplier(0), 1)
  assert.equal(comboMultiplier(3), 1)
  assert.equal(comboMultiplier(4), 2)
  assert.equal(comboMultiplier(15), 4)
  assert.equal(comboMultiplier(16), 5)
  assert.equal(comboMultiplier(400), 5, 'the Rush combo tops out at x5')
  assert.equal(extraMugBotsBetween(29_999, 30_000), 1)
  assert.equal(extraMugBotsBetween(30_000, 30_050), 0)
  assert.equal(extraMugBotsBetween(0, 200_000), 3, 'mug-bots at 30k, 80k, 150k')
  assert.ok(isJuggle(100, 108) && isJuggle(108, 100) && !isJuggle(100, 109))
}

// --- the tables: venue / counter feature / patron format ---------------------
{
  assert.ok(VENUES.length >= 1)
  for (const venue of VENUES) {
    assert.equal(venue.counters.length, 4, `${venue.id}: four counters`)
    for (const c of venue.counters)
      assert.ok(COUNTER_FEATURES[c.feature], `${venue.id}: known feature`)
    for (const p of venue.patrons) assert.ok(PATRONS[p], `${venue.id}: ${p}`)
  }
  assert.equal(venueForRound(1).id, 'snowdrop', 'the tour starts at Snowdrop')
  for (let r = 1; r <= 40; r++) assert.ok(venueForRound(r))
  assert.equal(PATRONS.thirsty.stealsTips, false)
  for (const def of Object.values(PATRONS)) {
    assert.ok(def.tipChance > 0 && def.tipChance < 1)
    assert.ok(def.tell.length && def.answer.length)
  }
  assert.ok(cocoaGuide().length >= 3, 'the table guide explains the orders')
  for (const page of cocoaGuide())
    for (const line of page.lines)
      assert.ok(line.length <= 52, `guide line fits: ${line}`)
}

// --- Endless Shift: something new each round, then a rush that never plateaus
{
  for (let r = 1; r <= ENDLESS_LADDER.length; r++)
    assert.equal(shiftRules(r).news, ENDLESS_LADDER[r - 1]!.banner)
  assert.deepEqual(shiftRules(1).toppings, ['plain'])
  assert.equal(shiftRules(1).topped, 0, 'round 1 orders plain cocoa only')
  assert.deepEqual(shiftRules(2).toppings, ['plain', 'marshmallow'])
  assert.deepEqual(shiftRules(3).toppings, ['plain', 'marshmallow', 'swirl'])
  const rng = mulberry32(5)
  for (let i = 0; i < 200; i++)
    assert.equal(pickOrder(rng, shiftRules(1)), 'plain')
  const seen = new Set<Topping>()
  for (let i = 0; i < 300; i++) seen.add(pickOrder(rng, shiftRules(6)))
  assert.deepEqual([...seen].sort(), ['marshmallow', 'plain', 'swirl'])

  // The old curves stopped at round 12; the shift keeps climbing past it.
  assert.equal(RUSH_AFTER, OLD_PLATEAU)
  const plateau = shiftRules(OLD_PLATEAU)
  assert.equal(
    plateau.robots,
    COCOA_CURVES.robots.limit,
    'round 12 is where the old crowd stopped',
  )
  for (let r = OLD_PLATEAU + 1; r <= 50; r++) {
    const a = shiftRules(r - 1)
    const b = shiftRules(r)
    assert.ok(b.news, `round ${r} announces its rush step`)
    assert.ok(b.robots >= a.robots && b.walk >= a.walk && b.gap <= a.gap)
    assert.ok(b.empty >= a.empty - 1e-9 && b.topped >= a.topped - 1e-9)
    const harder =
      b.robots > a.robots ||
      b.walk > a.walk ||
      b.gap < a.gap ||
      b.empty > a.empty + 1e-9 ||
      b.topped > a.topped + 1e-9
    assert.ok(harder, `round ${r} is harder than round ${r - 1}`)
  }
  assert.equal(rushCounts(0).last, null)
  assert.equal(rushCounts(1).last, RUSH_STEPS[0]!.id)
  assert.equal(rushCounts(RUSH_STEPS.length + 1).counts.crowd, 2)
  for (let r = OLD_PLATEAU + 1; r <= 200; r++)
    assert.ok(
      shiftRules(r).robots > shiftRules(r - 1).robots ||
        shiftRules(r).walk > shiftRules(r - 1).walk ||
        shiftRules(r).gap < shiftRules(r - 1).gap ||
        shiftRules(r).empty > shiftRules(r - 1).empty + 1e-9 ||
        shiftRules(r).topped > shiftRules(r - 1).topped + 1e-9,
      `no plateau at round ${r}`,
    )
  assert.ok(shiftRules(200).walk < 2.4, 'robots never outrun a sliding mug')
  assert.ok(shiftRules(200).gap >= 30)
  assert.ok(shiftRules(200).empty < 2.4)

  const game = play()
  game.startRound(2)
  assert.equal(game.banner?.note, ENDLESS_LADDER[1]!.banner)
  game.startRound(OLD_PLATEAU + 1)
  assert.equal(game.banner?.note, RUSH_STEPS[0]!.banner)
  assert.equal(game.toSpawn, shiftRules(OLD_PLATEAU + 1).robots)
}

// --- orders: the right drink is served, the wrong one handed back full ------
{
  for (const topping of ['plain', 'marshmallow', 'swirl'] as const) {
    const game = calm(play())
    const thirsty = robot(0, 180, topping)
    game.robots.push(thirsty)
    pour(game, topping)
    assert.equal(game.mugs[0]?.topping, topping, `${topping}: poured right`)
    for (let t = 0; t < 120 && thirsty.state === 'walk'; t++)
      game.update(frame())
    assert.equal(thirsty.state, 'pushed', `${topping}: the robot is served`)
    assert.equal(
      game.score,
      TOPPINGS[topping].points,
      `${topping}: serve points`,
    )
    assert.equal(game.cozy, TOPPINGS[topping].cozy, `${topping}: cozy fills`)
    assert.equal(game.streak, 1)
  }

  // Wrong drink: politely handed back, still full, and it comes home.
  const game = calm(play())
  const picky = robot(0, 200, 'plain')
  game.robots.push(picky)
  game.streak = 6
  pour(game, 'marshmallow')
  for (let t = 0; t < 120 && picky.state === 'walk'; t++) game.update(frame())
  assert.equal(picky.state, 'refuse', 'a wrong drink is turned down')
  assert.equal(game.streak, 0, 'a wrong drink ends the Rush combo')
  assert.equal(game.cleanRound, false)
  const back = game.mugs.find((m) => m.back)
  assert.ok(back && back.full, 'the mug comes back full')
  const x0 = back.x
  game.update(frame())
  assert.ok(back.x > x0, 'the handed-back mug slides toward the urn')
  const scoreBefore = game.score
  for (let t = 0; t < 400 && game.mugs.length; t++) game.update(frame())
  assert.equal(game.mugs.length, 0)
  assert.equal(game.score, scoreBefore + HANDBACK_CATCH_POINTS, 'caught it')
  assert.equal(game.lives, 3, 'a caught hand-back costs nothing')
  assert.equal(picky.state, 'walk', 'the robot shuffles on, still waiting')

  // Let it fall and it is a lost mug, like an empty.
  const miss = calm(play())
  const fussy = robot(0, 200, 'swirl')
  miss.robots.push(fussy)
  pour(miss, 'plain')
  for (let t = 0; t < 120 && fussy.state === 'walk'; t++) miss.update(frame())
  assert.equal(fussy.state, 'refuse')
  miss.update(frame({ down: true }))
  assert.equal(miss.row, 1, 'the mug-bot hops away')
  for (let t = 0; t < 400 && miss.lives === 3; t++) miss.update(frame())
  assert.equal(miss.lives, 2, 'a handed-back mug that falls costs a mug-bot')
}

// --- the Rush combo and its multiplier ---------------------------------------
{
  const game = calm(play())
  const a = robot(0, 180, 'plain')
  game.robots.push(a)
  game.streak = 3
  pour(game, 'plain')
  for (let t = 0; t < 120 && a.state === 'walk'; t++) game.update(frame())
  assert.equal(game.streak, 4)
  assert.equal(game.score, TOPPINGS.plain.points * 2, 'x2 from the 4th serve')
  game.streak = 40
  const b = robot(0, 180, 'plain')
  game.robots = [b]
  const before = game.score
  pour(game, 'plain')
  for (let t = 0; t < 120 && b.state === 'walk'; t++) game.update(frame())
  assert.equal(game.score - before, TOPPINGS.plain.points * 5, 'x5 at most')
}

// --- the Juggle bonus ---------------------------------------------------------
{
  const game = calm(play())
  const empty = game.rules.empty
  // An empty that lands two ticks before this pour goes out.
  game.mugs.push({
    row: 0,
    x: TAP_X - 7 - empty * (POUR_TICKS - 1),
    full: false,
    topping: 'plain',
    back: false,
  })
  pour(game, 'plain')
  assert.equal(
    game.score,
    100 + JUGGLE_POINTS,
    'catch an empty as a pour goes out: Juggle',
  )
  assert.ok(game.cozy >= COZY.empty + COZY.juggle)

  // A catch long before the pour is no juggle.
  const slow = calm(play())
  slow.mugs.push({
    row: 0,
    x: TAP_X - 4,
    full: false,
    topping: 'plain',
    back: false,
  })
  idle(slow, 20)
  pour(slow, 'plain')
  assert.equal(slow.score, 100, 'no juggle without the timing')
}

// --- the Cozy meter and the Sing-along -----------------------------------------
{
  const game = calm(play())
  game.update(frame({ b: true }, { b: true }))
  assert.equal(game.singing, 0, 'B on an unfilled meter does nothing')
  game.cozy = COZY.max - 1
  const a = robot(0, 180, 'plain')
  game.robots.push(a)
  pour(game, 'plain')
  for (let t = 0; t < 120 && a.state === 'walk'; t++) game.update(frame())
  assert.equal(game.cozy, COZY.max, 'a right drink tops the meter up')
  const walker = robot(2, 120, 'plain')
  game.robots.push(walker)
  game.toSpawn = 3
  game.spawnTimer = 1
  game.update(frame({ b: true }, { b: true }))
  assert.equal(game.singing, COZY.singTicks - 0, 'B starts the Sing-along')
  assert.equal(game.cozy, 0, 'the meter is spent')
  const x0 = walker.x
  idle(game, COZY.singTicks - 2)
  assert.equal(walker.x, x0, 'everyone stops to sway')
  assert.equal(game.toSpawn, 3, 'nobody new walks in during the song')
  idle(game, 80)
  assert.ok(walker.x > x0, 'the song ends and the shuffle resumes')

  // A clean round of right drinks fills the meter for the next round.
  const clean = calm(play())
  clean.cleanRound = true
  clean.roundClear()
  assert.equal(clean.cozy, COZY.max)
  const messy = calm(play())
  messy.cleanRound = false
  messy.roundClear()
  assert.equal(messy.cozy, 0)

  // Holding A and pressing B pours a swirl rather than singing.
  const both = calm(play())
  both.cozy = COZY.max
  both.update(frame({ a: true }, { a: true }))
  both.update(frame({ a: true, b: true }, { b: true }))
  assert.equal(both.singing, 0, 'hold-and-B is the swirl, not the song')
  assert.equal(both.cozy, COZY.max)
}

// --- tips: the meter, the Cafe Fund, and the tip-stealing hook ---------------
{
  const game = calm(play())
  game.tips.push({ row: 0, x: TAP_X, life: 200, points: 250, coins: 1 })
  game.update(frame())
  assert.equal(game.score, 250)
  assert.equal(game.fund, 1, 'a tip pays into the Cafe Fund')
  assert.equal(game.cozy, COZY.tip, 'and fills the Cozy meter')

  const thief = calm(play())
  const sneak = robot(1, 100, 'plain')
  sneak.stealsTips = true
  const honest = robot(2, 100, 'plain')
  thief.robots.push(sneak, honest)
  thief.tips.push(
    { row: 1, x: 101, life: 200, points: 250, coins: 1 },
    { row: 2, x: 101, life: 200, points: 250, coins: 1 },
  )
  thief.update(frame())
  assert.equal(thief.tips.length, 1, 'a tip-stealer pockets the tip it reaches')
  assert.equal(thief.tips[0]!.row, 2, 'an honest robot leaves its tip be')
  assert.equal(thief.fund, 0)
  assert.equal(thief.score, 0)
}

// --- extra mug-bots ------------------------------------------------------------
{
  const game = calm(play())
  game.score = 29_990
  const a = robot(0, 180, 'plain')
  game.robots.push(a)
  pour(game, 'plain')
  for (let t = 0; t < 120 && a.state === 'walk'; t++) game.update(frame())
  assert.equal(game.lives, 4, 'an extra mug-bot at 30,000')
  assert.equal(game.banner?.text, 'EXTRA MUG-BOT!')
}

// --- render: bubbles, hand-backs, the song and the HUD paint ------------------
{
  const g = fakeCtx()
  const game = calm(play())
  game.robots.push(
    robot(0, 120, 'marshmallow'),
    robot(1, REACH_X - 10, 'swirl'),
  )
  game.robots[1]!.state = 'refuse'
  game.mugs.push({ row: 0, x: 200, full: true, topping: 'swirl', back: true })
  game.cozy = COZY.max
  game.render(g)
  game.update(frame({ a: true }, { a: true }))
  for (let t = 0; t < POUR_TICKS + 4; t++) {
    game.update(frame({ a: true }))
    game.render(g)
  }
  game.update(frame({ b: true }, { b: true }))
  game.render(g)
}

// --- pilot probe ----------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'cocoa-counter')!
  assert.ok(meta, 'cocoa-counter is registered')

  // The attract demo pours mixed orders, sings, and still never scores.
  const demo = play(7, true)
  for (let t = 0; t < 60 * 60 * 6 && !demo.over; t++) {
    demo.update(emptyInput())
    if (t % 120 === 0) demo.render(fakeCtx())
  }
  assert.equal(demo.score, 0, 'the attract demo never scores')

  // The pilot playing for real: it reads the bubbles, serves every kind of order, and the run
  // still ends, under the registry's ceiling, the same way every time for one seed.
  const run = (seed: number) => {
    const game = play(seed)
    const served: Record<Topping, number> = {
      plain: 0,
      marshmallow: 0,
      swirl: 0,
    }
    let wrong = 0
    let sang = 0
    const serve = game.serve.bind(game)
    game.serve = (r, m) => {
      served[m.topping]++
      serve(r, m)
    }
    const handBack = game.handBack.bind(game)
    game.handBack = (r, m) => {
      wrong++
      handBack(r, m)
    }
    let ticks = 0
    for (; ticks < 60 * 60 * 90 && !game.over; ticks++) {
      const singing = game.singing
      game.update(game.demoInput())
      if (game.singing > singing) sang++
    }
    return { game, served, wrong, sang, ticks }
  }
  const one = run(11)
  const again = run(11)
  assert.equal(one.game.score, again.game.score, 'one seed, one score')
  assert.equal(one.ticks, again.ticks)
  assert.ok(one.game.over, 'the pilot run still ends')
  assert.ok(one.game.score > 0)
  assert.ok(one.game.score <= meta.maxPlausibleScore, 'under the ceiling')
  assert.ok(one.served.marshmallow > 0, 'the pilot serves marshmallows')
  assert.ok(one.served.swirl > 0, 'the pilot serves swirls')
  assert.ok(one.served.plain > 0, 'the pilot serves plain cocoa')
  assert.ok(one.sang > 0, 'the pilot sings along')
  const total = one.served.plain + one.served.marshmallow + one.served.swirl
  assert.ok(one.wrong < total / 4, 'the pilot mostly reads the bubbles right')
  console.log(
    `pilot: round ${one.game.level}, score ${one.game.score}, ` +
      `${one.ticks} ticks, served ${JSON.stringify(one.served)}, ` +
      `${one.wrong} handed back, ${one.sang} sing-alongs`,
  )
  for (const seed of [2, 5, 23]) {
    const r = run(seed)
    assert.ok(r.game.over, `seed ${seed}: the run ends`)
    assert.ok(r.game.score <= meta.maxPlausibleScore)
  }
}

console.log('verifyCabinetCocoaCounterOrders: ok')
