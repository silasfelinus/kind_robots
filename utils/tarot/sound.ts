// /utils/tarot/sound.ts
//
// Kind Tarot's sound palette on the shared arcade WebAudio engine
// (utils/arcade/sound.ts): soft chimes instead of chiptune, and one slow
// ambient loop. No audio files are downloaded.

import type { MusicLoop, Note } from '~/utils/arcade/sound'

export type TarotSfx =
  | 'flip'
  | 'shuffle'
  | 'claim'
  | 'pack'
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'unlock'
  | 'send'

const bell = (freq: number, at = 0, vol = 0.06, dur = 0.6): Note => ({
  freq,
  at,
  vol,
  dur,
  type: 'sine',
})

export const TAROT_SFX: Record<TarotSfx, Note[]> = {
  flip: [{ freq: 900, to: 1500, dur: 0.08, type: 'triangle', vol: 0.04 }],
  shuffle: [
    { freq: 300, dur: 0.05, noise: true, vol: 0.05 },
    { freq: 300, dur: 0.05, noise: true, vol: 0.05, at: 0.07 },
    { freq: 300, dur: 0.05, noise: true, vol: 0.05, at: 0.14 },
    bell(1047, 0.2, 0.04, 0.4),
  ],
  claim: [bell(784), bell(988, 0.12), bell(1319, 0.24, 0.07, 0.9)],
  pack: [
    { freq: 400, to: 1200, dur: 0.35, type: 'triangle', vol: 0.05 },
    { freq: 500, dur: 0.12, noise: true, vol: 0.06, at: 0.3 },
  ],
  common: [bell(880, 0, 0.05, 0.4)],
  uncommon: [bell(880), bell(1109, 0.1, 0.05, 0.5)],
  rare: [bell(880), bell(1109, 0.1), bell(1319, 0.2, 0.06, 0.7)],
  epic: [bell(659), bell(880, 0.1), bell(1109, 0.2), bell(1319, 0.3, 0.07, 1)],
  legendary: [
    bell(523, 0, 0.07, 1.2),
    bell(659, 0.12, 0.07, 1.2),
    bell(784, 0.24, 0.07, 1.2),
    bell(1047, 0.36, 0.08, 1.4),
    bell(1568, 0.5, 0.06, 1.6),
  ],
  unlock: [bell(1047), bell(1319, 0.1), bell(1568, 0.2, 0.06, 0.8)],
  send: [{ freq: 660, to: 990, dur: 0.1, type: 'sine', vol: 0.04 }],
}

/** A slow, warm arpeggio in A minor with a soft pad; loops every 8 bars. */
export const TAROT_AMBIENT: MusicLoop = {
  bpm: 66,
  stepsPerBeat: 2,
  tracks: [
    {
      type: 'sine',
      vol: 0.035,
      steps:
        'A3 C4 E4 A4 E4 C4 A3 . F3 A3 C4 F4 C4 A3 F3 . C3 E3 G3 C4 G3 E3 C3 . G3 B3 D4 G4 D4 B3 G3 .',
    },
    {
      type: 'triangle',
      vol: 0.025,
      steps:
        'A2 - - - - - - - F2 - - - - - - - C3 - - - - - - - G2 - - - - - - -',
    },
    {
      type: 'sine',
      vol: 0.018,
      steps:
        '. . . . E5 - - - . . . . C5 - - - . . . . G5 - - - . . . . D5 - - -',
    },
  ],
}
