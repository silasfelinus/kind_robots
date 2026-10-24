import assert from 'node:assert/strict'
import { findArcadeGame } from '../arcade/games'
import {
  RAINBOW_EFFECTS,
  createRainbowPrincessPreview,
} from '../arcade/games/rainbowPrincessPreview'
import {
  RAINBOW_BOSS_LOOKS,
  RAINBOW_CRAFT_LOOKS,
  drawRainbowShot,
  type RainbowShotLook,
} from '../arcade/games/rainbowShotLooks'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-011: explosions as sparks within a budget (a boss's larger, with a shockwave), calm
// motion (the arcade's still-camera / reduced-motion choice) that drops full-screen flashes and shockwaves,
// thins the sparks and slows every scenery plane alike, and a dark halo under every solid hostile pellet so it
// reads against any scenery. Effects never touch the game's rng: calm and full motion fly the same game.
// t-032: every hostile shot is drawn in its family's own animated look, not one shared circle.

const W = 480
const H = 270

function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = (demo: boolean, stillCamera: boolean) =>
  createRainbowPrincessPreview({
    players: 1,
    demo,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
    stillCamera,
  })

/** A canvas stand-in that records the calls the checks read. */
function recorder() {
  const calls: Array<{ name: string; args: unknown[]; alpha: number }> = []
  const state: Record<string | symbol, unknown> = { globalAlpha: 1 }
  const g = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key]
      return (...args: unknown[]) => {
        calls.push({
          name: String(key),
          args,
          alpha: Number(target.globalAlpha),
        })
        return { addColorStop() {}, width: 0 }
      }
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, calls }
}

const meta = findArcadeGame('rainbow-bullet-hell-space-princess')
assert.equal(meta?.calmMotion, true, 'the cabinet shows the motion switch')
assert.ok(RAINBOW_EFFECTS.calmShare < 1 && RAINBOW_EFFECTS.calmDrift < 1)

// The whole demo campaign, in full and calm motion side by side.
const full = create(true, false)
const still = create(true, true)
assert.equal(full.snapshot.calm, false)
assert.equal(still.snapshot.calm, true)
let maxFull = 0
let maxStill = 0
let firstCraft: { full: number; still: number } | null = null
let bossBurst = 0
let checkedHalo = false
const looksSeen = new Set<RainbowShotLook>()
let lastAct = full.snapshot.act
for (let frame = 0; frame < 400000 && !full.over; frame++) {
  const before = full.snapshot.sparks
  full.update(emptyInput())
  still.update(emptyInput())
  const a = full.snapshot
  const b = still.snapshot
  assert.equal(a.score, b.score, 'calm motion flies the same game')
  maxFull = Math.max(maxFull, a.sparks)
  maxStill = Math.max(maxStill, b.sparks)
  assert.ok(a.sparks <= RAINBOW_EFFECTS.maxSparks, 'the spark budget holds')
  if (!firstCraft && a.sparks > 0 && before === 0)
    firstCraft = { full: a.sparks, still: b.sparks }
  bossBurst = Math.max(bossBurst, a.sparks - before)
  // The halo: one dark disc per solid hostile pellet, under the pellets.
  if (!checkedHalo && a.enemyShots.filter((s) => !s.ghost).length >= 5) {
    const { g, calls } = recorder()
    full.render(g)
    const halos = calls.filter(
      (call) => call.name === 'arc' && call.args[2] === 8,
    )
    assert.ok(
      halos.length >= a.enemyShots.filter((s) => !s.ghost).length,
      'every solid pellet has a halo',
    )
    checkedHalo = true
  }
  if (a.act !== lastAct) lastAct = a.act
  for (const shot of a.enemyShots) {
    if (shot.ghost || shot.burst) continue
    assert.ok(shot.look, `every plain ${a.act} pellet carries a look`)
    looksSeen.add(shot.look)
  }
}
assert.ok(full.over && still.over, 'both reach THE END')
assert.equal(full.score, still.score)
assert.ok(firstCraft, 'a craft explodes into sparks')
assert.equal(
  firstCraft.full,
  RAINBOW_EFFECTS.craftSparks + 1,
  'sparks and a shockwave',
)
assert.equal(
  firstCraft.still,
  Math.round(RAINBOW_EFFECTS.craftSparks * RAINBOW_EFFECTS.calmShare),
)
assert.ok(
  // (sparks from earlier blasts may fade in the same frame)
  bossBurst >= RAINBOW_EFFECTS.bossSparks * 0.8,
  `a boss bursts into at least ${RAINBOW_EFFECTS.bossSparks} sparks and a shockwave (${bossBurst})`,
)
assert.ok(maxStill < maxFull, 'calm motion keeps fewer sparks')
assert.ok(checkedHalo)
// The campaign fires most of the families, and no Act's fire is all one shape.
assert.ok(
  looksSeen.size >= 14,
  `the campaign's fire takes many shapes (${[...looksSeen].join(', ')})`,
)

