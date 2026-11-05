import assert from 'node:assert/strict'
import { existsSync, readdirSync, statSync } from 'node:fs'
import {
  RAINBOW_BOSS_SPRITES,
  RAINBOW_DEFAULT_LOOK,
  RAINBOW_LOOK_STORAGE_KEY,
  loadRainbowLook,
  rainbowArt,
  rainbowBossSprite,
  rainbowCommsPortrait,
  rainbowHeroArt,
  rainbowLook,
  rainbowPortrait,
  rainbowShipSprite,
  rainbowStageCard,
  rainbowSuperCutin,
  setRainbowLook,
} from '../arcade/games/rainbowGameArt'
import { RAINBOW_DOODLE_ART } from '../arcade/games/rainbowDoodleArt'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { drawFeverSky, drawFeverTrail } from '../arcade/games/rainbowFeverDream'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-036/t-037, Silas 2026-11-05 PT: "I'm hoping we can choose between the two looks.
// Overall, Lisa frank fever dream mode is highly desired." Classic stays the default. Fever Dream swaps in the
// reviewed doodle set (art/DOODLE-SET-1-REVIEW.yaml) and paints a neon school-folder sky. A look is
// decoration only: the same inputs fly the same game in either look.

const publicFile = (src: string) =>
  new URL(`../../public${src}`, import.meta.url)

// Fever Dream is the default (Silas, 2026-11-05 PT: "Yes, fever dream should be default."), and Classic's
// paths never change.
assert.equal(RAINBOW_DEFAULT_LOOK, 'fever')
assert.equal(rainbowLook(), 'fever')
assert.equal(
  rainbowShipSprite(0),
  '/rainbow-princess-art/doodle/ships/petal-wing.webp',
)
setRainbowLook('classic', false)
assert.equal(
  rainbowShipSprite(0),
  '/rainbow-princess-art/ships/petal-wing.webp',
)
assert.equal(
  rainbowStageCard('s04'),
  '/rainbow-princess-art/stages/s04-card.webp',
)

// Every Fever Dream picture the manifest lists ships, and stays small.
assert.ok(RAINBOW_DOODLE_ART.length >= 90, 'the doodle set is wired')
for (const entry of RAINBOW_DOODLE_ART) {
  const src = rainbowArt(entry, 'fever')
  assert.equal(src, `/rainbow-princess-art/doodle/${entry}.webp`)
  assert.ok(existsSync(publicFile(src)), `${entry} is committed`)
  assert.ok(statSync(publicFile(src)).size < 140_000, `${entry} stays small`)
}

// Every classic sprite, boss phase, strip and card has a Fever Dream twin, so the look never mixes styles
// inside a fight. Only people art (comms, cut-ins, portraits) may be held back for CAST-QA; it falls back to
// the classic file.
const classicRoot = new URL(
  '../../public/rainbow-princess-art/',
  import.meta.url,
)
for (const folder of ['ships', 'enemies', 'bosses', 'pickups', 'stages']) {
  for (const file of readdirSync(new URL(`${folder}/`, classicRoot))) {
    const entry = `${folder}/${file.replace(/\.webp$/, '')}`
    assert.ok(
      RAINBOW_DOODLE_ART.includes(entry),
      `${entry} has a Fever Dream twin`,
    )
  }
}
for (const boss of RAINBOW_BOSS_SPRITES) {
  const phases = [1, 2, 3].filter((p) =>
    RAINBOW_DOODLE_ART.includes(`bosses/${boss}-phase${p}`),
  )
  assert.equal(phases.length, 3, `${boss} keeps all three phases in one style`)
}
assert.ok(
  !RAINBOW_DOODLE_ART.includes('comms/solenne'),
  'Solenne comms held (CAST-QA: skin repainted)',
)
assert.ok(
  !RAINBOW_DOODLE_ART.includes('portraits/p3-solenne'),
  'Solenne portrait held (CAST-QA: hair and skin)',
)

// Switching looks switches every path the cabinet and the page draw.
setRainbowLook('fever', false)
assert.equal(rainbowLook(), 'fever')
assert.equal(
  rainbowShipSprite(1),
  '/rainbow-princess-art/doodle/ships/prism-lance.webp',
)
assert.equal(
  rainbowBossSprite('b03', 2),
  '/rainbow-princess-art/doodle/bosses/b03-phase2.webp',
)
assert.equal(
  rainbowSuperCutin(0),
  '/rainbow-princess-art/doodle/cutins/maribel.webp',
)
assert.equal(
  rainbowCommsPortrait('Maribel'),
  '/rainbow-princess-art/doodle/comms/maribel.webp',
)
assert.equal(
  rainbowCommsPortrait('Solenne'),
  '/rainbow-princess-art/comms/solenne.webp',
  'held art falls back to classic',
)
assert.equal(
  rainbowPortrait('/rainbow-princess-portraits/p1-maribel.webp'),
  '/rainbow-princess-art/doodle/portraits/p1-maribel.webp',
)
assert.equal(
  rainbowPortrait('/rainbow-princess-portraits/p3-solenne.webp'),
  '/rainbow-princess-portraits/p3-solenne.webp',
)
assert.equal(
  rainbowHeroArt('/hero.webp'),
  '/rainbow-princess-art/doodle/key-art.webp',
)
assert.equal(rainbowHeroArt('/hero.webp', 'classic'), '/hero.webp')
assert.equal(
  rainbowArt('no/such-picture'),
  '/rainbow-princess-art/no/such-picture.webp',
  'unknown paths stay classic',
)

