// /utils/scripts/verifyCabinetLanternSwarmEvening.test.ts
//
// Lantern Swarm depth pass, slice 2 (conductor kr-arcade/t-094): the Welcome Glow, the Flock and the
// Evening fork. Holding B opens the cone and drains the gauge, and beaming refills it; a diver
// through the cone at a full gauge joins the Flock (up to four, each kind with its own beam); a
// Flock moth takes a hit for the lantern; a tap of B sends the Flock up a column; a queen's glow
// can take the Flock; charms fall and work; the Sky Chart picks the Orchard Canopy or the River of
// Lights; cocoons split into moonlet trios, sparkers are only hit while lit, skimmers cross with
// one gap, dusters leave a pocket and candles shelter the lantern; the Falling Leaves and Fish
// Kites Glows fly; the Silk Spinner and the Heron Kite run their phases; and a pilot probe shows
// runs still end while the attract demo scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetLanternSwarmEvening.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import lanternSwarm from '../arcade/games/lanternSwarm'
import type { GuardianWorld } from '../arcade/lanternSwarm/boss'
import {
  CHARMS,
  FLOCK_MAX,
  FRIEND_AT,
  GAUGE_MAX,
  TAP_TICKS,
  beamFor,
  friendBeam,
  inCone,
} from '../arcade/lanternSwarm/flock'
import { HERON, heronKite, ribbonX } from '../arcade/lanternSwarm/heron'
import { SPINNER, silkSpinner } from '../arcade/lanternSwarm/spinner'
import { resultRows, newTally } from '../arcade/lanternSwarm/results'
import {
  GLOW_CHOREOGRAPHIES,
  H,
  ORCHARD_CANOPY,
  RIVER_OF_LIGHTS,
  SLOT_OF,
  W,
  WATCHES,
  slotsFor,
  stageAt,
  type FormationStage,
  type Kind,
  type SlotKind,
} from '../arcade/lanternSwarm/zones'
import { emptyInput, type InputFrame } from '../arcade/types'

const SHIP_Y = H - 30

type Moth = {
  kind: Kind
  mode: string
  hp: number
  x: number
  y: number
  heading: number
  gone: boolean
  holding: boolean
  heldFlock: Kind[]
  brood: number
  timer: number
  dir: number
  gapX: number
  path: Array<{ x: number; y: number }>
  step: number
}
type Beam = {
  x: number
  y: number
  vx: number
  vy: number
  owner: string
  pierced: Moth[]
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  alive: boolean
  twin: boolean
  x: number
  safe: number
  moths: Moth[]
  beams: Beam[]
  dust: Array<{ x: number; y: number; vx: number; ember: boolean }>
  flock: Array<{ kind: Kind; beam: string; x: number; y: number }>
  gauge: number
  coneOpen: boolean
  homecoming: unknown
  charm: { kind: string; ticks: number } | null
  charms: Array<{ kind: string; x: number; y: number }>
  chart: { ticks: number; choice: number } | null
  results: unknown
  clear: number
  stageIndex: number
  stageTick: number
  glow: boolean
  guardian: { done: boolean; name: string } | null
  place: { zone: { id: string; name: string }; lap: number; watch: number }
  tune: { capture: number; dust: number; diveSpeed: number }
  tally: ReturnType<typeof newTally>
  night: { shots: number; hits: number }
  banner: { text: string; sub?: string } | null
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  startStage(index: number, branches?: number[]): void
  launchDive(m?: Moth): void
  hitMoth(m: Moth, crash?: boolean): void
  updateShots(): void
  dropCharm(x: number, y: number): void
  candles(): number[]
  demoInput(): InputFrame
}

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

function play(seed = 3, demo = false): Game {
  return lanternSwarm.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as unknown as Game
}

function frame(...buttons: Array<'a' | 'b' | 'left' | 'right'>): InputFrame {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}

/** Every moth settled in its formation slot, as if the entrance had finished. */
function settle(game: Game) {
  for (const m of game.moths) m.mode = 'form'
  game.update(emptyInput())
}

