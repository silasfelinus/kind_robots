// /utils/arcade/seedBurst/music.ts
//
// Seed Burst's score (conductor kr-arcade/t-137): a chiptune loop per season, one for the bosses,
// one for the Bonus Beds and one for the Potting Shed, for the arcade's step sequencer
// (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original
// tunes, eight bars of eight steps (eighth notes) per track:
//
//   Spring   a skipping little march in G, like a wheelbarrow on a gravel path.
//   Summer   a lazy, warm sway in F with a dripping sprinkler hi-hat.
//   Boss     a grumbling minor stomp in D.
//   Bonus    a quick, bright run in C for the Bonus Beds.
//   Shed     a gentle tick-tock waltz-ish loop in A for the Potting Shed.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))
const walk = (r: string, f: string, o: string) => `${r} . ${f} . ${o} . ${f} .`

export const SPRING_MUSIC: MusicLoop = {
  bpm: 124,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('G2', 'D3', 'G3'),
        walk('C3', 'G3', 'C4'),
        walk('G2', 'D3', 'G3'),
        walk('D3', 'A3', 'D4'),
        walk('E3', 'B3', 'E4'),
        walk('C3', 'G3', 'C4'),
        walk('D3', 'A3', 'D4'),
        walk('G2', 'D3', 'G3'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'G5 . B5 . D6 . B5 .',
        'C6 . E6 . G6 - E6 .',
        'D6 . B5 . G5 . A5 .',
        'F#5 - A5 . D6 - - .',
        'E6 . D6 . B5 . G5 .',
        'C6 . E6 . G6 . E6 .',
        'D6 . F#6 . A6 . F#6 .',
        'G6 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.012, steps: eight('x . . x x . . .') },
  ],
}

export const SUMMER_MUSIC: MusicLoop = {
  bpm: 104,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'F2 - . F2 C3 - A2 .',
        'Bb2 - . Bb2 F3 - D3 .',
        'C3 - . C3 G3 - E3 .',
        'F2 - . F2 C3 - A2 .',
        'D3 - . D3 A3 - F3 .',
        'Bb2 - . Bb2 F3 - D3 .',
        'C3 - . C3 G3 - E3 .',
        'F2 - - - C3 - - .',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'A5 - - . C6 - A5 .',
        'D6 - - . F6 - D6 .',
        'E6 - - . G6 - E6 .',
        'F6 - - - C6 - - .',
        'D6 - - . F6 - A6 .',
        'G6 - F6 . D6 - Bb5 .',
        'C6 - E6 . G6 - E6 .',
        'F6 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.01, steps: eight('. x . x . x x x') },
  ],
}

export const BOSS_MUSIC: MusicLoop = {
  bpm: 140,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.026,
      steps: bars(
        'D2 D2 . D2 F2 . D2 .',
        'D2 D2 . D2 A2 . G2 .',
        'Bb1 Bb1 . Bb1 D2 . Bb1 .',
        'C2 C2 . C2 E2 . G2 .',
        'D2 D2 . D2 F2 . D2 .',
        'D2 D2 . D2 A2 . C3 .',
        'Bb1 Bb1 . Bb1 A1 . G1 .',
        'A1 - A1 . C#2 . E2 .',
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'D5 . . F5 . . A5 .',
        'G5 - F5 . E5 . D5 .',
        'F5 . . Bb5 . . D6 .',
        'C6 - Bb5 . A5 . G5 .',
        'D5 . . F5 . . A5 .',
        'C6 - Bb5 . A5 . F5 .',
        'G5 . F5 . E5 . D5 .',
        'C#5 - - - E5 - - .',
      ),
    },
    { noise: true, vol: 0.016, steps: eight('x . x x . x x .') },
  ],
}

export const BONUS_MUSIC: MusicLoop = {
  bpm: 152,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('C3', 'G3', 'C4'),
        walk('A2', 'E3', 'A3'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'D3', 'G3'),
        walk('C3', 'G3', 'C4'),
        walk('A2', 'E3', 'A3'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'D3', 'B3'),
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'C6 E6 G6 E6 C6 E6 G6 C7',
        'A5 C6 E6 C6 A5 C6 E6 A6',
        'F5 A5 C6 A5 F5 A5 C6 F6',
        'G5 B5 D6 B5 G5 B5 D6 G6',
        'C6 E6 G6 E6 C6 E6 G6 C7',
        'A5 C6 E6 C6 A5 C6 E6 A6',
        'F5 A5 C6 F6 E6 C6 A5 F5',
        'G5 - B5 - D6 - G6 -',
      ),
    },
    { noise: true, vol: 0.012, steps: eight('x . x . x . x .') },
  ],
}

export const SHED_MUSIC: MusicLoop = {
  bpm: 92,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'A2 . E3 . C#3 . E3 .',
        'D3 . A3 . F#3 . A3 .',
        'A2 . E3 . C#3 . E3 .',
        'E3 . B3 . G#3 . B3 .',
        'F#2 . C#3 . A2 . C#3 .',
        'D3 . A3 . F#3 . A3 .',
        'E3 . B3 . G#3 . B3 .',
        'A2 . E3 . A3 - - .',
      ),
    },
    {
      type: 'sine',
      vol: 0.035,
      steps: bars(
        'C#5 - - . E5 - - .',
        'F#5 - - . D5 - - .',
        'E5 - C#5 . A4 - - .',
        'B4 - - . G#4 - - .',
        'A4 - C#5 . F#5 - - .',
        'F#5 - E5 . D5 - - .',
        'E5 - D5 . B4 - - .',
        'A4 - - - - - . .',
      ),
    },
  ],
}
