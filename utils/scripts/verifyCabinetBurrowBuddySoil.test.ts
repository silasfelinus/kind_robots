// /utils/scripts/verifyCabinetBurrowBuddySoil.test.ts
//
// Burrow Buddy depth pass, slice 1 "soil that moves" (conductor kr-arcade/t-106): the authored
// garden format and the seeded endless gardens built on it, slump physics (cut free, undercut,
// carried turnips and stones, riders), the crush count and slump chains, the twelve-veggie ladder
// and the Golden Beet, grump moods and the escape, the six bubble tools, the pill bug, mole cricket
// and mimic turnip, the beetle's garden-2 arrival, and a pilot probe showing runs still end and
// the attract demo still scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetBurrowBuddySoil.test.ts

import assert from 'node:assert/strict'
import { levelCurve, mulberry32 } from '../arcade/curve'
import burrowBuddy from '../arcade/games/burrowBuddy'
import {
  AUTHORED_GARDENS,
  BURROW_CURVES,
  COLS,
  ROWS,
  TOOL_KINDS,
  cellKey,
  gardenFor,
  generateGarden,
  parseGarden,
} from '../arcade/burrowBuddy/gardens'
import type {
  Cell,
  GardenPlan,
  GrumpKind,
  ToolKind,
} from '../arcade/burrowBuddy/gardens'
import {
  CHAIN_CAP,
  CRACK_PUSH,
  CRICKET_DIG,
  CURL_REST,
  CURL_TICKS,
  GOLDEN_BEET,
  HEADLAMP_RADIUS,
  LAMP_RADIUS,
  MIMIC_POINTS,
  SPRAY_TICKS,
  TOOLS,
  VEGGIE_LADDER,
  crushBonus,
  leadingCells,
  moodFor,
  popAt,
  sidesCut,
  slumpBonus,
  slumpFree,
  topCells,
  undercut,
  veggieForGarden,
} from '../arcade/burrowBuddy/rules'
import type { SlumpWorld } from '../arcade/burrowBuddy/rules'
import { LADDER_HAS_ART, VEGGIE_SPRITES } from '../arcade/burrowBuddy/art'
import { ARCADE_GAMES } from '../arcade/games'
import { emptyInput, type InputFrame } from '../arcade/types'

type Mover = { tx: number; ty: number; nx: number; ny: number; p: number }
type Enemy = {
  kind: GrumpKind
  m: Mover
  spawn: { tx: number; ty: number }
  ghost: boolean
  fleeing: boolean
  ghostTimer: number
  inflate: number
  curl: number
  curlRest: number
  spray: number
  digLeft: number
  awake: number
}
type Slump = {
  cells: Cell[]
  state: 'held' | 'creak' | 'fall'
  chain: number
}
type Turnip = {
  tx: number
  ty: number
  state: string
  t: number
  drop: number
  crushed: number
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  levelTick: number
  dug: Uint8Array
  links: Set<number>
  plan: GardenPlan
  start: { tx: number; ty: number }
  stones: Map<number, { cracked: ToolKind | null; push: number }>
  slumps: Slump[]
  turnips: Turnip[]
  enemies: Enemy[]
  player: Mover
  facing: number
  tools: Record<ToolKind, number>
  veggie: { ticks: number; prize: { name: string; points: number } } | null
  dropped: number
  lastSlump: { crushed: number; chain: number; bonus: number } | null
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  demoInput(): InputFrame
  grumpMood(e: Enemy): string
  lightRadius(): number
  loadGarden(plan: GardenPlan): void
  startLevel(level: number): void
  land(t: Turnip): void
  isDug(x: number, y: number): boolean
  linkKey(ax: number, ay: number, bx: number, by: number): number
}

const MAX_SCORE = ARCADE_GAMES.find(
  (g) => g.slug === 'burrow-buddy',
)!.maxPlausibleScore

function play(seed = 3, demo = false): Game {
  return burrowBuddy.create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo,
    hiScore: 0,
  }) as unknown as Game
}

function frame(
  held: Partial<InputFrame['held']> = {},
  pressed: Partial<InputFrame['pressed']> = {},
): InputFrame {
  const f = emptyInput()
  Object.assign(f.held, held)
  Object.assign(f.pressed, pressed)
  return f
}

