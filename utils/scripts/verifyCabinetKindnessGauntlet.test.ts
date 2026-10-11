// Kindness Gauntlet depth pass, slice 1 (conductor kr-arcade/t-051, depth-pass/CABINETS.md section
// 5): the menagerie. Each new glitch kind is staged on an open floor and beaten its own way: the
// static brute's stomp and shove, the pop-up's lob (and its blind spot up close), the firewall imp's
// straight shots, the pickpocket and the leech giving back what they stole, the coffee spill that
// only a pulse dries, the bug swarm, and the mimic snack. Then the generators' three tiers, sparked
// snacks, spark-to-share, the Hug Token, seat scores, the Mainframe's voice and a pilot probe.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/kindnessGauntlet'
import {
  GLITCH_KINDS,
  POPUP_NEAR,
  ROSTER,
  debutOn,
  newGlitch,
} from '../arcade/kindnessGauntlet/roster'
import type {
  Glitch,
  GlitchKind,
  Tier,
} from '../arcade/kindnessGauntlet/roster'
import {
  GENERATOR_SPRITES,
  GLITCH_FRAMES,
} from '../arcade/kindnessGauntlet/rosterArt'
import { VOICE_LINES } from '../arcade/kindnessGauntlet/voice'

type Hero = {
  seat: number
  cls: string
  choice: number
  x: number
  y: number
  facing: number
  battery: number
  pulses: number
  flat: boolean
  points: number
  fireCooldown: number
}
type Item = { x: number; y: number; kind: string }
type Generator = {
  id: number
  x: number
  y: number
  kind: GlitchKind
  tier: Tier
  topTier: Tier
  per: number
  hp: number
  maxHp: number
  timer: number
  flash: number
}
type Inner = {
  score: number
  level: number
  over: boolean
  heroes: Hero[]
  walls: Uint8Array
  seen: Uint8Array
  keys: number
  doors: Array<{ tiles: number[]; open: boolean }>
  generators: Generator[]
  glitches: Glitch[]
  items: Item[]
  sparks: unknown[]
  shots: Array<{ kind: string; x: number; y: number; vx?: number; vy?: number }>
  token: {
    x: number
    y: number
    holder: number
    wait: number
    vx: number
    vy: number
  } | null
  exit: { x: number; y: number }
  voice: { text: string; cue: string } | null
  intro: { kind: GlitchKind } | null
  nextId: number
  mapExit(): void
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: unknown): void
  demoInput(): InputFrame
}

const quiet = { play: () => {} }
const idle = () => emptyInput()
const tap = (button: keyof InputFrame['held']) => {
  const f = emptyInput()
  f.held[button] = true
  f.pressed[button] = true
  return f
}
const hold = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}

/** A game past the bot select: `classes` are CLASS_ORDER indices (hugs, fix, sage, zip). */
function game(classes: number[] = [1], seed = 3): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players: classes.length,
  }) as unknown as Inner
  g.heroes.forEach((h, i) => (h.choice = classes[i]!))
  const all = classes.map(() => tap('a'))
  g.update(all[0]!, all)
  return g
}

/** An open floor with nothing on it: the bots at (160, 240), the stairs far off at (600, 440). */
function stage(g: Inner) {
  g.walls.fill(0)
  g.seen.fill(1)
  g.generators = []
  g.glitches = []
  g.items = []
  g.shots = []
  g.sparks = []
  g.doors = []
  g.token = null
  g.exit = { x: 600, y: 440 }
  g.mapExit()
  g.heroes.forEach((h, i) => {
    h.x = 160 + i * 40
    h.y = 240
    h.battery = 300
    h.flat = false
  })
}

function put(g: Inner, kind: GlitchKind, x: number, y: number, tier: Tier = 1) {
  const gl = newGlitch(kind, x, y, tier, g.nextId++, -1, 1)
  g.glitches.push(gl)
  return gl
}

function run(
  g: Inner,
  ticks: number,
  frames: () => InputFrame[] = () => [idle()],
) {
  for (let i = 0; i < ticks; i++) {
    const f = frames()
    g.update(f[0]!, f)
  }
}

/** Turn a bot to face along an arrow, without moving or throwing. */
function face(
  g: Inner,
  seat: number,
  button: 'up' | 'right' | 'down' | 'left',
) {
  g.heroes[seat]!.facing = { up: 0, right: 2, down: 4, left: 6 }[button]
}

