// Butterfly Blaster depth pass, slice 2 (conductor kr-arcade/t-056, depth-pass CABINETS.md section 6):
// Moon 1, the river map and the Clinic. The season engine (regions, nights and special nights as
// data), the river map between nights, saves at every checkpoint with a real round trip through
// the cabinet's save path, Riverbend and the Rice Terraces with their own skies and music, the
// Lantern Walk and Tip the Pots, AMI's kit, the Clinic and its thank-you beads, and the Hum.
//
//   npx tsx utils/scripts/verifyCabinetButterflyBlasterSeason.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { MAX_SAVE_BYTES, sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  MAP_TICKS,
  SHIELD_TICKS,
  WIND,
  create,
  readBlasterSave,
} from '../arcade/games/butterflyBlaster'
import type { BlasterSave } from '../arcade/games/butterflyBlaster'
import {
  BEADS,
  CLINIC_ROWS,
  clinicPrice,
} from '../arcade/butterflyBlaster/clinic'
import { HUM, Hum } from '../arcade/butterflyBlaster/hum'
import type { BossHost } from '../arcade/butterflyBlaster/hum'
import { FAN, KIT, LONG } from '../arcade/butterflyBlaster/kit'
import { HEARTBEATS, HEARTBEAT_BPM } from '../arcade/butterflyBlaster/music'
import { BROODS, newPool, tickPool } from '../arcade/butterflyBlaster/pests'
import type { Pest, Pool } from '../arcade/butterflyBlaster/pests'
import { mapNodes } from '../arcade/butterflyBlaster/screens'
import {
  JAR_SPOTS,
  MOONS,
  PADDIES,
  REGIONS,
  campaignSteps,
} from '../arcade/butterflyBlaster/season'
import { GROUND, H, W } from '../arcade/butterflyBlaster/sky'
import { LANTERN } from '../arcade/butterflyBlaster/specials'
import type { SpecialState } from '../arcade/butterflyBlaster/specials'
import { newSwarm } from '../arcade/butterflyBlaster/swarm'
import type { Swarm } from '../arcade/butterflyBlaster/swarm'
import { newVillage } from '../arcade/butterflyBlaster/village'
import type { Hut } from '../arcade/butterflyBlaster/village'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  save: BlasterSave | null | undefined
  music: unknown
  phase: string
  phaseTicks: number
  stepIndex: number
  ship: { x: number; y: number; vx: number; vy: number; angle: number }
  alive: boolean
  invuln: number
  shield: number
  shieldHits: number
  swarms: Swarm[]
  pests: Pest[]
  pools: Pool[]
  huts: Hut[]
  shots: Array<{ x: number; y: number; vx: number; vy: number; life: number }>
  special: SpecialState | null
  boss: Hum | null
  beads: number
  owned: Set<string>
  hints: Set<string>
  threads: Set<string>
  record: Map<number, number>
  card: { region: { id: string }; t: number } | null
  clinic: { cursor: number; message: string } | null
  kit: { id: string; ticks: number } | null
  wingman: { x: number; y: number } | null
  lure: { x: number; y: number; ticks: number } | null
  wind: { timer: number; tell: number; gust: number; dir: number }
  plan: { title: string; wind?: boolean }
  update(input: InputFrame): void
  demoInput(): InputFrame
  beginStep(i: number): void
  startPlay(): void
  startDawn(): void
  takeKit(id: string): void
  closeLoop(loop: unknown): void
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
const frame = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
const steps = campaignSteps()
const stepOf = (pred: (s: (typeof steps)[number]) => boolean) =>
  steps.findIndex(pred)
const nightStep = (region: string, night: number) =>
  stepOf((s) => s.kind === 'night' && s.region === region && s.night === night)
/** A game at step i, past its map, with the sky cleared. */
function at(i: number, seed = 1): Inner {
  const g = game(seed)
  g.beginStep(i)
  if (g.phase === 'map') g.startPlay()
  g.swarms = []
  g.pests = []
  g.invuln = 0
  return g
}
function keeper(): Swarm {
  const s = newSwarm(W / 2, 10, 1, mulberry32(9), 99999)
  s.vx = 0
  s.vy = 0
  return s
}
/** The cabinet's own save path: keepSave -> store (withSave) -> JSON -> sanitizeSaves -> resume. */
function roundTrip(g: Inner): unknown {
  const kept = g.save
  assert.ok(kept, 'the game has a save to keep')
  const stored = JSON.stringify(withSave({}, 'butterfly-blaster', kept))
  assert.ok(stored.length < MAX_SAVE_BYTES, 'a save is small')
  return sanitizeSaves(JSON.parse(stored))['butterfly-blaster']
}

