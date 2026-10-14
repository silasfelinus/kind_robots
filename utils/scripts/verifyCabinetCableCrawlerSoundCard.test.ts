// /utils/scripts/verifyCabinetCableCrawlerSoundCard.test.ts
//
// Cable Crawler depth pass, slice 3 part 1 (conductor kr-arcade/t-066): the Sound Card. Its five
// mazes, the Equaliser and the Subwoofer's room are sound; beat gates swap on the beat and never
// shut on the cable; speaker cones shove a plug beside them; an echo retraces the plug's path
// four seconds behind it; noise gnats drain the battery and reboot on a surge; the Equaliser's
// bars rise and fall; the Subwoofer takes surges only between beats; and a pilot probe runs
// through the whole component.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerSoundCard.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  BEAT_EVERY,
  BEAT_PULSE,
  SUBWOOFER_HP,
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
  SOUND_CARD,
} from '../arcade/cableCrawler/components'
import {
  ECHO_DELAY,
  GNAT_DRAIN,
  newGlitch,
  type Glitch,
} from '../arcade/cableCrawler/glitches'
import {
  ROWS,
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
  level: number
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
  saver: {
    kind: string
    ticks: number
    caught: number
    total: number
    bars: Array<{ x: number; phase: number; on: boolean; wait: number }>
  } | null
  battery: number
  batteryMax: number
  dead: number
  clear: number
  cardTicks: number
  stepIndex: number
  compIndex: number
  gateFlip: boolean
  gateTimer: number
  coneTimer: number
  trail: number[]
  stepTimer: number
  rng: () => number
  update(input: InputFrame): void
  crawl(): void
  advance(): void
  beginComponent(i: number): void
  drain(): number
  flipGates(): boolean
  gateShut(k: number): boolean
  fireCones(): void
  bossBeat(shockwave: boolean): void
  barCell(bar: { x: number; phase: number }): number
  surge(s: { k: number; charge: number }): void
  demoInput(): InputFrame
}

const quiet = { play: () => {} }
const RIGHT = { dx: 1, dy: 0 }
const DOWN = { dx: 0, dy: 1 }
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

/** Jump to the Sound Card's board: 0-2 mazes, 3 the Screensaver, 4-5 mazes, 6 the boss. */
function goTo(game: Game, stepIndex: number) {
  game.beginComponent(3)
  while (game.stepIndex < stepIndex) game.advance()
  game.cardTicks = 0
}

function lay(game: Game, cells: Array<[number, number]>, dir: Way) {
  game.body = cells.map(([x, y]) => at(x, y))
  game.dir = dir
  game.want = dir
  game.grow = 0
  for (const k of game.body) game.sparks.delete(k)
}

// --- the mazes -----------------------------------------------------------------------------
{
  assert.equal(COMPONENTS[3], SOUND_CARD)
  assert.equal(SOUND_CARD.number, 4)
  assert.equal(SOUND_CARD.mazes.length, 5)
  assert.equal(BYTE_MAZES.length, 20)
  for (const layout of SOUND_CARD.mazes)
    assert.deepEqual(mazeProblems(layout), [], `${layout.id} is sound`)
  assert.deepEqual(mazeProblems(SOUND_CARD.boss.layout, 'boss'), [])
  assert.deepEqual(mazeProblems(SOUND_CARD.screensaver.layout, 'open'), [])
  const all = SOUND_CARD.mazes.map(parseMaze)
  assert.ok(
    all.every((m) => m.gates.length >= 2),
    'beat gates in every maze',
  )
  assert.ok(
    all.some((m) => m.cones.length),
    'cones',
  )
  assert.ok(
    all.some((m) => m.echoes.length),
    'echoes',
  )
  assert.ok(
    all.some((m) => m.gnats.length),
    'gnats',
  )
  assert.ok(
    all.every(
      (m) => m.shutGates.length > 0 && m.shutGates.length < m.gates.length,
    ),
    'one set of gates always open, one shut',
  )
  // The maze checker spots a gate that is not a doorway.
  assert.ok(
    mazeProblems({
      ...SOUND_CARD.mazes[0]!,
      rows: SOUND_CARD.mazes[0]!.rows.map((r, y) =>
        y === 3 ? r.replace(/[. ]/, 'g') : r,
      ),
    }).some((p) => p.includes('beat gate')),
  )
  const parsed = parseLoop(SOUND_CARD.music)
  assert.equal(parsed.length, 64)
  assert.ok(parsed.notes.length > 30)
}

