// /utils/scripts/verifyCabinetCableCrawlerCpuCore.test.ts
//
// Cable Crawler depth pass, slice 4 part 1 (conductor kr-arcade/t-067): the CPU Core. Its five
// mazes and the Sleepy Kernel's room are sound and the component has no Screensaver; the clock
// swings the board's pace; an interrupt outlines a cell, drops a wall there for a moment, and
// lifts it; a rival cable races the plug for sparks, its body is a wall, a boxed-in rival is
// stunned and a surge through its body reboots it; the Sleepy Kernel only takes a surge once
// all four pin banks are lit; beating it boots the Mainframe (the ending) and then the campaign
// goes round again; and a pilot probe runs through the whole component.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerCpuCore.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  BANK_FADE,
  KERNEL_REST,
  SLEEPY_KERNEL_HP,
  banksLit,
  bossCells,
  bossPhase,
  hitBoss,
  newBoss,
  updateBoss,
  type Boss,
  type BossWorld,
} from '../arcade/cableCrawler/bosses'
import {
  BYTE_MAZES,
  COMPONENTS,
  CPU_CORE,
  componentSteps,
  boardsBefore,
} from '../arcade/cableCrawler/components'
import {
  RIVAL_MAX,
  newGlitch,
  type Glitch,
} from '../arcade/cableCrawler/glitches'
import {
  cellKey,
  cellX,
  cellY,
  mazeProblems,
  parseMaze,
  type Maze,
  type Way,
} from '../arcade/cableCrawler/mazes'
import { parseLoop } from '../arcade/sound'
import { emptyInput, type InputFrame } from '../arcade/types'

type Game = {
  score: number
  lives: number
  over: boolean
  maze: Maze
  walls: boolean[]
  body: number[]
  dir: Way
  want: Way
  grow: number
  sparks: Set<number>
  sockets: Array<{ k: number; charge: number }>
  glitches: Glitch[]
  boss: Boss | null
  battery: number
  dead: number
  clear: number
  cardTicks: number
  tick: number
  stepIndex: number
  compIndex: number
  ending: number
  intrs: Array<{ k: number; tell: number; hold: number }>
  intrTimer: number
  banner: { text: string; sub: string } | null
  update(input: InputFrame): void
  advance(): void
  beginComponent(i: number): void
  clockPace(): number
  clockOn(): boolean
  updateInterrupts(): void
  interruptCount(): number
  interruptTarget(): number
  updateRival(g: Glitch): void
  plugCan(d: Way): boolean
  surge(s: { k: number; charge: number }): void
  bossDefeated(): void
  demoInput(): InputFrame
  render(g: CanvasRenderingContext2D): void
}

