import type { MusicLoop } from '../sound'

export const REPAIR_RAMPAGE_MUSIC: MusicLoop = {
  bpm: 122,
  stepsPerBeat: 2,
  tracks: [
    {
      steps: 'C4 . E4 . G4 . E4 . A4 . G4 . E4 . D4 .',
      type: 'square',
      vol: 0.026,
    },
    {
      steps: 'C3 - . . G2 - . . A2 - . . G2 - . .',
      type: 'triangle',
      vol: 0.048,
    },
    {
      steps: 'x . . . x . x . x . . . x . x .',
      noise: true,
      vol: 0.016,
    },
  ],
}
