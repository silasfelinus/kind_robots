// /utils/scripts/verifyCabinetCableCrawlerTanglePlay.test.ts
//
// Cable Crawler depth pass, slice 5 part 2b (conductor kr-arcade/t-068): Tangle in play. Two to
// four cables through the cabinet's `players` frames on four authored arenas; Team Tangle shares a
// battery, a score and a pool of spare cables, and a surge runs down every cable touching the
// surger (a Link Surge); Tangle Race is four arenas, most sparks takes each and most arenas takes
// the match. Bodies are walls, plug against plug is a boop and never a knockout. Also the pilot
// probe: Tangle runs end, they are deterministic, and the attract demo still scores 0.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerTanglePlay.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  COLS,
  cellKey,
  cellX,
  cellY,
  mazeProblems,
  parseMaze,
} from '../arcade/cableCrawler/mazes'
import { SOCKET_RECHARGE } from '../arcade/cableCrawler/surge'
import { BUMP_PAUSE, TANGLE_MAX } from '../arcade/cableCrawler/tangle'
import { ARENA_SEATS, TANGLE_ARENAS } from '../arcade/cableCrawler/tangleArenas'
import {
  RACE_ROUNDS,
  REBOOT_TICKS,
  TANGLE_CARD_TICKS,
  TangleMatch,
  raceChampions,
  tanglePilot,
  teamPace,
  teamSpares,
} from '../arcade/cableCrawler/tangleMatch'
import { emptyInput, type InputFrame } from '../arcade/types'

const meta = ARCADE_GAMES.find((g) => g.slug === 'cable-crawler')!
const quiet = { play: () => {} }
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

const idle = (n: number) => Array.from({ length: n }, () => emptyInput())

/** Every seat steered by the test pilot. */
function piloted(m: TangleMatch): InputFrame[] {
  return m.cables.map((c) => {
    const f = emptyInput()
    const d = tanglePilot(m, c.seat)
    if (d?.dy === -1) f.held.up = true
    else if (d?.dy === 1) f.held.down = true
    else if (d?.dx === -1) f.held.left = true
    else if (d?.dx === 1) f.held.right = true
    return f
  })
}

/** Past the arena's title card. */
function play(m: TangleMatch) {
  while (m.phase === 'card') m.update(idle(m.seats))
}

// --- the arenas -------------------------------------------------------------------------------

{
  assert.equal(TANGLE_ARENAS.length, RACE_ROUNDS)
  assert.equal(ARENA_SEATS.length, TANGLE_MAX)
  const ids = new Set<string>()
  for (const a of TANGLE_ARENAS) {
    const name = a.layout.name
    assert.deepEqual(mazeProblems(a.layout), [], `${name} is a fair maze`)
    ids.add(a.layout.id)
    const maze = parseMaze(a.layout)
    assert.equal(maze.sockets.length, 4, `${name}: a socket per quarter`)
    assert.ok(maze.byte !== null, `${name} hides a golden byte`)
    assert.equal(a.seats[0], maze.start, `${name}: player 1 starts on the P`)
    assert.equal(new Set(a.seats).size, TANGLE_MAX, `${name}: four seats`)
    for (const k of a.seats) {
      assert.ok(!maze.walls[k], `${name}: a seat on the floor`)
      assert.ok(!maze.sparks.includes(k), `${name}: no spark under a seat`)
    }
    // Mirrored both ways: every seat faces the same maze.
    const flipX = (k: number) => cellKey(COLS - 1 - cellX(k), cellY(k))
    const flipY = (k: number) => cellKey(cellX(k), 18 - cellY(k))
    const sparks = new Set(maze.sparks)
    for (const k of maze.sparks) {
      assert.ok(sparks.has(flipX(k)), `${name}: sparks mirror left-right`)
      assert.ok(sparks.has(flipY(k)), `${name}: sparks mirror top-bottom`)
    }
  }
  assert.equal(ids.size, TANGLE_ARENAS.length, 'every arena has its own id')
}

// --- Team Tangle: seats, shared battery and score, link surge, the spare pool -----------------

