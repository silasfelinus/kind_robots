import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import {
  RAINBOW_HERO_ART,
  RAINBOW_PILOTS,
  RAINBOW_PORTRAIT_ROOT,
} from '../arcade/games/rainbowPilots'

const root = new URL('../../', import.meta.url)
const page = readFileSync(
  new URL('pages/play/rainbow-bullet-hell-space-princess.vue', root),
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

// The roster is one console screen: the chosen pilot's portrait and card, with a P1–P4 picker strip.
assert.match(page, /id="princess-pilots"/)
assert.match(page, /aria-labelledby="princess-pilots-tab"/)
assert.match(page, /key: 'pilots'/)
assert.match(page, /v-for="option in RAINBOW_PILOTS"/)
assert.match(page, /:alt="pilot\.portraitAlt"/)
assert.match(page, /:aria-label="option\.glyphName"/)
assert.match(page, /P\{\{ pilot\.seat \+ 1 \}\}/)
assert.match(page, /P\{\{ option\.seat \+ 1 \}\}/)

const hero = new URL(`public${RAINBOW_HERO_ART}`, root)
assert.ok(existsSync(hero), `${RAINBOW_HERO_ART} is committed`)
assert.ok(statSync(hero).size < 200_000, 'hero backdrop stays light')
assert.match(page, /:src="RAINBOW_HERO_ART"/)
assert.match(
  page,
  /bg-gradient-to-r from-\[#251345\]/,
  'hero text keeps a dark scrim over the painted backdrop',
)

// The expedition gallery shows each stage's painted Act title card where one is clean; the others keep
// an image-shaped gradient slot. Every pilot card shows her super cut-in.
assert.match(page, /id="princess-expedition"/)
const cards = [...page.matchAll(/\$\{STAGE_CARD_ROOT\}\/(s0\d-card\.webp)/g)]
assert.equal(cards.length, 8, 'every stage carries a title card')
for (const [, name] of cards) {
  const file = new URL(`public/rainbow-princess-art/stages/${name}`, root)
  assert.ok(existsSync(file), `${name} is committed`)
  assert.ok(statSync(file).size < 60_000, `${name} stays light`)
}
assert.equal(
  (page.match(/^ {4}name: '/gm) ?? []).length,
  8,
  'all eight stages are listed',
)
assert.match(page, /:src="rainbowSuperCutin\(pilot\.seat\)"/)
assert.doesNotMatch(
  page,
  /restores a\s+damaged practice shield/,
  'flight school describes the real B button: focus and super',
)

console.log('rainbow pilot roster: ok')
