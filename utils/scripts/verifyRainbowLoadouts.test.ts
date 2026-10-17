import assert from 'node:assert/strict'
import { findArcadeGame } from '../arcade/games'
import {
  RAINBOW_DIFFICULTY_NAMES,
  RAINBOW_ENDING_PARTS,
  RAINBOW_FOCUS,
  RAINBOW_LOADOUTS,
  RAINBOW_MASTERY,
  rainbowMedal,
  readRainbowSave,
} from '../arcade/games/rainbowLoadouts'
import {
  RAINBOW_DIFFICULTY,
  RECOVERY_CACHE,
  createRainbowPrincessPreview,
} from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
import type { ArcadeDifficulty, InputFrame } from '../arcade/types'

// Conductor rainbow t-010: the four ships' focused weapon families (Rose Needle, Prism Thread, Halo Link and
// Comet Arc), per-Act medals, the cabinet's mastery ladder, and the save kept at every Act start, offered back
// as a continue/new menu that resumes the campaign at that Act with its score, rescues and difficulty.

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (
  opts: {
    players?: number
    demo?: boolean
    resume?: unknown
    difficulty?: ArcadeDifficulty
    mastery?: string[]
  } = {},
) =>
  createRainbowPrincessPreview({
    players: opts.players ?? 1,
    demo: opts.demo ?? false,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
    difficulty: opts.difficulty,
    resume: opts.resume,
    mastery: opts.mastery,
  })
const keys = (
  held: Partial<InputFrame['held']>,
  pressed: Partial<InputFrame['pressed']> = {},
) => {
  const frame = emptyInput()
  Object.assign(frame.held, held)
  Object.assign(frame.pressed, pressed)
  return frame
}

// The registry: the ladder, the difficulty names and the focus line.
const meta = findArcadeGame('rainbow-bullet-hell-space-princess')
assert.equal(meta?.mastery, RAINBOW_MASTERY)
assert.deepEqual(meta?.difficulty, [...RAINBOW_DIFFICULTY_NAMES])
assert.ok(meta?.howTo.some((line) => line.includes('NEEDLE')))
assert.equal(RAINBOW_LOADOUTS.length, 4)
const ids = RAINBOW_MASTERY.map((goal) => goal.id)
assert.equal(new Set(ids).size, ids.length, 'ladder ids are unique')
for (const id of ids) assert.match(id, /^[a-z0-9-]{1,40}$/)
assert.deepEqual(
  RAINBOW_MASTERY.find((goal) => goal.id === 'every-ending')?.parts,
  RAINBOW_ENDING_PARTS,
)
assert.equal(rainbowMedal(0, 3), 'gold')
assert.equal(rainbowMedal(2, 0), 'silver')
assert.equal(rainbowMedal(2, 1), 'bronze')

// Focused fire: each seat's own family. Unfocused fire is unchanged (no family shots).
{
  const game = create({ players: 4 })
  const focused = keys({ a: true, b: true })
  for (let i = 0; i < 3; i++)
    game.update(focused, [focused, focused, focused, focused])
  const shots = game.snapshot.shots
  const bySeat = (seat: number) => shots.filter((shot) => shot.seat === seat)
  assert.ok(
    bySeat(0).length && bySeat(0).every((shot) => shot.kind === 'needle'),
  )
  assert.equal(bySeat(0)[0]!.damage, RAINBOW_FOCUS.needle.damage)
  assert.equal(bySeat(0)[0]!.vx, RAINBOW_FOCUS.needle.speed)
  const thread = bySeat(1)[0]!
  assert.equal(thread.kind, 'thread')
  assert.equal(thread.pierce, RAINBOW_FOCUS.thread.pierce, 'power 1 thread')
  const links = bySeat(2)
  assert.equal(links.length, 3)
  assert.ok(links.every((shot) => shot.kind === 'link'))
  // The two drone shots converge on the ship's line, crossing crossAt ahead.
  const drones = links.filter((shot) => shot.vy !== 0)
  assert.equal(drones.length, 2)
  assert.ok(
    drones.every(
      (shot) =>
        Math.sign(shot.vy) ===
        -Math.sign(shot.y - links.find((s) => s.vy === 0)!.y),
    ),
  )
  const arcs = bySeat(3)
  assert.ok(
    arcs.some(
      (shot) =>
        shot.kind === 'arc' && shot.bounces === RAINBOW_FOCUS.arc.bounces,
    ),
  )

  const open = create({ players: 4 })
  const plain = keys({ a: true })
  for (let i = 0; i < 3; i++) open.update(plain, [plain, plain, plain, plain])
  assert.ok(open.snapshot.shots.length)
  assert.ok(
    open.snapshot.shots.every((shot) => shot.kind === undefined),
    'unfocused fire is unchanged',
  )
}

