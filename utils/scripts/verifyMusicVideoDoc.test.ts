// /utils/scripts/verifyMusicVideoDoc.test.ts
//
// Contract test for music-video/t-004's document normalizer (utils/musicVideoDoc.ts).
// Pure functions only -- no prisma, no database, no Nuxt/H3 runtime.
//
// The assertions that earn their keep are the ones that protect later lanes: a scene
// that points at a lyric line which no longer exists, overlapping scenes, and timings
// past the song's end must be REJECTED rather than silently repaired, because the
// compositor and the timeline editor trust whatever this function lets through.
import assert from 'node:assert/strict'
import {
  briefHasGaps,
  buildBriefPrompt,
  mergeBrief,
  parseBriefResponse,
} from '../musicVideoBrief.js'

import {
  MUSIC_VIDEO_DOC_VERSION,
  MUSIC_VIDEO_LIMITS,
  emptyMusicVideoDoc,
  isMusicVideoStatus,
  normalizeMusicVideoDoc,
  parseStoredMusicVideoDoc,
  serializeMusicVideoDoc,
} from '../musicVideoDoc.js'

function at<T>(list: T[], index: number): T {
  const item = list[index]
  assert.ok(item !== undefined, `fixture has no element ${index}`)
  return item
}

function validDoc() {
  return {
    version: 1,
    pitch: '  A lighthouse keeper falls for the fog.  ',
    settings: {
      durationSec: 60,
      genre: 'dream pop',
      bpm: 92,
      mood: 'wistful',
      vocal: 'female',
      styleBible: 'Painterly coastal night, sodium lamps, teal and amber',
      aspect: '16:9',
      loraResourceIds: [12, 12, -3, 'x', 40],
    },
    lyrics: {
      sections: [
        {
          id: 'v1',
          kind: 'verse',
          lines: ['The lamp turns slow', '  ', 'The fog leans in'],
          locked: false,
        },
        { id: 'c1', kind: 'chorus', lines: ['Stay, stay, grey'], locked: true },
      ],
    },
    song: {
      source: 'comfy-acestep',
      jobId: 7,
      durationSec: 60,
      bpm: 92,
      seed: 11,
      tags: 'dream pop, female vocal',
    },
    timeline: {
      beatGrid: { bpm: 92, offsetSec: 0.25, beatsPerBar: 4 },
      markers: [
        { id: 'm2', atSec: 20, snap: 'bar' },
        { id: 'm1', atSec: 10, snap: 'beat' },
      ],
    },
    scenes: [
      {
        id: 's2',
        startSec: 20,
        endSec: 40,
        lyricRefs: [{ sectionId: 'c1', lineIdx: 0 }],
        prompt: 'A lighthouse lamp room wrapped in fog',
        promptSource: 'llm',
        image: { source: 'generated', jobId: 99 },
        motion: { kind: 'kenburns', preset: 'slow-push' },
        transition: 'crossfade',
        transitionSec: 0.5,
      },
      {
        id: 's1',
        startSec: 0,
        endSec: 20,
        lyricRefs: [{ sectionId: 'v1', lineIdx: 1 }],
        prompt: 'A rocky shore at dusk',
        promptSource: 'user',
        image: { source: 'upload', artImageId: 5 },
        motion: { kind: 'clip', clipArtImageId: 6 },
        transition: 'cut',
        transitionSec: 0,
      },
    ],
  }
}

{
  const { doc, errors } = normalizeMusicVideoDoc(validDoc())
  assert.deepEqual(errors, [])
  assert.equal(doc.version, MUSIC_VIDEO_DOC_VERSION)
  assert.equal(doc.pitch, 'A lighthouse keeper falls for the fog.')
  assert.deepEqual(doc.settings.loraResourceIds, [12, 40])
  assert.deepEqual(at(doc.lyrics.sections, 0).lines, [
    'The lamp turns slow',
    'The fog leans in',
  ])
  assert.deepEqual(
    doc.scenes.map((scene) => scene.id),
    ['s1', 's2'],
  )
  assert.deepEqual(
    doc.timeline.markers.map((marker) => marker.id),
    ['m1', 'm2'],
  )
  assert.equal(doc.song?.source, 'comfy-acestep')
  const round = normalizeMusicVideoDoc(JSON.parse(serializeMusicVideoDoc(doc)))
  assert.deepEqual(round.errors, [])
  assert.deepEqual(round.doc, doc)
}
console.log(
  '✅ a valid document normalizes cleanly, sorts scenes and markers, and round-trips',
)

