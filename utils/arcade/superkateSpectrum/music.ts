import type { MusicLoop } from '../sound'

/** Original chip melodies, synthesized live until approved recordings arrive. */
export const SPECTRUM_THEMES: readonly MusicLoop[] = [
  {
    bpm: 118,
    stepsPerBeat: 2,
    tracks: [
      {
        steps: 'C5 . E5 . G5 - A5 . G5 . E5 . D5 - C5 .',
        type: 'triangle',
        vol: 0.036,
      },
      {
        steps: 'C3 - . G3 - . A3 - . F3 - . G3 - .',
        type: 'square',
        vol: 0.017,
      },
      { steps: 'x . . . x . x . x . . . x . x .', noise: true, vol: 0.012 },
    ],
  },
  {
    bpm: 110,
    stepsPerBeat: 2,
    tracks: [
      {
        steps: 'E5 . G5 . A5 - G5 . E5 - D5 . C5 - D5 .',
        type: 'triangle',
        vol: 0.035,
      },
      {
        steps: 'A2 - . E3 - . F3 - . C3 - . E3 - .',
        type: 'square',
        vol: 0.019,
      },
      { steps: 'x . . x . x . . x . . x . x . .', noise: true, vol: 0.01 },
    ],
  },
  {
    bpm: 138,
    stepsPerBeat: 2,
    tracks: [
      {
        steps: 'G4 . Bb4 D5 . F5 D5 . Bb4 . G4 A4 . D5 .',
        type: 'sawtooth',
        vol: 0.022,
      },
      {
        steps: 'G2 - . G3 . D3 . F3 G2 - . D3 . G3 .',
        type: 'square',
        vol: 0.016,
      },
      { steps: 'x . x . x . . x x . x . x . . x', noise: true, vol: 0.012 },
    ],
  },
  {
    bpm: 94,
    stepsPerBeat: 2,
    tracks: [
      {
        steps: 'D5 - . A4 . C5 . E5 . F5 - E5 . C5 . A4',
        type: 'sine',
        vol: 0.044,
      },
      {
        steps: 'D3 - . . A2 - . . F3 - . . C3 - . .',
        type: 'triangle',
        vol: 0.025,
      },
      { steps: 'x . . . . . x . x . . . . . x .', noise: true, vol: 0.008 },
    ],
  },
  {
    bpm: 126,
    stepsPerBeat: 2,
    tracks: [
      {
        steps: 'F4 . A4 C5 . D5 E5 . C5 . A4 . G4 A4 . C5',
        type: 'square',
        vol: 0.024,
      },
      {
        steps: 'F2 - . C3 - . D3 . A2 . Bb2 - . C3 .',
        type: 'triangle',
        vol: 0.028,
      },
      { steps: 'x . x . x . x . x . x . x . x .', noise: true, vol: 0.008 },
    ],
  },
  {
    bpm: 144,
    stepsPerBeat: 2,
    tracks: [
      {
        steps: 'A4 C5 E5 . G5 - E5 C5 . B4 . D5 E5 G5 - .',
        type: 'triangle',
        vol: 0.036,
      },
      {
        steps: 'A2 - E3 . G3 . E3 . F3 - C3 . E3 . G3 .',
        type: 'square',
        vol: 0.016,
      },
      { steps: 'x . x . x . x . x . . x x . x .', noise: true, vol: 0.012 },
    ],
  },
]

/** Six denser, faster arrangements for each fifth-stage chapter showdown. */
export const SPECTRUM_BOSS_MUSIC: readonly MusicLoop[] = SPECTRUM_THEMES.map(
  (theme, index) => ({
    bpm: Math.min(170, theme.bpm + 18),
    stepsPerBeat: 2,
    tracks: [
      ...theme.tracks,
      {
        steps:
          index % 2 === 0
            ? 'C3 . G2 . C3 . G2 . Bb2 . F2 . G2 . Bb2 .'
            : 'A2 . E2 . A2 . E2 . G2 . D2 . E2 . G2 .',
        type: 'sawtooth' as const,
        vol: 0.015,
      },
      {
        steps: 'x . . x x . x . x . x x . x . x',
        noise: true,
        vol: 0.013,
      },
    ],
  }),
)

export const SPECTRUM_CLASSIC_MUSIC: MusicLoop = {
  bpm: 128,
  stepsPerBeat: 2,
  tracks: [
    {
      steps: 'C5 E5 G5 . F5 D5 B4 . A4 C5 E5 . D5 B4 G4 .',
      type: 'triangle',
      vol: 0.031,
    },
    {
      steps: 'C3 . C3 . G2 . G2 . A2 . A2 . G2 . G2 .',
      type: 'square',
      vol: 0.022,
    },
    { steps: 'x . x . x . x . x . x . x . x .', noise: true, vol: 0.011 },
  ],
}

export const SPECTRUM_MENU_MUSIC: MusicLoop = {
  bpm: 86,
  stepsPerBeat: 2,
  tracks: [
    {
      steps: 'C5 . E5 . G5 - . . A5 . G5 . E5 - . .',
      type: 'sine',
      vol: 0.035,
    },
    {
      steps: 'C3 - . . F3 - . . G3 - . . C3 - . .',
      type: 'triangle',
      vol: 0.019,
    },
  ],
}
