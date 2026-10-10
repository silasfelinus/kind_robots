// Zuzu: The Last Bell. Independent, dimensioned physics starter table.
//
// This is the first playable greybox, not the finished FX3-quality geometry.
// Every physical object below is owned by Zuzu, not a modified AMI table.
// Conductor zuzu-pinball/t-004..t-016 grow these primitives into three ramps,
// the Abbey upper deck, a sculpted River Croc, crypt and Zuzu-specific rules.

import type { ColliderDef, InsertDef, TableDef, Vec3 } from '../../types'
import { ramp, wall, walls, type XZ, type XZH } from '../builders'

const BALL = 0.0135
const LEFT = -0.26
const RIGHT = 0.3
const SHOOTER_WALL = 0.245
const SHOOTER_CENTER = (SHOOTER_WALL + RIGHT) / 2
const SHOOTER_EXIT = -0.59
const TOP = -0.97
const BOTTOM = 0.14
const FLOOR_MID = (TOP + BOTTOM) / 2
const BELL: Vec3 = [0, BALL, -0.79]

const arch: XZ[] = Array.from({ length: 25 }, (_, step) => {
  const theta = Math.PI + (step * Math.PI) / 24
  return [0.02 + Math.cos(theta) * 0.28, -0.72 + Math.sin(theta) * 0.25]
})

// Three distinct steel-ball paths. X/Z are metres, final coordinate is the
// real elevation of the continuous ramp deck. The village switchback crosses
// to the right inlane; the Abbey crossover feeds the left; the Bell climbs to
// the future upper Abbey deck before its temporary right-side gravity return.
const VILLAGE_SWITCHBACK: XZH[] = [
  [-0.12, -0.29, 0],
  [-0.14, -0.39, 0.011],
  [-0.155, -0.49, 0.033],
  [-0.175, -0.6, 0.053],
  [-0.165, -0.7, 0.064],
  [-0.08, -0.76, 0.065],
  [0.04, -0.75, 0.064],
  [0.15, -0.69, 0.062],
  [0.21, -0.56, 0.052],
  [0.214, -0.38, 0.046],
  [0.205, -0.19, 0.034],
]

const ABBEY_CROSSOVER: XZH[] = [
  [0.15, -0.29, 0],
  [0.17, -0.39, 0.012],
  [0.195, -0.49, 0.038],
  [0.19, -0.57, 0.071],
  [0.12, -0.62, 0.082],
  [0.02, -0.63, 0.081],
  [-0.11, -0.63, 0.079],
  [-0.19, -0.56, 0.069],
  [-0.2, -0.42, 0.052],
  [-0.207, -0.27, 0.044],
  [-0.205, -0.19, 0.036],
]

const BELL_SPIRAL: XZH[] = [
  [0.015, -0.30, 0],
  [0.012, -0.40, 0.010],
  [0.014, -0.51, 0.033],
  [0.018, -0.61, 0.057],
  [0.045, -0.72, 0.079],
  [0.10, -0.82, 0.092],
  [0.17, -0.84, 0.096],
  [0.205, -0.78, 0.095],
  [0.20, -0.70, 0.090],
  [0.23, -0.64, 0.080],
]

// Keep named paths for deterministic mechanical acceptance tests and for the
// upper-deck builder to connect the Bell to the raised Abbey without guessing.
export const ZUZU_RAMP_PATHS = {
  'village-switchback': VILLAGE_SWITCHBACK,
  'abbey-crossover': ABBEY_CROSSOVER,
  'bell-spiral': BELL_SPIRAL,
} as const

