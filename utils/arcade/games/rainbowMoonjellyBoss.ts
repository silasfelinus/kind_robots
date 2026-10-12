/** B02 Aurelia Array: translucent bell colony, three fair telegraphed phases. */
export type MoonjellyBoss = {
  x: number
  y: number
  hp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
}
export type MoonjellyProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

export const AURELIA_MAX_HP = 210
export function createMoonjellyBoss(): MoonjellyBoss {
  return { x: 532, y: 132, hp: AURELIA_MAX_HP, frame: 0, phase: 1, nextVolley: 132 }
}

/** Telegraph persists at least 36 full frames, including on a phase change. */
export function moonjellyBossWarning(boss: MoonjellyBoss): boolean {
  return boss.frame >= boss.nextVolley - 36 && boss.frame < boss.nextVolley
}

export function stepMoonjellyBoss(
  boss: MoonjellyBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): MoonjellyProjectile[] {
  boss.frame++
  boss.x = Math.max(398, 532 - boss.frame * 1.45)
  boss.y = 134 + Math.sin(boss.frame / 68) * 32
  const phase = boss.hp > 140 ? 1 : boss.hp > 70 ? 2 : 3
  if (phase !== boss.phase) {
    boss.phase = phase
    boss.nextVolley = Math.max(boss.nextVolley, boss.frame + 37)
  }
  if (boss.frame < boss.nextVolley) return []
  const living = targets.filter((ship) => ship.lives > 0)
  const target = living.reduce(
    (best, ship) => Math.abs(ship.y - boss.y) < Math.abs(best.y - boss.y) ? ship : best,
    living[0] ?? { x: 80, y: 130, lives: 1 },
  )
  const angle = Math.atan2(target.y - boss.y, target.x - boss.x)
  const count = boss.phase === 1 ? 5 : boss.phase === 2 ? 7 : 9
  const gap = boss.phase === 3 ? 0.31 : 0.24
  const shots: MoonjellyProjectile[] = []
  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * gap
    // Two open spokes in the fan in the later phases leave navigable gaps.
    if (boss.phase > 1 && (i === 2 || i === count - 3)) continue
    const theta = angle + offset
    shots.push({
      x: boss.x - 24,
      y: boss.y,
      vx: Math.cos(theta) * (boss.phase === 3 ? 2.2 : 1.8),
      vy: Math.sin(theta) * (boss.phase === 3 ? 2.2 : 1.8),
      grazed: 0,
    })
  }
  boss.nextVolley = boss.frame + (boss.phase === 3 ? 88 : boss.phase === 2 ? 106 : 124)
  return shots
}
