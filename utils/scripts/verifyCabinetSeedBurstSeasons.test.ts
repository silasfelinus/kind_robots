// Seed Burst depth pass, slice 2 (conductor kr-arcade/t-137, depth-pass CABINETS.md section 24):
// Spring and Summer. Twelve authored plots with their season's tile set, title card and music;
// regrowing hedges, watering cans, irrigation channels, glass panes and springy mushrooms; the
// Bonus Beds (Butterfly Release, Sprinkler Dash); Old Bramblebeard and Hothouse Hector; the Potting
// Shed; save and resume at each season start. Ends with a pilot probe.
//
//   npx tsx utils/scripts/verifyCabinetSeedBurstSeasons.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import seedBurst from '../arcade/games/seedBurst'
import { Bramblebeard, Hector } from '../arcade/seedBurst/bosses'
import type { BossHost, Tile } from '../arcade/seedBurst/bosses'
import { SEASON_LOOKS } from '../arcade/seedBurst/looks'
import * as MUSIC from '../arcade/seedBurst/music'
import {
  PLOTS,
  PLOT_COLS,
  SEASONS,
  STEPS_PER_SEASON,
  campaignStep,
  parseMask,
} from '../arcade/seedBurst/plots'
import { readSeedSave } from '../arcade/seedBurst/save'
import { nextVariety, shedBlock, shedPrice } from '../arcade/seedBurst/shed'
import { parseLoop } from '../arcade/sound'
import type { InputFrame } from '../arcade/types'

const quiet = { play: () => {} }
const FUSE = 150
const empty = (): InputFrame => ({
  held: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
  pressed: {
    up: false,
    down: false,
    left: false,
    right: false,
    a: false,
    b: false,
    start: false,
  },
})
const tap = (button: keyof InputFrame['held']) => {
  const frame = empty()
  frame.held[button] = true
  frame.pressed[button] = true
  return frame
}
const hold = (button: keyof InputFrame['held']) => {
  const frame = empty()
  frame.held[button] = true
  return frame
}
const COLS = PLOT_COLS
const key = (x: number, y: number) => y * COLS + x

// --- the campaign as data ---------------------------------------------------------------

assert.deepEqual(
  SEASONS.map((s) => s.id),
  ['spring', 'summer'],
)
assert.equal(PLOTS.length, 12, 'twelve authored plots')
for (const s of SEASONS) {
  assert.equal(s.plots.length, 6, `${s.id}: six plots`)
  assert.ok(s.bonus.bonus && s.boss.boss, `${s.id}: a Bonus Bed and a boss`)
  assert.ok(SEASON_LOOKS[s.id], `${s.id}: its own tile set`)
}
const SPRING_GRUMPS = ['gnat', 'drifter', 'sniffer', 'slug', 'mole']
const SUMMER_GRUMPS = [
  'gnat',
  'drifter',
  'sniffer',
  'hopper',
  'bully',
  'thief',
  'puffball',
]
for (const p of SEASONS[0]!.plots)
  for (const k of Object.keys(p.grumps))
    assert.ok(SPRING_GRUMPS.includes(k), `${p.id}: ${k} is a spring grump`)
for (const p of SEASONS[1]!.plots)
  for (const k of Object.keys(p.grumps))
    assert.ok(SUMMER_GRUMPS.includes(k), `${p.id}: ${k} is a summer grump`)
