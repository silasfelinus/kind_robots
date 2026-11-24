import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import {
  RAINBOW_INTERLUDES,
  drawRainbowInterlude,
  rainbowInterludePath,
} from '../arcade/games/rainbowAnimation'
import { setRainbowLook } from '../arcade/games/rainbowGameArt'

// Conductor rainbow t-030 (GEN2-STANDARD sections 5-6): the living Act title cards. Every listed interlude ships
// as a small, web-ready H.264 MP4 (moov before mdat so it starts streaming at once), plays only in the Fever Dream
// look it was painted from, and steps aside under calm motion so the still card shows.

const MAX_KB = 400
for (const stage of RAINBOW_INTERLUDES) {
  const file = new URL(
    `../../public${rainbowInterludePath(stage)}`,
    import.meta.url,
  )
  const bytes = readFileSync(file)
  assert.equal(
    bytes.subarray(4, 8).toString('latin1'),
    'ftyp',
    `${stage} is an MP4`,
  )
  const text = bytes.toString('latin1')
  assert.ok(text.includes('avc1'), `${stage} is H.264`)
  const moov = text.indexOf('moov')
  const mdat = text.indexOf('mdat')
  assert.ok(
    moov > 0 && moov < mdat,
    `${stage} is fast-start (moov before mdat)`,
  )
  assert.ok(!text.includes('mp4a'), `${stage} carries no audio track`)
  assert.ok(
    statSync(file).size / 1024 < MAX_KB,
    `${stage} stays under ${MAX_KB} KB`,
  )
}
assert.equal(
  new Set(RAINBOW_INTERLUDES).size,
  RAINBOW_INTERLUDES.length,
  'each Act is listed once',
)

// A stand-in document whose videos are ready at once, so the draw path runs in Node.
const drawn: unknown[] = []
const g = {
  drawImage: (...args: unknown[]) => drawn.push(args),
} as unknown as CanvasRenderingContext2D
;(globalThis as { document?: unknown }).document = {
  createElement: () => ({
    play: () => Promise.resolve(),
    readyState: 4,
    videoWidth: 832,
    videoHeight: 480,
  }),
}
const stage = RAINBOW_INTERLUDES[0]!
setRainbowLook('classic', false)
assert.equal(
  drawRainbowInterlude(g, stage, 0, 0, 200, false),
  0,
  'classic keeps its own card',
)
setRainbowLook('fever', false)
assert.equal(
  drawRainbowInterlude(g, stage, 0, 0, 200, true),
  0,
  'calm motion shows the still',
)
const height = drawRainbowInterlude(g, stage, 0, 0, 200, false)
assert.ok(
  Math.abs(height - (200 * 480) / 832) < 0.01,
  'the interlude keeps its aspect',
)
assert.equal(drawn.length, 1, 'one frame drawn')
assert.equal(
  drawRainbowInterlude(g, 's03', 0, 0, 200, false),
  0,
  'an Act without an interlude draws its still',
)

console.log(
  `rainbow animation: ok (interludes ${RAINBOW_INTERLUDES.join(', ')})`,
)
