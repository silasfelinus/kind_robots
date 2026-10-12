// Prize Show Panic depth slice 1 (conductor kr-arcade/t-026): the season map, authored room scripts,
// the ten room types and their hazards, the six room modifiers, golden tickets, the Parade Float's
// candle phase, seed replay, the attract pilot's progress through the map, and a run that still ends.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import type { PowerKind } from '../arcade/prizeShow/arsenal'
import { create, PANIC_CURVES } from '../arcade/games/prizeShowPanic'
import {
  EPISODE_1,
  LOOP_CURVES,
  MODIFIER_IDS,
  MODIFIERS,
  REWARD_RANK,
  SEASON,
  SEASON_TICKETS,
  VAULT_TICKETS,
  declaredCrashers,
  doorSides,
  exitsOf,
  loopTuning,
  rollModifier,
  roomById,
  seasonTickets,
  sideToward,
  waveEnds,
} from '../arcade/prizeShow/season'
import { remixScript } from '../arcade/prizeShow/modes'
import type {
  CrasherKind,
  ModifierId,
  PrizeKind,
  RoomScript,
  RoomType,
  Side,
  Wave,
} from '../arcade/prizeShow/season'

type Point = { x: number; y: number }
type Crasher = Point & {
  kind: CrasherKind
  hp: number
  maxHp: number
  vx: number
  vy: number
  t: number
  z: number
  mode: number
  clock: number
  face: number
  side: Side
  tx: number
  ty: number
  slow: number
  pumped: number
  extra: boolean
  prize: (Point & { lift: number }) | null
}
type Exit = Point & { side: Side; to: string; kind: 'door' | 'secret' | 'back' }
type Streamer = Point & { vx: number; vy: number; style: string }
type Beam = Point & { base: number; swing: number; on: number; off: number }
type Boss = Point & {
  hp: number
  maxHp: number
  phase: 1 | 2
  shift: number
  vx: number
  finale: boolean
}
type Inner = {
  picking: unknown
  score: number
  level: number
  lives: number
  over: boolean
  px: number
  py: number
  vx: number
  slip: number
  powers: Record<PowerKind, number>
  invuln: number
  hit: boolean
  loop: number
  episodeIndex: number
  tuning: ReturnType<typeof loopTuning>
  roomId: string
  secretId: string | null
  route: string[]
  secretsFound: string[]
  tickets: string[]
  modifier: ModifierId | null
  modifiers: Map<string, ModifierId | null>
  script: RoomScript
  roomTick: number
  roomTimer: number
  waves: Array<{ wave: Wave; at: number; left: number }>
  spawned: Record<CrasherKind, number>
  mines: Array<Point & { kind: 'cushion' | 'peel'; fuse: number }>
  beams: Beam[]
  pickups: Array<Point & { id: string }>
  crack: (Point & { hp: number; side: Side }) | null
  prizes: Array<Point & { kind: PrizeKind; life: number; pedestal?: boolean }>
  tosses: unknown[]
  crashers: Crasher[]
  streamers: Streamer[]
  shots: Shot[]
  boss: Boss | null
  exits: Exit[]
  exitsOpen: boolean
  cleared: boolean
  transition: number
  map: {
    options: Array<{ id: string; side: Side; modifier: ModifierId | null }>
    cursor: number
    ticks: number
  } | null
  rng: () => number
  tally: unknown
  ratings: number
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  enterRoom(id: string, entry: Side): void
  startRoom(): void
  finishEpisode(): void
  ending: unknown
  beamState(b: Beam): { angle: number; hot: boolean; warming: boolean }
  candleClock(b: Boss): number
  crasherSpeed(): number
  makeCrasher(kind: CrasherKind, x: number, y: number): Crasher
  cheer(c: Crasher): void
  demoInput(): InputFrame
}

const DOORS: Point[] = [
  { x: 160, y: 26 },
  { x: 310, y: 128 },
  { x: 160, y: 230 },
  { x: 10, y: 128 },
]

/** Past the contestant pick card (each seat takes the contestant under its cursor). */
function skipPick(g: { picking: unknown; update(input: InputFrame): void }) {
  // Past the mode card first (left alone, it takes the Season).
  const menu = (g as unknown as { menu: { ticks: number } | null }).menu
  if (menu) {
    menu.ticks = 1e9
    g.update(emptyInput())
  }
  if (!g.picking) return
  ;(g.picking as { ticks: number }).ticks = 1e9
  g.update(emptyInput())
}

function fresh(seed = 3, demo = false): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Inner
  skipPick(g)
  return g
}

/** A room entered from `entry`, with its modifier pinned (null: none). */
function stage(
  id: string,
  entry: Side,
  modifier: ModifierId | null = null,
  seed = 3,
): Inner {
  const g = fresh(seed)
  g.modifiers.set(id, modifier)
  g.enterRoom(id, entry)
  return g
}

/** The script sends nothing more, but the room never counts as clear. */
function hold(g: Inner) {
  g.waves = [
    {
      wave: { at: 0, kind: 'grabber', count: 1, doors: 'far' },
      at: 1e9,
      left: 1,
    },
  ]
}

type Shot = Point & {
  vx: number
  vy: number
  life: number
  hue: number
  kind: 'confetti' | 'rocket'
  foamy: boolean
  damage: number
  pierce: number
  hits: unknown[]
}

