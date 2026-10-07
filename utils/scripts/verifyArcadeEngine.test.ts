// /utils/scripts/verifyArcadeEngine.test.ts
//
// Kind Robots Arcade (conductor kr-arcade): the pure engine pieces -- clock,
// difficulty curves, input folding, the cabinet flow reducer, initials,
// score plausibility, the bitmap font -- plus a headless run of every
// registered game (demo pilot and a scripted player) against a stub canvas.
//
//   npx tsx utils/scripts/verifyArcadeEngine.test.ts

import assert from 'node:assert/strict'
import { advanceClock, MAX_TICKS_PER_FRAME, TICK_MS } from '../arcade/loop'
import { everyNthLevel, levelCurve, mulberry32 } from '../arcade/curve'
import {
  assignPads,
  combineFrame,
  keepPads,
  P1_KEYS,
  P2_KEYS,
  readGamepad,
} from '../arcade/input'
import {
  arcadeReducer,
  initialArcadeState,
  PHASE_MS,
  qualifiesForBoard,
  type ArcadeState,
} from '../arcade/machine'
import { isAllowedInitials, normalizeInitials } from '../arcade/initials'
import {
  ARCADE_GAMES,
  COMING_SOON,
  findArcadeGame,
  isPlausibleScore,
  loadArcadeGame,
  PREVIEW_GAMES,
} from '../arcade/games'
import { glyphFor, lineStep, MIN_LINE_STEP, measureText } from '../arcade/font'
import { BATTERY_MAZE } from '../arcade/games/batteryMaze'
import {
  create as createPinball,
  DMD_BAND,
  PINBALL_HEIGHT,
  PINBALL_RAMPS,
  pathPoint,
} from '../arcade/games/kindPinball'
import { Dmd, DMD_COLS, DMD_ROWS, dmdTextWidth } from '../arcade/pinball/dmd'
import {
  emptyInput,
  isWebGLInstance,
  type ArcadeGameInstance,
  type ArcadePlayableInstance,
  type InputFrame,
} from '../arcade/types'
import RAPIER from '@dimforge/rapier3d-compat'
import {
  livePhysicsWorlds,
  PinballPhysics,
} from '../arcade/pinball/physics/world'
import {
  liveRenderResources,
  type RendererLike,
} from '../arcade/pinball/render/scene'
import { initialRules, stepRules } from '../arcade/pinball/rules/engine'
import { PinballRuntime } from '../arcade/pinball/runtime'
import { AMI_VILLAGE_GREYBOX } from '../arcade/pinball/tables/amiVillage/table'
import {
  enqueuePending,
  formatChampion,
  initialsFromUsername,
  MAX_PENDING_SCORES,
  PENDING_FLUSH_BATCH,
  sanitizePending,
  shouldRetryScore,
  type PendingArcadeScore,
} from '../arcade/leaderboard'

// --- clock -------------------------------------------------------------------
{
  const step = advanceClock(0, TICK_MS * 2.5)
  assert.equal(step.ticks, 2)
  assert.ok(Math.abs(step.accumulator - TICK_MS * 0.5) < 1e-9)
  const asleep = advanceClock(0, 10_000)
  assert.equal(
    asleep.ticks,
    MAX_TICKS_PER_FRAME,
    'a sleeping tab never fast-forwards',
  )
  assert.equal(asleep.accumulator, 0)
  assert.equal(advanceClock(0, -50).ticks, 0, 'clock never runs backwards')
}

// --- curves and rng ----------------------------------------------------------
{
  assert.equal(levelCurve(1, { start: 4, step: 1, limit: 11 }), 4)
  assert.equal(levelCurve(5, { start: 4, step: 1, limit: 11 }), 8)
  assert.equal(levelCurve(50, { start: 4, step: 1, limit: 11 }), 11)
  assert.equal(levelCurve(50, { start: 90, step: -6, limit: 40 }), 40)
  assert.equal(
    levelCurve(0, { start: 3, step: 2 }),
    3,
    'levels below 1 clamp to 1',
  )
  assert.ok(everyNthLevel(6, 3) && !everyNthLevel(5, 3) && !everyNthLevel(0, 3))
  const a = mulberry32(42)
  const b = mulberry32(42)
  const seq = Array.from({ length: 5 }, () => a())
  assert.deepEqual(
    seq,
    Array.from({ length: 5 }, () => b()),
    'seeded rng is reproducible',
  )
  assert.ok(seq.every((n) => n >= 0 && n < 1))
}

