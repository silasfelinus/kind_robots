// Sink Suds depth pass, slice 3 (conductor kr-arcade/t-045): Wash Cycles 2 and 3 (the Laundry
// Drum, the Fish Tank, the Garden Birdbath, the Car Wash) with their pests, hazards and special
// basins; Mossback and the Grime King's giant-bubble finish; the endings and credits; the golden
// soaps opening the Bubble Bath Palace and its true ending; and Deep Clean.
//
//   npx tsx utils/scripts/verifyCabinetSinkSudsFinale.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  CAR,
  MAX_STAGE,
  PESTS,
  RAIN_RACE,
  ROOMS,
  SPIN_CYCLE,
  create,
  readSudsSave,
} from '../arcade/games/sinkSuds'
import type {
  Bubble,
  Car,
  Leaf,
  LooseSock,
  Pest,
  SudsSave,
} from '../arcade/games/sinkSuds'
import { BASINS, flowAt } from '../arcade/sinkSuds/basins'
import type { Grime } from '../arcade/sinkSuds/grime'
import { CYCLES, GOLDEN_ROOMS, campaignSteps } from '../arcade/sinkSuds/rooms'
import type { BasinPlan, Step } from '../arcade/sinkSuds/rooms'
import {
  ALGAE_BLOOM,
  PUFF_TELL,
  STRIDER_TELL,
  WAX_SET,
} from '../arcade/sinkSuds/pests'
import type { SudsBoss } from '../arcade/sinkSuds/boss'
import type { Mossback } from '../arcade/sinkSuds/mossback'
import type { GrimeKing } from '../arcade/sinkSuds/grimeking'
import { GIANT_R } from '../arcade/sinkSuds/grimeking'
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
  leaves: Leaf[]
  socks: LooseSock[]
  car: Car | null
  roller: { lane: number; tell: number; x: number | null; timer: number } | null
  grime: Grime
  shop: unknown
  boss: SudsBoss | null
  ending: { kind: string; t: number } | null
  specialDone: boolean
  specialTimer: number
  spin: number
  deep: number
  cleared: boolean
  bars: number
  golden: Set<string>
  update(input: InputFrame): void
  demoInput(): InputFrame
  beginStep(i: number): void
  placePest(kind: Pest['kind'], at: { x: number; y: number }): Pest
  prey(from: { x: number; y: number }): Bubble | null
}

const quiet = { play: () => {} }
function game(seed = 1, resume?: unknown, demo = false): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
    resume,
  }) as unknown as Inner & { menu: unknown }
  // Straight into the campaign, past the mode menu (slice 4 has its own menu tests).
  g.menu = null
  return g
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
const steps = campaignSteps()
const find = (pred: (s: Step) => boolean) => steps.findIndex(pred)
const roomIndex = (id: string) => ROOMS.findIndex((r) => r.id === id)
const basinStep = (id: string, basin: number) =>
  find(
    (s) => s.kind === 'basin' && s.room === roomIndex(id) && s.basin === basin,
  )
const bossStep = (id: string) => find((s) => s.kind === 'boss' && s.boss === id)
function at(step: number, seed = 1): Inner {
  const g = game(seed)
  g.beginStep(step)
  return g
}
function bare(g: Inner) {
  g.pests = []
  g.mess = []
  g.leaves = []
  g.bubbles[0]!.invuln = 0
  return g
}
function add(g: Inner, kind: Pest['kind'], x: number, y: number) {
  const p = g.placePest(kind, { x, y })
  g.pests.push(p)
  return p
}
function cleanAll(g: Inner) {
  for (let y = 0; y < 360; y += 4)
    for (let x = 0; x < 420; x += 4) g.grime.scrub(x, y, 6)
}
function hold(b: Bubble, x: number, y: number) {
  b.x = x
  b.y = y
  b.vx = 0
  b.vy = 0
}