/** A moth caught mid-dive at (x, y). */
function diver(game: Game, kind: Kind, x: number, y: number): Moth {
  const m =
    game.moths.find((o) => !o.gone && o.kind === kind) ??
    game.moths.find((o) => o.kind === kind)!
  Object.assign(m, {
    mode: 'dive',
    x,
    y,
    heading: Math.PI / 2,
    step: 0,
    gone: false,
  })
  m.path = [{ x, y: H + 40 }]
  return m
}

const evening = [ORCHARD_CANOPY, RIVER_OF_LIGHTS]

// --- the Evening fork as data -------------------------------------------------------------------
{
  assert.equal(WATCHES.length, 2)
  assert.deepEqual(WATCHES[1], evening, 'the Evening forks two ways')
  for (const zone of evening) {
    assert.equal(zone.watch, 'EVENING')
    assert.deepEqual(
      zone.stages.map((s) => s.kind),
      ['formation', 'formation', 'formation', 'glow', 'formation', 'guardian'],
    )
    const formations = zone.stages.filter(
      (s): s is FormationStage => s.kind === 'formation',
    )
    const seen = new Set<Kind>()
    for (const stage of formations) {
      const count: Record<SlotKind, number> = {
        queen: 0,
        escort: 0,
        luna: 0,
        moth: 0,
      }
      for (const g of stage.entrance)
        for (const k of g.kinds) {
          seen.add(k)
          count[SLOT_OF[k]!]++
        }
      for (const k of Object.keys(count) as SlotKind[])
        assert.equal(
          count[k],
          slotsFor(stage.layout, k, stage.fill).length,
          `${stage.name}: one per ${k} slot`,
        )
    }
    for (const k of zone.newMoths)
      assert.ok(seen.has(k), `${zone.name} flies its ${k}s`)
  }
  assert.deepEqual(ORCHARD_CANOPY.newMoths, ['cocoon', 'sparker'])
  assert.deepEqual(RIVER_OF_LIGHTS.newMoths, ['skimmer', 'duster'])
  assert.equal(stageAt(6).zone, ORCHARD_CANOPY)
  assert.equal(stageAt(6, [1]).zone, RIVER_OF_LIGHTS)
  assert.equal(stageAt(11, [1]).stage.kind, 'guardian')
  assert.equal(stageAt(12).lap, 2)
  assert.equal(
    stageAt(18, [0, 1]).zone,
    RIVER_OF_LIGHTS,
    'each fork its own way',
  )
  // The Glows: forty each; leaves spiral down and lift back up; the fish kites cross and return.
  for (const name of ['falling-leaves', 'fish-kites'] as const) {
    const groups = GLOW_CHOREOGRAPHIES[name]
    assert.equal(
      groups.reduce((sum, g) => sum + g.count, 0),
      40,
    )
  }
  for (const g of GLOW_CHOREOGRAPHIES['falling-leaves']) {
    const ys = g.path.map((p) => p.y)
    const low = ys.indexOf(Math.max(...ys))
    assert.ok(low > 4 && ys[ys.length - 1]! < 0, 'down, then back up and away')
  }
  for (const g of GLOW_CHOREOGRAPHIES['fish-kites']) {
    const xs = g.path.map((p) => p.x)
    assert.ok(Math.max(...xs) - Math.min(...xs) > W, 'across the whole sky')
    assert.ok(g.path.length >= 20, 'a long serpentine school')
  }
}

