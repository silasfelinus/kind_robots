// Prize Show Panic depth slice 2 (conductor kr-arcade/t-027): the nineteen-crasher roster (each new
// kind's tell, then its move, and its answer), the ten-item arsenal with stacking timers, the boom
// mic, and twin-stick play, each pinned on a staged room; plus seed replay with an aim stick.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/prizeShowPanic'
import {
  ARSENAL,
  POWER_KINDS,
  POWERS,
  powerFromRoll,
  stackPower,
} from '../arcade/prizeShow/arsenal'
import type { PowerKind } from '../arcade/prizeShow/arsenal'
import {
  CRASHER_KINDS,
  ROSTER,
  TELLS,
  deflects,
} from '../arcade/prizeShow/roster'
import type { Crasher, CrasherKind } from '../arcade/prizeShow/roster'
import { ROSTER_ROWS } from '../arcade/prizeShow/rosterArt'
import { EPISODE_1, wavesAt } from '../arcade/prizeShow/season'
import type { ModifierId, Side } from '../arcade/prizeShow/season'

type Point = { x: number; y: number }
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
type Inner = {
  picking: unknown
  score: number
  level: number
  lives: number
  over: boolean
  px: number
  py: number
  vx: number
  invuln: number
  roomTick: number
  cleared: boolean
  aim: Point
  lifted: number
  fireCooldown: number
  powers: Record<PowerKind, number>
  modifiers: Map<string, ModifierId | null>
  waves: unknown[]
  crashers: Crasher[]
  streamers: Array<Point & { vx: number; vy: number; style: string }>
  shots: Shot[]
  mines: Array<Point & { kind: string; fuse: number }>
  prizes: Array<Point & { kind: string; life: number; lift: number }>
  cases: Array<Point & { pushed: boolean }>
  lobs: Array<{ kind: string; x1: number; y1: number }>
  slicks: Array<Point & { kind: string; r: number }>
  booms: Array<{ every: number; offset: number }>
  glitter: unknown[]
  decoy: (Point & { hp: number; life: number }) | null
  map: { options: Array<{ side: Side }>; cursor: number; ticks: number } | null
  rng: () => number
  twistClock: number
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  enterRoom(id: string, entry: Side): void
  makeCrasher(kind: CrasherKind, x: number, y: number): Crasher
  pace(c: Crasher): number
  boomTell(b: unknown): number | null
  orbiterSpots(): Point[]
  placeDecoy(): void
  openMap(side: Side | null): void
  demoInput(): InputFrame
}

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

function fresh(seed = 3): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as Inner
  skipPick(g)
  return g
}

/** A room with nobody in it and a script that never finishes (so it never clears). */
function stage(id = 'opening-act', entry: Side = 2, seed = 3): Inner {
  const g = fresh(seed)
  g.modifiers.set(id, null)
  g.enterRoom(id, entry)
  g.waves = [
    {
      wave: { at: 0, kind: 'grabber', count: 1, doors: 'far' },
      at: 1e9,
      left: 1,
    },
  ]
  g.crashers = []
  g.mines = []
  g.px = 160
  g.py = 200
  // No producer's plot twists in a staged room: each test counts its own crashers.
  g.twistClock = 1e9
  return g
}

function safe(g: Inner, n = 1, input: InputFrame = emptyInput()) {
  for (let i = 0; i < n; i++) {
    g.invuln = 1000
    g.update(input)
  }
}

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

