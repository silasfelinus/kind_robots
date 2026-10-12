// Butterfly Blaster depth pass, slice 1 (conductor kr-arcade/t-055, depth-pass CABINETS.md section 6):
// flight and the living swarm. Flocking swarms drawn to light that regroup when split, the Rainbow
// Lasso, chains, the anti-lurk cloud, the flutter-dash and the risky long hop, the heartbeat, huts
// that can be bitten and the dawn tally, and the first new pests (wriggler, skimmer, needle) with
// their breeding pools. Each rule is pinned on a staged sky; a pilot probe shows runs still end.
//
//   npx tsx utils/scripts/verifyCabinetButterflyBlaster.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import {
  BRAVE,
  CHAIN,
  DASH,
  DAWN_TICKS,
  LURK,
  create,
  endlessNight,
} from '../arcade/games/butterflyBlaster'
import {
  LASSO_POINTS,
  MIN_LOOP_AREA,
  Ribbon,
  crossing,
  insideLoop,
  lassoMultiplier,
  makeLoop,
} from '../arcade/butterflyBlaster/lasso'
import type { Loop } from '../arcade/butterflyBlaster/lasso'
import {
  HEARTBEAT,
  HEARTBEAT_BPM,
  heartbeatTier,
} from '../arcade/butterflyBlaster/music'
import {
  HATCH_TICKS,
  NEEDLE,
  RIPPLE_TICKS,
  SKIMMER,
  newPest,
  newPool,
  tickPool,
} from '../arcade/butterflyBlaster/pests'
import type { Pest, Pool } from '../arcade/butterflyBlaster/pests'
import { GROUND, SKY, W, wrapDist } from '../arcade/butterflyBlaster/sky'
import {
  REGROUP_TICKS,
  SWARM_RADIUS,
  SWARM_TREE,
  flySwarm,
  newSwarm,
  pickLight,
  regroupSwarms,
  splitSwarm,
} from '../arcade/butterflyBlaster/swarm'
import type { Swarm } from '../arcade/butterflyBlaster/swarm'
import {
  HUT_BITES,
  TALLY,
  WINDOW_Y,
  dawnTally,
  hutLights,
  newVillage,
} from '../arcade/butterflyBlaster/village'
import type { Hut } from '../arcade/butterflyBlaster/village'

type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  ship: { x: number; y: number; vx: number; vy: number; angle: number }
  unwrapped: { x: number; y: number }
  alive: boolean
  invuln: number
  bCooldown: number
  brave: number
  ribbon: Ribbon
  swarms: Swarm[]
  pests: Pest[]
  pools: Pool[]
  huts: Hut[]
  drops: Array<{ fall: number }>
  cloud: { angry: boolean; small: boolean } | null
  chain: number
  lurk: number
  phase: 'play' | 'gap' | 'dawn'
  wave: number
  phaseTicks: number
  music: unknown
  update(input: InputFrame): void
  demoInput(): InputFrame
  mosquitoesLeft(): number
  hitSwarm(index: number, byShot: boolean): void
  startPlay(): void
}

const quiet = { play: () => {} }
function game(seed = 1, demo = false): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
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
/** A sky cleared of pests, the butterfly mid-sky and no longer flashing. */
function staged(seed = 1): Inner {
  const g = game(seed)
  // Past the river map, straight into the night.
  g.startPlay()
  g.swarms = []
  g.pests = []
  g.pools = []
  g.invuln = 0
  return g
}
function keeper(): Swarm {
  const s = newSwarm(W / 2, 10, 1, mulberry32(9), 99999)
  s.vx = 0
  s.vy = 0
  return s
}

// --- the sky ---------------------------------------------------------------------------------------
{
  assert.equal(SKY, GROUND, 'the sky wraps at the ground line')
  assert.equal(
    wrapDist({ x: 2, y: 10 }, { x: W - 2, y: 10 }),
    4,
    'wraps sideways',
  )
  assert.equal(
    wrapDist({ x: 5, y: 2 }, { x: 5, y: SKY - 2 }),
    4,
    'wraps top to ground',
  )
}

