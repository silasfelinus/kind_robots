// /utils/arcade/ghostTrail/music.ts
//
// Zuzu: Ghost Trail's score and sound (conductor kr-arcade t-020): a chiptune loop for each painted
// world, a boss theme, the Abbess's finale, and the ending, written for the arcade's step sequencer
// (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track), plus the
// game's own sound effects as note lists. Weird-west minor keys: galloping basses, a whistled lead in
// the town, slow bells in the tower, an organ under the abbey.
//
// Every loop is eight bars of eight steps (eighth notes) per track, so the voices stay in step.

import type { MusicLoop, Note } from '../sound'
import type { StageTheme } from './world'

/** Bars joined into one track's steps. */
const bars = (...b: string[]) => b.join(' ')
/** A galloping bar: root, rest, root, root, fifth, rest, fifth, fifth. */
const gallop = (r: string, f: string) => `${r} . ${r} ${r} ${f} . ${f} ${f}`
/** A held bar: one note for all eight steps. */
const held = (n: string) => `${n} - - - - - - -`
/** A walking bar: root and fifth on the beats. */
const walk = (r: string, f: string) => `${r} - ${f} - ${r} - ${f} -`
/** Eight driving eighths on the root, stepping down to `to` at the end. */
const drive = (r: string, to: string) =>
  `${r} ${r} ${r} ${r} ${r} ${r} ${to} ${to}`
/** The same drum bar eight times. */
const drums = (bar: string) => bars(...Array(8).fill(bar))

const TOWN: MusicLoop = {
  bpm: 132,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        gallop('A2', 'E2'),
        gallop('A2', 'E2'),
        gallop('F2', 'C3'),
        gallop('E2', 'B2'),
        gallop('A2', 'E2'),
        gallop('A2', 'E2'),
        gallop('D2', 'A2'),
        gallop('E2', 'B2'),
      ),
    },
    {
      type: 'square',
      vol: 0.025,
      steps: bars(
        'A4 - - - C5 - E5 -',
        'D5 - C5 - B4 - A4 -',
        'F4 - - - A4 - C5 -',
        'B4 - - - G#4 - E4 -',
        'A4 - - - C5 - E5 -',
        'G5 - F5 - E5 - D5 -',
        'F5 - E5 - D5 - C5 -',
        'B4 - G#4 - E4 - - -',
      ),
    },
    { noise: true, vol: 0.025, steps: drums('x . . x x . . .') },
  ],
}

const BONEYARD: MusicLoop = {
  bpm: 108,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('D2', 'A2'),
        walk('D2', 'A2'),
        walk('Bb1', 'F2'),
        walk('A1', 'E2'),
        walk('D2', 'A2'),
        walk('D2', 'A2'),
        walk('G1', 'D2'),
        walk('A1', 'E2'),
      ),
    },
    {
      type: 'triangle',
      vol: 0.05,
      steps: bars(
        'D5 - - - . . F5 -',
        'E5 - - - C#5 - - -',
        'D5 - - - . . A4 -',
        'Bb4 - - - A4 - - -',
        'D5 - F5 - A5 - - -',
        'G5 - F5 - E5 - - -',
        'F5 - E5 - D5 - C#5 -',
        'D5 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.02, steps: drums('x . . . . . x .') },
  ],
}

const WATERHOLE: MusicLoop = {
  bpm: 96,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('E2', 'B2'),
        walk('C2', 'G2'),
        walk('D2', 'A2'),
        walk('B1', 'F#2'),
        walk('E2', 'B2'),
        walk('A1', 'E2'),
        walk('C2', 'G2'),
        walk('B1', 'F#2'),
      ),
    },
    {
      type: 'sine',
      vol: 0.06,
      steps: bars(
        'G4 - B4 - E5 - - -',
        'D5 - B4 - A4 - - -',
        'C5 - E5 - G5 - - -',
        'F#5 - - - D#5 - - -',
        'E5 - G5 - B5 - - -',
        'A5 - G5 - F#5 - E5 -',
        'C5 - B4 - A4 - G4 -',
        'F#4 - - - B4 - - -',
      ),
    },
    { noise: true, vol: 0.015, steps: drums('x . . . . . . .') },
  ],
}

