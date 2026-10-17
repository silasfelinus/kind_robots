import { rainbowBossPhase } from './rainbowPinkwakeBoss'

/**
 * B06 Lantern Ray: an immense manta carrier with beacons on its underside (world bible move sheet: broad
 * shadow lanes -> two removable drone nurseries -> beacon exposed). Every attack is telegraphed. In phase 1
 * its wings cast two broad shadow lanes for the whole warning, then a wall of pellets races down each
 * shadow; the light between and around them is safe. In phase 2 its two wing nurseries each launch an
 * interceptor drone and fire an aimed pair every volley; either nursery can be shot off, and then stops.
 * In phase 3 the underside beacon charges, fires a ring with a gap that walks round, and stays exposed
 * (double damage) for a moment after each ring.
 */
export type LanternRayBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
  volleys: number
  /** The centres of the two shadow lanes, locked when their warning begins. */
  lanes: number[]
  /** Each wing nursery's hull: upper first. Zero means it has been shot off. */
  nurseries: [number, number]
  /** Interceptor drones the engine should launch this frame, by nursery: their y positions. */
  launches: number[]
  /** The beacon is exposed (double damage) until this frame. */
  exposedUntil: number
}

export type LanternRayProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/** One pilot's share of B06's hull, before rainbowBossHp scales it. */
export const LANTERN_RAY_MAX_HP = 215
export const LANTERN_RAY = {
  warningFrames: 40,
  beaconWarningFrames: 48,
  holdX: 396,
  /** Half the height of a shadow lane. */
  laneHalf: 22,
  bodyRadius: 34,
  /** Each wing nursery sits this far above or below the body. */
  nurseryOffset: 42,
  nurseryRadius: 15,
  /** A nursery's share of the hull it was given. */
  nurseryShare: 0.12,
  beaconOffset: 22,
  beaconRadius: 14,
  exposedFrames: 80,
  firstVolley: 150,
} as const

export function createLanternRayBoss(
  maxHp: number = LANTERN_RAY_MAX_HP,
): LanternRayBoss {
  const nursery = Math.max(6, Math.round(maxHp * LANTERN_RAY.nurseryShare))
  return {
    x: 540,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: LANTERN_RAY.firstVolley,
    volleys: 0,
    lanes: [],
    nurseries: [nursery, nursery],
    launches: [],
    exposedUntil: 0,
  }
}

function warningLength(boss: LanternRayBoss) {
  return boss.phase === 3
    ? LANTERN_RAY.beaconWarningFrames
    : LANTERN_RAY.warningFrames
}

/** True while an attack is charging: the cue covers the full warning before every volley. */
export function lanternRayWarning(boss: LanternRayBoss): boolean {
  return (
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  )
}

/** True while the underside beacon takes double damage. */
export function lanternRayExposed(boss: LanternRayBoss): boolean {
  return boss.frame < boss.exposedUntil
}

/** The wing nurseries' centres, upper first. */
export function lanternRayNurseries(
  boss: LanternRayBoss,
): Array<{ x: number; y: number }> {
  return [-1, 1].map((side) => ({
    x: boss.x + 10,
    y: boss.y + side * LANTERN_RAY.nurseryOffset,
  }))
}

export function lanternRayBeacon(boss: LanternRayBoss): {
  x: number
  y: number
} {
  return { x: boss.x, y: boss.y + LANTERN_RAY.beaconOffset }
}

export function stepLanternRayBoss(
  boss: LanternRayBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): LanternRayProjectile[] {
  boss.frame++
  boss.launches = []
  boss.x = Math.max(LANTERN_RAY.holdX, 540 - boss.frame * 1.2)
  boss.y = 135 + Math.sin(boss.frame / 80) * 24
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
  if (
    boss.phase === 1 &&
    boss.frame === boss.nextVolley - warningLength(boss)
  ) {
    // Two shadows: one over the nearest pilot, one across the field from it.
    const first = Math.max(56, Math.min(214, nearest.y))
    const second = first < 135 ? first + 92 : first - 92
    boss.lanes = [first, second]
  }
  if (boss.frame < boss.nextVolley) return []

  boss.volleys++
  const shots: LanternRayProjectile[] = []
  const fire = (x: number, y: number, theta: number, speed: number) =>
    shots.push({
      x,
      y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  if (boss.phase === 1) {
    // A wall of pellets down each shadow lane, filling it edge to edge.
    for (const lane of boss.lanes)
      for (let row = -2; row <= 2; row++)
        shots.push({
          x: boss.x - 30,
          y: lane + (row * LANTERN_RAY.laneHalf) / 2.5,
          vx: -3.1,
          vy: 0,
          grazed: 0,
        })
    boss.nextVolley = boss.frame + 120
  } else if (boss.phase === 2) {
    // Each surviving nursery launches a drone and fires an aimed pair.
    for (const [i, nursery] of lanternRayNurseries(boss).entries()) {
      if (boss.nurseries[i]! <= 0) continue
      boss.launches.push(nursery.y)
      const theta = Math.atan2(nearest.y - nursery.y, nearest.x - nursery.x)
      fire(nursery.x - 12, nursery.y, theta - 0.12, 1.9)
      fire(nursery.x - 12, nursery.y, theta + 0.12, 1.9)
    }
    // With both nurseries gone it keeps its shadows instead.
    if (boss.launches.length === 0)
      for (let row = -2; row <= 2; row++)
        shots.push({
          x: boss.x - 30,
          y: nearest.y + (row * LANTERN_RAY.laneHalf) / 2.5,
          vx: -2.6,
          vy: 0,
          grazed: 0,
        })
    boss.nextVolley = boss.frame + 130
  } else {
    // Beacon: a ring with a three-pellet gap that walks round, then the beacon stays exposed.
    const beacon = lanternRayBeacon(boss)
    const count = 16
    const gap = (boss.volleys * 5) % count
    for (let i = 0; i < count; i++) {
      if ((i - gap + count) % count < 3) continue
      fire(beacon.x, beacon.y, (i / count) * Math.PI * 2, 1.5)
    }
    boss.exposedUntil = boss.frame + LANTERN_RAY.exposedFrames
    boss.nextVolley = boss.frame + 150
  }
  return shots
}