// Spring's plots grow back and hold watering cans; Summer's have channels, glass and mushrooms.
const springMasks = SEASONS[0]!.plots.map((p) => parseMask(p.mask))
const summerMasks = SEASONS[1]!.plots.map((p) => parseMask(p.mask))
assert.ok(SEASONS[0]!.plots.filter((p) => p.regrow).length >= 4)
assert.ok(springMasks.filter((m) => m.cans.length).length >= 4)
assert.ok(summerMasks.some((m) => m.channels.size))
assert.ok(summerMasks.some((m) => m.glass.length))
assert.ok(summerMasks.some((m) => m.mushrooms.length))
assert.ok(!SEASONS[1]!.plots.some((p) => p.regrow), 'summer hedges stay cut')
assert.equal(parseMask(SEASONS[1]!.boss.mask).valves.length, 4, 'four valves')
// Steps: plots 1-3, the Bonus Bed, plots 4-6, the boss; then the next season, then a lap.
const kinds = Array.from(
  { length: STEPS_PER_SEASON },
  (_, i) => campaignStep(i).kind,
)
assert.deepEqual(kinds, [
  'plot',
  'plot',
  'plot',
  'bonus',
  'plot',
  'plot',
  'plot',
  'boss',
])
assert.equal(campaignStep(8).season.id, 'summer')
assert.equal(campaignStep(8).plan.plot.id, SEASONS[1]!.plots[0]!.id)
assert.equal(campaignStep(4).plan.plot.id, SEASONS[0]!.plots[3]!.id)
const lap = campaignStep(16)
assert.equal(lap.season.id, 'spring')
assert.equal(lap.lap, 1)
assert.ok(lap.plan.speed > campaignStep(0).plan.speed, 'a lap is quicker')
// Music: a loop per season, the bosses, the Bonus Beds and the shed, all valid.
for (const loop of Object.values(MUSIC)) assert.ok(parseLoop(loop).length > 0)

// --- the cabinet ------------------------------------------------------------------------------

type Dir = { dx: number; dy: number }
type Gardener = {
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  facing: Dir
  safe: number
  down: number
  pods: number
  range: number
  pouch: string[]
  seed: number
  bouncing: boolean
}
type Grump = {
  kind: string
  tx: number
  ty: number
  p: number
  speed: number
  dead: boolean
}
type Inner = {
  over: boolean
  score: number
  level: number
  lives: number
  save: unknown
  music: unknown
  grid: number[]
  gardeners: Gardener[]
  grumps: Grump[]
  pods: { x: number; y: number; variety: string; fuse: number }[]
  blooms: { x: number; y: number }[]
  powers: Map<number, string>
  hidden: Map<number, string>
  stumps: Map<number, { t: number }>
  soaked: Set<number>
  cracked: Map<number, unknown>
  channels: Map<number, Dir>
  channelsOn: boolean
  mushrooms: Set<number>
  dashSeeds: { k: number; t: number; gold: boolean }[]
  bonusCaught: number
  boss: {
    hitsLeft: number
    phase: number
    done: boolean
    weak(): Tile[]
  } | null
  shed: { cursor: number; note: string; ticks: number } | null
  offer: unknown
  card: number
  clear: number
  timer: number
  spares: number
  seeds: number
  hint: boolean
  stepIndex: number
  step: { season: { id: string }; kind: string; inSeason: number }
  buildStep(i: number): void
  newGrump(kind: string, x: number, y: number): Grump
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: CanvasRenderingContext2D): void
}
function game(
  seed = 3,
  options: { resume?: unknown; demo?: boolean } = {},
): Inner {
  return seedBurst.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: options.demo ?? false,
    hiScore: 0,
    resume: options.resume,
  }) as unknown as Inner
}
/** Campaign step `step`, card skipped, no grumps, the gardener safe for a while. */
function at(step: number, seed = 3): Inner {
  const g = game(seed)
  g.buildStep(step)
  g.card = 0
  g.grumps = []
  g.gardeners[0]!.safe = 9999
  return g
}
function run(g: Inner, ticks: number, frame: () => InputFrame = empty) {
  for (let i = 0; i < ticks && !g.over; i++) g.update(frame())
}
function place(gd: Gardener, x: number, y: number) {
  gd.tx = gd.nx = x
  gd.ty = gd.ny = y
  gd.p = 0
}

// The season title card: shown at a season start, skippable after a moment, never mid-season.
{
  const g = game()
  assert.ok(g.card > 0, 'the spring card')
  g.update(tap('a'))
  assert.ok(g.card > 0, 'too soon to skip')
  run(g, 45)
  g.update(tap('a'))
  assert.equal(g.card, 0, 'skipped')
  g.buildStep(1)
  assert.equal(g.card, 0, 'no card mid-season')
  g.buildStep(8)
  assert.ok(g.card > 0, 'the summer card')
  assert.equal(g.step.season.id, 'summer')
}