const quiet = { play: () => {} }
/** A drawing context that accepts every call: enough to prove a frame paints without throwing. */
const fakeCtx = () =>
  new Proxy(
    {},
    {
      get: (_t, k) =>
        k === 'createRadialGradient' || k === 'createLinearGradient'
          ? () => ({ addColorStop: () => {} })
          : k === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D
const RIGHT = { dx: 1, dy: 0 }
const at = (x: number, y: number) => cellKey(x, y)

function play(seed = 3): Game {
  const game = cableCrawler.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as unknown as Game
  game.cardTicks = 0
  return game
}

/** Jump to the CPU Core's board: 0-2 mazes, 3-4 mazes, 5 the Sleepy Kernel. */
function goTo(game: Game, stepIndex: number) {
  game.beginComponent(5)
  while (game.stepIndex < stepIndex) game.advance()
  game.cardTicks = 0
}

// --- the component and its mazes -----------------------------------------------------------------
{
  assert.equal(COMPONENTS[5], CPU_CORE)
  assert.equal(CPU_CORE.number, 6)
  assert.equal(CPU_CORE.mazes.length, 5)
  assert.equal(BYTE_MAZES.length, 30)
  assert.equal(CPU_CORE.screensaver, null, 'the CPU Core has no Screensaver')
  assert.deepEqual(
    componentSteps(CPU_CORE).map((s) => s.kind),
    ['maze', 'maze', 'maze', 'maze', 'maze', 'boss', 'workbench'],
  )
  assert.equal(boardsBefore(5), 5 * 7, 'five components of seven boards')
  assert.equal(
    boardsBefore(6),
    5 * 7 + 6,
    'then the six boards of the CPU Core',
  )
  for (const layout of CPU_CORE.mazes)
    assert.deepEqual(mazeProblems(layout), [], `${layout.id} is sound`)
  assert.deepEqual(mazeProblems(CPU_CORE.boss.layout, 'boss'), [])
  const all = CPU_CORE.mazes.map(parseMaze)
  assert.ok(
    all.slice(1).every((m) => m.clock),
    'a swinging clock from maze 2',
  )
  assert.ok(
    all.slice(1).every((m) => m.rivals.length >= 1 || m.interrupts >= 1),
    'a rival or an interrupt from maze 2',
  )
  assert.ok(
    all.some((m) => m.rivals.length >= 2),
    'two rivals by the last maze',
  )
  const interrupts = all.map((m) => m.interrupts)
  assert.deepEqual(
    interrupts,
    [...interrupts].sort((a, b) => a - b),
    'interrupts only increase',
  )
  for (const m of all) assert.ok(m.sparks.length >= 40, `${m.id} has sparks`)
  const room = parseMaze(CPU_CORE.boss.layout)
  assert.equal(room.banks.length, 4, 'four pin banks')
  assert.ok(room.banks.every((b) => b.length === 3))
  assert.ok(room.boss !== null)
  assert.ok(
    parseLoop(CPU_CORE.music).length > 0 || CPU_CORE.music.tracks.length > 0,
  )
}

// --- the clock -----------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 0)
  assert.equal(game.clockOn(), false, 'maze 1 has no clock')
  assert.equal(game.clockPace(), 1)
  goTo(game, 1)
  assert.equal(game.clockOn(), true, 'maze 2 has one')
  const paces = new Set<number>()
  for (let t = 0; t < 60 * 9; t++) {
    game.tick = t
    paces.add(game.clockPace())
  }
  assert.equal(paces.size, 3, 'slow, steady and fast')
  assert.ok(Math.min(...paces) < 1 && Math.max(...paces) > 1)
}

// --- interrupts ----------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 2)
  assert.equal(game.interruptCount(), 1)
  // Lay the plug in a long corridor, heading along it.
  const corridor = game.maze.floor.find(
    (k) =>
      [1, 2, 3, 4, 5, 6].every(
        (i) => !game.walls[at(cellX(k) + i, cellY(k))],
      ) && !game.maze.sockets.includes(k),
  )
  assert.ok(corridor !== undefined, 'a corridor to test in')
  const y = cellY(corridor!)
  const x = cellX(corridor!)
  game.body = [at(x, y)]
  game.dir = RIGHT
  game.want = RIGHT
  const target = game.interruptTarget()
  assert.equal(target, at(x + 6, y), 'it lands six cells ahead')
  game.intrs = [{ k: target, tell: 3, hold: 0 }]
  assert.equal(game.walls[target], false)
  for (let i = 0; i < 2; i++) game.updateInterrupts()
  assert.equal(game.walls[target], false, 'only an outline at first')
  game.updateInterrupts()
  assert.equal(game.walls[target], true, 'then the wall drops')
  for (let i = 0; i < 49; i++) game.updateInterrupts()
  assert.equal(game.walls[target], true, 'and stands a moment')
  game.updateInterrupts()
  assert.equal(game.walls[target], false, 'then lifts')
  assert.equal(game.intrs.length, 0)
  // A wall never drops on the cable.
  game.intrs = [{ k: target, tell: 1, hold: 0 }]
  game.body = [at(x + 6, y), at(x + 5, y)]
  game.updateInterrupts()
  assert.equal(game.walls[target], false, 'the interrupt is missed')
  // A pilot-held plug is never unplugged by a wall in a corridor: the hold is short.
  const p = play(4)
  goTo(p, 2)
  p.lives = 5
  for (let t = 0; t < 60 * 90 && !p.over; t++) {
    p.lives = Math.max(p.lives, 2)
    p.update(p.demoInput())
  }
  assert.ok(!p.over)
}

