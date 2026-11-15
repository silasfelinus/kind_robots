// Seed Burst depth pass, slice 1 (conductor kr-arcade/t-136, depth-pass CABINETS.md section 24):
// the Seed Pouch (six burst shapes, swapped with B), growing flowerbeds and In Bloom %, the Garden
// Gate with its bell, golden seeds, dropped power on a bonk, the Grumble Cloud, six new grumps with
// their tells, and plot data as the source of difficulty. Ends with a pilot probe: runs still end
// and the attract demo scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetSeedBurstPouchGate.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import seedBurst from '../arcade/games/seedBurst'
import { ARCADE_GAMES } from '../arcade/games'
import {
  BED_GROW,
  bedStage,
  dropPower,
  dropSpots,
  inBloomPercent,
} from '../arcade/seedBurst/garden'
import {
  BELL_GAP,
  BELL_MAX,
  BELL_RUMBLE,
  BULLY_SPARK,
  HOP_AIR,
  HOP_CROUCH,
  MOLE_WOBBLE,
  chargeLane,
  hopLanding,
  moundSpot,
} from '../arcade/seedBurst/grumps'
import {
  LOOP_GNATS_MAX,
  PLOTS,
  PLOT_COLS,
  PLOT_ROWS,
  parseMask,
  planPlot,
} from '../arcade/seedBurst/plots'
import {
  BRAMBLE_LINE,
  VARIETIES,
  brambleLine,
  burstTiles,
  nextSeed,
} from '../arcade/seedBurst/pouch'
import type { TileLook } from '../arcade/seedBurst/pouch'
import type { ArcadeGameInstance, InputFrame } from '../arcade/types'

const quiet = { play: () => {} }
/** A pod's fuse in ticks. */
const FUSE_TICKS = 150
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

// --- plots are data ---------------------------------------------------------------

assert.ok(PLOTS.length >= 8, 'at least eight authored plots')
assert.equal(new Set(PLOTS.map((p) => p.id)).size, PLOTS.length)
const corners = [
  [1, 1],
  [PLOT_COLS - 2, PLOT_ROWS - 2],
  [PLOT_COLS - 2, 1],
  [1, PLOT_ROWS - 2],
] as const
for (const plot of PLOTS) {
  assert.equal(plot.mask.length, PLOT_ROWS, `${plot.id}: 13 rows`)
  for (const row of plot.mask)
    assert.equal(row.length, PLOT_COLS, `${plot.id}: 15 columns`)
  assert.ok(/^[#H?.C]+$/.test(plot.mask.join('')), `${plot.id}: legend`)
  assert.equal(plot.mask.join('').split('C').length - 1, 1, `${plot.id}: heap`)
  const mask = parseMask(plot.mask)
  const hx = mask.heap % PLOT_COLS
  const hy = Math.floor(mask.heap / PLOT_COLS)
  for (const [cx, cy] of corners) {
    assert.ok(Math.abs(cx - hx) + Math.abs(cy - hy) >= 6, `${plot.id}: heap`)
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ] as const) {
      const x = cx + dx
      const y = cy + dy
      if (x <= 0 || y <= 0 || x >= PLOT_COLS - 1 || y >= PLOT_ROWS - 1) continue
      assert.ok(!mask.stone[y * PLOT_COLS + x], `${plot.id}: corner clear`)
    }
  }
  assert.equal(plot.bell.length, 3, `${plot.id}: the bell calls three`)
  for (const v of plot.offers) assert.ok(VARIETIES.includes(v))
  assert.ok(plot.density > 0 && plot.density < 1)
}
// The six new grumps all appear in the plot scripts.
for (const kind of ['slug', 'mole', 'hopper', 'bully', 'thief', 'puffball'])
  assert.ok(
    PLOTS.some((p) => (p.grumps as Record<string, number>)[kind]),
    `${kind} is scripted`,
  )
// Every variety but the starting Sunflower is offered somewhere.
for (const v of VARIETIES.filter((v) => v !== 'sunflower'))
  assert.ok(
    PLOTS.some((p) => p.offers.includes(v)),
    `${v} is offered`,
  )