{
  for (let seats = 2; seats <= 4; seats++) {
    const m = new TangleMatch('team', seats)
    assert.equal(m.cables.length, seats)
    assert.equal(m.spares, teamSpares(seats))
    assert.equal(
      m.lives,
      seats + teamSpares(seats),
      'the pool plus the cables in',
    )
    assert.equal(m.phase, 'card')
    const heads = m.cables.map((c) => c.body[0])
    assert.deepEqual(
      heads,
      ARENA_SEATS.slice(0, seats),
      'each plug on its seat',
    )
  }
  assert.equal(new TangleMatch('team', 9).seats, TANGLE_MAX, 'four at most')

  // The title card skips on any player's A, but not straight away.
  const m = new TangleMatch('team', 2)
  const a = idle(2)
  a[1]!.pressed.a = true
  m.update(a)
  assert.equal(m.phase, 'card', 'too early to skip')
  for (let t = 0; t < 50; t++) m.update(idle(2))
  m.update(a)
  assert.equal(m.phase, 'play', 'player 2 skipped the card')

  // One battery for the team: it drains once a tick, however many cables crawl.
  const before = m.battery
  m.update(idle(2))
  assert.equal(before - m.battery, 1, 'one shared battery')

  // Sparks from either cable land on one score.
  m.sparks.add(cellKey(5, 5))
  const c1 = m.cables[1]!
  c1.body = [cellKey(4, 5)]
  c1.dir = { dx: 1, dy: 0 }
  c1.want = { dx: 1, dy: 0 }
  c1.stepTimer = 99
  const scoreBefore = m.score
  m.update(idle(2))
  assert.equal(c1.body[0], cellKey(5, 5))
  assert.ok(m.score > scoreBefore, "player 2's spark is the team's")
  assert.equal(m.score, m.cables[0]!.points + c1.points)
}

{
  // Link Surge: plug into a socket with a friend's cable touching yours, and it surges too.
  const m = new TangleMatch('team', 2)
  play(m)
  const socket = m.sockets[0]!
  const [a, b] = m.cables as [(typeof m.cables)[0], (typeof m.cables)[0]]
  a.body = [socket.k]
  b.body = [socket.k + COLS * 2]
  assert.equal(m.linked(0).length, 1, 'apart, a surge is your own')
  b.body = [socket.k + 1]
  assert.equal(m.linked(0).length, 2, 'touching, the surge links')
  const race = new TangleMatch('race', 2)
  race.cables[0]!.body = [socket.k]
  race.cables[1]!.body = [socket.k + 1]
  assert.equal(race.linked(0).length, 1, 'never in a Race')

  // A real link surge on an open floor: the far spark is in reach of the friend's cable only.
  const m2 = new TangleMatch('team', 2)
  play(m2)
  const s = m2.sockets[0]!
  const [p, q] = m2.cables as [(typeof m2.cables)[0], (typeof m2.cables)[0]]
  m2.walls = m2.walls.map(() => false)
  m2.sparks.clear()
  const far = cellKey(cellX(s.k) + 3, cellY(s.k) - 1)
  const guard = cellKey(cellX(s.k) + 12, cellY(s.k) + 8)
  m2.sparks.add(far)
  m2.sparks.add(guard)
  p.body = [s.k - 1]
  p.grow = 0
  p.dir = { dx: 1, dy: 0 }
  p.want = { dx: 1, dy: 0 }
  p.stepTimer = 99
  q.body = [s.k + 1, s.k + 2]
  q.dir = { dx: -1, dy: 0 }
  q.stepTimer = -99
  m2.update(idle(2))
  const surge = m2.events.find((e) => e.kind === 'surge')
  assert.ok(surge && surge.kind === 'surge', 'plugging in surges')
  assert.equal(surge.linked, 2, 'a Link Surge down both cables')
  assert.ok(!m2.sparks.has(far), "the friend's cable swept the far spark")
  assert.equal(s.charge, SOCKET_RECHARGE, 'and the socket recharges')
}

{
  // Bodies are walls; nose to nose is a boop; nobody is knocked out.
  const m = new TangleMatch('race', 2)
  play(m)
  const [a, b] = m.cables as [(typeof m.cables)[0], (typeof m.cables)[0]]
  // Patch Bay's row 9 is open from (7,9) to (15,9).
  const row = (x: number) => cellKey(x, 9)
  a.body = [row(9), row(8), row(7)]
  a.dir = { dx: 1, dy: 0 }
  a.want = { dx: 1, dy: 0 }
  b.body = [row(13), row(14), row(15)]
  b.dir = { dx: -1, dy: 0 }
  b.want = { dx: -1, dy: 0 }
  a.grow = 0
  b.grow = 0
  a.stepTimer = 99
  b.stepTimer = 99
  m.update(idle(2))
  assert.equal(a.body[0], row(10))
  assert.equal(b.body[0], row(12))
  a.stepTimer = 99
  b.stepTimer = 99
  m.update(idle(2))
  assert.ok(
    m.events.some((e) => e.kind === 'bump'),
    'boop!',
  )
  assert.equal(a.body[0], row(10), 'both plugs stay put')
  assert.equal(b.body[0], row(12))
  assert.ok(a.pause >= BUMP_PAUSE && b.pause >= BUMP_PAUSE, 'and pause')
  assert.notEqual(a.pause, b.pause, 'staggered, so they never meet in lockstep')
  assert.ok(a.down === 0 && b.down === 0, 'a playful pause, never a knockout')

  // A plug against another cable's body waits, the way it waits at a wall.
  const m2 = new TangleMatch('team', 2)
  play(m2)
  const [p, q] = m2.cables as [(typeof m2.cables)[0], (typeof m2.cables)[0]]
  p.body = [row(9), row(8)]
  p.dir = { dx: 1, dy: 0 }
  p.want = { dx: 1, dy: 0 }
  q.body = [cellKey(10, 7), row(10), cellKey(10, 11)]
  q.stepTimer = -999
  p.stepTimer = 99
  const spares = m2.spares
  m2.update(idle(2))
  assert.equal(p.body[0], row(9), 'a cable is a wall')
  assert.ok(p.down === 0 && m2.spares === spares, 'and costs nothing')
}

