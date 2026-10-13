import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'
import {
  addCoopSeats,
  availableCoopTargets,
  boundedCoopSeats,
  coopEnemyHealth,
  haloRevive,
} from '../arcade/games/rainbowLocalCoop'

const start = (seat: number) => ({
  lives: 3,
  shield: 3,
  invulnerable: 120,
  power: 1,
  seat,
})
assert.equal(boundedCoopSeats(-8), 1)
assert.equal(boundedCoopSeats(2.8), 2)
assert.equal(boundedCoopSeats(999), 4)
assert.equal(boundedCoopSeats(Number.NaN), 1)

const ships = [start(0)]
ships[0]!.power = 3
assert.equal(addCoopSeats(ships, 4, start), 4)
assert.equal(ships.length, 4)
ships[1]!.lives = 0
ships[1]!.power = 2
assert.equal(addCoopSeats(ships, 1, start), 1)
assert.equal(ships.length, 4, 'leaving benches ships instead of deleting them')
assert.equal(addCoopSeats(ships, 4, start), 4)
assert.equal(ships[0]!.power, 3, 'joining never resets the original pilot')
assert.equal(ships[1]!.lives, 0, 'leaving and joining never grants free lives')
assert.equal(ships[1]!.power, 2, 'bench remembers upgrades')

assert.deepEqual(
  availableCoopTargets(ships, 2).map((s) => s.seat),
  [0],
)
assert.deepEqual(
  availableCoopTargets(ships, 4).map((s) => s.seat),
  [0, 2, 3],
)

assert.equal(haloRevive(ships, 2, 2), null, 'inactive caster cannot revive')
assert.equal(haloRevive(ships, 4, 0), null, 'non-Halo pilots cannot revive')
assert.equal(
  haloRevive(ships, 4, 2),
  1,
  'Halo revives the first fallen active seat',
)
assert.equal(ships[1]!.lives, 1)
assert.equal(ships[1]!.shield, 2)
assert.equal(ships[1]!.invulnerable, 150)
assert.equal(ships[1]!.power, 2)
assert.equal(haloRevive(ships, 4, 2), null, 'revival is not a free refill')
ships[2]!.lives = 0
ships[3]!.lives = 0
assert.equal(haloRevive(ships, 4, 2), null, 'a dead Halo cannot cast')

assert.equal(coopEnemyHealth(2, 1), 2)
assert.equal(coopEnemyHealth(2, 2), 2)
assert.equal(coopEnemyHealth(2, 3), 3)
assert.equal(coopEnemyHealth(2, 4), 3)
const cabinet = readFileSync(
  new URL('../../components/arcade/arcade-cabinet.vue', import.meta.url),
  'utf8',
)
assert.match(cabinet, /canChangePlayers/)
assert.match(cabinet, /game\.setPlayers\(players\.value\)/)
assert.match(cabinet, /phase\.value === 'paused'/)

const rng = () => 0.5
const flight = createRainbowPrincessPreview({
  rng,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  players: 1,
})
const input = emptyInput()
input.held.right = true
for (let i = 0; i < 60; i++) flight.update(input)
const original = flight.snapshot.ships[0]!
const tick = flight.snapshot.tick
flight.setPlayers?.(4)
assert.equal(flight.snapshot.activePlayers, 4)
assert.equal(flight.snapshot.ships.length, 4)
assert.equal(flight.snapshot.ships[0]!.x, original.x)
assert.equal(flight.snapshot.tick, tick)
assert.equal(flight.lives, 12)

const p1 = emptyInput()
const p2 = emptyInput()
const p3 = emptyInput()
const p4 = emptyInput()
p3.held.up = true
const yBefore = flight.snapshot.ships[2]!.y
flight.update(p1, [p1, p2, p3, p4])
assert.ok(
  flight.snapshot.ships[2]!.y < yBefore,
  'seat three flies independently',
)
assert.equal(
  flight.snapshot.ships[1]!.y,
  112,
  'an idle seat does not copy P1 input',
)
flight.setPlayers?.(1)
assert.equal(flight.snapshot.activePlayers, 1)
assert.equal(flight.lives, 3)
const bench = flight.snapshot.tick
flight.setPlayers?.(4)
assert.equal(
  flight.snapshot.tick,
  bench,
  'seat toggling does not reset Act progress',
)
assert.ok(
  flight.snapshot.ships[2]!.y < yBefore,
  'rejoining retains flown position',
)

const benchEffects: string[] = []
const benchFlight = createRainbowPrincessPreview({
  rng: () => 0.5,
  sound: {
    play: (effect) => {
      benchEffects.push(effect)
    },
  },
  demo: false,
  hiScore: 0,
  players: 2,
})
for (let frame = 0; frame < 8; frame++) {
  const p1 = emptyInput()
  const p2 = emptyInput()
  p2.held.down = true
  benchFlight.update(p1, [p1, p2])
}
const benchY = benchFlight.snapshot.ships[1]!.y
assert.ok(Math.abs(benchY - 132.8) < 0.01)
benchFlight.setPlayers?.(1)
assert.equal(benchFlight.snapshot.activePlayers, 1)
for (let frame = 0; frame < 21; frame++) {
  const move = emptyInput()
  move.held.down = true
  benchFlight.update(move)
}
let dropped = false
for (let frame = 0; frame < 1000; frame++) {
  const fire = emptyInput()
  fire.held.a = true
  benchFlight.update(fire)
  if (benchFlight.snapshot.pickups.some((pickup) => pickup.kind === 'power')) {
    dropped = true
    break
  }
}
assert.ok(
  dropped,
  'the active pilot earns a real power pickup from enemy defeats',
)
for (let frame = 0; frame < 21; frame++) {
  const move = emptyInput()
  move.held.up = true
  benchFlight.update(move)
}
assert.ok(benchFlight.snapshot.ships[0]!.y < 85)
let expired = false
for (let frame = 0; frame < 900; frame++) {
  const previous = benchFlight.snapshot.pickups.find(
    (pickup) => pickup.kind === 'power',
  )
  benchFlight.update(emptyInput())
  const remains = benchFlight.snapshot.pickups.some(
    (pickup) => pickup.kind === 'power',
  )
  if (previous && !remains) {
    expired = true
    assert.ok(
      previous.x < -12,
      'the pickup must leave the screen, not be collected',
    )
    break
  }
}
assert.ok(expired, 'unclaimed power drop eventually leaves the battlefield')
assert.equal(benchEffects.filter((effect) => effect === 'pickup').length, 0)
const beforeRejoin = benchFlight.snapshot.tick
benchFlight.setPlayers?.(2)
assert.equal(benchFlight.snapshot.tick, beforeRejoin)
assert.equal(benchFlight.snapshot.ships[1]!.y, benchY)
assert.equal(
  benchFlight.snapshot.ships[1]!.power,
  1,
  'a benched pilot cannot quietly inherit pickups meant for active crew',
)
assert.equal(benchFlight.snapshot.ships[1]!.lives, 3)

console.log(
  'Rainbow Princess local co-op roster, fair scaling and earned revive passed',
)