// --- the season as data ----------------------------------------------------------------------------
{
  assert.equal(MOONS[0]!.name, 'FIRST RAINS')
  for (const id of ['riverbend', 'terraces'] as const) {
    const r = REGIONS[id]
    assert.equal(r.nights.length, 4, `${id}: four nights`)
    assert.ok(r.nights[2]!.special, `${id}: night 3 is the special night`)
    assert.ok(!r.nights[0]!.special && !r.nights[3]!.special)
    for (const n of r.nights)
      assert.equal(n.waves.length, 2, `${id}: two waves a night`)
  }
  assert.notEqual(
    REGIONS.riverbend.backdrop,
    REGIONS.terraces.backdrop,
    'each region has its own sky',
  )
  assert.notEqual(
    REGIONS.riverbend.theme,
    REGIONS.terraces.theme,
    'and its own music',
  )
  assert.notEqual(HEARTBEATS.riverbend[0], HEARTBEATS.terraces[0])
  assert.equal(HEARTBEATS.terraces.length, HEARTBEAT_BPM.length)
  assert.deepEqual(
    steps.map((s) => s.kind),
    [
      'night',
      'night',
      'night',
      'night',
      'clinic',
      'night',
      'night',
      'night',
      'night',
      'boss',
      'clinic',
      'endless',
    ],
    'four nights, the Clinic, four nights, the Hum, the Clinic, then the river runs on',
  )
  assert.ok(
    REGIONS.terraces.nights.some((n) => n.wind),
    'wind blows on the terraces',
  )
  assert.ok(REGIONS.terraces.nights[0]!.pools.length > 0, 'the terraces breed')
  assert.equal(JAR_SPOTS.length, PADDIES.length, 'a jar for every paddy')
  for (const p of [...PADDIES, ...JAR_SPOTS])
    assert.ok(p.x > 0 && p.x < W && p.y < GROUND)
  // The river map: a node per night and nest, all on screen.
  const nodes = mapNodes(steps)
  assert.equal(nodes.length, 9)
  for (const n of nodes)
    assert.ok(n.at.x > 20 && n.at.x < W - 20 && n.at.y > 60 && n.at.y < H - 60)
  assert.equal(nodes.at(-1)!.kind, 'boss')
}

// --- the river map between nights ------------------------------------------------------------------
{
  const g = game()
  assert.equal(g.phase, 'map', 'the season opens on the river map')
  assert.equal(g.level, 1)
  assert.equal(g.music !== null, true, 'the river has a tune')
  for (let t = 0; t < 40; t++) g.update(emptyInput())
  g.update(frame('a'))
  assert.equal(g.phase, 'play', 'A flies on')
  assert.ok(g.swarms.length > 0, 'the first night begins')
  assert.ok(
    g.card && g.card.region.id === 'riverbend',
    'with the region title card',
  )
  const idle = game(2)
  for (let t = 0; t <= MAP_TICKS + 1; t++) idle.update(emptyInput())
  assert.equal(idle.phase, 'play', 'the map flies on by itself')
}

