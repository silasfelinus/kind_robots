// /utils/arcade/butterflyBlaster/music.ts
//
// Butterfly Blaster's score (conductor kr-arcade/t-055, t-056): original chiptune for the arcade's
// step sequencer (utils/arcade/sound.ts: note tokens, `-` holds, `.` rests, `x` hits on a noise
// track). Every night plays a heartbeat: a lub-dub bass under the region's own melody, whose
// tempo climbs tier by tier as the swarms thin, with a doubled beat for the last mosquito's
// sprint.
//
//   Riverbend  a hopeful lullaby in A minor that turns to C major.
//   Terraces   a stepping pentatonic tune in D, like water running down the paddies.
//   Delta      a slow, watery D minor sway in triangle.
//   Market     a bouncy festival tune in G.
//   Tea Hills  an urgent E minor gallop through the storm.
//   Swamp      a murky C minor crawl.
//   Lagoon     a dreamy, glassy F major.
//   The Hum    a buzzing minor drone with a stubborn two-note riff.
//   Old Puddle a bubbly, plopping G minor.
//   The Queen  a grand A minor march.
//   Ending     the lullaby grown into a warm anthem for the credits.
//   Dawn       the lullaby slowed and warmed into C major while the village counts its huts.
//   River map  a gentle rowing tune.
//   Clinic     a music box while you count your beads.

import type { MusicLoop } from '../sound'
import type { BossId, ThemeId } from './season'

const bars = (...b: string[]) => b.join(' ')

/** The heartbeat's tempo at each tier: a full sky, thinning, thin, nearly clear, the sprint. */
export const HEARTBEAT_BPM = [92, 106, 122, 140, 168] as const

type Theme = { bass: string; melody: string; lead?: OscillatorType }

