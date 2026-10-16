/**
 * Mid-Act guardians (world bible tier: scout / veteran / guardian). A guardian is an oversized craft of
 * the Act's signature family that holds the screen for one authored section with no other waves. Every
 * volley follows a 36-frame visible charge; near the end of its section it gives up and escapes, so the
 * Act clock never waits on it. Destroying it pays a bonus and drops a full set of pickups.
 */
import { rainbowBossHp } from './rainbowPinkwakeBoss'

export type RainbowGuardianKind = 'urchin' | 'lantern'

export type RainbowGuardianSection = {
  name: string
  from: number
  to: number
  kind: RainbowGuardianKind
}

export type RainbowGuardian = {
  kind: RainbowGuardianKind
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  nextVolley: number
  volleys: number
  leaving: boolean
}

export type RainbowGuardianShot = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

export const RAINBOW_GUARDIAN = {
  baseHp: 24,
  warningFrames: 36,
  firstVolley: 150,
  /** Frames before its section ends that the guardian gives up and escapes. */
  escapeLead: 240,
  hitRadius: 26,
  bonus: 1500,
  holdX: 384,
} as const

export function createRainbowGuardian(
  kind: RainbowGuardianKind,
  pilots: number,
): RainbowGuardian {
  const maxHp = rainbowBossHp(RAINBOW_GUARDIAN.baseHp, pilots)
  return {
    kind,
    x: 520,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    nextVolley: RAINBOW_GUARDIAN.firstVolley,
    volleys: 0,
    leaving: false,
  }
}

/** True while the guardian is charging a volley: the cue runs for the 36 frames before it fires. */
export function rainbowGuardianWarning(guardian: RainbowGuardian): boolean {
  return (
    !guardian.leaving &&
    guardian.frame < guardian.nextVolley &&
    guardian.frame >= guardian.nextVolley - RAINBOW_GUARDIAN.warningFrames
  )
}

/** True once an escaping guardian has left the playfield. */
export function rainbowGuardianGone(guardian: RainbowGuardian): boolean {
  return guardian.leaving && guardian.x > 520
}

/**
 * Advance one frame. `escape` asks the guardian to give up; it stops attacking at once (a charge in
 * progress is abandoned, never fired) and flies off to the right.
 */
export function stepRainbowGuardian(
  guardian: RainbowGuardian,
  targets: readonly { x: number; y: number; lives: number }[],
  escape: boolean,
): RainbowGuardianShot[] {
  guardian.frame++
  if (escape) guardian.leaving = true
  if (guardian.leaving) {
    guardian.x += 2.4
    return []
  }
  guardian.x = Math.max(RAINBOW_GUARDIAN.holdX, guardian.x - 1.2)
  guardian.y = 135 + Math.sin(guardian.frame / 70) * 42
  if (guardian.frame < guardian.nextVolley) return []
  guardian.volleys++
  const enraged = guardian.hp <= guardian.maxHp / 2
  guardian.nextVolley = guardian.frame + (enraged ? 96 : 120)
  const shots: RainbowGuardianShot[] = []
  const shot = (theta: number, speed: number) =>
    shots.push({
      x: guardian.x - 18,
      y: guardian.y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  if (guardian.kind === 'urchin') {
    // A ring of pearls with a three-pellet gap that walks round the ring from volley to volley.
    const count = enraged ? 16 : 12
    const gap = (guardian.volleys * 5) % count
    for (let i = 0; i < count; i++) {
      const fromGap = (i - gap + count) % count
      if (fromGap < 3) continue
      shot((i / count) * Math.PI * 2, 1.45)
    }
  } else {
    // Two lantern fans either side of the nearest living pilot; the lane straight at them stays open.
    const living = targets.filter((target) => target.lives > 0)
    const target = living.reduce(
      (best, ship) =>
        Math.abs(ship.y - guardian.y) < Math.abs(best.y - guardian.y)
          ? ship
          : best,
      living[0] ?? { x: 80, y: 135, lives: 1 },
    )
    const aim = Math.atan2(target.y - guardian.y, target.x - guardian.x)
    const spread = enraged ? [0.22, 0.34, 0.46, 0.58] : [0.24, 0.38, 0.52]
    for (const side of [-1, 1])
      for (const offset of spread) shot(aim + side * offset, 1.7)
  }
  return shots
}
