// /utils/scripts/verifyArcadeEngine.test.ts
//
// Kind Robots Arcade (conductor kr-arcade): the pure engine pieces -- clock,
// difficulty curves, input folding, the cabinet flow reducer, initials,
// score plausibility, the bitmap font -- plus a headless run of every
// registered game (demo pilot and a scripted player) against a stub canvas.
//
//   npx tsx utils/scripts/verifyArcadeEngine.test.ts

import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { MUSIC_BEDS, PINBALL_CUES } from '../arcade/pinball/audio/catalog'
import { PinballMixer } from '../arcade/pinball/audio/mixer'
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
  type ArcadeGuidePage,
  type ArcadePlayableInstance,
  type InputFrame,
} from '../arcade/types'
import RAPIER from '@dimforge/rapier3d-compat'
import * as THREE from 'three'
import {
  livePhysicsWorlds,
  MAX_BALL_SPEED,
  PHYSICS_HZ,
  PinballPhysics,
  type BallView,
} from '../arcade/pinball/physics/world'
import {
  liveRenderResources,
  PinballScene,
  type RendererLike,
} from '../arcade/pinball/render/scene'
import {
  initialRules,
  SECRET_DOOR_STEPS,
  stepRules,
  TILT_BOB_STEPS,
  type PinballRulesState,
  type RulesEvent,
} from '../arcade/pinball/rules/engine'
import {
  DEFAULT_WINDOW_TICKS,
  initialShotProgress,
  recognizeShots,
} from '../arcade/pinball/rules/shots'
import { fitCamera, portraitBlend } from '../arcade/pinball/render/camera'
import {
  CAMERA_MODES,
  CameraFollow,
  isCameraMode,
  nextCameraMode,
} from '../arcade/pinball/render/cameraMode'
import {
  QualityGovernor,
  TIER_SETTINGS,
} from '../arcade/pinball/render/quality'
import { lampStates, RAINBOW_LAMPS } from '../arcade/pinball/rules/lamps'
import {
  applyShows,
  ATTRACT_PATTERN_TICKS,
  attractShow,
  liveShows,
  MAX_SHOWS,
  SHOW_TICKS,
  showTriggers,
} from '../arcade/pinball/rules/lightShows'
import {
  DMD_SCENES,
  DmdQueue,
  MAX_WAIT_MS,
  TIMER_INTERRUPT_MS,
  type DmdSceneId,
} from '../arcade/pinball/dmdQueue'
import { drawDmd, fitScale, formatScore } from '../arcade/pinball/dmdScenes'
import {
  cameraPresetFor,
  cameraViewFor,
  PinballRuntime,
} from '../arcade/pinball/runtime'
import { aimedShot, delaysFor } from '../arcade/pinball/tuning/aim'
import { BOT_SKILLS, PinballBot } from '../arcade/pinball/tuning/bot'
import { playGame, summarize } from './pinballTuning'
import { MAP_SHOTS, pinballGuide } from '../arcade/pinball/guide'
import { PinballTouch, zoneAt } from '../arcade/pinballTouch'
import { delivered, HUT_COUNT, toyPose } from '../arcade/pinball/rules/toys'
import {
  goalsMet,
  MASTERY_GOALS,
  VILLAGE_PARTS,
} from '../arcade/pinball/rules/mastery'
import {
  masteryLine,
  masteryProgress,
  mergeMastery,
  partsComplete,
  sanitizeMastery,
} from '../arcade/mastery'
import {
  doorSteps,
  HURRY_FLOOR,
  HURRY_RAISE,
  HURRY_SECONDS,
  HURRY_START,
  hurryValue,
  keysNeeded,
  musicFor,
} from '../arcade/pinball/rules/subTable'
import {
  BALL_SAVE_STEPS,
  COMBO_STEPS,
  EXTRA_BALL_AT,
  MULTIBALL_ADDS,
  nextRandom,
  RAMPS_TO_RELIGHT,
  SKILL_STEPS,
  VALUES,
  VILLAGES,
  WIZARD_ADDS,
  WIZARD_AT,
  WIZARD_NAME,
  RAMP_SHOTS,
} from '../arcade/pinball/rules/village'
import { AMI_VILLAGE_GREYBOX } from '../arcade/pinball/tables/amiVillage/table'
import type {
  RuleEffect,
  SwitchEvent,
  TableDef,
  Vec3,
} from '../arcade/pinball/types'
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

