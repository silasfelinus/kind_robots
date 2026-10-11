// Prize Show Panic depth slice 6 (conductor kr-arcade/t-033): the four contestants (Sparkle,
// Zippy, Boomer and Glimmer, each with her own sprite and feel), the pick card, co-op for up to four
// through the cabinet's `players` frames (shared lives, knocked down and back, the crowd going after
// the nearest contestant, more crashers and boss health with more seated, shared points), and the
// commercial-break mini-games between episodes and halfway through the Live Finale.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/prizeShowPanic'
import { ARCADE_GAMES } from '../arcade/games'
import type { PowerKind } from '../arcade/prizeShow/arsenal'
import {
  BREAK,
  BREAK_ORDER,
  WHEEL_COAST,
  breakDone,
  breakPilot,
  newBreak,
  slotAt,
  updateBreak,
} from '../arcade/prizeShow/commercials'
import type { BreakState } from '../arcade/prizeShow/commercials'
import { CONTESTANTS, CONTESTANT_IDS } from '../arcade/prizeShow/contestants'
import type { ContestantId } from '../arcade/prizeShow/contestants'
import type { Crasher, CrasherKind } from '../arcade/prizeShow/roster'
import type { ModifierId, Side } from '../arcade/prizeShow/season'

type Point = { x: number; y: number }
type Contestant = Point & {
  px: number
  py: number
  who: ContestantId
  seat: number
  down: number
  invuln: number
  guard: boolean
  guardClock: number
  powers: Record<PowerKind, number>
  aim: Point
}
type Inner = {
  score: number
  lives: number
  over: boolean
  dead: number
  invuln: number
  roomTick: number
  roomTimer: number
  roomId: string
  episodeIndex: number
  team: Contestant[]
  cur: Contestant
  picking: { cursor: number[]; locked: boolean[]; ticks: number } | null
  commercial: { state: BreakState; then: string } | null
  modifiers: Map<string, ModifierId | null>
  waves: Array<{ wave: unknown; at: number; left: number }>
  crashers: Crasher[]
  shots: Array<Point & { damage: number }>
  streamers: Array<
    Point & { vx: number; vy: number; life: number; style: string }
  >
  mines: unknown[]
  prizes: Array<Point & { kind: string; life: number; lift: number }>
  boss: { maxHp: number } | null
  exits: Array<Point & { kind: string }>
  exitsOpen: boolean
  map: unknown
  wallet: { cash: number; toaster: number; car: number }
  twistClock: number
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: CanvasRenderingContext2D): void
  beginEpisode(index: number): void
  enterRoom(id: string, entry: Side): void
  makeCrasher(kind: CrasherKind, x: number, y: number): Crasher
  addScore(points: number, x: number, y: number): void
  openCommercial(then: 'episode' | 'map'): void
  demoInput(): InputFrame
}

function fresh(seed = 3, players = 1, demo = false): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
    players,
  }) as unknown as Inner & { menu: { ticks: number } | null }
  // Past the mode card (left alone, it takes the Season), onto the pick card.
  if (g.menu) {
    g.menu.ticks = 1e9
    g.update(emptyInput())
  }
  return g
}

/** Past the pick card with each seat's cursor pick. */
function picked(seed = 3, players = 1): Inner {
  const g = fresh(seed, players)
  g.picking!.ticks = 1e9
  g.update(emptyInput())
  return g
}

/** A quiet room: nobody coming. */
function stage(g: Inner, id = 'opening-act', entry: Side = 3, episode = 0) {
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
}

function frames(n: number, f: (i: number) => InputFrame = () => emptyInput()) {
  return Array.from({ length: n }, (_, i) => f(i))
}

function hold(...buttons: Array<keyof InputFrame['held']>): InputFrame {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}

function press(button: keyof InputFrame['pressed']): InputFrame {
  const f = emptyInput()
  f.pressed[button] = true
  return f
}