const colliders: ColliderDef[] = [
  {
    kind: 'box',
    id: 'zuzu-playfield',
    at: [0.02, -0.01, FLOOR_MID],
    half: [0.3, 0.01, (BOTTOM - TOP) / 2 + 0.02],
    material: 'playfield',
    restitution: 0.18,
  },
  {
    kind: 'box',
    id: 'zuzu-glass',
    at: [0.02, 0.17, FLOOR_MID],
    half: [0.3, 0.005, (BOTTOM - TOP) / 2 + 0.02],
    material: 'plastic-clear',
    hidden: true,
  },
  wall('bank-left', [LEFT, -0.72], [LEFT, BOTTOM], { thickness: 0.012 }),
  wall('bank-right', [RIGHT, -0.72], [RIGHT, BOTTOM], { thickness: 0.012 }),
  ...walls('abbey-arch', arch, { thickness: 0.009 }),
  // These are Rapier triangle-mesh floors, rails and clear anti-flyoff roofs,
  // not painted 2D ribbons. Balls can pass under the elevated crossovers.
  ...ramp('village-switchback', VILLAGE_SWITCHBACK, {
    width: 0.039,
    railHeight: 0.035,
    cover: [0.10, 0.65],
  }),
  ...ramp('abbey-crossover', ABBEY_CROSSOVER, {
    width: 0.039,
    railHeight: 0.035,
    cover: [0.11, 0.65],
  }),
  ...ramp('bell-spiral', BELL_SPIRAL, {
    width: 0.038,
    railHeight: 0.032,
    cover: [0.13, 0.48],
  }),
  // Raised catch plates at the exits stop a ball from rolling off the cabinet.
  wall('village-return-stop', [0.185, -0.165], [0.233, -0.165], {
    base: 0.03, height: 0.04, material: 'plastic-clear',
  }),
  wall('abbey-return-stop', [-0.228, -0.165], [-0.181, -0.165], {
    base: 0.03, height: 0.04, material: 'plastic-clear',
  }),
  // Each outer orbit has a dedicated up-table channel and a directional
  // return vane. The left channel ends before the Croc's mouth approach.
  wall('left-orbit-guide', [-0.166, -0.68], [-0.166, -0.54], {
    material: 'chrome', thickness: 0.004,
  }),
  wall('right-orbit-guide', [0.16, -0.68], [0.16, -0.54], {
    material: 'chrome', thickness: 0.004,
  }),
  wall('left-orbit-return', [-0.251, -0.35], [-0.215, -0.28], {
    material: 'chrome', thickness: 0.004, passDir: [0, 0, -1],
  }),
  wall('right-orbit-return', [0.24, -0.35], [0.207, -0.28], {
    material: 'chrome', thickness: 0.004, passDir: [0, 0, -1],
  }),
  // A real one-ball-width launch lane. The return gate is one-way: upward
  // shots pass, but a returning ball is deflected onto the main playfield.
  wall(
    'shooter-divider',
    [SHOOTER_WALL, SHOOTER_EXIT],
    [SHOOTER_WALL, BOTTOM],
    {
      thickness: 0.008,
    },
  ),
  wall(
    'shooter-gate',
    [SHOOTER_WALL, SHOOTER_EXIT],
    [RIGHT, SHOOTER_EXIT - 0.04],
    {
      material: 'chrome',
      thickness: 0.004,
      passDir: [0, 0, -1],
    },
  ),
  // Balls sitting on the plunger must not roll through the main drain.
  wall('plunger-stop', [SHOOTER_WALL, BOTTOM - 0.04], [RIGHT, BOTTOM - 0.04], {
    material: 'rubber',
    thickness: 0.008,
    restitution: 0.2,
  }),
  wall('inlane-left', [-0.24, 0.045], [-0.115, -0.17], {
    material: 'rubber',
  }),
  wall('inlane-right', [0.2, 0.045], [0.115, -0.17], {
    material: 'rubber',
  }),
  wall('sling-left', [-0.2, -0.09], [-0.107, -0.18], {
    material: 'rubber',
    kick: 1.8,
  }),
  wall('sling-right', [0.2, -0.09], [0.107, -0.18], {
    material: 'rubber',
    kick: 1.8,
  }),
  {
    kind: 'post',
    id: 'marsh-pop-left',
    at: [-0.035, 0.02, -0.58],
    radius: 0.023,
    halfHeight: 0.025,
    material: 'rubber',
    kick: 2.4,
  },
  {
    kind: 'post',
    id: 'marsh-pop-right',
    at: [0.085, 0.02, -0.58],
    radius: 0.023,
    halfHeight: 0.025,
    material: 'rubber',
    kick: 2.4,
  },
  {
    kind: 'post',
    id: 'marsh-pop-front',
    at: [0.025, 0.02, -0.49],
    radius: 0.023,
    halfHeight: 0.025,
    material: 'rubber',
    kick: 2.4,
  },
  {
    kind: 'post',
    id: 'croc-mouth-guide',
    at: [-0.221, 0.022, -0.46],
    radius: 0.011,
    halfHeight: 0.02,
    material: 'post',
  },
  {
    kind: 'post',
    id: 'croc-mouth-opposite',
    at: [-0.126, 0.022, -0.46],
    radius: 0.011,
    halfHeight: 0.02,
    material: 'post',
  },
]