// --- the Welcome Glow and the gauge -------------------------------------------------------------
{
  assert.ok(inCone(112, SHIP_Y - 40, 112, SHIP_Y))
  assert.ok(!inCone(112, SHIP_Y - 120, 112, SHIP_Y), 'the cone has a reach')
  assert.ok(!inCone(150, SHIP_Y - 20, 112, SHIP_Y), 'and a width')
  assert.equal(friendBeam('moth', 1), 'straight')
  assert.equal(friendBeam('luna', 1), 'angled')
  assert.equal(
    friendBeam('queen', 2),
    null,
    'a queen at full strength will not come',
  )
  assert.equal(friendBeam('queen', 1), 'pierce')

  const game = play(4)
  settle(game)
  game.safe = 1e6
  assert.equal(game.gauge, GAUGE_MAX)
  for (let t = 0; t < 30; t++) game.update(frame('b'))
  assert.ok(game.coneOpen, 'holding B opens the cone')
  assert.ok(game.gauge < GAUGE_MAX, 'and drains the gauge')
  const m = diver(game, 'moth', game.x, SHIP_Y - 50)
  game.update(frame('b'))
  assert.ok(m.gone, 'a diver through the cone is befriended')
  assert.equal(game.flock.length, 1)
  assert.equal(game.flock[0]!.beam, 'straight')
  assert.equal(game.gauge, 0, 'befriending spends the full gauge')
  assert.equal(game.tally.friends, 1)
  // An empty gauge befriends nobody.
  const m2 = diver(game, 'luna', game.x, SHIP_Y - 50)
  game.update(frame('b'))
  assert.ok(!m2.gone)
  assert.equal(game.flock.length, 1)
  // Beaming refills it.
  m2.gone = true
  const before = game.gauge
  const target = game.moths.find((o) => !o.gone && o.kind === 'moth')!
  game.beams = [
    {
      x: target.x,
      y: target.y + 4,
      vx: 0,
      vy: -5.5,
      owner: 'lantern',
      pierced: [],
    },
  ]
  game.updateShots()
  assert.ok(game.gauge > before, 'beaming refills the gauge')
  // A softened queen comes along with a piercing beam; the Flock stops at four.
  game.gauge = GAUGE_MAX
  const q = diver(game, 'queen', game.x, SHIP_Y - 50)
  q.hp = 1
  game.update(frame('b'))
  assert.ok(q.gone && game.flock.some((f) => f.beam === 'pierce'))
  for (const kind of ['luna', 'moth', 'luna'] as Kind[]) {
    game.gauge = GAUGE_MAX
    diver(game, kind, game.x, SHIP_Y - 50)
    game.update(frame('b'))
  }
  assert.equal(game.flock.length, FLOCK_MAX, 'four at most')
  assert.ok(FRIEND_AT > 0 && FRIEND_AT < GAUGE_MAX)
}

// --- the Flock beams with you, shields you, and makes the Homecoming dive -----------------------
{
  const game = play(5)
  settle(game)
  game.flock = (['moth', 'luna', 'queen'] as Kind[]).map((kind, i) => ({
    kind,
    beam: friendBeam(kind, 1)!,
    x: game.x + (i - 1) * 17,
    y: SHIP_Y - 4,
  }))
  game.beams = []
  game.update(frame('a'))
  const owners = game.beams.map((b) => b.owner).sort()
  assert.deepEqual(owners, ['angled', 'lantern', 'pierce', 'straight'])
  assert.ok(
    game.beams.find((b) => b.owner === 'angled')!.vx !== 0,
    'a side beam',
  )
  const pierce = game.beams.find((b) => b.owner === 'pierce')!
  assert.ok(Math.abs(pierce.vy) < 5, 'a slow piercing beam')
  // A piercing beam passes through one moth into the next.
  game.beams = [{ x: 40, y: 200, vx: 0, vy: -3, owner: 'pierce', pierced: [] }]
  const a = diver(game, 'moth', 40, 194)
  const b = diver(game, 'moth', 40, 170)
  for (let t = 0; t < 12; t++) game.updateShots()
  assert.ok(a.gone && b.gone, 'it pierces')
  // A Flock moth takes a hit for the lantern.
  const lives = game.lives
  const size = game.flock.length
  game.safe = 0
  game.dust = [{ x: game.x, y: SHIP_Y - 2, vx: 0, ember: false }]
  game.updateShots()
  assert.ok(game.alive)
  assert.equal(game.lives, lives)
  assert.equal(game.flock.length, size - 1, 'a friend flutters home instead')
  // Hold B a while and let go: no dive. Tap it: the Homecoming dive clears a column.
  for (let t = 0; t < TAP_TICKS + 5; t++) game.update(frame('b'))
  game.update(emptyInput())
  assert.equal(game.homecoming, null)
  settle(game)
  const column = game.moths.filter(
    (m) => !m.gone && m.mode === 'form' && Math.abs(m.x - game.x) < 10,
  )
  assert.ok(column.length >= 2)
  game.update(frame('b'))
  game.update(emptyInput())
  assert.ok(game.homecoming, 'a tap sends the Flock home')
  assert.equal(game.flock.length, 0, 'spent')
  for (let t = 0; t < 80; t++) game.update(emptyInput())
  assert.ok(
    column.every((m) => m.gone),
    'the column is cleared',
  )
}