// --- the Lantern Walk ------------------------------------------------------------------------------
{
  const walk = at(nightStep('riverbend', 2))
  assert.ok(walk.special?.kind === 'lanterns')
  const lanterns = walk.special.lanterns
  assert.equal(lanterns.length, LANTERN.count)
  const x0 = lanterns[0]!.x
  walk.swarms = [keeper()]
  walk.update(emptyInput())
  assert.notEqual(lanterns[0]!.x, x0, 'the villagers walk the bank')
  // A hungry swarm at a lantern bites it out.
  const l = lanterns[3]!
  // Between two huts, so the swarm is at the lantern and not a window.
  l.x = 240
  const s = newSwarm(l.x, LANTERN.y, 1, mulberry32(4), 0)
  s.mode = 'seek'
  s.vx = 0
  s.vy = 0
  walk.swarms = [s, keeper()]
  Object.assign(walk.ship, { x: 40, y: 40 })
  walk.update(emptyInput())
  assert.ok(l.bitten, 'a swarm at a lantern puts it out')
  // Dawn with five of eight lit: the objective is met, and with no hut bitten, a golden thread.
  for (const k of [0, 1]) lanterns[k]!.bitten = true
  walk.swarms = []
  const beads = walk.beads
  const score = walk.score
  walk.startDawn()
  assert.equal(lanterns.filter((x) => !x.bitten).length, 5)
  assert.equal(
    walk.beads - beads,
    8 * BEADS.hut + BEADS.notABite + BEADS.special,
  )
  assert.ok(walk.score - score > 3000, 'the special night pays')
  assert.ok(
    walk.threads.has('riverbend'),
    'a golden thread for a perfect special night',
  )
  // Four lit is not enough.
  const short = at(nightStep('riverbend', 2), 3)
  const ls = (short.special as Extract<SpecialState, { kind: 'lanterns' }>)
    .lanterns
  for (const k of [0, 1, 2, 3]) ls[k]!.bitten = true
  short.startDawn()
  assert.ok(!short.threads.has('riverbend'))
}

// --- Tip the Pots ----------------------------------------------------------------------------------
{
  const pots = at(nightStep('terraces', 2))
  assert.ok(pots.special?.kind === 'pots')
  const jars = pots.special.jars
  assert.equal(jars.length, 6)
  assert.equal(pots.pools.length, 6, 'a paddy for each jar')
  pots.swarms = [keeper()]
  const jar = jars[2]!
  const shoot = () => {
    pots.shots = [{ x: jar.x, y: jar.y, vx: 0, vy: 0, life: 10 }]
    pots.update(emptyInput())
  }
  Object.assign(pots.ship, { x: 240, y: 60 })
  shoot()
  assert.equal(jar.hits, 1)
  assert.ok(!jar.tipped, 'one sparkle only rocks it')
  shoot()
  assert.ok(jar.tipped, 'two tip it')
  assert.ok(pots.pools[jar.pool]!.dry, 'and its paddy dries')
  for (const j of jars) j.tipped = true
  pots.startDawn()
  assert.ok(
    pots.threads.has('terraces'),
    'every pot tipped, no bites: a golden thread',
  )
  // Pools raise only so many wrigglers a wave.
  const pool = newPool({ x: 100, y: GROUND + 4 }, 10, mulberry32(1))
  let raised = 0
  for (let t = 0; t < 5000; t++) if (tickPool(pool, 10, mulberry32(t))) raised++
  assert.equal(raised, BROODS)
}

// --- wind on the terraces --------------------------------------------------------------------------
{
  const windy = REGIONS.terraces.nights.findIndex((n) => n.wind)
  const g = at(nightStep('terraces', windy))
  assert.ok(g.plan.wind)
  g.swarms = [keeper()]
  g.wind.timer = 1
  Object.assign(g.ship, { x: 240, y: 150, vx: 0, vy: 0 })
  g.update(emptyInput())
  assert.equal(g.wind.tell, WIND.tell, 'the flags tell first')
  for (let t = 0; t < WIND.tell + 30; t++) {
    g.invuln = 999
    g.update(emptyInput())
  }
  assert.ok(g.wind.gust > 0, 'then the gust')
  assert.ok(
    Math.sign(g.ship.vx) === g.wind.dir && Math.abs(g.ship.vx) > 0.5,
    'and it pushes the butterfly',
  )
}

