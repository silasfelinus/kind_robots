// /utils/scripts/verifyCabinetGloomInvadersWeather.test.ts
//
// Gloom Invaders depth pass, slice 1 "Weather and the garden" (conductor kr-arcade/t-132): the
// 11 x 5 grid and the other formations as data (with their paths), the five drop types, the
// drizzler, splitter puff, diver gust, hailer and thunderhead, the Sun Lance, the heartbeat loop,
// The Garden Grows Back (watering, all five helpers, wilting), Classic Sky behind the mode select,
// and a pilot probe showing runs still end and the attract demo scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetGloomInvadersWeather.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import gloomInvaders, {
  DIVE_TELL,
  LANCE_CHARGE,
  SWOOP_TICKS,
  swoopPoint,
} from '../arcade/games/gloomInvaders'
import {
  BERRY_AT,
  BLOOM_AT,
  HELPER_TICKS,
  PLOTS,
  PLOT_HELPERS,
  newGarden,
  plotCenter,
  plotIndex,
  waterPlot,
  wiltPlot,
} from '../arcade/gloomInvaders/garden'
import type { HelperKind, Plot } from '../arcade/gloomInvaders/garden'
import {
  CELL_H,
  CLASSIC_FRONT,
  CLOUD_KINDS,
  CLOUD_W,
  DRIZZLE_SEEK,
  DROP_Y,
  HEARTBEAT_LOOPS,
  SLEET_AMP,
  SLEET_PERIOD,
  SPLIT_PAIR_BONUS,
  STRIKE_TELL,
  W,
  WEATHER_FRONTS,
  bounceHail,
  formationSlots,
  heartbeatTier,
  marchStep,
  newDrop,
  newFormation,
  rainKind,
  slotHome,
  stepDrop,
  weatherFront,
  zigzag,
} from '../arcade/gloomInvaders/weather'
import type {
  CloudKind,
  Drop,
  FormationSpec,
} from '../arcade/gloomInvaders/weather'
import { SPRING_SUMMER_FRONTS, calendarFront } from '../arcade/gloomInvaders/calendar'
import { readGloomCalendarSave } from '../arcade/gloomInvaders/calendarSave'
import { parseLoop } from '../arcade/sound'
import type { MusicLoop } from '../arcade/sound'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

type Cloud = {
  kind: CloudKind
  row: number
  col: number
  alive: boolean
  hp: number
  x: number
  y: number
  w: number
  h: number
  hx: number
  hy: number
  tell: number
  tellKind: string | null
  dive: { phase: 'tell' | 'swoop'; t: number; targetX: number } | null
  half: number
  pair: number
}
type Game = {
  score: number
  lives: number
  level: number
  over: boolean
  mode: 'weather' | 'classic'
  menu: { cursor: number } | null
  front: { id: string; formation: FormationSpec }
  clouds: Cloud[]
  drops: Drop[]
  strikes: Array<{ x: number; tell: number; flash: number; stopY: number }>
  plots: Plot[]
  helperBeams: Array<{ pierce: boolean }>
  beam: { pierce: boolean; half: number } | null
  charge: number
  px: number
  stepEvery: number
  dead: number
  music: MusicLoop | null
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  startWave(wave: number): void
  chooseMode(mode: 'weather' | 'classic'): void
  cheer(cloud: Cloud): void
  damage(cloud: Cloud): void
  demoInput(): InputFrame
  layout(): void
}

