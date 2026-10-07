// /utils/arcade/pinball/tables/amiVillage/table.ts
//
// AMI Village Rescue, greybox shot map (conductor kind-pinball/t-018, after
// mockups/02-shot-map.svg). Real-world scale: a 0.56 x 1.07 m playfield
// pitched at 6.5 degrees with a 27 mm steel ball. Primitive materials, real
// geometry: the ramps climb about 6 cm, U-turn, and carry the ball back over
// the orbit lanes into the inlanes, so a ball can pass under a ramp while
// another rides it.
//
// The shot arc, left to right, as numbered on the mockup:
//   1 left orbit   2 left ramp   3 upper feed   4 lock scoop (behind the
//   A-M-I drops)   5 spinner lane (into the pops)   6 right ramp
//   7 right orbit  8 award scoop (a saucer above the right sling)
// Each orbit lane returns to its inlane through a lane-change deflector, so
// the outlanes stay open from the playfield below it.

import type {
  ColliderDef,
  DropTargetDef,
  ScoopDef,
  SensorDef,
  ShotDef,
  SpinnerDef,
  TableDef,
  Vec3,
} from '../../types'
import {
  mirror,
  mirror3,
  ramp,
  wall,
  walls,
  type XZ,
  type XZH,
} from '../builders'

const WIDTH = 0.56
const LENGTH = 1.07
/** The main field spans LEFT_X..LANE_WALL_X, centred on the flipper line. */
const LEFT_X = -0.26
const RIGHT_X = LEFT_X + WIDTH
const LANE_WALL_X = 0.26
const LANE_X = (LANE_WALL_X + RIGHT_X) / 2
/** Up-table end of the playfield (the origin is the flipper line). */
const TOP_Z = -0.93
const BOTTOM_Z = TOP_Z + LENGTH
const BALL_R = 0.0135
const GLASS_Y = 0.12
/** Where the shooter lane opens onto the arch. */
const LANE_TOP_Z = -0.57

/** The top arch: a half ellipse traced as short wall segments. */
function arch(): ColliderDef[] {
  const cx = (LEFT_X + RIGHT_X) / 2
  const cz = TOP_Z + 0.24
  const rx = WIDTH / 2
  const rz = 0.24
  const steps = 18
  const points: XZ[] = []
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (Math.PI * i) / steps
    points.push([cx + Math.cos(t) * rx, cz + Math.sin(t) * rz])
  }
  return walls('arch', points, { thickness: 0.009 })
}

/**
 * One side's lower structure, authored for the left and mirrored: the orbit
 * guide, the lane-change deflector, the inlane guide and the slingshot.
 */
function side(name: 'left' | 'right'): ColliderDef[] {
  const m = name === 'left' ? (p: XZ) => p : mirror
  const out: ColliderDef[] = [
    // Orbit lane: between the rail and this guide, up to the arch.
    wall(`${name}-orbit-guide`, m([-0.21, -0.66]), m([-0.21, -0.36]), {
      material: 'chrome',
      thickness: 0.004,
    }),
    // A ball coming down the orbit slides off this into the inlane; the
    // outlane below it is still open from the playfield.
    wall(`${name}-orbit-deflector`, m([-0.26, -0.345]), m([-0.218, -0.29]), {
      material: 'chrome',
      thickness: 0.004,
    }),
    // Inlane guide: down beside the sling, then in over the flipper pivot,
    // parallel to the resting flipper so the ball rolls straight onto it
    // (a guide ending short of the pivot leaves a pocket the ball sits in).
    ...walls(
      `${name}-inlane-guide`,
      [m([-0.21, -0.25]), m([-0.21, -0.12]), m([-0.0857, -0.045])],
      { material: 'chrome', thickness: 0.004 },
    ),
  ]
  const top = m([-0.17, -0.22])
  const bottom = m([-0.17, -0.14])
  const tip = m([-0.115, -0.105])
  out.push(
    wall(`sling-${name}-back`, top, bottom, { material: 'plastic-printed' }),
    wall(`sling-${name}-base`, bottom, tip, { material: 'plastic-printed' }),
    wall(`sling-${name}-kicker`, top, tip, { material: 'rubber' }),
  )
  return out
}