// --- the roster ---------------------------------------------------------------------------

{
  const fresh: GlitchKind[] = [
    'brute',
    'popup',
    'imp',
    'pickpocket',
    'leech',
    'spill',
    'bug',
    'mimic',
  ]
  for (const kind of fresh)
    assert.ok(GLITCH_KINDS.includes(kind), `${kind} is in the roster`)
  assert.ok(GLITCH_KINDS.length >= 9, 'the glitch and eight new kinds')
  for (const kind of GLITCH_KINDS) {
    const e = ROSTER[kind]
    assert.ok(
      e.tell.length > 3 && e.answer.length > 3,
      `${kind} has a tell and an answer`,
    )
    assert.ok(GENERATOR_SPRITES[e.look], `${kind} has a generator`)
    if (kind !== 'spill')
      assert.ok(GLITCH_FRAMES[kind].length >= 2, `${kind} has its own sprite`)
  }
  // Every new kind debuts on its own floor, one floor at a time.
  const debuts = fresh.map((k) => ROSTER[k].debut).sort((a, b) => a - b)
  assert.equal(
    new Set(debuts.filter((d) => d > 1)).size,
    debuts.filter((d) => d > 1).length,
  )
  for (let floor = 2; floor <= 8; floor++)
    assert.ok(debutOn(floor), `a kind debuts on floor ${floor}`)
}

// A floor that fields a kind for the first time opens with its card, down through the wings.
{
  const g = game()
  const seen: Partial<Record<GlitchKind, number>> = {}
  if (g.intro) seen[g.intro.kind] = 1
  for (let floor = 2; floor <= 16; floor++) {
    ;(g as unknown as { buildFloor(n: number): void }).buildFloor(floor)
    if (g.intro) seen[g.intro.kind] = floor
  }
  assert.equal(seen.brute, 1, 'the brute on floor 1')
  assert.equal(seen.pickpocket, 2, 'the pickpocket on floor 2')
  assert.equal(seen.popup, 3, 'the pop-up on floor 3')
  assert.equal(seen.bluescreen, 5, 'the Big Bluescreen on floor 5')
  assert.equal(seen.imp, 9, 'the firewall imp opens the Tape Library')
  assert.ok(
    seen.worm && seen.spill,
    'the Library brings worms and coffee spills',
  )
}

// --- generators in three tiers --------------------------------------------------------------

{
  const g = game([1])
  stage(g)
  const gen: Generator = {
    id: 999,
    x: 160,
    y: 160,
    kind: 'brute',
    tier: 3,
    topTier: 3,
    per: 1,
    hp: 3,
    maxHp: 3,
    timer: 1,
    flash: 0,
  }
  g.generators = [gen]
  run(g, 2)
  const first = g.glitches.find((x) => x.kind === 'brute')
  assert.ok(first, 'a tier-3 feeder releases a brute')
  assert.equal(
    first!.hp,
    ROSTER.brute.hp + ROSTER.brute.tierHp,
    'tier 3 releases the toughest',
  )
  g.glitches = []
  // Every hit drops it a tier.
  face(g, 0, 'up')
  run(g, 30, () => [hold('a', 'up')])
  assert.ok(gen.tier < 3 || !g.generators.includes(gen), 'a hit drops a tier')
  const tiers: number[] = []
  for (let i = 0; i < 200 && g.generators.includes(gen); i++) {
    g.glitches = []
    g.update(hold('a', 'up'), [hold('a', 'up')])
    tiers.push(gen.tier)
  }
  assert.ok(!g.generators.includes(gen), 'three hits shut it down')
  assert.ok(g.score > 0)
}

// --- the static brute: keep your distance; Hugs' sparks pierce -------------------------------

