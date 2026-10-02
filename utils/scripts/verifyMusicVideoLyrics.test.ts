// /utils/scripts/verifyMusicVideoLyrics.test.ts
//
// Contract test for music-video/t-005 (utils/musicVideoLyrics.ts). Pure functions only.
//
// The assertions that earn their keep: locked sections survive every regeneration,
// a single-section rewrite touches only that section, messy model output still parses
// into the doc's section shape, and the ACE-Step lyric text uses the tags Comfy expects.
import assert from 'node:assert/strict'

import {
  normalizeMusicVideoDoc,
  type MusicVideoScene,
} from '../musicVideoDoc.js'
import {
  buildLyricsPrompt,
  mergeLyricSections,
  parseLyricsResponse,
  planLyricSections,
  pruneDanglingLyricRefs,
  toAceStepLyrics,
} from '../musicVideoLyrics.js'

function at<T>(list: T[], index: number): T {
  const item = list[index]
  assert.ok(item !== undefined, `fixture has no element ${index}`)
  return item
}

{
  assert.deepEqual(
    planLyricSections({ durationSec: 30 }).map((s) => s.kind),
    ['verse', 'chorus'],
  )
  const minute = planLyricSections({ durationSec: 60, bpm: 120 })
  assert.deepEqual(
    minute.map((s) => s.id),
    ['v1', 'c1', 'v2', 'c2'],
  )
  const long = planLyricSections({ durationSec: 200 })
  assert.equal(at(long, 0).kind, 'intro')
  assert.equal(at(long, long.length - 1).kind, 'outro')
  assert.ok(long.some((s) => s.kind === 'pre-chorus'))
  assert.deepEqual(
    planLyricSections({ durationSec: 120, vocal: 'instrumental' }),
    [],
  )
  const slow = planLyricSections({ durationSec: 60, bpm: 70 })
  assert.equal(at(slow, 0).lines, 3)
  assert.equal(at(slow, 1).lines, 4)
}
console.log(
  '✅ the section plan scales with length, tempo and instrumental vocals',
)

{
  const { system, prompt } = buildLyricsPrompt({
    pitch: 'Robots who paint murals at night',
    settings: {
      durationSec: 60,
      genre: 'synthwave',
      bpm: 110,
      styleBible: '',
      aspect: '16:9',
    },
    plan: planLyricSections({ durationSec: 60 }),
    keep: [
      { id: 'c1', kind: 'chorus', lines: ['Paint the dark'], locked: true },
    ],
  })
  assert.ok(system.includes('[Verse 1]'))
  assert.ok(prompt.includes('Robots who paint murals at night'))
  assert.ok(prompt.includes('genre: synthwave') && prompt.includes('110 BPM'))
  assert.ok(
    prompt.includes('[Verse 1]') &&
      prompt.includes('[Verse 2]') &&
      prompt.includes('[Chorus]'),
  )
  assert.ok(prompt.includes('Paint the dark'))
}
console.log(
  '✅ the prompt carries the pitch, settings, section order and kept lines',
)

{
  const messy = [
    'Sure! Here are your lyrics:',
    '',
    '[Verse 1]',
    '- Neon on the rooftops',
    '1. Brushes in our hands',
    '',
    '[Chorus]',
    '**We paint the dark**',
    '[Interlude]',
    'ignored line',
    '[Verse 2]',
    'Morning finds the colors',
    '[Hook]',
    'We paint the dark',
    '[Bridge]',
  ].join('\n')
  const sections = parseLyricsResponse(messy)
  assert.deepEqual(
    sections.map((s) => s.id),
    ['v1', 'c1', 'v2', 'c2'],
  )
  assert.deepEqual(at(sections, 0).lines, [
    'Neon on the rooftops',
    'Brushes in our hands',
  ])
  assert.deepEqual(at(sections, 1).lines, ['We paint the dark'])
  assert.ok(sections.every((s) => !s.locked))
  assert.deepEqual(parseLyricsResponse('no tags at all'), [])
}
console.log(
  '✅ chatty, bulleted, bolded model output parses; unknown and empty sections are dropped',
)