// Regrowing hedges (Spring): a cut hedge leaves a stump that sprouts back; a second bloom digs it out.
{
  const g = at(1)
  const gd = g.gardeners[0]!
  gd.range = 1
  place(gd, 1, 2)
  // (1,3) is a hedge on The Lettuce Rows.
  g.grid[key(1, 3)] = 2
  g.hidden.delete(key(1, 3))
  g.update(tap('a'))
  run(g, FUSE)
  assert.equal(g.grid[key(1, 3)], 0, 'cut')
  assert.ok(g.stumps.has(key(1, 3)), 'a stump is left')
  place(gd, 13, 11)
  run(g, 60 * 20 + 5)
  assert.equal(g.grid[key(1, 3)], 2, 'it sprouted back after twenty seconds')
  // Cut it again and bloom the stump a second time: gone for good.
  place(gd, 1, 2)
  g.update(tap('a'))
  run(g, FUSE)
  assert.ok(g.stumps.has(key(1, 3)))
  place(gd, 1, 4)
  g.update(tap('a'))
  run(g, FUSE)
  assert.ok(!g.stumps.has(key(1, 3)), 'dug out')
  place(gd, 13, 11)
  run(g, 60 * 21)
  assert.equal(g.grid[key(1, 3)], 0, 'and it stays cut')
}

// Watering cans (Spring): a bloom tips one and soaks its row; the next burst along it reaches double.
{
  const g = at(1)
  const gd = g.gardeners[0]!
  // The Lettuce Rows has a can at (3,5). Clear the row around it.
  for (let x = 1; x < 14; x++)
    if (g.grid[key(x, 5)] === 2) g.grid[key(x, 5)] = 0
  assert.equal(g.grid[key(3, 5)], 3, 'a can')
  place(gd, 1, 5)
  g.update(tap('a'))
  run(g, FUSE)
  assert.equal(g.grid[key(3, 5)], 0, 'tipped')
  assert.ok(g.soaked.has(5), 'row 5 soaked')
  place(gd, 5, 5)
  g.update(tap('a'))
  run(g, FUSE - 1)
  const reach =
    Math.max(...g.blooms.filter((b) => b.y === 5).map((b) => b.x)) - 5
  assert.equal(reach, gd.range * 2, 'double reach along the soaked row')
  assert.ok(!g.soaked.has(5), 'and the soak is spent')
}

// Glass panes (Summer): the first bloom cracks one, a second burst shatters it.
{
  const g = at(10)
  const gd = g.gardeners[0]!
  // Thieves' Corner has glass at (6,3).
  for (const [x, y] of [
    [5, 3],
    [5, 2],
    [5, 1],
  ])
    if (g.grid[key(x!, y!)] === 2) g.grid[key(x!, y!)] = 0
  assert.equal(g.grid[key(6, 3)], 4, 'a pane')
  place(gd, 5, 3)
  g.update(tap('a'))
  run(g, FUSE)
  assert.equal(g.grid[key(6, 3)], 4, 'still standing')
  assert.ok(g.cracked.has(key(6, 3)), 'cracked')
  place(gd, 5, 3)
  g.update(tap('a'))
  run(g, FUSE)
  assert.equal(g.grid[key(6, 3)], 0, 'shattered')
}

// Irrigation channels (Summer): an idle gardener, a pod and a grump are carried along.
{
  const g = at(9)
  const gd = g.gardeners[0]!
  // Bully Lane: row 5 flows right from x=1 to x=6.
  assert.deepEqual(g.channels.get(key(2, 5)), { dx: 1, dy: 0 })
  place(gd, 2, 5)
  run(g, 22)
  assert.ok(gd.tx > 2, 'the gardener drifted downstream')
  const pg = at(9)
  const pgd = pg.gardeners[0]!
  // Plant while stepping up off the channel, so nothing stands in the pod's way.
  pg.grid[key(3, 4)] = 0
  pg.grid[key(3, 3)] = 0
  place(pgd, 3, 5)
  const plantAndGo = tap('a')
  plantAndGo.held.up = true
  pg.update(plantAndGo)
  run(pg, 40, () => hold('up'))
  assert.equal(pgd.ty, 3, 'the gardener walked off')
  assert.ok(pg.pods[0]!.x > 3, 'the pod floated along')
  const gr = pg.newGrump('gnat', 3, 7)
  pg.grumps = [gr]
  const x0 = gr.tx
  run(pg, 80)
  assert.ok(gr.tx < x0 || pg.grumps[0] !== gr, 'row 7 carries the gnat left')
}

