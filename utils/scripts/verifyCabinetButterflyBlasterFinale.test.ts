// Butterfly Blaster depth pass, slice 3 (conductor kr-arcade/t-057, depth-pass CABINETS.md section 6):
// Moons 2 and 3, the bosses and the endings. The Mangrove Delta (tide, fog, fireflies), Market
// Town (festival light strings), the Tea Hills Storm (lightning, rain, updrafts) and the Great
// Swamp, each with its special night; the shade swarm, bloom cluster and hummers, storm cell,
// sticky swarm and decoy glow; the bat squadron; Old Puddle and the Night Queen; the dawn ending
// and credits; the golden threads, the Moonlit Lagoon and Zero Night; and the Dry Season. Saves
// are checked with a real round trip, the clear recorded the moment an ending starts.
//
//   npx tsx utils/scripts/verifyCabinetButterflyBlasterFinale.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { sanitizeSaves, withSave } from '../arcade/saves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { STICKY, create } from '../arcade/games/butterflyBlaster'
import type { BlasterSave } from '../arcade/games/butterflyBlaster'
import {
  CREDITS_TICKS,
  SKIP_AFTER,
  creditLines,
} from '../arcade/butterflyBlaster/endings'
import type { BossHost } from '../arcade/butterflyBlaster/hum'
import {
  BOSS_MUSIC,
  ENDING,
  HEARTBEATS,
} from '../arcade/butterflyBlaster/music'
import {
  HUMMER,
  PEST_TREE,
  STORM as CELL,
  newPest,
} from '../arcade/butterflyBlaster/pests'
import type { Pest, Pool } from '../arcade/butterflyBlaster/pests'
import { PUDDLE, Puddle } from '../arcade/butterflyBlaster/puddle'
import { POOL_SPOTS } from '../arcade/butterflyBlaster/nights'
import { QUEEN, Queen } from '../arcade/butterflyBlaster/queen'
import {
  MOONS,
  REGIONS,
  THREAD_REGIONS,
  campaignSteps,
  dryNight,
} from '../arcade/butterflyBlaster/season'
import type { RegionId } from '../arcade/butterflyBlaster/season'
import { GROUND, W, wrapDist } from '../arcade/butterflyBlaster/sky'
import { ESCORT, MARKET } from '../arcade/butterflyBlaster/specials'
import type { SpecialState } from '../arcade/butterflyBlaster/specials'
import { newSwarm } from '../arcade/butterflyBlaster/swarm'
import type { Swarm } from '../arcade/butterflyBlaster/swarm'
import { newVillage } from '../arcade/butterflyBlaster/village'
import type { Hut } from '../arcade/butterflyBlaster/village'
import {
  STORM,
  STRINGS,
  TIDE,
  inFog,
  litForShade,
  newWeather,
  stringY,
  tickWeather,
  tideLine,
} from '../arcade/butterflyBlaster/weather'
import type { Weather } from '../arcade/butterflyBlaster/weather'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  save: BlasterSave | null | undefined
  music: unknown
  phase: string
  stepIndex: number
  ship: { x: number; y: number; vx: number; vy: number; angle: number }
  alive: boolean
  invuln: number
  shield: number
  swarms: Swarm[]
  pests: Pest[]
  pools: Pool[]
  huts: Hut[]
  shots: Array<{
    x: number
    y: number
    vx: number
    vy: number
    life: number
    hue: number
  }>
  special: SpecialState | null
  boss: { defeated: boolean; exit: number; phase: number } | null
  bossId: string | null
  weather: Weather
  sticky: number
  soak: number
  bats: unknown[]
  lure: { x: number; y: number; ticks: number; carry: number } | null
  ribbon: { life: number }
  threads: Set<RegionId>
  cleared: boolean
  dry: number
  zero: boolean
  wave: number
  plan: { waves: { big: number }[]; speed: number }
  ending: { kind: string; t: number } | null
  update(input: InputFrame): void
  demoInput(): InputFrame
  beginStep(i: number): void
  startPlay(): void
  startDawn(): void
  takeKit(id: string): void
}

