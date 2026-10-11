// /utils/arcade/prizeShow/music.ts
//
// Prize Show Panic's score (conductor kr-arcade t-029): a chiptune loop for each set and one for the
// boss stages, for the arcade's step sequencer (utils/arcade/sound.ts: note tokens, `-` holds, `.`
// rests, `x` hits on a noise track). Original tunes, eight bars of eight steps (eighth notes) per
// track:
//
//   Opening Night     a bright major game-show bounce with a walking bass.
//   Cooking Showdown  a swung kitchen shuffle, all plinks and pans.
//   Countdown Concert four-on-the-floor at exactly 120 bpm: a beat every 30 ticks, the same beat
//                     the concert's speakers, strobes and mosh pits keep (season.ts CONCERT_BEAT).
//   Galaxy Parade     slow arpeggios floating over a held bass.
//   Boss              a minor-key drive for the big set pieces.
//   Finale            the host's own act: the boss theme, brighter and faster.
//   Ending            the studio theme, slow and warm, under the credits.
//   Jingle            the commercial breaks' bouncy sponsor tune.

import type { MusicLoop } from '../sound'
import { CONCERT_BEAT } from './season'
import type { SetId } from './season'

const bars = (...b: string[]) => b.join(' ')
/** The same bar eight times. */
const eight = (bar: string) => bars(...Array(8).fill(bar))
/** A walking bar: root, fifth, octave, fifth on the beats. */
const walk = (r: string, f: string, o: string) => `${r} . ${f} . ${o} . ${f} .`
/** An oom-pah bar. */
const oompah = (r: string, f: string) => `${r} . ${f} ${f} ${r} . ${f} ${f}`
/** Eighth notes pumping on the root. */
const pump = (r: string) => `${r} ${r} ${r} ${r} ${r} ${r} ${r} ${r}`

const STUDIO: MusicLoop = {
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
        walk('A2', 'E2', 'A2'),
        walk('D3', 'A2', 'D3'),
        walk('G2', 'B2', 'D3'),
      ),
    },
    {
      type: 'square',
      vol: 0.025,
      steps: bars(
        'E5 . G5 . C6 - G5 .',
        'A5 - G5 . E5 . C5 .',
        'F5 . A5 . C6 - A5 .',
        'G5 - - . D5 . G5 .',
        'E5 . G5 . C6 - E6 .',
        'D6 - C6 . A5 . G5 .',
        'F5 . E5 . D5 . F5 .',
        'G5 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.02, steps: eight('x . x . x . x x') },
  ],
}

const KITCHEN: MusicLoop = {
  bpm: 112,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        oompah('F2', 'C3'),
        oompah('F2', 'C3'),
        oompah('Bb2', 'F3'),
        oompah('C3', 'G3'),
        oompah('F2', 'C3'),
        oompah('D3', 'A3'),
        oompah('G2', 'D3'),
        oompah('C3', 'G3'),
      ),
    },
    {
      type: 'square',
      vol: 0.022,
      steps: bars(
        'A5 . C6 A5 . F5 . .',
        'G5 . A5 G5 . F5 . .',
        'D6 . . Bb5 . F5 . D5',
        'E5 . G5 . C6 . . .',
        'A5 . C6 A5 . F5 . .',
        'F#5 . A5 . D6 . C6 .',
        'Bb5 . A5 . G5 . F5 .',
        'E5 . G5 . F5 - - .',
      ),
    },
    {
      type: 'sine',
      vol: 0.03,
      steps: eight('. . F6 . . . C6 .'),
    },
    { noise: true, vol: 0.018, steps: eight('x . . x . . x .') },
  ],
}

