// /utils/scripts/verifyMusicVideoMotion.test.ts
//
// Contract test for music-video/t-009 (utils/musicVideoMotion.ts). Pure only.
//
// What earns its keep: the Ken Burns preset names are the contract with
// Conductor's headless ffmpeg pipeline (scripts/build_music_video.py, whose
// KEN_BURNS_PRESETS must match), planned scenes always carry one, a clip
// request is private mp4 with the scene still as its first frame, and a doc
// round-trip keeps every motion field the clip flow writes.
import assert from 'node:assert/strict'

import {
  emptyMusicVideoDoc,
  normalizeMusicVideoDoc,
  type MusicVideoScene,
} from '../musicVideoDoc.js'
import {
  MUSIC_VIDEO_KEN_BURNS_PRESETS,
  buildSceneClipRequest,
  clipFrameSize,
  clipRuntimeHint,
  defaultKenBurnsPreset,
  isKenBurnsPreset,
  resolveClipPreset,
  sceneKenBurnsPreset,
  withDefaultKenBurnsPresets,
  sceneLastFrameImageId,
} from '../musicVideoMotion.js'
import { planScenes } from '../musicVideoScenes.js'

const doc = normalizeMusicVideoDoc({
  ...emptyMusicVideoDoc({
    pitch: 'Kind Robots tend a rooftop garden',
    settings: {
      durationSec: 30,
      bpm: 120,
      styleBible: 'thick ink outlines, flat cel colour',
    },
  }),
  lyrics: { sections: [] },
}).doc

{
  assert.deepEqual(
    [...MUSIC_VIDEO_KEN_BURNS_PRESETS],
    ['zoom-in', 'pan-right', 'zoom-out', 'pan-left'],
    'these names are shared with conductor scripts/build_music_video.py',
  )
  assert.equal(defaultKenBurnsPreset(0), 'zoom-in')
  assert.equal(defaultKenBurnsPreset(5), 'pan-right')
  assert.equal(defaultKenBurnsPreset(-1), 'pan-left')
  assert.ok(isKenBurnsPreset('zoom-out'))
  assert.ok(!isKenBurnsPreset('spin'))
  assert.equal(
    sceneKenBurnsPreset({ motion: { kind: 'kenburns', preset: 'spin' } }, 2),
    'zoom-out',
  )
}
console.log(
  '✅ Ken Burns presets cycle by position and unknown names fall back',
)

{
  const planned = withDefaultKenBurnsPresets(planScenes(doc))
  assert.ok(planned.length > 2)
  planned.forEach((scene, index) => {
    assert.equal(scene.motion.preset, defaultKenBurnsPreset(index))
  })
  const { errors, doc: stored } = normalizeMusicVideoDoc({
    ...doc,
    scenes: planned,
  })
  assert.deepEqual(errors, [])
  assert.equal(stored.scenes[1]?.motion.preset, 'pan-right')

  const clipScene = {
    ...planned[0],
    motion: { kind: 'clip', jobId: 41 },
  } as MusicVideoScene
  const kept = withDefaultKenBurnsPresets([clipScene])
  assert.equal(kept[0]?.motion.preset, undefined, 'clip scenes are left alone')
}
console.log('✅ planned scenes carry a preset, and the doc keeps it')

{
  const roundTrip = normalizeMusicVideoDoc({
    ...doc,
    scenes: [
      {
        ...planScenes(doc)[0],
        image: { source: 'generated', artImageId: 7, jobId: 3 },
        motion: {
          kind: 'clip',
          preset: 'zoom-out',
          jobId: 99,
          clipArtImageId: 123,
        },
      },
    ],
  })
  assert.deepEqual(roundTrip.errors, [])
  assert.deepEqual(roundTrip.doc.scenes[0]?.motion, {
    kind: 'clip',
    preset: 'zoom-out',
    jobId: 99,
    clipArtImageId: 123,
  })
}
console.log(
  '✅ a doc round-trip keeps clip job, clip image and fallback preset',
)

{
  const scene: MusicVideoScene = {
    ...planScenes(doc)[0]!,
    prompt: 'A brass robot watering tomatoes at dusk',
    image: { source: 'generated', artImageId: 7 },
  }
  const request = buildSceneClipRequest(scene, doc, {
    firstImageBase64: ' data:image/webp;base64,AAAA ',
    projectSlug: 'music-video',
  })
  assert.equal(request.engine, 'ltx')
  assert.equal(request.presetId, 'ltx-12gb-balanced')
  assert.equal(request.outputFormat, 'mp4')
  assert.equal(request.loop, false)
  assert.equal(request.isPublic, false)
  assert.equal(request.firstImageBase64, 'data:image/webp;base64,AAAA')
  assert.equal(
    request.promptString,
    'A brass robot watering tomatoes at dusk, thick ink outlines, flat cel colour',
  )
  assert.ok(request.timeoutSeconds <= 5_400)
  assert.ok(request.durationSeconds >= 3 && request.durationSeconds <= 4)

  const wan = buildSceneClipRequest(scene, doc, {
    firstImageBase64: 'AAAA',
    projectSlug: 'music-video',
    presetId: 'wan-startup-webp',
  })
  assert.equal(wan.engine, 'wan')
  assert.equal(wan.outputFormat, 'mp4')

  assert.throws(() => resolveClipPreset('nope'), /Unknown video preset/)
  assert.throws(
    () =>
      buildSceneClipRequest({ ...scene, image: { source: 'generated' } }, doc, {
        firstImageBase64: 'AAAA',
        projectSlug: 'music-video',
      }),
    /finished still/,
  )
  assert.throws(
    () =>
      buildSceneClipRequest({ ...scene, prompt: ' ' }, doc, {
        firstImageBase64: 'AAAA',
        projectSlug: 'music-video',
      }),
    /no prompt/,
  )
  assert.throws(
    () =>
      buildSceneClipRequest(scene, doc, {
        firstImageBase64: '',
        projectSlug: 'music-video',
      }),
    /no image data/,
  )
  assert.ok(clipRuntimeHint(resolveClipPreset()).includes('12 GB'))
}
console.log(
  '✅ clip requests are private mp4 from the scene still, and refuse early',
)