async function runPinballFeel() {
  // conductor kind-pinball/t-005: physics feel and its acceptance tests.
  const table = AMI_VILLAGE_GREYBOX
  const left = table.flippers.find((f) => f.id === 'flipper-left')!
  const steps = (physics: PinballPhysics, n: number) => {
    const events: SwitchEvent[] = []
    for (let i = 0; i < n; i++) events.push(...physics.step())
    return events
  }

  // The flipper is a motor: a held button drives the bat to its stop in
  // about strokeMs; a tap that lets go early never reaches it.
  const motor = new PinballPhysics(RAPIER, table)
  motor.setFlipper('left', true)
  const strokeSteps = Math.ceil((left.strokeMs / 1000) * PHYSICS_HZ)
  steps(motor, strokeSteps - 2)
  assert.notEqual(motor.flipperAngles()['flipper-left'], left.activeAngle)
  steps(motor, 3)
  assert.equal(motor.flipperAngles()['flipper-left'], left.activeAngle)
  motor.setFlipper('left', false)
  steps(motor, PHYSICS_HZ)
  assert.equal(motor.flipperAngles()['flipper-left'], left.restAngle)
  motor.setFlipper('left', true)
  steps(motor, 2)
  motor.setFlipper('left', false)
  let peak = left.restAngle
  for (let i = 0; i < 20; i++) {
    motor.step()
    peak = Math.min(peak, motor.flipperAngles()['flipper-left']!)
  }
  assert.ok(
    peak > left.activeAngle + 0.3,
    'a tap is a partial stroke, not a full one',
  )
  motor.dispose()

  // Cradle: a ball rolling down the inlane onto a held flipper settles in
  // the crook and stays there.
  const cradled = (physics: PinballPhysics) => {
    physics.setFlipper('left', true)
    steps(physics, PHYSICS_HZ / 4)
    physics.serveBall([-0.15, 0.0136, -0.12], [0, 0, 0])
    steps(physics, PHYSICS_HZ * 4)
  }
  const cradle = new PinballPhysics(RAPIER, table)
  cradled(cradle)
  const settled = cradle.ballViews()[0]!
  assert.ok(settled.speed < 0.01, 'the ball settles on the held flipper')
  steps(cradle, PHYSICS_HZ * 5)
  const still = cradle.ballViews()[0]
  assert.ok(still && still.speed < 0.01, 'and stays cradled for five seconds')
  assert.ok(
    Math.hypot(
      still.position[0] - settled.position[0],
      still.position[2] - settled.position[2],
    ) < 0.002,
  )
  cradle.dispose()

  // Live catch: a ball coming down fast onto a held flipper is killed and
  // ends up cradled, not bounced off the table.
  const catcher = new PinballPhysics(RAPIER, table)
  catcher.setFlipper('left', true)
  steps(catcher, PHYSICS_HZ / 4)
  catcher.serveBall([-0.05, 0.0136, -0.2], [0, 0, 1.5])
  steps(catcher, PHYSICS_HZ * 4)
  const caught = catcher.ballViews()[0]
  assert.ok(caught && caught.speed < 0.02, 'a live catch comes to rest')
  catcher.dispose()

  // Full flips: from the middle of the bat the ball leaves at real flipper
  // speed, and it stays on the playfield (a bat with a round section threw
  // it in the air).
  for (const delay of [175, 200]) {
    const flip = new PinballPhysics(RAPIER, table)
    cradled(flip)
    flip.setFlipper('left', false)
    steps(flip, delay)
    flip.setFlipper('left', true)
    let speed = 0
    let top = 0
    for (let i = 0; i < 60; i++) {
      flip.step()
      const ball = flip.ballViews()[0]
      if (!ball) break
      speed = Math.max(speed, ball.speed)
      // Height only while the ball is still by the bat (a ramp lifts it later).
      const fromPivot = Math.hypot(
        ball.position[0] - left.pivot[0],
        ball.position[2] - left.pivot[2],
      )
      if (fromPivot < 0.15) top = Math.max(top, ball.position[1])
    }
    assert.ok(speed > 3.5 && speed < 7, `a full flip: ${speed.toFixed(2)} m/s`)
    assert.ok(top < 0.02, 'the flipped ball stays on the playfield')
    flip.dispose()
  }

  // Post pass: drop the cradled ball, tap as it rolls down the bat, and it
  // crosses to the other flipper, which catches it. Reproducible across a
  // window of timings, not one magic frame. (On the bowed rubber of t-013,
  // where the strike point steers the ball, it is a real skill: about 17 ms.)
  for (const delay of [170, 172, 174]) {
    const pass = new PinballPhysics(RAPIER, table)
    cradled(pass)
    pass.setFlipper('left', false)
    steps(pass, delay)
    pass.setFlipper('left', true)
    steps(pass, 6)
    pass.setFlipper('left', false)
    pass.setFlipper('right', true)
    steps(pass, PHYSICS_HZ * 4)
    const across = pass.ballViews()[0]
    assert.ok(
      across && across.position[0] > 0.05 && across.speed < 0.02,
      `post pass at ${delay} steps lands cradled on the right flipper`,
    )
    pass.dispose()
  }

  // Slings fire on a real hit, kicking the ball away, and stay quiet for a
  // ball merely resting against the rubber.
  const sling = new PinballPhysics(RAPIER, table)
  sling.serveBall([-0.11, 0.0136, -0.2], [-0.2, 0, 0.8])
  const slingHits = steps(sling, PHYSICS_HZ / 4).filter(
    (e) => e.type === 'contact' && e.id.startsWith('sling-'),
  )
  assert.ok(slingHits.length >= 1, 'the sling fires')
  assert.ok(sling.ballViews()[0]!.speed > 1.2, 'and kicks the ball away')
  sling.dispose()

  // The left outlane kickback, lit, fires a ball that would have drained
  // back up the outlane, through the one-way deflector and round the orbit;
  // once used it is out until the A-M-I bank relights it.
  const play = (
    physics: PinballPhysics,
    state: PinballRulesState,
    n: number,
  ) => {
    let tick = 0
    for (let i = 0; i < n && physics.ballCount; i++) {
      for (const event of physics.step()) {
        const result = stepRules(state, { type: 'switch', event, tick: ++tick })
        state = result.state
        for (const effect of result.effects) {
          if (effect.type === 'mechanism' && effect.action === 'fire')
            physics.fireKicker(effect.id)
        }
      }
    }
    return state
  }
  const kick = new PinballPhysics(RAPIER, table)
  let rules = stepRules(initialRules(3), { type: 'start' }).state
  assert.ok(rules.kickbackLit)
  kick.serveBall([-0.235, 0.0136, -0.2], [0, 0, 0.5])
  rules = play(kick, rules, PHYSICS_HZ * 2)
  assert.equal(rules.kickbackLit, false, 'the kickback fired')
  const saved = kick.ballViews()[0]
  assert.ok(saved, 'the kicked ball is still in play')
  assert.ok(saved.position[2] < -0.1, 'sent back up the table')
  kick.dispose()
  const unlit = new PinballPhysics(RAPIER, table)
  unlit.serveBall([-0.235, 0.0136, -0.2], [0, 0, 0.5])
  play(unlit, { ...rules, kickbackLit: false }, PHYSICS_HZ * 2)
  assert.equal(unlit.ballCount, 0, 'unlit, the outlane drains')
  unlit.dispose()
  let relit = { ...rules, kickbackLit: false }
  for (const id of ['drop-a', 'drop-m', 'drop-i']) {
    relit = stepRules(relit, {
      type: 'switch',
      event: { type: 'drop', id, bank: 'ami', ballId: 1 },
    }).state
  }
  assert.ok(relit.kickbackLit, 'the A-M-I bank relights the kickback')

  // The tilt bob: lone nudges are free; nudging while it still swings
  // warns twice, then tilts, killing the flippers until the next ball.
  let tilt = stepRules(initialRules(3), { type: 'start' }).state
  for (let i = 0; i < 6; i++) {
    tilt = stepRules(tilt, {
      type: 'nudge',
      tick: i * (TILT_BOB_STEPS + 1),
    }).state
  }
  assert.equal(tilt.tiltWarnings, 0, 'spaced nudges never warn')
  const t0 = 10 * TILT_BOB_STEPS
  const texts: string[] = []
  for (let i = 0; i < 4; i++) {
    const step = stepRules(tilt, { type: 'nudge', tick: t0 + i * 60 })
    tilt = step.state
    for (const e of step.effects) if (e.type === 'dmd') texts.push(e.text)
  }
  assert.deepEqual(texts, ['WARNING', 'DANGER', 'TILT'])
  assert.ok(tilt.tilted)
  assert.equal(
    stepRules(tilt, { type: 'nudge', tick: t0 + 400 }).effects.length,
    0,
    'a tilted machine ignores nudges',
  )
  const nextBall = stepRules(tilt, {
    type: 'switch',
    event: { type: 'drain', ballId: 1 },
  })
  assert.equal(nextBall.state.tilted, false)
  assert.equal(nextBall.state.tiltWarnings, 0)
  assert.ok(
    nextBall.effects.some(
      (e) =>
        e.type === 'mechanism' && e.id === 'flippers' && e.action === 'enable',
    ),
  )
  // In the runtime, a tilted machine's flippers will not rise.
  const tilted = new PinballRuntime(
    { rng: mulberry32(8), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const inner = tilted as unknown as {
    physics: PinballPhysics
    rules: PinballRulesState
  }
  inner.rules = { ...inner.rules, tilted: true }
  const hold = emptyInput()
  hold.held.left = true
  for (let i = 0; i < 10; i++) tilted.update(hold)
  assert.equal(
    inner.physics.flipperAngles()['flipper-left'],
    left.restAngle,
    'the tilted flipper stays down',
  )
  tilted.dispose()

  // No tunnelling: 500 shots at the speed fuse into a standard post, from
  // every side and offset, never get inside it.
  const post = table.colliders.find((c) => c.id === 'shot-post-1')
  assert.ok(post && post.kind === 'post')
  const postTable: TableDef = {
    ...table,
    colliders: [
      table.colliders.find((c) => c.id === 'playfield')!,
      { ...post, at: [0, post.at[1], 0] },
    ],
    sensors: [],
    flippers: [],
    drops: [],
    scoops: [],
    spinners: [],
    doors: [],
    kickers: [],
    toys: [],
    zones: [],
  }
  const radius = table.physical.ballRadiusM
  let closest = Infinity
  for (let i = 0; i < 500; i++) {
    const physics = new PinballPhysics(RAPIER, postTable)
    const around = (2 * Math.PI * i) / 500
    const offset = ((i % 7) - 3) * 0.003
    const dirX = -Math.cos(around)
    const dirZ = -Math.sin(around)
    physics.serveBall(
      [
        Math.cos(around) * 0.08 - dirZ * offset,
        0.0136,
        Math.sin(around) * 0.08 + dirX * offset,
      ],
      [dirX * MAX_BALL_SPEED, 0, dirZ * MAX_BALL_SPEED],
    )
    for (let s = 0; s < PHYSICS_HZ / 8; s++) {
      physics.step()
      const ball = physics.ballViews()[0]
      if (!ball) break
      closest = Math.min(
        closest,
        Math.hypot(ball.position[0], ball.position[2]),
      )
    }
    physics.dispose()
  }
  assert.ok(
    closest > post.radius + radius - 0.001,
    `no ball tunnels into the post (closest ${closest.toFixed(4)} m)`,
  )

  // Ramp thresholds: a weak shot up the left ramp rolls back; a real one
  // makes it, rides the ramp without flying off it, and returns to the
  // left inlane.
  const mouth = [-0.12, -0.3] as const
  const along = [-0.184, -0.983] as const
  const rampShot = (speed: number) => {
    const physics = new PinballPhysics(RAPIER, table)
    physics.serveBall(
      [mouth[0] - along[0] * 0.05, 0.0136, mouth[1] - along[1] * 0.05],
      [along[0] * speed, 0, along[1] * speed],
    )
    let made = false
    let top = 0
    let home = false
    for (let i = 0; i < PHYSICS_HZ * 4 && physics.ballCount; i++) {
      for (const e of physics.step()) {
        if (e.type === 'sensor-enter' && e.id === 'left-ramp-made') made = true
        if (made && e.type === 'contact' && e.id === 'flipper-left') home = true
      }
      const ball = physics.ballViews()[0]
      if (ball) top = Math.max(top, ball.position[1])
    }
    physics.dispose()
    return { made, top, home }
  }
  // The climb needs ~1.55 m/s along the mouth (crest height plus the
  // pitch, with a rolling ball's inertia); a tap falls short.
  for (const speed of [1.2, 1.4]) {
    assert.equal(rampShot(speed).made, false, `${speed} m/s rolls back`)
  }
  for (const speed of [3, 4, 5]) {
    const shot = rampShot(speed)
    assert.ok(shot.made, `${speed} m/s makes the left ramp`)
    assert.ok(shot.top < 0.046 + 0.035 + radius, 'it never clears the rails')
    assert.ok(shot.home, 'and it comes home to the left flipper')
  }
}

/**
 * Ten simulated minutes of the attract pilot with three balls in play: no
 * ball may sit still for good (ball search must always free it).
 */
async function runPinballSoak() {
  const table = AMI_VILLAGE_GREYBOX
  // A ball dropped onto a slingshot (as one leaving a ramp's return off its
  // edge can be) rides the sling's plastic and rolls off: it never sinks in
  // between the sling's walls, where it wedges for good (found by this soak,
  // t-012). Uncapped, its centre settles 30 mm up inside the triangle.
  const inside = (x: number, z: number, side: number) => {
    const [a, b, c] = [
      [0.17 * side, -0.22],
      [0.17 * side, -0.14],
      [0.115 * side, -0.105],
    ] as const
    const cross = (p: readonly number[], q: readonly number[]) =>
      (x - q[0]!) * (p[1]! - q[1]!) - (p[0]! - q[0]!) * (z - q[1]!)
    const d = [cross(a, b), cross(b, c), cross(c, a)]
    return d.every((v) => v >= 0) || d.every((v) => v <= 0)
  }
  for (const side of [-1, 1]) {
    const physics = new PinballPhysics(RAPIER, table)
    physics.serveBall([0.154 * side, 0.05, -0.149], [0, 0, 0])
    let lowest = Infinity
    for (let i = 0; i < PHYSICS_HZ; i++) {
      physics.step()
      for (const ball of physics.ballViews())
        if (inside(ball.position[0], ball.position[2], side))
          lowest = Math.min(lowest, ball.position[1])
    }
    assert.ok(
      lowest > 0.04,
      `a ball on the ${side < 0 ? 'left' : 'right'} sling stays on its plastic (${lowest.toFixed(3)})`,
    )
    physics.dispose()
  }
  const runtime = new PinballRuntime(
    { rng: mulberry32(11), sound: { play: () => {} }, demo: true, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const inner = runtime as unknown as {
    physics: PinballPhysics
    rules: PinballRulesState
  }
  const spots: Vec3[] = [
    [0.0, 0.0136, -0.55],
    [-0.15, 0.0136, -0.2],
    [0.15, 0.0136, -0.2],
  ]
  const lastMove = new Map<number, { at: Vec3; tick: number }>()
  let longest = 0
  const minutes = 10
  for (let tick = 0; tick < 60 * 60 * minutes; tick++) {
    // Keep three balls on the table, and the game going.
    if (inner.physics.ballCount < 3) {
      inner.physics.serveBall(spots[tick % spots.length]!, [0, 0, 0])
    }
    inner.rules = {
      ...inner.rules,
      lives: 99,
      over: false,
      ballsInPlay: inner.physics.ballCount,
    }
    runtime.update(emptyInput())
    for (const ball of inner.physics.ballViews()) {
      const seen = lastMove.get(ball.id)
      const moved =
        !seen ||
        ball.captured ||
        Math.hypot(
          ball.position[0] - seen.at[0],
          ball.position[2] - seen.at[2],
        ) > 0.005
      if (moved) lastMove.set(ball.id, { at: ball.position, tick })
      else longest = Math.max(longest, tick - seen.tick)
    }
  }
  runtime.dispose()
  assert.ok(
    longest < 60 * 20,
    `no ball stuck for good (longest still: ${(longest / 60).toFixed(1)} s)`,
  )
}

async function runPinballSubTable() {
  // conductor kind-pinball/t-011: the hidden sub-table behind the backbox.
  const table = AMI_VILLAGE_GREYBOX
  const left: Vec3 = [-0.05, 0.0135, -0.07]
  const room = table.zones?.find((zone) => zone.id === 'sub-table')
  assert.ok(room, 'the table has a sub-table zone')
  const roomX = (room.min[0] + room.max[0]) / 2

  type Trace = { events: SwitchEvent[]; zones: Set<string> }
  const run = (
    physics: PinballPhysics,
    steps: number,
    flip?: (ball: { position: Vec3; velocity: Vec3 }) => boolean,
  ): Trace => {
    const events: SwitchEvent[] = []
    const zones = new Set<string>()
    for (let i = 0; i < steps && physics.ballCount; i++) {
      const ball = physics.ballViews()[0]
      const up = Boolean(ball && flip?.(ball))
      physics.setFlipper('left', up)
      physics.setFlipper('right', up)
      events.push(...physics.step())
      for (const view of physics.ballViews()) zones.add(view.zone ?? 'main')
    }
    return { events, zones }
  }
  const has = (trace: Trace, type: string, id: string) =>
    trace.events.findIndex((e) => e.type === type && 'id' in e && e.id === id)

  // The door is part of the arch until the rules open it: a left orbit
  // goes round as usual and never finds the room.
  const closed = new PinballPhysics(RAPIER, table)
  assert.deepEqual(closed.doorStates(), { 'secret-door': false })
  closed.serveBall(left, orbitAim(-122, 3))
  const around = run(closed, PHYSICS_HZ * 5)
  assert.equal(has(around, 'capture', 'secret-hole'), -1)
  assert.ok(!around.zones.has('sub-table'))
  closed.dispose()

  // Open, the same shot is diverted out through the gap into the hidden
  // hole, rides the subway up into the room, and (unflipped) drains past
  // the room's flippers, which sends it home to the award saucer. Its
  // kickout feeds the main left flipper.
  let found = 0
  for (const deg of [-123, -122, -121]) {
    const open = new PinballPhysics(RAPIER, table)
    open.setDoor('secret-door', true)
    assert.deepEqual(open.doorStates(), { 'secret-door': true })
    open.serveBall(left, orbitAim(deg, 3))
    const trip = run(open, PHYSICS_HZ * 9)
    const hole = has(trip, 'capture', 'secret-hole')
    const arrive = has(trip, 'eject', 'sub-entry')
    const drain = has(trip, 'capture', 'sub-drain')
    const home = has(trip, 'eject', 'award')
    if (hole >= 0) {
      found++
      assert.ok(arrive > hole, 'the subway brings the ball up into the room')
      assert.ok(trip.zones.has('sub-table'))
      assert.ok(drain > arrive && home > drain, 'room drain -> award kickout')
      assert.ok(
        trip.events
          .slice(home)
          .some((e) => e.type === 'contact' && e.id === 'flipper-left'),
        'the kickout feeds the left flipper',
      )
    }
    open.dispose()
  }
  assert.ok(found >= 2, `the open door takes left orbits (${found}/3)`)

  // The room's flippers are on the same buttons, and they keep a ball in
  // play there: a ball rolling down onto the left one is flipped back up.
  const flippers = new PinballPhysics(RAPIER, table)
  flippers.setFlipper('left', true)
  for (let i = 0; i < 20; i++) flippers.step()
  const angles = flippers.flipperAngles()
  const sub = table.flippers.find((f) => f.id === 'sub-flipper-left')!
  assert.ok(Math.abs(angles['sub-flipper-left']! - sub.activeAngle) < 1e-6)
  flippers.setFlipper('left', false)
  for (let i = 0; i < 30; i++) flippers.step()
  flippers.serveBall([roomX - 0.12, 0.0136, -1.2], [0, 0, 0])
  let saved = false
  let flipped = false
  const save = run(flippers, PHYSICS_HZ * 4, (ball) => {
    if (ball.position[2] > -1.125 && ball.velocity[2] > 0) flipped = true
    if (flipped && ball.position[2] < -1.2) saved = true
    return flipped && !saved
  })
  assert.ok(saved, 'a room flipper sends the ball back up the room')
  assert.ok(save.zones.has('sub-table'))
  flippers.dispose()

  // The N-E-T standups report every hit and never drop; the windmill turns
  // and bats the ball; HOME takes a ball back to the main table.
  const toys = new PinballPhysics(RAPIER, table)
  const before = toys.toyAngles().windmill!
  const nets = table.drops.filter((drop) => drop.bank === 'net')
  assert.equal(nets.length, 3)
  for (const net of nets) {
    toys.serveBall([net.at[0], 0.0136, net.at[2] + 0.06], [0, 0, -1.2])
  }
  const hits = run(toys, 60)
  for (const net of nets) {
    assert.ok(has(hits, 'contact', net.id) >= 0, `${net.id} reports a hit`)
    assert.ok(toys.dropStates()[net.id], `${net.id} stays up`)
  }
  assert.notEqual(toys.toyAngles().windmill, before, 'the windmill turns')
  toys.dispose()
  const homeScoop = table.scoops.find((s) => s.id === 'sub-home')!
  const homeRun = new PinballPhysics(RAPIER, table)
  homeRun.serveBall(
    [homeScoop.at[0], 0.0136, homeScoop.at[2] + 0.05],
    [0, 0, -0.6],
  )
  const homeTrip = run(homeRun, PHYSICS_HZ * 4)
  assert.ok(has(homeTrip, 'capture', 'sub-home') >= 0)
  assert.ok(
    has(homeTrip, 'eject', 'award') > has(homeTrip, 'capture', 'sub-home'),
  )
  homeRun.dispose()
  const windmill = new PinballPhysics(RAPIER, table)
  const mill = table.toys!.find((toy) => toy.id === 'windmill')!
  windmill.serveBall([mill.at[0], 0.0136, mill.at[2] - 0.08], [0, 0, 0.4])
  assert.ok(has(run(windmill, PHYSICS_HZ * 2), 'contact', 'windmill') >= 0)
  windmill.dispose()

  // Rules: locking a ball is the feat that opens the door, with only a
  // tease; the door closes itself again; a ball through it is a discovery;
  // the nets and HOME pay the bonus multiplier that rides back; and a new
  // ball shuts the door and resets the bonus.
  const sw = (event: SwitchEvent, tick = 0) =>
    ({ type: 'switch', event, tick }) as const
  let state = stepRules(initialRules(3), { type: 'start' }).state
  let step = stepRules(
    state,
    sw({ type: 'capture', id: 'lock', ballId: 1 }, 100),
  )
  state = step.state
  assert.ok(state.sub.doorOpen)
  assert.ok(
    step.effects.some(
      (e) =>
        e.type === 'mechanism' && e.id === 'secret-door' && e.action === 'open',
    ),
  )
  const tease = step.effects.find((e) => e.type === 'dmd')
  assert.ok(
    tease && tease.type === 'dmd' && !/ORBIT|LEFT|SECRET/.test(tease.text),
  )
  step = stepRules(state, { type: 'tick', tick: 100 + SECRET_DOOR_STEPS - 1 })
  assert.ok(step.state.sub.doorOpen, 'still open just before it times out')
  step = stepRules(state, { type: 'tick', tick: 100 + SECRET_DOOR_STEPS })
  assert.equal(step.state.sub.doorOpen, false, 'the door closes itself')
  assert.ok(
    step.effects.some((e) => e.type === 'mechanism' && e.action === 'close'),
  )
  step = stepRules(state, sw({ type: 'capture', id: 'secret-hole', ballId: 1 }))
  state = step.state
  assert.equal(state.sub.found, 1)
  assert.equal(state.sub.doorOpen, false, 'the door shuts behind the ball')
  assert.ok(
    step.effects.some((e) => e.type === 'dmd' && e.sub === 'YOU FOUND IT'),
  )
  for (const id of ['net-n', 'net-e', 'net-t', 'net-t']) {
    step = stepRules(state, sw({ type: 'contact', id, ballId: 1, impulse: 1 }))
    state = step.state
  }
  assert.deepEqual(state.sub.nets, ['net-n', 'net-e', 'net-t'])
  step = stepRules(state, sw({ type: 'capture', id: 'sub-home', ballId: 1 }))
  state = step.state
  assert.equal(state.bonusMultiplier, 3, 'HOME with the nets lit: +2x')
  assert.deepEqual(state.sub.nets, [], 'the nets reset for the next visit')
  step = stepRules(state, sw({ type: 'capture', id: 'sub-drain', ballId: 1 }))
  assert.equal(step.state.bonusMultiplier, 3, 'a plain drain home pays nothing')
  state = stepRules(state, sw({ type: 'capture', id: 'lock', ballId: 1 })).state
  state = stepRules(
    state,
    sw({ type: 'capture', id: 'secret-hole', ballId: 1 }),
  ).state
  assert.equal(state.sub.found, 2)
  // Two visits in, the door takes three locks (t-012).
  for (let i = 0; i < 3; i++)
    state = stepRules(
      state,
      sw({ type: 'capture', id: 'lock', ballId: 1 }),
    ).state
  assert.ok(state.sub.doorOpen)
  step = stepRules(state, sw({ type: 'drain', ballId: 1 }))
  assert.equal(step.state.sub.doorOpen, false, 'a new ball shuts the door')
  assert.equal(step.state.bonusMultiplier, 1)
  assert.ok(
    step.effects.some(
      (e) =>
        e.type === 'mechanism' &&
        e.id === 'secret-door' &&
        e.action === 'close',
    ),
  )

  // The camera visits the room only while every ball is there, and the
  // backbox that hides the room fades while it does.
  const ballAt = (zone?: string): BallView => ({
    id: 1,
    position: [0, 0.0135, 0],
    rotation: [0, 0, 0, 1],
    velocity: [0, 0, 0],
    speed: 0,
    captured: false,
    zone,
  })
  assert.equal(cameraViewFor([]), 'main')
  assert.equal(cameraViewFor([ballAt()]), 'main')
  assert.equal(cameraViewFor([ballAt('sub-table')]), 'sub-table')
  assert.equal(
    cameraViewFor([ballAt('sub-table'), ballAt()]),
    'main',
    'a ball still on the main table keeps the camera there',
  )
  const runtime = new PinballRuntime(
    { rng: mulberry32(3), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  assert.equal(runtime.view(), 'main', 'a new game starts on the main table')
  runtime.dispose()

  const resources = liveRenderResources()
  const scene = new PinballScene(table, {} as HTMLCanvasElement, () =>
    stubRenderer({ disposed: 0, frames: 0 }),
  )
  scene.resize(360, 640, 1)
  const homeEye = scene.camera.position.clone()
  scene.setView('sub-table')
  for (let i = 0; i < 90; i++) scene.render()
  const roomEye = scene.camera.position.clone()
  assert.ok(roomEye.distanceTo(homeEye) > 0.2, 'the camera travels to the room')
  scene.setView('main')
  for (let i = 0; i < PHYSICS_HZ; i++) scene.render()
  assert.ok(scene.camera.position.distanceTo(homeEye) < 0.01, 'and back')
  scene.dispose()
  assert.equal(liveRenderResources(), resources, 'the room frees its meshes')
}

/** A served ball's velocity for an aim (degrees, 0 = +X) and speed. */
function orbitAim(deg: number, speed: number): Vec3 {
  const rad = (deg * Math.PI) / 180
  return [Math.cos(rad) * speed, 0, Math.sin(rad) * speed]
}

async function runPinballShots() {
  // conductor kind-pinball/t-018: the greybox shot map.
  const table = AMI_VILLAGE_GREYBOX
  const glassBottom = 0.12 - 0.005 - table.physical.ballRadiusM

  // The recognizer: a shot is one ball closing its switches in order, each
  // within the window of the last.
  let progress = initialShotProgress()
  const feed = (event: SwitchEvent, tick: number) => {
    const result = recognizeShots(table.shots, progress, event, tick)
    progress = result.progress
    return result.completed.map((shot) => shot.shotId)
  }
  const enter = (id: string, ballId = 1): SwitchEvent => ({
    type: 'sensor-enter',
    id,
    ballId,
  })
  assert.deepEqual(
    feed(enter('left-ramp-made'), 0),
    [],
    'made alone is no shot',
  )
  feed(enter('left-ramp-entry'), 10)
  assert.deepEqual(feed(enter('left-ramp-made'), 60), ['left-ramp'])
  feed(enter('left-ramp-entry'), 100)
  assert.deepEqual(
    feed(enter('left-ramp-made'), 100 + DEFAULT_WINDOW_TICKS + 1),
    [],
    'a ball that took too long did not make the ramp',
  )
  feed(enter('left-ramp-entry', 2), 500)
  assert.deepEqual(
    feed(enter('left-ramp-made', 3), 510),
    [],
    'progress belongs to one ball',
  )
  feed(enter('right-orbit-high'), 600)
  assert.deepEqual(
    feed(enter('right-orbit-low'), 610),
    [],
    'an orbit only counts going up',
  )
  feed(enter('left-ramp-entry', 4), 700)
  feed({ type: 'drain', ballId: 4 }, 701)
  assert.deepEqual(
    feed(enter('left-ramp-made', 4), 702),
    [],
    'a drain clears the ball',
  )
  assert.deepEqual(feed({ type: 'capture', id: 'lock', ballId: 5 }, 800), [
    'lock',
  ])
  assert.deepEqual(
    feed({ type: 'spin', id: 'spinner', ballId: 5, speed: 2 }, 810),
    ['spinner'],
  )

  type Run = { shots: Set<string>; events: SwitchEvent[] }
  // Shoot one ball and record the shots it makes before it drains.
  const shoot = (
    at: Vec3,
    deg: number,
    speed: number,
    options: { dropsDown?: boolean; steps?: number } = {},
  ): Run => {
    const physics = new PinballPhysics(RAPIER, table)
    if (options.dropsDown) knockDownDrops(physics)
    const rad = (deg * Math.PI) / 180
    physics.serveBall(at, [Math.cos(rad) * speed, 0, Math.sin(rad) * speed])
    let shotProgress = initialShotProgress()
    const shots = new Set<string>()
    const events: SwitchEvent[] = []
    for (let tick = 0; tick < (options.steps ?? PHYSICS_HZ * 5); tick++) {
      for (const event of physics.step()) {
        events.push(event)
        const result = recognizeShots(table.shots, shotProgress, event, tick)
        shotProgress = result.progress
        for (const shot of result.completed) shots.add(shot.shotId)
      }
      for (const ball of physics.ballViews()) {
        assert.ok(ball.position.every(Number.isFinite), 'no NaN ball')
        assert.ok(
          ball.position[1] < glassBottom,
          'the ball stays under the glass',
        )
      }
      if (!physics.ballCount) break
    }
    physics.dispose()
    return { shots, events }
  }
  // Knock the A-M-I bank down the way a player does: a ball at each target.
  const amiBank = table.drops.filter((drop) => drop.bank === 'ami')
  function knockDownDrops(physics: PinballPhysics) {
    for (const drop of amiBank) {
      physics.serveBall([drop.at[0], 0.0136, -0.25], [0, 0, -1.5])
      for (let i = 0; i < 30; i++) physics.step()
    }
    for (let i = 0; i < PHYSICS_HZ * 6 && physics.ballCount; i++) physics.step()
    assert.equal(physics.ballCount, 0, 'the knocking balls drain')
    const states = physics.dropStates()
    assert.ok(
      amiBank.every((drop) => !states[drop.id]),
      'all three targets are down',
    )
  }

  // Every shot on the map is makeable from a flipper. Each is shot across a
  // fan of aims and must land at least twice in three, so it is a target
  // with a window, not a fluke. The award saucer only holds a slow ball (a
  // firm shot down that line makes the right orbit over it), so it is a soft
  // shot; the lock is open once the A-M-I targets are down.
  const left: Vec3 = [-0.05, 0.0135, -0.07]
  const right: Vec3 = [0.05, 0.0135, -0.07]
  type Aim = {
    shot: string
    at: Vec3
    deg: number
    fan: number
    speed?: number
    dropsDown?: boolean
  }
  const aims: Aim[] = [
    { shot: 'left-orbit', at: left, deg: -122, fan: 1 },
    { shot: 'left-ramp', at: left, deg: -107, fan: 2 },
    { shot: 'upper-feed', at: left, deg: -93, fan: 1 },
    { shot: 'lock', at: left, deg: -81, fan: 2, dropsDown: true },
    { shot: 'spinner', at: left, deg: -66, fan: 1 },
    { shot: 'right-ramp', at: left, deg: -53, fan: 2 },
    { shot: 'right-orbit', at: left, deg: -45, fan: 2 },
    { shot: 'award', at: left, deg: -47, fan: 2, speed: 1.2 },
    { shot: 'right-orbit', at: right, deg: -58, fan: 1 },
    { shot: 'left-orbit', at: right, deg: -135, fan: 2 },
  ]
  for (const aim of aims) {
    let made = 0
    for (const d of [aim.deg - aim.fan, aim.deg, aim.deg + aim.fan]) {
      const run = shoot(aim.at, d, aim.speed ?? 3, {
        dropsDown: aim.dropsDown,
      })
      if (run.shots.has(aim.shot)) made++
    }
    assert.ok(made >= 2, `${aim.shot} is makeable (${made}/3 of the fan)`)
  }

  // A made ramp returns the ball down the inlane to its flipper.
  const rampRun = shoot(left, -107, 3)
  const made = rampRun.events.findIndex(
    (e) => e.type === 'sensor-enter' && e.id === 'left-ramp-made',
  )
  assert.ok(made >= 0)
  assert.ok(
    rampRun.events
      .slice(made)
      .some((e) => e.type === 'contact' && e.id === 'flipper-left'),
    'the left ramp feeds the left flipper',
  )
  // A weak shot falls back down the ramp instead of making it.
  assert.ok(!shoot(left, -107, 1.6).shots.has('left-ramp'))

  // The lock holds the ball, then sends it by subway to the award saucer.
  const lockRun = shoot(left, -81, 3, {
    dropsDown: true,
    steps: PHYSICS_HZ * 6,
  })
  const capture = lockRun.events.findIndex(
    (e) => e.type === 'capture' && e.id === 'lock',
  )
  const eject = lockRun.events.findIndex(
    (e) => e.type === 'eject' && e.id === 'award',
  )
  assert.ok(capture >= 0 && eject > capture, 'lock -> subway -> award')

  // The spinner reports the speed the ball passed at.
  const spin = shoot(left, -67, 3).events.find((e) => e.type === 'spin')
  assert.ok(spin && spin.type === 'spin' && spin.speed > 0.5)

  // Drop targets fall when hit and stand again when the rules reset them.
  const drops = new PinballPhysics(RAPIER, table)
  knockDownDrops(drops)
  drops.resetDropBank('ami')
  const raised = drops.dropStates()
  assert.ok(amiBank.every((drop) => raised[drop.id]))
  drops.dispose()

  // The shooter gate is one-way: a plunged ball passes up through it, and a
  // ball coming back down the lane bounces off it onto the playfield.
  const gate = table.colliders.find((c) => c.id === 'shooter-gate')
  assert.ok(gate && gate.kind === 'box' && gate.passDir)
  const gatePhysics = new PinballPhysics(RAPIER, table)
  gatePhysics.serveBall([0.28, 0.0136, -0.66], [0, 0, 1.2])
  for (let i = 0; i < PHYSICS_HZ * 3 && gatePhysics.ballCount; i++) {
    gatePhysics.step()
    for (const ball of gatePhysics.ballViews()) {
      assert.ok(
        !(ball.position[0] > 0.262 && ball.position[2] > -0.55),
        'a ball cannot fall back into the shooter lane',
      )
    }
  }
  gatePhysics.dispose()

  // No dead spots: balls left at rest where the old geometry trapped them
  // (ramp-mouth vees, the inlane bend, the flipper pivots, the channels
  // behind the centre shots) roll away and drain.
  for (const [x, z] of [
    [-0.1, -0.068],
    [0.1, -0.068],
    [-0.19, -0.2],
    [0.19, -0.2],
    [-0.115, -0.53],
    [0.11, -0.52],
    [0.03, -0.53],
    [-0.04, -0.53],
  ] as const) {
    const physics = new PinballPhysics(RAPIER, table)
    physics.serveBall([x, 0.0136, z], [0, 0, 0])
    for (let i = 0; i < PHYSICS_HZ * 8 && physics.ballCount; i++) physics.step()
    assert.equal(physics.ballCount, 0, `a ball left at (${x}, ${z}) drains`)
    physics.dispose()
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
  for (let i = 0; i < PHYSICS_HZ; i++) physics.step()
  assert.ok(physics.ballOnPlunger(), 'a served ball rests on the plunger')
  assert.ok(physics.launch(0.8))
  const seen = new Set<string>()
  for (let i = 0; i < PHYSICS_HZ * 60 && physics.ballCount; i++) {
    for (const event of physics.step())
      seen.add(event.type === 'drain' ? 'drain' : `${event.type}:${event.id}`)
    for (const ball of physics.ballViews()) {
      assert.ok(ball.position.every(Number.isFinite), 'no NaN ball')
      assert.ok(ball.position[1] < 0.1, 'the ball stays under the glass')
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
    if (cycle % 2 === 0)
      assert.equal(runtime.score, 0, 'the attract demo never scores')
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

/** Quilt Quest: the needle never ends up stranded on a sewn-in cell. */
async function runQuiltInvariant() {
  const mod = await loadArcadeGame('quilt-quest')
  for (let seed = 1; seed <= 6; seed++) {
    const game = mod.create({
      rng: mulberry32(seed),
      sound: { play: () => {} },
      demo: true,
      hiScore: 0,
    })
    const inner = game as unknown as {
      c: number
      r: number
      dead: number
      clear: number
      cell: (c: number, r: number) => number
    }
    for (let t = 0; t < 60 * 120 && !game.over; t++) {
      game.update(emptyInput())
      if (inner.dead || inner.clear) continue
      // 0 open, 1 sewn in, 2 edge, 3 thread: the needle is on an edge or its thread.
      const here = inner.cell(inner.c, inner.r)
      assert.ok(
        here === 2 || here === 3,
        `quilt-quest seed ${seed}: needle stranded on a ${here} cell`,
      )
    }
  }
}

await runGames()
await runQuiltInvariant()

/** Lantern Swarm: a rescued lantern docks as a twin, or waits as a spare. */
function runPinballAudio() {
  // conductor kind-pinball/t-008: the pinball mixer. The rules and runtime
  // name sounds as strings and the mixer silently drops a name it does not
  // know, so every name they use must be a cue; every cue sits on one of
  // the five buses; and nothing sounds before a player's gesture unlocks it.
  const here = dirname(fileURLToPath(import.meta.url))
  const pinball = join(here, '../arcade/pinball')
  const sources = [
    ...readdirSync(join(pinball, 'rules')).map((f) =>
      join(pinball, 'rules', f),
    ),
    join(pinball, 'runtime.ts'),
  ]
  const named = new Set<string>()
  for (const file of sources) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(/type: 'sound', name: '([a-z-]+)'/g))
      named.add(m[1]!)
    for (const m of text.matchAll(/mixer\.play\('([a-z-]+)'/g)) named.add(m[1]!)
  }
  assert.ok(named.size >= 25, `found the sounds in use (${named.size})`)
  for (const name of named) assert.ok(name in PINBALL_CUES, `cue: ${name}`)
  const buses = ['mechanical', 'ball', 'callout', 'music', 'ambience']
  for (const [name, cue] of Object.entries(PINBALL_CUES)) {
    assert.ok(buses.includes(cue.bus), `${name} bus`)
    assert.ok(cue.duration > 0 && cue.duration <= 2, `${name} duration`)
    assert.ok(cue.gain > 0 && cue.gain <= 1, `${name} gain`)
  }
  // The table's own beds: every bed the rules can call for has notes.
  for (const bed of ['mode', 'multiball', 'sub-table'] as const)
    assert.ok(MUSIC_BEDS[bed].length > 0, bed)

  // No gesture, no sound: before unlock nothing plays and no bed starts.
  const mixer = new PinballMixer({ play: () => {} })
  mixer.play('flipper')
  assert.equal(mixer.isUnlocked, false)
  assert.equal(mixer.startMusic('mode'), false)
  mixer.unlock()
  assert.equal(mixer.isUnlocked, false, 'no AudioContext without a window')
}

async function runLanternRescue() {
  const mod = await loadArcadeGame('lantern-swarm')
  for (const aliveAtDock of [true, false]) {
    const game = mod.create({
      rng: mulberry32(1),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
    })
    type Queen = {
      kind: string
      mode: string
      x: number
      y: number
      hp: number
      holding: boolean
    }
    const inner = game as unknown as {
      moths: Queen[]
      alive: boolean
      twin: boolean
      lives: number
      hitMoth: (m: Queen) => void
    }
    // A queen holding a captured lantern, beamed before any dives begin.
    const queen = inner.moths.find((m) => m.kind === 'queen')!
    Object.assign(queen, { mode: 'form', x: 112, y: 60, hp: 1, holding: true })
    const lives = inner.lives
    inner.hitMoth(queen)
    if (!aliveAtDock) inner.alive = false
    for (let t = 0; t < 240; t++) game.update(emptyInput())
    if (aliveAtDock)
      assert.ok(
        inner.twin,
        'lantern-swarm: the rescued lantern docks as a twin',
      )
    else
      assert.equal(
        inner.lives,
        lives + 1,
        'lantern-swarm: a rescue with no lantern to dock to becomes a spare',
      )
  }
}

async function runPinballRender() {
  // conductor kind-pinball/t-019: the hero render pass's pure parts.
  const table = AMI_VILLAGE_GREYBOX
  const pitch = (table.physical.pitchDeg * Math.PI) / 180
  const up = new THREE.Vector3(0, Math.cos(pitch), -Math.sin(pitch))

  // Camera framing: at a phone, a tablet and a desktop aspect, every corner
  // of each preset's frame box is on screen, and the box fills one axis.
  for (const preset of table.cameras) {
    for (const aspect of [390 / 844, 1180 / 820, 1280 / 800]) {
      const framing = fitCamera(preset, aspect, up)
      const camera = new THREE.PerspectiveCamera(framing.fov, aspect, 0.01, 50)
      camera.position.copy(framing.eye)
      camera.up.copy(up)
      camera.lookAt(framing.target)
      camera.updateMatrixWorld()
      let reach = 0
      for (const x of [preset.frame.min[0], preset.frame.max[0]])
        for (const y of [preset.frame.min[1], preset.frame.max[1]])
          for (const z of [preset.frame.min[2], preset.frame.max[2]]) {
            const p = new THREE.Vector3(x, y, z).project(camera)
            assert.ok(
              Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1,
              `${preset.id} at ${aspect.toFixed(2)}: corner on screen`,
            )
            reach = Math.max(reach, Math.abs(p.x), Math.abs(p.y))
          }
      assert.ok(
        reach > 0.9,
        `${preset.id} at ${aspect.toFixed(2)}: fills the screen`,
      )
    }
  }
  const main = table.cameras.find((c) => c.id === 'main')!
  const elevation = (aspect: number) => {
    const f = fitCamera(main, aspect, up)
    const d = f.eye.clone().sub(f.target)
    return Math.atan2(d.y, Math.hypot(d.x, d.z))
  }
  assert.ok(
    elevation(390 / 844) > elevation(1280 / 800) + 0.15,
    'a phone looks down on the table more steeply than a desktop',
  )
  assert.equal(portraitBlend(0.4), 1)
  assert.equal(portraitBlend(1.6), 0)

  // Camera views (kind-pinball/t-021): the player's modes cycle, the full
  // table hands framing to the preset, and the close views are eased and
  // never lose a ball -- a ball anywhere, rising up the table or sitting
  // by the flippers, is always inside the frame.
  assert.deepEqual([...CAMERA_MODES], ['dynamic', 'flippers', 'full'])
  assert.equal(nextCameraMode('full'), 'dynamic')
  assert.ok(isCameraMode('flippers') && !isCameraMode('bogus'))
  const ballAt = (x: number, z: number, id = 1) =>
    ({
      id,
      position: [x, 0.0135, z],
      rotation: [0, 0, 0, 1],
      velocity: [0, 0, 0],
      speed: 0,
      captured: false,
    }) as const
  const mainBox = table.cameras.find((c) => c.id === 'main')!.frame
  assert.equal(
    new CameraFollow(table).step('full', [ballAt(0, -0.5)]),
    null,
    'the full table is the preset framing',
  )
  for (const mode of ['dynamic', 'flippers'] as const) {
    const follow = new CameraFollow(table)
    let last: number | null = null
    let narrowest = Infinity
    // Up the table and back down, along a diagonal.
    const path: Array<[number, number]> = []
    for (let i = 0; i <= 240; i++) {
      const u = i <= 120 ? i / 120 : (240 - i) / 120
      path.push([
        -0.2 + 0.45 * u,
        mainBox.max[2] - u * (mainBox.max[2] - mainBox.min[2] - 0.05),
      ])
    }
    for (const [x, z] of path) {
      const shot = follow.step(mode, [ballAt(x, z)])!
      assert.ok(shot, `${mode}: a close shot`)
      const { min, max } = shot.frame
      assert.ok(
        x >= min[0] && x <= max[0] && z >= min[2] && z <= max[2],
        `${mode}: the ball (${x.toFixed(2)}, ${z.toFixed(2)}) is in frame`,
      )
      assert.ok(
        min[0] >= mainBox.min[0] - 1e-9 && max[2] <= mainBox.max[2] + 1e-9,
        `${mode}: the frame stays on the table`,
      )
      narrowest = Math.min(narrowest, max[0] - min[0])
      const centre = (min[2] + max[2]) / 2
      if (last !== null && Math.abs(z - path[0]![1]) < 0.01)
        assert.ok(Math.abs(centre - last) < 0.2, `${mode}: no jump`)
      last = centre
    }
    assert.ok(
      narrowest < mainBox.max[0] - mainBox.min[0] - 0.01,
      `${mode}: closer than the whole table`,
    )
  }
  {
    // Settled on the flippers, then a ball up the table pulls the view up.
    const follow = new CameraFollow(table)
    const down = [ballAt(0, 0.08)]
    let shot = follow.step('dynamic', down)!
    for (let i = 0; i < 200; i++) shot = follow.step('dynamic', down)!
    const flipperZ = table.flippers[0]!.pivot[2]
    assert.ok(
      shot.frame.min[2] < flipperZ && shot.frame.max[2] > flipperZ,
      'settled on the flippers',
    )
    for (let i = 0; i < 200; i++)
      shot = follow.step('dynamic', [ballAt(0, -0.7)])!
    assert.ok(shot.frame.max[2] < flipperZ, 'follows a high ball up the table')
    // Eased back to the whole table: the framing returns to the preset.
    let out: unknown = shot
    for (let i = 0; i < 400 && out; i++)
      out = follow.step('full', [ballAt(0, -0.7)])
    assert.equal(out, null, 'full table hands the camera back to the preset')
    // Balls too far apart for a close view: the whole table.
    const wide = new CameraFollow(table)
    let spread = wide.step('dynamic', [
      ballAt(-0.2, -0.8, 1),
      ballAt(0.2, 0.1, 2),
    ])!
    for (let i = 0; i < 300; i++)
      spread = wide.step('dynamic', [
        ballAt(-0.2, -0.8, 1),
        ballAt(0.2, 0.1, 2),
      ])!
    assert.ok(
      spread.frame.max[2] - spread.frame.min[2] > 0.85,
      'multiball spread frames the whole table',
    )
  }

  // Quality tiers come from measured frame time, step down while slow, and
  // never climb back to a tier that failed.
  const governor = new QualityGovernor('high')
  const feed = (ms: number, frames: number) => {
    const changes: string[] = []
    for (let i = 0; i < frames; i++) {
      const tier = governor.sample(ms)
      if (tier) changes.push(tier)
    }
    return changes
  }
  assert.deepEqual(feed(16.7, 2000), [], 'full rate at high stays high')
  assert.deepEqual(feed(30, 400), ['medium', 'low'], 'slow frames step down')
  assert.deepEqual(feed(16.7, 3000), [], 'a failed tier is not retried')
  assert.deepEqual(feed(5000, 400), [], 'stalls (a hidden tab) are not frames')
  const recovering = new QualityGovernor('high')
  for (let i = 0; i < 400; i++) recovering.sample(19)
  assert.equal(recovering.tier, 'high', 'just under 50 FPS is not slow')
  const pinned = new QualityGovernor('high')
  pinned.force('low')
  for (let i = 0; i < 2000; i++) pinned.sample(2)
  assert.equal(pinned.tier, 'low', 'a pinned tier ignores timing')
  pinned.force(null)
  assert.ok(pinned.stats().p95Ms >= pinned.stats().averageMs - 1e-9)
  assert.ok(
    TIER_SETTINGS.low.shadowMapSize === 0 && TIER_SETTINGS.low.bloomScale === 0,
    'the low tier draws no shadow map and no bloom',
  )
  for (const tier of ['high', 'medium', 'low'] as const)
    assert.ok(TIER_SETTINGS[tier].maxPixelRatio <= 2, 'DPR is capped at 2')

  // The table's lamps: unique ids, real shots and flashers behind them, and
  // every lamp the lamp matrix drives exists on the table.
  const inserts = table.inserts ?? []
  const flashers = table.flashers ?? []
  const ids = [...inserts.map((i) => i.id), ...flashers.map((f) => f.id)]
  assert.equal(new Set(ids).size, ids.length, 'lamp ids are unique')
  for (const insert of inserts) {
    if (insert.shot)
      assert.ok(
        table.shots.some((s) => s.id === insert.shot),
        `${insert.id} points at a real shot`,
      )
    if (insert.flasher)
      assert.ok(
        flashers.some((f) => f.id === insert.flasher),
        `${insert.id} fires a real flasher`,
      )
  }
  for (const shot of table.shots.filter((s) => s.id !== 'secret'))
    assert.ok(
      inserts.some((i) => i.shot === shot.id),
      `${shot.id} has an insert (only the secret has none)`,
    )
  const start = lampStates(initialRules(table.balls), table)
  for (const id of Object.keys(start.lamps))
    assert.ok(ids.includes(id), `${id} is a table lamp`)
  for (const id of [
    'arrow-lock',
    'arrow-left-orbit',
    'lamp-award',
    'lamp-kickback',
    'lamp-net-n',
    'arrow-sub-home',
    'flasher-secret',
    ...RAINBOW_LAMPS,
  ])
    assert.ok(ids.includes(id), `the lamp matrix's ${id} is on the table`)

  // What the lamps say: the state of the game, readable at a glance.
  assert.equal(start.lamps['arrow-left-ramp'], 'on', 'shots start lit')
  assert.equal(start.lamps['arrow-lock'], 'off', 'the lock starts unlit')
  assert.equal(start.lamps['lamp-kickback'], 'on', 'the kickback starts lit')
  assert.equal(start.gi, 1)
  const lit: PinballRulesState = {
    ...initialRules(table.balls),
    dropsDown: { ami: ['drop-a', 'drop-m', 'drop-i'] },
    sub: {
      ...initialRules(table.balls).sub,
      doorOpen: true,
      closesAt: 1e9,
      nets: ['net-n'],
    },
    bonusMultiplier: 3,
    kickbackLit: false,
  }
  const lamps = lampStates(lit, table).lamps
  assert.equal(
    lamps['arrow-lock'],
    'blink',
    'the A-M-I bank down lights the lock',
  )
  assert.equal(lamps['lamp-drop-m'], 'on')
  assert.equal(
    lamps['arrow-left-orbit'],
    'blink',
    'an open door lights the way',
  )
  assert.equal(lamps['flasher-secret'], 'blink')
  assert.equal(lamps['lamp-kickback'], 'off')
  assert.equal(lamps['lamp-net-n'], 'on')
  assert.equal(lamps['lamp-net-e'], 'off')
  assert.deepEqual(
    RAINBOW_LAMPS.map((id) => lamps[id]),
    ['on', 'on', 'off', 'off', 'off', 'off'],
    'the rainbow counts the bonus multiplier',
  )
  const tilted = lampStates({ ...lit, tilted: true }, table)
  assert.equal(tilted.gi, 0, 'a tilt puts the GI out')
  assert.ok(
    Object.values(tilted.lamps).every((l) => l === 'off'),
    'and every lamp',
  )
  // The attract show cycles its patterns, always lit, always moving.
  for (let pattern = 0; pattern < 4; pattern++) {
    const at = pattern * ATTRACT_PATTERN_TICKS
    const frames = [0, 20, 40, 60, 80].map(
      (t) => attractShow(table, at + t).lamps,
    )
    assert.ok(
      frames.some((f) => Object.values(f).includes('on')),
      `attract pattern ${pattern} lights lamps`,
    )
    assert.ok(
      frames.some((f) => JSON.stringify(f) !== JSON.stringify(frames[0])),
      `attract pattern ${pattern} moves`,
    )
  }

  // Light shows (t-009): what starts them, what they do, when they end.
  const base = initialRules(table.balls)
  const madeRamp = { ...base, shotsMade: { 'left-ramp': 1 } }
  const triggered = showTriggers(base, madeRamp, 100)
  assert.deepEqual(
    triggered,
    [{ id: 'shot', start: 100, shot: 'left-ramp' }],
    'a made shot starts its sweep',
  )
  const sweep = applyShows(lampStates(madeRamp, table), triggered, table, 102)
  assert.equal(sweep.lamps['flasher-left'], 'on', 'and fires its flasher')
  const after = applyShows(
    lampStates(madeRamp, table),
    triggered,
    table,
    100 + SHOW_TICKS.shot,
  )
  assert.deepEqual(
    after,
    lampStates(madeRamp, table),
    'a finished show leaves the matrix as it was',
  )
  assert.deepEqual(
    showTriggers(base, { ...base, bonusMultiplier: 2 }, 5).map((x) => x.id),
    ['multiplier'],
  )
  assert.deepEqual(
    showTriggers(base, { ...base, sub: { ...base.sub, found: 1 } }, 5).map(
      (x) => x.id,
    ),
    ['secret'],
  )
  const secret = applyShows(
    lampStates(base, table),
    [{ id: 'secret', start: 0 }],
    table,
    10,
  )
  assert.ok(secret.gi < 0.5, 'finding the room drops the GI')
  const drained = { ...base, lives: base.lives - 1, ball: base.ball + 1 }
  const drain = showTriggers(base, drained, 50)
  assert.deepEqual(
    drain.map((x) => x.id),
    ['drain', 'ball-start'],
  )
  assert.ok(
    drain[1]!.start >= drain[0]!.start + SHOW_TICKS.drain,
    "the next ball's wave waits for the drain to finish",
  )
  assert.equal(
    showTriggers(base, { ...base, lives: 0, over: true }, 5).length,
    0,
    'game over plays no ball-start',
  )
  assert.equal(
    showTriggers(base, { ...base, kickbackLit: false }, 5)[0]?.id,
    'kickback',
  )
  const many = Array.from({ length: 6 }, (_, i) => ({
    id: 'shot' as const,
    start: i,
    shot: 'lock',
  }))
  assert.equal(liveShows(many, 6).length, MAX_SHOWS, 'shows are capped')
  assert.equal(liveShows(many, 100).length, 0, 'and expire')

  // The generated playfield art covers exactly the playfield.
  const art = table.art?.playfield
  const field = table.colliders.find((c) => c.id === 'playfield')
  assert.ok(art && field && field.kind === 'box')
  if (art && field && field.kind === 'box') {
    assert.ok(art.src.startsWith('/images/'), 'art is served from /images/')
    for (const [value, expected] of [
      [art.min[0], field.at[0] - field.half[0]],
      [art.max[0], field.at[0] + field.half[0]],
      [art.min[1], field.at[2] - field.half[2]],
      [art.max[1], field.at[2] + field.half[2]],
    ])
      assert.ok(
        Math.abs(value! - expected!) < 1e-9,
        'art rectangle = playfield',
      )
  }

  // The scene: lamps follow the matrix, pulses and tiers are safe without
  // WebGL, and nothing leaks.
  const resources = liveRenderResources()
  const scene = new PinballScene(table, {} as HTMLCanvasElement, () =>
    stubRenderer({ disposed: 0, frames: 0 }),
  )
  scene.resize(390, 844, 3)
  scene.setLamps(lamps, 1)
  assert.equal(scene.lampLevels()['arrow-lock'], 'blink')
  for (const shot of table.shots) scene.pulse(shot.id)
  for (const tier of ['low', 'medium', 'high'] as const) {
    scene.forceQuality(tier)
    assert.equal(scene.quality, tier)
    for (let i = 0; i < 5; i++) scene.render()
  }
  scene.forceQuality(null)
  assert.equal(scene.stats().tier, 'high')
  scene.dispose()
  assert.equal(
    liveRenderResources(),
    resources,
    'the hero pass frees everything',
  )

  // The runtime lights the table from its rules every tick.
  const runtime = new PinballRuntime(
    { rng: mulberry32(4), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  runtime.mount({} as HTMLCanvasElement)
  runtime.update(emptyInput())
  const shown = (runtime as unknown as { scene: PinballScene }).scene
  assert.deepEqual(
    shown.lampLevels(),
    lampStates(initialRules(table.balls), table).lamps,
    'the runtime shows the lamp matrix',
  )
  runtime.forceQuality('low')
  assert.equal(runtime.renderStats()?.tier, 'low')
  runtime.dispose()
}

async function runPinballDmd() {
  // conductor kind-pinball/t-006: the physical DMD's queue and scenes.
  // Read through a call: TypeScript would narrow a bare `queue.showing` to
  // null after the first assertion that it is null.
  const up = (q: DmdQueue) => q.showing
  const step = (queue: DmdQueue, ms: number) => {
    for (let t = 0; t < ms; t += 10) queue.tick(10)
  }

  // Nothing queued: the score is up.
  const queue = new DmdQueue()
  assert.equal(up(queue), null)

  // A scene shows, runs its length, and the score comes back.
  queue.push({ scene: 'message', text: 'LOCK IS LIT', ms: 1000 })
  assert.equal(up(queue)?.request.text, 'LOCK IS LIT')
  step(queue, 1010)
  assert.equal(up(queue), null, 'a message ends')

  // Higher priority takes over once the current scene has had its minimum.
  queue.push({ scene: 'message', text: 'A' })
  queue.push({ scene: 'jackpot', value: 1e6 })
  assert.equal(up(queue)?.request.text, 'A', 'the minimum is honoured')
  step(queue, DMD_SCENES.message.minMs + 10)
  assert.equal(up(queue)?.request.scene, 'jackpot', 'then the jackpot')
  step(queue, DMD_SCENES.jackpot.durationMs)
  assert.equal(up(queue), null, 'the preempted message is not replayed')

  // Equal or lower priority waits its turn, in order, and goes stale.
  queue.push({ scene: 'skill-shot', value: 5 })
  queue.push({ scene: 'message', text: 'FIRST' })
  queue.push({ scene: 'message', text: 'SECOND' })
  step(queue, DMD_SCENES['skill-shot'].durationMs + 10)
  assert.equal(up(queue)?.request.text, 'FIRST', 'waiting scenes in order')
  step(queue, MAX_WAIT_MS)
  assert.equal(up(queue), null, 'a scene that waited too long is dropped')
  queue.reset()

  // Gameplay timers outrank celebrations: a jackpot interrupts a mode
  // countdown only briefly, and the countdown comes back where it was.
  queue.push({ scene: 'mode-timer', text: 'NET DROP', value: 30 })
  step(queue, 500)
  queue.push({ scene: 'message', text: 'NICE' })
  assert.equal(up(queue)?.request.scene, 'mode-timer', 'a message waits')
  queue.push({ scene: 'jackpot', value: 5e5 })
  assert.equal(up(queue)?.request.scene, 'jackpot', 'a jackpot shows')
  step(queue, TIMER_INTERRUPT_MS + 10)
  assert.equal(up(queue)?.request.scene, 'mode-timer', 'only briefly')
  assert.ok(up(queue)!.elapsed >= 500, 'the timer resumes where it was')
  queue.push({ scene: 'mode-timer', text: 'NET DROP', value: 12 })
  assert.equal(up(queue)?.request.value, 12, 'a timer updates in place')
  assert.equal(
    [up(queue), ...queue.pending].filter(
      (s) => s?.request.scene === 'mode-timer',
    ).length,
    1,
  )
  queue.push({ scene: 'tilt' })
  assert.equal(up(queue)?.request.scene, 'tilt', 'a tilt beats a timer')
  step(queue, 10_000)
  assert.equal(up(queue)?.request.scene, 'tilt', 'and holds')
  queue.clear('tilt')
  assert.equal(up(queue)?.request.scene, 'mode-timer', 'until cleared')
  queue.clear('mode-timer')
  assert.equal(up(queue), null)

  // Every scene draws something, at its start, middle and end.
  const dmd = new Dmd()
  const idle = { score: 1234567, ball: 2, multiplier: 3 }
  const lit = () => dmd.buf.reduce((n, v) => n + (v >= 1 ? 1 : 0), 0)
  for (const scene of Object.keys(DMD_SCENES) as DmdSceneId[]) {
    const q = new DmdQueue()
    q.push({
      scene,
      text: scene === 'message' ? 'A DOOR CREAKS...' : undefined,
      sub: scene === 'message' ? 'SOMEWHERE' : undefined,
      value: 2_500_000,
      items: [
        { label: 'NETS', value: 30_000 },
        { label: 'HOUSES', value: 50_000 },
      ],
    })
    // Sampled after the 300 ms entrances (type-on, slide-in) have run.
    let at = 0
    for (const next of [300, 900, 1800]) {
      step(q, next - at)
      at = next
      const showing = q.showing
      if (!showing) break
      drawDmd(dmd, showing, idle, q.now)
      assert.ok(lit() > 20, `${scene} at ${at} ms lights the display`)
    }
  }
  drawDmd(dmd, null, idle, 0)
  assert.ok(lit() > 60, 'the idle score lights the display')
  for (const page of [0, 1, 2, 3]) {
    drawDmd(dmd, null, { ...idle, attract: true, highScore: 9e6 }, page * 2500)
    assert.ok(lit() > 20, `attract page ${page} lights the display`)
  }
  assert.equal(formatScore(1234567), '1,234,567')
  assert.equal(fitScale('1,234,567'), 2, 'a seven-digit score drops a size')
  assert.equal(fitScale('12,345'), 3, 'a short one is big')
  assert.equal(fitScale('MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM'), 1)

  // The runtime: the rules' effects reach the display.
  const table = AMI_VILLAGE_GREYBOX
  const runtime = new PinballRuntime(
    { rng: mulberry32(5), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  runtime.update(emptyInput())
  assert.equal(
    runtime.dmdQueue.showing?.request.scene,
    'ball',
    'a new game puts BALL 1 up',
  )
  const shown = runtime.dmd.buf.reduce((n, v) => n + (v >= 2 ? 1 : 0), 0)
  assert.ok(shown > 20, 'and draws it')
  const inner = runtime as unknown as {
    apply(event: unknown): void
    steps: number
  }
  // A lone nudge is free; two warnings; the fourth tilts.
  for (let i = 0; i < 4; i++) inner.apply({ type: 'nudge', tick: i * 10 })
  assert.equal(runtime.dmdQueue.showing?.request.scene, 'tilt', 'a tilt shows')
  inner.apply({
    type: 'switch',
    event: { type: 'drain', ballId: 0 },
    tick: 1000,
  })
  assert.notEqual(
    runtime.dmdQueue.showing?.request.scene,
    'tilt',
    'and clears when the ball drains',
  )
  runtime.dispose()

  // The table puts the DMD in the backbox, and the main camera keeps it on
  // screen at every aspect.
  const panel = table.dmd
  assert.ok(panel, 'Table 1 has a DMD')
  const main = table.cameras.find((c) => c.id === 'main')!
  assert.ok((main.include ?? []).length >= 2, 'the camera frames the DMD')
}

async function runPinballRules() {
  // conductor kind-pinball/t-007: Table 1's rules depth, replayed through the
  // pure reducer with no physics or WebGL.
  const table = AMI_VILLAGE_GREYBOX
  const context = { shots: table.shots }
  let tick = 0
  let effects: RuleEffect[] = []
  const feed = (state: PinballRulesState, event: SwitchEvent, at?: number) => {
    tick = at ?? tick + 10
    const step = stepRules(state, { type: 'switch', event, tick }, context)
    effects = step.effects
    return step.state
  }
  const wait = (state: PinballRulesState, steps: number) => {
    const all: RuleEffect[] = []
    let next = state
    for (let i = 0; i < steps; i += 10) {
      tick += 10
      const step = stepRules(next, { type: 'tick', tick }, context)
      all.push(...step.effects)
      next = step.state
    }
    effects = all
    return next
  }
  /** Make a shot: its switches in order, by the same ball. */
  const make = (state: PinballRulesState, id: string, ballId = 1) => {
    const def = table.shots.find((s) => s.id === id)!
    const all: RuleEffect[] = []
    let next = state
    for (const sensor of def.sensors) {
      const event: SwitchEvent =
        def.kind === 'scoop'
          ? { type: 'capture', id: sensor, ballId }
          : def.kind === 'spinner'
            ? { type: 'spin', id: sensor, ballId, speed: 2 }
            : { type: 'sensor-enter', id: sensor, ballId }
      next = feed(next, event)
      all.push(...effects)
    }
    effects = all
    return next
  }
  type DmdEffect = Extract<RuleEffect, { type: 'dmd' }>
  const scene = (name: string) =>
    effects.find((e): e is DmdEffect => e.type === 'dmd' && e.scene === name)
  const said = (text: string) =>
    effects.some((e) => e.type === 'dmd' && e.text === text)
  const drain = (state: PinballRulesState, ballId = 1) =>
    feed(state, { type: 'drain', ballId })
  const start = (seed = 7) => {
    tick = 0
    return stepRules(initialRules(3, seed), { type: 'start' }, context).state
  }
  const plunge = (state: PinballRulesState) =>
    feed(state, { type: 'sensor-enter', id: 'shooter-exit', ballId: 1 })
  /** Long enough for the ball save, a combo and a skill shot to lapse. */
  const LATER = BALL_SAVE_STEPS + COMBO_STEPS + SKILL_STEPS

  // Switches score.
  let s = start()
  s = feed(s, {
    type: 'contact',
    id: 'sling-left-kicker',
    ballId: 1,
    impulse: 1,
  })
  assert.equal(s.score, VALUES.sling)
  s = feed(s, { type: 'spin', id: 'spinner', ballId: 1, speed: 2 })
  assert.ok(s.score > VALUES.sling, 'the spinner scores')

  // The skill shot: the plunge lights a shot the left flipper can make;
  // made first, soon after the plunge, it pays (t-013: no plunge reaches the
  // bumpers, so they could never be the skill shot).
  s = plunge(start())
  assert.ok(said('SKILL SHOT'), 'the plunge invites the skill shot')
  const target = s.play.skill.target
  assert.ok(['upper-feed', 'spinner', 'right-ramp'].includes(target))
  assert.equal(lampStates(s, table).lamps[`arrow-${target}`], 'blink')
  let before = s.score
  s = make(s, target)
  assert.ok(scene('skill-shot'), 'the lit shot is the skill shot')
  assert.ok(s.score - before >= VALUES.skillShot)
  s = wait(s, COMBO_STEPS + 20)
  s = make(s, target)
  assert.ok(!scene('skill-shot'), 'only once')
  s = plunge(start())
  const other = ['upper-feed', 'spinner', 'right-ramp'].find(
    (id) => id !== s.play.skill.target,
  )!
  s = make(s, other)
  s = wait(s, COMBO_STEPS + 20)
  s = make(s, s.play.skill.target)
  assert.ok(!scene('skill-shot'), 'a different shot first is no skill shot')
  s = plunge(start())
  s = wait(s, SKILL_STEPS + 20)
  s = make(s, s.play.skill.target)
  assert.ok(!scene('skill-shot'), 'nor is a late one')

  // Combos: ramps and orbits chained quickly, worth more each step.
  s = plunge(start())
  s = make(s, 'left-ramp')
  assert.equal(s.play.combo.count, 0)
  before = s.score
  s = make(s, 'right-orbit')
  assert.ok(said('2-WAY COMBO'))
  assert.equal(s.score - before, VALUES.orbit + VALUES.comboBase)
  s = make(s, 'right-ramp')
  assert.ok(said('3-WAY COMBO'))
  s = wait(s, COMBO_STEPS + 20)
  s = make(s, 'left-orbit')
  assert.equal(s.play.combo.count, 0, 'a slow shot starts over')

  // Locks: lit by the A-M-I bank; the third starts AMI multiball.
  const lockOne = (state: PinballRulesState) => {
    let next = state
    for (const id of ['drop-a', 'drop-m', 'drop-i'])
      next = feed(next, { type: 'drop', id, bank: 'ami', ballId: 1 })
    return make(next, 'lock')
  }
  s = plunge(start())
  s = make(s, 'lock')
  assert.equal(s.play.locks, 0, 'an unlit lock is just a scoop')
  s = lockOne(s)
  assert.equal(s.play.locks, 1)
  assert.equal(scene('lock')?.text, 'LOCK 1')
  s = wait(s, LATER)
  const beforeMultiball = s
  s = lockOne(s)
  assert.ok(s.play.multiball.running, "the game's first multiball: two locks")
  assert.equal(s.play.multiballs, 1)
  assert.ok(
    showTriggers(beforeMultiball, s, 0).some((show) => show.id === 'secret'),
    'multiball starts with a light show',
  )
  assert.ok(scene('multiball'))
  assert.ok(
    effects.some((e) => e.type === 'add-ball' && e.count === MULTIBALL_ADDS),
    'the runtime is asked for the extra balls',
  )
  assert.equal(s.ballsInPlay, 1 + MULTIBALL_ADDS)
  assert.equal(s.play.locks, 0)
  // Every multiball after the first takes three.
  let later: PinballRulesState = {
    ...beforeMultiball,
    play: { ...beforeMultiball.play, multiballs: 1 },
  }
  later = lockOne(later)
  assert.ok(!later.play.multiball.running, 'later ones take three locks')
  assert.equal(scene('lock')?.sub, 'MULTIBALL IN 1')
  // A drain in the multiball ball save comes straight back.
  s = drain(s, 2)
  assert.equal(s.ballsInPlay, 1 + MULTIBALL_ADDS, 'saved')
  assert.ok(effects.some((e) => e.type === 'add-ball'))
  // Ramps are jackpots; two light the super jackpot at the lock.
  before = s.score
  s = make(s, 'left-ramp')
  assert.equal(scene('jackpot')?.value, VALUES.jackpot)
  s = wait(s, COMBO_STEPS + 20)
  s = make(s, 'right-ramp')
  assert.equal(
    scene('jackpot')?.value,
    VALUES.jackpot + VALUES.jackpotStep,
    'each jackpot is worth more',
  )
  assert.ok(s.play.multiball.superLit)
  assert.equal(lampStates(s, table).lamps['arrow-lock'], 'blink')
  assert.equal(lampStates(s, table).lamps['arrow-left-ramp'], 'blink')
  const beforeSuper = s
  s = make(s, 'lock')
  assert.ok(scene('super-jackpot'))
  assert.ok(
    showTriggers(beforeSuper, s, 0).some((show) => show.id === 'jackpot'),
    'a super jackpot lights the whole table',
  )
  assert.ok(s.score - before > VALUES.superJackpot + 2 * VALUES.jackpot)
  assert.ok(!s.play.multiball.superLit)
  // After the save, drains take balls away; one left ends multiball.
  s = wait(s, LATER)
  s = drain(s, 2)
  s = drain(s, 3)
  assert.equal(s.ballsInPlay, 1)
  assert.ok(!s.play.multiball.running, 'one ball left: multiball is over')
  assert.equal(s.lives, 3, 'and no ball was lost')

  // The village map: the saucer starts a village's timed mode.
  s = plunge(start(3))
  assert.equal(lampStates(s, table).lamps['lamp-award'], 'blink')
  s = make(s, 'award')
  const mode = s.play.villages.mode!
  const village = VILLAGES[mode.village]!
  assert.ok(scene('mode-intro'), 'the village is announced')
  assert.equal(scene('mode-intro')?.text, village.name)
  assert.equal(scene('mode-timer')?.value, village.seconds)
  assert.ok(!s.play.villages.scoopLit)
  for (const id of village.shots)
    assert.equal(lampStates(s, table).lamps[`arrow-${id}`], 'blink')
  s = wait(s, PHYSICS_HZ + 10)
  assert.equal(
    scene('mode-timer')?.value,
    village.seconds - 1,
    'the countdown runs',
  )
  for (let i = 0; i < village.need; i++) {
    s = make(s, village.shots[i % village.shots.length]!)
    s = wait(s, 20)
  }
  assert.equal(s.play.villages.mode, null)
  assert.equal(s.play.villages.saved, 1)
  assert.equal(
    s.play.villages.rampsToRelight,
    RAMPS_TO_RELIGHT,
    'the shot that saves a village does not count toward the next',
  )
  // Ramps relight the saucer for the next village.
  s = wait(s, COMBO_STEPS + 20)
  for (let i = 0; i < RAMPS_TO_RELIGHT; i++) {
    s = make(s, 'left-ramp')
    s = wait(s, COMBO_STEPS + 20)
  }
  assert.ok(s.play.villages.scoopLit, 'the ramps relight the saucer')
  s = make(s, 'award')
  const second = s.play.villages.mode!
  assert.notEqual(second.village, mode.village, 'a village is visited once')
  s = wait(s, VILLAGES[second.village]!.seconds * PHYSICS_HZ + 20)
  assert.equal(s.play.villages.mode, null, 'time runs out')
  assert.ok(
    effects.some((e) => e.type === 'dmd-clear' && e.scene === 'mode-timer'),
  )
  assert.ok(scene('mode-total'))
  assert.equal(s.play.villages.saved, 1)

  // The extra ball: lit at the fifth village, collected at the upper feed,
  // played as the same ball.
  s = plunge(start())
  s = {
    ...s,
    play: {
      ...s.play,
      villages: { ...s.play.villages, visited: [0, 1, 2, 3] },
    },
  }
  s = make(s, 'award')
  assert.equal(s.play.villages.visited.length, EXTRA_BALL_AT)
  assert.ok(s.play.extraBallLit && said('EXTRA BALL IS LIT'))
  assert.equal(lampStates(s, table).lamps['arrow-upper-feed'], 'blink')
  s = make(s, 'upper-feed')
  assert.ok(scene('extra-ball'))
  assert.equal(s.play.extraBalls, 1)
  s = wait(s, LATER)
  s = drain(s)
  assert.ok(scene('extra-ball'), 'shoot again')
  assert.equal(s.ball, 1)
  assert.equal(s.lives, 3)
  assert.equal(s.play.villages.mode, null, 'the ball took its village with it')

  // The wizard mode: half the map's villages, then the saucer.
  s = plunge(start())
  s = {
    ...s,
    play: {
      ...s.play,
      villages: {
        ...s.play.villages,
        visited: VILLAGES.slice(0, WIZARD_AT).map((_, i) => i),
      },
    },
  }
  s = make(s, 'award')
  assert.ok(s.play.wizard.running && scene('wizard'))
  assert.ok(
    effects.some((e) => e.type === 'add-ball' && e.count === WIZARD_ADDS),
  )
  assert.equal(lampStates(s, table).lamps['arrow-spinner'], 'blink')
  before = s.score
  s = make(s, 'spinner')
  assert.equal(s.score - before, VALUES.spin + VALUES.wizardShot)
  s = wait(s, LATER)
  s = drain(s, 2)
  s = drain(s, 3)
  assert.ok(!s.play.wizard.running, 'the wizard mode ends with its multiball')
  assert.equal(s.play.villages.visited.length, 0, 'and the map starts over')

  // Ball save: a drain soon after the plunge comes straight back, once.
  s = plunge(start())
  s = drain(s)
  assert.ok(said('BALL SAVED'))
  assert.equal(s.lives, 3)
  assert.equal(s.ballsInPlay, 1)
  s = drain(s)
  assert.equal(s.lives, 2, 'the save is used up')
  assert.equal(s.ball, 2)

  // The bonus counts the ball's shots, times the multiplier.
  s = plunge(start())
  s = make(s, 'left-ramp')
  s = wait(s, LATER)
  s = make(s, 'right-orbit')
  s = { ...s, bonusMultiplier: 2 }
  before = s.score
  s = drain(s)
  const bonusScene = scene('bonus')
  assert.ok(bonusScene)
  assert.equal(bonusScene.value, 2)
  assert.equal(
    s.score - before,
    2 * (VALUES.bonusRamp + VALUES.bonusOrbit),
    'the bonus is added',
  )
  assert.equal(s.play.stats.ramps, 0, 'and the next ball starts afresh')

  // Tilt: no points, no bonus.
  s = plunge(start())
  s = make(s, 'left-ramp')
  // A free nudge, two warnings, then the tilt.
  for (let i = 0; i < 4; i++)
    s = stepRules(s, { type: 'nudge', tick: tick + i * 10 }, context).state
  tick += 40
  assert.ok(s.tilted)
  before = s.score
  s = feed(s, { type: 'contact', id: 'pop-left', ballId: 1, impulse: 1 })
  s = make(s, 'right-ramp')
  s = wait(s, LATER)
  s = drain(s)
  assert.equal(s.score, before, 'a tilted ball scores nothing')
  assert.ok(!scene('bonus'))

  // Match: the last drain draws a digit; a match plays one more ball.
  const last = (score: number) => ({
    ...plunge(start()),
    score,
    lives: 1,
  })
  const [r] = nextRandom(last(0).play.seed)
  const digit = Math.floor(r * 10) % 10
  s = wait(last(1000 + digit * 10), LATER)
  s = drain(s)
  assert.ok(scene('match'), 'a match')
  assert.ok(!s.over && s.lives === 1)
  s = wait(last(1000 + ((digit + 1) % 10) * 10), LATER)
  s = drain(s)
  assert.ok(s.over, 'no match: game over')
  s = wait(last(0), LATER)
  s = drain(s)
  assert.ok(s.over, 'no score, no match')

  // Replays are exact: the same events make the same game.
  const replay = () => {
    let r = plunge(start(11))
    for (const id of ['left-ramp', 'award', 'right-orbit', 'spinner'])
      r = make(r, id)
    r = lockOne(r)
    return JSON.stringify(r)
  }
  assert.equal(replay(), replay())

  // The runtime puts the balls the rules ask for on the plunger and fires
  // them, one at a time.
  const runtime = new PinballRuntime(
    { rng: mulberry32(9), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const inner = runtime as unknown as {
    effect(effect: RuleEffect): void
    physics: PinballPhysics
    rules: PinballRulesState
  }
  for (let t = 0; t < 60; t++) runtime.update(emptyInput())
  const fire = emptyInput()
  fire.pressed.a = true
  runtime.update(fire)
  for (let t = 0; t < 60; t++) runtime.update(emptyInput())
  inner.effect({ type: 'add-ball', count: 2 })
  // Launched, each one goes up the table.
  inner.rules = { ...inner.rules, ballsInPlay: 3 }
  const upTable = new Set<number>()
  for (let t = 0; t < 600; t++) {
    runtime.update(emptyInput())
    for (const ball of inner.physics.ballViews())
      if (ball.position[2] < -0.3) upTable.add(ball.id)
  }
  assert.ok(upTable.size >= 3, 'multiball launches two more balls')
  runtime.dispose()
}

async function runPinballSubRules() {
  // conductor kind-pinball/t-012: the hidden room's rules. Discovery gets
  // harder, the room plays its own hurry-up and music, a village's clock
  // waits for the ball, and the rewards ride home.
  const table = AMI_VILLAGE_GREYBOX
  const context = { shots: table.shots }
  let tick = 0
  let effects: RuleEffect[] = []
  const feed = (state: PinballRulesState, event: SwitchEvent) => {
    tick += 10
    const step = stepRules(state, { type: 'switch', event, tick }, context)
    effects = step.effects
    return step.state
  }
  const wait = (state: PinballRulesState, steps: number) => {
    const all: RuleEffect[] = []
    let next = state
    const until = tick + steps
    while (tick < until) {
      tick += 10
      const step = stepRules(next, { type: 'tick', tick }, context)
      all.push(...step.effects)
      next = step.state
    }
    effects = all
    return next
  }
  const capture = (state: PinballRulesState, id: string, ballId = 1) =>
    feed(state, { type: 'capture', id, ballId })
  const said = (text: string) =>
    effects.some((e) => e.type === 'dmd' && e.text === text)
  type DmdEffect = Extract<RuleEffect, { type: 'dmd' }>
  const scene = (name: string) =>
    effects.find((e): e is DmdEffect => e.type === 'dmd' && e.scene === name)
  const opened = () =>
    effects.some(
      (e) =>
        e.type === 'mechanism' && e.id === 'secret-door' && e.action === 'open',
    )
  const nets = (state: PinballRulesState) => {
    let next = state
    for (const id of ['net-n', 'net-e', 'net-t'])
      next = feed(next, { type: 'contact', id, ballId: 1, impulse: 1 })
    return next
  }
  const start = () => {
    tick = 0
    return stepRules(initialRules(3, 21), { type: 'start' }, context).state
  }

  // Discovery: the first visit takes one lock; the door creaks and, if
  // nobody finds it, shuts again with a last tease.
  assert.deepEqual([0, 1, 2, 3, 9].map(keysNeeded), [1, 2, 3, 3, 3])
  assert.ok(doorSteps(1) < doorSteps(0) && doorSteps(9) >= PHYSICS_HZ * 10)
  let s = start()
  s = capture(s, 'lock')
  assert.ok(s.sub.doorOpen && opened() && said('A DOOR CREAKS...'))
  assert.ok(
    effects.some((e) => e.type === 'sound' && e.name === 'secret-tease'),
  )
  assert.equal(lampStates(s, table).lamps['flasher-secret'], 'blink')
  s = wait(s, doorSteps(0) + 20)
  assert.ok(!s.sub.doorOpen && said('THE DOOR SHUTS...'))

  // Found: NET RUN starts, the room has its own music.
  s = capture(s, 'lock')
  s = capture(s, 'secret-hole')
  assert.equal(s.sub.found, 1)
  assert.ok(s.sub.inRoom)
  assert.equal(scene('mode-intro')?.sub, 'YOU FOUND IT')
  assert.equal(musicFor(s), 'sub-table')
  s = wait(s, PHYSICS_HZ + 10)
  const timer = scene('mode-timer')
  assert.equal(timer?.text, 'NET RUN')
  assert.equal(timer?.value, HURRY_SECONDS - 1)
  // The hurry-up runs down to its floor.
  assert.equal(hurryValue(s.sub, s.sub.hurryAt), HURRY_START)
  assert.ok(
    hurryValue(s.sub, s.sub.hurryAt + PHYSICS_HZ * 10) < HURRY_START &&
      hurryValue(s.sub, s.sub.hurryAt + PHYSICS_HZ * 10) > HURRY_FLOOR,
  )
  assert.equal(
    hurryValue(s.sub, s.sub.hurryAt + PHYSICS_HZ * HURRY_SECONDS * 2),
    HURRY_FLOOR,
  )

  // HOME with the nets: the hurry-up, +2x, a village rescued on the map and
  // doubled jackpots.
  s = nets(s)
  let before = s.score
  const collect = hurryValue(s.sub, tick + 10)
  s = capture(s, 'sub-home')
  assert.ok(s.score - before >= collect, 'the hurry-up is collected')
  assert.equal(scene('mode-total')?.value, collect)
  assert.equal(s.bonusMultiplier, 3)
  assert.equal(s.play.villages.visited.length, 1, 'a village is rescued')
  assert.equal(s.play.villages.saved, 1)
  assert.equal(s.play.jackpotX, 2)
  assert.ok(!s.sub.inRoom)
  assert.equal(musicFor(s), null)
  assert.ok(
    effects.some((e) => e.type === 'dmd-clear' && e.scene === 'mode-timer'),
  )

  // Rediscovery is harder: two locks, and a shorter door.
  s = capture(s, 'lock')
  assert.ok(!s.sub.doorOpen && said('THE DOOR RATTLES'))
  s = capture(s, 'lock')
  assert.ok(s.sub.doorOpen)
  assert.equal(s.sub.closesAt, tick + doorSteps(1))
  s = capture(s, 'secret-hole')
  assert.equal(scene('mode-intro')?.sub, 'WELCOME BACK')
  assert.equal(
    hurryValue(s.sub, s.sub.hurryAt),
    HURRY_START + HURRY_RAISE,
    'each visit is worth more',
  )
  // Past the room's flippers: no hurry-up, nothing but the nets' 1x.
  before = s.score
  s = capture(s, 'sub-drain')
  assert.equal(s.score, before)
  assert.equal(s.bonusMultiplier, 3)
  // A plain HOME relights the saucer when a village needs relighting.
  s = {
    ...s,
    play: {
      ...s.play,
      villages: { ...s.play.villages, scoopLit: false, rampsToRelight: 2 },
    },
  }
  for (let i = 0; i < 3; i++) s = capture(s, 'lock')
  s = capture(s, 'secret-hole')
  s = capture(s, 'sub-home')
  assert.ok(s.play.villages.scoopLit && said('VILLAGE IS LIT'))

  // A village's clock waits while the ball is in the room.
  s = start()
  s = capture(s, 'award')
  const mode = s.play.villages.mode!
  s = capture(s, 'lock')
  s = capture(s, 'secret-hole')
  assert.equal(s.play.villages.mode?.pausedAt, tick)
  assert.equal(musicFor(s), 'sub-table')
  const away = PHYSICS_HZ * 8
  s = wait(s, away)
  assert.ok(!scene('mode-total'), 'the village does not time out meanwhile')
  s = capture(s, 'sub-drain')
  const resumed = s.play.villages.mode!
  assert.ok(resumed.endsAt >= mode.endsAt + away, 'the clock picks up again')
  assert.equal(resumed.pausedAt, null)
  assert.equal(scene('mode-timer')?.text, VILLAGES[resumed.village]!.name)
  assert.equal(musicFor(s), 'mode')

  // In multiball, HOME adds a ball, and doubled jackpots pay double.
  s = start()
  s = {
    ...s,
    ballsInPlay: 3,
    play: {
      ...s.play,
      jackpotX: 2,
      multiball: { running: true, jackpots: 0, superLit: false },
    },
  }
  assert.equal(musicFor(s), 'multiball')
  s = capture(s, 'lock')
  s = capture(s, 'secret-hole')
  s = capture(s, 'sub-home')
  assert.ok(effects.some((e) => e.type === 'add-ball' && e.count === 1))
  assert.equal(s.ballsInPlay, 4)
  for (const id of ['left-ramp-entry', 'left-ramp-made'])
    s = feed(s, { type: 'sensor-enter', id, ballId: 2 })
  assert.equal(scene('jackpot')?.value, 2 * VALUES.jackpot)

  // The room feeds the wizard mode: a skilled player rescues villages there.
  s = start()
  s = {
    ...s,
    play: {
      ...s.play,
      villages: {
        ...s.play.villages,
        visited: VILLAGES.slice(1).map((_, i) => i + 1),
      },
    },
  }
  s = capture(s, 'lock')
  s = capture(s, 'secret-hole')
  s = nets(s)
  s = capture(s, 'sub-home')
  assert.equal(s.play.villages.visited.length, VILLAGES.length)
  assert.ok(s.play.villages.scoopLit)
  s = capture(s, 'award')
  assert.ok(s.play.wizard.running, 'the saucer starts the wizard mode')

  // The runtime plays the music the rules call for once audio is unlocked.
  assert.equal(
    musicFor({ ...s, tilted: true }),
    null,
    'a tilted machine is silent',
  )
}

async function runPinballTuning() {
  // conductor kind-pinball/t-013: the tuning harness keeps working. A bot
  // plays a short seeded game on the real physics and rules, the same seed
  // plays the same game, and the aiming chart measures a cradled shot.
  const quick = playGame(BOT_SKILLS.good, 3, null, 1)
  assert.ok(quick.seconds > 0 && quick.seconds <= 60)
  assert.ok(quick.ballSeconds.length >= 1)
  assert.equal(
    JSON.stringify(playGame(BOT_SKILLS.good, 3, null, 1)),
    JSON.stringify(quick),
    'a seeded session replays exactly',
  )
  const summary = summarize('good', [quick])
  assert.equal(summary.games, 1)
  assert.ok(
    summary.drains.outlane + summary.drains.sdtm + summary.drains.center <= 101,
  )
  // Every chart entry is a real shot or nothing; a delay that makes a shot
  // is found by delaysFor.
  const table = AMI_VILLAGE_GREYBOX
  const made = aimedShot(RAPIER, table, 'right', 18)
  assert.ok(made === null || table.shots.some((s) => s.id === made))
  const chart = { left: [null, 'award'], right: [] as Array<string | null> }
  assert.deepEqual(delaysFor(chart, 'left', 'award'), [1])
  // The bot plunges a ball on the plunger.
  const bot = new PinballBot(BOT_SKILLS.novice, mulberry32(1), null)
  const frame = bot.frame({
    balls: [],
    rules: initialRules(3),
    ballOnPlunger: true,
    flippers: table.flippers,
  })
  assert.ok(frame.held.down, 'the bot pulls the plunger')
}

async function runPinballTouch() {
  // conductor kind-pinball/t-010: the touch layout. No d-pad: the lower
  // corners flip, a drag down the lane pulls the plunger, a quick swipe up
  // nudges.
  assert.equal(zoneAt(0.2, 0.8), 'left')
  assert.equal(zoneAt(0.7, 0.8), 'right')
  assert.equal(zoneAt(0.95, 0.8), 'plunger')
  assert.equal(zoneAt(0.95, 0.45), 'right', 'above the strip: the flipper')
  assert.equal(zoneAt(0.5, 0.2), 'none', 'the top of the table is free')
  assert.equal(findArcadeGame('kind-pinball-3d')?.touchLayout, 'pinball')

  let log: string[] = []
  let pull: number | null = null
  const touch = new PinballTouch({
    press: (button, down) => log.push(`${button}:${down ? 'down' : 'up'}`),
    plunger: (depth) => (pull = depth),
  })
  // Flippers, one finger each; two fingers on one side are one press.
  touch.down(1, 0.2, 0.8, 0)
  touch.down(2, 0.3, 0.9, 10)
  touch.down(3, 0.7, 0.8, 20)
  assert.deepEqual(log, ['left:down', 'right:down'])
  touch.up(1)
  assert.deepEqual(log, ['left:down', 'right:down'], 'still one finger left')
  touch.up(2)
  touch.up(3)
  assert.deepEqual(log, ['left:down', 'right:down', 'left:up', 'right:up'])
  // The lane: a tap flips right; a drag down pulls, and letting go fires.
  log = []
  touch.down(4, 0.93, 0.6, 0)
  touch.up(4)
  assert.deepEqual(log, ['right:down', 'right:up'], 'a tap on the lane flips')
  log = []
  touch.down(5, 0.93, 0.6, 0)
  touch.move(5, 0.93, 0.7, 100)
  assert.deepEqual(
    log,
    ['right:down', 'right:up'],
    'a drag lets the flipper go',
  )
  const half = pull!
  assert.ok(half > 0.2 && half < 0.8)
  touch.move(5, 0.93, 0.95, 200)
  assert.equal(pull, 1, 'pulled all the way')
  touch.up(5)
  assert.equal(pull, null, 'let go: the plunger fires')
  // A quick swipe up nudges, once; a slow one does not.
  log = []
  touch.down(6, 0.5, 0.3, 0)
  touch.move(6, 0.5, 0.18, 120)
  touch.move(6, 0.5, 0.05, 180)
  touch.up(6)
  assert.deepEqual(log, ['up:down', 'up:up'])
  log = []
  touch.down(7, 0.5, 0.3, 0)
  touch.move(7, 0.5, 0.1, 900)
  touch.up(7)
  assert.deepEqual(log, [])
  // Everything lets go at once when the overlay hides.
  log = []
  touch.down(8, 0.2, 0.8, 0)
  touch.down(9, 0.93, 0.6, 0)
  touch.move(9, 0.93, 0.8, 50)
  touch.release()
  assert.ok(log.includes('left:up') && pull === null)

  // The runtime: the drag's depth is the pull, and letting go fires the
  // ball as hard as it was pulled.
  const launchSpeed = (depth: number) => {
    const runtime = new PinballRuntime(
      {
        rng: mulberry32(2),
        sound: { play: () => {} },
        demo: false,
        hiScore: 0,
      },
      RAPIER,
      AMI_VILLAGE_GREYBOX,
      () => stubRenderer({ disposed: 0, frames: 0 }),
    )
    const inner = runtime as unknown as { physics: PinballPhysics }
    assert.ok(inner.physics.ballOnPlunger())
    for (let i = 0; i < 5; i++) {
      const frame = emptyInput()
      frame.plunger = depth
      runtime.update(frame)
    }
    assert.ok(inner.physics.ballOnPlunger(), 'held back while pulled')
    runtime.update(emptyInput())
    let top = 0
    for (let i = 0; i < 6; i++) {
      runtime.update(emptyInput())
      top = Math.max(top, ...inner.physics.ballViews().map((b) => b.speed))
    }
    runtime.dispose()
    return top
  }
  const soft = launchSpeed(0.4)
  const hard = launchSpeed(1)
  assert.ok(soft > 0, 'a part pull still fires')
  assert.ok(hard > soft * 1.3, `a full pull fires harder (${soft}, ${hard})`)
}

async function runPinballDevices() {
  // conductor kind-pinball/t-010: the same game on every device. Physics
  // steps at a fixed rate whatever the screen, and the renderer only reads
  // it, so a phone, a tablet, a desktop and no screen at all play the same
  // seeded game to the same score, rules state and ball positions.
  const devices = [
    { name: 'none' },
    { name: 'phone', size: [390, 844, 2], tier: 'low' },
    { name: 'tablet', size: [820, 1180, 1], tier: 'medium' },
    { name: 'desktop', size: [1440, 900, 1], tier: 'high' },
  ] as const
  const play = (device: (typeof devices)[number]) => {
    const runtime = new PinballRuntime(
      {
        rng: mulberry32(77),
        sound: { play: () => {} },
        demo: false,
        hiScore: 0,
      },
      RAPIER,
      AMI_VILLAGE_GREYBOX,
      () => stubRenderer({ disposed: 0, frames: 0 }),
    )
    if ('size' in device) {
      runtime.mount({} as HTMLCanvasElement)
      const [width, height, dpr] = device.size
      runtime.resize(width, height, dpr)
      runtime.forceQuality(device.tier)
    }
    for (let t = 0; t < 1800; t++) {
      const frame = emptyInput()
      frame.held.down = t < 32 || (t > 900 && t < 932)
      frame.held.left = t % 47 < 7
      frame.held.right = (t + 20) % 53 < 7
      if (t % 300 === 150) frame.pressed.up = true
      runtime.update(frame)
      if ('size' in device && t % 4 === 0) runtime.render()
    }
    const inner = runtime as unknown as {
      rules: PinballRulesState
      physics: PinballPhysics
    }
    const r = inner.rules
    const snapshot = JSON.stringify({
      score: r.score,
      ball: r.ball,
      lives: r.lives,
      shots: r.shotsMade,
      villages: r.play.villages.visited,
      balls: inner.physics
        .ballViews()
        .map((b) => b.position.map((v) => v.toFixed(9))),
    })
    runtime.dispose()
    return snapshot
  }
  const [reference, ...others] = devices.map(play)
  const parsed = JSON.parse(reference!) as { score: number }
  assert.ok(parsed.score > 0, 'the scripted game scores')
  others.forEach((snapshot, i) =>
    assert.equal(
      snapshot,
      reference,
      `${devices[i + 1]!.name} plays the same game as no screen at all`,
    ),
  )
}

async function runPinballToys() {
  // conductor kind-pinball/t-010: the signature toys. The rules decide what
  // each shows; the scene eases toward it; nothing here touches the ball.
  const table = AMI_VILLAGE_GREYBOX
  const context = { shots: table.shots }
  const start = () =>
    stepRules(initialRules(3, 21), { type: 'start' }, context).state
  let tick = 0
  const feed = (state: PinballRulesState, event: SwitchEvent) => {
    tick += 10
    return stepRules(state, { type: 'switch', event, tick }, context).state
  }

  // Scenery only: no hut, beacon or drone collider, so the physics (and
  // every soak and tuning number) is the same with the toys as without.
  const hero = table.hero!
  assert.equal(hero.huts.length, HUT_COUNT)
  assert.equal(HUT_COUNT, WIZARD_AT, 'one hut per village to the wizard')
  assert.ok(
    !table.colliders.some((c) => /hut|beacon|drone/.test(c.id)),
    'the toys have no colliders',
  )
  // The beacon hangs above a ball's reach; the drone flies under the glass.
  const ballTop = table.physical.ballRadiusM * 2
  assert.ok(hero.beacon.at[1] - 0.012 > ballTop)
  assert.ok(hero.drone.perch[1] < 0.12 && hero.drone.circle.at[1] < 0.12)

  // The pose, from the rules.
  let s = start()
  let pose = toyPose(s)
  assert.deepEqual(pose.huts, Array(HUT_COUNT).fill('dark'))
  assert.deepEqual(pose.beacon, {
    eyes: [false, false, false],
    turning: false,
    excited: false,
  })
  assert.deepEqual(pose.drone, { nets: 0, mode: 'perch' })
  s = feed(s, { type: 'drop', id: 'drop-a', bank: 'ami', ballId: 1 })
  s = feed(s, { type: 'drop', id: 'drop-i', bank: 'ami', ballId: 1 })
  pose = toyPose(s)
  assert.deepEqual(pose.beacon.eyes, [true, false, true], 'an eye per drop')
  assert.equal(pose.beacon.turning, false)
  s = feed(s, { type: 'drop', id: 'drop-m', bank: 'ami', ballId: 1 })
  assert.equal(toyPose(s).beacon.turning, true, 'the lit lock turns it')
  const villages = (visited: number[], saved: number, mode: boolean) => ({
    ...s,
    play: {
      ...s.play,
      villages: {
        ...s.play.villages,
        visited,
        saved,
        mode: mode
          ? {
              village: visited.at(-1)!,
              hits: 0,
              endsAt: 1,
              total: 0,
              shown: 1,
              pausedAt: null,
            }
          : null,
      },
    },
  })
  assert.deepEqual(toyPose(villages([0, 3, 5, 7], 2, false)).huts, [
    'saved',
    'saved',
    'visited',
    'visited',
    'dark',
    'dark',
  ])
  assert.deepEqual(toyPose(villages([0, 3, 5], 2, true)).huts.slice(0, 4), [
    'saved',
    'saved',
    'playing',
    'dark',
  ])
  const wizard = {
    ...s,
    play: { ...s.play, wizard: { running: true, hits: 0, total: 0 } },
  }
  assert.ok(toyPose(wizard).huts.every((h) => h === 'wizard'))
  assert.equal(toyPose(wizard).drone.mode, 'circle')
  const multiball = {
    ...s,
    play: {
      ...s.play,
      multiball: { running: true, jackpots: 0, superLit: false },
    },
  }
  assert.equal(toyPose(multiball).beacon.excited, true)
  assert.equal(toyPose(multiball).drone.mode, 'circle')

  // The drone carries the nets, and delivers only when they come HOME.
  s = start()
  s = feed(s, { type: 'capture', id: 'lock', ballId: 1 })
  s = feed(s, { type: 'capture', id: 'secret-hole', ballId: 1 })
  for (const id of ['net-n', 'net-e'])
    s = feed(s, { type: 'contact', id, ballId: 1, impulse: 1 })
  assert.equal(toyPose(s).drone.nets, 2)
  s = feed(s, { type: 'contact', id: 'net-t', ballId: 1, impulse: 1 })
  const home = feed(s, { type: 'capture', id: 'sub-home', ballId: 1 })
  assert.ok(delivered(s, home), 'all three nets home: a delivery')
  const drained = feed(s, { type: 'capture', id: 'sub-drain', ballId: 1 })
  assert.ok(!delivered(s, drained), 'past the flippers: no delivery')

  // The camera presets: restrained, and every one but the room's frames
  // the whole field.
  const r = start()
  assert.equal(cameraPresetFor('sub-table', multiball, false), 'sub-table')
  assert.equal(cameraPresetFor('main', multiball, true), 'multiball')
  assert.equal(cameraPresetFor('main', wizard, false), 'multiball')
  assert.equal(cameraPresetFor('main', r, true), 'plunge')
  assert.equal(cameraPresetFor('main', r, false), 'main')
  const main = table.cameras.find((c) => c.id === 'main')!
  for (const id of ['plunge', 'multiball'] as const) {
    const preset = table.cameras.find((c) => c.id === id)!
    assert.deepEqual(preset.frame, main.frame, `${id} frames the whole field`)
    assert.deepEqual(preset.target, main.target)
  }

  // The scene: the toys follow the pose; the moments play out and settle.
  const scene = new PinballScene(table, {} as HTMLCanvasElement, () =>
    stubRenderer({ disposed: 0, frames: 0 }),
  )
  const toys = scene.heroToys!
  assert.ok(toys, 'the table has its toys')
  scene.setToys(toyPose(multiball))
  const perch = toys.droneAt
  for (let i = 0; i < 60; i++) scene.render()
  assert.ok(
    Math.hypot(toys.droneAt[0] - perch[0], toys.droneAt[2] - perch[2]) > 0.05,
    'in multiball the drone leaves its perch',
  )
  scene.setToys(toyPose(start()))
  scene.deliver()
  assert.ok(toys.isDelivering)
  for (let i = 0; i < 200; i++) scene.render()
  assert.ok(!toys.isDelivering, 'the delivery flight ends')
  // A jackpot's sparks fly and fall away.
  scene.burst('left-ramp')
  scene.burst('beacon')
  assert.ok(scene.sparksLive > 0)
  for (let i = 0; i < 60; i++) scene.render()
  assert.equal(scene.sparksLive, 0, 'the sparks burn out')
  // A sling rubber flexes when its kicker fires, then settles.
  scene.kick('sling-left-kicker')
  assert.equal(scene.rubberKick('sling-left-kicker'), 1)
  for (let i = 0; i < 12; i++) scene.render()
  assert.equal(scene.rubberKick('sling-left-kicker'), 0)
  // The trail follows only a fast ball.
  const ball = (speed: number, z: number): BallView => ({
    id: 1,
    position: [0, 0.0135, z],
    rotation: [0, 0, 0, 1],
    velocity: [0, 0, -speed],
    speed,
    captured: false,
    zone: 'main',
  })
  for (let i = 0; i < 6; i++) scene.sync([ball(0.5, -0.2 - i * 0.01)], {})
  assert.equal(scene.trailLit, 0, 'a slow ball leaves no trail')
  for (let i = 0; i < 6; i++) scene.sync([ball(3, -0.2 - i * 0.05)], {})
  assert.ok(scene.trailLit > 0, 'a fast ball leaves a streak')
  // The low tier drops the trail and thins the sparks.
  scene.forceQuality('low')
  scene.sync([ball(3, -0.6)], {})
  assert.equal(scene.trailLit, 0, 'no trail on the low tier')
  scene.burst('left-ramp')
  assert.ok(scene.sparksLive <= TIER_SETTINGS.low.sparks)
  scene.dispose()

  // The runtime drives them: the pose each step, a kick on a sling hit.
  const runtime = new PinballRuntime(
    { rng: mulberry32(4), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  runtime.mount({} as HTMLCanvasElement)
  const inner = runtime as unknown as {
    scene: PinballScene
    apply(event: RulesEvent): void
  }
  inner.apply({
    type: 'switch',
    tick: 10,
    event: { type: 'contact', id: 'sling-right-kicker', ballId: 1, impulse: 1 },
  })
  assert.equal(inner.scene.rubberKick('sling-right-kicker'), 1)
  runtime.update(emptyInput())
  assert.equal(
    inner.scene.cameraView,
    'plunge',
    'a new ball on the plunger leans the camera to the lane',
  )
  runtime.dispose()
}

/** kind-pinball/t-020: the machine stands in a lit room, never a black void. */
async function runPinballStage() {
  const table = AMI_VILLAGE_GREYBOX
  const resources = liveRenderResources()
  const scene = new PinballScene(table, {} as HTMLCanvasElement, () =>
    stubRenderer({ disposed: 0, frames: 0 }),
  )
  scene.resize(1440, 900, 1)
  const stage = scene.stage
  assert.ok(stage.world.children.length > 10, 'the room is furnished')
  assert.ok(stage.cabinet.children.length > 5, 'the cabinet has a body')
  assert.ok(stage.backglass?.visible, 'the backglass shows over the DMD')
  assert.ok(scene.scene.fog, 'the room fades into the dark')
  // The cabinet's legs stand on the room's floor.
  let legs = 0
  stage.world.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!(mesh.geometry instanceof THREE.CylinderGeometry)) return
    const { height } = mesh.geometry.parameters
    if (Math.abs(mesh.position.y - height / 2 - -1) < 1e-6) legs++
  })
  assert.ok(legs >= 4, 'four legs reach the floor')
  // The neighbours' spotlights are a high-tier luxury.
  scene.forceQuality('high')
  assert.ok(stage.spotsLit > 0, 'spotlit neighbours on the high tier')
  scene.forceQuality('low')
  assert.equal(stage.spotsLit, 0, 'none on the low tier')
  scene.forceQuality(null)
  // The backglass fades with the backbox when the camera looks into the room.
  scene.setView('sub-table')
  for (let i = 0; i < 90; i++) scene.render()
  assert.ok(!stage.backglass?.visible, 'the backglass gets out of the way')
  scene.setView('main')
  for (let i = 0; i < PHYSICS_HZ; i++) scene.render()
  assert.ok(stage.backglass?.visible, 'and comes back')
  scene.dispose()
  assert.equal(liveRenderResources(), resources, 'the room frees its meshes')
}

async function runPinballGuide() {
  // conductor kind-pinball/t-015: the table guide. Every page fits the
  // 360x640 cabinet, the map's numbers match the copy, and the hidden room
  // stays a secret until the player has found it once.
  const table = AMI_VILLAGE_GREYBOX
  const [W, H] = [360, 640]
  const fits = (pages: ArcadeGuidePage[]) => {
    for (const page of pages) {
      assert.ok(measureText(page.title, 3) <= W - 24, page.title)
      const scale = page.scale ?? 2
      for (const line of page.lines)
        assert.ok(measureText(line, scale) <= W - 16, `${page.title}: ${line}`)
      const top = 46 + (page.diagram ? page.diagram.height + 10 : 0)
      // The cabinet's spacing (drawGuide) at its tightest still fits.
      assert.ok(
        top + page.lines.length * scale * 9 <= H - 24,
        `${page.title} fits`,
      )
    }
  }
  const words = (pages: ArcadeGuidePage[]) =>
    pages.flatMap((p) => [p.title, ...p.lines]).join('\n')

  const fresh = pinballGuide(new Set())
  fits(fresh)
  assert.deepEqual(
    fresh.map((p) => p.title),
    [
      'SHOT MAP',
      'VILLAGES',
      'MULTIBALL',
      'MORE SCORING',
      WIZARD_NAME,
      'MASTERY',
    ],
  )
  assert.ok(
    !/SECRET|HIDDEN|NET RUN|NETS|DOOR|HOME|SUB/.test(words(fresh)),
    'nothing gives the hidden room away',
  )
  assert.equal(
    fresh[5]!.lines.filter((l) => l === '???').length,
    MASTERY_GOALS.filter((g) => g.secret).length,
  )
  // Each village's mode is on the card.
  for (const v of VILLAGES) assert.ok(words(fresh).includes(v.name), v.name)

  const found = pinballGuide(new Set(['secret']))
  fits(found)
  assert.ok(found.some((p) => p.title === 'SECRET VILLAGE'))
  assert.ok(words(found).includes('NET RUN'))
  assert.equal(found.at(-1)!.title, 'MASTERY')

  // The map's numbers are the ones the copy uses, and every shot has an
  // arrow to draw.
  const num = (id: string) => MAP_SHOTS.indexOf(id as never) + 1
  assert.equal(num('upper-feed'), 3)
  assert.equal(num('lock'), 4)
  assert.equal(num('award'), 8)
  assert.deepEqual(RAMP_SHOTS.map(num), [2, 6])
  for (const shot of MAP_SHOTS) {
    assert.ok(
      table.shots.some((s) => s.id === shot),
      shot,
    )
    assert.ok(
      table.inserts?.some((n) => n.shot === shot),
      `${shot} insert`,
    )
  }
  assert.ok(fresh[0]!.lines.join(' ').includes('8 AWARD'))

  // The map draws into any 2D context; only an unfound room is a "?".
  const calls: string[] = []
  const stub = new Proxy(
    {},
    {
      get: (_, key) =>
        typeof key === 'string' &&
        /^(fillStyle|strokeStyle|lineWidth|lineCap|font|textAlign|textBaseline|globalAlpha)$/.test(
          key,
        )
          ? (calls.push(key), undefined)
          : (..._args: unknown[]) => {
              calls.push(String(key))
              return { addColorStop: () => {} }
            },
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D
  const draw = (pages: ArcadeGuidePage[]) => {
    calls.length = 0
    const map = pages[0]!.diagram!
    map.draw(stub, 8, 46, W - 16, map.height)
    return calls.filter((c) => c === 'arc').length
  }
  assert.equal(draw(fresh), draw(found) + 1, 'the "?" disc, unfound only')

  // The 3D cabinet's module carries the guide.
  const module = await import('../arcade/games/kindPinball3d')
  assert.equal(typeof module.default.guide, 'function')
  assert.equal(module.default.guide!(new Set()).length, fresh.length)
}

async function runPinballMastery() {
  // conductor kind-pinball/t-014: the mastery ladder. Goals are read from the
  // rules' before/after state, announced on the DMD only the first time a
  // player earns one, kept per player by the arcade store, and the ladder's
  // secrets stay question marks until earned.
  const table = AMI_VILLAGE_GREYBOX
  const context = { shots: table.shots }
  let tick = 0
  const met: string[] = []
  const feed = (state: PinballRulesState, event: SwitchEvent) => {
    tick += 10
    const step = stepRules(state, { type: 'switch', event, tick }, context)
    met.push(...goalsMet(state, step.state, step.effects))
    return step.state
  }
  const start = (seed = 7) => {
    tick = 0
    met.length = 0
    return stepRules(initialRules(3, seed), { type: 'start' }, context).state
  }
  const make = (state: PinballRulesState, id: string) => {
    const def = table.shots.find((s) => s.id === id)!
    let next = state
    for (const sensor of def.sensors)
      next = feed(
        next,
        def.kind === 'scoop'
          ? { type: 'capture', id: sensor, ballId: 1 }
          : def.kind === 'spinner'
            ? { type: 'spin', id: sensor, ballId: 1, speed: 2 }
            : { type: 'sensor-enter', id: sensor, ballId: 1 },
      )
    return next
  }

  // Every rung has a unique id the store accepts, and the ladder is the
  // one the 3D cabinet shows.
  const ids = MASTERY_GOALS.map((g) => g.id)
  assert.equal(new Set(ids).size, ids.length)
  assert.deepEqual(sanitizeMastery({ 'kind-pinball-3d': ids }), {
    'kind-pinball-3d': ids,
  })
  assert.equal(findArcadeGame('kind-pinball-3d')?.mastery, MASTERY_GOALS)

  // Real play: the skill shot, then the hidden room and NETS HOME, which
  // also saves a village.
  let s = feed(start(), { type: 'sensor-enter', id: 'shooter-exit', ballId: 1 })
  s = make(s, s.play.skill.target)
  assert.deepEqual(met, ['skill-shot'])
  met.length = 0
  s = feed(s, { type: 'capture', id: 'lock', ballId: 1 })
  s = feed(s, { type: 'capture', id: 'secret-hole', ballId: 1 })
  assert.ok(met.includes('secret'), 'finding the room is a goal')
  for (const id of ['net-n', 'net-e', 'net-t'])
    s = feed(s, { type: 'contact', id, ballId: 1, impulse: 1 })
  s = feed(s, { type: 'capture', id: 'sub-home', ballId: 1 })
  assert.ok(met.includes('nets-home') && met.includes('village-saved'))
  assert.equal(s.bonusMultiplier, 3)
  assert.ok(!met.includes('wizard') && !met.includes('ten-million'))

  // The rest, from the state changes that mean them.
  const base = start()
  const play = base.play
  const with_ = (
    over: Partial<PinballRulesState['play']>,
    rest: Partial<PinballRulesState> = {},
  ): PinballRulesState => ({ ...base, ...rest, play: { ...play, ...over } })
  const cases: Array<[string, PinballRulesState]> = [
    [
      'first-village',
      with_({
        villages: {
          ...play.villages,
          mode: {
            village: 0,
            hits: 0,
            endsAt: 1,
            total: 0,
            shown: 1,
            pausedAt: null,
          },
        },
      }),
    ],
    ['combo-3', with_({ combo: { ...play.combo, count: 2 } })],
    [
      'multiball',
      with_({
        multiballs: 1,
        multiball: { running: true, jackpots: 0, superLit: false },
      }),
    ],
    ['extra-ball', with_({ extraBalls: 1 })],
    ['wizard', with_({ wizard: { running: true, hits: 0, total: 0 } })],
    ['ten-million', with_({}, { score: 10_000_000 })],
  ]
  for (const [goal, after] of cases)
    assert.deepEqual(
      goalsMet(base, after, []),
      goal === 'first-village' ? [goal, 'village-1'] : [goal],
      goal,
    )
  const running = with_({
    multiball: { running: true, jackpots: 0, superLit: false },
  })
  const dmd = (scene: DmdSceneId): RuleEffect[] => [
    { type: 'dmd', text: 'X', ms: 1, scene },
  ]
  assert.deepEqual(goalsMet(running, running, dmd('jackpot')), ['jackpot'])
  assert.deepEqual(goalsMet(base, base, dmd('jackpot')), [], 'wizard rescues')
  assert.deepEqual(goalsMet(running, running, dmd('super-jackpot')), [
    'super-jackpot',
  ])
  assert.deepEqual(goalsMet(base, base, []), [])

  // The runtime: a goal already earned is kept quietly; a new one is
  // announced with its place on the ladder. The demo earns nothing.
  const runtime = new PinballRuntime(
    {
      rng: mulberry32(5),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
      mastery: ['skill-shot'],
    },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const inner = runtime as unknown as {
    rules: PinballRulesState
    apply(event: RulesEvent): void
  }
  const sling = (r: { apply(event: RulesEvent): void }) =>
    r.apply({
      type: 'switch',
      tick: 10,
      event: {
        type: 'contact',
        id: 'sling-left-kicker',
        ballId: 1,
        impulse: 1,
      },
    })
  const told = () =>
    [runtime.dmdQueue.showing, ...runtime.dmdQueue.pending].map(
      (d) => d?.request.text,
    )
  runtime.dmdQueue.reset()
  inner.rules = { ...inner.rules, score: 9_999_999 }
  sling(inner)
  assert.deepEqual(runtime.mastered, ['ten-million'])
  assert.ok(told().includes('TEN MILLION'), 'a new goal is announced')
  const announced = [runtime.dmdQueue.showing, ...runtime.dmdQueue.pending]
    .map((d) => d?.request)
    .find((r) => r?.text === 'TEN MILLION')
  assert.equal(announced?.sub, `MASTERY 2/${MASTERY_GOALS.length}`)
  runtime.dmdQueue.reset()
  inner.rules = { ...inner.rules, score: 9_999_999 }
  sling(inner)
  assert.deepEqual(runtime.mastered, ['ten-million'], 'once a game')
  const quiet = new PinballRuntime(
    {
      rng: mulberry32(5),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
      mastery: ['ten-million'],
    },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const quietInner = quiet as unknown as typeof inner
  quiet.dmdQueue.reset()
  quietInner.rules = { ...quietInner.rules, score: 9_999_999 }
  sling(quietInner)
  assert.deepEqual(quiet.mastered, ['ten-million'], 'still reported')
  assert.ok(
    ![quiet.dmdQueue.showing, ...quiet.dmdQueue.pending].some(
      (d) => d?.request.text === 'TEN MILLION',
    ),
    'an earned goal is not announced again',
  )
  const demo = new PinballRuntime(
    { rng: mulberry32(5), sound: { play: () => {} }, demo: true, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const demoInner = demo as unknown as typeof inner
  demoInner.rules = { ...demoInner.rules, score: 9_999_999 }
  sling(demoInner)
  assert.deepEqual(demo.mastered, [], 'the attract demo earns nothing')
  runtime.dispose()
  quiet.dispose()
  demo.dispose()

  // The store's half: merged without repeats, junk dropped, and the ladder's
  // secrets stay hidden on the attract page until earned.
  let record = mergeMastery({}, 'kind-pinball-3d', ['jackpot', 'jackpot'])
  record = mergeMastery(record, 'kind-pinball-3d', ['secret', 'jackpot'])
  assert.deepEqual(record, { 'kind-pinball-3d': ['jackpot', 'secret'] })
  assert.equal(mergeMastery(record, 'kind-pinball-3d', ['jackpot']), record)
  assert.deepEqual(
    sanitizeMastery({
      'kind-pinball-3d': ['jackpot', 7, 'BAD ID', 'jackpot'],
      'bad slug!': ['x'],
      other: 'nope',
    }),
    { 'kind-pinball-3d': ['jackpot'] },
  )
  assert.deepEqual(sanitizeMastery('[]'), {})
  assert.deepEqual(sanitizeMastery([1]), {})
  const progress = masteryProgress(MASTERY_GOALS, ['skill-shot', 'jackpot'])
  assert.equal(progress.earned, 2)
  assert.equal(progress.total, MASTERY_GOALS.length)
  assert.equal(progress.next?.id, 'first-village')
  const secret = MASTERY_GOALS.find((g) => g.id === 'secret')!
  assert.equal(masteryLine(secret, new Set()), '???')
  assert.equal(masteryLine(secret, new Set(['secret'])), 'SECRET VILLAGE')
  for (const goal of MASTERY_GOALS.filter((g) => !g.secret)) {
    assert.ok(!/SECRET|HIDDEN|NET/.test(masteryLine(goal, new Set())), goal.id)
    // The 360-wide how-to page fits each line at the font's scale 1.
    assert.ok(measureText(masteryLine(goal, new Set())) <= 340, goal.id)
  }
  // EVERY VILLAGE: one part per village mode, counted across games.
  assert.equal(VILLAGE_PARTS.length, VILLAGES.length)
  const every = MASTERY_GOALS.find((g) => g.id === 'every-village')!
  assert.equal(
    masteryLine(every, new Set(VILLAGE_PARTS.slice(0, 5))),
    'EVERY VILLAGE - PLAY ALL 12 5/12',
  )
  assert.deepEqual(partsComplete(MASTERY_GOALS, new Set(VILLAGE_PARTS)), [
    'every-village',
  ])
  assert.deepEqual(
    partsComplete(MASTERY_GOALS, new Set([...VILLAGE_PARTS, 'every-village'])),
    [],
  )
  assert.deepEqual(
    partsComplete(MASTERY_GOALS, new Set(VILLAGE_PARTS.slice(1))),
    [],
  )
  // In the runtime, the last village played earns the goal, announced.
  const mapper = new PinballRuntime(
    { rng: mulberry32(9), sound: { play: () => {} }, demo: false, hiScore: 0 },
    RAPIER,
    table,
    () => stubRenderer({ disposed: 0, frames: 0 }),
  )
  const mapInner = mapper as unknown as typeof inner & {
    earnedBefore: Set<string>
  }
  const award: RulesEvent = {
    type: 'switch',
    tick: 10,
    event: { type: 'capture', id: 'award', ballId: 1 },
  }
  const next = stepRules(mapInner.rules, award, context).state.play.villages
    .mode!.village
  mapInner.earnedBefore = new Set(VILLAGE_PARTS.filter((_, i) => i !== next))
  mapper.dmdQueue.reset()
  mapInner.apply(award)
  assert.deepEqual(mapper.mastered, [
    'first-village',
    VILLAGE_PARTS[next],
    'every-village',
  ])
  assert.ok(
    [mapper.dmdQueue.showing, ...mapper.dmdQueue.pending].some(
      (d) => d?.request.text === 'EVERY VILLAGE',
    ),
    'the whole map is announced',
  )
  mapper.dispose()
}

await runLanternRescue()
await runCoopGames()
await runPinball3d()
await runPinballShots()
await runPinballSubTable()
await runPinballFeel()
await runPinballRender()
await runPinballDmd()
await runPinballRules()
await runPinballSubRules()
await runPinballMastery()
await runPinballGuide()
await runPinballToys()
await runPinballStage()
await runPinballTouch()
await runPinballDevices()
runPinballAudio()
await runPinballTuning()
await runPinballSoak()
console.log('verifyArcadeEngine: ok')