// --- the whole house as data ----------------------------------------------------------------------
{
  assert.deepEqual(
    CYCLES.map((c) => [c.name, c.rooms.join('+'), c.boss]),
    [
      ['MORNING RINSE', 'kitchen+bath', 'bristleton'],
      ['MIDDAY SPIN', 'laundry+tank', 'mossback'],
      ['EVENING SHINE', 'birdbath+carwash', 'grimeking'],
    ],
    'six rooms in three Wash Cycles, a boss at the end of each',
  )
  assert.deepEqual(GOLDEN_ROOMS, [
    'kitchen',
    'bath',
    'laundry',
    'tank',
    'birdbath',
    'carwash',
  ])
  assert.ok(
    ROOMS.find((r) => r.id === 'palace')?.secret,
    'the seventh room is the secret palace',
  )
  const order = steps.map((s) =>
    s.kind === 'basin'
      ? ROOMS[s.room]!.id
      : s.kind === 'boss'
        ? s.boss
        : s.kind === 'ending'
          ? `ending:${s.ending}`
          : s.kind,
  )
  const tail = order.slice(order.indexOf('grimeking'))
  assert.deepEqual(
    [...new Set(tail)],
    ['grimeking', 'ending:clean', 'shop', 'palace', 'ending:true', 'deep'],
    'the finale, the credits, then (with every golden soap) the palace and the true ending, then Deep Clean',
  )
  const special = (id: string) => ROOMS.find((r) => r.id === id)!.basins[2]
  assert.equal(special('laundry').special, 'odd-socks')
  assert.equal(special('tank').special, 'clean-goal')
  assert.equal(
    special('tank').dirt,
    2,
    'Clear the Glass: thick algae on the glass',
  )
  assert.equal(special('birdbath').special, 'rain-race')
  assert.equal(special('carwash').special, 'full-detail')
  assert.ok(
    ROOMS.find((r) => r.id === 'laundry')!.basins.every(
      (b) => b.basin === 'drum',
    ),
  )
  assert.ok(
    ROOMS.find((r) => r.id === 'tank')!.basins.every((b) => b.basin === 'tank'),
  )
  assert.ok(
    ROOMS.find((r) => r.id === 'birdbath')!.basins.every(
      (b) => b.basin === 'birdbath' && b.rain,
    ),
  )
  assert.ok(
    ROOMS.find((r) => r.id === 'carwash')!.basins.every(
      (b) => b.basin === 'conveyor',
    ),
  )
  // Fourteen pests with tells (plus the bosses' minions and drops).
  const shown = Object.values(PESTS).filter((r) => !r.hidden)
  assert.ok(shown.length >= 14, `${shown.length} pests in the guide`)
  for (const r of shown) assert.ok(r.tell && r.answer)
  for (const id of [
    'laundry',
    'tank',
    'garden',
    'carwash',
    'palace',
    'ending',
  ] as const)
    assert.ok(MUSIC[id])
}

// --- the birdbath's ripples --------------------------------------------------------------------
{
  const bath = BASINS.birdbath
  assert.equal(bath.physics.kind, 'ripple')
  const out = flowAt(bath, 300, 196, 1)
  assert.ok(
    out.x > 0 && Math.abs(out.y) < 1e-9,
    'ripples push the bubble outward',
  )
  assert.deepEqual(
    flowAt(bath, 300, 196, 0),
    { x: 0, y: 0 },
    'between waves the water is calm',
  )
}

