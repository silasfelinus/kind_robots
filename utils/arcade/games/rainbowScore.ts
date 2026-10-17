// /utils/arcade/games/rainbowScore.ts
//
// Rainbow Bullet Hell Space Princess's score (conductor rainbow t-012): an original layered chiptune for the
// arcade's step sequencer (utils/arcade/sound.ts). Every Act has its own key, mode and lead figure over one
// shared eight-bar shape; the layers stack with the danger: a pad, bass and lead while the crew flies, a light
// drum when a guardian takes the screen, and drums and a fast arpeggio for a boss. Same tempo and key in every
// layer of an Act, so a fight sounds like the band coming in rather than a new song. The ending and the
// failure ending have their own slow loops. Written from scratch: no samples, no borrowed melodies.

import type { LoopTrack, MusicLoop } from '../sound'

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
/** A MIDI note number as a sequencer token (60 = C4). */
export function noteName(midi: number): string {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11]
const MINOR = [0, 2, 3, 5, 7, 8, 10]

type Mode = 'major' | 'minor'
/** The MIDI note of a scale degree (0-based, may run past an octave) above `root`. */
function degree(root: number, mode: Mode, step: number): number {
  const scale = mode === 'major' ? MAJOR : MINOR
  const octave = Math.floor(step / 7)
  return root + scale[((step % 7) + 7) % 7]! + octave * 12
}

/** The eight bars' chord roots as scale degrees: a lift in major, a long fall in minor. */
const PROGRESSION: Record<Mode, readonly number[]> = {
  major: [0, 4, 5, 3, 0, 4, 3, 4],
  minor: [0, 5, 2, 6, 0, 5, 3, 4],
}
/** Lead figures as chord-tone steps per eighth (0 root, 2 third, 4 fifth, 7 octave; -1 holds). */
const FIGURES: readonly (readonly number[])[] = [
  [0, -1, 2, 4, 7, -1, 4, 2],
  [4, -1, 2, -1, 0, 2, 4, -1],
  [7, 4, 2, 4, 7, -1, -1, 9],
  [0, 2, 4, 2, 0, -1, 4, -1],
]
const ARP = [0, 2, 4, 7, 4, 2, 0, 2]

/** One Act's musical identity: its key (a MIDI root in octave 3), mode, tempo and lead figure. */
export type RainbowActKey = {
  root: number
  mode: Mode
  bpm: number
  figure: number
}

/** Acts I to VIII, then the finale. */
export const RAINBOW_ACT_KEYS: readonly RainbowActKey[] = [
  { root: 50, mode: 'major', bpm: 132, figure: 0 }, // D: Pinkwake, bright and open
  { root: 53, mode: 'major', bpm: 120, figure: 1 }, // F: Moonjelly Fields, floating
  { root: 48, mode: 'minor', bpm: 138, figure: 2 }, // C minor: the Chromatic Trench
  { root: 52, mode: 'major', bpm: 144, figure: 3 }, // E: the Rosefin Express, driving
  { root: 45, mode: 'minor', bpm: 126, figure: 1 }, // A minor: the Blossom Wreckyard
  { root: 55, mode: 'major', bpm: 136, figure: 2 }, // G: the Crown Reef
  { root: 47, mode: 'minor', bpm: 130, figure: 0 }, // B minor: the Glass Current
  { root: 49, mode: 'minor', bpm: 140, figure: 3 }, // C# minor: the Eclipse Palace
  { root: 50, mode: 'minor', bpm: 146, figure: 2 }, // D minor: the Eclipse Crown
]

const bars = (list: string[]) => list.join(' ')

function chordTone(
  key: RainbowActKey,
  bar: number,
  tone: number,
  octave: number,
) {
  const chord = PROGRESSION[key.mode][bar]!
  return noteName(degree(key.root + octave * 12, key.mode, chord + tone))
}

