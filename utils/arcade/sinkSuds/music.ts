// /utils/arcade/sinkSuds/music.ts
//
// Sink Suds' score (conductor kr-arcade/t-044): an original chiptune loop per
// room, one for the bosses and one for the Soap Shop, for the arcade's step
// sequencer (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits
// on a noise track). Eight bars of eight steps (eighth notes) per track.
//
//   Kitchen   a bouncy major washing-up shuffle, plinky like cutlery.
//   Bath      a lazy waltz-ish sway in thirds, all bubbles and echo.
//   Boss      a minor-key scrub-scrub drive.
//   Shop      a little music-box tune while you count your soap.

import type { MusicLoop } from '../sound'
import type { MusicId } from './rooms'

const bars = (...b: string[]) => b.join(' ')
/** A walking bar: root, fifth, octave, fifth on the beats. */
const walk = (r: string, f: string, o: string) => `${r} . ${f} . ${o} . ${f} .`
/** Eighth notes pumping on the root. */
const pump = (r: string) => `${r} ${r} ${r} ${r} ${r} ${r} ${r} ${r}`

const KITCHEN: MusicLoop = {
  bpm: 138,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('F2', 'C3', 'F3'),
        walk('D2', 'A2', 'D3'),
        walk('Bb2', 'F2', 'Bb2'),
        walk('C3', 'G2', 'C3'),
        walk('F2', 'C3', 'F3'),
        walk('D2', 'A2', 'D3'),
        walk('G2', 'D3', 'G3'),
        walk('C3', 'E3', 'G3'),
      ),
    },
    {
      type: 'square',
      vol: 0.035,
      steps: bars(
        'A4 . C5 . F5 - E5 .',
        'D5 . C5 . A4 - . .',
        'Bb4 . D5 . F5 - D5 .',
        'E5 . G5 . C5 - . .',
        'A4 . C5 . F5 - A5 .',
        'G5 . F5 . D5 - . .',
        'Bb4 . A4 . G4 . Bb4 .',
        'C5 . E5 . G5 - - .',
      ),
    },
    {
      noise: true,
      vol: 0.025,
      steps: bars(...Array(8).fill('x . . x . . x .')),
    },
  ],
}

const BATH: MusicLoop = {
  bpm: 112,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'C3 - - G3 - - E3 -',
        'A2 - - E3 - - C3 -',
        'F2 - - C3 - - A2 -',
        'G2 - - D3 - - B2 -',
        'C3 - - G3 - - E3 -',
        'A2 - - E3 - - C3 -',
        'D3 - - A3 - - F3 -',
        'G2 - - D3 - - G3 -',
      ),
    },
    {
      type: 'sine',
      vol: 0.05,
      steps: bars(
        'E5 - G5 - E5 - C5 -',
        'C5 - E5 - A5 - - -',
        'F5 - A5 - F5 - C5 -',
        'D5 - - - B4 - - -',
        'E5 - G5 - C6 - B5 -',
        'A5 - G5 - E5 - - -',
        'F5 - E5 - D5 - A4 -',
        'B4 - D5 - G5 - - -',
      ),
    },
    {
      type: 'square',
      vol: 0.015,
      steps: bars(
        ...Array(4).fill('. . G6 . . . E6 .'),
        ...Array(4).fill('. . A6 . . . F6 .'),
      ),
    },
  ],
}

const BOSS: MusicLoop = {
  bpm: 150,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.04,
      steps: bars(
        pump('A2'),
        pump('A2'),
        pump('F2'),
        pump('G2'),
        pump('A2'),
        pump('A2'),
        pump('D3'),
        pump('E3'),
      ),
    },
    {
      type: 'square',
      vol: 0.035,
      steps: bars(
        'A4 . C5 . E5 . A5 .',
        'G5 - E5 . C5 . D5 .',
        'F5 . A4 . C5 . F5 .',
        'G5 - - . D5 . B4 .',
        'A4 . E5 . A5 . C6 .',
        'B5 - G5 . E5 . C5 .',
        'D5 . F5 . A5 . D6 .',
        'E5 - G#5 - B5 - E5 .',
      ),
    },
    {
      noise: true,
      vol: 0.035,
      steps: bars(...Array(8).fill('x . x . x x x .')),
    },
  ],
}

const SHOP: MusicLoop = {
  bpm: 100,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        walk('G2', 'D3', 'G3'),
        walk('E2', 'B2', 'E3'),
        walk('C3', 'G2', 'C3'),
        walk('D3', 'A2', 'D3'),
        walk('G2', 'D3', 'G3'),
        walk('E2', 'B2', 'E3'),
        walk('A2', 'E3', 'A3'),
        walk('D3', 'F#3', 'A3'),
      ),
    },
    {
      type: 'sine',
      vol: 0.05,
      steps: bars(
        'B5 . D6 . G6 . D6 .',
        'G5 . B5 . E6 . B5 .',
        'E6 . C6 . G5 . C6 .',
        'F#5 . A5 . D6 - - .',
        'B5 . D6 . G6 . B6 .',
        'A6 . G6 . E6 . B5 .',
        'C6 . E6 . A6 . E6 .',
        'D6 . C6 . A5 - - .',
      ),
    },
  ],
}

export const MUSIC: Record<MusicId, MusicLoop> = {
  kitchen: KITCHEN,
  bath: BATH,
  boss: BOSS,
  shop: SHOP,
}
