// Zuzu: The Last Bell. Independent, dimensioned physics starter table.
//
// This is the first playable greybox, not the finished FX3-quality geometry.
// Every physical object below is owned by Zuzu, not a modified AMI table.
// Conductor zuzu-pinball/t-004..t-016 grow these primitives into three ramps,
// the Abbey upper deck, a sculpted River Croc, crypt and Zuzu-specific rules.

import type { ColliderDef, InsertDef, TableDef, Vec3 } from '../../types'
import { wall, walls, type XZ } from '../builders'

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
    at: [0.02, 0.12, FLOOR_MID],
    half: [0.3, 0.005, (BOTTOM - TOP) / 2 + 0.02],
    material: 'plastic-clear',
    hidden: true,
  },
  wall('bank-left', [LEFT, -0.72], [LEFT, BOTTOM], { thickness: 0.012 }),
  wall('bank-right', [RIGHT, -0.72], [RIGHT, BOTTOM], { thickness: 0.012 }),
  ...walls('abbey-arch', arch, { thickness: 0.009 }),
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
    shot: 'bell-lane',
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
    id: 'abbey-seals',
    at: [-0.02, -0.32],
    shape: 'rect',
    size: 0.15,
    depth: 0.025,
    color: 0xe9a56b,
  },
  {
    id: 'relic-lane',
    at: [0.115, -0.28],
    shape: 'arrow',
    size: 0.05,
    color: 0xc4a2f8,
    shot: 'relic-spinner',
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
  max: [RIGHT + 0.025, 0.13, BOTTOM + 0.02] as Vec3,
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
  drops: [-0.095, -0.045, 0.005, 0.055].map((x, i) => ({
    id: `abbey-seal-${i + 1}`,
    bank: 'abbey-seals',
    at: [x, 0.019, -0.37] as Vec3,
    half: [0.015, 0.022, 0.004] as Vec3,
  })),
  spinners: [
    {
      id: 'relic-spinner',
      at: [0.115, BALL + 0.008, -0.33],
      half: [0.012, 0.022, 0.004],
    },
  ],
  kickers: [
    {
      id: 'kickback',
      at: [-0.235, BALL, 0.038],
      half: [0.018, 0.015, 0.016],
      velocity: [0, 0, -3.2],
    },
  ],
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
      id: 'relic-spinner',
      kind: 'spinner',
      sensors: ['relic-spinner'],
      displayName: 'RELIC SPINNER',
    },
    {
      id: 'bell-lane',
      kind: 'lane',
      sensors: ['bell-lane'],
      displayName: 'ABBEY BELL',
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
