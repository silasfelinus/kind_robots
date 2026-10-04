// /utils/scripts/verifyMusicVideoScenes.test.ts
//
// Contract test for music-video/t-008 (utils/musicVideoScenes.ts). Pure functions only.
//
// The assertions that earn their keep: an automatic scene plan always passes the
// MusicVideoDoc normalizer (no overlap, nothing past the song), every lyric line lands
// in exactly one scene, and the prompt checker refuses what Krea 2 would paint
// literally -- negations, commissioning jargon, lettering -- plus the first-run
// trailer's franchise names.
import assert from 'node:assert/strict'

import { emptyMusicVideoDoc, normalizeMusicVideoDoc } from '../musicVideoDoc.js'
import {
  buildScenePromptRequest,
  checkScenePrompt,
  composeScenePrompt,
  findBannedTerms,
  kreaFrameSize,
  musicVideoStillBody,
  parseScenePromptResponse,
  planScenes,
} from '../musicVideoScenes.js'
import { DEFAULT_COMIC_LANES, comicPrimaryLane } from '../comicLanes.js'
import {
  chooseKeyframeAttempt,
  keyframeCropLoss,
  normalizeKeyframeAssignments,
} from '../musicVideoKeyframes.js'

function docWithLyrics(durationSec: number, bpm: number) {
  const base = emptyMusicVideoDoc({
    pitch: 'Kind Robots defend a rooftop garden at night',
    settings: {
      durationSec,
      bpm,
      genre: 'synth rock',
      styleBible: 'thick ink outlines, flat cel colour',
    },
  })
  return normalizeMusicVideoDoc({
    ...base,
    timeline: { beatGrid: { bpm, offsetSec: 0, beatsPerBar: 4 }, markers: [] },
    lyrics: {
      sections: [
        { id: 'v1', kind: 'verse', lines: ['a', 'b', 'c', 'd'], locked: false },
        {
          id: 'c1',
          kind: 'chorus',
          lines: ['e', 'f', 'g', 'h'],
          locked: false,
        },
      ],
    },
  }).doc
}

{
  for (const [duration, bpm] of [
    [60, 120],
    [90, 92],
    [30, 180],
    [240, 70],
  ] as const) {
    const doc = docWithLyrics(duration, bpm)
    const scenes = planScenes(doc)
    assert.ok(scenes.length >= 1)
    assert.equal(scenes[0]?.startSec, 0)
    assert.equal(scenes[scenes.length - 1]?.endSec, duration)
    const { errors } = normalizeMusicVideoDoc({ ...doc, scenes })
    assert.deepEqual(
      errors,
      [],
      `plan for ${duration}s at ${bpm} BPM must validate`,
    )
    const refs = scenes.flatMap((scene) =>
      scene.lyricRefs.map((r) => `${r.sectionId}:${r.lineIdx}`),
    )
    assert.equal(refs.length, 8, 'every lyric line lands in exactly one scene')
    assert.equal(new Set(refs).size, 8)
  }
  const minute = planScenes(docWithLyrics(60, 120))
  assert.equal(
    minute.length,
    15,
    '120 BPM in 4/4 is 2 s bars, so 2-bar scenes of 4 s',
  )
  assert.ok(
    minute.every(
      (scene) =>
        scene.image.source === 'generated' && scene.motion.kind === 'kenburns',
    ),
  )
}
console.log(
  '✅ automatic scene plans validate, cover the song, and place every lyric line once',
)

{
  const doc = docWithLyrics(60, 120)
  const scenes = planScenes(doc).slice(0, 2)
  const { system, prompt } = buildScenePromptRequest(doc, scenes)
  assert.ok(system.includes('s1: <prompt>'))
  assert.ok(prompt.includes('Kind Robots defend a rooftop garden at night'))
  assert.ok(prompt.includes('thick ink outlines'))
  // 8 lines over 15 scenes: lines are spread, so the opening scene is instrumental
  assert.ok(prompt.includes('s1 (0.0-4.0s): instrumental passage'))
  assert.ok(prompt.includes('s2 (4.0-8.0s): a'))
}
console.log(
  '✅ the scene prompt request carries the pitch, style bible, timing and lyric per scene',
)

