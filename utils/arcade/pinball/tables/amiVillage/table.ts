// /utils/arcade/pinball/tables/amiVillage/table.ts
//
// AMI Village Rescue, greybox (conductor kind-pinball/t-004). Real-world
// scale: a 0.56 x 1.07 m playfield pitched at 6.5 degrees with a 27 mm steel
// ball. This proves the 3D lane end to end: outer walls and arch, the
// shooter lane, inlanes, slingshot bodies, three pop bumpers and two
// flippers. t-018 replaces it with the full shot map (two ramps, two orbits,
// scoops, spinner, upper feed) in playable geometry.

import type { BoxCollider, ColliderDef, TableDef, Vec3 } from '../../types'

const WIDTH = 0.56
const LENGTH = 1.07
/** The main field spans LEFT_X..LANE_WALL_X, centred on the flipper line. */
const LEFT_X = -0.26
const RIGHT_X = LEFT_X + WIDTH
const LANE_WALL_X = 0.26
const LANE_X = (LANE_WALL_X + RIGHT_X) / 2
/** Up-table end of the playfield (the origin is the flipper line). */
const TOP_Z = -0.93
/** Down-table end, under the apron. */
const BOTTOM_Z = TOP_Z + LENGTH
const BALL_R = 0.0135
const WALL_H = 0.025
const WALL_T = 0.006

/** A wall from point a to point b on the playfield (XZ), as a thin box. */
function wall(
  id: string,
  a: readonly [number, number],
  b: readonly [number, number],
  material: BoxCollider['material'] = 'wood',
  thickness = WALL_T,
): BoxCollider {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  const length = Math.hypot(dx, dz)
  return {
    kind: 'box',
    id,
    at: [(a[0] + b[0]) / 2, WALL_H / 2, (a[1] + b[1]) / 2],
    half: [length / 2, WALL_H / 2, thickness / 2],
    // Rotation about +Y takes +X to (cos, 0, -sin): undo that for +Z down-table.
    yaw: -Math.atan2(dz, dx),
    material,
    restitution: material === 'rubber' ? 0.7 : 0.35,
  }
}

function mirrorX(p: readonly [number, number]): [number, number] {
  return [-p[0], p[1]]
}

/** The top arch: a half ellipse traced as short wall segments. */
function arch(): BoxCollider[] {
  const cx = (LEFT_X + RIGHT_X) / 2
  const cz = TOP_Z + 0.24
  const rx = WIDTH / 2
  const rz = 0.24
  const steps = 16
  const walls: BoxCollider[] = []
  let prev: [number, number] = [cx - rx, cz]
  for (let i = 1; i <= steps; i++) {
    const t = Math.PI + (Math.PI * i) / steps
    const next: [number, number] = [
      cx + Math.cos(t) * rx,
      cz + Math.sin(t) * rz,
    ]
    walls.push(wall(`arch-${i}`, prev, next, 'wood', WALL_T * 1.5))
    prev = next
  }
  return walls
}

const SLING_LEFT = {
  top: [-0.17, -0.22] as const,
  bottom: [-0.17, -0.13] as const,
  tip: [-0.115, -0.095] as const,
}

/**
 * The left inlane guide: straight down beside the sling, then angled in to
 * the flipper pivot, keeping ~35 mm (more than a ball) between it and the
 * sling so a ball can never wedge in the lane.
 */
const INLANE_LEFT = {
  top: [-0.215, -0.24] as const,
  bend: [-0.215, -0.12] as const,
  end: [-0.105, -0.045] as const,
}

function inlanes(): BoxCollider[] {
  const out: BoxCollider[] = []
  for (const [side, map] of [
    ['left', (p: readonly [number, number]) => p],
    ['right', mirrorX],
  ] as const) {
    out.push(
      wall(
        `inlane-${side}-upper`,
        map(INLANE_LEFT.top),
        map(INLANE_LEFT.bend),
        'chrome',
        0.004,
      ),
      wall(
        `inlane-${side}-lower`,
        map(INLANE_LEFT.bend),
        map(INLANE_LEFT.end),
        'chrome',
        0.004,
      ),
    )
  }
  return out
}

function slings(): BoxCollider[] {
  const sides: BoxCollider[] = []
  for (const [side, map] of [
    ['left', (p: readonly [number, number]) => p],
    ['right', mirrorX],
  ] as const) {
    const top = map(SLING_LEFT.top)
    const bottom = map(SLING_LEFT.bottom)
    const tip = map(SLING_LEFT.tip)
    sides.push(
      wall(`sling-${side}-back`, top, bottom, 'plastic-printed'),
      wall(`sling-${side}-base`, bottom, tip, 'plastic-printed'),
      wall(`sling-${side}-kicker`, top, tip, 'rubber'),
    )
  }
  return sides
}