const quiet = { play: () => {} }
function game(seed = 1, resume?: unknown): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
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
const nightStep = (region: RegionId, night: number) =>
  stepOf((s) => s.kind === 'night' && s.region === region && s.night === night)
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
function roundTrip(g: Inner): unknown {
  const stored = JSON.stringify(withSave({}, 'butterfly-blaster', g.save))
  return sanitizeSaves(JSON.parse(stored))['butterfly-blaster']
}
const ALL = new Set<RegionId>(THREAD_REGIONS)

// --- the season as data ----------------------------------------------------------------------------
{
  assert.deepEqual(
    MOONS.map((m) => m.name),
    ['FIRST RAINS', 'HEAVY RAINS', 'LAST RAINS', 'THE MOONLIT LAGOON'],
  )
  assert.deepEqual(
    MOONS.map((m) => m.boss),
    ['hum', 'puddle', 'queen', undefined],
    'a nest boss at the end of each Moon',
  )
  const ids = Object.keys(REGIONS) as RegionId[]
  assert.equal(ids.length, 7, 'six regions and the secret Lagoon')
  assert.equal(
    new Set(ids.map((id) => REGIONS[id].backdrop)).size,
    7,
    'a sky each',
  )
  for (const id of ids) {
    assert.ok(HEARTBEATS[id].length, `${id} has its heartbeat`)
    assert.equal(REGIONS[id].nights.length, 4)
  }
  for (const id of THREAD_REGIONS) {
    const n = REGIONS[id].nights
    assert.ok(n[2]!.special, `${id}: night 3 is special`)
    assert.ok(!n[0]!.special && !n[1]!.special && !n[3]!.special)
  }
  assert.equal(
    REGIONS.swamp.nights[2]!.waves.length,
    3,
    'the Long Night is three waves',
  )
  assert.ok(
    REGIONS.delta.nights.every((n) => n.tide),
    'the delta has its tide',
  )
  assert.ok(
    REGIONS.market.nights.every((n) => n.strings),
    'Market Town its light strings',
  )
  assert.ok(
    REGIONS.tea.nights.every((n) => n.storm),
    'the Tea Hills their storm',
  )
  assert.ok(
    REGIONS.lagoon.nights.every((n) => n.coins && n.speed === 1.75),
    'the Lagoon at full speed',
  )
  for (const b of ['hum', 'puddle', 'queen'] as const) assert.ok(BOSS_MUSIC[b])
  assert.ok(ENDING.tracks.length)
  // The later pests all turn up somewhere in the season.
  const waves = ids.flatMap((id) => REGIONS[id].nights.flatMap((n) => n.waves))
  for (const k of ['shade', 'sticky', 'blooms', 'storms', 'decoys'] as const)
    assert.ok(
      waves.some((w) => (w[k] ?? 0) > 0),
      `${k} in the season`,
    )
  // After the Queen: the ending, the secret Lagoon and Zero Night, then the Dry Season.
  const queen = stepOf((s) => s.kind === 'boss' && s.boss === 'queen')
  assert.deepEqual(steps[queen + 1], { kind: 'ending', ending: 'dawn' })
  assert.equal(steps.filter((s) => s.kind === 'night' && s.secret).length, 4)
  assert.deepEqual(steps.at(-2), {
    kind: 'ending',
    ending: 'zero',
    secret: true,
  })
  assert.deepEqual(steps.at(-1), { kind: 'dry' })
  // The Dry Season remixes a night: harder, the waves turned round.
  const n = REGIONS.riverbend.nights[0]!
  const d = dryNight(n, 1)
  assert.ok(d.speed > n.speed && d.waves[0]!.big > n.waves[1]!.big - 1)
  assert.equal(
    d.waves[0]!.big,
    n.waves[1]!.big + 1,
    'the last wave comes first, bigger',
  )
  assert.ok(d.hunger[0] < n.hunger[0])
}

