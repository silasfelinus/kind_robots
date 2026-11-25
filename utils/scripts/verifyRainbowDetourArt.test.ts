import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { cometCheckpointValid } from '../arcade/games/rainbowCoralComet'
import {
  RAINBOW_DETOUR_PLANES,
  RAINBOW_DETOUR_SKY_PAN,
  rainbowDetourBands,
  rainbowDetourPlanePaths,
  rainbowDetourSkyOffset,
} from '../arcade/games/rainbowDetourPlanes'
import { RAINBOW_DOODLE_ART } from '../arcade/games/rainbowDoodleArt'
import {
  RAINBOW_HAZARD_SPRITES,
  RAINBOW_STAGE_PAINTINGS,
} from '../arcade/games/rainbowGameArt'
import { nurseryFlightCheckpointValid } from '../arcade/games/rainbowLanternNursery'
import { readRainbowSave } from '../arcade/games/rainbowLoadouts'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-028/t-022/t-027 art batch (2026-11-23 PT): the reviewed detour skies and bands, X2's coral
// asteroid, X1's kelp fronds, seven main-Act painted planes and the route-map and Hangar paintings ship, and the
// engine actually draws them where they belong.

const publicFile = (path: string) =>
  new URL(`../../public/rainbow-princess-art/${path}.webp`, import.meta.url)

// Every file ships; the refused mid planes do not.
for (const path of rainbowDetourPlanePaths())
  assert.ok(existsSync(publicFile(path)), `${path} ships`)
assert.deepEqual(RAINBOW_DETOUR_PLANES.x2.bands, ['far', 'near'])
assert.deepEqual(RAINBOW_DETOUR_PLANES.x4.bands, ['far', 'near'])
assert.ok(!existsSync(publicFile('alt/x2-mid')), 'X2 skull asteroids refused')
assert.ok(!existsSync(publicFile('alt/x4-mid')), 'X4 leaping fish refused')
for (const path of Object.values(RAINBOW_HAZARD_SPRITES)) {
  assert.ok(existsSync(publicFile(path)), `${path} ships`)
  assert.ok(existsSync(publicFile(`doodle/${path}`)), `${path} Fever twin`)
}
for (const path of ['gen2/route-map', 'gen2/hangar'])
  assert.ok(existsSync(publicFile(path)), `${path} ships`)
const ACT_PLANES = [
  'stages/s01-far',
  'stages/s01-mid',
  'stages/s02-far',
  'stages/s06-far',
  'stages/s07-far',
  'stages/s07-mid',
  'stages/s08-far',
]
for (const path of ACT_PLANES) {
  assert.ok(existsSync(publicFile(`doodle/${path}`)), `${path} ships`)
  assert.ok(RAINBOW_DOODLE_ART.includes(path), `${path} is registered`)
}
// Kontext planes with flying craft or a watermark were refused (2026-11-23). One ships only as its later text-only
// scenery render (art backlog 2026-11-24), which lands in both looks together.
for (const path of ['stages/s03-far', 'stages/s05-mid', 'stages/s04-far'])
  assert.ok(
    !RAINBOW_DOODLE_ART.includes(path) ||
      RAINBOW_STAGE_PAINTINGS.includes(path),
    `${path} refused, or replaced by a reviewed scenery-only render`,
  )

// Bands sit on the floor, back to front, faster and stronger the nearer they are.
for (const detour of ['x1', 'x2', 'x3', 'x4'] as const) {
  const bands = rainbowDetourBands(detour, 600, 1)
  for (const band of bands) {
    assert.equal(band.y + band.height, 270)
    assert.ok(band.alpha > 0 && band.alpha < 1, 'bands never at full strength')
  }
  for (let i = 1; i < bands.length; i++) {
    assert.ok(bands[i]!.speed > bands[i - 1]!.speed)
    assert.ok(bands[i]!.alpha > bands[i - 1]!.alpha)
  }
  assert.ok(RAINBOW_DETOUR_PLANES[detour].sky <= 0.6, 'the sky stays muted')
}

// The sky drifts (presentation review P-04: the top half of X3 moved 0 px): slower than any band, only ever
// across its own overscan margin, so the field is always covered, and calm motion slows it with the rest.
{
  const { overscan, period } = RAINBOW_DETOUR_SKY_PAN
  const margin = (overscan - 1) * 480
  const offsets = Array.from({ length: 49 }, (_, i) =>
    rainbowDetourSkyOffset((i * period) / 48, 1),
  )
  for (const offset of offsets)
    assert.ok(
      offset >= 0 && offset <= margin + 1e-9,
      'the sky covers the field',
    )
  assert.ok(Math.max(...offsets) - Math.min(...offsets) > margin * 0.99)
  const fastest = Math.max(
    ...offsets.slice(1).map((offset, i) => Math.abs(offset - offsets[i]!)),
  )
  const farBand = rainbowDetourBands('x3', 48, 1)[0]!.scroll / 48
  assert.ok(
    fastest / (period / 48) < farBand,
    'the sky drifts slower than the far band',
  )
  assert.ok(rainbowDetourSkyOffset(600, 1) > 1, 'the sky moves within seconds')
  assert.ok(
    Math.abs(
      rainbowDetourSkyOffset(600, 0.3) - rainbowDetourSkyOffset(180, 1),
    ) < 1e-9,
    'calm motion slows the sky',
  )
}

