// /utils/arcade/bumperBubbles/music.ts
//
// Fizzwick Tower's score (conductor kr-arcade/t-059): an original chiptune loop per
// wing for the arcade's step sequencer (utils/arcade/sound.ts: note tokens, `-`
// holds, `.` rests, `x` hits on a noise track), eight bars of eight steps. When the
// floor timer runs out the same loop plays a third faster: the classic's hurry.
//
//   Bottling Hall    a bouncy clink-clank march, bottles rattling down the line.
//   Gumdrop Gardens  a skipping, sugary waltz-time tune in G.
//   Lagoon Cellar    slow drippy arpeggios in D minor, a plink like water in a cask.
//   Observatory      a twinkling, spacey loop over a long held bass.
//   Boss             a stomping minor riff for THE BIG CORK and the bosses after it.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
/** Root, fifth, octave, fifth on the beats. */
const walk = (r: string, f: string, o: string) => `${r} . ${f} . ${o} . ${f} .`

const BOTTLING: MusicLoop = {
  bpm: 132,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('C3', 'G2', 'C3'),
        walk('A2', 'E2', 'A2'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'D3', 'G3'),
        walk('C3', 'G2', 'C3'),
        walk('E2', 'B2', 'E3'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'B2', 'D3'),
      ),
    },
    {
      type: 'square',
      vol: 0.032,
      steps: bars(
        'E5 . G5 . C6 - G5 .',
        'A5 . E5 . C5 - . .',
        'F5 . A5 . C6 . A5 .',
        'B5 - G5 . D5 - . .',
        'E5 . G5 . C6 - E6 .',
        'D6 . B5 . G#5 - . .',
        'A5 . C6 . F5 . A5 .',
        'G5 - F5 . D5 . B4 .',
      ),
    },
    {
      type: 'square',
      vol: 0.012,
      steps: bars(
        ...Array(4).fill('. C6 . . . E6 . .'),
        ...Array(4).fill('. A5 . . . F5 . .'),
      ),
    },
    {
      noise: true,
      vol: 0.022,
      steps: bars(...Array(8).fill('x . x . x . x x')),
    },
  ],
}

const GARDENS: MusicLoop = {
  bpm: 120,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'G2 - - D3 - - B2 -',
        'C3 - - G3 - - E3 -',
        'G2 - - D3 - - B2 -',
        'D3 - - A3 - - F#3 -',
        'E3 - - B3 - - G3 -',
        'C3 - - G3 - - E3 -',
        'A2 - - E3 - - C3 -',
        'D3 - - A3 - - D3 -',
      ),
    },
    {
      type: 'sine',
      vol: 0.055,
      steps: bars(
        'B4 - D5 - G5 - F#5 -',
        'E5 - G5 - C6 - - -',
        'B5 - A5 - G5 - D5 -',
        'F#5 - A5 - D6 - - -',
        'G5 - B5 - E6 - D6 -',
        'C6 - B5 - G5 - E5 -',
        'A5 - G5 - E5 - C5 -',
        'D5 - F#5 - A5 - - -',
      ),
    },
    {
      type: 'square',
      vol: 0.012,
      steps: bars(
        ...Array(4).fill('. . G6 . . . D6 .'),
        ...Array(4).fill('. . E6 . . . C6 .'),
      ),
    },
    {
      noise: true,
      vol: 0.016,
      steps: bars(...Array(8).fill('x . . . x . x .')),
    },
  ],
}

const LAGOON: MusicLoop = {
  bpm: 100,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'D2 - - - A2 - - -',
        'Bb2 - - - F2 - - -',
        'G2 - - - D3 - - -',
        'A2 - - - E2 - - -',
        'D2 - - - A2 - - -',
        'Bb2 - - - F2 - - -',
        'C3 - - - G2 - - -',
        'A2 - - - A2 - C#3 -',
      ),
    },
    {
      type: 'sine',
      vol: 0.05,
      steps: bars(
        'D4 F4 A4 D5 A4 F4 D4 .',
        'Bb3 D4 F4 Bb4 F4 D4 . .',
        'G3 Bb3 D4 G4 D4 Bb3 . .',
        'A3 C#4 E4 A4 E4 C#4 . .',
        'D4 F4 A4 D5 F5 D5 A4 .',
        'Bb3 D4 F4 Bb4 D5 Bb4 . .',
        'C4 E4 G4 C5 G4 E4 . .',
        'A3 C#4 E4 A4 C#5 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.012,
      steps: bars(...Array(8).fill('. . . A6 . . . .')),
    },
  ],
}

const OBSERVATORY: MusicLoop = {
  bpm: 112,
  tracks: [
    {
      type: 'triangle',
      vol: 0.065,
      steps: bars(
        'E2 - - - - - - -',
        'C2 - - - - - - -',
        'A1 - - - - - - -',
        'B1 - - - - - - -',
        'E2 - - - - - - -',
        'C2 - - - - - - -',
        'D2 - - - - - - -',
        'B1 - - - B1 - - -',
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'E5 B5 G5 B5 E6 B5 G5 B5',
        'C5 G5 E5 G5 C6 G5 E5 G5',
        'A4 E5 C5 E5 A5 E5 C5 E5',
        'B4 F#5 D#5 F#5 B5 F#5 D#5 F#5',
        'E5 B5 G5 B5 E6 B5 G5 B5',
        'C5 G5 E5 G5 C6 G5 E5 G5',
        'D5 A5 F#5 A5 D6 A5 F#5 A5',
        'B4 F#5 D#5 F#5 B5 - - .',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'G5 - - - F#5 - E5 -',
        'E5 - - - - - G5 -',
        'A5 - - - G5 - E5 -',
        'F#5 - - - - - - -',
        'G5 - - - B5 - A5 -',
        'G5 - - - E5 - - -',
        'F#5 - - - A5 - D6 -',
        'D#6 - - - - - - -',
      ),
    },
  ],
}

const BOSS: MusicLoop = {
  bpm: 148,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.04,
      steps: bars(
        'E2 E2 . E2 G2 . E2 .',
        'E2 E2 . E2 A2 . G2 .',
        'C2 C2 . C2 E2 . C2 .',
        'D2 D2 . D2 F#2 . B1 .',
        'E2 E2 . E2 G2 . E2 .',
        'E2 E2 . E2 A2 . G2 .',
        'C2 C2 . C2 D2 . D#2 .',
        'B1 B1 . B1 D#2 . F#2 .',
      ),
    },
    {
      type: 'square',
      vol: 0.03,
      steps: bars(
        'E5 . G5 . B5 - A5 .',
        'G5 . E5 . D5 - . .',
        'C5 . E5 . G5 - F#5 .',
        'F#5 . D5 . B4 - . .',
        'E5 . G5 . B5 - E6 .',
        'D6 . B5 . G5 - . .',
        'C6 . A5 . E5 . D#5 .',
        'F#5 - - . B4 - - .',
      ),
    },
    {
      noise: true,
      vol: 0.03,
      steps: bars(...Array(8).fill('x . x . x x x .')),
    },
  ],
}

export const MUSIC: Record<string, MusicLoop> = {
  bottling: BOTTLING,
  gardens: GARDENS,
  lagoon: LAGOON,
  observatory: OBSERVATORY,
  boss: BOSS,
}

/** Each wing's loop a third faster, for the hurry (the same object every time it is asked for). */
export const HURRY_MUSIC: Record<string, MusicLoop> = Object.fromEntries(
  Object.entries(MUSIC).map(([id, loop]) => [
    id,
    { ...loop, bpm: Math.round(loop.bpm * 1.33) },
  ]),
)