// --- beat gates ------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 0)
  const gates = game.maze.gates
  assert.ok(gates.length >= 2)
  const before = gates.map((k) => game.walls[k])
  assert.deepEqual(
    before,
    gates.map((k) => game.maze.shutGates.includes(k)),
    "'g' starts shut, 'G' starts open",
  )
  assert.ok(before.includes(true) && before.includes(false))
  assert.equal(game.flipGates(), true)
  assert.deepEqual(
    gates.map((k) => game.walls[k]),
    before.map((w) => !w),
    'the beat swaps every gate',
  )
  // The beat clock swaps them on its own.
  game.gateTimer = 1
  const walls = game.walls
  game.update(emptyInput())
  assert.notEqual(game.walls, walls)
  // A gate never shuts on the cable.
  const g = gates.find((k) => !game.gateShut(k))!
  lay(game, [[cellX(g), cellY(g)]], RIGHT)
  assert.equal(game.flipGates(), false, 'the cable holds the gate open')
  assert.equal(game.walls[g], false)
  game.body = [game.maze.start]
  assert.equal(game.flipGates(), true)
  assert.equal(game.walls[g], true)
}

// --- speaker cones ---------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 1)
  assert.ok(game.maze.cones.length >= 1)
  const cone = game.maze.cones[0]!
  const cx = cellX(cone)
  const cy = cellY(cone)
  const vertical = !game.walls[at(cx, cy - 1)] && !game.walls[at(cx, cy + 1)]
  const along: Way = vertical ? DOWN : RIGHT
  // A plug on the cone is shoved on the way it faces.
  game.body = [cone, at(cx - along.dx, cy - along.dy)]
  game.dir = along
  game.want = along
  game.fireCones()
  assert.equal(game.body[0], at(cx + along.dx, cy + along.dy), 'shoved on')
  // A plug beside a cone is shoved away from it, where the way beyond is open.
  let shoved = 0
  for (const stepIndex of [1, 2, 4, 5]) {
    goTo(game, stepIndex)
    for (const sign of [1, -1])
      for (const k of game.maze.cones) {
        const x = cellX(k)
        const y = cellY(k)
        const v = !game.walls[at(x, y - 1)] && !game.walls[at(x, y + 1)]
        const d: Way = v ? { dx: 0, dy: sign } : { dx: sign, dy: 0 }
        const head = at(x + d.dx, y + d.dy)
        const beyond = at(x + d.dx * 2, y + d.dy * 2)
        if (game.walls[beyond] || game.walls[head]) continue
        game.body = [head, k]
        game.dir = d
        game.want = d
        game.fireCones()
        assert.equal(game.body[0], beyond, 'shoved a cell away from the cone')
        // Never into its own cable.
        game.body = [head, beyond]
        game.dir = { dx: -d.dx, dy: -d.dy }
        game.fireCones()
        assert.equal(game.body[0], head, 'a shove stops at the cable')
        shoved++
      }
  }
  assert.ok(shoved > 0, 'a plug beside a cone is shoved')
  // Far from every cone nothing moves.
  game.body = [game.maze.start]
  game.fireCones()
  assert.equal(game.body[0], game.maze.start)
}

// --- the echo --------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 3)
  game.advance()
  game.cardTicks = 0
  assert.equal(game.maze.id, 'sc-4')
  const echo = game.glitches.find((gl) => gl.kind === 'echo')!
  assert.ok(echo, 'this maze has an echo')
  // Out of sight until there is four seconds of path.
  for (let t = 0; t < ECHO_DELAY - 5; t++) game.update(emptyInput())
  assert.ok(echo.booting > 0, 'not out yet')
  game.battery = game.batteryMax
  for (let t = 0; t < 40; t++) game.update(emptyInput())
  if (game.dead === 0) {
    assert.equal(echo.booting, 0)
    assert.equal(
      echo.k,
      game.trail[0],
      'the echo walks the plug path of four seconds ago',
    )
  }
  // The echo meets the plug: unplugged.
  const lives = game.lives
  game.dead = 0
  game.trail = Array(ECHO_DELAY + 1).fill(game.body[0]!)
  echo.booting = 0
  echo.down = 0
  game.update(emptyInput())
  assert.equal(game.lives, lives - 1, 'meeting your echo unplugs you')
  // A surge reboots an echo lying on the cable.
  const g2 = play()
  goTo(g2, 3)
  g2.advance()
  g2.cardTicks = 0
  const e2 = g2.glitches.find((gl) => gl.kind === 'echo')!
  e2.booting = 0
  const cell = g2.body[0]!
  lay(
    g2,
    [
      [cellX(cell), cellY(cell)],
      [cellX(cell), cellY(cell) + 1],
    ],
    DOWN,
  )
  e2.k = g2.body[1]!
  g2.sockets[0]!.charge = 0
  g2.surge(g2.sockets[0]!)
  assert.ok(e2.down > 0, 'the surge reboots an echo riding the cable')
  assert.ok(g2.score > 0)
}