/** The left ramp's centreline (x, z, height); the right ramp mirrors it. */
// The entrance is turned ~25 degrees toward the flipper that shoots it, the
// top is a hairpin, the return runs down the outside over the orbit lane,
// and the exit floor stays 4 cm up so a ball can roll beneath it.
const LEFT_RAMP: XZH[] = [
  [-0.12, -0.3, 0],
  [-0.135, -0.38, 0.0179],
  [-0.145, -0.46, 0.0342],
  [-0.15, -0.53, 0.0429],
  [-0.163, -0.562, 0.0452],
  [-0.195, -0.575, 0.0462],
  [-0.227, -0.562, 0.0462],
  [-0.24, -0.53, 0.046],
  [-0.24, -0.45, 0.0455],
  [-0.24, -0.37, 0.044],
  [-0.232, -0.31, 0.041],
  [-0.215, -0.265, 0.038],
  [-0.196, -0.235, 0.036],
  [-0.19, -0.21, 0.035],
]
const RIGHT_RAMP = LEFT_RAMP.map(mirror3)

const UPPER_FEED: XZH[] = [
  [-0.065, -0.34, 0],
  [-0.08, -0.45, 0.0221],
  [-0.09, -0.57, 0.0355],
  [-0.092, -0.63, 0.036],
]

/** The lock scoop: a pocket behind the A-M-I drop targets. */
const LOCK_Z = -0.405
function lockPocket(): ColliderDef[] {
  return walls(
    'lock-pocket',
    [
      [-0.025, -0.37],
      [-0.025, -0.43],
      [0.025, -0.43],
      [0.025, -0.37],
    ],
    {
      material: 'wood',
    },
  )
}

