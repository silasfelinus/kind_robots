// Butterfly Joust depth pass, slice 1 (conductor kr-arcade/t-047): the Jousting Party (co-op's
// team bonus, friendly knocks and rescues, Last Butterfly Flapping), the announced wave types, the
// Pond Frog's tell and flap-to-escape, the Carrier, the Air Combo, the Charge Joust and the
// Thundercap's eye check. Each rule is pinned on a staged arena.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/butterflyJoust'
import { POND_Y } from '../arcade/butterflyJoust/field'
import {
  CARRIER,
  CHARGE_MIN,
  COMBO_WINDOW,
  FROG,
  KNOCK_TICKS,
  TEAM_BONUS,
  THUNDERCAP,
  VERSUS_HATCH,
  VERSUS_TICKS,
  WAVE_TYPES,
  classicWaveKind,
  comboExtra,
  comboMultiplier,
  lungeSpeed,
  thundercapPhase,
} from '../arcade/butterflyJoust/rules'

type Body = {
  x: number
  y: number
  vx: number
  vy: number
  ground: unknown
  flap: number
}
type Rider = Body & {
  seat: number
  facing: number
  alive: boolean
  invuln: number
  knocked: number
  combo: { bonks: number; pot: number; idle: number }
  brace: number
  lunge: number
  chargeCool: number
  held: boolean
  points: number
  bonks: number
  bestCombo: number
}
type Rival = Body & { kind: string; spawn: number; held: boolean }
type Cocoon = {
  x: number
  y: number
  hatch: number
  called: boolean
  kind: string
}
type Carrier = Body & { carrying: number; leaving: number; kind: string }
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  mode: string
  menu: unknown
  menuRows(): Array<{ id: string }>
  riders: Rider[]
  rivals: Rival[]
  cocoons: Cocoon[]
  carriers: Carrier[]
  storm: { x: number; y: number; t: number } | null
  frog: { state: string; t: number; x: number; grip: number; prey: unknown }
  waveKind: string
  clearing: number
  versusTicks: number
  result: { lines: string[] } | null
  banner: { text: string; lines?: string[] } | null
  update(input: InputFrame, players?: InputFrame[]): void
  coop: boolean
  startWave(): void
  addRival(kind: string, delay?: number, at?: { x: number; y: number }): void
}