const inserts: InsertDef[] = [
  {
    id: 'river-croc-mouth',
    at: [-0.175, -0.4],
    shape: 'arrow',
    size: 0.06,
    color: 0x55d6cd,
    shot: 'croc-mouth',
  },
  {
    id: 'bell-shot',
    at: [0, -0.68],
    shape: 'arrow',
    size: 0.06,
    color: 0xf2bb78,
    shot: 'bell-spiral',
  },
  {
    id: 'left-orbit',
    at: [-0.215, -0.68],
    shape: 'arrow',
    size: 0.05,
    color: 0xecc38e,
    shot: 'left-orbit',
  },
  {
    id: 'right-orbit',
    at: [0.205, -0.68],
    shape: 'arrow',
    size: 0.05,
    color: 0xecc38e,
    shot: 'right-orbit',
  },
  {
    id: 'village-switchback-arrow',
    at: [-0.12, -0.27],
    shape: 'arrow',
    size: 0.045,
    color: 0x7bdfa3,
    shot: 'village-switchback',
  },
  {
    id: 'abbey-crossover-arrow',
    at: [0.15, -0.27],
    shape: 'arrow',
    size: 0.045,
    color: 0xe7a86e,
    shot: 'abbey-crossover',
  },
  {
    id: 'croc-reward',
    at: [-0.1, -0.24],
    shape: 'circle',
    size: 0.035,
    color: 0x6ddcc5,
  },
  {
    id: 'crypt-seal',
    at: [0.025, -0.28],
    shape: 'circle',
    size: 0.04,
    color: 0x9d85ed,
  },
]

const frame = {
  min: [LEFT - 0.025, 0, TOP - 0.05] as Vec3,
  max: [RIGHT + 0.025, 0.19, BOTTOM + 0.02] as Vec3,
}