// --- weather ---------------------------------------------------------------------------------------
{
  // The tide rises and falls, and the butterfly bounces off the water.
  const w = newWeather({ tide: true }, mulberry32(1))
  assert.equal(tideLine(w), TIDE.low)
  w.t = TIDE.period / 2
  assert.ok(Math.abs(tideLine(w) - TIDE.high) < 1, 'high tide shrinks the sky')
  const g = at(nightStep('delta', 0))
  g.swarms = [keeper()]
  g.weather.t = TIDE.period / 2 - 1
  Object.assign(g.ship, { x: 200, y: GROUND - 20, vx: 0, vy: 2 })
  g.invuln = 999
  g.update(emptyInput())
  assert.ok(
    g.ship.y < tideLine(g.weather) && g.ship.vy < 0,
    'the water line is a floor',
  )

  // Fog hides, firefly light shows; a shade swarm is only seen in the light.
  const f = newWeather({ fog: true }, mulberry32(2))
  const bank = f.fog[0]!
  f.fireflies = []
  assert.ok(inFog(f, bank))
  assert.ok(!litForShade(f, bank))
  f.fireflies.push({ x: bank.x, y: bank.y, vx: 0, vy: 0 })
  assert.ok(litForShade(f, bank) && !inFog(f, bank), 'a firefly lifts the fog')
  f.fireflies = []
  f.storm.flash = 5
  assert.ok(litForShade(f, bank), 'and so does lightning')

  // Strings of bulbs draw the flock; a sparkle dims one; a lingering swarm lays a mosquito.
  const m = at(nightStep('market', 0))
  const str = m.weather.strings[0]!
  const s = newSwarm(240, stringY(str.y, 240), 2, mulberry32(3), 99999)
  m.swarms = [s]
  const before = m.swarms.length
  for (let t = 0; t < STRINGS.lay + 5; t++) {
    s.x = 240
    s.y = stringY(str.y, 240)
    m.invuln = 999
    m.update(emptyInput())
  }
  assert.ok(m.swarms.length > before, 'a swarm at a lit string lays a mosquito')
  m.shots = [{ x: 100, y: stringY(str.y, 100), vx: 0, vy: 0, life: 5, hue: 0 }]
  m.update(emptyInput())
  assert.ok(str.dim > 0, 'a sparkle dims the string')

  // The storm: a flash, a strike's glow tell, then the strike zaps its column.
  const st = newWeather({ storm: true }, mulberry32(4))
  st.storm.next = 1
  const ev = tickWeather(st, mulberry32(5), 0, { x: 200, y: 100 })
  assert.ok(ev.flash && ev.strikeTell !== undefined)
  let landed: number | undefined
  for (let t = 0; t < STORM.tell + 1 && landed === undefined; t++)
    landed = tickWeather(st, mulberry32(t), 0, null).strike
  assert.equal(landed, ev.strikeTell, 'it lands where it glowed')
  const tea = at(nightStep('tea', 0))
  tea.swarms = [keeper()]
  const zap = newSwarm(300, 150, 1, mulberry32(6), 99999)
  tea.swarms.push(zap)
  Object.assign(tea.ship, { x: 300, y: 220, vx: 0, vy: 0 })
  tea.weather.storm.strike = { x: 300, t: 1 }
  tea.weather.storm.next = 999
  const lives = tea.lives
  tea.update(emptyInput())
  assert.ok(
    !tea.swarms.includes(zap),
    'lightning zaps the mosquitoes in its column',
  )
  assert.equal(tea.lives, lives - 1, 'and the butterfly too, if it is there')
  // Rain soaks the wings; a rainbow updraft dries them.
  const wet = at(nightStep('tea', 0))
  wet.swarms = [keeper()]
  wet.weather.storm.next = 9999
  for (let t = 0; t < 300; t++) {
    wet.invuln = 999
    wet.update(emptyInput())
  }
  assert.ok(wet.soak >= 300, 'rain soaks the wings')
  wet.weather.storm.updrafts = [{ x: wet.ship.x, t: 100 }]
  wet.update(emptyInput())
  assert.equal(wet.soak, 0, 'an updraft dries them')
}