// --- the Rainbow Lasso: geometry -------------------------------------------------------------------
{
  assert.deepEqual(
    crossing(
      { x: 0, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
      { x: 10, y: 0 },
    ),
    {
      x: 5,
      y: 5,
    },
  )
  assert.equal(
    crossing({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 }),
    null,
  )
  // A ribbon flown in a square closes when it crosses its own start.
  const r = new Ribbon()
  const path = [
    [100, 100],
    [160, 100],
    [160, 160],
    [100, 160],
    [100, 130],
    [130, 90],
  ]
  let loop: Loop | null = null
  path.forEach(([x, y], i) => {
    loop = r.lay(x!, y!, i * 2, true) ?? loop
  })
  assert.ok(loop, 'crossing the ribbon closes the loop')
  const l: Loop = loop
  assert.ok(l.area > MIN_LOOP_AREA)
  assert.ok(insideLoop(l, 130, 130), 'the middle is inside')
  assert.ok(!insideLoop(l, 200, 130), 'outside is outside')
  assert.equal(r.points.length, 2, 'the ribbon starts again from the crossing')
  // A gap in the flutter breaks the ribbon: no loop across it.
  const g2 = new Ribbon()
  g2.lay(100, 100, 0, true)
  g2.lay(160, 100, 2, true)
  g2.lay(160, 160, 4, true)
  g2.lay(100, 160, 6, false)
  assert.equal(g2.lay(130, 60, 8, true), null, 'no ribbon across a gap')
  // Old ribbon fades.
  const fade = new Ribbon()
  fade.lay(0, 0, 0, true)
  fade.lay(10, 0, 2, true)
  fade.age(fade.life + 3)
  assert.equal(fade.points.length, 0)
  // A loop flown across the right edge still catches a pest just over the left edge.
  const edge = makeLoop([
    { x: W - 30, y: 100 },
    { x: W + 40, y: 100 },
    { x: W + 40, y: 170 },
    { x: W - 30, y: 170 },
  ])
  assert.ok(insideLoop(edge, 20, 130), 'a wrapped copy is inside')
  assert.ok(!insideLoop(edge, 60, 130))
  // A wobble is not a lasso.
  const wobble = new Ribbon()
  const tiny = [
    [0, 0],
    [8, 0],
    [8, 8],
    [0, 8],
    [4, -4],
  ]
  let small: Loop | null = null
  tiny.forEach(([x, y], i) => {
    small = wobble.lay(x!, y!, i, true) ?? small
  })
  assert.equal(small, null, 'tiny loops do not count')
  assert.deepEqual(
    [1, 3, 7, 12, 20].map(lassoMultiplier),
    [1, 2, 3, 4, 5],
    'bigger loops pay bigger multipliers',
  )
}

// --- the Rainbow Lasso in play: a big swarm nets its whole split tree ------------------------------
{
  const g = staged()
  const big = newSwarm(220, 188, 3, mulberry32(2), 99999)
  big.vx = 0
  big.vy = 0
  const single = newSwarm(228, 196, 1, mulberry32(3), 99999)
  single.vx = 0
  single.vy = 0
  const outside = keeper()
  g.swarms = [big, single, outside]
  // Fly a circle round them: flutter while turning (a circle about 40 px across, centred on them).
  Object.assign(g.ship, { x: 240, y: 210, vx: 0, vy: 0, angle: Math.PI / 2 })
  g.unwrapped = { x: 240, y: 210 }
  g.ribbon.clear()
  const before = g.score
  let netted = false
  for (let t = 0; t < 400 && !netted; t++) {
    big.x = 220
    big.y = 188
    single.x = 228
    single.y = 196
    g.invuln = 999
    g.update(frame('up', 'left'))
    netted = !g.swarms.includes(big)
  }
  assert.ok(netted, 'a loop flown round the swarm nets it')
  assert.ok(!g.swarms.includes(single), 'everything inside is netted')
  assert.ok(g.swarms.includes(outside), 'nothing outside is')
  const count = SWARM_TREE[3] + SWARM_TREE[1]
  assert.equal(count, 8, 'a big swarm counts its whole split tree (1 + 2 + 4)')
  assert.equal(
    g.score - before,
    LASSO_POINTS * count * lassoMultiplier(count),
    '100 a mosquito times the loop multiplier',
  )
}

// --- the living swarm ------------------------------------------------------------------------------
{
  const rng = mulberry32(4)
  // Hungry swarms head for the lit windows.
  const huts = newVillage()
  const lights = hutLights(huts)
  assert.equal(lights.length, 8)
  const s = newSwarm(huts[3]!.x + 20, 80, 2, rng, 0)
  s.mode = 'seek'
  const startGap = Math.abs(WINDOW_Y - s.y)
  for (let t = 0; t < 240; t++)
    flySwarm(s, { swarms: [s], lights, glow: null, speed: 1, rng })
  assert.ok(
    Math.abs(WINDOW_Y - s.y) < startGap - 60,
    'a hungry swarm flies down to the village',
  )
  // A dark hut no longer draws them.
  for (const h of huts) h.bites = HUT_BITES
  huts[6]!.bites = 0
  assert.equal(pickLight(s, hutLights(huts))!.id, 6, 'only lit huts pull')

  // The butterfly's glow draws a nearby swarm, but not a lone mosquito.
  const glowRng = mulberry32(5)
  const drawn = newSwarm(200, 150, 2, glowRng, 99999)
  drawn.vx = 0
  drawn.vy = 0
  const alone = newSwarm(200, 150, 1, glowRng, 99999)
  alone.vx = 0
  alone.vy = 0
  let pulled = 0
  let lonePulled = 0
  for (let t = 0; t < 60; t++) {
    const b1 = wrapDist(drawn, { x: 260, y: 150 })
    flySwarm(drawn, {
      swarms: [drawn],
      lights: [],
      glow: { x: 260, y: 150 },
      speed: 1,
      rng: glowRng,
    })
    pulled += b1 - wrapDist(drawn, { x: 260, y: 150 })
    const b2 = wrapDist(alone, { x: 260, y: 150 })
    flySwarm(alone, {
      swarms: [alone],
      lights: [],
      glow: { x: 260, y: 150 },
      speed: 1,
      rng: glowRng,
    })
    lonePulled += b2 - wrapDist(alone, { x: 260, y: 150 })
  }
  assert.ok(
    pulled > lonePulled + 5,
    'the glow pulls swarms harder than lone mosquitoes',
  )

  // Split halves scatter, then regroup and merge back.
  const whole = newSwarm(240, 140, 3, rng, 99999)
  const halves = splitSwarm(whole, rng, 99999)!
  assert.equal(halves.length, 2)
  assert.ok(
    halves.every(
      (h) =>
        h.size === 2 && h.mode === 'scatter' && h.regroup === REGROUP_TICKS,
    ),
  )
  assert.equal(
    splitSwarm(newSwarm(0, 0, 1, rng, 1), rng, 1),
    null,
    'a single mosquito does not split',
  )
  let flock: Swarm[] = [...halves]
  let mergedAt = -1
  for (let t = 0; t < REGROUP_TICKS + 900 && mergedAt < 0; t++) {
    for (const h of flock)
      flySwarm(h, { swarms: flock, lights: [], glow: null, speed: 1, rng })
    const out = regroupSwarms(flock)
    flock = out.swarms
    if (out.merged.length) mergedAt = t
  }
  assert.ok(
    mergedAt >= REGROUP_TICKS - 1,
    `halves wait before regrouping (${mergedAt})`,
  )
  assert.equal(flock.length, 1, 'two halves left alone merge back')
  assert.equal(flock[0]!.size, 3, 'into the bigger swarm')
  // Halves still scattering never merge.
  const fresh = splitSwarm(newSwarm(100, 100, 2, rng, 9), rng, 9)!
  fresh[1].x = fresh[0].x
  fresh[1].y = fresh[0].y
  assert.equal(regroupSwarms([...fresh]).merged.length, 0)
}

// --- huts, bites and the dawn tally ----------------------------------------------------------------
{
  const g = staged()
  const hut = g.huts[2]!
  const biter = newSwarm(hut.x, WINDOW_Y - 4, 1, mulberry32(6), 0)
  biter.mode = 'seek'
  biter.vx = 0
  biter.vy = 0.5
  g.swarms = [biter, keeper()]
  Object.assign(g.ship, { x: 400, y: 60 })
  g.update(emptyInput())
  assert.equal(hut.bites, 1, 'a hungry swarm at a lit window bites')
  assert.ok(hut.flicker > 0, 'the window flickers')
  assert.equal(biter.mode, 'shoo', 'and the swarm is shooed off')
  hut.bites = HUT_BITES
  assert.ok(
    !hutLights(g.huts).some((l) => l.id === 2),
    'three bites and the lamp goes out',
  )

  const huts = newVillage()
  huts[0]!.bites = 1
  huts[1]!.bites = HUT_BITES
  const tally = dawnTally(huts)
  assert.equal(tally.unbitten, 6)
  assert.equal(tally.total, 6 * TALLY.unbitten + 1 * TALLY.lit)
  assert.ok(!tally.perfect)
  const perfect = dawnTally(newVillage())
  assert.ok(perfect.perfect)
  assert.equal(perfect.total, 8 * TALLY.unbitten + TALLY.notABite)

  // A night is two waves, then dawn; a night with no bites gives a butterfly back.
  const n = staged()
  n.swarms = []
  n.update(emptyInput())
  assert.equal(n.phase, 'gap', 'the first wave cleared: the second is coming')
  for (let t = 0; t < 200 && n.phase === 'gap'; t++) n.update(emptyInput())
  assert.equal(n.wave, 1)
  assert.ok(n.swarms.length > 0, 'the second wave arrives')
  n.swarms = []
  n.pests = []
  const lives = n.lives
  const score = n.score
  n.update(emptyInput())
  assert.equal(n.phase, 'dawn')
  assert.equal(n.lives, lives + 1, 'Not a Bite: an extra butterfly')
  assert.equal(n.score - score, perfect.total)
  for (let t = 0; t < DAWN_TICKS + 2; t++) n.update(emptyInput())
  assert.equal(n.level, 2, 'the next night, downriver')
  assert.equal(n.phase, 'map', 'the river map shows the way first')
  assert.ok(
    n.huts.every((h) => h.bites === 0),
    'a fresh village',
  )
}

// --- chains ----------------------------------------------------------------------------------------
{
  const g = staged()
  g.swarms = [1, 2, 3, 4, 5, 6].map((i) => {
    const s = newSwarm(40 * i, 50, 1, mulberry32(i), 99999)
    s.vx = 0
    s.vy = 0
    return s
  })
  const gains: number[] = []
  for (let i = 0; i < 5; i++) {
    const before = g.score
    g.hitSwarm(0, true)
    gains.push(g.score - before)
    g.update(emptyInput())
  }
  assert.deepEqual(
    gains,
    [100, 200, 300, 400, 400],
    `sparkles in quick succession chain up to x${CHAIN.max}`,
  )
  for (let t = 0; t < CHAIN.ticks + 2; t++) g.update(emptyInput())
  assert.equal(g.chain, 0, 'the chain lapses after a quiet second')
}

// --- the flutter-dash and the long hop -------------------------------------------------------------
{
  const g = staged()
  g.swarms = [keeper()]
  Object.assign(g.ship, { x: 200, y: 200, vx: 0, vy: 0, angle: 0 })
  g.update(frame('b'))
  g.update(emptyInput())
  assert.ok(
    Math.abs(g.ship.y - (200 - DASH.distance)) < 1,
    'a tap of B dashes forward',
  )
  assert.ok(Math.abs(g.ship.x - 200) < 1)
  assert.ok(g.bCooldown > DASH.cooldown - 3, 'and B cools down')
  const at = { ...g.ship }
  g.update(frame('b'))
  g.update(emptyInput())
  assert.ok(Math.abs(g.ship.y - at.y) < 6, 'no second dash during the cooldown')

  // A hold is the long hop: anywhere in the sky, risk and all.
  const h = staged(3)
  h.swarms = [keeper()]
  Object.assign(h.ship, { x: 200, y: 200, vx: 0, vy: 0, angle: 0 })
  for (let t = 0; t < DASH.hold + 1; t++) h.update(frame('b'))
  assert.ok(wrapDist(h.ship, { x: 200, y: 200 }) > 1, 'a held B hops')
  assert.equal(h.ship.vx, 0)
  h.update(emptyInput())

  // A Brave Hop: land beside a swarm and live through it. (The dice are fixed so the hop lands
  // mid-sky, at x 240.)
  const b = staged(5) as Inner & { rng: () => number }
  b.rng = () => 0.5
  const s = newSwarm(240 + SWARM_RADIUS[3] + 20, 159, 3, mulberry32(1), 99999)
  b.swarms = [s]
  Object.assign(b.ship, { x: 100, y: 100, vx: 0, vy: 0, angle: 0 })
  for (let t = 0; t < DASH.hold + 1; t++) b.update(frame('b'))
  assert.equal(Math.round(b.ship.x), 240)
  assert.equal(
    b.brave,
    BRAVE.ticks - 1,
    'landing beside a swarm starts a Brave Hop',
  )
  const before = b.score
  for (let t = 0; t < BRAVE.ticks; t++) {
    s.x = 240 + SWARM_RADIUS[3] + 20
    s.y = 159
    s.mode = 'wander'
    b.update(emptyInput())
  }
  assert.ok(b.alive)
  assert.equal(b.score - before, BRAVE.points, 'live through it for the bonus')
}

// --- anti-lurk -------------------------------------------------------------------------------------
{
  const g = staged()
  g.swarms = [keeper()]
  Object.assign(g.ship, { x: 20, y: 150, vx: 0, vy: 0, angle: 0 })
  g.cloud = null
  const cloud = () => g.cloud
  for (let t = 0; t < LURK.ticks + 2; t++) {
    g.invuln = 999
    g.ship.x = 20
    g.ship.y = 150
    g.swarms[0]!.x = 300
    g.swarms[0]!.y = 20
    g.update(emptyInput())
    if (cloud()) break
  }
  const came = cloud()
  assert.ok(came, 'idling at the edge brings the malaria cloud early')
  assert.ok(came.angry && came.small, 'small, and aiming tighter')
}

// --- the heartbeat ---------------------------------------------------------------------------------
{
  assert.equal(HEARTBEAT.length, HEARTBEAT_BPM.length)
  for (let i = 1; i < HEARTBEAT.length; i++)
    assert.ok(
      HEARTBEAT[i]!.bpm > HEARTBEAT[i - 1]!.bpm,
      'the beat quickens tier by tier',
    )
  assert.equal(heartbeatTier(1, false), 0)
  assert.equal(heartbeatTier(0.1, false), 3)
  assert.equal(
    heartbeatTier(0.05, true),
    HEARTBEAT.length - 1,
    'the last mosquito sprints',
  )
  const g = staged()
  const full = g.music
  const last = newSwarm(100, 100, 1, mulberry32(1), 9999)
  g.swarms = [last]
  g.wave = 1
  g.update(emptyInput())
  assert.notEqual(g.music, full)
  assert.equal(g.music, HEARTBEAT.at(-1), 'the sprint plays the fastest beat')
  assert.ok(last.sprint, 'the last mosquito of the night sprints')
  assert.equal(last.mode, 'seek')
}

// --- breeding pools and the wriggler ---------------------------------------------------------------
{
  const rng = mulberry32(7)
  const pool = newPool({ x: 200, y: GROUND + 4 }, 100, rng)
  let rose = -1
  for (let t = 0; t < 400 && rose < 0; t++)
    if (tickPool(pool, 100, rng)) rose = t
  assert.ok(rose >= RIPPLE_TICKS, 'a pool ripples before a wriggler rises')
  pool.dry = true
  for (let t = 0; t < 400; t++)
    assert.ok(!tickPool(pool, 100, rng), 'a dried pool breeds no more')

  // Left alone, a wriggler hatches into a swarm.
  const g = staged()
  g.swarms = [keeper()]
  g.pests = [newPest('wriggler', 200, GROUND - 4, mulberry32(1))]
  Object.assign(g.ship, { x: 400, y: 60 })
  for (let t = 0; t < HATCH_TICKS + 2; t++) {
    g.invuln = 999
    g.update(emptyInput())
  }
  assert.equal(g.pests.length, 0)
  assert.equal(g.swarms.length, 2, 'it hatched into a swarm')
  // Sparkled at the surface, it is nipped.
  const n = staged()
  n.swarms = [keeper()]
  n.pests = [newPest('wriggler', 200, GROUND - 4, mulberry32(1))]
  Object.assign(n.ship, {
    x: 200,
    y: GROUND - 80,
    vx: 0,
    vy: 0,
    angle: Math.PI,
  })
  n.update(frame('a'))
  for (let t = 0; t < 30; t++) n.update(emptyInput())
  assert.equal(n.pests.length, 0, 'the sparkle nips it')
  assert.equal(n.swarms.length, 1, 'nothing hatched')
}

// --- the needle and the skimmer --------------------------------------------------------------------
{
  const g = staged()
  g.swarms = [keeper()]
  const needle = newPest('needle', 100, 150, mulberry32(2))
  needle.t = 1
  g.pests = [needle]
  Object.assign(g.ship, { x: 300, y: 150, vx: 0, vy: 0, angle: 0 })
  g.update(emptyInput())
  assert.equal(needle.state, 'aim', 'a needle stops and glows red first')
  assert.ok(Math.abs(needle.heading) < 0.05, 'locked on the butterfly')
  g.ship.y = 60
  for (let t = 0; t < NEEDLE.tell; t++) {
    g.invuln = 999
    g.update(emptyInput())
  }
  assert.equal(needle.state, 'dash')
  assert.ok(
    Math.abs(needle.vy) < 0.01,
    'it dashes along the locked line, not after you',
  )
  assert.ok(Math.hypot(needle.vx, needle.vy) >= NEEDLE.speed - 0.01)

  const k = staged()
  k.swarms = [keeper()]
  const skimmer = newPest('skimmer', 200, 0, mulberry32(3))
  assert.equal(skimmer.y, SKIMMER.y, 'skimmers skate the ground line')
  skimmer.t = 1
  k.pests = [skimmer]
  Object.assign(k.ship, { x: 40, y: 40 })
  k.update(emptyInput())
  const sprays = k.drops.filter((d) => d.fall > 0)
  assert.equal(
    sprays.length,
    3,
    'it flicks a fan of three drops up into the sky',
  )
}

// --- nights climb ----------------------------------------------------------------------------------
{
  const n1 = endlessNight(1)
  const n8 = endlessNight(8)
  assert.equal(n1.waves.length, 2, 'two waves a night')
  assert.equal(n1.pools.length, 0, 'the first night is dry')
  assert.equal(n1.waves[0]!.needles + n1.waves[0]!.skimmers, 0)
  assert.ok(
    n8.pools.length >= 3 &&
      n8.waves[1]!.needles >= 1 &&
      n8.waves[1]!.skimmers >= 1,
  )
  assert.ok(n8.speed > n1.speed && n8.cloudEvery < n1.cloudEvery)
  assert.ok(endlessNight(16).waves[1]!.big >= endlessNight(12).waves[1]!.big)
}

// --- the attract demo and a pilot probe ------------------------------------------------------------
{
  const demo = game(7, true)
  for (let t = 0; t < 60 * 120 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo never scores')

  // The pilot flying for real: runs end, and nights go by at a sane pace.
  let ended = 0
  let nights = 0
  for (let seed = 1; seed <= 4; seed++) {
    const g = game(seed * 101)
    let t = 0
    for (; t < 60 * 60 * 15 && !g.over; t++) g.update(g.demoInput())
    if (g.over) ended++
    nights += g.level
  }
  assert.equal(ended, 4, 'every pilot run ends')
  assert.ok(nights >= 8, `the pilot sees a few nights (${nights})`)
  // Unlimited lives: nights keep coming, none stalls.
  const g = game(3)
  for (let t = 0; t < 60 * 60 * 8; t++) {
    g.lives = Math.max(g.lives, 3)
    g.update(g.demoInput())
  }
  assert.ok(g.level >= 4, `nights keep turning over (${g.level})`)
}

console.log('butterfly blaster slice 1 ok')
