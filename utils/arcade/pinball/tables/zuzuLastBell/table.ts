// Zuzu: The Last Bell. Independent, dimensioned physics starter table.
//
// This is the first playable greybox, not the finished FX3-quality geometry.
// Every physical object below is owned by Zuzu, not a modified AMI table.
// Conductor zuzu-pinball/t-004..t-016 grow these primitives into three ramps,
// the Abbey upper deck, a sculpted River Croc, crypt and Zuzu-specific rules.

import type { ColliderDef, InsertDef, TableDef, Vec3 } from '../../types'
import { ramp, slingCap, wall, walls, type XZ, type XZH } from '../builders'

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
const SEAL_X = -0.054
/** The mouth of the captive relic ball's lane, behind the last seal. */
const RELIC_MOUTH = -0.405
// The Citadel lock (t-009) at the head of the bell lane: a saucer the bell
// shot's ball drops into as it rolls back from the arch (too fast to fall in
// on the way up), and a clear shelf above the lane where locked balls wait.
const CITADEL: Vec3 = [0.022, BALL, -0.845]
const CITADEL_SHELF = { z: -0.905, base: 0.05, height: 0.006 }
export const CITADEL_SLOTS: Vec3[] = [-0.008, 0.022, 0.052].map((x): Vec3 => [
  x,
  CITADEL_SHELF.base + CITADEL_SHELF.height + BALL,
  CITADEL_SHELF.z,
])
// The River Croc's mouth, on the left bank beside the left orbit lane.
const CROC: XZ = [-0.172, -0.47]

const arch: XZ[] = Array.from({ length: 25 }, (_, step) => {
  const theta = Math.PI + (step * Math.PI) / 24
  return [0.02 + Math.cos(theta) * 0.28, -0.72 + Math.sin(theta) * 0.25]
})

/** Where the River Croc lies (x, z): his LEDs on the rail sit beside him. */
export const CROC_XZ: readonly [number, number] = CROC

/**
 * The LED rail (t-012): up the inside of the left wall, round under the
 * arch and down the right wall, just inside the cabinet's edge.
 */
export const ZUZU_LED_RAIL: {
  points: Array<[number, number]>
  count: number
  y: number
} = {
  points: [
    [LEFT + 0.012, -0.12],
    ...Array.from({ length: 25 }, (_, step): [number, number] => {
      const theta = Math.PI + (step * Math.PI) / 24
      return [0.02 + Math.cos(theta) * 0.268, -0.72 + Math.sin(theta) * 0.238]
    }),
    [RIGHT - 0.008, -0.12],
  ],
  count: 96,
  y: 0.058,
}

// The Abbey (t-006): a clear raised deck on the right, level with the Bell
// spiral's end, so the spiral's ball rolls out onto it instead of off the
// cabinet. Two small upper flippers at its foot shoot at three hollow
// bells along its top; a ball past them drops into the exit hole and goes
// by subway to the right inlane. The deck is clear acrylic: the right orbit,
// the shooter lane and the Mortuary's approach stay in sight beneath it.
export const DECK_Y = 0.21
export const DECK = { left: 0.115, right: 0.29, top: -0.645, front: -0.418 }
/** Where the spiral comes onto the deck, through a gap in its top wall. */
const DECK_MOUTH = { from: 0.205, to: 0.255 }
const UPPER_FLIPPER = { z: -0.47, left: 0.147, right: 0.258, length: 0.04 }
const DECK_EXIT: Vec3 = [
  (UPPER_FLIPPER.left + UPPER_FLIPPER.right) / 2,
  DECK_Y + BALL,
  -0.432,
]
/** The three hollow bells along the deck's top, left of the spiral's mouth. */
export const ABBEY_BELLS = [0.135, 0.16, 0.185].map((x, i) => ({
  id: `abbey-bell-${i + 1}`,
  x,
}))