// --- the later pests -------------------------------------------------------------------------------
{
  // A bloom cluster takes two sparkles, then scatters into six hummers.
  const g = at(nightStep('market', 1))
  g.swarms = [keeper()]
  const bloom = newPest('bloom', 200, 150, mulberry32(1))
  g.pests = [bloom]
  Object.assign(g.ship, { x: 40, y: 40 })
  const hit = () => {
    g.shots = [{ x: bloom.x, y: bloom.y, vx: 0, vy: 0, life: 5, hue: 0 }]
    g.update(emptyInput())
  }
  hit()
  assert.ok(g.pests.includes(bloom), 'one sparkle cracks it')
  hit()
  assert.ok(!g.pests.includes(bloom))
  assert.equal(
    g.pests.filter((p) => p.kind === 'hummer').length,
    6,
    'six hummers scatter',
  )
  assert.equal(PEST_TREE.bloom, 6, 'a lasso nets a bloom as six')
  // A hummer never stops homing.
  const h = newPest('hummer', 100, 100, mulberry32(2))
  g.pests = [h]
  Object.assign(g.ship, { x: 300, y: 100 })
  const d0 = wrapDist(h, g.ship)
  for (let t = 0; t < 120; t++) {
    g.invuln = 999
    g.ship.x = 300
    g.ship.y = 100
    g.update(emptyInput())
  }
  assert.ok(wrapDist(h, g.ship) < d0 - 60, 'it homes in')
  assert.ok(HUMMER.speed < 1)

  // A storm cell crackles over the butterfly's column, then strikes down it.
  const c = at(nightStep('tea', 0))
  c.swarms = [keeper()]
  c.weather.storm.on = false
  const cell = newPest('storm', 240, 0, mulberry32(3))
  cell.t = 1
  c.pests = [cell]
  Object.assign(c.ship, { x: 240, y: 200, vx: 0, vy: 0 })
  c.update(emptyInput())
  assert.equal(cell.state, 'crackle', 'the tell first')
  const lives = c.lives
  for (let t = 0; t < CELL.tell + 2; t++) {
    c.ship.x = 240
    c.update(emptyInput())
  }
  assert.equal(c.lives, lives - 1, 'then the bolt down its column')

  // A decoy glow: caught, it bursts into hummers (no butterfly lost); sparkled, it pops.
  const dg = at(nightStep('swamp', 0))
  dg.swarms = [keeper()]
  const decoy = newPest('decoy', 200, 100, mulberry32(4))
  dg.pests = [decoy]
  Object.assign(dg.ship, { x: 200, y: 100, vx: 0, vy: 0 })
  const before = dg.lives
  dg.update(emptyInput())
  assert.equal(dg.lives, before, 'catching a decoy is not a hit')
  assert.equal(
    dg.pests.filter((p) => p.kind === 'hummer').length,
    4,
    'but it bursts into hummers',
  )

  // A sticky swarm gums the wings: no butterfly lost, slower turns, and B shakes it off.
  const sg = at(nightStep('tea', 1))
  sg.weather.storm.on = false
  const sticky = newSwarm(200, 150, 2, mulberry32(5), 99999)
  sticky.kind = 'sticky'
  sg.swarms = [sticky, keeper()]
  Object.assign(sg.ship, { x: 200, y: 150, vx: 0, vy: 0, angle: 0 })
  const lv = sg.lives
  sg.update(emptyInput())
  assert.equal(sg.lives, lv, 'stuck, not knocked down')
  assert.equal(sg.sticky, STICKY.ticks)
  const a0 = sg.ship.angle
  sg.update(frame('right'))
  assert.ok(
    sg.ship.angle - a0 < 0.05,
    'turning is slower with gum on the wings',
  )
  sg.update(frame('b'))
  sg.update(emptyInput())
  assert.equal(sg.sticky, 0, 'B shakes it off')

  // The bat squadron sweeps across and gobbles lone mosquitoes.
  const b = at(nightStep('market', 0))
  b.weather.strings = []
  const lone = newSwarm(200, 120, 1, mulberry32(6), 99999)
  b.swarms = [lone, keeper()]
  Object.assign(b.ship, { x: 400, y: 60 })
  b.takeKit('bats')
  assert.ok(b.bats.length > 0)
  for (let t = 0; t < 400 && b.swarms.includes(lone); t++) {
    lone.vx = 0
    lone.vy = 0
    b.invuln = 999
    b.update(emptyInput())
  }
  assert.ok(!b.swarms.includes(lone), 'the bats caught it')
}

