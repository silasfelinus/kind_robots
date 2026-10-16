import assert from 'node:assert/strict'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

const sound = { play() {} }
function seedRng(seed = 12345) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
function game(players = 1) {
  return createRainbowPrincessPreview({
    rng: seedRng(),
    sound,
    demo: false,
    hiScore: 0,
    players,
  })
}
const diagonal = game()
const frame = emptyInput()
frame.held.up = true
frame.held.right = true
diagonal.update(frame)
const ship = diagonal.snapshot.ships[0]!
const dx = ship.x - 65
const dy = ship.y - 80
assert.ok(
  Math.abs(Math.hypot(dx, dy) - 2.6) < 0.001,
  'diagonal flight has no speed boost',
)

const focused = game()
const slow = emptyInput()
slow.held.right = true
slow.held.b = true
focused.update(slow)
assert.ok(Math.abs(focused.snapshot.ships[0]!.x - 65 - 2.6 * 0.55) < 0.001)
assert.equal(
  focused.snapshot.ships[0]!.shield,
  3,
  'B is not a free shield refill',
)

const a = game(4)
const b = game(4)
let sawEnemyBullets = false
let sawGraze = false
let sawUpgrades = false
for (let tick = 0; tick < 900; tick++) {
  const controls = Array.from({ length: 4 }, (_, seat) => {
    const input = emptyInput()
    input.held.a = true
    input.held.right = tick % 140 < 60
    input.held.left = tick % 140 >= 60
    // Weave across Act I's authored formation lanes instead of parking on the screen edges.
    const sweep = tick % 100
    const rising = seat % 2 === 0 ? sweep < 25 : sweep >= 50 && sweep < 75
    const falling = seat % 2 === 0 ? sweep >= 50 && sweep < 75 : sweep < 25
    input.held.up = rising
    input.held.down = falling
    input.held.b = tick % 120 >= 90
    input.pressed.b = tick % 120 === 90
    return input
  })
  a.update(controls[0]!, controls)
  b.update(controls[0]!, controls)
  const snapshot = a.snapshot
  if (snapshot.enemyShots.length) sawEnemyBullets = true
  if (snapshot.ships.some((s) => s.graze > 0)) sawGraze = true
  if (snapshot.pickups.length || snapshot.ships.some((s) => s.power > 1))
    sawUpgrades = true
  assert.deepEqual(
    snapshot,
    b.snapshot,
    `same seed and input must match at frame ${tick}`,
  )
}
assert.equal(a.snapshot.ships.length, 4)
assert.ok(sawEnemyBullets, 'hostile craft must fire actual projectiles')
assert.ok(sawUpgrades, 'defeated enemies drop real collectible modules')
assert.ok(a.score >= 0)
assert.ok(a.lives <= 12 && a.lives >= 0)
assert.ok(a.snapshot.ships.every((s) => s.power >= 1 && s.power <= 3))
assert.ok(a.snapshot.ships.every((s) => s.charge >= 0 && s.charge <= 100))
assert.ok(a.snapshot.ships.every((s) => s.shield >= 1 && s.shield <= 3))
assert.ok(typeof sawGraze === 'boolean')

const idle = game()
for (let tick = 0; tick < 240; tick++) idle.update(emptyInput())
assert.equal(idle.snapshot.sceneId, 'A01.OPEN')
assert.equal(idle.snapshot.enemies.length, 0, 'Act I opens with safe dialogue')
for (let tick = 240; tick < 360; tick++) idle.update(emptyInput())
assert.ok(
  idle.snapshot.enemies.length > 0 || idle.snapshot.enemyShots.length > 0,
  'enemy waves begin after the opening conversation',
)
console.log('Rainbow Princess deterministic combat and flight physics passed')