function abbeyDeck(): ColliderDef[] {
  const deck = { base: DECK_Y, height: 0.03 }
  const guide = { ...deck, material: 'chrome' as const, thickness: 0.004 }
  return [
    {
      kind: 'box',
      id: 'abbey-deck',
      at: [
        (DECK.left + DECK.right) / 2,
        DECK_Y - 0.005,
        (DECK.top + DECK.front) / 2,
      ],
      half: [
        (DECK.right - DECK.left) / 2 + 0.004,
        0.005,
        (DECK.front - DECK.top) / 2 + 0.004,
      ],
      material: 'plastic-clear',
      restitution: 0.18,
    },
    wall('abbey-wall-left', [DECK.left, DECK.top], [DECK.left, DECK.front], {
      ...deck,
      thickness: 0.006,
    }),
    wall('abbey-wall-right', [DECK.right, DECK.top], [DECK.right, DECK.front], {
      ...deck,
      thickness: 0.006,
    }),
    wall(
      'abbey-wall-top-left',
      [DECK.left, DECK.top],
      [DECK_MOUTH.from, DECK.top],
      {
        ...deck,
        thickness: 0.006,
      },
    ),
    wall(
      'abbey-wall-top-right',
      [DECK_MOUTH.to, DECK.top],
      [DECK.right, DECK.top],
      {
        ...deck,
        thickness: 0.006,
      },
    ),
    wall(
      'abbey-wall-front',
      [DECK.left, DECK.front],
      [DECK.right, DECK.front],
      {
        ...deck,
        thickness: 0.006,
      },
    ),
    // Inlane guides from the side walls to the flipper pivots, and under
    // each flipper an apron to the exit hole: the deck's only way out.
    ...(['left', 'right'] as const).flatMap((side): ColliderDef[] => {
      const s = side === 'left' ? -1 : 1
      const pivot = UPPER_FLIPPER[side]
      const end: XZ = [pivot - s * 0.006, UPPER_FLIPPER.z - 0.004]
      return [
        wall(
          `abbey-inlane-${side}`,
          [side === 'left' ? DECK.left : DECK.right, UPPER_FLIPPER.z - 0.06],
          end,
          guide,
        ),
        wall(
          `abbey-apron-${side}`,
          end,
          [DECK_EXIT[0] - s * 0.02, DECK.front],
          guide,
        ),
      ]
    }),
  ]
}

// The undercrypt (t-010): a hidden mini-table behind the backbox, under the
// Abbey in the story. Three relic strikes light the crypt; the Mortuary then
// sends its ball down a subway instead of telling a chapter, and it comes up
// at the crypt's far corner. The crypt has its own pair of flippers (on the
// lower buttons), three skull standups and a HOME saucer. HOME, or a ball
// past the crypt's flippers, goes back by subway to the Mortuary's kicker:
// nothing is lost below. The backbox hides the crypt from the main camera,
// which eases over it only while every ball is down there.
export const CRYPT = {
  x: 0.02,
  half: 0.16,
  bottom: -1.1,
  top: -1.4,
  flipperZ: -1.15,
}
export const CRYPT_SKULLS = [-0.06, 0, 0.06].map((dx, i) => ({
  id: `crypt-skull-${i + 1}`,
  x: CRYPT.x + dx,
}))
const BACKBOX_Z = -1.06

