// /utils/scripts/verifyMusicVideoFinal.test.ts
//
// Contract test for music-video/t-023 (utils/musicVideoFinal.ts). Pure only.
//
// The upload stores the MP4 base64-encoded in an ArtImage row, so what earns
// its keep is the cap (default, env override, hard ceiling), refusing files
// that only claim to be MP4, and a stable, safe file name.
import assert from 'node:assert/strict'

import {
  MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB,
  MUSIC_VIDEO_HARD_MAX_UPLOAD_MB,
  checkFinalVideoUpload,
  finalVideoFileName,
  looksLikeMp4,
  musicVideoMaxUploadBytes,
  finalVideoBitrates,
  clampUploadToPacket,
  musicVideoPacketCapBytes,
  MUSIC_VIDEO_PACKET_OVERHEAD_BYTES,
} from '../musicVideoFinal.js'

const MB = 1024 * 1024

function mp4Bytes(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([
    0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
  ])
  return bytes
}

{
  assert.equal(
    musicVideoMaxUploadBytes(undefined),
    MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB * MB,
  )
  assert.equal(
    musicVideoMaxUploadBytes(''),
    MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB * MB,
  )
  assert.equal(
    musicVideoMaxUploadBytes('nope'),
    MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB * MB,
  )
  assert.equal(
    musicVideoMaxUploadBytes('-5'),
    MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB * MB,
  )
  assert.equal(musicVideoMaxUploadBytes('48'), 48 * MB)
  assert.equal(
    musicVideoMaxUploadBytes('9999'),
    MUSIC_VIDEO_HARD_MAX_UPLOAD_MB * MB,
  )
}
console.log(
  '✅ the upload cap defaults, accepts an env override, and has a hard ceiling',
)

{
  assert.ok(looksLikeMp4(mp4Bytes()))
  assert.ok(
    !looksLikeMp4(
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]),
    ),
  )
  assert.ok(!looksLikeMp4(new Uint8Array(4)))

  assert.deepEqual(
    checkFinalVideoUpload({
      bytes: mp4Bytes(),
      mimeType: 'video/mp4',
      maxBytes: MB,
    }),
    { ok: true, fileType: 'mp4' },
  )
  const rule = (input: Parameters<typeof checkFinalVideoUpload>[0]) => {
    const result = checkFinalVideoUpload(input)
    return result.ok ? 200 : result.statusCode
  }
  assert.equal(rule({ bytes: null, mimeType: 'video/mp4', maxBytes: MB }), 400)
  assert.equal(
    rule({ bytes: new Uint8Array(0), mimeType: 'video/mp4', maxBytes: MB }),
    400,
  )
  assert.equal(
    rule({ bytes: mp4Bytes(2048), mimeType: 'video/mp4', maxBytes: 1024 }),
    413,
  )
  assert.equal(
    rule({ bytes: mp4Bytes(), mimeType: 'video/webm', maxBytes: MB }),
    415,
  )
  assert.equal(
    rule({ bytes: new Uint8Array(64), mimeType: 'video/mp4', maxBytes: MB }),
    415,
    'a file that only claims video/mp4 is refused',
  )
  assert.equal(
    rule({ bytes: mp4Bytes(), mimeType: 'VIDEO/MP4', maxBytes: MB }),
    200,
  )
}
console.log(
  '✅ only real MP4 under the cap is accepted, with 400/413/415 otherwise',
)

{
  assert.equal(
    finalVideoFileName(12, 'Kind Robots: Saturday Morning!'),
    'music-video-12-kind-robots-saturday-morning.mp4',
  )
  assert.equal(finalVideoFileName(3, '***'), 'music-video-3-music-video.mp4')
  assert.ok(
    finalVideoFileName(1, 'x'.repeat(300)).length <=
      'music-video-1-'.length + 60 + 4,
  )
}
console.log('✅ final video file names are slugged, bounded and never empty')

// Silas, 2026-10-06: "getting errors when exporting the final video that it
// is too large". The browser export budgets its bitrate to the upload cap.
{
  const cap = 24 * 1024 * 1024
  const theme = finalVideoBitrates(75, cap)
  assert.equal(theme.audio, 128_000)
  const bytes = ((theme.video + theme.audio) * 75) / 8
  assert.ok(bytes < cap * 0.9, `75 s fits under 24 MB (${bytes} bytes)`)
  assert.ok(theme.video > 1_500_000, 'still a watchable 720p bitrate')
  const retry = finalVideoBitrates(75, cap, 0.7)
  assert.ok(retry.video < theme.video, 'a retry encodes smaller')
  assert.equal(finalVideoBitrates(5, cap).video, 8_000_000, 'capped high')
  assert.equal(finalVideoBitrates(3600, cap).video, 150_000, 'floored low')
  assert.equal(finalVideoBitrates(3600, cap).audio, 64_000, 'audio steps down')
}
{
  // Silas, 2026-10-07: a 200 s video against production's 16 MB packet was
  // rejected as "larger than 11 MB"; the old 400k + 128k floor alone was 13 MB.
  const cap = musicVideoPacketCapBytes(16 * MB)!
  const skeleton = finalVideoBitrates(200, cap)
  const bytes = ((skeleton.video + skeleton.audio) * 200) / 8
  assert.ok(bytes < cap * 0.9, `200 s fits under the 11.8 MB cap (${bytes})`)
  assert.ok(skeleton.audio < 128_000, 'audio gives way first')
  assert.ok(skeleton.video > 300_000, 'the picture keeps most of the budget')
  const retry = finalVideoBitrates(200, cap, 0.8)
  assert.ok(
    ((retry.video + retry.audio) * 200) / 8 < bytes,
    'a retry still encodes smaller',
  )
}
console.log('✅ the export bitrate keeps the final cut under the upload cap')

{
  // A 16 MB packet holds about 11.8 MB of file once base64 adds its third.
  const packet = 16 * MB
  const cap = musicVideoPacketCapBytes(packet)
  assert.equal(
    cap,
    Math.floor(((packet - MUSIC_VIDEO_PACKET_OVERHEAD_BYTES) * 3) / 4),
  )
  assert.ok(
    Math.ceil((cap! * 4) / 3) + MUSIC_VIDEO_PACKET_OVERHEAD_BYTES <= packet,
  )
  assert.equal(
    musicVideoPacketCapBytes(BigInt(packet)),
    cap,
    'MySQL may return a bigint',
  )
  assert.equal(musicVideoPacketCapBytes(null), null)
  assert.equal(musicVideoPacketCapBytes(0), null)
  assert.equal(
    clampUploadToPacket(24 * MB, packet),
    cap,
    'the packet lowers the default cap',
  )
  assert.equal(
    clampUploadToPacket(5 * MB, packet),
    5 * MB,
    'a smaller configured cap stands',
  )
  assert.equal(
    clampUploadToPacket(24 * MB, null),
    24 * MB,
    'unknown packet leaves the cap',
  )
  // The 2026-10-07 failure: a 13.4 MB MP4 must be refused up front on a 16 MB packet.
  assert.ok(13_462_736 > clampUploadToPacket(24 * MB, packet))
}

console.log('✅ verifyMusicVideoFinal: all assertions passed')