// Every look draws inside its halo and animates: the same pellet a few frames later draws differently.
{
  const looks = new Set<RainbowShotLook>([
    ...Object.values(RAINBOW_CRAFT_LOOKS),
    ...Object.values(RAINBOW_BOSS_LOOKS),
    'star',
  ])
  for (const look of looks) {
    const frames = [0, 7].map((t) => {
      const { g, calls } = recorder()
      drawRainbowShot(g, look, 100, 100, -1.5, 0.5, t)
      return JSON.stringify(calls)
    })
    assert.ok(frames[0]!.length > 20, `${look} draws`)
    assert.notEqual(frames[0], frames[1], `${look} is animated`)
  }
}

// Calm motion slows the scenery: the farthest mote plane's first mote, 100 frames in.
for (const stillCamera of [false, true]) {
  const game = create(true, stillCamera)
  for (let i = 0; i < 100; i++) game.update(emptyInput())
  const { g, calls } = recorder()
  game.render(g)
  const mote = calls.find((call) => call.name === 'ellipse')!
  const drift = stillCamera ? RAINBOW_EFFECTS.calmDrift : 1
  const expected =
    (((0 - game.snapshot.tick * drift * 0.15) % (W + 65)) + W + 65) % (W + 65)
  assert.ok(
    Math.abs((mote.args[0] as number) - expected) < 1e-9,
    `the mote drifts at ${drift}`,
  )
}

// A super's full-screen flash only in full motion; the cabinet's switch changes it mid-game.
{
  const fire = emptyInput()
  fire.held.a = true
  const flashes = (stillCamera: boolean, toggle = false) => {
    const game = create(false, stillCamera)
    for (let i = 0; i < 6000 && game.snapshot.ships[0]!.charge < 100; i++)
      game.update(fire)
    assert.equal(game.snapshot.ships[0]!.charge, 100, 'the super charges')
    if (toggle) game.setStillCamera!(!stillCamera)
    const press = emptyInput()
    press.pressed.b = true
    press.held.b = true
    game.update(press)
    const { g, calls } = recorder()
    game.render(g)
    return calls.filter(
      (call) =>
        call.name === 'fillRect' &&
        call.args[0] === 0 &&
        call.args[1] === 0 &&
        call.args[2] === W &&
        call.args[3] === H &&
        call.alpha < 1,
    ).length
  }
  assert.ok(flashes(false) > 0, 'full motion flashes the screen')
  assert.equal(flashes(true), 0, 'calm motion never flashes the screen')
  assert.equal(flashes(false, true), 0, 'switched to calm mid-game')
}

console.log(
  `rainbow effects: ok (craft ${firstCraft.full}/${firstCraft.still} sparks, boss burst ${bossBurst}, peak ${maxFull}/${maxStill} of ${RAINBOW_EFFECTS.maxSparks}, halos, calm drift and no flash)`,
)
