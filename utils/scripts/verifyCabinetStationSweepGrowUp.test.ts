// /utils/scripts/verifyCabinetStationSweepGrowUp.test.ts
//
// Station Sweep depth pass, slice 1 (conductor kr-arcade/t-141): critters that grow up, and tools to
// match. Growth timing for all five families through three stages, and the adults' behaviours
// (bouncing boulderbelly pairs that growl and charge, web weavers dropping babies, snappers that spit
// three ways and turn slowly, spore clouds, splitting gloops); the bigger critter art; each of the eight
// tools' answers; the bin, the critter count and credits at a lift; the Supply Locker; the music; a
// deterministic seeded deck; three seats; and pilot probes (the attract demo scores 0, runs still end).
//
//   npx tsx utils/scripts/verifyCabinetStationSweepGrowUp.test.ts

import assert from 'node:assert/strict'
import { levelCurve, mulberry32 } from '../arcade/curve'
import stationSweep, { SWEEP_CURVES } from '../arcade/games/stationSweep'
import { ARCADE_GAMES } from '../arcade/games'
import { CRITTER_SPRITES, TOOL_ICONS } from '../arcade/stationSweep/art'
import {
  BITER,
  CRAWLER,
  FAMILIES,
  FAMILY_NAMES,
  PUFFER,
  ROLLER,
  growTicks,
  pickFloorFamily,
  stageDef,
  type Family,
  type Stage,
} from '../arcade/stationSweep/critters'
import {
  LOCKER,
  LOCKER_ITEMS,
  binRoom,
  cannotBuy,
  emptyKit,
  priceOf,
  type Kit,
} from '../arcade/stationSweep/locker'
import {
  ALARM_MUSIC,
  LOCKER_MUSIC,
  STATION_MUSIC,
} from '../arcade/stationSweep/music'
import {
  PICKUP_TOOLS,
  TOOLS,
  pickTool,
  toolCharge,
  type PickupTool,
  type ToolId,
} from '../arcade/stationSweep/tools'
import { parseLoop } from '../arcade/sound'
import { LAUNDRY_MOON } from '../arcade/stationSweep/stations'
import {
  emptyInput,
  type ArcadeGameInstance,
  type InputFrame,
} from '../arcade/types'
import { measureText } from '../arcade/font'

const FLOOR = 206
const CEILING = 70
const W = 320

type Mop = {
  seat: number
  x: number
  y: number
  vy: number
  onGround: boolean
  crouch: boolean
  facing: 1 | -1
  health: number
  deck: number
  dead: number
  out: boolean
  tool: PickupTool | null
  toolCharge: number
  bin: number
  binCredits: number
  sticky: number
}
type Critter = {
  kind: Family
  stage: Stage
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  t: number
  onCeiling: boolean
  clinging: Mop | null
  canCling: boolean
  tell: number
  cool: number
  foam: number
  stun: number
  bubble: number
  face: 1 | -1
  turn: number
  pair: Critter | null
  flash: number
}
type Spit = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  lob: boolean
}
type Deck = {
  sacs: unknown[]
  critters: Critter[]
  kits: unknown[]
  drops: Array<{ x: number; tool: PickupTool; life: number }>
  shots: unknown[]
  spits: Spit[]
  bombs: unknown[]
  spores: Array<{ x: number; r: number; life: number }>
  clean: boolean
}
type Inner = {
  mops: Mop[]
  decks: Deck[]
  timer: number
  clear: number
  credits: number
  spares: number
  kit: Kit
  locker: { cursor: number; ticks: number; note: string } | null
  swept: Record<Family, number>
  startTool: PickupTool | null
  extraClock: number
}

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'measureText') return () => ({ width: 6 })
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
const g2d = stubContext()

const sounds: string[] = []
const sound = { play: (name: string) => void sounds.push(name) }

