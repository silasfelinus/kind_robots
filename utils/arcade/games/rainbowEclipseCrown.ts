/**
 * B09 Eclipse Crown: a circular crown-machine around a heart node, the finale's single dramatic boss (world
 * bible move sheet: spoke hazard with generous gaps -> moving exposed heart -> team escape through shrinking
 * prism corridors). Every attack is telegraphed. While the crown holds more than half its hull, it marks six
 * spokes for the whole warning and then fires pellets down them; the spokes turn a little every volley and
 * the wedges between them are wide. Below half, the heart node breaks loose and drifts on a slow figure of
 * eight: only the heart takes damage now, and the crown fires rings with a walking gap. When the heart is
 * spent the crown stops (the engine runs the final choice), and then the escape: prism walls roll in from
 * the right with one gap each, and the gaps narrow as the heart collapses. The escape is not a damage race:
 * it ends when the crew has flown its length.
 */
export type EclipseCrownBoss = {
  x: number
  y: number
  hp: number
  maxHp: number
  frame: number
  phase: 1 | 2
  nextVolley: number
  volleys: number
  /** The first spoke's angle, locked when its warning begins. */
  spokeAngle: number
  /** The heart node: home in the crown in phase 1, drifting free in phase 2. */
  heartX: number
  heartY: number
}

export type EclipseCrownProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/** One pilot's share of B09's heart, before rainbowBossHp scales it. */
export const ECLIPSE_CROWN_MAX_HP = 300
export const ECLIPSE_CROWN = {
  warningFrames: 48,
  holdX: 352,
  ringRadius: 44,
  heartRadius: 15,
  spokes: 6,
  /** How far the spokes turn between volleys. */
  spokeTurn: Math.PI / 9,
  firstVolley: 150,
} as const

/** The escape through the prism corridors. */
export const ECLIPSE_ESCAPE = {
  frames: 1500,
  wallEvery: 48,
  wallSpeed: 2.4,
  /** A wall's gap starts this tall (half height) and narrows to `minGapHalf`. */
  gapHalf: 46,
  minGapHalf: 24,
} as const

export function createEclipseCrownBoss(
  maxHp: number = ECLIPSE_CROWN_MAX_HP,
): EclipseCrownBoss {
  return {
    x: 560,
    y: 135,
    hp: maxHp,
    maxHp,
    frame: 0,
    phase: 1,
    nextVolley: ECLIPSE_CROWN.firstVolley,
    volleys: 0,
    spokeAngle: 0,
    heartX: 560,
    heartY: 135,
  }
}

/** True while an attack is charging: the cue covers the full warning before every volley. */
export function eclipseCrownWarning(boss: EclipseCrownBoss): boolean {
  return (
    boss.frame < boss.nextVolley &&
    boss.frame >= boss.nextVolley - ECLIPSE_CROWN.warningFrames
  )
}

/** The spokes' angles for the coming (or last) volley. */
export function eclipseCrownSpokes(boss: EclipseCrownBoss): number[] {
  return Array.from(
    { length: ECLIPSE_CROWN.spokes },
    (_, i) => boss.spokeAngle + (i / ECLIPSE_CROWN.spokes) * Math.PI * 2,
  )
}