// The loop quickens the grumps and adds gnats, capped.
const first = planPlot(0)
const lap = planPlot(PLOTS.length)
const late = planPlot(PLOTS.length * 20)
assert.equal(lap.plot, first.plot)
assert.equal(lap.loop, 1)
assert.ok(lap.speed > first.speed)
assert.equal(lap.roster.length, first.roster.length + 1)
assert.equal(late.roster.length, first.roster.length + LOOP_GNATS_MAX)
assert.ok(late.speed <= first.plot.speed * 1.6 + 1e-9)

// --- the pouch's six shapes ------------------------------------------------------------

// A 9 x 9 test board: '#' stone, 'h' hedge, 'p' pod, '.' open.
const board = [
  '#########',
  '#.......#',
  '#.#...#.#',
  '#...h...#',
  '#.#...#.#',
  '#..p....#',
  '#.#.#.#.#',
  '#.......#',
  '#########',
]
const look = (x: number, y: number): TileLook => {
  const ch = board[y]?.[x] ?? '#'
  return {
    kind: ch === '#' ? 'stone' : ch === 'h' ? 'hedge' : 'open',
    border: x <= 0 || y <= 0 || x >= 8 || y >= 8,
    pod: ch === 'p',
  }
}
const at = (tiles: ReturnType<typeof burstTiles>) =>
  new Map(tiles.map((t) => [`${t.x},${t.y}`, t.hit]))
const up = { dx: 0, dy: -1 }

// Sunflower: a cross; an arm stops at the first hedge (clearing it) and at a pod (setting it off).
const sun = at(burstTiles('sunflower', 4, 5, up, 3, look))
assert.equal(sun.get('4,4'), 'open')
assert.equal(sun.get('4,3'), 'hedge')
assert.ok(!sun.has('4,2'), 'the hedge stops the arm')
assert.equal(sun.get('3,5'), 'pod')
assert.ok(!sun.has('2,5'), 'a pod stops the arm')
assert.equal(sun.get('7,5'), 'open')
// Clover: an X that hops the stone pillars but never the garden wall.
const clover = at(burstTiles('clover', 3, 3, up, 3, look))
assert.ok(!clover.has('2,2'), 'no bloom on a pillar')
assert.equal(clover.get('1,1'), 'open', 'hopped the pillar')
assert.equal(clover.get('4,4'), 'open')
assert.equal(clover.get('5,5'), 'open')
assert.ok(!clover.has('3,2') && !clover.has('2,3'), 'no cross arms')
assert.ok(![...clover.keys()].some((k) => k.startsWith('0,')), 'never the wall')
// Dandelion: fluff floats over hedges, downwind, without clearing them.
const fluff = at(burstTiles('dandelion', 4, 5, up, 2, look))
assert.equal(fluff.get('4,3'), 'over')
assert.equal(fluff.get('4,2'), 'open')
assert.equal(fluff.get('4,1'), 'open', 'reach + 2')
assert.ok(!fluff.has('5,5') && !fluff.has('4,6'), 'one direction only')
// Pumpkin: the eight tiles around it, stone skipped.
const pumpkin = at(burstTiles('pumpkin', 3, 3, up, 1, look))
assert.equal(pumpkin.size, 1 + 6)
assert.equal(pumpkin.get('4,3'), 'hedge')
assert.ok(!pumpkin.has('2,2') && !pumpkin.has('2,4'), 'stone is skipped')
// Bramble and Puffcap burst as crosses.
assert.deepEqual(
  at(burstTiles('bramble', 4, 5, up, 3, look)),
  sun,
  'bramble pods are crosses',
)
assert.deepEqual(at(burstTiles('puffcap', 4, 5, up, 3, look)), sun)
// Bramble lays up to four pods ahead while the way is clear.
const open = (x: number, y: number) => look(x, y).kind === 'open'
assert.equal(brambleLine(1, 7, { dx: 1, dy: 0 }, 6, open).length, BRAMBLE_LINE)
assert.equal(brambleLine(1, 7, { dx: 1, dy: 0 }, 2, open).length, 2)
assert.equal(brambleLine(1, 1, { dx: 0, dy: -1 }, 6, open).length, 1)
assert.equal(nextSeed(['sunflower', 'clover'], 1), 0)
assert.equal(nextSeed(['sunflower', 'clover', 'pumpkin'], 0), 1)