/** A confetti shot parked at (x, y): it lands on whatever is there next tick. */
function shot(x: number, y: number, vx = 0, vy = 0): Shot {
  return {
    x,
    y,
    vx,
    vy,
    life: 5,
    hue: 0,
    kind: 'confetti',
    foamy: false,
    damage: 1,
    pierce: 0,
    hits: [],
  }
}

function tick(g: Inner, n = 1, input: InputFrame = emptyInput()) {
  for (let i = 0; i < n; i++) g.update(input)
}

function safeTick(g: Inner, n = 1) {
  for (let i = 0; i < n; i++) {
    g.invuln = 1000
    g.update(emptyInput())
  }
}

function press(button: keyof InputFrame['held']): InputFrame {
  const frame = emptyInput()
  frame.held[button] = true
  frame.pressed[button] = true
  return frame
}

function holdDown(button: keyof InputFrame['held']): InputFrame {
  const frame = emptyInput()
  frame.held[button] = true
  return frame
}

function clear(g: Inner) {
  g.waves.forEach((w) => (w.left = 0))
  g.crashers = []
  g.boss = null
  safeTick(g)
}

/** Stand in a doorway (or a broken wall) and step through it. */
function walkOut(g: Inner, exit: Exit) {
  g.px = exit.x
  g.py = exit.y
  safeTick(g)
  assert.ok(g.transition > 0, `leaving by ${exit.kind} ${exit.to}`)
  safeTick(g, 80)
}

function scriptedInput(t: number): InputFrame {
  const frame = emptyInput()
  frame.held.right = t % 240 < 60
  frame.held.up = t % 300 < 20
  frame.held.a = true
  frame.pressed.a = t % 9 === 0
  return frame
}

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}
const g2d = stubContext()

// --- the season map ----------------------------------------------------------------------------
assert.equal(SEASON[0], EPISODE_1, 'Opening Night opens the season')
for (const ep of SEASON) {
  // An episode is a map of 12-14 rooms; the Live Finale is one long run of fewer.
  if (ep.live) assert.ok(ep.rooms.length >= 5, 'a long run')
  else assert.ok(ep.rooms.length >= 12 && ep.rooms.length <= 14, '12-14 rooms')
  const ids = new Set(ep.rooms.map((r) => r.id))
  assert.equal(ids.size, ep.rooms.length, 'room ids are unique')
  const cells = new Set(ep.rooms.map((r) => `${r.col},${r.row}`))
  assert.equal(cells.size, ep.rooms.length, 'one room per grid cell')
  for (const room of ep.rooms) {
    assert.ok(room.col >= 0 && room.col < ep.cols)
    assert.ok(room.row >= 0 && room.row < ep.rows)
    for (const next of room.exits) {
      const to = roomById(ep, next)
      assert.notEqual(
        sideToward(room, to),
        null,
        `${room.id} -> ${next}: exits lead to grid neighbours`,
      )
    }
    if (room.id !== ep.finale)
      assert.ok(room.exits.length > 0, `${room.id} has a way on`)
  }
  assert.deepEqual(roomById(ep, ep.finale).exits, [], 'the finale ends it')
  if (ep.midBoss) assert.equal(roomById(ep, ep.midBoss).script.type, 'boss')
  assert.equal(roomById(ep, ep.finale).script.type, 'boss')

  // Every room is reachable from the start, and every room still reaches the finale (no dead
  // ends, no loops back).
  const reach = (from: string, seen = new Set<string>()) => {
    if (seen.has(from)) return seen
    seen.add(from)
    for (const next of roomById(ep, from).exits) reach(next, seen)
    return seen
  }
  assert.equal(reach(ep.start).size, ep.rooms.length, 'all rooms reachable')
  for (const room of ep.rooms)
    assert.ok(reach(room.id).has(ep.finale), `${room.id} reaches the finale`)
  const visiting = new Set<string>()
  const acyclic = (id: string): boolean => {
    if (visiting.has(id)) return false
    visiting.add(id)
    const ok = roomById(ep, id).exits.every(acyclic)
    visiting.delete(id)
    return ok
  }
  assert.ok(acyclic(ep.start), 'the route only goes forward')

  // Safe and rich, side by side, at every fork.
  const forks = ep.rooms.filter((r) => r.exits.length > 1)
  if (ep.live) assert.equal(forks.length, 0, 'one long run, no forks')
  else assert.ok(forks.length >= 2, 'at least two forks in the episode')
  for (const fork of forks) {
    const scripts = fork.exits.map((id) => roomById(ep, id).script)
    const pair = scripts.some((safe) =>
      scripts.some(
        (rich) =>
          safe.danger < rich.danger &&
          REWARD_RANK[rich.reward] > REWARD_RANK[safe.reward],
      ),
    )
    assert.ok(pair, `${fork.id}: a safe door and a rich door`)
  }
  // The mid-boss splits the episode: both halves offer a fork before it and after it.
  if (!ep.live) {
    const mid = roomById(ep, ep.midBoss)
    assert.ok(mid.exits.length > 1, 'a fork after the mid-boss')
    assert.ok(roomById(ep, ep.start).exits.length > 1, 'a fork from the start')
  }

  // All ten room types are authored in Opening Night (the secret room off the map), plus the
  // bosses; every episode has its own secret, vault and sponsor challenge.
  const types = new Set<RoomType>([
    ...ep.rooms.map((r) => r.script.type),
    ...Object.values(ep.secrets).map((s) => s.type),
  ])
  for (const type of [
    'swarm',
    'mines',
    'lights',
    'cameras',
    'speed',
    'vault',
    'ambush',
    'conga',
    'sponsor',
    'secret',
    'boss',
  ] as RoomType[])
    if (
      ep === EPISODE_1 ||
      (!ep.live && ['vault', 'sponsor', 'secret'].includes(type))
    )
      assert.ok(types.has(type), `episode ${ep.number} has a ${type} room`)
  for (const room of ep.rooms)
    for (const prop of room.script.props ?? [])
      if (prop.kind === 'crack')
        assert.ok(
          ep.secrets[prop.secret],
          `${room.id}: its crack leads somewhere`,
        )
  for (const id of Object.keys(ep.secrets))
    assert.ok(!ids.has(id), 'secret rooms stay off the map')

  // Each room can be cleared in time: its script is done well before the countdown.
  const scripts = [
    ...ep.rooms.map((r) => r.script),
    ...Object.values(ep.secrets),
  ]
  for (const script of scripts)
    for (const loop of [1, 2, 4, 8]) {
      const clock = script.seconds * 60 * loopTuning(loop).clock
      for (const wave of script.waves)
        assert.ok(
          waveEnds(wave, loop) < clock * 0.7,
          `${script.title}: wave at ${wave.at} fits loop ${loop}`,
        )
    }
  assert.deepEqual(doorSides('flanks', 2), [3, 1])
  assert.deepEqual(doorSides('far', 3), [1])
  assert.deepEqual(doorSides('behind', 0), [0])
  assert.equal(doorSides('all', 1).length, 4)
}