// --- input -------------------------------------------------------------------
{
  const first = combineFrame(emptyInput().held, [{ a: true }, { left: false }])
  assert.equal(first.held.a, true)
  assert.equal(first.pressed.a, true, 'first frame down is a press')
  const second = combineFrame(first.held, [{ a: true }])
  assert.equal(second.held.a, true)
  assert.equal(second.pressed.a, false, 'holding is not a new press')
  const merged = combineFrame(emptyInput().held, [
    { up: true },
    { right: true },
  ])
  assert.ok(merged.held.up && merged.held.right, 'sources merge')
  const pad = readGamepad({
    buttons: [
      { pressed: true },
      { pressed: false },
    ] as unknown as GamepadButton[],
    axes: [-0.9, 0.1],
  })
  assert.equal(pad.a, true)
  assert.equal(pad.left, true)
  assert.equal(pad.up, false, 'inside the deadzone is not a press')
  // Seating: one player reads every pad; two take one each, and a lone pad
  // goes to player 2 (player 1 has the left of the keyboard).
  assert.deepEqual(assignPads([0, 1], 1), [null])
  assert.deepEqual(assignPads([0, 1], 2), [0, 1])
  assert.deepEqual(assignPads([2], 2), [-1, 2])
  assert.deepEqual(assignPads([], 2), [-1, -1])
  // Three or four: players with no keys (3 and 4) get pads first.
  assert.deepEqual(assignPads([0, 1, 2, 3], 4), [0, 1, 2, 3])
  assert.deepEqual(assignPads([5], 3), [-1, -1, 5])
  assert.deepEqual(assignPads([0, 1], 4), [-1, -1, 0, 1])
  assert.deepEqual(assignPads([0, 1, 2], 4), [-1, 0, 1, 2])
  // Mid-game a pad stays with its player: a new one fills a padless seat
  // (keyless seats first), and a dropped one leaves only its own seat bare.
  assert.deepEqual(keepPads([-1, 0], [0, 1], 2), [1, 0])
  assert.deepEqual(keepPads([0, 1, 2], [0, 2], 3), [0, -1, 2])
  assert.deepEqual(keepPads([0, -1, -1, 1], [0, 1, 4], 4), [0, -1, 4, 1])
  assert.deepEqual(keepPads([null], [0], 1), [null])
  // The two-player key maps never share a key.
  for (const code of Object.keys(P1_KEYS))
    assert.ok(!(code in P2_KEYS), `${code} is bound for both players`)
}

// --- cabinet flow ------------------------------------------------------------
{
  const run = (state: ArcadeState, ms: number) =>
    arcadeReducer(state, { type: 'tick', ms })
  let s = initialArcadeState()
  assert.equal(s.phase, 'title')
  s = run(s, PHASE_MS.title!)
  assert.equal(s.phase, 'howto')
  s = run(s, PHASE_MS.howto!)
  assert.equal(s.phase, 'scores')
  s = run(s, PHASE_MS.scores!)
  assert.equal(s.phase, 'demo')
  s = arcadeReducer(s, { type: 'demoOver' })
  assert.equal(s.phase, 'title', 'a demo that ends early returns to the title')
  s = arcadeReducer(s, { type: 'start' })
  assert.equal(s.phase, 'playing')
  assert.equal(
    arcadeReducer(s, { type: 'start' }).phase,
    'playing',
    'start mid-game is ignored',
  )
  s = arcadeReducer(s, { type: 'pause' })
  assert.equal(s.phase, 'paused')
  s = arcadeReducer(s, { type: 'resume' })
  s = arcadeReducer(s, { type: 'gameOver' })
  assert.equal(s.phase, 'gameover')
  const toInitials = arcadeReducer(
    s,
    { type: 'tick', ms: PHASE_MS.gameover! },
    true,
  )
  assert.equal(toInitials.phase, 'initials')
  const toScores = arcadeReducer(
    s,
    { type: 'tick', ms: PHASE_MS.gameover! },
    false,
  )
  assert.equal(toScores.phase, 'scores', 'a score off the board skips initials')
  assert.equal(
    arcadeReducer(toInitials, { type: 'initialsDone' }).phase,
    'scores',
  )
  assert.equal(
    arcadeReducer({ phase: 'howto', elapsed: 0 }, { type: 'skip' }).phase,
    'scores',
  )

  const board = Array.from({ length: 10 }, (_, i) => ({
    score: 1000 - i * 100,
  }))
  assert.equal(qualifiesForBoard(150, board), true)
  assert.equal(
    qualifiesForBoard(100, board),
    false,
    'ties with tenth place do not bump it',
  )
  assert.equal(
    qualifiesForBoard(5, board.slice(0, 3)),
    true,
    'a short board takes anyone',
  )
  assert.equal(qualifiesForBoard(0, []), false, 'zero never makes the board')
}

// --- initials and plausibility ------------------------------------------------
{
  assert.equal(normalizeInitials(' a-b!c9 '), 'ABC')
  assert.equal(isAllowedInitials('AMI'), true)
  assert.equal(
    isAllowedInitials('ami'),
    true,
    'lowercase is fine; it is uppercased',
  )
  assert.equal(isAllowedInitials('AB'), false)
  assert.equal(isAllowedInitials('ABCD'), false)
  assert.equal(isAllowedInitials('A-B'), false)
  assert.equal(isAllowedInitials('KKK'), false, 'the family filter applies')
  assert.equal(
    isAllowedInitials('GAY'),
    true,
    'identity words are not filtered',
  )
  assert.equal(isAllowedInitials(123), false)

  const blaster = findArcadeGame('butterfly-blaster')
  assert.ok(blaster)
  assert.equal(isPlausibleScore('butterfly-blaster', 1200), true)
  assert.equal(isPlausibleScore('butterfly-blaster', 0), false)
  assert.equal(isPlausibleScore('butterfly-blaster', 12.5), false)
  assert.equal(
    isPlausibleScore('butterfly-blaster', blaster.maxPlausibleScore + 1),
    false,
  )
  assert.equal(isPlausibleScore('no-such-game', 10), false)
  assert.equal(isPlausibleScore('butterfly-blaster', '100'), false)
}