function idle(game: Game, ticks: number) {
  for (let i = 0; i < ticks; i++) game.update(frame())
}

const stub = new Proxy(
  {},
  {
    get: (_, prop) => {
      if (prop === 'measureText') return () => ({ width: 6 })
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
        return () => ({ addColorStop: () => {} })
      return () => {}
    },
    set: () => true,
  },
) as CanvasRenderingContext2D

/**
 * A test garden from ASCII rows (row 1 down; the rest is soil). Grumps never get bored and the
 * last one never runs, so each case controls exactly what moves.
 */
function garden(rows: string[], tools: ToolKind[] = []): Game {
  const full = [...rows]
  while (full.length < ROWS - 1) full.push('................')
  const plan = parseGarden({ id: 't', name: 'T', par: 60, tools, rows: full })
  plan.escapeAfter = 1_000_000
  const game = play(5)
  game.loadGarden(plan)
  game.levelTick = 0
  game.start = { tx: plan.start.x, ty: plan.start.y }
  place(game, plan.start.x, plan.start.y)
  for (const e of game.enemies) e.ghostTimer = 1_000_000
  return game
}

function place(game: Game, tx: number, ty: number, facing?: number) {
  game.player = { tx, ty, nx: tx, ny: ty, p: 0 }
  if (facing !== undefined) game.facing = facing
}

function link(game: Game, ax: number, ay: number, bx: number, by: number) {
  game.dug[cellKey(ax, ay)] = 1
  game.dug[cellKey(bx, by)] = 1
  game.links.add(game.linkKey(ax, ay, bx, by))
}

const cellsOf = (game: Game, i: number) =>
  game.slumps[i]!.cells.map((c) => `${c.x},${c.y}`).sort()

const SKY = '..........#.....'
const BUDDY = '..........@.....'

