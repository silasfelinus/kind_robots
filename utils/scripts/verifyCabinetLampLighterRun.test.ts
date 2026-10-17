// Lamp Lighter Run (conductor kr-arcade/t-009, approved pitch 2026-10-09-kr-cabinet-lamp-lighter-run):
// girders slope and tilt with level, balls roll downhill and drop off the ends, a hop clears a ball,
// lamps light on touch, the lantern timer and lives end a run, and the attract pilot lights lamps.
//
//   npx tsx utils/scripts/verifyCabinetLampLighterRun.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import {
  LADDER_X,
  LAMP_COUNT,
  LAMP_X,
  PLAT_BASE,
  STREETS,
  W,
  ballGap,
  ballHits,
  ballSpeed,
  create,
  lanternTicks,
  nearestUnlit,
  newBall,
  platDir,
  platformY,
  stepBall,
  streetFor,
  tiltFor,
  timerBonus,
} from '../arcade/games/lampLighterRun'
import { emptyInput } from '../arcade/types'

assert.ok(ARCADE_GAMES.some((g) => g.slug === 'lamp-lighter-run'))
assert.equal(LAMP_COUNT, 10)

// Girders are above one another, slope the stated way, and a ladder reaches every pair.
for (let p = 1; p < PLAT_BASE.length; p++) {
  assert.ok(PLAT_BASE[p]! < PLAT_BASE[p - 1]!)
  assert.notEqual(platDir(p), platDir(p - 1))
}
for (const t of [tiltFor(1), tiltFor(9)]) {
  assert.ok(
    platformY(0, W, t) > platformY(0, 0, t),
    'even girders fall to the right',
  )
  assert.ok(
    platformY(1, 0, t) > platformY(1, W, t),
    'odd girders fall to the left',
  )
  for (let k = 0; k < LADDER_X.length; k++) {
    assert.ok(
      platformY(k + 1, LADDER_X[k]!, t) < platformY(k, LADDER_X[k]!, t) - 20,
    )
  }
}
for (let p = 0; p < LAMP_X.length; p++) {
  for (const lx of LAMP_X[p]!) {
    // A lamp keeps clear of the ladders that reach its own girder.
    for (const k of [p - 1, p]) {
      if (k >= 0 && k < LADDER_X.length)
        assert.ok(Math.abs(lx - LADDER_X[k]!) > 12)
    }
  }
}

// The ramp is data: harder every level, clamped.
assert.ok(tiltFor(2) > tiltFor(1))
assert.ok(ballSpeed(3) > ballSpeed(1))
assert.ok(ballGap(3) < ballGap(1))
assert.ok(lanternTicks(3) < lanternTicks(1))
assert.ok(ballSpeed(99) <= 1.9 && ballGap(99) >= 55 && lanternTicks(99) >= 1800)
assert.equal(streetFor(1), 0)
assert.equal(streetFor(STREETS.length + 1), 0)
assert.equal(new Set([1, 2, 3, 4, 5].map(streetFor)).size, 5)
assert.equal(timerBonus(600), 100)
assert.equal(timerBonus(-5), 0)

// Hit range: a ball under the robot hits, a hop clears it.
assert.ok(ballHits(100, 200, 100, 200))
assert.ok(!ballHits(100, 200 - 14, 100, 200), 'a hop clears the ball')
assert.ok(!ballHits(100, 200, 140, 200))

// A ball rolls downhill, drops off the end onto the next girder and flips direction, then exits.
{
  const rng = mulberry32(1)
  const t = tiltFor(1)
  const b = newBall()
  let guard = 0
  const seen = new Set<number>()
  let alive = true
  while (alive && guard++ < 20000) {
    alive = stepBall(b, t, 1.5, () => 1)
    seen.add(b.plat)
    if (!b.falling) assert.equal(b.y, platformY(b.plat, b.x, t))
  }
  assert.ok(!alive, 'a ball leaves the bottom of the street')
  assert.deepEqual([...seen].sort(), [0, 1, 2, 3, 4])
  void rng
}
// A lucky roll takes the ladder.
{
  const t = tiltFor(1)
  const b = newBall()
  let steps = 0
  while (b.plat === 4 && steps++ < 2000) stepBall(b, t, 1.2, () => 0)
  assert.equal(b.plat, 3)
  assert.ok(Math.abs(b.x - LADDER_X[3]!) < 2, 'it left at the ladder')
}