// --- garden, power drops and grump rules (pure) ------------------------------------------

assert.equal(bedStage(0), 0)
assert.equal(bedStage(BED_GROW / 2), 1)
assert.equal(bedStage(BED_GROW), 2)
assert.equal(
  inBloomPercent(
    new Map([
      [1, BED_GROW],
      [2, BED_GROW],
      [3, 10],
    ]),
    8,
  ),
  25,
)
const base = { pods: 1, range: 2, speed: 1 }
assert.deepEqual(dropPower(base, base, 0.25).drops, [], 'nothing to lose')
const dropped = dropPower({ pods: 3, range: 5, speed: 1.5 }, base, 0.25)
assert.deepEqual(dropped.drops, ['pod', 'bloom', 'shoe'])
assert.deepEqual(dropped.keep, { pods: 2, range: 4, speed: 1.25 })
const spots = dropSpots({ x: 4, y: 3 }, 3, open, mulberry32(1))
assert.equal(spots.length, 3)
for (const s of spots) {
  assert.ok(open(s.x, s.y))
  assert.ok(Math.abs(s.x - 4) + Math.abs(s.y - 3) <= 2)
}
assert.deepEqual(
  chargeLane({ x: 1, y: 7 }, [{ x: 6, y: 7 }], open),
  { dx: 1, dy: 0 },
  'a clear lane',
)
assert.equal(
  chargeLane({ x: 4, y: 5 }, [{ x: 4, y: 1 }], open),
  null,
  'the hedge blocks the lane',
)
const hopLook = (x: number, y: number) =>
  look(x, y).kind === 'hedge'
    ? ('hedge' as const)
    : look(x, y).kind === 'open'
      ? ('open' as const)
      : ('blocked' as const)
assert.deepEqual(hopLanding({ x: 4, y: 4 }, up, hopLook), { x: 4, y: 2 })
assert.equal(hopLanding({ x: 4, y: 5 }, { dx: 1, dy: 0 }, hopLook), null)
const mound = moundSpot({ x: 3, y: 7 }, open, 0)!
assert.equal(Math.abs(mound.x - 3) + Math.abs(mound.y - 7), 2)

// --- the cabinet ---------------------------------------------------------------------

type Dir = { dx: number; dy: number }
type Gardener = {
  seat: number
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  facing: Dir
  pods: number
  range: number
  speed: number
  safe: number
  down: number
  pouch: string[]
  seed: number
}
type Grump = {
  kind: string
  tx: number
  ty: number
  nx: number
  ny: number
  p: number
  dir: Dir
  speed: number
  dead: boolean
  phase: string
  timer: number
  cooldown: number
  shell: boolean
  loot: string | null
  immune: unknown
}
type Pod = {
  x: number
  y: number
  variety: string
  fuse: number
  roll: Dir | null
}
type Inner = ArcadeGameInstance & {
  grid: number[]
  gardeners: Gardener[]
  grumps: Grump[]
  pods: Pod[]
  blooms: { x: number; y: number }[]
  beds: Map<number, number>
  powers: Map<number, string>
  hidden: Map<number, string>
  gate: { k: number; open: boolean; rings: number }
  bells: { kinds: string[]; timer: number }[]
  heap: number
  cloud: { x: number; y: number } | null
  timer: number
  golden: number
  clear: number
  spares: number
  plan: { plot: { id: string } }
  buildPlot(index: number): void
  newGrump(kind: string, x: number, y: number): Grump
}
const COLS = PLOT_COLS
const key = (x: number, y: number) => y * COLS + x

/** A fresh one-gardener game on plot `index`, with every hedge and grump cleared away. */
function sandbox(index = 0, seed = 3): Inner {
  const game = seedBurst.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as Inner
  if (index) game.buildPlot(index)
  game.grid = game.grid.map((c) => (c === 2 ? 0 : c))
  game.grumps = []
  game.hidden.clear()
  game.powers.clear()
  game.gardeners[0]!.safe = 0
  return game
}
function run(game: Inner, ticks: number, frame: () => InputFrame = empty) {
  for (let i = 0; i < ticks && !game.over; i++) game.update(frame())
}
function place(g: Gardener, x: number, y: number) {
  g.tx = g.nx = x
  g.ty = g.ny = y
  g.p = 0
}

