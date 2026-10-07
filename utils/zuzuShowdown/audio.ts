// /utils/zuzuShowdown/audio.ts
//
// Zuzu Showdown sound (conductor zuzu-showdown t-023), through the arcade sound kit's WebAudio
// chiptune: no audio files and no voices. Hits sound by strength (a counter hit rings), blocks
// tick, parries clink, throws thud, and an attack that hits nothing swishes. The KO has its sting,
// a Showdown super its own stinger under the eye strip, and on Hollow Bell the bell tolls once at
// round start and once at the KO. Each stage loops a tune in a weird-west minor key. This module is
// pure: sim events in, sound names out; the stage component plays them.

import type { MusicLoop, Note } from '../arcade/sound'
import { moveOf } from './sim'
import type { StageSlug } from './stages'
import type { FighterData, MatchState } from './types'

type Pair<T> = [T, T]

export type ShowdownSound =
  | 'hit-light'
  | 'hit-medium'
  | 'hit-heavy'
  | 'counter'
  | 'block'
  | 'whiff'
  | 'parry'
  | 'throw'
  | 'read'
  | 'fight'
  | 'ko'
  | 'time-over'
  | 'super'
  | 'showdown'
  | 'bell'

/** A hit at least this strong is medium, and at least the second heavy. */
export const MEDIUM_HIT = 50
export const HEAVY_HIT = 90

// A struck bell: a hum an octave down, the strike note, and inharmonic partials above it that die
// away faster.
const BELL_NOTE = 330
const bell: Note[] = [
  { freq: BELL_NOTE / 2, dur: 3, type: 'sine', vol: 0.05 },
  { freq: BELL_NOTE, dur: 2.6, type: 'sine', vol: 0.09 },
  { freq: BELL_NOTE * 2, dur: 1.8, type: 'sine', vol: 0.05 },
  { freq: BELL_NOTE * 2.76, dur: 1.2, type: 'sine', vol: 0.035 },
  { freq: BELL_NOTE * 5.4, dur: 0.6, type: 'sine', vol: 0.02 },
  { freq: 2000, dur: 0.03, noise: true, vol: 0.05 },
]

export const SOUNDS: Record<ShowdownSound, Note[]> = {
  'hit-light': [
    { freq: 520, to: 160, dur: 0.08, type: 'triangle', vol: 0.1 },
    { freq: 1, dur: 0.04, noise: true, vol: 0.05 },
  ],
  'hit-medium': [
    { freq: 380, to: 110, dur: 0.12, type: 'triangle', vol: 0.12 },
    { freq: 1, dur: 0.08, noise: true, vol: 0.08 },
  ],
  'hit-heavy': [
    { freq: 220, to: 55, dur: 0.2, type: 'square', vol: 0.08 },
    { freq: 1, dur: 0.22, noise: true, vol: 0.16 },
  ],
  counter: [
    { freq: 220, to: 55, dur: 0.2, type: 'square', vol: 0.08 },
    { freq: 1, dur: 0.22, noise: true, vol: 0.14 },
    { freq: 1568, dur: 0.1, type: 'square', vol: 0.05, at: 0.02 },
  ],
  block: [
    { freq: 1100, dur: 0.03, type: 'square', vol: 0.04 },
    { freq: 1, dur: 0.03, noise: true, vol: 0.04 },
  ],
  whiff: [{ freq: 1, dur: 0.09, noise: true, vol: 0.025 }],
  parry: [
    { freq: 2093, dur: 0.25, type: 'sine', vol: 0.07 },
    { freq: 3136, dur: 0.2, type: 'sine', vol: 0.04, at: 0.01 },
  ],
  throw: [
    { freq: 160, to: 60, dur: 0.25, type: 'triangle', vol: 0.12 },
    { freq: 1, dur: 0.2, noise: true, vol: 0.1, at: 0.12 },
  ],
  read: [
    { freq: 660, dur: 0.06, type: 'square', vol: 0.06 },
    { freq: 990, dur: 0.09, type: 'square', vol: 0.06, at: 0.06 },
  ],
  fight: [
    { freq: 440, dur: 0.1, type: 'square', vol: 0.06 },
    { freq: 523, dur: 0.1, type: 'square', vol: 0.06, at: 0.1 },
    { freq: 659, dur: 0.25, type: 'square', vol: 0.06, at: 0.2 },
  ],
  // Da-da-DUM, down the A minor chord.
  ko: [
    { freq: 880, dur: 0.12, type: 'square', vol: 0.06 },
    { freq: 659, dur: 0.12, type: 'square', vol: 0.06, at: 0.14 },
    { freq: 220, dur: 0.7, type: 'sawtooth', vol: 0.07, at: 0.28 },
    { freq: 1, dur: 0.5, noise: true, vol: 0.08, at: 0.28 },
  ],
  'time-over': [{ freq: 220, to: 330, dur: 0.15, type: 'square', vol: 0.05 }],
  super: [
    { freq: 1047, dur: 0.08, type: 'square', vol: 0.06 },
    { freq: 1319, dur: 0.08, type: 'square', vol: 0.06, at: 0.08 },
    { freq: 1568, dur: 0.08, type: 'square', vol: 0.06, at: 0.16 },
    { freq: 2093, dur: 0.16, type: 'square', vol: 0.06, at: 0.24 },
  ],
  // The Showdown stinger: a low drone, a fast A minor run up, and a crash.
  showdown: [
    { freq: 110, dur: 0.9, type: 'sawtooth', vol: 0.06 },
    { freq: 440, dur: 0.06, type: 'square', vol: 0.05 },
    { freq: 523, dur: 0.06, type: 'square', vol: 0.05, at: 0.06 },
    { freq: 659, dur: 0.06, type: 'square', vol: 0.05, at: 0.12 },
    { freq: 880, dur: 0.3, type: 'square', vol: 0.05, at: 0.18 },
    { freq: 1, dur: 0.6, noise: true, vol: 0.12, at: 0.18 },
  ],
  bell,
}

