/** B01: Pearl Seahorse. Visible charge pulses precede aimed and fan volleys. */
export type PinkwakeBoss = {
  x: number
  y: number
  hp: number
  frame: number
  phase: 1 | 2 | 3
}

export type BossProjectile = { x: number; y: number; vx: number; vy: number; grazed: number }
export type BossTarget = { x: number; y: number; lives: number }

export const BOSS_MAX_HP = 150

export function createPinkwakeBoss(): PinkwakeBoss {
  return { x: 525, y: 135, hp: BOSS_MAX_HP, frame: 0, phase: 1 }
}

export function stepPinkwakeBoss(
  boss: PinkwakeBoss,
  targets: readonly BossTarget[],
): BossProjectile[] {
  boss.frame++
  boss.x = Math.max(398, 525 - boss.frame * 1.3)
  boss.y = 135 + Math.sin(boss.frame / 62) * 44
  boss.phase = boss.hp > 100 ? 1 : boss.hp > 50 ? 2 : 3

  const period = boss.phase === 3 ? 90 : 126
  if (boss.frame <= 100 || boss.frame % period !== 0) return []

  const target = targets.filter((ship) => ship.lives > 0).sort((a, b) =>
    Math.abs(a.y - boss.y) - Math.abs(b.y - boss.y),
  )[0]
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
  const period = boss.phase === 3 ? 90 : 126
  const phase = boss.frame % period
  return boss.frame > 100 && phase >= period - 36
}
