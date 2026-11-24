import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
import {
  RAINBOW_BOSS_BLOOM,
  drawRainbowBossBloom,
  rainbowBossBloomFlares,
} from '../arcade/games/rainbowBossBloom'
import { setRainbowLook } from '../arcade/games/rainbowGameArt'
import {
  applyRainbowSwimMotion,
  rainbowHitFlinch,
  rainbowShipPose,
  rainbowSwimPose,
} from '../arcade/games/rainbowSwimMotion'
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

// Calm motion slows the scenery: the farthest mote plane's first mote, 100 frames in. Classic draws the
// motes; Fever Dream's sky takes the same drift factor (verifyRainbowFeverDream).
for (const stillCamera of [false, true]) {
  const game = create(true, stillCamera)
  setRainbowLook('classic', false)
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
    // B released inside the tap window is the super (gameplay critic D1: a hold is focus).
    game.update(emptyInput())
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

// Enemy body animation is purely visual; hitboxes and warning rings stay in the
// original world coordinates, even when the rendered sea-life sprite sways.
for (const kind of [
  'lantern',
  'eel',
  'dolphin',
  'picket',
  'matriarch',
  'kelpwarden',
]) {
  const early = rainbowSwimPose(kind, 22)
  const later = rainbowSwimPose(kind, 36)
  const calm = rainbowSwimPose(kind, 22, true)
  assert.deepEqual(early, rainbowSwimPose(kind, 22), 'swim is deterministic')
  assert.notDeepEqual(early, later, `${kind} animates between frames`)
  assert.ok(Math.abs(early.bob) <= 1.5)
  assert.ok(Math.abs(early.bank) <= 0.045)
  assert.ok(early.stretch >= 0.965 && early.stretch <= 1.035)
  assert.ok(Math.abs(calm.bob) <= Math.abs(early.bob) * 0.21 + 1e-10)
  assert.ok(Math.abs(calm.bank) <= Math.abs(early.bank) * 0.21 + 1e-10)
  assert.ok(
    Math.abs(calm.stretch - 1) <= Math.abs(early.stretch - 1) * 0.21 + 1e-10,
  )
  const { g, calls } = recorder()
  applyRainbowSwimMotion(g, kind, 22, false)
  assert.deepEqual(
    calls.map((call) => call.name),
    ['translate', 'rotate', 'scale'],
    `${kind} animates its sprite only`,
  )
}
assert.notDeepEqual(
  rainbowSwimPose('lantern', 30),
  rainbowSwimPose('dolphin', 30),
  'jellyfish and finned enemies have distinct motion signatures',
)

const bossFlares = [
  { x: 80, y: 105, age: 0, life: 80, ring: true },
  { x: 180, y: 125, age: 11, life: 80, ring: true },
  { x: 250, y: 130, age: 1, life: 80, ring: true },
]
const flares = rainbowBossBloomFlares(bossFlares, false)
assert.equal(flares.length, RAINBOW_BOSS_BLOOM.maxFlares)
assert.deepEqual(
  flares.map((flare) => flare.x),
  [250, 180],
  'only the two newest boss flares use gradient work',
)
assert.ok(
  flares.every(
    (flare) =>
      flare.alpha <= RAINBOW_BOSS_BLOOM.maxOpacity &&
      flare.radius <= RAINBOW_BOSS_BLOOM.maxRadius,
  ),
  'a flare has a bounded radius and opacity',
)
assert.deepEqual(
  rainbowBossBloomFlares(bossFlares, true),
  [],
  'calm motion omits all boss bloom, not just the shockwave',
)
assert.deepEqual(
  rainbowBossBloomFlares(
    [
      { x: 40, y: 40, age: 1, life: 16, ring: true },
      { x: 40, y: 40, age: 23, life: 80, ring: true },
      { x: -100, y: 40, age: 1, life: 80, ring: true },
    ],
    false,
  ),
  [],
  'regular bursts, expired flares and offscreen events never allocate gradients',
)
assert.ok(
  rainbowBossBloomFlares(bossFlares, false)[0]!.alpha >
    rainbowBossBloomFlares(bossFlares, false)[1]!.alpha,
  'boss glow fades as the shockwave expands',
)
{
  const { g, calls } = recorder()
  drawRainbowBossBloom(g, bossFlares, false)
  assert.equal(
    calls.filter((call) => call.name === 'createRadialGradient').length,
    2,
    'two boss bloom gradients at most',
  )
  assert.equal(calls.filter((call) => call.name === 'save').length, 2)
  assert.equal(calls.filter((call) => call.name === 'restore').length, 2)
  const linear = calls.filter((call) => call.name === 'createLinearGradient')
  assert.equal(linear.length, 2, 'one lens streak per boss flare, no more')
  const rects = calls.filter((call) => call.name === 'fillRect')
  assert.equal(rects.length, 2)
  for (const [i, rect] of rects.entries()) {
    const flare = flares[i]!
    const [, , w, h] = rect.args as number[]
    assert.ok(
      w! > flare.radius * 2 && h! <= RAINBOW_BOSS_BLOOM.streakHalfHeight * 2,
      'the lens streak is a thin sliver wider than its glow',
    )
    assert.ok(
      rect.alpha < flare.alpha,
      'the lens streak is fainter than the glow it crosses',
    )
  }
  const { calls: calmCalls, g: calmContext } = recorder()
  drawRainbowBossBloom(calmContext, bossFlares, true)
  assert.equal(calmCalls.length, 0, 'calm rendering performs no bloom work')
  const { calls: contrastCalls, g: contrastContext } = recorder()
  drawRainbowBossBloom(contrastContext, bossFlares, false, true)
  assert.equal(
    contrastCalls.length,
    0,
    'high-contrast shots draw no bloom or streak that could lift the scenery behind a pellet',
  )
}
assert.deepEqual(
  rainbowBossBloomFlares(bossFlares, false, 480, 270, true),
  [],
  'high-contrast shots omit boss bloom',
)
const previewSource = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
// The hostile-shot halo pass (its default backing; high-contrast shots swap in an opaque one, t-044).
const haloPass = previewSource.indexOf('const pelletBacking = contrast')
assert.ok(haloPass > 0, 'the hostile shot halo pass is still drawn')
assert.ok(
  previewSource.includes('drawRainbowBossBloom(g, sparks, calm, contrast)'),
  'the game passes its high-contrast choice to the boss bloom',
)
assert.ok(
  previewSource.indexOf('drawRainbowBossBloom(g, sparks, calm, contrast)') <
    haloPass,
  'boss bloom is drawn under hostile shot halos instead of washing them out',
)

// t-011 character animation: a hurt craft flinches (squash, then springs back) over the flash frames;
// calm motion and an unhurt craft keep their shape.
assert.deepEqual(
  rainbowHitFlinch(0, 6),
  { x: 1, y: 1 },
  'an unhurt craft keeps its shape',
)
assert.deepEqual(
  rainbowHitFlinch(6, 6, true),
  { x: 1, y: 1 },
  'calm motion drops the flinch',
)
const freshHit = rainbowHitFlinch(6, 6)
const fadingHit = rainbowHitFlinch(2, 6)
assert.ok(
  freshHit.x < fadingHit.x && fadingHit.x < 1,
  'the squash springs back as the flash fades',
)
assert.ok(
  freshHit.y > 1 && freshHit.x >= 0.85,
  'the flinch stays a small squash',
)

// t-011: the pilot's craft banks and leans into a surge, a draw-only pose that calm motion damps.
assert.deepEqual(
  rainbowShipPose(0, 0),
  { rotate: 0, scaleX: 1, scaleY: 1 },
  'a still craft holds its shape',
)
const surge = rainbowShipPose(0, 4)
const backOff = rainbowShipPose(0, -4)
assert.ok(
  surge.scaleX > 1 && surge.scaleY < 1,
  'a forward surge stretches the craft',
)
assert.ok(
  backOff.scaleX < 1 && backOff.scaleY > 1,
  'backing off squats the craft',
)
const wildPose = rainbowShipPose(40, 40)
assert.ok(
  Math.abs(wildPose.rotate) <= 0.35 &&
    wildPose.scaleX <= 1.1 &&
    wildPose.scaleY >= 0.75,
  'the pose stays bounded at full speed',
)
const calmPose = rainbowShipPose(3, 4, true)
const fullPose = rainbowShipPose(3, 4)
assert.ok(
  Math.abs(calmPose.rotate) < Math.abs(fullPose.rotate) &&
    calmPose.scaleX < fullPose.scaleX,
  'calm motion damps the bank and the lean',
)
assert.match(
  previewSource,
  /rainbowShipPose\(ship\.bank, ship\.thrust, calm\)/,
  'the ship draw uses the shared pose',
)

console.log(
  `rainbow effects: ok (craft ${firstCraft.full}/${firstCraft.still} sparks, boss burst ${bossBurst}, peak ${maxFull}/${maxStill} of ${RAINBOW_EFFECTS.maxSparks}, halos, calm drift and no flash)`,
)