// --- doors in the room are the map's neighbours, and the map takes the d-pad and A -------------
{
  const ep = EPISODE_1
  for (const room of ep.rooms) {
    if (!room.exits.length) continue
    const pred = ep.rooms.find((r) => r.exits.includes(room.id))
    const entry = pred ? (((sideToward(pred, room)! + 2) % 4) as Side) : 3
    const g = stage(room.id, entry)
    if (!room.script.closes) assert.equal(g.exitsOpen, false)
    clear(g)
    assert.ok(g.exitsOpen, `${room.id}: doors open once clear`)
    const want = exitsOf(ep, room.id)
    assert.deepEqual(
      g.exits.filter((e) => e.kind === 'door').map((e) => [e.side, e.to]),
      want.map((e) => [e.side, e.room.id]),
      `${room.id}: one door per map neighbour, on the side that faces it`,
    )
    for (const exit of g.exits) {
      assert.equal(exit.x, DOORS[exit.side]!.x)
      assert.equal(exit.y, DOORS[exit.side]!.y)
      assert.notEqual(exit.side, entry, 'the way in is never a way on')
    }
  }

  // Walk out of the start's top door: the map opens on that choice; the d-pad moves it; A goes.
  const g = fresh(5)
  assert.equal(g.roomId, EPISODE_1.start)
  assert.equal(g.level, 1)
  clear(g)
  const up = g.exits.find((e) => e.side === 0)!
  walkOut(g, up)
  assert.ok(g.map, 'the map shows between rooms')
  assert.equal(g.map!.options.length, 2)
  assert.equal(
    g.map!.options[g.map!.cursor]!.side,
    0,
    'preselects the door taken',
  )
  tick(g, 1, press('down'))
  assert.equal(g.map!.options[g.map!.cursor]!.side, 0, 'the map settles first')
  tick(g, 40)
  tick(g, 1, press('down'))
  const down = g.map!.options[g.map!.cursor]!
  assert.equal(down.side, 2, 'down picks the lower door')
  tick(g, 1, press('a'))
  assert.equal(g.map, null)
  assert.equal(g.roomId, down.id)
  assert.equal(g.level, 2, 'each room is a new studio')
  assert.deepEqual(g.route, [EPISODE_1.start, down.id])
  // Coming in from the top door means crashers flagged `far` use the bottom one.
  assert.equal(g.py < 128, true, 'Sparkle walks in by the top door')

  // Left alone, the map goes with the highlighted door.
  const idle = fresh(6)
  clear(idle)
  walkOut(idle, idle.exits[0]!)
  for (let t = 0; t < 60 * 13 && idle.map; t++) idle.update(emptyInput())
  assert.equal(idle.map, null, 'the map does not wait forever')
  assert.equal(idle.route.length, 2)
}