// --- registry and font ---------------------------------------------------------
{
  const slugs = new Set<string>()
  for (const game of [...ARCADE_GAMES, ...COMING_SOON]) {
    assert.match(game.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/)
    assert.ok(!slugs.has(game.slug), `duplicate slug ${game.slug}`)
    slugs.add(game.slug)
  }
  for (const game of ARCADE_GAMES) {
    assert.ok(game.width > 0 && game.height > 0)
    assert.ok(game.titleArt.startsWith('/images/arcade/'))
    for (const line of [game.title, ...game.howTo]) {
      for (const char of line.toUpperCase()) {
        assert.ok(
          char === '?' || glyphFor(char) !== glyphFor('?'),
          `${game.slug}: no glyph for "${char}" in "${line}"`,
        )
      }
      assert.ok(
        measureText(line, 2) <= game.width,
        `${game.slug}: how-to line "${line}" is too wide at scale 2`,
      )
    }
  }
  // The how-to card stacks its lines from y=80; they must all fit on screen
  // with a readable gap (Repair Rampage's sixth line once ran off the bottom).
  for (const game of ARCADE_GAMES) {
    const step = lineStep(game.howTo.length, game.height, 80)
    assert.ok(
      step >= MIN_LINE_STEP,
      `${game.slug}: ${game.howTo.length} how-to lines do not fit ${game.height} tall`,
    )
    assert.ok(80 + (game.howTo.length - 1) * step + 14 <= game.height)
  }
  assert.equal(lineStep(6, 240, 80), 28)
  assert.equal(lineStep(8, 416, 80), 30)
  assert.equal(measureText('ABC', 2), (3 * 6 - 1) * 2)
  assert.equal(measureText('', 3), 0)
}

// --- Battery Maze layout --------------------------------------------------------
{
  const width = BATTERY_MAZE[0]!.length
  for (const row of BATTERY_MAZE) {
    assert.equal(row.length, width, 'maze rows are all the same width')
    assert.equal(
      row,
      [...row].reverse().join(''),
      'maze is left/right symmetric',
    )
  }
  const open = (x: number, y: number) => {
    const cell = BATTERY_MAZE[y]?.[(x + width) % width]
    return cell !== undefined && cell !== '#' && cell !== '-' && cell !== 'G'
  }
  const startY = BATTERY_MAZE.findIndex((row) => row.includes('P'))
  const start = `${BATTERY_MAZE[startY]!.indexOf('P')},${startY}`
  const seen = new Set([start])
  const queue = [start]
  while (queue.length) {
    const [x, y] = queue.pop()!.split(',').map(Number) as [number, number]
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = (x + dx + width) % width
      const key = `${nx},${y + dy}`
      if (!seen.has(key) && open(nx, y + dy)) {
        seen.add(key)
        queue.push(key)
      }
    }
  }
  BATTERY_MAZE.forEach((row, y) => {
    ;[...row].forEach((cell, x) => {
      if (cell === '.' || cell === 'o') {
        assert.ok(seen.has(`${x},${y}`), `spark at ${x},${y} is unreachable`)
      }
    })
  })
  for (const key of seen) {
    const [x, y] = key.split(',').map(Number) as [number, number]
    const exits = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].filter(([dx, dy]) => open(x + dx!, y + dy!)).length
    assert.ok(exits >= 2, `dead end at ${key}`)
  }
}

// --- headless game runs ----------------------------------------------------------

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (
          prop === 'createLinearGradient' ||
          prop === 'createRadialGradient'
        ) {
          return () => gradient
        }
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}

function scriptedInput(tick: number): InputFrame {
  const frame = emptyInput()
  frame.held.right = tick % 240 < 60
  frame.held.up = tick % 300 < 20
  frame.held.a = true
  frame.pressed.a = tick % 9 === 0
  return frame
}

