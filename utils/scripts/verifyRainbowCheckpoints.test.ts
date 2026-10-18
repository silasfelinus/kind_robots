import assert from 'node:assert/strict'
import { RAINBOW_FAILURE } from '../arcade/games/rainbowFailure'
import {
  actCheckpoints,
  checkpointLabel,
  continueSeconds,
  RAINBOW_CONTINUE,
  resumeTick,
} from '../arcade/games/rainbowCheckpoints'
import {
  PINKWAKE,
  PINKWAKE_SECTIONS,
  pinkwakeSpawns,
} from '../arcade/games/rainbowPinkwake'
import { MOONJELLY, MOONJELLY_SECTIONS } from '../arcade/games/rainbowMoonjelly'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// t-007 asks for checkpoint/continue in 10-15-minute Acts: a fallen crew should not replay the whole Act.

const actOne = actCheckpoints(PINKWAKE_SECTIONS, PINKWAKE.bossStarts)
const actTwo = actCheckpoints(MOONJELLY_SECTIONS, MOONJELLY.bossStarts)
assert.deepEqual(actOne, [
  0,
  300,
  1500,
  2700,
  3900,
  5100,
  6600,
  7800,
  9300,
  10800,
  PINKWAKE.bossStarts,
])
// Act II after t-023's recut: its teaching sections, guardian and two closing escalations.
assert.deepEqual(actTwo, [
  0,
  300,
  1500,
  2700,
  4200,
  5700,
  7500,
  9300,
  MOONJELLY.bossStarts,
])
assert.equal(
  checkpointLabel(PINKWAKE_SECTIONS, PINKWAKE.bossStarts, 0),
  'ACT START',
)
assert.equal(
  checkpointLabel(PINKWAKE_SECTIONS, PINKWAKE.bossStarts, 1500),
  'SPIRAL EDDIES',
)
assert.equal(
  checkpointLabel(
    MOONJELLY_SECTIONS,
    MOONJELLY.bossStarts,
    MOONJELLY.bossStarts,
  ),
  'THE BOSS',
)
assert.equal(continueSeconds(RAINBOW_CONTINUE.countdownFrames), 10)
assert.equal(continueSeconds(1), 1)
// The next update replays the checkpoint frame itself in either Act.
assert.equal(resumeTick({ act: 1, frame: 1500 }, null) + 1, 1500)
assert.equal(resumeTick({ act: 1, frame: 0 }, null), 0)
assert.equal(resumeTick({ act: 2, frame: 1500 }, 9000) + 1 - 9000, 1500)
assert.equal(resumeTick({ act: 2, frame: 0 }, 9000) + 1, 9000)

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = () =>
  createRainbowPrincessPreview({
    players: 1,
    demo: false,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
// An ordinary pilot holding fire and drifting between three lanes, not the immortal demo.
function pilot(frame: number, y: number): InputFrame {
  const input = emptyInput()
  input.held.a = true
  const target = 70 + (Math.floor(frame / 240) % 3) * 70
  input.held.up = y > target + 3
  input.held.down = y < target - 3
  return input
}
const press = () => {
  const input = emptyInput()
  input.pressed.a = true
  input.held.a = true
  return input
}
const texts: string[] = []
const g = new Proxy({} as Record<string | symbol, unknown>, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'fillText')
      return (text: string) => {
        texts.push(String(text))
      }
    if (key === 'measureText')
      return (text: string) => ({ width: text.length * 5 })
    return () => ({ addColorStop() {} })
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D

function flyUntilDown(game: ReturnType<typeof create>, frames: InputFrame[]) {
  for (let frame = 0; frame < 20000; frame++) {
    const input = pilot(frame, game.snapshot.ships[0]!.y)
    frames.push(input)
    game.update(input)
    if (game.snapshot.continueLeft > 0) return
  }
  assert.fail('the scripted pilot was expected to fall')
}

const game = create()
const twin = create()
const log: InputFrame[] = []
flyUntilDown(game, log)
const down = game.snapshot
assert.equal(game.over, false, 'a fallen crew is offered a continue first')
assert.equal(game.lives, 0)
assert.equal(down.continueLeft, RAINBOW_CONTINUE.countdownFrames)
assert.ok(actOne.includes(down.checkpoint.frame))
assert.ok(down.checkpoint.frame > 0, 'the pilot passed a section checkpoint')
assert.ok(down.checkpoint.frame <= down.tick)
assert.ok(down.checkpoint.score <= down.score)

// The world holds still, and fire-button carry-over in the first frames does not spend the continue.
log.push(press())
game.update(log[log.length - 1]!)
assert.equal(game.snapshot.continueLeft, RAINBOW_CONTINUE.countdownFrames - 1)
for (let i = 0; i < 60; i++) {
  log.push(emptyInput())
  game.update(log[log.length - 1]!)
}
assert.equal(game.snapshot.tick, down.tick, 'the countdown freezes the Act')
assert.deepEqual(game.snapshot.enemies, down.enemies)
texts.length = 0
game.render(g)
assert.ok(texts.includes('CONTINUE?'))
assert.ok(texts.includes('9'), `countdown shown: ${texts.join(' | ')}`)
const where = checkpointLabel(
  PINKWAKE_SECTIONS,
  PINKWAKE.bossStarts,
  down.checkpoint.frame,
)
assert.ok(texts.includes(`PRESS A · ACT I · ${where}`))
assert.ok(
  texts.includes(`SCORE RETURNS TO ${down.checkpoint.score}`),
  'the screen says what the continue costs',
)

log.push(press())
game.update(log[log.length - 1]!)
const resumed = game.snapshot
assert.equal(resumed.continueLeft, 0)
assert.equal(resumed.continues, 1)
assert.equal(resumed.tick, resumeTick(down.checkpoint, null))
assert.equal(
  resumed.score,
  down.checkpoint.score,
  'score returns to the checkpoint',
)
assert.equal(resumed.schoolBonuses, down.checkpoint.schoolBonuses)
assert.equal(resumed.enemies.length, 0)
assert.equal(resumed.enemyShots.length, 0)
assert.equal(game.lives, 3)
assert.equal(resumed.ships[0]!.shield, 3)
assert.equal(
  resumed.ships[0]!.invulnerable,
  RAINBOW_CONTINUE.invulnerableFrames,
)

// The authored schedule replays from the checkpoint frame.
// Craft enter at x 498 and move at most 1.25 a frame, so only this frame's arrivals sit past 496.7.
let replayed = 0
for (let i = 0; i < 240; i++) {
  log.push(pilot(i, game.snapshot.ships[0]!.y))
  game.update(log[log.length - 1]!)
  const { tick, enemies } = game.snapshot
  if (i === 0) assert.equal(tick, down.checkpoint.frame)
  const fresh = enemies.filter((enemy) => enemy.x > 496.71).length
  assert.equal(fresh, pinkwakeSpawns(tick).length, `replayed spawns at ${tick}`)
  replayed += fresh
}
assert.ok(replayed > 0, 'the checkpoint section respawns its waves')

// Same seed, same inputs, same run: continuing keeps the engine deterministic.
for (const input of log) twin.update(input)
assert.deepEqual(twin.snapshot, game.snapshot)

// Letting the countdown run out ends the run as before.
flyUntilDown(game, [])
assert.ok(game.snapshot.checkpoint.frame >= down.checkpoint.frame)
for (let i = 0; i < RAINBOW_CONTINUE.countdownFrames; i++)
  game.update(emptyInput())
// (conductor rainbow t-012) Lilt's failure ending plays first, then the run ends.
assert.equal(game.over, false)
assert.equal(game.snapshot.failFrame, 0)
for (let i = 0; i < RAINBOW_FAILURE.holdFrames; i++) game.update(emptyInput())
assert.equal(game.over, true)
const final = game.snapshot
game.update(press())
assert.deepEqual(game.snapshot, final, 'a finished run ignores input')

console.log(
  `rainbow checkpoints: ok (fell at ${down.tick}, resumed from ${down.checkpoint.frame}, ${actOne.length}+${actTwo.length} checkpoints)`,
)
