/** B01: Pearl Seahorse. Visible charge pulses precede aimed and fan volleys. */
export type PinkwakeBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolleyAt: number
}

export type BossProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}
export type BossTarget = { x: number; y: number; lives: number }

/** One pilot's share of B01's hull, before rainbowBossHp scales it. */
export const BOSS_MAX_HP = 150

/**
 * Hull for a fight that lasts: 2.5 base shares for the first pilot and 4 for each pilot after. A crew
 * out-damages its head count (someone is always lined up with the boss), so four powered-up pilots
 * still see all three phases instead of melting the boss in seconds.
 */
export const RAINBOW_BOSS_HP_FIRST_PILOT = 2.5
export const RAINBOW_BOSS_HP_EXTRA_PILOT = 4
export function rainbowBossHp(base: number, pilots: number): number {
  const extra = Math.max(1, pilots) - 1
  return Math.round(
    base * (RAINBOW_BOSS_HP_FIRST_PILOT + RAINBOW_BOSS_HP_EXTRA_PILOT * extra),
  )
}

/** Phases turn at two thirds and one third of the hull, whatever its size. */
export function rainbowBossPhase(hp: number, maxHp: number): 1 | 2 | 3 {
  return hp > (maxHp * 2) / 3 ? 1 : hp > maxHp / 3 ? 2 : 3
}

export function createPinkwakeBoss(maxHp: number = BOSS_MAX_HP): PinkwakeBoss {
  return {
    x: 525,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolleyAt: 162,
  }
}

export function stepPinkwakeBoss(
  boss: PinkwakeBoss,
  targets: readonly BossTarget[],
): BossProjectile[] {
  boss.frame++
  boss.x = Math.max(398, 525 - boss.frame * 1.3)
  boss.y = 135 + Math.sin(boss.frame / 62) * 44
  const nextPhase = rainbowBossPhase(boss.hp, boss.maxHp)
  if (nextPhase !== boss.phase) {
    boss.phase = nextPhase
    // Damage lands after the boss step in the game loop. Switching phases
    // must never inherit an earlier modulo boundary and fire immediately.
    // The new phase gets a fresh, visible 36-frame warning before a volley.
    boss.nextVolleyAt = boss.frame + 72
  }

  if (boss.frame < boss.nextVolleyAt) return []
  boss.nextVolleyAt = boss.frame + (boss.phase === 3 ? 90 : 126)

  const target = targets
    .filter((ship) => ship.lives > 0)
    .sort((a, b) => Math.abs(a.y - boss.y) - Math.abs(b.y - boss.y))[0]
  const dx = (target?.x ?? 72) - boss.x
  const dy = (target?.y ?? 135) - boss.y
  const angle = Math.atan2(dy, dx)
  const count = boss.phase === 1 ? 3 : boss.phase === 2 ? 5 : 7
  const spread = boss.phase === 3 ? 0.32 : 0.19
  const speed = boss.phase === 3 ? 2.1 : 1.8
  const bullets: BossProjectile[] = []
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spread
    const theta = angle + offset
    bullets.push({
      x: boss.x - 25,
      y: boss.y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  }
  return bullets
}

export function bossTelegraph(boss: PinkwakeBoss): boolean {
  return boss.frame < boss.nextVolleyAt && boss.frame >= boss.nextVolleyAt - 36
}