// Springy mushrooms (Summer): step on one and bounce two tiles on, over a hedge, untouchable.
{
  const g = at(8)
  const gd = g.gardeners[0]!
  // Hopscotch Hedges: a mushroom at (7,3); put a hedge at (7,2) to bounce over.
  assert.ok(g.mushrooms.has(key(7, 3)))
  g.grid[key(7, 2)] = 2
  g.grid[key(7, 1)] = 0
  g.grid[key(7, 4)] = 0
  place(gd, 7, 4)
  gd.facing = { dx: 0, dy: -1 }
  let bounced = false
  for (let i = 0; i < 60 && gd.ty !== 1; i++) {
    g.update(hold('up'))
    bounced ||= gd.bouncing
  }
  assert.ok(bounced, 'it bounced')
  assert.deepEqual([gd.tx, gd.ty], [7, 1], 'two tiles on, over the hedge')
  assert.equal(g.grid[key(7, 2)], 2, 'the hedge is untouched')
}

// Butterfly Release: no bonks, caterpillars wander, chains double, thirty seconds, then on.
{
  const g = game()
  g.buildStep(3)
  g.card = 0
  const gd = g.gardeners[0]!
  gd.safe = 0
  assert.equal(g.step.kind, 'bonus')
  run(g, 2)
  assert.ok(
    g.grumps.length >= 5 && g.grumps.every((c) => c.kind === 'caterpillar'),
  )
  const cat = g.grumps[0]!
  place(gd, cat.tx, cat.ty)
  run(g, 30)
  assert.equal(gd.down, 0, 'caterpillars are harmless')
  // Line up three still caterpillars in one burst: 50, 100, 200.
  g.grumps = [
    g.newGrump('caterpillar', 3, 1),
    g.newGrump('caterpillar', 4, 1),
    g.newGrump('caterpillar', 1, 3),
  ]
  for (const c of g.grumps) c.speed = 0
  place(gd, 1, 1)
  gd.range = 3
  const before = g.score
  g.update(tap('a'))
  run(g, FUSE)
  assert.equal(gd.down, 0, 'blooms do not bonk in a Bonus Bed')
  assert.ok(g.score - before >= 50 + 100 + 200, 'every chain doubles')
  assert.ok(g.bonusCaught >= 3)
  run(g, 60 * 30)
  assert.ok(
    g.clear > 0 || g.stepIndex === 4,
    'the bed ends after thirty seconds',
  )
  run(g, 200)
  assert.equal(g.stepIndex, 4, 'and the season goes on')
}

// Sprinkler Dash: seeds land on the conveyors, ride them, fall off the end unless caught.
{
  const g = at(11)
  const gd = g.gardeners[0]!
  place(gd, 1, 11)
  let spawned = 0
  let fell = false
  for (let i = 0; i < 400; i++) {
    const n = g.dashSeeds.length
    g.update(empty())
    if (g.dashSeeds.length > n) spawned++
    if (g.dashSeeds.length < n) fell = true
  }
  assert.ok(spawned >= 10, 'seeds keep coming')
  assert.ok(fell, 'uncaught seeds fall off the end')
  assert.equal(g.bonusCaught, 0)
  // Stand at a lane's end (pushing against the pillar, so the water can't carry you off) and
  // catch what comes along.
  place(gd, 12, 3)
  for (let i = 0; i < 600 && !g.bonusCaught; i++) g.update(hold('up'))
  assert.ok(g.bonusCaught > 0, 'caught a seed')
}

// --- the bosses, driven through a test host -------------------------------------------------

