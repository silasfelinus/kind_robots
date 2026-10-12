// /utils/arcade/bumperBubbles/music.ts
//
// Fizzwick Tower's score (conductor kr-arcade/t-059): an original chiptune loop per
// wing for the arcade's step sequencer (utils/arcade/sound.ts: note tokens, `-`
// holds, `.` rests, `x` hits on a noise track), eight bars of eight steps. When the
// floor timer runs out the same loop plays a third faster: the classic's hurry.
//
//   Bottling Hall    a bouncy clink-clank march, bottles rattling down the line.
//   Gumdrop Gardens  a skipping, sugary waltz-time tune in G.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
/** Root, fifth, octave, fifth on the beats. */
const walk = (r: string, f: string, o: string) => `${r} . ${f} . ${o} . ${f} .`

const BOTTLING: MusicLoop = {
  bpm: 132,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('C3', 'G2', 'C3'),
        walk('A2', 'E2', 'A2'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'D3', 'G3'),
        walk('C3', 'G2', 'C3'),
        walk('E2', 'B2', 'E3'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'B2', 'D3'),
      ),
    },
    {
      type: 'square',
      vol: 0.032,
      steps: bars(
        'E5 . G5 . C6 - G5 .',
        'A5 . E5 . C5 - . .',
        'F5 . A5 . C6 . A5 .',
        'B5 - G5 . D5 - . .',
        'E5 . G5 . C6 - E6 .',
        'D6 . B5 . G#5 - . .',
        'A5 . C6 . F5 . A5 .',
        'G5 - F5 . D5 . B4 .',
      ),
    },
    {
      type: 'square',
      vol: 0.012,
      steps: bars(
        ...Array(4).fill('. C6 . . . E6 . .'),
        ...Array(4).fill('. A5 . . . F5 . .'),
      ),
    },
    {
      noise: true,
      vol: 0.022,
      steps: bars(...Array(8).fill('x . x . x . x x')),
    },
  ],
}

const GARDENS: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'G2 - - D3 - - B2 -',
        'C3 - - G3 - - E3 -',
        'G2 - - D3 - - B2 -',
        'D3 - - A3 - - F#3 -',
        'E3 - - B3 - - G3 -',
        'C3 - - G3 - - E3 -',
        'A2 - - E3 - - C3 -',
        'D3 - - A3 - - D3 -',
      ),
    },
    {
      type: 'sine',
      vol: 0.055,
      steps: bars(
        'B4 - D5 - G5 - F#5 -',
        'E5 - G5 - C6 - - -',
        'B5 - A5 - G5 - D5 -',
        'F#5 - A5 - D6 - - -',
        'G5 - B5 - E6 - D6 -',
        'C6 - B5 - G5 - E5 -',
        'A5 - G5 - E5 - C5 -',
        'D5 - F#5 - A5 - - -',
      ),
    },
    {
      type: 'square',
      vol: 0.012,
      steps: bars(
        ...Array(4).fill('. . G6 . . . D6 .'),
        ...Array(4).fill('. . E6 . . . C6 .'),
      ),
    },
    {
      noise: true,
      vol: 0.016,
      steps: bars(...Array(8).fill('x . . . x . x .')),
    },
  ],
}

export const MUSIC: Record<string, MusicLoop> = {
  bottling: BOTTLING,
  gardens: GARDENS,
}

/** Each wing's loop a third faster, for the hurry (the same object every time it is asked for). */
export const HURRY_MUSIC: Record<string, MusicLoop> = Object.fromEntries(
  Object.entries(MUSIC).map(([id, loop]) => [
    id,
    { ...loop, bpm: Math.round(loop.bpm * 1.33) },
  ]),
)