// Every plot places its whole grump script, on several seeds.
for (let i = 0; i < PLOTS.length; i++)
  for (const seed of [1, 2, 3]) {
    const game = seedBurst.create({
      rng: mulberry32(seed),
      sound: quiet,
      demo: false,
      hiScore: 0,
    }) as Inner
    game.buildPlot(i)
    assert.equal(game.plan.plot.id, PLOTS[i]!.id)
    assert.equal(game.grumps.length, planPlot(i).roster.length, PLOTS[i]!.id)
    assert.ok(game.gate.k >= 0 && game.grid[game.gate.k] === 2, 'gate hidden')
    assert.ok(
      [...game.hidden.values()].includes('golden'),
      `${PLOTS[i]!.id}: a golden seed`,
    )
    for (const v of PLOTS[i]!.offers)
      assert.ok([...game.hidden.values()].includes(v), `${v} packet hidden`)
  }

// B swaps seeds; each variety plants its own pod.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.pouch = ['sunflower', 'clover']
  game.update(tap('b'))
  assert.equal(g.seed, 1, 'B swaps to the clover')
  place(g, 3, 3)
  game.update(tap('a'))
  assert.equal(game.pods[0]!.variety, 'clover')
  game.pods[0]!.fuse = 1
  game.gardeners[0]!.safe = 999
  game.update(empty())
  const bloomed = new Set(game.blooms.map((b) => `${b.x},${b.y}`))
  for (const tile of ['5,5', '1,1', '5,1', '1,5'])
    assert.ok(bloomed.has(tile), `clover hops the pillars to ${tile}`)
  assert.ok(!bloomed.has('4,4') && !bloomed.has('2,2'), 'not on the pillars')
  assert.ok(!bloomed.has('3,4') && !bloomed.has('4,3'), 'no cross arms')
  game.update(tap('b'))
  assert.equal(g.seed, 0, 'and back to the sunflower')
}

// Puffcap: A plants it, A again bursts it at once.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.pouch = ['puffcap']
  g.pods = 2
  game.update(tap('a'))
  assert.equal(game.pods.length, 1)
  assert.ok(game.pods[0]!.fuse > 300, 'a puffcap waits')
  game.update(tap('a'))
  assert.equal(game.pods.length, 0, 'the second press bursts it')
  assert.ok(game.blooms.length > 1)
}

// Bramble: one press lays a line of pods ahead.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.pouch = ['bramble']
  g.pods = 4
  place(g, 1, 3)
  g.facing = { dx: 1, dy: 0 }
  game.update(tap('a'))
  assert.deepEqual(
    game.pods.map((p) => `${p.x},${p.y}`),
    ['1,3', '2,3', '3,3', '4,3'],
  )
}

// Pumpkin: walking into one rolls it until something stops it.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.pouch = ['pumpkin']
  place(g, 1, 3)
  game.update(tap('a'))
  run(game, 40, () => hold('up'))
  assert.equal(g.ty, 1, 'stepped off the pumpkin')
  run(game, 20, () => hold('down'))
  const pod = game.pods[0]!
  assert.ok(pod.roll, 'walking into it set it rolling')
  run(game, 40)
  assert.ok(pod.y > 3, 'it rolled down the column')
}

// The garden grows: bloomed tiles become beds, flower in ten seconds and slow grumps.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  place(g, 5, 5)
  game.update(tap('a'))
  g.safe = 9999
  run(game, 160)
  assert.ok(game.beds.size >= 5, 'every bloomed tile is a bed')
  assert.ok(inBloomPercent(game.beds, 1) === 0, 'not flowered yet')
  run(game, BED_GROW)
  const flowered = [...game.beds.values()].filter((a) => a >= BED_GROW)
  assert.equal(flowered.length, game.beds.size)
  // A gnat on a flowered tile moves at half pace.
  const [bed] = [...game.beds.keys()].filter(
    (k) => game.grid[k] === 0 && k !== key(5, 5),
  )
  const gx = bed! % COLS
  const gy = Math.floor(bed! / COLS)
  const slowGame = game
  const fast = slowGame.newGrump('gnat', 7, 1)
  const slow = slowGame.newGrump('gnat', gx, gy)
  slowGame.beds.delete(key(7, 1))
  fast.dir = slow.dir = { dx: 0, dy: 0 }
  slowGame.grumps = [fast, slow]
  g.down = 50
  slowGame.update(empty())
  assert.ok(Math.abs(slow.p * 2 - fast.p) < 1e-9, 'flowers halve the pace')
}

