export interface RainbowSwimPose {
  bob: number
  bank: number
  stretch: number
}

const SWIM_PROFILES = {
  jelly: { speed: 0.065, bob: 1.5, bank: 0.018, stretch: 0.035 },
  eel: { speed: 0.09, bob: 0.7, bank: 0.038, stretch: 0.024 },
  fin: { speed: 0.05, bob: 0.9, bank: 0.045, stretch: 0.014 },
  reef: { speed: 0.075, bob: 0.5, bank: 0.016, stretch: 0.018 },
} as const

const JELLY_SWIMMERS = new Set(['lantern', 'squid', 'urchin', 'brood', 'lampkeeper'])
const EEL_SWIMMERS = new Set(['eel', 'mirror', 'angler'])
const FIN_SWIMMERS = new Set(['dolphin', 'hammerhead', 'skate', 'skimmer'])

export function rainbowSwimPose(
  kind: string,
  frame: number,
  calm = false,
): RainbowSwimPose {
  const family = JELLY_SWIMMERS.has(kind)
    ? 'jelly'
    : EEL_SWIMMERS.has(kind)
      ? 'eel'
      : FIN_SWIMMERS.has(kind)
        ? 'fin'
        : 'reef'
  const profile = SWIM_PROFILES[family]
  const phase = frame * profile.speed + kind.length * 1.37
  const motion = calm ? 0.2 : 1
  return {
    bob: Math.sin(phase) * profile.bob * motion,
    bank: Math.cos(phase * 0.82) * profile.bank * motion,
    stretch: 1 + Math.sin(phase + 0.7) * profile.stretch * motion,
  }
}

export function applyRainbowSwimMotion(
  g: CanvasRenderingContext2D,
  kind: string,
  frame: number,
  calm: boolean,
): void {
  const pose = rainbowSwimPose(kind, frame, calm)
  g.translate(0, pose.bob)
  g.rotate(pose.bank)
  g.scale(1, pose.stretch)
}