// --- room scripts spawn what they declare -------------------------------------------------------
{
  const ep = EPISODE_1
  const scripts: Array<[string, RoomScript, boolean]> = [
    ...ep.rooms.map((r): [string, RoomScript, boolean] => [
      r.id,
      r.script,
      false,
    ]),
    ...Object.entries(ep.secrets).map(
      ([id, s]): [string, RoomScript, boolean] => [id, s, true],
    ),
  ]
  for (const loop of [1, 3]) {
    for (const [id, script, secret] of scripts) {
      const g = fresh(9)
      g.loop = loop
      g.tuning = loopTuning(loop)
      if (secret) {
        g.roomId = 'lightning-round'
        ;(
          g as unknown as { enterSecret(id: string, e: Side): void }
        ).enterSecret(id, 0)
      } else {
        g.modifiers.set(id, null)
        g.enterRoom(id, 2)
      }
      const last = Math.max(0, ...script.waves.map((w) => waveEnds(w, loop)))
      for (let t = 0; t <= last + 2; t++) {
        g.invuln = 1000
        g.update(emptyInput())
      }
      // Later loops play the room's remix (prizeShow/modes.ts), and spawn what it declares.
      assert.deepEqual(
        g.script,
        remixScript(script, id, loop),
        `${id} at loop ${loop}: the remix`,
      )
      assert.deepEqual(
        g.spawned,
        declaredCrashers(g.script, loop),
        `${id} at loop ${loop}: spawns what its script declares`,
      )
    }
  }
  // Later loops bring bigger crowds.
  const opening = roomById(ep, ep.start).script
  const total = (r: Record<CrasherKind, number>) =>
    Object.values(r).reduce((a, b) => a + b, 0)
  assert.ok(
    total(declaredCrashers(opening, 4)) > total(declaredCrashers(opening, 1)),
  )
}

// --- the room types -----------------------------------------------------------------------------

// Mine set: a cushion goes off a beat after it is stepped on; peels send Sparkle sliding.
{
  const g = stage('whoopee-alley', 2)
  hold(g)
  assert.ok(g.mines.filter((m) => m.kind === 'cushion').length >= 6)
  assert.ok(g.mines.filter((m) => m.kind === 'peel').length >= 3)
  const cushion = g.mines.find((m) => m.kind === 'cushion')!
  g.invuln = 0
  g.px = cushion.x
  g.py = cushion.y
  tick(g)
  assert.ok(cushion.fuse > 0, 'stepping on a cushion arms it')
  g.px = cushion.x + 12
  const lives = g.lives
  tick(g, 40)
  assert.equal(g.lives, lives - 1, 'standing in the blast costs a contestant')
  assert.ok(!g.mines.includes(cushion), 'the cushion is spent')

  // Step on one and run: the fuse is the tell.
  const h = stage('whoopee-alley', 2)
  hold(h)
  const c2 = h.mines.find((m) => m.kind === 'cushion')!
  h.invuln = 0
  h.px = c2.x
  h.py = c2.y
  tick(h)
  h.px = c2.x + 60
  h.py = 128
  const before = h.lives
  tick(h, 40)
  assert.equal(h.lives, before, 'outrunning the fuse is safe')

  // A crasher trips one too, and the puff cheers it (and pays).
  const k = stage('whoopee-alley', 2)
  hold(k)
  const c3 = k.mines.find((m) => m.kind === 'cushion')!
  k.px = 160
  k.py = 200
  const crasher = k.makeCrasher('grabber', c3.x, c3.y)
  for (let t = 0; t < 40; t++) {
    k.invuln = 1000
    crasher.x = c3.x
    crasher.y = c3.y
    k.update(emptyInput())
    if (!k.crashers.includes(crasher)) break
  }
  assert.ok(!k.crashers.includes(crasher), 'the puff cheers crashers')
  assert.ok(k.score > 0)

  // Confetti pops a cushion from range.
  const r = stage('whoopee-alley', 2)
  hold(r)
  const c4 = r.mines.find((m) => m.kind === 'cushion')!
  r.shots.push(shot(c4.x, c4.y))
  safeTick(r)
  assert.ok(c4.fuse > 0, 'a shot sets a cushion off')

  // Peel: a slide that can't be steered.
  const p = stage('whoopee-alley', 2)
  hold(p)
  const peel = p.mines.find((m) => m.kind === 'peel')!
  p.px = peel.x - 14
  p.py = peel.y
  for (let t = 0; t < 30 && p.slip === 0; t++) {
    p.invuln = 1000
    p.update(holdDown('right'))
  }
  assert.ok(p.slip > 0, 'a peel starts a slide')
  assert.ok(!p.mines.includes(peel), 'and is used up')
  const x0 = p.px
  for (let t = 0; t < 8; t++) {
    p.invuln = 1000
    p.update(holdDown('left'))
  }
  assert.ok(p.px > x0, 'no steering out of a slide')
}

// Light rig: beams step across the floor on the beat; the tell shows exactly where they light.
{
  const g = stage('spotlight-dance', 3)
  hold(g)
  assert.equal(g.beams.length, 3)
  const beam = g.beams[0]!
  let tellAngle: number | null = null
  let lit = false
  for (let t = 0; t < 600 && !lit; t++) {
    const state = g.beamState(beam)
    if (state.warming) tellAngle = state.angle
    if (state.hot && tellAngle !== null) {
      assert.ok(
        Math.abs(state.angle - tellAngle) < 0.02,
        'a beam lights where its tell showed',
      )
      lit = true
      break
    }
    safeTick(g)
  }
  assert.ok(lit, 'the beam lights on its beat')
  // Stand in the hot beam.
  const { angle } = g.beamState(beam)
  g.invuln = 0
  g.px = beam.x + Math.cos(angle) * 90
  g.py = beam.y + Math.sin(angle) * 90
  const lives = g.lives
  tick(g)
  assert.equal(g.lives, lives - 1, 'a hot beam costs a contestant')

  // A dark beam is harmless, wherever it points.
  const h = stage('spotlight-dance', 3)
  hold(h)
  const b = h.beams[0]!
  while (h.beamState(b).hot || h.beamState(b).warming) safeTick(h)
  const dark = h.beamState(b).angle
  h.invuln = 0
  h.px = b.x + Math.cos(dark) * 90
  h.py = b.y + Math.sin(dark) * 90
  const before = h.lives
  tick(h)
  assert.equal(h.lives, before, 'a dark beam is safe')

  // The rig powers down when the room is clear.
  const k = stage('spotlight-dance', 3)
  clear(k)
  for (let t = 0; t < 400; t++) {
    assert.ok(!k.beamState(k.beams[0]!).hot)
    safeTick(k)
    if (k.transition) break
  }
}

