// /utils/arcade/batteryMaze/music.ts
//
// Battery Maze's score (conductor kr-arcade/t-040): a chiptune loop per board, one for the boss
// mazes, one for the Charging Bay and one for the story breaks, for the arcade's step sequencer
// (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original
// tunes, eight bars of eight steps (eighth notes) per track:
//
//   Cozy Charger   a sunny little hum in G with a bouncing bass, like a charger's busy light.
//   Toaster Works  a swung breakfast shuffle in F, all pops and clicks.
//   Boss           a minor-key march for the big gremlins.
//   Charging Bay   slow and warm: a place to catch your breath and shop.
//   Story          a soft music-box waltz-in-eights under the comics.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))
/** A bouncing bar: root, octave, fifth, octave. */
const bounce = (r: string, o: string, f: string) =>
  `${r} . ${o} . ${f} . ${o} .`
const oompah = (r: string, f: string) => `${r} . ${f} ${f} ${r} . ${f} ${f}`

export const COZY_MUSIC: MusicLoop = {
  bpm: 128,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        bounce('G2', 'G3', 'D3'),
        bounce('E2', 'E3', 'B2'),
        bounce('C3', 'C4', 'G3'),
        bounce('D3', 'D4', 'A3'),
        bounce('G2', 'G3', 'D3'),
        bounce('B2', 'B3', 'F#3'),
        bounce('C3', 'C4', 'G3'),
        bounce('D3', 'D4', 'F#3'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'B5 . D6 . G5 . . .',
        'E6 - D6 . B5 . G5 .',
        'C6 . E6 . G6 - E6 .',
        'D6 - - . A5 . F#5 .',
        'G5 . B5 . D6 . G6 .',
        'F#6 - E6 . D6 . B5 .',
        'C6 . A5 . E6 . C6 .',
        'D6 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.016, steps: eight('x . . x . . x .') },
  ],
}

export const TOASTER_MUSIC: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        oompah('F2', 'C3'),
        oompah('A2', 'E3'),
        oompah('Bb2', 'F3'),
        oompah('C3', 'G3'),
        oompah('F2', 'C3'),
        oompah('D3', 'A3'),
        oompah('Bb2', 'F3'),
        oompah('C3', 'E3'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'C6 . A5 . F5 . A5 C6',
        'E6 - C6 . A5 . . .',
        'D6 . Bb5 . F5 . D6 .',
        'C6 - - . G5 . E5 .',
        'F5 . A5 . C6 . F6 .',
        'E6 . D6 . A5 . F5 .',
        'G5 . Bb5 . D6 . C6 .',
        'F5 - - - . . . .',
      ),
    },
    { type: 'sine', vol: 0.03, steps: eight('. . . . . . F6 .') },
    { noise: true, vol: 0.02, steps: eight('x . x . . x . x') },
  ],
}

export const BOSS_MUSIC: MusicLoop = {
  bpm: 140,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.03,
      steps: bars(
        'A2 A2 . A2 C3 . A2 .',
        'A2 A2 . A2 E3 . D3 .',
        'F2 F2 . F2 A2 . F2 .',
        'G2 G2 . G2 B2 . E3 .',
        'A2 A2 . A2 C3 . A2 .',
        'A2 A2 . A2 E3 . G3 .',
        'F2 F2 . F2 E2 . D2 .',
        'E2 - E2 . G#2 . B2 .',
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'A5 - - . E5 . A5 .',
        'C6 - B5 . A5 . G5 .',
        'F5 - - . C5 . F5 .',
        'G5 - A5 . B5 . E5 .',
        'A5 - - . E5 . A5 .',
        'C6 - D6 . E6 . G6 .',
        'F6 - E6 . D6 . C6 .',
        'B5 - - - G#5 - - .',
      ),
    },
    { noise: true, vol: 0.03, steps: eight('x . . x x . . .') },
  ],
}

export const BAY_MUSIC: MusicLoop = {
  bpm: 92,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'D3 - - - A2 - - -',
        'B2 - - - F#2 - - -',
        'G2 - - - D3 - - -',
        'A2 - - - E3 - - -',
        'D3 - - - A2 - - -',
        'B2 - - - F#2 - - -',
        'G2 - - - A2 - - -',
        'D3 - - - - - - -',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'F#5 . A5 . D6 . A5 .',
        'F#5 . B5 . D6 . B5 .',
        'G5 . B5 . D6 . B5 .',
        'A5 . C#6 . E6 . C#6 .',
        'F#5 . A5 . D6 . F#6 .',
        'E6 . D6 . B5 . F#5 .',
        'G5 . B5 . A5 . C#6 .',
        'D6 - - - . . . .',
      ),
    },
  ],
}

export const STORY_MUSIC: MusicLoop = {
  bpm: 104,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'C3 . G3 . E3 . G3 .',
        'A2 . E3 . C3 . E3 .',
        'F2 . C3 . A2 . C3 .',
        'G2 . D3 . B2 . D3 .',
        'C3 . G3 . E3 . G3 .',
        'A2 . E3 . C3 . E3 .',
        'F2 . C3 . G2 . D3 .',
        'C3 . . . . . . .',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'E6 . G6 . C7 . G6 .',
        'A6 - G6 . E6 . . .',
        'F6 . A6 . C7 . A6 .',
        'G6 - - . D6 . . .',
        'E6 . G6 . C7 . E7 .',
        'D7 - C7 . A6 . . .',
        'F6 . E6 . D6 . B5 .',
        'C6 - - - . . . .',
      ),
    },
  ],
}