const CONCERT: MusicLoop = {
  // 120 bpm, two steps a beat: a beat every half second, CONCERT_BEAT ticks at 60 Hz.
  bpm: 3600 / CONCERT_BEAT,
  tracks: [
    {
      type: 'sawtooth',
      vol: 0.035,
      steps: bars(
        pump('E2'),
        pump('E2'),
        pump('C2'),
        pump('D2'),
        pump('E2'),
        pump('E2'),
        pump('A2'),
        pump('B2'),
      ),
    },
    {
      type: 'square',
      vol: 0.024,
      steps: bars(
        'E5 - - . B4 . E5 .',
        'G5 - F#5 . E5 . D5 .',
        'E5 - - . C5 . E5 .',
        'F#5 - - . D5 . A4 .',
        'E5 - - . B4 . E5 .',
        'G5 - A5 . B5 . G5 .',
        'A5 - G5 . E5 . C5 .',
        'B4 - - - D#5 - - .',
      ),
    },
    { noise: true, vol: 0.03, steps: eight('x . . . x . . .') },
    { noise: true, vol: 0.012, steps: eight('. . x . . . x x') },
  ],
}

const BOSS: MusicLoop = {
  bpm: 144,
  tracks: [
    {
      type: 'triangle',
      vol: 0.075,
      steps: bars(
        'A2 A2 . A2 C3 . A2 .',
        'A2 A2 . A2 E3 . D3 .',
        'F2 F2 . F2 A2 . F2 .',
        'G2 G2 . G2 B2 . D3 .',
        'A2 A2 . A2 C3 . A2 .',
        'A2 A2 . A2 E3 . D3 .',
        'D3 D3 . D3 F3 . D3 .',
        'E3 E3 . E3 G#3 . B3 .',
      ),
    },
    {
      type: 'square',
      vol: 0.026,
      steps: bars(
        'A4 . C5 . E5 - D5 .',
        'C5 . B4 . A4 - - .',
        'F5 . E5 . D5 - C5 .',
        'B4 . D5 . G5 - - .',
        'A4 . C5 . E5 - A5 .',
        'G5 . F5 . E5 - - .',
        'F5 . A5 . D6 - C6 .',
        'B5 - G#5 - E5 - - .',
      ),
    },
    { noise: true, vol: 0.026, steps: eight('x . x x . x x .') },
  ],
}

/** Arpeggios climbing over a held root: a slow, floaty bar. */
const arp = (a: string, b: string, c: string, d: string) =>
  `${a} ${b} ${c} ${d} ${c} ${b} ${a} ${b}`

const GALAXY: MusicLoop = {
  bpm: 100,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        'D2 - - - - - - -',
        'D2 - - - - - - -',
        'Bb1 - - - - - - -',
        'C2 - - - - - - -',
        'D2 - - - - - - -',
        'D2 - - - - - - -',
        'G1 - - - - - - -',
        'A1 - - - A1 - - -',
      ),
    },
    {
      type: 'sine',
      vol: 0.035,
      steps: bars(
        arp('D4', 'F4', 'A4', 'D5'),
        arp('D4', 'F4', 'A4', 'E5'),
        arp('Bb3', 'D4', 'F4', 'Bb4'),
        arp('C4', 'E4', 'G4', 'C5'),
        arp('D4', 'F4', 'A4', 'D5'),
        arp('D4', 'G4', 'Bb4', 'D5'),
        arp('G3', 'Bb3', 'D4', 'G4'),
        arp('A3', 'C#4', 'E4', 'A4'),
      ),
    },
    {
      type: 'square',
      vol: 0.02,
      steps: bars(
        'A5 - - - - - . .',
        'C6 - - - Bb5 - A5 -',
        'F5 - - - - - . .',
        'G5 - - - E5 - C5 -',
        'A5 - - - - - D6 -',
        'D6 - C6 - Bb5 - A5 -',
        'G5 - - - - - Bb5 -',
        'A5 - - - - - - .',
      ),
    },
    { noise: true, vol: 0.012, steps: eight('. . x . . . x .') },
  ],
}