/** The sounds that need state across frames: the last attack each side was heard whiffing. */
export type SoundState = { whiffed: Pair<number | null> }

export function newSoundState(): SoundState {
  return { whiffed: [null, null] }
}

/**
 * The sounds for this frame of `s` (its events, and any attack that has just finished its active
 * frames without touching anything), on `stage`.
 */
export function soundsFor(
  state: SoundState,
  s: MatchState,
  roster: Pair<FighterData>,
  stage: StageSlug | null,
): { state: SoundState; sounds: ShowdownSound[] } {
  const sounds: ShowdownSound[] = []
  for (const e of s.events) {
    switch (e.type) {
      case 'hit':
        sounds.push(
          e.counter
            ? 'counter'
            : e.damage >= HEAVY_HIT
              ? 'hit-heavy'
              : e.damage >= MEDIUM_HIT
                ? 'hit-medium'
                : 'hit-light',
        )
        break
      case 'block':
        sounds.push('block')
        break
      case 'parry':
        sounds.push('parry')
        break
      case 'throw':
        sounds.push('throw')
        break
      case 'read':
        sounds.push('read')
        break
      case 'fight':
        sounds.push('fight')
        break
      case 'super':
        sounds.push(e.showdown ? 'showdown' : 'super')
        break
      case 'ko':
        sounds.push('ko')
        if (stage === 'hollow-bell') sounds.push('bell')
        break
      case 'timeOver':
        sounds.push('time-over')
        break
      case 'roundStart':
        if (stage === 'hollow-bell') sounds.push('bell')
        break
      default:
        break
    }
  }
  // A whiff: the active frames just ran out and nothing was touched. Once per attack, however long
  // a freeze holds that frame.
  const whiffed: Pair<number | null> = [...state.whiffed]
  for (const side of [0, 1] as const) {
    const f = s.fighters[side]
    if (f.action !== 'attack' || !f.attack || f.attack.contact) continue
    let move
    try {
      move = moveOf(roster[side], f.attack)
    } catch {
      continue
    }
    const start = s.frame - f.attack.frame
    if (
      f.attack.frame === move.startup + move.active &&
      whiffed[side] !== start
    ) {
      whiffed[side] = start
      sounds.push('whiff')
    }
  }
  return { state: { whiffed }, sounds }
}

// ---------------------------------------------------------------- music

/**
 * Hollow Bell, Zuzu's: A minor at a trot, a galloping bass under a lead that turns on the dominant
 * (the G# of the harmonic minor), and a brushed snare gallop.
 */
const HOLLOW_BELL: MusicLoop = {
  bpm: 100,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: `A2 . E2 . A2 . E2 .   F2 . C3 . F2 . C3 .
              G2 . D3 . G2 . D3 .   E2 . B2 . E2 G#2 B2 .`,
    },
    {
      type: 'square',
      vol: 0.03,
      steps: `A4 - - C5 E5 - D5 C5   F5 - - E5 D5 - C5 -
              G4 - B4 - D5 - C5 B4   E5 - - - G#4 - - -`,
    },
    {
      noise: true,
      vol: 0.02,
      steps: `x . x x x . x x   x . x x x . x x
              x . x x x . x x   x . x x x . x x`,
    },
  ],
}

/**
 * The Watering Hole, the Coyote's and the croc's: D minor, slow and dry, a lonesome whistle over
 * a bass that sits on the root and the fifth.
 */
const WATERING_HOLE: MusicLoop = {
  bpm: 84,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: `D2 - - . A1 - - .   D2 - - . A1 - - .
              Bb1 - - . F2 - - .   A1 - - . C#2 - A1 .`,
    },
    {
      type: 'sine',
      vol: 0.05,
      steps: `. . . . A4 - - -   D5 - - - C#5 - D5 -
              F5 - - - E5 - D5 -   A4 - - - . . . .`,
    },
  ],
}

/** Every stage still to come: E minor at a canter. */
export const DEFAULT_LOOP: MusicLoop = {
  bpm: 110,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: `E2 . B2 . E2 . B2 .   C3 . G2 . D3 . A2 .
              E2 . B2 . E2 . B2 .   B2 . F#2 . B1 . D#2 .`,
    },
    {
      type: 'square',
      vol: 0.03,
      steps: `E4 - G4 - B4 - A4 G4   F#4 - - - . . . .
              E4 - G4 - B4 - E5 -   D#5 - - - B4 - - -`,
    },
  ],
}

export const STAGE_LOOPS: Record<StageSlug, MusicLoop> = {
  'hollow-bell': HOLLOW_BELL,
  'watering-hole': WATERING_HOLE,
}

/** The minor key each loop is in (its tonic's pitch class, 0 = C). */
export const LOOP_KEYS: Array<{
  name: string
  loop: MusicLoop
  tonic: number
}> = [
  { name: 'hollow-bell', loop: HOLLOW_BELL, tonic: 9 },
  { name: 'watering-hole', loop: WATERING_HOLE, tonic: 2 },
  { name: 'default', loop: DEFAULT_LOOP, tonic: 4 },
]

export function loopFor(stage: StageSlug | null): MusicLoop {
  return stage ? STAGE_LOOPS[stage] : DEFAULT_LOOP
}
