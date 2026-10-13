import assert from 'node:assert/strict'
import { enemyBulletContact } from '../arcade/games/rainbowHitGeometry'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

assert.equal(enemyBulletContact(0, false, 10, 15), 'hit')
assert.equal(enemyBulletContact(9.99, false, 10, 15), 'hit')
assert.equal(
  enemyBulletContact(0, true, 10, 15),
  'protected',
  'an invulnerable core overlap is not an earned graze',
)
assert.equal(enemyBulletContact(9.99, true, 10, 15), 'protected')
const protectedFirst = enemyBulletContact(2, true, 10, 15)
const grazeAfter = enemyBulletContact(12, true, 10, 15)
const grazeMask = protectedFirst === 'protected' ? 1 : 0
const bonus = grazeAfter === 'graze' && (grazeMask & 1) === 0
assert.equal(bonus, false, 'a protected core crossing disqualifies its later near-miss bonus')
assert.equal(grazeMask, 1)
assert.equal(enemyBulletContact(10, false, 10, 15), 'graze')
assert.equal(enemyBulletContact(14.99, true, 10, 15), 'graze')
assert.equal(enemyBulletContact(15, false, 10, 15), null)
assert.equal(enemyBulletContact(Number.NaN, false, 10, 15), null)

type Flight = ReturnType<typeof createRainbowPrincessPreview>
const allSeats = (seat: number, overrides?: Partial<ReturnType<typeof emptyInput>>) => {
  const seats = Array.from({ length: 4 }, () => emptyInput())
  Object.assign(seats[seat]!, overrides)
  return seats
}
function step(game: Flight, seat: number, fire = false, pressSuper = false, focus = false) {
  const frames = allSeats(seat)
  frames[seat]!.held.a = fire
  frames[seat]!.held.b = focus || pressSuper
  frames[seat]!.pressed.b = pressSuper
  game.update(frames[0]!, frames)
}

for (let seat = 0; seat < 4; seat++) {
  const effects: string[] = []
  const targetY = 80 + seat * 32
  const game = createRainbowPrincessPreview({
    rng: () => (targetY - 40) / 190,
    sound: { play: (sound) => effects.push(sound) },
    demo: false,
    hiScore: 0,
    players: 4,
  })

  step(game, seat, false, true)
  assert.equal(game.snapshot.ships[seat]!.charge, 0, 'premature B cannot fire')
  assert.equal(effects.filter((effect) => effect === 'extra').length, 0)

  let earned = false
  for (let frame = 0; frame < 1550; frame++) {
    step(game, seat, true)
    if (game.snapshot.ships[seat]!.charge === 100) {
      earned = true
      break
    }
  }
  assert.ok(earned, `pilot ${seat + 1} must earn a super through real gun hits`)
  assert.equal(game.snapshot.activePlayers, 4)

  for (let i = 0; i < 3; i++) step(game, seat, false, false, true)
  assert.equal(
    game.snapshot.ships[seat]!.charge,
    100,
    'holding focus without a new B edge cannot spend charge',
  )
  assert.equal(effects.filter((effect) => effect === 'extra').length, 0)

  let hostile = false
  for (let i = 0; i < 480; i++) {
    step(game, seat)
    if (game.snapshot.enemyShots.length) {
      hostile = true
      break
    }
  }
  assert.ok(hostile, `pilot ${seat + 1} must face a real hostile shot`)
  const previousBullets = game.snapshot.enemyShots.length
  const beforeScore = game.score
  step(game, seat, false, true)
  assert.equal(effects.filter((effect) => effect === 'extra').length, 1)
  assert.ok(
    game.snapshot.ships[seat]!.charge < 100,
    'a fired super consumes its full charge before any earned refill',
  )
  assert.ok(
    game.snapshot.enemyShots.length < previousBullets,
    'a charged super cancels the existing hostile bullet field',
  )
  assert.ok(game.score >= beforeScore, 'the super never subtracts earned score')
  assert.ok(
    game.snapshot.ships.every((pilot) => pilot.shield >= 1 && pilot.shield <= 3),
  )
  step(game, seat, false, false, true)
  assert.equal(effects.filter((effect) => effect === 'extra').length, 1)
  step(game, seat, false, true)
  assert.equal(
    effects.filter((effect) => effect === 'extra').length,
    1,
    'another B press without re-earning charge cannot chain a super',
  )
}

const damageGame = createRainbowPrincessPreview({
  rng: () => (80 - 40) / 190,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  players: 1,
})
let hit = false
for (let i = 0; i < 2000; i++) {
  damageGame.update(emptyInput())
  if (damageGame.snapshot.ships[0]!.shield < 3) {
    hit = true
    break
  }
}
assert.ok(hit, 'the actual hostile bullet path must inflict shield damage')
const damaged = damageGame.snapshot
assert.equal(damaged.ships[0]!.shield, 2)
assert.ok(damaged.ships[0]!.invulnerable > 0)
for (let i = 0; i < 45; i++) damageGame.update(emptyInput())
assert.equal(
  damageGame.snapshot.ships[0]!.shield,
  2,
  'damage cannot strip multiple shields during post-hit invulnerability',
)
assert.equal(damaged.ships[0]!.shield, 2, 'past snapshots are value copies')
assert.equal(damaged.ships[0]!.invulnerable, 90, 'past damage state is stable')

const shieldEffects: string[] = []
const pickupGame = createRainbowPrincessPreview({
  rng: () => (80 - 40) / 190,
  sound: { play: (effect) => shieldEffects.push(effect) },
  demo: false,
  hiScore: 0,
  players: 1,
})
let shieldSeen = false
let shieldCaught = false
for (let tick = 0; tick < 1600; tick++) {
  const current = pickupGame.snapshot
  const target = current.pickups.find((pickup) => pickup.kind === 'shield')
  const input = emptyInput()
  input.held.a = true
  if (target) {
    shieldSeen = true
    const ship = current.ships[0]!
    input.held.right = ship.x < target.x - 4
    input.held.left = ship.x > target.x + 4
    input.held.up = ship.y > target.y + 4
    input.held.down = ship.y < target.y - 4
  }
  pickupGame.update(input)
  if (target && !pickupGame.snapshot.pickups.some((pickup) => pickup.kind === 'shield')) {
    const ship = pickupGame.snapshot.ships[0]!
    shieldCaught =
      Math.hypot(ship.x - target.x, ship.y - target.y) < 20 &&
      pickupGame.snapshot.ships[0]!.shield === 3
    if (shieldCaught) break
  }
}
assert.ok(shieldSeen, 'enemy defeats must generate the shield pickup')
assert.ok(shieldCaught, 'an actual moving pilot can collect the shield pickup')
assert.equal(pickupGame.snapshot.ships[0]!.shield, 3, 'repair caps at three shields')
assert.ok(shieldEffects.includes('pickup'), 'collecting produces pickup feedback')

console.log('Rainbow Princess earned supers, bullet cancellation and shield boundaries passed')
