import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import {
  RAINBOW_ENEMY_ATLASES,
  RAINBOW_HIT_CARD_FRAMES,
  RAINBOW_PILOT_POSES,
  rainbowPosePath,
  RAINBOW_INTERLUDES,
  drawRainbowInterlude,
  rainbowAtlasCell,
  rainbowEnemyAtlasPath,
  rainbowInterludePath,
} from '../arcade/games/rainbowAnimation'
import {
  RAINBOW_IDLE_ATLASES,
  RAINBOW_STAGE_STRIPS,
  rainbowIdleAtlasKey,
  rainbowIdleCell,
  setRainbowAnimationClock,
  setRainbowLook,
} from '../arcade/games/rainbowGameArt'

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
const made: Array<{ loop?: boolean; currentTime: number; plays: number }> = []
const g = {
  drawImage: (...args: unknown[]) => drawn.push(args),
} as unknown as CanvasRenderingContext2D
;(globalThis as { document?: unknown }).document = {
  createElement: () => {
    const video = {
      plays: 0,
      currentTime: 0,
      play() {
        video.plays++
        return Promise.resolve()
      },
      readyState: 4,
      videoWidth: 832,
      videoHeight: 480,
    }
    made.push(video)
    return video
  },
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
// P-02: the clips are one-shot (the squadron crosses once), and each splash starts its clip over.
assert.equal(made[0]!.loop, false, 'the interlude plays once')
made[0]!.currentTime = 2.5
drawRainbowInterlude(g, stage, 0, 0, 200, false, 40)
assert.equal(made[0]!.currentTime, 2.5, 'mid-splash the clip keeps playing')
const plays = made[0]!.plays
drawRainbowInterlude(g, stage, 0, 0, 200, false, 0)
assert.equal(made[0]!.currentTime, 0, 'a new splash starts the clip over')
assert.equal(made[0]!.plays, plays + 1)
// Every Act's card has its living interlude (S04 joined 2026-11-24 PT from its logo-free card).
assert.deepEqual([...RAINBOW_INTERLUDES].sort(), [...RAINBOW_STAGE_STRIPS])

// Enemy idle atlases (t-030): each ships as a small webp whose width is exactly `frames` cells of the still's
// longer side, and plays its cells in order (calm motion holds the first).
for (const [kind, atlas] of Object.entries(RAINBOW_ENEMY_ATLASES)) {
  const file = new URL(
    `../../public/rainbow-princess-art/doodle/${rainbowEnemyAtlasPath(kind)}.webp`,
    import.meta.url,
  )
  const bytes = readFileSync(file)
  assert.equal(
    bytes.subarray(8, 12).toString('latin1'),
    'WEBP',
    `${kind} atlas is a webp`,
  )
  assert.ok(bytes.length / 1024 < 160, `${kind} atlas stays small`)
  assert.equal(atlas.frames, 8)
  const cells = Array.from({ length: 2 * atlas.frames }, (_, i) =>
    rainbowAtlasCell(kind, Math.round((i * 60) / atlas.fps), false),
  )
  assert.deepEqual(
    cells,
    [...Array(atlas.frames).keys(), ...Array(atlas.frames).keys()],
    `${kind} plays its cells in order and loops`,
  )
  assert.equal(
    rainbowAtlasCell(kind, 999, true),
    0,
    'calm motion holds the first cell',
  )
}
assert.ok(Object.keys(RAINBOW_ENEMY_ATLASES).length >= 2)

// Pilot poses (t-030): every listed pose ships as a small square head-and-shoulders webp, every pilot has her
// victory pose, and the engine flashes the hit pose over a ship that loses a life.
for (const [pilot, poses] of Object.entries(RAINBOW_PILOT_POSES)) {
  assert.ok(poses.includes('victory'), `${pilot} has a victory pose`)
  assert.ok(poses.includes('hit'), `${pilot} has a hit pose`)
  for (const pose of poses) {
    const bytes = readFileSync(
      new URL(
        `../../public/rainbow-princess-art/${rainbowPosePath(pilot, pose)}.webp`,
        import.meta.url,
      ),
    )
    assert.equal(bytes.subarray(8, 12).toString('latin1'), 'WEBP')
    assert.ok(bytes.length / 1024 < 40, `${pilot} ${pose} stays small`)
    // VP8 (lossy) frame header: width and height live at bytes 26-29.
    assert.equal(bytes.subarray(12, 16).toString('latin1'), 'VP8 ')
    const width = bytes.readUInt16LE(26) & 0x3fff
    const height = bytes.readUInt16LE(28) & 0x3fff
    assert.equal(width, height, `${pilot} ${pose} is square`)
  }
}
assert.deepEqual(Object.keys(RAINBOW_PILOT_POSES).sort(), [
  'azure',
  'maribel',
  'solenne',
  'vivi',
])
assert.ok(RAINBOW_HIT_CARD_FRAMES > 0 && RAINBOW_HIT_CARD_FRAMES <= 60)
const engineSource = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
assert.match(
  engineSource,
  /hitCards\[ships\.indexOf\(ship\)\] = RAINBOW_HIT_CARD_FRAMES/,
  'losing a life raises the hit card',
)
assert.match(engineSource, /drawRainbowPose\(g, pilotName, 'hit'/)

// P-01: every Fever Dream sprite (guardians, ships, bosses, pickups, hazards) plays its reviewed idle atlas through
// one engine clock; calm motion holds the first cell, and a sprite without an atlas keeps its still.
setRainbowAnimationClock(0, false)
assert.deepEqual(
  [0, 15, 30, 45, 120].map((tick) => rainbowIdleCell(8, tick)),
  [0, 1, 2, 3, 0],
  'four frames a second, looping over eight cells',
)
setRainbowAnimationClock(999, true)
assert.equal(rainbowIdleCell(8, 999), 0, 'calm motion holds the first cell')
setRainbowAnimationClock(0, false)
assert.equal(
  rainbowIdleAtlasKey('/rainbow-princess-art/enemies/angler.webp'),
  null,
  'Classic sprites never animate',
)
for (const [key, frames] of Object.entries(RAINBOW_IDLE_ATLASES)) {
  assert.ok(frames >= 4 && frames <= 12, `${key} has a sensible frame count`)
  assert.equal(
    rainbowIdleAtlasKey(`/rainbow-princess-art/doodle/${key}.webp`),
    key,
  )
  const bytes = readFileSync(
    new URL(
      `../../public/rainbow-princess-art/doodle/anim/${key.split('/')[1]}-idle.webp`,
      import.meta.url,
    ),
  )
  assert.equal(bytes.subarray(8, 12).toString('latin1'), 'WEBP')
  assert.ok(bytes.length / 1024 < 200, `${key} atlas stays small`)
}
const engineClock = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)
assert.match(engineClock, /setRainbowAnimationClock\(tick, calm\)/)

console.log(
  `rainbow animation: ok (interludes ${RAINBOW_INTERLUDES.join(', ')}; idle atlases ${Object.keys(RAINBOW_ENEMY_ATLASES).join(', ')}; poses ${Object.values(RAINBOW_PILOT_POSES).flat().length})`,
)
