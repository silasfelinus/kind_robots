// /utils/arcade/butterflyJoust/music.ts
//
// Butterfly Joust's score (conductor kr-arcade/t-048): a chiptune loop for each garden, one for the
// champion bouts and one for the Wing Garden, for the arcade's step sequencer (utils/arcade/
// sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original tunes, eight
// bars of eight steps per track:
//
//   Sunset Pond    a slow, dreamy dusk theme in A minor over a rocking bass.
//   Spring Meadow  a bright G major skip with a bird-call lead.
//   Champion       a minor-key gallop for the bouts.
//   Wing Garden    a gentle music-box waltz between arenas.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))
/** A rocking bar: root and fifth, back and forth. */
const rock = (r: string, f: string) => `${r} - ${f} - ${r} - ${f} -`
/** A skipping bar: root, octave, fifth, octave. */
const skip = (r: string, o: string, f: string) =>
  `${r} . ${o} ${f} ${r} . ${o} ${f}`
/** A gallop: root root-root on every beat. */
const gallop = (r: string) => `${r} . ${r} ${r} ${r} . ${r} ${r}`

export const SUNSET_MUSIC: MusicLoop = {
  bpm: 96,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        rock('A2', 'E3'),
        rock('F2', 'C3'),
        rock('C3', 'G3'),
        rock('G2', 'D3'),
        rock('A2', 'E3'),
        rock('F2', 'C3'),
        rock('D3', 'A3'),
        rock('E2', 'B2'),
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'E5 - - . C5 . D5 E5',
        'F5 - E5 . C5 - - .',
        'G5 - - . E5 . D5 C5',
        'D5 - - - B4 - - .',
        'E5 - - . A5 . G5 E5',
        'F5 - A5 . C6 - B5 A5',
        'B5 - A5 . F5 . D5 .',
        'E5 - - - - . . .',
      ),
    },
    { noise: true, vol: 0.012, steps: eight('x . . . . . x .') },
  ],
}

export const MEADOW_MUSIC: MusicLoop = {
  bpm: 126,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        skip('G2', 'G3', 'D3'),
        skip('C3', 'C4', 'G3'),
        skip('D3', 'D4', 'A3'),
        skip('G2', 'G3', 'D3'),
        skip('E3', 'E4', 'B3'),
        skip('C3', 'C4', 'G3'),
        skip('A2', 'A3', 'E3'),
        skip('D3', 'D4', 'A3'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'D5 G5 B5 . A5 G5 E5 .',
        'E5 - G5 . C6 - B5 .',
        'A5 F#5 D5 . F#5 A5 D6 .',
        'B5 - G5 - D5 . . .',
        'E5 G5 B5 . B5 A5 G5 .',
        'C6 - B5 . A5 - G5 .',
        'F#5 - A5 . G5 - E5 .',
        'D5 - - - D6 . D6 .',
      ),
    },
    { noise: true, vol: 0.016, steps: eight('x . x . x . x x') },
  ],
}

export const CHAMPION_MUSIC: MusicLoop = {
  bpm: 148,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: bars(
        gallop('D2'),
        gallop('D2'),
        gallop('Bb1'),
        gallop('C2'),
        gallop('D2'),
        gallop('F2'),
        gallop('G2'),
        gallop('A1'),
      ),
    },
    {
      type: 'square',
      vol: 0.026,
      steps: bars(
        'D5 - A4 . D5 E5 F5 .',
        'E5 - D5 . C#5 - A4 .',
        'Bb4 - D5 . F5 - D5 .',
        'C5 - E5 . G5 - E5 .',
        'D5 - F5 . A5 - G5 F5',
        'A5 - C6 . A5 - F5 .',
        'G5 - Bb5 . G5 - D5 .',
        'A5 - - - C#5 - E5 -',
      ),
    },
    { noise: true, vol: 0.022, steps: eight('x . x x x . x x') },
  ],
}

export const GARDEN_MUSIC: MusicLoop = {
  bpm: 110,
  stepsPerBeat: 2,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'F2 . A2 . C3 .',
        'F2 . A2 . C3 .',
        'Bb2 . D3 . F3 .',
        'C3 . E3 . G3 .',
        'F2 . A2 . C3 .',
        'D3 . F3 . A3 .',
        'Bb2 . D3 . G3 .',
        'C3 . E3 . G3 .',
      ),
    },
    {
      type: 'sine',
      vol: 0.045,
      steps: bars(
        'C6 - A5 . F5 .',
        'G5 - A5 . C6 .',
        'D6 - C6 . Bb5 .',
        'G5 - - . . .',
        'A5 - C6 . F6 .',
        'E6 - D6 . A5 .',
        'Bb5 - D6 . C6 .',
        'C6 - - . . .',
      ),
    },
  ],
}