const POPS: Array<{ id: string; at: XZ }> = [
  { id: 'pop-left', at: [0.03, -0.585] },
  { id: 'pop-right', at: [0.12, -0.6] },
  { id: 'pop-bottom', at: [0.075, -0.515] },
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
    at: [(LEFT_X + RIGHT_X) / 2, GLASS_Y, (TOP_Z + BOTTOM_Z) / 2],
    half: [WIDTH / 2 + 0.02, 0.005, LENGTH / 2 + 0.05],
    material: 'plastic-clear',
    restitution: 0.1,
    hidden: true,
  },
  // Rails, the arch, the shooter lane and its one-way gate (a ball coming
  // back down the arch is turned into the right orbit lane, not the lane).
  wall('rail-left', [LEFT_X, TOP_Z + 0.24], [LEFT_X, BOTTOM_Z], {
    thickness: 0.012,
  }),
  wall('rail-right', [RIGHT_X, TOP_Z + 0.24], [RIGHT_X, BOTTOM_Z], {
    thickness: 0.012,
  }),
  ...arch(),
  wall('shooter-wall', [LANE_WALL_X, LANE_TOP_Z], [LANE_WALL_X, BOTTOM_Z]),
  wall(
    'shooter-gate',
    [LANE_WALL_X, LANE_TOP_Z],
    [RIGHT_X, LANE_TOP_Z - 0.04],
    {
      material: 'chrome',
      thickness: 0.004,
      passDir: [0, 0, -1],
    },
  ),
  wall(
    'plunger-stop',
    [LANE_WALL_X, BOTTOM_Z - 0.04],
    [RIGHT_X, BOTTOM_Z - 0.04],
    {
      material: 'rubber',
    },
  ),
  ...side('left'),
  ...side('right'),
  ...ramp('left-ramp', LEFT_RAMP, { railHeight: 0.035 }),
  ...ramp('right-ramp', RIGHT_RAMP, { railHeight: 0.035 }),
  ...ramp('upper-feed', UPPER_FEED, { width: 0.04 }),
  // The upper feed ends at a cap; its hole is the subway in its last metre.
  wall('upper-feed-cap', [-0.117, -0.652], [-0.067, -0.652], {
    base: 0.032,
    height: 0.035,
  }),
  // Dividers closing the narrow vees between neighbouring ramp mouths and
  // lanes, which are too tight for the ball to pass and would trap it.
  wall('mouth-divider-left', [-0.099, -0.304], [-0.085, -0.337], {
    material: 'chrome',
    thickness: 0.004,
  }),
  wall('mouth-divider-right', [0.099, -0.304], [0.09, -0.335], {
    material: 'chrome',
    thickness: 0.004,
  }),
  // Caps over the channels behind the centre shots. Each slopes so a ball
  // dropping from the pops rolls off it into a lane, or under a ramp where
  // the ramp is high enough to pass beneath, instead of wedging in a vee.
  wall('island-roof', [-0.0625, -0.5], [0.045, -0.46], {
    material: 'chrome',
    thickness: 0.004,
  }),
  wall('channel-cap-left', [-0.109, -0.52], [-0.123, -0.485], {
    material: 'chrome',
    thickness: 0.004,
  }),
  wall('channel-cap-right', [0.123, -0.485], [0.09, -0.46], {
    material: 'chrome',
    thickness: 0.004,
  }),
  ...lockPocket(),
  // Spinner lane: up the right-centre into the pop bumpers.
  ...walls(
    'spinner-lane-left',
    [
      [0.045, -0.335],
      [0.045, -0.46],
    ],
    {
      material: 'chrome',
      thickness: 0.004,
    },
  ),
  ...walls(
    'spinner-lane-right',
    [
      [0.09, -0.335],
      [0.09, -0.46],
    ],
    {
      material: 'chrome',
      thickness: 0.004,
    },
  ),
  ...POPS.map((pop): ColliderDef => ({
    kind: 'post',
    id: pop.id,
    at: [pop.at[0], 0.0125, pop.at[1]],
    radius: 0.028,
    halfHeight: 0.0125,
    material: 'plastic-printed',
    restitution: 0.4,
    kick: 1.1,
  })),
  // Rubber posts either side of the lock lane.
  ...(
    [
      [-0.04, -0.345],
      [0.04, -0.345],
    ] as XZ[]
  ).map((at, i): ColliderDef => ({
    kind: 'post',
    id: `shot-post-${i + 1}`,
    at: [at[0], 0.0125, at[1]],
    radius: 0.005,
    halfHeight: 0.0125,
    material: 'rubber',
    restitution: 0.6,
  })),
  // The apron's lip under the flippers.
  wall('apron', [LEFT_X, BOTTOM_Z - 0.01], [LANE_WALL_X, BOTTOM_Z - 0.01], {
    material: 'chrome',
  }),
]

/** A small sensor box at a point, `h` above the playfield. */
function sensor(
  id: string,
  x: number,
  z: number,
  h = 0,
  half: Vec3 = [0.022, 0.015, 0.008],
): SensorDef {
  return { id, at: [x, h + BALL_R, z], half }
}

const sensors: SensorDef[] = [
  sensor('shooter-exit', LANE_X, LANE_TOP_Z + 0.06, 0, [0.012, 0.015, 0.01]),
  sensor('left-orbit-low', -0.235, -0.37, 0, [0.024, 0.015, 0.006]),
  sensor('left-orbit-high', -0.235, -0.62, 0, [0.024, 0.015, 0.006]),
  sensor('right-orbit-low', 0.235, -0.37, 0, [0.024, 0.015, 0.006]),
  sensor('right-orbit-high', 0.235, -0.62, 0, [0.024, 0.015, 0.006]),
  sensor('left-ramp-entry', -0.135, -0.335, 0.008, [0.02, 0.015, 0.008]),
  sensor('left-ramp-made', -0.24, -0.53, 0.046, [0.015, 0.02, 0.015]),
  sensor('right-ramp-entry', 0.135, -0.335, 0.008, [0.02, 0.015, 0.008]),
  sensor('right-ramp-made', 0.24, -0.53, 0.046, [0.015, 0.02, 0.015]),
  sensor('upper-feed-entry', -0.068, -0.37, 0.008, [0.02, 0.015, 0.008]),
]