export function stepEclipseCrownBoss(
  boss: EclipseCrownBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): EclipseCrownProjectile[] {
  boss.frame++
  boss.x = Math.max(ECLIPSE_CROWN.holdX, 560 - boss.frame * 1.2)
  boss.y = 135 + Math.sin(boss.frame / 110) * 10
  const phase = boss.hp <= boss.maxHp / 2 ? 2 : 1
  if (phase !== boss.phase) {
    boss.phase = phase
    // The heart breaking loose always shows a full warning before the first ring.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + ECLIPSE_CROWN.warningFrames + 1,
    )
  }
  if (boss.phase === 1) {
    boss.heartX = boss.x
    boss.heartY = boss.y
  } else {
    // A slow figure of eight across the right of the screen, easing out of the crown.
    const t = boss.frame / 100
    boss.heartX += (boss.x - 40 + Math.cos(t) * 70 - boss.heartX) * 0.05
    boss.heartY += (135 + Math.sin(2 * t) * 70 - boss.heartY) * 0.05
  }
  if (
    boss.phase === 1 &&
    boss.frame === boss.nextVolley - ECLIPSE_CROWN.warningFrames
  ) {
    boss.spokeAngle = (boss.volleys * ECLIPSE_CROWN.spokeTurn) % (Math.PI * 2)
  }
  if (boss.frame < boss.nextVolley) return []

  boss.volleys++
  const shots: EclipseCrownProjectile[] = []
  const fire = (x: number, y: number, theta: number, speed: number) =>
    shots.push({
      x,
      y,
      vx: Math.cos(theta) * speed,
      vy: Math.sin(theta) * speed,
      grazed: 0,
    })
  if (boss.phase === 1) {
    // Pellets down every marked spoke; the wide wedges between them are safe.
    for (const angle of eclipseCrownSpokes(boss))
      for (const speed of [1.0, 1.25, 1.5, 1.75, 2.0, 2.25])
        fire(boss.x, boss.y, angle, speed)
    boss.nextVolley = boss.frame + 110
  } else {
    // A ring from the crown with a gap that walks round; the heart keeps drifting.
    const count = 18
    const gap = (boss.volleys * 4) % count
    for (let i = 0; i < count; i++) {
      if ((i - gap + count) % count < 4) continue
      fire(boss.x, boss.y, (i / count) * Math.PI * 2, 1.4)
    }
    const living = targets.filter((ship) => ship.lives > 0)
    const nearest = living.reduce(
      (best, ship) =>
        Math.hypot(ship.x - boss.heartX, ship.y - boss.heartY) <
        Math.hypot(best.x - boss.heartX, best.y - boss.heartY)
          ? ship
          : best,
      living[0] ?? { x: 80, y: 135, lives: 1 },
    )
    const aim = Math.atan2(nearest.y - boss.heartY, nearest.x - boss.heartX)
    fire(boss.heartX, boss.heartY, aim - 0.15, 1.8)
    fire(boss.heartX, boss.heartY, aim + 0.15, 1.8)
    boss.nextVolley = boss.frame + 140
  }
  return shots
}

/** The centre of the prism corridor's gap for a wall launched on this escape frame. */
export function eclipseEscapeGapY(frame: number): number {
  return 135 + Math.sin(frame / 170) * 62 + Math.sin(frame / 61) * 12
}

/** The corridor narrows as the heart collapses. */
export function eclipseEscapeGapHalf(frame: number): number {
  return Math.max(
    ECLIPSE_ESCAPE.minGapHalf,
    ECLIPSE_ESCAPE.gapHalf -
      (frame / ECLIPSE_ESCAPE.frames) *
        (ECLIPSE_ESCAPE.gapHalf - ECLIPSE_ESCAPE.minGapHalf) *
        1.2,
  )
}

/** The prism wall launched on this escape frame, if any: a column of pellets with one gap. */
export function eclipseEscapeWall(
  frame: number,
  x = 490,
): EclipseCrownProjectile[] {
  if (frame % ECLIPSE_ESCAPE.wallEvery !== 0) return []
  if (frame > ECLIPSE_ESCAPE.frames - 200) return []
  const gapY = eclipseEscapeGapY(frame)
  const half = eclipseEscapeGapHalf(frame)
  const wall: EclipseCrownProjectile[] = []
  for (let y = 34; y <= 250; y += 11) {
    if (Math.abs(y - gapY) < half) continue
    wall.push({ x, y, vx: -ECLIPSE_ESCAPE.wallSpeed, vy: 0, grazed: 0 })
  }
  return wall
}