// Camera wall: camera cranes along the far wall fire flashbulbs at a locked aim; confetti cuts them,
// and the room isn't clear until they are.
{
  const cranes = (g: Inner) => g.crashers.filter((c) => c.kind === 'crane')
  const g = stage('studio-cameras', 2)
  hold(g)
  assert.equal(cranes(g).length, 4)
  assert.ok(
    cranes(g).every((c) => c.side === 0),
    'the far wall from the entry',
  )
  const side = stage('studio-cameras', 1)
  assert.ok(
    cranes(side).every((c) => c.side === 3),
    'it follows the entry',
  )
  g.px = 160
  g.py = 200
  let flash: Streamer | undefined
  for (let t = 0; t < 200 && !flash; t++) {
    safeTick(g)
    g.px = 160
    g.py = 200
    flash = g.streamers.find((s) => s.style === 'flash')
  }
  assert.ok(flash, 'a camera fires a flash')
  assert.ok(flash!.vy > 0, 'aimed into the room at Sparkle')
  const cam = cranes(g)[0]!
  const score = g.score
  for (let i = 0; i < 4; i++) {
    g.shots.push(shot(cam.x, cam.y + 2))
    safeTick(g)
  }
  assert.equal(cranes(g).length, 3, 'four hits cut a camera')
  assert.ok(g.score >= score + 300)
  const wall = stage('studio-cameras', 2)
  wall.waves.forEach((w) => (w.left = 0))
  wall.crashers = wall.crashers.filter((c) => c.kind === 'crane')
  safeTick(wall, 5)
  assert.ok(!wall.cleared, 'live cameras keep the room from clearing')
}

// Speed round: short clock, every drop comes in pairs.
{
  const g = stage('lightning-round', 3)
  assert.ok(g.script.seconds < 30)
  hold(g)
  g.rng = () => 0.01
  for (let i = 0; i < 3; i++)
    g.cheer(g.makeCrasher('grabber', 100 + i * 30, 120))
  assert.equal(g.prizes.length, 6, 'double prize drops')
}

// Prize vault: open doors, pedestal prizes that wait, a ticket, and a set that closes on time.
{
  const g = stage('the-showcase', 0)
  assert.equal(g.script.waves.length, 0, 'no crashers in the vault')
  assert.ok(g.exitsOpen, 'the doors are open from the start')
  assert.ok(g.prizes.length >= 5 && g.prizes.every((p) => p.pedestal))
  assert.equal(g.pickups.length, 1, 'a golden ticket on display')
  const lives = g.lives
  safeTick(g, 60 * 8)
  assert.ok(g.prizes.length >= 5, 'pedestal prizes do not fade')
  for (let t = 0; t < 60 * 6 && !g.map; t++) safeTick(g)
  assert.ok(g.map, 'when the vault closes Sparkle is ushered to the map')
  assert.equal(g.lives, lives, 'closing costs nothing')
  assert.equal(g.tickets.length, 0, 'an ungrabbed ticket stays behind')
}

// Ambush: all four doors at once.
{
  const g = stage('surprise-guests', 1)
  const first = g.script.waves[0]!
  assert.equal(first.doors, 'all')
  for (let t = 0; t <= first.at + 1; t++) safeTick(g)
  assert.equal(g.spawned.grabber, first.count * 4 * 2)
  for (const door of DOORS)
    assert.ok(
      g.crashers.some((c) => Math.hypot(c.x - door.x, c.y - door.y) < 40),
      'crashers at every door',
    )
}

// Conga ballroom: lines only, and faster on their feet.
{
  const g = stage('conga-line', 0)
  assert.ok(g.script.waves.every((w) => w.kind === 'conga'))
  assert.ok(
    g.script.waves.some((w) => w.count >= 8),
    'long lines',
  )
  const base = stage('opening-act', 2)
  base.level = g.level
  assert.ok(g.crasherSpeed() > base.crasherSpeed() * 1.2, 'fast feet')
}

// Sponsor challenge: no hits wins a golden ticket; a hit loses it; grab-every-prize works too.
{
  const g = stage('sponsor-spotlight', 2)
  assert.equal(g.script.challenge, 'no-hit')
  clear(g)
  assert.deepEqual(
    g.pickups.map((p) => p.id),
    ['e1-sponsor'],
    'the ticket appears',
  )
  walkOut(g, g.exits[0]!)
  assert.ok(g.tickets.includes('e1-sponsor'), 'and is kept on the way out')

  const h = stage('sponsor-spotlight', 2)
  h.hit = true
  clear(h)
  assert.equal(h.pickups.length, 0, 'a hit forfeits the ticket')

  const grab = stage('sponsor-spotlight', 2)
  grab.script = {
    ...grab.script,
    challenge: 'all-prizes',
    ticket: 'test-sweep',
    waves: [],
    props: [{ kind: 'pedestal', x: 100, y: 100, prize: 'cash' }],
  }
  grab.startRoom()
  grab.px = 100
  grab.py = 100
  safeTick(grab)
  assert.deepEqual(
    grab.pickups.map((p) => p.id),
    ['test-sweep'],
  )
  const miss = stage('sponsor-spotlight', 2)
  miss.script = { ...grab.script }
  miss.startRoom()
  safeTick(miss)
  assert.equal(miss.pickups.length, 0, 'a prize left behind forfeits it')
}

