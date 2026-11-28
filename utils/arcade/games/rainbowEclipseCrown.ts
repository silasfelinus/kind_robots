/**
 * B09 Eclipse Crown: a circular crown-machine around a heart node, the finale's single dramatic boss (world
 * bible move sheet: spoke hazard with generous gaps -> moving exposed heart -> team escape through shrinking
 * prism corridors). Every attack is telegraphed. While the crown holds more than two fifths of its hull, it
 * marks six spokes for the whole warning and then fires pellets down them; the spokes turn a little every volley
 * and the wedges between them are wide. Below two fifths, the heart node breaks loose and drifts on a slow figure
 * of eight: only the heart takes damage now, and the crown fires rings with a walking gap. When the heart is
 * spent the crown stops (the engine runs the final choice), and then the escape: prism walls roll in from
 * the right with one gap each, and the gaps narrow as the heart collapses. The escape is not a damage race:
 * it ends when the crew has flown its length.
 *
 * Conductor rainbow t-061 (PLOT-MOTHERLAND.md "Finale target"): the road changes the fight, not just its name.
 * - Rebel road, 'flagship': the crew fights the Motherland flagship that holds the Crown in its clamps. Phase 1
 *   marks two of five lanes for the whole warning, then fires a lance down each; every other volley it launches
 *   a pair of Motherland drones (the engine spawns them). Its bridge is the weak point. Below two fifths the
 *   clamps open: the clamp core drifts free and only it takes damage, one lane lance plus an aimed five-bolt fan.
 * - Loyal road, 'crown' that pleads: the Ocean's heart itself, as above, but the moment its heart breaks loose
 *   it stops firing and pleads for CROWN_PLEA.frames. A crew that flies high through the plea stands down (the
 *   engine decides): the late course-correction PLOT-MOTHERLAND promises. Otherwise the fight goes on.
 * - Unsworn (a flight saved before the memorial): the Crown, no plea, exactly as before.
 */
export type EclipseTarget = 'crown' | 'flagship'

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
  /** Who the crew is fighting: the Crown itself, or the Motherland flagship holding it (t-061). */
  target: EclipseTarget
  /** Flagship: the lanes its next lances fire down, marked for the whole warning. */
  lanes: number[]
  /** Flagship: where Motherland drones launch on this frame; the engine spawns them. */
  launches: number[]
  /** Loyal road: whether the Crown pleads when its heart breaks loose. */
  pleads: boolean
  /** Frames left of the plea: the Crown holds fire and takes no damage while the crew decides. */
  plea: number
  /** True on the one frame the plea ends, for the engine to read where the crew is flying. */
  pleaEnded: boolean
}

export type EclipseCrownProjectile = {
  x: number
  y: number
  vx: number
  vy: number
  grazed: number
}

/**
 * One pilot's share of B09's heart, before rainbowBossHp scales it. Gameplay critic r2 G4: at 300, with a small
 * heart drifting wide in phase 2, novices retried the finale 12-16 times (2-4 for every other boss) and an
 * unfocused solo fight ran 5-12 minutes. 240 keeps it the largest hull (B08 Prism Leviathan is 230).
 */
export const ECLIPSE_CROWN_MAX_HP = 240
export const ECLIPSE_CROWN = {
  warningFrames: 48,
  holdX: 352,
  ringRadius: 44,
  heartRadius: 18,
  /** The share of the hull left when the heart breaks loose: phase 2, the harder one, is the shorter (G4). */
  heartBreaksAt: 0.4,
  /** Phase 2: the free heart's figure of eight (half width, half height), and its ring's cadence. */
  heartDrift: { x: 70, y: 56 },
  phaseTwoEvery: 160,
  spokes: 6,
  /** How far the spokes turn between volleys. */
  spokeTurn: Math.PI / 9,
  firstVolley: 150,
} as const

/** B09 on the rebel road: the Motherland flagship holding the Crown (t-061). */
export const MOTHERLAND_FLAGSHIP = {
  /** Held well left so the bridge stays on screen and the long hull trails off the right edge. */
  holdX: 300,
  /** The five lanes its lances can fire down, top to bottom. */
  lanes: [64, 100, 135, 170, 206],
  lanceLength: 9,
  lanceSpacing: 13,
  lanceSpeed: 2.6,
  volleyEvery: 120,
  phaseTwoEvery: 155,
  /** The bridge tower, its phase-1 weak point, relative to the clamped Crown (RAINBOW_FLAGSHIP_ART). */
  bridgeX: 131,
  bridgeY: -10,
  /** Every this many phase-1 volleys a Motherland drone pair launches, this far above and below the hull. */
  launchEvery: 2,
  launchSpread: 34,
  fanSpeed: 1.9,
  fanSpread: 0.16,
} as const

/** The loyal road's late chance (t-061): how long the Crown holds fire and pleads. */
export const CROWN_PLEA = { frames: 420 } as const

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
  target: EclipseTarget = 'crown',
  pleads = false,
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
    target,
    lanes: [],
    launches: [],
    pleads: target === 'crown' && pleads,
    plea: 0,
    pleaEnded: false,
  }
}

