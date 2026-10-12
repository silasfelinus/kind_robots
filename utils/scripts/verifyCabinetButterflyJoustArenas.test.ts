// Butterfly Joust depth pass, slice 2 (conductor kr-arcade/t-048): the arena engine (ledges as
// data, crumbling, folding, drifting and one-use puff ledges, thermals and wind), the tourney's
// flow from waves to champion bout to the Wing Garden and on, the save and resume at an arena's
// start, Sunset Pond and Spring Meadow, the glider, the twin riders and the pollen bomber, Sir
// Bumbleton and the Dandelion Duchess. Each rule is pinned on a staged arena.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { parseLoop } from '../arcade/sound'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/butterflyJoust'
import {
  ARENAS,
  CHAMPIONS,
  PUFF_STAND,
  WAVES_PER_ARENA,
  arenaAt,
  arenaHeat,
  flowerState,
  thermalOn,
} from '../arcade/butterflyJoust/arenas'
import type { Arena } from '../arcade/butterflyJoust/arenas'
import {
  FLAP_BOOST,
  SHOP,
  readJoustSave,
} from '../arcade/butterflyJoust/campaign'
import type { JoustSave } from '../arcade/butterflyJoust/campaign'
import { BUMBLETON, DUCHESS } from '../arcade/butterflyJoust/champions'
import { CEILING, POND_Y, W } from '../arcade/butterflyJoust/field'
import {
  CHAMPION_MUSIC,
  GARDEN_MUSIC,
  MEADOW_MUSIC,
  SUNSET_MUSIC,
} from '../arcade/butterflyJoust/music'
import { POLLEN, ROSTER } from '../arcade/butterflyJoust/roster'

type Ledge = {
  x0: number
  x1: number
  y: number
  solid: boolean
  puff: boolean
  stood: number
  closing: number
  spec: { fold?: unknown; move?: unknown; crumbles?: boolean } | null
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
  alive: boolean
  invuln: number
  facing: number
  sneeze: number
  held: boolean
}
type Rival = Body & {
  kind: string
  spawn: number
  drop: number
  cooldown: number
}
type Champion = {
  id: string
  hp: number
  maxHp: number
  x: number
  y: number
  done: boolean
  mode?: string
  stun?: number
  retreat?: number
  timer?: number
  mark?: { x: number; y: number }
  bees?: { x: number; y: number }[]
  seeds?: { x: number; y: number }[]
  gust?: number
  phase?(): number
  busy(): boolean
}
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  mode: string
  menu: { pick: number } | null
  arena: Arena
  arenaIndex: number
  arenaTicks: number
  wave: number
  card: number
  waveKind: string
  clearing: number
  riders: Rider[]
  rivals: Rival[]
  cocoons: { x: number; y: number; kind: string }[]
  dust: { x: number; y: number; cloud: boolean; t: number }[]
  ledges: Ledge[]
  champion: Champion | null
  garden: { pick: number; t: number } | null
  pollen: number
  up: { flap: number; combo: number; frog: number }
  wings: string[]
  wear: string
  wind: { state: string; t: number; dir: number }
  banner: { text: string; sub?: string } | null
  readonly save: unknown
  readonly music: unknown
  update(input: InputFrame, players?: InputFrame[]): void
  startWave(): void
  startArena(index: number): void
  nextWave(): void
  addRival(kind: string, delay?: number, at?: { x: number; y: number }): void
  updateLedges(): void
  physics(b: Body, max: number, glide?: boolean): boolean
}