const quiet = { play() {} }
function game(players = 1, seed = 3): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
  }) as unknown as Inner
}
function press(...buttons: (keyof InputFrame['held'])[]): InputFrame {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
function hold(...buttons: (keyof InputFrame['held'])[]): InputFrame {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}
const idle = () => emptyInput()
/** Move the mode card's cursor down to the row with this id, and take it. */
function pick(g: Inner, id: string) {
  const at = g.menuRows().findIndex((row) => row.id === id)
  assert.ok(at >= 0, `the card offers ${id}`)
  for (let i = 0; i < at; i++) g.update(press('down'))
  g.update(press('a'))
}
/** The Classic Pond (a row of the mode card), where the slice 1 rules are pinned. */
function pond(players = 1, seed = 3): Inner {
  const g = game(players, seed)
  assert.ok(g.menu, 'the game opens on the mode card')
  assert.equal(g.level, 1, 'the card sits on wave 1')
  pick(g, 'classic')
  assert.equal(g.menu, null)
  assert.equal(g.mode, 'classic')
  return g
}
/** A party game: co-op on the Classic Pond, or versus (the card's last row). */
function party(players: number, mode: 'coop' | 'versus'): Inner {
  if (mode === 'coop') {
    const g = pond(players)
    assert.ok(g.coop, 'two or more riders share the pond')
    return g
  }
  const g = game(players)
  pick(g, 'versus')
  assert.equal(g.mode, 'versus')
  return g
}
/** An empty arena with every rider airborne at a spot and ready to joust. */
function stage(g: Inner, wave: number) {
  g.level = wave
  g.startWave()
  g.rivals = []
  g.cocoons = []
  g.carriers = []
  g.banner = null
  g.frog.state = 'rest'
  g.frog.t = 99999
  for (const r of g.riders) r.invuln = 0
  // A rider still shimmering in far off holds the wave open until release().
  g.addRival('drifter', HOLD)
}
const HOLD = 1_000_000
/** The riders in play (not the one holding the wave open). */
function live(g: Inner): Rival[] {
  return g.rivals.filter((r) => r.spawn < HOLD / 2)
}
/** Let the wave clear once the arena is empty. */
function release(g: Inner) {
  g.rivals = live(g)
}
function place(b: Body, x: number, y: number) {
  Object.assign(b, { x, y, vx: 0, vy: 0, ground: null, flap: 0 })
}
function rival(g: Inner, kind: string, x: number, y: number): Rival {
  g.addRival(kind, 0, { x, y: y + 8 })
  const r = g.rivals[g.rivals.length - 1]!
  place(r, x, y)
  r.spawn = 0
  return r
}

// --- the announced wave types -------------------------------------------------------------------
{
  const solo = Array.from({ length: 10 }, (_, i) => classicWaveKind(i + 1, 1))
  assert.deepEqual(solo, [
    'joust',
    'survival',
    'joust',
    'gladiator',
    'cocoon',
    'storm',
    'survival',
    'survival',
    'gladiator',
    'cocoon',
  ])
  assert.equal(classicWaveKind(8, 2), 'team', 'two riders get the Team wave')
  assert.equal(classicWaveKind(18, 3), 'team', 'the cycle laps')
  for (const kind of Object.keys(WAVE_TYPES))
    assert.ok(
      WAVE_TYPES[kind as keyof typeof WAVE_TYPES].rule.length <= 28,
      `${kind}: the rule fits the banner`,
    )

  // Every wave is announced with its rule.
  const g = pond()
  g.level = 4
  g.startWave()
  assert.equal(g.waveKind, 'gladiator')
  assert.equal(g.banner?.text, 'GLADIATOR WAVE')

  // Gladiator: the first bonk pays 3000 on top, once.
  stage(g, 4)
  const p = g.riders[0]!
  place(p, 200, 100)
  rival(g, 'drifter', 200, 114)
  rival(g, 'drifter', 300, 200)
  g.update(idle())
  assert.equal(g.score, 500 + WAVE_TYPES.gladiator.bonus, 'first bonk bonus')
  place(p, 300, 188)
  g.update(idle())
  assert.ok(g.score < 500 + 3000 + 500 + 3000, 'paid once')

  // Survival: clear without losing a butterfly.
  const s = pond()
  stage(s, 2)
  assert.equal(s.waveKind, 'survival')
  place(s.riders[0]!, 200, 100)
  rival(s, 'drifter', 200, 114)
  release(s)
  s.update(idle())
  for (let t = 0; t < 300 && s.cocoons.length; t++) {
    const c = s.cocoons[0]!
    place(s.riders[0]!, c.x, c.y)
    s.update(idle())
  }
  assert.ok(s.clearing > 0, 'wave clear')
  assert.ok(s.banner?.lines?.some((l) => l.startsWith('SURVIVAL')))
  assert.ok(s.score >= 500 + 250 + WAVE_TYPES.survival.bonus)
}

// --- the Air Combo ----------------------------------------------------------------------------
{
  assert.equal(comboMultiplier(1), 1)
  assert.equal(comboMultiplier(3), 3)
  assert.equal(comboMultiplier(99), 8, 'the streamer tops out at x8')
  assert.equal(comboExtra(500, 1), 0)
  assert.equal(comboExtra(500, 3), 1000)

  const g = pond()
  stage(g, 3)
  const p = g.riders[0]!
  // Three bonks without landing: 500 + 750 + 500 paid at once, the extra on the streamer.
  place(p, 100, 80)
  rival(g, 'drifter', 100, 94)
  g.update(idle())
  assert.equal(p.combo.bonks, 1)
  place(p, 200, 80)
  rival(g, 'hunter', 200, 94)
  g.update(idle())
  place(p, 300, 80)
  rival(g, 'drifter', 300, 94)
  g.update(idle())
  assert.equal(g.score, 1750, 'bonks pay their base at once')
  assert.equal(p.combo.pot, 0 + 750 + 1000, 'x2 and x3 extras wait')
  assert.equal(p.bestCombo, 3)
  // Landing banks it.
  g.cocoons = []
  g.addRival('drifter', 9999)
  place(p, 224, 196 - 8 - 2)
  p.vy = 1
  for (let t = 0; t < 10 && p.combo.bonks; t++) g.update(idle())
  assert.equal(p.combo.bonks, 0, 'landed')
  assert.equal(g.score, 1750 + 1750, 'the landing banks the pot')

  // A combo lost with the butterfly pays nothing more.
  const h = pond()
  stage(h, 3)
  const q = h.riders[0]!
  place(q, 100, 80)
  rival(h, 'drifter', 100, 94)
  h.update(idle())
  place(q, 200, 80)
  rival(h, 'drifter', 200, 94)
  h.update(idle())
  assert.equal(q.combo.pot, 500)
  const before = h.score
  place(q, 300, 100)
  rival(h, 'drifter', 300, 88)
  h.update(idle())
  assert.equal(q.alive, false, 'bonked from above')
  assert.equal(h.score, before, 'the pot is lost')

  // The window lapsing in mid-air banks it too.
  const k = pond()
  stage(k, 3)
  const r = k.riders[0]!
  place(r, 100, 80)
  rival(k, 'drifter', 100, 94)
  k.update(idle())
  place(r, 200, 80)
  rival(k, 'drifter', 200, 94)
  k.update(idle())
  r.combo.idle = COMBO_WINDOW
  place(r, 200, 60)
  k.update(press('a'))
  assert.equal(r.combo.bonks, 0, 'lapsed')
  assert.equal(k.score, 1000 + 500, 'and banked')
}

// --- the Charge Joust -------------------------------------------------------------------------
{
  assert.equal(lungeSpeed(CHARGE_MIN - 1), 0, 'a tap is no lunge')
  assert.ok(lungeSpeed(60) > lungeSpeed(CHARGE_MIN))

  // Level without a lunge: both bounce.
  const g = pond()
  stage(g, 3)
  const p = g.riders[0]!
  place(p, 200, 100)
  const r = rival(g, 'drifter', 214, 100)
  g.update(idle())
  assert.equal(live(g).length, 1, 'a level clash bounces')
  assert.ok(p.vx < 0 && r.vx > 0)

  // Brace with B, let go: the lunge wins the level clash.
  const h = pond()
  stage(h, 3)
  const q = h.riders[0]!
  place(q, 100, 100)
  q.facing = 1
  for (let t = 0; t < 20; t++) {
    h.update(hold('b'))
    q.y = 100
    q.vy = 0
  }
  assert.ok(q.brace >= CHARGE_MIN)
  h.update(idle())
  assert.ok(q.lunge > 0, 'lunging')
  assert.ok(q.chargeCool > 0, 'then a cooldown')
  const target = rival(h, 'drifter', q.x + 20, q.y)
  for (let t = 0; t < 8 && h.rivals.includes(target); t++) h.update(idle())
  assert.ok(!h.rivals.includes(target), 'the lunge bonks a level rider')
  assert.ok(h.score >= 500, 'the bonk pays')
  // No second brace during the cooldown.
  h.update(hold('b'))
  assert.equal(q.brace, 0)
}

// --- the Pond Frog ----------------------------------------------------------------------------
{
  // Not before its wave.
  const early = pond()
  stage(early, 1)
  place(early.riders[0]!, 200, POND_Y - 30)
  early.frog.state = 'rest'
  early.frog.t = 1
  early.update(idle())
  assert.equal(early.frog.state, 'rest', 'no frog on wave 1')

  /** A rider low over the pond with the frog's eyes up under it, about to snap. */
  const caught = () => {
    const g = pond()
    stage(g, FROG.from)
    const p = g.riders[0]!
    place(p, 30, POND_Y - 40)
    g.frog.state = 'eyes'
    g.frog.x = 30
    g.frog.t = 1
    g.update(idle())
    assert.equal(g.frog.state, 'snap', 'the tongue flicks')
    for (let t = 0; t < FROG.flick; t++) {
      p.y = POND_Y - 40
      p.vy = 0
      g.update(idle())
    }
    assert.equal(g.frog.state, 'hold')
    assert.ok(p.held, 'caught')
    return { g, p }
  }

  // The tell comes first: bubbles, then eyes, before any snap.
  {
    const g = pond()
    stage(g, FROG.from)
    const p = g.riders[0]!
    place(p, 30, POND_Y - 40)
    g.frog.t = 1
    g.update(idle())
    assert.equal(g.frog.state, 'bubbles')
    let sawEyes = false
    for (let t = 0; t < FROG.bubbles + 2; t++) {
      p.y = POND_Y - 40
      p.vy = 0
      g.update(idle())
      if ((g.frog.state as string) === 'eyes') sawEyes = true
    }
    assert.ok(sawEyes, 'eyes surface after the bubbles')
  }

  // It only surfaces in open water, never under the bottom ledge.
  {
    const g = pond()
    stage(g, FROG.from)
    place(g.riders[0]!, 224, POND_Y - 40)
    g.frog.t = 1
    g.update(idle())
    assert.equal(g.frog.state, 'rest', 'nothing to snatch over the ledge')
  }

  // Mashing flap breaks free, with a bonus.
  {
    const { g, p } = caught()
    let t = 0
    for (; t < 60 && p.held; t++) g.update(t % 2 ? idle() : press('a'))
    assert.ok(!p.held && p.alive, 'broke free')
    assert.ok(t <= FROG.grip * 2, 'seven taps')
    assert.equal(g.score, FROG.escapeBonus)
    assert.ok(p.vy < 0, 'flung back up')
    assert.equal(g.frog.state, 'sink')
  }

  // Holding A (touch) counts half: slower than tapping.
  {
    const { g, p } = caught()
    let t = 0
    for (; t < 400 && p.held; t++) g.update(hold('a'))
    assert.ok(!p.held && p.alive, 'held flaps break free too')
    assert.ok(t > FROG.grip * 2, 'but slower')
  }

  // Doing nothing: pulled under.
  {
    const { g, p } = caught()
    const lives = g.lives
    for (let t = 0; t < 400 && p.alive; t++) g.update(idle())
    assert.equal(p.alive, false, 'pulled into the pond')
    assert.equal(g.lives, lives - 1)
  }
}

// --- the Carrier ------------------------------------------------------------------------------
{
  // Before its wave, a cocoon hatches straight into a rider.
  const g = pond()
  stage(g, CARRIER.from - 1)
  place(g.riders[0]!, 60, 60)
  g.cocoons.push({
    x: 224,
    y: 191,
    vy: 0,
    ground: null,
    hatch: 1,
    kind: 'drifter',
    called: false,
  } as never)
  g.update(idle())
  assert.equal(g.carriers.length, 0)
  assert.equal(live(g)[0]?.kind, 'hunter', 'hatched a tier up')

  // From its wave, a carrier whistles in for it.
  const h = pond()
  stage(h, CARRIER.from)
  place(h.riders[0]!, 60, 60)
  h.cocoons.push({
    x: 224,
    y: 191,
    vy: 0,
    ground: null,
    hatch: 1,
    kind: 'drifter',
    called: false,
  } as never)
  h.update(idle())
  assert.equal(h.carriers.length, 1, 'a carrier is called')
  assert.ok(h.cocoons[0]!.called)
  assert.equal(live(h).length, 0)
  // Left alone it fetches the cocoon and hatches it on the wing.
  for (let t = 0; t < 900 && !live(h).length; t++) {
    place(h.riders[0]!, 60, 60)
    h.update(idle())
  }
  assert.equal(h.cocoons.length, 0, 'fetched')
  assert.equal(live(h)[0]?.kind, 'hunter', 'a tougher rider')

  // Bonk the carrier for 1000; its cocoon waits for the next.
  const k = pond()
  stage(k, CARRIER.from)
  const p = k.riders[0]!
  place(p, 30, 40)
  k.cocoons.push({
    x: 224,
    y: 191,
    vy: 0,
    ground: null,
    hatch: 1,
    kind: 'drifter',
    called: false,
  } as never)
  k.update(idle())
  const c = k.carriers[0]!
  place(p, c.x, c.y - 10)
  k.update(idle())
  assert.ok(k.score >= CARRIER.points, 'carrier bonked')
  assert.ok(c.leaving > 0, 'it flutters off')
  assert.equal(k.cocoons[0]!.called, false)
  assert.equal(k.cocoons[0]!.hatch, CARRIER.regrace)
}

// --- the Thundercap ---------------------------------------------------------------------------
{
  assert.equal(thundercapPhase(0), 'flash')
  assert.equal(thundercapPhase(THUNDERCAP.flash), 'open')
  assert.equal(thundercapPhase(THUNDERCAP.flash + THUNDERCAP.open), 'shut')

  // The Storm wave sends it from the start.
  const g = pond()
  stage(g, 6)
  assert.equal(g.waveKind, 'storm')
  place(g.riders[0]!, 60, 280)
  for (let t = 0; t < 130 && !g.storm; t++) g.update(idle())
  assert.ok(g.storm, 'the Thundercap comes out')

  /** A rider just left of the cloud at its height, facing it, in a phase. */
  const meet = (t: number, facing: number, dy = 0) => {
    const h = pond()
    stage(h, 6)
    const p = h.riders[0]!
    h.storm = { x: 220, y: 150, t, popped: false } as never
    place(p, 202, 150 + dy)
    p.facing = facing
    h.update(idle())
    return { h, p }
  }
  const open = THUNDERCAP.flash + 20
  {
    const { h, p } = meet(open, 1)
    assert.equal(h.storm, null, 'the open eye, level and lance first: popped')
    assert.ok(p.alive)
    assert.equal(h.score, THUNDERCAP.points + WAVE_TYPES.storm.bonus)
  }
  {
    const { h, p } = meet(5, 1)
    assert.ok(h.storm, 'eye shut while it flashes')
    assert.equal(p.alive, false)
  }
  {
    const { p } = meet(open, -1)
    assert.equal(p.alive, false, 'back first: no')
  }
  {
    const { p } = meet(open, 1, -16)
    assert.equal(p.alive, false, 'from above: no (it is the eye or nothing)')
  }
}

// --- the Jousting Party: co-op ----------------------------------------------------------------
{
  const g = party(2, 'coop')
  assert.equal(g.riders.length, 2)
  assert.equal(g.lives, 5, 'a shared pool: three, and two for the second seat')
  assert.ok(Math.abs(g.riders[0]!.x - g.riders[1]!.x) > 20, 'spread out')

  // A clean wave pays the team bonus for each seat.
  const clean = party(2, 'coop')
  stage(clean, 1)
  place(clean.riders[0]!, 100, 80)
  place(clean.riders[1]!, 300, 80)
  rival(clean, 'drifter', 100, 94)
  release(clean)
  clean.update(idle(), [idle(), idle()])
  for (let t = 0; t < 300 && clean.cocoons.length; t++) {
    const c = clean.cocoons[0]!
    place(clean.riders[1]!, c.x, c.y)
    clean.update(idle(), [idle(), idle()])
  }
  assert.ok(clean.clearing > 0)
  assert.ok(clean.banner?.lines?.includes(`TEAM ${TEAM_BONUS * 2}`))
  assert.equal(clean.score, 500 + 750 + TEAM_BONUS * 2)
  assert.equal(
    clean.riders[0]!.points,
    500 + TEAM_BONUS,
    'each seat keeps its own tally, the team bonus shared',
  )

  // A friendly bonk knocks the lower rider (no butterfly lost) and costs the bonus.
  const oops = party(2, 'coop')
  stage(oops, 1)
  const [a, b] = oops.riders as [Rider, Rider]
  place(a, 200, 100)
  place(b, 200, 112)
  rival(oops, 'drifter', 400, 60)
  const lives = oops.lives
  oops.update(idle(), [idle(), idle()])
  assert.equal(b.knocked, KNOCK_TICKS, 'curled up')
  assert.equal(oops.lives, lives, 'no butterfly lost')
  // A teammate's scoop wakes them at once.
  b.ground = {} as never
  place(a, b.x, b.y)
  a.invuln = 0
  oops.update(idle(), [idle(), idle()])
  assert.equal(b.knocked, 0, 'rescued')
  oops.rivals = []
  for (let t = 0; t < 300 && oops.cocoons.length; t++) {
    const c = oops.cocoons[0]!
    place(a, c.x, c.y)
    oops.update(idle(), [idle(), idle()])
  }
  oops.update(idle(), [idle(), idle()])
  assert.ok(oops.clearing > 0)
  assert.ok(
    !oops.banner?.lines?.some((l) => l.startsWith('TEAM')),
    'no team bonus',
  )

  // The Team wave pays 3000 a seat.
  const team = party(3, 'coop')
  stage(team, 8)
  assert.equal(team.waveKind, 'team')
  const all = [idle(), idle(), idle()]
  release(team)
  team.update(all[0]!, all)
  assert.ok(team.clearing > 0)
  assert.ok(team.banner?.lines?.includes(`TEAM ${WAVE_TYPES.team.bonus * 3}`))

  // The pool runs dry only when every seat is out.
  const dry = party(2, 'coop')
  stage(dry, 3)
  dry.lives = 2
  const [c, d] = dry.riders as [Rider, Rider]
  place(c, 100, 100)
  rival(dry, 'drifter', 100, 88)
  dry.update(idle(), [idle(), idle()])
  assert.equal(c.alive, false)
  assert.equal(dry.lives, 1)
  for (let t = 0; t < 200; t++) {
    d.invuln = 99
    place(d, 300, 60)
    dry.update(idle(), [idle(), idle()])
  }
  assert.equal(c.alive, false, 'no spare: P1 waits on the bench')
  assert.ok(!dry.over)
}

// --- the Jousting Party: Last Butterfly Flapping ---------------------------------------------
{
  const g = party(3, 'versus')
  assert.equal(g.versusTicks, VERSUS_TICKS)
  stage(g, 1)
  const [a, b] = g.riders as [Rider, Rider]
  place(a, 200, 100)
  place(b, 200, 112)
  place(g.riders[2]!, 40, 60)
  const frames = [idle(), idle(), idle()]
  g.update(frames[0]!, frames)
  assert.equal(a.bonks, 1, 'a bonk on a rival rider counts')
  assert.equal(b.knocked, VERSUS_HATCH, 'the loser curls up for five seconds')
  for (let t = 0; t < VERSUS_HATCH; t++) {
    place(a, 400, 60)
    a.invuln = 99
    g.update(frames[0]!, frames)
  }
  assert.equal(b.knocked, 0, 'and hatches back')
  // Pond falls cost no butterflies in versus.
  place(b, 100, POND_Y + 4)
  b.invuln = 0
  const lives = g.lives
  g.update(frames[0]!, frames)
  assert.equal(b.alive, false)
  assert.equal(g.lives, lives)
  // The clock runs out: the most bonks wins.
  g.versusTicks = 1
  g.update(frames[0]!, frames)
  assert.ok(g.result)
  assert.equal(g.result!.lines[0], 'P1 WINS!')
  for (let t = 0; t < 400 && !g.over; t++) g.update(frames[0]!, frames)
  assert.ok(g.over, 'then the game is over')
}

// --- the pilot: real runs still end, the demo never scores --------------------------------------
{
  type Pilot = Inner & { demoInput(seat?: number): InputFrame }
  for (const seed of [1, 2, 3]) {
    const g = create({
      rng: mulberry32(seed),
      sound: quiet,
      demo: false,
      hiScore: 0,
    }) as unknown as Pilot
    let t = 0
    for (; t < 60 * 60 * 20 && !g.over; t++) g.update(g.demoInput())
    assert.ok(g.over, `seed ${seed}: the pilot's run ends`)
    assert.ok(g.level >= 3, `seed ${seed}: past wave 2`)
  }
  const demo = create({
    rng: mulberry32(7),
    sound: quiet,
    demo: true,
    hiScore: 0,
    players: 4,
  }) as unknown as Inner
  for (let t = 0; t < 60 * 60 * 4 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0)
  assert.equal(demo.riders.length, 1, 'the demo flies solo')
}

console.log('verifyCabinetButterflyJoust: ok')
