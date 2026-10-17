import { rainbowBossPhase } from './rainbowPinkwakeBoss'

/**
 * B07 Glass Eel: a silver threaded dreadnought whose solid core hides among afterimages (world bible move
 * sheet: fake ghost copy -> delayed ricochet splits -> true core remains outlined). Every attack is
 * telegraphed, and the real eel is always the outlined one. In phase 1 a ghost copy mirrors it across the
 * canyon; both fire a fan, but the ghost's pellets are only light, and after each volley the two trade
 * places. In phase 2 it fires slow pellets at the walls that glance once and split in three after a delay.
 * In phase 3 two afterimages flank it; every body fires a ring (only the real one's is solid), then
 * the true core stays exposed (double damage) and moves to the next of three heights.
 */
export type GlassEelBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
  volleys: number
  /** Where the afterimages sit: one ghost copy in phase 1, three in phase 3. */
  ghosts: number[]
  /** A swap between the real eel and its ghost: frames left, and where each started. */
  swap: number
  swapFrom: number
  swapTo: number
  /** The true core is exposed (double damage) until this frame. */
  exposedUntil: number
}

export type GlassEelProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
  /** A ghost pellet is only light: it never hits. */
  ghost?: boolean
  bounces?: number
  fuse?: number
  burst?: 'split'
}

/** One pilot's share of B07's hull, before rainbowBossHp scales it. */
export const GLASS_EEL_MAX_HP = 220
export const GLASS_EEL = {
  warningFrames: 40,
  coreWarningFrames: 48,
  holdX: 396,
  bodyRadius: 30,
  swapFrames: 30,
  exposedFrames: 80,
  firstVolley: 150,
  /** Phase 3's three heights: the real eel takes one, its afterimages the other two. */
  slots: [75, 135, 195] as number[],
  /** How long a ricochet pellet flies before it splits in three. */
  splitFuse: 90,
} as const

export function createGlassEelBoss(
  maxHp: number = GLASS_EEL_MAX_HP,
): GlassEelBoss {
  return {
    x: 540,
    y: 92,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: GLASS_EEL.firstVolley,
    volleys: 0,
    ghosts: [178],
    swap: 0,
    swapFrom: 92,
    swapTo: 178,
    exposedUntil: 0,
  }
}

function warningLength(boss: GlassEelBoss) {
  return boss.phase === 3
    ? GLASS_EEL.coreWarningFrames
    : GLASS_EEL.warningFrames
}

/** True while an attack is charging: the cue covers the full warning before every volley. */
export function glassEelWarning(boss: GlassEelBoss): boolean {
  return (
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  )
}

/** True while the true core takes double damage. */
export function glassEelExposed(boss: GlassEelBoss): boolean {
  return boss.frame < boss.exposedUntil
}

export function stepGlassEelBoss(
  boss: GlassEelBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): GlassEelProjectile[] {
  boss.frame++
  boss.x = Math.max(GLASS_EEL.holdX, 540 - boss.frame * 1.3)
  const phase = rainbowBossPhase(boss.hp, boss.maxHp)
  if (phase !== boss.phase) {
    boss.phase = phase
    // A new phase always shows its own full warning, never the tail of an earlier one.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + warningLength(boss) + 1,
    )
    boss.swap = 0
    if (phase === 2) {
      boss.y = 135
      boss.ghosts = []
    } else if (phase === 3) {
      boss.y = GLASS_EEL.slots[1]!
      boss.ghosts = [GLASS_EEL.slots[0]!, GLASS_EEL.slots[2]!]
    }
  }
  if (boss.swap > 0) {
    // The real eel and its ghost trade places through the middle of the canyon.
    boss.swap--
    const t = 1 - boss.swap / GLASS_EEL.swapFrames
    const ease = (1 - Math.cos(Math.PI * t)) / 2
    boss.y = boss.swapFrom + (boss.swapTo - boss.swapFrom) * ease
    boss.ghosts = [boss.swapTo + (boss.swapFrom - boss.swapTo) * ease]
  } else if (boss.phase === 2) {
    boss.y = 135 + Math.sin(boss.frame / 60) * 40
  }
  const living = targets.filter((ship) => ship.lives > 0)
  const nearest = living.reduce(
    (best, ship) =>
      Math.abs(ship.y - boss.y) < Math.abs(best.y - boss.y) ? ship : best,
    living[0] ?? { x: 80, y: 135, lives: 1 },
  )
  if (boss.frame < boss.nextVolley) return []

  boss.volleys++
  const shots: GlassEelProjectile[] = []
  const fan = (y: number, ghost: boolean) => {
    const theta = Math.atan2(nearest.y - y, nearest.x - boss.x)
    for (let i = -2; i <= 2; i++)
      shots.push({
        x: boss.x - 24,
        y,
        vx: Math.cos(theta + i * 0.2) * 1.9,
        vy: Math.sin(theta + i * 0.2) * 1.9,
        grazed: 0,
        ...(ghost ? { ghost: true } : {}),
      })
  }
  if (boss.phase === 1) {
    // Fake ghost copy: the real eel and its ghost both fan; then they trade places.
    fan(boss.y, false)
    for (const ghost of boss.ghosts) fan(ghost, true)
    boss.swap = GLASS_EEL.swapFrames
    boss.swapFrom = boss.y
    boss.swapTo = boss.ghosts[0] ?? 270 - boss.y
    boss.nextVolley = boss.frame + 110
  } else if (boss.phase === 2) {
    // Delayed ricochet splits: four slow pellets at the walls that glance once, then split in three.
    for (const angle of [-0.75, -0.35, 0.35, 0.75])
      shots.push({
        x: boss.x - 24,
        y: boss.y,
        vx: -Math.cos(angle) * 1.7,
        vy: Math.sin(angle) * 1.7,
        grazed: 0,
        bounces: 1,
        fuse: GLASS_EEL.splitFuse,
        burst: 'split',
      })
    boss.nextVolley = boss.frame + 130
  } else {
    // True core: every body fires a ring, only the real one's solid; then the core stays exposed.
    const count = 12
    const gap = (boss.volleys * 4) % count
    for (const [index, y] of [boss.y, ...boss.ghosts].entries())
      for (let i = 0; i < count; i++) {
        if ((i - gap + count) % count < 3) continue
        const theta = (i / count) * Math.PI * 2
        shots.push({
          x: boss.x - 10,
          y,
          vx: Math.cos(theta) * 1.5,
          vy: Math.sin(theta) * 1.5,
          grazed: 0,
          ...(index > 0 ? { ghost: true } : {}),
        })
      }
    // The real eel moves to the next slot between rings; its afterimages fill the other two.
    const real = (GLASS_EEL.slots.indexOf(boss.y) + 1) % 3
    boss.y = GLASS_EEL.slots[real]!
    boss.ghosts = GLASS_EEL.slots.filter((_, i) => i !== real)
    boss.exposedUntil = boss.frame + GLASS_EEL.exposedFrames
    boss.nextVolley = boss.frame + 150
  }
  return shots
}
