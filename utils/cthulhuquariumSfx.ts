// utils/cthulhuquariumSfx.ts
//
// Every Cthulhuquarium sound effect as data (conductor cthulhuquarium/t-110):
// short layered voices -- a tone gliding from one pitch to another, or a burst
// of filtered noise -- that TankSound (utils/cthulhuquariumSound.ts) plays with
// WebAudio, so there are still no audio files to render, ship or license.
// Pure, so the set is testable: every game event the store or the console
// announces has a recipe, and every recipe stays quiet and short. Names are
// namespaced because Nuxt auto-imports utils/.

export type CthulhuquariumSfxName =
  | 'purchase'
  | 'reveal'
  | 'release'
  | 'clean'
  | 'upgrade'
  | 'floorKey'
  | 'decorPlace'
  | 'decorMove'
  | 'decorRemove'
  | 'setEquip'
  | 'setUnequip'
  | 'scenery'
  | 'milestone'
  | 'bestiaryComplete'
  | 'finale'
  | 'sceneOpen'
  | 'sceneTurn'
  | 'choice'
  | 'tab'
  | 'refuse'
  | 'welcomeBack'
  | 'rareEvent'
  | 'visibility'

export interface CthulhuquariumSfxVoice {
  /** Seconds after the effect starts. */
  at: number
  /** An oscillator shape, or filtered white noise. */
  wave: OscillatorType | 'noise'
  /** Hz at the start and end (for noise: the band-pass centre). */
  from: number
  to: number
  seconds: number
  /** Peak gain before the master volume (the hum sits near 0.2). */
  peak: number
}

const tone = (
  at: number,
  from: number,
  to: number,
  seconds: number,
  peak: number,
  wave: OscillatorType = 'sine',
): CthulhuquariumSfxVoice => ({ at, wave, from, to, seconds, peak })

const noise = (
  at: number,
  from: number,
  to: number,
  seconds: number,
  peak: number,
): CthulhuquariumSfxVoice => ({ at, wave: 'noise', from, to, seconds, peak })

export const CTHULHUQUARIUM_SFX: Readonly<
  Record<CthulhuquariumSfxName, readonly CthulhuquariumSfxVoice[]>
> = {
  // A creature bought: a coin on the counter, then a bubble as it goes in.
  purchase: [
    tone(0, 1568, 1568, 0.12, 0.1),
    tone(0.06, 2093, 2093, 0.16, 0.08),
    tone(0.16, 600, 1300, 0.12, 0.08),
  ],
  // Its field note revealed: a soft glassy shimmer.
  reveal: [
    tone(0, 880, 880, 0.9, 0.05),
    tone(0.08, 1109, 1109, 0.85, 0.05),
    tone(0.16, 1319, 1319, 0.8, 0.05),
    tone(0.26, 1760, 1760, 0.7, 0.04),
  ],
  // Let go: a long bubble sinking away.
  release: [tone(0, 900, 260, 0.45, 0.12), noise(0.05, 700, 300, 0.3, 0.05)],
  // The glass scrubbed clean.
  clean: [noise(0, 1800, 3600, 0.35, 0.09), noise(0.3, 3600, 1600, 0.3, 0.07)],
  // An upgrade fitted: three rising brassy notes.
  upgrade: [
    tone(0, 392, 392, 0.14, 0.07, 'square'),
    tone(0.11, 523, 523, 0.14, 0.07, 'square'),
    tone(0.22, 784, 784, 0.3, 0.07, 'square'),
  ],
  // A floor's key: a jingle of keys, then a heavy lock turning far below.
  floorKey: [
    tone(0, 2637, 2600, 0.12, 0.06, 'triangle'),
    tone(0.05, 3136, 3100, 0.12, 0.05, 'triangle'),
    tone(0.1, 2349, 2320, 0.14, 0.05, 'triangle'),
    tone(0.32, 110, 70, 0.45, 0.28, 'triangle'),
    noise(0.32, 300, 120, 0.4, 0.08),
  ],
  decorPlace: [
    tone(0, 240, 120, 0.16, 0.22, 'triangle'),
    noise(0, 500, 200, 0.12, 0.06),
  ],
  decorMove: [tone(0, 420, 300, 0.1, 0.12, 'triangle')],
  decorRemove: [tone(0, 300, 520, 0.14, 0.12, 'triangle')],
  // A set piece clicks into place and starts working.
  setEquip: [
    tone(0, 1200, 900, 0.05, 0.12, 'square'),
    tone(0.06, 660, 660, 0.35, 0.06),
    tone(0.14, 990, 990, 0.3, 0.05),
  ],
  setUnequip: [
    tone(0, 900, 1200, 0.05, 0.1, 'square'),
    tone(0.06, 660, 440, 0.25, 0.05),
  ],
  // New scenery: the water swirls.
  scenery: [noise(0, 400, 1400, 0.6, 0.08), tone(0.1, 330, 495, 0.6, 0.04)],
  // A milestone: a small bell chord.
  milestone: [
    tone(0, 1047, 1047, 1.1, 0.06),
    tone(0.04, 1319, 1319, 1.0, 0.05),
    tone(0.08, 1568, 1568, 0.95, 0.05),
  ],
  // The book complete: the bell chord, then the octave.
  bestiaryComplete: [
    tone(0, 784, 784, 1.4, 0.06),
    tone(0.05, 988, 988, 1.3, 0.05),
    tone(0.1, 1175, 1175, 1.3, 0.05),
    tone(0.45, 1568, 1568, 1.6, 0.06),
  ],
  // The Last Aquarium: a deep slow gong.
  finale: [
    tone(0, 73, 69, 3.2, 0.3),
    tone(0, 147, 140, 2.6, 0.12),
    tone(0, 233, 228, 2.2, 0.06),
    noise(0, 200, 90, 1.6, 0.05),
  ],
  // A scene opens: a page turned, a curtain of bubbles.
  sceneOpen: [noise(0, 900, 2400, 0.35, 0.06), tone(0.12, 523, 523, 0.5, 0.04)],
  sceneTurn: [noise(0, 2600, 1800, 0.07, 0.035)],
  choice: [tone(0, 700, 940, 0.09, 0.08, 'triangle')],
  tab: [tone(0, 1400, 1100, 0.04, 0.05, 'triangle')],
  // Not enough coins, not yet: a dull knock, never a buzzer.
  refuse: [
    tone(0, 180, 130, 0.12, 0.16, 'triangle'),
    tone(0.1, 150, 110, 0.12, 0.12, 'triangle'),
  ],
  // Back after a while: the tank stirs.
  welcomeBack: [
    tone(0, 440, 440, 0.6, 0.05),
    tone(0.12, 554, 554, 0.6, 0.05),
    tone(0.24, 659, 659, 0.8, 0.05),
    noise(0, 500, 900, 0.5, 0.04),
  ],
  // Something rare happened in the water.
  rareEvent: [
    tone(0, 1760, 1760, 0.5, 0.05),
    tone(0.07, 2217, 2217, 0.5, 0.04),
    tone(0.14, 2637, 2637, 0.6, 0.04),
    tone(0.21, 3520, 3520, 0.6, 0.03),
  ],
  visibility: [tone(0, 660, 880, 0.18, 0.06)],
}

/** The longest effect, so a test can keep every one short. */
export function cthulhuquariumSfxSeconds(name: CthulhuquariumSfxName): number {
  return Math.max(
    ...CTHULHUQUARIUM_SFX[name].map((voice) => voice.at + voice.seconds),
  )
}