// --- a queen's glow can take the Flock instead of the lantern -----------------------------------
{
  const game = play(6)
  settle(game)
  game.tune.capture = 1
  game.safe = 0
  game.flock = [{ kind: 'moth', beam: 'straight', x: game.x, y: SHIP_Y }]
  const q = game.moths.find((m) => m.kind === 'queen')!
  game.launchDive(q)
  assert.equal(q.mode, 'beam')
  const lives = game.lives
  for (let t = 0; t < 600 && q.heldFlock.length === 0; t++) {
    game.x = q.x
    game.update(emptyInput())
  }
  assert.deepEqual(q.heldFlock, ['moth'], 'the glow takes the Flock')
  assert.equal(game.lives, lives, 'the lantern stays')
  assert.ok(game.alive)
  q.hp = 1
  game.hitMoth(q)
  assert.equal(game.flock.length, 1, 'beam the queen and they come back')
}

// --- festival charms ----------------------------------------------------------------------------
{
  assert.equal(beamFor('sparkler').perGun, 4)
  assert.ok(beamFor('crane').half > beamFor(null).half)
  const game = play(7)
  settle(game)
  game.safe = 1e6
  game.dropCharm(game.x, SHIP_Y - 60)
  assert.equal(game.charms.length, 1)
  for (let t = 0; t < 120 && !game.charm; t++) game.update(emptyInput())
  assert.ok(game.charm, 'caught')
  assert.equal(
    game.banner?.text,
    CHARMS[game.charm!.kind as keyof typeof CHARMS].name,
  )
  // Moon Mirror blocks one hit of dust.
  game.charm = { kind: 'mirror', ticks: Infinity }
  game.safe = 0
  game.flock = []
  const lives = game.lives
  game.dust = [{ x: game.x, y: SHIP_Y - 2, vx: 0, ember: false }]
  game.updateShots()
  assert.equal(game.charm, null, 'the mirror is spent')
  assert.ok(game.alive && game.lives === lives)
  // Sparkler: four beams in the air.
  game.charm = { kind: 'sparkler', ticks: 900 }
  game.beams = []
  for (let t = 0; t < 8; t++) game.update(t % 2 ? emptyInput() : frame('a'))
  assert.ok(game.beams.filter((b) => b.owner === 'lantern').length > 2)
  // Kite String: beams lean toward a moth off to the side.
  game.charm = { kind: 'kite', ticks: 900 }
  for (const m of game.moths) m.gone = true
  const m = diver(game, 'moth', game.x + 40, 60)
  m.gone = false
  game.beams = [
    {
      x: game.x,
      y: SHIP_Y - 8,
      vx: 0,
      vy: -5.5,
      owner: 'lantern',
      pierced: [],
    },
  ]
  for (let t = 0; t < 6; t++) game.updateShots()
  assert.ok(game.beams[0]!.vx > 0, 'the beam curves')
  // Perfect Glow: a charm falls.
  const glow = play(8)
  glow.startStage(3)
  for (const d of glow.moths) {
    d.mode = 'glow'
    glow.hitMoth(d)
  }
  glow.update(emptyInput())
  assert.equal(glow.banner?.text, 'PERFECT GLOW!')
  assert.equal(glow.charms.length, 1)
}