function crypt(): ColliderDef[] {
  const x = (dx: number) => CRYPT.x + dx
  const guide = { material: 'chrome' as const, thickness: 0.004 }
  const side = (sign: -1 | 1): ColliderDef[] => {
    const name = sign < 0 ? 'left' : 'right'
    const pivot = x(sign * 0.065)
    const end: XZ = [pivot - sign * 0.006, CRYPT.flipperZ - 0.004]
    return [
      wall(
        `crypt-inlane-${name}`,
        [x(sign * CRYPT.half), CRYPT.flipperZ - 0.07],
        end,
        guide,
      ),
      wall(`crypt-apron-${name}`, end, [x(sign * 0.02), CRYPT.bottom], guide),
      // The top corner, cut so a ball cannot sit in it.
      wall(
        `crypt-corner-${name}`,
        [x(sign * CRYPT.half), CRYPT.top + 0.035],
        [x(sign * (CRYPT.half - 0.035)), CRYPT.top],
        { material: 'rubber' },
      ),
    ]
  }
  return [
    {
      kind: 'box',
      id: 'crypt-floor',
      at: [CRYPT.x, -0.01, (CRYPT.bottom + CRYPT.top) / 2],
      half: [CRYPT.half + 0.03, 0.01, (CRYPT.bottom - CRYPT.top) / 2 + 0.03],
      material: 'playfield',
      restitution: 0.18,
    },
    {
      kind: 'box',
      id: 'crypt-glass',
      at: [CRYPT.x, 0.31, (CRYPT.bottom + CRYPT.top) / 2],
      half: [CRYPT.half + 0.03, 0.005, (CRYPT.bottom - CRYPT.top) / 2 + 0.03],
      material: 'plastic-clear',
      hidden: true,
    },
    ...walls(
      'crypt-wall',
      [
        [x(-CRYPT.half), CRYPT.bottom],
        [x(-CRYPT.half), CRYPT.top],
        [x(CRYPT.half), CRYPT.top],
        [x(CRYPT.half), CRYPT.bottom],
        [x(-CRYPT.half), CRYPT.bottom],
      ],
      { thickness: 0.009 },
    ),
    ...side(-1),
    ...side(1),
  ]
}

function cryptFlipper(side: 'left' | 'right') {
  const sign = side === 'left' ? -1 : 1
  return {
    id: `crypt-flipper-${side}`,
    side,
    zone: 'sub-table',
    pivot: [CRYPT.x + sign * 0.065, 0, CRYPT.flipperZ] as Vec3,
    length: 0.05,
    baseRadius: 0.009,
    tipRadius: 0.0055,
    restAngle: 0.5,
    activeAngle: -0.45,
    strokeMs: 20,
    returnMs: 80,
  }
}

function upperFlipper(side: 'left' | 'right') {
  return {
    id: `abbey-flipper-${side}`,
    side,
    upper: true,
    pivot: [UPPER_FLIPPER[side], DECK_Y, UPPER_FLIPPER.z] as Vec3,
    length: UPPER_FLIPPER.length,
    baseRadius: 0.009,
    tipRadius: 0.005,
    restAngle: 0.5,
    activeAngle: -0.46,
    strokeMs: 18,
    returnMs: 60,
  }
}

// Three distinct steel-ball paths. X/Z are metres, final coordinate is the
// real elevation of the continuous ramp deck. The village switchback crosses
// to the right inlane; the Abbey crossover feeds the left; the Bell climbs to
// raised Abbey deck (t-006) on the right.
const VILLAGE_SWITCHBACK: XZH[] = [
  [-0.12, -0.29, 0],
  [-0.12, -0.39, 0.011],
  [-0.1, -0.49, 0.033],
  [-0.09, -0.6, 0.053],
  [-0.055, -0.7, 0.064],
  [-0.05, -0.76, 0.065],
  [0.04, -0.75, 0.064],
  [0.15, -0.69, 0.062],
  [0.21, -0.56, 0.052],
  [0.214, -0.38, 0.046],
  [0.183, -0.19, 0.034],
]

const ABBEY_CROSSOVER: XZH[] = [
  [0.097, -0.27, 0],
  [0.11, -0.37, 0.035],
  [0.12, -0.47, 0.08],
  [0.12, -0.57, 0.122],
  [0.06, -0.63, 0.135],
  [-0.08, -0.64, 0.135],
  [-0.22, -0.63, 0.12],
  [-0.23, -0.5, 0.085],
  [-0.228, -0.35, 0.055],
  [-0.184, -0.19, 0.034],
]

