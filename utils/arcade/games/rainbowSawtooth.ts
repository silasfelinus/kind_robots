import { rainbowBossPhase } from './rainbowPinkwakeBoss'

/**
 * B05 Sawtooth Regent: a shark wedge cruiser with a jaw hinge (world bible move sheet: charge jaw warning
 * -> missile hammerhead escort -> fin-to-jaw vulnerability). Every attack is telegraphed. In phase 1 the
 * Regent locks a pilot's lane, opens its jaw for the whole warning, then charges straight down that lane
 * and swims back, fanning its teeth as it returns. In phase 2 it calls two hammerhead escorts and fires a
 * missile from each fin. In phase 3 it alternates the two: every return from a charge leaves the jaw
 * hinge exposed (double damage) while both fins fire.
 */
export type SawtoothBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2 | 3
  nextVolley: number
  volleys: number
  /** The lane the next charge runs down, locked when its warning begins. */
  aimY: number
  /** Charging out along aimY, swimming back to its hold, or neither. */
  charge: 'out' | 'back' | null
  /** Hammerhead escorts the engine should launch this frame. */
  summon: number
  /** The jaw hinge is exposed (double damage) until this frame. */
  exposedUntil: number
}

export type SawtoothProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/** One pilot's share of B05's hull, before rainbowBossHp scales it. */
export const SAWTOOTH_MAX_HP = 205
export const SAWTOOTH = {
  /** The jaw stays open this long before a charge. */
  chargeWarningFrames: 48,
  warningFrames: 36,
  holdX: 400,
  chargeSpeed: 6.5,
  returnSpeed: 3,
  /** The far end of a charge, just short of the left edge. */
  reachX: 60,
  bodyRadius: 30,
  jawRadius: 16,
  /** The jaw hinge sits at the front of the wedge. */
  jawOffset: -38,
  exposedFrames: 90,
  firstVolley: 150,
} as const

export function createSawtoothBoss(
  maxHp: number = SAWTOOTH_MAX_HP,
): SawtoothBoss {
  return {
    x: 540,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: SAWTOOTH.firstVolley,
    volleys: 0,
    aimY: 135,
    charge: null,
    summon: 0,
    exposedUntil: 0,
  }
}

/** Phase 2 fires its fins; phases 1 and 3 charge (phase 3 alternates a charge with a fin volley). */
function nextIsCharge(boss: SawtoothBoss) {
  return boss.phase === 1 || (boss.phase === 3 && boss.volleys % 2 === 0)
}

function warningLength(boss: SawtoothBoss) {
  return nextIsCharge(boss)
    ? SAWTOOTH.chargeWarningFrames
    : SAWTOOTH.warningFrames
}

/** True while an attack is charging: the jaw (or the fins) glow for the full warning. */
export function sawtoothWarning(boss: SawtoothBoss): boolean {
  return (
    boss.charge === null &&
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - warningLength(boss)
  )
}

/** True while the next attack the warning shows is a charge down the marked lane. */
export function sawtoothChargeWarning(boss: SawtoothBoss): boolean {
  return sawtoothWarning(boss) && nextIsCharge(boss)
}

/** True while the jaw hinge takes double damage. */
export function sawtoothExposed(boss: SawtoothBoss): boolean {
  return boss.frame < boss.exposedUntil
}

export function sawtoothJaw(boss: SawtoothBoss): { x: number; y: number } {
  return { x: boss.x + SAWTOOTH.jawOffset, y: boss.y }
}

export function stepSawtoothBoss(
  boss: SawtoothBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): SawtoothProjectile[] {
  boss.frame++
  boss.summon = 0
  const shots: SawtoothProjectile[] = []
  const fire = (x: number, y: number, theta: number, speed: number) =>
    shots.push({
      x,
      y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  const living = targets.filter((ship) => ship.lives > 0)
  const nearest = living.reduce(
    (best, ship) =>
      Math.abs(ship.y - boss.y) < Math.abs(best.y - boss.y) ? ship : best,
    living[0] ?? { x: 80, y: 135, lives: 1 },
  )
  if (boss.charge === 'out') {
    boss.x -= SAWTOOTH.chargeSpeed
    if (boss.x <= SAWTOOTH.reachX) {
      boss.x = SAWTOOTH.reachX
      boss.charge = 'back'
    }
    return shots
  }
  if (boss.charge === 'back') {
    boss.x += SAWTOOTH.returnSpeed
    if (boss.x >= SAWTOOTH.holdX) {
      boss.x = SAWTOOTH.holdX
      boss.charge = null
      // Back at its hold it fans its teeth at the nearest pilot; in phase 3 the jaw hinge hangs open.
      const theta = Math.atan2(nearest.y - boss.y, nearest.x - boss.x)
      for (let i = -2; i <= 2; i++)
        fire(boss.x + SAWTOOTH.jawOffset, boss.y, theta + i * 0.2, 1.8)
      if (boss.phase === 3)
        boss.exposedUntil = boss.frame + SAWTOOTH.exposedFrames
      // The next warning starts only once it is home, so it is always shown in full.
      boss.nextVolley = boss.frame + 110
    }
    return shots
  }
  boss.x = Math.max(SAWTOOTH.holdX, 540 - boss.frame * 1.3)
  // While it holds, the Regent drifts back toward the middle of the lane it charged.
  boss.y += (135 + Math.sin(boss.frame / 70) * 30 - boss.y) * 0.03
  const phase = rainbowBossPhase(boss.hp, boss.maxHp)
  if (phase !== boss.phase) {
    boss.phase = phase
    // A new phase always shows its own full warning, never the tail of an earlier one.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + warningLength(boss) + 1,
    )
  }
  if (
    boss.frame === boss.nextVolley - warningLength(boss) &&
    nextIsCharge(boss)
  )
    boss.aimY = Math.max(50, Math.min(220, nearest.y))
  // During a charge warning the Regent slides onto the lane it marked.
  if (sawtoothChargeWarning(boss)) boss.y += (boss.aimY - boss.y) * 0.12
  if (boss.frame < boss.nextVolley) return shots

  if (nextIsCharge(boss)) {
    boss.y = boss.aimY
    boss.charge = 'out'
    // Rescheduled when the charge is over.
    boss.nextVolley = Number.MAX_SAFE_INTEGER
  } else {
    // Fin missiles: one from each fin, aimed at the nearest pilot; phase 2 also calls two escorts.
    for (const fin of [-30, 30]) {
      const theta = Math.atan2(nearest.y - (boss.y + fin), nearest.x - boss.x)
      fire(boss.x - 10, boss.y + fin, theta, 2.1)
      fire(boss.x - 10, boss.y + fin, theta + Math.sign(fin) * 0.25, 1.6)
    }
    if (boss.phase === 2) boss.summon = 2
    else boss.exposedUntil = boss.frame + SAWTOOTH.exposedFrames
    boss.nextVolley = boss.frame + (boss.phase === 2 ? 150 : 110)
  }
  boss.volleys++
  return shots
}