// --- Laundry Drum: lint balls, the sock snake, Odd Socks ------------------------------------------
{
  const g = bare(at(basinStep('laundry', 0)))
  const b = g.bubbles[0]!
  // A lint ball rolls up crumbs and grows.
  const lint = add(g, 'lint', 300, 192)
  g.mess = [0, 1, 2, 3, 4, 5].map((i) => ({
    x: 300 + i * 4,
    y: 192,
    kind: 'crumb',
    r: 3,
  }))
  hold(b, 100, 192)
  for (let t = 0; t < 200; t++) {
    hold(b, 100, 192)
    g.update(idle())
  }
  assert.ok(
    lint.size >= PESTS.lint.radius + 3,
    `the lint ball grew to ${lint.size}`,
  )
  // Bigger than the bubble it hits; smaller, it is swallowed.
  b.stage = 1
  b.invuln = 0
  hold(b, lint.x - lint.size - 4, lint.y)
  g.update(idle())
  assert.ok(
    (b.stage === 1 && (!b.alive || b.invuln > 0)) || !b.alive,
    'a big lint ball bonks a small bubble',
  )
  const small = bare(at(basinStep('laundry', 0)))
  const sb = small.bubbles[0]!
  sb.stage = 3
  const l2 = add(small, 'lint', 200, 192)
  hold(sb, 200 - 12, 192)
  small.update(idle())
  assert.ok(!small.pests.includes(l2), 'caught while small, it is swallowed')
  // The sock snake: nibble from the tail, never the head.
  const s = bare(at(basinStep('laundry', 1)))
  const sbub = s.bubbles[0]!
  const snake = add(s, 'sock', 260, 192)
  for (let t = 0; t < 30; t++) {
    hold(sbub, 60, 120)
    s.update(idle())
  }
  const segs = snake.segs.length
  assert.ok(segs >= 5, 'a chain of socks')
  const tail = snake.segs[segs - 1]!
  sbub.stage = 1
  sbub.invuln = 0
  hold(sbub, tail.x, tail.y + 5)
  s.update(idle())
  assert.equal(snake.segs.length, segs - 1, 'a nibble from the tail')
  assert.ok(sbub.alive)
  sbub.invuln = 0
  sbub.stage = 1
  hold(sbub, snake.x + 6, snake.y)
  s.update(idle())
  assert.equal(sbub.alive, false, 'the head bites')
  // Odd Socks: pairs of matching socks; push them together before the spin cycle.
  const o = bare(at(basinStep('laundry', 2)))
  assert.equal(o.socks.length, 8, 'four pairs of odd socks')
  assert.ok(o.specialTimer > 0 && o.specialTimer <= SPIN_CYCLE)
  const first = o.socks[0]!
  const other = o.socks.find((k) => k !== first && k.colour !== first.colour)!
  other.x = first.x + 10
  other.y = first.y
  o.update(idle())
  assert.equal(o.socks.length, 8, 'odd socks do not pair')
  while (o.socks.length) {
    const a = o.socks[0]!
    const m = o.socks.find((k) => k !== a && k.colour === a.colour)!
    m.x = a.x + 8
    m.y = a.y
    hold(o.bubbles[0]!, 40, 300)
    o.update(idle())
  }
  assert.ok(o.specialDone, 'every pair matched: the drain opens')
  // The spin cycle shuffles the socks if the clock runs out.
  const c = bare(at(basinStep('laundry', 2)))
  c.specialTimer = 1
  c.update(idle())
  assert.ok(
    c.socks.some((k) => Math.hypot(k.vx, k.vy) > 2),
    'the spin cycle sends them flying',
  )
  assert.equal(c.specialTimer, SPIN_CYCLE)
}

// --- Fish Tank: algae puffs, snails, pufferfish, Clear the Glass ----------------------------------
{
  const g = bare(at(basinStep('tank', 0)))
  const b = g.bubbles[0]!
  const puff = add(g, 'algae', 300, 200)
  puff.size = ALGAE_BLOOM - 1
  cleanAll(g)
  const clean = g.grime.clean
  hold(b, 80, 120)
  g.update(idle())
  assert.ok(
    g.grime.clean < clean - 20,
    'an algae puff blooms and clouds the water',
  )
  assert.equal(puff.size, 0)
  hold(b, puff.x - 10, puff.y)
  b.stage = 1
  g.update(idle())
  assert.ok(!g.pests.includes(puff), 'pop it before the bloom (any size)')
  // Snail: armoured until the bubble is full size.
  const snail = add(g, 'snail', 200, 200)
  b.stage = 3
  b.invuln = 0
  hold(b, snail.x - 18, snail.y)
  g.update(idle())
  assert.ok(
    g.pests.includes(snail) && b.alive && b.stage === 3,
    'a small bubble just bounces off the shell',
  )
  b.stage = MAX_STAGE
  hold(b, snail.x - 22, snail.y)
  g.update(idle())
  assert.ok(!g.pests.includes(snail), 'a full bubble rolls it over')
  // Pufferfish: calm it bounces; after its wiggle it puffs up and pops anything.
  const p = add(g, 'puffer', 200, 160)
  p.t = 1
  for (let t = 0; t < 3; t++) {
    hold(b, 60, 300)
    g.update(idle())
  }
  assert.equal(p.state, 'tell', 'it wiggles first')
  for (let t = 0; t < PUFF_TELL + 2; t++) {
    hold(b, 60, 300)
    g.update(idle())
  }
  assert.equal(p.state, 'puffed')
  b.stage = MAX_STAGE
  b.invuln = 0
  hold(b, p.x - 20, p.y)
  g.update(idle())
  assert.equal(b.alive, false, 'never touch it puffed up, even at full size')
  // Clear the Glass opens the drain at 85% clean.
  const c = bare(at(basinStep('tank', 2)))
  assert.equal(
    c.grime.hp.find((v) => v > 0),
    2,
    'thick algae on the glass',
  )
  assert.ok(!c.specialDone)
  cleanAll(c)
  cleanAll(c)
  c.update(idle())
  assert.ok(c.specialDone, 'clean enough to see the fish: the drain opens')
}