function aimAt(x: number, y: number): InputFrame {
  const frame = emptyInput()
  const len = Math.hypot(x, y) || 1
  frame.aim = { x: x / len, y: y / len }
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

// --- the roster as data ---------------------------------------------------------------------------
{
  assert.equal(
    CRASHER_KINDS.length,
    19,
    'four founders and fifteen new crashers',
  )
  for (const kind of CRASHER_KINDS) {
    const entry = ROSTER[kind]
    assert.ok(
      entry.tell.length > 4 && entry.answer.length > 4,
      `${kind}: tell and answer`,
    )
    assert.ok(entry.hp >= 1 && entry.points > 0)
  }
  const founders = ['grabber', 'bouncer', 'conga', 'thrower']
  for (const kind of CRASHER_KINDS) {
    if (founders.includes(kind) || kind === 'crane' || kind === 'clone')
      continue
    const frames = ROSTER_ROWS[kind]
    assert.ok(frames && frames.length === 2, `${kind}: two frames of art`)
    const w = frames![0]![0]!.length
    for (const frame of frames!)
      for (const row of frame) assert.equal(row.length, w, `${kind}: even rows`)
  }
  for (const kind of ['popper', 'stagehand', 'crane'] as CrasherKind[])
    assert.equal(ROSTER[kind].episode, 1, `${kind} belongs to Opening Night`)

  // Every crasher is on the show by the fourth loop; later episodes' kinds only in Encores.
  const placed = new Map<CrasherKind, number>()
  const scripts = [
    ...EPISODE_1.rooms.map((r) => r.script),
    ...Object.values(EPISODE_1.secrets),
  ]
  for (const loop of [1, 2, 3, 4])
    for (const script of scripts) {
      for (const wave of wavesAt(script, loop))
        if (!placed.has(wave.kind)) placed.set(wave.kind, loop)
      if (
        script.props?.some((p) => p.kind === 'camera') &&
        !placed.has('crane')
      )
        placed.set('crane', loop)
    }
  for (const kind of CRASHER_KINDS) {
    assert.ok(placed.has(kind), `${kind} appears in Opening Night`)
    if (ROSTER[kind].episode > 1)
      assert.ok(
        placed.get(kind)! >= 2,
        `${kind} (episode ${ROSTER[kind].episode}) debuts in an Encore`,
      )
  }
  assert.equal(placed.get('popper'), 1)
  assert.equal(placed.get('mascot'), 1, 'a mini-boss on the first pass')
}

// --- popper: swells, then bursts into a ring; popped at range it bursts far away ------------------
{
  const g = stage()
  const c = g.makeCrasher('popper', 160, 150)
  let swelled = false
  for (let t = 0; t < 200 && g.crashers.includes(c); t++) {
    safe(g)
    if (c.mode === 1) swelled = true
  }
  assert.ok(swelled, 'it swells first (the tell)')
  assert.ok(!g.crashers.includes(c), 'then bursts')
  assert.equal(
    g.streamers.filter((s) => s.style === 'shard').length,
    8,
    'a ring of eight',
  )
  const h = stage()
  const far = h.makeCrasher('popper', 60, 60)
  const score = h.score
  h.shots.push(shot(far.x, far.y))
  safe(h)
  assert.ok(!h.crashers.includes(far), 'one hit pops it')
  assert.ok(h.score > score, 'and pays')
  const shards = h.streamers.filter((s) => s.style === 'shard')
  assert.ok(
    shards.every((s) => Math.hypot(s.x - 160, s.y - 200) > 100),
    'far from Sparkle',
  )
}

// --- sweeper tank: its front plate turns confetti; its wand glows before a bubble burst --------
{
  const g = stage()
  const c = g.makeCrasher('tank', 160, 120)
  c.face = Math.PI / 2
  assert.ok(deflects(c, 0, -1), 'a shot flying at its face is turned')
  assert.ok(!deflects(c, 1, 0), 'one from the side is not')
  const hp = c.hp
  g.shots.push(shot(c.x, c.y, 0, -4))
  safe(g)
  assert.equal(c.hp, hp, 'CLANG: head-on does nothing')
  g.shots.push(shot(c.x, c.y, 4, 0))
  safe(g)
  assert.equal(c.hp, hp - 1, 'flank it')
  let tell = false
  let bubbles = 0
  for (let t = 0; t < 260 && !bubbles; t++) {
    safe(g)
    if (c.mode === 1) tell = true
    bubbles = g.streamers.filter((s) => s.style === 'bubble').length
  }
  assert.ok(tell && bubbles === 5, 'a charge, then five bubbles')
}

// Tank armor should not turn a room into an unwinnable countdown.
{
  const g = stage()
  const tank = g.makeCrasher('tank', 160, 120)
  tank.face = Math.PI / 2
  const fire = g as unknown as {
    hitCrasher(
      c: Crasher,
      damage: number,
      vx: number,
      vy: number,
      foamy: boolean,
    ): boolean
  }
  for (let hit = 0; hit < 4; hit++)
    assert.equal(fire.hitCrasher(tank, 1, 0, -4, false), false)
  assert.equal(tank.armorHitsLeft, 0, 'the fourth clang breaks the plate')
  for (let hit = 0; hit < ROSTER.tank.hp; hit++)
    assert.equal(fire.hitCrasher(tank, 1, 0, -4, false), true)
  assert.ok(!g.crashers.includes(tank), 'frontal shots now finish the tank')
}

// --- stagehand: crouches, then lays a mine, never in a doorway ----------------------------------
{
  const g = stage()
  const c = g.makeCrasher('stagehand', 100, 100)
  let crouched = false
  for (let t = 0; t < 400 && g.mines.length === 0; t++) {
    safe(g)
    if (c.mode === 1) crouched = true
  }
  assert.ok(crouched && g.mines.length === 1, 'a crouch, then a mine')
  const door = stage()
  const d = door.makeCrasher('stagehand', 160, 34)
  d.tx = 160
  d.ty = 34
  d.mode = 1
  d.clock = TELLS.stagehandCrouch - 1
  d.x = 160
  d.y = 34
  safe(door)
  assert.equal(door.mines.length, 0, 'not in the doorway')
}

// --- spotlight drone: a lock line, then a beam down it ----------------------------------------
{
  const g = stage()
  const c = g.makeCrasher('drone', 60, 60)
  for (let t = 0; t < 400 && c.mode !== 1; t++) safe(g)
  assert.equal(c.mode, 1, 'it locks on')
  const lock = { x: c.tx, y: c.ty }
  for (let t = 0; t < 60 && c.mode === 1; t++) safe(g)
  assert.equal(c.mode, 2, 'then fires')
  assert.deepEqual({ x: c.tx, y: c.ty }, lock, 'down the line it showed')
  const a = Math.atan2(c.ty - c.y, c.tx - c.x)
  g.invuln = 0
  g.px = c.x + Math.cos(a) * 60
  g.py = c.y + Math.sin(a) * 60
  const lives = g.lives
  g.update(emptyInput())
  assert.equal(g.lives, lives - 1, 'standing on the line costs a contestant')
  const h = stage()
  const e = h.makeCrasher('drone', 60, 60)
  for (let t = 0; t < 400 && e.mode !== 2; t++) safe(h)
  const b = Math.atan2(e.ty - e.y, e.tx - e.x)
  h.invuln = 0
  h.px = e.x + Math.cos(b) * 60 - Math.sin(b) * 30
  h.py = e.y + Math.sin(b) * 60 + Math.cos(b) * 30
  const before = h.lives
  h.update(emptyInput())
  assert.equal(h.lives, before, 'off the line is safe')
}

// --- mascot: stamps, charges, sees stars at the wall; hit its back (double while dizzy) ---------
{
  const g = stage()
  const c = g.makeCrasher('mascot', 160, 100)
  assert.ok(c.hp >= 16, 'a mini-boss')
  const order: number[] = []
  for (let t = 0; t < 600 && !order.includes(3); t++) {
    g.px = 160
    g.py = 200
    safe(g)
    if (order[order.length - 1] !== c.mode) order.push(c.mode)
  }
  assert.deepEqual(
    order.slice(0, 4),
    [0, 1, 2, 3],
    'walk, stamp, charge, dizzy',
  )
  const hp = c.hp
  g.shots.push(shot(c.x, c.y, -Math.cos(c.face) * 4, -Math.sin(c.face) * 4))
  safe(g)
  assert.equal(c.hp, hp - 2, 'dizzy: every hit counts double')
  c.mode = 0
  c.face = Math.PI / 2
  const hp2 = c.hp
  g.shots.push(shot(c.x, c.y, 0, -4))
  safe(g)
  assert.equal(c.hp, hp2, 'awake, its belly bounces confetti')
}

// --- pie chef: raises a pie, lobs it where Sparkle stood; the cream is slippery --------------------
{
  const g = stage()
  const c = g.makeCrasher('chef', 60, 60)
  for (let t = 0; t < 300 && !g.lobs.length; t++) safe(g)
  assert.equal(g.lobs.length, 1, 'a pie in the air')
  const lob = g.lobs[0]!
  assert.ok(
    Math.hypot(lob.x1 - 160, lob.y1 - 200) < 2,
    'aimed where Sparkle stood',
  )
  assert.ok(c.mode === 0)
  g.invuln = 0
  for (let t = 0; t < 60 && g.lobs.length; t++) {
    g.px = 160
    g.py = 200
    g.update(emptyInput())
  }
  assert.ok(g.lives < 3, 'standing under it gets you pied')
  assert.ok(
    g.slicks.some((s) => s.kind === 'cream'),
    'cream on the floor',
  )
  const slip = stage()
  slip.slicks.push({ x: 100, y: 128, r: 16, kind: 'cream', life: 400 } as never)
  slip.px = 96
  slip.py = 128
  const right = emptyInput()
  right.held.right = true
  safe(slip, 20, right)
  const x = slip.px
  safe(slip, 6)
  assert.ok(slip.px > x + 1, 'in the cream she keeps sliding')
}

// --- egg-timer bot: hatches at zero unless cheered first ------------------------------------------
{
  const g = stage()
  const c = g.makeCrasher('timer', 100, 100)
  safe(g, TELLS.timerFuse + 2)
  assert.ok(!g.crashers.includes(c))
  assert.equal(
    g.crashers.filter((o) => o.kind === 'grabber' && o.extra).length,
    4,
    'a clutch of four',
  )
  const h = stage()
  const d = h.makeCrasher('timer', 100, 100)
  safe(h, TELLS.timerFuse - 30)
  for (let i = 0; i < d.maxHp; i++) {
    h.shots.push(shot(d.x, d.y))
    safe(h)
  }
  safe(h, 40)
  assert.equal(h.crashers.length, 0, 'cheered in time, nothing hatches')
}

// --- meatball roller: revs on the spot, then rolls a straight line and ricochets ---------------------
{
  const g = stage()
  const c = g.makeCrasher('meatball', 60, 200)
  for (let t = 0; t < 30; t++) {
    safe(g)
    assert.equal(c.mode, 0, 'revving')
  }
  for (let t = 0; t < 30 && c.mode === 0; t++) safe(g)
  assert.equal(c.mode, 1, 'then rolls')
  assert.ok(c.vx === 0 || c.vy === 0, 'along one axis')
  assert.ok(c.vx > 0, 'toward Sparkle')
  for (let t = 0; t < 600 && c.mode === 1; t++) safe(g)
  assert.equal(c.mode, 0, 'three bounces and it stops to rev again')
}

// --- roadie: a flight case that stops confetti and Sparkle, and stays as cover --------------------
{
  const g = stage()
  const c = g.makeCrasher('roadie', 160, 60)
  safe(g, 2)
  assert.equal(g.cases.length, 1, 'it brings a flight case')
  const box = g.cases[0]!
  const hp = c.hp
  g.shots.push(shot(box.x, box.y))
  safe(g)
  assert.equal(c.hp, hp, 'the case stops confetti')
  g.streamers.push({
    x: box.x,
    y: box.y,
    vx: 0,
    vy: 0,
    life: 50,
    style: 'streamer',
  } as never)
  safe(g)
  assert.ok(
    !g.streamers.some((s) => s.x === box.x && s.y === box.y),
    'and streamers',
  )
  g.px = box.x
  g.py = box.y
  safe(g)
  assert.ok(
    Math.abs(g.px - box.x) >= 11 || Math.abs(g.py - box.y) >= 6,
    'Sparkle cannot stand inside one',
  )
  for (let i = 0; i < hp; i++) {
    g.shots.push(shot(c.x, c.y))
    safe(g)
  }
  assert.ok(!g.crashers.includes(c))
  assert.equal(g.cases.length, 1, 'the case stays as cover')
  assert.equal(box.pushed, false)
}

// --- stage diver: untouchable in the air, lands where its shadow grew; the landing rings out --------
{
  const g = stage()
  const c = g.makeCrasher('diver', 60, 120)
  for (let t = 0; t < 200 && c.mode !== 1; t++) safe(g)
  assert.equal(c.mode, 1)
  const target = { x: c.tx, y: c.ty }
  safe(g, 20)
  assert.ok(c.z > 6, 'up in the air')
  const hp = c.hp
  g.shots.push(shot(c.x, c.y - c.z))
  g.shots.push(shot(c.x, c.y))
  safe(g)
  assert.equal(c.hp, hp, 'confetti passes under it')
  g.invuln = 0
  g.px = target.x + 10
  g.py = target.y
  for (let t = 0; t < 60 && c.mode === 1; t++) {
    g.update(emptyInput())
    if (g.lives < 3) break
    g.px = target.x + 10
    g.py = target.y
  }
  assert.ok(
    Math.hypot(c.x - target.x, c.y - target.y) < 2,
    'it lands on its shadow',
  )
  assert.ok(g.lives < 3, 'the landing ring catches Sparkle close by')
}

// --- heckler: raises its megaphone, then the crowd round it is pumped and faster -----------------
{
  const g = stage()
  const c = g.makeCrasher('heckler', 160, 80)
  const pal = g.makeCrasher('grabber', 180, 90)
  const calm = g.pace(pal)
  let raised = false
  for (let t = 0; t < 300 && pal.pumped === 0; t++) {
    g.px = 160
    g.py = 200
    safe(g)
    pal.x = c.x + 20
    pal.y = c.y + 10
    if (c.mode === 1) raised = true
  }
  assert.ok(raised, 'the megaphone goes up first')
  assert.ok(pal.pumped > 0, 'its neighbours are pumped')
  assert.ok(g.pace(pal) > calm, 'and faster')
}

// --- saucer cam: beams the nearest prize away; cheer it mid-beam and the prize drops back ---------
{
  const g = stage()
  g.prizes.push({
    x: 100,
    y: 100,
    kind: 'car',
    life: 9999,
    lift: 0,
    pedestal: true,
  } as never)
  const c = g.makeCrasher('saucer', 140, 100)
  for (let t = 0; t < 300 && c.mode !== 1; t++) safe(g)
  assert.equal(c.mode, 1, 'it hovers over the prize and beams it')
  safe(g, 30)
  assert.ok(g.prizes[0]!.lift > 0, 'the prize rises')
  for (let i = 0; i < c.maxHp; i++) {
    g.shots.push(shot(c.x, c.y - c.z))
    safe(g)
  }
  assert.ok(!g.crashers.includes(c))
  assert.equal(g.prizes.length, 1, 'the prize is saved')
  assert.equal(g.prizes[0]!.lift, 0, 'and drops back')
  const h = stage()
  h.prizes.push({
    x: 100,
    y: 100,
    kind: 'car',
    life: 9999,
    lift: 0,
    pedestal: true,
  } as never)
  h.makeCrasher('saucer', 100, 100)
  safe(h, 200)
  assert.equal(h.prizes.length, 0, 'left alone, it is beamed away')
}

// --- mirror clone: Sparkle's moves, a beat late ---------------------------------------------------
{
  const g = stage()
  g.px = 100
  g.py = 150
  const c = g.makeCrasher('clone', 200, 60)
  const right = emptyInput()
  right.held.right = true
  safe(g, 20, right)
  assert.ok(Math.abs(c.x - 200) < 0.01, 'nothing yet')
  safe(g, TELLS.cloneBeat, right)
  assert.ok(c.x > 205, 'then it walks the way Sparkle walked')
  const x = c.x
  safe(g, TELLS.cloneBeat + 2)
  assert.ok(c.x > x, 'still copying, a beat behind')
  const stop = c.x
  safe(g, 3)
  assert.equal(c.x, stop, 'and stops a beat after she did')
}

// --- fluffball: swells and splits if left alone, up to a cap ------------------------------------------
{
  const g = stage()
  g.makeCrasher('fluffball', 100, 100)
  safe(g, TELLS.fluffEvery + TELLS.fluffSwell + 5)
  assert.equal(
    g.crashers.filter((c) => c.kind === 'fluffball').length,
    2,
    'it splits',
  )
  safe(g, 60 * 60)
  const n = g.crashers.filter((c) => c.kind === 'fluffball').length
  assert.ok(n <= TELLS.fluffCap && n > 4, `they multiply, to a cap (${n})`)
}

// --- the boom mic: a shadow, then it lifts Sparkle away a moment (and sets her down) --------------
{
  const g = stage('conga-line', 0)
  assert.equal(g.booms.length, 1)
  g.px = 120
  g.py = 140
  const lives = g.lives
  for (let t = 0; t < 600 && g.lifted === 0; t++) {
    g.update(emptyInput())
    g.px = 120
    g.py = 140
  }
  assert.ok(g.lifted > 0, 'standing in its shadow, up she goes')
  assert.equal(g.lives, lives, 'no contestant lost')
  for (let t = 0; t < 80 && g.lifted > 0; t++) g.update(emptyInput())
  assert.equal(g.lifted, 0, 'and down again')
  const h = stage('conga-line', 0)
  let told = false
  for (let t = 0; t < 600; t++) {
    h.update(emptyInput())
    const u = h.boomTell(h.booms[0]!)
    if (u !== null) told = true
    if (u !== null && u > 0.5) {
      h.px = 40
      h.py = 60
    }
  }
  assert.ok(told, 'it always shows its shadow first')
  assert.equal(h.lifted, 0, 'stepping out of it is enough')
}

// --- the arsenal -----------------------------------------------------------------------------------
{
  assert.equal(POWER_KINDS.length, 10)
  for (const kind of POWER_KINDS) {
    assert.ok(POWERS[kind].cap >= POWERS[kind].ticks)
    assert.equal(stackPower(kind, 0), POWERS[kind].ticks)
    assert.equal(
      stackPower(kind, POWERS[kind].cap),
      POWERS[kind].cap,
      'stacks to a cap',
    )
  }
  const rolled = new Set<PowerKind>()
  for (let i = 0; i < 1000; i++) rolled.add(powerFromRoll(i / 1000))
  assert.equal(rolled.size, 10, 'every power-up can drop')

  // Picking one up twice stacks its clock; several run at once.
  const g = stage()
  g.prizes.push({
    x: g.px,
    y: g.py,
    kind: 'rockets',
    life: 99,
    lift: 0,
  } as never)
  safe(g)
  const once = g.powers.rockets
  g.prizes.push({
    x: g.px,
    y: g.py,
    kind: 'rockets',
    life: 99,
    lift: 0,
  } as never)
  g.prizes.push({
    x: g.px,
    y: g.py,
    kind: 'skates',
    life: 99,
    lift: 0,
  } as never)
  safe(g)
  assert.ok(g.powers.rockets > once + POWERS.rockets.ticks - 5, 'stacked')
  assert.ok(g.powers.skates > 0, 'and alongside another')
  g.render(g2d)

  // Spread: three streams. Rapid: a quicker cannon.
  const s = stage()
  s.powers.spread = 300
  safe(s, 1, aimAt(0, -1))
  assert.equal(s.shots.length, 3)
  s.powers.rapid = 300
  s.fireCooldown = 0
  safe(s, 1, aimAt(0, -1))
  assert.equal(s.fireCooldown, ARSENAL.rapidCooldown)

  // Bubble rockets: slow, double damage, straight through a line of crashers.
  const r = stage()
  r.powers.rockets = 300
  const line = [0, 1, 2].map((i) => r.makeCrasher('thrower', 160, 150 - i * 20))
  for (const c of line) c.t = 1
  for (let t = 0; t < 60; t++) {
    safe(r, 1, aimAt(0, -1))
    for (const c of line) {
      c.x = 160
      c.t = 1
    }
    line.forEach((c, i) => (c.y = 150 - i * 20))
    if (t === 0) r.fireCooldown = 999
  }
  assert.ok(
    line.every((c) => c.hp === c.maxHp - 2),
    'one rocket hits all three, twice as hard',
  )

  // Glitter laser: a line to the wall that hits everything on it at once.
  const l = stage()
  l.powers.laser = 300
  const row = [0, 1, 2].map((i) => l.makeCrasher('thrower', 160, 160 - i * 30))
  l.update(aimAt(0, -1))
  assert.ok(
    row.every((c) => c.hp === c.maxHp - 1),
    'the beam hits the whole line',
  )
  assert.equal(l.glitter.length, 1)
  const blocked = stage()
  blocked.powers.laser = 300
  blocked.cases.push({ x: 160, y: 170, vx: 0, vy: 0, pushed: false } as never)
  const hiding = blocked.makeCrasher('thrower', 160, 120)
  blocked.update(aimAt(0, -1))
  assert.equal(hiding.hp, hiding.maxHp, 'a flight case stops it')

  // Foam cannon: slows what it hits and foams the floor.
  const f = stage()
  f.powers.foamgun = 300
  const target = f.makeCrasher('grabber', 160, 150)
  target.hp = 5
  const calm = f.pace(target)
  for (let t = 0; t < 20 && target.slow === 0; t++) safe(f, 1, aimAt(0, -1))
  assert.ok(target.slow > 0 && f.pace(target) < calm, 'slowed')
  assert.ok(
    f.slicks.some((sl) => sl.kind === 'foam'),
    'foam on the floor',
  )

  // Party poppers: a lob that bursts over a crowd ahead (and ignores plates).
  const p = stage()
  p.powers.poppers = 300
  const tank = p.makeCrasher('tank', 160, 200 - ARSENAL.popperRange)
  tank.face = Math.PI / 2
  safe(p, 1, aimAt(0, -1))
  assert.ok(
    p.lobs.some((lob) => lob.kind === 'popper'),
    'a popper in the air',
  )
  const hp = tank.hp
  for (let t = 0; t < ARSENAL.popperFlight + 2; t++) {
    p.update(emptyInput())
    tank.x = 160
    tank.y = 200 - ARSENAL.popperRange
  }
  assert.ok(tank.hp <= hp - ARSENAL.popperDamage, 'the burst lands from above')

  // Streamer orbiters: two ribbons that cheer what they brush and stop streamers.
  const o = stage()
  o.powers.orbiters = 300
  const spots = o.orbiterSpots()
  assert.equal(spots.length, 2)
  const brushed = o.makeCrasher('thrower', spots[0]!.x, spots[0]!.y + 0)
  let hurt = false
  for (let t = 0; t < 30 && !hurt; t++) {
    const spot = o.orbiterSpots()[0]!
    brushed.x = spot.x
    brushed.y = spot.y
    safe(o)
    hurt = brushed.hp < brushed.maxHp
  }
  assert.ok(hurt, 'an orbiter cheers what it brushes')

  // Roller skates: half as fast again.
  const k = stage()
  const right = emptyInput()
  right.held.right = true
  k.px = 100
  safe(k, 10, right)
  const plain = k.px - 100
  const k2 = stage()
  k2.powers.skates = 300
  k2.px = 100
  safe(k2, 10, right)
  assert.ok(Math.abs((k2.px - 100) / plain - ARSENAL.skateSpeed) < 0.01)

  // Cardboard cutout: the crowd chases the decoy instead of Sparkle, until it wears out.
  const d = stage()
  d.px = 60
  d.py = 200
  d.placeDecoy()
  d.decoy!.x = 260
  d.decoy!.y = 60
  d.px = 60
  d.py = 200
  const fan = d.makeCrasher('grabber', 160, 128)
  safe(d, 40)
  assert.ok(fan.x > 170 && fan.y < 120, 'the grabber heads for the cutout')
  safe(d, POWERS.cutout.ticks)
  assert.equal(d.decoy, null, 'and the cutout wears out')
  assert.equal(d.powers.cutout, 0)
}

// --- twin-stick play --------------------------------------------------------------------------------
{
  // The stick aims and sprays on its own; moving no longer turns the cannon.
  const g = stage()
  const frame = aimAt(1, 0)
  frame.held.up = true
  safe(g, 1, frame)
  assert.ok(g.shots.length > 0, 'aiming sprays without A')
  assert.ok(
    g.shots.every((s) => s.vx > 0 && Math.abs(s.vy) < 0.01),
    'the way the stick points',
  )
  assert.ok(g.aim.x > 0.99, 'walking up keeps the aim')
  // Off the stick, the classic controls: movement aims, B locks it.
  const h = stage()
  const walk = emptyInput()
  walk.held.left = true
  safe(h, 1, walk)
  assert.deepEqual(h.aim, { x: -1, y: 0 })
  const lock = emptyInput()
  lock.held.up = true
  lock.held.b = true
  safe(h, 1, lock)
  assert.deepEqual(h.aim, { x: -1, y: 0 }, 'hold B to lock the aim')
  // Analog aim lands between the eight ways.
  const a = stage()
  safe(a, 1, aimAt(1, 0.3))
  assert.ok(
    a.shots.length && Math.abs(a.shots[0]!.vy / a.shots[0]!.vx - 0.3) < 0.01,
  )

  // On the map, a flick of the stick picks a door like the d-pad.
  const m = fresh(5)
  m.openMap(0)
  for (let t = 0; t < 40; t++) m.update(emptyInput())
  const before = m.map!.options[m.map!.cursor]!.side
  const flick = before === 0 ? aimAt(0, 1) : aimAt(0, -1)
  m.update(flick)
  assert.notEqual(
    m.map!.options[m.map!.cursor]!.side,
    before,
    'a flick moves the cursor',
  )
  m.update(flick)
  const held = m.map!.cursor
  m.update(flick)
  assert.equal(m.map!.cursor, held, 'holding the stick is one press, not many')

  // The attract pilot aims with the second stick.
  const demo = create({
    rng: mulberry32(2),
    sound: { play: () => {} },
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  let aimed = false
  for (let t = 0; t < 600 && !aimed; t++) {
    demo.update(emptyInput())
    if (!demo.map && demo.crashers.length)
      aimed = demo.demoInput().aim !== undefined
  }
  assert.ok(aimed, 'the pilot plays twin-stick')
}

// --- seed replay with a second stick, and every new crasher on screen ----------------------------
{
  const play = (seed: number) => {
    const g = fresh(seed)
    g.modifiers.set('surprise-guests', null)
    g.enterRoom('surprise-guests', 3)
    const trace: number[] = []
    for (let t = 0; t < 60 * 50 && !g.over; t++) {
      const frame = aimAt(Math.cos(t / 40), Math.sin(t / 55))
      frame.held.left = t % 300 < 80
      frame.held.down = t % 260 > 150
      g.update(frame)
      if (t % 90 === 0) {
        trace.push(g.score, g.lives, Math.round(g.px), g.crashers.length)
        g.render(g2d)
      }
    }
    return trace
  }
  assert.deepEqual(play(17), play(17), 'the same seed and stick replay exactly')

  const g = stage()
  for (const kind of CRASHER_KINDS)
    g.makeCrasher(
      kind,
      40 + (CRASHER_KINDS.indexOf(kind) % 8) * 32,
      60 + Math.floor(CRASHER_KINDS.indexOf(kind) / 8) * 50,
    )
  for (const kind of POWER_KINDS) g.powers[kind] = 200
  g.placeDecoy()
  for (let t = 0; t < 600; t++) {
    safe(g)
    if (t % 25 === 0) g.render(g2d)
  }
  assert.ok(
    Number.isFinite(g.score) && g.score >= 0,
    'all of them at once, drawn and played',
  )
}

console.log('verifyPrizeShowPanicRoster: ok')
