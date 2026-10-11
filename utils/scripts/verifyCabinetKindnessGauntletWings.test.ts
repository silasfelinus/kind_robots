// Kindness Gauntlet depth pass, slice 2 (conductor kr-arcade/t-052, depth-pass/CABINETS.md section
// 5): the first two wings of the Deep Archive. Every authored floor is laid out and walked; each maze
// trick (card walls, static mats, sticky tape, mirror racks, sliding shelves, patch-cable pads, the
// express lift) is pinned on its own; the worm, the Big Bluescreen, the Card Sorter and the Twin
// Reels are fought phase by phase; charms, chips, floor secrets, the Lost & Found clock and the
// per-wing save are checked; and the attract pilot clears the whole Vault by itself.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create, readGauntletSave } from '../arcade/games/kindnessGauntlet'
import type { GauntletSave } from '../arcade/games/kindnessGauntlet'
import {
  CHARMS,
  CHIPS,
  FLOORS_PER_WING,
  WINGS,
  planAt,
} from '../arcade/kindnessGauntlet/floors'
import type { CharmKind, ChipKind } from '../arcade/kindnessGauntlet/floors'
import { newGlitch } from '../arcade/kindnessGauntlet/roster'
import type { Glitch, GlitchKind } from '../arcade/kindnessGauntlet/roster'
import { bossZones, tapeOf } from '../arcade/kindnessGauntlet/guardians'
import type { Guardian } from '../arcade/kindnessGauntlet/guardians'
import {
  VAULT_LOOP,
  LIBRARY_LOOP,
  GUARDIAN_LOOP,
} from '../arcade/kindnessGauntlet/music'

type Hero = {
  seat: number
  choice: number
  cls: string
  x: number
  y: number
  facing: number
  battery: number
  pulses: number
  flat: boolean
  points: number
  stun: number
  charm: { kind: CharmKind; ticks: number } | null
  chips: Record<ChipKind, number>
}
type Item = {
  x: number
  y: number
  kind: string
  charm?: CharmKind
  chip?: ChipKind
}
type Inner = {
  score: number
  level: number
  over: boolean
  heroes: Hero[]
  walls: Uint8Array
  seen: Uint8Array
  floorFx: Uint8Array
  keys: number
  glitches: Glitch[]
  generators: Array<{ kind: GlitchKind }>
  items: Item[]
  sparks: Array<{ vx: number; vy: number; x: number; y: number }>
  shots: Array<{ kind: string; card?: boolean }>
  exits: Array<{ x: number; y: number }>
  lift: { x: number; y: number } | null
  sealed: boolean
  guardian: Guardian | null
  bossWorld: unknown
  lostTicks: number
  leaving: number
  secretDone: boolean
  floorTicks: number
  plan: { name: string; secret: { kind: string } } | null
  wing: number
  save: GauntletSave | null
  offer: GauntletSave | null
  selecting: number
  music: unknown
  nextId: number
  update(input: InputFrame, players?: InputFrame[]): void
  demoInput(): InputFrame
  buildFloor(n: number): void
  distances(
    sx: number,
    sy: number,
    doors?: boolean,
    cards?: boolean,
  ): Int16Array
  mapExit(): void
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

function game(classes: number[] = [1], seed = 3, resume?: unknown): Inner {
  const g = create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players: classes.length,
    resume,
  }) as unknown as Inner
  if (g.offer) return g
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

/** A floor emptied of everything but its walls and tricks, the bots at a tile of our choosing. */
function staged(floor: number, tx: number, ty: number, classes = [1]): Inner {
  const g = game(classes)
  g.buildFloor(floor)
  g.glitches = []
  g.generators = []
  g.shots = []
  g.seen.fill(1)
  g.heroes.forEach((h) => {
    h.x = tx * 16 + 8
    h.y = ty * 16 + 8
    h.battery = 300
  })
  return g
}

const idx = (tx: number, ty: number) => ty * 40 + tx

// --- the floors: two wings of six floors, a Lost & Found and a Guardian each -----------------------

