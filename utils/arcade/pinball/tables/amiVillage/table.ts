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
  BoxCollider,
  ColliderDef,
  DoorDef,
  DropTargetDef,
  FlasherDef,
  FlipperDef,
  InsertDef,
  MeshCollider,
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
  WALL_HEIGHT,
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
const ARCH_POINTS: XZ[] = (() => {
  const cx = (LEFT_X + RIGHT_X) / 2
  const cz = TOP_Z + 0.24
  const steps = 18
  const points: XZ[] = []
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (Math.PI * i) / steps
    points.push([cx + Math.cos(t) * (WIDTH / 2), cz + Math.sin(t) * 0.24])
  }
  return points
})()
/** Arch segments (numbered from 1 at the left) that form the secret door. */
const DOOR_SEGMENTS = [4, 5]

function arch(): ColliderDef[] {
  return walls('arch', ARCH_POINTS, { thickness: 0.009 }).filter(
    (_, i) => !DOOR_SEGMENTS.includes(i + 1),
  )
}

// --- The hidden sub-table (conductor kind-pinball/t-011) -----------------
//
// A secret room behind the backbox. Its door is two segments of the top arch
// where a left orbit leans hardest on the wall. When the rules open it, that
// stretch of arch sinks and a diverter rises in the lane behind it: the next
// left orbit is turned out through the gap into a hole under the corner
// plastic, and a subway lifts the ball into the room. The room has its own
// flippers (on the same buttons), the N-E-T standups, a turning windmill and
// a HOME scoop. Making HOME, or draining past the room's flippers, sends the
// ball back by subway to the award saucer, whose kickout feeds the left
// flipper. The backbox hides the room from the main camera; the camera eases
// over it only while every ball on the table is in there.

const DOOR_FROM = ARCH_POINTS[DOOR_SEGMENTS[0]! - 1]!
const DOOR_TO = ARCH_POINTS[DOOR_SEGMENTS[DOOR_SEGMENTS.length - 1]!]!

const SECRET_DOOR: DoorDef = {
  id: 'secret-door',
  closed: DOOR_SEGMENTS.map((n) =>
    wall(`arch-${n}`, ARCH_POINTS[n - 1]!, ARCH_POINTS[n]!, {
      thickness: 0.009,
    }),
  ),
  // A diverter angled back across the lane from the far end of the gap, so a
  // ball running up the arch glances off it and out through the opening.
  open: [
    wall('secret-diverter', DOOR_TO, [DOOR_TO[0] - 0.005, DOOR_TO[1] + 0.04], {
      material: 'chrome',
      thickness: 0.004,
    }),
  ],
}

/** The hole behind the door, just outside the arch. */
const SECRET_HOLE: XZ = [-0.218, -0.862]

function secretChamber(): BoxCollider[] {
  const ring: XZ[] = [
    DOOR_FROM,
    [-0.255, -0.845],
    [-0.238, -0.9],
    [-0.182, -0.906],
    DOOR_TO,
  ]
  return [
    ...walls('secret-chamber', ring, { thickness: 0.006, hidden: true }),
    // The corner plastic over the hole, clear of the ball's top.
    {
      kind: 'box',
      id: 'secret-cover',
      at: [-0.21, 0.031, -0.87],
      half: [0.05, 0.002, 0.04],
      yaw: Math.PI / 4,
      material: 'plastic-printed',
    },
  ]
}

/** The room's centre line and its walls (it sits behind the backbox). */
const ROOM_X = (LEFT_X + RIGHT_X) / 2
const ROOM_HALF = 0.17
const ROOM_BOTTOM_Z = -1.06
const ROOM_TOP_Z = -1.42
const ROOM_FLIPPER_Z = -1.11

