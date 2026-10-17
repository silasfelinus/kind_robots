import { rainbowBossPhase } from './rainbowPinkwakeBoss'

/**
 * B04 Delphion: two dolphin scimitar ships joined by a rear coupling (world bible move sheet: synchronized
 * crossing -> leapfrog lane swap -> link core exposed). Every attack is telegraphed. In phase 1 both twins
 * pulse their beacons, then swap sides through the middle, each firing a fan as it goes. In phase 2 the pair
 * leaps to a new lane; the lanes the twins will hold are marked when the warning starts and fired down when
 * it ends. In phase 3 the twins spread wide and the coupling's link core charges, fires a ring with a gap
 * that walks round, and stays exposed (double damage) for a moment after each ring.
 */
export type DelphionBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
  volleys: number
  /** Half the vertical distance between the twins; negative once they have crossed. */
  gap: number
  /** Frames left in a crossing, leap or spread, and where it runs from and to. */
  move: number
  moveFrames: number
  fromGap: number
  toGap: number
  fromY: number
  toY: number
  /** The lane centre the next leap lands on, locked when its warning begins. */
  aimY: number
  /** The link core is exposed (double damage) until this frame. */
  exposedUntil: number
}

export type DelphionProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/** One pilot's share of B04's hull, before rainbowBossHp scales it. */
export const DELPHION_MAX_HP = 195
export const DELPHION = {
  warningFrames: 36,
  /** The link core charges longer than the other attacks. */
  coreWarningFrames: 48,
  gap: 46,
  wideGap: 66,
  crossFrames: 40,
  leapFrames: 30,
  exposedFrames: 80,
  firstVolley: 150,
  /** The three lanes the pair leaps between in phase 2. */
  lanes: [88, 135, 182],
  twinRadius: 24,
  coreRadius: 15,
  /** The link core sits on the coupling, a little behind the twins' noses. */
  coreOffset: 18,
} as const

export function createDelphionBoss(
  maxHp: number = DELPHION_MAX_HP,
): DelphionBoss {
  return {
    x: 540,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: DELPHION.firstVolley,
    volleys: 0,
    gap: DELPHION.gap,
    move: 0,
    moveFrames: 1,
    fromGap: DELPHION.gap,
    toGap: DELPHION.gap,
    fromY: 135,
    toY: 135,
    aimY: 135,
    exposedUntil: 0,
  }
}

function warningLength(boss: DelphionBoss) {
  return boss.phase === 3 ? DELPHION.coreWarningFrames : DELPHION.warningFrames
}

/** True while an attack is charging: the cue covers the full warning before every volley. */
export function delphionWarning(boss: DelphionBoss): boolean {
  return (
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  )
}

/** True while the link core takes double damage. */
export function delphionExposed(boss: DelphionBoss): boolean {
  return boss.frame < boss.exposedUntil
}

/** The twins' centres: the upper one first while uncrossed. */
export function delphionTwins(
  boss: DelphionBoss,
): Array<{ x: number; y: number }> {
  return [
    { x: boss.x, y: boss.y - boss.gap },
    { x: boss.x, y: boss.y + boss.gap },
  ]
}

/** Where the link core sits on the coupling. */
export function delphionCore(boss: DelphionBoss): { x: number; y: number } {
  return { x: boss.x + DELPHION.coreOffset, y: boss.y }
}

/** The lanes a phase-2 leap will fire down: the twins' places once they land on aimY. */
export function delphionLeapLanes(boss: DelphionBoss): number[] {
  const half = Math.abs(boss.gap)
  return [boss.aimY - half, boss.aimY + half]
}

function startMove(
  boss: DelphionBoss,
  frames: number,
  toGap: number,
  toY: number,
) {
  boss.move = frames
  boss.moveFrames = frames
  boss.fromGap = boss.gap
  boss.toGap = toGap
  boss.fromY = boss.y
  boss.toY = toY
}

export function stepDelphionBoss(
  boss: DelphionBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): DelphionProjectile[] {
  boss.frame++
  boss.x = Math.max(400, 540 - boss.frame * 1.3)
  const phase = rainbowBossPhase(boss.hp, boss.maxHp)
  if (phase !== boss.phase) {
    boss.phase = phase
    // A new phase always shows its own full warning, never the tail of an earlier one.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + warningLength(boss) + 1,
    )
    // The link core phase pulls the twins wide apart around the centre lane.
    if (phase === 3)
      startMove(
        boss,
        DELPHION.crossFrames,
        Math.sign(boss.gap || 1) * DELPHION.wideGap,
        135,
      )
  }
  if (boss.move > 0) {
    boss.move--
    const t = 1 - boss.move / boss.moveFrames
    const ease = (1 - Math.cos(Math.PI * t)) / 2
    boss.gap = boss.fromGap + (boss.toGap - boss.fromGap) * ease
    boss.y = boss.fromY + (boss.toY - boss.fromY) * ease
  }
  const living = targets.filter((ship) => ship.lives > 0)
  const nearest = living.reduce(
    (best, ship) =>
      Math.abs(ship.y - boss.y) < Math.abs(best.y - boss.y) ? ship : best,
    living[0] ?? { x: 80, y: 135, lives: 1 },
  )
  if (
    boss.phase === 2 &&
    boss.frame === boss.nextVolley - warningLength(boss)
  ) {
    // Leapfrog: the lane nearest the nearest pilot, or the next one along if the pair already holds it.
    const lanes = DELPHION.lanes
    const closest = lanes.reduce((best, lane) =>
      Math.abs(lane - nearest.y) < Math.abs(best - nearest.y) ? lane : best,
    )
    boss.aimY =
      Math.abs(closest - boss.y) < 1
        ? lanes[(lanes.indexOf(closest) + 1) % lanes.length]!
        : closest
  }
  if (boss.frame < boss.nextVolley) return []

  boss.volleys++
  const shots: DelphionProjectile[] = []
  const fire = (x: number, y: number, theta: number, speed: number) =>
    shots.push({
      x,
      y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  if (boss.phase === 1) {
    // Synchronized crossing: each twin fires a three-pellet fan at the nearest pilot as the pair swaps sides.
    for (const twin of delphionTwins(boss)) {
      const theta = Math.atan2(nearest.y - twin.y, nearest.x - twin.x)
      for (const spread of [-0.22, 0, 0.22])
        fire(twin.x - 22, twin.y, theta + spread, 1.85)
    }
    startMove(boss, DELPHION.crossFrames, -boss.gap, boss.y)
    boss.nextVolley = boss.frame + 110
  } else if (boss.phase === 2) {
    // Leapfrog lane swap: a fast bolt down each marked lane, then the pair leaps onto them.
    for (const lane of delphionLeapLanes(boss))
      shots.push({ x: boss.x - 22, y: lane, vx: -3.8, vy: 0, grazed: 0 })
    startMove(boss, DELPHION.leapFrames, boss.gap, boss.aimY)
    boss.nextVolley = boss.frame + 96
  } else {
    // Link core: a ring with a three-pellet gap that walks round, then the core stays exposed.
    const core = delphionCore(boss)
    const count = 14
    const gap = (boss.volleys * 4) % count
    for (let i = 0; i < count; i++) {
      if ((i - gap + count) % count < 3) continue
      fire(core.x, core.y, (i / count) * Math.PI * 2, 1.55)
    }
    boss.exposedUntil = boss.frame + DELPHION.exposedFrames
    boss.nextVolley = boss.frame + 150
  }
  return shots
}
