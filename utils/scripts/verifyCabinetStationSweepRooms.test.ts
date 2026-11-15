// /utils/scripts/verifyCabinetStationSweepRooms.test.ts
//
// Station Sweep depth pass, slice 2 (conductor kr-arcade/t-142): rooms and the first two stations.
// The authored station format and its checks; the Greenhouse Ring and the Laundry Moon as built;
// doorways, rooms and vents; every room's contents; crew rescues adding clock; sprinklers and slick
// floors, vine curtains, conveyors, steam vents and washing machines, and the control rooms that
// switch them off; the mimic crate; the Nest Mother; Mother Gloop's three phases and the Laundry
// Kraken's; the Seed Vault and Spin Cycle jobs; save and resume per station; a scripted clear of the
// Greenhouse Ring (and the Laundry Moon); and the attract pilot through the new stations.
//
//   npx tsx utils/scripts/verifyCabinetStationSweepRooms.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import stationSweep from '../arcade/games/stationSweep'
import { sanitizeSaves, withSave } from '../arcade/saves'
import {
  KRAKEN,
  MOTHER_GLOOP,
  NEST_MOTHER,
} from '../arcade/stationSweep/bosses'
import { MIMIC, type Family } from '../arcade/stationSweep/critters'
import { emptyKit } from '../arcade/stationSweep/locker'
import { readStationSave, type StationSave } from '../arcade/stationSweep/save'
import {
  CREW_RESCUE,
  GREENHOUSE_RING,
  HAZARDS,
  LAUNDRY_MOON,
  ORBIT_LINE,
  ROOMS,
  ROOM_EXIT_X,
  doorsOn,
  endlessStation,
  hazardPhase,
  stationProblems,
  type RoomKind,
} from '../arcade/stationSweep/stations'
import {
  emptyInput,
  type ArcadeGameInstance,
  type InputFrame,
} from '../arcade/types'

const FLOOR = 206