const POP: Array<{ id: string; at: Vec3 }> = [
  { id: 'pop-left', at: [-0.075, 0, TOP_Z + 0.33] },
  { id: 'pop-right', at: [0.075, 0, TOP_Z + 0.33] },
  { id: 'pop-bottom', at: [0, 0, TOP_Z + 0.44] },
]

const colliders: ColliderDef[] = [
  // The playfield itself, and the glass that keeps the ball on it.
  {
    kind: 'box',
    id: 'playfield',
    at: [(LEFT_X + RIGHT_X) / 2, -0.01, (TOP_Z + BOTTOM_Z) / 2],
    half: [WIDTH / 2 + 0.02, 0.01, LENGTH / 2 + 0.05],
    material: 'playfield',
    restitution: 0.2,
  },
  {
    kind: 'box',
    id: 'glass',
    at: [(LEFT_X + RIGHT_X) / 2, 0.07, (TOP_Z + BOTTOM_Z) / 2],
    half: [WIDTH / 2 + 0.02, 0.005, LENGTH / 2 + 0.05],
    material: 'plastic-clear',
    restitution: 0.1,
  },
  // Side rails, the arch, and the shooter lane.
  wall(
    'rail-left',
    [LEFT_X, TOP_Z + 0.24],
    [LEFT_X, BOTTOM_Z],
    'wood',
    WALL_T * 2,
  ),
  wall(
    'rail-right',
    [RIGHT_X, TOP_Z + 0.24],
    [RIGHT_X, BOTTOM_Z],
    'wood',
    WALL_T * 2,
  ),
  ...arch(),
  wall(
    'shooter-wall',
    [LANE_WALL_X, TOP_Z + 0.36],
    [LANE_WALL_X, BOTTOM_Z],
    'wood',
  ),
  // The plunger tip the served ball rests against.
  wall(
    'plunger-stop',
    [LANE_WALL_X, BOTTOM_Z - 0.04],
    [RIGHT_X, BOTTOM_Z - 0.04],
    'rubber',
  ),
  // Inlane guides feed the flippers; the outlanes run down outside them.
  ...inlanes(),
  ...slings(),
  ...POP.map((pop): ColliderDef => ({
    kind: 'post',
    id: pop.id,
    at: [pop.at[0], WALL_H / 2, pop.at[2]],
    radius: 0.028,
    halfHeight: WALL_H / 2,
    material: 'plastic-printed',
    restitution: 0.4,
    kick: 1.1,
  })),
  // The apron's lip under the flippers.
  wall(
    'apron',
    [LEFT_X, BOTTOM_Z - 0.01],
    [LANE_WALL_X, BOTTOM_Z - 0.01],
    'chrome',
  ),
]

export const AMI_VILLAGE_GREYBOX: TableDef = {
  id: 'ami-village-greybox',
  title: 'AMI Village Rescue (greybox)',
  physical: {
    widthM: WIDTH,
    lengthM: LENGTH,
    pitchDeg: 6.5,
    ballRadiusM: BALL_R,
  },
  cameras: [
    {
      id: 'main',
      position: [(LEFT_X + RIGHT_X) / 2, 0.84, 0.56],
      target: [(LEFT_X + RIGHT_X) / 2, 0, -0.37],
      fovDeg: 44,
    },
  ],
  colliders,
  sensors: [
    // The ball leaving the shooter lane onto the arch.
    {
      id: 'shooter-exit',
      at: [LANE_X, BALL_R, TOP_Z + 0.3],
      half: [0.012, BALL_R, 0.01],
    },
  ],
  flippers: [
    {
      id: 'flipper-left',
      side: 'left',
      pivot: [-0.092, 0, -0.04],
      length: 0.075,
      baseRadius: 0.012,
      tipRadius: 0.0065,
      restAngle: 0.5,
      activeAngle: -0.45,
      strokeMs: 45,
      returnMs: 90,
    },
    {
      id: 'flipper-right',
      side: 'right',
      pivot: [0.092, 0, -0.04],
      length: 0.075,
      baseRadius: 0.012,
      tipRadius: 0.0065,
      restAngle: 0.5,
      activeAngle: -0.45,
      strokeMs: 45,
      returnMs: 90,
    },
  ],
  shots: [],
  plunger: {
    rest: [LANE_X, BALL_R + 0.0005, BOTTOM_Z - 0.04 - BALL_R - 0.004],
    minSpeed: 1.6,
    maxSpeed: 3.4,
  },
  drainZ: BOTTOM_Z - 0.03,
  balls: 3,
}