/** The Live Finale's main stage: the boss theme, brighter and faster, for the host's own act. */
const FINALE: MusicLoop = {
  bpm: 152,
  tracks: [
    {
      type: 'triangle',
      vol: 0.075,
      steps: bars(
        'C3 C3 . C3 G2 . C3 .',
        'Bb2 Bb2 . Bb2 F2 . Bb2 .',
        'Ab2 Ab2 . Ab2 Eb3 . Ab2 .',
        'G2 G2 . G2 D3 . G2 .',
        'C3 C3 . C3 G2 . C3 .',
        'Bb2 Bb2 . Bb2 F2 . Bb2 .',
        'Ab2 Ab2 . Ab2 C3 . Eb3 .',
        'G2 . G2 . B2 . D3 .',
      ),
    },
    {
      type: 'square',
      vol: 0.026,
      steps: bars(
        'G5 - Eb5 - C5 - Eb5 -',
        'F5 - D5 - Bb4 - D5 -',
        'Eb5 - C5 - Ab4 - C5 -',
        'D5 - B4 - G4 - B4 -',
        'G5 - Eb5 - C6 - G5 -',
        'F5 - D5 - Bb5 - F5 -',
        'Eb5 - Ab5 - C6 - Eb6 -',
        'D6 - - - B5 - - .',
      ),
    },
    { noise: true, vol: 0.028, steps: eight('x . x . x x x .') },
  ],
}

/** The ending and the credits: the studio theme, slow and warm. */
const ENDING: MusicLoop = {
  bpm: 92,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        walk('C3', 'G2', 'C3'),
        walk('F2', 'C3', 'F3'),
        walk('A2', 'E3', 'A3'),
        walk('G2', 'D3', 'G3'),
        walk('C3', 'G2', 'C3'),
        walk('F2', 'C3', 'F3'),
        walk('G2', 'D3', 'G3'),
        walk('C3', 'G2', 'C3'),
      ),
    },
    {
      type: 'sine',
      vol: 0.04,
      steps: bars(
        'E5 - - - G5 - - -',
        'A5 - - - C6 - - -',
        'C6 - B5 - A5 - - -',
        'G5 - - - - - - -',
        'E5 - - - G5 - - -',
        'A5 - - - F5 - - -',
        'D5 - - - B4 - D5 -',
        'C5 - - - - - - .',
      ),
    },
  ],
}

/** The commercial breaks' jingle: a bright, bouncy sponsor tune. */
const JINGLE: MusicLoop = {
  bpm: 140,
  tracks: [
    {
      type: 'triangle',
      vol: 0.07,
      steps: bars(
        oompah('C3', 'G3'),
        oompah('F2', 'C3'),
        oompah('G2', 'D3'),
        oompah('C3', 'G3'),
        oompah('C3', 'G3'),
        oompah('A2', 'E3'),
        oompah('D3', 'A3'),
        oompah('G2', 'D3'),
      ),
    },
    {
      type: 'square',
      vol: 0.024,
      steps: bars(
        'C6 . G5 . E5 . G5 .',
        'A5 - - . F5 . A5 .',
        'B5 . G5 . D6 - B5 .',
        'C6 - - - . . . .',
        'E6 . C6 . G5 . C6 .',
        'A5 . C6 . E6 - C6 .',
        'D6 . B5 . A5 . F#5 .',
        'G5 - - - . . . .',
      ),
    },
    { noise: true, vol: 0.02, steps: eight('x . x . x . x x') },
  ],
}

/** Each set's loop. */
export const SET_MUSIC: Record<SetId, MusicLoop> = {
  studio: STUDIO,
  kitchen: KITCHEN,
  concert: CONCERT,
  galaxy: GALAXY,
}

export const BOSS_MUSIC = BOSS
export const FINALE_MUSIC = FINALE
export const ENDING_MUSIC = ENDING
export const JINGLE_MUSIC = JINGLE

export const ALL_MUSIC: readonly MusicLoop[] = [
  STUDIO,
  KITCHEN,
  CONCERT,
  GALAXY,
  BOSS,
  FINALE,
  ENDING,
  JINGLE,
]
