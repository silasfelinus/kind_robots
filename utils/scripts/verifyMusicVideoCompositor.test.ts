// /utils/scripts/verifyMusicVideoCompositor.test.ts
//
// Contract test for music-video/t-014 (stores/helpers/musicVideoCompositor.ts).
// Pure frame and timing math only; the WebCodecs path needs a browser.
//
// What earns its keep: segment lengths match Conductor's ffmpeg pipeline
// (scene_durations), a crossfade starts at the incoming scene's start and holds
// the outgoing scene beneath it, Ken Burns stays inside the source image for
// every preset and aspect, and stage sizes are even (H.264).
import assert from 'node:assert/strict'

import type { MusicVideoScene } from '../musicVideoDoc.js'
import {
  KEN_BURNS_ZOOM,
  buildStageSegments,
  coverRect,
  frameCount,
  frameTimeSec,
  kenBurnsAt,
  sourceRectFor,
  stageDurationSec,
  stageLayersAt,
  stageSizeFor,
} from '../../stores/helpers/musicVideoCompositor.js'
import { MUSIC_VIDEO_KEN_BURNS_PRESETS } from '../musicVideoMotion.js'

function scene(
  id: string,
  startSec: number,
  endSec: number,
  transition: 'cut' | 'crossfade' = 'cut',
  transitionSec = 0,
): MusicVideoScene {
  return {
    id,
    startSec,
    endSec,
    lyricRefs: [],
    prompt: id,
    promptSource: 'user',
    image: { source: 'generated' },
    motion: { kind: 'kenburns' },
    transition,
    transitionSec,
  }
}

const near = (a: number, b: number, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) < eps, `${a} !~ ${b}`)

// --- segments: mirror scene_durations in scripts/build_music_video.py
const segments = buildStageSegments([
  scene('c', 20, 30),
  scene('a', 0, 10),
  scene('b', 10, 20, 'crossfade', 2),
])
assert.deepEqual(
  segments.map((s) => s.sceneId),
  ['a', 'b', 'c'],
  'scenes are walked in time order',
)
near(segments[0]!.durationSec, 12) // 10 + the 2 s crossfade into b
near(segments[1]!.durationSec, 10) // cut into c
near(segments[2]!.durationSec, 10) // last: its own length
assert.equal(stageDurationSec(segments), 30)
assert.equal(
  segments[0]!.transition,
  'cut',
  'the first scene has nothing to fade from',
)
assert.equal(segments[1]!.transition, 'crossfade')
assert.deepEqual(
  segments.map((s) => s.preset),
  ['zoom-in', 'pan-right', 'zoom-out'],
  'presets cycle by position',
)

// --- layers
assert.deepEqual(stageLayersAt([], 5), [])
let layers = stageLayersAt(segments, 5)
assert.equal(layers.length, 1)
assert.equal(layers[0]!.index, 0)
near(layers[0]!.progress, 5 / 12)

layers = stageLayersAt(segments, 10) // the crossfade begins at b's start
assert.deepEqual(
  layers.map((l) => [l.index, l.alpha]),
  [
    [0, 1],
    [1, 0],
  ],
)
layers = stageLayersAt(segments, 11)
assert.deepEqual(
  layers.map((l) => l.index),
  [0, 1],
)
near(layers[1]!.alpha, 0.5)
layers = stageLayersAt(segments, 12) // fully faded in
assert.deepEqual(
  layers.map((l) => l.index),
  [1],
)
layers = stageLayersAt(segments, 20) // a plain cut
assert.deepEqual(
  layers.map((l) => l.index),
  [2],
)
assert.equal(
  stageLayersAt(segments, -3)[0]!.index,
  0,
  'before the start holds scene one',
)
assert.equal(
  stageLayersAt(segments, 999)[0]!.progress,
  1,
  'past the end holds the last frame',
)

// --- Ken Burns: names match the contract, zoom bounded, direction right
for (const preset of MUSIC_VIDEO_KEN_BURNS_PRESETS) {
  for (const p of [0, 0.25, 0.5, 1]) {
    const { zoom, panX, panY } = kenBurnsAt(preset, p)
    assert.ok(
      zoom >= 1 - 1e-9 && zoom <= 1 + KEN_BURNS_ZOOM + 1e-9,
      `${preset} zoom`,
    )
    assert.ok(panX >= 0 && panX <= 1 && panY >= 0 && panY <= 1, `${preset} pan`)
  }
}
near(kenBurnsAt('zoom-in', 0).zoom, 1)
near(kenBurnsAt('zoom-in', 1).zoom, 1 + KEN_BURNS_ZOOM)
near(kenBurnsAt('zoom-out', 0).zoom, 1 + KEN_BURNS_ZOOM)
near(kenBurnsAt('zoom-out', 1).zoom, 1)
assert.ok(kenBurnsAt('pan-right', 1).panX > kenBurnsAt('pan-right', 0).panX)
assert.ok(kenBurnsAt('pan-left', 1).panX < kenBurnsAt('pan-left', 0).panX)

// --- source rect: always inside the image, always the stage's aspect
for (const [sw, sh] of [
  [1280, 720],
  [720, 1280],
  [1024, 1024],
  [3000, 500],
]) {
  for (const [dw, dh] of [
    [1280, 720],
    [720, 1280],
    [720, 720],
  ]) {
    for (const preset of MUSIC_VIDEO_KEN_BURNS_PRESETS) {
      for (const p of [0, 0.5, 1]) {
        const r = sourceRectFor(sw!, sh!, dw!, dh!, preset, p)
        const label = `${sw}x${sh}->${dw}x${dh} ${preset} ${p}`
        assert.ok(r.x >= -1e-6 && r.y >= -1e-6, `${label} origin`)
        assert.ok(r.x + r.width <= sw! + 1e-6, `${label} right edge`)
        assert.ok(r.y + r.height <= sh! + 1e-6, `${label} bottom edge`)
        near(r.width / r.height, dw! / dh!, 1e-6)
      }
    }
  }
}
const still = sourceRectFor(1280, 720, 1280, 720, 'zoom-in', 0)
assert.deepEqual(still, { x: 0, y: 0, width: 1280, height: 720 })

// --- stage size and frame math
assert.deepEqual(stageSizeFor('16:9'), { width: 1280, height: 720 })
assert.deepEqual(stageSizeFor('9:16'), { width: 720, height: 1280 })
assert.deepEqual(stageSizeFor('1:1'), { width: 720, height: 720 })
for (const aspect of ['16:9', '9:16', '1:1'] as const) {
  for (const side of [641, 853, 1000]) {
    const { width, height } = stageSizeFor(aspect, side)
    assert.ok(width % 2 === 0 && height % 2 === 0, `${aspect} ${side} even`)
  }
}
assert.equal(frameCount(30, 30), 900)
assert.equal(frameCount(0, 30), 0)
assert.equal(frameCount(1.01, 30), 31)
assert.equal(frameTimeSec(45, 30), 1.5)

// t-030: a clip is drawn cover-cropped with no pan or zoom (ffmpeg's
// scale+crop): a wide source loses its sides, a tall one its top and bottom.
assert.deepEqual(coverRect(1920, 1080, 1280, 720), {
  x: 0,
  y: 0,
  width: 1920,
  height: 1080,
})
assert.deepEqual(coverRect(1000, 1000, 1280, 720), {
  x: 0,
  y: 218.75,
  width: 1000,
  height: 562.5,
})
assert.deepEqual(coverRect(2000, 1000, 720, 720), {
  x: 500,
  y: 0,
  width: 1000,
  height: 1000,
})

console.log('music-video compositor contract: ok')
