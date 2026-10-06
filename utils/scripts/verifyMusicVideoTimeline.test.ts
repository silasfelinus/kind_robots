// /utils/scripts/verifyMusicVideoTimeline.test.ts
//
// Contract test for music-video/t-007: beat grid, snapping, waveform peaks, section
// bands, markers, scene split / merge and lyric assignment.
import assert from 'node:assert/strict'

import type { MusicVideoScene } from '../musicVideoDoc.js'
import {
  addMarker,
  assignLyricLine,
  beatTimes,
  mergeSceneBack,
  moveMarker,
  removeMarker,
  sectionBands,
  snapTime,
  spreadLyricsAcrossScenes,
  splitSceneAt,
  waveformPeaks,
} from '../musicVideoTimeline.js'

const grid = { bpm: 120, offsetSec: 0.25, beatsPerBar: 4 }

{
  const beats = beatTimes(grid, 3)
  assert.deepEqual(
    beats.map((b) => b.atSec),
    [0.25, 0.75, 1.25, 1.75, 2.25, 2.75],
  )
  assert.deepEqual(
    beats.map((b) => b.bar),
    [true, false, false, false, true, false],
  )
  assert.deepEqual(
    beatTimes({ ...grid, offsetSec: -0.25 }, 1).map((b) => b.atSec),
    [0.25, 0.75],
  )
  assert.deepEqual(beatTimes(grid, 0), [])
}

{
  assert.equal(snapTime(0.9, 'beat', grid, 10), 0.75)
  assert.equal(snapTime(2.1, 'bar', grid, 10), 2.25)
  assert.equal(snapTime(2.123456, 'free', grid, 10), 2.123)
  assert.equal(snapTime(99, 'free', grid, 10), 10)
  assert.equal(snapTime(-4, 'beat', grid, 10), 0.25)
}

{
  assert.deepEqual(waveformPeaks([0, 0.5, -1, 0.25], 2), [0.5, 1])
  assert.deepEqual(waveformPeaks([], 3), [0, 0, 0])
  assert.deepEqual(waveformPeaks([0, 0], 2), [0, 0])
}

{
  const bands = sectionBands(
    [
      { id: 'a', kind: 'verse', lines: ['1', '2', '3'], locked: false },
      { id: 'b', kind: 'chorus', lines: ['4'], locked: false },
    ],
    40,
  )
  assert.deepEqual(
    bands.map((b) => [b.startSec, b.endSec]),
    [
      [0, 30],
      [30, 40],
    ],
  )
}

{
  let markers = addMarker([], 2.1, 'bar', grid, 10, 'm1')
  assert.deepEqual(
    markers.map((m) => m.atSec),
    [2.25],
  )
  assert.equal(
    addMarker(markers, 2.2, 'bar', grid, 10, 'm2'),
    markers,
    'duplicate time ignored',
  )
  markers = addMarker(markers, 0.8, 'beat', grid, 10, 'm3')
  assert.deepEqual(
    markers.map((m) => m.id),
    ['m3', 'm1'],
  )
  markers = moveMarker(markers, 'm3', 4.3, grid, 10)
  assert.deepEqual(
    markers.map((m) => [m.id, m.atSec]),
    [
      ['m1', 2.25],
      ['m3', 4.25],
    ],
  )
  assert.equal(
    moveMarker(markers, 'm3', 2.3, grid, 10),
    markers,
    'cannot land on another marker',
  )
  assert.deepEqual(
    removeMarker(markers, 'm1').map((m) => m.id),
    ['m3'],
  )
  assert.equal(
    addMarker([], 0, 'free', grid, 10, 'x').length,
    0,
    'no marker at the song edge',
  )
}

function base(id: string, startSec: number, endSec: number): MusicVideoScene {
  return {
    id,
    startSec,
    endSec,
    lyricRefs: [],
    prompt: 'p',
    promptSource: 'user',
    image: { source: 'generated', artImageId: 7 },
    motion: { kind: 'kenburns' },
    transition: 'crossfade',
    transitionSec: 1,
  }
}

{
  const scenes = [
    {
      ...base('s1', 0, 10),
      lyricRefs: [0, 1, 2, 3].map((lineIdx) => ({ sectionId: 'a', lineIdx })),
    },
    base('s2', 10, 20),
  ]
  const split = splitSceneAt(scenes, 4, 's3')
  assert.deepEqual(
    split.map((s) => [s.id, s.startSec, s.endSec]),
    [
      ['s1', 0, 4],
      ['s3', 4, 10],
      ['s2', 10, 20],
    ],
  )
  assert.equal(split[0].lyricRefs.length, 2)
  assert.equal(split[1].lyricRefs.length, 2)
  assert.equal(split[1].prompt, '')
  assert.equal(split[1].image.artImageId, undefined)
  assert.equal(splitSceneAt(scenes, 10, 'sx'), scenes, 'a boundary is no split')
  const merged = mergeSceneBack(split, 's3')
  assert.deepEqual(
    merged.map((s) => [s.id, s.startSec, s.endSec]),
    [
      ['s1', 0, 10],
      ['s2', 10, 20],
    ],
  )
  assert.equal(merged[0].image.artImageId, 7)
  assert.equal(merged[0].lyricRefs.length, 4)
  assert.equal(mergeSceneBack(scenes, 's1'), scenes)
}

{
  const sections = [
    {
      id: 'a',
      kind: 'verse' as const,
      lines: ['1', '2', '3', '4', '5', '6'],
      locked: false,
    },
  ]
  const spread = spreadLyricsAcrossScenes(
    [base('s1', 0, 5), base('s2', 5, 20)],
    sections,
  )
  assert.equal(spread[0].lyricRefs.length, 2)
  assert.equal(spread[1].lyricRefs.length, 4)
  const moved = assignLyricLine(spread, { sectionId: 'a', lineIdx: 0 }, 's2')
  assert.equal(moved[0].lyricRefs.length, 1)
  assert.equal(moved[1].lyricRefs.length, 5)
  const total = moved.reduce((n, s) => n + s.lyricRefs.length, 0)
  assert.equal(total, 6, 'a line belongs to exactly one scene')
}

console.log('verifyMusicVideoTimeline: ok')