{
  const text = [
    'Here you go:',
    's1: A small brass robot on a rooftop at dusk',
    '**S2** - "A neon water tower glowing over wet tar"',
    's9: unrequested scene',
    's1: duplicate ignored',
    'garbage line',
  ].join('\n')
  const prompts = parseScenePromptResponse(text, ['s1', 's2', 's3'])
  assert.deepEqual(prompts, {
    s1: 'A small brass robot on a rooftop at dusk',
    s2: 'A neon water tower glowing over wet tar',
  })
}
console.log(
  '✅ scene prompt replies parse; unrequested, duplicate and junk lines are ignored',
)

{
  assert.deepEqual(
    checkScenePrompt(
      'A brass robot leaping between rooftops under a green moon',
    ),
    [],
  )
  const rules = (prompt: string) => checkScenePrompt(prompt).map((v) => v.rule)
  assert.deepEqual(rules('A robot with no face'), ['negation'])
  assert.deepEqual(rules('An iconic robot hero'), ['jargon'])
  assert.deepEqual(rules('A robot holding a sign with the title text'), [
    'lettering',
  ])
  assert.deepEqual(rules('Four ninja turtles in a sewer'), ['franchise'])
  assert.deepEqual(rules('A TMNT style robot'), ['franchise'])
  assert.deepEqual(rules(''), ['empty'])
  assert.ok(rules('A robot without a logo').includes('negation'))
  assert.ok(rules('A robot without a logo').includes('lettering'))
}
console.log(
  '✅ the checker refuses negations, jargon, lettering and franchise names',
)

{
  assert.deepEqual(kreaFrameSize('16:9'), { width: 1344, height: 768 })
  assert.deepEqual(kreaFrameSize('9:16'), { width: 768, height: 1344 })
  assert.deepEqual(kreaFrameSize('1:1'), { width: 1024, height: 1024 })
  for (const aspect of ['16:9', '9:16', '1:1'] as const) {
    const { width, height } = kreaFrameSize(aspect)
    assert.equal(width % 64, 0)
    assert.equal(height % 64, 0)
  }
  assert.equal(
    composeScenePrompt(' A robot ', ' ink outlines '),
    'A robot, ink outlines',
  )
  assert.equal(composeScenePrompt('A robot', ''), 'A robot')
}
console.log(
  '✅ Krea frame sizes are multiples of 64; the style bible is appended once',
)

{
  const zuzu = normalizeMusicVideoDoc({
    ...emptyMusicVideoDoc({
      pitch: 'Zuzu: Koala Assassin title sequence',
      settings: { durationSec: 60, styleBible: '' },
    }),
    settings: {
      durationSec: 60,
      styleBible: '',
      aspect: '16:9',
      comicSeriesId: 3,
      comicLaneKey: 'il-furrytoonmix',
      bannedTerms: [' Human ', 'great   wall', 'HUMAN', '', 'x'.repeat(61)],
      loraResourceIds: [5],
    },
  }).doc
  assert.equal(zuzu.settings.comicSeriesId, 3)
  assert.equal(zuzu.settings.comicLaneKey, 'il-furrytoonmix')
  assert.deepEqual(zuzu.settings.bannedTerms, ['human', 'great wall'])
  const noSeries = normalizeMusicVideoDoc({
    ...zuzu,
    settings: { ...zuzu.settings, comicSeriesId: 0 },
  }).doc
  assert.equal(noSeries.settings.comicSeriesId, undefined)
  assert.equal(
    noSeries.settings.comicLaneKey,
    undefined,
    'a lane key needs a series',
  )

  const scene = {
    prompt: 'anthro koala ronin, straw hat, katana, dusty street',
  }
  const krea = musicVideoStillBody(zuzu, scene, { projectSlug: 'music-video' })
  assert.equal(krea.engine, 'krea2')
  assert.equal(krea.steps, 8)
  assert.deepEqual(krea.loraResourceIds, [5])

  const lane = comicPrimaryLane(DEFAULT_COMIC_LANES)!
  const comic = musicVideoStillBody(zuzu, scene, {
    projectSlug: 'comic-film',
    lane,
    series: { styleTags: 'gritty painted comic', negativeTags: 'nsfw, human' },
  })
  assert.equal(comic.engine, 'comfy')
  assert.equal(comic.checkpoint, 'Illustrious/furrytoonmix_xlV3.safetensors')
  assert.ok(comic.promptString.startsWith(lane.prefix!))
  assert.ok(comic.promptString.includes('gritty painted comic'))
  assert.equal(
    comic.negativePrompt,
    'nsfw, human',
    'series negatives still apply',
  )
  assert.equal(comic.isPublic, false)
  assert.equal(comic.projectSlug, 'comic-film')
  assert.equal(comic.designer, 'Music Video')
  assert.deepEqual({ w: comic.width, h: comic.height }, { w: 1344, h: 768 })
}
console.log(
  '✅ a video can render stills in a comic series lane; Krea 2 stays the default',
)