// Secret room: a cracked wall breaks open, leads backstage, and comes back to the map.
{
  const g = stage('lightning-round', 3)
  assert.ok(g.crack, 'the speed round has a cracked wall')
  for (let i = 0; i < 6; i++) {
    g.shots.push(shot(g.crack!.x, g.crack!.y - 4))
    safeTick(g)
  }
  assert.equal(g.crack!.hp, 0, 'confetti breaks it')
  clear(g)
  const hole = g.exits.find((e) => e.kind === 'secret')
  assert.ok(hole, 'the hole is a way out once the set is clear')
  walkOut(g, hole!)
  assert.equal(g.secretId, 'backstage')
  assert.equal(g.script.type, 'secret')
  assert.ok(g.pickups.some((p) => p.id === 'e1-backstage'))
  const ticket = g.pickups[0]!
  g.px = ticket.x
  g.py = ticket.y
  safeTick(g)
  assert.ok(g.tickets.includes('e1-backstage'))
  assert.ok(g.exitsOpen)
  const back = g.exits.find((e) => e.kind === 'back')!
  walkOut(g, back)
  assert.ok(g.map, 'back to the map')
  assert.equal(g.roomId, 'lightning-round', 'from the room with the crack')
  assert.deepEqual(
    g.map!.options.map((o) => o.id),
    exitsOf(EPISODE_1, 'lightning-round').map((e) => e.room.id),
  )
  assert.ok(g.secretsFound.includes('lightning-round'))
  g.render(g2d)
}

// --- the Parade Float's second phase -------------------------------------------------------------
{
  const g = stage('parade-float', 3)
  const boss = g.boss!
  assert.equal(boss.phase, 1)
  assert.equal(boss.finale, false)
  const speed = Math.abs(boss.vx)
  for (let t = 0; t < 400; t++) {
    safeTick(g)
    assert.ok(!g.streamers.some((s) => s.style === 'spark'), 'cold candles')
  }
  const half = Math.ceil(boss.maxHp / 2)
  boss.hp = half + 1
  g.shots.push(shot(boss.x, boss.y))
  safeTick(g)
  assert.equal(boss.phase, 2, 'at half health the candles light')
  assert.ok(boss.shift > 0)
  const hp = boss.hp
  g.shots.push(shot(boss.x, boss.y))
  safeTick(g)
  assert.equal(boss.hp, hp, 'it shrugs off confetti while they catch')
  assert.ok(Math.abs(boss.vx) > speed, 'and rolls faster after')
  let sparks = 0
  for (let t = 0; t < 160 && !sparks; t++) {
    safeTick(g)
    sparks = g.streamers.filter((s) => s.style === 'spark').length
  }
  assert.equal(sparks, 4, 'every candle fires a spark')
  g.render(g2d)

  // The finale float is bigger, and beating it wraps the episode and starts the encore.
  const f = stage('grand-finale', 3)
  assert.ok(f.boss!.finale)
  assert.ok(f.boss!.maxHp > boss.maxHp, 'the finale float has more to give')
  f.waves.forEach((w) => (w.left = 0))
  f.crashers = []
  f.boss!.hp = 1
  f.shots.push(shot(f.boss!.x, f.boss!.y))
  safeTick(f)
  assert.equal(f.boss, null)
  f.crashers = []
  for (let t = 0; t < 200 && !f.tally; t++) {
    f.crashers = []
    safeTick(f)
  }
  assert.ok(f.tally, 'the wrap opens the prize tally')
  // The tally, the swap, a commercial break (a mini-game), then episode 2.
  for (let t = 0; t < 8000 && f.episodeIndex === 0; t++) f.update(emptyInput())
  assert.equal(
    f.episodeIndex,
    1,
    'and after the tally, the swap and a break, episode 2',
  )
  assert.equal(f.roomId, SEASON[1]!.start)
  assert.equal(f.loop, 1)
  // After the Live Finale (without ten tickets): the ending, the credits, then a rerun.
  f.episodeIndex = SEASON.length - 1
  f.tickets = []
  f.finishEpisode()
  assert.ok(f.ending, 'the season ends')
  for (let t = 0; t < 20_000 && f.ending; t++) f.update(emptyInput())
  assert.equal(f.loop, 2, 'and the season reruns')
  assert.equal(f.roomId, EPISODE_1.start)
  assert.ok(f.tuning.speed > 1, 'with harder curves')
  const hard = stage('grand-finale', 3)
  hard.loop = 2
  hard.tuning = loopTuning(2)
  hard.startRoom()
  assert.ok(
    hard.boss!.maxHp > roomById(EPISODE_1, 'grand-finale').script.boss!.hp,
    'bosses grow on later loops',
  )
}

