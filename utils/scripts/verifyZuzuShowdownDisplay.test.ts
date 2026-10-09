// /utils/scripts/verifyZuzuShowdownDisplay.test.ts
//
// Zuzu Showdown render styles (conductor zuzu-showdown t-027, on kr-arcade t-012's display layer):
//
//   - the logical-to-canvas fit at DPR 1, 2 and 3 for Pixel and HD: Pixel keeps the 480x270 canvas and
//     shows it at a whole number of device pixels per game pixel (no blur, no uneven pixels) unless
//     that would leave most of a small box empty; HD supersamples at a whole scale that covers the box
//     in device pixels, so the browser only ever shrinks it;
//   - the vector font draws inside the bitmap font's box, and a context goes back to the bitmap font;
//   - a match drawn in HD smooths its images and draws its text and sparks smooth;
//   - P2's colours made in the browser match conductor rig.py's p2_recolour;
//   - the shipped HD art: WebP a browser can decode, the same frames, boxes and anchors as the pixel
//     art in game units, and the stage manifests laid out exactly as the pixel ones.
//
//   npx tsx utils/scripts/verifyZuzuShowdownDisplay.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  MAX_DPR,
  MAX_HD_SCALE,
  PIXEL_MIN_FILL,
  fitDisplay,
  isRenderStyle,
} from '../arcade/display'
import {
  drawText,
  measureText,
  setTextStyle,
  textStyleOf,
} from '../arcade/font'
import { recolourPixels, type P2Rule } from '../zuzuShowdown/recolour'
import {
  FLOOR_Y,
  HEAD_ROW,
  MAX_ZOOM,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  ZOOM_X,
  ZOOM_Y,
  PAN_MAX,
  advanceZoom,
  cameraPan,
  cameraX,
  panLimit,
  drawMatch,
  layerZoom,
  zoomTarget,
  type Callout,
} from '../zuzuShowdown/render'
import {
  MAX_SEPARATION,
  STAGE_HALF_WIDTH,
  createMatch,
  step,
} from '../zuzuShowdown/sim'
import { mulberry32 } from '../arcade/curve'
import type { Spark } from '../zuzuShowdown/effects'
import {
  SPRITE_FIGHTERS,
  spriteSheetFile,
  type SpriteSheet,
} from '../zuzuShowdown/sprites'
import {
  STAGE_NAMES,
  stageFile,
  type StageManifest,
  type StageSlug,
} from '../zuzuShowdown/stages'
import { findFighter } from '../zuzuShowdown/fighters'
import { SUB, neutralInput, type FighterData } from '../zuzuShowdown/types'

const SPRITES = join(process.cwd(), 'public', 'zuzu-showdown-sprites')
const STAGES = join(process.cwd(), 'public', 'zuzu-showdown-stages')

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

const BOXES = [320, 390, 700, 844, 960, 1152]
const DPRS = [1, 2, 3]

check(
  'Pixel: the 480x270 canvas at a whole multiple of device pixels, or filling a small box',
  () => {
    for (const available of BOXES)
      for (const dpr of DPRS) {
        const fit = fitDisplay({
          width: VIEW_WIDTH,
          height: VIEW_HEIGHT,
          available,
          dpr,
          style: 'pixel',
        })
        const at = `${available}px at DPR ${dpr}`
        assert.equal(fit.canvasWidth, VIEW_WIDTH, at)
        assert.equal(fit.canvasHeight, VIEW_HEIGHT, at)
        assert.equal(fit.scale, 1, at)
        assert.equal(fit.smoothing, false, at)
        assert.equal(fit.rendering, 'pixelated', at)
        assert.ok(fit.cssWidth <= available + 1e-9, `${at}: fits its box`)
        const perPixel = (fit.cssWidth * dpr) / VIEW_WIDTH
        const whole = Math.abs(perPixel - Math.round(perPixel)) < 1e-9
        if (whole) {
          assert.ok(perPixel >= 1, at)
          assert.ok(
            fit.cssWidth >= PIXEL_MIN_FILL * available,
            `${at}: a whole multiple only when it fills most of the box`,
          )
          // And it's the largest whole multiple that fits.
          assert.ok(((perPixel + 1) * VIEW_WIDTH) / dpr > available, at)
        } else assert.equal(fit.cssWidth, available, `${at}: else it fills`)
      }
    // The cases a player meets: a desktop column, a phone held both ways.
    const at = (available: number, dpr: number) =>
      fitDisplay({ width: 480, height: 270, available, dpr, style: 'pixel' })
        .cssWidth
    assert.equal(at(1152, 1), 960)
    assert.equal(at(1152, 2), 960)
    assert.equal(at(1152, 3), 1120)
    assert.equal(at(844, 3), 800)
    assert.equal(at(390, 3), 320)
    assert.equal(at(700, 1), 700)
  },
)

