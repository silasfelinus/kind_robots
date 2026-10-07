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
  VIEW_HEIGHT,
  VIEW_WIDTH,
  drawMatch,
  type Callout,
} from '../zuzuShowdown/render'
import { createMatch, step } from '../zuzuShowdown/sim'
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

console.log(`verifyZuzuShowdownDisplay: ${passed} checks passed`)