const THEMES: Record<ThemeId | BossId, Theme> = {
  riverbend: {
    bass: bars(
      'A1 E2 . . A1 E2 . .',
      'F1 C2 . . F1 C2 . .',
      'C2 G2 . . C2 G2 . .',
      'G1 D2 . . G1 D2 . .',
      'A1 E2 . . A1 E2 . .',
      'F1 C2 . . F1 C2 . .',
      'D2 A2 . . D2 A2 . .',
      'E2 B2 . . E2 G#2 . .',
    ),
    melody: bars(
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
  terraces: {
    bass: bars(
      'D2 A2 . . D2 A2 . .',
      'D2 A2 . . D2 A2 . .',
      'G1 D2 . . G1 D2 . .',
      'A1 E2 . . A1 E2 . .',
      'B1 F#2 . . B1 F#2 . .',
      'G1 D2 . . G1 D2 . .',
      'E2 B2 . . E2 B2 . .',
      'A1 E2 . . A1 C#2 . .',
    ),
    melody: bars(
      'A5 . F#5 . E5 . D5 .',
      'E5 . F#5 - - . . .',
      'B4 . D5 . E5 . G5 .',
      'F#5 . E5 - - . . .',
      'D5 . E5 . F#5 . A5 .',
      'B5 . A5 . F#5 - . .',
      'E5 . F#5 . D5 . B4 .',
      'A4 - - . C#5 - . .',
    ),
    lead: 'triangle',
  },
  delta: {
    bass: bars(
      'D2 A2 . . D2 A2 . .',
      'Bb1 F2 . . Bb1 F2 . .',
      'C2 G2 . . C2 G2 . .',
      'A1 E2 . . A1 C#2 . .',
      'D2 A2 . . D2 A2 . .',
      'G1 D2 . . G1 D2 . .',
      'Bb1 F2 . . C2 G2 . .',
      'A1 E2 . . A1 E2 . .',
    ),
    melody: bars(
      'F4 - - A4 - - D5 -',
      'C5 - Bb4 - A4 - - .',
      'G4 - - Bb4 - - E5 -',
      'E5 - D5 - C#5 - - .',
      'F4 - - A4 - - D5 -',
      'G5 - F5 - D5 - - .',
      'Bb4 - D5 - C5 - E5 -',
      'D5 - - - - - . .',
    ),
    lead: 'triangle',
  },
  market: {
    bass: bars(
      'G2 . D3 . G2 . D3 .',
      'C3 . G2 . C3 . G2 .',
      'D3 . A2 . D3 . A2 .',
      'G2 . D3 . G2 B2 D3 .',
      'E2 . B2 . E2 . B2 .',
      'C3 . G2 . C3 . G2 .',
      'A2 . E3 . D3 . A2 .',
      'D3 . F#3 . G3 . . .',
    ),
    melody: bars(
      'B4 D5 G5 D5 B4 . G4 .',
      'C5 E5 G5 E5 C5 . . .',
      'A4 D5 F#5 D5 A4 . F#4 .',
      'G4 B4 D5 G5 - . . .',
      'B4 . E5 . G5 . E5 .',
      'C5 . E5 . G5 . A5 .',
      'B5 . A5 . G5 . F#5 .',
      'G5 - - . D5 - . .',
    ),
  },
  tea: {
    bass: bars(
      'E2 E2 B2 E2 E2 B2 E2 .',
      'C2 C2 G2 C2 C2 G2 C2 .',
      'D2 D2 A2 D2 D2 A2 D2 .',
      'B1 B1 F#2 B1 B1 F#2 B1 .',
      'E2 E2 B2 E2 E2 B2 E2 .',
      'A1 A1 E2 A1 A1 E2 A1 .',
      'C2 C2 G2 C2 D2 D2 A2 .',
      'B1 B1 D#2 F#2 B1 . . .',
    ),
    melody: bars(
      'E5 . . G5 . . B5 .',
      'C5 . E5 . G5 - - .',
      'D5 . . F#5 . . A5 .',
      'B4 - - . D#5 - . .',
      'E5 . G5 . B5 . E6 .',
      'C6 . B5 . A5 - . .',
      'G5 . E5 . F#5 . A5 .',
      'B5 - - - D#5 - - .',
    ),
  },
  swamp: {
    bass: bars(
      'C2 - - . G1 - - .',
      'C2 - - . Ab1 - - .',
      'F1 - - . C2 - - .',
      'G1 - - . G1 B1 D2 .',
      'C2 - - . G1 - - .',
      'Eb2 - - . Bb1 - - .',
      'Ab1 - - . F1 - - .',
      'G1 - - . G1 - - .',
    ),
    melody: bars(
      'C4 - Eb4 - G4 - - .',
      'Ab4 - G4 - Eb4 - - .',
      'F4 - Ab4 - C5 - - .',
      'B4 - - - D5 - - .',
      'C5 - Bb4 - G4 - - .',
      'Eb5 - D5 - Bb4 - - .',
      'C5 - Ab4 - F4 - - .',
      'G4 - - - - - . .',
    ),
    lead: 'triangle',
  },
  lagoon: {
    bass: bars(
      'F2 C3 . . F2 C3 . .',
      'D2 A2 . . D2 A2 . .',
      'Bb1 F2 . . Bb1 F2 . .',
      'C2 G2 . . C2 E2 . .',
      'F2 C3 . . F2 C3 . .',
      'A1 E2 . . A1 E2 . .',
      'Bb1 F2 . . G1 D2 . .',
      'C2 G2 . . C2 . . .',
    ),
    melody: bars(
      'A5 . C6 . F6 - E6 .',
      'D6 - - . A5 - . .',
      'Bb5 . D6 . F6 - D6 .',
      'C6 - - . G5 - . .',
      'A5 . C6 . F6 - A6 .',
      'G6 - E6 - C6 - . .',
      'D6 . Bb5 . G5 . Bb5 .',
      'C6 - - - - - . .',
    ),
    lead: 'triangle',
  },
  puddle: {
    bass: bars(
      'G1 G1 . G1 Bb1 . G1 .',
      'C2 C2 . C2 Eb2 . C2 .',
      'G1 G1 . G1 Bb1 . G1 .',
      'D2 . C2 . Bb1 . A1 .',
      'G1 G1 . G1 Bb1 . G1 .',
      'C2 C2 . C2 Eb2 . C2 .',
      'Eb2 . D2 . C2 . Bb1 .',
      'D2 - - . D2 F#2 A2 .',
    ),
    melody: bars(
      'G4 . Bb4 G4 D5 . . .',
      'C5 . Eb5 C5 G5 . . .',
      'G4 . Bb4 G4 D5 . C5 .',
      'Bb4 . A4 . G4 - . .',
      'D5 . F5 D5 A5 . . .',
      'G5 . Eb5 . C5 - . .',
      'Bb4 . C5 . D5 . Eb5 .',
      'F#5 - - - D5 - . .',
    ),
  },
  queen: {
    bass: bars(
      'A1 A1 A1 . E2 E2 E2 .',
      'F1 F1 F1 . C2 C2 C2 .',
      'D2 D2 D2 . A1 A1 A1 .',
      'E2 E2 E2 . E2 G#2 B2 .',
      'A1 A1 A1 . E2 E2 E2 .',
      'F1 F1 F1 . C2 C2 C2 .',
      'D2 D2 D2 . F2 F2 F2 .',
      'E2 - - . E2 - - .',
    ),
    melody: bars(
      'A4 - C5 - E5 - A5 -',
      'F5 - E5 - C5 - - .',
      'D5 - F5 - A5 - D6 -',
      'C6 - B5 - G#5 - - .',
      'A5 - G5 - E5 - C5 -',
      'F5 - A5 - C6 - A5 -',
      'D6 - C6 - A5 - F5 -',
      'E5 - - - G#5 - - .',
    ),
  },
  hum: {
    bass: bars(
      'E1 E1 . E1 E1 . F1 .',
      'E1 E1 . E1 E1 . G1 .',
      'E1 E1 . E1 E1 . F1 .',
      'C2 C2 . B1 B1 . A1 .',
      'E1 E1 . E1 E1 . F1 .',
      'E1 E1 . E1 E1 . G1 .',
      'A1 A1 . G1 G1 . F1 .',
      'B1 B1 . B1 F1 . E1 .',
    ),
    melody: bars(
      'E4 F4 E4 F4 . . B4 .',
      'E4 F4 E4 F4 . . C5 .',
      'E4 F4 E4 F4 . . B4 .',
      'G4 - F4 - E4 - . .',
      'E5 F5 E5 F5 . . B5 .',
      'E5 F5 E5 F5 . . C6 .',
      'A5 - G5 - F5 - E5 .',
      'D#5 - - - E5 - . .',
    ),
  },
}

function heartbeat(theme: Theme, bpm: number, sprint: boolean): MusicLoop {
  return {
    bpm,
    tracks: [
      { type: 'triangle', vol: 0.1, steps: theme.bass },
      {
        type: theme.lead ?? 'square',
        vol: theme.lead ? 0.06 : 0.03,
        steps: theme.melody,
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

/** The heartbeat loops for each region's theme, one per tier (the last is the sprint). */
const tiers = (theme: Theme) =>
  HEARTBEAT_BPM.map((bpm, i) =>
    heartbeat(theme, bpm, i === HEARTBEAT_BPM.length - 1),
  )

export const HEARTBEATS: Record<ThemeId, readonly MusicLoop[]> = {
  riverbend: tiers(THEMES.riverbend),
  terraces: tiers(THEMES.terraces),
  delta: tiers(THEMES.delta),
  market: tiers(THEMES.market),
  tea: tiers(THEMES.tea),
  swamp: tiers(THEMES.swamp),
  lagoon: tiers(THEMES.lagoon),
}
/** The first region's heartbeat (slice 1's name for it). */
export const HEARTBEAT = HEARTBEATS.riverbend

export const BOSS_MUSIC: Record<BossId, MusicLoop> = {
  hum: heartbeat(THEMES.hum, 132, true),
  puddle: heartbeat(THEMES.puddle, 124, true),
  queen: heartbeat(THEMES.queen, 140, true),
}

/** The credits: the riverbend lullaby grown into a warm anthem in C. */
export const ENDING: MusicLoop = {
  bpm: 96,
  tracks: [
    {
      type: 'triangle',
      vol: 0.09,
      steps: bars(
        'C3 G3 E3 G3 C3 G3 E3 G3',
        'A2 E3 C3 E3 A2 E3 C3 E3',
        'F2 C3 A2 C3 F2 C3 A2 C3',
        'G2 D3 B2 D3 G2 D3 B2 D3',
        'C3 G3 E3 G3 C3 G3 E3 G3',
        'A2 E3 C3 E3 A2 E3 C3 E3',
        'F2 C3 A2 C3 G2 D3 B2 D3',
        'C3 G3 E3 G3 C3 - - .',
      ),
    },
    {
      type: 'square',
      vol: 0.035,
      steps: bars(
        'E5 - - G5 - - C6 -',
        'B5 - A5 - E5 - - .',
        'F5 - - A5 - - C6 -',
        'D6 - C6 - B5 - - .',
        'E5 - G5 - C6 - E6 -',
        'D6 - C6 - A5 - - .',
        'F5 - A5 - D6 - B5 -',
        'C6 - - - - - . .',
      ),
    },
    {
      noise: true,
      vol: 0.015,
      steps: bars(...Array(8).fill('x . . . x . x .')),
    },
  ],
}

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

export const RIVER: MusicLoop = {
  bpm: 76,
  tracks: [
    {
      type: 'triangle',
      vol: 0.08,
      steps: bars(
        'G2 - D3 - B2 - D3 -',
        'E2 - B2 - G2 - B2 -',
        'C3 - G3 - E3 - G3 -',
        'D3 - A3 - F#3 - A3 -',
      ),
    },
    {
      type: 'triangle',
      vol: 0.05,
      steps: bars(
        'B4 - - A4 G4 - - .',
        'E5 - D5 - B4 - - .',
        'C5 - E5 - G5 - E5 .',
        'F#5 - - E5 D5 - - .',
      ),
    },
  ],
}

export const CLINIC_MUSIC: MusicLoop = {
  bpm: 100,
  tracks: [
    {
      type: 'triangle',
      vol: 0.06,
      steps: bars(
        'F2 . C3 . A2 . C3 .',
        'Bb2 . F3 . D3 . F3 .',
        'C3 . G3 . E3 . G3 .',
        'F2 . C3 . F3 . . .',
      ),
    },
    {
      type: 'square',
      vol: 0.025,
      steps: bars(
        'A5 C6 F6 C6 A5 C6 F6 C6',
        'Bb5 D6 F6 D6 Bb5 D6 F6 D6',
        'G5 C6 E6 C6 G5 C6 E6 C6',
        'F5 A5 C6 F6 - - . .',
      ),
    },
  ],
}

/** The heartbeat tier for how much of the wave is left (0..1), or the sprint. */
export function heartbeatTier(left: number, sprint: boolean): number {
  if (sprint) return HEARTBEAT_BPM.length - 1
  if (left > 0.75) return 0
  if (left > 0.5) return 1
  if (left > 0.25) return 2
  return 3
}