{
  const g = game([1])
  stage(g)
  const b = put(g, 'brute', 200, 240)
  const fix = g.heroes[0]!
  const x0 = fix.x
  let windup = false
  for (let i = 0; i < 120; i++) {
    g.update(idle(), [idle()])
    if (b.state === 'windup') windup = true
  }
  assert.ok(windup, 'it stomps (winds up) before it shoves')
  assert.ok(fix.x < x0 - 10, 'the shove knocks the bot back a tile')
  assert.ok(fix.battery < 300, 'and costs charge')

  // Kept at a distance, it never lands one.
  const far = game([1])
  stage(far)
  const fb = put(far, 'brute', 300, 240)
  for (let i = 0; i < 240; i++) {
    const hero = far.heroes[0]!
    hero.x = Math.min(hero.x, fb.x - 40)
    far.update(idle(), [idle()])
  }
  assert.equal(far.heroes[0]!.battery > 290, true, 'out of reach, no shove')

  // Hugs's big sparks hit twice: a brute takes two from Hugs, three from Fix.
  const sparksToFix = (cls: number) => {
    const h = game([cls])
    stage(h)
    const brute = put(h, 'brute', 240, 240)
    brute.state = 'rest'
    brute.t = 9999
    face(h, 0, 'right')
    let thrown = 0
    for (let i = 0; i < 400 && h.glitches.includes(brute); i++) {
      brute.state = 'rest'
      brute.t = 9999
      const f = i % 30 === 0 ? tap('a') : idle()
      if (f.pressed.a) thrown++
      h.update(f, [f])
    }
    assert.ok(!h.glitches.includes(brute), 'fixed')
    return thrown
  }
  assert.equal(sparksToFix(0), 2, 'Hugs: two sparks')
  assert.equal(sparksToFix(1), 3, 'Fix: three sparks')
}

// --- the pop-up: it lobs over racks, but not up close -------------------------------------------

{
  const g = game([1])
  stage(g)
  // A rack wall between them: packets fly over it.
  for (let ty = 0; ty < 30; ty++) g.walls[ty * 40 + 15] = 1
  g.mapExit()
  const p = put(g, 'popup', 320, 240)
  let told = false
  let lobbed: { x: number; y: number } | null = null
  for (let i = 0; i < 200 && !lobbed; i++) {
    g.update(idle(), [idle()])
    if (p.t <= 40 && p.t > 0) told = true
    const shot = g.shots.find((s) => s.kind === 'packet')
    if (shot) lobbed = { x: shot.x, y: shot.y }
  }
  assert.ok(told, 'a "!" before the lob')
  assert.ok(lobbed, 'it lobs over the rack')
  const before = g.heroes[0]!.battery
  run(g, 60)
  assert.ok(
    g.heroes[0]!.battery < before - 5,
    'a bot that stays put is splashed',
  )

  // Stepping off the landing ring dodges it.
  const d = game([1])
  stage(d)
  for (let ty = 0; ty < 30; ty++) d.walls[ty * 40 + 15] = 1
  d.mapExit()
  put(d, 'popup', 320, 240)
  for (let i = 0; i < 200 && !d.shots.length; i++) d.update(idle(), [idle()])
  const b0 = d.heroes[0]!.battery
  run(d, 60, () => [hold('down')])
  assert.ok(d.heroes[0]!.battery >= b0 - 2, 'out of the ring, no splash')

  // In its room, it cannot lob at all.
  const near = game([1])
  stage(near)
  const np = put(near, 'popup', 160 + POPUP_NEAR - 16, 240)
  for (let i = 0; i < 300; i++) {
    near.heroes[0]!.x = np.x - 24
    near.heroes[0]!.y = np.y
    near.update(idle(), [idle()])
  }
  assert.equal(near.shots.length, 0, 'up close it never lobs')
}

// --- the firewall imp: straight lines only; move diagonally ------------------------------------

{
  const g = game([1])
  stage(g)
  const imp = put(g, 'imp', 160, 140)
  let inhaled = false
  let bolt: { vx?: number; vy?: number } | undefined
  for (let i = 0; i < 300 && !bolt; i++) {
    g.update(idle(), [idle()])
    if (imp.state === 'inhale') inhaled = true
    bolt = g.shots.find((s) => s.kind === 'bolt')
  }
  assert.ok(inhaled, 'it breathes in first (its tell)')
  assert.ok(bolt, 'and fires')
  assert.ok(
    bolt!.vx === 0 || bolt!.vy === 0,
    'only ever along a row or a column',
  )
  const b0 = g.heroes[0]!.battery
  run(g, 80)
  assert.ok(g.heroes[0]!.battery < b0, 'a bot on its line is hit')

  // A bot that steps off the line as it inhales is missed.
  const d = game([1])
  stage(d)
  const di = put(d, 'imp', 160, 140)
  for (let i = 0; i < 300 && di.state !== 'inhale'; i++)
    d.update(idle(), [idle()])
  const db = d.heroes[0]!.battery
  for (let i = 0; i < 40 && !d.shots.length; i++)
    d.update(hold('right', 'down'), [hold('right', 'down')])
  assert.equal(d.shots.length, 1, 'it fires down its column')
  // Its one shot is away; take the imp off so only that bolt is in play.
  d.glitches = d.glitches.filter((x) => x !== di)
  run(d, 100)
  assert.ok(d.heroes[0]!.battery >= db - 5, 'off the line, the bolt flies past')
}