/** Ticks with everyone safe. */
function safe(g: Inner, n = 1, all?: InputFrame[]) {
  for (let i = 0; i < n; i++) {
    for (const c of g.team) c.invuln = 1000
    const inputs = all ?? frames(g.team.length)
    g.update(inputs[0]!, inputs)
  }
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

// --- the four contestants -----------------------------------------------------------------------------
{
  assert.deepEqual(CONTESTANT_IDS, ['sparkle', 'zippy', 'boomer', 'glimmer'])
  const kits = CONTESTANT_IDS.map((id) => CONTESTANTS[id])
  assert.equal(
    new Set(kits.map((k) => k.body[2])).size,
    4,
    'each in her own colours',
  )
  // How far each walks in a second.
  const walked: Record<string, number> = {}
  for (const id of CONTESTANT_IDS) {
    const g = picked()
    stage(g)
    g.team[0]!.who = id
    g.team[0]!.px = 60
    g.team[0]!.py = 128
    safe(g, 60, [hold('right')])
    walked[id] = g.team[0]!.px - 60
  }
  assert.ok(walked.zippy! > walked.sparkle!, 'Zippy is fast')
  assert.ok(walked.boomer! < walked.sparkle!, 'Boomer is slow')
  assert.equal(walked.glimmer, walked.sparkle)
  // How each sprays.
  const spray = (id: ContestantId) => {
    const g = picked()
    stage(g)
    g.team[0]!.who = id
    g.team[0]!.aim = { x: 0, y: -1 }
    g.shots = []
    let pulls = 0
    for (let t = 0; t < 120; t++) {
      const before = new Set(g.shots)
      safe(g, 1, [hold('a')])
      if (g.shots.some((shot) => !before.has(shot))) pulls++
    }
    return { pulls, shots: g.shots, g }
  }
  const s = spray('sparkle')
  const z = spray('zippy')
  const b = spray('boomer')
  assert.ok(z.pulls > s.pulls, 'Zippy fires faster')
  assert.ok(b.pulls < s.pulls, 'Boomer fires slower...')
  b.g.shots = []
  b.g.team[0]!.invuln = 1000
  for (let t = 0; t < 60 && !b.g.shots.length; t++) safe(b.g, 1, [hold('a')])
  assert.equal(b.g.shots.length, 3, '...three wide')
  assert.ok(
    b.g.shots.every((shot) => shot.damage === 2),
    '...and heavy',
  )
  // Glimmer's own shield takes a hit, then recharges.
  const gl = picked()
  stage(gl)
  const me = gl.team[0]!
  me.who = 'glimmer'
  me.guard = true
  me.invuln = 0
  const lives = gl.lives
  gl.streamers.push({
    x: me.px,
    y: me.py,
    vx: 0,
    vy: 0,
    life: 10,
    style: 'streamer',
  })
  gl.update(emptyInput())
  assert.equal(gl.lives, lives, 'her shield took it')
  assert.ok(!me.guard)
  for (let t = 0; t < CONTESTANTS.glimmer.recharge + 5; t++) {
    me.invuln = 1000
    gl.update(emptyInput())
  }
  assert.ok(me.guard, 'and recharged')
}

// --- the pick card ----------------------------------------------------------------------------------------
{
  const g = fresh(3)
  assert.ok(g.picking, 'a real show opens on the pick card')
  g.render(g2d)
  for (let t = 0; t < 20; t++) g.update(emptyInput())
  g.update(press('right'))
  g.update(press('a'))
  assert.equal(g.picking, null)
  assert.equal(g.team[0]!.who, 'zippy', 'she picked Zippy')
  assert.equal(
    fresh(3, 1, true).picking,
    null,
    'the attract demo plays Sparkle',
  )
  // Two seats can't be the same contestant.
  const two = fresh(4, 2)
  for (let t = 0; t < 20; t++) two.update(emptyInput(), frames(2))
  const p1 = press('a')
  two.update(p1, [p1, emptyInput()])
  assert.deepEqual(two.picking!.locked, [true, false])
  two.update(emptyInput(), [emptyInput(), press('left')])
  assert.equal(two.picking!.cursor[1], 3, 'past the taken one')
  two.update(emptyInput(), [emptyInput(), press('a')])
  assert.equal(two.picking, null)
  assert.deepEqual(
    two.team.map((c) => c.who),
    ['sparkle', 'glimmer'],
  )
  // Left alone, everyone gets their cursor's pick.
  const auto = fresh(5, 4)
  for (let t = 0; t < 60 * 16 && auto.picking; t++)
    auto.update(emptyInput(), frames(4))
  assert.equal(auto.picking, null)
  assert.deepEqual(
    auto.team.map((c) => c.who),
    ['sparkle', 'zippy', 'boomer', 'glimmer'],
  )
}

// --- co-op ------------------------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'prize-show-panic')!
  assert.equal(meta.maxPlayers, 4, 'up to four seated')
  assert.ok(meta.twinStick, 'twin-stick stays (solo only)')
  for (const n of [2, 3, 4]) {
    const g = picked(6, n)
    assert.equal(g.team.length, n)
    assert.equal(g.lives, 3 + n - 1, 'a shared pool of lives')
  }
  // Each seat moves by her own frame; side by side at the door they came in by.
  const g = picked(6, 2)
  stage(g, 'opening-act', 3)
  const [a, b] = g.team
  assert.ok(Math.abs(a!.py - b!.py) > 10, 'side by side')
  const ay = a!.py
  safe(g, 20, [emptyInput(), hold('down')])
  assert.equal(a!.py, ay, 'P1 stood still')
  assert.ok(b!.py > ay, 'P2 walked')
  // A crasher goes after the contestant nearest it.
  g.crashers = []
  const c = g.makeCrasher('grabber', b!.px + 60, b!.py)
  const d0 = Math.hypot(c.x - b!.px, c.y - b!.py)
  safe(g, 30)
  assert.ok(Math.hypot(c.x - b!.px, c.y - b!.py) < d0, 'after P2')
  g.crashers = []
  // A hit knocks one contestant down (the room carries on), and she is back after a moment.
  const lives = g.lives
  b!.invuln = 0
  g.streamers.push({
    x: b!.px,
    y: b!.py,
    vx: 0,
    vy: 0,
    life: 10,
    style: 'streamer',
  })
  a!.invuln = 1000
  g.update(emptyInput(), frames(2))
  assert.equal(g.lives, lives - 1)
  assert.ok(b!.down > 0, 'P2 is down')
  assert.equal(a!.down, 0, 'P1 plays on')
  assert.equal(g.dead, 0, 'the room carries on')
  for (let t = 0; t < 120 && b!.down > 0; t++) {
    a!.invuln = 1000
    g.update(emptyInput(), frames(2))
  }
  assert.equal(b!.down, 0, 'and P2 is back')
  assert.ok(b!.invuln > 0, 'safe for a while')
  // With no lives left, a contestant who goes down is out; when everyone is out, it's game over.
  g.lives = 1
  for (const who of [b!, a!]) {
    who.invuln = 0
    g.streamers.push({
      x: who.px,
      y: who.py,
      vx: 0,
      vy: 0,
      life: 10,
      style: 'streamer',
    })
    for (const other of g.team)
      if (other !== who && other.down === 0) other.invuln = 1000
    g.update(emptyInput(), frames(2))
  }
  assert.equal(b!.down, -1, 'out')
  assert.equal(a!.down, -1, 'out')
  for (let t = 0; t < 200 && !g.over; t++) g.update(emptyInput(), frames(2))
  assert.ok(g.over, 'game over')
  g.render(g2d)

  // Time's up in co-op costs a life and restarts the room for everyone.
  const tu = picked(7, 3)
  stage(tu)
  const l2 = tu.lives
  tu.roomTimer = 1
  tu.update(emptyInput(), frames(3))
  assert.equal(tu.lives, l2 - 1)
  for (let t = 0; t < 200 && tu.dead > 0; t++)
    tu.update(emptyInput(), frames(3))
  assert.ok(tu.roomTimer > 1000, 'the room started again')
  assert.ok(tu.team.every((x) => x.down === 0))

  // Any contestant through the open door takes the team.
  const out = picked(8, 2)
  stage(out)
  out.waves = []
  safe(out, 2)
  assert.ok(out.exitsOpen)
  const door = out.exits.find((e) => e.kind === 'door')!
  out.team[1]!.px = door.x
  out.team[1]!.py = door.y
  safe(out, 1)
  for (let t = 0; t < 120 && !out.map; t++) safe(out, 1)
  assert.ok(out.map, 'on to the map')

  // A prize's power-up goes to whoever grabbed it.
  const pp = picked(9, 2)
  stage(pp)
  pp.prizes.push({
    x: pp.team[1]!.px,
    y: pp.team[1]!.py,
    kind: 'skates',
    life: 300,
    lift: 0,
  })
  safe(pp, 1)
  assert.ok(pp.team[1]!.powers.skates > 0)
  assert.equal(pp.team[0]!.powers.skates, 0)

  // More seated: more crashers through the doors, and a bigger boss.
  const count = (n: number) => {
    const w = picked(10, n)
    w.beginEpisode(0)
    w.modifiers.set('opening-act', null)
    w.enterRoom('opening-act', 3)
    w.twistClock = 1e9
    let most = 0
    for (let t = 0; t < 60 * 3; t++) {
      for (const x of w.team) x.invuln = 1000
      w.update(emptyInput(), frames(n))
      most = Math.max(most, w.crashers.length)
    }
    return most
  }
  assert.ok(count(4) > count(1), 'a bigger crowd for a bigger team')
  const boss = (n: number) => {
    const w = picked(10, n)
    w.beginEpisode(0)
    w.modifiers.set('parade-float', null)
    w.enterRoom('parade-float', 3)
    return w.boss!.maxHp
  }
  assert.ok(boss(3) > boss(1) * 1.5, 'and a tougher boss')
  // A team shares its points, and no score passes the leaderboard's ceiling.
  const solo = picked(11, 1)
  const team = picked(11, 3)
  solo.addScore(1000, 0, 0)
  team.addScore(1000, 0, 0)
  assert.equal(solo.score, 1000)
  assert.equal(team.score, 500, 'three share it')
  team.addScore(2_000_000_000, 0, 0)
  assert.equal(team.score, meta.maxPlausibleScore, 'never past the ceiling')
  assert.ok(meta.maxPlausibleScore < 2 ** 31)

  // Four on the floor, drawn; and a team replays exactly.
  const play = (seed: number) => {
    const w = fresh(seed, 4)
    const trace: number[] = []
    for (let t = 0; t < 60 * 60 * 4; t++) {
      const all = frames(4, (i) => {
        const f = emptyInput()
        f.held.a = (t + i * 30) % 90 < 60
        const way = (['left', 'right', 'up', 'down'] as const)[
          (Math.floor(t / 50) + i) % 4
        ]!
        f.held[way] = true
        f.pressed.a = t % 40 === i
        return f
      })
      w.update(all[0]!, all)
      if (t % 300 === 0) {
        trace.push(w.score, w.lives, ...w.team.map((x) => Math.round(x.px)))
        w.render(g2d)
      }
    }
    return trace
  }
  assert.deepEqual(play(12), play(12), 'a team replays exactly')
}