// --- Kind Pinball: the display, ramps, gate, orbits, skill shot -------------
{
  const dmd = new Dmd()
  assert.equal(dmd.buf.length, DMD_COLS * DMD_ROWS)
  dmd.text('88', 0, 0, { scale: 2 })
  assert.ok(
    dmd.buf.some((v) => v === 3),
    'text lights dots',
  )
  dmd.dot(-1, 99, 3)
  dmd.clear()
  dmd.invert()
  assert.ok(
    dmd.buf.every((v) => v === 3),
    'invert swaps lit and unlit',
  )
  assert.equal(dmdTextWidth('ABC'), 17)
  assert.equal(dmdTextWidth('ABC', 2), 34)

  const pinball = ARCADE_GAMES.find((g) => g.slug === 'kind-pinball')!
  assert.equal(pinball.height, PINBALL_HEIGHT, 'meta height includes the DMD')
  assert.equal(PINBALL_HEIGHT - DMD_BAND, 416)

  // The table's internals, reached past `private` to set up exact shots.
  type ProbeBall = {
    x: number
    y: number
    vx: number
    vy: number
    fresh: boolean
    ramp: { key: string } | null
  }
  type PinballProbe = {
    score: number
    inPlay: boolean
    balls: ProbeBall[]
    rampsTowardMode: number
    lanes: boolean[]
    combo: number
    skillLane: number
    skillLive: boolean
    update(input: InputFrame): void
  }
  const play = () =>
    createPinball({
      rng: mulberry32(3),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
    }) as unknown as PinballProbe

  // Both ramps: a fast ball in the mouth rides the track and pays a ramp shot.
  for (const ramp of PINBALL_RAMPS) {
    assert.deepEqual(pathPoint(ramp.path, 0), ramp.path[0])
    assert.deepEqual(pathPoint(ramp.path, 1), ramp.path[ramp.path.length - 1])
    const game = play()
    game.inPlay = true
    const b = game.balls[0]!
    const m = ramp.mouth
    Object.assign(b, {
      x: (m.x0 + m.x1) / 2,
      y: (m.y0 + m.y1) / 2 + 4,
      vx: 0,
      vy: -9,
      fresh: false,
    })
    game.update(emptyInput())
    assert.equal(b.ramp?.key, ramp.key, `${ramp.key} ramp catches a fast ball`)
    for (let t = 0; t < 200 && b.ramp; t++) game.update(emptyInput())
    assert.equal(b.ramp, null, `${ramp.key} ramp lets the ball off`)
    assert.equal(game.rampsTowardMode, 1)
    assert.ok(game.score > 0)
    // It drops into the opposite inlane, heading for a flipper.
    assert.ok(
      ramp.key === 'left' ? b.x > 200 : b.x < 72,
      `${ramp.key} ramp crosses the table`,
    )
    let reached = false
    for (let t = 0; t < 120 && !reached; t++) {
      game.update(emptyInput())
      reached = b.y > 320 && b.y < 400
    }
    assert.ok(reached, `${ramp.key} ramp feeds a flipper`)
  }

  // The shooter-lane gate: a ball coming back down the arch stays out of the lane.
  {
    const game = play()
    game.inPlay = true
    const b = game.balls[0]!
    Object.assign(b, { x: 274, y: 126, vx: 0, vy: 2, fresh: false })
    for (let t = 0; t < 90; t++) game.update(emptyInput())
    assert.ok(b.x < 264, 'the gate turns the ball onto the table')
    assert.equal(game.inPlay, true)
  }

  // An orbit: across the top of the arch, fast, lights a top lane.
  {
    const game = play()
    game.inPlay = true
    const b = game.balls[0]!
    Object.assign(b, { x: 236, y: 60, vx: -10, vy: -4, fresh: false })
    for (let t = 0; t < 40; t++) game.update(emptyInput())
    assert.ok(game.lanes.some(Boolean), 'an orbit lights a top lane')
    const before = game.score
    const fresh = play()
    fresh.inPlay = true
    Object.assign(fresh.balls[0]!, { x: 236, y: 60, vx: -10, vy: -4 })
    for (let t = 0; t < 40; t++) fresh.update(emptyInput())
    assert.ok(before > 0)
    assert.equal(
      fresh.combo,
      0,
      'a plunged ball crossing the arch is not an orbit',
    )
  }

  // The skill shot: the plunged ball's first lane pays when it is the lit one.
  {
    const game = play()
    game.inPlay = true
    game.skillLane = 1
    const b = game.balls[0]!
    Object.assign(b, { x: 136, y: 52, vx: 0, vy: 1, fresh: true })
    game.update(emptyInput())
    assert.equal(game.skillLive, false)
    assert.ok(game.score >= 25_000, 'skill shot pays')
    const miss = play()
    miss.inPlay = true
    miss.skillLane = 0
    Object.assign(miss.balls[0]!, { x: 136, y: 52, vx: 0, vy: 1, fresh: true })
    miss.update(emptyInput())
    assert.ok(miss.score < 25_000, 'the wrong lane is no skill shot')
  }
}

// --- global leaderboard: pending uploads -------------------------------------

{
  // Unreachable or busy servers retry; outright rejections never do.
  for (const status of [undefined, 0, 408, 429, 500, 502, 503]) {
    assert.equal(shouldRetryScore(status), true, `retry on ${status}`)
  }
  for (const status of [400, 401, 403, 404, 422]) {
    assert.equal(shouldRetryScore(status), false, `no retry on ${status}`)
  }
  // The flush batch stays under the server's 6-per-minute rate limit.
  assert.ok(PENDING_FLUSH_BATCH < 6)

  const row = (id: number): PendingArcadeScore => ({
    id,
    game: 'butterfly-blaster',
    initials: 'ABC',
    score: 1000 - id,
    level: 1,
    createdAt: '2026-10-06T00:00:00.000Z',
  })
  let queue: PendingArcadeScore[] = []
  for (let i = 1; i <= MAX_PENDING_SCORES + 5; i++) {
    queue = enqueuePending(queue, row(-i))
  }
  assert.equal(queue.length, MAX_PENDING_SCORES, 'queue is capped')
  assert.equal(queue.at(-1)?.id, -(MAX_PENDING_SCORES + 5), 'newest kept')
  assert.equal(
    enqueuePending(queue, row(-6)).filter((r) => r.id === -6).length,
    1,
    'no duplicate ids',
  )
  // Storage can hold anything: only well-formed rows survive.
  assert.deepEqual(sanitizePending('nope'), [])
  assert.deepEqual(
    sanitizePending([row(-1), { id: 'x' }, null, { ...row(-2), score: '9' }]),
    [row(-1)],
  )
  assert.equal(formatChampion({ initials: 'KRB', score: 12345 }), 'KRB 12,345')
  assert.equal(formatChampion(null), '')
  assert.equal(
    formatChampion({ initials: 'KRB', score: 900, username: 'silas' }),
    'KRB (silas) 900',
  )
  // Signed-in players start from their username's letters.
  assert.equal(initialsFromUsername('silasfelinus'), 'SIL')
  assert.equal(initialsFromUsername('Al'), 'ALA')
  assert.equal(initialsFromUsername('z_9!x'), 'Z9X')
  assert.equal(initialsFromUsername('___'), null)
  assert.equal(initialsFromUsername(null), null)
}