check(
  'HD: a whole supersample that covers the box in device pixels, capped',
  () => {
    for (const available of BOXES)
      for (const dpr of DPRS) {
        const fit = fitDisplay({
          width: VIEW_WIDTH,
          height: VIEW_HEIGHT,
          available,
          dpr,
          style: 'hd',
        })
        const at = `${available}px at DPR ${dpr}`
        assert.ok(Number.isInteger(fit.scale) && fit.scale >= 1, at)
        assert.ok(fit.scale <= MAX_HD_SCALE, at)
        assert.equal(fit.canvasWidth, VIEW_WIDTH * fit.scale, at)
        assert.equal(fit.canvasHeight, VIEW_HEIGHT * fit.scale, at)
        assert.equal(fit.cssWidth, available, `${at}: fills its box`)
        assert.equal(fit.smoothing, true, at)
        assert.equal(fit.rendering, 'auto', at)
        const device = available * Math.min(dpr, MAX_DPR)
        if (fit.scale < MAX_HD_SCALE) {
          assert.ok(
            fit.canvasWidth >= device,
            `${at}: the browser only shrinks it`,
          )
          assert.ok(
            (fit.scale - 1) * VIEW_WIDTH < device,
            `${at}: the smallest scale that covers`,
          )
        }
        // The game's whole width lands on the canvas's whole width: the transform is the scale.
        assert.equal(VIEW_WIDTH * fit.scale, fit.canvasWidth)
      }
    const scale = (available: number, dpr: number) =>
      fitDisplay({ width: 480, height: 270, available, dpr, style: 'hd' }).scale
    assert.equal(scale(1152, 1), 3)
    assert.equal(scale(1152, 2), 5)
    assert.equal(scale(1152, 3), 5)
    assert.equal(scale(390, 3), 3)
    assert.equal(scale(844, 3), 5)
    assert.equal(scale(320, 1), 1)
    // A DPR past the cap draws as the cap; a broken one as 1.
    assert.equal(scale(390, 4), scale(390, MAX_DPR))
    assert.equal(scale(390, Number.NaN), scale(390, 1))
    assert.ok(
      isRenderStyle('hd') && isRenderStyle('pixel') && !isRenderStyle('crt'),
    )
  },
)

type Call = { op: string; args: unknown[] }

function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({ op, args })
    }
  const gradient = { addColorStop: () => undefined }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    font: '',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    imageSmoothingEnabled: false,
    fillRect: record('fillRect'),
    strokeRect: record('strokeRect'),
    fillText: record('fillText'),
    beginPath: record('beginPath'),
    arc: record('arc'),
    fill: record('fill'),
    save: record('save'),
    restore: record('restore'),
    createLinearGradient: () => gradient,
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