{
  assert.equal(WINGS.length, 2)
  for (const wing of WINGS) {
    assert.equal(wing.floors.length, FLOORS_PER_WING)
    assert.equal(
      wing.floors.filter((f) => f.lost).length,
      1,
      `${wing.id}: one Lost & Found`,
    )
    assert.equal(
      wing.floors.filter((f) => f.guardian).length,
      1,
      `${wing.id}: one Guardian`,
    )
    assert.ok(
      wing.floors[4]!.map.join('').includes('B'),
      `${wing.id}: floor 5 ends at a Big Bluescreen`,
    )
  }
  const g = game()
  for (let floor = 1; floor <= WINGS.length * FLOORS_PER_WING; floor++) {
    const at = planAt(floor)!
    g.buildFloor(floor)
    assert.ok(
      at.plan.note.length > 4 && at.plan.par > 0,
      `${at.plan.name}: a note and a par`,
    )
    assert.ok(
      at.plan.map.every((r) => r.length === at.plan.map[0]!.length),
      `${at.plan.name}: square map`,
    )
    // From the start, with a key and card-breaking sparks, every flight of stairs can be reached.
    const h = g.heroes[0]!
    const d = g.distances(
      Math.floor(h.x / 16),
      Math.floor(h.y / 16),
      true,
      true,
    )
    for (const e of [...g.exits, ...(g.lift ? [g.lift] : [])])
      assert.ok(
        d[idx(Math.floor(e.x / 16), Math.floor(e.y / 16))]! > 0,
        `${at.plan.name}: its stairs can be reached`,
      )
  }
  // Past the authored wings the procedural builder takes over.
  g.buildFloor(WINGS.length * FLOORS_PER_WING + 1)
  assert.equal(g.plan, null)
  assert.equal(g.exits.length, 1)
}

// --- the maze tricks -------------------------------------------------------------------------------

// Card walls: two sparks break one (Mega, one).
{
  const g = staged(1, 25, 8)
  // The secret box on the Intake Hall: cards at (27..30, 7..9), the secret at (28, 8).
  g.heroes[0]!.facing = 2
  const tile = idx(27, 8)
  assert.equal(g.walls[tile], 3, 'a card wall')
  run(g, 1, () => [tap('a')])
  run(g, 20)
  assert.equal(g.walls[tile], 3, 'one spark cracks it')
  run(g, 1, () => [tap('a')])
  run(g, 20)
  assert.equal(g.walls[tile], 0, 'two break it')
  const m = staged(1, 25, 8)
  m.heroes[0]!.facing = 2
  m.heroes[0]!.charm = { kind: 'mega', ticks: 600 }
  run(m, 1, () => [tap('a')])
  run(m, 20)
  assert.equal(m.walls[tile], 0, 'a Mega spark breaks it at once')
}

// Static mats stun a bot that rolls on; it can't be stunned again straight away.
{
  const g = staged(1, 24, 4)
  run(g, 40, () => [hold('right')])
  const h = g.heroes[0]!
  assert.ok(h.stun > 0 || h.x < 26 * 16, 'stunned on the mat')
  const x = h.x
  run(g, 10, () => [hold('right')])
  assert.equal(h.x, x, 'a stunned bot cannot roll')
  run(g, 60, () => [hold('left')])
  assert.ok(h.x < x, 'and rolls again after')
}

// Sticky tape: a bot crawls across it.
{
  const fast = staged(9, 2, 16)
  const slow = staged(9, 3, 9)
  slow.heroes[0]!.x = 11 * 16 + 8
  run(fast, 30, () => [hold('right')])
  run(slow, 30, () => [hold('right')])
  const fx = fast.heroes[0]!.x - (2 * 16 + 8)
  const sx = slow.heroes[0]!.x - (11 * 16 + 8)
  assert.ok(sx < fx * 0.7, `tape slows (${sx.toFixed(0)} vs ${fx.toFixed(0)})`)
}

// Mirror racks bounce sparks back.
{
  const g = staged(9, 20, 3)
  // The Reel Room's mirrors at (22, 3..4).
  g.heroes[0]!.x = 20 * 16 + 8
  g.heroes[0]!.facing = 2
  run(g, 1, () => [tap('a')])
  let bounced = false
  for (let i = 0; i < 20 && g.sparks.length; i++) {
    run(g, 1)
    if (g.sparks[0] && g.sparks[0].vx < 0) bounced = true
  }
  assert.ok(bounced, 'the spark comes back off the mirror')
}

