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
  kreaFrameSize,
  parseScenePromptResponse,
  planScenes,
} from '../musicVideoScenes.js'

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

console.log('✅ verifyMusicVideoScenes: all assertions passed')