const STORMPASS: MusicLoop = {
  bpm: 144,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        drive('G2', 'F2'),
        drive('G2', 'F2'),
        drive('Eb2', 'D2'),
        drive('F2', 'F2'),
        drive('G2', 'F2'),
        drive('G2', 'F2'),
        drive('Eb2', 'C2'),
        drive('D2', 'D2'),
      ),
    },
    {
      type: 'square',
      vol: 0.025,
      steps: bars(
        'G4 - Bb4 - D5 - G5 -',
        'F5 - - - D5 - - -',
        'Eb5 - D5 - C5 - Bb4 -',
        'A4 - - - F4 - - -',
        'G4 - Bb4 - D5 - G5 -',
        'A5 - - - G5 - F5 -',
        'Eb5 - - - D5 - C5 -',
        'D5 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.025, steps: drums('x . x . x . x x') },
  ],
}

const BELLTOWER: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('C2', 'G2'),
        walk('C2', 'G2'),
        walk('Ab1', 'Eb2'),
        walk('G1', 'D2'),
        walk('C2', 'G2'),
        walk('C2', 'G2'),
        walk('F1', 'C2'),
        walk('G1', 'D2'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'C5 . G5 . Eb5 . C5 .',
        'D5 . G4 . B4 . D5 .',
        'Ab4 . C5 . Eb5 . Ab5 .',
        'G5 - - - F5 - D5 -',
        'C5 . G5 . Eb5 . C5 .',
        'F5 . Ab5 . G5 . F5 .',
        'Eb5 - D5 - C5 - B4 -',
        'C5 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.02, steps: drums('x . . x . . x .') },
  ],
}

const ABBEY: MusicLoop = {
  bpm: 90,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        held('B1'),
        held('B1'),
        held('G1'),
        held('F#1'),
        held('B1'),
        held('B1'),
        held('E2'),
        held('F#1'),
      ),
    },
    {
      // The organ under the abbey.
      type: 'sawtooth',
      vol: 0.014,
      steps: bars(
        held('D3'),
        held('D3'),
        held('B2'),
        held('A#2'),
        held('D3'),
        held('D3'),
        held('G2'),
        held('A#2'),
      ),
    },
    {
      type: 'triangle',
      vol: 0.05,
      steps: bars(
        'F#4 - - - B4 - - -',
        'D5 - C#5 - B4 - - -',
        'G4 - - - B4 - D5 -',
        'C#5 - - - A#4 - - -',
        'B4 - D5 - F#5 - - -',
        'E5 - D5 - C#5 - - -',
        'D5 - B4 - G4 - E4 -',
        'F#4 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.012, steps: drums('x . . . . . . .') },
  ],
}

/** The headline bosses' theme: E harmonic minor, hard and fast. */
const BOSS: MusicLoop = {
  bpm: 156,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: bars(
        'E2 E2 E3 E2 E2 E2 E3 E2',
        'E2 E2 E3 E2 E2 E2 E3 E2',
        'C2 C2 C3 C2 C2 C2 C3 C2',
        'B1 B1 B2 B1 B1 B1 B2 B1',
        'E2 E2 E3 E2 E2 E2 E3 E2',
        'E2 E2 E3 E2 E2 E2 E3 E2',
        'A1 A1 A2 A1 A1 A1 A2 A1',
        'B1 B1 B2 B1 B1 B1 B2 B1',
      ),
    },
    {
      type: 'square',
      vol: 0.028,
      steps: bars(
        'E5 - D#5 - E5 - B4 -',
        'C5 - - - B4 - - -',
        'E5 - D#5 - E5 - G5 -',
        'F#5 - - - D#5 - - -',
        'G5 - F#5 - E5 - D#5 -',
        'E5 - B4 - G4 - E4 -',
        'C5 - B4 - A4 - G4 -',
        'F#4 - - - D#4 - - -',
      ),
    },
    { noise: true, vol: 0.03, steps: drums('x . x x x . x x') },
  ],
}

/** The Abbess: the boss theme a fourth lower and faster, with the organ back underneath. */
const FINALE: MusicLoop = {
  bpm: 164,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: bars(
        'B1 B1 B2 B1 B1 B1 B2 B1',
        'B1 B1 B2 B1 B1 B1 B2 B1',
        'G1 G1 G2 G1 G1 G1 G2 G1',
        'F#1 F#1 F#2 F#1 F#1 F#1 F#2 F#1',
        'B1 B1 B2 B1 B1 B1 B2 B1',
        'B1 B1 B2 B1 B1 B1 B2 B1',
        'E1 E1 E2 E1 E1 E1 E2 E1',
        'F#1 F#1 F#2 F#1 F#1 F#1 F#2 F#1',
      ),
    },
    {
      type: 'sawtooth',
      vol: 0.012,
      steps: bars(
        held('D3'),
        held('D3'),
        held('B2'),
        held('A#2'),
        held('D3'),
        held('D3'),
        held('G2'),
        held('A#2'),
      ),
    },
    {
      type: 'square',
      vol: 0.028,
      steps: bars(
        'B4 - A#4 - B4 - F#4 -',
        'G4 - - - F#4 - - -',
        'B4 - A#4 - B4 - D5 -',
        'C#5 - - - A#4 - - -',
        'D5 - C#5 - B4 - A#4 -',
        'B4 - F#4 - D4 - B3 -',
        'G4 - F#4 - E4 - D4 -',
        'C#4 - - - A#3 - - -',
      ),
    },
    { noise: true, vol: 0.03, steps: drums('x x x . x x x x') },
  ],
}