/** Every listed cabinet is a classic Canvas 2D game. */
function canvasGame(
  instance: ArcadePlayableInstance,
  slug: string,
): ArcadeGameInstance {
  assert.ok(!isWebGLInstance(instance), `${slug}: listed games draw in 2D`)
  return instance as ArcadeGameInstance
}

async function runGames() {
  const g = stubContext()
  const quiet = { play: () => {} }
  for (const meta of ARCADE_GAMES) {
    const mod = await loadArcadeGame(meta.slug)

    const demo = canvasGame(
      mod.create({
        rng: mulberry32(7),
        sound: quiet,
        demo: true,
        hiScore: 0,
      }),
      meta.slug,
    )
    for (let t = 0; t < 60 * 60 && !demo.over; t++) {
      demo.update(emptyInput())
      if (t % 30 === 0) demo.render(g)
    }
    assert.equal(demo.score, 0, `${meta.slug}: the attract demo never scores`)

    const sounds: string[] = []
    const player = canvasGame(
      mod.create({
        rng: mulberry32(11),
        sound: { play: (name) => void sounds.push(name) },
        demo: false,
        hiScore: 500,
      }),
      meta.slug,
    )
    assert.equal(player.level, 1, `${meta.slug}: games start on level 1`)
    assert.ok(player.lives > 0)
    let t = 0
    for (; t < 60 * 60 * 20 && !player.over; t++) {
      player.update(scriptedInput(t))
      if (t % 60 === 0) player.render(g)
    }
    assert.ok(player.score > 0, `${meta.slug}: a busy player scores`)
    assert.ok(player.score <= meta.maxPlausibleScore)
    assert.ok(
      sounds.includes('shoot') || sounds.length > 0,
      `${meta.slug}: the game makes sounds`,
    )
    assert.ok(Number.isFinite(player.level) && player.level >= 1)
  }
}

