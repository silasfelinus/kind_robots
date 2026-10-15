import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import {
  RAINBOW_COMMS_SPEAKERS,
  RAINBOW_SHIP_SPRITES,
  drawRainbowCommsPortrait,
  drawRainbowShipSprite,
  rainbowCommsKey,
  rainbowCommsPortrait,
  rainbowShipSprite,
} from '../arcade/games/rainbowGameArt'

// Silas, 2026-10-14 PT: "upgrade ship art, and get the pilot portraits for the interstitial talking
// moments." Painted ships and comms portraits are optional decoration: the vector hull stands in until a
// sprite loads, and the fair 6px core marker always draws on top of whichever picture is showing.

const publicFile = (src: string) =>
  new URL(`../../public${src}`, import.meta.url)

assert.equal(
  rainbowShipSprite(0),
  '/rainbow-princess-art/ships/petal-wing.webp',
)
assert.equal(
  rainbowShipSprite(3),
  '/rainbow-princess-art/ships/comet-crown.webp',
)
assert.equal(rainbowShipSprite(4), rainbowShipSprite(0), 'seats wrap')

assert.equal(rainbowCommsKey('Lilt-7'), 'lilt')
assert.equal(rainbowCommsKey('Maribel'), 'maribel')
assert.equal(rainbowCommsKey('Opal (reef radio)'), 'opal', 'first word matches')
assert.equal(rainbowCommsKey('Aurelia'), null)
assert.equal(
  rainbowCommsPortrait('Aurelia'),
  null,
  'unknown speakers keep the text-only box',
)

for (const key of Object.values(RAINBOW_COMMS_SPEAKERS)) {
  const file = publicFile(`/rainbow-princess-art/comms/${key}.webp`)
  assert.ok(existsSync(file), `comms portrait for ${key} is committed`)
  assert.ok(statSync(file).size < 32_000, `${key} portrait stays small`)
}
let painted = 0
for (const key of RAINBOW_SHIP_SPRITES) {
  const file = publicFile(`/rainbow-princess-art/ships/${key}.webp`)
  if (!existsSync(file)) continue
  painted++
  assert.ok(statSync(file).size < 32_000, `${key} sprite stays small`)
}
assert.ok(painted >= 3, 'the painted ships are committed')

// Headless (no Image): nothing draws and the engine falls back to its vector art.
const g = {} as CanvasRenderingContext2D
assert.equal(drawRainbowShipSprite(g, 0), false)
assert.equal(drawRainbowCommsPortrait(g, 'Maribel', 0, 0, 40), false)

const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
const sprite = engine.indexOf('if (!drawRainbowShipSprite(g, seat))')
const core = engine.indexOf('g.fillRect(-3, -3, 6, 6)', sprite)
assert.ok(
  sprite > 0 && core > sprite,
  'the core marker draws over the ship sprite',
)
assert.match(engine, /drawRainbowCommsPortrait\(\s*g,\s*dialogue\.speaker/)

console.log(`rainbow game art: ok (${painted}/4 painted ships)`)
