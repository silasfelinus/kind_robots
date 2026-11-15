// /utils/arcade/stationSweep/music.ts
//
// Station Sweep's first music (conductor kr-arcade/t-141), for the arcade's step sequencer
// (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track). Original
// tunes, eight bars of eight steps (eighth notes) per track:
//
//   Sweep Shift   a bouncy, busy-robot tune in G: a walking bass, a whistled melody, and a
//                 brushy hi-hat like bristles on deck plating.
//   Alarm         the same shift with a two-note siren layered on top, for the last 20 seconds
//                 on the clock.
//   Supply Locker a slow, warm shop tune in F while the crew counts its credits.

import type { LoopTrack, MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))

const SHIFT_BASS: LoopTrack = {
  type: 'triangle',
  vol: 0.07,
  steps: bars(
    'G2 . D3 . G3 . D3 .',
    'E2 . B2 . E3 . B2 .',
    'C3 . G3 . C3 . E3 .',
    'D3 . A2 . D3 . F#3 .',
    'G2 . D3 . G3 . D3 .',
    'B2 . F#3 . B2 . D3 .',
    'C3 . E3 . D3 . F#3 .',
    'G2 . D3 . G2 . . .',
  ),
}

const SHIFT_TUNE: LoopTrack = {
  type: 'square',
  vol: 0.019,
  steps: bars(
    'B4 . D5 . G5 - F#5 .',
    'E5 . G5 . B5 - A5 .',
    'G5 . E5 . C5 . E5 .',
    'F#5 - - . A5 . D5 .',
    'B4 . D5 . G5 - B5 .',
    'A5 . F#5 . D5 . B4 .',
    'C5 . E5 . A5 . F#5 .',
    'G5 - - - . . D5 .',
  ),
}

const SHIFT_HAT: LoopTrack = {
  noise: true,
  vol: 0.012,
  steps: eight('x . x x x . x .'),
}

export const STATION_MUSIC: MusicLoop = {
  bpm: 128,
  tracks: [SHIFT_BASS, SHIFT_TUNE, SHIFT_HAT],
}

export const ALARM_MUSIC: MusicLoop = {
  bpm: 128,
  tracks: [
    SHIFT_BASS,
    SHIFT_TUNE,
    SHIFT_HAT,
    {
      type: 'sawtooth',
      vol: 0.01,
      steps: eight('E6 - - - C6 - - -'),
    },
  ],
}

export const LOCKER_MUSIC: MusicLoop = {
  bpm: 92,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'F2 - - - C3 - - -',
        'D2 - - - A2 - - -',
        'Bb2 - - - F3 - - -',
        'C3 - - - G2 - - -',
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
        'A5 . C6 . F5 . A5 .',
        'D6 . A5 . F5 . D6 .',
        'D6 . Bb5 . F5 . Bb5 .',
        'C6 . E6 . G5 . E6 .',
        'A5 . C6 . F6 . C6 .',
        'E6 . C6 . A5 . E6 .',
        'D6 . F6 . E6 . C6 .',
        'F6 - - - . . . .',
      ),
    },
  ],
}