// --- the Sky Chart picks the way -----------------------------------------------------------------
{
  for (const [button, zone] of [
    ['left', ORCHARD_CANOPY],
    ['right', RIVER_OF_LIGHTS],
  ] as const) {
    const game = play(9)
    game.startStage(5)
    ;(game.guardian as { done: boolean }).done = true
    for (let t = 0; t < 600 && !game.chart; t++)
      game.update(t % 2 || t < 100 ? emptyInput() : frame('a'))
    assert.ok(game.chart, 'after the Dusk results card: the Sky Chart')
    game.render(fakeCtx())
    game.update(frame(button))
    for (let t = 0; t < 60 && game.chart; t++)
      game.update(t % 2 ? emptyInput() : frame('a'))
    assert.equal(game.chart, null)
    assert.equal(game.place.zone, zone, `${button} picks ${zone.name}`)
    assert.equal(game.banner?.text, 'EVENING WATCH')
    assert.equal(game.level, 7)
  }
  assert.ok(Object.fromEntries(resultRows(newTally()))['FLOCK SIZE'])
}

// --- the Orchard's moths: cocoons split into moonlet trios; sparkers only lit -------------------
{
  const game = play(10)
  game.startStage(6, [0])
  settle(game)
  game.safe = 1e6
  const c = game.moths.find((m) => m.kind === 'cocoon')!
  game.launchDive(c)
  let wrapped = false
  for (let t = 0; t < 400 && !c.gone; t++) {
    game.update(emptyInput())
    wrapped ||= c.mode === 'wrap'
  }
  assert.ok(wrapped, 'it wraps in silk first (the tell)')
  const trio = game.moths.filter((m) => m.kind === 'moonlet' && !m.gone)
  assert.equal(trio.length, 3, 'three moonlets')
  assert.ok(trio.every((m) => m.brood === trio[0]!.brood))
  const before = game.score
  for (const m of trio) game.hitMoth(m)
  assert.equal(game.score - before, 3 * 150 + 1000, 'all three: the trio bonus')
  // A sparker can only be beamed while it is lit.
  const s = game.moths.find((m) => m.kind === 'sparker' && !m.gone)!
  const shoot = () => {
    game.beams = [
      { x: s.x, y: s.y + 4, vx: 0, vy: -5.5, owner: 'lantern', pierced: [] },
    ]
    game.updateShots()
  }
  const isLit = () => game.stageTick % 80 < 36
  for (let t = 0; t < 200 && isLit(); t++) game.update(emptyInput())
  assert.ok(!isLit())
  shoot()
  assert.ok(!s.gone, 'dark: the beam passes')
  for (let t = 0; t < 200 && !isLit(); t++) game.update(emptyInput())
  shoot()
  assert.ok(s.gone, 'lit: beamed')
}

// --- the River's moths: skimmers, dusters and candles --------------------------------------------
{
  const game = play(11)
  game.startStage(7, [1])
  settle(game)
  const sk = game.moths.find((m) => m.kind === 'skimmer')!
  game.launchDive(sk)
  assert.equal(sk.mode, 'skim')
  game.safe = 1e6
  for (let t = 0; t < 600 && !(sk.mode === 'skim' && sk.timer === 0); t++)
    game.update(emptyInput())
  assert.equal(sk.timer, 0, 'after the ripple, the crossing')
  // Sit under its gap: it rises over the lantern. Sit anywhere else: it skims into it.
  game.x = sk.gapX
  game.safe = 0
  const lives = game.lives
  let lowest = 0
  for (let t = 0; t < 300 && sk.mode === 'skim'; t++) {
    game.x = sk.gapX
    game.update(emptyInput())
    if (Math.abs(sk.x - sk.gapX) < 4) lowest = sk.y
  }
  assert.equal(game.lives, lives, 'safe in the gap')
  assert.ok(lowest < SHIP_Y - 30, 'it lifts over the gap')
  // A duster's curtain leaves a pocket right under its body.
  const d = game.moths.find((m) => m.kind === 'duster' && !m.gone)!
  for (const m of game.moths) if (m !== d) m.gone = true
  game.flock = []
  d.mode = 'shake'
  d.timer = 1
  d.x = 112
  d.y = 120
  game.x = 112
  game.safe = 0
  game.update(emptyInput())
  assert.ok(game.dust.length >= 6, 'a curtain')
  assert.ok(
    game.dust.every((m) => Math.abs(m.vx) >= 0.5),
    'none straight down',
  )
  let hit = false
  for (let t = 0; t < 120; t++) {
    game.x = 112
    d.y = 120
    const before = game.lives
    game.updateShots()
    hit ||= game.lives < before
  }
  assert.ok(!hit, 'the pocket under its body is safe')
  // Floating candles shelter the lantern from dust.
  const cx = game.candles()[0]!
  game.dust = [{ x: cx, y: SHIP_Y - 30, vx: 0, ember: false }]
  game.x = cx
  for (let t = 0; t < 30; t++) game.updateShots()
  assert.equal(game.alive, true, 'the candle took the dust')
}