// --- the garden format ----------------------------------------------------------------------------
{
  assert.equal(AUTHORED_GARDENS.length, 4, 'four authored opening gardens')
  for (const plan of AUTHORED_GARDENS) {
    const dug = new Set(plan.tunnels.map((c) => cellKey(c.x, c.y)))
    assert.ok(dug.has(cellKey(plan.start.x, plan.start.y)), `${plan.id}: start`)
    assert.ok(plan.par > 0 && plan.escapeAfter > 0)
    assert.equal(plan.objective, 'puff-them-all')
    for (const b of plan.burrows)
      assert.ok(dug.has(cellKey(b.at.x, b.at.y)), `${plan.id}: burrows`)
    const blockCells = new Set(plan.slumps.flat().map((c) => cellKey(c.x, c.y)))
    for (const t of plan.turnips) {
      if (blockCells.has(cellKey(t.x, t.y))) continue
      assert.ok(!dug.has(cellKey(t.x, t.y + 1)), `${plan.id}: turnips on soil`)
    }
    assert.ok(plan.slumps.length >= 1, `${plan.id}: a slump to learn on`)
    const world: SlumpWorld = {
      cut: (x, y) => x < 0 || x >= COLS || dug.has(cellKey(x, y)),
      open: (x, y) => y < ROWS && dug.has(cellKey(x, y)),
    }
    for (const cells of plan.slumps)
      assert.equal(slumpFree(cells, world), false, `${plan.id}: starts held`)
  }
  const kinds = (i: number) => AUTHORED_GARDENS[i]!.burrows.map((b) => b.kind)
  assert.ok(!kinds(0).includes('beetle'), 'no beetle in garden 1')
  assert.ok(kinds(1).includes('beetle'), 'a beetle in garden 2')
  assert.ok(kinds(2).includes('pillbug'), 'garden 3 brings the pill bug')
  assert.ok(kinds(3).includes('cricket') && kinds(3).includes('mimic'))
  assert.equal(AUTHORED_GARDENS[2]!.slumps.length, 2, 'a stacked pair to chain')
  const handed = new Set(
    AUTHORED_GARDENS.flatMap((p) => p.cracked.map((c) => c.tool)),
  )
  assert.ok(handed.size >= 5, 'the opening gardens hand out most tools')
  const stoneGarden = AUTHORED_GARDENS[1]!
  assert.ok(stoneGarden.stones.some((c) => c.x === 13 && c.y === 7))
  assert.ok(stoneGarden.turnips.some((c) => c.x === 11 && c.y === 7))

  const blank = new Array<string>(12).fill('................')
  assert.throws(() => parseGarden({ id: 'x', name: 'X', par: 1, rows: ['.'] }))
  assert.throws(
    () =>
      parseGarden({
        id: 'x',
        name: 'X',
        par: 1,
        rows: [...blank, '.......@......Q.'],
      }),
    /unknown/,
  )
  assert.throws(
    () =>
      parseGarden({
        id: 'x',
        name: 'X',
        par: 1,
        rows: [...blank, '.......@.....C..'],
      }),
    /tool/,
  )

  // The endless loop runs on the same format, rolled from the seed.
  const a = generateGarden(9, mulberry32(4))
  assert.deepEqual(a, generateGarden(9, mulberry32(4)), 'a seeded garden')
  assert.notDeepEqual(a, generateGarden(9, mulberry32(5)))
  for (let level = 5; level <= 40; level++) {
    const plan = generateGarden(level, mulberry32(level * 7))
    const seen = new Map<number, string>()
    const claim = (c: Cell, what: string) => {
      const k = cellKey(c.x, c.y)
      assert.ok(c.x >= 0 && c.x < COLS && c.y >= 1 && c.y < ROWS)
      assert.ok(!seen.has(k), `${level}: ${what} overlaps ${seen.get(k)}`)
      seen.set(k, what)
    }
    plan.tunnels.forEach((c) => claim(c, 'tunnel'))
    plan.stones.forEach((c) => claim(c, 'stone'))
    plan.cracked.forEach((c) => claim(c.at, 'cracked'))
    plan.turnips.forEach((c) => claim(c, 'turnip'))
    plan.slumps.flat().forEach((c) => claim(c, 'slump'))
    const count = (k: GrumpKind) =>
      plan.burrows.filter((b) => b.kind === k).length
    assert.ok(plan.burrows.length >= 4, `${level}: a full roster`)
    assert.ok(plan.slumps.length >= 1 && plan.stones.length >= 1)
    assert.ok(plan.cracked.length >= 1)
    assert.ok(
      count('beetle') <= Math.floor(levelCurve(level, BURROW_CURVES.beetles)),
    )
    assert.equal(plan.objective, 'puff-them-all')
  }
  assert.ok(
    [9, 12, 15, 20].some((l) =>
      generateGarden(l, mulberry32(l)).burrows.some(
        (b) => b.kind === 'pillbug',
      ),
    ),
  )
  assert.equal(gardenFor(1, mulberry32(1)).id, 'first-dig')
  assert.equal(gardenFor(4, mulberry32(1)).id, 'crickets-corner')
  assert.equal(gardenFor(5, mulberry32(1)).id, 'garden-5')

  // The game lays every garden out from its plan, and the beetle comes in garden 2.
  const game = play(2)
  assert.equal(game.plan.id, 'first-dig')
  assert.equal(game.enemies.filter((e) => e.kind === 'beetle').length, 0)
  assert.equal(game.slumps.length, 1)
  game.startLevel(2)
  assert.equal(game.enemies.filter((e) => e.kind === 'beetle').length, 1)
  assert.equal(
    game.stones.size,
    5,
    'three stones, one set in a block, one cracked',
  )
  game.startLevel(7)
  assert.equal(game.plan.id, 'garden-7')
  assert.ok(game.enemies.length >= 4)
}