export const ZUZU_LAST_BELL_GREYBOX: TableDef = {
  id: 'zuzu-last-bell-greybox',
  title: 'Zuzu: The Last Bell (early engineering preview)',
  physical: {
    widthM: 0.56,
    lengthM: BOTTOM - TOP,
    pitchDeg: 6.5,
    ballRadiusM: BALL,
  },
  cameras: [
    {
      id: 'main',
      position: [0.02, 0.8, 0.6],
      target: [0.02, 0, -0.43],
      fovDeg: 32,
      frame,
      portrait: [0.02, 1.2, 0.22],
      portraitFovDeg: 36,
    },
    {
      id: 'plunge',
      position: [0.16, 0.72, 0.7],
      target: [0.12, 0, -0.44],
      fovDeg: 32,
      frame,
      portrait: [0.02, 1.2, 0.22],
    },
    {
      id: 'multiball',
      position: [0.02, 1.0, 0.4],
      target: [0.02, 0, -0.43],
      fovDeg: 32,
      frame,
      portrait: [0.02, 1.3, 0.2],
    },
  ],
  colliders,
  sensors: [
    {
      id: 'left-orbit-low',
      at: [-0.208, BALL, -0.65],
      half: [0.024, 0.02, 0.014],
    },
    {
      id: 'left-orbit-high',
      at: [-0.203, BALL, -0.85],
      half: [0.024, 0.02, 0.014],
    },
    {
      id: 'right-orbit-low',
      at: [0.203, BALL, -0.65],
      half: [0.024, 0.02, 0.014],
    },
    {
      id: 'right-orbit-high',
      at: [0.202, BALL, -0.85],
      half: [0.024, 0.02, 0.014],
    },
    { id: 'bell-lane', at: BELL, half: [0.035, 0.04, 0.025] },
    { id: 'village-entry', at: [-0.142, BALL + 0.012, -0.39], half: [0.02, 0.03, 0.014] },
    { id: 'village-crest', at: [-0.08, BALL + 0.065, -0.76], half: [0.018, 0.022, 0.017] },
    { id: 'village-return', at: [0.21, BALL + 0.046, -0.38], half: [0.02, 0.02, 0.018] },
    { id: 'abbey-entry', at: [0.17, BALL + 0.012, -0.39], half: [0.02, 0.03, 0.015] },
    { id: 'abbey-crest', at: [0.02, BALL + 0.081, -0.63], half: [0.019, 0.02, 0.018] },
    { id: 'abbey-return', at: [-0.2, BALL + 0.052, -0.42], half: [0.022, 0.02, 0.018] },
    { id: 'bell-entry', at: [0.012, BALL + 0.010, -0.40], half: [0.02, 0.03, 0.018] },
    { id: 'bell-crest', at: [0.17, BALL + 0.096, -0.84], half: [0.022, 0.02, 0.019] },
    { id: 'bell-return', at: [0.2, BALL + 0.09, -0.70], half: [0.021, 0.021, 0.019] },
  ],
  flippers: [
    {
      id: 'zuzu-lower-left',
      side: 'left',
      pivot: [-0.09, 0, -0.04],
      length: 0.08,
      baseRadius: 0.012,
      tipRadius: 0.0065,
      restAngle: 0.5,
      activeAngle: -0.46,
      strokeMs: 20,
      returnMs: 70,
    },
    {
      id: 'zuzu-lower-right',
      side: 'right',
      pivot: [0.09, 0, -0.04],
      length: 0.08,
      baseRadius: 0.012,
      tipRadius: 0.0065,
      restAngle: 0.5,
      activeAngle: -0.46,
      strokeMs: 20,
      returnMs: 70,
    },
  ],
  drops: [],
  spinners: [],
  scoops: [
    {
      id: 'croc-mouth',
      at: [-0.175, BALL, -0.48],
      radius: 0.025,
      captureMaxSpeed: Number.POSITIVE_INFINITY,
      holdMs: 800,
      eject: { at: [0.18, BALL + 0.005, -0.07], velocity: [-0.42, 0, -1.1] },
    },
    {
      id: 'mortuary',
      at: [0.157, BALL, -0.42],
      radius: 0.019,
      captureMaxSpeed: 1.0,
      holdMs: 900,
      eject: { at: [0.13, BALL, -0.4], velocity: [-0.75, 0, 0.7] },
    },
  ],
  shots: [
    {
      id: 'croc-mouth',
      kind: 'scoop',
      sensors: ['croc-mouth'],
      displayName: 'RIVER CROC',
    },
    {
      id: 'mortuary',
      kind: 'scoop',
      sensors: ['mortuary'],
      displayName: 'MORTUARY',
    },
    {
      id: 'left-orbit',
      kind: 'orbit',
      sensors: ['left-orbit-low', 'left-orbit-high'],
      displayName: 'LEFT ORBIT',
    },
    {
      id: 'right-orbit',
      kind: 'orbit',
      sensors: ['right-orbit-low', 'right-orbit-high'],
      displayName: 'RIGHT ORBIT',
    },
    {
      id: 'bell-lane',
      kind: 'lane',
      sensors: ['bell-lane'],
      displayName: 'ABBEY BELL',
    },
    {
      id: 'village-switchback',
      kind: 'ramp',
      sensors: ['village-entry', 'village-crest', 'village-return'],
      windowTicks: 360,
      displayName: 'VILLAGE SWITCHBACK',
    },
    {
      id: 'abbey-crossover',
      kind: 'ramp',
      sensors: ['abbey-entry', 'abbey-crest', 'abbey-return'],
      windowTicks: 360,
      displayName: 'ABBEY CROSSOVER',
    },
    {
      id: 'bell-spiral',
      kind: 'ramp',
      sensors: ['bell-entry', 'bell-crest', 'bell-return'],
      windowTicks: 360,
      displayName: 'BELL SPIRAL',
    },
  ],
  inserts,
  flashers: [
    { id: 'croc-flasher', at: [-0.175, 0.05, -0.49], color: 0x56d7cb },
    { id: 'bell-flasher', at: [0, 0.05, -0.79], color: 0xf0ba6c },
  ],
  plunger: {
    rest: [SHOOTER_CENTER, BALL + 0.0005, BOTTOM - 0.04 - BALL - 0.004],
    minSpeed: 1.7,
    maxSpeed: 3.4,
  },
  drainZ: BOTTOM - 0.03,
  balls: 3,
  dmd: { at: [0.02, 0.2, -1.04], width: 0.3 },
  art: {
    room: { backglass: '/images/arcade/games/zuzu-ghost-trail-title.webp' },
  },
}