// --- the special nights ----------------------------------------------------------------------------
{
  // The Firefly Escort: the cloud follows a butterfly flying just ahead of it, all the way across.
  const g = at(nightStep('delta', 2))
  assert.ok(g.special?.kind === 'escort')
  const e = g.special.escort
  g.swarms = [keeper()]
  for (let t = 0; t < 60 * 60 && !e.arrived; t++) {
    g.invuln = 999
    g.ship.x = Math.min(W - 10, e.x + 30)
    g.ship.y = e.y
    g.weather.t = 0
    g.update(emptyInput())
  }
  assert.ok(e.arrived, 'led across the delta')
  g.startDawn()
  assert.ok(
    g.threads.has('delta'),
    'across with no hut bitten: a golden thread',
  )
  // A swarm that reaches the cloud dims it.
  const h = at(nightStep('delta', 2), 2)
  const cloud = (h.special as Extract<SpecialState, { kind: 'escort' }>).escort
  const biter = newSwarm(cloud.x, cloud.y, 1, mulberry32(7), 0)
  biter.mode = 'seek'
  h.swarms = [biter, keeper()]
  Object.assign(h.ship, { x: 400, y: 40 })
  h.update(emptyInput())
  assert.equal(cloud.health, ESCORT.health - 1)

  // The Night Market: the lit stall moves along; bites on it count.
  const m = at(nightStep('market', 2))
  assert.ok(m.special?.kind === 'market')
  const market = m.special
  m.swarms = [keeper()]
  m.weather.strings = []
  const lit0 = market.lit
  for (let t = 0; t < MARKET.lit + 1; t++) {
    m.invuln = 999
    m.update(emptyInput())
  }
  assert.notEqual(market.lit, lit0, 'the next stall lights')
  const stall = market.stalls[market.lit]!
  const s = newSwarm(stall.x, MARKET.y, 1, mulberry32(8), 0)
  s.mode = 'seek'
  m.swarms = [s, keeper()]
  m.update(emptyInput())
  assert.equal(stall.bites, 1, 'a bite on the lit stall')

  // Hold the Hill: one bite on the shelter and the hill is lost.
  const hill = at(nightStep('tea', 2))
  assert.ok(hill.special?.kind === 'hill')
  const shelter = hill.special.shelter
  hill.weather.storm.on = false
  const sb = newSwarm(shelter.x, shelter.y, 1, mulberry32(9), 0)
  sb.mode = 'seek'
  hill.swarms = [sb, keeper()]
  Object.assign(hill.ship, { x: 40, y: 40 })
  hill.update(emptyInput())
  assert.equal(shelter.bites, 1)
  hill.startDawn()
  assert.ok(!hill.threads.has('tea'))

  // The Long Night: three waves before the dawn tally.
  const ln = at(nightStep('swamp', 2))
  for (let k = 0; k < 2; k++) {
    ln.swarms = []
    ln.pests = []
    ln.update(emptyInput())
    assert.equal(ln.phase, 'gap')
    for (let t = 0; t < 200 && ln.phase === 'gap'; t++) ln.update(emptyInput())
  }
  assert.equal(ln.wave, 2, 'a third wave')
  ln.swarms = []
  ln.pests = []
  ln.update(emptyInput())
  assert.equal(ln.phase, 'dawn')
}

