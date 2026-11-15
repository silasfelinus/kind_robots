// /utils/arcade/cocoaCounter/music.ts
//
// Cocoa Counter depth pass, slice 2 (conductor kr-arcade/t-123): each venue's own music loop, the
// Rush Hour theme and the bonus-round jingle, as step-sequencer tokens (utils/arcade/sound.ts).

import type { MusicLoop } from '../sound'
import type { VenueId } from './tables'

/** A cosy fireside waltz for the Snowdrop Cafe. */
const SNOWDROP: MusicLoop = {
  bpm: 132,
  stepsPerBeat: 1,
  tracks: [
    {
      steps: 'E5 - G5 C6 - B5 A5 - G5 E5 - - F5 - A5 D6 - C6 B5 - G5 C6 - -',
      type: 'triangle',
      vol: 0.05,
    },
    {
      steps:
        'C3 G3 E3 C3 G3 E3 F3 C4 A3 C3 G3 E3 D3 A3 F3 G3 D4 B3 C3 G3 E3 C3 G3 C4',
      type: 'square',
      vol: 0.025,
    },
  ],
}

/** A bouncy boardwalk tune for the Seaside Smoothie Shack. */
const SEASIDE: MusicLoop = {
  bpm: 112,
  stepsPerBeat: 2,
  tracks: [
    {
      steps:
        'G5 . E5 G5 . A5 G5 . E5 . D5 E5 . C5 . . G5 . E5 G5 . A5 C6 . B5 . A5 G5 . . . .',
      type: 'square',
      vol: 0.035,
    },
    {
      steps:
        'C3 . . C3 G3 . . G3 A2 . . A2 E3 . . E3 F2 . . F2 C3 . . C3 G2 . . G2 D3 . G2 .',
      type: 'triangle',
      vol: 0.06,
    },
    { steps: 'x . . x . . x . x . . x . . x .', noise: true, vol: 0.02 },
  ],
}

/** Rush Hour: the same cafe, twice as busy. */
const RUSH: MusicLoop = {
  bpm: 150,
  stepsPerBeat: 2,
  tracks: [
    {
      steps:
        'A4 . C5 A4 E5 . C5 . G4 . B4 G4 D5 . B4 . F4 . A4 F4 C5 . A4 . E4 . G#4 B4 E5 . . .',
      type: 'square',
      vol: 0.035,
    },
    {
      steps:
        'A2 . A2 . A2 . A2 . G2 . G2 . G2 . G2 . F2 . F2 . F2 . F2 . E2 . E2 . E2 . E2 .',
      type: 'triangle',
      vol: 0.07,
    },
    { steps: 'x . x . x . x x', noise: true, vol: 0.025 },
  ],
}

const BONUS: MusicLoop = {
  bpm: 140,
  stepsPerBeat: 2,
  tracks: [
    {
      steps: 'C5 E5 G5 E5 C6 . G5 . D5 F5 A5 F5 D6 . A5 .',
      type: 'triangle',
      vol: 0.05,
    },
  ],
}

export const COCOA_MUSIC: {
  venues: Record<VenueId, MusicLoop>
  rush: MusicLoop
  bonus: MusicLoop
} = {
  venues: { snowdrop: SNOWDROP, seaside: SEASIDE },
  rush: RUSH,
  bonus: BONUS,
}