/** Two seated: both games run, render, and keep their co-op rules. */
async function runCoopGames() {
  const g = stubContext()
  const quiet = { play: () => {} }
  const idle = () => emptyInput()
  const tap = (button: keyof InputFrame['held']) => {
    const frame = emptyInput()
    frame.held[button] = true
    frame.pressed[button] = true
    return frame
  }
  const hold = (button: keyof InputFrame['held']) => {
    const frame = emptyInput()
    frame.held[button] = true
    return frame
  }

  // Every co-op game survives a long two-player run, drawn in its two-player view.
  for (const meta of ARCADE_GAMES.filter((m) => (m.maxPlayers ?? 1) > 1)) {
    const mod = await loadArcadeGame(meta.slug)
    const game = canvasGame(
      mod.create({
        rng: mulberry32(23),
        sound: quiet,
        demo: false,
        hiScore: 0,
        players: 2,
      }),
      meta.slug,
    )
    assert.ok(game.lives >= 2, `${meta.slug}: two seated, two in play`)
    for (let t = 0; t < 60 * 60 * 5 && !game.over; t++) {
      const p1 = scriptedInput(t)
      const p2 = scriptedInput(t + 120)
      p1.held.a = t % 200 < 120
      p2.held.a = (t + 100) % 200 < 120
      p2.held.left = p2.held.right
      p2.held.right = false
      game.update(p1, [p1, p2])
      if (t % 45 === 0) game.render(g)
    }
    assert.ok(game.score <= meta.maxPlausibleScore)
  }

  // Every seat count a game allows starts with that many in play.
  for (const meta of ARCADE_GAMES.filter((m) => (m.maxPlayers ?? 1) > 1)) {
    const mod = await loadArcadeGame(meta.slug)
    for (let players = 2; players <= meta.maxPlayers!; players++) {
      const game = canvasGame(
        mod.create({
          rng: mulberry32(players),
          sound: quiet,
          demo: false,
          hiScore: 0,
          players,
        }),
        meta.slug,
      )
      const frames = () =>
        Array.from({ length: players }, (_, i) => scriptedInput(i * 50))
      for (let t = 0; t < 60 * 40 && !game.over; t++) {
        const all = frames()
        game.update(all[0]!, all)
        if (t % 120 === 0) game.render(g)
      }
      assert.ok(game.score <= meta.maxPlausibleScore)
    }
  }

  // Four in the Gauntlet: one of each bot.
  {
    const mod = await loadArcadeGame('kindness-gauntlet')
    const game = canvasGame(
      mod.create({
        rng: mulberry32(4),
        sound: quiet,
        demo: false,
        hiScore: 0,
        players: 4,
      }),
      'kindness-gauntlet',
    )
    const heroes = (game as unknown as { heroes: Array<{ cls: string }> })
      .heroes
    const all = [tap('a'), tap('a'), tap('a'), tap('a')]
    game.update(all[0]!, all)
    assert.equal(
      new Set(heroes.map((h) => h.cls)).size,
      4,
      'four bots, all different',
    )
    assert.equal(game.lives, 4)
  }

  // Three on the station: three Mops, two shared spares.
  {
    const mod = await loadArcadeGame('station-sweep')
    const game = canvasGame(
      mod.create({
        rng: mulberry32(6),
        sound: quiet,
        demo: false,
        hiScore: 0,
        players: 3,
      }),
      'station-sweep',
    )
    assert.equal(game.lives, 5)
    game.render(g)
  }

  // Regressions found in review (2026-10-07).
  {
    // A bot revived just past the leash can still close the gap: any step
    // that doesn't widen it is allowed (it used to freeze both in place).
    type Hero = { x: number; y: number; flat: boolean; battery: number }
    const mod = await loadArcadeGame('kindness-gauntlet')
    const game = mod.create({
      rng: mulberry32(8),
      sound: quiet,
      demo: false,
      hiScore: 0,
      players: 3,
    })
    const inner = game as unknown as { heroes: Hero[]; walls: Uint8Array }
    const all = [tap('a'), tap('a'), tap('a')]
    game.update(all[0]!, all)
    inner.walls.fill(0)
    const [a, b, c] = inner.heroes
    Object.assign(a!, { x: 400, y: 100 })
    Object.assign(b!, { x: 400, y: 284 })
    Object.assign(c!, { x: 400, y: 294, flat: true, battery: 0 })
    a!.battery = b!.battery = 300
    game.update(idle(), [idle(), idle(), idle()])
    assert.ok(!c!.flat, 'B shared a charge with C')
    const gap = c!.y - a!.y
    for (let i = 0; i < 60; i++)
      game.update(idle(), [hold('down'), idle(), hold('up')])
    assert.ok(c!.y - a!.y < gap, 'past the leash, they can still walk together')
  }
  {
    // A stray critter on a deck already shown clean doesn't hold the station.
    type Deck = { sacs: unknown[]; critters: unknown[]; clean: boolean }
    const mod = await loadArcadeGame('station-sweep')
    const game = mod.create({
      rng: mulberry32(10),
      sound: quiet,
      demo: false,
      hiScore: 0,
    })
    const inner = game as unknown as { decks: Deck[]; clear: number }
    for (let i = 0; i < 5; i++) game.update(idle())
    for (const d of inner.decks)
      Object.assign(d, { sacs: [], critters: [], clean: true })
    inner.decks[0]!.clean = false
    inner.decks[1]!.critters = [
      {
        kind: 'crawler',
        x: 900,
        y: 206,
        vx: 0,
        vy: 0,
        hp: 1,
        t: 0,
        onCeiling: false,
        clinging: null,
        canCling: false,
        big: false,
      },
    ]
    for (let i = 0; i < 5; i++) game.update(idle())
    assert.ok(inner.clear > 0 || game.level > 1, 'the station is clean')
  }
  {
    // A crawler riding a lift with its Mop doesn't chew on it in transit.
    type Mop = { x: number; health: number; dead: number; ride: unknown }
    const mod = await loadArcadeGame('station-sweep')
    const game = mod.create({
      rng: mulberry32(12),
      sound: quiet,
      demo: false,
      hiScore: 0,
      players: 2,
    })
    const inner = game as unknown as {
      mops: Mop[]
      decks: Array<{ sacs: unknown[]; critters: unknown[] }>
    }
    const [p1] = inner.mops
    for (const d of inner.decks) d.sacs = []
    p1!.x = 180
    p1!.health = 3
    inner.decks[0]!.critters = [
      {
        kind: 'crawler',
        x: 180,
        y: 188,
        vx: 0,
        vy: 0,
        hp: 1,
        t: 0,
        onCeiling: false,
        clinging: p1,
        canCling: false,
        big: false,
      },
    ]
    game.update(idle(), [tap('down'), idle()])
    assert.ok(p1!.ride, 'P1 is riding')
    for (let i = 0; i < 40; i++) game.update(idle(), [idle(), idle()])
    assert.equal(p1!.health, 3, 'no damage while riding')
    assert.equal(p1!.dead, 0)
  }

  // Kindness Gauntlet: two different bots, each on its own controls, one screen.
  {
    type Hero = {
      cls: string
      x: number
      y: number
      battery: number
      flat: boolean
      picked: boolean
    }
    const mod = await loadArcadeGame('kindness-gauntlet')
    const game = canvasGame(
      mod.create({
        rng: mulberry32(3),
        sound: quiet,
        demo: false,
        hiScore: 0,
        players: 2,
      }),
      'kindness-gauntlet',
    )
    const heroes = (game as unknown as { heroes: Hero[] }).heroes
    assert.equal(heroes.length, 2)
    // P1 locks in Fix; P2 walks left onto Fix and gets bumped past it.
    game.update(tap('a'), [tap('a'), idle()])
    game.update(idle(), [idle(), tap('left')])
    game.update(idle(), [idle(), tap('left')])
    game.update(idle(), [idle(), tap('a')])
    assert.ok(heroes.every((h) => h.picked))
    assert.notEqual(
      heroes[0]!.cls,
      heroes[1]!.cls,
      'each picks a different bot',
    )
    const x1 = heroes[0]!.x
    const x2 = heroes[1]!.x
    for (let i = 0; i < 30; i++) game.update(idle(), [idle(), hold('right')])
    assert.equal(heroes[0]!.x, x1, "P2's stick doesn't move P1")
    assert.notEqual(heroes[1]!.x, x2, "P2's stick moves P2")
    for (let i = 0; i < 60 * 30; i++) {
      // Kept charged: this is about the leash, not the glitches.
      for (const h of heroes) h.battery = 300
      game.update(idle(), [hold('left'), hold('right')])
    }
    assert.ok(!game.over)
    assert.ok(
      Math.abs(heroes[0]!.x - heroes[1]!.x) <= 320 - 40,
      'partners stay on one screen',
    )
    // A flat bot waits for its partner to share a charge.
    heroes[0]!.battery = 0
    heroes[1]!.battery = 300
    game.update(idle(), [idle(), idle()])
    assert.ok(heroes[0]!.flat && !game.over, 'one flat bot is not game over')
    heroes[1]!.x = heroes[0]!.x + 6
    heroes[1]!.y = heroes[0]!.y
    heroes[1]!.battery = 200
    game.update(idle(), [idle(), idle()])
    assert.ok(!heroes[0]!.flat, 'sharing a charge brings it back')
    assert.ok(heroes[1]!.battery < 200, 'the helper gave some of its own')
    heroes[0]!.battery = 0
    heroes[1]!.battery = 0
    game.update(idle(), [idle(), idle()])
    assert.ok(game.over, 'every bot flat ends the run')
  }

  // Station Sweep: each Mop rides to a deck of its own, and both decks run.
  {
    type Mop = {
      x: number
      deck: number
      health: number
      dead: number
      out: boolean
    }
    type Deck = { sacs: Array<{ timer: number }> }
    const mod = await loadArcadeGame('station-sweep')
    const game = canvasGame(
      mod.create({
        rng: mulberry32(9),
        sound: quiet,
        demo: false,
        hiScore: 0,
        players: 2,
      }),
      'station-sweep',
    )
    const inner = game as unknown as {
      mops: Mop[]
      decks: Deck[]
      spares: number
    }
    assert.equal(game.lives, 4, 'two Mops and two shared spares')
    const [p1, p2] = inner.mops
    p2!.x = 180
    game.update(idle(), [idle(), tap('down')])
    for (let i = 0; i < 60; i++) game.update(idle(), [idle(), idle()])
    assert.equal(p2!.deck, 1, 'P2 rode down a deck')
    assert.equal(p1!.deck, 0, 'P1 stayed put')
    const timers = () => inner.decks[1]!.sacs.map((s) => s.timer).join()
    const before = timers()
    for (let i = 0; i < 30; i++) game.update(idle(), [idle(), idle()])
    assert.notEqual(
      timers(),
      before,
      "P2's deck is live while P1 is on another",
    )
    // With no spares, a downed Mop sits out; the run ends when both are out.
    inner.spares = 0
    p1!.health = 0
    for (let i = 0; i < 200; i++) game.update(idle(), [idle(), idle()])
    assert.ok(p1!.out && !game.over, 'one Mop out is not game over')
    game.render(g)
    p2!.health = 0
    for (let i = 0; i < 200 && !game.over; i++)
      game.update(idle(), [idle(), idle()])
    assert.ok(game.over, 'both out ends the run')
  }
}

