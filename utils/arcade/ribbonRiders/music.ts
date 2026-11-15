// /utils/arcade/ribbonRiders/music.ts
//
// Ribbon Riders' score (conductor kr-arcade/t-074), for the arcade's step sequencer (utils/arcade/
// sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original tunes, eight
// bars of eight steps (eighth notes) per track. The beat is the game's clock as well as the band's:
// gates open and shut on it, so every tell can be heard as well as seen.
//
//   Midway Lights  a bouncing E minor synth-pop loop under the festival's neon, 120 bpm.
//   Boardwalk      Boardwalk at Dusk's swung organ waltz-pop (t-075).
//   Frostlight     Frostlight Rink's chiming skate (t-075).
//   Grand Marshal  the boss march (t-075).

import type { MusicLoop } from '../sound'

/** Ticks per beat at 120 bpm, the festival's tempo. */
export const BEAT_TICKS = 30

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))
/** A driving bar: root on the beat, octave on the off-beat. */
const drive = (r: string, o: string) =>
  `${r} ${o} ${r} ${o} ${r} ${o} ${r} ${o}`

export const MIDWAY_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        drive('E2', 'E3'),
        drive('C2', 'C3'),
        drive('G2', 'G3'),
        drive('D2', 'D3'),
        drive('E2', 'E3'),
        drive('C2', 'C3'),
        drive('A2', 'A3'),
        drive('B1', 'B2'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'B4 - E5 - G5 . F#5 E5',
        'G5 - - . E5 - C5 .',
        'D5 - G5 - B5 . A5 G5',
        'A5 - - . F#5 - D5 .',
        'B4 - E5 - G5 . B5 A5',
        'G5 - E5 . C6 - B5 .',
        'A5 - E5 - C5 . E5 A5',
        'F#5 - D#5 - B4 - - .',
      ),
    },
    {
      type: 'sine',
      vol: 0.02,
      steps: eight('. . E6 . . . B5 .'),
    },
    { noise: true, vol: 0.016, steps: eight('x . x . x . x x') },
  ],
}

/** Boardwalk at Dusk: a lazy swung waltz-pop in F major, organ over a walking bass. */
export const BOARDWALK_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'F2 . A2 . C3 . A2 .',
        'D2 . F2 . A2 . F2 .',
        'A#1 . D2 . F2 . D2 .',
        'C2 . E2 . G2 . E2 .',
        'F2 . A2 . C3 . A2 .',
        'D2 . F2 . A2 . F2 .',
        'A#1 . D2 . G2 . E2 .',
        'C2 . G2 . C3 . - .',
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'C5 - A4 - F4 . A4 C5',
        'D5 - - . A4 - F4 .',
        'D5 - A#4 - F4 . A#4 D5',
        'E5 - - . C5 - G4 .',
        'F5 - C5 - A4 . C5 F5',
        'E5 - D5 . C5 - A4 .',
        'A#4 - D5 - G5 . F5 E5',
        'F5 - - - C5 - - .',
      ),
    },
    { type: 'sine', vol: 0.02, steps: eight('. . A5 . . . C6 .') },
    { noise: true, vol: 0.012, steps: eight('x . . x . . x .') },
  ],
}

/** Frostlight Rink: a bright, chiming A minor skate in quarter-note glides. */
export const FROSTLIGHT_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.065,
      steps: bars(
        drive('A2', 'E3'),
        drive('F2', 'C3'),
        drive('C2', 'G2'),
        drive('G2', 'D3'),
        drive('A2', 'E3'),
        drive('F2', 'C3'),
        drive('D2', 'A2'),
        drive('E2', 'B2'),
      ),
    },
    {
      type: 'sine',
      vol: 0.03,
      steps: bars(
        'E5 - - - A5 - - -',
        'C6 - - - A5 - G5 -',
        'G5 - - - E5 - - -',
        'D5 - - - G5 - B5 -',
        'C6 - - - B5 - A5 -',
        'A5 - - - F5 - - -',
        'F5 - A5 - D6 - C6 -',
        'B5 - - - G#5 - - -',
      ),
    },
    { type: 'square', vol: 0.012, steps: eight('E6 . . A6 . . E6 .') },
    { noise: true, vol: 0.01, steps: eight('x . . . x . . .') },
  ],
}

/** A Grand Marshal's fanfare-march: brassy D minor stabs over a pounding drum. */
export const MARSHAL_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: bars(
        drive('D2', 'D3'),
        drive('D2', 'D3'),
        drive('A#1', 'A#2'),
        drive('C2', 'C3'),
        drive('D2', 'D3'),
        drive('D2', 'D3'),
        drive('G1', 'G2'),
        drive('A1', 'A2'),
      ),
    },
    {
      type: 'square',
      vol: 0.024,
      steps: bars(
        'D5 . D5 . F5 - A5 .',
        'G5 - F5 . E5 - D5 .',
        'F5 . F5 . A#5 - A5 .',
        'G5 - E5 . C5 - - .',
        'D5 . D5 . F5 - A5 .',
        'D6 - C6 . A#5 - A5 .',
        'G5 - A#5 . D6 - A#5 .',
        'A5 - - . C#5 - E5 .',
      ),
    },
    { noise: true, vol: 0.02, steps: eight('x . x x x . x x') },
  ],
}