// --- slump rules ----------------------------------------------------------------------------------
{
  const block = [
    { x: 2, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 3 },
    { x: 3, y: 3 },
  ]
  const dug = new Set<string>()
  const world: SlumpWorld = {
    cut: (x, y) => x < 0 || dug.has(`${x},${y}`),
    open: (x, y) => dug.has(`${x},${y}`),
  }
  assert.equal(slumpFree(block, world), false)
  for (const c of ['1,2', '1,3', '4,2']) dug.add(c)
  assert.equal(sidesCut(block, world), false, 'one side cell still props it')
  dug.add('4,3')
  assert.equal(sidesCut(block, world), true)
  assert.equal(undercut(block, world), false, 'soil under it holds it up')
  dug.add('2,4')
  assert.equal(undercut(block, world), false, 'half undercut still holds')
  dug.add('3,4')
  assert.equal(slumpFree(block, world), true, 'cut free and undercut: slides')
  assert.deepEqual(leadingCells(block), [
    { x: 2, y: 4 },
    { x: 3, y: 4 },
  ])
  assert.deepEqual(topCells(block), [
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ])
  dug.add('1,5')
  dug.add('0,6')
  assert.equal(slumpFree([{ x: 0, y: 5 }], world), true, 'the edge is a cut')

  assert.equal(slumpBonus(0, 3), 0, 'a chain with nothing under it pays 0')
  assert.equal(slumpBonus(1, 1), crushBonus(1))
  assert.equal(slumpBonus(3, 2), crushBonus(3) * 2, 'a chain multiplies')
  assert.equal(slumpBonus(2, 9), crushBonus(2) * CHAIN_CAP, 'up to a cap')
  assert.equal(crushBonus(99), crushBonus(7))
}

// --- a slump in the game: one piece, carrying, crushing, riding ----------------------------------
{
  const game = garden([
    SKY,
    SKY,
    '.....gg...#.....',
    '....#11#..#.....',
    '....#11...@.....',
    '.....gg.........',
    '..............g.',
  ])
  game.turnips.push({ tx: 5, ty: 4, state: 'idle', t: 0, drop: 0, crushed: 0 })
  game.stones.set(cellKey(6, 5), { cracked: null, push: 0 })
  const before = game.score
  idle(game, 120)
  assert.equal(game.slumps[0]!.state, 'held', 'one uncut side cell props it')
  assert.deepEqual(cellsOf(game, 0), ['5,4', '5,5', '6,4', '6,5'])
  assert.equal(game.turnips[0]!.state, 'idle', 'a set turnip stays put')

  game.dug[cellKey(7, 5)] = 1
  game.update(frame())
  assert.equal(game.slumps[0]!.state, 'creak', 'cut free: it creaks (the tell)')
  idle(game, 200)
  assert.equal(game.slumps[0]!.state, 'held', 'landed')
  assert.deepEqual(
    cellsOf(game, 0),
    ['5,5', '5,6', '6,5', '6,6'],
    'slid a row as one piece',
  )
  assert.ok(game.isDug(5, 4) && game.isDug(6, 4), 'the gap it left is tunnel')
  assert.ok(
    !game.isDug(5, 6) && !game.isDug(6, 6),
    'the row it filled is solid',
  )
  assert.equal(game.turnips[0]!.ty, 5, 'its turnip came with it')
  assert.ok(game.stones.has(cellKey(6, 6)), 'and its stone')
  assert.ok(!game.stones.has(cellKey(6, 5)))
  assert.equal(game.enemies.length, 1, 'two squashed under it, two rode it')
  assert.deepEqual(game.lastSlump, {
    crushed: 4,
    chain: 1,
    bonus: crushBonus(4),
  })
  assert.ok(game.score - before >= crushBonus(4))
  game.render(stub)
}

// --- a slump bonks Buddy if he stands under it ------------------------------------------------------
{
  const game = garden([
    SKY,
    '....#11#..#.....',
    '....#11#..@.....',
    '.....##.........',
    '................',
    '..............g.',
  ])
  idle(game, 2)
  assert.equal(game.slumps[0]!.state, 'creak')
  place(game, 5, 4)
  const lives = game.lives
  idle(game, 60)
  assert.equal(game.lives, lives - 1, 'bonked by a slump')
}

// --- slump chains -------------------------------------------------------------------------------------
{
  const game = garden([
    '.....g....#.....',
    '....#11#..#.....',
    '....#11#..#.....',
    '....#22#..#.....',
    '....#22#..@.....',
    '.....##.........',
    '..............g.',
  ])
  idle(game, 400)
  const [upper, lower] = game.slumps
  assert.equal(lower!.chain, 1, 'the lower block went first')
  assert.equal(upper!.chain, 2, 'the gap it left set off the one above')
  assert.deepEqual(cellsOf(game, 1), ['5,5', '5,6', '6,5', '6,6'])
  assert.deepEqual(cellsOf(game, 0), ['5,3', '5,4', '6,3', '6,4'])
  assert.equal(game.lastSlump!.chain, 2)
  assert.equal(game.lastSlump!.crushed, 1, 'the grump riding the top block')
  assert.equal(game.lastSlump!.bonus, crushBonus(1) * 2)
}

