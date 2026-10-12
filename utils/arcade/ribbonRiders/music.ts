// /utils/arcade/ribbonRiders/music.ts
//
// Ribbon Riders' score (conductor kr-arcade/t-074), for the arcade's step sequencer (utils/arcade/
// sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original tunes, eight
// bars of eight steps (eighth notes) per track. The beat is the game's clock as well as the band's:
// gates open and shut on it, so every tell can be heard as well as seen.
//
//   Midway Lights  a bouncing E minor synth-pop loop under the festival's neon, 120 bpm.

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
