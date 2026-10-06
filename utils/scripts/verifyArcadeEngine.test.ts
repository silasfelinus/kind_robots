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
import { combineFrame, readGamepad } from '../arcade/input'
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
} from '../arcade/games'
import { glyphFor, measureText } from '../arcade/font'
import { BATTERY_MAZE } from '../arcade/games/batteryMaze'
import { emptyInput, type InputFrame } from '../arcade/types'
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

async function runGames() {
  const g = stubContext()
  const quiet = { play: () => {} }
  for (const meta of ARCADE_GAMES) {
    const mod = await loadArcadeGame(meta.slug)

    const demo = mod.create({
      rng: mulberry32(7),
      sound: quiet,
      demo: true,
      hiScore: 0,
    })
    for (let t = 0; t < 60 * 60 && !demo.over; t++) {
      demo.update(emptyInput())
      if (t % 30 === 0) demo.render(g)
    }
    assert.equal(demo.score, 0, `${meta.slug}: the attract demo never scores`)

    const sounds: string[] = []
    const player = mod.create({
      rng: mulberry32(11),
      sound: { play: (name) => void sounds.push(name) },
      demo: false,
      hiScore: 500,
    })
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

await runGames()
console.log('verifyArcadeEngine: ok')