check(
  "the vector font draws in the bitmap font's box, and switches back",
  () => {
    const { g, calls } = stubContext()
    assert.equal(textStyleOf(g), 'pixel')
    drawText(g, 'KO', 100, 40, { scale: 2 })
    assert.ok(calls.every((c) => c.op === 'fillRect'))
    calls.length = 0
    setTextStyle(g, 'vector')
    assert.equal(textStyleOf(g), 'vector')
    drawText(g, 'Perfect *', 240, 40, {
      scale: 2,
      align: 'center',
      shadow: '#000',
    })
    const texts = calls.filter((c) => c.op === 'fillText')
    assert.equal(texts.length, 2, 'the shadow, then the text')
    assert.ok(!calls.some((c) => c.op === 'fillRect'))
    const width = measureText('Perfect *', 2)
    const [text, x, y, maxWidth] = texts[1]!.args as [
      string,
      number,
      number,
      number,
    ]
    assert.equal(text, 'PERFECT ♥')
    assert.equal(x, Math.round(240 - width / 2))
    assert.equal(y, 40 + 7 * 2, "caps sit on the bitmap glyphs' bottom row")
    assert.equal(maxWidth, width, 'no wider than the bitmap font')
    setTextStyle(g, 'pixel')
    assert.equal(textStyleOf(g), 'pixel')
  },
)

const ZUZU = findFighter('zuzu') as FighterData
const COYOTE = findFighter('coyote-vagrant') as FighterData
const ROSTER: [FighterData, FighterData] = [ZUZU, COYOTE]

check(
  'a match drawn in HD smooths its images, and its text and sparks are smooth',
  () => {
    // A match well into its fight, and a spark at the fighters' feet.
    let s = createMatch(ROSTER)
    for (let i = 0; i < 400; i += 1)
      s = step(s, [neutralInput(), neutralInput()], ROSTER)
    const sparks: Spark[] = [
      { kind: 'hit', x: s.fighters[0].x, y: 40 * SUB, scale: 2, age: 0 },
    ]
    for (const style of ['pixel', 'hd'] as const) {
      const { g, calls } = stubContext()
      const callout: Callout = {
        text: 'COUNTER',
        side: 0,
        frames: 30,
        color: '#fff',
      }
      drawMatch(g, s, ROSTER, [callout], {
        showBoxes: false,
        reducedMotion: false,
        sparks,
        style,
      })
      assert.equal(g.imageSmoothingEnabled, style === 'hd', style)
      const ops = new Set(calls.map((c) => c.op))
      assert.equal(ops.has('fillText'), style === 'hd', `${style} text`)
      assert.equal(ops.has('arc'), style === 'hd', `${style} sparks`)
      setTextStyle(g, 'pixel')
    }
  },
)

check("P2's colours made in the browser match conductor rig.py", () => {
  // rig.py p2_recolour on these colours, with each rig's P2_RULES (the shipped HD sheets carry them).
  const cases: Array<{
    slug: string
    pairs: Array<[number[], number[]]>
  }> = [
    {
      slug: 'zuzu',
      pairs: [
        [
          [180, 80, 40],
          [61, 126, 180],
        ],
        [
          [220, 140, 60],
          [85, 129, 220],
        ],
        [
          [90, 50, 30],
          [90, 50, 30],
        ],
        [
          [200, 200, 200],
          [200, 200, 200],
        ],
      ],
    },
    {
      slug: 'coyote',
      pairs: [
        [
          [180, 80, 40],
          [180, 80, 40],
        ],
        [
          [120, 160, 60],
          [160, 30, 97],
        ],
        [
          [60, 90, 40],
          [90, 25, 45],
        ],
        [
          [30, 30, 30],
          [30, 30, 30],
        ],
      ],
    },
  ]
  for (const { slug, pairs } of cases) {
    const sheet = JSON.parse(
      readFileSync(join(SPRITES, `${slug}-hd.json`), 'utf8'),
    ) as SpriteSheet
    const rules = sheet.p2_rules as P2Rule[]
    assert.ok(rules.length > 0, slug)
    const data = new Uint8ClampedArray(
      pairs.flatMap(([from]) => [...from, 255]),
    )
    recolourPixels(data, rules)
    pairs.forEach(([from, want], i) => {
      for (let c = 0; c < 3; c += 1)
        assert.ok(
          Math.abs(data[i * 4 + c]! - want[c]!) <= 3,
          `${slug} ${from} -> ${[...data.slice(i * 4, i * 4 + 3)]}, want ${want}`,
        )
      assert.equal(data[i * 4 + 3], 255)
    })
  }
  // Transparent pixels are left alone.
  const clear = new Uint8ClampedArray([180, 80, 40, 0])
  recolourPixels(clear, [{ hue: [0, 360], shift: 180 }])
  assert.deepEqual([...clear], [180, 80, 40, 0])
})

