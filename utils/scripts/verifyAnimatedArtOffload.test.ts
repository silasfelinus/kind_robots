// /utils/scripts/verifyAnimatedArtOffload.test.ts
//
// The offload must never flatten an animation into a still.
//
// WHAT WENT WRONG WITHOUT THIS. Scene Animator's first render (2026-09-11) came
// back as a motionless image. ComfyUI had animated it correctly -- the WAN TI2V
// graph sampled 41 frames and SaveAnimatedWEBP wrote a real multi-frame WebP.
// The frames were destroyed afterwards, inside Kind Robots:
//
//   1. buildVideoOutputNodes() saves every 'webp' video preset -- including
//      wan-startup-webp, the default for engine 'wan' and therefore for every
//      Scene Animator job -- through SaveAnimatedWEBP.
//   2. The relay stamps the resulting ArtImage `fileType: 'webp'`.
//   3. offloadArtImageBytes() classified clips by extension against a
//      VIDEO_TYPES set of mp4/webm/mov/mkv. 'webp' is not in it, so an animated
//      clip was treated as a still and re-encoded.
//   4. `sharp(buffer)` defaults to `pages: 1`. It decodes frame 0 and silently
//      discards the rest -- no error, no warning, a much smaller file.
//   5. The offload then wrote that single frame to the share and nulled
//      imageData, which was the only remaining animated copy.
//
// Step 4 is the part worth pinning with real bytes rather than a source regex:
// it is library behaviour, it is silent, and the whole bug rests on it. These
// assertions build a genuine 8-frame animated WebP, prove the naive re-encode
// still flattens it, and prove resolveOffloadEncoding() no longer takes that
// path -- while a true still is still transcoded, which is the reason the
// re-encode exists at all.
//
//   npx tsx utils/scripts/verifyAnimatedArtOffload.test.ts
import assert from 'node:assert/strict'
import sharp from 'sharp'

import { resolveOffloadEncoding } from '../../server/utils/artImageOffload.js'

const WIDTH = 64
const HEIGHT = 64
const FRAMES = 8

/** A real multi-frame WebP, the shape SaveAnimatedWEBP emits. */
async function animatedWebp(): Promise<Buffer> {
  // Each frame is visibly different so the encoder cannot collapse them.
  const frames = await Promise.all(
    Array.from({ length: FRAMES }, (_, frame) =>
      sharp(
        Buffer.from(
          Array.from(
            { length: WIDTH * HEIGHT * 3 },
            (_, pixel) => (pixel + frame * 37) % 256,
          ),
        ),
        { raw: { width: WIDTH, height: HEIGHT, channels: 3 } },
      )
        .png()
        .toBuffer(),
    ),
  )

  return sharp(frames, { join: { animated: true } })
    .webp({ quality: 90 })
    .toBuffer()
}

async function pageCount(buffer: Buffer): Promise<number> {
  const { pages } = await sharp(buffer).metadata()
  return typeof pages === 'number' ? pages : 1
}

async function run(): Promise<void> {
  const animated = await animatedWebp()

  assert.equal(
    await pageCount(animated),
    FRAMES,
    'the fixture itself must be animated, or the rest of this test proves nothing',
  )

  /* -- the library behaviour the bug rested on ------------------------------ */

  const naive = await sharp(animated).webp({ quality: 82 }).toBuffer()
  assert.equal(
    await pageCount(naive),
    1,
    'sharp(buffer).webp() is expected to keep only the first frame. If this ' +
      'ever starts preserving animation the guard below is merely redundant, ' +
      'not wrong -- but do not remove it on that basis alone.',
  )

  /* -- an animated clip survives the offload -------------------------------- */

  const clip = await resolveOffloadEncoding('webp', animated)

  assert.equal(
    clip.keepVerbatim,
    true,
    'an animated webp must be written verbatim, not transcoded',
  )
  assert.equal(clip.extension, 'webp')
  assert.equal(
    await pageCount(clip.bytes),
    FRAMES,
    'the offloaded copy lost frames -- this is the Scene Animator bug: the ' +
      'file written to the share is the only copy, because imageData is ' +
      'nulled immediately afterwards',
  )
  assert.ok(
    clip.bytes.equals(animated),
    'an animated clip must reach the share byte-for-byte',
  )

  /* -- animated GIF too, and it keeps its own extension --------------------- */

  const gif = await sharp(animated, { animated: true }).gif().toBuffer()
  const gifEncoding = await resolveOffloadEncoding('gif', gif)

  assert.equal(gifEncoding.keepVerbatim, true)
  assert.equal(
    gifEncoding.extension,
    'gif',
    'a verbatim gif must not be filed under a .webp name it is not',
  )
  assert.ok(
    (await pageCount(gifEncoding.bytes)) > 1,
    'the offloaded gif lost its animation',
  )

  /* -- a genuine still is still transcoded ---------------------------------- */
  // The whole point of the re-encode is that stills shrink. A fix that stops
  // transcoding everything would trade this bug for the storage growth the
  // offload exists to stop.

  const stillPng = await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: { r: 200, g: 40, b: 90 },
    },
  })
    .png()
    .toBuffer()

  const still = await resolveOffloadEncoding('png', stillPng)
  assert.equal(still.keepVerbatim, false, 'a still png must still be transcoded')
  assert.equal(still.extension, 'webp')

  // A single-frame webp is a still that merely shares a container with clips;
  // it must not be mistaken for one and skipped.
  const singleFrameWebp = await sharp(stillPng).webp().toBuffer()
  const singleFrame = await resolveOffloadEncoding('webp', singleFrameWebp)
  assert.equal(
    singleFrame.keepVerbatim,
    false,
    'a one-frame webp is a still and must take the transcode path',
  )

  /* -- video containers are untouched, as before ---------------------------- */

  const fakeMp4 = Buffer.from('not really an mp4, and sharp must never open it')
  const video = await resolveOffloadEncoding('mp4', fakeMp4)
  assert.equal(video.keepVerbatim, true)
  assert.equal(video.extension, 'mp4')
  assert.ok(video.bytes.equals(fakeMp4))

  console.log(
    '✅ Animated art survives the offload: multi-frame webp/gif written ' +
      'verbatim, stills still transcoded, video containers untouched.',
  )
}

await run()
