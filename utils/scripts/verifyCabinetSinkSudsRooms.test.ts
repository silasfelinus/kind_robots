// Sink Suds depth pass, slice 2 (conductor kr-arcade/t-044): the room engine with save/resume,
// Wash Cycle 1 (Kitchen Sink and Bath Time, with Dish Stack and Duck Round-up), the scum slug and
// the loofah, shampoo slicks, the drying rack, the power-ups, the Soap Shop and Bristleton.
//
//   npx tsx utils/scripts/verifyCabinetSinkSudsRooms.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  MAX_STAGE,
  PESTS,
  ROOMS,
  SHOP_ITEMS,
  SPECIAL_BONUS,
  TRAP_POINTS,
  create,
  readSudsSave,
} from '../arcade/games/sinkSuds'
import type {
  Bubble,
  Duck,
  Float,
  Pest,
  Plate,
  SudsSave,
} from '../arcade/games/sinkSuds'
import { BASINS } from '../arcade/sinkSuds/basins'
import type { Grime } from '../arcade/sinkSuds/grime'
import { CYCLES, DUCK_PEN, campaignSteps } from '../arcade/sinkSuds/rooms'
import type { BasinPlan, Step } from '../arcade/sinkSuds/rooms'
import { BARS, POWERS, PUFF } from '../arcade/sinkSuds/shop'
import type { PowerKind } from '../arcade/sinkSuds/shop'
import type { Bristleton } from '../arcade/sinkSuds/bristleton'
import { BRUSH_LEN } from '../arcade/sinkSuds/bristleton'
import { MUSIC } from '../arcade/sinkSuds/music'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  save: SudsSave | null | undefined
  music: unknown
  steps: Step[]
  stepIndex: number
  plan: BasinPlan
  basin: (typeof BASINS)[keyof typeof BASINS]
  bubbles: Bubble[]
  pests: Pest[]
  mess: Array<{ x: number; y: number; kind: string; r: number }>
  plates: Plate[]
  ducks: Duck[]
  trail: Array<{ x: number; y: number; life: number }>
  floats: Float[]
  grime: Grime
  shop: { cursor: number; t: number; message: string } | null
  offer: SudsSave | null
  boss: Bristleton | null
  bossDone: number
  specialDone: boolean
  draining: number
  flee: number
  shield: number
  bars: number
  upgrades: { puff: boolean; stage2: boolean }
  skin: string
  golden: Set<string>
  update(input: InputFrame): void
  demoInput(): InputFrame
  beginStep(i: number): void
  pickUp(b: Bubble, kind: PowerKind | 'soap'): void
}

const quiet = { play: () => {} }
function game(seed = 1, resume?: unknown, demo = false): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
    resume,
  }) as unknown as Inner
}
const press = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const idle = () => emptyInput()
function at(step: number, seed = 1): Inner {
  const g = game(seed)
  g.beginStep(step)
  return g
}
/** Clear the basin so one rule can be staged. */
function bare(g: Inner) {
  g.pests = []
  g.mess = []
  g.floats = []
  g.bubbles[0]!.invuln = 0
  return g
}
function pest(
  kind: Pest['kind'],
  x: number,
  y: number,
  extra: Partial<Pest> = {},
): Pest {
  return {
    kind,
    x,
    y,
    vx: 0,
    vy: 0,
    heading: 0,
    turn: 999,
    t: 0,
    state: 'roam',
    trap: 0,
    target: null,
    size: kind === 'lint' ? 5 : 0,
    segs: [],
    ...extra,
  }
}
function cleanAll(g: Inner) {
  for (let y = 0; y < 360; y += 4)
    for (let x = 0; x < 420; x += 4) g.grime.scrub(x, y, 6)
}
/** Sit the bubble on the drain until the basin rinses away. */
function drainOut(g: Inner) {
  const b = g.bubbles[0]!
  const step = g.stepIndex
  for (let t = 0; t < 200 && g.stepIndex === step; t++) {
    b.x = g.basin.drain.x
    b.y = g.basin.drain.y + 6
    g.update(idle())
  }
}