// A Comet Arc spark glances off the wall; a Prism Thread passes through a craft and flies on.
{
  const game = create({ players: 4 })
  const focused = keys({ a: true, b: true })
  let glanced = false
  let pierced = false
  for (let i = 0; i < 4000 && !(glanced && pierced); i++) {
    game.update(focused, [focused, focused, focused, focused])
    for (const shot of game.snapshot.shots) {
      if (
        shot.kind === 'arc' &&
        shot.bounces !== undefined &&
        shot.bounces < RAINBOW_FOCUS.arc.bounces
      )
        glanced = true
      if (shot.kind === 'thread' && (shot.struck?.length ?? 0) > 0) {
        // Power adds a craft to the thread's reach, and each craft it passes uses one up.
        const reach = shot.pierce! + shot.struck!.length
        assert.ok(
          reach >= RAINBOW_FOCUS.thread.pierce &&
            reach <= RAINBOW_FOCUS.thread.pierce + 2,
        )
        assert.equal(
          new Set(shot.struck).size,
          shot.struck!.length,
          'never the same craft twice',
        )
        pierced = true
      }
    }
  }
  assert.ok(glanced, 'an arc spark glanced off a wall')
  assert.ok(pierced, 'a thread passed through a craft')
}

// The whole campaign in the demo: a medal for every Act, a save at every Act start, none after THE END.
const saves: unknown[] = []
{
  const game = create({ demo: true })
  let last: unknown
  for (let frame = 0; frame < 400000 && !game.over; frame++) {
    game.update(emptyInput())
    const save = game.save
    if (save !== undefined && save !== last) {
      last = save
      saves.push(save)
    }
  }
  assert.ok(game.over, 'the demo reaches THE END')
  const medals = game.snapshot.medals
  for (let act = 1; act <= 9; act++)
    assert.equal(
      medals[act as 1],
      'gold',
      `the demo (never hit) wins gold in act ${act}`,
    )
  assert.equal(saves.length, 9, 'eight Act starts, then cleared')
  assert.equal(saves.at(-1), null, 'THE END clears the save')
  saves.slice(0, 8).forEach((save, i) => {
    const read = readRainbowSave(JSON.parse(JSON.stringify(save)))
    assert.ok(read, `the act ${i + 2} save reads back`)
    assert.equal(read.checkpoint.act, i + 2)
    assert.equal(read.checkpoint.frame, 0)
    assert.equal(Object.keys(read.medals).length, i + 1)
  })
  // The demo meets goals but never reports them.
  assert.deepEqual(game.mastered, [])
  assert.ok(game.snapshot.earned.includes('first-light'))
  assert.ok(game.snapshot.earned.includes('gold-wing'))
  assert.ok(game.snapshot.earned.includes('the-end'))
  assert.ok(game.snapshot.earned.some((id) => id.startsWith('ending-')))
}

// Bad saves are never offered.
for (const bad of [
  null,
  'act 3',
  { v: 2 },
  { ...(saves[1] as object), difficulty: 'legendary' },
  {
    ...(saves[1] as object),
    checkpoint: { ...(saves[1] as { checkpoint: object }).checkpoint, act: 1 },
  },
  {
    ...(saves[1] as object),
    checkpoint: {
      ...(saves[1] as { checkpoint: object }).checkpoint,
      frame: 40,
    },
  },
  {
    ...(saves[1] as object),
    checkpoint: {
      ...(saves[1] as { checkpoint: object }).checkpoint,
      wreckRoute: 'moon',
    },
  },
  {
    ...(saves[1] as object),
    checkpoint: {
      ...(saves[1] as { checkpoint: object }).checkpoint,
      score: -5,
    },
  },
]) {
  assert.equal(readRainbowSave(bad), null, JSON.stringify(bad)?.slice(0, 60))
  assert.equal(create({ resume: bad }).snapshot.resumeMenu, null)
}
// The demo ignores a save.
assert.equal(create({ demo: true, resume: saves[1] }).snapshot.resumeMenu, null)

