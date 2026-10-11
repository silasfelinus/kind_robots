// Kindness Gauntlet depth pass, slice 4 (conductor kr-arcade/t-054, depth-pass/CABINETS.md section
// 5): the Core and the modes. The Core's firewall gates and defrag rows, the Sleepy Cursor, the Old
// Mainframe's three phases, both endings, Reboot, the Endless Archive, the Lost & Found mode, the
// Score Duel, the medal board and the save that keeps them, and a scripted full campaign: the pilot
// from the Intake Hall to the credits.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create, readGauntletSave } from '../arcade/games/kindnessGauntlet'
import type { GauntletSave } from '../arcade/games/kindnessGauntlet'
import { ARCADE_GAMES } from '../arcade/games'
import { WINGS } from '../arcade/kindnessGauntlet/floors'
import { newGlitch } from '../arcade/kindnessGauntlet/roster'
import type { Glitch } from '../arcade/kindnessGauntlet/roster'
import { bossZones } from '../arcade/kindnessGauntlet/guardians'
import type { BossWorld, Guardian } from '../arcade/kindnessGauntlet/guardians'
import {
  RECALLED,
  TERMINAL_HOLD,
  terminals,
} from '../arcade/kindnessGauntlet/finale'
import { LOST_FLOORS, MODES } from '../arcade/kindnessGauntlet/modes'

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
  picked: boolean
}
type Inner = {
  score: number
  level: number
  over: boolean
  heroes: Hero[]
  walls: Uint8Array
  seen: Uint8Array
  glitches: Glitch[]
  generators: Array<{ tier: number; kind: string }>
  items: Array<{ x: number; y: number; kind: string }>
  shots: unknown[]
  exits: Array<{ x: number; y: number }>
  gates: Array<{ tile: number; late: boolean }>
  defrag: Array<{ slots: number[]; blocks: number }>
  floorFx: Uint8Array
  guardian: Guardian | null
  bossWorld: BossWorld
  sealed: boolean
  leaving: number
  floorTicks: number
  secretDone: boolean
  memories: number[]
  medals: Record<string, number>
  mode: string
  duel: boolean
  modeCursor: number
  selecting: number
  ending: { t: number; full: boolean } | null
  plan: { name: string } | null
  save: GauntletSave | null
  music: unknown
  update(input: InputFrame, players?: InputFrame[]): void
  render(g: unknown): void
  buildFloor(n: number): void
  demoInput(): InputFrame
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

function fresh(players = 1, seed = 3, resume?: unknown): Inner {
  return create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players,
    resume,
  }) as unknown as Inner
}
/** A game past the bot select, in a mode picked with `downs` presses of DOWN. */
function game(
  classes: number[] = [1],
  seed = 3,
  downs = 0,
  resume?: unknown,
): Inner {
  const g = fresh(classes.length, seed, resume)
  for (let i = 0; i < downs; i++)
    g.update(tap('down'), [tap('down'), ...classes.slice(1).map(idle)])
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
/** A stub canvas: every draw call a no-op. */
function stub(): unknown {
  return new Proxy(
    {},
    {
      get: (_t, key) =>
        key === 'measureText'
          ? () => ({ width: 0 })
          : key === 'createLinearGradient' || key === 'createRadialGradient'
            ? () => ({ addColorStop() {} })
            : () => {},
      set: () => true,
    },
  )
}
const idx = (tx: number, ty: number) => ty * 40 + tx
/** Presses of DOWN to reach a mode on a fresh cabinet (Reboot still locked). */
const downsTo = (id: string) =>
  MODES.filter((m) => m.id !== 'reboot').findIndex((m) => m.id === id)

// --- the Core --------------------------------------------------------------------------------------

{
  const core = WINGS[4]!
  assert.equal(core.name, 'THE CORE')
  assert.equal(core.floors.length, 8)
  assert.equal(core.floors[7]!.guardian, 'mainframe')
  const letters = core.floors.map((f) => f.map.join('')).join('')
  for (const ch of ['G', 'J', 'Y', 'y', 'u'])
    assert.ok(letters.includes(ch), `the Core has '${ch}'`)
  // Every earlier trick, remixed.
  for (const ch of ['C', 'M', '~', '=', '1', 'X', 'd', 'V', 'o', 'Z'])
    assert.ok(letters.includes(ch), `the Core remixes '${ch}'`)

  // Firewall gates shut on their half of the beat, zapping a bot caught in one out of it.
  const g = game()
  g.buildFloor(33)
  g.seen.fill(1)
  g.glitches = []
  const gate = g.gates.find((x) => !x.late)!
  const late = g.gates.find((x) => x.late)!
  assert.equal(g.walls[gate.tile], 10, 'G is shut first')
  assert.equal(g.walls[late.tile], 0, 'J is open first')
  const h = g.heroes[0]!
  h.x = (late.tile % 40) * 16 + 8
  h.y = Math.floor(late.tile / 40) * 16 + 8
  h.battery = 300
  run(g, 91)
  assert.equal(g.walls[late.tile], 10, 'then J shuts')
  assert.equal(g.walls[gate.tile], 0, 'and G opens')
  assert.ok(h.battery < 295, 'the bot in it is zapped')
  assert.notEqual(
    idx(Math.floor(h.x / 16), Math.floor(h.y / 16)),
    late.tile,
    'and out of it',
  )

  // Defrag rows slide their blocks to new slots on their beat.
  const d = game()
  d.buildFloor(34)
  d.glitches = []
  const row = d.defrag[0]!
  const before = row.slots.filter((t) => d.walls[t] === 11).join()
  let moved = false
  for (let i = 0; i < 5 && !moved; i++) {
    run(d, 240)
    moved = row.slots.filter((t) => d.walls[t] === 11).join() !== before
  }
  assert.ok(moved, 'the blocks slide and swap')
  assert.equal(
    row.slots.filter((t) => d.walls[t] === 11).length,
    row.blocks,
    'the same blocks',
  )
}

// --- the Sleepy Cursor -----------------------------------------------------------------------------

{
  const g = game([1, 3])
  g.buildFloor(25)
  g.glitches = []
  g.generators = []
  g.seen.fill(1)
  const [a, b] = g.heroes
  a!.x = 12 * 16
  a!.y = 3 * 16
  b!.x = 20 * 16
  b!.y = 3 * 16
  a!.battery = 120
  b!.battery = 280
  const c = newGlitch('cursor', 16 * 16, 2 * 16 + 8, 1, 900, -1, 1)
  g.glitches.push(c)
  run(g, 60)
  assert.ok(c.x > 16 * 16, 'it drifts toward the fullest battery')
  // Sparks pass through it.
  a!.facing = 2
  c.x = a!.x + 30
  c.y = a!.y
  run(g, 1, () => [tap('a'), idle()])
  run(g, 15)
  assert.ok(g.glitches.includes(c), 'sparks cannot fix it')
  c.x = b!.x
  c.y = b!.y
  const bb = b!.battery
  run(g, 30)
  assert.ok(b!.battery < bb - 10, 'it drinks charge fast')
  a!.pulses = 1
  const s0 = g.score
  run(g, 1, () => [tap('b'), idle()])
  assert.ok(!g.glitches.includes(c), 'a pulse puts it to sleep')
  assert.ok(g.score - s0 >= 300, 'for big points')
}

// --- the Old Mainframe ---------------------------------------------------------------------------

{
  const g = game([1], 4)
  g.buildFloor(40)
  const boss = g.guardian!
  assert.equal(boss.kind, 'mainframe')
  assert.ok(g.sealed)
  // Phase 1: the four Guardians return one at a time, at half strength.
  const seen: string[] = []
  for (let i = 0; i < 4; i++) {
    const echo = boss.echo!
    seen.push(echo.kind)
    assert.ok(
      echo.phaseHp <= 22,
      `${echo.kind} at half strength (${echo.phaseHp})`,
    )
    assert.ok(
      bossZones(boss, g.bossWorld).length > 0 || echo.kind === 'attract',
      'it can be hit',
    )
    run(g, 2)
    g.hitBossNow(0, echo.hp)
  }
  assert.deepEqual(seen, [...RECALLED], 'sorter, reels, attract mode, bank')
  assert.equal(boss.phase, 2, 'then the defrag')
  // Phase 2: blocks slide and swap.
  const blocks = () =>
    [...g.walls]
      .map((v, i) => (v === 6 ? i : -1))
      .filter((i) => i >= 0)
      .join()
  const b0 = blocks()
  assert.ok(b0.length > 0, 'the hall is blocked into sections')
  run(g, 200)
  assert.notEqual(blocks(), b0, 'the sections slide and swap')
  g.hitBossNow(0, 999)
  assert.equal(boss.phase, 3, 'then the reboot')
  assert.equal(blocks(), '', 'the blocks are lifted for her terminals')
  // Phase 3: alone, each terminal holds six seconds; the bar fills only while all four are lit.
  const h = g.heroes[0]!
  const spots = terminals(g.bossWorld)
  h.x = spots[0]!.x
  h.y = spots[0]!.y
  run(g, 120)
  assert.equal(boss.boot, 0, 'one terminal is not enough')
  for (const s of spots) {
    h.x = s.x
    h.y = s.y
    h.battery = 300
    run(g, 3)
  }
  assert.ok(
    boss.coins.every((c) => c > 0),
    'all four lit',
  )
  const lit = boss.boot
  run(g, 60)
  assert.ok(boss.boot > lit, 'and her boot bar fills')
  h.x = spots[0]!.x - 40
  h.y = spots[0]!.y
  run(g, TERMINAL_HOLD + 2)
  assert.ok(
    boss.coins.every((c) => c <= 0),
    'the terminals go dark again',
  )
  const dim = boss.boot
  run(g, 60)
  assert.ok(boss.boot < dim, 'and the bar slips back')
  boss.boot = 0.999
  for (const s of spots) {
    h.x = s.x
    h.y = s.y
    run(g, 2)
  }
  run(g, 10)
  assert.ok(boss.done, 'booted: she is awake')
  run(g, 2)
  assert.ok(!g.sealed, 'the stairs open')

  // Co-op: one bot on each terminal.
  const four = game([0, 1, 2, 3], 5)
  four.buildFloor(40)
  const fb = four.guardian!
  for (let i = 0; i < 4; i++) four.hitBossNow(0, 999)
  four.hitBossNow(0, 999)
  assert.equal(fb.phase, 3)
  four.heroes.forEach((hero, i) => {
    hero.x = spots[i]!.x
    hero.y = spots[i]!.y
  })
  run(four, 10 * 60 + 5, () => {
    four.heroes.forEach((hero, i) => {
      hero.x = spots[i]!.x
      hero.y = spots[i]!.y
      hero.battery = 300
    })
    return four.heroes.map(idle)
  })
  assert.ok(fb.done, 'four bots hold four terminals')
}

// --- endings, Reboot and the save ---------------------------------------------------------------

{
  const ending = (memories: number[]) => {
    const g = game([1], 6)
    g.buildFloor(40)
    g.memories = memories
    const boss = g.guardian!
    boss.done = true
    run(g, 2)
    const e = g.exits[0]!
    g.heroes[0]!.x = e.x
    g.heroes[0]!.y = e.y
    const s0 = g.score
    run(g, 2)
    run(g, 125)
    assert.ok(g.ending, 'the ending rolls')
    assert.ok(g.music, 'with its own music')
    g.render(stub())
    run(g, 7 * 60)
    g.render(stub())
    run(g, 1, () => [tap('a')])
    assert.ok(g.over, 'A ends the credits')
    return { g, gained: g.score - s0 }
  }
  const plain = ending([0, 1])
  const full = ending([0, 1, 2, 3, 4])
  assert.ok(
    full.gained > plain.gained,
    'all five Memory Cards: the true ending, and its bonus',
  )
  assert.equal(full.g.save?.cleared, 1, 'a finished descent counts')
  assert.equal(full.g.save?.wing, 0, 'and leaves nothing to resume')
  // Reboot is on offer once a descent is finished, and plays tougher.
  const record = full.g.save!
  const before = fresh(1, 7, record)
  assert.equal(before.selecting > 0, true)
  const modes = (before as unknown as { modes(): Array<{ id: string }> })
    .modes()
    .map((m) => m.id)
  assert.ok(modes.includes('reboot'), 'REBOOT unlocked')
  const locked = fresh(1, 7)
  assert.ok(
    !(locked as unknown as { modes(): Array<{ id: string }> })
      .modes()
      .some((m) => m.id === 'reboot'),
    'and not before',
  )
  const reboot = game([1], 7, 1, record)
  assert.equal(reboot.mode, 'reboot')
  const normal = game([1], 7)
  assert.ok(
    reboot.generators.reduce((n, gen) => n + gen.tier, 0) >
      normal.generators.reduce((n, gen) => n + gen.tier, 0),
    'tougher generators',
  )
  assert.ok(readGauntletSave(JSON.parse(JSON.stringify(record))))
  assert.equal(
    readGauntletSave({ ...record, medals: { 99: 1 } }),
    null,
    'junk medals are refused',
  )
}

// --- the Endless Archive ------------------------------------------------------------------------------

{
  const endlessAt = downsTo('endless')
  const g = game([1], 8, endlessAt)
  assert.equal(g.mode, 'endless')
  assert.equal(g.plan, null, 'random floors')
  let tricks = 0
  for (let floor = 1; floor <= 10; floor++) {
    g.buildFloor(floor)
    tricks += [...g.floorFx].filter((v) => v > 0).length
    if (floor % 5 === 0) {
      assert.ok(
        g.glitches.some((x) => x.kind === 'bluescreen'),
        `floor ${floor}: a Big Bluescreen`,
      )
      assert.ok(g.sealed)
    }
  }
  assert.ok(tricks > 40, 'every trick turns up')
  // It gets harder the deeper it goes, and runs end.
  const deep = game([1], 9, endlessAt)
  let t = 0
  for (; t < 60 * 60 * 30 && !deep.over; t++) {
    const f = deep.demoInput()
    deep.update(f, [f])
  }
  assert.ok(
    deep.over,
    `an Endless run ends (floor ${deep.level}, ${(t / 3600).toFixed(1)} min)`,
  )
  assert.equal(deep.save?.best?.depth, deep.level, 'the deepest floor is kept')
  console.log(
    `  Endless Archive: the pilot reaches depth ${deep.level} in ${(t / 3600).toFixed(1)} min, score ${deep.score}`,
  )
}

// --- the Lost & Found mode -------------------------------------------------------------------------

{
  const lostAt = downsTo('lost')
  const g = game([1], 10, lostAt)
  assert.equal(g.mode, 'lost')
  const visited: number[] = []
  for (let i = 0; i < 5; i++) {
    visited.push(g.level)
    const b0 = g.heroes[0]!.battery
    run(g, 120)
    assert.equal(g.heroes[0]!.battery, b0, 'no drain on the treasure floors')
    const e = g.exits[0]!
    g.heroes[0]!.x = e.x
    g.heroes[0]!.y = e.y
    run(g, 125)
  }
  assert.deepEqual(
    visited,
    [...LOST_FLOORS],
    "each wing's Lost & Found in turn",
  )
  assert.ok(g.over, 'then the bins are done')
  assert.ok(g.save?.best?.lost !== undefined, 'and the best is kept')
}

// --- the Score Duel and the medal board ---------------------------------------------------------------

{
  const two = fresh(2, 11)
  two.update(idle(), [tap('b'), idle()])
  assert.ok(two.duel, 'B turns the Score Duel on in co-op')
  two.update(idle(), [tap('a'), tap('a')])
  two.heroes[0]!.points = 900
  two.heroes[1]!.points = 1200
  two.heroes.forEach((h) => (h.battery = 0))
  run(two, 2)
  assert.ok(two.over)
  two.render(stub())
  const solo = fresh(1, 11)
  solo.update(tap('b'), [tap('b')])
  assert.ok(!solo.duel, 'no duel alone')

  // The medal board is a view: A there picks nothing.
  const board = fresh(1, 12)
  const at = downsTo('medals')
  for (let i = 0; i < at; i++) board.update(tap('down'), [tap('down')])
  board.render(stub())
  board.update(tap('a'), [tap('a')])
  assert.ok(!board.heroes[0]!.picked, 'the medal board is only to look at')

  // Medals: a floor's secret, its par, and a kind clear.
  const g = game([1], 12)
  g.buildFloor(2)
  g.glitches = []
  const fi = (g as unknown as { farExit: number }).farExit
  const e = g.exits[fi]!
  g.heroes[0]!.x = e.x
  g.heroes[0]!.y = e.y
  run(g, 2)
  assert.equal(
    g.medals['2'],
    7,
    'all three on a quick, kind clear by the far stairs',
  )
  assert.equal(g.save?.medals?.['2'], 7, 'kept on the board')
  const slow = game([1], 13)
  slow.buildFloor(3)
  slow.floorTicks = 60 * 999
  ;(slow as unknown as { flatHere: boolean }).flatHere = true
  const se = slow.exits[0]!
  slow.heroes[0]!.x = se.x
  slow.heroes[0]!.y = se.y
  run(slow, 2)
  assert.equal(
    slow.medals['3'] ?? 0,
    0,
    'no medals for a slow, rough, secretless clear',
  )
}

// --- the registry ----------------------------------------------------------------------------------

{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'kindness-gauntlet')!
  assert.equal(meta.maxPlayers, 4)
  assert.ok(
    meta.blurb.includes('Deep Archive'),
    'the blurb tells of the Deep Archive',
  )
  assert.ok(
    meta.howTo.some((l) => l.includes('MEMORY')),
    'and the how-to of the Memory Cards',
  )
}

// --- a scripted full campaign -------------------------------------------------------------------------

{
  const g = game([1], 14)
  let t = 0
  for (; t < 60 * 60 * 45 && !g.over; t++) {
    for (const h of g.heroes) h.battery = Math.max(h.battery, 150)
    const f = g.ending && g.ending.t > 6 * 60 ? tap('a') : g.demoInput()
    g.update(f, [f])
  }
  assert.ok(
    g.over && g.save?.cleared === 1,
    `the pilot clears the Deep Archive (${(t / 3600).toFixed(1)} min)`,
  )
  console.log(
    `  The Deep Archive cleared by the pilot in ${(t / 3600).toFixed(1)} min, score ${g.score}, ${Object.keys(g.medals).length} floors with medals, ${g.memories.length} Memory Cards`,
  )
}

console.log('Kindness Gauntlet core and modes: ok')