// The Garden Gate: blooming its hedge rings the bell; three grumps climb out of the heap.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.safe = 99999
  const gx = game.gate.k % COLS
  const gy = Math.floor(game.gate.k / COLS)
  game.grid[game.gate.k] = 2
  game.gardeners[0]!.range = 1
  // Stand beside the gate's hedge and plant.
  const side = [
    [gx - 1, gy],
    [gx + 1, gy],
    [gx, gy - 1],
    [gx, gy + 1],
  ].find(([x, y]) => game.grid[key(x!, y!)] === 0)!
  place(g, side[0]!, side[1]!)
  game.update(tap('a'))
  run(game, 155)
  assert.ok(game.gate.open, 'the gate is found')
  assert.equal(game.gate.rings, 1, 'the bell rang')
  assert.equal(game.bells.length, 1)
  run(game, BELL_RUMBLE + BELL_GAP * 2 + 2)
  assert.equal(game.grumps.length, 3, 'three grumps from the compost heap')
  assert.equal(game.bells.length, 0)
  // Blooming the found gate again rings again, up to BELL_MAX.
  game.grumps = []
  for (let i = 0; i < 3; i++) {
    place(g, side[0]!, side[1]!)
    game.update(tap('a'))
    run(game, 155)
  }
  assert.equal(game.gate.rings, BELL_MAX)
  game.grumps = []
  game.bells = []
  // With every grump turned, the gate opens and a gardener steps through.
  const before = game.score
  game.beds.set(key(1, 1), BED_GROW)
  place(g, gx, gy)
  game.update(empty())
  assert.ok(game.clear > 0, 'stepping through the open gate clears the plot')
  assert.ok(game.score - before >= 1000, 'with the clear bonus')
  run(game, 160)
  assert.equal(game.level, 2, 'on to the next plot')
  assert.equal(game.plan.plot.id, PLOTS[1]!.id)
}

// The gate stays shut while grumps remain.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  game.gate.open = true
  game.grid[game.gate.k] = 0
  game.grumps = [game.newGrump('gnat', 13, 5)]
  game.grumps[0]!.speed = 0
  place(g, game.gate.k % COLS, Math.floor(game.gate.k / COLS))
  g.safe = 999
  game.update(empty())
  assert.equal(game.clear, 0, 'shut while a grump is grumpy')
}

// Golden seeds and seed packets are picked up from hedges.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  game.powers.set(key(2, 1), 'golden')
  game.powers.set(key(3, 1), 'dandelion')
  run(game, 40, () => hold('right'))
  assert.equal(game.golden, 1, 'a golden seed')
  assert.ok(g.pouch.includes('dandelion'), 'a new variety in the pouch')
  assert.equal(g.pouch[g.seed], 'dandelion', 'and in hand')
}

// Power has a price: a bonk drops a level of each power nearby, to be won back.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  place(g, 5, 5)
  Object.assign(g, { pods: 3, range: 4, speed: 1.5 })
  const gnat = game.newGrump('gnat', 5, 5)
  gnat.speed = 0
  game.grumps = [gnat]
  game.update(empty())
  assert.ok(g.down > 0, 'bonked')
  assert.deepEqual([g.pods, g.range, g.speed], [2, 3, 1.25])
  const drops = [...game.powers.entries()]
  assert.deepEqual(drops.map(([, p]) => p).sort(), ['bloom', 'pod', 'shoe'])
  for (const [k] of drops)
    assert.ok(
      Math.abs((k % COLS) - 5) + Math.abs(Math.floor(k / COLS) - 5) <= 2,
    )
}