// Sliding shelves shut and open on their beat, and wait while a bot stands in the way.
{
  const g = staged(10, 3, 5)
  const tile = idx(15, 1) // an S shelf in the Archive Stacks
  assert.equal(g.walls[tile], 5, 'S is shut in the first half of the beat')
  run(g, 160)
  assert.equal(g.walls[tile], 0, 'and open in the second')
  g.heroes[0]!.x = 15 * 16 + 8
  g.heroes[0]!.y = 1 * 16 + 8
  run(g, 160)
  assert.equal(g.walls[tile], 0, 'it waits while a bot is in the way')
  g.heroes[0]!.x = 13 * 16 + 8
  run(g, 2)
  assert.equal(g.walls[tile], 5, 'then shuts')
}

// Patch-cable pads carry a bot to their twin, and not straight back.
{
  const g = staged(11, 23, 2)
  const h = g.heroes[0]!
  for (let i = 0; i < 30 && h.y < 5 * 16; i++) run(g, 1, () => [hold('right')])
  assert.equal(Math.floor(h.x / 16), 3, 'pad 1 carried it to its twin')
  assert.equal(Math.floor(h.y / 16), 10)
  run(g, 5)
  assert.equal(Math.floor(h.x / 16), 3, 'and it stays until it steps off')
}

// The express lift skips two floors.
{
  const g = staged(1, 31, 2)
  run(g, 3)
  assert.ok(g.leaving > 0, 'the lift takes it')
  run(g, 130)
  assert.equal(g.level, 4, 'floor 1 to floor 4')
}

// --- the Worm and the Big Bluescreen --------------------------------------------------------------

{
  const g = staged(9, 3, 16)
  const w = newGlitch('worm', 160, 16 * 16 + 8, 2, 999, -1, 1)
  w.body = Array.from({ length: 6 }, (_, i) => ({
    x: 160 + (i + 1) * 6,
    y: 16 * 16 + 8,
  }))
  g.glitches.push(w)
  ;(g as unknown as { splitWorm(s: unknown): boolean }).splitWorm({
    x: w.body[3]!.x,
    y: w.body[3]!.y,
  })
  assert.equal(w.body.length, 3, 'a hit mid-body splits the tail off')
  assert.ok(
    g.glitches.filter((x) => x.kind === 'glitch').length >= 1,
    'into little glitches',
  )
}

{
  const g = game([1])
  g.buildFloor(5)
  assert.ok(g.sealed, 'the Blue Screen floor is sealed while it is up')
  const blue = g.glitches.find((x) => x.kind === 'bluescreen')!
  assert.ok(blue.maxHp >= 30, 'it takes many hits')
  g.heroes[0]!.pulses = 1
  g.heroes[0]!.x = blue.x - 30
  g.heroes[0]!.y = blue.y
  g.seen.fill(1)
  run(g, 2)
  const before = blue.hp
  run(g, 1, () => [tap('b')])
  assert.ok(
    g.glitches.includes(blue) && blue.hp < before,
    'a pulse only chips it',
  )
  // Its breath: a cone of static in front, none behind or through racks.
  blue.state = 'inhale'
  blue.t = 40
  blue.vx = -1
  blue.vy = 0
  const front = g.heroes[0]!.battery
  run(g, 20)
  assert.ok(
    g.heroes[0]!.battery < front - 4,
    'the cone drains whoever is in front',
  )
  ;(g as unknown as { fixGlitch(gl: Glitch, by: Hero): void }).fixGlitch(
    blue,
    g.heroes[0]!,
  )
  run(g, 2)
  assert.ok(!g.sealed, 'fixed, the stairs open')
}

// --- the Guardians ---------------------------------------------------------------------------------

