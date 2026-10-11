// /utils/arcade/kindnessGauntlet/music.ts
//
// The Deep Archive's score (conductor kr-arcade t-052): one loop per wing and one for the Guardians,
// for the arcade's step sequencer (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits
// on a noise track). Original tunes, eight bars of eight steps:
//
//   The Punch-Card Vault  a clattering minor-key march, a card feeder's chug under a plinky lead.
//   The Tape Library      a slow swung walk, all wow and flutter, with a reel-to-reel hum.
//   Guardian              a driving riff for the halls where the old machines wait.
//   Lost & Found          a quick major scamper against the clock.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')
const eight = (bar: string) => bars(...Array(8).fill(bar))

export const VAULT_LOOP: MusicLoop = {
  bpm: 126,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'A2 . A2 . E2 . A2 .',
        'A2 . A2 . E2 . G2 .',
        'F2 . F2 . C3 . F2 .',
        'E2 . E2 . B2 . E2 .',
        'A2 . A2 . E2 . A2 .',
        'D3 . D3 . A2 . D3 .',
        'F2 . F2 . E2 . E2 .',
        'A2 . E2 . A2 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'E5 . C5 . A4 . C5 E5',
        'D5 - C5 . B4 . G4 .',
        'F5 . E5 . C5 . A4 .',
        'G#4 - - . B4 . E5 .',
        'A5 . G5 . E5 . C5 .',
        'D5 . F5 . A5 - G5 .',
        'F5 . E5 . D5 . B4 .',
        'A4 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.03, steps: eight('x . x x . . x .') },
  ],
}

export const LIBRARY_LOOP: MusicLoop = {
  bpm: 96,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'D3 - . F3 A3 - . F3',
        'G2 - . B2 D3 - . B2',
        'C3 - . E3 G3 - . E3',
        'A2 - . C#3 E3 - . C#3',
        'D3 - . F3 A3 - . F3',
        'Bb2 - . D3 F3 - . D3',
        'G2 - . Bb2 A2 - . C#3',
        'D3 - - - A2 - . .',
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'A4 - - F4 - D4 - .',
        'B4 - - G4 - D4 - .',
        'C5 - - G4 - E4 - .',
        'C#5 - - - E5 - - .',
        'D5 - - A4 - F4 - .',
        'F5 - - D5 - Bb4 - .',
        'E5 - D5 - C#5 - A4 .',
        'D5 - - - - - . .',
      ),
    },
    { noise: true, vol: 0.02, steps: eight('x . . x . . x .') },
  ],
}

export const GUARDIAN_LOOP: MusicLoop = {
  bpm: 144,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.035,
      steps: bars(
        'E2 E2 E3 E2 G2 E2 A2 B2',
        'E2 E2 E3 E2 D3 C3 B2 G2',
        'C2 C2 C3 C2 E2 C2 F2 G2',
        'D2 D2 D3 D2 F#2 A2 B2 D3',
        'E2 E2 E3 E2 G2 E2 A2 B2',
        'E2 E2 E3 E2 D3 C3 B2 G2',
        'A2 A2 C3 A2 B2 B2 D#3 B2',
        'E2 . E3 . E2 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'B4 - . E5 - . G5 .',
        'F#5 - E5 . D5 . B4 .',
        'C5 - . E5 - . G5 .',
        'F#5 - . A5 - . F#5 .',
        'B5 - . G5 - . E5 .',
        'F#5 . G5 . A5 . B5 .',
        'C6 - B5 . A5 . F#5 .',
        'E5 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.035, steps: eight('x . x . x . x x') },
  ],
}

export const LOST_LOOP: MusicLoop = {
  bpm: 168,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'C3 . G3 . C3 . G3 .',
        'F3 . C4 . F3 . C4 .',
        'G3 . D4 . G3 . D4 .',
        'C3 . G3 . C4 . G3 .',
        'C3 . G3 . C3 . G3 .',
        'A2 . E3 . A2 . E3 .',
        'D3 . A3 . G3 . B3 .',
        'C3 . G3 . C4 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'E5 G5 C6 G5 E5 G5 C6 G5',
        'F5 A5 C6 A5 F5 A5 C6 A5',
        'G5 B5 D6 B5 G5 B5 D6 B5',
        'E5 G5 C6 E6 C6 G5 E5 C5',
        'E5 G5 C6 G5 E5 G5 C6 G5',
        'E5 A5 C6 A5 E5 A5 C6 A5',
        'F5 A5 D6 A5 G5 B5 D6 B5',
        'C6 - - - . . . .',
      ),
    },
  ],
}

export const WING_LOOPS: readonly MusicLoop[] = [VAULT_LOOP, LIBRARY_LOOP]
