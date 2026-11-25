import type { MusicLoop } from '../sound'

/** Original chip melodies with deterministic mastered recordings and live fallbacks. */
const REGION_MELODIES: readonly MusicLoop[] = [
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

const REGION_RESPONSES = [
  'E5 . G5 . C6 - B5 . A5 . G5 . E5 - D5 .',
  'C5 . E5 . G5 - A5 . F5 - E5 . D5 - C5 .',
  'D5 . F5 G5 . Bb5 G5 . F5 . D5 C5 . Bb4 . .',
  'F5 - . C5 . A4 . D5 . E5 - D5 . A4 . C5',
  'A4 . C5 D5 . F5 E5 . D5 . C5 . Bb4 A4 . G4',
  'C5 E5 A5 . B5 - A5 G5 . E5 . D5 G5 E5 - .',
] as const

const REGION_HARMONIES = [
  'E4 - . . F4 - . . E4 - . . D4 - . .',
  'C4 - . . E4 - . . F4 - . . G4 - . .',
  'Bb3 . . F4 . . D4 . Bb3 . . A3 . . F4 .',
  'F4 - . . E4 - . . A3 - . . G3 - . .',
  'A3 . . C4 . . Bb3 . D4 . . A3 . . G3 .',
  'E4 - . . G4 - . . F4 - . . D4 - . .',
] as const

function phrase(steps: string): string {
  const tokens = steps.trim().split(/\s+/)
  return [...tokens, ...Array(Math.max(0, 16 - tokens.length)).fill('.')].join(
    ' ',
  )
}

function arrangeRegion(theme: MusicLoop, index: number): MusicLoop {
  return {
    ...theme,
    tracks: [
      ...theme.tracks.map((track, voice) => ({
        ...track,
        steps: [
          phrase(track.steps),
          phrase(voice === 0 ? REGION_RESPONSES[index]! : track.steps),
        ].join(' '),
      })),
      {
        steps: [
          phrase('. . . . . . . . . . . . . . . .'),
          phrase(REGION_HARMONIES[index]!),
        ].join(' '),
        type: 'sine',
        vol: 0.012,
      },
    ],
  }
}

const REGION_TRACKS = [
  'rainbow-salon',
  'botanic-dome',
  'night-market',
  'cloud-library',
  'prism-workshop',
  'heart-of-hue',
] as const

function recording(name: string) {
  return { src: `/audio/arcade/superkate-spectrum/${name}.wav` }
}

export const SPECTRUM_THEMES: readonly MusicLoop[] = REGION_MELODIES.map(
  (theme, index) => ({
    ...arrangeRegion(theme, index),
    recorded: recording(REGION_TRACKS[index]!),
  }),
)

/** Six denser, faster arrangements for each fifth-stage chapter showdown. */
export const SPECTRUM_BOSS_MUSIC: readonly MusicLoop[] = SPECTRUM_THEMES.map(
  (theme, index) => ({
    recorded: recording(`${REGION_TRACKS[index]}-boss`),
    bpm: Math.min(170, theme.bpm + 18),
    stepsPerBeat: 2,
    tracks: [
      ...theme.tracks,
      {
        steps:
          index % 2 === 0
            ? 'C3 . G2 . C3 . G2 . Bb2 . F2 . G2 . Bb2 . C3 . G2 . Bb2 . C3 . F3 . C3 . G2 . G2 .'
            : 'A2 . E2 . A2 . E2 . G2 . D2 . E2 . G2 . A2 . E2 . G2 . A2 . D3 . A2 . E2 . E2 .',
        type: 'sawtooth' as const,
        vol: 0.015,
      },
      {
        steps:
          'x . . x x . x . x . x x . x . x x . x . x x . x x . x . x x x .',
        noise: true,
        vol: 0.013,
      },
    ],
  }),
)

export const SPECTRUM_CLASSIC_MUSIC: MusicLoop = {
  recorded: recording('classic'),
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
  recorded: recording('menu'),
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
