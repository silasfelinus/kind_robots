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

const JELLY_SWIMMERS = new Set([
  'lantern',
  'squid',
  'urchin',
  'brood',
  'lampkeeper',
])
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

/**
 * Conductor rainbow t-011: a craft a shot just hurt flinches, a quick squash that springs back over the
 * white-flash frames, so a hit reads on the body as well as the colour. Calm motion keeps the flash only.
 */
export function rainbowHitFlinch(
  flash: number,
  flashFrames: number,
  calm = false,
): { x: number; y: number } {
  if (calm || flash <= 0 || flashFrames <= 0) return { x: 1, y: 1 }
  const t = Math.min(1, flash / flashFrames)
  const squash = 0.14 * t * t
  return { x: 1 - squash, y: 1 + squash * 0.6 }
}

/**
 * Conductor rainbow t-011: the pilot's craft banks into a climb or a dive and leans into a surge — stretching
 * as it pushes forward, squatting as it backs off. Draw-only: the hitbox never moves. Calm motion keeps a
 * fifth of the pose, the same share the swimmers keep.
 */
export function rainbowShipPose(
  bank: number,
  thrust: number,
  calm = false,
): { rotate: number; scaleX: number; scaleY: number } {
  const motion = calm ? 0.2 : 1
  const lean = Math.max(-0.1, Math.min(0.1, thrust * 0.025)) * motion
  return {
    rotate: Math.max(-0.35, Math.min(0.35, bank * 0.12)) * motion,
    scaleX: 1 + lean,
    scaleY:
      (1 - Math.min(0.18, Math.abs(bank) * 0.05) * motion) * (1 - lean * 0.5),
  }
}

/**
 * Conductor rainbow t-011: a boss winds up before a volley. Across the warning window it draws back and
 * swells, deepest just before the shots leave, so the body tells the beat as well as the glow ring. Draw-only:
 * the hitbox never moves. Calm motion keeps a fifth of the pose; the ring still carries the warning.
 */
export function rainbowBossWindup(
  framesToVolley: number,
  warnFrames: number,
  calm = false,
): { pull: number; scaleX: number; scaleY: number } {
  if (warnFrames <= 0 || framesToVolley <= 0 || framesToVolley > warnFrames)
    return { pull: 0, scaleX: 1, scaleY: 1 }
  const t = 1 - (framesToVolley - 1) / warnFrames
  const ease = t * t * (calm ? 0.2 : 1)
  return { pull: 4 * ease, scaleX: 1 - 0.03 * ease, scaleY: 1 + 0.06 * ease }
}

/** Frames a boss's body rocks back after a shot lands. */
export const BOSS_RECOIL_FRAMES = 8

/**
 * Conductor rainbow t-011: a boss a shot just hit rocks back and squashes, settling over a few frames, so the
 * player sees the hit land on the body. Draw-only: the hitbox never moves. Calm motion keeps it still.
 */
export function rainbowBossRecoil(
  framesSinceHit: number,
  calm = false,
): { pull: number; scaleX: number; scaleY: number } {
  if (calm || !(framesSinceHit >= 0) || framesSinceHit >= BOSS_RECOIL_FRAMES)
    return { pull: 0, scaleX: 1, scaleY: 1 }
  const t = 1 - framesSinceHit / BOSS_RECOIL_FRAMES
  const k = t * t
  return { pull: 2.5 * k, scaleX: 1 - 0.04 * k, scaleY: 1 + 0.025 * k }
}

/** Stacks two draw-only body poses (a windup and a recoil): pulls add, scales multiply. */
export function stackRainbowBossPose(
  a: { pull: number; scaleX: number; scaleY: number },
  b: { pull: number; scaleX: number; scaleY: number },
): { pull: number; scaleX: number; scaleY: number } {
  return {
    pull: a.pull + b.pull,
    scaleX: a.scaleX * b.scaleX,
    scaleY: a.scaleY * b.scaleY,
  }
}
