// /utils/arcade/pinball/audio/catalog.ts
//
// Synthesized pinball audio vocabulary. Keeping cue data separate from WebAudio
// makes the machine's sound design deterministic and testable without a browser.

export type PinballBus = 'mechanical' | 'ball' | 'callout' | 'music' | 'ambience'

export type PinballSoundName =
  | 'flipper'
  | 'pop'
  | 'sling'
  | 'launch'
  | 'drain'
  | 'nudge'
  | 'drop'
  | 'scoop'
  | 'kickout'
  | 'spinner'
  | 'shot'
  | 'ramp-enter'
  | 'ramp-exit'
  | 'metal-rail'
  | 'plastic'

export type SynthCue = {
  bus: PinballBus
  frequency: number
  endFrequency?: number
  duration: number
  gain: number
  wave?: OscillatorType
  noise?: boolean
}

export const PINBALL_CUES: Record<PinballSoundName, SynthCue> = {
  flipper: {
    bus: 'mechanical',
    frequency: 82,
    endFrequency: 48,
    duration: 0.055,
    gain: 0.34,
    noise: true,
  },
  pop: {
    bus: 'mechanical',
    frequency: 118,
    endFrequency: 72,
    duration: 0.09,
    gain: 0.3,
    noise: true,
  },
  sling: {
    bus: 'mechanical',
    frequency: 150,
    endFrequency: 80,
    duration: 0.07,
    gain: 0.25,
    noise: true,
  },
  launch: {
    bus: 'mechanical',
    frequency: 70,
    endFrequency: 180,
    duration: 0.13,
    gain: 0.3,
    wave: 'triangle',
  },
  drain: {
    bus: 'ball',
    frequency: 190,
    endFrequency: 58,
    duration: 0.42,
    gain: 0.2,
    wave: 'triangle',
  },
  nudge: {
    bus: 'mechanical',
    frequency: 54,
    duration: 0.07,
    gain: 0.13,
    noise: true,
  },
  drop: {
    bus: 'mechanical',
    frequency: 105,
    endFrequency: 60,
    duration: 0.08,
    gain: 0.27,
    noise: true,
  },
  scoop: {
    bus: 'ball',
    frequency: 135,
    endFrequency: 75,
    duration: 0.11,
    gain: 0.18,
    wave: 'triangle',
  },
  kickout: {
    bus: 'mechanical',
    frequency: 75,
    endFrequency: 230,
    duration: 0.09,
    gain: 0.31,
    noise: true,
  },
  spinner: {
    bus: 'mechanical',
    frequency: 950,
    endFrequency: 620,
    duration: 0.025,
    gain: 0.08,
    wave: 'square',
  },
  shot: {
    bus: 'callout',
    frequency: 740,
    endFrequency: 1100,
    duration: 0.1,
    gain: 0.09,
    wave: 'triangle',
  },
  'ramp-enter': {
    bus: 'ball',
    frequency: 420,
    endFrequency: 650,
    duration: 0.08,
    gain: 0.12,
    wave: 'triangle',
  },
  'ramp-exit': {
    bus: 'ball',
    frequency: 650,
    endFrequency: 360,
    duration: 0.09,
    gain: 0.12,
    wave: 'triangle',
  },
  'metal-rail': {
    bus: 'ball',
    frequency: 1450,
    endFrequency: 920,
    duration: 0.045,
    gain: 0.1,
    wave: 'sine',
  },
  plastic: {
    bus: 'ball',
    frequency: 360,
    endFrequency: 240,
    duration: 0.045,
    gain: 0.08,
    wave: 'triangle',
  },
}

export const PINBALL_CALLOUTS = {
  skillShot: 'SKILL SHOT',
  lock: 'BALL LOCKED',
  multiball: 'AMI MULTIBALL',
  jackpot: 'JACKPOT',
  superJackpot: 'SUPER JACKPOT',
  extraBall: 'EXTRA BALL',
  tilt: 'TILT',
} as const

export type PinballMusicBed = 'mode' | 'multiball'

export const MUSIC_BEDS: Record<PinballMusicBed, readonly number[]> = {
  mode: [110, 165, 220],
  multiball: [146.83, 220, 293.66],
}
