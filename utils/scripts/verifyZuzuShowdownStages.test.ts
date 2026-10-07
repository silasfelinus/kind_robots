// /utils/scripts/verifyZuzuShowdownStages.test.ts
//
// Zuzu Showdown stages (conductor zuzu-showdown t-009): the shipped stage manifests are sound (every
// layer and cutout inside its image, every scrolling layer covering the view at both camera limits,
// the anchors the moving parts hang off inside their layers), a roster fights on the right home
// stage, the Hollow Bell rings by itself at round start and at the KO and settles, the croc's eyes
// stay out of fights the croc is in, the moving parts stay where they belong, and a fuzzed match draws
// on each stage at finite coordinates.
//
//   npx tsx utils/scripts/verifyZuzuShowdownStages.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mulberry32 } from '../arcade/curve'
import { STAGE_HALF_WIDTH, createMatch, step } from '../zuzuShowdown/sim'
import { VIEW_HEIGHT, VIEW_WIDTH, drawMatch } from '../zuzuShowdown/render'
import { findFighter } from '../zuzuShowdown/fighters'
import {
  BELL_RING_FRAMES,
  STAGE_NAMES,
  advanceStageFx,
  bellAngle,
  crocEyesAt,
  layerX,
  newStageFx,
  smokePuffs,
  stageFile,
  stageFor,
  tumbleweedAt,
  vulturesAt,
  waterGlints,
  type LoadedStage,
  type StageManifest,
  type StageSlug,
} from '../zuzuShowdown/stages'
import {
  SIM_BUTTONS,
  neutralInput,
  type FighterData,
  type SimInput,
} from '../zuzuShowdown/types'

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

const ROOT = join(process.cwd(), 'public', 'zuzu-showdown-stages')
const SLUGS = Object.keys(STAGE_NAMES) as StageSlug[]

function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(join(ROOT, file))
  assert.equal(bytes.toString('ascii', 1, 4), 'PNG', `${file} is a PNG`)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

const manifests = Object.fromEntries(
  SLUGS.map((slug) => [
    slug,
    JSON.parse(
      readFileSync(join(ROOT, stageFile(slug, 'pixel')), 'utf8'),
    ) as StageManifest,
  ]),
) as Record<StageSlug, StageManifest>

const ZUZU = findFighter('zuzu')
const COYOTE = findFighter('coyote-vagrant')
const CAMERA_TRAVEL = STAGE_HALF_WIDTH - VIEW_WIDTH / 2

// ---------------------------------------------------------------- the shipped art

check(
  'each stage ships a sound manifest: layers cover the view at both camera limits',
  () => {
    for (const slug of SLUGS) {
      const m = manifests[slug]
      assert.equal(m.stage, slug)
      assert.equal(m.style, 'pixel')
      assert.equal(m.scale, 1)
      assert.ok(m.layers.length >= 3, `${slug} has 3 to 5 parallax layers`)
      assert.ok(m.layers.length <= 5)
      const names = m.layers.map((l) => l.name)
      assert.equal(names[0], 'backdrop', `${slug} draws its backdrop first`)
      assert.equal(names.at(-1), 'floor', `${slug} draws its floor last`)
      for (const layer of m.layers) {
        const size = pngSize(layer.file)
        assert.equal(size.width, layer.w, `${slug} ${layer.name} width`)
        assert.equal(size.height, layer.h, `${slug} ${layer.name} height`)
        assert.ok(layer.factor >= 0 && layer.factor <= 1)
        assert.ok(layer.y >= 0 && layer.y + layer.h <= VIEW_HEIGHT + 2)
        for (const cam of [-CAMERA_TRAVEL, 0, CAMERA_TRAVEL]) {
          const x = layerX(layer, cam)
          assert.ok(
            x <= 0 && x + layer.w >= VIEW_WIDTH,
            `${slug} ${layer.name} covers the view at camera ${cam} (x ${x}, w ${layer.w})`,
          )
        }
      }
      // Slower layers are further back.
      const factors = m.layers.map((l) => l.factor)
      assert.deepEqual(
        factors,
        [...factors].sort((a, b) => a - b),
      )
      const byName = Object.fromEntries(m.layers.map((l) => [l.name, l]))
      for (const cut of m.cutouts) {
        const layer = byName[cut.layer]!
        assert.ok(layer, `${slug} ${cut.name} is on a layer`)
        const size = pngSize(cut.file)
        assert.equal(size.width, cut.w)
        assert.equal(size.height, cut.h)
        assert.ok(cut.x >= 0 && cut.y >= 0)
        assert.ok(cut.x + cut.w <= layer.w && cut.y + cut.h <= layer.h)
      }
      for (const [name, a] of Object.entries(m.anchors)) {
        const layer = byName[a!.layer]
        assert.ok(layer, `${slug} anchor ${name} is on a layer`)
        assert.ok(
          a!.x >= 0 && a!.x + (a!.w ?? 0) <= layer.w,
          `${slug} ${name} x`,
        )
        assert.ok(
          a!.y >= 0 && a!.y + (a!.h ?? 0) <= layer.h,
          `${slug} ${name} y`,
        )
      }
    }
    const hb = manifests['hollow-bell']
    assert.ok(
      hb.cutouts.some((c) => c.name === 'bell'),
      'the bell swings',
    )
    assert.ok(hb.anchors.arch, 'the arch board is lettered')
    assert.ok(hb.anchors.smoke, 'the lantern smokes')
    const wh = manifests['watering-hole']
    assert.ok(wh.anchors.water?.w, 'the water glints')
  },
)