/** The lanes a flagship volley will mark: two in phase 1, one in phase 2, walking down the screen. */
export function flagshipLanes(volleys: number, phase: 1 | 2): number[] {
  const lanes = MOTHERLAND_FLAGSHIP.lanes
  const n = lanes.length
  if (phase === 2) return [lanes[(volleys * 3) % n]!]
  return [lanes[(volleys * 2) % n]!, lanes[(volleys * 2 + 2) % n]!]
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
  boss.pleaEnded = false
  boss.launches = []
  if (boss.target === 'flagship') return stepFlagship(boss, targets)
  boss.x = Math.max(ECLIPSE_CROWN.holdX, 560 - boss.frame * 1.2)
  boss.y = 135 + Math.sin(boss.frame / 110) * 10
  const phase = boss.hp <= boss.maxHp * ECLIPSE_CROWN.heartBreaksAt ? 2 : 1
  if (phase !== boss.phase) {
    boss.phase = phase
    // The heart breaking loose always shows a full warning before the first ring.
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + ECLIPSE_CROWN.warningFrames + 1,
    )
    // Loyal road: the heart breaking loose stops the fight for the plea.
    if (phase === 2 && boss.pleads) {
      boss.pleads = false
      boss.plea = CROWN_PLEA.frames
    }
  }
  if (boss.phase === 1) {
    boss.heartX = boss.x
    boss.heartY = boss.y
  } else {
    // A slow figure of eight across the right of the screen, easing out of the crown.
    const t = boss.frame / 100
    const drift = ECLIPSE_CROWN.heartDrift
    boss.heartX += (boss.x - 40 + Math.cos(t) * drift.x - boss.heartX) * 0.05
    boss.heartY += (135 + Math.sin(2 * t) * drift.y - boss.heartY) * 0.05
  }
  if (boss.plea > 0) {
    // The Crown holds fire while it pleads; the next volley keeps a full warning after it.
    if (--boss.plea === 0) boss.pleaEnded = true
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + ECLIPSE_CROWN.warningFrames + 1,
    )
    return []
  }
  if (
    boss.phase === 1 &&
    boss.frame === boss.nextVolley - ECLIPSE_CROWN.warningFrames
  ) {
    // Alternate volleys line one spoke up on the nearest pilot (independent gameplay critic D6): the walk alone
    // only ever fires down 18 fixed bearings, so a crew parked between them was never hit. The spokes are still
    // marked for the whole warning, so the aimed volley reads as clearly as the walking one.
    const living = targets.filter((ship) => ship.lives > 0)
    const nearest = living.reduce<(typeof living)[number] | null>(
      (best, ship) =>
        !best ||
        Math.hypot(ship.x - boss.x, ship.y - boss.y) <
          Math.hypot(best.x - boss.x, best.y - boss.y)
          ? ship
          : best,
      null,
    )
    boss.spokeAngle =
      nearest && boss.volleys % 2 === 1
        ? Math.atan2(nearest.y - boss.y, nearest.x - boss.x)
        : (boss.volleys * ECLIPSE_CROWN.spokeTurn) % (Math.PI * 2)
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
    // Alternate volleys close the aimed line, so holding still between the pair is not a hiding place (D6).
    if (boss.volleys % 2 === 0) fire(boss.heartX, boss.heartY, aim, 1.8)
    boss.nextVolley = boss.frame + ECLIPSE_CROWN.phaseTwoEvery
  }
  return shots
}

/** The flagship's fight: lane lances and drone launches, then the clamp core breaks loose (t-061). */
function stepFlagship(
  boss: EclipseCrownBoss,
  targets: readonly { x: number; y: number; lives: number }[],
): EclipseCrownProjectile[] {
  const F = MOTHERLAND_FLAGSHIP
  boss.x = Math.max(F.holdX, 560 - boss.frame)
  boss.y = 135 + Math.sin(boss.frame / 120) * 8
  const phase = boss.hp <= boss.maxHp * ECLIPSE_CROWN.heartBreaksAt ? 2 : 1
  if (phase !== boss.phase) {
    boss.phase = phase
    boss.nextVolley = Math.max(
      boss.nextVolley,
      boss.frame + ECLIPSE_CROWN.warningFrames + 1,
    )
  }
  if (boss.phase === 1) {
    boss.heartX = boss.x + F.bridgeX
    boss.heartY = boss.y + F.bridgeY
  } else {
    const t = boss.frame / 100
    boss.heartX += (boss.x - 50 + Math.cos(t) * 60 - boss.heartX) * 0.05
    boss.heartY += (135 + Math.sin(2 * t) * 54 - boss.heartY) * 0.05
  }
  if (boss.frame === boss.nextVolley - ECLIPSE_CROWN.warningFrames)
    boss.lanes = flagshipLanes(boss.volleys, boss.phase)
  if (boss.frame < boss.nextVolley) return []
  boss.volleys++
  const shots: EclipseCrownProjectile[] = []
  // A lance down every marked lane: a bar of bolts the crew leaves the lane to dodge.
  for (const y of boss.lanes)
    for (let i = 0; i < F.lanceLength; i++)
      shots.push({
        x: boss.x - 30 - i * F.lanceSpacing,
        y,
        vx: -F.lanceSpeed,
        vy: 0,
        grazed: 0,
      })
  if (boss.phase === 1) {
    if (boss.volleys % F.launchEvery === 0)
      boss.launches = [boss.y - F.launchSpread, boss.y + F.launchSpread]
    boss.nextVolley = boss.frame + F.volleyEvery
  } else {
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
    for (let i = -2; i <= 2; i++)
      shots.push({
        x: boss.heartX,
        y: boss.heartY,
        vx: Math.cos(aim + i * F.fanSpread) * F.fanSpeed,
        vy: Math.sin(aim + i * F.fanSpread) * F.fanSpeed,
        grazed: 0,
      })
    boss.nextVolley = boss.frame + F.phaseTwoEvery
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
