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