{
  const balanced = resolveClipPreset()
  assert.deepEqual(clipFrameSize(balanced, '16:9'), {
    width: balanced.width,
    height: balanced.height,
  })
  const portrait = clipFrameSize(balanced, '9:16')
  const square = clipFrameSize(balanced, '1:1')
  for (const frame of [portrait, square]) {
    assert.equal(frame.width % 32, 0)
    assert.equal(frame.height % 32, 0)
    const area = frame.width * frame.height
    const budget = balanced.width * balanced.height
    assert.ok(Math.abs(area - budget) / budget < 0.08, 'same pixel budget')
  }
  assert.ok(portrait.height > portrait.width)
  assert.equal(square.width, square.height)
  const squarePreset = { width: 768, height: 768 }
  const wide = clipFrameSize(squarePreset, '16:9')
  assert.ok(wide.width > wide.height)

  const portraitDoc = normalizeMusicVideoDoc({
    ...doc,
    settings: { ...doc.settings, aspect: '9:16' },
  }).doc
  const scene: MusicVideoScene = {
    ...planScenes(portraitDoc)[0]!,
    prompt: '',
    motionPrompt: 'the camera pushes in as the koala lowers his hat',
    image: { source: 'gallery', artImageId: 11 },
    motion: { kind: 'clip', lastFrame: 'next-scene' },
  }
  const request = buildSceneClipRequest(scene, portraitDoc, {
    firstImageBase64: 'AAAA',
    lastImageBase64: ' BBBB ',
    projectSlug: 'comic-film',
  })
  assert.equal(request.imageFit, 'crop')
  assert.deepEqual(
    { width: request.width, height: request.height },
    clipFrameSize(balanced, '9:16'),
  )
  assert.equal(request.secondImageBase64, 'BBBB')
  assert.ok(request.promptString.startsWith('the camera pushes in'))
  assert.equal(request.projectSlug, 'comic-film')
  const noLast = buildSceneClipRequest(scene, portraitDoc, {
    firstImageBase64: 'AAAA',
    projectSlug: 'music-video',
  })
  assert.equal('secondImageBase64' in noLast, false)

  const roundTrip = normalizeMusicVideoDoc({
    ...portraitDoc,
    scenes: [scene],
  })
  assert.deepEqual(roundTrip.errors, [])
  assert.equal(
    roundTrip.doc.scenes[0]?.motionPrompt,
    'the camera pushes in as the koala lowers his hat',
  )
  assert.equal(roundTrip.doc.scenes[0]?.motion.lastFrame, 'next-scene')
  const junk = normalizeMusicVideoDoc({
    ...portraitDoc,
    scenes: [{ ...scene, motion: { kind: 'clip', lastFrame: 'previous' } }],
  })
  assert.equal(junk.doc.scenes[0]?.motion.lastFrame, undefined)

  // An end keyframe made for the shot wins over next-scene, and survives a save.
  const next = { image: { source: 'gallery' as const, artImageId: 22 } }
  assert.equal(
    sceneLastFrameImageId(scene, next),
    22,
    'next-scene uses the next still',
  )
  const keyed = { ...scene, motion: { ...scene.motion, lastFrameImageId: 33 } }
  assert.equal(sceneLastFrameImageId(keyed, next), 33, 'an end keyframe wins')
  assert.equal(
    sceneLastFrameImageId({ motion: { kind: 'clip' } }, next),
    null,
    'no end frame unless asked',
  )
  const keyedTrip = normalizeMusicVideoDoc({ ...portraitDoc, scenes: [keyed] })
  assert.equal(keyedTrip.doc.scenes[0]?.motion.lastFrameImageId, 33)
  const badKey = normalizeMusicVideoDoc({
    ...portraitDoc,
    scenes: [{ ...scene, motion: { kind: 'clip', lastFrameImageId: -4 } }],
  })
  assert.equal(badKey.doc.scenes[0]?.motion.lastFrameImageId, undefined)
}
console.log(
  '✅ clips crop to the video aspect at the preset budget, take a motion prompt and an optional last frame',
)

console.log('✅ verifyMusicVideoMotion: all assertions passed')
