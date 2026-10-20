// /utils/scripts/verifyArtImageUploadLimit.test.ts
//
// save-generated refuses a file the ArtImage row cannot hold (ArtJob 40972,
// 2026-10-20: a 1280×720 animated WebP failed its INSERT three times).
import assert from 'node:assert/strict'
import {
  base64DecodedBytes,
  oversizeUpload,
  oversizeUploadMessage,
} from '../artImageUploadLimit'
import { musicVideoPacketCapBytes } from '../musicVideoFinal'
import {
  VIDEO_PRESETS,
  generatorOutputFormat,
  getVideoPreset,
} from '../videoPresets'

const MB = 1024 * 1024
const PACKET = 16 * MB
const CAP = musicVideoPacketCapBytes(PACKET)!

function base64Of(bytes: number): string {
  return Buffer.alloc(bytes, 7).toString('base64')
}

{
  for (const bytes of [0, 1, 2, 3, 4, 5, 1000]) {
    assert.equal(base64DecodedBytes(base64Of(bytes)), bytes, `${bytes} bytes`)
  }
  assert.equal(
    base64DecodedBytes(`data:image/webp;base64,${base64Of(10)}`),
    10,
    'a data: URL prefix is not counted',
  )
}

{
  assert.equal(
    oversizeUpload(base64Of(CAP), PACKET),
    null,
    'exactly the cap fits',
  )
  const over = oversizeUpload(base64Of(CAP + 1), PACKET)
  assert.deepEqual(over, { bytes: CAP + 1, capBytes: CAP })
  assert.equal(
    oversizeUpload(base64Of(CAP + 1), BigInt(PACKET))?.capBytes,
    CAP,
    'MySQL may return a bigint',
  )
  assert.equal(
    oversizeUpload(base64Of(64 * MB), null),
    null,
    'an unknown packet leaves the decision to the database',
  )
  const message = oversizeUploadMessage(
    { bytes: 15 * MB, capBytes: CAP },
    'webp',
  )
  assert.match(message, /WEBP file is 15\.0 MB/)
  assert.match(message, /at most 11\.8 MB/)
  assert.match(message, /MP4/)
}

{
  // The generator starts Balanced on MP4 and leaves every other preset alone;
  // the shared preset keeps WebP for the scene animator's batch keys.
  const balanced = getVideoPreset('ltx-12gb-balanced')!
  assert.equal(balanced.outputFormat, 'webp')
  assert.equal(generatorOutputFormat(balanced), 'mp4')
  for (const preset of VIDEO_PRESETS) {
    if (preset.id === 'ltx-12gb-balanced') continue
    assert.equal(generatorOutputFormat(preset), preset.outputFormat, preset.id)
  }
}

console.log(
  '✅ oversize generated uploads are refused with their size and the cap',
)