// ---------------------------------------------------------------- choosing and animating

check('a fight is on the challenger’s home stage', () => {
  assert.equal(stageFor([ZUZU, COYOTE]), 'watering-hole')
  assert.equal(stageFor([COYOTE, ZUZU]), 'hollow-bell')
  assert.equal(stageFor([ZUZU, ZUZU]), 'hollow-bell')
  const placeholder = findFighter('placeholder-a')
  assert.equal(stageFor([placeholder, placeholder]), 'hollow-bell')
  assert.equal(stageFor([COYOTE, placeholder]), 'watering-hole')
})

check(
  'the bell rings by itself at round start and at the KO, then settles',
  () => {
    let fx = newStageFx()
    assert.equal(fx.bell, null)
    fx = advanceStageFx(fx, [{ type: 'roundStart', round: 1 }])
    assert.equal(fx.bell, 0)
    const swing = Math.max(
      ...Array.from({ length: 40 }, (_, t) =>
        Math.abs(bellAngle(1000, { bell: t }, false)),
      ),
    )
    assert.ok(swing > 8, `rings hard (${swing.toFixed(1)} degrees)`)
    for (let i = 0; i < BELL_RING_FRAMES; i += 1) fx = advanceStageFx(fx, [])
    assert.ok(Math.abs(bellAngle(1000, fx, false)) <= 2, 'back to the breeze')
    assert.equal(
      bellAngle(1000, { bell: 5 }, true),
      0,
      'still under reduced motion',
    )
    fx = advanceStageFx(fx, [{ type: 'ko', result: 'draw' }])
    assert.equal(fx.bell, 0)
  },
)

check(
  'the croc’s eyes surface only in fights the croc is not in, inside the water',
  () => {
    const croc = { ...COYOTE, slug: 'river-croc' } as FighterData
    let seen = 0
    for (let frame = 0; frame < 720 * 5; frame += 1) {
      assert.equal(crocEyesAt(frame, [croc, ZUZU], 120), null)
      const eyes = crocEyesAt(frame, [ZUZU, COYOTE], 120)
      if (!eyes) continue
      seen += 1
      assert.ok(eyes.x >= 0 && eyes.x + 10 <= 120)
    }
    assert.ok(
      seen > 0 && seen < 720 * 5 * 0.4,
      `surfaces now and then (${seen})`,
    )
  },
)

check('the moving parts stay where they belong', () => {
  for (let frame = 0; frame < 3000; frame += 7) {
    for (const v of vulturesAt(frame)) assert.ok(v.y >= 10 && v.y < 110)
    const weed = tumbleweedAt(frame)
    if (weed) assert.ok(weed.y <= 0 && weed.y >= -10)
    assert.equal(smokePuffs(frame, false).length, 6)
    assert.equal(smokePuffs(frame, true).length, 2)
    for (const glint of waterGlints(frame, 100, 12)) {
      assert.ok(glint.x >= 0 && glint.x <= 100 && glint.y >= 0 && glint.y <= 12)
    }
  }
})

// ---------------------------------------------------------------- drawing

type Call = { op: string; args: number[] }

function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
    }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    imageSmoothingEnabled: true,
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    drawImage: record('drawImage'),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    rotate: record('rotate'),
    scale: record('scale'),
    beginPath: record('beginPath'),
    arc: record('arc'),
    stroke: record('stroke'),
    createLinearGradient: () => ({ addColorStop: () => undefined }),
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

function loaded(m: StageManifest): LoadedStage {
  // Images only need to exist for the draw calls; the stub canvas records their numbers.
  const image = {} as CanvasImageSource
  return {
    manifest: m,
    layers: Object.fromEntries(m.layers.map((l) => [l.name, image])),
    cutouts: Object.fromEntries(m.cutouts.map((c) => [c.name, image])),
  }
}

check(
  'a fuzzed match draws on each stage at finite coordinates, every layer every frame',
  () => {
    for (const [slug, roster] of [
      ['hollow-bell', [COYOTE, ZUZU]],
      ['watering-hole', [ZUZU, COYOTE]],
    ] as const) {
      const stage = loaded(manifests[slug])
      const rand = mulberry32(slug.length)
      const held: [SimInput, SimInput] = [neutralInput(), neutralInput()]
      let s = createMatch([...roster])
      // A short first round, so the fuzz reaches the next round start (and the bell rings) in time.
      s.timer = 600
      let fx = advanceStageFx(newStageFx(), s.events)
      let rang = 0
      for (let i = 0; i < 2400 && s.phase !== 'over'; i += 1) {
        for (const p of held) {
          for (const button of SIM_BUTTONS)
            if (rand() < 0.1) p[button] = !p[button]
        }
        s = step(s, [{ ...held[0] }, { ...held[1] }], [...roster])
        fx = advanceStageFx(fx, s.events)
        if (fx.bell === 0) rang += 1
        const { g, calls } = stubContext()
        drawMatch(g, s, [...roster], [], {
          showBoxes: false,
          reducedMotion: i % 5 === 0,
          stage,
          stageFx: fx,
        })
        for (const call of calls) {
          for (const n of call.args)
            assert.ok(
              Number.isFinite(n),
              `${slug} ${call.op} got ${n} on frame ${i}`,
            )
        }
        const images = calls.filter((c) => c.op === 'drawImage').length
        assert.ok(
          images >= stage.manifest.layers.length,
          `${slug} draws its layers`,
        )
      }
      assert.ok(rang >= 1, `${slug}: the bell's state saw a round start`)
    }
  },
)

console.log(`verifyZuzuShowdownStages: ${passed} checks passed`)