// --- Kind Pinball 3D: the WebGL lane (conductor kind-pinball/t-004) ----------
//
// Rapier runs here for real (its WASM build works in Node); the renderer is a
// stub, since there is no WebGL in Node. The scene still builds every Three.js
// geometry and material, so resource counts are real.

function stubRenderer(log: { disposed: number; frames: number }): RendererLike {
  return {
    render: () => void log.frames++,
    setSize: () => {},
    setPixelRatio: () => {},
    dispose: () => void log.disposed++,
  }
}

async function runPinball3d() {
  // The preview cabinet is reachable but unlisted, WebGL, and never scores.
  const preview = findArcadeGame('kind-pinball-3d')
  assert.ok(preview, 'the 3D preview is reachable by slug')
  assert.equal(preview.renderMode, 'webgl')
  assert.ok(PREVIEW_GAMES.includes(preview))
  assert.ok(
    !ARCADE_GAMES.some((game) => game.slug === preview.slug),
    'not listed in the hall',
  )
  for (const score of [1, 100, 1_000_000]) {
    assert.equal(isPlausibleScore('kind-pinball-3d', score), false)
  }
  assert.ok(
    ARCADE_GAMES.every(
      (game) => (game.renderMode ?? 'canvas2d') === 'canvas2d',
    ),
  )

  // The registry loader initialises Rapier and hands back a WebGL game.
  const mod = await loadArcadeGame('kind-pinball-3d')
  const viaRegistry = mod.create({
    rng: mulberry32(1),
    sound: { play: () => {} },
    demo: true,
    hiScore: 0,
  })
  assert.ok(isWebGLInstance(viaRegistry))
  viaRegistry.dispose()
  viaRegistry.dispose()

  // Physics: a ball rests on the plunger, launches past the lane sensor,
  // and eventually drains; disposing frees the world.
  const worldsBefore = livePhysicsWorlds()
  const physics = new PinballPhysics(RAPIER, AMI_VILLAGE_GREYBOX)
  assert.equal(livePhysicsWorlds(), worldsBefore + 1)
  physics.serveBall()
  for (let i = 0; i < 120; i++) physics.step()
  assert.ok(physics.ballOnPlunger(), 'a served ball rests on the plunger')
  assert.ok(physics.launch(0.8))
  const seen = new Set<string>()
  for (let i = 0; i < 120 * 60 && physics.ballCount; i++) {
    for (const event of physics.step())
      seen.add(event.type === 'drain' ? 'drain' : `${event.type}:${event.id}`)
    for (const ball of physics.ballViews()) {
      assert.ok(ball.position.every(Number.isFinite), 'no NaN ball')
      assert.ok(ball.position[1] < 0.07, 'the ball stays under the glass')
    }
  }
  assert.ok(
    seen.has('sensor-enter:shooter-exit'),
    'the plunge crosses the lane sensor',
  )
  assert.ok(seen.has('drain'), 'an unflipped ball drains')
  physics.dispose()
  physics.dispose()
  assert.equal(livePhysicsWorlds(), worldsBefore)

  // Rules: a pure ball cycle. Start serves ball 1, each drain serves the next,
  // the last drain ends the game, and drains during multiball do not.
  let rules = initialRules(3)
  let step = stepRules(rules, { type: 'start' })
  assert.ok(step.effects.some((e) => e.type === 'serve-ball'))
  rules = step.state
  assert.equal(rules.ball, 1)
  rules = { ...rules, ballsInPlay: 2 }
  step = stepRules(rules, {
    type: 'switch',
    event: { type: 'drain', ballId: 1 },
  })
  assert.equal(step.state.lives, 3, 'a multiball drain keeps the ball')
  rules = step.state
  for (let n = 0; n < 3; n++) {
    step = stepRules(rules, {
      type: 'switch',
      event: { type: 'drain', ballId: 2 },
    })
    rules = step.state
  }
  assert.equal(rules.over, true)
  assert.ok(step.effects.some((e) => e.type === 'game-over'))
  assert.equal(
    stepRules(rules, { type: 'start' }).effects.length,
    0,
    'a finished game ignores events',
  )
  step = stepRules(initialRules(3), {
    type: 'switch',
    event: { type: 'contact', id: 'pop-left', ballId: 1, impulse: 1 },
  })
  assert.equal(step.state.switches['pop-left'], 1)
  assert.ok(
    step.effects.some((e) => e.type === 'mechanism' && e.id === 'pop-left'),
  )

  // Lifecycle: enter and leave the WebGL cabinet over and over. Every cycle
  // mounts, sizes, plays, renders and disposes; nothing may leak.
  const canvas = {} as HTMLCanvasElement
  const resourcesBefore = liveRenderResources()
  const log = { disposed: 0, frames: 0 }
  const cycles = 25
  for (let cycle = 0; cycle < cycles; cycle++) {
    const runtime = new PinballRuntime(
      {
        rng: mulberry32(cycle + 1),
        sound: { play: () => {} },
        demo: cycle % 2 === 0,
        hiScore: 0,
      },
      RAPIER,
      AMI_VILLAGE_GREYBOX,
      () => stubRenderer(log),
    )
    assert.equal(runtime.renderMode, 'webgl')
    runtime.resize(360, 640, 2)
    runtime.mount(canvas)
    runtime.mount(canvas)
    assert.ok(
      liveRenderResources() > resourcesBefore,
      'the scene builds GPU resources',
    )
    for (let t = 0; t < 240; t++) {
      const frame = emptyInput()
      frame.held.down = t < 30
      frame.held.left = t % 40 < 8
      runtime.update(frame)
      if (t % 4 === 0) runtime.render()
    }
    assert.equal(runtime.score, 0, 'the greybox posts no score')
    runtime.dispose()
    runtime.dispose()
    runtime.update(emptyInput())
    runtime.render()
    assert.equal(
      livePhysicsWorlds(),
      worldsBefore,
      `cycle ${cycle}: physics freed`,
    )
    assert.equal(
      liveRenderResources(),
      resourcesBefore,
      `cycle ${cycle}: GPU resources freed`,
    )
  }
  assert.equal(
    log.disposed,
    cycles,
    'one renderer per mount, each disposed once',
  )
  assert.ok(log.frames > 0)

  // A full attract demo runs to game over by itself without a stuck ball.
  const demo = new PinballRuntime(
    { rng: mulberry32(5), sound: { play: () => {} }, demo: true, hiScore: 0 },
    RAPIER,
    AMI_VILLAGE_GREYBOX,
    () => stubRenderer(log),
  )
  let ticks = 0
  for (; ticks < 60 * 60 * 10 && !demo.over; ticks++) demo.update(emptyInput())
  assert.ok(demo.over, 'the demo plays all three balls out')
  demo.dispose()
}

await runGames()
await runCoopGames()
await runPinball3d()
console.log('verifyArcadeEngine: ok')