function pad(key: RainbowActKey): LoopTrack {
  return {
    type: 'triangle',
    vol: 0.05,
    steps: bars(
      PROGRESSION[key.mode].map(
        (_, bar) =>
          `${chordTone(key, bar, 0, 0)} - - - ${chordTone(key, bar, 2, 0)} - - -`,
      ),
    ),
  }
}

function bass(key: RainbowActKey, driving: boolean): LoopTrack {
  return {
    type: 'sawtooth',
    vol: 0.022,
    steps: bars(
      PROGRESSION[key.mode].map((_, bar) => {
        const r = chordTone(key, bar, 0, -1)
        const f = chordTone(key, bar, 4, -1)
        return driving
          ? `${r} ${r} ${f} ${r} ${r} ${r} ${f} ${f}`
          : `${r} - . ${r} ${f} - . ${f}`
      }),
    ),
  }
}

function lead(key: RainbowActKey): LoopTrack {
  const figure = FIGURES[key.figure % FIGURES.length]!
  return {
    type: 'square',
    vol: 0.02,
    steps: bars(
      PROGRESSION[key.mode].map((_, bar) =>
        figure
          .map((tone, i) =>
            tone < 0
              ? '-'
              : chordTone(
                  key,
                  bar,
                  bar % 4 === 3 && i === 7 ? tone + 1 : tone,
                  1,
                ),
          )
          .join(' '),
      ),
    ),
  }
}

function arp(key: RainbowActKey): LoopTrack {
  return {
    type: 'square',
    vol: 0.012,
    steps: bars(
      PROGRESSION[key.mode].map((_, bar) =>
        ARP.map((tone) => chordTone(key, bar, tone, 2)).join(' '),
      ),
    ),
  }
}

const drums = (bar: string): LoopTrack => ({
  noise: true,
  vol: 0.022,
  steps: bars(Array(8).fill(bar)),
})

/** An Act's three layers: flying, a guardian on screen, and a boss. */
function actScore(key: RainbowActKey) {
  const flying: MusicLoop = {
    bpm: key.bpm,
    tracks: [pad(key), bass(key, false), lead(key)],
  }
  const guardian: MusicLoop = {
    bpm: key.bpm,
    tracks: [...flying.tracks, drums('x . . . x . . .')],
  }
  const boss: MusicLoop = {
    bpm: key.bpm,
    tracks: [
      pad(key),
      bass(key, true),
      lead(key),
      arp(key),
      drums('x . x . x . x x'),
    ],
  }
  return { flying, guardian, boss }
}

/** The ending: the Pinkwake key, slow, the lead an octave up over the pad. */
const ENDING_KEY: RainbowActKey = {
  root: 50,
  mode: 'major',
  bpm: 84,
  figure: 1,
}
/** The failure ending: the finale's minor key, slower, with no lead to carry it. */
const FAILURE_KEY: RainbowActKey = {
  root: 50,
  mode: 'minor',
  bpm: 70,
  figure: 0,
}

/** What is going on, for choosing the score. */
export type RainbowMusicMoment = {
  act: number
  boss: boolean
  guardian: boolean
  ending: boolean
  failure: boolean
}

/** The loop for this moment: the failure or the ending, else the Act's layer for the danger on screen. */
export function rainbowMusicFor(moment: RainbowMusicMoment): MusicLoop {
  if (moment.failure) return RAINBOW_SCORE.failure
  if (moment.ending) return RAINBOW_SCORE.ending
  const score = RAINBOW_SCORE.acts[Math.max(1, Math.min(9, moment.act)) - 1]!
  return moment.boss
    ? score.boss
    : moment.guardian
      ? score.guardian
      : score.flying
}

export const RAINBOW_SCORE = {
  acts: RAINBOW_ACT_KEYS.map(actScore),
  ending: {
    bpm: ENDING_KEY.bpm,
    tracks: [pad(ENDING_KEY), lead(ENDING_KEY)],
  } as MusicLoop,
  failure: {
    bpm: FAILURE_KEY.bpm,
    tracks: [pad(FAILURE_KEY), bass(FAILURE_KEY, false)],
  } as MusicLoop,
}