{
  // A bite in a Race reboots the cable at its seat; in Team it costs a spare from the pool, and
  // with the pool dry the cable sits out until the next arena.
  // A cable coiled so that turning right bites its own length.
  const coil = (m: TangleMatch, seat: number) => {
    const c = m.cables[seat]!
    const k = cellKey(9, 9)
    c.body = [k, k + COLS, k + COLS + 1, k + 1, k + 2]
    c.dir = { dx: 0, dy: -1 }
    c.want = { dx: 1, dy: 0 }
    c.grow = 0
    c.stepTimer = 99
    c.down = 0
  }
  const race = new TangleMatch('race', 2)
  play(race)
  const r = race.cables[1]!
  coil(race, 1)
  race.update(idle(2))
  assert.ok(
    race.events.some((e) => e.kind === 'bite'),
    'bit its own cable',
  )
  assert.equal(r.down, REBOOT_TICKS)
  assert.equal(race.lives, 2, 'nobody leaves a Race')
  for (let t = 0; t < REBOOT_TICKS; t++) race.update(idle(2))
  assert.equal(r.body[0], ARENA_SEATS[1], 'rebooted at its seat')

  const team = new TangleMatch('team', 2)
  play(team)
  team.spares = 1
  const bite = (seat: number) => {
    coil(team, seat)
    team.update(idle(2))
  }
  bite(0)
  assert.equal(team.spares, 0, 'a spare from the pool')
  assert.ok(!team.cables[0]!.out)
  for (let t = 0; t <= REBOOT_TICKS; t++) team.update(idle(2))
  bite(1)
  assert.ok(team.cables[1]!.out, 'the pool is dry: out until the next arena')
  assert.ok(!team.over, 'a friend is still crawling')
  assert.equal(team.lives, 1)
  bite(0)
  assert.ok(team.over, 'every cable out: the Tangle ends')
}

{
  // The Race: most sparks takes the arena; most arenas (then sparks) takes the match.
  const m = new TangleMatch('race', 3)
  play(m)
  m.cables[0]!.sparks = 4
  m.cables[1]!.sparks = 9
  m.cables[2]!.sparks = 9
  // Player 1 slurps the last spark of the arena (Patch Bay's row 9 runs from x 7 to 15).
  m.sparks.clear()
  m.sparks.add(cellKey(8, 9))
  const p1 = m.cables[0]!
  p1.body = [cellKey(7, 9)]
  p1.dir = { dx: 1, dy: 0 }
  p1.want = { dx: 1, dy: 0 }
  p1.stepTimer = 99
  m.update(idle(3))
  m.update(idle(3))
  assert.equal(m.phase, 'clear')
  assert.deepEqual(
    m.cables.map((c) => c.wins),
    [0, 1, 1],
    'a tie shares the arena',
  )
  assert.match(m.banner!.sub, /^TIE {2}P2 P3$/)
  assert.deepEqual(
    raceChampions([
      { wins: 2, total: 9 },
      { wins: 2, total: 12 },
    ]),
    [1],
  )
  assert.deepEqual(
    raceChampions([
      { wins: 1, total: 5 },
      { wins: 1, total: 5 },
    ]),
    [0, 1],
  )
}

{
  // Team laps quicken, and the clock runs out a Race arena without costing anyone.
  assert.ok(teamPace(0) > teamPace(2) && teamPace(9) === 3)
  const m = new TangleMatch('race', 2)
  play(m)
  m.battery = 1
  m.update(idle(2))
  assert.equal(m.phase, 'clear', 'time! the arena ends')
  assert.equal(m.banner!.text, 'TIME!')
}

// --- pilot probe: Tangle runs end, deterministically, under the plausible score --------------

function run(kind: 'team' | 'race', seats: number) {
  const m = new TangleMatch(kind, seats)
  let t = 0
  for (; t < 60 * 60 * 20 && !m.over; t++) m.update(piloted(m))
  return { m, t }
}