// --- AMI's kit -------------------------------------------------------------------------------------
{
  // The sturdy net takes two hits.
  const n = at(0)
  n.owned.add('sturdyNet')
  n.takeKit('net')
  assert.equal(n.shield, SHIELD_TICKS)
  assert.equal(n.shieldHits, 2)
  const biter = () => {
    const s = newSwarm(n.ship.x, n.ship.y, 1, mulberry32(3), 9999)
    s.vx = 0
    s.vy = 0
    n.swarms = [s, keeper()]
  }
  biter()
  n.invuln = 0
  n.update(emptyInput())
  assert.ok(n.shield > 0 && n.alive, 'the first hit is caught')
  biter()
  n.invuln = 0
  n.update(emptyInput())
  assert.equal(n.shield, 0, 'the second wears it out')
  assert.ok(n.alive)

  // The spray fan sparkles three ways; the long sparkle flies further.
  const f = at(0)
  f.swarms = [keeper()]
  f.takeKit('fan')
  f.update(frame('a'))
  assert.equal(f.shots.length, 3)
  assert.ok(FAN.shots > 5)
  const longShot = at(0)
  longShot.swarms = [keeper()]
  longShot.takeKit('long')
  longShot.update(frame('a'))
  assert.ok(longShot.shots[0]!.life > 48 * (LONG - 0.1))

  // The repellent ring pops a mosquito that strays into it.
  const r = at(0)
  r.takeKit('ring')
  const stray = newSwarm(r.ship.x + 32, r.ship.y, 1, mulberry32(5), 9999)
  stray.vx = 0
  stray.vy = 0
  r.swarms = [stray, keeper()]
  r.invuln = 999
  for (let t = 0; t < 80 && r.swarms.includes(stray); t++) {
    stray.x = r.ship.x + 32
    stray.y = r.ship.y
    r.update(emptyInput())
  }
  assert.ok(!r.swarms.includes(stray), 'the ring popped it')

  // The dragonfly hunts lone mosquitoes.
  const d = at(0)
  d.takeKit('wingman')
  const prey = newSwarm(100, 100, 1, mulberry32(6), 9999)
  d.swarms = [prey, keeper()]
  d.invuln = 999
  for (let t = 0; t < 400 && d.swarms.includes(prey); t++)
    d.update(emptyInput())
  assert.ok(!d.swarms.includes(prey), 'the dragonfly caught it')

  // The lantern lure draws every swarm, hungry or not.
  const lu = at(0)
  Object.assign(lu.ship, { x: 240, y: 120 })
  lu.takeKit('lure')
  const far = newSwarm(60, 60, 2, mulberry32(7), 99999)
  lu.swarms = [far]
  const before = Math.hypot(far.x - lu.lure!.x, far.y - lu.lure!.y)
  for (let t = 0; t < 180; t++) {
    lu.invuln = 999
    lu.ship.x = 400
    lu.ship.y = 40
    lu.update(emptyInput())
  }
  assert.equal(far.mode, 'seek')
  assert.ok(
    Math.hypot(far.x - lu.lure!.x, far.y - lu.lure!.y) < before - 60,
    'the swarm clusters on the lure',
  )
  assert.ok(KIT.lure.ticks > 0)
}

// --- the Clinic ------------------------------------------------------------------------------------
{
  const clinicStep = stepOf((s) => s.kind === 'clinic')
  const g = game()
  g.beginStep(clinicStep)
  assert.equal(g.phase, 'clinic')
  for (let t = 0; t < 25; t++) g.update(emptyInput())
  g.beads = 3
  g.update(frame('a'))
  assert.equal(g.lives, 3, 'no butterfly without the beads')
  assert.match(g.clinic!.message, /NOT ENOUGH/)
  g.beads = 30
  g.update(frame('a'))
  assert.equal(g.lives, 4, 'beads buy an extra butterfly')
  assert.equal(g.beads, 30 - clinicPrice('butterfly', 1))
  assert.equal(g.save!.beads, g.beads, 'a purchase is saved at once')
  assert.equal(g.save!.step, clinicStep)
  // A once-only upgrade: the starting net.
  g.update(frame('down'))
  g.update(frame('down'))
  g.update(frame('down'))
  assert.equal(CLINIC_ROWS[g.clinic!.cursor], 'startNet')
  g.update(frame('a'))
  assert.ok(g.owned.has('startNet'))
  const left = g.beads
  g.update(frame('a'))
  assert.equal(g.beads, left, 'never sold twice')
  // The thread hint names the next region's thread, and its title card shows it.
  g.update(frame('down'))
  g.update(frame('down'))
  assert.equal(CLINIC_ROWS[g.clinic!.cursor], 'hint')
  g.update(frame('a'))
  assert.ok(g.hints.has('terraces'))
  assert.match(g.clinic!.message, /TIP THE POTS/)
  g.update(frame('b'))
  assert.equal(g.phase, 'map', 'B leaves for the next night')
  assert.equal(g.stepIndex, clinicStep + 1)
  g.startPlay()
  assert.ok(g.shield > 0, 'the starting net is on')
  assert.equal(g.card?.region.id, 'terraces')
  assert.ok(
    clinicPrice('sturdyNet', 2) > clinicPrice('sturdyNet', 1),
    'prices rise each Moon',
  )
}