// --- rival cables --------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 1)
  const rival = game.glitches.find((g) => g.kind === 'rival')!
  assert.ok(rival, 'maze 2 has a rival cable')
  // It races for the nearest spark and slurps it.
  game.glitches = [rival]
  rival.timer = 1
  const before = game.sparks.size
  let moved = false
  for (let t = 0; t < 60 * 40; t++) {
    game.updateRival(rival)
    if (game.sparks.size < before) {
      moved = true
      break
    }
  }
  assert.ok(moved, 'the rival slurps a spark')
  assert.ok(rival.tail.length >= 1 && rival.tail.length <= RIVAL_MAX)
  assert.equal(rival.tell, 1, 'one spark eaten')
  // On an open board: the rival's body is a wall to the plug, and a surge beside it reboots it.
  game.walls = game.maze.walls.map((_, k) => {
    const x = cellX(k)
    const y = cellY(k)
    return x === 0 || y === 0 || x === 22 || y === 18
  })
  rival.down = 0
  rival.booting = 0
  rival.k = at(6, 6)
  rival.tail = [at(7, 6), at(8, 6)]
  game.glitches = [rival]
  game.body = [at(9, 6)]
  game.dir = { dx: -1, dy: 0 }
  assert.equal(game.plugCan(game.dir), false, "the rival's body is a wall")
  game.dir = RIGHT
  assert.equal(game.plugCan(game.dir), true, 'but the way back is free')
  game.body = [at(8, 5), at(7, 5), at(6, 5), at(5, 5)]
  game.sockets = [{ k: at(8, 5), charge: 0 }]
  game.surge(game.sockets[0]!)
  assert.ok(rival.down > 0, 'a surge along its body reboots it')
  assert.equal(rival.tail.length, 0, 'and its body is gone')
  // Boxed in, a rival is stunned.
  const boxed = newGlitch('rival', at(1, 1))
  game.glitches = [boxed]
  game.walls = game.walls.map(() => true)
  boxed.timer = 1
  for (let i = 0; i < 6; i++) {
    boxed.timer = 1
    game.updateRival(boxed)
  }
  assert.ok(boxed.down > 0, 'a boxed-in rival is stunned')
}

