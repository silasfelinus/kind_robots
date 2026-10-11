// /utils/arcade/rescueRally/music.ts
//
// Rescue Rally's score (conductor kr-arcade t-036): a loop per district, one for the bosses and one for
// the Shelter, for the arcade's step sequencer (utils/arcade/sound.ts: note tokens, `-` holds, `.`
// rests, `x` hits on a noise track). Original tunes, eight bars of eight steps (eighth notes):
//
//   Neon Plaza   a driving minor-key synth run over a pumping bass, the city at night.
//   Toy Factory  a clockwork tick-tock in a major key, all plinks and wind-up runs.
//   Boss         a tense half-step drive.
//   Shelter      slow and warm, everyone home for a moment.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))
/** Eighth notes pumping on the root. */
const pump = (r: string) => `${r} ${r} ${r} ${r} ${r} ${r} ${r} ${r}`
/** A clockwork bar: root and fifth ticking back and forth. */
const tick = (r: string, f: string) => `${r} . ${f} . ${r} . ${f} .`

export const PLAZA_MUSIC: MusicLoop = {
  bpm: 140,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        pump('A2'),
        pump('A2'),
        pump('F2'),
        pump('G2'),
        pump('A2'),
        pump('A2'),
        pump('D3'),
        pump('E2'),
      ),
    },
    {
      type: 'square',
      vol: 0.024,
      steps: bars(
        'A4 . C5 . E5 - D5 C5',
        'E5 - . . A5 . G5 .',
        'F5 . E5 . C5 - A4 .',
        'G4 - B4 . D5 - . .',
        'A4 . C5 . E5 - G5 .',
        'A5 - G5 . E5 . C5 .',
        'D5 . F5 . A5 - F5 .',
        'E5 - - . G#4 - B4 .',
      ),
    },
    { noise: true, vol: 0.02, steps: eight('x . . x x . x .') },
  ],
}

export const FACTORY_MUSIC: MusicLoop = {
  bpm: 124,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        tick('C3', 'G2'),
        tick('C3', 'G2'),
        tick('F2', 'C3'),
        tick('G2', 'D3'),
        tick('C3', 'G2'),
        tick('A2', 'E3'),
        tick('F2', 'C3'),
        tick('G2', 'B2'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'C6 . G5 . E5 . G5 .',
        'C6 . D6 . E6 - . .',
        'F5 . A5 . C6 . A5 .',
        'G5 . B5 . D6 - . .',
        'E6 . D6 . C6 . G5 .',
        'A5 . C6 . E6 - D6 .',
        'C6 . A5 . F5 . A5 .',
        'G5 A5 B5 C6 D6 - . .',
      ),
    },
    { noise: true, vol: 0.016, steps: eight('x . x . x . x .') },
  ],
}

export const BOSS_MUSIC: MusicLoop = {
  bpm: 150,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.035,
      steps: bars(
        pump('E2'),
        pump('F2'),
        pump('E2'),
        pump('F2'),
        pump('D2'),
        pump('E2'),
        pump('C2'),
        pump('B1'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'E4 - B4 - E5 - D5 -',
        'C5 - B4 - A4 - B4 -',
        'E4 - B4 - E5 - F5 -',
        'E5 - D5 - C5 - B4 -',
        'D4 - A4 - D5 - C5 -',
        'B4 - A4 - G4 - A4 -',
        'C5 - E5 - G5 - E5 -',
        'D#5 - - - B4 - - -',
      ),
    },
    { noise: true, vol: 0.024, steps: eight('x . x x . x x .') },
  ],
}

export const SHELTER_MUSIC: MusicLoop = {
  bpm: 92,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'F2 - - - C3 - - -',
        'D2 - - - A2 - - -',
        'Bb2 - - - F2 - - -',
        'C3 - - - G2 - - -',
        'F2 - - - C3 - - -',
        'A2 - - - E2 - - -',
        'Bb2 - - - C3 - - -',
        'F2 - - - - - - -',
      ),
    },
    {
      type: 'triangle',
      vol: 0.04,
      steps: bars(
        'A4 - C5 - F5 - E5 -',
        'D5 - - - A4 - - -',
        'Bb4 - D5 - F5 - G5 -',
        'E5 - - - C5 - - -',
        'A4 - C5 - F5 - A5 -',
        'G5 - E5 - C5 - - -',
        'D5 - F5 - E5 - G5 -',
        'F5 - - - - - - -',
      ),
    },
  ],
}
