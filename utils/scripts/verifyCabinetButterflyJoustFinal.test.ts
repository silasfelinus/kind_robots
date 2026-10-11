// Butterfly Joust depth pass, slice 3 (conductor kr-arcade/t-049): Thunderhead Heights (drifting
// clouds and open sky, rain and the rainbow updraft, lightning), Autumn Orchard (swaying branches,
// gusts, apples, leaf piles, the stream), Lantern Snowfield (ice, the cracking pond, frost, rising
// lanterns, the Lantern wave), the Moon Garden (moonlit ledges and the Gauntlet); the diver, lancer,
// shield beetle and frost moth; Old Thunderhead, the Scarecrow Kite, the Frost Moth Queen and the
// Mirror Moth; the golden petals, the Rainbow Lists, the endings and Champion's Circuit. Each rule
// is pinned on a staged arena.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseLoop } from '../arcade/sound'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/butterflyJoust'
import {
  ARENAS,
  PETAL_ARENAS,
  RAINBOW_LISTS,
  SIGNATURE_WAVE,
  moonState,
} from '../arcade/butterflyJoust/arenas'
import { readJoustSave } from '../arcade/butterflyJoust/campaign'
import type { JoustSave } from '../arcade/butterflyJoust/campaign'
import { CREDITS } from '../arcade/butterflyJoust/credits'
import {
  KITE,
  MIRROR,
  QUEEN,
  THUNDERHEAD,
} from '../arcade/butterflyJoust/finalChampions'
import { CEILING, POND_Y } from '../arcade/butterflyJoust/field'
import { ARENA_MUSIC, ENDING_MUSIC } from '../arcade/butterflyJoust/music'
import { DIVE, FROST, LANCE, ROSTER } from '../arcade/butterflyJoust/roster'
import { LANTERN_WAVE } from '../arcade/butterflyJoust/rules'

type Ledge = {
  x0: number
  x1: number
  y: number
  solid: boolean
  look: string
  floe: boolean
  cracks: number
  frozen: number
  flash: number
  lantern: number
  spec: { moonlit?: boolean; move?: unknown } | null
}
type Body = {
  x: number
  y: number
  vx: number
  vy: number
  ground: Ledge | null
  flap: number
}
type Rider = Body & {
  seat: number
  alive: boolean
  invuln: number
  facing: number
  lunge: number
  stuck: number
  chill: number
  iced: number
  wet: number
  combo: { bonks: number; pot: number; idle: number }
}
type Rival = Body & {
  kind: string
  spawn: number
  shell: boolean
  state: number
  timer: number
  dir: number
}
type Champ = {
  id: string
  hp: number
  maxHp: number
  x: number
  y: number
  done: boolean
  mode?: string
  timer?: number
  stun?: number
  aim?: number | null
  riders?: { x: number; y: number; alive: boolean }[]
  bodies?: { x: number; y: number; lunge: number }[]
  marked?: number | null
  markTime?: number
  wait?: number
  lofted?: number
  retreat?: number
  busy(): boolean
  phase?(): number
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  mode: string
  menu: { pick: number } | null
  arena: { id: string; waves: { label?: string }[] }
  arenaIndex: number
  arenaTicks: number
  wave: number
  card: number
  waveKind: string
  waveTicks: number
  clearing: number
  diedThisWave: boolean
  riders: Rider[]
  rivals: Rival[]
  cocoons: { x: number; y: number; hidden: boolean; kind: string }[]
  apples: Body[] & { kicked: boolean }[]
  piles: { ledge: Ledge; scatter: number }[]
  glows: { x: number; y: number }[]
  glowsSent: number
  glowsCaught: number
  ledges: Ledge[]
  bolts: unknown[]
  champion: Champ | null
  garden: unknown
  ending: { t: number; truly: boolean } | null
  petals: string[]
  cleared: boolean
  rain: { state: string; t: number }
  wind: { state: string; t: number; dir: number }
  veilY: number | null
  lanternWait: number
  banner: { text: string; sub?: string; lines?: string[] } | null
  readonly save: unknown
  readonly music: unknown
  update(input: InputFrame, players?: InputFrame[]): void
  startArena(index: number): void
  nextWave(): void
  addRival(kind: string, delay?: number, at?: { x: number; y: number }): void
  physics(b: Body, max: number): boolean
  perches(): Ledge[]
  afterClear(): void
}