// --- the Golden Beet: five grumps in one crush ------------------------------------------------------
{
  const game = garden([
    SKY,
    '....ggg...#.....',
    '...#111#..#.....',
    '...#111#..@.....',
    '....ggg.........',
    '..............g.',
  ])
  place(game, 10, 1)
  idle(game, 200)
  assert.ok(game.lastSlump!.crushed >= 5, 'a big crush')
  assert.equal(game.veggie!.prize, GOLDEN_BEET, 'brings out the Golden Beet')
  const before = game.score
  place(game, game.start.tx, game.start.ty)
  game.update(frame())
  assert.equal(game.score - before, GOLDEN_BEET.points)
  assert.equal(game.veggie, null)
  game.render(stub)
}

// --- the veggie ladder ---------------------------------------------------------------------------------
{
  assert.ok(LADDER_HAS_ART, 'every rung has its own sprite')
  assert.ok(VEGGIE_SPRITES[GOLDEN_BEET.name])
  assert.deepEqual(
    VEGGIE_LADDER.map((r) => r.name),
    [
      'RADISH',
      'CARROT',
      'TURNIP GREENS',
      'MUSHROOM',
      'CUCUMBER',
      'EGGPLANT',
      'PEPPER',
      'TOMATO',
      'ONION',
      'PUMPKIN',
      'WATERMELON',
      'STAR FRUIT',
    ],
  )
  assert.equal(VEGGIE_LADDER[0].points, 400)
  assert.equal(VEGGIE_LADDER.at(-1)!.points, 8000)
  const game = play(4)
  game.startLevel(9)
  game.dropped = 1
  game.land({ tx: 3, ty: 3, state: 'fall', t: 0, drop: 16, crushed: 0 })
  assert.equal(game.veggie!.prize.name, veggieForGarden(9).name)
  assert.equal(game.veggie!.prize.name, 'CUCUMBER')
}

// --- moods and the escape -------------------------------------------------------------------------------
{
  assert.equal(moodFor(false, 400), 'calm')
  assert.equal(moodFor(false, 100), 'restless')
  assert.equal(moodFor(true, 400), 'ghost')
  const game = garden([SKY, BUDDY, '...#g#..........'])
  const grub = game.enemies[0]!
  grub.ghostTimer = 400
  assert.equal(game.grumpMood(grub), 'calm')
  grub.ghostTimer = 120
  assert.equal(game.grumpMood(grub), 'restless', 'it flushes before it ghosts')
  idle(game, 160)
  assert.equal(game.grumpMood(grub), 'ghost')
  game.render(stub)

  // The last grump left runs for the surface once the garden is old enough.
  const run = garden([SKY, BUDDY, '...#g#..........'])
  run.plan.escapeAfter = 300
  run.levelTick = 300
  idle(run, 2)
  assert.ok(run.enemies[0]!.fleeing && run.enemies[0]!.ghost, 'the last runs')
  run.render(stub)
}