// --- the Silk Spinner ----------------------------------------------------------------------------
{
  const s = silkSpinner(1)
  const spawned: number[] = []
  const world = (lanternX = 112): GuardianWorld => ({
    rng: mulberry32(2),
    lanternX,
    shipY: SHIP_Y,
    open: true,
    diveSpeed: 2,
    dust: () => {},
    caught: () => false,
    crash: () => {},
    sound: () => {},
    spawn: (_k, _x, _y, brood) => spawned.push(brood),
  })
  for (let t = 0; t < SPINNER.enterTicks + 2; t++) s.update(world())
  assert.equal(s.hit(s.x, s.y), null, 'out of reach on its threads')
  // It drops cocoons that hatch into moonlet trios.
  for (let t = 0; t < 300 && spawned.length === 0; t++) s.update(world())
  assert.equal(spawned.length, 3, 'a trio hatched')
  // Beam the threads: each one cut lowers it.
  const y0 = s.y
  const threadAt = (dx: number) => s.hit(s.x + dx, (22 + s.y) / 2)
  let hit = threadAt(-14)
  while (hit && hit.points === 0) hit = threadAt(-14)
  assert.equal(hit?.kind, 'thread')
  for (let t = 0; t < 60; t++) s.update(world())
  assert.ok(s.y > y0 + 10, 'lowered')
  for (const dx of [0, 14]) {
    hit = threadAt(dx)
    while (hit && !hit.phaseOver) hit = threadAt(dx)
  }
  assert.equal(s.phase, 2, 'in range')
  for (let t = 0; t < 60; t++) s.update(world())
  // A cocoon can be popped before it hatches.
  s.cocoons.push({ x: 60, y: 150, t: 0 })
  assert.equal(s.hit(60, 150)?.kind, 'cocoon')
  while (s.phase === 2) s.hit(s.x, s.y)
  assert.equal(s.phase, 3)
  assert.equal(s.giants.length, 3, 'a giant moonlet trio')
  for (let t = 0; t < 400 && !s.giants.some((m) => m.act === 'dive'); t++)
    s.update(world())
  assert.ok(
    s.giants.some((m) => m.act === 'dive'),
    'one dives at a time',
  )
  let calmed = false
  for (let n = 0; n < 200 && !calmed; n++) {
    const g = s.giants[0]
    if (!g) break
    calmed = !!s.hit(g.x, g.y)?.calmed
  }
  assert.ok(calmed)
  for (let t = 0; t < 600 && !s.done; t++) s.update(world())
  assert.ok(s.done, 'it floats home')
}