// The choice is remembered in this browser, and junk in storage reads as the default.
const saved = new Map<string, string>()
const fakeStorage = {
  getItem: (k: string) => saved.get(k) ?? null,
  setItem: (k: string, v: string) => void saved.set(k, v),
}
const realStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
Object.defineProperty(globalThis, 'localStorage', {
  value: fakeStorage,
  configurable: true,
})
setRainbowLook('classic')
assert.equal(saved.get(RAINBOW_LOOK_STORAGE_KEY), 'classic')
setRainbowLook('fever', false)
assert.equal(
  loadRainbowLook(),
  'classic',
  'a visitor who chose Classic keeps it',
)
saved.set(RAINBOW_LOOK_STORAGE_KEY, 'glitter')
assert.equal(
  loadRainbowLook(),
  'fever',
  'unknown values fall back to the default',
)
Object.defineProperty(globalThis, 'localStorage', {
  get() {
    throw new Error('blocked')
  },
  configurable: true,
})
assert.equal(loadRainbowLook(), 'fever', 'blocked storage still loads')
setRainbowLook('classic')
assert.equal(rainbowLook(), 'classic', 'blocked storage still switches')
if (realStorage) Object.defineProperty(globalThis, 'localStorage', realStorage)
else delete (globalThis as { localStorage?: unknown }).localStorage
setRainbowLook('classic', false)

/** A canvas stand-in that counts calls, collects colours and tracks save/restore depth. */
function recorder() {
  let depth = 0
  let calls = 0
  const colors = new Set<string>()
  const state: Record<string | symbol, unknown> = { globalAlpha: 1 }
  const g = new Proxy(state, {
    get(target, key) {
      if (key in target) return target[key]
      return (...args: unknown[]) => {
        calls++
        if (key === 'save') depth++
        if (key === 'restore') depth--
        void args
        return {
          addColorStop: (_offset: number, color: string) => colors.add(color),
          width: 0,
        }
      }
    },
    set(target, key, value) {
      if (key === 'fillStyle' || key === 'strokeStyle')
        colors.add(String(value))
      target[key] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { g, depth: () => depth, calls: () => calls, colors }
}

// The scenery pieces draw cleanly on their own, for every Act.
for (let act = 1; act <= 9; act++) {
  const { g, depth, colors } = recorder()
  drawFeverSky(g, act, act * 97, 1)
  drawFeverTrail(g, 80, 120, act * 13)
  assert.equal(depth(), 0, `Act ${act}: save and restore balance`)
  assert.ok(
    colors.has('#ff3fa4') && colors.has('#2ee6ff'),
    `Act ${act}: the airbrush rainbow is painted`,
  )
}

// A look is decoration only: a demo rendered in both looks, switching back and forth, flies exactly the same
// game as one never rendered at all, through every Act.
function seeded(seed = 4321) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const make = () =>
  createRainbowPrincessPreview({
    players: 2,
    demo: true,
    rng: seeded(),
    sound: { play() {} },
    hiScore: 0,
  })
const painted = make()
const plain = make()
const actsPainted = new Set<string>()
let renders = 0
for (let frame = 0; frame < 400000 && !plain.over; frame++) {
  painted.update(emptyInput())
  plain.update(emptyInput())
  if (frame % 450 === 0) {
    for (const look of ['classic', 'fever'] as const) {
      setRainbowLook(look, false)
      const { g, depth } = recorder()
      painted.render(g)
      assert.equal(depth(), 0, `frame ${frame} (${look}): save/restore balance`)
    }
    actsPainted.add(painted.snapshot.act)
    renders++
  }
  if (frame % 997 === 0) {
    assert.equal(
      painted.snapshot.score,
      plain.snapshot.score,
      `frame ${frame}: same score in either look`,
    )
    assert.equal(painted.snapshot.act, plain.snapshot.act)
  }
}
setRainbowLook('classic', false)
assert.equal(painted.over, plain.over)
assert.equal(painted.snapshot.score, plain.snapshot.score)
assert.ok(actsPainted.size >= 8, `Fever Dream painted ${actsPainted.size} Acts`)

// The fever sky really replaces the classic one.
{
  const game = make()
  assert.equal(rainbowLook(), 'fever', 'a fresh cabinet opens in Fever Dream')
  for (let i = 0; i < 300; i++) game.update(emptyInput())
  setRainbowLook('classic', false)
  const classic = recorder()
  game.render(classic.g)
  setRainbowLook('fever', false)
  const fever = recorder()
  game.render(fever.g)
  setRainbowLook('classic', false)
  assert.ok(!classic.colors.has('#ff3fa4'), 'classic paints no fever rainbow')
  assert.ok(fever.colors.has('#ff3fa4'), 'Fever Dream paints its rainbow')
  assert.ok(
    fever.calls() > classic.calls(),
    'Fever Dream adds its doodles and trails',
  )
}

console.log(
  `Rainbow Fever Dream: ${RAINBOW_DOODLE_ART.length} pictures, ${renders} paired renders across ${actsPainted.size} Acts, same game in either look.`,
)
