// /utils/scripts/verifyZuzuShowdownSound.test.ts
//
// Zuzu Showdown sound (conductor zuzu-showdown t-023):
//   - the arcade kit's music sequencer reads note tokens (holds, rests, sharps and flats), and its
//     scheduling windows cover a loop exactly once, across the wrap;
//   - every stage loop is whole bars, its tracks line up, and every note is in its minor key;
//   - sim events map to sounds by strength (a counter rings), the Showdown super gets its stinger,
//     and the bell tolls on Hollow Bell only, at round start and at the KO;
//   - a real attack that hits nothing swishes once, however long a freeze holds that frame, and one
//     that connects doesn't;
//   - every sound stays in range (audible pitch, short, never loud).
//
//   npx tsx utils/scripts/verifyZuzuShowdownSound.test.ts

import assert from 'node:assert/strict'
import {
  loopNotesBetween,
  noteFreq,
  parseLoop,
  type MusicLoop,
} from '../arcade/sound'
import {
  HEAVY_HIT,
  LOOP_KEYS,
  MEDIUM_HIT,
  SOUNDS,
  STAGE_LOOPS,
  loopFor,
  newSoundState,
  soundsFor,
  type ShowdownSound,
} from '../zuzuShowdown/audio'
import { findFighter } from '../zuzuShowdown/fighters'
import { step } from '../zuzuShowdown/sim'
import { trainingMatch } from '../zuzuShowdown/training'
import type { StageSlug } from '../zuzuShowdown/stages'
import {
  SUB,
  neutralInput,
  type FighterData,
  type SimEvent,
} from '../zuzuShowdown/types'

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

const ROSTER: [FighterData, FighterData] = [
  findFighter('zuzu'),
  findFighter('coyote-vagrant'),
]

check('note names read as pitches', () => {
  assert.equal(noteFreq('A4'), 440)
  assert.equal(noteFreq('A3'), 220)
  assert.ok(Math.abs(noteFreq('C#5')! - 554.37) < 0.01)
  assert.ok(Math.abs(noteFreq('Bb2')! - 116.54) < 0.01)
  assert.equal(noteFreq('Db4'), noteFreq('C#4'))
  for (const bad of ['H4', 'A', 'x', '-', 'a4', 'A10'])
    assert.equal(noteFreq(bad), null, bad)
})

check('the sequencer holds, rests and loops without gaps or repeats', () => {
  const loop: MusicLoop = {
    bpm: 120,
    tracks: [
      { steps: 'A4 - - . C5 . E5 -' },
      { steps: 'x . x .', noise: true },
    ],
  }
  const parsed = parseLoop(loop)
  assert.equal(parsed.stepDur, 0.25)
  assert.equal(parsed.length, 8)
  const a4 = parsed.notes.find((n) => n.freq === 440)!
  assert.equal(a4.steps, 3, 'two holds make three steps')
  assert.equal(parsed.notes.filter((n) => n.noise).length, 2)
  assert.throws(() => parseLoop({ bpm: 100, tracks: [{ steps: 'A4 Q4' }] }))
  // Windows of uneven size across three laps: each note once per lap, in time order.
  const cuts = [0, 0.13, 0.5, 1.99, 2.0, 3.3, 4.7, 6.0]
  const times: number[] = []
  for (let i = 0; i + 1 < cuts.length; i += 1) {
    for (const { time } of loopNotesBetween(parsed, cuts[i]!, cuts[i + 1]!)) {
      assert.ok(time >= cuts[i]! && time < cuts[i + 1]!)
      times.push(time)
    }
  }
  assert.deepEqual(
    times,
    [...times].sort((x, y) => x - y),
  )
  assert.equal(
    times.length,
    parsed.notes.length * 3,
    'three laps of 2 s, every note once each',
  )
})

check('every stage loop is whole bars in its minor key', () => {
  // Natural minor plus the raised seventh of the harmonic minor.
  const MINOR = new Set([0, 2, 3, 5, 7, 8, 10, 11])
  for (const { name, loop, tonic } of LOOP_KEYS) {
    const lengths = loop.tracks.map((t) => t.steps.trim().split(/\s+/).length)
    assert.ok(
      lengths.every((l) => l === lengths[0]),
      `${name} tracks line up: ${lengths}`,
    )
    assert.equal(lengths[0]! % 8, 0, `${name} is whole bars`)
    const parsed = parseLoop(loop)
    for (const note of parsed.notes) {
      if (note.noise) continue
      const semis = Math.round(12 * Math.log2(note.freq / 440)) + 9
      const degree = (((semis - tonic) % 12) + 12) % 12
      assert.ok(
        MINOR.has(degree),
        `${name}: a note ${degree} semitones over the tonic`,
      )
      assert.ok(
        note.freq >= 40 && note.freq <= 2000,
        `${name}: pitch ${note.freq}`,
      )
      assert.ok(note.vol <= 0.1)
    }
    // The bass opens on the tonic.
    const first = parsed.notes
      .filter((n) => !n.noise)
      .sort((a, b) => a.step - b.step)[0]!
    const firstSemis = Math.round(12 * Math.log2(first.freq / 440)) + 9
    assert.equal(
      ((firstSemis % 12) + 12) % 12,
      tonic,
      `${name} starts on its tonic`,
    )
  }
  assert.equal(loopFor('hollow-bell'), STAGE_LOOPS['hollow-bell'])
  assert.notEqual(loopFor('hollow-bell'), loopFor('watering-hole'))
  assert.ok(loopFor(null))
})

