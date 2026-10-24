import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  RAINBOW_BAD_DOG,
  RAINBOW_DOG_COMMANDERS,
  RAINBOW_SQUADRON,
} from '../arcade/games/rainbowDogs'
import { RAINBOW_PILOTS } from '../arcade/games/rainbowPilots'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { RAINBOW_BOSS_LOOKS } from '../arcade/games/rainbowShotLooks'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-037, Silas 2026-10-23 PT: "the good team is "C.A.T.S.", the villains are DOGS." Every boss
// machine has a DOG commander who barks as it arrives and is sent home with BAD DOG! when it falls; boss fire is
// bones, tennis balls and storm clouds; every princess flies with a cat co-pilot (DOODLE-DIRECTION.md).

assert.equal(RAINBOW_SQUADRON.name, 'C.A.T.S.')
assert.equal(RAINBOW_SQUADRON.stands, 'Cute And Tough Starfighters')
const commanders = Object.values(RAINBOW_DOG_COMMANDERS)
assert.equal(commanders.length, 9, 'a commander for every boss')
assert.equal(
  new Set(commanders.map((c) => c.name)).size,
  9,
  'nine different dogs',
)
assert.equal(RAINBOW_DOG_COMMANDERS[9].name, 'KING RUFUS')
assert.deepEqual(
  RAINBOW_PILOTS.map((pilot) => pilot.copilot.name),
  ['Biscuit', 'Comet', 'Butter', 'Glitch'],
)
for (const look of Object.values(RAINBOW_BOSS_LOOKS))
  assert.ok(['bone', 'ball', 'cloud'].includes(look), `boss fire is ${look}`)

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

// The whole demo campaign: each Act's commander barks as its boss arrives and goes home once it is beaten.
const game = createRainbowPrincessPreview({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
})
const barked = new Set<number>()
const sentHome = new Set<number>()
const bossFire = new Set<string>()
let last: string | null = null
for (let frame = 0; frame < 400000 && !game.over; frame++) {
  game.update(emptyInput())
  const snap = game.snapshot
  const bark = snap.bark
  const key = bark ? `${bark.act}:${bark.home}` : null
  if (bark && key !== last) {
    if (bark.home) {
      assert.equal(bark.text, RAINBOW_BAD_DOG)
      assert.ok(barked.has(bark.act), 'a commander barks before it goes home')
      sentHome.add(bark.act)
    } else {
      assert.equal(
        bark.text,
        RAINBOW_DOG_COMMANDERS[bark.act as 1].taunt,
        `act ${bark.act} barks its own line`,
      )
      barked.add(bark.act)
    }
  }
  last = key
  for (const shot of snap.enemyShots)
    if (shot.look && ['bone', 'ball', 'cloud'].includes(shot.look))
      bossFire.add(shot.look)
}
assert.ok(game.over, 'the demo reaches THE END')
assert.deepEqual([...barked].sort(), [1, 2, 3, 4, 5, 6, 7, 8, 9])
assert.deepEqual(
  [...sentHome].sort(),
  [1, 2, 3, 4, 5, 6, 7, 8, 9],
  'every commander is sent home',
)
assert.deepEqual([...bossFire].sort(), ['ball', 'bone', 'cloud'])

const page = readFileSync(
  'pages/play/rainbow-bullet-hell-space-princess.vue',
  'utf8',
)
assert.ok(
  page.includes('pilot.copilot.name'),
  'the Pilots tab names each co-pilot',
)

console.log(
  `rainbow dogs: ok (9 commanders barked and sent home, boss fire ${[...bossFire].sort().join('/')}, co-pilots ${RAINBOW_PILOTS.map((p) => p.copilot.name).join(', ')})`,
)