// --- bubble tools out of cracked stones -------------------------------------------------------------
{
  assert.deepEqual(Object.keys(TOOLS).sort(), [...TOOL_KINDS].sort())
  assert.equal(popAt('grub', false), 4)
  assert.equal(popAt('grub', true), 3, 'Quick Puff: three puffs pop')
  assert.equal(popAt('mimic', true), 2)

  // Push into a cracked stone to crack it open.
  const crack = garden(
    [SKY, BUDDY, '.....C#.........', '..............g.'],
    ['long'],
  )
  place(crack, 6, 3)
  for (let i = 0; i < CRACK_PUSH - 1; i++) crack.update(frame({ left: true }))
  assert.ok(crack.stones.has(cellKey(5, 3)), 'still cracking')
  crack.update(frame({ left: true }))
  assert.ok(!crack.stones.has(cellKey(5, 3)), 'cracked open')
  assert.ok(crack.tools.long > TOOLS.long.ticks - 5, 'Long Puff, for a while')
  crack.render(stub)
  idle(crack, TOOLS.long.ticks)
  assert.equal(crack.tools.long, 0, 'and then it runs out')

  // A plain stone can't be dug or pushed.
  const plain = garden([SKY, BUDDY, '.....S#.........', '..............g.'])
  place(plain, 6, 3)
  for (let i = 0; i < 80; i++) plain.update(frame({ left: true }))
  assert.equal(plain.player.tx, 6, 'stones stop Buddy')
  assert.ok(plain.stones.has(cellKey(5, 3)))

  // Long Puff reaches five tiles.
  const reach = (tools: Partial<Record<ToolKind, number>>) => {
    const game = garden([SKY, BUDDY, '................', '..#######g......'])
    place(game, 2, 4, 1)
    game.enemies[0]!.m = { tx: 7, ty: 4, nx: 7, ny: 4, p: 0 }
    Object.assign(game.tools, tools)
    game.update(frame({}, { a: true }))
    return game.enemies[0]!.inflate
  }
  assert.equal(reach({}), 0, 'five tiles is out of reach')
  assert.equal(reach({ long: 100 }), 1, 'Long Puff reaches it')

  // Wide Puff swells two grumps in a line.
  const wide = (on: boolean) => {
    const game = garden([SKY, BUDDY, '................', '..#gg...........'])
    place(game, 2, 4, 1)
    if (on) game.tools.wide = 100
    game.update(frame({}, { a: true }))
    return game.enemies.map((e) => e.inflate)
  }
  assert.deepEqual(wide(false), [1, 0])
  assert.deepEqual(wide(true), [1, 1])

  // Quick Puff pops in three.
  const pumped = (quick: boolean) => {
    const game = garden([SKY, BUDDY, '................', '..#g..........g.'])
    place(game, 2, 4, 1)
    if (quick) game.tools.quick = 500
    for (let i = 0; i < 30; i++) game.update(frame({ a: true }, { a: i === 0 }))
    return game.enemies.length
  }
  assert.equal(pumped(true), 1, 'popped on the third puff')
  assert.equal(pumped(false), 2, 'without it, still pumping')

  // Drill Boots dig at walking speed.
  const dig = (drill: boolean) => {
    const game = garden([SKY, BUDDY, '..............g.'])
    if (drill) game.tools.drill = 300
    place(game, 3, 6)
    let ticks = 0
    while (game.player.tx === 3 && ticks < 60) {
      game.update(frame({ right: true }))
      ticks++
    }
    return ticks
  }
  assert.ok(dig(true) < dig(false), 'drill boots dig faster')

  // The headlamp widens Buddy's light for the rest of the garden.
  const lamp = play(1)
  assert.equal(lamp.lightRadius(), LAMP_RADIUS)
  lamp.tools.headlamp = -1
  assert.equal(lamp.lightRadius(), HEADLAMP_RADIUS)
  lamp.render(stub)
  lamp.startLevel(2)
  assert.equal(lamp.lightRadius(), LAMP_RADIUS, 'one garden')

  // The sprinkler washes the tunnel ahead clear: grumps go home.
  const wash = garden([SKY, BUDDY, '................', '..######g#......'])
  const grub = wash.enemies[0]!
  place(wash, 2, 4, 1)
  wash.tools.sprinkler = TOOLS.sprinkler.charges
  grub.m = { tx: 4, ty: 4, nx: 4, ny: 4, p: 0 }
  wash.update(frame({}, { b: true }))
  assert.equal(wash.tools.sprinkler, TOOLS.sprinkler.charges - 1)
  assert.deepEqual([grub.m.tx, grub.m.ty], [8, 4], 'washed back to its burrow')
  wash.render(stub)
}