// The Grumble Cloud replaces the wind gust: no extra gnats, cannot be bloomed, rains on you.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  const gnat = game.newGrump('gnat', 13, 11)
  gnat.speed = 0
  game.grumps = [gnat]
  game.timer = 1
  game.update(empty())
  assert.ok(game.cloud, 'the cloud rolls in')
  assert.equal(game.grumps.length, 1, 'no gust of gnats')
  const spares = game.spares
  run(game, 60 * 40)
  assert.ok(game.spares < spares || g.down !== 0, 'it caught the gardener')
  assert.ok(game.cloud, 'and nothing blooms it away')
}

// Sulky slug: the first bloom knocks its shell off; only a second bloom turns it.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.safe = 9999
  const slug = game.newGrump('slug', 5, 5)
  slug.speed = 0
  game.grumps = [slug]
  place(g, 5, 3)
  game.update(tap('a'))
  run(game, FUSE_TICKS + 30)
  assert.equal(slug.shell, false, 'shell off')
  assert.equal(slug.dead, false, 'but still grumpy')
  assert.equal(game.grumps.length, 1)
  assert.ok(slug.speed > 0, 'the bare slug hurries')
  slug.speed = 0
  slug.tx = slug.nx = 5
  slug.ty = slug.ny = 5
  slug.p = 0
  place(g, 5, 3)
  game.update(tap('a'))
  run(game, FUSE_TICKS + 5)
  assert.equal(game.grumps.length, 0, 'the second bloom turns it')
  // A bramble line catches it in one go: two blooms in a row.
  const again = sandbox()
  const g2 = again.gardeners[0]!
  g2.safe = 9999
  g2.pouch = ['bramble']
  g2.pods = 3
  const slug2 = again.newGrump('slug', 3, 3)
  slug2.speed = 0
  again.grumps = [slug2]
  place(g2, 1, 3)
  g2.facing = { dx: 1, dy: 0 }
  again.update(tap('a'))
  run(again, FUSE_TICKS + 5)
  assert.equal(again.grumps.length, 0, 'bramble pods bloom twice at once')
}

// Burrow mole: safe underground, caught on its wobbling mound, pinned by a pod.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.safe = 9999
  const mole = game.newGrump('mole', 7, 7)
  game.grumps = [mole]
  mole.phase = 'under'
  mole.timer = 1
  game.update(empty())
  assert.equal(mole.phase, 'mound', 'it surfaces as a mound')
  const d = Math.abs(mole.tx - g.tx) + Math.abs(mole.ty - g.ty)
  assert.ok(d >= 2 && d <= 3, 'beside the gardener, not on top')
  assert.equal(mole.timer, MOLE_WOBBLE, 'a second of wobble first')
  // A pod on the mound keeps it down until the pod bursts and turns it.
  place(g, mole.tx, mole.ty)
  game.update(tap('a'))
  run(game, MOLE_WOBBLE + 10)
  assert.equal(mole.phase, 'mound', 'pinned under the pod')
  run(game, FUSE_TICKS)
  assert.equal(game.grumps.length, 0, 'the burst on the mound turns it')
  // Underground it cannot be bloomed.
  const deep = sandbox()
  const m2 = deep.newGrump('mole', 5, 5)
  m2.phase = 'under'
  m2.timer = 999
  deep.grumps = [m2]
  const g3 = deep.gardeners[0]!
  g3.safe = 9999
  place(g3, 5, 3)
  deep.update(tap('a'))
  run(deep, FUSE_TICKS + 5)
  assert.equal(deep.grumps.length, 1, 'safe underground')
}