function room(): ColliderDef[] {
  const x = (dx: number) => ROOM_X + dx
  const side = (sign: -1 | 1): ColliderDef[] => {
    const m = (p: XZ): XZ => [x(sign * p[0]), p[1]]
    const name = sign < 0 ? 'left' : 'right'
    return [
      // Inlane guide: down the side, then in over the flipper pivot.
      ...walls(
        `sub-inlane-${name}`,
        [m([ROOM_HALF, -1.18]), m([0.064, ROOM_FLIPPER_Z - 0.004])],
        { material: 'chrome', thickness: 0.004 },
      ),
      // Under the flipper: closes the corner behind the guide.
      wall(
        `sub-apron-${name}`,
        m([0.064, ROOM_FLIPPER_Z - 0.004]),
        m([0.075, -1.087]),
        { material: 'chrome', thickness: 0.004 },
      ),
      // The top corner, cut so a ball cannot sit in it.
      wall(`sub-corner-${name}`, m([ROOM_HALF, -1.36]), m([0.11, ROOM_TOP_Z]), {
        material: 'rubber',
      }),
    ]
  }
  return [
    {
      kind: 'box',
      id: 'sub-floor',
      at: [ROOM_X, -0.01, (ROOM_BOTTOM_Z + ROOM_TOP_Z) / 2],
      half: [ROOM_HALF + 0.03, 0.01, (ROOM_BOTTOM_Z - ROOM_TOP_Z) / 2 + 0.03],
      material: 'playfield',
      restitution: 0.2,
    },
    {
      kind: 'box',
      id: 'sub-glass',
      at: [ROOM_X, GLASS_Y, (ROOM_BOTTOM_Z + ROOM_TOP_Z) / 2],
      half: [ROOM_HALF + 0.03, 0.005, (ROOM_BOTTOM_Z - ROOM_TOP_Z) / 2 + 0.03],
      material: 'plastic-clear',
      restitution: 0.1,
      hidden: true,
    },
    ...walls(
      'sub-wall',
      [
        [x(-ROOM_HALF), ROOM_BOTTOM_Z],
        [x(-ROOM_HALF), ROOM_TOP_Z],
        [x(ROOM_HALF), ROOM_TOP_Z],
        [x(ROOM_HALF), ROOM_BOTTOM_Z],
        [x(-ROOM_HALF), ROOM_BOTTOM_Z],
      ],
      { thickness: 0.009 },
    ),
    ...side(-1),
    ...side(1),
    // The drain under the flipper gap is a vee down to the return hole.
    ...walls(
      'sub-drain-vee',
      [
        [x(-0.075), -1.087],
        [x(0), -1.062],
        [x(0.075), -1.087],
      ],
      { material: 'chrome', thickness: 0.004 },
    ),
  ]
}

function roomFlipper(side: 'left' | 'right'): FlipperDef {
  const sign = side === 'left' ? -1 : 1
  return {
    id: `sub-flipper-${side}`,
    side,
    pivot: [ROOM_X + sign * 0.07, 0, ROOM_FLIPPER_Z],
    length: 0.05,
    baseRadius: 0.009,
    tipRadius: 0.0055,
    restAngle: 0.5,
    activeAngle: -0.45,
    strokeMs: 40,
    returnMs: 80,
  }
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
    // outlane below it is still open from the playfield. It is one-way: a
    // ball going up (the kickback firing) passes into the orbit lane.
    wall(`${name}-orbit-deflector`, m([-0.26, -0.345]), m([-0.218, -0.29]), {
      material: 'chrome',
      thickness: 0.004,
      passDir: [0, 0, -1],
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
    wall(`sling-${name}-kicker`, top, tip, { material: 'rubber', kick: 1.4 }),
    slingCap(`sling-${name}-cap`, [top, bottom, tip]),
  )
  return out
}

/** The sling plastic's height at its edges, and at its peak. */
const SLING_CAP_EDGE = 0.03
const SLING_CAP_PEAK = 0.038

/**
 * The plastic over a slingshot: a shallow pitched roof over the triangle, so
 * a ball dropped off a ramp's return rolls off into the inlane or onto the
 * playfield instead of falling inside the sling and wedging there for good
 * (found by the attract soak, t-012). Its edges sit above a ball rolling
 * against the sling, so the kicker plays as before.
 */
function slingCap(id: string, corners: [XZ, XZ, XZ]): ColliderDef {
  const cx = corners.reduce((a, c) => a + c[0], 0) / 3
  const cz = corners.reduce((a, c) => a + c[1], 0) / 3
  const vertices = [
    ...corners.flatMap(([x, z]) => [x, SLING_CAP_EDGE, z]),
    cx,
    SLING_CAP_PEAK,
    cz,
  ]
  const indices: number[] = []
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3
    const [a, b] = [corners[i]!, corners[j]!]
    // Wind each face so its normal points up (the mirrored side flips it).
    const up = (b[0] - a[0]) * (cz - a[1]) - (b[1] - a[1]) * (cx - a[0]) < 0
    indices.push(...(up ? [i, j, 3] : [j, i, 3]))
  }
  return { kind: 'mesh', id, vertices, indices, material: 'plastic-clear' }
}