for (const kind of ['team', 'race'] as const)
  for (let seats = 2; seats <= 4; seats++) {
    const { m, t } = run(kind, seats)
    assert.ok(m.over, `${kind} for ${seats} ends (${t} ticks)`)
    assert.ok(m.score > 0 && m.score <= meta.maxPlausibleScore)
    if (kind === 'race') {
      assert.equal(m.arenas, RACE_ROUNDS, 'a Race is four arenas')
      assert.ok(m.cables.some((c) => c.wins > 0))
      assert.match(m.banner!.text, /WINS!|FRIENDLY TIE/)
    }
    const again = run(kind, seats)
    assert.equal(again.t, t, 'deterministic')
    assert.equal(again.m.score, m.score)
  }

// --- the cabinet: seats, the Tangle menu, players frames, render, attract ---------------------

{
  assert.equal(meta.maxPlayers, 4, 'the registry seats four')
  assert.ok(meta.howTo.some((l) => l.includes('FOUR')))

  type Game = {
    score: number
    lives: number
    level: number
    over: boolean
    menu: { stage: string; cursor: number } | null
    tangle: TangleMatch | null
    music: unknown
    save: unknown
    update(input: InputFrame, players?: InputFrame[]): void
    render(g: CanvasRenderingContext2D): void
  }
  const open = (players: number, selectScreen: boolean, demo = false) =>
    cableCrawler.create({
      rng: mulberry32(9),
      sound: quiet,
      demo,
      hiScore: 0,
      players,
      selectScreen,
    }) as unknown as Game
  const g = fakeCtx()

  // Seated with a select screen: the Tangle list, Team first; down + A picks the Race.
  const picked = open(3, true)
  assert.equal(picked.menu?.stage, 'tangle')
  assert.equal(picked.tangle, null)
  picked.render(g)
  const press = (button: 'down' | 'a') => {
    const f = emptyInput()
    f.pressed[button] = true
    picked.update(f, [f, emptyInput(), emptyInput()])
  }
  press('down')
  press('a')
  assert.equal(picked.menu, null)
  const chosen = picked.tangle as TangleMatch | null
  assert.equal(chosen?.kind, 'race')
  assert.equal(chosen?.seats, 3)

  // Without one (headless, replays), two seated start a Team Tangle at once.
  const game = open(2, false)
  assert.equal(game.tangle?.kind, 'team')
  assert.ok(game.lives >= 2, 'two seated, two in play')
  assert.equal(game.level, 1)
  let t = 0
  for (; t < 60 * 60 * 20 && !game.over; t++) {
    const m = game.tangle!
    const frames = piloted(m)
    game.update(frames[0]!, frames)
    if (t % 30 === 0) game.render(g)
    if (t === TANGLE_CARD_TICKS + 30)
      assert.ok(game.music, 'the arena plays its music')
  }
  assert.ok(game.over, 'the cabinet game ends')
  assert.equal(game.score, game.tangle!.score)
  assert.ok(game.score > 0 && game.score <= meta.maxPlausibleScore)
  game.render(g)

  // A lone player keeps the Odyssey's mode select; a missing players array is player 1 alone.
  const solo = open(1, true)
  assert.equal(solo.menu?.stage, 'mode')
  assert.equal(solo.tangle, null)
  const lone = open(2, false)
  for (let i = 0; i < 400; i++) lone.update(emptyInput())
  assert.ok(
    lone.tangle!.cables[1]!.body.length > 0,
    'an unsteered seat still crawls',
  )

  // The attract demo never seats players, and still scores nothing.
  const demo = open(4, false, true)
  assert.equal(demo.tangle, null, 'the demo plays the Odyssey alone')
  for (let i = 0; i < 60 * 60 * 3; i++) {
    demo.update(emptyInput())
    if (i % 120 === 0) demo.render(g)
  }
  assert.equal(demo.score, 0, 'attract scores 0')
  assert.equal(demo.save, null, 'and keeps no save')
}

{
  // A saved Odyssey is left alone by a Tangle.
  const stored = cableCrawler.create({
    rng: mulberry32(3),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players: 2,
    resume: {
      v: 1,
      comp: 2,
      score: 1234,
      lives: 2,
      continued: false,
      bytes: ['ps-1'],
      reached: 3,
    },
  }) as unknown as {
    save: { comp: number; score: number } | null
    tangle: unknown
  }
  assert.ok(stored.tangle, 'two seated play a Tangle')
  assert.equal(stored.save?.comp, 2, 'the Odyssey save keeps its place')
  assert.equal(stored.save?.score, 1234)
}

console.log('verifyCabinetCableCrawlerTanglePlay: ok')