// Continue: the menu waits, ignores the starting press, then resumes the saved Act start.
for (const [index, act] of [
  [0, 'S02'],
  [3, 'S05'],
  [7, 'S09'],
] as const) {
  const save = {
    ...(JSON.parse(JSON.stringify(saves[index])) as {
      difficulty: ArcadeDifficulty
      checkpoint: { score: number }
    }),
    difficulty: 'easy' as const,
  }
  const game = create({ resume: save, difficulty: 'hard' })
  assert.equal(game.snapshot.resumeMenu, 0, 'continue is highlighted first')
  game.update(keys({}, { a: true }))
  assert.equal(
    game.snapshot.resumeMenu,
    0,
    'the press that started the game does not choose',
  )
  for (let i = 0; i < 30; i++) game.update(emptyInput())
  assert.equal(game.snapshot.tick, 0, 'the world waits behind the menu')
  game.update(keys({}, { a: true }))
  assert.equal(game.snapshot.resumeMenu, null)
  assert.equal(game.snapshot.act, act)
  assert.equal(game.snapshot.score, save.checkpoint.score)
  assert.equal(
    game.snapshot.difficulty,
    'easy',
    'the save keeps its difficulty',
  )
  assert.equal(game.snapshot.ships[0]!.lives, RAINBOW_DIFFICULTY.easy.lives)
  for (let i = 0; i < 600; i++) game.update(emptyInput())
  assert.equal(game.snapshot.act, act, 'the resumed Act runs')
  assert.equal(game.save, undefined, 'a continued Act start is not saved again')
}

// New flight: down, then A, starts over at Act I and keeps the cabinet's difficulty.
{
  const game = create({ resume: saves[4], difficulty: 'hard' })
  for (let i = 0; i < 25; i++) game.update(emptyInput())
  game.update(keys({}, { down: true }))
  assert.equal(game.snapshot.resumeMenu, 1)
  game.update(keys({}, { a: true }))
  assert.equal(game.snapshot.resumeMenu, null)
  game.update(emptyInput())
  assert.equal(game.snapshot.act, 'S01')
  assert.equal(game.snapshot.score, 0)
  assert.equal(game.snapshot.difficulty, 'hard')
}

// U12 Recovery Cache: a life lost above power 1 drops that power level just ahead for four seconds, for its
// own pilot alone; flying into it restores the level, and an untouched cache fades.
{
  /** Chase the nearest pickup while firing, until power 2; then sit still and fire until a life is lost. */
  const flyToCache = (game: ReturnType<typeof create>) => {
    for (let frame = 0; frame < 30000; frame++) {
      const ship = game.snapshot.ships[0]!
      const target =
        ship.power < 2
          ? [...game.snapshot.pickups]
              .filter((p) => p.kind === 'power')
              .sort((p, q) => p.x - q.x)[0]
          : undefined
      const held: Partial<InputFrame['held']> = { a: true }
      if (target) {
        held.up = target.y < ship.y - 3
        held.down = target.y > ship.y + 3
        held.left = target.x < ship.x - 3
        held.right = target.x > ship.x + 3
      }
      const lives = ship.lives
      const power = ship.power
      game.update(keys(held))
      if (game.snapshot.ships[0]!.lives < lives) return power
    }
    return 0
  }
  const game = create()
  const before = flyToCache(game)
  assert.ok(
    before >= 2,
    `the pilot powered up (${before}) and then lost a life`,
  )
  const after = game.snapshot
  assert.equal(after.ships[0]!.power, before - 1, 'the life took a power level')
  assert.equal(after.caches.length, 1, 'and dropped it as a cache')
  const cache = after.caches[0]!
  assert.equal(cache.seat, 0)
  assert.ok(cache.x > after.ships[0]!.x, 'just ahead of the pilot')
  // Fly into it.
  for (let i = 0; i < 120 && game.snapshot.caches.length; i++) {
    const ship = game.snapshot.ships[0]!
    game.update(
      keys({
        right: cache.x > ship.x + 2,
        left: cache.x < ship.x - 2,
        down: cache.y > ship.y + 2,
        up: cache.y < ship.y - 2,
      }),
    )
  }
  assert.equal(game.snapshot.caches.length, 0)
  assert.equal(game.snapshot.ships[0]!.power, before, 'the cache restores it')

  // Left alone, it fades after four seconds.
  const idle = create()
  flyToCache(idle)
  assert.equal(idle.snapshot.caches.length, 1)
  const backward = keys({ left: true })
  const born = idle.snapshot.caches[0]!.age
  for (let i = born; i < RECOVERY_CACHE.frames - 1; i++) idle.update(backward)
  assert.equal(
    idle.snapshot.caches.length,
    1,
    'still there at 4 s less a frame',
  )
  idle.update(backward)
  assert.equal(idle.snapshot.caches.length, 0, 'gone at 4 s')
}

console.log(
  `rainbow loadouts: ok (needle/thread/link/arc, pierce and glance, ${RAINBOW_MASTERY.length}-rung ladder, gold medals and saves at 8 Act starts, continue/new menu, recovery cache)`,
)
