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

console.log('✅ verifyMusicVideoFinal: all assertions passed')