const BELL_SPIRAL: XZH[] = [
  [0.015, -0.3, 0],
  [0.012, -0.4, 0.055],
  [0.014, -0.51, 0.12],
  [0.01, -0.61, 0.195],
  [0, -0.7, 0.235],
  [-0.005, -0.79, 0.242],
  [0.06, -0.85, 0.24],
  [0.15, -0.84, 0.235],
  [0.18, -0.78, 0.23],
  [0.2, -0.7, 0.224],
  [0.23, -0.64, 0.21],
]

// Keep named paths for deterministic mechanical acceptance tests and for the
// upper-deck builder to connect the Bell to the raised Abbey without guessing.
export const ZUZU_RAMP_PATHS = {
  'village-switchback': VILLAGE_SWITCHBACK,
  'abbey-crossover': ABBEY_CROSSOVER,
  'bell-spiral': BELL_SPIRAL,
} as const

// The lower field, authored per side: an outlane between the cabinet rail and
// the inlane guide, an inlane that bends in over the flipper pivot so a ball
// rolls straight onto the resting flipper, and a triangular slingshot whose
// rubber face kicks toward the far flipper. The right outlane is narrower
// because the shooter lane takes that side of the cabinet.
const FLIPPER_X = 0.09
export const INLANE_GUIDE = { left: -0.205, right: 0.2 } as const
export const SLING_BACK = 0.162