const quiet = { play() {} }
function game(
  options: { players?: number; resume?: unknown; seed?: number } = {},
) {
  return create({
    rng: mulberry32(options.seed ?? 5),
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
const idle = () => emptyInput()
/** A tourney under way (the mode card's first row), its title card skipped. */
function tourney(options: { players?: number; seed?: number } = {}): Inner {
  const g = game(options)
  g.update(press('a'))
  assert.equal(g.mode, 'tourney')
  g.card = 0
  return g
}
/** An arena and wave of the tourney, emptied, with every rider ready and a holder keeping it open. */
function stage(g: Inner, arena: number, wave: number) {
  g.startArena(arena)
  g.card = 0
  g.wave = wave - 1
  g.nextWave()
  g.rivals = []
  g.cocoons = []
  g.banner = null
  for (const r of g.riders) r.invuln = 0
  g.addRival('drifter', HOLD)
}
const HOLD = 1_000_000
function live(g: Inner) {
  return g.rivals.filter((r) => r.spawn < HOLD / 2)
}
function place(b: Body, x: number, y: number) {
  Object.assign(b, { x, y, vx: 0, vy: 0, ground: null, flap: 0 })
}

// --- the gardens as data --------------------------------------------------------------------
{
  assert.ok(ARENAS.length >= 2)
  const signature: Record<string, string> = {
    sunset: 'survival',
    meadow: 'gladiator',
    heights: 'storm',
    orchard: 'cocoon',
    snowfield: 'team',
    moon: 'survival',
  }
  for (const arena of ARENAS) {
    assert.equal(
      arena.waves.length,
      arena.id === 'moon' ? WAVES_PER_ARENA + 1 : WAVES_PER_ARENA,
      `${arena.id}: six waves (the Moon Garden's Gauntlet, seven)`,
    )
    assert.equal(
      arena.waves[2]!.kind,
      signature[arena.id],
      `${arena.id}: wave 3 is its signature`,
    )
    const home = arena.ledges[arena.home]!
    assert.ok(
      !home.fold && !home.move,
      `${arena.id}: riders start on a steady ledge`,
    )
    assert.ok(
      home.x1 - home.x0 >= 4 * 34,
      `${arena.id}: four seats fit the home ledge`,
    )
    assert.ok(arena.spawns.length >= 4)
    if (arena.champion) assert.ok(CHAMPIONS[arena.champion])
    for (const wave of arena.waves)
      for (const kind of wave.riders)
        assert.ok(ROSTER[kind], `${arena.id}: ${kind} is a rider`)
    for (const l of arena.ledges) {
      assert.ok(
        l.y > CEILING && l.y < POND_Y,
        `${arena.id}: ledges inside the arena`,
      )
      assert.ok(l.x1 > l.x0)
    }
  }
  // The meadow brings its new riders.
  const meadow = ARENAS[1]!.waves.flatMap((w) => w.riders)
  for (const kind of ['glider', 'twin', 'bomber'])
    assert.ok(meadow.includes(kind as never))
  // Difficulty keeps climbing through the tourney, and laps on.
  assert.ok(arenaHeat(1, 1) > arenaHeat(0, 1))
  assert.ok(arenaHeat(0, 6) > arenaHeat(0, 1))
  assert.equal(arenaAt(ARENAS.length).lap, 1)
  assert.equal(arenaAt(ARENAS.length).arena.id, ARENAS[0]!.id)
  // Every loop is music the sequencer can play.
  for (const loop of [SUNSET_MUSIC, MEADOW_MUSIC, CHAMPION_MUSIC, GARDEN_MUSIC])
    assert.ok(parseLoop(loop).notes.length > 20)
}

// --- the mode card, the tourney's flow, the Wing Garden and the save -------------------------
{
  const g = game()
  assert.ok(g.menu, 'the mode card first')
  assert.equal(g.save, undefined, 'nothing saved before a choice')
  assert.equal(g.music, null)
  g.update(press('a'))
  assert.equal(g.mode, 'tourney')
  assert.equal(g.arena.id, 'sunset')
  assert.equal(g.wave, 1)
  assert.equal(g.level, 1)
  assert.ok(g.card > 0, 'the arena opens on its title card')
  assert.equal(g.music, SUNSET_MUSIC)
  const saved = readJoustSave(g.save)
  assert.ok(saved, 'saved at the arena start')
  assert.equal(saved!.arena, 0)

  // Clear the six waves: each one announced, then the champion steps out.
  g.card = 0
  for (let wave = 1; wave <= WAVES_PER_ARENA; wave++) {
    assert.equal(g.wave, wave)
    g.rivals = []
    g.cocoons = []
    g.update(idle())
    assert.ok(g.clearing > 0, `wave ${wave} clears`)
    for (let t = 0; t < 200 && g.clearing > 0; t++) g.update(idle())
  }
  assert.equal(g.wave, WAVES_PER_ARENA + 1)
  assert.ok(g.champion, 'the champion bout')
  assert.equal(g.champion!.id, 'bumbleton')
  assert.equal(g.music, CHAMPION_MUSIC)
  assert.equal(g.banner?.text, CHAMPIONS.bumbleton.name)
  const pollen = g.pollen
  g.champion!.hp = 0
  g.update(idle())
  assert.ok(g.pollen > pollen, 'a champion pays pollen')
  assert.ok(g.banner?.text.includes('CHAMPION'))
  for (let t = 0; t < 400 && !g.garden; t++) g.update(idle())
  assert.ok(g.garden, 'then the Wing Garden')
  assert.equal(g.music, GARDEN_MUSIC)

  // The garden: buy a spare butterfly, a stronger flap, wings; refuse what can't be afforded.
  g.pollen = 200
  const lives = g.lives
  const row = (id: string) => SHOP.findIndex((item) => item.id === id)
  const buy = (id: string) => {
    g.garden!.pick = row(id)
    g.update(press('a'))
  }
  buy('spare')
  assert.equal(g.lives, lives + 1, 'a spare butterfly')
  assert.equal(g.pollen, 200 - SHOP[row('spare')]!.price)
  buy('flap')
  assert.equal(g.up.flap, 1)
  buy('morpho')
  assert.ok(g.wings.includes('morpho'))
  assert.equal(g.wear, 'morpho', 'new wings are worn at once')
  buy('morpho')
  assert.equal(g.wear, 'rainbow', 'owned wings toggle back off')
  g.pollen = 0
  buy('combo')
  assert.equal(g.up.combo, 0, 'no pollen, no sale')
  // Fly on: the next garden, saved at its start.
  g.garden!.pick = 0
  g.update(press('a'))
  assert.equal(g.garden, null)
  assert.equal(g.arena.id, 'meadow')
  assert.equal(g.wave, 1)
  assert.equal(g.music, MEADOW_MUSIC)
  const at2 = readJoustSave(g.save)!
  assert.equal(at2.arena, 1)
  assert.equal(at2.up.flap, 1)
  assert.deepEqual(at2.wings, ['morpho'])

  // The save comes back as CONTINUE, at the meadow, with what it carried.
  const resumed = game({ resume: JSON.parse(JSON.stringify(at2)) })
  assert.equal(resumed.menu!.pick, 0)
  resumed.update(press('a'))
  assert.equal(resumed.mode, 'tourney')
  assert.equal(resumed.arena.id, 'meadow')
  assert.equal(resumed.score, at2.score)
  assert.equal(resumed.up.flap, 1)
  // A save for another party size isn't offered (the wings still are kept).
  const party = game({ players: 2, resume: at2 })
  party.update(press('a'))
  assert.equal(party.arena.id, 'sunset', 'two riders start their own tourney')
  assert.deepEqual(party.wings, ['morpho'])
  // A game over keeps the save, to pick up with fresh butterflies.
  resumed.lives = 1
  const r = resumed.riders[0]!
  resumed.card = 0
  place(r, 200, POND_Y + 4)
  r.invuln = 0
  resumed.update(idle())
  assert.equal((resumed.save as JoustSave).continued, true)
  const fresh = game({ resume: resumed.save })
  fresh.update(press('a'))
  assert.equal(fresh.score, 0)
  assert.equal(fresh.arena.id, 'meadow')

  // Garbage in the store is ignored.
  for (const bad of [
    null,
    7,
    'x',
    [],
    { v: 2 },
    { ...at2, arena: -1 },
    { ...at2, up: null },
  ])
    assert.equal(readJoustSave(bad), null)
  assert.equal(readJoustSave({ ...at2, wear: 'golden' })!.wear, 'rainbow')
}

// --- the stronger flap upgrade -----------------------------------------------------------------
{
  const g = tourney()
  stage(g, 0, 1)
  const r = g.riders[0]!
  place(r, 200, 150)
  g.update(press('a'))
  const base = r.vy
  g.up.flap = 2
  place(r, 200, 150)
  for (let t = 0; t < 12; t++) g.update(idle())
  place(r, 200, 150)
  g.update(press('a'))
  assert.ok(r.vy < base, 'the upgraded flap lifts harder')
  assert.ok(Math.abs(r.vy - base * (1 + 2 * FLAP_BOOST)) < 0.2)
}

// --- the arena engine: crumbling, folding, drifting, puffs, thermals and wind ----------------
{
  // Sunset Pond's bottom ledge crumbles from the third wave.
  const g = tourney()
  stage(g, 0, 2)
  const bottom = g.ledges.find((l) => l.spec?.crumbles)!
  const whole = bottom.x1 - bottom.x0
  stage(g, 0, 5)
  const crumbled = g.ledges.find((l) => l.spec?.crumbles)!
  assert.ok(crumbled.x1 - crumbled.x0 < whole - 40, 'crumbled in')

  // Spring Meadow's flowers fold shut on their cycle, with a tell before it.
  const fold = ARENAS[1]!.ledges.find((l) => l.fold)!.fold!
  assert.equal(flowerState(fold, 0).open, true)
  assert.ok(
    flowerState(fold, fold.open - 10).closing > 0.5,
    'the petals tremble first',
  )
  assert.equal(flowerState(fold, fold.open + 1).open, false)
  const m = tourney()
  stage(m, 1, 1)
  const flower = m.ledges.find((l) => l.spec?.fold)!
  const r = m.riders[0]!
  // Stand on the flower, then wait for it to fold.
  const stand = () => {
    place(r, (flower.x0 + flower.x1) / 2, flower.y - 8)
    r.ground = flower
  }
  m.arenaTicks = 0
  while (!flowerState(fold, m.arenaTicks).open || m.arenaTicks < 10)
    m.arenaTicks++
  m.arenaTicks -= 0
  stand()
  m.update(idle())
  assert.equal(r.ground, flower, 'standing on an open flower')
  let fell = false
  for (let t = 0; t < 700 && !fell; t++) {
    m.update(idle())
    if (!flower.solid && r.ground !== flower) fell = true
    r.invuln = 99
  }
  assert.ok(fell, 'a folding flower drops whoever stands on it')

  // The drifting leaf carries a rider standing on it.
  const leaf = m.ledges.find((l) => l.spec?.move)!
  place(r, (leaf.x0 + leaf.x1) / 2, leaf.y - 8)
  r.ground = leaf
  const off = r.x - leaf.x0
  for (let t = 0; t < 60; t++) {
    r.invuln = 99
    m.update(idle())
  }
  assert.equal(r.ground, leaf, 'still on the leaf')
  assert.ok(Math.abs(r.x - leaf.x0 - off) < 2, 'carried along with it')

  // Dandelion puffs rise from the meadow, and burst a while after they are stood on.
  const p = tourney()
  stage(p, 1, 1)
  let puff: Ledge | undefined
  for (let t = 0; t < 400 && !puff; t++) {
    p.riders[0]!.invuln = 99
    place(p.riders[0]!, 224, 60)
    p.update(idle())
    puff = p.ledges.find((l) => l.puff)
  }
  assert.ok(puff, 'a puff floats up')
  const y0 = puff!.y
  p.update(idle())
  assert.ok(puff!.y < y0, 'rising')
  const q = p.riders[0]!
  place(q, (puff!.x0 + puff!.x1) / 2, puff!.y - 9)
  q.vy = 1
  p.update(idle())
  assert.equal(q.ground, puff, 'landed on the puff')
  assert.ok(puff!.stood > 0)
  for (let t = 0; t < PUFF_STAND + 5; t++) {
    q.invuln = 99
    p.update(idle())
  }
  assert.ok(!p.ledges.includes(puff! as never), 'it bursts')
  assert.notEqual(q.ground, puff)

  // A lit thermal lifts a flier; a shaded one does not.
  const th = ARENAS[1]!.thermals[0]!
  const lift = tourney()
  stage(lift, 1, 1)
  const b: Body = { x: th.x, y: 200, vx: 0, vy: 0, ground: null, flap: 0 }
  lift.arenaTicks = 0
  while (!thermalOn(th, lift.arenaTicks)) lift.arenaTicks++
  lift.physics(b, 2)
  assert.ok(b.vy < 0, 'lifted')
  while (thermalOn(th, lift.arenaTicks)) lift.arenaTicks++
  const c: Body = { x: th.x, y: 200, vx: 0, vy: 0, ground: null, flap: 0 }
  lift.physics(c, 2)
  assert.ok(c.vy > 0, 'no lift in the shade')

  // Wind pushes fliers sideways while it blows.
  const w = tourney()
  stage(w, 0, 1)
  w.arena = { ...w.arena, wind: { every: 10, length: 50, push: 3, tell: 10 } }
  w.wind = { state: 'blow', t: 40, dir: 1 }
  const d: Body = { x: 100, y: 100, vx: 0, vy: 0, ground: null, flap: 0 }
  w.physics(d, 3)
  assert.ok(d.vx > 0, 'blown along')
}

// --- the meadow's riders ------------------------------------------------------------------
{
  // The glider never flaps: it rides a thermal up instead.
  const g = tourney()
  stage(g, 1, 1)
  const th = g.arena.thermals[0]!
  g.arenaTicks = th.on + th.off - th.phase
  while (!thermalOn(th, g.arenaTicks)) g.arenaTicks++
  place(g.riders[0]!, 40, 40)
  g.riders[0]!.invuln = 9999
  g.addRival('glider', 0, { x: th.x, y: 230 })
  const glider = live(g)[0]!
  glider.spawn = 0
  place(glider, th.x, 220)
  let flaps = 0
  let top = glider.y
  for (let t = 0; t < 150; t++) {
    g.riders[0]!.invuln = 9999
    place(g.riders[0]!, 40, 40)
    g.update(idle())
    if (glider.flap === 8) flaps++
    top = Math.min(top, glider.y)
  }
  assert.equal(flaps, 0, 'no flapping')
  assert.ok(top < 160, 'it climbed the thermal')

  // Twin riders split into two cocoons.
  const tw = tourney()
  stage(tw, 1, 2)
  const p = tw.riders[0]!
  place(p, 200, 100)
  tw.addRival('twin', 0, { x: 200, y: 122 })
  const twin = live(tw)[0]!
  twin.spawn = 0
  place(twin, 200, 114)
  tw.update(idle())
  assert.equal(live(tw).length, 0)
  assert.equal(tw.cocoons.length, 2, 'two cocoons')
  assert.ok(tw.cocoons.every((c) => c.kind === 'twin'))
  assert.equal(tw.score, ROSTER.twin.points)

  // The pollen bomber drops a puff over you; flying into it means a sneeze.
  const bo = tourney()
  stage(bo, 1, 4)
  const v = bo.riders[0]!
  bo.addRival('bomber', 0, { x: 200, y: 108 })
  const bomber = live(bo)[0]!
  bomber.spawn = 0
  bomber.drop = 0
  place(bomber, 200, 100)
  place(v, 200, 170)
  v.invuln = 9999
  for (let t = 0; t < 5 && !bo.dust.length; t++) {
    place(v, 200, 170)
    bo.update(idle())
  }
  assert.equal(bo.dust.length, 1, 'a puff dropped')
  const dust = bo.dust[0]!
  dust.cloud = true
  dust.t = 0
  bo.rivals = bo.rivals.filter((r) => r !== bomber)
  place(v, dust.x, dust.y)
  v.invuln = 0
  bo.update(idle())
  assert.equal(v.sneeze, POLLEN.sneeze - 0, 'ACHOO')
  const before = v.vy
  bo.update(press('a'))
  assert.ok(v.vy >= before, 'no flapping mid-sneeze')
  for (let t = 0; t < POLLEN.sneeze; t++) bo.update(idle())
  assert.equal(v.sneeze, 0, 'over in half a second')
  for (let t = 0; t < POLLEN.cloud + 5; t++) bo.update(idle())
  assert.equal(bo.dust.length, 0, 'the cloud clears')
}

// --- Sir Bumbleton -------------------------------------------------------------------------
{
  const bout = () => {
    const g = tourney()
    stage(g, 0, WAVES_PER_ARENA + 1)
    g.rivals = []
    assert.ok(g.champion)
    return { g, c: g.champion!, r: g.riders[0]! }
  }
  // Level with him, his lance wins.
  {
    const { g, c, r } = bout()
    c.x = 200
    c.y = 150
    place(r, 200 + BUMBLETON.halfW + 6, 150)
    g.update(idle())
    assert.equal(r.alive, false, 'he wins a level clash')
    assert.equal(c.hp, BUMBLETON.hp)
  }
  // From above, a hit: he reels and wheels away.
  {
    const { g, c, r } = bout()
    c.x = 200
    c.y = 150
    place(r, 200, 150 - 14)
    r.vy = 1
    g.update(idle())
    assert.equal(c.hp, BUMBLETON.hp - 1)
    assert.ok(r.alive)
    assert.ok((c.stun ?? 0) > 0 && (c.retreat ?? 0) > 0)
    assert.equal(g.score, BUMBLETON.hitPoints)
  }
  // Two thirds down he calls his bee escort; bees pop from above.
  {
    const { g, c, r } = bout()
    c.hp = 6
    place(r, 40, 300)
    r.invuln = 9999
    for (let t = 0; t < 60; t++) {
      place(r, 40, 300)
      g.update(idle())
    }
    assert.equal(c.bees!.length, 3, 'three bees')
    for (let t = 0; t < 20 && c.bees!.length === 3; t++) {
      const bee = c.bees![0]!
      place(r, bee.x, bee.y - 9)
      r.invuln = 0
      g.update(idle())
    }
    assert.ok(r.alive)
    assert.equal(c.bees!.length, 2, 'a bee popped from above')
  }
  // One third down he climbs to the ceiling, marks his landing, dives, and sticks fast.
  {
    const { g, c, r } = bout()
    c.hp = 3
    let saw = new Set<string>()
    for (let t = 0; t < 900 && !saw.has('stuck'); t++) {
      place(r, 60, 280)
      r.invuln = 9999
      g.update(idle())
      saw.add(c.mode!)
    }
    assert.ok(
      saw.has('rise') && saw.has('aim') && saw.has('dive') && saw.has('stuck'),
    )
    assert.ok(c.mark!.y > c.y, 'the mark is a ledge below him')
    // Stuck fast, his lance can only shove; from above he is open.
    place(r, c.x + BUMBLETON.halfW - 2, c.y)
    r.invuln = 0
    g.update(idle())
    assert.ok(r.alive, 'a shove, not a bonk')
    place(r, c.x, c.y - 14)
    r.vy = 1
    g.update(idle())
    assert.equal(c.hp, 2)
    saw = new Set()
    void saw
  }
}

// --- the Dandelion Duchess ---------------------------------------------------------------------
{
  const bout = () => {
    const g = tourney()
    stage(g, 1, WAVES_PER_ARENA + 1)
    g.rivals = []
    return { g, c: g.champion!, r: g.riders[0]! }
  }
  {
    const { g, c, r } = bout()
    assert.equal(c.id, 'duchess')
    for (let t = 0; t < 10 && c.hp === DUCHESS.hp; t++) {
      place(r, c.x, c.y - 29)
      r.vy = 1
      g.update(idle())
    }
    assert.equal(c.hp, DUCHESS.hp - 1, 'a bonk on the clock')
    assert.equal(c.seeds!.length, DUCHESS.seedsPerHit, 'seeds blow off')
    // Pop one as it falls.
    const seed = c.seeds![0]!
    place(r, seed.x, seed.y)
    r.invuln = 0
    g.update(idle())
    assert.equal(c.seeds!.length, DUCHESS.seedsPerHit - 1, 'popped')
    // The rest land and sprout drifters.
    place(r, 20, 40)
    for (let t = 0; t < 900 && c.seeds!.length; t++) {
      r.invuln = 9999
      place(r, 20, 40)
      g.update(idle())
    }
    assert.ok(
      live(g).some((x) => x.kind === 'drifter'),
      'a seed sprouted',
    )
  }
  {
    // From the side the clock is soft: a bump, not a bonk.
    const { g, c, r } = bout()
    g.update(idle())
    for (let t = 0; t < 10 && r.vx >= 0; t++) {
      place(r, c.x - 28, c.y + 4)
      r.facing = 1
      g.update(idle())
    }
    assert.ok(r.alive)
    assert.equal(c.hp, DUCHESS.hp)
    assert.ok(r.vx < 0, 'bumped away')
  }
  {
    // Past half she blows a gust.
    const { g, c, r } = bout()
    c.hp = 3
    c.gust = DUCHESS.gustEvery - 1
    place(r, c.x + 60, c.y + 60)
    r.invuln = 9999
    g.update(idle())
    assert.ok(r.vx > 1, 'blown away')
  }
  {
    // Beaten, the bout waits for the last seeds.
    const { g, c } = bout()
    c.hp = 1
    c.seeds!.push({ x: 100, y: 60 })
    c.hp = 0
    g.update(idle())
    assert.ok(c.done && c.busy())
    assert.equal(g.clearing, 0, 'not over while seeds fall')
  }
}

// --- the pilot plays the tourney --------------------------------------------------------------
{
  type Pilot = Inner & { demoInput(seat?: number): InputFrame }
  const g = game({ seed: 3 }) as Pilot
  let maxWave = 0
  let sawGarden = false
  for (let t = 0; t < 60 * 60 * 12 && !g.over; t++) {
    g.lives = Math.max(g.lives, 3)
    g.update(g.demoInput())
    if (g.garden) sawGarden = true
    if (g.arena.id === 'meadow') maxWave = Math.max(maxWave, g.wave)
  }
  assert.ok(sawGarden, 'the pilot bests Sir Bumbleton')
  assert.ok(maxWave >= 3, 'and gets into the meadow')
  assert.ok(g.score < 5_000_000)
  void W
}

console.log('verifyCabinetButterflyJoustArenas: ok')