const drops: DropTargetDef[] = [-0.021, 0, 0.021].map((x, i) => ({
  id: `drop-${'ami'[i]}`,
  bank: 'ami',
  at: [x, 0.0125, -0.3],
  half: [0.0095, 0.0125, 0.004],
}))

const scoops: ScoopDef[] = [
  {
    // Shot 8: a saucer above the right sling; fast balls roll over it.
    id: 'award',
    at: [0.12, BALL_R, -0.25],
    radius: 0.016,
    captureMaxSpeed: 0.8,
    holdMs: 900,
    eject: { at: [0.1, BALL_R, -0.235], velocity: [-0.7, 0, 0.75] },
  },
  {
    // Shot 4: the lock hole; its ball comes back out of the award saucer.
    id: 'lock',
    at: [0, BALL_R, LOCK_Z],
    radius: 0.018,
    captureMaxSpeed: Number.POSITIVE_INFINITY,
    holdMs: 1200,
    eject: { at: [0, BALL_R, LOCK_Z], velocity: [0, 0, 0] },
    subwayTo: 'award',
  },
  {
    // Shot 3: the hole at the top of the upper feed (the hidden sub-table
    // will sit here, t-011); for now it is a subway to the award saucer.
    id: 'upper-feed',
    at: [-0.092, 0.036 + BALL_R, -0.625],
    radius: 0.02,
    captureMaxSpeed: Number.POSITIVE_INFINITY,
    holdMs: 1400,
    eject: { at: [-0.092, 0.036 + BALL_R, -0.625], velocity: [0, 0, 0] },
    subwayTo: 'award',
  },
]

const spinners: SpinnerDef[] = [
  { id: 'spinner', at: [0.0675, BALL_R, -0.4], half: [0.02, 0.015, 0.004] },
]

const shots: ShotDef[] = [
  {
    id: 'left-orbit',
    kind: 'orbit',
    sensors: ['left-orbit-low', 'left-orbit-high'],
    displayName: 'LEFT ORBIT',
  },
  {
    id: 'left-ramp',
    kind: 'ramp',
    sensors: ['left-ramp-entry', 'left-ramp-made'],
    displayName: 'LEFT RAMP',
  },
  {
    id: 'upper-feed',
    kind: 'ramp',
    sensors: ['upper-feed-entry', 'upper-feed'],
    displayName: 'UPPER FEED',
  },
  { id: 'lock', kind: 'scoop', sensors: ['lock'], displayName: 'LOCK' },
  {
    id: 'spinner',
    kind: 'spinner',
    sensors: ['spinner'],
    displayName: 'SPINNER',
  },
  {
    id: 'right-ramp',
    kind: 'ramp',
    sensors: ['right-ramp-entry', 'right-ramp-made'],
    displayName: 'RIGHT RAMP',
  },
  {
    id: 'right-orbit',
    kind: 'orbit',
    sensors: ['right-orbit-low', 'right-orbit-high'],
    displayName: 'RIGHT ORBIT',
  },
  { id: 'award', kind: 'scoop', sensors: ['award'], displayName: 'AWARD' },
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
  sensors,
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
  drops,
  scoops,
  spinners,
  shots,
  plunger: {
    rest: [LANE_X, BALL_R + 0.0005, BOTTOM_Z - 0.04 - BALL_R - 0.004],
    minSpeed: 1.6,
    maxSpeed: 3.4,
  },
  drainZ: BOTTOM_Z - 0.03,
  balls: 3,
}
