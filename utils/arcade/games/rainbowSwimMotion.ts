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

/**
 * Conductor rainbow t-011: a small craft that charges before it acts (a squid's glint, a harbinger's warm-up, a
 * turret unfolding, a hammerhead's lock, a brood's shadow) tenses its body across that warning, the boss
 * windup at half strength, so a school's shooter reads apart from the swimmers. Draw-only: the hitbox never
 * moves. Calm motion keeps a fifth, like the boss.
 */
export function rainbowCraftWindup(
  framesToAct: number,
  warnFrames: number,
  calm = false,
): { pull: number; scaleX: number; scaleY: number } {
  const boss = rainbowBossWindup(framesToAct, warnFrames, calm)
  return {
    pull: boss.pull / 2,
    scaleX: 1 - (1 - boss.scaleX) / 2,
    scaleY: 1 + (boss.scaleY - 1) / 2,
  }
}

/** Frames the pilot's craft jolts after a hit lands (well inside the 90-frame invulnerability). */
export const SHIP_JOLT_FRAMES = 10

/**
 * Conductor rainbow t-011: when a shot gets through, the pilot's craft is knocked back against its heading,
 * twists and squashes, then settles over SHIP_JOLT_FRAMES, so the hit reads on her ship and not only on the
 * shield count and blink. Draw-only: the hitbox never moves. Calm motion keeps it still.
 */
export function rainbowShipJolt(
  framesSinceHit: number,
  calm = false,
): { pull: number; rotate: number; scaleX: number; scaleY: number } {
  if (calm || !(framesSinceHit >= 0) || framesSinceHit >= SHIP_JOLT_FRAMES)
    return { pull: 0, rotate: 0, scaleX: 1, scaleY: 1 }
  const t = 1 - framesSinceHit / SHIP_JOLT_FRAMES
  const k = t * t
  return {
    pull: 3 * k,
    rotate: 0.12 * k * Math.cos(framesSinceHit * 0.9),
    scaleX: 1 - 0.08 * k,
    scaleY: 1 + 0.05 * k,
  }
}

/**
 * Conductor rainbow t-011: a pilot's craft holding still hovers — a slow bob and a slight sway, offset per seat
 * so a parked formation never bobs in lockstep — and the hover fades out as she banks or surges, where the
 * flight pose takes over. Draw-only and applied to the painted hull alone, so the hitbox and its core marker
 * never move. Calm motion keeps a fifth, the same share the swimmers keep.
 */
export function rainbowShipHover(
  frame: number,
  seat: number,
  bank: number,
  thrust: number,
  calm = false,
): { bob: number; tilt: number } {
  const idle = Math.max(
    0,
    Math.min(1, 1 - Math.abs(bank) * 0.5 - Math.abs(thrust) * 0.25),
  )
  const motion = (calm ? 0.2 : 1) * idle
  if (motion === 0) return { bob: 0, tilt: 0 }
  const phase = frame * 0.06 + seat * 1.7
  return {
    bob: Math.sin(phase) * 1.2 * motion,
    tilt: Math.cos(phase * 0.8) * 0.03 * motion,
  }
}

/**
 * Conductor rainbow t-011: Maribel's barrel roll turns her craft over once across the roll. Calm motion keeps a
 * fifth of the turn — a shallow squash that still shows the evade fired — instead of a full flip.
 */
export function rainbowBarrelRoll(
  evade: number,
  rollFrames: number,
  calm = false,
): number {
  if (rollFrames <= 0 || evade <= 0) return 1
  const turn = Math.cos(
    (1 - Math.min(evade, rollFrames) / rollFrames) * Math.PI * 2,
  )
  return calm ? 1 - 0.2 * ((1 - turn) / 2) : turn
}

/**
 * Conductor rainbow t-011: a loose pickup bobs and its ring pulses so it reads as something to grab. Calm motion
 * keeps a fifth of the bob and pulse, the same share the swimmers and the parked craft keep, so a pickup still
 * shimmers without sliding. The fallback badge and the ring share this one bob, so neither drifts off the other.
 */
export function rainbowPickupBob(
  tick: number,
  x: number,
  calm = false,
): { bob: number; pulse: number; glow: number } {
  const share = calm ? 0.2 : 1
  const wave = Math.sin(tick / 6)
  return {
    bob: Math.sin(tick / 9 + x / 40) * 2.5 * share,
    pulse: 1 + wave * 0.1 * share,
    glow: 0.35 + 0.2 * wave * share,
  }
}

/**
 * Conductor rainbow t-011: a live eel barrier crackles — its alpha flickers and each link of the current
 * jitters — and the Prism Beam's width throbs. Both run every couple of frames, the fastest flicker on the
 * screen, so calm motion keeps a fifth of each: the barrier still reads as live current and the beam as
 * firing, without strobing. Draw-only: the barrier's and the beam's hitboxes never change.
 */
export function rainbowCurrentCrackle(
  tick: number,
  calm = false,
): { alpha: number; jitter: (link: number) => number; beamWidth: number } {
  const share = calm ? 0.2 : 1
  return {
    alpha: 0.85 + 0.15 * Math.sin(tick / 2) * share,
    jitter: (link: number) => Math.sin(tick + link * 2) * 2.5 * share,
    beamWidth: 6 + Math.sin(tick / 2) * 2 * share,
  }
}

/**
 * Conductor rainbow t-011: the small signal lights — the captive's collar, a glowing prism pylon's core, a
 * relay pylon's lamp and a staggered dolphin's daze ring — pulse every few frames. Calm motion keeps a fifth
 * of each swing, the share every other flicker keeps, so each light still reads as live without blinking.
 * Returns the signed swing (−1..1 in full motion) to scale by the caller's own depth. Draw-only.
 */
export function rainbowSignalPulse(
  tick: number,
  period: number,
  calm = false,
): number {
  return Math.sin(tick / period) * (calm ? 0.2 : 1)
}