// --- noise gnats -----------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 2)
  const gnats = game.glitches.find((gl) => gl.kind === 'gnats')!
  assert.ok(gnats, 'FEEDBACK LOOP has gnats')
  gnats.booting = 0
  const head = game.body[0]!
  gnats.k = head
  const base = game.drain()
  assert.ok(base >= 2, 'gnats on the plug drain the battery twice as fast')
  gnats.k = at(1, 1)
  assert.equal(game.drain(), base - 1)
  assert.ok(Math.abs(cellX(head) - 1) + Math.abs(cellY(head) - 1) > GNAT_DRAIN)
  // They fly over the cable and are rebooted by a surge that finds them there.
  gnats.k = head
  game.sockets[0]!.charge = 0
  game.surge(game.sockets[0]!)
  assert.ok(gnats.down > 0)
  // They close in on a plug they can see.
  const g2 = play()
  goTo(g2, 2)
  const n2 = g2.glitches.find((gl) => gl.kind === 'gnats')!
  n2.booting = 0
  let near = Infinity
  const d = (a: number, b: number) =>
    Math.abs(cellX(a) - cellX(b)) + Math.abs(cellY(a) - cellY(b))
  const start = g2.body[0]!
  n2.k = g2.maze.floor.filter((k) => d(k, start) === 4)[0] ?? n2.k
  const first = d(n2.k, start)
  for (let t = 0; t < 40; t++) {
    g2.battery = g2.batteryMax
    g2.stepTimer = -999
    g2.update(emptyInput())
    near = Math.min(near, d(n2.k, g2.body[0]!))
  }
  assert.ok(
    near <= Math.max(2, first - 1),
    `gnats close in (${first} -> ${near})`,
  )
}

// --- the Equaliser ---------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 3)
  const s = game.saver!
  assert.equal(s.kind, 'equaliser')
  assert.equal(s.total, s.bars.length)
  const cells = new Set<number>()
  for (let t = 0; t < 400; t++) {
    game.update(emptyInput())
    for (const bar of s.bars) {
      const k = game.barCell(bar)
      assert.ok(cellY(k) >= 2 && cellY(k) <= ROWS - 4)
      cells.add(cellY(k))
    }
    if (game.clear > 0 || game.dead > 0) break
  }
  assert.ok(cells.size > 6, 'the bars rise and fall')
  // Crawl onto a spark: caught, and it comes back after a wait.
  const g2 = play()
  goTo(g2, 3)
  const bar = g2.saver!.bars[0]!
  lay(
    g2,
    [
      [cellX(g2.barCell(bar)), cellY(g2.barCell(bar)) + 1],
      [cellX(g2.barCell(bar)), cellY(g2.barCell(bar)) + 2],
    ],
    { dx: 0, dy: -1 },
  )
  const caught = g2.saver!.caught
  g2.body.unshift(g2.barCell(bar))
  g2.body.pop()
  g2.update(emptyInput())
  assert.equal(g2.saver!.caught, caught + 1)
  assert.equal(bar.on, false)
}