/** The ending: C major at last, slow, under the credits. */
const ENDING: MusicLoop = {
  bpm: 92,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('C2', 'G2'),
        walk('A1', 'E2'),
        walk('F1', 'C2'),
        walk('G1', 'D2'),
        walk('C2', 'G2'),
        walk('E2', 'B2'),
        walk('F1', 'C2'),
        walk('G1', 'D2'),
      ),
    },
    {
      type: 'triangle',
      vol: 0.05,
      steps: bars(
        'E5 - - - G5 - - -',
        'C5 - - - A4 - - -',
        'F5 - E5 - D5 - C5 -',
        'D5 - - - - - - -',
        'E5 - G5 - C6 - - -',
        'B5 - G5 - E5 - - -',
        'A5 - G5 - F5 - D5 -',
        'C5 - - - - - . .',
      ),
    },
  ],
}

/** Each painted world's theme. */
export const STAGE_MUSIC: Record<StageTheme, MusicLoop> = {
  town: TOWN,
  boneyard: BONEYARD,
  waterhole: WATERHOLE,
  stormpass: STORMPASS,
  belltower: BELLTOWER,
  abbey: ABBEY,
}

export const BOSS_MUSIC = BOSS
export const FINALE_MUSIC = FINALE
export const ENDING_MUSIC = ENDING

/** Every loop, for the tests. */
export const ALL_MUSIC: MusicLoop[] = [
  ...Object.values(STAGE_MUSIC),
  BOSS,
  FINALE,
  ENDING,
]

/** Ghost Trail's own sound effects (played through playNotes when the cabinet offers it). */
export const SFX = {
  /** The iai cut: a steel whisper and a ringing edge. */
  cut: [
    { freq: 3000, to: 400, dur: 0.18, noise: true, vol: 0.08 },
    { freq: 1800, to: 2700, dur: 0.12, type: 'triangle', vol: 0.05, at: 0.02 },
  ],
  /** A shot cut out of the air: a bright ting. */
  deflect: [
    { freq: 2400, dur: 0.05, type: 'square', vol: 0.04 },
    { freq: 3200, dur: 0.16, type: 'triangle', vol: 0.05, at: 0.04 },
  ],
  /** A boss appears: the great bell tolls once. */
  toll: [
    { freq: 110, dur: 1.4, type: 'triangle', vol: 0.14 },
    { freq: 220, dur: 1.0, type: 'sine', vol: 0.06 },
    { freq: 277, dur: 0.9, type: 'sine', vol: 0.04 },
    { freq: 330, dur: 0.7, type: 'sine', vol: 0.03 },
  ],
  /** A checkpoint lantern catches. */
  checkpoint: [
    { freq: 784, dur: 0.12, type: 'triangle', vol: 0.08 },
    { freq: 1175, dur: 0.3, type: 'triangle', vol: 0.07, at: 0.1 },
  ],
  /** A relic found: a cyan arpeggio. */
  relic: [
    { freq: 659, dur: 0.1, type: 'triangle', vol: 0.07 },
    { freq: 831, dur: 0.1, type: 'triangle', vol: 0.07, at: 0.08 },
    { freq: 988, dur: 0.1, type: 'triangle', vol: 0.07, at: 0.16 },
    { freq: 1319, dur: 0.35, type: 'triangle', vol: 0.07, at: 0.24 },
  ],
  /** The tide is turning: a slosh. */
  tide: [
    { freq: 400, to: 120, dur: 0.5, noise: true, vol: 0.05 },
    { freq: 300, to: 180, dur: 0.4, type: 'sine', vol: 0.04, at: 0.1 },
  ],
} satisfies Record<string, Note[]>

export type SfxName = keyof typeof SFX