type Mop = {
  x: number
  y: number
  deck: number
  health: number
  facing: 1 | -1
  tool: string | null
  toolCharge: number
  ride: unknown
  out: boolean
  onGround: boolean
}
type Critter = {
  kind: Family
  stage: number
  x: number
  y: number
  vy: number
  hp: number
  tag: boolean
  awake: boolean
}
type Boss = {
  kind: string
  x: number
  hp: number
  maxHp: number
  phase: number
  cool: number
  tell: number
  reform: number
  slam: { x: number; t: number } | null
  head: number
  stun: number
  aid: number
}
type Deck = {
  width: number
  sacs: Array<{ x: number; hp: number; hatches: number; machine?: boolean }>
  critters: Critter[]
  kits: Array<{ x: number; snack?: boolean }>
  drops: Array<{ x: number; tool: string }>
  spits: Array<{ sock?: boolean }>
  lifts: Array<{ x: number; up: boolean; down: boolean }>
  doors: Array<{ x: number; kind: string; room: number; to: number }>
  room: { kind: RoomKind; parent: number; doorX: number } | null
  wet: Array<{ x: number; life: number }>
  jars: Array<{ x: number; taken: boolean }>
  console: { x: number; switches: string; used: boolean } | null
  bosses: Boss[]
  clean: boolean
}
type Inner = {
  mops: Mop[]
  decks: Deck[]
  corridors: number
  crew: Array<{ name: string; deck: number; x: number; state: string }>
  job: { id: string; state: string; ticks: number } | null
  timer: number
  tick: number
  locker: unknown
  offer: unknown
  off: Set<string>
  swept: Record<Family, number>
  credits: number
  spares: number
  banner: { text: string } | null
  startStation(n: number): void
  demoInput(): InputFrame
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
const quiet = { play: () => {} }

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
function run(game: ArcadeGameInstance, ticks: number, input = idle) {
  for (let i = 0; i < ticks; i++) game.update(input())
}

function make(seed: number, station = 1, resume?: unknown) {
  const game = stationSweep.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as ArcadeGameInstance
  const inner = game as unknown as Inner
  if (station > 1) inner.startStation(station)
  inner.timer = 60 * 900
  return { game, inner, me: inner.mops[0]! }
}

/** The deck index of the first room of `kind`. */
function roomOf(inner: Inner, kind: RoomKind): number {
  const i = inner.decks.findIndex((d) => d.room?.kind === kind)
  assert.ok(i >= 0, `there is a ${kind}`)
  return i
}

/** Put Mop straight into a deck at x, everything else there cleared away. */
function place(inner: Inner, deck: number, x: number, clear = true) {
  const me = inner.mops[0]!
  me.deck = deck
  me.x = x
  me.y = FLOOR
  me.facing = 1
  if (clear) {
    inner.decks[deck]!.critters = []
    inner.decks[deck]!.sacs = []
  }
}

// --- the format and the authored stations ----------------------------------------------------------
{
  assert.equal(ORBIT_LINE[0], GREENHOUSE_RING)
  assert.equal(ORBIT_LINE[1], LAUNDRY_MOON)
  for (const plan of ORBIT_LINE)
    assert.deepEqual(stationProblems(plan), [], `${plan.name} is sound`)
  for (let station = 3; station <= 14; station++)
    assert.deepEqual(
      stationProblems(endlessStation(station, mulberry32(station))),
      [],
      `endless station ${station} is sound`,
    )
  assert.equal(GREENHOUSE_RING.decks.length, 3)
  assert.equal(LAUNDRY_MOON.decks.length, 4)
  const kinds = new Set(
    ORBIT_LINE.flatMap((p) =>
      p.decks.flatMap((d) => d.doors.map((x) => x.kind)),
    ),
  )
  for (const k of [...(Object.keys(ROOMS) as RoomKind[]), 'vent'])
    assert.ok(kinds.has(k as RoomKind), `the first two stations have a ${k}`)
  assert.ok(GREENHOUSE_RING.decks.some((d) => d.sprinklers?.length))
  assert.ok(GREENHOUSE_RING.decks.some((d) => d.vines?.length))
  assert.ok(LAUNDRY_MOON.decks.some((d) => d.conveyors?.length))
  assert.ok(LAUNDRY_MOON.decks.some((d) => d.steamVents?.length))
  assert.ok(LAUNDRY_MOON.decks.some((d) => d.mimics?.length))
  assert.equal(GREENHOUSE_RING.job, 'seedVault')
  assert.equal(LAUNDRY_MOON.job, 'spinCycle')
  assert.equal(GREENHOUSE_RING.boss, 'motherGloop')
  assert.equal(LAUNDRY_MOON.boss, 'kraken')
  // A vent's partner grate appears on the deck it leads to.
  assert.ok(
    doorsOn(GREENHOUSE_RING, 1).some((d) => d.kind === 'vent' && d.to === 'up'),
  )
  // A plan with a problem is caught.
  const broken = {
    ...GREENHOUSE_RING,
    decks: GREENHOUSE_RING.decks.map((d, i) =>
      i === 1 ? { ...d, doors: d.doors.filter((x) => x.kind !== 'nest') } : d,
    ),
  }
  assert.ok(stationProblems(broken).some((p) => p.includes('Nest Mother')))
}

// --- the stations as built --------------------------------------------------------------------------
{
  const { inner } = make(1)
  assert.equal(inner.corridors, 3)
  const rooms = inner.decks.filter((d) => d.room)
  assert.equal(
    rooms.length,
    GREENHOUSE_RING.decks
      .flatMap((d) => d.doors)
      .filter((d) => d.kind !== 'vent').length,
  )
  for (let i = 0; i < inner.corridors; i++) {
    const deck = inner.decks[i]!
    assert.equal(deck.width, GREENHOUSE_RING.decks[i]!.width)
    for (const door of deck.doors)
      if (door.kind === 'vent') assert.equal(Math.abs(door.to - i), 1)
      else {
        const room = inner.decks[door.room]!
        assert.equal(room.room!.parent, i)
        assert.equal(room.room!.doorX, door.x)
        assert.equal(room.width, ROOMS[door.kind as RoomKind].width)
      }
  }
  assert.ok(inner.decks[0]!.lifts.some((l) => l.x === 1100 && l.down && !l.up))
  assert.ok(inner.decks[2]!.lifts.every((l) => l.x === 180 && l.up && !l.down))
  // Rooms with nothing to sweep start clean; nests and Queens' rooms don't.
  assert.ok(inner.decks[roomOf(inner, 'closet')]!.clean)
  assert.equal(inner.decks[roomOf(inner, 'nest')]!.clean, false)
  assert.equal(inner.decks[roomOf(inner, 'boss')]!.clean, false)
  assert.equal(
    inner.decks[roomOf(inner, 'nest')]!.bosses[0]!.kind,
    'nestMother',
  )
  assert.equal(
    inner.decks[roomOf(inner, 'boss')]!.bosses[0]!.kind,
    'motherGloop',
  )
  assert.deepEqual(
    inner.crew.map((c) => c.name),
    ['SQUEEGEE', 'DUSTY'],
  )
  const l = make(1, 2).inner
  assert.equal(l.corridors, 4)
  assert.equal(l.decks[roomOf(l, 'boss')]!.bosses[0]!.kind, 'kraken')
  assert.ok(l.decks[roomOf(l, 'washer')]!.sacs.every((s) => s.machine))
  assert.ok(l.decks[0]!.critters.some((c) => c.kind === 'mimic'))
  const third = make(1, 3).inner
  assert.ok(third.corridors >= 3, 'stations past the authored ones still build')
  assert.ok(third.decks.some((d) => d.room?.kind === 'nest'))
}

// --- doorways, rooms and vents ------------------------------------------------------------------------
{
  const { game, inner, me } = make(2)
  const closet = inner.decks[0]!.doors.find((d) => d.kind === 'closet')!
  place(inner, 0, closet.x, false)
  game.update(frame('up'))
  assert.ok(me.ride, 'Up at a doorway steps through')
  run(game, 30)
  assert.equal(me.deck, closet.room, 'into the room')
  assert.equal(me.x, ROOM_EXIT_X)
  assert.ok(
    inner.decks[closet.room]!.drops.length,
    'a supply closet holds a tool',
  )
  me.x = inner.decks[closet.room]!.drops[0]!.x
  game.update(idle())
  assert.ok(me.tool, 'taken off the shelf')
  me.x = ROOM_EXIT_X
  game.update(frame('up'))
  run(game, 30)
  assert.equal(me.deck, 0, 'back out')
  assert.equal(me.x, closet.x, 'at the doorway')
  // A vent: a crawl to the deck below, at the same spot.
  const vent = inner.decks[0]!.doors.find((d) => d.kind === 'vent')!
  me.x = vent.x
  game.update(frame('up'))
  run(game, 40)
  assert.equal(me.deck, 1)
  assert.equal(me.x, vent.x)
  // Up away from any doorway is still a jump.
  me.x = 700 + 120
  game.update(frame('up'))
  assert.equal(me.onGround, false)
}
{
  // The galley's snacks, the lab's jars.
  const { game, inner, me } = make(3)
  const galley = roomOf(inner, 'galley')
  place(inner, galley, 60, false)
  me.health = 50
  me.x = inner.decks[galley]!.kits[0]!.x
  game.update(idle())
  assert.equal(me.health, 70, 'a snack tops up 20')
  const lab = roomOf(inner, 'lab')
  place(inner, lab, 60, false)
  const score = game.score
  me.x = inner.decks[lab]!.jars[0]!.x
  game.update(idle())
  assert.ok(inner.decks[lab]!.jars[0]!.taken)
  assert.ok(game.score > score, 'specimen jars are worth points')
}
{
  // A control room switches the sprinklers off: no more slick floors.
  const { game, inner, me } = make(4)
  place(inner, 0, 400, false)
  inner.decks[0]!.critters = []
  inner.decks[0]!.sacs = []
  let wet = false
  for (let i = 0; i < 620 && !wet; i++) {
    me.x = 300
    me.health = 100
    game.update(idle())
    wet = inner.decks[0]!.wet.some((w) => w.x === 400)
  }
  assert.ok(wet, 'a sprinkler mists the floor')
  assert.ok(
    hazardPhase(inner.tick, 400, HAZARDS.sprinkler.period) >=
      HAZARDS.sprinkler.mist,
  )
  // On the slick, Mop slides: slow to get going, slow to stop.
  inner.decks[0]!.wet = [{ x: 400, life: 999 }]
  me.x = 380
  const x0 = me.x
  run(game, 20, () => hold('right'))
  assert.ok(me.x - x0 < 1.4 * 20 * 0.7, 'slow to get going')
  const x1 = me.x
  run(game, 10)
  assert.ok(me.x > x1 + 2, 'and it slides on after letting go')
  const control = roomOf(inner, 'control')
  place(inner, control, 60, false)
  me.x = inner.decks[control]!.console!.x
  game.update(frame('up'))
  assert.ok(inner.decks[control]!.console!.used)
  assert.ok(inner.off.has('sprinklers'))
  assert.ok(
    inner.decks.every((d) => !d.wet.length),
    'the floors dry',
  )
  place(inner, 0, 300, false)
  for (let i = 0; i < 620; i++) {
    me.health = 100
    game.update(idle())
  }
  assert.equal(inner.decks[0]!.wet.length, 0, 'and stay dry')
}
{
  // A crewmate found in a cabin follows Mop to a lift: +10 seconds.
  const { game, inner, me } = make(5)
  const cabin = inner.decks[0]!.doors.find((d) => d.kind === 'cabin')!
  const crew = inner.crew.find((c) => c.deck === cabin.room)!
  place(inner, cabin.room, crew.x - 10, false)
  game.update(idle())
  assert.equal(crew.state, 'following')
  me.x = ROOM_EXIT_X
  game.update(frame('up'))
  run(game, 30)
  assert.equal(crew.deck, 0, 'out of the cabin with Mop')
  inner.decks[0]!.critters = []
  inner.decks[0]!.sacs = []
  me.x = 1095
  const before = inner.timer
  game.update(idle())
  game.update(idle())
  assert.equal(crew.state, 'saved')
  assert.equal(inner.timer, before - 2 + 60 * CREW_RESCUE.secs)
}

// --- the Laundry Moon's machinery -----------------------------------------------------------------------
{
  const { game, inner, me } = make(6, 2)
  place(inner, 0, 400, false)
  inner.decks[0]!.sacs = []
  inner.decks[0]!.critters = inner.decks[0]!.critters.filter(
    (c) => c.kind === 'mimic',
  )
  // A conveyor carries Mop.
  run(game, 10)
  assert.ok(Math.abs(me.x - 406) < 0.01, 'the belt carries Mop along')
  // A steam vent hisses (its tell) and then blows.
  const V = HAZARDS.steam
  while (hazardPhase(inner.tick + 1, 860, V.period) !== V.tell)
    game.update(idle())
  me.x = 860
  me.health = 100
  run(game, V.blow - V.tell)
  assert.equal(me.health, 100, 'the hiss does no harm')
  for (let i = 0; i < 30; i++) {
    me.x = 860
    game.update(idle())
  }
  assert.ok(me.health < 100, 'the blow does')
  // A mimic crate waits, then snaps.
  const mimic = critterAt(inner.decks[0]!, 'mimic')
  const mx = mimic.x
  me.x = mx - 80
  me.health = 100
  run(game, 60)
  assert.equal(mimic.x, mx, 'it sits still')
  assert.equal(mimic.awake, false)
  me.x = mx - MIMIC.snapAt + 4
  game.update(idle())
  assert.ok(mimic.awake, 'it snaps')
  assert.ok(me.health < 100)
  let hopped = false
  for (let i = 0; i < 90; i++) {
    game.update(idle())
    hopped ||= mimic.vy < 0
  }
  assert.ok(hopped, 'and hops after Mop')
  // A washing machine tumbles critters out, and the beam can switch it off.
  const washer = roomOf(inner, 'washer')
  place(inner, washer, 60, false)
  inner.decks[washer]!.critters = []
  run(game, 600, () => {
    me.health = 100
    return idle()
  })
  assert.ok(inner.decks[washer]!.critters.length, 'it tumbles critters out')
  // Switching the conveyors off stops the Spin Cycle job.
  const control = inner.decks.findIndex(
    (d) => d.console?.switches === 'conveyors',
  )
  place(inner, control, 60)
  me.x = inner.decks[control]!.console!.x
  assert.equal(inner.job!.state, 'on')
  game.update(frame('up'))
  assert.equal(inner.job!.state, 'failed', 'the spin cycle stops')
  place(inner, 0, 400)
  run(game, 10)
  assert.equal(Math.round(me.x), 400, 'the belts stand still')
}
function critterAt(deck: Deck, kind: Family): Critter {
  const c = deck.critters.find((o) => o.kind === kind)
  assert.ok(c, `a ${kind}`)
  return c
}

// --- the Nest Mother --------------------------------------------------------------------------------
{
  const { game, inner, me } = make(7)
  const nest = roomOf(inner, 'nest')
  place(inner, nest, 60)
  const mother = inner.decks[nest]!.bosses[0]!
  mother.cool = NEST_MOTHER.layEvery - 1
  game.update(idle())
  assert.equal(mother.tell, NEST_MOTHER.layTell, 'she swells first')
  run(game, NEST_MOTHER.layTell)
  assert.equal(inner.decks[nest]!.sacs.length, 1, 'then lays a sac')
  inner.decks[nest]!.sacs = []
  mother.hp = 1
  me.x = mother.x - 60
  for (let i = 0; i < 40 && inner.decks[nest]!.bosses.length; i++)
    game.update(hold('a'))
  assert.equal(inner.decks[nest]!.bosses.length, 0, 'swept')
  assert.ok(inner.decks[nest]!.drops.length, 'she leaves a tool behind')
}

// --- Mother Gloop -----------------------------------------------------------------------------------
{
  const { game, inner, me } = make(8)
  const lair = roomOf(inner, 'boss')
  place(inner, lair, 160)
  const boss = inner.decks[lair]!.bosses[0]!
  // Phase 1: blobs slop off her after a bulge.
  boss.cool = MOTHER_GLOOP.slopEvery[1] - 1
  game.update(idle())
  assert.equal(boss.tell, MOTHER_GLOOP.slopTell, 'her surface bulges')
  run(game, MOTHER_GLOOP.slopTell)
  assert.ok(critterAt(inner.decks[lair]!, 'gloop'), 'a blob slops off')
  inner.decks[lair]!.critters = []
  // Swept down to the split: four gloops.
  boss.hp = MOTHER_GLOOP.splitAt + 1
  me.x = boss.x - 90
  for (let i = 0; i < 30 && boss.phase === 1; i++) game.update(hold('a'))
  assert.equal(boss.phase, 2, 'she splits')
  const parts = inner.decks[lair]!.critters.filter((c) => c.tag)
  assert.equal(parts.length, MOTHER_GLOOP.parts)
  // Left alone, they re-form.
  boss.reform = 1
  game.update(idle())
  assert.equal(boss.phase, 1, 'she re-forms')
  assert.equal(
    boss.hp,
    Math.min(boss.maxHp, MOTHER_GLOOP.splitAt + 2 * parts.length),
  )
  assert.equal(inner.decks[lair]!.critters.filter((c) => c.tag).length, 0)
  // Split again, and every piece swept: she pours into the vents, up to the nest above.
  boss.hp = MOTHER_GLOOP.splitAt + 1
  for (let i = 0; i < 30 && boss.phase === 1; i++) game.update(hold('a'))
  assert.equal(boss.phase, 2)
  // Foam a piece and sweep it: no halves.
  me.tool = 'foam'
  me.toolCharge = 9
  const piece = inner.decks[lair]!.critters.find((c) => c.tag)!
  inner.decks[lair]!.critters = [piece]
  piece.x = me.x + 50
  piece.y = FLOOR
  piece.vy = 0
  game.update(frame('b'))
  run(game, 14)
  for (let i = 0; i < 40 && inner.decks[lair]!.critters.length; i++) {
    piece.x = me.x + 50
    game.update(hold('a'))
  }
  assert.equal(
    inner.decks[lair]!.critters.length,
    0,
    'a foamed piece goes in whole',
  )
  game.update(idle())
  assert.equal(inner.decks[lair]!.bosses.length, 0, 'gone from her room')
  const nest = inner.decks.findIndex(
    (d) => d.room?.kind === 'nest' && d.room.parent === inner.corridors - 2,
  )
  const pool = inner.decks[nest]!.bosses.find((b) => b.kind === 'motherGloop')
  assert.ok(pool, 'she pours into the nest room on the deck above')
  assert.equal(pool.phase, 3)
  assert.equal(pool.hp, MOTHER_GLOOP.poolHp)
  assert.equal(inner.decks[nest]!.clean, false)
  // Finish her there.
  place(inner, nest, 60)
  inner.decks[nest]!.bosses = [pool]
  pool.hp = 1
  me.x = pool.x - 70
  for (let i = 0; i < 40 && inner.decks[nest]!.bosses.length; i++)
    game.update(hold('a'))
  assert.equal(inner.decks[nest]!.bosses.length, 0, 'Mother Gloop is swept up')
}

// --- the Laundry Kraken -------------------------------------------------------------------------------
{
  const { game, inner, me } = make(9, 2)
  const lair = roomOf(inner, 'boss')
  place(inner, lair, 200)
  const k = inner.decks[lair]!.bosses[0]!
  // A slam: its shadow first (no harm), then the tentacle comes down.
  k.cool = KRAKEN.slamEvery[1] - 1
  game.update(idle())
  assert.ok(k.slam, 'a tentacle is coming')
  const at = k.slam.x
  me.health = 100
  for (let i = 0; i < KRAKEN.slamTell - 2; i++) {
    me.x = at
    game.update(idle())
  }
  assert.equal(me.health, 100, 'the shadow is a warning')
  run(game, 3, () => {
    me.x = at
    return idle()
  })
  assert.ok(me.health < 100, 'the slam lands')
  // A tentacle on the floor can be swept (crouch).
  const hp = k.hp
  for (let i = 0; i < 20; i++) {
    me.x = at - 40
    me.health = 100
    game.update(hold('a', 'down'))
  }
  assert.ok(k.hp < hp, 'sweeping the tentacle hurts... well, tidies it')
  // Phase 2: socks fly.
  k.hp = KRAKEN.phase2 + 1
  k.slam = { x: me.x + 40, t: KRAKEN.slamTell + 1 }
  for (let i = 0; i < 20 && k.phase === 1; i++) game.update(hold('a', 'down'))
  assert.equal(k.phase, 2)
  let sock = false
  for (let i = 0; i < KRAKEN.sockEvery + 2; i++) {
    me.health = 100
    game.update(idle())
    sock ||= inner.decks[lair]!.spits.some((s) => s.sock)
  }
  assert.ok(sock, 'socks fly')
  // Phase 3: the head rises, armoured until it's steamed.
  k.hp = KRAKEN.phase3 + 1
  k.slam = { x: me.x + 40, t: KRAKEN.slamTell + 1 }
  for (let i = 0; i < 20 && k.phase === 2; i++) game.update(hold('a', 'down'))
  assert.equal(k.phase, 3)
  run(game, 45, () => {
    me.health = 100
    return idle()
  })
  assert.equal(k.head, 40, 'the head has risen')
  k.slam = null
  k.cool = -9999
  const armoured = k.hp
  for (let i = 0; i < 30; i++) {
    me.x = k.x - 60
    me.facing = 1
    me.health = 100
    game.update(hold('a'))
  }
  assert.equal(k.hp, armoured, 'beams clang off')
  assert.ok(
    inner.decks[lair]!.drops.some((d) => d.tool === 'steam'),
    'a Steam Wand turns up',
  )
  me.tool = 'steam'
  me.toolCharge = 200
  for (let i = 0; i < 5; i++) {
    me.x = k.x - 50
    game.update(hold('b'))
  }
  assert.ok(k.stun > 0, 'steamed soft')
  for (let i = 0; i < 40 && k.hp === armoured; i++) {
    me.x = k.x - 60
    me.health = 100
    game.update(hold('a'))
  }
  assert.ok(k.hp < armoured, 'and swept')
  k.hp = 1
  k.stun = 100
  for (let i = 0; i < 30 && inner.decks[lair]!.bosses.length; i++) {
    me.x = k.x - 60
    game.update(hold('a'))
  }
  assert.equal(inner.decks[lair]!.bosses.length, 0, 'the Kraken is swept up')
}

// --- the jobs -----------------------------------------------------------------------------------------
{
  const { game, inner, me } = make(10)
  assert.equal(inner.job!.id, 'seedVault')
  const vault = inner.decks[2]!.doors.find((d) => d.kind === 'vault')!
  place(inner, 2, vault.x, false)
  const score = game.score
  game.update(frame('up'))
  run(game, 30)
  assert.equal(me.deck, vault.room)
  assert.equal(inner.job!.state, 'done', 'the seeds are safe')
  assert.ok(game.score >= score + 5000)
  const late = make(11).inner
  late.job!.ticks = 1
  const g = late as unknown as ArcadeGameInstance
  g.update(idle())
  assert.equal(late.job!.state, 'failed', 'the goo got there first')
}
{
  const { game, inner } = make(12, 2)
  assert.equal(inner.job!.id, 'spinCycle')
  for (const d of inner.decks)
    if (d.room && d.room.kind !== 'boss') d.clean = true
  game.update(idle())
  assert.equal(inner.job!.state, 'done', 'every room clean while it spun')
}

// --- save and resume -------------------------------------------------------------------------------------
{
  const { game, inner } = make(13)
  const save = (game as unknown as { save: StationSave }).save
  assert.equal(save.station, 1, 'a resume point at the first station')
  inner.startStation(2)
  const second = (game as unknown as { save: StationSave }).save
  assert.equal(second.station, 2, 'and at the next')
  // Through the arcade's save store and back.
  const stored = sanitizeSaves(withSave({}, 'station-sweep', second))
  assert.deepEqual(readStationSave(stored['station-sweep']), second)
  for (const junk of [
    null,
    7,
    'x',
    { v: 2 },
    { ...second, station: 0 },
    { ...second, score: -1 },
    { ...second, kit: { bin: 9 } },
  ])
    assert.equal(
      readStationSave(junk),
      null,
      `junk is refused: ${JSON.stringify(junk)}`,
    )
  // Offered back: A continues at that station, with what was earned.
  const resume: StationSave = {
    v: 1,
    station: 2,
    score: 5000,
    spares: 1,
    credits: 9,
    kit: { ...emptyKit(), bin: 1 },
    swept: { roller: 3, crawler: 1, biter: 0, puffer: 0, gloop: 0, mimic: 0 },
  }
  const a = make(14, 1, resume)
  assert.ok(a.inner.offer, 'the cabinet offers to continue')
  assert.equal(a.game.music, null)
  a.game.render(g2d)
  a.game.update(frame('a'))
  assert.equal(a.game.level, 2)
  assert.equal(a.game.score, 5000)
  assert.equal(a.inner.credits, 9)
  assert.equal(a.inner.spares, 1)
  assert.equal(a.inner.swept.roller, 3)
  const b = make(15, 1, resume)
  b.game.update(frame('b'))
  assert.equal(b.game.level, 1, 'B starts a new shift')
  assert.equal(b.game.score, 0)
  assert.equal((b.game as unknown as { save: StationSave }).save.station, 1)
  // A run that ended offers a fresh shift at the station it reached.
  for (const m of a.inner.mops) m.out = true
  a.game.update(idle())
  assert.ok(a.game.over)
  const ended = (a.game as unknown as { save: StationSave }).save
  assert.equal(ended.continued, true)
  const c = make(16, 1, ended)
  c.game.update(frame('a'))
  assert.equal(c.game.level, 2)
  assert.equal(c.game.score, 0, 'the score starts afresh')
  assert.equal(c.inner.spares, 2)
  // The attract demo never offers or saves.
  const demo = stationSweep.create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
    resume,
  }) as unknown as { offer: unknown; save: unknown }
  assert.equal(demo.offer, null)
  assert.equal(demo.save, null)
}