// --- Garden Birdbath: rain, leaves, water striders, leaf boats, Rain Race --------------------------
{
  const g = bare(at(basinStep('birdbath', 0)))
  const b = g.bubbles[0]!
  cleanAll(g)
  for (let t = 0; t < 300; t++) {
    hold(b, 210, 290)
    g.update(idle())
  }
  assert.ok(g.grime.percent < 100, 'rain grimes the basin again')
  // Leaves are cover: a hunter cannot see a bubble under one.
  g.leaves = [{ x: 150, y: 196, vx: 0, vy: 0, a: 0, tone: 0 }]
  hold(b, 150, 196)
  assert.equal(g.prey({ x: 200, y: 196 }), null, 'hidden under a leaf')
  hold(b, 260, 196)
  assert.ok(g.prey({ x: 200, y: 196 }), 'out in the open')
  g.leaves = []
  // The water strider: off the water, then a ripple line, then a deadly skate.
  const s = add(g, 'strider', 0, 0)
  s.t = 1
  hold(b, 60, 290)
  g.update(idle())
  assert.equal(s.state, 'tell', 'the ripple line shows first')
  assert.equal(s.segs.length, 2)
  for (let t = 0; t < STRIDER_TELL + 1; t++) {
    hold(b, 60, 290)
    g.update(idle())
  }
  assert.equal(s.state, 'roam', 'then it skates')
  b.stage = MAX_STAGE
  b.invuln = 0
  hold(b, s.x + s.vx * 3, s.y + s.vy * 3)
  g.update(idle())
  assert.equal(b.alive, false, 'always deadly')
  // A leaf boat turns soap shots from the front.
  const lb = bare(at(basinStep('birdbath', 1)))
  const lbb = lb.bubbles[0]!
  const boat = add(lb, 'leafboat', 260, 196)
  boat.heading = Math.PI
  lbb.stage = 4
  hold(lbb, 200, 196)
  lbb.faceX = 1
  lbb.faceY = 0
  lb.update(press('b'))
  for (let t = 0; t < 20; t++) {
    boat.heading = Math.PI
    hold(lbb, 200, 196)
    lb.update(idle())
  }
  assert.equal(boat.trap, 0, 'sheltered from the front')
  boat.heading = 0
  lbb.stage = 4
  lb.update(press('b'))
  for (let t = 0; t < 25 && !boat.trap; t++) {
    boat.heading = 0
    boat.x = 260
    boat.y = 196
    hold(lbb, 200, 196)
    lb.update(idle())
  }
  assert.ok(boat.trap > 0, 'trapped from behind')
  // Rain Race: clean enough when the shower passes, and the drain opens; else it keeps raining.
  const r = bare(at(basinStep('birdbath', 2)))
  assert.equal(r.specialTimer, RAIN_RACE.shower)
  r.specialTimer = 1
  r.update(idle())
  assert.ok(
    !r.specialDone && r.specialTimer === RAIN_RACE.more,
    'not clean enough: the shower goes on',
  )
  cleanAll(r)
  r.specialTimer = 1
  hold(r.bubbles[0]!, 210, 290)
  r.update(idle())
  assert.ok(r.specialDone, 'out-cleaned the shower')
}

