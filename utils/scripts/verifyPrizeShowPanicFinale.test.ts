// Prize Show Panic depth slice 5 (conductor kr-arcade/t-032): Episode 4, Galaxy Parade (low gravity,
// the turning ring and its hub, teleport doors), its bosses (the Mothership and the Conga Dragon),
// the Live Finale and the host's Prize Machine, the Grand Prize Vault, both endings and the credits,
// saves at each episode start (and resuming them), and a deterministic run through the whole season.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseLoop } from '../arcade/sound'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create, readSave } from '../arcade/games/prizeShowPanic'
import type { PrizeSave } from '../arcade/games/prizeShowPanic'
import {
  BOSS,
  MACHINE_ACTS,
  bossTargets,
  liveParts,
  machineBeams,
} from '../arcade/prizeShow/bosses'
import type { Boss } from '../arcade/prizeShow/bosses'
import { VAULT_CHEERS, creditLines } from '../arcade/prizeShow/credits'
import {
  ENDING_MUSIC,
  FINALE_MUSIC,
  SET_MUSIC,
} from '../arcade/prizeShow/music'
import {
  EPISODE_4,
  LIVE_FINALE,
  PRIZE_VAULT,
  SEASON,
  SEASON_TICKETS,
  VAULT_TICKETS,
  roomById,
  seasonTickets,
} from '../arcade/prizeShow/season'
import type {
  ModifierId,
  SetId,
  Side,
  TurntableProp,
  WarpProp,
} from '../arcade/prizeShow/season'
import type { Crasher } from '../arcade/prizeShow/roster'
import { CX, CY, DOORS } from '../arcade/prizeShow/stage'

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
  vx: number
  invuln: number
  roomTick: number
  roomId: string
  loop: number
  episodeIndex: number
  inVault: boolean
  tickets: string[]
  modifiers: Map<string, ModifierId | null>
  waves: unknown[]
  crashers: Crasher[]
  dancers: unknown[]
  streamers: Array<Point & { style: string; life: number }>
  shots: Shot[]
  mines: unknown[]
  prizes: Array<
    Point & { kind: string; life: number; pedestal?: boolean; lift: number }
  >
  lobs: Array<{ kind: string }>
  rings: Array<{ gap: number | null }>
  turntable: TurntableProp | null
  warps: WarpProp[]
  warpClock: number
  boss: Boss | null
  banner: { text: string; sub?: string } | null
  cutIn: { voice: string; text: string } | null
  tally: unknown
  swap: unknown
  map: unknown
  ending: { kind: string; ticks: number; crowd: Crasher[] } | null
  seasonCleared: boolean
  save: PrizeSave | null
  choosing: number
  twistClock: number
  music: unknown
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  beginEpisode(index: number): void
  enterRoom(id: string, entry: Side): void
  finishEpisode(): void
  openEnding(kind: 'show' | 'true'): void
  removeCrasher(c: Crasher): void
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

function fresh(seed = 3, demo = false, resume?: unknown): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
    resume,
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

function press(button: keyof InputFrame['pressed']): InputFrame {
  const f = emptyInput()
  f.pressed[button] = true
  return f
}