/**
 * A clear roof spanning the tops of the facing rails of two ramps, between two
 * depths. Both rails climb with their ramps, so the roof slopes down toward
 * the playfield and toward the lower rail: a ball landing on it rolls off.
 */
function channelRoof(
  id: string,
  a: MeshCollider[],
  b: MeshCollider[],
  zFrom: number,
  zTo: number,
): ColliderDef {
  const rails = (ramp: MeshCollider[]) =>
    ramp.filter((m) => /-rail-[lr]$/.test(m.id))
  // The top edge of a rail at depth z: its vertices are a bottom and a top
  // per point along the ramp.
  const topAt = (rail: MeshCollider, z: number): [number, number, number] => {
    const v = rail.vertices
    for (let k = 3; k + 6 < v.length; k += 6) {
      const [z0, z1] = [v[k + 2]!, v[k + 8]!]
      if (z0 === z1 || (z0 - z) * (z1 - z) > 0) continue
      const t = (z - z0) / (z1 - z0)
      return [
        v[k]! + (v[k + 6]! - v[k]!) * t,
        v[k + 1]! + (v[k + 7]! - v[k + 1]!) * t,
        z,
      ]
    }
    throw new Error(`${rail.id} does not reach z=${z}`)
  }
  const mid = (zFrom + zTo) / 2
  // Of each ramp, the rail facing the other one.
  const facing = (mine: MeshCollider[], theirs: MeshCollider[]) => {
    const other = topAt(rails(theirs)[0]!, mid)[0]
    return rails(mine).sort(
      (p, q) =>
        Math.abs(topAt(p, mid)[0] - other) - Math.abs(topAt(q, mid)[0] - other),
    )[0]!
  }
  const railA = facing(a, b)
  const railB = facing(b, a)
  const vertices: number[] = []
  const indices: number[] = []
  const n = 8
  for (let i = 0; i <= n; i++) {
    const z = zFrom + ((zTo - zFrom) * i) / n
    vertices.push(...topAt(railA, z), ...topAt(railB, z))
    if (i === 0) continue
    const [a0, b0, a1, b1] = [2 * i - 2, 2 * i - 1, 2 * i, 2 * i + 1]
    indices.push(a0, b0, a1, b0, b1, a1)
  }
  return {
    kind: 'mesh',
    id,
    vertices,
    indices,
    material: 'plastic-clear',
    twoSided: true,
  }
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
  [-0.236, -0.39, 0.044],
  [-0.217, -0.345, 0.041],
  [-0.196, -0.3, 0.038],
  [-0.19, -0.255, 0.036],
  [-0.19, -0.21, 0.035],
]
const RIGHT_RAMP = LEFT_RAMP.map(mirror3)
/** The covered stretch of each ramp: the crest of the climb and the turn. */
const RAMP_COVER = [0.08, 0.42] as const

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
  ...secretChamber(),
  ...room(),
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
  ...ramp('left-ramp', LEFT_RAMP, { railHeight: 0.035, cover: RAMP_COVER }),
  ...ramp('right-ramp', RIGHT_RAMP, { railHeight: 0.035, cover: RAMP_COVER }),
  // Where each ramp's return ends over its inlane, a plate the ball hits and
  // drops off into the lane; a ball rolling down the inlane passes under it.
  ...(['left', 'right'] as const).map((name): ColliderDef =>
    wall(
      `${name}-ramp-stop`,
      name === 'left' ? [-0.212, -0.17] : mirror([-0.212, -0.17]),
      name === 'left' ? [-0.168, -0.17] : mirror([-0.168, -0.17]),
      { material: 'plastic-clear', base: 0.03, height: 0.04, restitution: 0.1 },
    ),
  ),
  ...ramp('upper-feed', UPPER_FEED, { width: 0.04, cover: [0.06, 0.27] }),
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
  // They stand taller than the ball, so none can perch on top between rails.
  wall('island-roof', [-0.0625, -0.5], [0.045, -0.46], {
    material: 'chrome',
    thickness: 0.004,
    height: 0.045,
  }),
  wall('channel-cap-left', [-0.109, -0.52], [-0.123, -0.485], {
    material: 'chrome',
    thickness: 0.004,
    height: 0.045,
  }),
  // The channel between the left ramp and the upper feed, from the mouth
  // divider to the cap, is roofed: a hard flip can drop a ball into it from
  // above, where it wedged for good (found by the attract soak, t-013).
  channelRoof(
    'channel-roof-left',
    ramp('left-ramp', LEFT_RAMP, { railHeight: 0.035, cover: RAMP_COVER }),
    ramp('upper-feed', UPPER_FEED, { width: 0.04, cover: [0.06, 0.27] }),
    -0.34,
    -0.5,
  ),
  wall('channel-cap-right', [0.123, -0.485], [0.09, -0.46], {
    material: 'chrome',
    thickness: 0.004,
    height: 0.045,
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

const drops: DropTargetDef[] = [
  ...[-0.021, 0, 0.021].map((x, i): DropTargetDef => ({
    id: `drop-${'ami'[i]}`,
    bank: 'ami',
    at: [x, 0.0125, -0.3],
    half: [0.0095, 0.0125, 0.004],
  })),
  // The N-E-T standups across the top of the sub-table.
  ...[-0.05, 0, 0.05].map((dx, i): DropTargetDef => ({
    id: `net-${'net'[i]}`,
    bank: 'net',
    at: [ROOM_X + dx, 0.0125, ROOM_TOP_Z + 0.009],
    half: [0.012, 0.0125, 0.004],
    standup: true,
  })),
]

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
  {
    // The secret door's hole, under the corner plastic.
    id: 'secret-hole',
    at: [SECRET_HOLE[0], BALL_R, SECRET_HOLE[1]],
    radius: 0.02,
    captureMaxSpeed: Number.POSITIVE_INFINITY,
    holdMs: 1500,
    eject: {
      at: [SECRET_HOLE[0], BALL_R, SECRET_HOLE[1]],
      velocity: [0, 0, 0],
    },
    subwayTo: 'sub-entry',
    hidden: true,
  },
  {
    // Where the subway brings the ball up into the sub-table. It never
    // captures; it only kicks the arriving ball down toward the flippers.
    id: 'sub-entry',
    at: [ROOM_X - 0.12, BALL_R, -1.37],
    radius: 0.012,
    captureMaxSpeed: -1,
    holdMs: 0,
    eject: { at: [ROOM_X - 0.12, BALL_R, -1.37], velocity: [0.35, 0, 0.5] },
  },
  {
    // The sub-table's goal: back to the village with the full reward.
    id: 'sub-home',
    at: [ROOM_X + 0.12, BALL_R, -1.37],
    radius: 0.016,
    captureMaxSpeed: 1.5,
    holdMs: 1000,
    eject: { at: [ROOM_X + 0.12, BALL_R, -1.37], velocity: [0, 0, 0] },
    subwayTo: 'award',
  },
  {
    // Past the room's flippers: the ball is not lost, it goes home too.
    id: 'sub-drain',
    at: [ROOM_X, BALL_R, -1.078],
    radius: 0.02,
    captureMaxSpeed: Number.POSITIVE_INFINITY,
    holdMs: 700,
    eject: { at: [ROOM_X, BALL_R, -1.078], velocity: [0, 0, 0] },
    subwayTo: 'award',
    hidden: true,
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
  { id: 'secret', kind: 'scoop', sensors: ['secret-hole'], displayName: '???' },
  { id: 'sub-home', kind: 'scoop', sensors: ['sub-home'], displayName: 'HOME' },
]

/** The DMD's glass on the backbox face (t-006), and its width (4:1). */
const BACKBOX_FACE_Z = -1.005 + 0.012
const DMD_WIDTH = 0.4
const DMD_AT: Vec3 = [ROOM_X, 0.072, BACKBOX_FACE_Z + 0.002]

/** Where the apron plate begins, just below the flipper tips. */
const APRON_TOP_Z = 0.035

/** Shot colours: each shot's arrow, and the flasher its shot fires. */
const CYAN = 0x22d3ee
const MAGENTA = 0xf472b6
const YELLOW = 0xfacc15
const AMBER = 0xfb923c

function arrow(
  shot: string,
  at: XZ,
  color: number,
  flasher: string,
  yaw = 0,
  size = 0.03,
): InsertDef {
  return {
    id: `arrow-${shot}`,
    at,
    shape: 'arrow',
    size,
    yaw,
    color,
    shot,
    flasher,
  }
}

function lamp(id: string, at: XZ, color: number, size = 0.012): InsertDef {
  return { id, at, shape: 'circle', size, color }
}

// The lamp matrix (t-019): an arrow in front of every shot's mouth, pointing
// the way in, in its shot's colour; lamps for the A-M-I targets, the award
// saucer and the kickback; the rainbow across the lower playfield that
// counts the bonus multiplier; and the room's N-E-T and HOME lamps.
const inserts: InsertDef[] = [
  arrow('left-orbit', [-0.19, -0.31], CYAN, 'flasher-left', 0.35),
  arrow('left-ramp', [-0.128, -0.287], MAGENTA, 'flasher-left', 0.19),
  arrow('upper-feed', [-0.064, -0.312], YELLOW, 'flasher-back-left', 0.13),
  arrow('lock', [0, -0.245], AMBER, 'flasher-back-left'),
  arrow('spinner', [0.0675, -0.3], CYAN, 'flasher-back-right', 0, 0.026),
  arrow('right-ramp', [0.128, -0.287], MAGENTA, 'flasher-right', -0.19),
  arrow('right-orbit', [0.19, -0.31], YELLOW, 'flasher-right', -0.35),
  { ...lamp('lamp-award', [0.12, -0.212], 0xfde68a, 0.018), shot: 'award' },
  ...['a', 'm', 'i'].map((letter, i) =>
    lamp(`lamp-drop-${letter}`, [-0.021 + i * 0.021, -0.284], 0xe0f2fe, 0.01),
  ),
  lamp('lamp-kickback', [-0.235, -0.05], 0xef4444, 0.016),
  ...[0xef4444, 0xf97316, 0xfacc15, 0x4ade80, 0x38bdf8, 0xa78bfa].map(
    (color, i) => {
      const x = -0.05 + i * 0.02
      return lamp(
        `rainbow-${i + 1}`,
        [x, -0.125 - 0.016 * (1 - (x / 0.06) ** 2)],
        color,
      )
    },
  ),
  ...['n', 'e', 't'].map((letter, i) =>
    lamp(
      `lamp-net-${letter}`,
      [ROOM_X - 0.05 + i * 0.05, ROOM_TOP_Z + 0.035],
      CYAN,
    ),
  ),
  arrow('sub-home', [ROOM_X + 0.12, -1.325], AMBER, 'flasher-secret'),
]

const flashers: FlasherDef[] = [
  { id: 'flasher-left', at: [LEFT_X, WALL_HEIGHT, -0.5], color: 0x67e8f9 },
  { id: 'flasher-right', at: [RIGHT_X, WALL_HEIGHT, -0.5], color: MAGENTA },
  { id: 'flasher-back-left', at: [-0.07, 0, -0.955], color: YELLOW },
  { id: 'flasher-back-right', at: [0.07, 0, -0.955], color: AMBER },
  // On the corner plastic over the secret hole: it flashes while the door is open.
  { id: 'flasher-secret', at: [-0.21, 0.033, -0.87], color: 0xf43f5e },
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
      position: [(LEFT_X + RIGHT_X) / 2, 0.75, 0.55],
      target: [(LEFT_X + RIGHT_X) / 2, 0, -0.4],
      fovDeg: 32,
      // The whole playfield, from the apron to the foot of the backbox.
      frame: {
        min: [LEFT_X - 0.02, 0, TOP_Z - 0.06],
        max: [RIGHT_X + 0.02, 0.03, BOTTOM_Z + 0.02],
      },
      // The DMD in the backbox above the arch.
      include: [
        [DMD_AT[0] - DMD_WIDTH / 2, DMD_AT[1] + DMD_WIDTH / 8, DMD_AT[2]],
        [DMD_AT[0] + DMD_WIDTH / 2, DMD_AT[1] + DMD_WIDTH / 8, DMD_AT[2]],
      ],
      portrait: [(LEFT_X + RIGHT_X) / 2, 1.2, 0.25],
      portraitFovDeg: 36,
    },
    {
      id: 'sub-table',
      position: [ROOM_X, 0.52, -0.83],
      target: [ROOM_X, 0, -1.25],
      fovDeg: 32,
      frame: {
        min: [ROOM_X - ROOM_HALF - 0.03, 0, ROOM_TOP_Z - 0.02],
        max: [ROOM_X + ROOM_HALF + 0.03, 0.03, ROOM_BOTTOM_Z + 0.04],
      },
      portrait: [ROOM_X, 0.7, -0.95],
      portraitFovDeg: 36,
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
      strokeMs: 20,
      returnMs: 70,
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
      strokeMs: 20,
      returnMs: 70,
    },
    roomFlipper('left'),
    roomFlipper('right'),
  ],
  drops,
  scoops,
  spinners,
  shots,
  doors: [SECRET_DOOR],
  kickers: [
    {
      // Under the bottom of the left outlane: when lit, it fires a ball
      // that would have drained straight back up the outlane.
      id: 'kickback',
      at: [-0.235, BALL_R, 0.035],
      half: [0.022, 0.015, 0.02],
      velocity: [0, 0, -3.4],
    },
  ],
  toys: [
    {
      // A village windmill turning in the middle of the room.
      id: 'windmill',
      at: [ROOM_X, 0.012, -1.27],
      arms: 4,
      armHalf: [0.022, 0.011, 0.003],
      spin: 2.2,
      material: 'plastic-printed',
    },
  ],
  zones: [
    {
      id: 'sub-table',
      min: [ROOM_X - ROOM_HALF - 0.03, ROOM_TOP_Z - 0.03],
      max: [ROOM_X + ROOM_HALF + 0.03, ROOM_BOTTOM_Z + 0.03],
    },
  ],
  inserts,
  flashers,
  dmd: { at: DMD_AT, width: DMD_WIDTH, occluder: 'backbox' },
  art: {
    // Rendered by a durable ArtJob from conductor's art-prompts.yaml
    // (kind-pinball/t-009), to the playfield rectangle below.
    playfield: {
      src: '/images/pinball/ami-village-playfield.webp',
      min: [LEFT_X - 0.02, TOP_Z - 0.05],
      max: [RIGHT_X + 0.02, BOTTOM_Z + 0.05],
    },
  },
  trim: [
    {
      // The apron plate over the drain: a ball passing the flippers rolls
      // under it, as on a real machine.
      kind: 'box',
      id: 'apron-plate',
      at: [(LEFT_X + LANE_WALL_X) / 2, 0.03, (APRON_TOP_Z + BOTTOM_Z) / 2],
      half: [(LANE_WALL_X - LEFT_X) / 2, 0.002, (BOTTOM_Z - APRON_TOP_Z) / 2],
      material: 'cabinet',
    },
  ],
  occluders: [
    {
      // The backbox: it stands between the main camera and the room.
      id: 'backbox',
      at: [ROOM_X, 0.2, -1.005],
      half: [WIDTH / 2 + 0.04, 0.2, 0.012],
      fadeFor: 'sub-table',
    },
    {
      // Its lid over the room, so a steep (phone) camera sees cabinet, not
      // the secret, over the top of the backbox.
      id: 'backbox-lid',
      at: [ROOM_X, 0.4, (ROOM_TOP_Z - 1.005) / 2],
      half: [WIDTH / 2 + 0.04, 0.012, (-1.005 - ROOM_TOP_Z) / 2 + 0.02],
      fadeFor: 'sub-table',
    },
  ],
  plunger: {
    rest: [LANE_X, BALL_R + 0.0005, BOTTOM_Z - 0.04 - BALL_R - 0.004],
    minSpeed: 1.6,
    maxSpeed: 3.4,
  },
  drainZ: BOTTOM_Z - 0.03,
  balls: 3,
}