const steps = campaignSteps()
const STEP = {
  kitchen: steps.findIndex(
    (s) => s.kind === 'basin' && s.room === 0 && s.basin === 0,
  ),
  dish: steps.findIndex(
    (s) => s.kind === 'basin' && s.room === 0 && s.basin === 2,
  ),
  rack: steps.findIndex(
    (s) => s.kind === 'basin' && s.room === 0 && s.basin === 3,
  ),
  shop: steps.findIndex((s) => s.kind === 'shop'),
  bath: steps.findIndex(
    (s) => s.kind === 'basin' && s.room === 1 && s.basin === 0,
  ),
  slicks: steps.findIndex(
    (s) => s.kind === 'basin' && s.room === 1 && s.basin === 1,
  ),
  roundup: steps.findIndex(
    (s) => s.kind === 'basin' && s.room === 1 && s.basin === 2,
  ),
  boss: steps.findIndex((s) => s.kind === 'boss'),
}

// --- the campaign as data ------------------------------------------------------------------------
{
  const kinds = steps.map((s) =>
    s.kind === 'basin' ? `${s.room}-${s.basin}` : s.kind,
  )
  assert.deepEqual(
    kinds.slice(0, 11),
    [
      '0-0',
      '0-1',
      '0-2',
      '0-3',
      'shop',
      '1-0',
      '1-1',
      '1-2',
      '1-3',
      'boss',
      'shop',
    ],
    'Kitchen, the shop, Bath Time, Bristleton, then the shop',
  )
  assert.equal(CYCLES[0]!.boss, 'bristleton')
  for (const room of ROOMS) {
    assert.equal(room.basins.length, 4)
    assert.ok(
      room.basins[2].special,
      `${room.id}: basin 3 is the special basin`,
    )
    assert.ok(room.basins.filter((b) => b.special).length === 1)
    for (const plan of room.basins) {
      assert.ok(
        BASINS[plan.basin],
        `${room.id}: ${plan.title} uses a real basin`,
      )
      for (const kind of Object.keys(plan.pests))
        assert.ok(kind in PESTS, `${kind} is a pest`)
    }
  }
  const kitchen = ROOMS[0]!
  assert.deepEqual(
    kitchen.basins.map((b) => b.basin),
    ['oval', 'double', 'oval', 'double'],
    'the oval, the double sink, Dish Stack, and the rack over the double sink',
  )
  assert.ok(kitchen.basins[3].shadows?.length, 'basin 4 has the drying rack')
  const bath = ROOMS[1]!
  assert.ok(
    bath.basins.every((b) => b.basin === 'tub'),
    'Bath Time is the long tub with its current',
  )
  assert.ok(bath.basins[0].ducks?.length && bath.basins[1].slicks?.length)
  assert.ok(
    bath.basins[0].pests.slug && bath.basins[1].pests.loofah,
    'the slug, then the loofah',
  )
  assert.equal(kitchen.basins[2].special, 'dish-stack')
  assert.equal(bath.basins[2].special, 'duck-roundup')
  assert.ok(MUSIC.kitchen && MUSIC.bath && MUSIC.boss && MUSIC.shop)
}

// --- a fresh wash starts in the kitchen and saves there -------------------------------------------
{
  const g = game()
  assert.equal(g.level, 1)
  assert.equal(g.stepIndex, 0)
  assert.equal(g.basin.id, 'oval')
  assert.equal(g.pests.filter((p) => p.kind === 'mite').length, 3)
  assert.equal(g.pests.filter((p) => p.kind === 'sponge').length, 1)
  assert.equal(g.save?.step, 0, 'progress saves at the room start')
  assert.equal(g.music, MUSIC.kitchen)
  // A full bubble down the drain moves on to basin 2.
  bare(g)
  g.bubbles[0]!.stage = MAX_STAGE
  drainOut(g)
  assert.equal(g.stepIndex, 1)
  assert.equal(g.basin.id, 'double')
  assert.equal(g.level, 2)
  assert.equal(g.bars, BARS.basin, 'a soap bar for every basin')
  const demo = game(1, undefined, true)
  assert.equal(demo.save, undefined, 'the attract demo keeps no save')
}