function hold(button: keyof InputFrame['held']): InputFrame {
  const f = emptyInput()
  f.held[button] = true
  return f
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

// --- the whole season: four episodes and the Live Finale; the Vault off the air -------------------------
{
  assert.equal(SEASON.length, 5)
  assert.equal(SEASON[3], EPISODE_4)
  assert.equal(SEASON[4], LIVE_FINALE)
  assert.ok(
    !SEASON.includes(PRIZE_VAULT),
    'the Vault is only for ticket holders',
  )
  assert.equal(seasonTickets().length, SEASON_TICKETS, 'twelve golden tickets')
  assert.equal(VAULT_TICKETS, 10)
  assert.equal(EPISODE_4.set, 'galaxy')
  assert.equal(EPISODE_4.rooms.length, 13)
  assert.equal(
    roomById(EPISODE_4, EPISODE_4.midBoss).script.boss!.kind,
    'mothership',
  )
  assert.equal(
    roomById(EPISODE_4, EPISODE_4.finale).script.boss!.kind,
    'dragon',
  )
  const e4 = [
    ...EPISODE_4.rooms.map((r) => r.script),
    ...Object.values(EPISODE_4.secrets),
  ]
  assert.ok(e4.filter((s) => s.lowGravity).length >= 4, 'low-gravity rooms')
  for (const kind of ['turntable', 'warp'])
    assert.ok(
      e4.some((s) => (s.props ?? []).some((p) => p.kind === kind)),
      `the galaxy has ${kind}s`,
    )
  for (const kind of ['saucer', 'clone', 'fluffball', 'drone'] as const)
    assert.ok(
      e4.some((s) => s.waves.some((w) => w.kind === kind)),
      `${kind}s at home in the galaxy`,
    )
  // No teleport door sits near a door or on the straight lines between them (it would bounce
  // anyone heading for the exit back across the room).
  for (const ep of [...SEASON, PRIZE_VAULT])
    for (const r of [
      ...ep.rooms.map((x) => x.script),
      ...Object.values(ep.secrets),
    ])
      for (const p of r.props ?? []) {
        if (p.kind !== 'warp') continue
        for (const [x, y] of [
          [p.x1, p.y1],
          [p.x2, p.y2],
        ] as const) {
          assert.ok(
            Math.abs(y - CY) >= 16 && Math.abs(x - CX) >= 16,
            `${r.title}: off the door lines`,
          )
          for (const d of DOORS)
            assert.ok(
              Math.hypot(d.x - x, d.y - y) >= 50,
              `${r.title}: away from the doors`,
            )
        }
      }
  // The Live Finale: one long run, remixing every set, a commercial break, then the machine.
  assert.ok(LIVE_FINALE.live)
  assert.ok(
    LIVE_FINALE.rooms.every((r) => r.exits.length <= 1),
    'no forks',
  )
  const sets = new Set<SetId>(
    LIVE_FINALE.rooms.map((r) => r.script.set ?? LIVE_FINALE.set),
  )
  assert.deepEqual([...sets].sort(), ['concert', 'galaxy', 'kitchen', 'studio'])
  assert.ok(LIVE_FINALE.rooms.some((r) => r.id === 'commercial-break'))
  assert.equal(
    roomById(LIVE_FINALE, LIVE_FINALE.finale).script.boss!.kind,
    'machine',
  )
  assert.ok(PRIZE_VAULT.vault && PRIZE_VAULT.live)
  const vaultSets = new Set(PRIZE_VAULT.rooms.map((r) => r.script.set))
  assert.equal(vaultSets.size, 4, 'a gauntlet of every set')
  // Music: the galaxy's loop, the finale's theme and the ending's.
  for (const loop of [SET_MUSIC.galaxy, FINALE_MUSIC, ENDING_MUSIC])
    assert.equal(parseLoop(loop).length, 64)
  assert.equal(stage(4, 'prize-machine').music, FINALE_MUSIC)
  assert.equal(
    stage(4, 'live-kitchen').music,
    SET_MUSIC.kitchen,
    'the finale remixes sets',
  )
  assert.equal(stage(3, 'launch-pad').music, SET_MUSIC.galaxy)
}

// --- low gravity, the ring and the teleport doors ----------------------------------------------------------
{
  // Low gravity: let go of the stick and Sparkle keeps drifting.
  const g = stage(3, 'zero-g')
  g.px = 100
  g.py = 128
  safe(g, 30, hold('right'))
  const x0 = g.px
  safe(g, 10)
  assert.ok(g.px > x0 + 5, 'she drifts on')
  const s = stage(3, 'launch-pad')
  s.px = 100
  s.py = 128
  safe(s, 30, hold('right'))
  const x1 = s.px
  safe(s, 10)
  assert.equal(s.px, x1, 'on a normal floor she stops')

  // The ring carries Sparkle round the middle; the hub is solid.
  const r = stage(3, 'the-ring')
  const t = r.turntable!
  r.px = CX + 60
  r.py = CY
  const before = Math.atan2(r.py - CY, r.px - CX)
  safe(r, 30)
  const after = Math.atan2(r.py - CY, r.px - CX)
  assert.ok(after - before > 25 * t.spin * 0.8, 'carried round')
  assert.ok(
    Math.abs(Math.hypot(r.px - CX, r.py - CY) - 60) < 2.5,
    'at the same distance',
  )
  r.px = CX + 2
  r.py = CY
  safe(r)
  assert.ok(
    Math.hypot(r.px - CX, r.py - CY) >= t.inner - 7,
    'pushed out of the hub',
  )
  r.shots.push({ ...shot({ x: CX + 5, y: CY }), life: 20, vx: -1 })
  safe(r, 2)
  assert.equal(r.shots.length, 0, 'the hub stops confetti')
  r.render(g2d)

  // A teleport door: in one, out of the other, and not straight back.
  const w = stage(3, 'teleport-hall', 0)
  const door = w.warps[0]!
  w.px = door.x1
  w.py = door.y1
  safe(w)
  assert.ok(
    Math.hypot(w.px - door.x2, w.py - door.y2) < 3,
    'out of the other door',
  )
  safe(w)
  assert.ok(
    Math.hypot(w.px - door.x2, w.py - door.y2) < 3,
    'and not straight back',
  )
  assert.ok(w.warpClock > 0)
  w.render(g2d)
}

// --- the Mothership -------------------------------------------------------------------------------------
{
  const g = stage(3, 'mothership')
  const b = g.boss!
  assert.equal(b.kind, 'mothership')
  assert.equal(g.prizes.length, 3, 'prizes on the floor for it to want')
  // It picks a prize, warms its beam, and lifts it away.
  let took = false
  for (let i = 0; i < 900 && !took; i++) {
    safe(g)
    took = b.hold > 0
  }
  assert.ok(took, 'beamed a prize up')
  assert.equal(g.prizes.length, 2)
  // The hull is shut while the beam works: confetti on it does nothing.
  const hp = b.hp
  hit(g, -1)
  assert.equal(b.hp, hp, 'the hull is shut')
  // Break the emitter: the beam drops its prize, and the stunned hull opens.
  for (
    let i = 0;
    i < 600 && !(b.mode === 1 && b.prize && b.prize.lift > 0.2);
    i++
  )
    safe(g)
  const held = b.prize!
  b.parts[0]!.hp = 1
  hit(g, 0)
  assert.equal(b.mode, 2, 'stunned')
  assert.equal(held.lift, 0, 'the prize drops back')
  assert.equal(g.banner?.text, 'BEAM BROKEN!')
  hit(g, -1)
  assert.equal(b.hp, hp - 1, 'the hull is open')
  safe(g, BOSS.mothership.stun + 1)
  assert.equal(b.mode, 0, 'back up')
  assert.ok(!b.parts[0]!.gone, 'the emitter is back too')
  // With nothing left on the floor, the sponsor restocks it.
  g.prizes = []
  b.prize = null
  b.mode = 0
  b.clock = 1
  safe(g)
  assert.equal(g.prizes.length, 2, 'restocked')
  // Down: what it took rains back down.
  b.hold = 4
  b.mode = 2
  b.hp = 1
  const loose = g.prizes.length
  hit(g, -1)
  assert.equal(g.boss, null)
  assert.equal(g.prizes.length, loose + 3 + 4, 'won back')
  assert.equal(g.banner?.text, 'PRIZES RETURNED!')
}

// --- the Conga Dragon ------------------------------------------------------------------------------------
{
  const g = stage(3, 'conga-dragon')
  const b = g.boss!
  assert.equal(b.kind, 'dragon')
  assert.equal(liveParts(b, 'segment').length, BOSS.dragon.segments)
  safe(g, 120)
  // The segments follow the head's trail.
  const segs = liveParts(b, 'segment')
  for (let i = 1; i < segs.length; i++)
    assert.ok(
      Math.hypot(segs[i]!.x - segs[i - 1]!.x, segs[i]!.y - segs[i - 1]!.y) < 16,
    )
  // The head is armoured while the tail is long.
  const hp = b.hp
  hit(g, -1)
  assert.equal(b.hp, hp, 'armoured')
  // Each segment confettied off dances away, and the head picks up speed.
  const dancers = g.dancers.length
  const index = b.parts.indexOf(segs[4]!)
  b.parts[index]!.hp = 1
  hit(g, index)
  assert.ok(b.parts[index]!.gone)
  assert.equal(g.dancers.length, dancers + 1, 'a dancer')
  assert.equal(b.hp, hp - 1)
  while (liveParts(b, 'segment').length > BOSS.dragon.armour) {
    const seg = liveParts(b, 'segment')[0]!
    seg.hp = 1
    hit(g, b.parts.indexOf(seg))
  }
  const fast = Math.hypot(b.vx, b.vy)
  safe(g, 200)
  const top =
    BOSS.dragon.speed *
    (1 + BOSS.dragon.speedUp * (BOSS.dragon.segments - BOSS.dragon.armour))
  assert.ok(Math.hypot(b.vx, b.vy) <= top + 1e-9)
  assert.ok(top > BOSS.dragon.speed * 1.3, 'faster as it shortens')
  void fast
  const open = b.hp
  hit(g, -1)
  assert.equal(b.hp, open - 1, 'the head is open now')
  g.render(g2d)
  b.hp = 1
  hit(g, -1)
  assert.equal(g.boss, null)
  assert.equal(g.banner?.text, 'THE PARADE IS OVER!')
}

// --- the Prize Machine -----------------------------------------------------------------------------------
{
  const g = stage(4, 'prize-machine', 1)
  const b = g.boss!
  assert.equal(b.kind, 'machine')
  // While it spins the hub is shut; the act it lands on is the one it showed as next.
  const hp = b.hp
  hit(g, -1)
  assert.equal(b.hp, hp, 'shut while it spins')
  const seen = new Set<string>()
  for (let round = 0; round < 8; round++) {
    const promised = b.next
    g.crashers = []
    const crowd = g.crashers.length
    for (let i = 0; i < 400 && b.mode !== 1; i++) safe(g)
    assert.equal(b.face, promised, 'the wheel showed the next act')
    const act = MACHINE_ACTS[b.face]!
    seen.add(act)
    g.lobs = []
    g.rings = []
    g.streamers = []
    let spoke = false
    for (let i = 0; i < 200; i++) {
      safe(g)
      if (act === 'pies' && g.lobs.some((l) => l.kind === 'pie')) spoke = true
      if (act === 'sparks' && g.streamers.some((s) => s.style === 'spark'))
        spoke = true
      if (act === 'bass' && g.rings.some((r) => r.gap !== null)) spoke = true
      if ((act === 'saucers' || act === 'crowd') && g.crashers.length > crowd)
        spoke = true
      if (act === 'lights') spoke = true
    }
    if (act === 'saucers' || act === 'crowd') spoke ||= crowd >= 8
    assert.ok(spoke, `the ${act} act does its thing`)
    g.crashers = []
    // The hub is open while an act plays.
    if (round === 0) {
      const open = b.hp
      hit(g, -1)
      assert.equal(b.hp, open - 1, 'open during the act')
    }
    for (let i = 0; i < 400 && b.mode === 1; i++) safe(g)
  }
  assert.ok(seen.size >= 4, `different acts (${[...seen].join(', ')})`)
  // The lights burn along their beams once warm.
  const l = stage(4, 'prize-machine', 1)
  const m = l.boss!
  m.mode = 1
  m.face = MACHINE_ACTS.indexOf('lights')
  m.clock = BOSS.machine.act - BOSS.machine.beamWarm - 5
  const beam = machineBeams(m)[0]!
  l.px = m.x + Math.cos(beam) * 90
  l.py = m.y + Math.sin(beam) * 90
  l.invuln = 0
  const lives = l.lives
  l.update(emptyInput())
  assert.equal(l.lives, lives - 1, 'caught in the lights')
  // At a third left the wheel breaks and the host comes down for the dance-off.
  b.mode = 1
  b.hp = Math.ceil(b.maxHp * b.phase2At) + 1
  hit(g, -1)
  assert.equal(b.mode, 2, 'the wheel broke')
  assert.equal(g.banner?.text, 'THE WHEEL BROKE!')
  for (let i = 0; i < 100 && b.mode === 2; i++) safe(g)
  assert.equal(b.mode, 3, 'the dance-off')
  const moves = new Set<number>()
  let slid = false
  for (let i = 0; i < 1500; i++) {
    const was = { x: b.x, y: b.y }
    safe(g)
    moves.add(b.move)
    if (
      b.tell === 0 &&
      b.move === 1 &&
      Math.hypot(b.x - was.x, b.y - was.y) > 2
    )
      slid = true
  }
  assert.equal(moves.size, 3, 'spin, slide and stomp')
  assert.ok(slid, 'a slide is a dash across the floor')
  g.render(g2d)
  b.hp = 1
  b.z = 0
  b.tell = 5
  hit(g, -1)
  assert.equal(g.boss, null)
  assert.equal(g.banner?.text, 'WHAT A SHOW!')
}

// --- the ending without ten tickets: credits, then a rerun ---------------------------------------------------
{
  const g = stage(4, 'prize-machine', 1)
  g.tickets = seasonTickets().slice(0, VAULT_TICKETS - 1)
  g.boss!.hp = 1
  g.boss!.mode = 1
  hit(g, -1)
  g.waves = []
  for (let t = 0; t < 4000 && !g.ending; t++) {
    g.crashers = []
    safe(g, 1, t % 50 === 49 ? press('a') : emptyInput())
  }
  assert.ok(g.ending, 'the season ends')
  assert.equal(g.ending!.kind, 'show')
  assert.ok(g.seasonCleared)
  assert.equal(g.music, ENDING_MUSIC)
  assert.ok(g.score >= 250_000, 'the season bonus')
  g.render(g2d)
  for (let t = 0; t < 400; t++) g.update(emptyInput())
  g.render(g2d)
  for (let t = 0; t < 10_000 && g.ending; t++) g.update(emptyInput())
  assert.equal(g.ending, null, 'the credits finish')
  assert.equal(g.loop, 2, 'and the season reruns, harder')
  assert.equal(g.episodeIndex, 0)
  assert.equal(g.banner?.text, 'RERUN 1!')
  assert.ok(creditLines('show').length > 30)
}

// --- ten golden tickets: the Grand Prize Vault, and the true ending -------------------------------------------
{
  const g = stage(4, 'prize-machine', 1)
  g.tickets = seasonTickets().slice(0, VAULT_TICKETS)
  g.finishEpisode()
  assert.ok(g.inVault, 'into the Vault')
  assert.equal(g.roomId, PRIZE_VAULT.start)
  assert.equal(g.banner?.text, 'THE GRAND PRIZE VAULT!')
  // The host is on Sparkle's side in there.
  g.cutIn = null
  g.modifiers.set('hot-vault', null)
  g.enterRoom('hot-vault', 3)
  // (the type checker still thinks cutIn is the null set above; the room start has spoken since)
  const cheer = g.cutIn as { text: string } | null
  assert.ok(
    cheer && VAULT_CHEERS.includes(cheer.text),
    'the host cheers you on',
  )
  g.render(g2d)
  // Through the last room: the tally, then straight to the true ending.
  g.enterRoom('grand-prize', 3)
  g.waves = []
  g.crashers = []
  for (let t = 0; t < 4000 && !g.ending; t++) {
    g.crashers = []
    safe(g, 1, t % 50 === 49 ? press('a') : emptyInput())
    assert.equal(g.swap, null, 'nothing to swap for after the Vault')
  }
  assert.ok(g.ending, 'the true ending')
  assert.equal(g.ending!.kind, 'true')
  assert.ok(
    g.ending!.crowd.length >= 18,
    'every kind of crasher joins the audience',
  )
  assert.ok(creditLines('true').includes('THE GRAND PRIZE VAULT'))
  g.render(g2d)
  for (let t = 0; t < 10_000 && g.ending; t++) g.update(emptyInput())
  assert.ok(!g.inVault && g.loop === 2, 'then the rerun, out of the Vault')
  g.render(g2d)
}

// --- saves: kept at each episode start, offered back, validated --------------------------------------------
{
  const g = fresh(5)
  assert.equal(g.save!.episode, 0, 'saved at the first episode start')
  g.tickets = ['e1-showcase', 'e2-sampler']
  g.score = 123_456
  g.beginEpisode(2)
  const kept = g.save!
  assert.equal(kept.episode, 2)
  assert.deepEqual(kept.tickets, ['e1-showcase', 'e2-sampler'])
  assert.equal(kept.score, 123_456)
  assert.ok(JSON.stringify(kept).length < 1000, 'a small resume point')
  assert.deepEqual(
    readSave(JSON.parse(JSON.stringify(kept))),
    kept,
    'round trip',
  )
  assert.equal(fresh(5, true).save, null, 'the demo never saves')

  // Offered back: A carries on from that episode's start.
  const r = fresh(6, false, kept)
  assert.ok(r.choosing > 0, 'the continue card')
  assert.deepEqual(r.save, kept, 'untouched until the player chooses')
  r.render(g2d)
  for (let t = 0; t < 30; t++) r.update(emptyInput())
  r.update(press('a'))
  assert.equal(r.choosing, 0)
  assert.equal(r.episodeIndex, 2)
  assert.equal(r.roomId, SEASON[2]!.start)
  assert.equal(r.score, 123_456)
  assert.deepEqual(r.tickets, ['e1-showcase', 'e2-sampler'])
  // B starts a new show (and the save with it).
  const n = fresh(6, false, kept)
  for (let t = 0; t < 30; t++) n.update(emptyInput())
  n.update(press('b'))
  assert.ok((n as unknown as { menu: unknown }).menu, 'then the mode card')
  skipPick(n)
  assert.equal(n.episodeIndex, 0)
  assert.equal(n.save!.episode, 0)
  assert.equal(n.score, 0)
  // A run that ended can be picked up again, but its score starts over.
  const ended = { ...kept, continued: true }
  const c = fresh(6, false, ended)
  for (let t = 0; t < 30; t++) c.update(emptyInput())
  c.update(press('a'))
  assert.equal(c.score, 0)
  assert.equal(c.lives, 3)
  assert.equal(c.episodeIndex, 2)
  // A first-episode save is nothing to offer.
  const first = fresh(6, false, { ...kept, episode: 0 })
  assert.equal(first.choosing, 0)
  // Game over marks the save continued.
  const over = fresh(7)
  over.beginEpisode(1)
  over.lives = 1
  over.invuln = 0
  for (let t = 0; t < 4000 && !over.over; t++) {
    if (over.crashers.length === 0) over.waves = []
    over.update(emptyInput())
    over.invuln = 0
  }
  assert.ok(over.over)
  assert.ok(over.save!.continued, 'the save is marked continued')
  // Junk is never resumed.
  for (const bad of [
    null,
    'save',
    { ...kept, v: 3 },
    { ...kept, medals: { 'no-such-room': 1 } },
    { ...kept, medals: { 'opening-act': 8 } },
    { ...kept, marathon: -1 },
    { ...kept, episode: 9 },
    { ...kept, lives: 0 },
    { ...kept, score: -1 },
    { ...kept, tickets: ['e9-nowhere'] },
    { ...kept, tickets: ['e1-showcase', 'e1-showcase'] },
    { ...kept, wallet: { cash: 1 } },
    { ...kept, cleared: 'yes' },
  ])
    assert.equal(
      readSave(bad),
      null,
      `rejected: ${JSON.stringify(bad)?.slice(0, 60)}`,
    )
}

// --- the whole season, deterministic -------------------------------------------------------------------------
{
  // The attract pilot (lives topped up) plays the season through to the ending.
  function play(seed: number) {
    const g = fresh(seed, true)
    const trace: number[] = []
    const bosses = new Set<string>()
    let t = 0
    for (; t < 60 * 60 * 45 && !g.ending; t++) {
      g.lives = 50
      g.update(emptyInput())
      if (g.boss) bosses.add(g.boss.kind)
      if (t % 900 === 0) {
        trace.push(g.level, g.episodeIndex, Math.round(g.px), g.crashers.length)
        g.render(g2d)
      }
    }
    return { trace, bosses, g, minutes: t / 3600 }
  }
  const a = play(3)
  assert.deepEqual(a.trace, play(3).trace, 'the season replays exactly')
  assert.ok(
    a.g.ending,
    `the pilot clears the season (${a.minutes.toFixed(1)} min)`,
  )
  assert.equal(
    a.bosses.size,
    9,
    `all nine bosses (${[...a.bosses].join(', ')})`,
  )
  assert.equal(a.g.score, 0, 'and the attract demo still never scores')
  assert.equal(a.g.save, null, 'or saves')
}

console.log('verifyPrizeShowPanicFinale: ok')