// --- Old Puddle --------------------------------------------------------------------------------------
{
  const scored: number[] = []
  const pools: unknown[] = []
  const pests: string[] = []
  let kit: string | null = null
  let lure: { x: number; y: number; carried: boolean } | null = null
  const host: BossHost = {
    rng: mulberry32(1),
    ship: () => ({ x: 240, y: 150 }),
    huts: newVillage(),
    bite: () => {},
    score: (p) => void scored.push(p),
    sound: () => {},
    burst: () => {},
    spawn: () => {},
    spawnPest: (k) => void pests.push(k),
    addPool: (p) => void pools.push(p),
    dropKit: (k) => {
      kit = k
    },
    lure: () => lure,
    pushShots: () => {},
    ribbonBoost: () => {},
  }
  const p = new Puddle()
  // Phase 1: a pad soaks a sparkle up; the open mouth takes it.
  const closed = (p.open + 1) % 3
  assert.ok(p.shot({ x: PUDDLE.mouths[closed]!, y: GROUND - 10 }, host))
  assert.equal(p.mouths[closed], PUDDLE.mouthHp, 'a lily pad blocks it')
  for (let t = 0; t < PUDDLE.burp; t++) p.update(host)
  assert.ok(pests.includes('wriggler'), 'the mouths burp up wrigglers')
  for (let k = 0; k < 40 && p.phase === 1; k++)
    p.shot({ x: PUDDLE.mouths[p.open]!, y: GROUND - 10 }, host)
  assert.equal(p.phase, 2, 'all three mouths shut')
  // Phase 2: rain, and every few drops a new mini-pool.
  for (let t = 0; t < 900; t++) p.update(host)
  assert.ok(
    pools.length > 0 && pools.length <= PUDDLE.pools,
    'drops that land make pools',
  )
  for (let k = 0; k < 2 * PUDDLE.eyeHp + 4 && p.phase === 2; k++) {
    const eye = p.targets()[0]
    if (eye) p.shot(eye, host)
  }
  assert.equal(p.phase, 3)
  // Phase 3: AMI brings the lantern; the spout follows it into the sunbeam and dries out.
  p.update(host)
  assert.equal(kit, 'lure', 'AMI brings the lantern lure')
  lure = { x: p.sunX, y: 140, carried: true }
  for (let t = 0; t < 600 && !p.defeated; t++) p.update(host)
  assert.ok(p.defeated, 'the spout dried out in the sunbeam')
  assert.ok(scored.includes(15_000))
  assert.ok(!p.lasso(), 'it never needed a lasso')

  // In the game, the butterfly carries the lantern, and the pilot carries it into the sun.
  const g = at(
    stepOf((s) => s.kind === 'boss' && s.boss === 'puddle'),
    3,
  )
  const boss = g.boss as unknown as Puddle
  boss.phase = 3
  boss.sunX = 60
  boss.spoutX = 380
  g.takeKit('lure')
  assert.ok(g.lure && g.lure.carry > 0)
  for (let t = 0; t < 60 * 60 && !boss.defeated; t++) {
    g.lives = 3
    g.update(g.demoInput())
  }
  assert.ok(boss.defeated, 'the pilot leads the spout into the sunbeam')
}

// --- the Night Queen ---------------------------------------------------------------------------------
{
  const spawned: number[] = []
  let pushed = 0
  let boost = 0
  const host: BossHost = {
    rng: mulberry32(2),
    ship: () => ({ x: 240, y: 200 }),
    huts: newVillage(),
    bite: (h) => {
      h.bites++
    },
    score: () => {},
    sound: () => {},
    burst: () => {},
    spawn: (_at, size) => void spawned.push(size ?? 1),
    spawnPest: () => {},
    addPool: () => {},
    dropKit: () => {},
    lure: () => null,
    pushShots: (dx) => {
      pushed += dx
    },
    ribbonBoost: (_t, life) => {
      boost = life
    },
  }
  const q = new Queen()
  for (let t = 0; t < QUEEN.firstRaft; t++) q.update(host)
  assert.equal(q.rafts.length, 1, 'she drops an egg raft')
  // While her eggs are safe she shrugs sparkles off.
  assert.ok(q.guarded)
  assert.ok(q.shot(q, host), 'a sparkle at her is spent')
  assert.equal(q.hp, QUEEN.hp, 'but does not hurt her')
  const raft = q.rafts[0]!
  assert.ok(q.shot({ x: raft.x, y: GROUND + 3 }, host), 'a sparkle sinks it')
  assert.ok(
    POOL_SPOTS.some((p) => p.x === raft.x),
    'rafts float on the standing water',
  )
  assert.ok(q.daze > 0 && !q.guarded, 'sinking a raft makes her reel')
  q.shot(q, host)
  assert.equal(q.hp, QUEEN.hp - 1, 'a reeling Queen takes the sparkle')
  q.shot(q, host)
  assert.equal(q.hp, QUEEN.hp - 1, 'she flinches: the next is shrugged off')
  for (let t = 0; t < QUEEN.daze; t++) q.update(host)
  assert.ok(q.guarded, 'the daze wears off')
  for (let t = 0; t < QUEEN.raftEvery + QUEEN.hatch + 2; t++) q.update(host)
  assert.ok(spawned.includes(2), 'an unsunk raft hatches a swarm')
  assert.ok(!q.lasso(() => true, host), 'no lasso before the end')
  // Even at a perfect trigger, a phase takes many openings.
  let ticks = 0
  while (q.phase === 1 && ticks < 60 * 60) {
    q.daze = Math.max(q.daze, 1)
    q.shot(q, host)
    q.update(host)
    ticks++
  }
  assert.equal(q.phase, 2)
  assert.ok(
    ticks >= (QUEEN.hp - 2) * QUEEN.flinch,
    'flinching paces even a perfect trigger',
  )
  assert.equal(q.rafts.length, 0, 'phase 2 clears the rafts')
  assert.ok(q.guarded, 'her folded wings shield her')
  q.fan = 1
  for (let t = 0; t < QUEEN.fanTell + 10; t++) q.update(host)
  assert.ok(pushed !== 0, 'her wings push the sparkles')
  assert.ok(!q.guarded, 'open wings leave her open')
  while (q.phase === 2) {
    q.fan = Math.max(q.fan, 1)
    q.shot(q, host)
    q.update(host)
  }
  assert.equal(q.phase, 3)
  assert.ok(
    q.allies.length >= 9,
    'AMI arrives with bats, dragonflies and swallows',
  )
  q.update(host)
  assert.equal(boost, QUEEN.ribbon, 'the ribbon runs sky-long')
  assert.ok(q.held > 0 && q.lassoMark(), 'the allies hold her')
  assert.ok(!q.touches(q, 10), 'held, she cannot hurt')
  assert.ok(q.lasso(() => true, host))
  assert.ok(q.defeated)

  // In the game the sky-long ribbon really is longer.
  const g = at(stepOf((s) => s.kind === 'boss' && s.boss === 'queen'))
  const life = g.ribbon.life
  const gq = g.boss as unknown as Queen
  gq.phase = 3
  gq.held = 100
  g.update(emptyInput())
  assert.ok(g.ribbon.life > life * 2, 'the finale lasso is sky-wide')
}

