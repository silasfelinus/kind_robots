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

export function rainbowSwimPose(
  kind: string,
  frame: number,
  calm = false,
): RainbowSwimPose {
  const family =
    ['lantern', 'squid', 'urchin', 'brood'].includes(kind)
      ? 'jelly'
      : ['eel', 'mirror', 'angler'].includes(kind)
        ? 'eel'
        : ['dolphin', 'hammerhead', 'skate', 'skimmer'].includes(kind)
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
