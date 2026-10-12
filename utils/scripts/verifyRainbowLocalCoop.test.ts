import assert from 'node:assert/strict'
import {
  addCoopSeats,
  availableCoopTargets,
  boundedCoopSeats,
  coopEnemyHealth,
  haloRevive,
} from '../arcade/games/rainbowLocalCoop'

const start = (seat: number) => ({
  lives: 3, shield: 3, invulnerable: 120, power: 1, seat,
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

assert.deepEqual(availableCoopTargets(ships, 2).map((s) => s.seat), [0])
assert.deepEqual(availableCoopTargets(ships, 4).map((s) => s.seat), [0, 2, 3])

assert.equal(haloRevive(ships, 2, 2), null, 'inactive caster cannot revive')
assert.equal(haloRevive(ships, 4, 0), null, 'non-Halo pilots cannot revive')
assert.equal(haloRevive(ships, 4, 2), 1, 'Halo revives the first fallen active seat')
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
console.log('Rainbow Princess local co-op roster, fair scaling and earned revive passed')