function testHost(
  open: (x: number, y: number) => boolean,
  gardeners: Tile[],
): BossHost & {
  hedges: Set<string>
  bonks: string[]
  channels: boolean
  said: string[]
} {
  const hedges = new Set<string>()
  const host = {
    hedges,
    bonks: [] as string[],
    channels: false,
    said: [] as string[],
    rng: mulberry32(5),
    ground: (x: number, y: number) =>
      x > 0 && y > 0 && x < 14 && y < 12 && open(x, y),
    free: (x: number, y: number) =>
      host.ground(x, y) &&
      !hedges.has(`${x},${y}`) &&
      !gardeners.some((g) => g.x === x && g.y === y),
    hedge: (x: number, y: number) => hedges.has(`${x},${y}`),
    podAt: () => false,
    gardeners: () => gardeners,
    plantHedge: (x: number, y: number) => void hedges.add(`${x},${y}`),
    clearHedge: (x: number, y: number) => void hedges.delete(`${x},${y}`),
    bonkAt: (x: number, y: number, why: string) => {
      if (gardeners.some((g) => g.x === x && g.y === y)) host.bonks.push(why)
    },
    setChannels: (on: boolean) => {
      host.channels = on
    },
    sound: () => {},
    say: (text: string) => void host.said.push(text),
  }
  return host
}
const tick = (
  boss: { update(h: BossHost): void },
  host: BossHost,
  n: number,
) => {
  for (let i = 0; i < n; i++) boss.update(host)
}
/** Blooms every weak tile once with a fresh chain, as a burst would. */
const bloomWeak = (boss: Bramblebeard | Hector, host: BossHost) => {
  for (const t of boss.weak()) boss.bloom(t.x, t.y, {}, host)
}

// Old Bramblebeard.
{
  const arena = parseMask(SEASONS[0]!.boss.mask)
  const open = (x: number, y: number) => !arena.stone[key(x, y)]
  const gardener = { x: 1, y: 11 }
  const host = testHost(open, [gardener])
  const bb = new Bramblebeard(7, 6)
  assert.equal(bb.body().length, 3, 'three tiles wide')
  assert.deepEqual(bb.weak(), [], 'no weak spot while strolling')
  // Phase 1: it strolls, dropping brambles, and roots every few steps with its roots glowing.
  let rooted = false
  for (let i = 0; i < 600 && !rooted; i++) {
    bb.update(host)
    rooted = bb.weak().length === 4
  }
  assert.ok(rooted, 'it roots, four roots glowing')
  assert.ok(host.hedges.size > 0, 'it drops brambles behind it')
  const same = {}
  for (const t of bb.weak()) bb.bloom(t.x, t.y, same, host)
  assert.equal(bb.hitsLeft, bb.maxHits - 1, 'one burst, one hit')
  for (let n = 0; n < 2; n++) {
    for (let i = 0; i < 900 && !bb.weak().length; i++) bb.update(host)
    bloomWeak(bb, host)
  }
  assert.equal(bb.phase, 2, 'on to phase 2')
  // Phase 2: it walks to the centre, roots, rustles a row (the tell), then sprouts across it.
  tick(bb, host, 400)
  let rustled = false
  for (let i = 0; i < 400 && !rustled; i++) {
    bb.update(host)
    rustled = bb.danger().length > 0
  }
  assert.ok(rustled, 'a row rustles first')
  const row = bb.danger()[0]!.y
  assert.equal(row, gardener.y, 'the gardener’s row')
  tick(bb, host, 80)
  assert.ok(host.bonks.includes('CAUGHT IN A BRAMBLE LINE'), 'the line sprouts')
  for (let n = 0; n < 3 && bb.phase === 2; n++) {
    for (let i = 0; i < 400 && !bb.weak().length; i++) bb.update(host)
    bloomWeak(bb, host)
  }
  assert.equal(bb.phase, 3, 'on to phase 3: it uproots')
  // Phase 3: it stomps (the tell), then charges; its back is the weak spot.
  host.hedges.clear()
  let stomped = false
  for (let i = 0; i < 200 && !stomped; i++) {
    bb.update(host)
    stomped = bb.danger().length > 0 && !bb.weak().length
  }
  assert.ok(stomped, 'a stomp before the charge')
  for (let n = 0; n < 2; n++) {
    for (let i = 0; i < 600 && !bb.weak().length; i++) bb.update(host)
    bloomWeak(bb, host)
  }
  assert.equal(bb.hitsLeft, 0)
  assert.ok(!bb.done, 'celebrating first')
  assert.deepEqual(bb.body(), [], 'a rose bush, not a wall')
  tick(bb, host, 200)
  assert.ok(bb.done, 'then done')
}