// --- the Sleepy Kernel ---------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 5)
  assert.equal(game.boss?.kind, 'sleepy-kernel')
  const room = game.maze
  assert.equal(game.boss!.banks.length, 4)
  assert.equal(game.boss!.hp, SLEEPY_KERNEL_HP)
  assert.equal(bossCells(game.boss!).length, 9, 'a 3 x 3 chip')
  assert.equal(game.clockOn(), false, 'phase 1 has no clock')
  assert.equal(game.interruptCount(), 0)
  game.boss!.hp = 3
  assert.equal(bossPhase(game.boss!), 2)
  assert.equal(game.clockOn(), true, 'phase 2 swings the clock')
  assert.equal(game.interruptCount(), 0)
  game.boss!.hp = 1
  assert.equal(bossPhase(game.boss!), 3)
  assert.equal(
    game.interruptCount(),
    room.interrupts,
    'phase 3 raises interrupts',
  )

  const world = (onCable: ReadonlySet<number>): BossWorld => ({
    cable: (k) => (onCable.has(k) ? 'body' : null),
    bite: () => {},
    shuffleSockets: () => {},
    wall: () => false,
    busy: () => false,
    setWalls: () => {},
    drip: () => {},
    rng: mulberry32(1),
  })
  const boss = newBoss('sleepy-kernel', [], room.boss!, room.walls, room.banks)
  assert.equal(banksLit(boss), false)
  // A surge with the banks dark does nothing.
  const everything = new Set(room.floor)
  assert.equal(hitBoss(boss, everything, []), false, 'dark banks: no hit')
  // Cable on three banks lights three.
  const three = new Set(room.banks.slice(0, 3).flat())
  updateBoss(boss, world(three))
  assert.deepEqual(boss.lit, [true, true, true, false])
  assert.equal(hitBoss(boss, everything, []), false, 'three banks: no hit')
  // The fourth completes it, wherever the cable is.
  updateBoss(boss, world(new Set(room.banks.flat())))
  assert.equal(banksLit(boss), true)
  assert.equal(hitBoss(boss, new Set(), []), true, 'all four lit: a hit')
  assert.equal(boss.hp, SLEEPY_KERNEL_HP - 1)
  assert.equal(banksLit(boss), false, 'the banks go out')
  assert.equal(boss.rest, KERNEL_REST)
  // It dozes: the banks will not relight at once.
  boss.invuln = 0
  updateBoss(boss, world(new Set(room.banks.flat())))
  assert.equal(banksLit(boss), false, 'the Kernel dozes after a surge')
  for (let t = 0; t < KERNEL_REST; t++)
    updateBoss(boss, world(new Set(room.banks.flat())))
  assert.equal(banksLit(boss), true, 'then they relight')
  // A lit bank fades after the cable leaves it.
  for (let t = 0; t < BANK_FADE + 2; t++) updateBoss(boss, world(new Set()))
  assert.equal(boss.lit.some(Boolean), false, 'the banks fade')

  // In the game: the surge only counts with all four lit; the last hit boots the Mainframe.
  const g = play()
  goTo(g, 5)
  g.lives = 3
  const sockets = g.sockets
  g.body = [sockets[0]!.k]
  g.boss!.hp = 1
  g.boss!.lit = [true, true, true, true]
  g.boss!.fade = [999, 999, 999, 999]
  g.boss!.invuln = 0
  g.surge(sockets[0]!)
  assert.equal(g.boss!.hp, 0, 'the last surge beats the Kernel')
  assert.ok(g.ending > 0, 'and the Mainframe boots')
  assert.equal(g.clear, g.ending)
  const frame = emptyInput()
  const fromComp = g.compIndex
  // The ending plays out, then the campaign goes round to lap 2.
  for (let t = 0; t < 60 * 11 && g.compIndex === fromComp; t++) {
    g.update(frame)
    g.render(fakeCtx())
  }
  assert.equal(
    g.compIndex,
    fromComp,
    'the ending stays on the same component...',
  )
  // ...until the Workbench after the boss.
  assert.equal(componentSteps(CPU_CORE)[g.stepIndex]!.kind, 'workbench')
  g.render(fakeCtx())
}

// --- every board paints --------------------------------------------------------------------------
{
  const game = play()
  game.beginComponent(5)
  for (let s = 0; s < 6; s++) {
    for (let t = 0; t < 400; t++) {
      game.update(game.demoInput())
      if (t % 40 === 0) game.render(fakeCtx())
    }
    game.lives = 3
    game.advance()
    game.cardTicks = 0
  }
}

// --- pilot probes ------------------------------------------------------------------------------
{
  const run = (seed: number, ticks: number, keep: boolean, from: number) => {
    const game = play(seed)
    game.beginComponent(from)
    game.cardTicks = 0
    let t = 0
    for (; t < ticks && !game.over; t++) {
      if (keep) game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
    }
    return { game, t }
  }
  // Held up on cables, the pilot plays through the whole CPU Core.
  for (const seed of [1, 3]) {
    const { game } = run(seed, 60 * 60 * 20, true, 5)
    assert.ok(
      game.compIndex >= 6,
      `seed ${seed}: through the CPU Core (component ${game.compIndex})`,
    )
    assert.ok(game.score < 60_000_000)
  }
  // Without them, runs end.
  for (const seed of [5, 8]) {
    const { game } = run(seed, 60 * 60 * 30, false, 5)
    assert.ok(game.over, `seed ${seed}: the run ends`)
  }
  // The same seed plays the same game.
  const a = run(7, 60 * 60 * 3, true, 5).game
  const b = run(7, 60 * 60 * 3, true, 5).game
  assert.equal(a.score, b.score)
  assert.deepEqual(a.body, b.body)
}

console.log('verifyCabinetCableCrawlerCpuCore: ok')