// --- The Car Wash: rollers, wax jets, wax blobs, spinners, Full Detail ------------------------------
{
  const g = bare(at(basinStep('carwash', 0)))
  const b = g.bubbles[0]!
  // Wax sets hard if left; then it is a wall a shot can shatter.
  const wax = add(g, 'wax', 300, 120)
  for (let t = 0; t < WAX_SET + 1; t++) {
    hold(b, 60, 300)
    g.update(idle())
  }
  assert.equal(wax.state, 'set')
  b.stage = 1
  hold(b, wax.x - 12, wax.y)
  g.update(idle())
  assert.ok(g.pests.includes(wax) && b.alive, 'set wax is a wall, not food')
  const soft = add(g, 'wax', 200, 260)
  hold(b, soft.x - 10, soft.y)
  g.update(idle())
  assert.ok(!g.pests.includes(soft), 'soft wax is cleared by touching it')
  // A roller lights a lane, then sweeps it, hitting a bubble in its path.
  const roll = g.roller!
  assert.ok(roll, 'rollers in the wash bay')
  roll.x = null
  roll.tell = 0
  roll.timer = 1
  g.update(idle())
  assert.ok(roll.tell > 0, 'the lane light comes on first')
  const belt = g.basin.physics
  assert.ok(belt.kind === 'conveyor')
  const laneH = (belt.bottom - belt.top) / belt.lanes
  const laneY = belt.top + roll.lane * laneH + laneH / 2
  b.stage = 1
  b.invuln = 0
  let hit = false
  for (let t = 0; t < 400 && !hit; t++) {
    hold(b, 300, laneY)
    g.update(idle())
    hit = !b.alive
  }
  assert.ok(hit, 'the roller sweeps the whole lane')
  // Wax jets puff on the beat, shoving the bubble back from the rim.
  const j = bare(at(basinStep('carwash', 1)))
  const jb = j.bubbles[0]!
  const jet = j.plan.jets![0]!
  let pushed = 0
  for (let t = 0; t < 140; t++) {
    jb.x = jet.x + (j.basin.drain.x - jet.x) * 0.2
    jb.y = jet.y + (j.basin.drain.y - jet.y) * 0.2
    const vx = jb.vx
    j.update(idle())
    pushed = Math.max(pushed, Math.abs(jb.vx - vx))
  }
  assert.ok(pushed > 0.3, 'the jet puffs the bubble away')
  // Spinners are always deadly.
  const sp = bare(at(basinStep('carwash', 1)))
  const spb = sp.bubbles[0]!
  const spin = add(sp, 'spinner', 110, 260)
  spb.stage = MAX_STAGE
  spb.invuln = 0
  hold(spb, spin.x + spin.vx * 4, spin.y + spin.vy * 4)
  sp.update(idle())
  assert.equal(spb.alive, false, 'a spinner pops even a full bubble')
  // Full Detail: scrub every panel of the car as it rides through.
  const fd = bare(at(basinStep('carwash', 2)))
  const car = fd.car!
  assert.ok(car && car.panels.length === 6)
  assert.ok(car.x + CAR.w < 60, 'it rolls in from the start of the belt')
  car.x = 60
  const fb = fd.bubbles[0]!
  for (let i = 0; i < 6 && !fd.specialDone; i++) {
    for (let t = 0; t < 400 && car.panels[i]! > 0; t++) {
      const px = car.x + 4 + (i % 3) * ((CAR.w - 8) / 3) + (CAR.w - 8) / 6
      const py =
        car.y + 4 + Math.floor(i / 3) * ((CAR.h - 8) / 2) + (CAR.h - 8) / 4
      hold(fb, px, py)
      fb.invuln = 30
      fd.update(idle())
    }
  }
  assert.ok(fd.specialDone, 'a clean car: the drain opens')
  // A car that rides off dirty is followed by the next.
  const n = bare(at(basinStep('carwash', 2)))
  n.car!.x = 500
  hold(n.bubbles[0]!, 60, 300)
  n.update(idle())
  assert.equal(n.car!.cars, 2, 'the next car comes in')
  assert.ok(n.car!.panels.every((d) => d === 1))
}