/**
 * A lossy WebP's size: extended (VP8X, with alpha) or simple (VP8, an opaque backdrop). Browsers decode
 * at most 16383 a side.
 */
function webpSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(file)
  assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', file)
  assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', file)
  const chunk = bytes.toString('ascii', 12, 16)
  let width: number
  let height: number
  if (chunk === 'VP8X') {
    width = bytes.readUIntLE(24, 3) + 1
    height = bytes.readUIntLE(27, 3) + 1
  } else {
    assert.equal(chunk, 'VP8 ', `${file} is lossy WebP`)
    width = bytes.readUInt16LE(26) & 0x3fff
    height = bytes.readUInt16LE(28) & 0x3fff
  }
  assert.ok(width <= 16383 && height <= 16383, file)
  return { width, height }
}

check(
  "the HD sprites: the pixel art's frames and boxes, at 3x, in WebP",
  () => {
    for (const slug of SPRITE_FIGHTERS) {
      const read = (style: 'pixel' | 'hd') =>
        JSON.parse(
          readFileSync(join(SPRITES, spriteSheetFile(slug, style)), 'utf8'),
        ) as SpriteSheet
      const pixel = read('pixel')
      const hd = read('hd')
      assert.equal(hd.style, 'hd')
      assert.equal(hd.scale, 3)
      assert.equal(hd.atlas_p2, null, 'HD recolours P2 in the browser')
      const atlas = webpSize(join(SPRITES, hd.atlas))
      assert.deepEqual(
        Object.keys(hd.animations),
        Object.keys(pixel.animations),
      )
      for (const [name, anim] of Object.entries(hd.animations)) {
        const twin = pixel.animations[name]!
        assert.equal(anim.fps, twin.fps)
        assert.equal(anim.loop, twin.loop)
        assert.equal(anim.frames.length, twin.frames.length, `${slug} ${name}`)
        anim.frames.forEach((f, i) => {
          const p = twin.frames[i]!
          const at = `${slug} ${name}[${i}]`
          assert.ok(f.x >= 0 && f.y >= 0, at)
          assert.ok(f.x + f.w <= atlas.width && f.y + f.h <= atlas.height, at)
          // The boxes are game units: the attack's reach is measured once for both styles, and the
          // silhouette's box agrees but for the pixel art's outline.
          assert.deepEqual(f.hit, p.hit, at)
          for (const key of ['x', 'y', 'w', 'h'] as const)
            assert.ok(Math.abs(f.hurt![key] - p.hurt![key]) <= 3, `${at} hurt`)
          // The anchor (the fighter's spot), in game pixels, within a pixel of the pixel art's.
          // (The pixel frames carry a one-pixel outline the HD ones don't.)
          assert.ok(
            Math.abs(f.anchor.x / hd.scale - (p.anchor.x - 1)) <= 1.5,
            `${at} anchor x`,
          )
          assert.ok(
            Math.abs(f.anchor.y / hd.scale - (p.anchor.y - 1)) <= 1.5,
            `${at} anchor y`,
          )
        })
      }
    }
  },
)