const quiet = { play() {} }
function game(
  options: { players?: number; resume?: unknown; seed?: number } = {},
) {
  return create({
    rng: mulberry32(options.seed ?? 9),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players: options.players,
    resume: options.resume,
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
const HOLD = 1_000_000
const index = (id: string) => ARENAS.findIndex((a) => a.id === id)
/** A tourney staged at an arena's wave, emptied, its title card skipped, the wave held open. */
function stage(
  id: string,
  wave: number,
  options: { players?: number; keep?: boolean } = {},
) {
  const g = game(options)
  g.update(press('a'))
  g.startArena(index(id))
  g.card = 0
  g.wave = wave - 1
  g.nextWave()
  g.card = 0
  g.rivals = []
  if (!options.keep) g.cocoons = []
  g.banner = null
  for (const r of g.riders) r.invuln = 0
  if (!g.champion) g.addRival('drifter', HOLD)
  return g
}
function live(g: Inner) {
  return g.rivals.filter((r) => r.spawn < HOLD / 2)
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
/** Stand a rider on a ledge. */
function stand(r: Rider, l: Ledge, x = (l.x0 + l.x1) / 2) {
  place(r, x, l.y - 8)
  r.ground = l
}

// --- the gardens and the tourney's end, as data --------------------------------------------
{
  assert.deepEqual(
    ARENAS.map((a) => a.id),
    ['sunset', 'meadow', 'heights', 'orchard', 'snowfield', 'moon'],
  )
  assert.deepEqual(
    [...PETAL_ARENAS],
    ['sunset', 'meadow', 'heights', 'orchard', 'snowfield'],
  )
  assert.equal(RAINBOW_LISTS.champion, null)
  const floors = Object.fromEntries(ARENAS.map((a) => [a.id, a.floor]))
  assert.deepEqual(floors, {
    sunset: 'pond',
    meadow: 'pond',
    heights: 'sky',
    orchard: 'stream',
    snowfield: 'ice',
    moon: 'mirror',
  })
  const moon = ARENAS[5]!
  assert.equal(
    moon.waves.filter((w) => w.label?.startsWith('GAUNTLET')).length,
    5,
    'the Gauntlet: five waves, one of each type',
  )
  assert.equal(
    new Set(moon.waves.filter((w) => w.label).map((w) => w.kind)).size,
    5,
  )
  for (const kind of ['diver', 'lancer', 'beetle', 'frost'])
    assert.ok(
      ARENAS.some((a) => a.waves.some((w) => w.riders.includes(kind as never))),
    )
  assert.ok(CREDITS.length > 30)
  for (const loop of [...Object.values(ARENA_MUSIC), ENDING_MUSIC])
    assert.ok(parseLoop(loop).notes.length > 16)
}

// --- Thunderhead Heights -------------------------------------------------------------------
{
  // Open sky below: a fall drops you on the lowest cloud bank, costing the wave's bonus, not a butterfly.
  const g = stage('heights', 2)
  const r = g.riders[0]!
  r.combo = { bonks: 2, pot: 750, idle: 0 }
  place(r, 40, POND_Y - 2)
  r.vy = 2
  const lives = g.lives
  g.update(idle())
  assert.ok(r.alive, 'still flying')
  assert.equal(g.lives, lives, 'no butterfly lost')
  assert.ok(g.diedThisWave, 'but the wave counts it')
  assert.equal(r.combo.pot, 0, 'and the combo is gone')
  assert.ok(r.y < 300, 'back on the cloud bank')

  // Rain soaks the wings: every flap lifts less, and the rainbow updraft dries them.
  const w = stage('heights', 1)
  const q = w.riders[0]!
  w.rain = { state: 'rain', t: 999 }
  for (let t = 0; t < 240; t++) {
    place(q, 100, 120)
    q.invuln = 99
    w.update(idle())
  }
  assert.ok(q.wet > 0.9, 'soaked')
  place(q, 100, 150)
  w.update(press('a'))
  const wetFlap = q.vy
  q.wet = 0
  for (let t = 0; t < 12; t++) w.update(idle())
  place(q, 100, 150)
  w.rain = { state: 'dry', t: 999 }
  w.update(press('a'))
  assert.ok(q.vy < wetFlap - 0.4, 'a dry flap lifts more')
  q.wet = 1
  const bow = ARENAS[2]!.thermals[0]!
  w.arenaTicks = 0
  place(q, bow.x, 200)
  w.update(idle())
  assert.equal(q.wet, 0, 'the rainbow updraft dries them')

  // Lightning flashes a ledge (the tell), then strikes whoever is on it.
  const l = stage('heights', 1)
  const s = l.riders[0]!
  const bank = l.perches()[0]!
  stand(s, bank)
  bank.flash = 2
  l.update(idle())
  assert.ok(s.alive, 'the tell first')
  l.update(idle())
  assert.equal(s.alive, false, 'then the bolt')
  assert.ok(l.bolts.length > 0)
}

// --- the diver, the lancer, the shield beetle and the frost moth ------------------------------
{
  // The diver cruises high, locks over its prey (its shadow the tell), then stoops.
  const g = stage('heights', 1)
  const p = g.riders[0]!
  const d = rival(g, 'diver', 224, CEILING + DIVE.cruise)
  const states = new Set<number>()
  let fastest = 0
  for (let t = 0; t < 200; t++) {
    p.invuln = 999
    place(p, 224, 260)
    g.update(idle())
    states.add(d.state)
    fastest = Math.max(fastest, d.vy)
  }
  assert.ok(states.has(1) && states.has(2), 'lock, then stoop')
  assert.ok(
    fastest >= 2.5,
    'a stoop falls flat out (a thermal slows it a touch)',
  )

  // The lancer wins a level clash, even against a Charge Joust; from above it is bonked.
  const h = stage('heights', 2)
  const q = h.riders[0]!
  place(q, 200, 150)
  q.lunge = 5
  rival(h, 'lancer', 214, 150)
  h.update(idle())
  assert.equal(q.alive, false, 'the lancer wins level')
  const k = stage('heights', 2)
  const u = k.riders[0]!
  place(u, 200, 136)
  rival(k, 'lancer', 200, 150)
  k.update(idle())
  assert.equal(live(k).length, 0, 'bonked from above')
  assert.ok(k.score >= ROSTER.lancer.points)
  // It lowers its lance before it charges.
  const c = stage('heights', 2)
  const v = c.riders[0]!
  const lancer = rival(c, 'lancer', 120, 150)
  let braced = false
  let charged = false
  for (let t = 0; t < 120 && !charged; t++) {
    v.invuln = 999
    place(v, 200, lancer.y)
    c.update(idle())
    if (lancer.state === 1) braced = true
    if (lancer.state === 2) charged = braced
  }
  assert.ok(charged, 'brace, then charge')
  v.invuln = 999
  place(v, 40, 60)
  c.update(idle())
  assert.ok(Math.abs(lancer.vx) >= LANCE.speed * 0.95, 'at full tilt')

  // The shield beetle: the first bonk knocks its shell off, the second curls it up.
  const b = stage('orchard', 1)
  const x = b.riders[0]!
  place(x, 200, 136)
  const beetle = rival(b, 'beetle', 200, 150)
  b.update(idle())
  assert.equal(beetle.shell, false, 'shell off')
  assert.equal(live(b).length, 1, 'still riding')
  for (let t = 0; t < 10 && live(b).length; t++) {
    place(x, beetle.x, beetle.y - 11)
    x.vy = 1
    x.invuln = 0
    b.update(idle())
  }
  assert.ok(x.alive)
  assert.equal(live(b).length, 0, 'second bonk')

  // The frost moth freezes the ledge it lands on; stand there too long and you freeze too.
  const f = stage('snowfield', 1)
  const y = f.riders[0]!
  const ledge = f.perches()[3]!
  const moth = rival(f, 'frost', (ledge.x0 + ledge.x1) / 2, ledge.y - 8)
  moth.ground = ledge as never
  f.update(idle())
  assert.ok(ledge.frozen > 0, 'frozen where it landed')
  f.rivals = f.rivals.filter((r) => r !== moth)
  f.addRival('drifter', HOLD)
  stand(y, ledge)
  for (let t = 0; t < FROST.chill + 2; t++) {
    y.invuln = 999
    f.update(idle())
  }
  assert.ok(y.stuck > 0, 'frozen fast')
  const before = y.x
  f.update(hold('right'))
  assert.equal(y.x, before, 'no moving while frozen')
}

// --- Autumn Orchard ------------------------------------------------------------------------
{
  // Land on an apple and you bounce; nudge one and it knocks a rider down.
  const g = stage('orchard', 1)
  const p = g.riders[0]!
  g.apples.push({
    x: 200,
    y: 150,
    vx: 0,
    vy: 0.5,
    ground: null,
    flap: 0,
    rot: 0,
    kicked: false,
  } as never)
  place(p, 200, 142)
  p.vy = 1
  g.update(idle())
  assert.ok(p.vy < -3, 'boing')
  const h = stage('orchard', 1)
  const q = h.riders[0]!
  const target = rival(h, 'drifter', 260, 150)
  h.apples.push({
    x: 212,
    y: 150,
    vx: 0,
    vy: 0,
    ground: null,
    flap: 0,
    rot: 0,
    kicked: false,
  } as never)
  place(q, 204, 150)
  q.facing = 1
  q.invuln = 99
  h.update(idle())
  const apple = h.apples[0]!
  assert.ok(apple.kicked && apple.vx > 0, 'nudged: the apple flies off')
  place(q, 100, 60)
  let knocked = false
  for (let t = 0; t < 10 && !knocked; t++) {
    place(target, apple.x + 6, apple.y)
    q.invuln = 99
    h.update(idle())
    if (target.vy >= 2.5) knocked = true
  }
  assert.ok(knocked, 'a kicked apple knocks a rider down a ledge')

  // Gusts push fliers the way the vane points.
  const w = stage('orchard', 1)
  w.wind = { state: 'blow', t: 99, dir: -1 }
  const b: Body = { x: 200, y: 100, vx: 0, vy: 0, ground: null, flap: 0 }
  w.physics(b, 3)
  assert.ok(b.vx < 0)

  // Leaf piles hide the cocoon wave's first cocoons until a rider blows through.
  const c = stage('orchard', 3, { keep: true })
  assert.equal(c.waveKind, 'cocoon')
  const hidden = c.cocoons.filter((x) => x.hidden)
  assert.ok(hidden.length >= 3, 'cocoons in the leaves')
  const r = c.riders[0]!
  const cocoon = hidden[0]!
  const before = c.cocoons.length
  place(r, cocoon.x, cocoon.y)
  r.invuln = 99
  c.update(idle())
  assert.equal(cocoon.hidden, false, 'blown out of the pile')
  assert.ok(
    c.piles.some((pile) => pile.scatter > 0),
    'the leaves scatter',
  )
  assert.ok(c.cocoons.length < before, 'and the cocoon is scooped')
  // A hidden cocoon can't be scooped without blowing the pile apart first.
  const other = c.cocoons.find((x) => x.hidden)!
  const scoop = (
    c as unknown as { collideCocoons(p: Rider): void }
  ).collideCocoons.bind(c)
  place(r, other.x, other.y)
  scoop(r)
  assert.ok(c.cocoons.includes(other as never), 'still hidden in the leaves')
}

// --- Lantern Snowfield ----------------------------------------------------------------------
{
  // The frozen pond: three landings on a slab break it.
  const g = stage('snowfield', 1)
  const p = g.riders[0]!
  const slab = g.ledges.find((l) => l.floe)!
  for (let i = 0; i < 3; i++) {
    p.invuln = 99
    place(p, (slab.x0 + slab.x1) / 2, slab.y - 20)
    p.vy = 2
    for (let t = 0; t < 10 && !p.ground; t++) g.update(idle())
    if (i < 2) assert.ok(slab.solid, `still holding after ${i + 1}`)
    g.update(press('a'))
    for (let t = 0; t < 10; t++) g.update(idle())
  }
  assert.equal(slab.solid, false, 'broken')
  assert.equal(slab.cracks, 3)

  // Ice slides: a rider coasts on ice where turf would stop it.
  const i = stage('snowfield', 1)
  const q = i.riders[0]!
  const ice = i.perches().find((l) => l.look === 'ice')!
  stand(q, ice)
  q.vx = 1.2
  i.update(idle())
  i.update(idle())
  const iceV = Math.abs(q.vx)
  const t2 = stage('sunset', 1)
  const s = t2.riders[0]!
  stand(s, t2.perches()[3]!)
  s.vx = 1.2
  t2.update(idle())
  t2.update(idle())
  assert.ok(iceV > Math.abs(s.vx) * 1.5, 'ice keeps you sliding')

  // Lanterns float up as ledges, then fade.
  const l = stage('snowfield', 1)
  l.lanternWait = 1
  l.update(idle())
  const lantern = l.ledges.find((x) => x.look === 'lantern')!
  assert.ok(lantern, 'a lantern rises')
  const y0 = lantern.y
  l.update(idle())
  assert.ok(lantern.y < y0)
  lantern.lantern = 1
  l.update(idle())
  assert.ok(!l.ledges.includes(lantern), 'and fades away')

  // Solo, the snowfield's Team wave is the Lantern wave: catch all eight.
  const w = stage('snowfield', 3)
  assert.equal(w.waveKind, 'lantern')
  const party = stage('snowfield', 3, { players: 2 })
  assert.equal(party.waveKind, 'team', 'two riders get the Team wave')
  w.rivals = []
  const r = w.riders[0]!
  for (let t = 0; t < 60 * 30 && w.clearing === 0; t++) {
    const glow = w.glows[0]
    if (glow) place(r, glow.x, glow.y)
    else place(r, 30, 60)
    r.invuln = 99
    w.update(idle())
  }
  assert.equal(w.glowsCaught, LANTERN_WAVE.count)
  assert.ok(w.banner?.lines?.some((x) => x.startsWith('ALL LANTERNS')))
}

// --- the Moon Garden -------------------------------------------------------------------------
{
  const spec = ARENAS[5]!.moon!
  assert.equal(moonState(spec, 0).out, true)
  assert.equal(moonState(spec, spec.out + 1).out, false)
  const g = stage('moon', 1)
  const moonlit = g.ledges.find((l) => l.spec?.moonlit)!
  const steady = g.ledges.find((l) => l.spec && !l.spec.moonlit)!
  g.arenaTicks = spec.out + 5
  g.update(idle())
  assert.equal(moonlit.solid, false, 'gone while the moon hides')
  assert.equal(steady.solid, true)
  const gauntlet = stage('moon', 4)
  ;(gauntlet as unknown as { startWave(): void }).startWave()
  assert.equal(
    gauntlet.banner?.text,
    'GAUNTLET 2/5',
    'the Gauntlet is announced',
  )
  assert.equal(gauntlet.waveKind, 'gladiator')
}

// --- Old Thunderhead ----------------------------------------------------------------------
{
  const bout = () => {
    const g = stage('heights', 7)
    assert.equal(g.champion!.id, 'thunderhead')
    const c = g.champion!
    c.x = 224
    c.y = 140
    return { g, c, r: g.riders[0]! }
  }
  // The open eye, met level and lance first: a hit.
  {
    const { g, c, r } = bout()
    c.mode = 'open'
    c.timer = 0
    place(r, 224 - 30, 140)
    r.facing = 1
    g.update(idle())
    assert.equal(c.hp, THUNDERHEAD.hp - 1)
    assert.ok(r.alive)
  }
  // The open eye, but from below: just a bump.
  {
    const { g, c, r } = bout()
    c.mode = 'open'
    c.timer = 0
    place(r, 224, 140 + THUNDERHEAD.eyeH + 4)
    g.update(idle())
    assert.ok(r.alive)
    assert.equal(c.hp, THUNDERHEAD.hp)
  }
  // Eye shut: the cloud is deadly.
  {
    const { g, c, r } = bout()
    c.mode = 'shut'
    c.timer = 0
    place(r, 224 - 30, 140)
    r.facing = 1
    g.update(idle())
    assert.equal(r.alive, false)
  }
  // His bolt comes straight down at the end of the charge.
  {
    const { g, c, r } = bout()
    c.mode = 'shut'
    c.timer = THUNDERHEAD.shut
    place(r, c.x, c.y + 30)
    r.invuln = 0
    g.update(idle())
    assert.equal(r.alive, false, 'caught under the bolt')
  }
  // Past half he aims a second bolt at you, and marks it first.
  {
    const { g, c, r } = bout()
    c.hp = 2
    c.mode = 'shut'
    c.timer = THUNDERHEAD.shut - 41
    place(r, 60, 250)
    r.invuln = 999
    g.update(idle())
    assert.ok(c.aim !== null && Math.abs(c.aim! - 60) < 4, 'the mark')
  }
}

// --- The Scarecrow Kite -----------------------------------------------------------------------
{
  const g = stage('orchard', 7)
  const c = g.champion!
  assert.equal(c.id, 'kite')
  const r = g.riders[0]!
  g.update(idle())
  for (let cut = 1; cut <= KITE.hp; cut++) {
    const k = c.riders!.find((x) => x.alive)!
    for (let t = 0; t < 10 && k.alive; t++) {
      place(r, k.x, k.y - 12)
      r.vy = 1
      r.invuln = 0
      g.update(idle())
    }
    assert.equal(k.alive, false, `string ${cut} cut`)
    assert.equal(c.hp, KITE.hp - cut)
  }
  assert.ok(c.done && c.busy(), 'it tumbles')
  for (let t = 0; t < 400 && c.busy(); t++) {
    r.invuln = 999
    place(r, 40, 60)
    g.update(idle())
  }
  assert.ok(!c.busy(), 'into the leaves')
  // Diving, the kite itself is dangerous.
  const h = stage('orchard', 7)
  const kite = h.champion!
  kite.mode = 'dive'
  kite.timer = 0
  const q = h.riders[0]!
  for (let t = 0; t < 5 && q.alive; t++) {
    place(q, kite.x, kite.y + 4)
    q.invuln = 0
    h.update(idle())
  }
  assert.equal(q.alive, false)
}

// --- The Frost Moth Queen ------------------------------------------------------------------
{
  const g = stage('snowfield', 7)
  const c = g.champion!
  assert.equal(c.id, 'queen')
  const r = g.riders[0]!
  // Her wingbeat marks a ledge, then freezes it.
  c.wait = 1
  g.update(idle())
  const marked = c.marked!
  assert.notEqual(marked, null)
  for (let t = 0; t < QUEEN.tell + 2; t++) {
    r.invuln = 999
    place(r, 40, 60)
    g.update(idle())
  }
  const perches = g.perches()
  assert.ok(perches[marked % perches.length]!.frozen > 0, 'frozen')
  // At two thirds the frozen pond shatters.
  c.hp = 4
  g.update(idle())
  assert.ok(
    g.ledges.filter((l) => l.floe).every((l) => !l.solid),
    'shattered',
  )
  // At one third she keeps to the sky, and a flap up there ices the wings.
  c.hp = 2
  g.update(idle())
  assert.equal(g.veilY, QUEEN.veil)
  place(r, 200, QUEEN.veil - 30)
  r.invuln = 999
  g.update(press('a'))
  assert.ok(r.iced > 0, 'wings iced')
  const vy = r.vy
  g.update(press('a'))
  assert.ok(r.vy >= vy, 'no lift with iced wings')
  // Bonk her from above.
  c.lofted = 0
  c.stun = 0
  place(r, c.x, c.y - 14)
  r.vy = 1
  r.invuln = 0
  g.update(idle())
  assert.equal(c.hp, 1)
}

// --- The Mirror Moth --------------------------------------------------------------------
{
  const g = stage('moon', 8)
  const c = g.champion!
  assert.equal(c.id, 'mirror')
  const r = g.riders[0]!
  // It rides your moves a second late.
  for (let t = 0; t < 80; t++) {
    r.invuln = 999
    place(r, 100 + t, 150)
    g.update(idle())
  }
  const body = c.bodies![0]!
  assert.ok(Math.abs(body.x - (100 + 79 - MIRROR.delay)) < 6, 'a second behind')
  // Two mirrors in its second phase, one in its last.
  c.hp = 6
  g.update(idle())
  assert.equal(c.bodies!.length, 2)
  c.hp = 3
  g.update(idle())
  assert.equal(c.bodies!.length, 1)
  // From above it is beaten like any rider.
  const b = c.bodies![0]!
  c.retreat = 0
  for (let t = 0; t < 5 && c.hp === 3; t++) {
    place(r, b.x, b.y - 14)
    r.vy = 1
    r.invuln = 0
    g.update(idle())
  }
  assert.equal(c.hp, 2)
}

// --- the golden petals, the Rainbow Lists, the endings and Champion's Circuit ---------------
{
  // Clear a signature wave without losing a butterfly: its golden petal.
  const g = stage('sunset', SIGNATURE_WAVE)
  g.rivals = []
  g.update(idle())
  assert.ok(g.clearing > 0)
  assert.deepEqual(g.petals, ['sunset'])
  assert.ok(g.banner?.lines?.includes('A GOLDEN PETAL!'))
  assert.deepEqual((g.save as JoustSave).petals, ['sunset'])
  // Lose one and there is no petal.
  const h = stage('meadow', SIGNATURE_WAVE)
  h.rivals = []
  h.diedThisWave = true
  h.update(idle())
  assert.deepEqual(h.petals, [])

  // Without every petal, the Mirror Moth's defeat is the ending.
  const m = stage('moon', 8)
  m.champion!.hp = 0
  for (let t = 0; t < 600 && !m.ending; t++) m.update(idle())
  assert.ok(m.ending && !m.ending.truly, 'the ending')
  assert.ok(m.cleared)
  const saved = readJoustSave(m.save)!
  assert.ok(saved.cleared, 'a clear is kept')
  // The credits roll, then the game is over.
  for (let t = 0; t < 60 * 60 && !m.over; t++) m.update(idle())
  assert.ok(m.over)

  // With all five, the Rainbow Lists open, and its last wave is the true ending.
  const t = stage('moon', 8)
  t.petals = [...PETAL_ARENAS]
  t.champion!.hp = 0
  for (let i = 0; i < 600 && t.arena.id !== 'rainbow'; i++) t.update(idle())
  assert.equal(t.arena.id, 'rainbow', 'the Rainbow Lists')
  assert.equal(t.wave, 1)
  t.card = 0
  for (let wave = 1; wave <= RAINBOW_LISTS.waves.length; wave++) {
    t.rivals = []
    t.cocoons = []
    t.update(idle())
    for (let i = 0; i < 300 && t.clearing > 0; i++) t.update(idle())
  }
  assert.ok(t.ending?.truly, 'the true ending')

  // A cleared save opens Champion's Circuit: the tourney again, a lap harder.
  const circuit = game({ resume: saved })
  const rows = (
    circuit as unknown as { menuRows(): { id: string }[] }
  ).menuRows()
  const row = rows.findIndex((x) => x.id === 'circuit')
  assert.ok(row >= 0, "Champion's Circuit on the card")
  circuit.menu!.pick = row
  circuit.update(press('a'))
  assert.equal(circuit.arena.id, 'sunset')
  assert.equal(circuit.arenaIndex, ARENAS.length, 'a lap on')
  assert.ok(circuit.music !== null)
}

console.log('verifyCabinetButterflyJoustFinal: ok')