// --- the Subwoofer ---------------------------------------------------------------------------
{
  const boss = newBoss('subwoofer', [], at(11, 9))
  assert.equal(boss.hp, SUBWOOFER_HP)
  assert.equal(bossCells(boss).length, 9, 'a 3 x 3 cabinet')
  assert.equal(bossPhase(boss), 1)
  boss.hp = 3
  assert.equal(bossPhase(boss), 2)
  boss.hp = 1
  assert.equal(bossPhase(boss), 3)
  assert.equal(
    BEAT_EVERY[2],
    BEAT_EVERY[1]! / 2,
    'the tempo doubles in the last phase',
  )
  boss.hp = SUBWOOFER_HP

  const beats: boolean[] = []
  const world: BossWorld = {
    cable: () => null,
    bite: () => {},
    shuffleSockets: () => {},
    wall: () => false,
    busy: () => false,
    setWalls: () => {},
    drip: () => {},
    beat: (shock) => beats.push(shock),
    rng: mulberry32(1),
  }
  const swept = new Set(bossCells(boss))
  boss.timer = 2
  updateBoss(boss, world)
  assert.equal(beats.length, 0)
  assert.ok(boss.tell > 0, 'it glows before a beat')
  updateBoss(boss, world)
  assert.deepEqual(beats, [false], 'phase 1 beats do not shock')
  assert.ok(boss.charging > 0)
  assert.equal(hitBoss(boss, swept), false, 'a surge mid-beat is shrugged off')
  for (let t = 0; t < BEAT_PULSE; t++) updateBoss(boss, world)
  assert.equal(boss.charging, 0)
  assert.equal(hitBoss(boss, swept), true, 'a surge between beats lands')
  assert.equal(boss.hp, SUBWOOFER_HP - 1)
  boss.invuln = 0
  boss.hp = 3
  boss.charging = 0
  boss.timer = 1
  updateBoss(boss, world)
  assert.deepEqual(beats, [false, true], 'phase 2 beats send a shockwave')

  // On the board: a beat swaps the gates, and the room can be cleared.
  const game = play()
  goTo(game, 6)
  assert.equal(game.boss?.kind, 'subwoofer')
  const gate = game.maze.gates.find((k) => game.maze.shutGates.includes(k))!
  assert.equal(game.walls[gate], true)
  game.bossBeat(false)
  assert.equal(game.walls[gate], false, 'the Subwoofer beat swaps the gates')
  // The shockwave shoves a plug near the cabinet away.
  const c = game.boss!.center
  lay(
    game,
    [
      [cellX(c) + 3, cellY(c)],
      [cellX(c) + 4, cellY(c)],
    ],
    { dx: -1, dy: 0 },
  )
  game.dir = { dx: -1, dy: 0 }
  const head = game.body[0]
  game.bossBeat(true)
  assert.notEqual(game.body[0], head, 'shoved by the shockwave')
  assert.ok(cellX(game.body[0]!) > cellX(c) + 3, 'away from the speaker')
  // Meeting the cabinet bonks.
  const lives = game.lives
  lay(
    game,
    [
      [cellX(c) + 3, cellY(c)],
      [cellX(c) + 4, cellY(c)],
    ],
    { dx: -1, dy: 0 },
  )
  game.battery = game.batteryMax
  game.crawl()
  game.crawl()
  assert.equal(game.lives, lives - 1, 'crawling into the speaker unplugs you')
}

// --- pilot probes ----------------------------------------------------------------------------
{
  const run = (seed: number, ticks: number, keep: boolean, from: number) => {
    const game = play(seed)
    goTo(game, 0)
    game.beginComponent(from)
    game.cardTicks = 0
    let t = 0
    for (; t < ticks && !game.over; t++) {
      if (keep) game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
    }
    return { game, t }
  }
  // Held up on cables, the pilot plays through the whole Sound Card.
  for (const seed of [1, 3]) {
    const { game } = run(seed, 60 * 60 * 20, true, 3)
    assert.ok(
      game.compIndex >= 4,
      `seed ${seed}: through the Sound Card (component ${game.compIndex})`,
    )
    assert.ok(game.score < 60_000_000)
  }
  // Without them, runs end.
  for (const seed of [2, 5]) {
    const { game, t } = run(seed, 60 * 60 * 30, false, 3)
    assert.ok(game.over || t === 60 * 60 * 30)
    assert.ok(game.over, `seed ${seed}: the run ends`)
  }
  // The same seed plays the same game.
  const a = run(7, 60 * 60 * 3, true, 3).game
  const b = run(7, 60 * 60 * 3, true, 3).game
  assert.equal(a.score, b.score)
  assert.equal(a.level, b.level)
  assert.deepEqual(a.body, b.body)
}

// Keep unused-import lint quiet for the helper type.
void newGlitch

console.log('verifyCabinetCableCrawlerSoundCard: ok')