{
  const existing = [
    { id: 'v1', kind: 'verse' as const, lines: ['old verse'], locked: false },
    { id: 'c1', kind: 'chorus' as const, lines: ['kept chorus'], locked: true },
  ]
  const generated = [
    { id: 'v1', kind: 'verse' as const, lines: ['new verse'], locked: false },
    { id: 'c1', kind: 'chorus' as const, lines: ['new chorus'], locked: false },
    {
      id: 'v2',
      kind: 'verse' as const,
      lines: ['second verse'],
      locked: false,
    },
  ]
  const full = mergeLyricSections(existing, generated)
  assert.deepEqual(
    full.map((s) => s.lines[0]),
    ['new verse', 'kept chorus', 'second verse'],
  )
  assert.equal(at(full, 1).locked, true)

  const one = mergeLyricSections(
    existing,
    [{ id: 'v1', kind: 'verse', lines: ['rewritten'], locked: false }],
    'v1',
  )
  assert.deepEqual(
    one.map((s) => s.lines[0]),
    ['rewritten', 'kept chorus'],
  )

  const lockedTarget = mergeLyricSections(existing, generated, 'c1')
  assert.deepEqual(lockedTarget, existing)

  const byKind = mergeLyricSections(
    [...existing, { id: 'v2', kind: 'verse', lines: ['x'], locked: false }],
    [{ id: 'v1', kind: 'verse', lines: ['fresh'], locked: false }],
    'v2',
  )
  assert.deepEqual(
    byKind.map((s) => s.lines[0]),
    ['old verse', 'kept chorus', 'fresh'],
  )
}
console.log(
  '✅ locked sections always survive; a single-section rewrite touches only that section',
)

{
  const sections = [
    { id: 'v1', kind: 'verse' as const, lines: ['a', 'b'], locked: false },
  ]
  const scene: MusicVideoScene = {
    id: 's1',
    startSec: 0,
    endSec: 5,
    lyricRefs: [
      { sectionId: 'v1', lineIdx: 1 },
      { sectionId: 'v1', lineIdx: 4 },
      { sectionId: 'c9', lineIdx: 0 },
    ],
    prompt: '',
    promptSource: 'llm',
    image: { source: 'generated' },
    motion: { kind: 'kenburns' },
    transition: 'cut',
    transitionSec: 0,
  }
  const pruned = pruneDanglingLyricRefs([scene], sections)
  assert.deepEqual(at(pruned, 0).lyricRefs, [{ sectionId: 'v1', lineIdx: 1 }])
  const { errors } = normalizeMusicVideoDoc({
    settings: { durationSec: 30 },
    lyrics: { sections },
    scenes: pruned,
  })
  assert.deepEqual(errors, [])
}
console.log(
  '✅ rewriting lyrics drops dangling scene links instead of failing the save',
)

{
  const ace = toAceStepLyrics([
    { id: 'i1', kind: 'intro', lines: ['hum'], locked: false },
    { id: 'v1', kind: 'verse', lines: ['one', 'two'], locked: false },
    { id: 'c1', kind: 'chorus', lines: ['hook'], locked: false },
    { id: 'v2', kind: 'verse', lines: ['three'], locked: false },
    { id: 'p1', kind: 'pre-chorus', lines: [], locked: false },
  ])
  assert.equal(
    ace,
    '[Intro]\nhum\n\n[Verse 1]\none\ntwo\n\n[Chorus]\nhook\n\n[Verse 2]\nthree',
  )
}
console.log(
  '✅ ACE-Step lyrics use [Intro]/[Verse n]/[Chorus] tags and skip empty sections',
)

console.log('✅ verifyMusicVideoLyrics: all assertions passed')