// --- the pill bug curls up when faced ---------------------------------------------------------------
{
  const game = garden([SKY, BUDDY, '................', '..####p#........'])
  const bug = game.enemies[0]!
  place(game, 3, 4, 1)
  bug.m = { tx: 5, ty: 4, nx: 5, ny: 4, p: 0 }
  game.update(frame())
  assert.ok(bug.curl > 0, 'faced from two tiles: it curls up')
  const lives = game.lives
  game.update(frame({}, { a: true }))
  assert.equal(bug.inflate, 0, 'the bubbles bounce off the ball')
  game.render(stub)
  idle(game, CURL_TICKS)
  assert.equal(bug.curl, 0, 'it uncurls')
  assert.ok(bug.curlRest > CURL_REST - 5, 'and rests')
  assert.equal(game.lives, lives, 'a curled ball never bites')
  bug.m = { tx: 5, ty: 4, nx: 5, ny: 4, p: 0 }
  for (let i = 0; i < 4; i++) {
    game.update(frame({}, { a: true }))
    idle(game, 12)
  }
  assert.ok(!game.enemies.includes(bug), 'puffed while it rests')
}

// --- the mole cricket digs its own tunnels --------------------------------------------------------
{
  const game = garden([
    SKY,
    BUDDY,
    '................',
    '................',
    '...#c#..........',
  ])
  const cricket = game.enemies[0]!
  const total = () => game.dug.reduce((s, v) => s + v, 0)
  const dugBefore = total()
  const score = game.score
  cricket.ghostTimer = 1
  idle(game, 2)
  assert.equal(cricket.digLeft, CRICKET_DIG, 'restless: it means to dig')
  assert.equal(game.grumpMood(cricket), 'restless')
  assert.equal(cricket.spray, SPRAY_TICKS, 'the dirt-spray tell first')
  game.render(stub)
  idle(game, 300)
  assert.ok(total() >= dugBefore + 3, 'it dug new tunnel toward Buddy')
  assert.equal(game.score, score, 'only Buddy’s digging scores')
}

// --- the mimic turnip -----------------------------------------------------------------------------
{
  const game = garden([
    SKY,
    BUDDY,
    '................',
    '..#m#...........',
    '..............g.',
  ])
  const mimic = game.enemies.find((e) => e.kind === 'mimic')!
  idle(game, 200)
  assert.deepEqual(
    [mimic.m.tx, mimic.m.ty],
    [3, 4],
    'it sits still, pretending',
  )
  assert.equal(game.grumpMood(mimic), 'calm')
  link(game, 1, 4, 2, 4)
  place(game, 1, 4, 1)
  game.update(frame())
  assert.ok(mimic.awake > 0, 'Buddy came close: it wakes')
  assert.equal(game.grumpMood(mimic), 'restless')
  game.render(stub)
  mimic.m = { tx: 3, ty: 4, nx: 3, ny: 4, p: 0 }
  const before = game.score
  game.update(frame({}, { a: true }))
  idle(game, 12)
  game.update(frame({}, { a: true }))
  assert.ok(!game.enemies.includes(mimic), 'two puffs')
  assert.ok(
    game.turnips.some((t) => t.tx === 3 && t.ty === 4),
    'a turnip again',
  )
  assert.ok(!game.isDug(3, 4), 'set back in the soil')
  assert.ok(game.score - before >= MIMIC_POINTS)
}

// --- determinism and the pilot probe -------------------------------------------------------------
{
  const run = (seed: number, ticks: number) => {
    const game = play(seed)
    for (let t = 0; t < ticks && !game.over; t++) game.update(game.demoInput())
    return [game.score, game.level, game.lives, game.player.tx, game.player.ty]
  }
  assert.deepEqual(run(9, 6000), run(9, 6000), 'same seed, same game')

  let cleared = 0
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const game = play(seed)
    let t = 0
    for (; t < 60 * 60 * 20 && !game.over; t++) {
      game.update(game.demoInput())
      if (t % 300 === 0) game.render(stub)
    }
    assert.ok(game.over, `seed ${seed}: the run ends`)
    assert.ok(game.score > 0 && game.score < MAX_SCORE)
    if (game.level > 1) cleared++
  }
  assert.ok(cleared >= 3, `the pilot still clears gardens (${cleared})`)

  const attract = play(7, true)
  for (let t = 0; t < 60 * 60 * 4; t++) {
    attract.update(emptyInput())
    if (t % 600 === 0) attract.render(stub)
  }
  assert.equal(attract.score, 0, 'the attract demo scores 0')
}

console.log('verifyCabinetBurrowBuddySoil: ok')
