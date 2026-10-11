// Prize Show Panic depth slice 4 (conductor kr-arcade/t-029): episodes 2 and 3 (Cooking Showdown,
// Countdown Concert), each set's hazards (hot plates, conveyor counters, flour clouds; the concert's
// beat, speaker stacks and their bass rings, strobes and mosh pits), each set's music, and the five
// new bosses (the Big Wobble, the Pie Cart, the Souffle Supreme, the Mosh Mascot, the Jumbotron),
// each pinned on a staged room; then a deterministic campaign through all three episodes.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseLoop } from '../arcade/sound'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/prizeShowPanic'
import {
  BOSS,
  SHOCK_SPEED,
  bossTargets,
  liveParts,
  screenSpot,
} from '../arcade/prizeShow/bosses'
import type { Boss } from '../arcade/prizeShow/bosses'
import {
  BELT_SPEED,
  FLOUR,
  HOTPLATE,
  MOSH,
  RING,
  beatPhase,
  beltPush,
  inGap,
  newRing,
  pitShove,
  plateState,
  ringHits,
  ringLive,
  speakerFires,
  speakerGap,
  speakerUntil,
} from '../arcade/prizeShow/hazards'
import type { Flour, Ring } from '../arcade/prizeShow/hazards'
import { ALL_MUSIC, BOSS_MUSIC, SET_MUSIC } from '../arcade/prizeShow/music'
import {
  CONCERT_BEAT,
  EPISODE_1,
  EPISODE_2,
  EPISODE_3,
  SEASON,
  roomById,
  seasonTickets,
} from '../arcade/prizeShow/season'
import type {
  BossKind,
  HotPlateProp,
  ModifierId,
  Side,
  SpeakerProp,
} from '../arcade/prizeShow/season'
import type { Crasher } from '../arcade/prizeShow/roster'
import { CX, CY, SPEED } from '../arcade/prizeShow/stage'

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
  dead: number
  px: number
  py: number
  invuln: number
  roomTick: number
  roomId: string
  loop: number
  episodeIndex: number
  modifiers: Map<string, ModifierId | null>
  waves: unknown[]
  crashers: Crasher[]
  streamers: Array<Point & { style: string }>
  shots: Shot[]
  mines: unknown[]
  prizes: Array<
    Point & { kind: string; life: number; pedestal?: boolean; lift: number }
  >
  lobs: Array<{ kind: string; x1: number; y1: number }>
  slicks: Array<Point & { kind: string }>
  plates: HotPlateProp[]
  flours: Flour[]
  speakers: SpeakerProp[]
  rings: Ring[]
  boss: Boss | null
  banner: { text: string } | null
  tally: unknown
  swap: unknown
  map: unknown
  twistClock: number
  music: unknown
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  beginEpisode(index: number): void
  enterRoom(id: string, entry: Side): void
  removeCrasher(c: Crasher): void
  beat(): number
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

/** A room of episode `episode` (0-based) with its own script stopped, so tests count their own. */
function stage(episode: number, id: string, entry: Side = 3, seed = 3): Inner {
  const g = fresh(seed)
  g.beginEpisode(episode)
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
  g.twistClock = 1e9
  return g
}

function safe(g: Inner, n = 1, input: InputFrame = emptyInput()) {
  for (let i = 0; i < n; i++) {
    g.invuln = 1000
    g.update(input)
  }
}

function shot(at: Point): Shot {
  return {
    x: at.x,
    y: at.y,
    vx: 0,
    vy: 0,
    life: 5,
    hue: 0,
    kind: 'confetti',
    foamy: false,
    damage: 1,
    pierce: 0,
    hits: [],
  }
}