// --- the pickpocket: spark it before it leaves and it drops the loot ---------------------------

{
  const g = game([1])
  stage(g)
  g.keys = 1
  const p = put(g, 'pickpocket', 175, 240)
  run(g, 10)
  assert.equal(g.keys, 0, 'it takes the key')
  assert.equal(p.loot?.kind, 'key')
  assert.equal(g.voice?.cue, 'key-stolen', 'the Mainframe raises the alarm')
  const exitD = () => Math.hypot(g.exit.x - p.x, g.exit.y - p.y)
  const d0 = exitD()
  run(g, 60)
  assert.ok(exitD() < d0 - 30, 'and runs for the stairs')
  // Sparked: it drops the key, and the key can be picked up again.
  ;(g as unknown as { fixGlitch(gl: Glitch, by: Hero): void }).fixGlitch(
    p,
    g.heroes[0]!,
  )
  const key = g.items.find((i) => i.kind === 'key')
  assert.ok(key, 'the key falls where it was fixed')
  g.heroes[0]!.x = key!.x
  g.heroes[0]!.y = key!.y
  run(g, 2)
  assert.equal(g.keys, 1, 'and is back on the ring')

  // Escaping with the only key to a locked door: a spare turns up.
  const e = game([1])
  stage(e)
  e.keys = 1
  e.doors = [{ tiles: [0], open: false }]
  e.walls[0] = 2
  e.exit = { x: 200, y: 240 }
  e.mapExit()
  const ep = put(e, 'pickpocket', 175, 240)
  run(e, 120)
  assert.ok(!e.glitches.includes(ep), 'it got away down the stairs')
  assert.ok(
    e.items.some((i) => i.kind === 'key'),
    'a spare key turns up so the floor stays winnable',
  )
}

// --- the leech: spark it to get the charge back --------------------------------------------------

{
  const g = game([1])
  stage(g)
  const l = put(g, 'leech', 172, 240)
  run(g, 10)
  const hero = g.heroes[0]!
  assert.equal(l.loot?.kind, 'charge', 'it takes charge')
  const robbed = hero.battery
  assert.ok(robbed <= 300 - 30)
  const d0 = Math.hypot(l.x - hero.x, l.y - hero.y)
  run(g, 30)
  assert.ok(Math.hypot(l.x - hero.x, l.y - hero.y) > d0, 'and runs off with it')
  ;(g as unknown as { fixGlitch(gl: Glitch, by: Hero): void }).fixGlitch(
    l,
    hero,
  )
  assert.ok(hero.battery >= robbed + 30, 'sparked, it gives the charge back')

  const late = game([1])
  stage(late)
  const ll = put(late, 'leech', 172, 240)
  run(late, 10)
  run(late, 8 * 60 + 10)
  assert.equal(ll.loot, null, 'left alone, it digests the charge')
}

// --- the coffee spill: unsparkable; a pulse dries it ---------------------------------------------

{
  const g = game([1])
  stage(g)
  const s = put(g, 'spill', 200, 240)
  s.vx = 0
  s.vy = 0
  // Sparks pass over it.
  face(g, 0, 'right')
  run(g, 40, () => [hold('a', 'right')])
  assert.ok(g.glitches.includes(s), 'sparks cannot fix a spill')
  // It soaks a bot standing in it.
  g.heroes[0]!.x = s.x
  g.heroes[0]!.y = s.y
  const b0 = g.heroes[0]!.battery
  run(g, 40)
  assert.ok(g.heroes[0]!.battery < b0, 'standing in it drains charge')
  // A pulse dries it for five seconds.
  g.heroes[0]!.pulses = 1
  g.update(tap('b'), [tap('b')])
  assert.equal(s.state, 'dry')
  const b1 = g.heroes[0]!.battery
  g.heroes[0]!.x = s.x
  g.heroes[0]!.y = s.y
  run(g, 60)
  assert.ok(g.heroes[0]!.battery >= b1 - 3, 'dry, it is harmless')
  run(g, 5 * 60)
  assert.equal(s.state, 'walk', 'and it comes back')
}