// Hothouse Hector.
{
  const arena = parseMask(SEASONS[1]!.boss.mask)
  const open = (x: number, y: number) => !arena.stone[key(x, y)]
  const valves = arena.valves.map((k) => ({
    x: k % COLS,
    y: Math.floor(k / COLS),
  }))
  const gardener = { x: 9, y: 7 }
  const host = testHost(open, [gardener])
  const hc = new Hector(7, 1, valves)
  assert.equal(hc.weak().length, 4, 'phase 1: four valves to vent')
  // The gauge swings to the gardener's column (the tell) before the steam comes down it.
  let told = false
  for (let i = 0; i < 300 && !told; i++) {
    hc.update(host)
    told = hc.danger().some((t) => t.x === 9)
  }
  assert.ok(told, 'the gauge picks the gardener’s column')
  assert.equal(host.bonks.length, 0, 'no steam yet')
  tick(hc, host, 70)
  assert.ok(host.bonks.includes('SCALDED BY STEAM'), 'then the steam')
  bloomWeak(hc, host)
  assert.equal(hc.phase, 2, 'all four valves vented')
  assert.ok(host.channels, 'he switches the channels on')
  // Phase 2: docked at the foot of the channels; a pod ridden in blooms his tile.
  tick(hc, host, 120)
  assert.deepEqual(hc.body(), [{ x: 7, y: 9 }], 'docked')
  for (let n = 0; n < 3; n++) {
    for (let i = 0; i < 100 && !hc.weak().length; i++) hc.update(host)
    hc.bloom(7, 9, {}, host)
  }
  assert.equal(hc.phase, 3)
  assert.ok(!host.channels, 'channels off again')
  // Phase 3: a shadow marks the landing (the tell), the landing shakes, the hatch opens.
  let shadow = false
  for (let i = 0; i < 200 && !shadow; i++) {
    hc.update(host)
    shadow = hc.danger().length > 0
  }
  assert.ok(shadow, 'the landing is marked')
  for (let n = 0; n < 3; n++) {
    for (let i = 0; i < 300 && !hc.weak().length; i++) hc.update(host)
    hc.bloom(hc.weak()[0]!.x, hc.weak()[0]!.y, {}, host)
  }
  assert.equal(hc.hitsLeft, 0)
  tick(hc, host, 200)
  assert.ok(hc.done, 'a friendly sprinkler')
}

// A boss plot in the cabinet: beating the boss clears it, then the Potting Shed opens.
{
  const g = at(7)
  assert.equal(g.step.kind, 'boss')
  assert.ok(g.boss)
  assert.equal(g.music, MUSIC.BOSS_MUSIC)
  const seedsBefore = g.seeds
  ;(g.boss as unknown as { done: boolean }).done = true
  const scoreBefore = g.score
  g.update(empty())
  assert.ok(g.clear > 0, 'the plot clears')
  assert.ok(g.score - scoreBefore >= 5000, 'with the boss bonus')
  assert.ok(g.seeds > seedsBefore)
  run(g, 160)
  assert.ok(g.shed, 'the Potting Shed opens')
  assert.equal(g.music, MUSIC.SHED_MUSIC)
}

// The Potting Shed: prices rise each season; buy a spare, a variety and a hint; then on to Summer.
{
  assert.ok(shedPrice('spare', 2) > shedPrice('spare', 1), 'prices rise')
  assert.equal(nextVariety(['sunflower', 'clover']), 'dandelion')
  assert.equal(
    shedBlock(
      'spare',
      { seeds: 0, spares: 2, pouch: ['sunflower'], hint: false },
      1,
    ),
    'NOT ENOUGH SEEDS',
  )
  const g = at(7)
  ;(g.boss as unknown as { done: boolean }).done = true
  run(g, 155)
  assert.ok(g.shed)
  g.seeds = 100
  const spares = g.spares
  g.update(tap('a'))
  assert.equal(g.spares, spares + 1, 'a spare')
  g.update(tap('down'))
  g.update(tap('a'))
  assert.ok(g.gardeners[0]!.pouch.includes('clover'), 'a starting variety')
  g.update(tap('down'))
  g.update(tap('a'))
  assert.ok(g.hint, 'a golden hint')
  g.update(tap('a'))
  assert.equal(g.shed!.note, 'HINT BOUGHT')
  assert.ok(g.seeds < 100)
  g.update(tap('down'))
  g.update(tap('a'))
  assert.equal(g.shed, null, 'back to the garden')
  assert.equal(g.stepIndex, 8)
  assert.equal(g.step.season.id, 'summer')
  assert.ok(g.card > 0, 'the summer card')
  assert.ok(g.hint, 'the hint lasts the season')
  // The run saved at the start of Summer.
  const saved = readSeedSave(g.save)!
  assert.equal(saved.season, 1)
  assert.ok(saved.pouch.includes('clover'))
  assert.equal(saved.spares, spares + 1)
  assert.ok(saved.hint)
}