// --- the rack's shadows and slicks ----------------------------------------------------------------
{
  const g = at(STEP.rack)
  assert.ok(g.plan.shadows && g.plan.shadows.length >= 4)
  const s = at(STEP.slicks)
  bare(s)
  const b = s.bubbles[0]!
  const lane = s.plan.slicks![0]!
  const run = (onSlick: boolean) => {
    const t = at(STEP.slicks)
    bare(t)
    const tb = t.bubbles[0]!
    tb.x = lane.x + 10
    tb.y = onSlick ? lane.y + lane.h / 2 : lane.y - 30
    let top = 0
    for (let i = 0; i < 50; i++) {
      t.update(press('right'))
      top = Math.max(top, Math.hypot(tb.vx, tb.vy))
    }
    return top
  }
  assert.ok(run(true) > run(false) * 1.2, 'shampoo slicks are fast lanes')
  assert.ok(b)
}

// --- the scum slug and the loofah --------------------------------------------------------------
{
  const g = at(STEP.bath)
  bare(g)
  const b = g.bubbles[0]!
  // A slug crawling leaves trail; trail makes the going sticky.
  g.pests = [pest('slug', 300, 192)]
  for (let t = 0; t < 120; t++) g.update(idle())
  assert.ok(g.trail.length >= 8, 'the slug leaves a trail')
  const blob = g.trail[0]!
  g.pests = []
  const run = (sticky: boolean) => {
    b.x = blob.x - 40
    b.y = blob.y
    b.vx = 3
    b.vy = 0
    g.trail = sticky
      ? [
          { x: blob.x - 30, y: blob.y, life: 500 },
          { x: blob.x - 20, y: blob.y, life: 500 },
        ]
      : []
    for (let t = 0; t < 12; t++) g.update(idle())
    return b.x
  }
  const free = run(false)
  const stuck = run(true)
  assert.ok(
    stuck < free - 5,
    `a sticky trail slows the bubble (${stuck.toFixed(1)} vs ${free.toFixed(1)})`,
  )
  // The slug is food for a big bubble.
  g.trail = []
  b.stage = 4
  b.invuln = 0
  g.pests = [pest('slug', b.x + 10, b.y)]
  g.update(idle())
  assert.equal(g.pests.length, 0, 'a size-4 bubble eats a scum slug')
  // The loofah soaks; a trapped loofah pays triple.
  const l = at(STEP.slicks)
  bare(l)
  const lb = l.bubbles[0]!
  lb.stage = 4
  l.pests = [pest('loofah', lb.x + 20, lb.y)]
  l.update(idle())
  assert.equal(lb.stage, 3, 'the loofah soaks a stage')
  assert.ok(lb.alive)
  const loofah = l.pests[0]!
  loofah.trap = 2
  const before = l.score
  for (let t = 0; t < 60 * 12 && l.pests.length; t++) l.update(idle())
  assert.equal(l.pests.length, 0)
  assert.ok(l.score - before >= TRAP_POINTS * 2 * 3, 'trapped on x2, worth 3x')
}

