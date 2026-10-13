import assert from 'node:assert/strict'
import {
  PLUMBER_ART,
  keyOutBackground,
  keyedSprite,
  plumberHeroine,
  plumberStageArt,
  plumberStageSlug,
  setPlumberHeroine,
  stagePlate,
} from '../arcade/games/savePlumberArt'
import { createHeroine } from '../arcade/games/savePlumberHeroine'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { PLUMBER_WORLDS } from '../arcade/games/savePlumberWorlds'
import { emptyInput } from '../arcade/types'

const stagePaths = PLUMBER_WORLDS.flatMap((world) =>
  world.stages.map((stage) => plumberStageArt(stage.code)),
)
assert.equal(stagePaths.length, 32)
assert.equal(new Set(stagePaths).size, 32)
for (const path of stagePaths)
  assert.match(
    path ?? '',
    /^\/images\/arcade\/save-the-plumber\/stages\/\d-\d-[a-z0-9-]+\.webp$/,
  )
assert.equal(
  plumberStageArt('1-1'),
  '/images/arcade/save-the-plumber/stages/1-1-rainy-courtyard.webp',
)
assert.equal(plumberStageSlug('The Pump Tower'), 'pump-tower')
assert.equal(
  plumberStageSlug('Midnight Plumbing Bazaar'),
  'midnight-plumbing-bazaar',
)
assert.equal(plumberStageArt('9-9'), null)
assert.equal(
  PLUMBER_ART.enemy('pumpbug'),
  '/images/arcade/save-the-plumber/enemies/pumpbug.webp',
)
assert.equal(
  PLUMBER_ART.boss('lady-spigot', 'tell'),
  '/images/arcade/save-the-plumber/bosses/lady-spigot-tell.webp',
)
assert.equal(
  PLUMBER_ART.tile(1),
  '/images/arcade/save-the-plumber/tiles/world-1-ground.webp',
)

function sprite(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4).fill(255)
  const paint = (x: number, y: number, rgb: [number, number, number]) => {
    const i = (y * width + x) * 4
    data[i] = rgb[0]
    data[i + 1] = rgb[1]
    data[i + 2] = rgb[2]
  }
  for (let y = 6; y < 14; y++)
    for (let x = 5; x < 15; x++)
      paint(
        x,
        y,
        y === 6 || y === 13 || x === 5 || x === 14
          ? [20, 20, 30]
          : [183, 118, 150],
      )
  paint(9, 9, [255, 255, 255])
  return data
}
const data = sprite(20, 20)
const box = keyOutBackground(data, 20, 20)
assert.deepEqual(box, { left: 5, top: 6, right: 14, bottom: 13 })
assert.equal(data[3], 0, 'border background becomes transparent')
assert.equal(
  data[(9 * 20 + 9) * 4 + 3],
  255,
  'an enclosed white highlight survives',
)
assert.ok(data[(6 * 20 + 5) * 4 + 3]! > 0, 'the outline stays opaque')
assert.equal(
  keyOutBackground(new Uint8ClampedArray(16 * 4).fill(255), 4, 4),
  null,
)

assert.equal(
  stagePlate(plumberStageArt('1-1')!),
  null,
  'headless: no plate, fallback art',
)
assert.equal(keyedSprite(PLUMBER_ART.enemy('pumpbug')), null)

const kept = createHeroine(19)
setPlumberHeroine(kept)
assert.equal(plumberHeroine(), kept)

const game = createSavePlumberPreview({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
})
const input = emptyInput()
input.held.left = true
for (let frame = 0; frame < 20; frame++) game.update(input)
input.held.left = false
input.held.right = true
for (let frame = 0; frame < 60; frame++) game.update(input)
assert.equal(game.over, false)
assert.equal(game.lives, 3)

console.log(
  'Save the Plumber art: paths, background keying, heroine handoff and fallbacks verified',
)