const quiet = { play: () => {} }
const fakeCtx = new Proxy(
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

function open(opts: { seed?: number; demo?: boolean; select?: boolean } = {}) {
  return gloomInvaders.create({
    rng: mulberry32(opts.seed ?? 5),
    sound: quiet,
    demo: opts.demo ?? false,
    hiScore: 0,
    selectScreen: opts.select,
  }) as unknown as Game
}

function frame(buttons: { held?: string[]; pressed?: string[] } = {}) {
  const input = emptyInput()
  for (const b of buttons.held ?? []) input.held[b as 'a'] = true
  for (const b of buttons.pressed ?? []) input.pressed[b as 'a'] = true
  return input
}

/** A game whose sky stays put: no drops, no dives, no strikes, no march. */
function calm(game: Game) {
  const g = game as unknown as Record<string, number>
  g.dropTimer = 1e9
  g.diveTimer = 1e9
  g.stepTimer = 1e9
  g.kiteTimer = 1e9
  game.drops = []
  game.strikes = []
}

const alive = (game: Game) => game.clouds.filter((c) => c.alive)

// --- the data: the 11 x 5 grid, five formations, five drop types, the new clouds ----------------
{
  const grid = WEATHER_FRONTS[0]!
  assert.equal(grid.formation.kind, 'grid')
  const slots = formationSlots(grid.formation)
  assert.equal(slots.length, 55, 'the Cumulus Grid is the classic 11 x 5')
  assert.equal(new Set(slots.map((s) => s.col)).size, 11)
  assert.equal(new Set(slots.map((s) => s.row)).size, 5)
  assert.equal(
    formationSlots(CLASSIC_FRONT.formation).length,
    45,
    'Classic Sky keeps the 9 x 5',
  )
  assert.deepEqual(
    [...new Set(WEATHER_FRONTS.map((f) => f.formation.kind))].sort(),
    ['diagonal', 'drift', 'grid', 'jet', 'ring'],
    'grid, drifting rows, diagonal sweep, ring and jet-stream rows',
  )
  const kinds = new Set(
    WEATHER_FRONTS.flatMap((f) =>
      formationSlots(f.formation).map((s) => s.kind),
    ),
  )
  for (const k of [
    'drizzler',
    'splitter',
    'diver',
    'hailer',
    'thunderhead',
  ] as const)
    assert.ok(kinds.has(k), `${k} flies in some front`)
  assert.equal(CLOUD_KINDS.thunderhead.hp, 3, 'a thunderhead takes three')
  assert.ok(
    WEATHER_FRONTS.some((f) => (f.rain.sleet ?? 0) > 0),
    'sleet falls somewhere',
  )
  assert.equal(rainKind({ straight: 1 }, 0.99), 'straight')
  assert.equal(rainKind({ straight: 1, sleet: 1 }, 0.25), 'straight')
  assert.equal(rainKind({ straight: 1, sleet: 1 }, 0.75), 'sleet')
  assert.equal(weatherFront(1), WEATHER_FRONTS[0])
  assert.equal(
    weatherFront(WEATHER_FRONTS.length + 2),
    WEATHER_FRONTS[1],
    'the run loops round with the curves still climbing',
  )
}

// --- formation paths -----------------------------------------------------------------------------
{
  // The grid marches 4px a step and drops a row at the wall.
  const spec = WEATHER_FRONTS[0]!.formation
  const s = newFormation(spec, 52)
  const all = formationSlots(spec)
  assert.equal(s.x, 25, 'centred: (288 - 238) / 2')
  const xs: number[] = []
  let dropped = false
  for (let i = 0; i < 5; i++) {
    dropped = marchStep(spec, s, all, 4)
    xs.push(s.x)
  }
  assert.deepEqual(xs, [29, 33, 37, 41, 41])
  assert.equal(dropped, true, 'the fifth step meets the wall')
  assert.equal(s.y, 52 + DROP_Y)
  assert.equal(s.dir, -1)
  assert.deepEqual(slotHome(spec, s, 2, 3), {
    x: 41 + 3 * 22,
    y: 60 + 2 * CELL_H,
  })
  // With the outer columns cheered the block has room to travel further.
  const middle = all.filter((c) => c.col >= 3 && c.col <= 7)
  const m = newFormation(spec, 52)
  let steps = 0
  while (!marchStep(spec, m, middle, 4)) steps++
  assert.ok(steps > 4, 'a thinned block marches further before it drops')
}
{
  // Drifting rows: each row on its own pace and heading, all dropping together on the count.
  const spec = WEATHER_FRONTS.find((f) => f.formation.kind === 'drift')!
    .formation as Extract<FormationSpec, { kind: 'drift' }>
  const s = newFormation(spec, 60)
  const all = formationSlots(spec)
  const start = [...s.rowX]
  marchStep(spec, s, all, 4)
  assert.equal(s.rowX[0], start[0]! + 4 * spec.speeds[0]!)
  assert.equal(s.rowX[1], start[1]! - 4 * spec.speeds[1]!, 'row 2 drifts left')
  assert.notEqual(s.rowX[0], s.rowX[2], 'rows drift at different speeds')
  for (let i = 1; i < spec.descendEvery; i++) marchStep(spec, s, all, 4)
  assert.equal(s.y, 60 + DROP_Y, 'the whole shower steps down on the count')
  for (let i = 0; i < 200; i++) marchStep(spec, s, all, 4)
  spec.rows.forEach((_, row) => {
    const left = slotHome(spec, s, row, 0).x
    const right = slotHome(spec, s, row, spec.cols - 1).x + CLOUD_W
    assert.ok(left >= 0 && right <= W, `row ${row} stays in the sky`)
  })
}
{
  // The squall line leans into its direction of travel.
  const spec = WEATHER_FRONTS.find((f) => f.formation.kind === 'diagonal')!
    .formation as Extract<FormationSpec, { kind: 'diagonal' }>
  const s = newFormation(spec, 52)
  const all = formationSlots(spec)
  const flat = slotHome(spec, s, 0, 0).y
  assert.equal(flat, slotHome(spec, s, 0, spec.cols - 1).y, 'level at rest')
  for (let i = 0; i < 4; i++) marchStep(spec, s, all, 4)
  assert.equal(s.tilt, 1)
  assert.equal(
    slotHome(spec, s, 0, spec.cols - 1).y - slotHome(spec, s, 0, 0).y,
    spec.slope * (spec.cols - 1),
    'moving right, the right end dips',
  )
}
{
  // The spiral low turns, ring against ring, and drops at the walls.
  const spec = WEATHER_FRONTS.find((f) => f.formation.kind === 'ring')!
    .formation as Extract<FormationSpec, { kind: 'ring' }>
  const s = newFormation(spec, 50)
  const all = formationSlots(spec)
  const outer0 = slotHome(spec, s, 0, 0)
  const inner0 = slotHome(spec, s, 1, 0)
  marchStep(spec, s, all, 4)
  assert.equal(s.angle, spec.spin)
  const outer1 = slotHome(spec, s, 0, 0)
  const inner1 = slotHome(spec, s, 1, 0)
  assert.ok(outer1.y > outer0.y, 'the outer ring turns one way')
  assert.ok(inner1.y < inner0.y, 'the inner ring turns the other')
  let drops = 0
  for (let i = 0; i < 80; i++) if (marchStep(spec, s, all, 4)) drops++
  assert.ok(drops >= 2, 'the ring steps down when it reaches a wall')
  for (const c of all) {
    const p = slotHome(spec, s, c.row, c.col)
    assert.ok(p.x >= 0 && p.x + CLOUD_W <= W, 'and never leaves the sky')
  }
}
{
  // Jet-stream rows slide at their own speeds, some backwards, and wrap round the sky.
  const spec = WEATHER_FRONTS.find((f) => f.formation.kind === 'jet')!
    .formation as Extract<FormationSpec, { kind: 'jet' }>
  const s = newFormation(spec, 52)
  const all = formationSlots(spec)
  const back = spec.speeds.findIndex((v) => v < 0)
  assert.ok(back >= 0, 'some rows reverse')
  const before = slotHome(spec, s, back, 4).x
  marchStep(spec, s, all, 4)
  assert.ok(slotHome(spec, s, back, 4).x < before, 'a reversed row slides left')
  let wrapped = false
  let last = slotHome(spec, s, 0, 0).x
  for (let i = 0; i < 120; i++) {
    marchStep(spec, s, all, 4)
    const x = slotHome(spec, s, 0, 0).x
    if (x < last - 100) wrapped = true
    last = x
    assert.ok(x >= -CLOUD_W && x < W, 'a jet cloud is always on the loop')
  }
  assert.ok(wrapped, 'off the right edge, back in on the left')
  assert.ok(s.y > 52, 'the jet stream descends on its count')
}

// --- drop kinematics: drizzle seeks, sleet zig-zags, hail bounces once ------------------------
{
  const drizzle = newDrop('drizzle', 100, 80, 2)
  stepDrop(drizzle, 200)
  assert.equal(drizzle.x, 100 + DRIZZLE_SEEK, 'the drizzle leans toward Sunny')
  assert.equal(drizzle.y, 80 + 2 * 0.8, 'and falls a little slower')
  const straight = newDrop('straight', 100, 80, 2)
  stepDrop(straight, 200)
  assert.equal(straight.x, 100, 'straight drops ignore Sunny')
  const sleet = newDrop('sleet', 100, 80, 2)
  const seen = new Set<number>()
  for (let i = 0; i < SLEET_PERIOD; i++) {
    stepDrop(sleet, 0)
    seen.add(sleet.x - 100)
  }
  assert.equal(sleet.x, 100, 'sleet zig-zags back to its line each period')
  assert.equal(Math.max(...seen), SLEET_AMP)
  assert.equal(Math.min(...seen), -SLEET_AMP)
  assert.equal(zigzag(SLEET_PERIOD / 4), SLEET_AMP)
  const hail = newDrop('hail', 100, 300, 2.5)
  bounceHail(hail)
  assert.ok(hail.bounced && hail.vy < 0 && hail.vx > 0, 'hail kicks back up')
  let top = hail.y
  for (let i = 0; i < 30; i++) {
    stepDrop(hail, 0)
    top = Math.min(top, hail.y)
  }
  assert.ok(top < 300 && hail.vy > 0, 'and falls again under gravity')
}

// --- Classic Sky behind the mode select ----------------------------------------------------------
{
  const game = open({ select: true })
  assert.ok(game.menu, 'a real cabinet opens on the mode select')
  game.update(frame({ pressed: ['down'] }))
  game.update(frame({ pressed: ['a'] }))
  assert.equal(game.menu, null)
  assert.equal(game.mode, 'classic')
  assert.equal(game.clouds.length, 45)
  assert.equal(game.music, null, 'Classic Sky keeps its blips, not the loop')
  calm(game)
  const cloud = alive(game)[0]!
  game.cheer(cloud)
  assert.ok(
    game.plots.every((p) => p.water === 0),
    'Classic Sky has no plots to water',
  )
  assert.equal(game.score, CLOUD_KINDS[cloud.kind].points)
  // Classic Sky still autofires on a held button.
  const held = open({ select: true })
  held.chooseMode('classic')
  calm(held)
  held.update(frame({ held: ['a'] }))
  assert.ok(held.beam, 'a held A shines in Classic Sky')
  const plain = open()
  assert.equal(plain.mode, 'weather', 'without a select the Weather plays')
  assert.equal(plain.clouds.length, 55)
}

// --- the Sun Lance --------------------------------------------------------------------------------
{
  const game = open()
  calm(game)
  // A tap shines a plain beam at once.
  game.update(frame({ held: ['a'], pressed: ['a'] }))
  assert.ok(game.beam && !game.beam.pierce, 'a tap is a plain beam')
  // Holding while the beam flies does not charge: still one beam at a time.
  game.update(frame({ held: ['a'] }))
  assert.equal(game.charge, 0)
  while (game.beam) game.update(frame({ held: ['a'] }))
  for (let i = 0; i < 5; i++) game.update(frame({ held: ['a'] }))
  game.update(frame())
  assert.equal(game.beam, null, 'a short hold fires nothing')

  // Line Sunny up under column 5 and charge.
  const lance = open()
  calm(lance)
  const column = alive(lance).filter((c) => c.col === 5)
  lance.px = column[0]!.x + CLOUD_W / 2
  for (let i = 0; i < LANCE_CHARGE; i++) lance.update(frame({ held: ['a'] }))
  assert.equal(lance.charge, LANCE_CHARGE, 'charged in 0.6 s')
  lance.update(frame())
  assert.ok(lance.beam?.pierce, 'release: the Sun Lance')
  for (let i = 0; i < 80 && lance.beam; i++) lance.update(frame())
  assert.ok(
    column.every((c) => !c.alive),
    'the lance pierces the whole column',
  )
  assert.equal(
    lance.score,
    column.reduce((n, c) => n + CLOUD_KINDS[c.kind].points, 0),
  )
  const neighbours = alive(lance).filter((c) => c.col === 4 || c.col === 6)
  assert.equal(neighbours.length, 10, 'and only that column')
}

// --- splitter scoring ----------------------------------------------------------------------------
{
  const game = open()
  game.startWave(3)
  calm(game)
  assert.equal(game.front.id, 'showers')
  const splitter = alive(game).find((c) => c.kind === 'splitter')!
  game.cheer(splitter)
  const halves = alive(game).filter((c) => c.kind === 'half')
  assert.equal(halves.length, 2, 'a splitter puff splits in two')
  assert.equal(halves[0]!.pair, halves[1]!.pair)
  assert.deepEqual(
    halves.map((h) => h.half),
    [-1, 1],
  )
  assert.ok(halves[0]!.x < halves[1]!.x, 'side by side in its slot')
  assert.equal(game.score, CLOUD_KINDS.splitter.points)
  game.cheer(halves[0]!)
  assert.equal(
    game.score,
    CLOUD_KINDS.splitter.points + CLOUD_KINDS.half.points,
  )
  game.cheer(halves[1]!)
  assert.equal(
    game.score,
    CLOUD_KINDS.splitter.points +
      2 * CLOUD_KINDS.half.points +
      SPLIT_PAIR_BONUS,
    'both halves earn the pair bonus',
  )
  // Halves of two different splitters are no pair.
  const a = alive(game).filter((c) => c.kind === 'splitter')
  game.cheer(a[0]!)
  game.cheer(a[1]!)
  const loose = alive(game).filter((c) => c.kind === 'half')
  const before = game.score
  game.cheer(loose.find((h) => h.half === -1 && h.pair === loose[0]!.pair)!)
  game.cheer(loose.find((h) => h.half === 1 && h.pair !== loose[0]!.pair)!)
  assert.equal(before + 2 * CLOUD_KINDS.half.points, game.score, 'no bonus')
  // A plain beam into a splitter cheers only it.
  const beam = open()
  beam.startWave(3)
  calm(beam)
  const target = alive(beam)
    .filter((c) => c.kind === 'splitter')
    .at(-1)!
  const below = alive(beam).filter(
    (c) => c.y > target.y && Math.abs(c.x - target.x) < CLOUD_W,
  )
  for (const c of below) beam.cheer(c)
  ;(beam as unknown as { umbrellas: unknown[] }).umbrellas = []
  const scored = beam.score
  beam.px = target.x + CLOUD_W / 2
  beam.update(frame({ held: ['a'], pressed: ['a'] }))
  for (let i = 0; i < 80 && beam.beam; i++) beam.update(frame())
  assert.equal(target.alive, false)
  assert.equal(beam.score - scored, CLOUD_KINDS.splitter.points)
}

// --- thunderheads and lightning --------------------------------------------------------------------
{
  const game = open()
  game.startWave(4)
  calm(game)
  const head = alive(game).find((c) => c.kind === 'thunderhead')!
  game.damage(head)
  game.damage(head)
  assert.ok(head.alive, 'two beams: still grumbling')
  assert.equal(game.score, 0)
  game.damage(head)
  assert.equal(head.alive, false, 'three beams cheer it')
  assert.equal(game.score, CLOUD_KINDS.thunderhead.points)

  // Lightning in an open column: the ground glows, then Sunny is bonked if still there.
  const strike = (x: number, px: number) => {
    const g = open()
    g.startWave(4)
    calm(g)
    const source = alive(g).find((c) => c.kind === 'thunderhead')!
    g.strikes = [{ x, tell: STRIKE_TELL, flash: 0, stopY: 0, source } as never]
    g.px = px
    const lives = g.lives
    for (let i = 0; i < STRIKE_TELL; i++) g.update(frame())
    return { g, hit: g.lives < lives }
  }
  assert.ok(strike(144, 144).hit, 'standing in the lit column')
  assert.ok(!strike(144, 170).hit, 'one step out is safe')
  const sheltered = strike(108, 108)
  assert.ok(!sheltered.hit, 'an umbrella takes the bolt')
  assert.ok(sheltered.g.strikes[0]!.stopY < 330)
}

// --- diver gusts --------------------------------------------------------------------------------
{
  const game = open()
  game.startWave(5)
  calm(game)
  ;(game as unknown as { diveTimer: number }).diveTimer = 1
  game.px = 40
  game.update(frame())
  const diving = alive(game).find((c) => c.dive)!
  assert.equal(diving.kind, 'diver')
  assert.equal(diving.dive!.phase, 'tell', 'it wiggles red-edged first')
  for (let i = 0; i < DIVE_TELL; i++) game.update(frame())
  assert.equal(diving.dive!.phase, 'swoop')
  assert.equal(diving.dive!.targetX, 40, 'it swoops at where Sunny stood')
  game.px = 250
  for (let i = 0; i < SWOOP_TICKS / 2 - 1; i++) game.update(frame())
  assert.ok(diving.y > 250, 'deep in its swoop')
  game.cheer(diving)
  assert.equal(
    game.score,
    CLOUD_KINDS.diver.points * 2,
    'beamed mid-swoop: double',
  )
  const mid = swoopPoint(
    { hx: 100, hy: 60, w: 18, h: 12 },
    { t: SWOOP_TICKS / 2, targetX: 200 },
  )
  assert.ok(
    Math.abs(mid.x - (200 - 9)) <= 6,
    'at the bottom of the swoop it wiggles over Sunny',
  )
  assert.equal(mid.y, 384 - 34 - 4 - 6, 'down at Sunny height')
  const back = swoopPoint(
    { hx: 100, hy: 60, w: 18, h: 12 },
    { t: SWOOP_TICKS, targetX: 200 },
  )
  assert.deepEqual(back, { x: 100, y: 60 }, 'and back home')
  // A swoop that reaches Sunny bonks.
  const hit = open()
  hit.startWave(5)
  calm(hit)
  const gust = alive(hit).find((c) => c.kind === 'diver')!
  gust.dive = { phase: 'swoop', t: 0, targetX: 144 }
  hit.px = 144
  const lives = hit.lives
  for (let i = 0; i < SWOOP_TICKS && hit.lives === lives; i++)
    hit.update(frame())
  assert.equal(hit.lives, lives - 1)
}

// --- drizzlers and hailers: the tell, then the drop ---------------------------------------------
{
  const game = open()
  game.startWave(2)
  calm(game)
  const drizzler = alive(game).find((c) => c.kind === 'drizzler')!
  drizzler.tell = 3
  drizzler.tellKind = 'drizzle'
  for (let i = 0; i < 3; i++) game.update(frame())
  assert.equal(game.drops.length, 1)
  assert.equal(game.drops[0]!.kind, 'drizzle')
  // A drizzler cheered mid-tell never drops.
  const other = alive(game).filter((c) => c.kind === 'drizzler')[1]!
  other.tell = 5
  other.tellKind = 'drizzle'
  game.cheer(other)
  for (let i = 0; i < 6; i++) game.update(frame())
  assert.equal(game.drops.filter((d) => d.kind === 'drizzle').length, 1)

  // Hail lands on open ground, bounces once, then melts on its second landing.
  const hail = open()
  hail.startWave(6)
  calm(hail)
  hail.px = 30
  const drop = newDrop('hail', 144, 340, 3)
  hail.drops = [drop]
  for (const p of hail.plots) p.water = 3
  const plot = hail.plots[plotIndex(144)]!
  for (let i = 0; i < 12; i++) hail.update(frame())
  assert.ok(drop.bounced, 'the hail bounced')
  assert.equal(plot.water, 2, 'and its landing wilted the plot a little')
  let t = 0
  while (hail.drops.length && t++ < 200) hail.update(frame())
  assert.equal(hail.drops.length, 0, 'the second landing ends it')
  assert.ok(drop.x < 144, 'kicked away from the middle of the sky')
  assert.equal(
    hail.plots.reduce((n, p) => n + p.water, 0),
    3 * PLOTS - 2,
    'two landings, two wiltings',
  )
}

// --- The Garden Grows Back: plot watering, blooms, wilting -----------------------------------------
{
  assert.equal(PLOTS, 11)
  assert.equal(plotIndex(0), 0)
  assert.equal(plotIndex(W - 1), PLOTS - 1)
  assert.equal(plotIndex(plotCenter(4)), 4)
  for (const season of [0, 1, 2, 3] as const) {
    assert.equal(PLOT_HELPERS[season].length, PLOTS)
  }
  const all = new Set<HelperKind>(
    ([0, 1, 2, 3] as const).flatMap((s) => [...PLOT_HELPERS[s]]),
  )
  assert.equal(all.size, 5, 'all five helpers grow somewhere')
  assert.notDeepEqual(
    PLOT_HELPERS[0],
    PLOT_HELPERS[1],
    'what blooms changes with the season',
  )

  const plots = newGarden()
  const x = plotCenter(5)
  for (let i = 1; i < BLOOM_AT; i++) {
    assert.equal(waterPlot(plots, x, 0).bloomed, null)
  }
  assert.equal(plots[5]!.water, BLOOM_AT - 1)
  const fifth = waterPlot(plots, x, 0)
  assert.equal(fifth.bloomed, PLOT_HELPERS[0][5], 'five waterings bloom')
  assert.equal(plots[4]!.water, 0, 'only the plot beneath is watered')
  assert.equal(
    waterPlot(plots, x, 0).bloomed,
    null,
    'a bloomed plot does not re-bloom',
  )
  const wilt = wiltPlot(plots, x)
  assert.equal(plots[5]!.water, BLOOM_AT)
  assert.equal(wilt.wilted, null, 'banked water keeps it blooming')
  assert.equal(wiltPlot(plots, x).wilted, PLOT_HELPERS[0][5], 'then it wilts')
  assert.equal(plots[5]!.helper, null)
  // The strawberry pays an extra Sunny at ten waterings, once.
  const berries = newGarden()
  const bx = plotCenter(0)
  assert.equal(PLOT_HELPERS[0][0], 'strawberry')
  let paid = 0
  for (let i = 0; i < BERRY_AT + 4; i++)
    if (waterPlot(berries, bx, 0).berry) paid++
  assert.equal(paid, 1)

  // In the game: where you cheer is the plot you water.
  const game = open()
  calm(game)
  const cloud = alive(game).find((c) => c.col === 7)!
  game.cheer(cloud)
  assert.equal(game.plots[plotIndex(cloud.x + CLOUD_W / 2)]!.water, 1)
  assert.equal(
    game.plots.reduce((n, p) => n + p.water, 0),
    1,
    'one cloud, one watering',
  )
  // A drop that reaches the garden wilts the plot it lands on.
  const p = game.plots[plotIndex(144)]!
  p.water = 2
  game.px = 30
  game.drops = [newDrop('straight', 144, 360, 3)]
  for (let i = 0; i < 4; i++) game.update(frame())
  assert.equal(p.water, 1)
  // An extra Sunny from the strawberry.
  const berry = open()
  calm(berry)
  const lives = berry.lives
  berry.plots[0]!.water = BERRY_AT - 1
  berry.plots[0]!.helper = 'strawberry'
  const edge = alive(berry).find((c) => c.col === 0)!
  edge.x = 0
  berry.cheer(edge)
  assert.equal(berry.lives, lives + 1, 'strawberries: an extra Sunny')
}

// --- the five helpers at work --------------------------------------------------------------------
{
  const bloom = (game: Game, i: number, helper: HelperKind, timer = 1) => {
    const plot = game.plots[i]!
    plot.water = BLOOM_AT
    plot.helper = helper
    plot.timer = timer
    plot.vine = helper === 'beanVine' ? new Array(20).fill(true) : []
  }
  // Sunflower: a sunbeam straight up from its plot every three seconds.
  const sun = open()
  calm(sun)
  bloom(sun, 5, 'sunflower')
  sun.update(frame())
  assert.equal(sun.helperBeams.length, 1)
  assert.equal(sun.plots[5]!.timer, HELPER_TICKS.sunflower)
  let t = 0
  while (sun.helperBeams.length && t++ < 120) sun.update(frame())
  assert.equal(
    alive(sun).length,
    54,
    'the sunflower cheered the cloud above it',
  )

  // Beehive: a bee takes one drop near its hive, then rests four seconds.
  const hive = open()
  calm(hive)
  bloom(hive, 3, 'beehive', 0)
  hive.px = 250
  hive.drops = [
    newDrop('straight', plotCenter(3) + 10, 290, 0.01),
    newDrop('straight', plotCenter(3) - 10, 280, 0.01),
  ]
  hive.update(frame())
  assert.equal(hive.drops.length, 1, 'one drop intercepted')
  hive.update(frame())
  assert.equal(hive.drops.length, 1, 'then the bee rests')
  assert.equal(hive.plots[3]!.timer, HELPER_TICKS.beehive - 1)

  // Bean vine: a living umbrella that catches drops and regrows.
  const vine = open()
  calm(vine)
  bloom(vine, 6, 'beanVine', HELPER_TICKS.vineRegrow)
  vine.px = 30
  const vx = plotCenter(6)
  vine.drops = [newDrop('straight', vx, 320, 2)]
  for (let i = 0; i < 8; i++) vine.update(frame())
  assert.equal(vine.drops.length, 0, 'the vine canopy caught the drop')
  const lost = vine.plots[6]!.vine.filter((on) => !on).length
  assert.equal(lost, 1, 'one leaf gone')
  assert.equal(vine.plots[6]!.water, BLOOM_AT, 'and the plot below stayed dry')
  for (let i = 0; i < HELPER_TICKS.vineRegrow; i++) vine.update(frame())
  assert.ok(vine.plots[6]!.vine.every(Boolean), 'the leaf grew back')

  // Pumpkin: a one-time launch that cheers a whole column.
  const pump = open()
  calm(pump)
  const i = 5
  bloom(pump, i, 'pumpkin', 1)
  const cx = plotCenter(i)
  const column = alive(pump).filter((c) => Math.abs(c.x + c.w / 2 - cx) <= 19)
  assert.ok(column.length >= 5)
  pump.update(frame())
  assert.ok(pump.helperBeams[0]?.pierce, 'the pumpkin launches')
  assert.equal(pump.plots[i]!.helper, null, 'one-time: the plot is bare again')
  t = 0
  while (pump.helperBeams.length && t++ < 120) pump.update(frame())
  assert.ok(
    column.every((c) => !c.alive),
    'and the whole column above is cheered',
  )
}

// --- the heartbeat --------------------------------------------------------------------------------
{
  for (const loop of HEARTBEAT_LOOPS) {
    const parsed = parseLoop(loop)
    assert.equal(parsed.length, 32, 'every voice of the heartbeat is 32 steps')
  }
  for (let i = 1; i < HEARTBEAT_LOOPS.length; i++)
    assert.ok(HEARTBEAT_LOOPS[i]!.bpm > HEARTBEAT_LOOPS[i - 1]!.bpm)
  assert.equal(heartbeatTier(20), 0)
  assert.equal(heartbeatTier(1), HEARTBEAT_LOOPS.length - 1)
  const game = open()
  for (let i = 0; i < 40; i++) game.update(frame())
  const slow = game.music!
  assert.ok(slow, 'the Weather plays the heartbeat')
  assert.equal(game.music, slow, 'the same loop object while the tempo holds')
  for (const c of alive(game).slice(0, 52)) game.cheer(c)
  for (let i = 0; i < 40; i++) game.update(frame())
  assert.ok(game.music!.bpm > slow.bpm, 'the tempo rises as the march quickens')
  const menu = open({ select: true })
  assert.equal(menu.music, null, 'no heartbeat on the select')
}

// --- determinism, the pilot probe and the attract demo ------------------------------------------
{
  const scripted = (t: number) => {
    const input = emptyInput()
    input.held.right = t % 240 < 60
    input.held.left = t % 400 > 300
    input.held.a = t % 120 < 70
    input.pressed.a = t % 9 === 0
    return input
  }
  const run = (seed: number) => {
    const g = open({ seed })
    let t = 0
    for (; t < 60 * 60 * 20 && !g.over; t++) {
      g.update(scripted(t))
      if (t % 120 === 0) g.render(fakeCtx)
    }
    return { score: g.score, level: g.level, t, over: g.over }
  }
  const a = run(3)
  assert.deepEqual(run(3), a, 'the seeded sim is deterministic')
  assert.ok(a.over, 'a scripted run ends')
  assert.ok(a.score > 0 && a.score < 2_000_000)

  const idle = open({ seed: 4 })
  let t = 0
  for (; t < 60 * 60 * 10 && !idle.over; t++) idle.update(emptyInput())
  assert.ok(idle.over, 'an idle Sunny is soaked in the end')

  for (const seed of [7, 8, 9]) {
    const demo = open({ seed, demo: true })
    let ticks = 0
    let lances = 0
    let lastBeam = false
    for (; ticks < 60 * 60 * 30 && !demo.over; ticks++) {
      demo.update(emptyInput())
      const lance = !!demo.beam?.pierce
      if (lance && !lastBeam) lances++
      lastBeam = lance
      if (ticks % 200 === 0) demo.render(fakeCtx)
    }
    assert.equal(demo.score, 0, 'the attract demo never scores')
    assert.ok(demo.over, `the attract pilot's run ends (seed ${seed})`)
    assert.ok(lances > 0, 'the pilot shows off the Sun Lance')
  }

  // Every front renders, every cloud and drop kind on screen at once.
  for (let wave = 1; wave <= WEATHER_FRONTS.length; wave++) {
    const g = open()
    g.startWave(wave)
    g.drops = [
      newDrop('straight', 40, 200, 2),
      newDrop('drizzle', 80, 200, 2),
      newDrop('hail', 120, 200, 2),
      newDrop('sleet', 160, 200, 2),
    ]
    for (let i = 0; i < 200; i++) g.update(g.demoInput())
    g.render(fakeCtx)
  }
}

// The authored year begins with six months, three separate playable fronts apiece.
{
  assert.equal(SPRING_SUMMER_FRONTS.length, 18)
  assert.equal(new Set(SPRING_SUMMER_FRONTS.map((f) => f.id)).size, 18)
  assert.deepEqual(
    [...new Set(SPRING_SUMMER_FRONTS.map((f) => f.month))],
    ['MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST'],
  )
  for (const [i, front] of SPRING_SUMMER_FRONTS.entries()) {
    assert.equal(front.season, i < 9 ? 0 : 1)
    assert.equal(front.frontNumber, (i % 3) + 1)
    assert.equal(front.special, i % 3 === 1)
    assert.ok(formationSlots(front.formation).length >= 28)
    assert.equal(calendarFront(i + 1), front)
  }
  assert.equal(calendarFront(19), calendarFront(1))

  const game = gloomInvaders.create({
    rng: mulberry32(23),
    sound: quiet,
    demo: false,
    hiScore: 0,
    selectScreen: true,
  }) as unknown as Game & { save: unknown; mode: string }
  game.update(frame({ pressed: ['down'] }))
  game.update(frame({ pressed: ['down'] }))
  game.update(frame({ pressed: ['a'] }))
  assert.equal(game.mode, 'calendar')
  assert.equal(game.front.id, 'march-front-1')
  assert.deepEqual(game.save, {
    v: 1,
    run: { wave: 1, score: 0, lives: 3 },
  })
  game.score = 4200
  game.lives = 2
  game.startWave(10)
  assert.equal(game.front.id, 'june-front-1')
  assert.equal(game.plots.every((plot) => plot.water === 0), true)
  assert.deepEqual(game.save, {
    v: 1,
    run: { wave: 10, score: 4200, lives: 2 },
  })
  const resumed = gloomInvaders.create({
    rng: mulberry32(23),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: game.save,
  }) as unknown as Game & { save: unknown; mode: string }
  assert.equal(resumed.mode, 'calendar')
  assert.equal(resumed.level, 10)
  assert.equal(resumed.score, 4200)
  assert.equal(resumed.lives, 2)
  assert.equal(resumed.front.id, 'june-front-1')
  assert.equal(readGloomCalendarSave({ v: 1, run: { wave: 11, score: 2, lives: 3 } }), null)
  assert.equal(readGloomCalendarSave({ v: 1, run: { wave: 10, score: -1, lives: 3 } }), null)
  assert.equal(readGloomCalendarSave({ v: 1, run: { wave: 1, score: 1, lives: 0 } }), null)
  const spectator = gloomInvaders.create({
    rng: mulberry32(23),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Game & { save: unknown }
  assert.equal(spectator.save, null, 'attract mode cannot write a save')

  const challenge = gloomInvaders.create({
    rng: mulberry32(24),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as unknown as Game & {
    water(x: number): void
    clearWave(): void
    umbrellaCell(x: number, y: number): unknown
  }
  challenge.chooseMode('calendar')
  challenge.startWave(2)
  for (let i = 0; i < 5; i++) challenge.water(plotCenter(i))
  const before = challenge.score
  challenge.clearWave()
  assert.equal(
    challenge.score - before,
    700,
    'March First Shoots grants 500 for five uniquely watered plots',
  )
  challenge.startWave(10)
  const shieldX = Array.from({ length: W }, (_, i) => i).find((x) =>
    challenge.umbrellaCell(x, 304),
  )
  assert.notEqual(shieldX, undefined, 'umbrellas are intact in June front 1')
  challenge.startWave(11)
  assert.equal(
    challenge.umbrellaCell(shieldX!, 304),
    null,
    'June Brownout removes ordinary umbrella protection',
  )
}

console.log('gloom invaders weather and garden + spring/summer calendar: ok')