// --- Dish Stack -----------------------------------------------------------------------------
{
  const g = at(STEP.dish)
  bare(g)
  const b = g.bubbles[0]!
  assert.equal(g.plates.length, 5, 'five floating plates')
  b.stage = MAX_STAGE
  b.x = g.basin.drain.x
  b.y = g.basin.drain.y + 4
  g.update(idle())
  assert.equal(
    g.draining,
    0,
    'a full bubble cannot leave until the plates are clean',
  )
  for (const p of g.plates) {
    for (let t = 0; t < 400 && p.dirt > 0; t++) {
      b.x = p.x
      b.y = p.y
      b.vx = 0
      b.vy = 0
      g.update(idle())
    }
    assert.equal(p.dirt, 0, 'sitting on a plate scrubs it')
  }
  assert.ok(g.specialDone, 'every plate clean: the drain opens')
  b.stage = 1
  cleanAll(g)
  const bars = g.bars
  drainOut(g)
  assert.equal(g.stepIndex, STEP.dish + 1, 'down the drain at any size')
  assert.equal(g.bars - bars, BARS.basin + BARS.squeaky + BARS.special)
  assert.ok(
    g.golden.has('kitchen'),
    'finished 95% clean: the Kitchen golden soap',
  )
  assert.ok(SPECIAL_BONUS > 0)
}

// --- Duck Round-up --------------------------------------------------------------------------
{
  const g = at(STEP.roundup)
  bare(g)
  const loose = g.ducks.filter((d) => !d.home)
  assert.equal(loose.length, 5, 'five ducks to round up')
  // The current carries a loose duck away from the tap.
  const d0 = loose[0]!
  const x0 = d0.x
  for (let t = 0; t < 120; t++) g.update(idle())
  assert.ok(d0.x > x0, 'ducks drift downstream')
  // Push each one into the pen with the bubble.
  const b = g.bubbles[0]!
  for (const d of loose) {
    for (let t = 0; t < 60 * 20 && !d.penned; t++) {
      const away = Math.hypot(d.x - DUCK_PEN.x, d.y - DUCK_PEN.y) || 1
      const r = 7 + 11 - 2
      b.stage = 1
      b.x = d.x + ((d.x - DUCK_PEN.x) / away) * r
      b.y = d.y + ((d.y - DUCK_PEN.y) / away) * r
      b.vx = -((d.x - DUCK_PEN.x) / away) * 2
      b.vy = -((d.y - DUCK_PEN.y) / away) * 2
      b.invuln = 10
      g.update(idle())
    }
    assert.ok(d.penned, 'nudged into the pen at the tap end')
  }
  assert.ok(g.specialDone, 'five ducks penned: the drain opens')
}

