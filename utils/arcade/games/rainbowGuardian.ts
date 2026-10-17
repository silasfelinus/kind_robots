/**
 * Mid-Act guardians (world bible tier: scout / veteran / guardian). A guardian is an oversized craft of
 * the Act's signature family that holds the screen for one authored section with no other waves. Every
 * volley follows a 36-frame visible charge; near the end of its section it gives up and escapes, so the
 * Act clock never waits on it. Destroying it pays a bonus and drops a full set of pickups.
 */
import { rainbowBossHp } from './rainbowPinkwakeBoss'

export type RainbowGuardianKind =
  'urchin' | 'lantern' | 'clawstrike' | 'courier' | 'salvager' | 'bulwark'

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
  /** A clawstrike guardian's lanes, locked when its warning starts: the lanes its bolts fly. */
  lanes: number[]
}

export type RainbowGuardianShot = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
  /** A courier guardian's cargo mine: frames until it bursts into a ring. */
  fuse?: number
  burst?: 'ring'
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
    lanes: [],
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
  const living = targets.filter((target) => target.lives > 0)
  const nearest = living.reduce(
    (best, ship) =>
      Math.abs(ship.y - guardian.y) < Math.abs(best.y - guardian.y)
        ? ship
        : best,
    living[0] ?? { x: 80, y: 135, lives: 1 },
  )
  if (
    guardian.kind === 'clawstrike' &&
    guardian.frame === guardian.nextVolley - RAINBOW_GUARDIAN.warningFrames
  ) {
    // Three lanes (five when enraged) centred on the nearest pilot; the gaps between them are safe.
    const enraged = guardian.hp <= guardian.maxHp / 2
    const spacing = enraged ? 40 : 52
    const count = enraged ? 5 : 3
    guardian.lanes = Array.from({ length: count }, (_, i) =>
      Math.max(40, Math.min(240, nearest.y + (i - (count - 1) / 2) * spacing)),
    )
  }
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
  } else if (guardian.kind === 'clawstrike') {
    // A straight bolt down every lane its warning marked.
    for (const lane of guardian.lanes)
      shots.push({ x: guardian.x - 18, y: lane, vx: -4.2, vy: 0, grazed: 0 })
  } else if (guardian.kind === 'bulwark') {
    // The shell window opens on a slow sweeping barrier: a fan of pellets that sweeps one way, then back.
    const count = enraged ? 13 : 9
    const aim = Math.atan2(nearest.y - guardian.y, nearest.x - guardian.x)
    const sweep = guardian.volleys % 2 === 0 ? 1 : -1
    for (let i = 0; i < count; i++)
      shot(aim + sweep * (i / (count - 1) - 0.5) * 1.3, 1.05 + i * 0.05)
  } else if (guardian.kind === 'salvager') {
    // Four arms (eight when enraged), each throwing a short line of three pellets; the arms turn by half
    // the gap between them every volley, so the safe wedges move round.
    const arms = enraged ? 8 : 4
    const turn = (guardian.volleys % 2) * (Math.PI / arms)
    for (let arm = 0; arm < arms; arm++)
      for (const speed of [1.25, 1.55, 1.85])
        shot((arm / arms) * Math.PI * 2 + turn, speed)
  } else if (guardian.kind === 'courier') {
    // Cargo mines lobbed in a spread at the nearest pilot; each bursts into a ring where it ripens.
    const aim = Math.atan2(nearest.y - guardian.y, nearest.x - guardian.x)
    const spread = enraged ? [-0.5, -0.17, 0.17, 0.5] : [-0.36, 0, 0.36]
    for (const offset of spread)
      shots.push({
        x: guardian.x - 18,
        y: guardian.y,
        vx: Math.cos(aim + offset) * 1.3,
        vy: Math.sin(aim + offset) * 1.3,
        grazed: 0,
        fuse: 80,
        burst: 'ring',
      })
  } else {
    // Two lantern fans either side of the nearest living pilot; the lane straight at them stays open.
    const target = nearest
    const aim = Math.atan2(target.y - guardian.y, target.x - guardian.x)
    const spread = enraged ? [0.22, 0.34, 0.46, 0.58] : [0.24, 0.38, 0.52]
    for (const side of [-1, 1])
      for (const offset of spread) shot(aim + side * offset, 1.7)
  }
  return shots
}