{
  const terms = ['human', 'great wall', 'people']
  assert.deepEqual(findBannedTerms('A HUMAN statue in the sand', terms), [
    'human',
  ])
  assert.deepEqual(findBannedTerms('the Great   Wall rising', terms), [
    'great wall',
  ])
  assert.deepEqual(findBannedTerms('a peopled street, inhuman cold', terms), [])
  assert.deepEqual(findBannedTerms('people, everywhere', terms), ['people'])
  assert.deepEqual(findBannedTerms('anything', undefined), [])
  const withBan = normalizeMusicVideoDoc({
    ...emptyMusicVideoDoc({
      pitch: 'x',
      settings: { durationSec: 30, styleBible: '' },
    }),
    settings: { durationSec: 30, styleBible: '', bannedTerms: ['pharmacy'] },
  }).doc
  const request = buildScenePromptRequest(withBan, [])
  assert.ok(
    request.prompt.includes(
      'Never use any of these words or phrases: pharmacy.',
    ),
  )
}
console.log(
  '✅ banned terms match whole words, and the prompt writer is told to avoid them',
)

{
  const at = (n: number) => new Date(Date.UTC(2026, 9, 4, 0, n)).toISOString()
  const attempts = [
    { id: 1, artImageId: 10, verdict: 'liked', createdAt: at(1) },
    { id: 2, artImageId: 11, verdict: 'liked', createdAt: at(5) },
    { id: 3, artImageId: 12, verdict: 'selected', createdAt: at(2) },
    { id: 4, artImageId: 13, verdict: 'rejected', createdAt: at(9) },
    { id: 5, artImageId: null, verdict: 'selected', createdAt: at(9) },
  ]
  assert.equal(
    chooseKeyframeAttempt(attempts)?.id,
    3,
    'a pick beats a newer like',
  )
  assert.equal(chooseKeyframeAttempt(attempts.filter((a) => a.id !== 3))?.id, 2)
  assert.equal(chooseKeyframeAttempt(attempts.filter((a) => a.id >= 4)), null)

  assert.equal(keyframeCropLoss({ width: 1344, height: 768 }, '16:9'), 0.016)
  assert.equal(keyframeCropLoss({ width: 832, height: 1216 }, '16:9'), 0.615)
  assert.equal(keyframeCropLoss({ width: 1024, height: 1024 }, '1:1'), 0)
  assert.equal(keyframeCropLoss({}, '16:9'), 0)

  const ok = normalizeKeyframeAssignments([
    { sceneId: 's1', attemptId: 4 },
    { sceneId: 's2', slotId: '9' },
  ])
  assert.deepEqual(ok.errors, [])
  assert.deepEqual(ok.assignments, [
    { sceneId: 's1', attemptId: 4 },
    { sceneId: 's2', slotId: 9 },
  ])
  const bad = normalizeKeyframeAssignments([
    { sceneId: 's1', attemptId: 1, slotId: 2 },
    { attemptId: 3 },
  ])
  assert.equal(bad.errors.length, 2)
  assert.equal(normalizeKeyframeAssignments([]).errors.length, 1)
}
console.log(
  '✅ comic keyframes take the pick, then the newest like, and report crop loss',
)

console.log('✅ verifyMusicVideoScenes: all assertions passed')