// --- the Hum ---------------------------------------------------------------------------------------
{
  const scored: number[] = []
  const bitten: Hut[] = []
  const spawned: unknown[] = []
  const huts = newVillage()
  let ship: { x: number; y: number } | null = { x: 240, y: 300 }
  const host: BossHost = {
    rng: mulberry32(1),
    ship: () => ship,
    huts,
    bite: (h) => {
      h.bites++
      bitten.push(h)
    },
    score: (p) => void scored.push(p),
    sound: () => {},
    burst: () => {},
    spawn: (p) => void spawned.push(p),
  }
  const hum = new Hum()
  for (let t = 0; t < 60; t++) hum.update(host)
  // Phase 1: the orbit blocks sparkles; gaps let them through to the core.
  const mote = hum.motes.find((m) => m.alive)!
  assert.ok(
    hum.shot({ x: mote.x, y: mote.y }, host),
    'a mote takes the sparkle',
  )
  assert.ok(!mote.alive, 'and leaves a gap')
  assert.equal(hum.coreHp, HUM.coreHp)
  for (let k = 0; k < HUM.coreHp; k++) hum.shot({ x: hum.x, y: hum.y }, host)
  assert.equal(hum.phase, 2, 'the core broken, it splits')
  assert.equal(hum.subs.length, 4)
  // Phase 2: the four circle the hut nearest the butterfly and dive at it.
  ship = { x: huts[6]!.x, y: 200 }
  for (let t = 0; t < 600; t++) hum.update(host)
  assert.ok(
    bitten.includes(huts[6]!),
    'they dive at the window of the hut the butterfly is nearest',
  )
  assert.ok(
    huts[6]!.bites >= 3 && hum.target !== huts[6],
    'and move on once its lamp is out',
  )
  for (const s of hum.subs) while (s.hp > 0) hum.shot({ x: s.x, y: s.y }, host)
  assert.equal(hum.phase, 3)
  // Phase 3: the core rests, tells, dashes; sparkles daze it; only the lasso nets it.
  const dashes = hum.dashes
  for (let t = 0; t < HUM.rest + HUM.tell + HUM.dash + 2; t++) hum.update(host)
  assert.ok(hum.dashes > dashes, 'it bolts')
  assert.ok(spawned.length > 0, 'and shakes a mosquito loose')
  hum.shot({ x: hum.x, y: hum.y }, host)
  assert.ok(hum.dazed > 0, 'a sparkle dazes it')
  assert.ok(!hum.defeated, 'but never beats it')
  assert.ok(hum.lassoMark(), 'dazed, it can be lassoed')
  assert.ok(!hum.lasso(() => false, host))
  assert.ok(
    hum.lasso(() => true, host),
    'a loop round it nets it',
  )
  assert.ok(hum.defeated)
  for (let t = 0; t < 160; t++) hum.update(host)
  assert.ok(hum.done)

  // In the game: the nest is a step of its own, and the village thanks you for it.
  const bossStep = stepOf((s) => s.kind === 'boss')
  const g = at(bossStep)
  assert.ok(g.boss, 'the Hum is in the sky')
  assert.equal(g.music !== null, true)
  g.boss!.defeated = true
  g.boss!.exit = 999
  const beads = g.beads
  g.update(emptyInput())
  assert.equal(g.phase, 'bossDone')
  for (let t = 0; t < 200 && g.phase === 'bossDone'; t++) g.update(emptyInput())
  assert.equal(g.phase, 'dawn')
  assert.ok(g.beads - beads >= BEADS.boss, 'the nest netted pays beads')

  // The attract pilot can lasso the core itself.
  const p = at(bossStep, 3)
  const core = p.boss!
  core.phase = 3
  core.subs = []
  core.mode = 'rest'
  core.modeTicks = HUM.rest
  core.x = 240
  core.y = 150
  for (let t = 0; t < 60 * 120 && !core.defeated; t++) {
    p.lives = 3
    p.update(p.demoInput())
  }
  assert.ok(core.defeated, 'the pilot nets the Hum')
}