{
  const g = game([1], 4)
  g.buildFloor(8)
  const boss = g.guardian!
  assert.equal(boss.kind, 'sorter')
  assert.ok(g.sealed)
  const rowGaps = () =>
    boss.rows.map((ty) => {
      let open = 0
      for (let tx = 1; tx <= 24; tx++) if (g.walls[idx(tx, ty)] === 0) open++
      return open
    })
  assert.deepEqual(
    rowGaps(),
    [2, 2, 2],
    'three dealt rows, each with a two-tile gap',
  )
  const gaps = [...boss.gaps]
  run(g, 270)
  assert.notDeepEqual(boss.gaps, gaps, 'it reshuffles on the whistle')
  // Phase 1 to 2 by hits; in phase 2 it fans five cards and can only be hit while its hoppers hang open.
  boss.hp = 1
  const w = g.bossWorld as Parameters<typeof bossZones>[1]
  const hit = (id = 0, dmg = 1) =>
    (g as unknown as { hitBossNow(id: number, d: number): void }).hitBossNow(
      id,
      dmg,
    )
  hit()
  assert.equal(boss.phase, 2)
  assert.equal(bossZones(boss, w).length, 0, 'phase 2: shut until it fires')
  let fanned = 0
  for (let i = 0; i < 200 && !fanned; i++) {
    run(g, 1)
    fanned = g.shots.filter((s) => s.card).length
  }
  assert.equal(fanned, 5, 'a fan of five punch cards')
  assert.equal(bossZones(boss, w).length, 1, 'and its hoppers hang open')
  boss.hp = 1
  hit()
  assert.equal(boss.phase, 3)
  // Phase 3: only its slot, and only while open.
  let opened = false
  for (let i = 0; i < 400; i++) {
    run(g, 1)
    if (bossZones(boss, w).length) {
      opened = true
      assert.ok(boss.slot > 0)
    }
  }
  assert.ok(opened, 'the jammed slot opens now and then')
  boss.hp = 1
  boss.slot = 10
  hit()
  assert.ok(boss.done, 'three phases and it remembers who it is')
  run(g, 2)
  assert.ok(!g.sealed, 'the stairs open')
  assert.deepEqual(rowGaps(), [24, 24, 24], 'its cards are lifted')
}

{
  const g = game([1, 3], 6)
  g.buildFloor(16)
  const boss = g.guardian!
  assert.equal(boss.kind, 'reels')
  const w = g.bossWorld as Parameters<typeof bossZones>[1]
  const hit = (id: number, dmg = 1) =>
    (g as unknown as { hitBossNow(id: number, d: number): void }).hitBossNow(
      id,
      dmg,
    )
  // Phase 1: the tape sweeps; it catches a bot, but not one in a gap.
  const [tape] = tapeOf(boss)
  const p = g.heroes[0]!
  const q = g.heroes[1]!
  const len = tape!.bx - tape!.ax
  p.x = tape!.ax + len * 0.95
  p.y = tape!.ay
  q.x = tape!.ax + len * boss.holes[0]!
  q.y = tape!.ay
  const [pb, qb] = [p.battery, q.battery]
  run(g, 1)
  assert.ok(p.battery < pb - 5, 'the tape catches a bot')
  assert.ok(q.battery >= qb - 1, 'but not one riding a gap')
  boss.hp = 1
  hit(0)
  assert.equal(boss.phase, 2, 'phase 2')
  const [l, r] = boss.reels
  assert.ok(l!.y < r!.y, 'the reels spin apart to opposite corners')
  // Each reel is fought on its own; downing one leaves the other going.
  l!.hp = 1
  hit(0)
  assert.ok(l!.stall > 0 && boss.phase === 2, 'one reel down')
  r!.hp = 1
  hit(1)
  assert.equal(boss.phase, 3, 'both down: the tape snaps')
  assert.equal(tapeOf(boss).length, 2, 'two whipping tapes')
  // Phase 3: one alone winds itself back up; both within three seconds, and they power down.
  l!.hp = 1
  hit(0)
  run(g, 3 * 60 + 2)
  assert.ok(l!.hp > 0 && l!.stall === 0, 'alone, it winds itself back up')
  l!.hp = 1
  r!.hp = 1
  hit(0)
  run(g, 60)
  hit(1)
  assert.ok(boss.done, 'sparked within three seconds of each other')
  assert.equal(bossZones(boss, w).length, 0)
}

// --- charms and chips ------------------------------------------------------------------------------