// --- the bug swarm: comes out ten at a time from tier 3; a pulse clears it ---------------------

{
  for (const [tier, count] of [
    [1, 6],
    [2, 8],
    [3, 10],
  ] as const) {
    const g = game([1])
    stage(g)
    g.generators = [
      {
        id: 7,
        x: 200,
        y: 200,
        kind: 'bug',
        tier,
        topTier: tier,
        per: 1,
        hp: tier,
        maxHp: tier,
        timer: 1,
        flash: 0,
      },
    ]
    g.update(idle(), [idle()])
    assert.equal(
      g.glitches.filter((x) => x.kind === 'bug').length,
      count,
      `a tier-${tier} nest lets out ${count}`,
    )
    if (tier === 3) {
      g.heroes[0]!.pulses = 1
      g.update(tap('b'), [tap('b')])
      assert.equal(
        g.glitches.filter((x) => x.kind === 'bug').length,
        0,
        'a pulse fixes the swarm',
      )
    }
  }
}

// --- the mimic snack: spark it and it becomes a real one --------------------------------------

{
  const g = game([1])
  stage(g)
  const m = put(g, 'mimic', 200, 240)
  const hero = g.heroes[0]!
  run(g, 60, () => [hold('right')])
  assert.equal(m.state, 'awake', 'reaching for it wakes it')
  assert.ok(hero.battery < 300 - 15, 'and it bites')
  assert.equal(g.voice?.cue, 'mimic', 'the Mainframe warned you')

  const s = game([1])
  stage(s)
  const sm = put(s, 'mimic', 220, 240)
  face(s, 0, 'right')
  run(s, 40, () => [hold('a', 'right')])
  assert.ok(!s.glitches.includes(sm), 'sparked')
  assert.ok(
    s.items.some((i) => i.kind === 'snack'),
    'it is a real snack now',
  )
}

// --- snacks break under sparks, and the Mainframe minds ---------------------------------------

{
  const g = game([1])
  stage(g)
  g.items = [{ x: 220, y: 240, kind: 'snack' }]
  face(g, 0, 'right')
  run(g, 30, () => [hold('a', 'right')])
  assert.equal(g.items.length, 0, 'a spark breaks the snack')
  assert.equal(g.voice?.cue, 'snack-sparked')
  assert.ok(VOICE_LINES['snack-sparked'].some((l) => /SNACK/.test(l)))
}

// --- spark-to-share: a spark that hits a partner moves charge, never harm ----------------------

{
  const g = game([1, 3])
  stage(g)
  const [a, b] = g.heroes
  b!.battery = 100
  face(g, 0, 'right')
  const frames = () => [tap('a'), idle()]
  run(g, 1, frames)
  run(g, 20, () => [idle(), idle()])
  assert.equal(a!.battery, 300 - 5, 'the thrower gives five')
  assert.equal(b!.battery, 100 + 5, 'the partner gets five')

  // A flat partner sparked up to a charge rolls again.
  b!.battery = 0
  b!.flat = true
  for (let i = 0; i < 10; i++) {
    run(g, 1, frames)
    run(g, 20, () => [idle(), idle()])
  }
  assert.ok(!b!.flat, 'ten kind sparks bring a flat bot back')
}

// --- the Hug Token ------------------------------------------------------------------------------