/** One confetti hit on a target of the boss (a part by index, or the body: -1). */
function hit(g: Inner, part: number) {
  const t = bossTargets(g.boss!).find((target) => target.part === part)
  assert.ok(t, `target ${part} is there to hit`)
  g.shots.push(shot(t))
  safe(g)
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

// --- the season: three authored episodes on three sets ---------------------------------------------
{
  assert.deepEqual(
    SEASON.map((ep) => ep.title),
    [
      'OPENING NIGHT',
      'COOKING SHOWDOWN',
      'COUNTDOWN CONCERT',
      'GALAXY PARADE',
      'THE LIVE FINALE',
    ],
  )
  assert.deepEqual(
    SEASON.map((ep) => ep.set),
    ['studio', 'kitchen', 'concert', 'galaxy', 'studio'],
  )
  const bosses = (ep: typeof EPISODE_1) => [
    roomById(ep, ep.midBoss).script.boss!.kind,
    roomById(ep, ep.finale).script.boss!.kind,
  ]
  assert.deepEqual(bosses(EPISODE_1), ['float', 'wobble'])
  assert.deepEqual(bosses(EPISODE_2), ['piecart', 'souffle'])
  assert.deepEqual(bosses(EPISODE_3), ['mosh', 'jumbotron'])
  for (const ep of SEASON)
    for (const id of [ep.midBoss, ep.finale].filter(Boolean)) {
      const room = roomById(ep, id)
      assert.ok(room.script.boss!.line.length > 10, `${room.id}: an intro line`)
    }
  const ids = seasonTickets()
  assert.equal(new Set(ids).size, 12, 'three golden tickets in each episode')
  // Each set's hazards are on its own soundstage.
  const kinds = (ep: typeof EPISODE_1) =>
    new Set(
      [...ep.rooms.map((r) => r.script), ...Object.values(ep.secrets)].flatMap(
        (s) => (s.props ?? []).map((p) => p.kind),
      ),
    )
  for (const kind of ['hotplate', 'belt', 'flour'])
    assert.ok(kinds(EPISODE_2).has(kind as never), `the kitchen has ${kind}`)
  for (const kind of ['speaker', 'mosh'])
    assert.ok(kinds(EPISODE_3).has(kind as never), `the concert has ${kind}`)
  for (const room of EPISODE_3.rooms)
    assert.equal(room.script.beat, CONCERT_BEAT, `${room.id} keeps the beat`)
  // Their kinds of crasher are at home here now.
  const crashers = (ep: typeof EPISODE_1) =>
    new Set(ep.rooms.flatMap((r) => r.script.waves.map((w) => w.kind)))
  for (const kind of ['chef', 'timer', 'meatball'] as const)
    assert.ok(crashers(EPISODE_2).has(kind), `${kind} in the kitchen`)
  for (const kind of ['roadie', 'diver', 'heckler'] as const)
    assert.ok(crashers(EPISODE_3).has(kind), `${kind} at the concert`)
}

// --- music -----------------------------------------------------------------------------------------
{
  for (const loop of ALL_MUSIC) {
    const parsed = parseLoop(loop)
    assert.ok(parsed.notes.length > 20, 'a real tune')
    assert.equal(parsed.length, 64, 'eight bars of eight steps')
  }
  // The concert's loop is the concert's beat: a beat every CONCERT_BEAT ticks at 60 Hz.
  assert.equal((60 * 60) / SET_MUSIC.concert.bpm, CONCERT_BEAT)
  const g = stage(1, 'hot-plates')
  assert.equal(g.music, SET_MUSIC.kitchen, 'the kitchen plays its loop')
  const boss = stage(1, 'pie-cart')
  assert.equal(boss.music, BOSS_MUSIC, 'the boss theme on a boss stage')
  const a = stage(2, 'front-row')
  const first = a.music
  assert.equal((first as { bpm: number }).bpm, SET_MUSIC.concert.bpm)
  a.enterRoom('the-pit', 3)
  assert.notEqual(
    a.music,
    first,
    'a concert room restarts its loop on the beat',
  )
  assert.equal(fresh(3, true).music, null, 'no music in the attract demo')
}

// --- hazards: the pure rules -------------------------------------------------------------------------
{
  const plate: HotPlateProp = {
    kind: 'hotplate',
    x: 48,
    y: 48,
    w: 32,
    h: 32,
    every: 240,
    offset: 0,
  }
  const states = new Set<string>()
  let last = ''
  const order: string[] = []
  for (let t = 0; t < 240; t++) {
    const { state } = plateState(plate, t)
    states.add(state)
    if (state !== last) order.push(state)
    last = state
  }
  assert.deepEqual(
    order,
    ['cold', 'glow', 'hot'],
    'cold, then the glow, then the sizzle',
  )
  assert.equal(plateState(plate, 240 - HOTPLATE.sizzle).state, 'hot')
  assert.equal(plateState(plate, 240 - HOTPLATE.sizzle - 1).state, 'glow')

  const belts = [{ kind: 'belt', x: 0, y: 0, w: 32, h: 16, dir: 1 }] as const
  assert.deepEqual(beltPush(belts, 10, 8), { x: BELT_SPEED, y: 0 })
  assert.deepEqual(beltPush(belts, 10, 20), { x: 0, y: 0 })

  // A ring's gap is safe; its edge is not; past its live share it is only a ripple.
  const ring = newRing(100, 100, 96, RING.speakerSpeed, 0)
  ring.r = 40
  assert.ok(inGap(ring, 140, 100), 'the gap faces right')
  assert.ok(!ringHits(ring, 140, 100), 'safe in the gap')
  assert.ok(ringHits(ring, 60, 100), 'caught on the far side')
  assert.ok(!ringHits(ring, 80, 100), 'safe inside it')
  ring.r = 96 * RING.live + 1
  assert.ok(!ringLive(ring) && !ringHits(ring, 100 - ring.r, 100))
  assert.ok(SHOCK_SPEED < SPEED, "a boss's shockwave can always be outrun")
  assert.ok(RING.speakerSpeed < SPEED, 'and so can the bass')

  // Speakers thump on their beats, pump first, and move their gap round.
  const sp: SpeakerProp = { kind: 'speaker', x: 26, y: 42, beats: 4, offset: 1 }
  const fires: number[] = []
  for (let t = 1; t <= 600; t++) if (speakerFires(sp, t, 30)) fires.push(t)
  assert.deepEqual(
    fires.slice(0, 3),
    [90, 210, 330],
    'every four beats, a beat in',
  )
  assert.equal(speakerUntil(sp, 70, 30), 20)
  assert.notEqual(speakerGap(sp, 0), speakerGap(sp, 1), 'the gap moves')
  assert.ok(
    Math.abs(speakerGap(sp, 0) - Math.atan2(CY - sp.y, CX - sp.x)) < 1e-9,
    'first toward the middle',
  )

  // A mosh pit swirls hardest on the beat.
  const pits = [{ x: 100, y: 100, r: 30, spin: 1 as const }]
  const onBeat = pitShove(pits, 120, 100, 60, 30)
  const offBeat = pitShove(pits, 120, 100, 89, 30)
  assert.ok(Math.hypot(onBeat.x, onBeat.y) > Math.hypot(offBeat.x, offBeat.y))
  assert.ok(onBeat.y > 0, 'spinning one way')
  assert.ok(
    Math.hypot(onBeat.x, onBeat.y) <= MOSH.swirl + MOSH.beatBoost + MOSH.out,
  )
  assert.ok(
    Math.hypot(onBeat.x, onBeat.y) < SPEED,
    'never stronger than Sparkle',
  )
  assert.deepEqual(pitShove(pits, 200, 100, 60, 30), { x: 0, y: 0 })
  assert.equal(beatPhase(60, 30), 0)
}

// --- hazards in the kitchen ----------------------------------------------------------------------------
{
  // A hot plate sizzles whoever stands on it, but the glow is only a warning.
  const g = stage(1, 'hot-plates')
  const plate = g.plates[0]!
  g.px = plate.x + plate.w / 2
  g.py = plate.y + plate.h / 2
  const glowAt =
    plate.every - HOTPLATE.sizzle - HOTPLATE.glow + 5 - plate.offset
  g.roomTick = glowAt - 1
  g.invuln = 0
  const lives = g.lives
  g.update(emptyInput())
  assert.equal(plateState(plate, g.roomTick).state, 'glow')
  assert.equal(g.lives, lives, 'the glow is a tell')
  g.roomTick = plate.every - HOTPLATE.sizzle + 3 - plate.offset
  g.invuln = 0
  g.update(emptyInput())
  assert.equal(g.lives, lives - 1, 'the sizzle is not')
  assert.equal(g.banner?.text, 'SIZZLED!')
  g.render(g2d)

  // The counters carry Sparkle and anything loose on them.
  const c = stage(1, 'the-conveyor')
  c.px = 60
  c.py = 70
  const x0 = c.px
  safe(c, 10)
  assert.ok(Math.abs(c.px - (x0 + 10 * BELT_SPEED)) < 0.01, 'carried right')
  c.prizes.push({ x: 220, y: 72, kind: 'cash', life: 400, lift: 0 })
  safe(c, 10)
  assert.ok(c.prizes[0]!.x < 220, 'a prize rides the other way')
  c.render(g2d)

  // Flour clouds drift, thin as confetti flies through, and thicken again.
  const f = stage(1, 'flour-power')
  const cloud = f.flours[0]!
  safe(f)
  const before = cloud.density
  for (let i = 0; i < 10; i++) {
    f.shots.push(shot(cloud))
    safe(f)
  }
  assert.ok(cloud.density < before - 5 * FLOUR.thin, 'thinned out')
  safe(f, 6)
  const thin = cloud.density
  safe(f, 60)
  assert.ok(cloud.density > thin, 'and thickens again')
  assert.ok(cloud.x !== cloud.x0 || cloud.y !== cloud.y0, 'drifting')
  f.render(g2d)
}

// --- hazards at the concert ----------------------------------------------------------------------------
{
  // A speaker thumps a ring on its beat; the edge bonks, the gap is safe.
  const g = stage(2, 'front-row')
  assert.equal(g.beat(), CONCERT_BEAT)
  const sp = g.speakers.find((s) => s.offset === 3)!
  safe(g, 3 * CONCERT_BEAT - 1)
  assert.equal(g.rings.length, 0)
  safe(g)
  assert.equal(g.rings.length, 2, 'two stacks thump on the same beat')
  const ring = g.rings.find((r) => r.x === sp.x && r.y === sp.y)!
  assert.notEqual(ring.gap, null)
  safe(g, 20)
  const out = ring.gap! + Math.PI
  // Put Sparkle on the edge where there is no gap... (inside the floor)
  const edge = (a: number) => ({
    x: ring.x + Math.cos(a) * ring.r,
    y: ring.y + Math.sin(a) * ring.r,
  })
  let spot = edge(ring.gap! + 1.2)
  if (spot.x < 20 || spot.y < 36) spot = edge(ring.gap! - 1.2)
  g.px = spot.x
  g.py = spot.y
  g.invuln = 0
  g.dead = 0
  const lives = g.lives
  g.update(emptyInput())
  assert.equal(g.lives, lives - 1, 'caught by the bass')
  assert.equal(g.banner?.text, 'BLOWN AWAY BY THE BASS!')
  void out

  const gap = stage(2, 'front-row')
  safe(gap, 3 * CONCERT_BEAT + 20)
  const r2 = gap.rings.find((r) => r.x === sp.x && r.y === sp.y)!
  gap.px = r2.x + Math.cos(r2.gap!) * (r2.r + r2.speed)
  gap.py = r2.y + Math.sin(r2.gap!) * (r2.r + r2.speed)
  gap.invuln = 0
  const l2 = gap.lives
  gap.update(emptyInput())
  assert.equal(gap.lives, l2, 'slipped through the gap')
  gap.render(g2d)

  // A mosh pit swirls Sparkle round.
  const p = stage(2, 'the-pit')
  p.px = 100 + 20
  p.py = 96
  safe(p, 5)
  assert.ok(p.py !== 96, 'swept round')
  p.render(g2d)

  // The strobe draws (dark between beats, a flash on them).
  const s = stage(2, 'strobe-storm')
  for (let i = 0; i < 30; i++) {
    safe(s)
    s.render(g2d)
  }
}

// --- the Big Wobble -----------------------------------------------------------------------------------
{
  const g = stage(0, 'grand-finale')
  const b = g.boss!
  assert.equal(b.kind, 'wobble')
  assert.equal(liveParts(b, 'arm').length, 2)
  assert.equal(liveParts(b, 'leg').length, 2)
  safe(g)
  // A limb is its own target: popping it is worth a callout and takes its share off the boss.
  const hp = b.hp
  b.parts[0]!.hp = 1
  hit(g, 0)
  assert.ok(b.parts[0]!.gone, 'the left arm popped')
  assert.equal(b.hp, hp - 1)
  assert.equal(g.banner?.text, 'ARM POPPED!')
  // The other arm still slams: a tell over Sparkle's spot, then the slam and its shockwave.
  b.atk = 1
  b.tell = 0
  safe(g)
  assert.equal(b.arm, 1, 'the arm that is left')
  assert.ok(b.tell > 0)
  const spot = { x: b.aimX, y: b.aimY }
  safe(g, BOSS.wobble.slamTell)
  assert.ok(
    g.rings.some((r) => r.gap === null && r.x === spot.x && r.y === spot.y),
  )
  // Both arms gone: no more slams.
  b.parts[1]!.hp = 1
  hit(g, 1)
  for (let i = 0; i < 400; i++) {
    safe(g)
    assert.equal(b.tell, 0, 'no arms, no slams')
  }
  // A leg gone: it hops (up in the air), and lands in a ring.
  b.parts[2]!.hp = 1
  hit(g, 2)
  assert.equal(g.banner?.text, 'LEG POPPED!')
  let hopped = false
  let landed = false
  for (let i = 0; i < 300 && !landed; i++) {
    const was = b.mode
    safe(g)
    if (b.mode === 1 && b.z > 10) hopped = true
    if (was === 1 && b.mode === 0) landed = g.rings.length > 0
  }
  assert.ok(hopped && landed, 'it hops and lands in a ring')
  g.render(g2d)
  // Down to nothing: the episode's wrap.
  b.hp = 1
  hit(g, -1)
  assert.equal(g.boss, null)
  assert.equal(g.banner?.text, 'ALL DEFLATED!')
}

// --- the Pie Cart -----------------------------------------------------------------------------------------
{
  const g = stage(1, 'pie-cart')
  const b = g.boss!
  assert.equal(b.kind, 'piecart')
  const cfg = BOSS.piecart
  for (let i = 0; i < 200; i++) {
    safe(g)
    const k = ((b.x - CX) / cfg.rx) ** 2 + ((b.y - CY) / cfg.ry) ** 2
    assert.ok(Math.abs(k - 1) < 1e-6, 'it circles the room')
  }
  assert.ok(
    g.lobs.some((l) => l.kind === 'pie'),
    'lobbing pies',
  )
  assert.ok(
    g.slicks.some((s) => s.kind === 'cream'),
    'leaving cream',
  )
  // Past half: the wheels come loose, then three pies at a time and it turns round.
  b.hp = Math.ceil(b.maxHp / 2) + 1
  hit(g, -1)
  assert.equal(b.phase, 2)
  assert.ok(b.shift > 0)
  const shielded = b.hp
  hit(g, -1)
  assert.equal(b.hp, shielded, 'it shrugs off confetti while it spins')
  g.lobs = []
  let volley = 0
  for (let i = 0; i < 200 && !volley; i++) {
    safe(g)
    volley = g.lobs.filter((l) => l.kind === 'pie').length
  }
  assert.equal(volley, 3, 'three pies at a time')
  const dir = b.dir
  safe(g, cfg.reverseEvery)
  assert.notEqual(b.dir, dir, 'and it turns round')
  g.render(g2d)
}

// --- the Souffle Supreme -------------------------------------------------------------------------------------
{
  const g = stage(1, 'souffle-supreme')
  const b = g.boss!
  assert.equal(b.kind, 'souffle')
  // Open on the floor first...
  const hp = b.hp
  hit(g, -1)
  assert.equal(b.hp, hp - 1, 'open on the floor')
  // ...then it rises: untouchable, raining steam.
  for (let i = 0; i < 600 && b.mode !== 1; i++) safe(g)
  assert.equal(b.mode, 1)
  assert.ok(b.z > 30, 'up in the air')
  const up = b.hp
  hit(g, -1)
  assert.equal(b.hp, up, 'too hot to dent while it is up')
  let rained = false
  for (let i = 0; i < 300 && b.mode === 1; i++) {
    safe(g)
    if (b.drops.length) rained = true
  }
  assert.ok(rained, 'steam falls (with a shadow first)')
  // (the loop above narrowed `mode` to 1 for the type checker; it has moved on since)
  for (let i = 0; i < 100 && (b.mode as number) !== 3; i++) safe(g)
  assert.equal(b.mode, 3, 'and down it comes')
  assert.ok(
    g.rings.some((r) => r.gap === null),
    'in a ring',
  )
  // Past half health it splits into cupcakes.
  b.hp = Math.ceil(b.maxHp * b.phase2At) + 1
  hit(g, -1)
  assert.equal(b.mode, 4, 'split')
  assert.equal(liveParts(b, 'cupcake').length, BOSS.souffle.cupcakes)
  assert.ok(
    !bossTargets(b).some((t) => t.part === -1),
    'nothing left to hit but cupcakes',
  )
  const share = b.share
  for (const i of [0, 1, 2]) {
    b.parts[i]!.hp = 1
    hit(g, i)
  }
  assert.equal(liveParts(b, 'cupcake').length, BOSS.souffle.cupcakes - 3)
  assert.equal(b.hp, (BOSS.souffle.cupcakes - 3) * share)
  // Left alone, the rest gather and it re-forms with their health.
  for (
    let i = 0;
    i < BOSS.souffle.scatter + BOSS.souffle.reform + 5 && b.mode >= 4;
    i++
  )
    safe(g)
  assert.equal(b.mode, 0, 're-formed and rising')
  assert.equal(b.parts.length, 0)
  assert.equal(b.hp, (BOSS.souffle.cupcakes - 3) * share)
  // The next landing splits it again; pop every cupcake and it's done.
  for (let i = 0; i < 1200 && b.mode !== 4; i++) safe(g)
  assert.equal(b.mode, 4)
  g.render(g2d)
  for (const [i, c] of b.parts.entries()) {
    if (c.gone) continue
    c.hp = 1
    hit(g, i)
    if (!g.boss) break
  }
  assert.equal(g.boss, null, 'every cupcake popped')
  assert.equal(g.banner?.text, 'IT FELL FLAT!')
}

// --- the Mosh Mascot -----------------------------------------------------------------------------------------
{
  const g = stage(2, 'mosh-mascot')
  const b = g.boss!
  assert.equal(b.kind, 'mosh')
  safe(g)
  assert.equal(b.crew.length, BOSS.mosh.crew, 'it calls in a crowd')
  assert.equal(g.crashers.length, BOSS.mosh.crew)
  for (let i = 0; i < 200 && b.mode !== 1; i++) safe(g)
  assert.equal(b.mode, 1, 'and climbs on')
  safe(g)
  assert.ok(b.z > 8)
  assert.ok(
    !bossTargets(b).length,
    "over everyone's heads: confetti goes into the crowd",
  )
  // Clear the crowd and it falls; down, it is open.
  for (const c of [...b.crew]) g.removeCrasher(c)
  safe(g)
  assert.equal(b.mode, 2)
  for (let i = 0; i < 40 && b.mode !== 3; i++) safe(g)
  assert.equal(b.mode, 3, 'dizzy on the floor')
  const hp = b.hp
  hit(g, -1)
  assert.equal(b.hp, hp - 1)
  // Then it gets up and calls a bigger crowd.
  for (let i = 0; i < BOSS.mosh.down + 5 && b.mode === 3; i++) safe(g)
  safe(g)
  assert.equal(b.rallies, 2)
  assert.equal(b.crew.length, BOSS.mosh.crew + 1)
  g.render(g2d)
}

// --- the Jumbotron -------------------------------------------------------------------------------------------
{
  const g = stage(2, 'the-jumbotron')
  const b = g.boss!
  assert.equal(b.kind, 'jumbotron')
  assert.equal(b.parts.length, 6)
  // The face hops between screens on the beat; the screen it goes to fizzes first.
  let next = -1
  for (let i = 0; i < 200 && next < 0; i++) {
    safe(g)
    next = b.next
  }
  assert.ok(next >= 0 && next !== b.face)
  for (let i = 0; i < 40 && b.face !== next; i++) safe(g)
  assert.equal(b.face, next, 'it hopped to the screen that fizzed')
  const spot = screenSpot(b.face)
  assert.deepEqual({ x: b.x, y: b.y }, spot)
  // Turrets flip open and fire sparks on the beat.
  let sparks = false
  for (let i = 0; i < 400 && !sparks; i++) {
    safe(g)
    sparks = g.streamers.some((s) => s.style === 'spark')
  }
  assert.ok(sparks, 'a screen opened fire')
  // Crack the other screens and the face is cornered: it takes double.
  for (const [i, s] of b.parts.entries()) {
    if (i === b.face) continue
    s.hp = 1
    hit(g, i)
  }
  safe(g)
  assert.ok(b.cornered)
  const face = b.face
  safe(g, 200)
  assert.equal(b.face, face, 'nowhere left to hop')
  const hp = b.hp
  hit(g, -1)
  assert.equal(b.hp, hp - 2, 'a cornered face takes double')
  g.render(g2d)
  // Down: the last episode's wrap, then the season goes round again.
  b.hp = 1
  hit(g, -1)
  assert.equal(g.boss, null)
  g.waves = []
  for (let t = 0; t < 4000 && g.episodeIndex === 2; t++) {
    g.crashers = []
    safe(g)
  }
  assert.equal(g.episodeIndex, 3, 'after Countdown Concert, Galaxy Parade')
  assert.equal(g.loop, 1)
}

// --- a campaign through all three episodes ------------------------------------------------------------------
{
  // The attract pilot (lives topped up) plays the season: every set, every boss, deterministic.
  function play(seed: number) {
    const g = fresh(seed, true)
    const trace: number[] = []
    const bosses = new Set<BossKind>()
    const sets = new Set<string>()
    for (let t = 0; t < 60 * 60 * 30; t++) {
      g.lives = 50
      g.update(emptyInput())
      if (g.boss) bosses.add(g.boss.kind)
      sets.add(SEASON[g.episodeIndex]!.set)
      if (t % 600 === 0) {
        trace.push(
          g.level,
          g.episodeIndex,
          Math.round(g.px),
          Math.round(g.py),
          g.crashers.length,
        )
        g.render(g2d)
      }
    }
    return { trace, bosses, sets, g }
  }
  const a = play(1)
  assert.deepEqual(a.trace, play(1).trace, 'the season replays exactly')
  assert.notDeepEqual(a.trace, play(2).trace, 'and seeds differ')
  for (const set of ['studio', 'kitchen', 'concert'])
    assert.ok(a.sets.has(set), `the ${set} set`)
  for (const kind of [
    'float',
    'wobble',
    'piecart',
    'souffle',
    'mosh',
    'jumbotron',
  ] as const)
    assert.ok(a.bosses.has(kind), `the ${kind} (${[...a.bosses].join(', ')})`)
  assert.equal(a.g.score, 0, 'and the attract demo still never scores')
}

console.log('verifyPrizeShowPanicEpisodes: ok')