{
  assert.equal(Object.keys(CHARMS).length, 6)
  assert.equal(Object.keys(CHIPS).length, 6)
  // Shell: clinging drains nothing. Ghost: glitches lose track. Shoo: they flee.
  const shell = staged(9, 3, 16)
  shell.heroes[0]!.charm = { kind: 'shell', ticks: 600 }
  const gl = newGlitch(
    'glitch',
    shell.heroes[0]!.x + 3,
    shell.heroes[0]!.y,
    1,
    900,
    -1,
    1,
  )
  shell.glitches.push(gl)
  run(shell, 120)
  assert.ok(shell.heroes[0]!.battery >= 300 - 5, 'Shell: no drain')
  const ghost = staged(9, 3, 16)
  ghost.heroes[0]!.charm = { kind: 'ghost', ticks: 600 }
  const gg = newGlitch(
    'glitch',
    ghost.heroes[0]!.x + 60,
    ghost.heroes[0]!.y,
    1,
    901,
    -1,
    1,
  )
  ghost.glitches.push(gg)
  const gx = gg.x
  run(ghost, 60)
  assert.ok(Math.abs(gg.x - gx) < 2, 'Ghost: it cannot find you')
  const shoo = staged(9, 3, 16)
  shoo.heroes[0]!.charm = { kind: 'shoo', ticks: 600 }
  const sg = newGlitch(
    'glitch',
    shoo.heroes[0]!.x + 40,
    shoo.heroes[0]!.y,
    1,
    902,
    -1,
    1,
  )
  shoo.glitches.push(sg)
  const sx = sg.x
  run(shoo, 30)
  assert.ok(sg.x > sx + 5, 'Shoo: it flees')
  // Hop: through one rack.
  const hop = staged(1, 5, 1)
  hop.heroes[0]!.charm = { kind: 'hop', ticks: 600 }
  run(hop, 40, () => [hold('right')])
  assert.ok(hop.heroes[0]!.x > 8 * 16, 'Hop: through the rack')
  assert.equal(hop.heroes[0]!.charm, null, 'and spent')
  // Mirror: sparks bounce off plain racks.
  const mirror = staged(1, 6, 1)
  mirror.heroes[0]!.charm = { kind: 'mirror', ticks: 600 }
  mirror.heroes[0]!.facing = 2
  run(mirror, 1, () => [tap('a')])
  let back = false
  for (let i = 0; i < 20 && mirror.sparks.length; i++) {
    run(mirror, 1)
    if (mirror.sparks[0] && mirror.sparks[0].vx < 0) back = true
  }
  assert.ok(back, 'Mirror: sparks bounce off racks')
  // Chips: picked up, they stack (to three) and stay for the run.
  const chip = staged(3, 33, 13)
  chip.items = [
    { x: chip.heroes[0]!.x, y: chip.heroes[0]!.y, kind: 'chip', chip: 'power' },
  ]
  run(chip, 2)
  assert.equal(chip.heroes[0]!.chips.power, 1, 'a power chip')
  chip.buildFloor(4)
  assert.equal(chip.heroes[0]!.chips.power, 1, 'kept on the next floor')
  // A charm item hands its charm over, timed.
  const charm = staged(2, 33, 10)
  charm.items = [
    {
      x: charm.heroes[0]!.x,
      y: charm.heroes[0]!.y,
      kind: 'charm',
      charm: 'shell',
    },
  ]
  run(charm, 2)
  assert.equal(charm.heroes[0]!.charm?.kind, 'shell')
  run(charm, 20 * 60)
  assert.equal(charm.heroes[0]!.charm, null, 'for twenty seconds')
}

// --- floor secrets -----------------------------------------------------------------------------------

{
  // Find: the hidden '!' behind the Intake Hall's cards.
  const find = staged(1, 28, 8)
  run(find, 2)
  assert.ok(find.secretDone, 'find: picked up')
  // Leaving by stairs: put the bot on them (the far ones when asked).
  const leave = (floor: number, far: boolean, setup?: (g: Inner) => void) => {
    const g = staged(floor, 2, 2)
    const fi = (g as unknown as { farExit: number }).farExit
    const e = far ? g.exits[fi]! : g.exits.find((_, i) => i !== fi)!
    setup?.(g)
    g.heroes[0]!.x = e.x
    g.heroes[0]!.y = e.y
    const before = g.score
    run(g, 2)
    return { done: g.secretDone, gained: g.score - before }
  }
  const far = leave(2, true)
  assert.ok(far.done && far.gained > 1000, 'far: the far stairs')
  assert.ok(!leave(2, false).done, 'the near stairs are not the secret')
  // Express: the Archive Stacks' lift.
  const lift = staged(10, 31, 4)
  run(lift, 2)
  assert.ok(lift.secretDone, 'express: by the lift')
  // Gentle: never sparking a snack.
  assert.ok(leave(12, false).done, 'gentle: no snack sparked')
  assert.ok(
    !leave(
      12,
      false,
      (g) => ((g as unknown as { snackSparked: boolean }).snackSparked = true),
    ).done,
    'a sparked snack spoils it',
  )
  // Clean: every generator shut down (staged floors have none left).
  assert.ok(leave(4, false).done, 'clean: no generators left')
  // Rescue: every caged bot freed.
  assert.ok(
    leave(3, false, (g) => (g.items = g.items.filter((i) => i.kind !== 'cage')))
      .done,
    'rescue: every cage open',
  )
  assert.ok(!leave(3, false).done, 'a bot still caged spoils it')
}