function frame(...buttons: Array<keyof InputFrame['held']>): InputFrame {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
function hold(...buttons: Array<keyof InputFrame['held']>): InputFrame {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}
const idle = () => emptyInput()

function make(seed: number, players = 1, demo = false) {
  const game = stationSweep.create({
    rng: mulberry32(seed),
    sound,
    demo,
    hiScore: 0,
    players,
  }) as ArcadeGameInstance
  return { game, inner: game as unknown as Inner }
}

/** A quiet deck: no sacs or critters anywhere, a long clock, Mop at x on deck 0. */
function quiet(seed = 5, x = 60) {
  const { game, inner } = make(seed)
  for (const d of inner.decks) {
    d.sacs = []
    d.critters = []
  }
  inner.timer = 60 * 600
  const me = inner.mops[0]!
  me.x = x
  me.facing = 1
  return { game, inner, me, deck: inner.decks[0]! }
}

function critter(kind: Family, stage: Stage, x: number, y = FLOOR): Critter {
  return {
    kind,
    stage,
    x,
    y,
    vx: 0,
    vy: 0,
    hp: stageDef(kind, stage).hp,
    t: 0,
    onCeiling: false,
    clinging: null,
    canCling: false,
    tell: 0,
    cool: 60,
    foam: 0,
    stun: 0,
    bubble: 0,
    face: 1,
    turn: 0,
    pair: null,
    flash: 0,
  }
}

function run(game: ArcadeGameInstance, ticks: number, input = idle) {
  for (let i = 0; i < ticks; i++) game.update(input())
}

// The families that grow (slice 2's mimic crate waits instead).
const GROWERS = FAMILY_NAMES.filter((f) => FAMILIES[f].grows !== false)

// --- the roster: five families, three stages each, drawn bigger ---------------------------------
{
  assert.deepEqual(GROWERS, ['roller', 'crawler', 'biter', 'puffer', 'gloop'])
  for (const f of GROWERS) {
    const stages = FAMILIES[f].stages
    assert.equal(stages.length, 3, `${f}: three stages`)
    for (let s = 1; s < 3; s++) {
      assert.ok(stages[s]!.hp >= stages[s - 1]!.hp, `${f}: tougher as it grows`)
      assert.ok(stages[s]!.points > stages[s - 1]!.points)
      assert.ok(stages[s]!.hitH > stages[s - 1]!.hitH, `${f}: taller`)
    }
    for (const at of [0, 1, 2] as const) {
      const set = CRITTER_SPRITES[f][at]
      for (const sprite of [...set.walk, set.tell]) {
        const size = Math.max(sprite.width, sprite.height)
        if (at < 2)
          assert.ok(
            size >= 14 && size <= 28,
            `${f} stage ${at}: young critters are 14-28 px (${size})`,
          )
        else assert.ok(size >= 32, `${f}: adults are 32 px or more (${size})`)
      }
    }
  }
  // Rollers (and nippers) stay under a standing beam: height still matters.
  const standingBeam = FLOOR - 15
  for (const [f, at] of [
    ['roller', 0],
    ['roller', 1],
    ['biter', 0],
    ['gloop', 0],
  ] as const)
    assert.ok(
      FLOOR - stageDef(f, at).hitH > standingBeam + 1,
      `${f} ${at} ducks a standing beam`,
    )
  // Every family hatches from a floor sac somewhere (crawlers drop from the ceiling).
  const seen = new Set<Family>()
  for (let station = 1; station <= 4; station++)
    for (let r = 0; r < 1; r += 0.01) seen.add(pickFloorFamily(station, r))
  assert.deepEqual([...seen].sort(), ['biter', 'gloop', 'puffer', 'roller'])
  assert.equal(
    [0, 0.2, 0.4, 0.6, 0.8, 0.99]
      .map((r) => pickFloorFamily(1, r))
      .includes('gloop'),
    false,
    'gloops wait for station 2',
  )
}

// --- growth timing: young -> middle -> adult, on the station's clock ------------------------------
{
  const after = levelCurve(1, SWEEP_CURVES.growAfter)
  assert.equal(after, 60 * 26)
  assert.equal(growTicks(0, after), Math.round(60 * 26 * 0.6))
  assert.equal(growTicks(1, after), 60 * 26)
  assert.equal(growTicks(2, after), Infinity)
  for (const f of GROWERS) {
    const { game, deck } = quiet(11)
    const c = critter(f, 0, 1300)
    deck.critters = [c]
    const pin = () => {
      c.x = 1300
      c.vx = 0
    }
    const first = growTicks(0, after)
    for (let i = 0; i < first - 1; i++) {
      game.update(idle())
      pin()
    }
    assert.equal(c.stage, 0, `${f}: still young a tick before`)
    game.update(idle())
    assert.equal(c.stage, 1, `${f}: grows on time`)
    assert.equal(c.t, 0)
    assert.equal(c.hp, stageDef(f, 1).hp)
    for (let i = 0; i < growTicks(1, after); i++) {
      game.update(idle())
      if (c.stage < 2) pin()
    }
    assert.equal(c.stage, 2, `${f}: an adult on time`)
    if (f === 'roller') {
      const partner = deck.critters.find((o) => o !== c)
      assert.ok(partner && partner.stage === 2, 'boulderbellies come in pairs')
      assert.equal(partner.pair, c)
      assert.equal(c.pair, partner)
    }
  }
  // Foam holds growth: a foamed critter doesn't age.
  {
    const { game, deck } = quiet(12)
    const c = critter('gloop', 0, 1300)
    c.foam = 200
    deck.critters = [c]
    run(game, 150)
    assert.equal(c.t, 0, 'foamed critters do not grow')
    assert.ok(c.foam > 0)
  }
  // A launch-era critter built by hand with `big` is read as the middle stage.
  {
    const { game, deck } = quiet(13)
    const old = critter('biter', 0, 1300) as Partial<Critter> & {
      big: boolean
    }
    delete old.stage
    old.big = true
    deck.critters = [old as Critter]
    game.update(idle())
    assert.equal(deck.critters[0]!.stage, 1)
  }
}

// --- the adults --------------------------------------------------------------------------------
{
  // A boulderbelly growls (stopped, shaking), then charges hard.
  const { game, deck } = quiet(21, 60)
  const b = critter('roller', 2, 600)
  b.cool = 1
  deck.critters = [b]
  game.update(idle())
  assert.equal(b.tell, ROLLER.growl, 'the growl is the tell')
  assert.equal(b.vx, 0)
  run(game, ROLLER.growl)
  assert.ok(b.vx < -2, 'then it charges at Mop')
  run(game, 20)
  assert.ok(
    deck.critters[0]!.y < FLOOR || b.vy !== 0 || b.y <= FLOOR,
    'and bounces',
  )
}
{
  // A web weaver climbs its thread and drops ceiling bubs.
  const { game, deck } = quiet(22, 60)
  const w = critter('crawler', 2, 900)
  w.cool = 2
  deck.critters = [w]
  run(game, 3)
  const baby = deck.critters.find((c) => c !== w)
  assert.ok(baby, 'a baby drops from the web')
  assert.equal(baby.stage, 0)
  assert.ok(baby.onCeiling && baby.canCling)
  run(game, 40)
  assert.equal(w.y, FLOOR - CRAWLER.hang, 'the weaver hangs on its thread')
}
{
  // A snapper spits three ways (level, high and a lob), only to its front, and turns slowly.
  const { game, deck, me } = quiet(23, 300)
  const s = critter('biter', 2, 420)
  s.face = -1
  s.cool = 1
  deck.critters = [s]
  game.update(idle())
  assert.equal(deck.spits.length, 3, 'three ways')
  assert.equal(deck.spits.filter((p) => p.lob).length, 1, 'one is lobbed')
  assert.ok(
    deck.spits.every((p) => p.vx < 0),
    'all to its front',
  )
  assert.ok(new Set(deck.spits.map((p) => p.y)).size === 3, 'at three heights')
  deck.spits = []
  me.x = 520
  s.cool = 1
  game.update(idle())
  assert.equal(deck.spits.length, 0, 'nothing spat behind it')
  run(game, BITER.turn - 3)
  assert.equal(s.face, -1, 'still turning')
  run(game, 4)
  assert.equal(s.face, 1, 'faced round at last')
}
{
  // A biter's cheeks puff before it spits; crouching ducks the spit.
  const { game, deck, me } = quiet(24, 300)
  const b = critter('biter', 1, 400)
  b.cool = 2
  deck.critters = [b]
  me.health = 100
  for (let i = 0; i < 80; i++) game.update(hold('down'))
  assert.equal(me.health, 100, 'crouched under the spit')
  b.cool = 2
  for (let i = 0; i < 80; i++) game.update(idle())
  assert.ok(me.health < 100, 'standing, it lands')
}
{
  // A puffer swells up close, then pops into sticky spores that slow Mop.
  const { game, deck, me } = quiet(25, 300)
  const p = critter('puffer', 0, 312)
  p.cool = 0
  deck.critters = [p]
  game.update(idle())
  assert.equal(p.tell, PUFFER.swell, 'the swell is the tell')
  run(game, PUFFER.swell)
  assert.equal(deck.critters.length, 0, 'popped')
  assert.equal(deck.spores.length, 1)
  assert.ok(me.health < 100, 'a sting')
  const x0 = me.x
  for (let i = 0; i < 10; i++) game.update(hold('right'))
  assert.ok(me.sticky > 0, 'spores stick')
  assert.ok(me.x - x0 < 1.4 * 10 * 0.6, 'and slow Mop')
}
{
  // A gloop wobbles, then lunges.
  const { game, deck } = quiet(26, 300)
  const gl = critter('gloop', 1, 330)
  gl.cool = 0
  deck.critters = [gl]
  game.update(idle())
  assert.ok(gl.tell > 0, 'the wobble is the tell')
  run(game, 32)
  assert.ok(gl.y < FLOOR, 'then it lunges')
}

// --- the tools ---------------------------------------------------------------------------------
function armed(tool: PickupTool | null, seed = 31, x = 300) {
  const q = quiet(seed, x)
  q.me.tool = tool
  q.me.toolCharge = tool ? toolCharge(tool, 0) : 0
  return q
}
{
  assert.equal(Object.keys(TOOLS).length, 8, 'eight tools')
  assert.equal(PICKUP_TOOLS.length, 7, 'seven to pick up beside the beam')
  for (const t of Object.keys(TOOLS) as ToolId[]) assert.ok(TOOL_ICONS[t])
  const seen = new Set<PickupTool>()
  for (let r = 0; r < 1; r += 0.01) seen.add(pickTool(3, r))
  assert.equal(seen.size, 7, 'every tool turns up in canisters')
  assert.equal(toolCharge('foam', 2), TOOLS.foam.charge * 2, 'Tool Tanks')
}
{
  // Sweeper Beam: a standing beam passes over a rollerbub; crouched it sweeps it.
  const { game, deck } = armed(null)
  const r = critter('roller', 0, 360)
  deck.critters = [r]
  for (let i = 0; i < 40; i++) {
    game.update(hold('a'))
    r.x = 360
  }
  assert.equal(deck.critters.length, 1, 'over its head')
  for (let i = 0; i < 20; i++) game.update(hold('a', 'down'))
  assert.equal(deck.critters.length, 0, 'swept low')
}
{
  // Wide Nozzle: three beams, so a standing Mop sweeps a rollerbub too.
  const { game, deck, me } = armed('wide')
  deck.critters = [critter('roller', 0, 360)]
  game.update(frame('b'))
  run(game, 15)
  assert.equal(deck.critters.length, 0)
  assert.equal(
    me.toolCharge,
    toolCharge('wide', 0) - 1,
    'one charge, three beams',
  )
  assert.equal(me.onGround, true, 'B uses the tool instead of jumping')
}
{
  // Foam Gun: it stops a roller dead.
  const { game, deck } = armed('foam')
  const r = critter('roller', 1, 380)
  r.vx = -1
  deck.critters = [r]
  for (let i = 0; i < 4; i++) game.update(frame('b', 'down'))
  run(game, 12)
  assert.ok(r.foam > 0, 'foamed')
  const x = r.x
  run(game, 30)
  assert.equal(r.x, x, 'glued to the floor')
}
{
  // Foam, then sweep: a gloop goes in the bin whole. Unfoamed, it splits in two.
  const { game, deck, me, inner } = armed('foam')
  const gl = critter('gloop', 1, 380)
  deck.critters = [gl]
  game.update(frame('b'))
  run(game, 20)
  assert.ok(gl.foam > 0)
  for (let i = 0; i < 40 && deck.critters.length; i++) game.update(hold('a'))
  assert.equal(deck.critters.length, 0, 'swept whole, no halves')
  assert.equal(inner.swept.gloop, 1)
  assert.equal(me.bin, stageDef('gloop', 1).bin)
  const q = armed(null, 32)
  q.deck.critters = [critter('gloop', 1, 380)]
  for (let i = 0; i < 40 && q.deck.critters.every((c) => c.stage === 1); i++)
    q.game.update(hold('a'))
  assert.equal(q.deck.critters.length, 2, 'split in two')
  assert.ok(q.deck.critters.every((c) => c.kind === 'gloop' && c.stage === 0))
  assert.equal(q.inner.swept.gloop, 0, 'not swept yet')
  assert.equal(q.me.bin, 0)
}
{
  // Vac Pack: pulls a gloop in whole, and pulls a ceiling bub down.
  const { game, deck, me, inner } = armed('vac')
  deck.critters = [critter('gloop', 1, 350)]
  for (let i = 0; i < 60 && deck.critters.length; i++) game.update(hold('b'))
  assert.equal(deck.critters.length, 0, 'swallowed')
  assert.equal(inner.swept.gloop, 1, 'whole: no split')
  assert.ok(me.toolCharge < toolCharge('vac', 0), 'a held tool burns charge')
  const bub = critter('crawler', 0, 330, CEILING + 8)
  bub.onCeiling = true
  bub.canCling = true
  deck.critters = [bub]
  game.update(hold('b'))
  assert.equal(bub.onCeiling, false, 'pulled down')
  assert.equal(bub.canCling, false)
}
{
  // Bubble Grenades: lobbed, they bubble a critter; a standing beam pops it, swept whole.
  const { game, deck, inner } = armed('bubble')
  const r = critter('roller', 1, 405)
  deck.critters = [r]
  game.update(frame('b'))
  for (let i = 0; i < 60 && r.bubble === 0; i++) {
    game.update(idle())
    r.x = 405
  }
  assert.ok(r.bubble > 0, 'trapped in a bubble')
  run(game, 40)
  assert.ok(r.y < FLOOR - 5, 'floating')
  for (let i = 0; i < 40 && deck.critters.length; i++) game.update(hold('a'))
  assert.equal(deck.critters.length, 0, 'popped and swept')
  assert.equal(inner.swept.roller, 1)
}
{
  // Zap Broom: one bolt sweeps right through a row of nippers.
  const { game, deck, me } = armed('zap')
  deck.critters = [critter('biter', 0, 350), critter('biter', 0, 380)]
  game.update(frame('b', 'down'))
  for (let i = 0; i < 12; i++) game.update(hold('down'))
  assert.equal(deck.critters.length, 0, 'both swept')
  assert.equal(me.toolCharge, toolCharge('zap', 0) - 1, 'by one bolt')
}
{
  // Steam Wand: stuns a biter (no spit while stunned), fizzles a swell, washes spores away.
  const { game, deck } = armed('steam')
  const b = critter('biter', 1, 330)
  b.cool = 5
  deck.critters = [b]
  for (let i = 0; i < 4; i++) game.update(hold('b'))
  assert.ok(b.stun > 0, 'stunned')
  deck.spits = []
  run(game, 100)
  assert.equal(deck.spits.length, 0, 'no spit while stunned')
  const p = critter('puffer', 1, 330)
  p.tell = 20
  deck.critters = [p]
  deck.spores = [{ x: 320, r: 18, life: 300 }]
  for (let i = 0; i < 30; i++) game.update(hold('b'))
  assert.equal(p.tell, 0, 'the swell fizzles')
  assert.equal(deck.spores.length, 0, 'spores washed away')
}
{
  // Squeegee Shield: B held blocks spit from the front.
  const { game, deck, me } = armed('shield')
  deck.spits = [
    { x: 340, y: FLOOR - 14, vx: -2.2, vy: 0, life: 90, lob: false },
  ]
  for (let i = 0; i < 30; i++) game.update(hold('b'))
  assert.equal(me.health, 100, 'blocked')
  assert.equal(me.toolCharge, toolCharge('shield', 0) - 1)
  const q = armed(null, 33)
  q.deck.spits = [
    { x: 340, y: FLOOR - 14, vx: -2.2, vy: 0, life: 90, lob: false },
  ]
  run(q.game, 30)
  assert.equal(q.me.health, 94, 'unshielded, it stings')
}
{
  // Tools come from popped sacs: walk over a canister to carry it.
  const { game, deck, me } = armed(null)
  deck.drops = [{ x: 305, tool: 'steam', life: 600 }]
  run(game, 2)
  assert.equal(me.tool, 'steam')
  assert.equal(me.toolCharge, toolCharge('steam', 0))
  me.toolCharge = 1
  game.update(hold('b'))
  assert.equal(me.tool, null, 'run dry, back to the beam')
}

// --- the bin, the critter count and credits ------------------------------------------------------
{
  const { game, deck, me, inner } = quiet(41, 300)
  deck.critters = [
    critter('roller', 0, 330),
    critter('roller', 0, 350),
    critter('roller', 1, 370),
  ]
  for (const c of deck.critters) c.vx = 0
  for (let i = 0; i < 80 && deck.critters.length; i++)
    game.update(hold('a', 'down'))
  assert.equal(deck.critters.length, 0)
  assert.equal(inner.swept.roller, 3, 'the critter count')
  assert.equal(me.bin, 3)
  assert.equal(me.binCredits, 1 + 1 + 2)
  const before = inner.credits
  me.x = 180
  game.update(idle())
  assert.equal(me.bin, 0, 'emptied at the lift')
  assert.equal(inner.credits, before + 4)
  // A full bin slows Mop, and turns away more.
  me.x = 600
  me.bin = binRoom(0)
  const x0 = me.x
  run(game, 10, () => hold('right'))
  assert.ok(Math.abs(me.x - x0 - 1.4 * 0.8 * 10) < 0.01, 'a full bin slows Mop')
  deck.critters = [critter('roller', 0, 640)]
  deck.critters[0]!.vx = 0
  for (let i = 0; i < 30 && deck.critters.length; i++)
    game.update(hold('a', 'down'))
  assert.equal(me.bin, binRoom(0), 'no room')
  assert.equal(inner.swept.roller, 4, 'swept all the same')
}

// --- the Supply Locker -----------------------------------------------------------------------------
{
  // Pure pricing.
  const kit = emptyKit()
  const bin = LOCKER_ITEMS.find((i) => i.id === 'bin')!
  const visit = { tool: 'foam' as const, bought: {} }
  assert.equal(priceOf(bin, kit), 8)
  assert.equal(priceOf(bin, { ...kit, bin: 1 }), 14)
  assert.equal(cannotBuy(bin, { ...kit, bin: 2 }, visit, 99), 'SOLD OUT')
  assert.equal(cannotBuy(bin, kit, visit, 7), 'NEED CREDITS')
  assert.equal(cannotBuy(bin, kit, visit, 8), null)
  assert.equal(binRoom(2), 20)
  assert.ok(LOCKER_ITEMS.some((i) => i.id === 'launch'))
}
function toLocker(seed: number) {
  const q = quiet(seed, 300)
  for (const d of q.inner.decks) d.clean = true
  q.inner.decks[0]!.clean = false
  for (let i = 0; i < 400 && !q.inner.locker; i++) q.game.update(idle())
  assert.ok(q.inner.locker, 'a clean station docks at the locker')
  run(q.game, LOCKER.doors)
  return q
}
{
  const { game, inner } = toLocker(51)
  assert.equal(game.music, LOCKER_MUSIC)
  game.render(g2d)
  assert.ok(inner.credits >= 5, 'a clean station pays credits')
  inner.credits = 60
  const spares = inner.spares
  game.update(frame('a'))
  assert.equal(inner.spares, spares + 1, 'bought a spare Mop')
  assert.equal(inner.credits, 46)
  game.update(frame('down'))
  game.update(frame('down'))
  game.update(frame('a'))
  assert.equal(inner.kit.bin, 1, 'a bigger bin')
  game.update(frame('down'))
  game.update(frame('down'))
  game.update(frame('down'))
  game.update(frame('a'))
  assert.equal(inner.kit.radar, 1, 'the sac radar')
  game.update(frame('a'))
  assert.equal(inner.locker!.note, 'SOLD OUT')
  game.update(frame('down'))
  game.update(frame('a'))
  const tool = inner.startTool
  assert.ok(tool, 'the tool of the day is packed')
  inner.credits = 0
  game.update(frame('up'))
  game.update(frame('up'))
  game.update(frame('up'))
  game.update(frame('up'))
  game.update(frame('up'))
  game.update(frame('a'))
  assert.equal(inner.locker!.note, 'NEED CREDITS')
  game.update(frame('b'))
  assert.equal(inner.locker, null, 'B launches')
  assert.equal(game.level, 2)
  assert.equal(inner.mops[0]!.tool, tool, 'every Mop starts with it')
  assert.equal(binRoom(inner.kit.bin), 15)
}
{
  // The shuttle leaves on its own.
  const { game, inner } = toLocker(52)
  run(game, LOCKER.wait)
  assert.equal(inner.locker, null)
  assert.equal(game.level, 2)
}
{
  // More clock carries onto the next station's clock.
  const { game, inner } = toLocker(53)
  inner.credits = 20
  game.update(frame('down'))
  game.update(frame('a'))
  game.update(frame('a'))
  assert.equal(inner.extraClock, 30)
  game.update(frame('b'))
  const decks = inner.decks.length
  assert.equal(decks, LAUNDRY_MOON.decks.length + 11)
  assert.equal(inner.timer, 60 * (LAUNDRY_MOON.clockSecs + 30))
}
{
  // The attract demo never docks: it flies straight on.
  const { game, inner } = make(54, 1, true)
  for (const d of inner.decks) {
    d.sacs = []
    d.critters = []
    d.clean = true
  }
  inner.decks[0]!.clean = false
  for (let i = 0; i < 400 && game.level === 1; i++) game.update(idle())
  assert.equal(game.level, 2)
  assert.equal(inner.locker, null)
}

// --- music ------------------------------------------------------------------------------------------
{
  const { game, inner } = quiet(61)
  assert.equal(game.music, STATION_MUSIC)
  inner.timer = 60 * 20
  game.update(idle())
  assert.equal(game.music, ALARM_MUSIC, 'the alarm layer, low on clock')
  for (const loop of [STATION_MUSIC, ALARM_MUSIC, LOCKER_MUSIC]) {
    const parsed = parseLoop(loop)
    assert.equal(parsed.length, 64, 'eight bars of eight')
    assert.ok(parsed.notes.length > 20)
  }
  assert.ok(ALARM_MUSIC.tracks.length > STATION_MUSIC.tracks.length)
  assert.equal(make(62, 1, true).game.music, null, 'the attract demo is quiet')
}

// --- a deterministic seeded deck -----------------------------------------------------------------
{
  const script = (t: number): InputFrame => {
    const f = emptyInput()
    f.held.right = t % 240 < 70
    f.held.left = t % 240 > 200
    f.held.down = t % 90 < 30
    f.held.a = true
    f.pressed.a = t % 9 === 0
    f.held.b = t % 200 < 40
    f.pressed.b = t % 200 === 0
    return f
  }
  const snapshot = (seed: number) => {
    const { game, inner } = make(seed)
    for (let t = 0; t < 60 * 90 && !game.over; t++) game.update(script(t))
    return JSON.stringify({
      score: game.score,
      level: game.level,
      lives: game.lives,
      credits: inner.credits,
      swept: inner.swept,
      critters: inner.decks.map((d) =>
        d.critters.map((c) => [c.kind, c.stage, Math.round(c.x)]),
      ),
    })
  }
  const a = snapshot(77)
  assert.equal(a, snapshot(77), 'the same seed plays the same deck')
  assert.notEqual(a, snapshot(78), 'another seed plays another')
  const swept = JSON.parse(a).swept as Record<Family, number>
  assert.ok(
    Object.values(swept).reduce((x, y) => x + y, 0) >= 4,
    'a busy deck gets swept',
  )
}

// --- three seats, split screen ---------------------------------------------------------------------
{
  const { game, inner } = make(71, 3)
  assert.equal(game.lives, 5, 'three Mops and two spares')
  for (let t = 0; t < 60 * 60; t++) {
    const all = [0, 1, 2].map((s) => {
      const f = emptyInput()
      f.held.a = true
      f.pressed.a = (t + s) % 9 === 0
      f.held.right = (t + s * 80) % 240 < 60
      f.held.b = (t + s * 50) % 300 < 30
      return f
    })
    game.update(all[0]!, all)
    if (t % 120 === 0) game.render(g2d)
  }
  inner.mops[1]!.tool = 'vac'
  inner.mops[1]!.toolCharge = 10
  game.render(g2d)
  assert.ok(
    game.score <=
      ARCADE_GAMES.find((m) => m.slug === 'station-sweep')!.maxPlausibleScore,
  )
}

// --- the table guide -----------------------------------------------------------------------------
{
  const pages = stationSweep.guide!(new Set())
  assert.equal(pages.length, 5)
  for (const page of pages)
    for (const line of page.lines)
      assert.ok(measureText(line) <= W - 8, `guide line fits: ${line}`)
}

// --- pilot probes: the attract demo scores 0, and runs still end ------------------------------------
{
  const { game } = make(7, 1, true)
  let level = 1
  for (let t = 0; t < 60 * 60 * 15 && !game.over; t++) {
    game.update(emptyInput())
    level = Math.max(level, game.level)
    if (t % 300 === 0) game.render(g2d)
  }
  assert.equal(game.score, 0, 'the attract demo never scores')
  console.log(
    `  attract pilot: station ${level} after ${game.over ? 'game over' : '15 minutes'}`,
  )
}
{
  // An idle crew loses station after station to the clock, docking at the locker between.
  const { game } = make(8)
  let t = 0
  for (; t < 60 * 60 * 40 && !game.over; t++) game.update(emptyInput())
  assert.ok(game.over, 'an idle run ends')
  console.log(
    `  idle run: over at station ${game.level} after ${Math.round(t / 60)}s`,
  )
}
{
  // A busy, button-mashing player still reaches the end of a run, and scores plausibly.
  const { game } = make(9)
  let t = 0
  for (; t < 60 * 60 * 90 && !game.over; t++) {
    const f = emptyInput()
    f.held.right = t % 240 < 60
    f.held.a = true
    f.pressed.a = t % 9 === 0
    f.held.b = t % 400 < 60
    game.update(f)
    if (t % 600 === 0) game.render(g2d)
  }
  assert.ok(game.over, 'a busy run ends too')
  assert.ok(game.score > 0)
  assert.ok(
    game.score <=
      ARCADE_GAMES.find((m) => m.slug === 'station-sweep')!.maxPlausibleScore,
  )
  console.log(
    `  busy run: over at station ${game.level}, ${game.score} points, after ${Math.round(t / 60)}s`,
  )
}

console.log('verifyCabinetStationSweepGrowUp: ok')