// --- every deck and room draws -----------------------------------------------------------------------
for (const station of [1, 2, 3]) {
  for (const players of [1, 2]) {
    const game = stationSweep.create({
      rng: mulberry32(station),
      sound: quiet,
      demo: false,
      hiScore: 0,
      players,
    }) as ArcadeGameInstance
    const inner = game as unknown as Inner
    if (station > 1) inner.startStation(station)
    for (let d = 0; d < inner.decks.length; d++) {
      inner.mops[0]!.deck = d
      inner.mops[0]!.x = Math.min(inner.decks[d]!.width - 40, 120)
      game.update(idle())
      game.render(g2d)
    }
  }
}

// --- a scripted clear: the attract pilot's own route, with Mop's charge kept up -------------------------
function scriptedClear(station: number, seed: number) {
  const { game, inner } = make(seed, station)
  let t = 0
  for (; t < 60 * 60 * 8 && !inner.locker && !game.over; t++) {
    inner.mops[0]!.health = 100
    game.update(inner.demoInput())
  }
  assert.ok(inner.locker, `${ORBIT_LINE[station - 1]!.name} cleared`)
  assert.ok(
    inner.decks.every((d) => !d.bosses.length),
    'the Nest Mother and the Queen are swept up',
  )
  assert.equal(inner.job!.state, 'done', 'and the job is done')
  assert.ok(
    inner.crew.some((c) => c.state === 'saved'),
    'crew rescued',
  )
  console.log(
    `  scripted clear: ${ORBIT_LINE[station - 1]!.name} in ${Math.round(t / 60)}s, ` +
      `${inner.crew.filter((c) => c.state === 'saved').length} crew saved, ${game.score} points`,
  )
}
scriptedClear(1, 21)
scriptedClear(2, 22)

// --- pilot probes: the attract demo through the new stations, and runs still end ---------------------
{
  const game = stationSweep.create({
    rng: mulberry32(5),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as ArcadeGameInstance
  let level = 1
  let t = 0
  for (; t < 60 * 60 * 12 && !game.over; t++) {
    game.update(emptyInput())
    level = Math.max(level, game.level)
    if (t % 600 === 0) game.render(g2d)
  }
  assert.equal(game.score, 0, 'the attract demo never scores')
  assert.ok(level >= 2, 'the attract pilot clears the Greenhouse Ring')
  console.log(
    `  attract pilot: station ${level} ${game.over ? 'then game over' : 'after 12 minutes'}`,
  )
}
{
  const { game, inner } = make(31)
  inner.timer = 60 * 30
  let t = 0
  for (; t < 60 * 60 * 40 && !game.over; t++) game.update(emptyInput())
  assert.ok(game.over, 'an idle run ends')
  console.log(
    `  idle run: over at station ${game.level} after ${Math.round(t / 60)}s`,
  )
}

console.log('verifyCabinetStationSweepRooms: ok')