// --- saves: a real round trip at every checkpoint --------------------------------------------------
{
  // Progress kept at a night, through the store, comes back as an offer to carry on.
  const g = game()
  g.beginStep(nightStep('terraces', 1))
  g.score = 12_345
  g.beads = 17
  g.owned.add('ribbon')
  g.threads.add('riverbend')
  g.record.set(0, 8)
  g.beginStep(nightStep('terraces', 1))
  const back = roundTrip(g)
  const r = game(5, back)
  assert.equal(r.phase, 'offer', 'a saved season offers to carry on')
  r.update(frame('a'))
  assert.equal(r.stepIndex, nightStep('terraces', 1))
  assert.equal(r.phase, 'map')
  assert.equal(r.score, 12_345)
  assert.equal(r.beads, 17)
  assert.ok(r.owned.has('ribbon') && r.threads.has('riverbend'))
  assert.equal(r.record.get(0), 8, 'the river map remembers each village')
  assert.equal(r.level, 6)
  // A new season instead: the golden threads stay, everything else starts again.
  const fresh = game(6, back)
  fresh.update(frame('b'))
  assert.equal(fresh.stepIndex, 0)
  assert.equal(fresh.beads, 0)
  assert.ok(fresh.threads.has('riverbend'))

  // The Clinic and the nest are checkpoints too.
  const c = game()
  c.beginStep(stepOf((s) => s.kind === 'clinic'))
  c.beads = 40
  for (let t = 0; t < 25; t++) c.update(emptyInput())
  c.update(frame('a'))
  const cb = game(7, roundTrip(c))
  cb.update(frame('a'))
  assert.equal(
    cb.phase,
    'clinic',
    'a quit in the Clinic comes back to the Clinic',
  )
  assert.equal(
    cb.beads,
    40 - clinicPrice('butterfly', 1),
    'with what was bought kept',
  )
  assert.equal(cb.lives, 4)
  const b = game()
  b.beginStep(stepOf((s) => s.kind === 'boss'))
  const bb = game(8, roundTrip(b))
  bb.update(frame('a'))
  bb.startPlay()
  assert.ok(bb.boss, 'a quit at the nest comes back to the nest')

  // The endless river after the Hum keeps its night count.
  const e = game()
  e.beginStep(stepOf((s) => s.kind === 'endless'))
  e.beginStep(stepOf((s) => s.kind === 'endless'))
  const eb = game(9, roundTrip(e))
  eb.update(frame('a'))
  assert.equal(eb.level, e.level)

  // The save outlives a game over, so the season can be picked up again.
  const over = at(0)
  over.lives = 1
  over.swarms = [keeper()]
  over.alive = false
  over.lives = 0
  for (let t = 0; t < 200; t++) over.update(emptyInput())
  assert.ok(over.over)
  assert.ok(over.save, 'the save is still there after the last butterfly')

  // Junk never loads, and the attract demo never saves.
  for (const junk of [
    null,
    7,
    'x',
    {},
    { v: 2 },
    { v: 1, step: 999 },
    { v: 1, step: 1, score: -1 },
  ])
    assert.equal(readBlasterSave(junk), null)
  const clean = readBlasterSave({
    v: 1,
    step: 1,
    score: 10,
    lives: 2,
    beads: 3,
    owned: ['ribbon', 'nonsense', 'butterfly'],
    hints: ['terraces', 'mars'],
    threads: [],
    record: [[0, 8], [1, 99], 'x'],
  })
  assert.deepEqual(clean?.owned, ['ribbon'])
  assert.deepEqual(clean?.hints, ['terraces'])
  assert.deepEqual(clean?.record, [[0, 8]])
  const demo = game(1, back, true)
  assert.equal(demo.save, undefined)
  assert.notEqual(demo.phase, 'offer')
}

// --- the attract demo and a pilot probe ------------------------------------------------------------
{
  const demo = game(11, undefined, true)
  for (let t = 0; t < 60 * 60 * 4 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo never scores')
  // The pilot flies the season for real: runs end, and the river turns over at a sane pace.
  let ended = 0
  let reached = 0
  for (const seed of [101, 202, 303]) {
    const g = game(seed)
    for (let t = 0; t < 60 * 60 * 25 && !g.over; t++) g.update(g.demoInput())
    if (g.over) ended++
    reached = Math.max(reached, g.stepIndex)
  }
  assert.equal(ended, 3, 'every pilot run ends')
  assert.ok(reached >= 5, `the pilot reaches the Rice Terraces (${reached})`)
}

console.log('butterfly blaster season ok')
