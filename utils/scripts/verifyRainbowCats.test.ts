import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import {
  RAINBOW_KITTY_POWER,
  RAINBOW_PILOTS,
  RAINBOW_SQUADRON,
} from '../arcade/games/rainbowPilots'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { RAINBOW_BOSS_LOOKS } from '../arcade/games/rainbowShotLooks'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-039, Silas 2026-10-23 PT: "ditch the dog and cats theme…actually, just the dogs part. They
// can be cats and have a special princess kitty power". The princesses fly as C.A.T.S. with cat co-pilots, every
// super is a Princess Kitty Power, and the villains are the space animals again: no DOGS anywhere in the game.

assert.equal(RAINBOW_SQUADRON.name, 'C.A.T.S.')
assert.equal(RAINBOW_KITTY_POWER, 'PRINCESS KITTY POWER')
assert.deepEqual(
  RAINBOW_PILOTS.map((pilot) => pilot.copilot.name),
  ['Biscuit', 'Comet', 'Butter', 'Glitch'],
)
assert.deepEqual(
  Object.values(RAINBOW_BOSS_LOOKS),
  [
    'pearl',
    'bell',
    'bolt',
    'sonar',
    'fin',
    'ember',
    'shard',
    'bubble',
    'eclipse',
  ],
  "each boss fires its creature's own look",
)
const games = 'utils/arcade/games'
for (const file of readdirSync(games).filter((name) =>
  name.startsWith('rainbow'),
)) {
  const text = readFileSync(`${games}/${file}`, 'utf8')
  assert.ok(!/\bDOGS?\b|BAD DOG|King Rufus/i.test(text), `${file} has no DOGS`)
}

// A super cut-in reads as a Princess Kitty Power with the pilot and her co-pilot.
const texts: string[] = []
const g = new Proxy({} as Record<string | symbol, unknown>, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'fillText' || key === 'strokeText')
      return (text: string) => texts.push(String(text))
    if (key === 'measureText') return () => ({ width: 10 })
    return () => ({ addColorStop() {} })
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D

const game = createRainbowPrincessPreview({
  rng: () => 0.2,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
  players: 1,
})
const press = (fire: boolean, superPress: boolean) => {
  const frame = emptyInput()
  frame.held.a = fire
  frame.held.b = superPress
  frame.pressed.b = superPress
  game.update(frame, [frame])
}
let charged = false
for (let frame = 0; frame < 3000 && !charged; frame++) {
  press(true, false)
  charged = game.snapshot.ships[0]!.charge === 100
}
assert.ok(charged, 'the pilot earns a super')
press(false, true)
press(false, false)
game.render(g)
const pilot = RAINBOW_PILOTS[0]!
assert.ok(
  texts.includes(`${RAINBOW_KITTY_POWER}!`),
  'the cut-in cries Princess Kitty Power',
)
assert.ok(
  texts.includes(
    `P1 ${pilot.name.split(' ')[0]!.toUpperCase()} + ${pilot.copilot.name.toUpperCase()}`,
  ),
  'the pilot and her co-pilot',
)
assert.ok(
  texts.includes(pilot.superName.toUpperCase()),
  'the super keeps its name',
)

console.log(
  `rainbow cats: ok (${RAINBOW_SQUADRON.name}, co-pilots ${RAINBOW_PILOTS.map((p) => p.copilot.name).join(', ')}, ${RAINBOW_KITTY_POWER}, no DOGS)`,
)
