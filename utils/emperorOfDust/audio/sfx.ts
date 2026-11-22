// utils/emperorOfDust/audio/sfx.ts
//
// Every Emperor of Dust sound effect as data (conductor emperor-of-dust t-073),
// after the house pattern in utils/cthulhuquariumSfx.ts: short layered voices
// that EmperorSound (./player.ts) plays with WebAudio, so there are no audio
// files to render, ship or license. The palette is a dry wasteland court:
// plucked FM strings like a dulcimer with the felt worn off, brass coins on
// stone, a cracked dawn bell, a frame drum, and wind.
//
// Pure, so the set is testable in Node: every name has a recipe and every
// recipe stays short, quiet and inside the audible range.

export type EmperorSfxName =
  | 'click'
  | 'select'
  | 'confirm'
  | 'brassGain'
  | 'brassSpend'
  | 'questDispatched'
  | 'questWithdrawn'
  | 'questSuccess'
  | 'questFailure'
  | 'followerInjured'
  | 'followerDeath'
  | 'recruit'
  | 'dawnBell'
  | 'actChange'
  | 'achievement'
  | 'save'
  | 'load'
  | 'betrayal'

export interface EmperorSfxVoice {
  /** Seconds after the effect starts. */
  at: number
  /** An oscillator shape, or band-passed white noise. */
  wave: OscillatorType | 'noise'
  /** Hz at the start and end (for noise: the band-pass centre). */
  from: number
  to: number
  seconds: number
  /** Peak gain before the effects and master volumes. */
  peak: number
  /** Noise only: band-pass Q (default 1.4); higher is narrower and drier. */
  q?: number
  /**
   * FM: a sine modulator at `ratio` x the pitch, swinging the pitch by
   * `index` x the pitch at the start and dying away -- a plucked string or a
   * struck coin rather than a pure tone.
   */
  mod?: { ratio: number; index: number }
}

const tone = (
  at: number,
  from: number,
  to: number,
  seconds: number,
  peak: number,
  wave: OscillatorType = 'sine',
): EmperorSfxVoice => ({ at, wave, from, to, seconds, peak })

/** A dry plucked string: FM with a whole-number ratio, quick to die. */
const pluck = (
  at: number,
  hz: number,
  seconds: number,
  peak: number,
  index = 1.6,
): EmperorSfxVoice => ({
  at,
  wave: 'sine',
  from: hz,
  to: hz,
  seconds,
  peak,
  mod: { ratio: 3, index },
})

/** A struck brass coin: FM with an inharmonic ratio. */
const coin = (
  at: number,
  hz: number,
  seconds: number,
  peak: number,
): EmperorSfxVoice => ({
  at,
  wave: 'sine',
  from: hz,
  to: hz * 0.997,
  seconds,
  peak,
  mod: { ratio: 1.41, index: 0.9 },
})

const noise = (
  at: number,
  from: number,
  to: number,
  seconds: number,
  peak: number,
  q?: number,
): EmperorSfxVoice =>
  q === undefined
    ? { at, wave: 'noise', from, to, seconds, peak }
    : { at, wave: 'noise', from, to, seconds, peak, q }

/** A cast bell: a hum, a slightly sharp tierce and a few inharmonic partials. */
const bell = (
  at: number,
  hz: number,
  seconds: number,
  peak: number,
): EmperorSfxVoice[] => [
  tone(at, hz, hz * 0.998, seconds, peak),
  tone(at, hz * 2.0, hz * 2.0, seconds * 0.8, peak * 0.5),
  tone(at, hz * 2.4, hz * 2.39, seconds * 0.6, peak * 0.32),
  tone(at, hz * 3.0, hz * 3.0, seconds * 0.45, peak * 0.2),
  tone(at, hz * 4.2, hz * 4.18, seconds * 0.3, peak * 0.12),
]

/** A frame drum: a falling sine thump with a little skin noise. */
const drum = (at: number, hz: number, peak: number): EmperorSfxVoice[] => [
  tone(at, hz * 1.8, hz, 0.38, peak),
  noise(at, 420, 160, 0.12, peak * 0.3, 0.8),
]

export const EMPEROR_SFX: Readonly<
  Record<EmperorSfxName, readonly EmperorSfxVoice[]>