// --- modifiers ----------------------------------------------------------------------------------
{
  const swarm = roomById(EPISODE_1, 'opening-act').script
  const foam = roomById(EPISODE_1, 'bubble-bash').script
  const vault = roomById(EPISODE_1, 'the-showcase').script
  const boss = roomById(EPISODE_1, 'parade-float').script
  const rng = mulberry32(77)
  assert.equal(
    rollModifier(rng, 1, swarm),
    null,
    'the first pass is as written',
  )
  assert.equal(rollModifier(rng, 1, foam), 'foam', 'a written modifier holds')
  const seen = new Map<ModifierId | null, number>()
  for (let i = 0; i < 3000; i++) {
    const mod = rollModifier(rng, 4, swarm)
    seen.set(mod, (seen.get(mod) ?? 0) + 1)
    assert.equal(rollModifier(rng, 4, vault), null)
    assert.equal(rollModifier(rng, 4, boss), null)
  }
  for (const id of MODIFIER_IDS) assert.ok(seen.get(id), `${id} gets rolled`)
  const none = (seen.get(null) ?? 0) / 3000
  assert.ok(none > 0.05 && none < 0.3, 'most rooms on later loops get a twist')
  assert.equal(MODIFIER_IDS.length, 6)
  for (const id of MODIFIER_IDS) assert.equal(MODIFIERS[id].id, id)
  assert.ok(LOOP_CURVES.modifierChance.start === 0)

  // On a later loop the map shows each door's twist before you pick it.
  let shown = 0
  for (let seed = 1; seed <= 6; seed++) {
    const g = fresh(seed)
    g.loop = 3
    g.tuning = loopTuning(3)
    g.modifiers.clear()
    clear(g)
    walkOut(g, g.exits[0]!)
    shown += g.map!.options.filter((o) => o.modifier).length
    g.render(g2d)
  }
  assert.ok(shown > 0, 'rolled modifiers appear on the map')

  // Foam Party: Sparkle keeps sliding after the stick lets go.
  const slick = stage('opening-act', 2, 'foam')
  hold(slick)
  const dry = stage('opening-act', 2, null)
  hold(dry)
  for (const g of [slick, dry]) {
    g.px = 100
    g.py = 128
    for (let t = 0; t < 40; t++) {
      g.invuln = 1000
      g.update(holdDown('right'))
    }
  }
  const slickX = slick.px
  const dryX = dry.px
  safeTick(slick, 10)
  safeTick(dry, 10)
  assert.equal(dry.px, dryX, 'a dry floor stops at once')
  assert.ok(slick.px > slickX + 3, 'foam keeps you going')
  const skid = slick.makeCrasher('grabber', 60, 60)
  safeTick(slick, 5)
  assert.ok(skid.vx !== 0, 'crashers skid too')

  // Double Time: faster crashers, doubled prizes.
  const fast = stage('opening-act', 2, 'double-time')
  const calm = stage('opening-act', 2, null)
  assert.ok(Math.abs(fast.crasherSpeed() / calm.crasherSpeed() - 1.35) < 1e-9)
  const late = stage('opening-act', 2, 'double-time')
  late.level = 60
  late.tuning = loopTuning(9)
  assert.ok(late.crasherSpeed() < 1.6, 'never faster than Sparkle')
  hold(fast)
  fast.ratings = 0
  fast.prizes.push({ x: fast.px, y: fast.py, kind: 'cash', life: 100 })
  const before = fast.score
  safeTick(fast)
  assert.equal(fast.score - before, 1000, 'cash pays double')

  // Audience Participation: gifts arrive over the wall and land as prizes.
  const crowd = stage('opening-act', 2, 'audience')
  hold(crowd)
  crowd.px = 40
  crowd.py = 40
  let tossed = false
  for (let t = 0; t < 600; t++) {
    safeTick(crowd)
    crowd.px = 40
    crowd.py = 40
    if (crowd.tosses.length) tossed = true
    if (tossed && crowd.prizes.length) break
  }
  assert.ok(tossed, 'the crowd throws')
  assert.ok(crowd.prizes.length > 0, 'gifts land on the floor')
  crowd.render(g2d)

  // Sudden Death: shields don't help, shields become cash, a clean clear pays a jackpot.
  const sd = stage('opening-act', 2, 'sudden-death')
  hold(sd)
  sd.powers.shield = 300
  sd.invuln = 0
  const lives = sd.lives
  sd.makeCrasher('grabber', sd.px, sd.py)
  tick(sd)
  assert.equal(sd.lives, lives - 1, 'no shield in sudden death')
  const jack = stage('opening-act', 2, 'sudden-death')
  const s0 = jack.score
  clear(jack)
  assert.ok(jack.score - s0 >= 25_000, 'a no-hit clear pays the jackpot')
  const spare = stage('the-showcase', 0, 'sudden-death')
  spare.script = {
    ...spare.script,
    props: [{ kind: 'pedestal', x: 80, y: 80, prize: 'shield' }],
  }
  spare.startRoom()
  assert.equal(spare.prizes[0]!.kind, 'cash')

  // Lights Out and Confetti Storm only change what you can see: play is identical.
  for (const mod of ['lights-out', 'confetti-storm'] as ModifierId[]) {
    const a = stage('opening-act', 2, mod, 21)
    const b = stage('opening-act', 2, null, 21)
    for (let t = 0; t < 60 * 20; t++) {
      a.update(scriptedInput(t))
      b.update(scriptedInput(t))
      if (t % 97 === 0) a.render(g2d)
    }
    assert.deepEqual(
      [a.score, a.lives, a.px, a.py, a.crashers.length],
      [b.score, b.lives, b.px, b.py, b.crashers.length],
      `${mod} is render-only`,
    )
  }
}

