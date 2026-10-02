// /utils/scripts/verifyArtJobAudioMedia.test.ts
//
// Contract test for music-video/t-020: songs ride the ArtImage/ArtJob path.
// Pure functions only -- no prisma, no database, no Nuxt/H3 runtime.
//
// The assertions that earn their keep: an audio job is never claimable by a relay
// that cannot handle audio (it would store the song as a png), ogg is audio rather
// than video, and nothing about images or video changes for existing jobs.
import assert from 'node:assert/strict'

import { isAudioType, resolveArtImageSource } from '../artImageSource.js'
import { artJobClaimableBy, isAudioArtJobPayload } from '../artJobMedia.js'

const B64 = 'A'.repeat(64)

{
  const mp3 = resolveArtImageSource({ imageData: B64, fileType: 'mp3' })
  assert.equal(mp3.kind, 'audio')
  assert.ok(mp3.src.startsWith('data:audio/mpeg;base64,'))

  const ogg = resolveArtImageSource({ imageData: B64, fileType: 'ogg' })
  assert.equal(ogg.kind, 'audio')
  assert.ok(ogg.src.startsWith('data:audio/ogg;base64,'))

  assert.equal(
    resolveArtImageSource({ imageData: B64, fileType: 'flac' }).kind,
    'audio',
  )
  assert.equal(
    resolveArtImageSource({ imageData: B64, fileType: 'wav' }).kind,
    'audio',
  )
  assert.equal(
    resolveArtImageSource({ imageData: 'data:audio/mpeg;base64,' + B64 }).kind,
    'audio',
  )
  assert.equal(
    resolveArtImageSource({ imagePath: '/media/song.mp3' }).kind,
    'audio',
  )
  assert.equal(
    resolveArtImageSource({ imagePath: '/media/song.mp3', fileType: 'mp3' })
      .src,
    '/media/song.mp3',
  )
}
console.log(
  '✅ mp3, ogg, flac, wav, data:audio URLs and .mp3 paths resolve as audio',
)

{
  assert.equal(
    resolveArtImageSource({ imageData: B64, fileType: 'mp4' }).kind,
    'video',
  )
  assert.equal(
    resolveArtImageSource({ imageData: B64, fileType: 'webm' }).kind,
    'video',
  )
  assert.equal(
    resolveArtImageSource({ imageData: B64, fileType: 'webp' }).kind,
    'image',
  )
  assert.equal(resolveArtImageSource({ imageData: B64 }).kind, 'image')
  assert.equal(
    resolveArtImageSource({ imagePath: '/media/clip.mp4' }).kind,
    'video',
  )
  assert.equal(
    resolveArtImageSource({ imagePath: '/media/still.webp' }).kind,
    'image',
  )
  assert.equal(resolveArtImageSource(null).kind, 'none')
}
console.log('✅ images and video resolve exactly as before')

{
  assert.ok(
    isAudioType('mp3') &&
      isAudioType('audio/mpeg') &&
      isAudioType(null, 'a.flac'),
  )
  assert.ok(
    !isAudioType('mp4') && !isAudioType('png') && !isAudioType(null, 'a.webp'),
  )
  assert.ok(!isAudioType('webp', 'mislabelled.mp3'))
}
console.log(
  '✅ isAudioType trusts an explicit fileType over the path extension',
)

{
  assert.ok(isAudioArtJobPayload({ media: 'audio' }))
  assert.ok(isAudioArtJobPayload(JSON.stringify({ media: ' Audio ' })))
  assert.ok(!isAudioArtJobPayload({ media: 'video' }))
  assert.ok(!isAudioArtJobPayload({}))
  assert.ok(!isAudioArtJobPayload('{not json'))
  assert.ok(!isAudioArtJobPayload(null))
}
console.log('✅ audio jobs are recognised from object or JSON-string payloads')

{
  const none = { supportsInputImages: false, supportsAudio: false }
  const images = { supportsInputImages: true, supportsAudio: false }
  const all = { supportsInputImages: true, supportsAudio: true }

  assert.ok(artJobClaimableBy({ prompt: 'x' }, none))
  assert.ok(artJobClaimableBy({ media: 'video' }, none))
  assert.ok(!artJobClaimableBy({ images: ['a'] }, none))
  assert.ok(artJobClaimableBy({ images: ['a'] }, images))

  assert.ok(!artJobClaimableBy({ media: 'audio' }, images))
  assert.ok(!artJobClaimableBy(JSON.stringify({ media: 'audio' }), images))
  assert.ok(artJobClaimableBy({ media: 'audio' }, all))
  assert.ok(
    !artJobClaimableBy(
      { media: 'audio', images: ['a'] },
      { supportsInputImages: false, supportsAudio: true },
    ),
  )
}
console.log(
  '✅ only an audio-capable relay may claim an audio job; image gating is unchanged',
)

console.log('✅ verifyArtJobAudioMedia: all assertions passed')
