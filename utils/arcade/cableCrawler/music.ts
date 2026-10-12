// /utils/arcade/cableCrawler/music.ts
//
// Cable Crawler's score (conductor kr-arcade/t-064): a chiptune loop per component, one for the
// boss boards, one for the Screensavers, for the arcade's step sequencer (utils/arcade/sound.ts:
// note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original tunes, eight bars of
// eight steps (eighth notes) per track:
//
//   The Power Strip   a perky hum in D with a ticking hi-hat, like a busy little relay.
//   Boss              a stomping minor march in E for the big glitches.
//   Screensaver       a floaty, slow drift in F over a soft pad.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))
/** A walking bar: root, fifth, octave, fifth. */
const walk = (r: string, f: string, o: string) => `${r} . ${f} . ${o} . ${f} .`

export const POWER_STRIP_MUSIC: MusicLoop = {
  bpm: 132,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('D3', 'A3', 'D4'),
        walk('B2', 'F#3', 'B3'),
        walk('G2', 'D3', 'G3'),
        walk('A2', 'E3', 'A3'),
        walk('D3', 'A3', 'D4'),
        walk('F#2', 'C#3', 'F#3'),
        walk('G2', 'D3', 'G3'),
        walk('A2', 'E3', 'C#4'),
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'F#5 . A5 . D6 - A5 .',
        'B5 . A5 . F#5 . D5 .',
        'G5 . B5 . D6 . G6 .',
        'E6 - - . C#6 . A5 .',
        'F#5 . A5 . D6 . F#6 .',
        'E6 . D6 . C#6 . A5 .',
        'B5 . D6 . G6 - F#6 .',
        'E6 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.014, steps: eight('x . x . x . x x') },
  ],
}

export const BOSS_MUSIC: MusicLoop = {
  bpm: 144,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.028,
      steps: bars(
        'E2 E2 . E2 G2 . E2 .',
        'E2 E2 . E2 B2 . A2 .',
        'C2 C2 . C2 E2 . C2 .',
        'D2 D2 . D2 F#2 . A2 .',
        'E2 E2 . E2 G2 . E2 .',
        'E2 E2 . E2 B2 . D3 .',
        'C2 C2 . C2 B1 . A1 .',
        'B1 - B1 . D#2 . F#2 .',
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'E5 - - . B4 . E5 .',
        'G5 - F#5 . E5 . D5 .',
        'C5 - - . G4 . C5 .',
        'D5 - E5 . F#5 . A5 .',
        'E5 - - . B4 . E5 .',
        'G5 - A5 . B5 . D6 .',
        'C6 - B5 . A5 . G5 .',
        'F#5 - - - D#5 - - .',
      ),
    },
    { noise: true, vol: 0.028, steps: eight('x . . x x . x .') },
  ],
}

export const SCREENSAVER_MUSIC: MusicLoop = {
  bpm: 96,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'F2 - - - C3 - - -',
        'D2 - - - A2 - - -',
        'Bb2 - - - F3 - - -',
        'C3 - - - G3 - - -',
        'F2 - - - C3 - - -',
        'A2 - - - E3 - - -',
        'Bb2 - - - C3 - - -',
        'F2 - - - - - - -',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'A5 . C6 . F6 . C6 .',
        'A5 . D6 . F6 . D6 .',
        'Bb5 . D6 . F6 . D6 .',
        'C6 . E6 . G6 . E6 .',
        'A5 . C6 . F6 . A6 .',
        'G6 . F6 . E6 . C6 .',
        'D6 . F6 . E6 . G6 .',
        'F6 - - - . . . .',
      ),
    },
  ],
}

// --- RAM Rows, the Cooling Fan and the Workbench (t-065) -----------------------------------------
//
//   RAM Rows      a busy, clockwork arpeggio in A minor, ticking like a memory refresh.
//   Cooling Fan   an airy waltz-in-eights in E, a whooshing hi-hat for the blades.
//   Workbench     a slow, warm shop tune in C: a place to count your copper.

/** A rolling bar: root, third, fifth, octave, up and back. */
const roll = (r: string, t: string, f: string, o: string) =>
  `${r} ${t} ${f} ${o} ${f} ${t} ${r} ${t}`

export const RAM_ROWS_MUSIC: MusicLoop = {
  bpm: 138,
  tracks: [
    {
      type: 'triangle',
      vol: 0.065,
      steps: bars(
        'A2 . A2 . E3 . A2 .',
        'F2 . F2 . C3 . F2 .',
        'D2 . D2 . A2 . D2 .',
        'E2 . E2 . B2 . G#2 .',
        'A2 . A2 . E3 . A2 .',
        'F2 . F2 . C3 . F2 .',
        'G2 . G2 . D3 . G2 .',
        'E2 . E2 . B2 . E3 .',
      ),
    },
    {
      type: 'square',
      vol: 0.016,
      steps: bars(
        roll('A4', 'C5', 'E5', 'A5'),
        roll('F4', 'A4', 'C5', 'F5'),
        roll('D4', 'F4', 'A4', 'D5'),
        roll('E4', 'G#4', 'B4', 'E5'),
        roll('A4', 'C5', 'E5', 'A5'),
        roll('F4', 'A4', 'C5', 'F5'),
        roll('G4', 'B4', 'D5', 'G5'),
        roll('E4', 'G#4', 'B4', 'E5'),
      ),
    },
    { noise: true, vol: 0.012, steps: eight('x . . x . x . .') },
  ],
}

export const COOLING_FAN_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.065,
      steps: bars(
        'E3 . . B3 . . E4 .',
        'C#3 . . G#3 . . C#4 .',
        'A2 . . E3 . . A3 .',
        'B2 . . F#3 . . B3 .',
        'E3 . . B3 . . E4 .',
        'G#2 . . D#3 . . G#3 .',
        'A2 . . E3 . . B2 .',
        'B2 . . F#3 . . B3 .',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'G#5 - - B5 - - E6 -',
        'E6 - - C#6 - - G#5 -',
        'A5 - - C#6 - - E6 -',
        'F#6 - - D#6 - - B5 -',
        'G#5 - - B5 - - E6 -',
        'D#6 - - C6 - - G#5 -',
        'A5 - - C#6 - - E6 -',
        'F#6 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.01, steps: eight('x x . x x . x .') },
  ],
}

export const WORKBENCH_MUSIC: MusicLoop = {
  bpm: 88,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'C3 - - - G2 - - -',
        'A2 - - - E2 - - -',
        'F2 - - - C3 - - -',
        'G2 - - - D3 - - -',
        'C3 - - - G2 - - -',
        'A2 - - - E3 - - -',
        'F2 - - - G2 - - -',
        'C3 - - - - - - -',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'E5 . G5 . C6 . G5 .',
        'E5 . A5 . C6 . A5 .',
        'F5 . A5 . C6 . A5 .',
        'G5 . B5 . D6 . B5 .',
        'E5 . G5 . C6 . E6 .',
        'D6 . C6 . A5 . E5 .',
        'F5 . A5 . G5 . B5 .',
        'C6 - - - . . . .',
      ),
    },
  ],
}