{
  const doc = emptyMusicVideoDoc({ pitch: 'x', settings: { durationSec: 90 } })
  assert.equal(doc.settings.durationSec, 90)
  assert.equal(doc.settings.aspect, '16:9')
  assert.equal(doc.song, null)
  assert.deepEqual(doc.scenes, [])
  assert.equal(doc.timeline.beatGrid.bpm, 100)
  assert.equal(
    emptyMusicVideoDoc().settings.durationSec,
    MUSIC_VIDEO_LIMITS.defaultDurationSec,
  )
}
console.log('✅ the empty document has sane defaults')

{
  const raw = validDoc()
  at(raw.lyrics.sections, 1).lines = []
  const { errors } = normalizeMusicVideoDoc(raw)
  assert.ok(errors.some((e) => e.includes('lyric line that does not exist')))
}
console.log(
  '✅ a scene pointing at a deleted lyric line is rejected, not silently dropped',
)

{
  const raw = validDoc()
  at(raw.scenes, 1).endSec = 25
  const { errors } = normalizeMusicVideoDoc(raw)
  assert.ok(errors.some((e) => e.includes('overlap')))
}
console.log('✅ overlapping scenes are rejected')

{
  const raw = validDoc()
  at(raw.scenes, 0).endSec = 75
  const { errors } = normalizeMusicVideoDoc(raw)
  assert.ok(errors.some((e) => e.includes('runs past')))
  const swapped = validDoc()
  at(swapped.scenes, 0).startSec = 40
  at(swapped.scenes, 0).endSec = 20
  assert.ok(
    normalizeMusicVideoDoc(swapped).errors.some((e) =>
      e.includes('startSec < endSec'),
    ),
  )
}
console.log('✅ scenes past the end, or with start after end, are rejected')

{
  const raw = validDoc()
  raw.settings.durationSec = 5
  raw.settings.bpm = 400
  ;(raw.settings as Record<string, unknown>).vocal = 'choir'
  ;(raw.lyrics.sections[0] as Record<string, unknown>).kind = 'hook'
  at(raw.lyrics.sections, 1).id = 'v1'
  const { errors } = normalizeMusicVideoDoc(raw)
  for (const fragment of [
    'durationSec',
    'settings.bpm',
    'settings.vocal',
    'kind must be',
    'duplicated',
  ]) {
    assert.ok(
      errors.some((e) => e.includes(fragment)),
      `expected an error about ${fragment}`,
    )
  }
}
console.log(
  '✅ out-of-range settings, unknown enums and duplicate section ids are rejected',
)

{
  assert.ok(
    normalizeMusicVideoDoc({ version: 2 }).errors.some((e) =>
      e.includes('version'),
    ),
  )
  assert.ok(normalizeMusicVideoDoc('nope').errors.length > 0)
  const injected = validDoc() as Record<string, unknown>
  injected.__proto__polluter = { admin: true }
  at((injected.lyrics as { sections: { id: string }[] }).sections, 0).id =
    '../etc'
  const { doc, errors } = normalizeMusicVideoDoc(injected)
  assert.ok(!('__proto__polluter' in doc))
  assert.ok(errors.some((e) => e.includes('letters, digits')))
}
console.log(
  '✅ unknown versions, non-objects, unsafe ids and unknown keys are refused or dropped',
)

{
  assert.equal(
    parseStoredMusicVideoDoc('{not json').version,
    MUSIC_VIDEO_DOC_VERSION,
  )
  assert.equal(parseStoredMusicVideoDoc(null).scenes.length, 0)
  assert.ok(isMusicVideoStatus('DRAFT') && isMusicVideoStatus('EXPORTED'))
  assert.ok(!isMusicVideoStatus('draft') && !isMusicVideoStatus('PUBLISHED'))
}
console.log(
  '✅ corrupt stored JSON degrades to an empty document; status values are exact',
)

// music-video/t-030: named animation presets live in settings. Incomplete,
// duplicate and malformed entries are dropped rather than failing the doc.
{
  const doc = emptyMusicVideoDoc({ pitch: 'x' })
  const { doc: normalized } = normalizeMusicVideoDoc({
    ...doc,
    settings: {
      ...doc.settings,
      motionPresets: [
        { id: 'push', name: 'Slow push', prompt: 'Slow push in.' },
        { id: 'push', name: 'Duplicate', prompt: 'Dropped.' },
        { id: 'bad id!', name: 'Bad id', prompt: 'Dropped.' },
        { id: 'empty', name: '', prompt: 'Dropped: no name.' },
        { id: 'noprompt', name: 'No prompt', prompt: '' },
        'not an object',
      ],
    },
  })
  assert.deepEqual(normalized.settings.motionPresets, [
    { id: 'push', name: 'Slow push', prompt: 'Slow push in.' },
  ])
  const { doc: none } = normalizeMusicVideoDoc({
    ...doc,
    settings: { ...doc.settings, motionPresets: [] },
  })
  assert.equal(none.settings.motionPresets, undefined)
}
console.log('✅ motion presets keep only complete, unique entries')

