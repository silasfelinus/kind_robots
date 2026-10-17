import { rainbowBossPhase } from './rainbowPinkwakeBoss'

/**
 * B08 Prism Leviathan: a vast whale-shaped palace escort with a forehead gem (world bible move sheet: tidal
 * resonant wave -> four removable spire locks -> whale core stabilizes). Every attack is telegraphed. In
 * phase 1 its gem marks a gap for the whole warning, then a resonant wall of pellets rolls across the
 * screen with that gap open. In phase 2 four spire locks on its back each fire an aimed pellet every volley;
 * each lock can be shot off, and with all four gone it falls back to the tidal wall. In phase 3 the core
 * charges, fires two rings that share one gap, and the forehead gem stays exposed (double damage) for a
 * moment after each pair.
 */
export type PrismLeviathanBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
  volleys: number
  /** The centre of the tidal wall's gap, locked when its warning begins, and the volley it was locked for. */
  gapY: number
  gapFor: number
  /** Each spire lock's hull, front to back. Zero means it has been shot off. */
  locks: [number, number, number, number]
  /** The forehead gem is exposed (double damage) until this frame. */
  exposedUntil: number
}

export type PrismLeviathanProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/** One pilot's share of B08's hull, before rainbowBossHp scales it. */
export const PRISM_LEVIATHAN_MAX_HP = 230
export const PRISM_LEVIATHAN = {
  warningFrames: 44,
  coreWarningFrames: 48,
  holdX: 392,
  bodyRadius: 36,
  /** Half the height of the tidal wall's gap. */
  gapHalf: 26,
  /** The spire locks ride along its back, this high above the body. */
  lockOffsets: [-30, -10, 10, 30] as number[],
  lockRise: 34,
  lockRadius: 11,
  /** A lock's share of the hull it was given. */
  lockShare: 0.07,
  gemOffset: 34,
  gemRadius: 13,
  exposedFrames: 80,
  firstVolley: 150,
} as const

export function createPrismLeviathanBoss(
  maxHp: number = PRISM_LEVIATHAN_MAX_HP,
): PrismLeviathanBoss {
  const lock = Math.max(5, Math.round(maxHp * PRISM_LEVIATHAN.lockShare))
  return {
    x: 540,
    y: 140,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: PRISM_LEVIATHAN.firstVolley,
    volleys: 0,
    gapY: 135,
    gapFor: -1,
    locks: [lock, lock, lock, lock],
    exposedUntil: 0,
  }
}

function warningLength(boss: PrismLeviathanBoss) {
  return boss.phase === 3
    ? PRISM_LEVIATHAN.coreWarningFrames
    : PRISM_LEVIATHAN.warningFrames
}

/** True while an attack is charging: the cue covers the full warning before every volley. */
export function prismLeviathanWarning(boss: PrismLeviathanBoss): boolean {
  return (
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  )
}

/** True while the forehead gem takes double damage. */
export function prismLeviathanExposed(boss: PrismLeviathanBoss): boolean {
  return boss.frame < boss.exposedUntil
}

/** True while the coming volley is the tidal wall (so its gap is marked). */
export function prismLeviathanTidal(boss: PrismLeviathanBoss): boolean {
  return (
    boss.phase === 1 ||
    (boss.phase === 2 && boss.locks.every((lock) => lock <= 0))
  )
}

/** The spire locks' centres, front to back. */
export function prismLeviathanLocks(
  boss: PrismLeviathanBoss,
): Array<{ x: number; y: number }> {
  return PRISM_LEVIATHAN.lockOffsets.map((offset) => ({
    x: boss.x + offset,
    y: boss.y - PRISM_LEVIATHAN.lockRise,
  }))
}

export function prismLeviathanGem(boss: PrismLeviathanBoss): {
  x: number
  y: number
} {
  return { x: boss.x - PRISM_LEVIATHAN.gemOffset, y: boss.y - 4 }
}

export function stepPrismLeviathanBoss(
  boss: PrismLeviathanBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): PrismLeviathanProjectile[] {
  boss.frame++
  boss.x = Math.max(PRISM_LEVIATHAN.holdX, 540 - boss.frame * 1.1)
  boss.y = 140 + Math.sin(boss.frame / 90) * 20
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
    prismLeviathanTidal(boss) &&
    boss.gapFor !== boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  ) {
    // A wall always shows its full warning: if the last spire lock falls mid-charge, the charge restarts.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + warningLength(boss),
    )
    boss.gapFor = boss.nextVolley
    // The gap opens away from the nearest pilot, so every wall asks the crew to move.
    const away = nearest.y < 135 ? 1 : -1
    boss.gapY = Math.max(60, Math.min(220, nearest.y + away * 70))
  }
  if (boss.frame < boss.nextVolley) return []

  boss.volleys++
  const shots: PrismLeviathanProjectile[] = []
  const fire = (x: number, y: number, theta: number, speed: number) =>
    shots.push({
      x,
      y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  if (prismLeviathanTidal(boss)) {
    // The tidal wall: a rolling column of pellets, curved like a wave, with the marked gap open.
    for (let y = 36; y <= 246; y += 12) {
      if (Math.abs(y - boss.gapY) < PRISM_LEVIATHAN.gapHalf) continue
      shots.push({
        x: boss.x - 40 + Math.sin(y / 32) * 14,
        y,
        vx: -2.3,
        vy: 0,
        grazed: 0,
      })
    }
    boss.nextVolley = boss.frame + (boss.phase === 1 ? 110 : 130)
  } else if (boss.phase === 2) {
    // Each surviving spire lock fires one aimed pellet.
    for (const [i, lock] of prismLeviathanLocks(boss).entries()) {
      if (boss.locks[i]! <= 0) continue
      fire(
        lock.x - 8,
        lock.y,
        Math.atan2(nearest.y - lock.y, nearest.x - lock.x),
        1.9,
      )
    }
    boss.nextVolley = boss.frame + 70
  } else {
    // Whale core: two rings at different speeds that share one gap, then the gem stays exposed.
    const gem = prismLeviathanGem(boss)
    const count = 14
    const gap = (boss.volleys * 4) % count
    for (const speed of [1.25, 1.75])
      for (let i = 0; i < count; i++) {
        if ((i - gap + count) % count < 3) continue
        fire(gem.x, gem.y, (i / count) * Math.PI * 2, speed)
      }
    boss.exposedUntil = boss.frame + PRISM_LEVIATHAN.exposedFrames
    boss.nextVolley = boss.frame + 160
  }
  return shots
}
