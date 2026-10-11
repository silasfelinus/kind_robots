// Kindness Gauntlet depth pass, slice 3 (conductor kr-arcade/t-053, depth-pass/CABINETS.md section
// 5): the middle wings of the Deep Archive. The Arcade Basement's dark cabinets, fake stairs and
// dance floors; the Cloud Atrium's wind vents, clouds and trap plates; the Blinker and the Pop-up
// wizard; fixed glitches turning helper; the Attract Mode and the Cloud Bank, phase by phase; and the
// Memory Cards.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create, readGauntletSave } from '../arcade/games/kindnessGauntlet'
import type { GauntletSave } from '../arcade/games/kindnessGauntlet'
import { WINGS, planAt } from '../arcade/kindnessGauntlet/floors'
import { newGlitch } from '../arcade/kindnessGauntlet/roster'
import type { Glitch, GlitchKind } from '../arcade/kindnessGauntlet/roster'
import { bossZones } from '../arcade/kindnessGauntlet/guardians'
import type { BossWorld, Guardian } from '../arcade/kindnessGauntlet/guardians'
import {
  CONTINUE_TICKS,
  DROP_TELL,
  SOLO_HOLD,
  bankAt,
  coinSlots,
} from '../arcade/kindnessGauntlet/halls'

type Hero = {
  seat: number
  choice: number
  x: number
  y: number
  facing: number
  battery: number
  pulses: number
  flat: boolean
  points: number
  stun: number
}
type Inner = {
  score: number
  level: number
  over: boolean
  heroes: Hero[]
  walls: Uint8Array
  seen: Uint8Array
  floorFx: Uint8Array
  glitches: Glitch[]
  generators: unknown[]
  items: Array<{ x: number; y: number; kind: string }>
  shots: Array<{ kind: string }>
  fakes: Array<{ x: number; y: number }>
  light: { ticks: number } | null
  sprung: boolean
  helpers: Array<{ kind: GlitchKind; seat: number; ticks: number }>
  memories: number[]
  token: { x: number; y: number; holder: number; wait: number } | null
  guardian: Guardian | null
  bossWorld: BossWorld
  sealed: boolean
  leaving: number
  floorTicks: number
  secretDone: boolean
  save: GauntletSave | null
  music: unknown
  nextId: number
  update(input: InputFrame, players?: InputFrame[]): void
  buildFloor(n: number): void
  demoInput(): InputFrame
  fixGlitch(g: Glitch, by?: Hero): void
  hurtGlitch(g: Glitch, d: number, by: Hero): void
  hitBossNow(id: number, d: number): void
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
function run(
  g: Inner,
  ticks: number,
  frames: () => InputFrame[] = () => g.heroes.map(idle),
) {
  for (let i = 0; i < ticks; i++) {
    const f = frames()
    g.update(f[0]!, f)
  }
}
function staged(floor: number, tx: number, ty: number, classes = [1]): Inner {
  const g = game(classes)
  g.buildFloor(floor)
  g.glitches = []
  g.generators = []
  g.shots = []
  g.seen.fill(1)
  g.heroes.forEach((h, i) => {
    h.x = (tx + i) * 16 + 8
    h.y = ty * 16 + 8
    h.battery = 300
  })
  return g
}
const idx = (tx: number, ty: number) => ty * 40 + tx

// --- the wings -----------------------------------------------------------------------------------

{
  assert.equal(WINGS[2]!.name, 'THE ARCADE BASEMENT')
  assert.equal(WINGS[3]!.name, 'THE CLOUD ATRIUM')
  for (const w of WINGS.slice(2)) {
    assert.equal(w.floors.length, 8)
    assert.ok(
      w.floors[4]!.map.join('').includes('B'),
      `${w.id}: a Big Bluescreen on floor 5`,
    )
    assert.equal(
      w.floors.filter((f) => f.memory).length,
      1,
      `${w.id}: one Memory Card`,
    )
  }
  for (const w of WINGS)
    assert.equal(
      w.floors.filter((f) => f.memory).length,
      1,
      `${w.id}: a Memory Card`,
    )
  const letters = WINGS.slice(2).map((w) =>
    w.floors.map((f) => f.map.join('')).join(''),
  )
  assert.ok(
    letters[0]!.includes('X') &&
      letters[0]!.includes('F') &&
      letters[0]!.includes('d'),
  )
  assert.ok(
    letters[1]!.includes('V') &&
      letters[1]!.includes('o') &&
      letters[1]!.includes('Z'),
  )
  assert.ok(letters[0]!.includes('z'), 'the Basement brings blinkers')
  assert.ok(letters[1]!.includes('q'), 'the Atrium brings pop-up wizards')
  const g = game()
  g.buildFloor(17)
  assert.ok(g.music && g.music !== null)
  const basement = g.music
  g.buildFloor(25)
  assert.notEqual(g.music, basement, 'each wing its own loop')
}

// --- the Basement's tricks -------------------------------------------------------------------------

// Dark cabinets are solid, and only a pulse's light shows them.
{
  const g = staged(17, 3, 10)
  assert.equal(g.walls[idx(8, 9)], 7, 'a dark cabinet')
  g.heroes[0]!.x = 6 * 16 + 8
  g.heroes[0]!.y = 9 * 16 + 8
  const x0 = g.heroes[0]!.x
  run(g, 40, () => [hold('right')])
  assert.ok(g.heroes[0]!.x < 8 * 16, 'it blocks like any rack')
  assert.ok(g.heroes[0]!.x > x0)
  assert.equal(g.light, null, 'unlit')
  g.heroes[0]!.pulses = 1
  run(g, 1, () => [tap('b')])
  assert.ok(g.light && g.light.ticks > 0, "a pulse's light shows it")
  run(g, 6 * 60 + 2)
  assert.equal(g.light, null, 'for a while')
}

// Fake stairs: a bonk, not a way down.
{
  const g = staged(18, 32, 3)
  const fake = g.fakes[0]!
  g.heroes[0]!.x = fake.x
  g.heroes[0]!.y = fake.y
  run(g, 2)
  assert.equal(g.leaving, 0, 'nobody leaves by painted stairs')
  assert.ok(g.heroes[0]!.stun > 0 && g.heroes[0]!.battery < 300, 'bonk')
  assert.equal(g.fakes.length, 1, 'and that one is gone')
}

// Dance tiles stun a bot standing on one as it lights on the beat.
{
  const g = staged(19, 12, 2)
  let stunned = false
  for (let i = 0; i < 4 * 30 && !stunned; i++) {
    run(g, 1)
    stunned = g.heroes[0]!.stun > 0
  }
  assert.ok(stunned, 'on the beat')
  const safe = staged(19, 9, 9)
  run(safe, 4 * 30)
  assert.equal(safe.heroes[0]!.stun, 0, 'off the dance floor, never')
}

// --- the Atrium's tricks ----------------------------------------------------------------------------

// Vents blow bots downwind while they gust.
{
  const g = staged(25, 21, 3)
  const y0 = g.heroes[0]!.y
  run(g, 60)
  assert.ok(g.heroes[0]!.y > y0 + 20, 'blown down the wind')
  const calm = staged(25, 4, 3)
  const cy = calm.heroes[0]!.y
  run(calm, 60)
  assert.equal(calm.heroes[0]!.y, cy, 'out of the wind, still')
}

// Clouds vanish (a bot on one drops to solid floor, shaken) and reform.
{
  const g = staged(26, 20, 3)
  const tile = idx(20, 3)
  let gone = false
  for (let i = 0; i < 300 && !gone; i++) {
    g.heroes[0]!.x = 20 * 16 + 8
    g.heroes[0]!.y = 3 * 16 + 8
    run(g, 1)
    gone = g.walls[tile] === 9
  }
  assert.ok(gone, 'the cloud vanishes')
  const h = g.heroes[0]!
  assert.ok(
    g.floorFx[idx(Math.floor(h.x / 16), Math.floor(h.y / 16))] !== 7,
    'onto solid floor',
  )
  assert.ok(h.battery < 300, 'a little shaken')
  run(g, 300)
  assert.ok(g.walls[tile] === 0 || g.walls[tile] === 9)
  let back = false
  for (let i = 0; i < 300 && !back; i++) {
    run(g, 1)
    back = g.walls[tile] === 0
  }
  assert.ok(back, 'and reforms')
}

// A trap plate lifts every trap wall.
{
  const g = staged(27, 12, 4)
  assert.equal(g.walls[idx(24, 4)], 8, 'a trap wall')
  run(g, 20, () => [hold('right')])
  assert.ok(g.sprung, 'the plate springs')
  assert.equal(g.walls[idx(24, 4)], 0, 'the wall is gone')
}

// --- the Blinker and the Pop-up wizard ----------------------------------------------------------

{
  const g = staged(17, 3, 2)
  const b = newGlitch('blinker', 120, 40, 1, 900, -1, 1)
  g.glitches.push(b)
  g.heroes[0]!.pulses = 1
  run(g, 1, () => [tap('b')])
  assert.ok(g.glitches.includes(b), 'a pulse does not fix a blinker')
  assert.ok((b.shown ?? 0) > 0, 'it shows it')
  const sage = staged(17, 3, 2, [2])
  const sb = newGlitch('blinker', 120, 40, 1, 901, -1, 1)
  sage.glitches.push(sb)
  run(sage, 1, () => [tap('b')])
  assert.ok((sb.stun ?? 0) > 0, "a Sage's pulse stuns it too")
  const x = sb.x
  run(sage, 30)
  assert.equal(sb.x, x, 'stunned, it stays put')
  sage.hurtGlitch(sb, 1, sage.heroes[0]!)
  assert.ok(!sage.glitches.includes(sb), 'a spark fixes it')
}

{
  const g = staged(25, 12, 3)
  const w = newGlitch('wizard', 12 * 16 + 8 + 70, 3 * 16 + 8, 1, 902, -1, 1)
  g.glitches.push(w)
  let volley = 0
  let sparkled = false
  for (let i = 0; i < 600 && !sparkled; i++) {
    run(g, 1)
    volley = Math.max(volley, g.shots.filter((s) => s.kind === 'bolt').length)
    if (w.state === 'windup') sparkled = true
  }
  assert.ok(volley >= 3, 'it fires three ways')
  assert.ok(sparkled, 'then sparkles where it will appear')
  g.hurtGlitch(w, 5, g.heroes[0]!)
  assert.ok(!g.glitches.includes(w), 'spark the sparkle')
}

// --- helpers -------------------------------------------------------------------------------------

{
  const g = staged(25, 12, 3)
  const brute = newGlitch('brute', 230, 56, 1, 903, -1, 1)
  g.glitches.push(brute)
  g.fixGlitch(brute, g.heroes[0]!)
  assert.equal(g.helpers.length, 1, 'a fixed brute turns helper')
  assert.equal(g.helpers[0]!.seat, 0)
  const target = newGlitch(
    'glitch',
    g.heroes[0]!.x + 60,
    g.heroes[0]!.y,
    1,
    904,
    -1,
    1,
  )
  g.glitches.push(target)
  const before = g.heroes[0]!.points
  run(g, 90)
  assert.ok(!g.glitches.includes(target), 'it sparks the glitch')
  assert.ok(g.heroes[0]!.points > before, "in its bot's name")
  run(g, 20 * 60)
  assert.equal(g.helpers.length, 0, 'for twenty seconds')
  const ghost = newGlitch('brute', 120, 56, 1, 905, -1, 1)
  ghost.ghost = true
  g.fixGlitch(ghost, g.heroes[0]!)
  assert.equal(g.helpers.length, 0, 'a ghost never turns helper')
}

// --- the Attract Mode -------------------------------------------------------------------------------

{
  const g = game([1], 4)
  g.buildFloor(24)
  const boss = g.guardian!
  assert.equal(boss.kind, 'attract')
  assert.ok(g.sealed)
  run(g, 160)
  const ghosts = g.glitches.filter((x) => x.ghost)
  assert.ok(ghosts.length >= 1, 'its screen projects a ghost glitch')
  assert.ok(
    ghosts.every((x) => x.hp <= Math.ceil(x.maxHp)),
    'at half strength',
  )
  boss.hp = 1
  g.hitBossNow(0, 1)
  assert.equal(boss.phase, 2)
  const dealt = () =>
    [...g.walls]
      .map((v, i) => (v === 6 ? i : -1))
      .filter((i) => i >= 0)
      .join()
  const before = dealt()
  assert.ok(before.length > 0, 'walls appear')
  run(g, 30)
  assert.notEqual(dealt(), before, 'and march about the hall')
  boss.hp = 1
  g.hitBossNow(0, 1)
  assert.equal(boss.phase, 3)
  assert.equal(
    dealt(),
    '',
    'the marching walls are cleared for the continue screen',
  )
  assert.equal(
    bossZones(boss, g.bossWorld).length,
    0,
    'phase 3 is not won with sparks',
  )
  // Solo: each coin slot holds six seconds after a touch; all four lit and it turns friendly.
  const h = g.heroes[0]!
  const slots = coinSlots(g.bossWorld)
  for (const s of slots) {
    h.x = s.x
    h.y = s.y
    h.battery = 300
    run(g, 2)
  }
  assert.ok(boss.done, 'four coins in: it turns friendly')
  run(g, 2)
  assert.ok(!g.sealed)
  assert.ok(SOLO_HOLD === 360)

  // Too slow: the countdown runs out, a burst of static, and it starts over.
  const slow = game([1], 4)
  slow.buildFloor(24)
  const sb = slow.guardian!
  sb.hp = 1
  slow.hitBossNow(0, 1)
  sb.hp = 1
  slow.hitBossNow(0, 1)
  const b0 = slow.heroes[0]!.battery
  run(slow, CONTINUE_TICKS + 2)
  assert.ok(slow.heroes[0]!.battery < b0 - 15, 'GAME OVER... just kidding')
  assert.ok(
    !sb.done && sb.countdown > CONTINUE_TICKS - 10,
    'the countdown starts over',
  )

  // Co-op: four bots, one on each slot.
  const four = game([0, 1, 2, 3], 5)
  four.buildFloor(24)
  const fb = four.guardian!
  fb.hp = 1
  four.hitBossNow(0, 1)
  fb.hp = 1
  four.hitBossNow(0, 1)
  four.heroes.forEach((hero, i) => {
    hero.x = slots[i]!.x
    hero.y = slots[i]!.y
  })
  run(four, 2)
  assert.ok(fb.done, 'one bot on each slot')
}

// --- the Cloud Bank ------------------------------------------------------------------------------

{
  const g = game([1], 6)
  g.buildFloor(32)
  const boss = g.guardian!
  assert.equal(boss.kind, 'bank')
  // Phase 1: drops fall, each on a tell; one landing on a bot drains it.
  let told = false
  for (let i = 0; i < 120 && !told; i++) {
    run(g, 1)
    told = boss.drops.some((d) => d.t > DROP_TELL - 5)
  }
  assert.ok(told, 'a drop shows its landing first')
  const drop = boss.drops[0]!
  g.heroes[0]!.x = drop.x
  g.heroes[0]!.y = drop.y
  const b0 = g.heroes[0]!.battery
  run(g, drop.t + 1)
  assert.ok(g.heroes[0]!.battery < b0 - 8, 'and splashes')
  // Phase 2: wind shoves the bots toward the vents.
  boss.hp = 1
  g.hitBossNow(0, 1)
  assert.equal(boss.phase, 2)
  boss.drops = []
  const h = g.heroes[0]!
  h.x = 15 * 16
  h.y = 8 * 16
  const x0 = h.x
  run(g, 30)
  assert.ok(Math.abs(h.x - x0) > 10, 'the wind pushes')
  // Phase 3: a Token drops, lightning follows its holder, and a strike under the Bank hurts it.
  boss.hp = 1
  g.hitBossNow(0, 1)
  assert.equal(boss.phase, 3)
  assert.ok(g.token, 'the Hug Token drops')
  assert.equal(bossZones(boss, g.bossWorld).length, 0, 'no sparks in the storm')
  h.x = g.token!.x
  h.y = g.token!.y
  run(g, 2)
  assert.equal(g.token?.holder, 0, 'picked up')
  const far = Math.hypot(boss.bolt.x - h.x, boss.bolt.y - h.y)
  boss.bolt.tell = 0
  boss.bolt.t = 9999
  run(g, 60)
  assert.ok(
    Math.hypot(boss.bolt.x - h.x, boss.bolt.y - h.y) < far,
    'the lightning chases the holder',
  )
  let strikes = 0
  for (let i = 0; i < 3 && !boss.done; i++) {
    const bank = bankAt(boss, g.bossWorld)
    boss.bolt.x = bank.x
    boss.bolt.y = bank.y + 40
    boss.bolt.tell = 1
    h.battery = 300
    run(g, 1)
    strikes++
  }
  assert.ok(boss.done, `three strikes steered into the Bank (${strikes})`)
}

// --- Memory Cards -----------------------------------------------------------------------------------

{
  const memoryFloors = WINGS.map(
    (w, i) => i * 8 + w.floors.findIndex((f) => f.memory) + 1,
  )
  const g = game([1])
  for (const floor of memoryFloors) {
    g.buildFloor(floor)
    const secret = g.items.find((i) => i.kind === 'secret')
    assert.ok(secret, `${planAt(floor)!.plan.name}: a secret to find`)
    g.heroes[0]!.x = secret!.x
    g.heroes[0]!.y = secret!.y
    g.heroes[0]!.battery = 300
    run(g, 2)
  }
  assert.deepEqual(
    [...g.memories].sort(),
    [0, 1, 2, 3],
    'a Memory Card from each wing',
  )
  g.buildFloor(25)
  assert.deepEqual(g.save?.memories, g.memories, 'kept in the save')
  assert.ok(readGauntletSave(JSON.parse(JSON.stringify(g.save))))
  assert.equal(
    readGauntletSave({ ...g.save, memories: [9] }),
    null,
    'junk memories are refused',
  )
}

// --- the pilot through the middle wings' Guardians ----------------------------------------------------

{
  for (const floor of [24, 32]) {
    const g = game([1], 7)
    g.buildFloor(floor)
    let t = 0
    for (; t < 60 * 60 * 5 && g.level === floor; t++) {
      for (const h of g.heroes) h.battery = Math.max(h.battery, 150)
      const f = g.demoInput()
      g.update(f, [f])
    }
    assert.ok(g.level > floor, `the pilot beats ${planAt(floor)!.plan.name}`)
    console.log(
      `  ${planAt(floor)!.plan.name}: the pilot wins in ${(t / 60).toFixed(0)} s`,
    )
  }
}

console.log('Kindness Gauntlet middle wings: ok')