// --- Mossback --------------------------------------------------------------------------------
{
  const g = at(bossStep('mossback'))
  bare(g)
  const boss = g.boss as Mossback
  assert.equal(boss.name, 'MOSSBACK')
  assert.equal(g.music, MUSIC.boss)
  const b = g.bubbles[0]!
  // Phase 1: pop every algae puff it sheds.
  for (let t = 0; t < 60 * 60 && boss.phase === 1; t++) {
    for (const p of g.pests) if (p.kind === 'algae') p.x = -999
    g.pests = g.pests.filter((p) => p.x > -999)
    hold(b, 210, 190)
    b.invuln = 30
    g.update(idle())
  }
  assert.equal(boss.phase, 2, 'every puff popped: into its shell')
  // Phase 2: it rolls the gravel; the bubble floats up out of the way.
  for (let t = 0; t < 60 * 60 && boss.phase === 2; t++) {
    hold(b, 210, 80)
    b.invuln = 30
    g.update(idle())
  }
  assert.equal(boss.phase, 3, 'dazed after its bounces: the shell opens')
  // Phase 3: a small bubble only shoves; a full one scrubs the moss off.
  for (let t = 0; t < 30; t++) g.update(idle())
  b.stage = 2
  b.invuln = 0
  const moss = boss.moss
  hold(b, boss.x, boss.y - 30 - 9)
  if (boss.state === 'open') {
    g.update(idle())
    assert.equal(boss.moss, moss, 'only a full bubble scrubs')
  }
  let ticks = 0
  for (; ticks < 60 * 60 && !boss.defeated; ticks++) {
    b.stage = MAX_STAGE
    b.invuln = 30
    hold(b, boss.x, boss.y - 30 - 15)
    g.update(idle())
  }
  assert.ok(boss.defeated, 'scrubbed until it shines')
  const bars = g.bars
  for (let t = 0; t < 600 && g.stepIndex === bossStep('mossback'); t++) {
    b.invuln = 30
    g.update(idle())
  }
  assert.equal(g.stepIndex, bossStep('mossback') + 1)
  assert.ok(g.bars > bars, 'five soap bars')
}

// --- The Grime King and the endings --------------------------------------------------------------
{
  const g = at(bossStep('grimeking'))
  bare(g)
  const king = g.boss as GrimeKing
  const b = g.bubbles[0]!
  g.update(idle())
  const minions = g.pests.filter((p) => p.kind === 'minion')
  assert.equal(minions.length, 8, 'grime minions guard the King')
  // Eat them all (size 3 eats minions).
  for (const m of minions) {
    b.stage = 3
    b.invuln = 0
    hold(b, m.x, m.y)
    g.update(idle())
  }
  for (let t = 0; t < 5 && king.phase === 1; t++) g.update(idle())
  assert.equal(king.phase, 2, 'he splits into grime drops')
  const drops = g.pests.filter((p) => p.kind === 'drop')
  assert.equal(drops.length, 6)
  // Left alone, the drops gather and he re-forms.
  for (let t = 0; t < 60 * 30 && king.state === 'split'; t++) {
    hold(b, 40, 300)
    b.invuln = 30
    g.update(idle())
  }
  assert.equal(king.state, 'reformed', 'he re-forms if the drops gather')
  for (let t = 0; t < 200 && (king.state as string) !== 'split'; t++)
    g.update(idle())
  // Swallow every drop.
  for (let t = 0; t < 60 * 30 && king.phase === 2; t++) {
    const d = g.pests.find((p) => p.kind === 'drop')
    if (d) hold(b, d.x, d.y)
    b.invuln = 30
    g.update(idle())
  }
  assert.equal(king.phase, 3, 'every drop swallowed')
  g.update(idle())
  assert.ok(b.giant, 'filled past full: a giant bubble')
  assert.equal(GIANT_R > 40, true)
  b.invuln = 0
  g.pests.push(g.placePest('spinner', { x: b.x + 10, y: b.y }))
  g.update(idle())
  assert.ok(b.alive, 'nothing can pop the giant bubble')
  // Catch him and carry him down the drain.
  for (let t = 0; t < 60 * 30 && !king.defeated; t++) {
    if (!king.caught) hold(b, king.x, king.y)
    else hold(b, g.basin.drain.x, g.basin.drain.y)
    g.update(idle())
  }
  assert.ok(king.defeated, 'swept down the drain')
  for (let t = 0; t < 600 && !g.ending; t++) g.update(idle())
  assert.ok(
    g.ending && g.ending.kind === 'clean',
    'the town sparkles: the credits roll',
  )
  assert.ok(g.cleared)
  assert.equal(b.giant, false)
  assert.equal(g.music, MUSIC.ending)
  // Without every golden soap the palace stays shut: straight on to Deep Clean.
  for (let t = 0; t < 60 * 31 && g.ending; t++) g.update(idle())
  assert.equal(g.ending, null)
  assert.equal(g.deep, 1, 'Deep Clean: round again')
  assert.equal(g.stepIndex, 0)
  assert.equal(
    g.grime.hp.find((v) => v > 0),
    2,
    'dirtier basins',
  )
  assert.ok(g.plan.heat > ROOMS[0]!.basins[0].heat, 'faster pests')
  assert.equal(g.save?.deep, 1)
  assert.equal(g.save?.cleared, true)
  // A skip after two seconds.
  const s = at(find((x) => x.kind === 'ending'))
  for (let t = 0; t < 130; t++) s.update(idle())
  s.update(press('a'))
  assert.equal(s.ending, null, 'A skips the credits')
}