// Hedge hopper: crouches (tell), hops the hedge, lands two tiles on.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  place(g, 13, 11)
  g.safe = 9999
  game.grid[key(7, 4)] = 2
  const hopper = game.newGrump('hopper', 7, 5)
  game.grumps = [hopper]
  // It may wander on instead (the hop is a 60% call): set it back and try again.
  for (let i = 0; i < 40 && hopper.phase !== 'tell'; i++) {
    Object.assign(hopper, { tx: 7, nx: 7, ty: 5, ny: 5, p: 0, cooldown: 0 })
    hopper.dir = { dx: 0, dy: -1 }
    game.update(empty())
  }
  assert.equal(hopper.phase, 'tell', 'it crouches at the hedge')
  assert.deepEqual([hopper.nx, hopper.ny], [7, 3], 'the landing tile is marked')
  run(game, HOP_CROUCH)
  assert.equal(hopper.phase, 'air')
  run(game, HOP_AIR + 1)
  assert.equal(hopper.phase, 'walk')
  assert.deepEqual([hopper.tx, hopper.ty], [7, 3], 'over the hedge')
}

// Buzz bully: sparks with a gardener down a clear lane, then charges at double speed and more.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  place(g, 1, 5)
  g.safe = 9999
  const bully = game.newGrump('bully', 7, 5)
  bully.cooldown = 0
  game.grumps = [bully]
  const pace = bully.speed
  game.update(empty())
  assert.equal(bully.phase, 'tell', 'it sparks first')
  assert.deepEqual(bully.dir, { dx: -1, dy: 0 })
  run(game, BULLY_SPARK)
  assert.equal(bully.phase, 'charge')
  const p0 = bully.tx - bully.p
  game.update(empty())
  const moved = Math.abs(bully.tx + bully.p * bully.dir.dx - p0) * 16
  assert.ok(moved > pace * 1.9, 'charges at double speed or more')
}

// Seed thief: takes a pod to the compost heap; bloomed with loot, it drops it with a bonus.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.safe = 9999
  game.powers.set(key(3, 1), 'pod')
  const thief = game.newGrump('thief', 5, 1)
  game.grumps = [thief]
  for (let i = 0; i < 400 && !thief.loot; i++) game.update(empty())
  assert.equal(thief.loot, 'pod', 'it grabs the pickup')
  assert.ok(!game.powers.has(key(3, 1)))
  thief.speed = 0
  thief.p = 0
  place(g, thief.tx, thief.ty + 2)
  if (game.grid[key(g.tx, g.ty)] !== 0) place(g, thief.tx + 2, thief.ty)
  const before = game.score
  game.update(tap('a'))
  run(game, FUSE_TICKS + 5)
  assert.ok(thief.dead, 'bloomed')
  assert.ok(game.score - before >= 500 + 200, 'loot bonus')
  assert.equal(
    game.powers.get(key(thief.tx, thief.ty)),
    'pod',
    'the loot drops where it fell',
  )
}

// Puffball: a bloom bursts it into four spores that shrug off that same bloom.
{
  const game = sandbox()
  const g = game.gardeners[0]!
  g.safe = 9999
  const puff = game.newGrump('puffball', 5, 5)
  puff.speed = 0
  game.grumps = [puff]
  place(g, 5, 3)
  game.update(tap('a'))
  run(game, FUSE_TICKS + 2)
  assert.equal(game.grumps.length, 4, 'four spore gnats')
  assert.ok(game.grumps.every((s) => s.kind === 'spore'))
}

// --- pilot probe -------------------------------------------------------------------------

const meta = ARCADE_GAMES.find((m) => m.slug === 'seed-burst')!
let demoCleared = false
for (const seed of [2, 3, 4]) {
  const demo = seedBurst.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: true,
    hiScore: 0,
  })
  let t = 0
  for (; t < 60 * 60 * 20 && !demo.over; t++) demo.update(empty())
  assert.equal(demo.score, 0, 'the attract demo never scores')
  assert.ok(demo.over, `demo ${seed} ends by itself`)
  if (demo.level >= 2) demoCleared = true
}
assert.ok(demoCleared, 'the pilot finds a gate and clears a plot')
{
  // A player who never moves is rained on in the end: runs still end.
  const idle = seedBurst.create({
    rng: mulberry32(9),
    sound: quiet,
    demo: false,
    hiScore: 0,
  })
  let t = 0
  for (; t < 60 * 60 * 10 && !idle.over; t++) idle.update(empty())
  assert.ok(idle.over, 'an idle run ends')
  assert.ok(idle.score <= meta.maxPlausibleScore)
}
console.log('seed burst pouch, gate and grumps ok')