// --- the Lost & Found -------------------------------------------------------------------------------

{
  const g = game([1])
  g.buildFloor(7)
  assert.equal(g.lostTicks, 30 * 60)
  assert.equal(g.music, (g as unknown as { music: unknown }).music)
  const keepsakes = () => g.items.filter((i) => i.kind === 'keepsake').length
  assert.ok(keepsakes() >= 15, 'a floor full of keepsakes')
  g.heroes[0]!.battery = 300
  const k = g.items.find((i) => i.kind === 'keepsake')!
  g.heroes[0]!.x = k.x
  g.heroes[0]!.y = k.y
  const s0 = g.score
  run(g, 2)
  assert.ok(g.score > s0, 'grabbed for points')
  for (let i = 0; i < 30 * 60; i++) {
    g.heroes[0]!.battery = 300
    g.update(idle(), [idle()])
  }
  assert.equal(keepsakes(), 0, "time's up: the rest are gone")
}

// --- music, save and resume ---------------------------------------------------------------------------

{
  const g = game([1])
  assert.equal(g.music, VAULT_LOOP)
  g.buildFloor(8)
  assert.equal(g.music, GUARDIAN_LOOP)
  g.buildFloor(9)
  assert.equal(g.music, LIBRARY_LOOP)
  assert.ok(g.save, 'starting the Tape Library saves the descent')
  assert.equal(g.save!.wing, 1)
  assert.deepEqual(readGauntletSave(JSON.parse(JSON.stringify(g.save))), g.save)
  assert.ok(JSON.stringify(g.save).length < 8192)
  // Junk is ignored.
  assert.equal(readGauntletSave(null), null)
  assert.equal(
    readGauntletSave({ v: 1, wing: 9, score: 1, keys: 0, seats: [] }),
    null,
  )
  assert.equal(readGauntletSave({ ...g.save, seats: [{ cls: 'nope' }] }), null)

  const save: GauntletSave = {
    v: 1,
    wing: 1,
    score: 54321,
    keys: 2,
    seats: [
      {
        cls: 'sage',
        points: 54321,
        pulses: 4,
        chips: { power: 2, speed: 0, armor: 1, range: 0, pulse: 0, zap: 0 },
      },
    ],
  }
  const back = game([1], 3, save)
  assert.ok(back.offer, 'a stored descent is offered')
  back.update(tap('a'), [tap('a')])
  assert.ok(!back.offer && back.selecting > 0, 'continue: choose your bot')
  assert.equal(back.heroes[0]!.choice, 2, 'the cursor starts on the saved bot')
  back.update(tap('a'), [tap('a')])
  assert.equal(back.level, 9, 'back at the start of the Tape Library')
  assert.equal(back.score, 54321)
  assert.equal(back.heroes[0]!.chips.power, 2)
  assert.equal(back.keys, 2)
  const fresh = game([1], 3, save)
  fresh.update(tap('b'), [tap('b')])
  fresh.update(tap('a'), [tap('a')])
  assert.equal(fresh.level, 1, 'start over: floor 1')
  assert.equal(fresh.score, 0)
  const demo = create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
    resume: save,
  }) as unknown as Inner
  assert.equal(demo.offer, null, 'the attract demo ignores saves')
}

// --- a scripted clear of the Vault --------------------------------------------------------------------

{
  for (const cls of [0, 1]) {
    const g = game([cls], 5 + cls)
    let t = 0
    for (; t < 60 * 60 * 12 && g.level <= 8; t++) {
      for (const h of g.heroes) h.battery = Math.max(h.battery, 150)
      const f = g.demoInput()
      g.update(f, [f])
    }
    assert.ok(
      g.level >= 9,
      `the pilot clears the Vault (bot ${cls}) in ${(t / 3600).toFixed(1)} min`,
    )
    console.log(
      `  Vault cleared by the pilot (bot ${cls}) in ${(t / 3600).toFixed(1)} min, score ${g.score}`,
    )
  }
}

console.log('Kindness Gauntlet wings: ok')