// --- the Heron Kite ------------------------------------------------------------------------------
{
  const h = heronKite(1)
  const crashes: number[] = []
  const world = (lanternX: number): GuardianWorld => ({
    rng: mulberry32(3),
    lanternX,
    shipY: SHIP_Y,
    open: true,
    diveSpeed: 2,
    dust: () => {},
    caught: () => false,
    crash: (x) => crashes.push(x),
    sound: () => {},
    spawn: () => {},
  })
  for (let t = 0; t < HERON.enterTicks + 2; t++) h.update(world(40))
  assert.equal(h.hit(h.x, h.y)?.kind, 'shrug', 'its body shrugs beams off')
  // Its reflection shows where it will dive: right where the lantern was.
  for (let t = 0; t < 400 && h.act !== 'tell'; t++) h.update(world(40))
  assert.equal(String(h.act), 'tell')
  assert.equal(h.diveX, 40)
  for (let t = 0; t < 200 && h.act !== 'skim'; t++) h.update(world(40))
  assert.ok(crashes.length > 0, 'stay put and it skims into you')
  for (let t = 0; t < 400 && h.act !== 'cruise'; t++) h.update(world(180))
  for (let t = 0; t < 400 && h.act !== 'tell'; t++) h.update(world(40))
  crashes.length = 0
  for (let t = 0; t < 200 && h.act !== 'climb'; t++) h.update(world(180))
  assert.equal(crashes.length, 0, 'read the reflection and slide aside')
  // Cut a ribbon: it stalls, and only then takes beams (a few per stall).
  for (let t = 0; t < 200 && h.act !== 'cruise'; t++) h.update(world(180))
  let hit = h.hit(ribbonX(h, 0), h.y + 20)
  while (hit && hit.points === 0) hit = h.hit(ribbonX(h, 0), h.y + 20)
  assert.equal(String(h.act), 'stall')
  let landed = 0
  for (let i = 0; i < 20; i++) if (h.hit(h.x, h.y)?.kind === 'body') landed++
  assert.equal(landed, HERON.stallHits, 'it rights itself after a few')
  // Keep at it: half calmed it flies faster; then it drifts home.
  let calmed = false
  for (let round = 0; round < 40 && !calmed; round++) {
    for (let t = 0; t < 400 && h.act !== 'cruise'; t++) h.update(world(180))
    const i = h.ribbons.findIndex((r) => r.hp > 0)
    if (i < 0) continue
    let r = h.hit(ribbonX(h, i), h.y + 20)
    while (r && r.points === 0) r = h.hit(ribbonX(h, i), h.y + 20)
    for (let k = 0; k < 10 && !calmed; k++) calmed = !!h.hit(h.x, h.y)?.calmed
  }
  assert.ok(calmed, 'calmed at last')
  for (let t = 0; t < 800 && !h.done; t++) h.update(world(180))
  assert.ok(h.done, 'it drifts home')
}

// --- every Evening screen renders headless --------------------------------------------------------
{
  for (const branch of [0, 1]) {
    const game = play(12)
    for (const stage of [6, 7, 8, 9, 10, 11]) {
      game.startStage(stage, [branch])
      game.flock = [{ kind: 'luna', beam: 'angled', x: game.x, y: SHIP_Y }]
      for (let t = 0; t < 300; t++) {
        game.update(t % 7 === 0 ? frame('a', 'b') : frame('b'))
        if (t % 60 === 0) game.render(fakeCtx())
      }
    }
  }
}

// --- pilot probe: runs still end, scores stay plausible, the attract demo scores 0 ----------------
{
  const meta = ARCADE_GAMES.find((g) => g.slug === 'lantern-swarm')!
  let evening = 0
  let friends = 0
  for (const seed of [1, 3, 4, 5]) {
    const game = play(seed)
    let t = 0
    for (; t < 300_000 && !game.over; t++) {
      game.update(game.demoInput())
      if (game.place.watch === 1) evening++
      friends = Math.max(friends, game.tally.friends)
    }
    assert.ok(game.over, `seed ${seed}: the run ends (${t} ticks)`)
    assert.ok(game.score > 0 && game.score < meta.maxPlausibleScore)
  }
  assert.ok(evening > 0, 'the pilot reaches the Evening')
  assert.ok(friends > 0, 'the pilot makes friends')
  // With spare lanterns the pilot calms both Evening Guardians.
  for (const branch of [0, 1]) {
    const strong = play(2)
    strong.startStage(11, [branch])
    strong.lives = 99
    for (let t = 0; t < 30_000 && !strong.results; t++)
      strong.update(strong.demoInput())
    assert.ok(
      strong.results,
      `the pilot calms ${strong.place.zone.name}'s Guardian`,
    )
  }
  const demo = play(21, true)
  demo.startStage(6, [1])
  for (let t = 0; t < 30_000 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo scores 0')
}

console.log('lantern swarm evening fork: ok')