{
  const g = game([1, 3])
  stage(g)
  const [a, b] = g.heroes
  g.token = { x: a!.x + 4, y: a!.y, vx: 0, vy: 0, holder: -1, wait: 0 }
  run(g, 2, () => [idle(), idle()])
  assert.equal(g.token?.holder, 0, 'rolling into it picks it up')
  assert.equal(g.voice?.cue, 'token-taken')
  // Every glitch on the floor wants the holder, however far.
  const far = put(g, 'glitch', a!.x + 400, a!.y + 200)
  const d0 = Math.hypot(far.x - a!.x, far.y - a!.y)
  run(g, 60, () => [idle(), idle()])
  assert.ok(
    Math.hypot(far.x - a!.x, far.y - a!.y) < d0 - 20,
    'it draws every glitch',
  )
  // Double points for the holder.
  const s0 = a!.points
  ;(g as unknown as { fixGlitch(gl: Glitch, by: Hero): void }).fixGlitch(
    far,
    a!,
  )
  assert.equal(a!.points - s0, ROSTER.glitch.points * 2, 'double points')
  // Passed by touch.
  g.token!.wait = 0
  b!.x = a!.x + 8
  b!.y = a!.y
  run(g, 1, () => [idle(), idle()])
  assert.equal(g.token?.holder, 1, 'a touch passes it on')
  // Carried into a generator, it overloads it.
  g.generators = [
    {
      id: 5,
      x: b!.x + 10,
      y: b!.y,
      kind: 'glitch',
      tier: 3,
      topTier: 3,
      per: 2,
      hp: 6,
      maxHp: 6,
      timer: 999,
      flash: 0,
    },
  ]
  const before = b!.points
  run(g, 1, () => [idle(), idle()])
  assert.equal(g.generators.length, 0, 'overloaded at once')
  assert.equal(g.token, null, 'the token is spent')
  assert.ok(b!.points > before)
  // A flat holder drops it.
  const h = game([1, 3])
  stage(h)
  h.token = { x: 0, y: 0, vx: 0, vy: 0, holder: 0, wait: 0 }
  h.heroes[0]!.battery = 0
  run(h, 2, () => [idle(), idle()])
  assert.ok(h.token === null || h.token.holder === -1, 'dropped')
}

// --- seat scores, the low-battery call, and the select screen untouched ------------------------

{
  const g = game([1, 3])
  stage(g)
  const [a, b] = g.heroes
  const gl = put(g, 'glitch', 0, 0)
  ;(g as unknown as { fixGlitch(gl: Glitch, by: Hero): void }).fixGlitch(gl, b!)
  assert.equal(b!.points, ROSTER.glitch.points, "P2's fix is P2's points")
  assert.equal(a!.points, 0)
  assert.equal(
    g.score,
    a!.points + b!.points,
    'the team score is everyone together',
  )
  a!.battery = 70
  run(g, 1, () => [idle(), idle()])
  assert.equal(g.voice?.cue, 'low')
  assert.match(g.voice!.text, /FIX/, 'the Mainframe names the bot')
}

// --- probes: the demo never scores; the pilot's runs end -------------------------------------------

{
  const demo = create({
    rng: mulberry32(5),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  for (let t = 0; t < 60 * 60 * 3 && !demo.over; t++) demo.update(idle())
  assert.equal(demo.score, 0, 'the attract demo scores nothing')

  // The old pilot strolled through eight floors untouched; the menagerie now wears it down.
  for (const seed of [1, 2]) {
    const g = game([seed % 4], seed)
    let t = 0
    for (; t < 60 * 60 * 20 && !g.over; t++) {
      const f = g.demoInput()
      g.update(f, [f])
    }
    assert.ok(g.over, `pilot run ${seed} ends with real charge`)
    assert.ok(t > 60 * 60, `pilot run ${seed} lasts more than a minute`)
    assert.ok(g.level >= 3, `pilot run ${seed} gets a few floors down`)
  }

  // Four bots, the token and the whole roster: a long co-op run stays sane.
  const four = game([0, 1, 2, 3], 9)
  ;(four as unknown as { buildFloor(n: number): void }).buildFloor(8)
  for (let t = 0; t < 60 * 90 && !four.over; t++) {
    const frames = four.heroes.map((_, i) => {
      const f = emptyInput()
      f.held.a = (t + i * 40) % 200 < 120
      f.pressed.a = (t + i * 7) % 15 === 0
      f.held.right = (t + i * 60) % 240 < 60
      f.held.down = (t + i * 30) % 300 < 30
      f.pressed.b = t % 900 === i * 200
      return f
    })
    four.update(frames[0]!, frames)
  }
  assert.ok(Number.isFinite(four.score))
}

console.log('Kindness Gauntlet menagerie: ok')