// --- The Bubble Bath Palace and the true ending -------------------------------------------------
{
  const g = game(2)
  for (const id of GOLDEN_ROOMS) g.golden.add(id)
  g.beginStep(find((s) => s.kind === 'ending'))
  for (let t = 0; t < 130; t++) g.update(idle())
  g.update(press('a'))
  assert.ok(g.shop, 'every golden soap: a last trip to the shop')
  g.update(press('b'))
  assert.equal(
    ROOMS[(g.steps[g.stepIndex] as { room: number }).room]!.id,
    'palace',
    'the seventh room opens',
  )
  assert.equal(g.basin.id, 'palace')
  const last = steps.length - 1
  g.beginStep(last - 1)
  assert.ok(g.ending && g.ending.kind === 'true', 'the true ending')
  // The golden soaps survive a new wash.
  const save = readSudsSave({
    v: 1,
    step: 5,
    score: 1,
    lives: 3,
    bars: 0,
    golden: GOLDEN_ROOMS,
    cleared: true,
    deep: 2,
  })!
  assert.equal(save.deep, 2)
  assert.ok(save.cleared)
  const n = game(1, save)
  n.update(press('b'))
  assert.equal(n.golden.size, 6, 'golden soaps stay through a new wash')
  assert.equal(
    readSudsSave({
      v: 1,
      step: 5,
      score: 1,
      lives: 3,
      bars: 0,
      golden: ['palace'],
    })!.golden.length,
    0,
  )
}

// --- the pilot plays the new specials through, and runs still end -------------------------------------
{
  for (const step of [
    basinStep('laundry', 2),
    basinStep('tank', 2),
    basinStep('birdbath', 2),
    basinStep('carwash', 2),
  ]) {
    const g = at(step, 2)
    for (let t = 0; t < 60 * 60 * 5 && g.stepIndex === step; t++) {
      g.lives = 3
      g.update(g.demoInput())
    }
    assert.ok(g.stepIndex > step, `the pilot finishes ${g.plan.title}`)
  }
  for (const step of [bossStep('mossback'), bossStep('grimeking')]) {
    const g = at(step, 3)
    for (let t = 0; t < 60 * 60 * 10 && g.stepIndex === step; t++) {
      g.lives = 3
      g.update(g.demoInput())
    }
    assert.ok(g.stepIndex > step, `the pilot beats ${g.steps[step]!.kind}`)
  }
  const demo = game(4, undefined, true)
  demo.beginStep(basinStep('carwash', 3))
  for (let t = 0; t < 60 * 60; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the demo still scores nothing')
  const g = game(5)
  for (let t = 0; t < 60 * 60 * 20 && !g.over; t++) g.update(g.demoInput())
  assert.ok(g.over, 'a run with three real lives ends')
}

console.log('verifyCabinetSinkSudsFinale: ok')
