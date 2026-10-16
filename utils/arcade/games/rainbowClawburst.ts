import { rainbowBossPhase } from './rainbowPinkwakeBoss'

/**
 * B03 Clawburst: a mantis-shrimp punch cannon with a pilot sealed in its joint socket (world bible move
 * sheet: single rail shot -> alternating armour fists -> charge-break window). Every attack is telegraphed;
 * the rail shot and the punch lock their aim when the warning starts, so the lane the cue shows is the
 * lane that fires. After the phase-3 punch the cannon cracks open and takes double damage for a moment.
 */
export type ClawburstBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
  /** The lane the next rail shot or punch is aimed at, locked when its warning begins. */
  aimY: number
  /** Which armour fist throws the next phase-2 fan: 1 below the body, -1 above it. */
  fist: 1 | -1
  volleys: number
  /** The cannon is cracked open (double damage) until this frame. */
  exposedUntil: number
}

export type ClawburstProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/** One pilot's share of B03's hull, before rainbowBossHp scales it. */
export const CLAWBURST_MAX_HP = 180
export const CLAWBURST = {
  warningFrames: 36,
  /** The phase-3 punch charges longer than the other attacks. */
  punchWarningFrames: 48,
  exposedFrames: 75,
  firstVolley: 150,
} as const

export function createClawburstBoss(
  maxHp: number = CLAWBURST_MAX_HP,
): ClawburstBoss {
  return {
    x: 540,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: CLAWBURST.firstVolley,
    aimY: 135,
    fist: 1,
    volleys: 0,
    exposedUntil: 0,
  }
}

function warningLength(boss: ClawburstBoss) {
  return boss.phase === 3
    ? CLAWBURST.punchWarningFrames
    : CLAWBURST.warningFrames
}

/** True while an attack is charging: the cue covers the full warning before every volley. */
export function clawburstWarning(boss: ClawburstBoss): boolean {
  return (
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  )
}

/** True while the cracked cannon takes double damage. */
export function clawburstExposed(boss: ClawburstBoss): boolean {
  return boss.frame < boss.exposedUntil
}

export function stepClawburstBoss(
  boss: ClawburstBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): ClawburstProjectile[] {
  boss.frame++
  boss.x = Math.max(396, 540 - boss.frame * 1.3)
  boss.y = 135 + Math.sin(boss.frame / 60) * 38
  const phase = rainbowBossPhase(boss.hp, boss.maxHp)
  if (phase !== boss.phase) {
    boss.phase = phase
    // A new phase always shows its own full warning, never the tail of an earlier one.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + warningLength(boss) + 1,
    )
  }
  const living = targets.filter((ship) => ship.lives > 0)
  const nearest = living.reduce(
    (best, ship) =>
      Math.abs(ship.y - boss.y) < Math.abs(best.y - boss.y) ? ship : best,
    living[0] ?? { x: 80, y: 135, lives: 1 },
  )
  if (boss.frame === boss.nextVolley - warningLength(boss))
    boss.aimY = nearest.y
  if (boss.frame < boss.nextVolley) return []

  boss.volleys++
  const shots: ClawburstProjectile[] = []
  const fire = (x: number, y: number, theta: number, speed: number) =>
    shots.push({
      x,
      y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  const muzzle = { x: boss.x - 34, y: boss.y }
  if (boss.phase === 1) {
    // Rail shot: one fast bolt down the marked lane, with two slow escorts that close the near gaps.
    const theta = Math.atan2(boss.aimY - muzzle.y, 80 - muzzle.x)
    fire(muzzle.x, muzzle.y, theta, 4.2)
    fire(muzzle.x, muzzle.y, theta - 0.32, 1.5)
    fire(muzzle.x, muzzle.y, theta + 0.32, 1.5)
    boss.nextVolley = boss.frame + 100
  } else if (boss.phase === 2) {
    // Armour fists: a five-pellet fan from the upper or lower fist in turn, aimed at the nearest pilot.
    const fistY = boss.y + boss.fist * 34
    const theta = Math.atan2(nearest.y - fistY, nearest.x - muzzle.x)
    for (let i = -2; i <= 2; i++) fire(muzzle.x, fistY, theta + i * 0.2, 1.9)
    boss.fist = boss.fist === 1 ? -1 : 1
    boss.nextVolley = boss.frame + 84
  } else {
    // Charge-break: a ring punch with a three-pellet gap that walks round, then the cannon cracks open.
    const count = 16
    const gap = (boss.volleys * 5) % count
    for (let i = 0; i < count; i++) {
      if ((i - gap + count) % count < 3) continue
      fire(muzzle.x, muzzle.y, (i / count) * Math.PI * 2, 1.6)
    }
    const theta = Math.atan2(boss.aimY - muzzle.y, 80 - muzzle.x)
    fire(muzzle.x, muzzle.y, theta, 3.6)
    boss.exposedUntil = boss.frame + CLAWBURST.exposedFrames
    boss.nextVolley = boss.frame + 160
  }
  return shots
}
