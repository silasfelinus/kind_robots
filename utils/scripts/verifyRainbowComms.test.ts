import assert from 'node:assert/strict'
import {
  RAINBOW_CONTRAST_PELLET,
  RAINBOW_ENDING_SCENE,
  rainbowCommsLine,
} from '../arcade/games/rainbowComms'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { RAINBOW_SHOT_HALO_RADIUS } from '../arcade/games/rainbowShotLooks'
import { findArcadeGame } from '../arcade/games'
import { ARCADE_COMMS, emptyInput, type ArcadeComms } from '../arcade/types'

// Conductor rainbow t-044 (main-game standard: settings): a comms level and high-contrast hostile shots. Both are
// drawing choices only; neither may change the seeded run.

// The cabinet offers both switches for Rainbow.
const meta = findArcadeGame('rainbow-bullet-hell-space-princess')!
assert.equal(meta.highContrast, true)
assert.equal(meta.comms, true)
assert.deepEqual([...ARCADE_COMMS], ['full', 'essential', 'off'])

// The comms policy.
const scene = { who: 'scene' }
const call = { who: 'callout' }
assert.equal(rainbowCommsLine('full', scene, call, 'A01.OPEN'), scene)
assert.equal(rainbowCommsLine('full', null, call, null), call)
assert.equal(rainbowCommsLine('essential', scene, call, 'A01.OPEN'), scene)
assert.equal(rainbowCommsLine('essential', null, call, null), null)
assert.equal(rainbowCommsLine('off', scene, call, 'A01.OPEN'), null)
assert.equal(rainbowCommsLine('off', null, call, null), null)
assert.equal(
  rainbowCommsLine('off', scene, null, RAINBOW_ENDING_SCENE),
  scene,
  'the ending keeps its lines and plate with comms off',
)

function seeded(seed = 99) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

// A canvas that records what was drawn, with the styles in force at each call.
type Call = { op: string; args: unknown[]; fill: unknown; stroke: unknown }
function recorder() {
  const calls: Call[] = []
  const state: Record<string | symbol, unknown> = {
    canvas: { width: 480, height: 270 },
  }
  const g = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key]
      if (key === 'measureText')
        return (text: string) => ({ width: text.length * 6 })
      if (key === 'createLinearGradient' || key === 'createRadialGradient')
        return () => ({ addColorStop() {} })
      if (key === 'getLineDash') return () => []
      return (...args: unknown[]) => {
        calls.push({
          op: String(key),
          args,
          fill: target.fillStyle,
          stroke: target.strokeStyle,
        })
      }
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, calls }
}

const options = (extra: object = {}) => ({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
  ...extra,
})

// Settings never touch the run: the same seed flies identically with every switch thrown.
{
  const plain = createRainbowPrincessPreview(options())
  const tuned = createRainbowPrincessPreview(
    options({ highContrast: true, comms: 'off' as ArcadeComms }),
  )
  for (let frame = 0; frame < 6000; frame++) {
    if (frame === 3000) {
      tuned.setHighContrast?.(false)
      tuned.setComms?.('essential')
    }
    plain.update(emptyInput())
    tuned.update(emptyInput())
    if (frame % 500 === 0)
      assert.deepEqual(tuned.snapshot, plain.snapshot, `desync at ${frame}`)
  }
}

// Drawn: one game, the same frame, rendered under each choice.
const game = createRainbowPrincessPreview(options())
const commsBoxes = (level: ArcadeComms) => {
  game.setComms?.(level)
  const { g, calls } = recorder()
  game.render(g)
  return calls.filter(
    (c) =>
      c.op === 'fillRect' &&
      c.args[0] === 0 &&
      c.args[1] === 0 &&
      c.args[3] === 51,
  ).length
}
const rings = (calls: Call[]) =>
  calls.filter(
    (c, i) =>
      c.op === 'stroke' &&
      c.stroke === RAINBOW_CONTRAST_PELLET.ring &&
      c.fill === RAINBOW_CONTRAST_PELLET.halo &&
      calls[i - 2]?.op === 'arc' &&
      calls[i - 2]?.args[2] === RAINBOW_SHOT_HALO_RADIUS,
  ).length
let calloutOnly = 0
let sceneLines = 0
let contrastFrames = 0
for (
  let frame = 0;
  frame < 60000 &&
  (calloutOnly === 0 || sceneLines === 0 || contrastFrames < 20);
  frame++
) {
  game.update(emptyInput())
  if (frame % 10) continue
  const full = commsBoxes('full')
  const essential = commsBoxes('essential')
  const off = commsBoxes('off')
  assert.ok(
    essential <= full && off <= essential,
    'each level shows no more than the last',
  )
  if (full && !essential) calloutOnly++
  if (full && essential) {
    sceneLines++
    assert.equal(off, 0, 'comms off hides story scenes before the ending')
  }
  const solid = game.snapshot.enemyShots.filter((shot) => !shot.ghost).length
  if (solid) {
    game.setHighContrast?.(true)
    const bold = recorder()
    game.render(bold.g)
    game.setHighContrast?.(false)
    const soft = recorder()
    game.render(soft.g)
    assert.equal(
      rings(bold.calls),
      solid,
      'every solid hostile shot gets the bold ring',
    )
    assert.equal(rings(soft.calls), 0, 'no ring with the switch off')
    contrastFrames++
  }
}
game.setComms?.('full')
assert.ok(calloutOnly > 0, 'essential comms quiets in-flight callouts')
assert.ok(sceneLines > 0, 'essential comms keeps story scenes')
assert.ok(contrastFrames > 0, 'high-contrast shots were drawn')
console.log(
  `rainbow comms and contrast: ok (callout-only frames ${calloutOnly}, scene frames ${sceneLines}, contrast frames ${contrastFrames})`,
)