check(
  'the HD stages: laid out exactly as the pixel ones, at 4x, in WebP',
  () => {
    for (const slug of Object.keys(STAGE_NAMES) as StageSlug[]) {
      const read = (style: 'pixel' | 'hd') =>
        JSON.parse(
          readFileSync(join(STAGES, stageFile(slug, style)), 'utf8'),
        ) as StageManifest
      const pixel = read('pixel')
      const hd = read('hd')
      assert.equal(hd.style, 'hd')
      assert.equal(hd.scale, 4)
      const strip = <T extends { file: string }>(items: T[]) =>
        items.map(({ file: _file, ...rest }) => rest)
      assert.deepEqual(strip(hd.layers), strip(pixel.layers), slug)
      assert.deepEqual(strip(hd.cutouts), strip(pixel.cutouts), slug)
      assert.deepEqual(hd.anchors, pixel.anchors, slug)
      for (const item of [...hd.layers, ...hd.cutouts]) {
        const size = webpSize(join(STAGES, item.file))
        assert.deepEqual(
          size,
          { width: item.w * hd.scale, height: item.h * hd.scale },
          `${slug} ${item.file}`,
        )
      }
    }
  },
)

check(
  'the camera closes in on the fight: about twice the size up close, back out to fit',
  () => {
    const zuzus: [FighterData, FighterData] = [ZUZU, ZUZU]
    // At the round's start (140 apart) Zuzu fills the closest zoom; the Coyote (104 tall) a touch less.
    assert.equal(zoomTarget(createMatch(zuzus), zuzus), MAX_ZOOM)
    const coyote = zoomTarget(createMatch(ROSTER), ROSTER)
    assert.ok(coyote > 1.7 && coyote <= MAX_ZOOM, `${coyote}`)
    // A full screen apart, the whole stage again.
    const apart = createMatch(zuzus)
    apart.fighters[0].x = (-MAX_SEPARATION / 2) * SUB
    apart.fighters[1].x = (MAX_SEPARATION / 2) * SUB
    assert.equal(zoomTarget(apart, zuzus), 1)
    // A jump lifts the view instead of pulling it back: a plain jump keeps Zuzu close up, and only one
    // the lift can't follow (a super jump) pulls back, from take-off.
    const jump = createMatch(zuzus)
    jump.fighters[0].vy = ZUZU.jumpVelocity
    const jumping = zoomTarget(jump, zuzus)
    assert.ok(jumping >= 1.6 && jumping < MAX_ZOOM, `${jumping}`)
    jump.fighters[0].y = 60 * SUB
    jump.fighters[0].vy = 0
    const lift = cameraPan(jump, zuzus, jumping)
    assert.ok(lift > 0 && lift <= panLimit(jumping), `${lift}`)
    assert.equal(
      cameraPan(createMatch(zuzus), zuzus, MAX_ZOOM),
      0,
      'no lift standing',
    )
    const superJump = createMatch(zuzus)
    superJump.fighters[0].vy = 12 * SUB
    assert.ok(
      zoomTarget(superJump, zuzus) < 1.6,
      `${zoomTarget(superJump, zuzus)}`,
    )
    assert.equal(panLimit(1), 0, 'unzoomed, the sky has nothing to spare')
    // Easing: out faster than in, and it settles exactly.
    const out = advanceZoom(1.8, 1.2, false) - 1.8
    const back = advanceZoom(1.2, 1.8, false) - 1.2
    assert.ok(-out > back && back > 0)
    let z = 1
    for (let i = 0; i < 400; i += 1) z = advanceZoom(z, 1.5, false)
    assert.equal(z, 1.5)
    assert.equal(layerZoom(1.8, 1), 1.8)
    assert.equal(layerZoom(1.8, 0), 1)
  },
)

