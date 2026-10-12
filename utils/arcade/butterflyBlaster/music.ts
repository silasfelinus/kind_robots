// /utils/arcade/butterflyBlaster/music.ts
//
// Butterfly Blaster's score (conductor kr-arcade/t-055): an original chiptune for the arcade's step
// sequencer (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise track).
//
//   Heartbeat  the night watch: a lub-dub bass under a hopeful little lullaby in A minor that
//              turns to C major. Its tempo climbs as the swarms thin, tier by tier, and the last
//              mosquito's sprint gets a doubled beat.
//   Dawn       the lullaby slowed and warmed into C major while the village counts its huts.

import type { MusicLoop } from '../sound'

const bars = (...b: string[]) => b.join(' ')

/** The heartbeat's tempo at each tier: a full sky, thinning, thin, nearly clear, the sprint. */
export const HEARTBEAT_BPM = [92, 106, 122, 140, 168] as const

function heartbeat(bpm: number, sprint: boolean): MusicLoop {
  return {
    bpm,
    tracks: [
      {
        type: 'triangle',
        vol: 0.1,
        steps: bars(
          'A1 E2 . . A1 E2 . .',
          'F1 C2 . . F1 C2 . .',
          'C2 G2 . . C2 G2 . .',
          'G1 D2 . . G1 D2 . .',
          'A1 E2 . . A1 E2 . .',
          'F1 C2 . . F1 C2 . .',
          'D2 A2 . . D2 A2 . .',
          'E2 B2 . . E2 G#2 . .',
        ),
      },
      {
        type: 'square',
        vol: 0.03,
        steps: bars(
          'E4 . . A4 - . C5 .',
          'B4 . A4 . F4 - . .',
          'G4 . . C5 - . E5 .',
          'D5 . C5 . B4 - . .',
          'E4 . . A4 - . C5 .',
          'D5 . C5 . A4 - . .',
          'F4 . A4 . D5 - C5 .',
          'B4 - - . G#4 - - .',
        ),
      },
      {
        noise: true,
        vol: sprint ? 0.03 : 0.018,
        steps: bars(
          ...Array(8).fill(sprint ? 'x . x . x . x x' : 'x . . . x . . .'),
        ),
      },
    ],
  }
}

/** The heartbeat loops, one per tier (the last is the sprint). */
export const HEARTBEAT: readonly MusicLoop[] = HEARTBEAT_BPM.map((bpm, i) =>
  heartbeat(bpm, i === HEARTBEAT_BPM.length - 1),
)

export const DAWN: MusicLoop = {
  bpm: 84,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: bars(
        'C3 - G3 - E3 - G3 -',
        'A2 - E3 - C3 - E3 -',
        'F2 - C3 - A2 - C3 -',
        'G2 - D3 - B2 - D3 -',
      ),
    },
    {
      type: 'square',
      vol: 0.032,
      steps: bars(
        'E5 - - D5 C5 - D5 -',
        'E5 - G5 - E5 - - .',
        'F5 - E5 - D5 - C5 -',
        'D5 - - - G4 - - .',
      ),
    },
  ],
}

/** The heartbeat tier for how much of the wave is left (0..1), or the sprint. */
export function heartbeatTier(left: number, sprint: boolean): number {
  if (sprint) return HEARTBEAT.length - 1
  if (left > 0.75) return 0
  if (left > 0.5) return 1
  if (left > 0.25) return 2
  return 3
}