// --- endings, threads, the Lagoon and the Dry Season ------------------------------------------------
{
  // The Queen netted: no tally, straight into the dawn ending, and the clear saved at once.
  const queen = stepOf((s) => s.kind === 'boss' && s.boss === 'queen')
  const g = at(queen)
  g.boss!.defeated = true
  g.boss!.exit = 999
  g.update(emptyInput())
  assert.equal(g.phase, 'bossDone')
  for (let t = 0; t < 200 && g.phase === 'bossDone'; t++) g.update(emptyInput())
  assert.equal(g.phase, 'ending')
  assert.ok(g.cleared, 'the clear counts as the ending starts')
  assert.equal(g.save!.cleared, true, 'and is saved at once')
  assert.equal(g.music, ENDING)
  // Quit during the credits: the clear survives the round trip.
  const back = game(3, roundTrip(g))
  back.update(frame('a'))
  assert.equal(back.phase, 'ending', 'back to the credits')
  assert.ok(back.cleared)
  // A skips the credits after a moment; without six threads the river turns to the Dry Season.
  for (let t = 0; t < SKIP_AFTER + 1; t++) g.update(emptyInput())
  g.update(frame('a'))
  assert.equal(g.dry, 1, 'the Dry Season begins')
  assert.equal(g.stepIndex, 0)
  assert.ok(
    g.plan.speed > REGIONS.riverbend.nights[0]!.speed,
    'remixed and faster',
  )
  const dryBack = game(4, roundTrip(g))
  dryBack.update(frame('a'))
  assert.equal(dryBack.dry, 1, 'a Dry Season lap survives a quit')
  assert.ok(dryBack.level > 30, 'and the level keeps counting up')
  // The credits run out by themselves too.
  const c = at(queen + 1)
  for (let t = 0; t < CREDITS_TICKS + 2; t++) c.update(emptyInput())
  assert.notEqual(c.phase, 'ending')
  assert.ok(
    creditLines('dawn', 3).some((l) => l.includes('3/6')),
    'the credits count the threads',
  )

  // With all six threads, the Moonlit Lagoon follows the credits, then Zero Night.
  const z = game(5)
  z.threads = new Set(ALL)
  z.beginStep(queen + 1)
  for (let t = 0; t < SKIP_AFTER + 1; t++) z.update(emptyInput())
  z.update(frame('a'))
  const lagoon = steps[z.stepIndex]
  assert.ok(
    lagoon?.kind === 'night' && lagoon.region === 'lagoon',
    'the Moonlit Lagoon opens',
  )
  assert.equal(z.dry, 0)
  z.beginStep(stepOf((s) => s.kind === 'ending' && s.ending === 'zero'))
  assert.equal(z.phase, 'ending')
  assert.ok(z.zero && z.save!.zero, 'Zero Night is recorded')
  assert.ok(creditLines('zero', 6).includes('ZERO NIGHT'))
  // Without them, the Lagoon is passed by.
  const skip = game(6)
  skip.beginStep(stepOf((s) => s.kind === 'night' && s.region === 'lagoon'))
  assert.equal(skip.dry, 1, 'no threads: the Lagoon stays hidden')
}

