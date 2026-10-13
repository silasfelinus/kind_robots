import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import {
  RAINBOW_PILOTS,
  RAINBOW_PORTRAIT_ROOT,
} from '../arcade/games/rainbowPilots'

const root = new URL('../../', import.meta.url)
const page = readFileSync(
  new URL('pages/admin/rainbow-bullet-hell-space-princess.vue', root),
  'utf8',
)
const engine = readFileSync(
  new URL('utils/arcade/games/rainbowPrincessPreview.ts', root),
  'utf8',
)

assert.equal(RAINBOW_PILOTS.length, 4, 'four playable princesses')
assert.deepEqual(
  RAINBOW_PILOTS.map((pilot) => pilot.seat),
  [0, 1, 2, 3],
  'roster order is the P1–P4 seat order',
)
assert.deepEqual(
  RAINBOW_PILOTS.map((pilot) => [pilot.name, pilot.ship]),
  [
    ['Maribel Rowan', 'Petal Wing'],
    ['Azure Lin', 'Prism Lance'],
    ['Solenne Adisa', 'Halo Fin'],
    ['Vivi Reyes', 'Comet Crown'],
  ],
  'cast-bible pilot ↔ ship links are fixed',
)

for (const field of ['key', 'glyphName', 'portrait', 'color'] as const)
  assert.equal(
    new Set(RAINBOW_PILOTS.map((pilot) => pilot[field])).size,
    4,
    `every pilot has a distinct ${field}`,
  )

const engineColors = engine.match(/PILOT_COLORS = \[([^\]]+)\]/)?.[1]
assert.ok(engineColors, 'the engine still declares its seat colors')
assert.deepEqual(
  RAINBOW_PILOTS.map((pilot) => pilot.color),
  [...engineColors.matchAll(/'(#[0-9a-f]{6})'/gi)].map((match) => match[1]),
  'roster colors match the in-game seat colors',
)

for (const pilot of RAINBOW_PILOTS) {
  assert.ok(
    pilot.glyph.shape === 'rings' || Boolean(pilot.glyph.d),
    `${pilot.name} has a drawable non-color glyph`,
  )
  assert.ok(
    pilot.portrait.startsWith(`${RAINBOW_PORTRAIT_ROOT}/`),
    `${pilot.name} portrait lives under ${RAINBOW_PORTRAIT_ROOT}`,
  )
  const file = new URL(`public${pilot.portrait}`, root)
  assert.ok(existsSync(file), `${pilot.portrait} is committed`)
  assert.ok(statSync(file).size < 150_000, `${pilot.portrait} stays light`)
  assert.ok(
    pilot.portraitAlt.length > 40 && pilot.portraitAlt.includes(pilot.name),
    `${pilot.name} portrait has descriptive alt text`,
  )
}

assert.match(page, /id="princess-pilots"/)
assert.match(page, /v-for="pilot in RAINBOW_PILOTS"/)
assert.match(page, /:alt="pilot\.portraitAlt"/)
assert.match(page, /:aria-label="pilot\.glyphName"/)
assert.match(page, /P\{\{ pilot\.seat \+ 1 \}\}/)
assert.match(page, /href="#princess-pilots"/)

console.log('rainbow pilot roster: ok')
