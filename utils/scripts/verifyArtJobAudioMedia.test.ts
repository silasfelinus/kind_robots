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
import {
  artJobClaimableBy,
  isAudioArtJobPayload,
  isFastRestyleArtJobPayload,
  isGrabBagRestyleArtJobPayload,
  isVideoRestyleArtJobPayload,
} from '../artJobMedia.js'

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

assert.equal(isVideoRestyleArtJobPayload({ media: 'video-restyle-vace' }), true)
assert.equal(isVideoRestyleArtJobPayload({ media: 'video' }), false)
assert.equal(
  artJobClaimableBy(
    { media: 'video-restyle-vace', workflow: { fake: 'image-workflow' } },
    { supportsInputImages: true, supportsAudio: true },
  ),
  false,
)

assert.equal(
  artJobClaimableBy(
    { media: 'video-restyle-vace' },
    {
      supportsInputImages: true,
      supportsAudio: true,
      supportsVideoRestyle: true,
    },
  ),
  true,
)
assert.equal(
  artJobClaimableBy(
    { media: 'video-restyle-vace' },
    {
      supportsInputImages: true,
      supportsAudio: true,
      supportsVideoRestyle: false,
    },
  ),
  false,
)

{
  const vace = { media: 'video-restyle-vace', videoRestyle: { phase: 'pilot' } }
  const grabBag = {
    media: 'video-restyle-vace',
    videoRestyle: {
      phase: 'pilot',
      styleSchedule: [{ index: 0, styleId: 'noir' }],
      stylePrompts: { noir: 'Expressionist animated noir' },
    },
  }
  const relay = { supportsInputImages: true, supportsAudio: true }
  assert.equal(isGrabBagRestyleArtJobPayload(grabBag), true)
  assert.equal(isGrabBagRestyleArtJobPayload(JSON.stringify(grabBag)), true)
  assert.equal(isGrabBagRestyleArtJobPayload(vace), false)
  assert.equal(
    artJobClaimableBy(vace, { ...relay, supportsVideoRestyle: true }),
    true,
  )
  assert.equal(
    artJobClaimableBy(grabBag, { ...relay, supportsVideoRestyle: true }),
    false,
    'a relay without per-window looks must never render a Grab bag in one style',
  )
  assert.equal(
    artJobClaimableBy(grabBag, {
      ...relay,
      supportsVideoRestyle: true,
      supportsVideoRestyleGrabBag: true,
    }),
    true,
  )
  assert.equal(
    artJobClaimableBy(grabBag, { ...relay, supportsVideoRestyleGrabBag: true }),
    false,
  )
}
console.log('✅ Grab bag VACE jobs need a per-window-look relay')

{
  const standard = {
    media: 'video-restyle-vace',
    videoRestyle: { phase: 'full' },
  }
  const fast = {
    media: 'video-restyle-vace',
    videoRestyle: { phase: 'full', renderSpeed: 'fast' },
  }
  const relay = {
    supportsInputImages: true,
    supportsAudio: true,
    supportsVideoRestyle: true,
    supportsVideoRestyleGrabBag: true,
  }
  assert.equal(isFastRestyleArtJobPayload(fast), true)
  assert.equal(isFastRestyleArtJobPayload(JSON.stringify(fast)), true)
  assert.equal(isFastRestyleArtJobPayload(standard), false)
  assert.equal(
    isFastRestyleArtJobPayload({
      media: 'image',
      videoRestyle: { renderSpeed: 'fast' },
    }),
    false,
  )
  assert.equal(artJobClaimableBy(standard, relay), true)
  assert.equal(
    artJobClaimableBy(fast, relay),
    false,
    'a relay without the CausVid LoRA must never claim a Fast draft',
  )
  assert.equal(
    artJobClaimableBy(fast, { ...relay, supportsVideoRestyleFast: true }),
    true,
  )
  assert.equal(
    artJobClaimableBy(fast, {
      ...relay,
      supportsVideoRestyle: false,
      supportsVideoRestyleFast: true,
    }),
    false,
  )
}
console.log('✅ Fast draft VACE jobs need a relay with the CausVid LoRA')