function soundsOf(events: SimEvent[], stage: StageSlug): ShowdownSound[] {
  const s = trainingMatch(ROSTER)
  s.events = events
  return soundsFor(newSoundState(), s, ROSTER, stage).sounds
}

check(
  'events sound by strength; the Showdown stinger; the bell only on Hollow Bell',
  () => {
    const hit = (damage: number, counter = false): SimEvent => ({
      type: 'hit',
      attacker: 0,
      move: 'stand_lp',
      damage,
      combo: 1,
      counter,
    })
    assert.deepEqual(soundsOf([hit(MEDIUM_HIT - 1)], 'watering-hole'), [
      'hit-light',
    ])
    assert.deepEqual(soundsOf([hit(MEDIUM_HIT)], 'watering-hole'), [
      'hit-medium',
    ])
    assert.deepEqual(soundsOf([hit(HEAVY_HIT)], 'watering-hole'), ['hit-heavy'])
    assert.deepEqual(soundsOf([hit(10, true)], 'watering-hole'), ['counter'])
    assert.deepEqual(
      soundsOf(
        [
          { type: 'block', attacker: 0, move: 'stand_lp', chip: 0 },
          { type: 'parry', side: 1 },
          { type: 'throw', attacker: 1, damage: 80 },
          { type: 'super', side: 0, move: 'x', showdown: false },
          { type: 'super', side: 0, move: 'y', showdown: true },
        ],
        'watering-hole',
      ),
      ['block', 'parry', 'throw', 'super', 'showdown'],
    )
    const ko: SimEvent = { type: 'ko', result: 0 }
    const start: SimEvent = { type: 'roundStart', round: 2 }
    assert.deepEqual(soundsOf([ko], 'hollow-bell'), ['ko', 'bell'])
    assert.deepEqual(soundsOf([start], 'hollow-bell'), ['bell'])
    assert.deepEqual(soundsOf([ko], 'watering-hole'), ['ko'])
    const showdown: SimEvent = {
      type: 'super',
      side: 0,
      move: 'z',
      showdown: true,
    }
    assert.deepEqual(
      soundsOf([showdown], 'bone-yard'),
      ['showdown', 'howl'],
      'the pack howls',
    )
    assert.deepEqual(soundsOf([showdown], 'watering-hole'), ['showdown'])
    assert.deepEqual(soundsOf([start], 'watering-hole'), [])
    assert.deepEqual(
      soundsOf([{ type: 'timeOver', result: 'draw' }], 'hollow-bell'),
      ['time-over'],
    )
  },
)

/** P1 jabs from `gap` pixels away; every frame's sounds, collected. */
function jabFrom(gap: number): ShowdownSound[] {
  let s = trainingMatch(ROSTER)
  s.fighters[0].x = -Math.round(gap / 2) * SUB
  s.fighters[1].x = Math.round(gap / 2) * SUB
  let state = newSoundState()
  const heard: ShowdownSound[] = []
  for (let i = 0; i < 60; i += 1) {
    const input = neutralInput()
    if (i === 2) input.lp = true
    s = step(s, [input, neutralInput()], ROSTER)
    // Hear each frame twice: a frame held by a freeze must not swish again.
    for (let repeat = 0; repeat < 2; repeat += 1) {
      const out = soundsFor(state, s, ROSTER, 'watering-hole')
      state = out.state
      if (repeat === 0) heard.push(...out.sounds)
      else
        assert.ok(
          !out.sounds.includes('whiff'),
          'no second swish on a held frame',
        )
    }
  }
  return heard
}

check(
  'an attack that hits nothing swishes once; one that connects does not',
  () => {
    const far = jabFrom(200)
    assert.deepEqual(
      far.filter((n) => n === 'whiff'),
      ['whiff'],
    )
    const close = jabFrom(30)
    assert.ok(close.includes('hit-light'), `close: ${close}`)
    assert.ok(!close.includes('whiff'))
  },
)

check('every sound stays in range', () => {
  for (const [name, notes] of Object.entries(SOUNDS)) {
    assert.ok(notes.length > 0, name)
    for (const n of notes) {
      assert.ok(Number.isFinite(n.freq) && n.freq > 0, `${name} freq`)
      assert.ok(n.dur > 0 && n.dur <= 3, `${name} dur ${n.dur}`)
      assert.ok((n.vol ?? 0.08) <= 0.2, `${name} vol`)
      if (n.to !== undefined) assert.ok(n.to > 0, `${name} sweep`)
    }
  }
  // The bell rings longest.
  const longest = (notes: (typeof SOUNDS)[ShowdownSound]) =>
    Math.max(...notes.map((n) => (n.at ?? 0) + n.dur))
  for (const name of Object.keys(SOUNDS) as ShowdownSound[]) {
    if (name !== 'bell')
      assert.ok(longest(SOUNDS.bell) > longest(SOUNDS[name]), name)
  }
})

console.log(`verifyZuzuShowdownSound: ${passed} checks passed`)
