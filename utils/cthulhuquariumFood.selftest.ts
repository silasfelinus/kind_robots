import assert from 'node:assert/strict'
import {
  makeFeedParticles,
  nearestFood,
  MAX_FOOD_PER_FEED,
  type FedSwimmer,
} from './cthulhuquariumFood'

function predictableRandom() {
  const numbers = [0.17, 0.83, 0.36, 0.59, 0.72, 0.41]
  let index = 0
  return () => numbers[index++ % numbers.length]!
}

const swimmers: FedSwimmer[] = [
  { stockId: 1, x: 85, y: 72 },
  { stockId: 2, x: 300, y: 180 },
  { stockId: 3, x: 550, y: 290 },
]
const fed = [1, 2, 3]
const a = makeFeedParticles(fed, swimmers, 640, 360, predictableRandom())
const b = makeFeedParticles(fed, swimmers, 640, 360, predictableRandom())
assert.deepEqual(a, b, 'fed positions reproduce with an injected RNG')
assert.equal(a.length, fed.length)
assert.ok(new Set(a.map((particle) => Math.round(particle.x))).size > 1)
assert.ok(new Set(a.map((particle) => Math.round(particle.y))).size > 1)
assert.ok(
  a[0]!.y > swimmers[0]!.y,
  'surface fish receive food below the ceiling',
)
assert.ok(a[1]!.y < swimmers[1]!.y, 'deeper fish receive food above them')
for (const drop of a) {
  assert.ok(drop.x >= 24 && drop.x <= 616, 'horizontal tap-safe margins')
  assert.ok(drop.y >= 24 && drop.y <= 330, 'vertical tap-safe margins')
}

const coincident: FedSwimmer[] = Array.from({ length: 8 }, (_, index) => ({
  stockId: index + 10,
  x: 280,
  y: 175,
}))
const sameSpot = makeFeedParticles(
  coincident.map((s) => s.stockId),
  coincident,
  640,
  360,
  () => 0.5,
)
assert.ok(
  new Set(sameSpot.map((drop) => `${drop.x},${drop.y}`)).size > 1,
  'even fish that currently overlap get visually distinct food positions',
)

const many = Array.from({ length: 40 }, (_, index) => index + 1)
const manySwimmers = many.map((stockId) => ({
  stockId,
  x: 35 + stockId * 14,
  y: 100 + (stockId % 5) * 35,
}))
const capped = makeFeedParticles(many, manySwimmers, 640, 360, () => 0.5)
assert.equal(
  capped.length,
  MAX_FOOD_PER_FEED,
  'large tanks cap active particles',
)
assert.ok(
  capped.some((drop) => drop.x > 450),
  'sampling includes late fed fish',
)

const emptySwimmers = makeFeedParticles(fed, [], 640, 360, predictableRandom())
assert.equal(emptySwimmers.length, 3)
assert.ok(emptySwimmers.every((drop) => drop.x >= 24 && drop.y >= 24))

const mobile = makeFeedParticles(fed, swimmers, 320, 180, predictableRandom())
assert.ok(
  mobile.every(
    (drop) => drop.x >= 24 && drop.x <= 296 && drop.y >= 24 && drop.y <= 150,
  ),
)
assert.deepEqual(makeFeedParticles([], swimmers, 640, 360), [])
assert.deepEqual(makeFeedParticles(fed, swimmers, 50, 60), [])

const left = { x: 40, y: 100 }
const right = { x: 580, y: 100 }
assert.equal(nearestFood(left, [left, right]), left)
assert.equal(nearestFood(right, [left, right]), right)
assert.equal(nearestFood({ x: 300, y: 300 }, [left], 100), null)
assert.equal(nearestFood(left, []), null)
console.log('Aquarium feeding distribution and nearest-food behavior passed.')