// --- commercial breaks ------------------------------------------------------------------------------------
{
  assert.deepEqual(BREAK_ORDER, ['wheel', 'catch', 'pies', 'higher'])
  // Spin the Wheel: A brakes, and it always coasts the same distance, three spins.
  const rng = mulberry32(21)
  const w = newBreak('wheel', rng, 1)
  for (let t = 0; t < BREAK.intro + 30; t++) updateBreak(w, [emptyInput()], rng)
  const at = w.angle + BREAK.wheel.speed
  updateBreak(w, [press('a')], rng)
  const expect = w.slots[slotAt(at + WHEEL_COAST)]!
  const paid: string[] = []
  for (let t = 0; t < BREAK.wheel.brake + 2; t++)
    paid.push(
      ...updateBreak(w, [emptyInput()], rng).flatMap((e) =>
        e.prize ? [e.prize] : e.points ? ['points'] : [],
      ),
    )
  assert.ok(
    Math.abs(w.angle - (at + WHEEL_COAST)) < BREAK.wheel.speed,
    'it coasted the set distance',
  )
  assert.deepEqual(
    paid,
    [expect.prize ?? 'points'],
    'and paid what the pointer shows',
  )
  for (let t = 0; t < 4000 && !breakDone(w); t++)
    updateBreak(w, [emptyInput()], rng)
  assert.ok(breakDone(w), 'three spins (it brakes itself if left alone)')
  assert.equal(w.spin, BREAK.wheel.spins)

  // Catch the Prizes: whatever falls on a contestant is hers.
  const c = newBreak('catch', rng, 2)
  for (let t = 0; t < BREAK.intro; t++) updateBreak(c, frames(2), rng)
  c.falling.push({
    x: c.seats[1]!.x,
    y: c.seats[1]!.y - 12,
    vy: 1,
    kind: 'car',
  })
  const caught = updateBreak(c, frames(2), rng)
  assert.ok(caught.some((e) => e.prize === 'car'))
  assert.equal(c.seats[1]!.caught, 1)

  // Pie Dodge: stand still and get splatted; the fewer splats, the better the prize.
  const still = newBreak('pies', mulberry32(5), 1)
  const r5 = mulberry32(6)
  const won: string[] = []
  for (let t = 0; t < 3000 && !breakDone(still); t++)
    won.push(
      ...updateBreak(still, [emptyInput()], r5).flatMap((e) =>
        e.prize ? [e.prize] : [],
      ),
    )
  assert.ok(still.seats[0]!.splats > 4, 'pied, standing still')
  assert.deepEqual(won, [], 'no prize for a face full of pie')
  const dodger = newBreak('pies', mulberry32(5), 1)
  const r6 = mulberry32(6)
  const prizes: string[] = []
  for (let t = 0; t < 3000 && !breakDone(dodger); t++)
    prizes.push(
      ...updateBreak(dodger, [breakPilot(dodger, 0)], r6).flatMap((e) =>
        e.prize ? [e.prize] : [],
      ),
    )
  assert.ok(dodger.seats[0]!.splats < still.seats[0]!.splats, 'dodging helps')

  // Higher or Lower: a right guess pays; five right is a car.
  const h = newBreak('higher', rng, 1)
  h.cards = [100, 200, 300, 400, 500, 600]
  for (let t = 0; t < BREAK.intro + 2; t++) updateBreak(h, [emptyInput()], rng)
  const all: string[] = []
  for (let t = 0; t < 2000 && !breakDone(h); t++)
    all.push(
      ...updateBreak(
        h,
        [t % 10 === 0 ? press('up') : emptyInput()],
        rng,
      ).flatMap((e) => (e.prize ? [e.prize] : [])),
    )
  assert.equal(h.right, 5)
  assert.ok(all.includes('car'), 'a perfect run')

  // In the show: a break after each episode's swap pays into the wallet, then the next episode.
  const g = picked(13)
  g.openCommercial('episode')
  assert.equal(g.commercial!.state.kind, 'wheel')
  const before = g.wallet.cash + g.wallet.toaster + g.wallet.car
  for (let t = 0; t < 6000 && g.commercial; t++) g.update(emptyInput())
  assert.equal(g.commercial, null)
  assert.equal(g.episodeIndex, 1, 'then the next episode')
  assert.ok(
    g.wallet.cash + g.wallet.toaster + g.wallet.car > before,
    'prizes for the swap',
  )
  g.render(g2d)
  // Halfway through the Live Finale, the break room is a mini-game, then the map.
  const f = picked(14)
  f.beginEpisode(4)
  f.enterRoom('commercial-break', 3)
  assert.ok(f.commercial, 'the commercials are a mini-game')
  assert.equal(f.commercial!.then, 'map')
  for (let t = 0; t < 6000 && f.commercial; t++) f.update(emptyInput())
  assert.ok(f.map, 'then back to the map')
  // Each break kind, played by the pilot and drawn, in turn.
  for (const kind of BREAK_ORDER) {
    const d = fresh(15, 1, true)
    d.openCommercial('map')
    d.commercial!.state = newBreak(kind, mulberry32(3), 1)
    for (let t = 0; t < 6000 && d.commercial; t++) {
      d.update(emptyInput())
      if (t % 200 === 0) d.render(g2d)
    }
    assert.equal(d.commercial, null, `${kind} ends`)
    assert.equal(d.score, 0, 'the demo still never scores')
  }
}

console.log('verifyPrizeShowPanicCoop: ok')