// --- New Season keeps earned history through the first checkpoint and reload -----------------------
{
  for (const kind of ['dawn', 'zero'] as const) {
    const earned = game(17)
    earned.threads = new Set(ALL)
    earned.score = 12340
    earned.lives = 1
    earned.beginStep(stepOf((s) => s.kind === 'ending' && s.ending === kind))
    const saved = roundTrip(earned)
    assert.ok(saved?.cleared)
    assert.equal(saved.zero, kind === 'zero')

    const fresh = game(18, saved)
    assert.equal(fresh.phase, 'offer')
    fresh.update(frame('b'))
    assert.equal(fresh.stepIndex, 0, 'B starts the river again')
    assert.equal(fresh.dry, 0, 'B starts a fresh season, not a Dry Season lap')
    assert.equal(fresh.score, 0)
    assert.equal(fresh.lives, 3)
    assert.equal(fresh.save!.cleared, true, 'New Season keeps the earned clear')
    assert.equal(
      fresh.save!.zero,
      kind === 'zero',
      'New Season keeps ending history',
    )
    assert.deepEqual(new Set(fresh.save!.threads), ALL)

    // Step zero does not show a Continue offer. Its constructor must still retain history.
    const reloaded = game(19, roundTrip(fresh))
    assert.equal(reloaded.phase, 'map')
    assert.equal(
      reloaded.save!.cleared,
      true,
      'reload before playing keeps the clear',
    )
    assert.equal(reloaded.save!.zero, kind === 'zero')
    assert.deepEqual(new Set(reloaded.save!.threads), ALL)
    for (let t = 0; t < 31; t++) reloaded.update(emptyInput())
    reloaded.update(frame('a'))
    assert.equal(reloaded.phase, 'play')
    const played = game(20, roundTrip(reloaded))
    assert.equal(
      played.save!.cleared,
      true,
      'playing and saving retains earned history',
    )
    assert.equal(played.save!.zero, kind === 'zero')
    assert.deepEqual(new Set(played.save!.threads), ALL)

    for (const button of ['a', 'start'] as const) {
      const continued = game(21, saved)
      continued.update(frame(button))
      assert.equal(continued.phase, 'ending')
      assert.equal(continued.stepIndex, earned.stepIndex)
      assert.equal(continued.score, 12340, 'Continue retains the current run')
      assert.equal(continued.lives, 1)
      assert.equal(continued.cleared, true)
      assert.equal(continued.zero, kind === 'zero')
    }
  }
  const unfinished = game(22)
  unfinished.beginStep(nightStep('delta', 0))
  const legacy = roundTrip(unfinished)!
  delete legacy.cleared
  delete legacy.zero
  const fresh = game(23, legacy)
  fresh.update(frame('b'))
  assert.equal(
    fresh.save!.cleared,
    false,
    'a legacy save does not earn an ending',
  )
  assert.equal(fresh.save!.zero, false)
}

// --- the attract demo and a pilot probe ------------------------------------------------------------
{
  const demo = create({
    rng: mulberry32(13),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  demo.beginStep(nightStep('tea', 2))
  for (let t = 0; t < 60 * 60 * 3 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(
    demo.score,
    0,
    'the attract demo never scores, even in the storm',
  )
  // The pilot flies the later regions for real: runs end.
  let ended = 0
  for (const [seed, region] of [
    [7, 'delta'],
    [8, 'market'],
    [9, 'tea'],
    [10, 'swamp'],
  ] as const) {
    const g = game(seed)
    g.beginStep(nightStep(region, 0))
    for (let t = 0; t < 60 * 60 * 20 && !g.over; t++) g.update(g.demoInput())
    if (g.over) ended++
  }
  assert.equal(ended, 4, 'every pilot run ends')
}

console.log('butterfly blaster finale ok')