// Drawn in the engine: a stand-in Image that is loaded at once lets the real draw path run, and a recording
// canvas lists which pictures each frame painted.
class LoadedImage {
  complete = true
  naturalWidth = 960
  naturalHeight = 540
  decoding = 'async'
  onerror: (() => void) | null = null
  src = ''
}
;(globalThis as { Image?: unknown }).Image = LoadedImage
function painted(game: { render(g: CanvasRenderingContext2D): void }) {
  const sources: string[] = []
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
      if (key === 'drawImage')
        return (img: { src?: string }) => {
          if (img?.src) sources.push(img.src)
        }
      return () => {}
    },
    set(target, key, value) {
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  game.render(g)
  return sources
}
const options = (replay: unknown) => ({
  rng: () => 0.5,
  sound: { play: () => {} },
  hiScore: 0,
  players: 1,
  demo: false,
  rainbowReplay: replay,
})
const common = {
  score: 500,
  rescuedStation: false,
  rescuedNemi: true,
  trenchRoute: 'safe' as const,
  routeSettled: true,
  wreckRoute: null,
  wreckSettled: false,
  podsSaved: 0,
  reefRoute: null,
  reefSettled: false,
  pylonsDown: 0,
  rescuedNavigator: false,
  captivesFreed: 0,
  schoolBonuses: 0,
}
const wrap = (checkpoint: object) => ({
  v: 1,
  difficulty: 'normal',
  checkpoint,
  guardians: {},
  medals: {},
})

// X1: its own sky and bands instead of Act III's strips; fronds mark the Kelp Warden's comb lanes.
const x1 = (nurseryFrame: number) =>
  readRainbowSave(
    wrap({
      ...common,
      act: 3,
      frame: 20000 + nurseryFrame,
      rescuedCourier: false,
      nurseryGuardianOutcome: 'waiting',
      nurseryStartedAt: 20000,
      nurseryFrame,
      nurseryHits: 0,
      nurseryChoirMask: 0,
      freedChoir: false,
    }),
    (act, frame, saved) =>
      nurseryFlightCheckpointValid(act, frame, saved ?? {}),
  )
{
  const game = createRainbowPrincessPreview(options(x1(240)))
  for (let i = 0; i < 90; i++) game.update(emptyInput(), [emptyInput()])
  assert.equal(game.snapshot.act, 'X1')
  const drawn = painted(game)
  for (const layer of ['sky', 'far', 'mid', 'near'])
    assert.ok(
      drawn.some((src) => src.endsWith(`/alt/x1-${layer}.webp`)),
      `X1 ${layer} drawn`,
    )
  assert.ok(
    !drawn.some((src) => /\/stages\/s0\d-fore\.webp$/.test(src)),
    "the origin Act's strip gives way to the detour's own planes",
  )
}
{
  const game = createRainbowPrincessPreview(options(x1(3600)))
  let fronds = 0
  for (let i = 0; i < 1500 && !fronds; i++) {
    game.update(emptyInput(), [emptyInput()])
    if (game.snapshot.guardian?.kind !== 'kelpwarden') continue
    fronds = painted(game).filter((src) =>
      src.endsWith('/hazards/kelp-frond.webp'),
    ).length
  }
  assert.ok(fronds > 0, 'kelp fronds mark the comb lanes while it warns')
}

// X2: the drifting scrap is coral asteroid; elsewhere (Act V's wreckyard) scrap stays the code-drawn debris.
{
  const comet = readRainbowSave(
    wrap({
      ...common,
      act: 4,
      frame: 34240,
      score: 1500,
      nurseryGuardianOutcome: 'escaped',
      rescuedCourier: true,
      cadetsHome: false,
      cometStartedAt: 34000,
      cometFrame: 240,
      cometCadetsMask: 0,
      cometGuardianOutcome: 'waiting',
      cometHits: 0,
    }),
    (act, frame, saved) => cometCheckpointValid(act, frame, saved ?? {}),
  )
  const game = createRainbowPrincessPreview(options(comet))
  let asteroids = 0
  let skies = 0
  for (let i = 0; i < 9000 && !asteroids; i++) {
    game.update(emptyInput(), [emptyInput()])
    if (i % 30) continue
    const drawn = painted(game)
    if (drawn.some((src) => src.endsWith('/alt/x2-sky.webp'))) skies++
    if (game.snapshot.enemies.some((enemy) => enemy.kind === 'scrap'))
      asteroids = drawn.filter((src) =>
        src.endsWith('/enemies/coral-asteroid.webp'),
      ).length
  }
  assert.ok(skies > 0, 'X2 flies its own sky')
  assert.ok(asteroids > 0, 'comet-run scrap is painted as coral asteroid')
}
const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
assert.match(
  engine,
  /cometActive\(\) && drawRainbowHazardSprite\(g, 'coral-asteroid'/,
  'only the comet run paints scrap as asteroid',
)
const page = readFileSync(
  new URL(
    '../../pages/play/rainbow-bullet-hell-space-princess.vue',
    import.meta.url,
  ),
  'utf8',
)
assert.match(page, /rainbowGen2Art\('route-map', look\)/)
assert.match(page, /rainbowGen2Art\('hangar', look\)/)
console.log(
  'rainbow detour art: ok (X1-X4 planes, hazards, act planes, map and Hangar)',
)