check(
  'zoomed, both fighters stay on screen and every head under the names',
  () => {
    for (const roster of [ROSTER, [ZUZU, ZUZU] as [FighterData, FighterData]])
      for (const seed of [3, 17, 2026]) {
        const rand = mulberry32(seed)
        let s = createMatch(roster)
        const held = [neutralInput(), neutralInput()]
        for (let i = 0; i < 2400 && s.phase !== 'over'; i += 1) {
          for (const p of held)
            for (const button of [
              'left',
              'right',
              'up',
              'down',
              'lp',
              'hk',
            ] as const)
              if (rand() < 0.08) p[button] = !p[button]
          s = step(s, [{ ...held[0]! }, { ...held[1]! }], roster)
          const z = zoomTarget(s, roster)
          const camera = cameraX(s, z) / SUB
          for (const side of [0, 1] as const) {
            const f = s.fighters[side]
            const data = roster[side]
            const x = ZOOM_X + (f.x / SUB - camera) * z
            const half = (data.pushbox.w / 2) * z
            assert.ok(
              x - half >= -1 && x + half <= VIEW_WIDTH + 1,
              `side ${side} at ${x} (zoom ${z}) frame ${i}`,
            )
            const head =
              Math.max(0, f.y / SUB) + data.hurtStand.y + data.hurtStand.h
            const pan = cameraPan(s, roster, z)
            assert.ok(pan >= 0 && pan <= PAN_MAX)
            if (z > 1) {
              // Zoomed in, the lift keeps every head under the names and every pair of feet in view.
              const row = ZOOM_Y - (ZOOM_Y - FLOOR_Y + head) * z + pan
              assert.ok(
                row >= HEAD_ROW - 1,
                `side ${side}'s head at row ${row} (zoom ${z}, lift ${pan}) frame ${i}`,
              )
              const feet =
                ZOOM_Y - (ZOOM_Y - FLOOR_Y + Math.max(0, f.y / SUB)) * z + pan
              assert.ok(
                feet <= VIEW_HEIGHT + 7,
                `side ${side}'s feet at row ${feet} (zoom ${z}, lift ${pan}) frame ${i}`,
              )
            }
          }
        }
      }
  },
)

check('every stage still fills the screen at every zoom and camera', () => {
  for (const slug of Object.keys(STAGE_NAMES) as StageSlug[]) {
    const m = JSON.parse(
      readFileSync(join(STAGES, stageFile(slug, 'pixel')), 'utf8'),
    ) as StageManifest
    const byName = Object.fromEntries(m.layers.map((l) => [l.name, l]))
    for (const z of [1, 1.25, 1.5, 1.7, MAX_ZOOM]) {
      const limit = STAGE_HALF_WIDTH - VIEW_WIDTH / 2 / z
      for (const cam of [-limit, 0, limit]) {
        for (const name of ['backdrop', 'floor']) {
          const l = byName[name]
          assert.ok(l, `${slug} has a ${name}`)
          const k = layerZoom(z, l.factor)
          const left = ZOOM_X + (Math.round(l.x - cam * l.factor) - ZOOM_X) * k
          const right = left + l.w * k
          const at = `${slug} ${name} at zoom ${z}, camera ${cam.toFixed(0)}`
          assert.ok(
            left <= 0 && right >= VIEW_WIDTH,
            `${at}: ${left.toFixed(1)}..${right.toFixed(1)}`,
          )
          const top = ZOOM_Y + (l.y - ZOOM_Y) * k
          const bottom = ZOOM_Y + (l.y + l.h - ZOOM_Y) * k
          if (name === 'backdrop') {
            assert.ok(top <= 0, `${at}: sky starts at ${top}`)
            // Lifted as far as it goes, the sky still reaches the top.
            const lifted = top + panLimit(z) * l.factor
            assert.ok(lifted <= 0.001, `${at}: lifted sky starts at ${lifted}`)
          } else
            assert.ok(bottom >= VIEW_HEIGHT, `${at}: ground ends at ${bottom}`)
        }
        // No gap between the sky and the ground.
        const sky = byName.backdrop!
        const ground = byName.floor!
        const skyBottom =
          ZOOM_Y + (sky.y + sky.h - ZOOM_Y) * layerZoom(z, sky.factor)
        const groundTop =
          ZOOM_Y + (ground.y - ZOOM_Y) * layerZoom(z, ground.factor)
        assert.ok(
          groundTop <= skyBottom,
          `${slug} at zoom ${z}: ${groundTop} > ${skyBottom}`,
        )
      }
    }
  }
})

console.log(`verifyZuzuShowdownDisplay: ${passed} checks passed`)