> = {
  // Any button: a dry tick of wood, barely there.
  click: [
    noise(0, 2600, 1900, 0.035, 0.05, 6),
    tone(0, 900, 720, 0.03, 0.03, 'triangle'),
  ],
  // A room or tab chosen: one plucked string.
  select: [pluck(0, 587.33, 0.32, 0.07)],
  // An answer given, a choice sealed: a fifth plucked upward.
  confirm: [pluck(0, 440, 0.4, 0.07), pluck(0.09, 659.26, 0.55, 0.07)],
  // Brass in: coins dropped into a dish, one bouncing.
  brassGain: [
    coin(0, 2637, 0.22, 0.06),
    coin(0.07, 3136, 0.2, 0.05),
    coin(0.13, 2794, 0.26, 0.045),
    noise(0, 5200, 4200, 0.08, 0.025, 3),
  ],
  // Brass out: one coin set down on stone, then the hand closing.
  brassSpend: [
    coin(0, 2349, 0.18, 0.06),
    tone(0.06, 210, 130, 0.12, 0.08, 'triangle'),
  ],
  // A party sent out: the gate drum, a gust past the walls, a rising fifth.
  questDispatched: [
    ...drum(0, 70, 0.22),
    noise(0.05, 400, 1200, 0.6, 0.05),
    pluck(0.18, 293.66, 0.5, 0.06),
    pluck(0.32, 440, 0.7, 0.06),
  ],
  // A party called back before it rode: the fifth, falling.
  questWithdrawn: [pluck(0, 440, 0.35, 0.06), pluck(0.1, 293.66, 0.5, 0.05)],
  // Orders carried out: three plucks climbing a minor pentatonic over a root.
  questSuccess: [
    tone(0, 146.83, 146.83, 0.9, 0.06, 'triangle'),
    pluck(0, 587.33, 0.45, 0.065),
    pluck(0.12, 698.46, 0.45, 0.065),
    pluck(0.24, 880, 0.8, 0.07),
  ],
  // A failed quest: a half-step sagging, a dull thump under it.
  questFailure: [
    pluck(0, 349.23, 0.5, 0.065),
    pluck(0.16, 329.63, 0.8, 0.06),
    tone(0.16, 120, 70, 0.3, 0.12, 'triangle'),
  ],
  // Someone came home hurt: a thud, and a tritone that does not resolve.
  followerInjured: [
    tone(0, 140, 70, 0.22, 0.14, 'triangle'),
    noise(0, 700, 260, 0.16, 0.05),
    pluck(0.1, 311.13, 0.7, 0.05, 1.1),
    pluck(0.1, 440, 0.7, 0.04, 1.1),
  ],
  // Someone did not come home: rare, so slow and solemn -- a low bell tolled
  // twice, the second further off, and a breath of wind between.
  followerDeath: [
    ...bell(0, 98, 3.6, 0.14),
    noise(0.4, 500, 260, 1.4, 0.025),
    ...bell(1.7, 92.5, 3.2, 0.08),
  ],
  // A new face at court: the door, then a welcoming fifth.
  recruit: [
    noise(0, 520, 900, 0.28, 0.04, 2),
    pluck(0.16, 392, 0.45, 0.065),
    pluck(0.28, 587.33, 0.75, 0.065),
  ],
  // A new day: the tower bell, then its answer from across the valley.
  dawnBell: [...bell(0, 196, 3.2, 0.11), ...bell(0.95, 196, 2.2, 0.04)],
  // A new act: a drum under a swelling low hum and a long gust.
  actChange: [
    ...drum(0, 55, 0.26),
    tone(0, 73.42, 73.42, 2.6, 0.12, 'triangle'),
    tone(0.1, 110, 110, 2.2, 0.06, 'triangle'),
    noise(0.1, 300, 900, 1.8, 0.05),
    ...drum(0.9, 55, 0.18),
  ],
  // An achievement: three bright coins and a small bell, stark not gaudy.
  achievement: [
    coin(0, 1568, 0.3, 0.05),
    coin(0.09, 2093, 0.3, 0.05),
    coin(0.18, 2637, 0.45, 0.05),
    ...bell(0.3, 784, 1.4, 0.04),
  ],
  // Saved: a quill scratch and the wax seal pressed.
  save: [
    noise(0, 3200, 4600, 0.16, 0.035, 4),
    tone(0.18, 170, 95, 0.16, 0.14, 'triangle'),
  ],
  // Loaded or rewound: pages rushing back, then the string re-tuned.
  load: [
    noise(0, 1600, 500, 0.45, 0.05, 1.2),
    pluck(0.32, 293.66, 0.4, 0.055),
    pluck(0.42, 440, 0.6, 0.055),
  ],
  // Komodo's betrayal: a low cluster, a minor second and a tritone grinding,
  // the drum, and the wind falling away.
  betrayal: [
    ...drum(0, 49, 0.28),
    tone(0, 110, 108, 2.2, 0.08, 'sawtooth'),
    tone(0, 116.54, 115, 2.2, 0.07, 'sawtooth'),
    tone(0.05, 155.56, 153, 2.0, 0.06, 'sawtooth'),
    noise(0.2, 1400, 240, 1.8, 0.05),
    pluck(0.6, 233.08, 1.6, 0.05, 2.4),
  ],
}

export const EMPEROR_SFX_NAMES = Object.keys(EMPEROR_SFX) as EmperorSfxName[]

/** The longest voice of an effect, so a test can keep every one short. */
export function emperorSfxSeconds(name: EmperorSfxName): number {
  return Math.max(...EMPEROR_SFX[name].map((voice) => voice.at + voice.seconds))
}