function lowerSide(name: 'left' | 'right'): ColliderDef[] {
  const s = name === 'left' ? -1 : 1
  const guide = INLANE_GUIDE[name]
  const top: XZ = [s * SLING_BACK, -0.215]
  const bottom: XZ = [s * SLING_BACK, -0.14]
  const tip: XZ = [s * 0.113, -0.104]
  return [
    ...walls(
      `${name}-inlane-guide`,
      [
        [guide, -0.25],
        [guide, -0.12],
        [s * (FLIPPER_X - 0.0063), -0.045],
      ],
      { material: 'chrome', thickness: 0.004 },
    ),
    wall(`sling-${name}-back`, top, bottom, { material: 'plastic-printed' }),
    wall(`sling-${name}-base`, bottom, tip, { material: 'plastic-printed' }),
    wall(`sling-${name}-kicker`, top, tip, { material: 'rubber', kick: 1.5 }),
    slingCap(`sling-${name}-cap`, [top, bottom, tip]),
  ]
}

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
    at: [0.02, 0.31, FLOOR_MID],
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
    cover: [0.1, 0.65],
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
  // The Citadel's lock shelf, raised clear over the lane: a ball below
  // rolls under it, and the locked balls sit on it in plain view.
  wall(
    'citadel-shelf',
    [CITADEL_SLOTS[0]![0] - 0.02, CITADEL_SHELF.z],
    [CITADEL_SLOTS[2]![0] + 0.02, CITADEL_SHELF.z],
    {
      base: CITADEL_SHELF.base,
      height: CITADEL_SHELF.height,
      thickness: 0.032,
      material: 'plastic-clear',
    },
  ),
  ...abbeyDeck(),
  ...crypt(),
  // Raised catch plates at the exits stop a ball from rolling off the cabinet.
  wall('village-return-stop', [0.163, -0.165], [0.203, -0.165], {
    base: 0.03,
    height: 0.04,
    material: 'plastic-clear',
  }),
  wall('abbey-return-stop', [-0.205, -0.165], [-0.163, -0.165], {
    base: 0.03,
    height: 0.04,
    material: 'plastic-clear',
  }),
  // Each outer orbit has a dedicated up-table channel and a directional
  // return vane. The left channel is one ball wide and runs down past the
  // Croc, so the orbit and the mouth are two separate shots side by side.
  wall('left-orbit-guide', [-0.215, -0.68], [-0.215, -0.44], {
    material: 'chrome',
    thickness: 0.004,
  }),
  wall('right-orbit-guide', [0.16, -0.68], [0.16, -0.54], {
    material: 'chrome',
    thickness: 0.004,
  }),
  wall('left-orbit-return', [-0.251, -0.35], [-0.215, -0.28], {
    material: 'chrome',
    thickness: 0.004,
    passDir: [0, 0, -1],
  }),
  wall('right-orbit-return', [0.24, -0.35], [0.207, -0.28], {
    material: 'chrome',
    thickness: 0.004,
    passDir: [0, 0, -1],
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
  ...lowerSide('left'),
  ...lowerSide('right'),
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
  // The relic's lane, in line behind the Abbey seals: a short pocket whose
  // mouth posts hold the captive ball in but leave it standing proud, so a
  // ball up the channel strikes it once the seals are down.
  ...walls(
    'relic-lane',
    [
      [SEAL_X - 0.0185, RELIC_MOUTH],
      [SEAL_X - 0.0185, RELIC_MOUTH - 0.065],
      [SEAL_X + 0.0185, RELIC_MOUTH - 0.065],
      [SEAL_X + 0.0185, RELIC_MOUTH],
    ],
    { material: 'chrome', thickness: 0.006 },
  ),
  ...[-1, 1].map((side): ColliderDef => ({
    kind: 'post',
    id: `relic-mouth-${side < 0 ? 'l' : 'r'}`,
    at: [SEAL_X + side * 0.014, 0.02, RELIC_MOUTH],
    radius: 0.004,
    halfHeight: 0.02,
    material: 'post',
  })),
  {
    kind: 'post',
    id: 'croc-mouth-guide',
    at: [CROC[0] - 0.028, 0.022, CROC[1] + 0.025],
    radius: 0.008,
    halfHeight: 0.02,
    material: 'post',
  },
  {
    kind: 'post',
    id: 'croc-mouth-opposite',
    at: [CROC[0] + 0.028, 0.022, CROC[1] + 0.025],
    radius: 0.008,
    halfHeight: 0.02,
    material: 'post',
  },
]

const inserts: InsertDef[] = [
  {
    id: 'river-croc-mouth',
    at: [CROC[0], -0.39],
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
    id: 'abbey-seals',
    at: [SEAL_X, -0.275],
    shape: 'rect',
    size: 0.04,
    depth: 0.022,
    color: 0xe9a56b,
  },
  {
    id: 'relic-lane',
    at: [0.143, -0.25],
    shape: 'arrow',
    size: 0.05,
    color: 0xc4a2f8,
    shot: 'relic-spinner',
  },
  // The Citadel's lock lamps: one per ball it holds, the next one blinking
  // while a lock is lit.
  ...CITADEL_SLOTS.map((slot, i): InsertDef => ({
    id: `citadel-${i + 1}`,
    at: [slot[0], -0.735],
    shape: 'circle',
    size: 0.014,
    color: 0xf2bb78,
  })),
  // The waterline LEDs (t-016): lit while his jaws are open, all of them
  // astir in the Watering Hole, flashing when an orbit has lit the mouth.
  ...(
    [
      [CROC[0] - 0.045, -0.4],
      [CROC[0] + 0.045, -0.4],
      [CROC[0], -0.33],
    ] as const
  ).map((at, i): InsertDef => ({
    id: `waterline-${i + 1}`,
    at: [at[0], at[1]],
    shape: 'circle',
    size: 0.014,
    color: 0x3fbfb0,
  })),
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

// The story track: one seal lamp per chapter, the bonus multiplier under it,
// and the lamps for the kickback and a ball to shoot again.
const storyLamps: InsertDef[] = [
  {
    id: 'relic-lamp',
    at: [SEAL_X, RELIC_MOUTH - 0.045],
    shape: 'circle',
    size: 0.018,
    color: 0xc4a2f8,
  },
  ...[-0.07, -0.035, 0, 0.035, 0.07].map((x, i): InsertDef => ({
    id: `seal-${i + 1}`,
    at: [x, -0.205],
    shape: 'circle',
    size: 0.02,
    color: [0xe9a56b, 0x7fb6e8, 0xd9c27a, 0xf0e2c8, 0xd95f4e][i]!,
  })),
  ...[2, 3, 4, 5].map((n, i): InsertDef => ({
    id: `bonus-${n}x`,
    at: [-0.0525 + i * 0.035, -0.17],
    shape: 'circle',
    size: 0.016,
    color: 0xf2bb78,
  })),
  {
    id: 'shoot-again',
    at: [0, -0.135],
    shape: 'circle',
    size: 0.022,
    color: 0xf5f0e6,
  },
  {
    id: 'kickback-lamp',
    at: [-0.2325, -0.02],
    shape: 'circle',
    size: 0.016,
    color: 0xd95f4e,
  },
  {
    id: 'mortuary-arrow',
    at: [0.172, -0.36],
    shape: 'arrow',
    size: 0.035,
    color: 0xc9b6f0,
    shot: 'mortuary',
  },
]

const frame = {
  min: [LEFT - 0.025, 0, TOP - 0.05] as Vec3,
  max: [RIGHT + 0.025, 0.33, BOTTOM + 0.02] as Vec3,
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
    {
      // Over the backbox, down into the undercrypt (t-010).
      id: 'sub-table',
      position: [CRYPT.x, 0.52, CRYPT.bottom + 0.27],
      target: [CRYPT.x, 0, (CRYPT.top + CRYPT.bottom) / 2],
      fovDeg: 32,
      frame: {
        min: [CRYPT.x - CRYPT.half - 0.03, 0, CRYPT.top - 0.02],
        max: [CRYPT.x + CRYPT.half + 0.03, 0.03, CRYPT.bottom + 0.04],
      },
      portrait: [CRYPT.x, 0.7, CRYPT.bottom + 0.15],
      portraitFovDeg: 36,
    },
  ],
  colliders,
  sensors: [
    // The ball leaving the shooter lane: the plunge, for the skill shot.
    {
      id: 'shooter-exit',
      at: [SHOOTER_CENTER, BALL, -0.5],
      half: [0.02, 0.02, 0.012],
    },
    {
      id: 'left-orbit-low',
      at: [-0.236, BALL, -0.6],
      half: [0.02, 0.02, 0.014],
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
    {
      id: 'village-entry',
      at: [-0.12, BALL + 0.011, -0.39],
      half: [0.02, 0.03, 0.014],
    },
    {
      id: 'village-crest',
      at: [-0.05, BALL + 0.065, -0.76],
      half: [0.018, 0.022, 0.017],
    },
    {
      id: 'village-return',
      at: [0.21, BALL + 0.046, -0.38],
      half: [0.02, 0.02, 0.018],
    },
    {
      id: 'abbey-entry',
      at: [0.112, BALL + 0.035, -0.39],
      half: [0.02, 0.03, 0.015],
    },
    {
      id: 'abbey-crest',
      at: [-0.08, BALL + 0.135, -0.64],
      half: [0.019, 0.02, 0.018],
    },
    {
      id: 'abbey-return',
      at: [-0.228, BALL + 0.055, -0.35],
      half: [0.022, 0.02, 0.018],
    },
    {
      id: 'bell-entry',
      at: [0.012, BALL + 0.055, -0.4],
      half: [0.02, 0.03, 0.018],
    },
    {
      id: 'bell-crest',
      at: [0.06, BALL + 0.24, -0.85],
      half: [0.022, 0.02, 0.019],
    },
    {
      id: 'bell-return',
      at: [0.2, BALL + 0.224, -0.7],
      half: [0.021, 0.021, 0.019],
    },
  ],
  flippers: [
    {
      id: 'zuzu-lower-left',
      side: 'left',
      pivot: [-0.09, 0, -0.04],
      length: 0.075,
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
      length: 0.075,
      baseRadius: 0.012,
      tipRadius: 0.0065,
      restAngle: 0.5,
      activeAngle: -0.46,
      strokeMs: 20,
      returnMs: 70,
    },
    upperFlipper('left'),
    upperFlipper('right'),
    cryptFlipper('left'),
    cryptFlipper('right'),
  ],
  // The four Abbey seals stand in line in the channel between the Village and
  // Bell ramps: each one knocked down bares the next, so the bank asks for
  // four straight shots instead of sitting across every ramp's mouth.
  drops: [
    ...[-0.31, -0.335, -0.36, -0.385].map((z, i) => ({
      id: `abbey-seal-${i + 1}`,
      bank: 'abbey-seals',
      at: [SEAL_X, 0.019, z] as Vec3,
      half: [0.012, 0.022, 0.004] as Vec3,
    })),
    // The Abbey's hollow bells (t-006): standups along the deck's top wall,
    // faced to the upper flippers; each hit rings, none ever drops.
    ...ABBEY_BELLS.map((bell) => ({
      id: bell.id,
      bank: 'abbey-bells',
      at: [bell.x, DECK_Y + 0.019, DECK.top + 0.008] as Vec3,
      half: [0.01, 0.019, 0.004] as Vec3,
      standup: true,
    })),
    // The crypt's skulls (t-010): standups across its top wall.
    ...CRYPT_SKULLS.map((skull) => ({
      id: skull.id,
      bank: 'crypt-skulls',
      at: [skull.x, 0.019, CRYPT.top + 0.012] as Vec3,
      half: [0.014, 0.019, 0.004] as Vec3,
      standup: true,
    })),
  ],
  spinners: [
    {
      id: 'relic-spinner',
      at: [0.143, BALL + 0.008, -0.33],
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
      at: [CROC[0], BALL, CROC[1]],
      radius: 0.022,
      captureMaxSpeed: Number.POSITIVE_INFINITY,
      holdMs: 800,
      // Spat out onto the right inlane, to roll down onto the flipper.
      eject: { at: [0.181, BALL + 0.005, -0.2], velocity: [0, 0, 0.3] },
    },
    {
      id: 'mortuary',
      at: [0.157, BALL, -0.42],
      radius: 0.019,
      captureMaxSpeed: 1.0,
      holdMs: 900,
      eject: { at: [0.13, BALL, -0.42], velocity: [-0.55, 0, -0.45] },
    },
    {
      id: 'citadel',
      at: CITADEL,
      radius: 0.02,
      captureMaxSpeed: 1.4,
      holdMs: 500,
      // A subway under the playfield to the left inlane, as the Croc spits
      // to the right: kicked out at the head of the bell lane, the ball fell
      // onto the pops, which sent it straight back up the lane, for ever.
      eject: {
        at: [(INLANE_GUIDE.left - SLING_BACK) / 2, BALL + 0.0005, -0.24],
        velocity: [0, 0, 0.3],
      },
      lock: { slots: CITADEL_SLOTS, releaseGapMs: 700 },
    },
    {
      // The Abbey deck's exit: a hole between the upper flippers, and a
      // subway to the right inlane, as the Croc spits.
      id: 'abbey-exit',
      at: DECK_EXIT,
      radius: 0.018,
      captureMaxSpeed: Number.POSITIVE_INFINITY,
      holdMs: 300,
      hidden: true,
      eject: { at: [0.181, BALL + 0.005, -0.2], velocity: [0, 0, 0.3] },
    },
    {
      // Where the Mortuary's subway comes up into the crypt. It never
      // captures; it only kicks the arriving ball down toward the flippers.
      id: 'crypt-entry',
      at: [CRYPT.x - 0.12, BALL, CRYPT.top + 0.045],
      radius: 0.012,
      captureMaxSpeed: -1,
      holdMs: 0,
      eject: {
        at: [CRYPT.x - 0.12, BALL, CRYPT.top + 0.045],
        velocity: [0.3, 0, 0.45],
      },
    },
    {
      // The crypt's goal: HOME, back up to the Mortuary's kicker.
      id: 'crypt-home',
      at: [CRYPT.x + 0.1, BALL, CRYPT.top + 0.09],
      radius: 0.02,
      captureMaxSpeed: 2.5,
      holdMs: 1000,
      eject: {
        at: [CRYPT.x + 0.1, BALL, CRYPT.top + 0.09],
        velocity: [0, 0, 0],
      },
      subwayTo: 'mortuary',
    },
    {
      // Past the crypt's flippers: not lost, it goes back up too.
      id: 'crypt-drain',
      at: [CRYPT.x, BALL, CRYPT.bottom - 0.02],
      radius: 0.02,
      captureMaxSpeed: Number.POSITIVE_INFINITY,
      holdMs: 700,
      eject: { at: [CRYPT.x, BALL, CRYPT.bottom - 0.02], velocity: [0, 0, 0] },
      subwayTo: 'mortuary',
      hidden: true,
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
  inserts: [...inserts, ...storyLamps],
  flashers: [
    {
      id: 'croc-flasher',
      at: [CROC[0], 0.05, CROC[1] - 0.01],
      color: 0x56d7cb,
    },
    { id: 'bell-flasher', at: [0, 0.05, -0.79], color: 0xf0ba6c },
  ],
  // The River Croc's jaw: open, the mouth takes the ball; shut (while he
  // holds one, rolls, spits and sinks), an unseen gate across the jaws turns
  // every other ball away, so the mouth never takes two.
  doors: [
    {
      id: 'croc-jaw',
      startsOpen: true,
      closed: [
        wall(
          'croc-jaw-gate',
          [CROC[0] - 0.021, CROC[1] + 0.024],
          [CROC[0] + 0.021, CROC[1] + 0.024],
          { material: 'plastic-clear', thickness: 0.006, hidden: true },
        ),
      ],
      open: [],
    },
  ],
  animatronics: [
    {
      id: 'river-croc',
      kind: 'river-croc',
      at: [CROC[0], 0, CROC[1] - 0.004],
    },
  ],
  captives: [
    { id: 'relic-captive', at: [SEAL_X, BALL + 0.0005, RELIC_MOUTH - 0.013] },
  ],
  plunger: {
    rest: [SHOOTER_CENTER, BALL + 0.0005, BOTTOM - 0.04 - BALL - 0.004],
    minSpeed: 1.7,
    maxSpeed: 3.4,
  },
  drainZ: BOTTOM - 0.03,
  balls: 3,
  dmd: { at: [0.02, 0.2, -1.04], width: 0.3, occluder: 'backbox' },
  ledRail: ZUZU_LED_RAIL,
  zones: [
    {
      id: 'sub-table',
      min: [CRYPT.x - CRYPT.half - 0.03, CRYPT.top - 0.03],
      max: [CRYPT.x + CRYPT.half + 0.03, CRYPT.bottom + 0.03],
    },
  ],
  occluders: [
    {
      // The backbox: it stands between the main camera and the crypt.
      id: 'backbox',
      at: [CRYPT.x, 0.2, BACKBOX_Z],
      half: [0.32, 0.2, 0.012],
      fadeFor: 'sub-table',
    },
    {
      // Its lid, so a steep (phone) camera sees cabinet over the crypt.
      id: 'backbox-lid',
      at: [CRYPT.x, 0.4, (CRYPT.top + BACKBOX_Z) / 2],
      half: [0.32, 0.012, (BACKBOX_Z - CRYPT.top) / 2 + 0.02],
      fadeFor: 'sub-table',
    },
  ],
  art: {
    // Rendered by durable ArtJobs from conductor's art-prompts.yaml
    // (zuzu-pinball/t-011): the painted playfield over the whole table
    // rectangle, and the backglass over the DMD.
    playfield: {
      src: '/images/pinball/zuzu-last-bell-playfield-painted.webp',
      min: [LEFT - 0.02, TOP - 0.05],
      max: [RIGHT + 0.02, BOTTOM + 0.05],
    },
    room: {
      backglass: '/images/pinball/zuzu-last-bell-backglass.webp',
      backglassFallback: '/images/arcade/games/zuzu-ghost-trail-title.webp',
    },
  },
}