// --- power-ups ------------------------------------------------------------------------------
{
  const g = at(STEP.bath)
  bare(g)
  const b = g.bubbles[0]!
  const kinds = Object.keys(POWERS) as PowerKind[]
  assert.deepEqual(kinds.sort(), [
    'bathbomb',
    'duck',
    'lemon',
    'magnet',
    'squeegee',
    'supersuds',
  ])
  // They float up out of the drain.
  for (let t = 0; t < 60 * 17; t++) g.update(idle())
  assert.ok(
    g.floats.length >= 1 || g.bars > 0,
    'something floated up out of the drain',
  )
  // Super Suds: full size for 8 s, then back.
  b.stage = 2
  g.pickUp(b, 'supersuds')
  assert.equal(b.stage, MAX_STAGE)
  for (let t = 0; t < POWERS.supersuds.ticks + 2; t++) g.update(idle())
  assert.equal(b.stage, 2, 'back to its own size')
  // Lemon Zest: pests flee and cannot hurt.
  b.x = 200
  b.y = 192
  g.pests = [pest('mite', b.x + 30, b.y)]
  b.stage = 1
  b.invuln = 0
  g.pickUp(b, 'lemon')
  const d0 = Math.hypot(g.pests[0]!.x - b.x, g.pests[0]!.y - b.y)
  for (let t = 0; t < 30; t++) g.update(idle())
  assert.ok(
    Math.hypot(g.pests[0]!.x - b.x, g.pests[0]!.y - b.y) > d0,
    'the mite runs away',
  )
  g.pests[0]!.x = b.x + 3
  g.pests[0]!.y = b.y
  g.update(idle())
  assert.ok(b.alive, 'a fleeing mite is harmless')
  // Bath Bomb: traps everything nearby on a chain.
  g.flee = 0
  g.pests = [
    pest('mite', b.x + 40, b.y),
    pest('brush', b.x - 50, b.y),
    pest('loofah', b.x + 200, b.y),
  ]
  g.pickUp(b, 'bathbomb')
  assert.equal(
    g.pests.filter((p) => p.trap).length,
    2,
    'the two near pests are trapped',
  )
  assert.equal(
    g.pests.find((p) => p.kind === 'loofah')!.trap,
    0,
    'the far one is not',
  )
  // Squeegee: a stripe of grime, gone.
  const before = g.grime.clean
  g.pickUp(b, 'squeegee')
  assert.ok(g.grime.clean - before > 100, 'a wipe right across the tub')
  assert.ok(!g.grime.isDirty(200, b.y) && !g.grime.isDirty(330, b.y))
  // Magnet Sponge: crumbs drift in.
  g.pests = []
  g.mess = [{ x: b.x + 90, y: b.y, kind: 'crumb', r: 3 }]
  g.pickUp(b, 'magnet')
  const mx = g.mess[0]!.x
  g.update(idle())
  assert.ok(
    g.mess.length === 0 || g.mess[0]!.x < mx,
    'the crumb comes to the bubble',
  )
  // Rubber Duck: a bodyguard shoves pests away.
  g.pickUp(b, 'duck')
  assert.equal(b.power?.kind, 'duck')
  const brush = pest('brush', 0, 0)
  g.pests = [brush]
  let shoved = false
  for (let t = 0; t < 120 && !shoved; t++) {
    const a = (g.tick + 1) * 0.08
    brush.x = b.x + Math.cos(a) * (7 + 16)
    brush.y = b.y + Math.sin(a) * (7 + 16)
    const bx = brush.x
    const by = brush.y
    g.update(idle())
    shoved = Math.hypot(brush.x - bx, brush.y - by) > 3
  }
  assert.ok(shoved, 'the duck bumps the brush away')
  // A soap bar floating up is one more to spend.
  const bars = g.bars
  g.pickUp(b, 'soap')
  assert.equal(g.bars, bars + 1)
}

// --- the Soap Shop ----------------------------------------------------------------------------
{
  const g = at(STEP.shop)
  assert.ok(g.shop, 'the shop opens between rooms')
  assert.equal(g.music, MUSIC.shop)
  g.bars = 30
  const lives = g.lives
  for (let t = 0; t < 25; t++) g.update(idle())
  const buy = (id: string) => {
    g.shop!.cursor = SHOP_ITEMS.findIndex((i) => i.id === id)
    g.update(press('a'))
  }
  buy('spare')
  assert.equal(g.lives, lives + 1, 'a spare bubble')
  assert.equal(g.bars, 24)
  buy('puff')
  assert.ok(g.upgrades.puff)
  buy('puff')
  assert.equal(g.bars, 19, 'an upgrade is bought once')
  buy('stage2')
  buy('sturdy')
  assert.equal(g.shield, 1)
  buy('sturdy')
  assert.equal(g.bars, 10, 'one sturdy film at a time')
  buy('hint')
  assert.match(g.shop!.message, /BATH TIME/, 'the hint names the next room')
  buy('rainbow')
  assert.equal(g.skin, 'rainbow')
  buy('rainbow')
  assert.equal(g.skin, 'plain', 'pressing an owned skin takes it off')
  g.bars = 1
  buy('spare')
  assert.equal(g.shop!.message, 'NOT ENOUGH SOAP BARS')
  g.update(press('b'))
  assert.equal(g.shop, null)
  assert.equal(g.stepIndex, STEP.bath, 'on to Bath Time')
  assert.equal(
    g.bubbles[0]!.stage,
    2,
    'Head Start: size 2 from the first basin',
  )
  assert.equal(g.save?.step, STEP.bath, 'saved at the start of Bath Time')
  assert.equal(g.save?.puff, true)
  // Longer Puff puffs faster.
  bare(g)
  const b = g.bubbles[0]!
  b.x = 200
  b.y = 192
  g.update(press('right', 'a'))
  assert.ok(Math.hypot(b.vx, b.vy) > PUFF.base.speed * 0.95 + 0.3)
  // Sturdy Film takes a pop.
  b.stage = 1
  b.invuln = 0
  g.pests = [pest('mite', b.x + 4, b.y)]
  g.update(idle())
  assert.ok(
    b.alive && (g.shield as number) === 0,
    'the sturdy film took the hit',
  )
  // The shop shuts itself if nobody leaves.
  const s = at(STEP.shop)
  for (let t = 0; t < 60 * 46 && s.shop; t++) s.update(idle())
  assert.equal(s.shop, null)
}

