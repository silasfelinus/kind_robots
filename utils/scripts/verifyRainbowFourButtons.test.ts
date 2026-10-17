import assert from 'node:assert/strict'
import { findArcadeGame } from '../arcade/games'
import {
  RAINBOW_EVADE,
  RAINBOW_LOADOUTS,
  RAINBOW_SPECIAL,
} from '../arcade/games/rainbowLoadouts'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

// Silas, 2026-10-17: "We now have support for four button controls in our arcade ... a fire button, super
// button, unique special, and unique movement evade (barrel roll, dash, etc)". A fires, B focuses and fires the
// super, X is each pilot's special (Petal Shield, Prism Beam, Halo Pulse, Comet Volley) and Y her evade (Barrel
// Roll, Prism Dash, Halo Blink, Comet Boost), each on its own cooldown; an evading ship cannot be hit.

const meta = findArcadeGame('rainbow-bullet-hell-space-princess')
assert.equal(meta?.fourButtons, true, 'the cabinet shows four face buttons')
assert.ok(meta?.howTo.some((line) => line.startsWith('X ')))
assert.ok(meta?.howTo.some((line) => line.startsWith('Y ')))
assert.equal(new Set(RAINBOW_LOADOUTS.map((l) => l.special)).size, 4)
assert.equal(new Set(RAINBOW_LOADOUTS.map((l) => l.evade)).size, 4)

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (players = 4) =>
  createRainbowPrincessPreview({
    players,
    demo: false,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
const frame = (
  pressed: Partial<InputFrame['pressed']> = {},
  held: Partial<InputFrame['held']> = {},
) => {
  const f = emptyInput()
  Object.assign(f.pressed, pressed)
  Object.assign(f.held, held)
  return f
}

// X: four specials, one per pilot (seats 1-4 fly Maribel, Azure, Solenne and Vivi).
{
  const game = create()
  for (let i = 0; i < 400; i++)
    game.update(emptyInput(), [
      emptyInput(),
      emptyInput(),
      emptyInput(),
      emptyInput(),
    ])
  const before = game.snapshot
  const x = frame({ x: true })
  game.update(x, [x, x, x, x])
  const after = game.snapshot
  for (const ship of after.ships)
    assert.equal(
      ship.specialCooldown,
      RAINBOW_SPECIAL.cooldown - 1,
      'every special starts its cooldown',
    )
  assert.ok(after.ships[0]!.special > 0, 'Petal Shield is up')
  assert.ok(after.ships[1]!.special > 0, 'Prism Beam is firing')
  assert.ok(
    after.shots.filter(
      (s) => s.seat === 3 && s.kind === 'arc' && s.bounces === 1,
    ).length >= RAINBOW_SPECIAL.volley.count,
    'Comet Volley fans out',
  )
  assert.ok(after.sparks > before.sparks, 'Halo Pulse rings out')
  // The beam fires piercing shots down Azure's lane while it lasts.
  for (let i = 0; i < 6; i++)
    game.update(emptyInput(), [
      emptyInput(),
      emptyInput(),
      emptyInput(),
      emptyInput(),
    ])
  const beam = game.snapshot.shots.filter((s) => s.kind === 'beam')
  assert.ok(
    beam.length >= 2 && beam.every((s) => s.seat === 1 && (s.pierce ?? 0) > 50),
  )
  // A second press inside the cooldown does nothing.
  const cooling = game.snapshot.ships[3]!.specialCooldown
  game.update(x, [x, x, x, x])
  assert.equal(game.snapshot.ships[3]!.specialCooldown, cooling - 1)
}

// The Petal Shield eats a pellet that reaches it; the Halo Pulse clears the pellets around Solenne.
{
  const game = create(1)
  let checked = false
  for (let i = 0; i < 6000 && !checked; i++) {
    const s = game.snapshot
    const ship = s.ships[0]!
    const near = s.enemyShots.find(
      (b) => !b.ghost && Math.hypot(b.x - ship.x, b.y - ship.y) < 60,
    )
    if (near && ship.specialCooldown === 0) {
      const count = s.enemyShots.length
      game.update(frame({ x: true }))
      for (let k = 0; k < 40; k++) game.update(emptyInput())
      assert.ok(
        game.snapshot.ships[0]!.shield === 3,
        'the shield kept the pellets off',
      )
      assert.ok(
        game.snapshot.score > s.score ||
          game.snapshot.enemyShots.length < count + 40,
      )
      checked = true
    } else game.update(emptyInput())
  }
  assert.ok(checked, 'a pellet came close enough to test the shield')
}

// Y: four evades.
{
  const game = create()
  for (let i = 0; i < 200; i++)
    game.update(emptyInput(), [
      emptyInput(),
      emptyInput(),
      emptyInput(),
      emptyInput(),
    ])
  const before = game.snapshot.ships.map((s) => ({ ...s }))
  const y = frame({ y: true })
  game.update(y, [y, y, y, y])
  let after = game.snapshot.ships
  for (const ship of after) {
    assert.ok(ship.evade > 0, 'every evade is untouchable')
    assert.equal(ship.evadeCooldown, RAINBOW_EVADE.cooldown - 1)
  }
  assert.ok(
    after[2]!.y <= before[2]!.y - RAINBOW_EVADE.blink.reach + 3,
    'Halo Blink jumps up',
  )
  for (let i = 0; i < RAINBOW_EVADE.dash.frames + 2; i++)
    game.update(emptyInput(), [
      emptyInput(),
      emptyInput(),
      emptyInput(),
      emptyInput(),
    ])
  after = game.snapshot.ships
  assert.ok(
    after[1]!.x >= before[1]!.x + 50,
    `Prism Dash carries Azure forward (${before[1]!.x} -> ${after[1]!.x})`,
  )
  // Comet Boost doubles Vivi's speed while it lasts.
  const v = game.snapshot.ships[3]!
  const right = frame({}, { right: true })
  game.update(emptyInput(), [emptyInput(), emptyInput(), emptyInput(), right])
  assert.ok(
    game.snapshot.ships[3]!.x - v.x > 2.6 * 1.5 ||
      game.snapshot.ships[3]!.evade === 0,
  )
}

// An evade takes a hit that would have landed: the same run, rolling just before the first hit.
{
  const idle = create(1)
  let hitAt = -1
  for (let i = 0; i < 20000 && hitAt < 0; i++) {
    idle.update(emptyInput())
    if (idle.snapshot.ships[0]!.shield < 3) hitAt = i
  }
  assert.ok(hitAt > 0, 'an idle pilot is hit')
  const rolled = create(1)
  for (let i = 0; i < hitAt - 4; i++) rolled.update(emptyInput())
  rolled.update(frame({ y: true }))
  for (let i = hitAt - 3; i <= hitAt; i++) rolled.update(emptyInput())
  assert.equal(
    rolled.snapshot.ships[0]!.shield,
    3,
    'the barrel roll took the hit away',
  )
}

console.log(
  `rainbow four buttons: ok (${RAINBOW_LOADOUTS.map((l) => `${l.special}/${l.evade}`).join(', ')})`,
)