// The pilot's target is the nearest unlit lamp.
{
  const lit = LAMP_X.map(() => [false, false])
  assert.deepEqual(nearestUnlit(lit, 0, 100), { plat: 0, x: 70 })
  lit[0] = [true, true]
  assert.equal(nearestUnlit(lit, 0, 100)?.plat, 1)
  const all = LAMP_X.map(() => [true, true])
  assert.equal(nearestUnlit(all, 0, 0), null)
}

const sound = { play() {} }
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  x: number
  feet: number
  plat: number
  stance: string
  mode: string
  lit: boolean[][]
  balls: ReturnType<typeof newBall>[]
  timer: number
  invuln: number
  update(i: ReturnType<typeof emptyInput>): void
}
const make = (seed: number, demo = false) =>
  create({ rng: mulberry32(seed), sound, demo, hiScore: 0 }) as unknown as Probe

// Walking right along the bottom girder lights its lamps; hopping works and lands.
{
  const game = make(5)
  game.invuln = 99999
  const right = emptyInput()
  right.held.right = true
  for (let i = 0; i < 400; i++) game.update(right)
  assert.deepEqual(game.lit[0], [true, true])
  assert.ok(game.score >= 400)
  const hop = emptyInput()
  hop.pressed.a = true
  game.update(hop)
  assert.equal(game.stance, 'air')
  for (let i = 0; i < 60; i++) game.update(emptyInput())
  assert.equal(game.stance, 'ground')
}

// Climbing a ladder gets to the next girder, and back down.
{
  const game = make(6)
  game.invuln = 99999
  const right = emptyInput()
  right.held.right = true
  while (game.x < LADDER_X[0]! - 2) game.update(right)
  const up = emptyInput()
  up.held.up = true
  let guard = 0
  while (game.plat === 0 && guard++ < 400) game.update(up)
  assert.equal(game.plat, 1)
  assert.equal(game.stance, 'ground')
  const down = emptyInput()
  down.held.down = true
  guard = 0
  while (game.plat === 1 && guard++ < 400) game.update(down)
  assert.equal(game.plat, 0)
}

// Losing: standing still, balls arrive and take every life; the score never goes negative.
{
  const idle = make(7)
  let ticks = 0
  while (!idle.over && ticks < 60 * 900) {
    idle.update(emptyInput())
    ticks++
  }
  assert.ok(idle.over, 'an idle player loses all lives')
  assert.equal(idle.lives, 0)
}

// The lantern timer is a life too.
{
  const game = make(8)
  game.invuln = 99999
  game.timer = 2
  const before = game.lives
  game.update(emptyInput())
  game.update(emptyInput())
  assert.equal(game.lives, before - 1)
  assert.equal(game.mode, 'dying')
}

// Lighting the last lamp clears the street, pays the bonus, and starts level 2.
{
  const game = make(9)
  game.invuln = 99999
  game.lit = LAMP_X.map(() => [true, true])
  game.lit[0] = [false, true]
  game.timer = 1200
  const right = emptyInput()
  right.held.right = true
  while (game.mode === 'play') game.update(right)
  assert.equal(game.mode, 'cleared')
  assert.ok(game.score >= 200 + 190, 'lamp plus a lantern bonus')
  for (let i = 0; i < 200; i++) game.update(emptyInput())
  assert.equal(game.level, 2)
  assert.equal(game.mode, 'play')
  assert.ok(game.lit.every((r) => r.every((l) => !l)))
  assert.equal(game.timer <= lanternTicks(2), true)
}

// The attract pilot never scores, lights lamps, and climbs.
{
  const demo = make(11, true)
  let top = 0
  for (let t = 0; t < 60 * 90 && !demo.over; t++) {
    demo.update(emptyInput())
    top = Math.max(top, demo.plat)
  }
  assert.equal(demo.score, 0, 'the demo never scores')
  assert.ok(top >= 1, 'the pilot climbs')
  assert.ok(demo.lit.flat().some(Boolean), 'the pilot lights lamps')
}

console.log('lamp lighter run: ok')