// --- saves and resuming -------------------------------------------------------------------------
{
  assert.equal(readSudsSave(null), null)
  assert.equal(readSudsSave({ v: 2 }), null)
  assert.equal(
    readSudsSave({ v: 1, step: STEP.shop, score: 0, lives: 3, bars: 0 }),
    null,
    'never mid-shop',
  )
  assert.equal(
    readSudsSave({ v: 1, step: 999, score: 0, lives: 3, bars: 0 }),
    null,
  )
  const ok = readSudsSave({
    v: 1,
    step: STEP.bath,
    score: 12_345,
    lives: 0,
    bars: 9,
    puff: true,
    stage2: false,
    shield: 7,
    skins: ['starry', 'nope'],
    skin: 'starry',
    golden: ['kitchen', 'attic'],
  })!
  assert.ok(ok)
  assert.equal(ok.lives, 1, 'at least one bubble')
  assert.equal(ok.shield, 0, 'a bad shield count is dropped')
  assert.deepEqual(ok.skins, ['starry'])
  assert.deepEqual(ok.golden, ['kitchen'])
  // A save at Bath Time offers to continue.
  const g = game(3, ok)
  assert.ok(g.offer, 'continue?')
  assert.equal(g.music, null)
  g.update(press('a'))
  assert.equal(g.offer, null)
  assert.equal(g.stepIndex, STEP.bath)
  assert.equal(g.score, 12_345)
  assert.equal(g.bars, 9)
  assert.ok(g.upgrades.puff)
  assert.equal(g.skin, 'starry')
  assert.ok(g.golden.has('kitchen'))
  assert.equal(g.level, STEP.bath, 'the level counts the basins before it')
  // B starts a new wash instead.
  const n = game(3, ok)
  n.update(press('b'))
  assert.equal(n.offer, null)
  assert.equal(n.stepIndex, 0)
  assert.equal(n.score, 0)
  // A save at the boss resumes at the boss.
  const boss = game(3, { ...ok, step: STEP.boss })
  boss.update(press('a'))
  assert.ok(boss.boss, 'straight back to Bristleton')
  assert.equal(boss.music, MUSIC.boss)
  // The save is small.
  assert.ok(JSON.stringify(g.save).length < 400)
}

