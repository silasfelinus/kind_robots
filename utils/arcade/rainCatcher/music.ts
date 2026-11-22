import type { MusicLoop } from '../sound'

export const RAIN_CATCHER_MUSIC: MusicLoop = {
  bpm: 104,
  stepsPerBeat: 2,
  tracks: [
    {
      steps: 'G4 . A4 . B4 - . . D5 . B4 . A4 - . .',
      type: 'triangle',
      vol: 0.036,
    },
    {
      steps: 'G3 - . . D3 - . . E3 - . . D3 - . .',
      type: 'square',
      vol: 0.018,
    },
    {
      steps: 'x . . . . . x . x . . . . . x .',
      noise: true,
      vol: 0.012,
    },
  ],
}
