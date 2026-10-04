// /utils/scripts/verifyMusicVideoAudioUpload.test.ts
//
// Contract test for music-video/t-013 (utils/musicVideoAudioUpload.ts). Pure only.
//
// The song is stored base64-encoded in an ArtImage row, so the cap matters
// (its own default, the same env override and hard ceiling as the final
// video). Only real MP3 or WAV bytes are accepted, whatever the browser
// claims. A client-measured length or tempo outside the doc's limits is
// dropped rather than trusted, and the video length follows the song.
import assert from 'node:assert/strict'

import {
  MUSIC_VIDEO_DEFAULT_MAX_AUDIO_MB,
  checkSongUpload,
  cleanSongNumber,
  looksLikeMp3,
  looksLikeWav,
  musicVideoMaxAudioBytes,
  songUploadFileName,
  videoDurationForSong,
} from '../musicVideoAudioUpload.js'
import {
  MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB,
  MUSIC_VIDEO_HARD_MAX_UPLOAD_MB,
  musicVideoMaxUploadBytes,
} from '../musicVideoFinal.js'

const MB = 1024 * 1024

function id3Mp3(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([0x49, 0x44, 0x33, 0x04, 0x00])
  return bytes
}
function rawMp3(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set([0xff, 0xfb, 0x90, 0x64])
  return bytes
}
function wav(size = 64): Uint8Array {
  const bytes = new Uint8Array(size)
  bytes.set(
    [...'RIFF'].map((c) => c.charCodeAt(0)),
    0,
  )
  bytes.set(
    [...'WAVE'].map((c) => c.charCodeAt(0)),
    8,
  )
  return bytes
}

{
  assert.equal(
    musicVideoMaxAudioBytes(undefined),
    MUSIC_VIDEO_DEFAULT_MAX_AUDIO_MB * MB,
  )
  assert.equal(musicVideoMaxAudioBytes('12'), 12 * MB)
  assert.equal(
    musicVideoMaxAudioBytes('9999'),
    MUSIC_VIDEO_HARD_MAX_UPLOAD_MB * MB,
  )
  assert.equal(
    musicVideoMaxUploadBytes(undefined),
    MUSIC_VIDEO_DEFAULT_MAX_UPLOAD_MB * MB,
    'the final-video cap keeps its own default',
  )
}
console.log('✅ the song cap has its own default and shares the override rules')

{
  assert.ok(looksLikeMp3(id3Mp3()))
  assert.ok(looksLikeMp3(rawMp3()))
  assert.ok(!looksLikeMp3(wav()))
  assert.ok(looksLikeWav(wav()))
  assert.ok(!looksLikeWav(id3Mp3()))

  const max = 1 * MB
  assert.deepEqual(
    checkSongUpload({ bytes: id3Mp3(), mimeType: 'audio/mpeg', maxBytes: max }),
    {
      ok: true,
      fileType: 'mp3',
    },
  )
  assert.deepEqual(
    checkSongUpload({ bytes: wav(), mimeType: 'audio/x-wav', maxBytes: max }),
    {
      ok: true,
      fileType: 'wav',
    },
  )
  const empty = checkSongUpload({
    bytes: new Uint8Array(),
    mimeType: 'audio/mpeg',
    maxBytes: max,
  })
  assert.equal(empty.ok === false && empty.statusCode, 400)
  const big = checkSongUpload({
    bytes: id3Mp3(2 * MB),
    mimeType: 'audio/mpeg',
    maxBytes: max,
  })
  assert.equal(big.ok === false && big.statusCode, 413)
  const lying = checkSongUpload({
    bytes: wav(),
    mimeType: 'audio/mpeg',
    maxBytes: max,
  })
  assert.equal(
    lying.ok === false && lying.statusCode,
    415,
    'a WAV labelled MP3 is refused',
  )
  const png = checkSongUpload({
    bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]),
    mimeType: 'audio/mpeg',
    maxBytes: max,
  })
  assert.equal(png.ok === false && png.statusCode, 415)
  const flac = checkSongUpload({
    bytes: id3Mp3(),
    mimeType: 'audio/flac',
    maxBytes: max,
  })
  assert.equal(flac.ok === false && flac.statusCode, 415)
}
console.log('✅ only real MP3 or WAV bytes with a matching type are accepted')

{
  assert.equal(cleanSongNumber('93.4567', 'durationSec'), 93.457)
  assert.equal(cleanSongNumber('0', 'durationSec'), null)
  assert.equal(cleanSongNumber('601', 'durationSec'), null)
  assert.equal(cleanSongNumber('NaN', 'durationSec'), null)
  assert.equal(cleanSongNumber('120', 'bpm'), 120)
  assert.equal(cleanSongNumber('20', 'bpm'), null)
  assert.equal(videoDurationForSong(93.2), 94)
  assert.equal(
    videoDurationForSong(4),
    10,
    'a video is never shorter than the doc minimum',
  )
  assert.equal(videoDurationForSong(900), 600)
}
console.log(
  '✅ measured length and tempo stay inside the doc limits; the video follows the song',
)

{
  assert.equal(
    songUploadFileName(7, 'Zuzu: Koala Assassin!', 'mp3'),
    'music-video-7-zuzu-koala-assassin-song.mp3',
  )
  assert.equal(
    songUploadFileName(7, '???', 'wav'),
    'music-video-7-music-video-song.wav',
  )
}
console.log('✅ song file names are stable and safe')