// --- Bristleton -------------------------------------------------------------------------------
{
  const g = at(STEP.boss)
  bare(g)
  const boss = g.boss!
  assert.ok(boss, 'the cycle ends on a boss')
  assert.equal(boss.hp, 3)
  assert.equal(g.save?.step, STEP.boss, 'saved at the boss')
  const b = g.bubbles[0]!
  // Let it settle into its first sweep, then park a full bubble on the handle.
  for (let t = 0; t < 80; t++) g.update(idle())
  const bump = () => {
    b.stage = MAX_STAGE
    b.invuln = 0
    const hp = boss.hp
    for (let t = 0; t < 400 && boss.hp === hp; t++) {
      const spot = boss.bumpSpot(17)
      if (spot) {
        b.x = boss.pivot.x - Math.cos(boss.angle) * 20
        b.y = boss.pivot.y - Math.sin(boss.angle) * 20
        b.vx = 0
        b.vy = 0
      } else {
        b.x = 60
        b.y = 120
        b.invuln = 30
      }
      b.stage = MAX_STAGE
      g.update(idle())
    }
    return boss.hp < hp
  }
  const before = g.score
  assert.ok(bump(), 'a full bubble on the handle end bumps it')
  assert.equal(boss.hp, 2)
  assert.equal(boss.phase, 2, 'phase 2: it spins like a top')
  assert.ok(g.score - before >= 2_000)
  assert.ok(b.stage <= 3, 'the bump knocks the suds out of the bubble')
  assert.ok(g.mess.length >= 8, 'and shakes crumbs loose')
  // While it spins, the handle cannot be bumped; dizzy, it can.
  for (let t = 0; t < 80; t++) g.update(idle())
  assert.equal(boss.state, 'spin')
  assert.equal(boss.bumpable, false)
  let rings = 0
  for (let t = 0; t < 300 && boss.state === 'spin'; t++) {
    b.x = 60
    b.y = 120
    b.invuln = 30
    g.update(idle())
    rings = Math.max(rings, boss.rings.length)
  }
  assert.ok(rings >= 1, 'it throws suds rings')
  assert.equal(boss.state, 'dizzy')
  assert.ok(bump(), 'bumped while dizzy')
  assert.equal(boss.phase, 3, 'phase 3: faster sweeps')
  // Phase 3 sheds mini-brushes after its sweeps.
  let minis = 0
  for (let t = 0; t < 600; t++) {
    b.x = 60
    b.y = 120
    b.invuln = 30
    g.update(idle())
    minis = Math.max(
      minis,
      g.pests.filter((p) => p.kind === 'minibrush').length,
    )
  }
  assert.ok(minis >= 1, 'it sheds mini-brushes')
  // The bristles bonk.
  b.invuln = 0
  b.stage = 4
  const head = {
    x: boss.pivot.x + Math.cos(boss.angle) * BRUSH_LEN * 0.8,
    y: boss.pivot.y + Math.sin(boss.angle) * BRUSH_LEN * 0.8,
  }
  b.x = head.x
  b.y = head.y
  g.update(idle())
  assert.ok(b.stage <= 2 || b.invuln > 0, 'the bristles splash the bubble')
  // The third bump tips it into the bath.
  g.pests = []
  const bars = g.bars
  assert.ok(bump())
  assert.equal(boss.hp, 0)
  for (let t = 0; t < 400 && g.stepIndex === STEP.boss; t++) {
    b.invuln = 30
    g.update(idle())
  }
  assert.equal(g.stepIndex, STEP.boss + 1, 'on to the shop')
  assert.equal(g.bars - bars, BARS.boss)
  assert.ok(g.shop)
}

// --- the demo and the pilot -----------------------------------------------------------------
{
  const demo = game(4, undefined, true)
  for (let t = 0; t < 60 * 120; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo scores nothing')
  assert.equal(demo.bars, 0, 'nor earns soap')
  const run = (seed: number) => {
    const g = game(seed)
    for (let t = 0; t < 60 * 90 && !g.over; t++) g.update(g.demoInput())
    return [g.score, g.stepIndex, g.lives, g.bars]
  }
  assert.deepEqual(run(5), run(5), 'deterministic')
  // The pilot plays the special basins through.
  for (const step of [STEP.dish, STEP.roundup]) {
    const g = at(step, 2)
    for (let t = 0; t < 60 * 60 * 4 && g.stepIndex === step; t++) {
      g.lives = 3
      g.update(g.demoInput())
    }
    assert.ok(
      g.stepIndex > step,
      `the pilot finishes ${g.steps[step]!.kind} ${step}`,
    )
  }
  // With its three real lives, the pilot's run ends.
  const g = game(2)
  for (let t = 0; t < 60 * 60 * 20 && !g.over; t++) g.update(g.demoInput())
  assert.ok(g.over, 'the run ends')
  assert.ok(g.score < 10_000_000)
}

console.log('verifyCabinetSinkSudsRooms: ok')