// --- golden tickets ------------------------------------------------------------------------------
{
  const ids = seasonTickets()
  assert.deepEqual(new Set(ids).size, ids.length, 'ticket ids are unique')
  assert.equal(
    ids.length,
    SEASON_TICKETS,
    'three hide in each of the four episodes',
  )
  assert.equal(SEASON_TICKETS, 12)
  assert.equal(VAULT_TICKETS, 10)
  const g = stage('the-showcase', 0)
  const ticket = g.pickups[0]!
  const score = g.score
  g.px = ticket.x
  g.py = ticket.y
  safeTick(g)
  assert.deepEqual(g.tickets, ['e1-showcase'])
  assert.equal(g.score - score, 5000)
  assert.equal(g.pickups.length, 0)
  g.render(g2d)
  // A ticket held is never placed again.
  g.modifiers.set('the-showcase', null)
  g.enterRoom('the-showcase', 0)
  assert.equal(g.pickups.length, 0)
  assert.deepEqual(g.tickets, ['e1-showcase'])
}

// --- seed replay -------------------------------------------------------------------------------
{
  const play = (seed: number) => {
    const g = fresh(seed)
    const trace: number[] = []
    for (let t = 0; t < 60 * 60 * 4 && !g.over; t++) {
      const frame = scriptedInput(t)
      if (g.map) frame.pressed.a = t % 30 === 0
      frame.held.down = t % 410 < 90
      g.update(frame)
      if (t % 120 === 0) trace.push(g.score, g.lives, Math.round(g.px * 10))
    }
    return { trace, score: g.score, level: g.level, route: [...g.route] }
  }
  assert.deepEqual(play(42), play(42), 'the same seed and input replay exactly')
  const pilot = (seed: number) => {
    const g = fresh(seed, true)
    for (let t = 0; t < 60 * 60 * 4; t++) {
      g.lives = 99
      g.update(emptyInput())
    }
    return [g.level, g.roomId, g.route.join(','), Math.round(g.px)]
  }
  assert.deepEqual(pilot(8), pilot(8), 'the attract run replays too')
  assert.notDeepEqual(play(42).trace, play(43).trace, 'and seeds differ')
}

// --- the attract pilot picks its way through the map ---------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'prize-show-panic')!
  const visited = new Set<string>()
  let best = 0
  for (const seed of [7, 3]) {
    const g = fresh(seed, true)
    let maps = 0
    for (let t = 0; t < 60 * 60 * 12; t++) {
      g.lives = 99
      const wasMap = !!g.map
      g.update(emptyInput())
      if (wasMap && !g.map) maps++
      if (g.roomId) visited.add(g.roomId)
    }
    assert.equal(g.score, 0, 'the attract demo never scores')
    assert.ok(
      maps >= 6,
      `seed ${seed}: the pilot picked ${maps} doors on the map`,
    )
    best = Math.max(best, g.level)
  }
  assert.ok(best >= 12, `the pilot gets through ${best} studios`)
  // Up is the rich lane and down the safe one, in every episode.
  const rows = new Set(
    SEASON.flatMap((ep) => ep.rooms)
      .filter((r) => visited.has(r.id))
      .map((r) => r.row),
  )
  assert.ok(
    rows.has(0) && rows.has(2),
    'it takes the rich lane and the safe lane',
  )

  // A normal run still ends: a busy scripted player, and the pilot playing for real.
  const scripted = fresh(11)
  let t = 0
  for (; t < 60 * 60 * 20 && !scripted.over; t++) {
    scripted.update(scriptedInput(t))
    if (t % 60 === 0) scripted.render(g2d)
  }
  assert.ok(scripted.over, 'a scripted run ends')
  assert.ok(scripted.score > 0 && scripted.score <= meta.maxPlausibleScore)
  // A skilled run is long (the season is meant to take an hour or more to clear), never endless.
  for (const seed of [1, 2]) {
    const real = fresh(seed)
    let ticks = 0
    for (; ticks < 60 * 60 * 75 && !real.over; ticks++)
      real.update(real.demoInput())
    assert.ok(real.over, `seed ${seed}: even the pilot's run ends`)
    assert.ok(real.score <= meta.maxPlausibleScore)
    assert.ok(real.level > 5, 'after real progress')
  }
}

// --- the registry and the curves ------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'prize-show-panic')!
  assert.ok(meta.howTo.some((line) => line.includes('DOORS')))
  assert.ok(meta.howTo.some((line) => line.includes('TICKET')))
  assert.ok(meta.maxPlausibleScore >= 20_000_000)
  for (const key of Object.keys(LOOP_CURVES) as (keyof typeof LOOP_CURVES)[]) {
    const a = loopTuning(1)[key]
    const b = loopTuning(5)[key]
    const harder = key === 'waveTime' || key === 'clock' ? b < a : b > a
    assert.ok(harder, `${key} gets harder each loop`)
  }
  assert.ok(PANIC_CURVES.grabberSpeed.limit > PANIC_CURVES.grabberSpeed.start)
}

console.log('verifyPrizeShowPanic: ok')