// t-031: heroShots is a small positive count, capped at 8.
{
  const doc = emptyMusicVideoDoc({ pitch: 'x' })
  const read = (heroShots: unknown) =>
    normalizeMusicVideoDoc({ ...doc, settings: { ...doc.settings, heroShots } })
      .doc.settings.heroShots
  assert.equal(read(5), 5)
  assert.equal(read(40), 8)
  assert.equal(read(0), undefined)
  assert.equal(read('lots'), undefined)
}
console.log('✅ heroShots is a capped positive count')

// t-032: a checkpoint (image lane) for the whole video, and a lane plus LoRAs
// for one scene's image. LoRA ids are positive, unique and capped at 8.
{
  const base = validDoc()
  const { doc, errors } = normalizeMusicVideoDoc({
    ...base,
    settings: { ...base.settings, imageLaneKey: 'il-arthemy' },
    scenes: base.scenes.map((scene, index) =>
      index === 0
        ? {
            ...scene,
            image: {
              ...scene.image,
              laneKey: 'sdxl-nihilmania',
              loraResourceIds: [3, 3, -1, 'x', 4, 5, 6, 7, 8, 9, 10, 11],
            },
          }
        : scene,
    ),
  })
  assert.deepEqual(errors, [])
  assert.equal(doc.settings.imageLaneKey, 'il-arthemy')
  const withLook = doc.scenes.find((scene) => scene.id === 's2')!
  assert.equal(withLook.image.laneKey, 'sdxl-nihilmania')
  assert.deepEqual(withLook.image.loraResourceIds, [3, 4, 5, 6, 7, 8, 9, 10])
  const plain = doc.scenes.find((scene) => scene.id === 's1')!
  assert.equal(plain.image.laneKey, undefined)
  assert.equal(plain.image.loraResourceIds, undefined)
}
console.log('✅ the video checkpoint and per-scene lane and LoRAs survive')

// t-031: the brief fills blanks only, reads messy LLM output, and never
// replaces a full style bible the director wrote.
{
  const base = emptyMusicVideoDoc({
    pitch: 'A koala ronin crosses a desert.',
  }).settings
  assert.ok(briefHasGaps(base))
  const { system, prompt } = buildBriefPrompt({
    pitch: 'A koala ronin crosses a desert.',
    settings: { ...base, bannedTerms: ['human'] },
  })
  assert.match(system, /JSON object/)
  assert.match(prompt, /koala ronin/)
  assert.match(prompt, /Never use these words: human/)

  const fields = parseBriefResponse(
    'Sure! ```json\n{"genre":"samurai western","mood":"ominous","bpm":"100","vocal":"Instrumental","styleBible":"Dusty painted western comic."}\n```',
  )
  assert.deepEqual(fields, {
    genre: 'samurai western',
    mood: 'ominous',
    bpm: 100,
    vocal: 'instrumental',
    styleBible: 'Dusty painted western comic.',
  })
  assert.deepEqual(parseBriefResponse('no json here'), {})
  assert.equal(parseBriefResponse('{"bpm": 999}').bpm, undefined)

  const chosen = { ...base, genre: 'synth rock', styleBible: 'neon' }
  const merged = mergeBrief(chosen, fields)
  assert.equal(merged.genre, 'synth rock', 'a chosen genre stays')
  assert.equal(merged.mood, 'ominous', 'a blank is filled')
  assert.equal(
    merged.styleBible,
    'Dusty painted western comic.',
    'a short style note is expanded',
  )
  const fullBible = 'x'.repeat(400)
  assert.equal(
    mergeBrief({ ...base, styleBible: fullBible }, fields).styleBible,
    fullBible,
    'a full style bible is never replaced',
  )
  assert.ok(
    !briefHasGaps({
      ...base,
      genre: 'g',
      mood: 'm',
      bpm: 90,
      vocal: 'female',
      styleBible: fullBible,
    }),
  )
}
console.log('✅ the brief fills only blanks and keeps a full style bible')

console.log('✅ verifyMusicVideoDoc: all assertions passed')