// Save and resume: an offered season continues (A), or a new garden starts (B).
{
  assert.equal(readSeedSave({ v: 2 }), null)
  assert.equal(readSeedSave('nope'), null)
  const clean = readSeedSave({
    v: 1,
    season: 1,
    score: 1234,
    spares: 3,
    seeds: 20,
    pouch: ['clover', 'bogus'],
    golden: ['potting-path', 'not-a-plot'],
    hint: true,
  })!
  assert.deepEqual(clean.pouch, ['sunflower', 'clover'])
  assert.deepEqual(clean.golden, ['potting-path'])
  const g = game(3, { resume: clean })
  assert.ok(g.offer, 'a continue is offered')
  assert.equal(g.music, null)
  g.update(tap('a'))
  assert.equal(g.offer, null)
  assert.equal(g.step.season.id, 'summer', 'back at Summer')
  assert.equal(g.score, 1234)
  assert.equal(g.spares, 3)
  assert.ok(g.gardeners[0]!.pouch.includes('clover'))
  const fresh = game(3, { resume: clean })
  fresh.update(tap('b'))
  assert.equal(fresh.step.season.id, 'spring', 'a new garden')
  assert.deepEqual(
    readSeedSave(fresh.save)!.golden,
    ['potting-path'],
    'golden seeds are kept',
  )
  // A game over keeps the season for a continue, never the score.
  const lost = game(3)
  lost.card = 0
  for (const gd of lost.gardeners) gd.down = -1
  lost.spares = 0
  lost.update(empty())
  assert.ok(lost.over)
  assert.equal(readSeedSave(lost.save)!.continued, true)
}

// Music follows the step.
{
  const g = at(0)
  assert.equal(g.music, MUSIC.SPRING_MUSIC)
  g.buildStep(3)
  assert.equal(g.music, MUSIC.BONUS_MUSIC)
  g.buildStep(9)
  assert.equal(g.music, MUSIC.SUMMER_MUSIC)
}

// --- pilot probe -------------------------------------------------------------------------------

// The attract pilot fights each boss to the end of the plot or of the run, and never scores.
for (const step of [7, 15]) {
  let beaten = false
  for (const seed of [1, 2]) {
    const g = game(seed, { demo: true })
    g.buildStep(step)
    g.card = 0
    let t = 0
    for (; t < 60 * 60 * 6 && !g.over && g.stepIndex === step; t++)
      g.update(empty())
    assert.ok(
      g.over || g.stepIndex !== step,
      `boss ${step} seed ${seed}: the fight ends`,
    )
    assert.equal(g.score, 0, 'the attract demo never scores')
    if (!g.over) beaten = true
  }
  assert.ok(beaten, `the pilot can beat the boss at step ${step}`)
}
// Every step of both seasons runs and draws for a while under the pilot without a hitch.
{
  const stub = new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === 'createRadialGradient' || prop === 'createLinearGradient'
          ? () => ({ addColorStop: () => {} })
          : prop === 'measureText'
            ? () => ({ width: 1 })
            : () => {},
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D
  for (let step = 0; step < STEPS_PER_SEASON * 2; step++) {
    const g = game(step + 1, { demo: true })
    g.buildStep(step)
    for (let t = 0; t < 600 && !g.over; t++) {
      g.update(empty())
      if (t % 50 === 0) g.render(stub)
    }
    assert.equal(g.score, 0)
  }
}
// An idle player in Summer is still rained on in the end: runs end.
{
  const g = game(9)
  g.buildStep(8)
  let t = 0
  for (; t < 60 * 60 * 12 && !g.over; t++) g.update(empty())
  assert.ok(g.over, 'an idle run ends')
}
console.log('seed burst seasons ok')
