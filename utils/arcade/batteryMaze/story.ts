// /utils/arcade/batteryMaze/story.ts
//
// Battery Maze's story breaks (conductor kr-arcade/t-040): a short comic after each board, told
// as data. Every scene is a stage (the night skyline over a tiled floor) with a few actors
// moving between keyframes and a caption or two; the game draws whatever the keys say. Slice 2
// tells the first two of the six:
//
//   COFFEE BREAK  ZIP chases the robot across the stage, then the robot, charged up to three
//                 times its size, chases a sleepy ZIP back.
//   SPILLED OIL   an oil can tips over; the robot skates across the puddle, ZIP skids after it
//                 and lands in a heap, and the robot helps it up, friends.
//
// Slice 3 (t-041) tells the other four, and the endings:
//
//   CHARGING PARTY the four old friends throw the robot a party, cake and all.
//   SNOW DAY       FLURRY rolls after the robot, growing, and bowls ZIP into a snow-gremlin.
//   LIGHTS OUT     the arcade goes dark; eyes in the gloom; then the lamps come on: a surprise!
//   SUNRISE        the sun comes up over the solar farm while the robot and the twins watch.
//   THE ENDING     the grid hums back to life, the gremlins, rebooted for good, gather to wave
//                  the robot home, and the credits roll.
//   TRUE ENDING    with all six golden bolts: the gremlins plant a garden of glowing flowers
//                  on the rooftop.

import type { GremlinKind } from './roster'

/** Who is on stage: the robot, a gremlin of some kind, or a prop. */
export type Cast =
  | 'robot'
  | GremlinKind
  | 'mama'
  | 'oil-can'
  | 'puddle'
  | 'stars'
  | 'cake'
  | 'snow'
  | 'dark'
  | 'sun'
  | 'flowers'

/** How an actor looks from a key on: a gremlin's 'sleepy', 'dizzy' or 'friend'; 'hidden' leaves. */
export type Pose = 'run' | 'sleepy' | 'dizzy' | 'friend' | 'hidden'

/** [tick, x, y, facing (-1 left, 1 right), pose, scale] -- position in stage pixels. */
export type Key = readonly [number, number, number, -1 | 1, Pose?, number?]

export type Actor = { cast: Cast; keys: readonly Key[] }

export type Caption = { from: number; to: number; text: string }

/** The stage behind the actors: the night skyline, or the rooftop at dawn. */
export type Sky = 'night' | 'dawn'

export type Scene = {
  id: string
  title: string
  ticks: number
  actors: readonly Actor[]
  captions: readonly Caption[]
  sky?: Sky
  /** Lines rolling up the screen from `from` (the ending's credits). */
  credits?: { from: number; lines: readonly string[] }
}

/** The floor line actors walk along (stage pixels). */
export const STAGE_FLOOR = 157

const F = STAGE_FLOOR
/** A gremlin hopping on the spot, waving, from `from` to `to`. */
function hops(
  cast: Cast,
  x: number,
  from: number,
  to: number,
  face: -1 | 1,
): Actor {
  const keys: Key[] = [
    [0, x, F, face, 'hidden'],
    [from, x, F, face, 'friend'],
  ]
  for (let t = from + 15; t < to; t += 30)
    keys.push([t, x, F - 6, face, 'friend'], [t + 15, x, F, face, 'friend'])
  return { cast, keys }
}

export const SCENES: readonly Scene[] = [
  {
    id: 'coffee-break',
    title: 'COFFEE BREAK',
    ticks: 300,
    actors: [
      {
        cast: 'robot',
        keys: [
          [0, 342, STAGE_FLOOR, -1],
          [150, -20, STAGE_FLOOR, -1],
          [151, -54, STAGE_FLOOR - 13, 1, 'run', 3],
          [300, 306, STAGE_FLOOR - 13, 1, 'run', 3],
        ],
      },
      {
        cast: 'chaser',
        keys: [
          [0, 372, STAGE_FLOOR, -1],
          [150, 10, STAGE_FLOOR, -1],
          [151, -20, STAGE_FLOOR, 1, 'sleepy'],
          [300, 340, STAGE_FLOOR, 1, 'sleepy'],
        ],
      },
    ],
    captions: [{ from: 160, to: 300, text: 'FULLY CHARGED!' }],
  },
  {
    id: 'spilled-oil',
    title: 'SPILLED OIL',
    ticks: 420,
    actors: [
      {
        cast: 'oil-can',
        keys: [
          [0, 161, STAGE_FLOOR - 2, 1],
          [40, 161, STAGE_FLOOR - 2, -1],
          [60, 161, STAGE_FLOOR - 2, -1, 'hidden'],
        ],
      },
      {
        cast: 'puddle',
        keys: [
          [0, 161, STAGE_FLOOR + 7, 1, 'hidden'],
          [40, 161, STAGE_FLOOR + 7, 1, 'run'],
        ],
      },
      {
        cast: 'robot',
        keys: [
          [0, -20, STAGE_FLOOR, 1],
          [110, 130, STAGE_FLOOR, 1],
          [150, 250, STAGE_FLOOR, 1],
          [190, 280, STAGE_FLOOR, -1],
          [300, 280, STAGE_FLOOR, -1],
          [340, 225, STAGE_FLOOR, -1],
          [420, 225, STAGE_FLOOR, -1],
        ],
      },
      {
        cast: 'chaser',
        keys: [
          [0, -60, STAGE_FLOOR, 1, 'hidden'],
          [90, -20, STAGE_FLOOR, 1, 'run'],
          [190, 130, STAGE_FLOOR, 1],
          [230, 205, STAGE_FLOOR - 24, 1, 'dizzy'],
          [260, 210, STAGE_FLOOR, 1, 'dizzy'],
          [340, 210, STAGE_FLOOR, 1, 'dizzy'],
          [341, 205, STAGE_FLOOR, 1, 'friend'],
          [420, 205, STAGE_FLOOR, 1, 'friend'],
        ],
      },
      {
        cast: 'stars',
        keys: [
          [0, 210, STAGE_FLOOR - 14, 1, 'hidden'],
          [260, 210, STAGE_FLOOR - 14, 1, 'run'],
          [340, 210, STAGE_FLOOR - 14, 1, 'hidden'],
        ],
      },
    ],
    captions: [
      { from: 40, to: 120, text: 'UH OH...' },
      { from: 200, to: 300, text: 'WHOOPS!' },
      { from: 340, to: 420, text: 'NO HARM DONE!' },
    ],
  },
]

/** The six story breaks after Spilled Oil, and the two endings. */
const MORE_SCENES: readonly Scene[] = [
  {
    id: 'charging-party',
    title: 'CHARGING PARTY',
    ticks: 360,
    actors: [
      {
        cast: 'cake',
        keys: [
          [0, 161, F - 4, 1, 'hidden'],
          [60, 161, F - 4, 1, 'run'],
        ],
      },
      hops('chaser', 100, 30, 360, 1),
      hops('ambusher', 125, 45, 360, 1),
      hops('flanker', 200, 60, 360, -1),
      hops('wanderer', 225, 75, 360, -1),
      {
        cast: 'robot',
        keys: [
          [0, -20, F, 1],
          [120, 150, F, 1],
          [200, 150, F - 10, 1],
          [215, 150, F, 1],
          [360, 150, F, 1],
        ],
      },
    ],
    captions: [
      { from: 120, to: 240, text: 'SURPRISE!' },
      { from: 240, to: 360, text: 'HAPPY CHARGE DAY!' },
    ],
  },
  {
    id: 'snow-day',
    title: 'SNOW DAY',
    ticks: 380,
    actors: [
      { cast: 'snow', keys: [[0, 0, 0, 1]] },
      {
        cast: 'robot',
        keys: [
          [0, -20, F, 1],
          [150, 260, F, 1],
          [190, 300, F, 1],
          [230, 300, F, -1],
          [380, 300, F, -1],
        ],
      },
      {
        cast: 'snowball',
        keys: [
          [0, -60, F, 1, 'hidden'],
          [30, -40, F, 1, 'run'],
          [150, 150, F - 6, 1, 'run', 2],
          [200, 200, F - 13, 1, 'dizzy', 3],
          [380, 200, F - 13, 1, 'friend', 3],
        ],
      },
      {
        cast: 'chaser',
        keys: [
          [0, 190, F, -1, 'run'],
          [190, 190, F, -1, 'dizzy'],
          [260, 190, F, -1, 'friend'],
        ],
      },
    ],
    captions: [
      { from: 40, to: 150, text: 'IT IS GETTING BIGGER...' },
      { from: 200, to: 380, text: 'A SNOW-GREMLIN!' },
    ],
  },
  {
    id: 'lights-out',
    title: 'LIGHTS OUT',
    ticks: 360,
    actors: [
      {
        cast: 'robot',
        keys: [
          [0, -20, F, 1],
          [150, 161, F, 1],
          [360, 161, F, 1],
        ],
      },
      hops('static', 60, 210, 360, 1),
      hops('gatekeeper', 100, 210, 360, 1),
      hops('chaser', 225, 210, 360, -1),
      hops('wanderer', 265, 210, 360, -1),
      {
        cast: 'dark',
        keys: [
          [0, 0, 0, 1, 'run'],
          [210, 0, 0, 1, 'hidden'],
        ],
      },
    ],
    captions: [
      { from: 40, to: 200, text: 'WHO TURNED OFF THE LIGHTS?' },
      { from: 210, to: 360, text: 'SURPRISE!' },
    ],
  },
  {
    id: 'sunrise',
    title: 'SUNRISE',
    ticks: 360,
    sky: 'dawn',
    actors: [
      {
        cast: 'sun',
        keys: [
          [0, 161, F + 20, 1],
          [300, 161, F - 70, 1],
        ],
      },
      hops('twin', 120, 0, 360, 1),
      hops('twin', 202, 0, 360, -1),
      {
        cast: 'robot',
        keys: [
          [0, 161, F, 1],
          [360, 161, F, 1],
        ],
      },
    ],
    captions: [
      { from: 60, to: 200, text: 'THE PANELS DRINK THE SUN' },
      { from: 200, to: 360, text: 'ONE LAST CHARGE TO GO' },
    ],
  },
  {
    id: 'ending',
    title: 'THE GRID IS CHARGED',
    ticks: 60 * 18,
    actors: [
      {
        cast: 'robot',
        keys: [
          [0, -20, F, 1],
          [150, 161, F, 1],
          [60 * 18, 161, F, 1],
        ],
      },
      hops('chaser', 40, 120, 60 * 18, 1),
      hops('ambusher', 64, 140, 60 * 18, 1),
      hops('flanker', 88, 160, 60 * 18, 1),
      hops('wanderer', 112, 180, 60 * 18, 1),
      hops('sprinter', 210, 200, 60 * 18, -1),
      hops('snacker', 234, 220, 60 * 18, -1),
      hops('copycat', 258, 240, 60 * 18, -1),
      hops('bramble', 282, 260, 60 * 18, -1),
    ],
    captions: [{ from: 150, to: 330, text: 'THE GRID HUMS BACK TO LIFE!' }],
    credits: {
      from: 330,
      lines: [
        'BATTERY MAZE',
        'THE CHARGING NETWORK',
        '',
        'ZIP  SNAG  FUSE  DOZY',
        'DASH  MUNCH  COPY  BRIAR',
        'BLINK  FLURRY  CRACKLE  BOLT',
        'PIP AND POP',
        '',
        'GREMLIN MAMA',
        'THE GLITCH TRAIN',
        'THE OVERLOAD',
        '',
        'REBOOTED FOR GOOD',
        'THANKS FOR PLAYING!',
        '',
        'OVERCLOCKED UNLOCKED',
      ],
    },
  },
  {
    id: 'true-ending',
    title: 'THE BATTERY GARDEN',
    ticks: 60 * 14,
    sky: 'dawn',
    actors: [
      {
        cast: 'flowers',
        keys: [
          [0, 161, F + 4, 1, 'hidden'],
          [120, 161, F + 4, 1, 'run', 1],
          [480, 161, F + 4, 1, 'run', 8],
        ],
      },
      hops('blinker', 60, 60, 60 * 14, 1),
      hops('snowball', 84, 80, 60 * 14, 1),
      hops('static', 108, 100, 60 * 14, 1),
      hops('gatekeeper', 214, 120, 60 * 14, -1),
      hops('twin', 238, 140, 60 * 14, -1),
      hops('twin', 262, 160, 60 * 14, -1),
      {
        cast: 'mama',
        keys: [
          [0, 380, F - 14, -1, 'hidden'],
          [200, 360, F - 14, -1, 'friend'],
          [400, 290, F - 14, -1, 'friend'],
        ],
      },
      {
        cast: 'robot',
        keys: [
          [0, 161, F, 1],
          [60 * 14, 161, F, 1],
        ],
      },
    ],
    captions: [
      { from: 60, to: 300, text: 'THE GREMLINS PLANT A GARDEN' },
      { from: 300, to: 560, text: 'OF GLOWING FLOWERS ON THE ROOF' },
      { from: 560, to: 60 * 14, text: 'THE END' },
    ],
  },
]

export const ALL_SCENES: readonly Scene[] = [...SCENES, ...MORE_SCENES]

export function sceneById(id: string): Scene {
  return ALL_SCENES.find((s) => s.id === id) ?? ALL_SCENES[0]!
}

/** Where an actor is at `tick`: between its keys, with the last key's facing, pose and scale. */
export function actorAt(
  actor: Actor,
  tick: number,
): { x: number; y: number; face: -1 | 1; pose: Pose; scale: number } {
  const keys = actor.keys
  let i = 0
  while (i + 1 < keys.length && keys[i + 1]![0] <= tick) i++
  const a = keys[i]!
  const b = keys[i + 1]
  const pose = a[4] ?? 'run'
  const scale = a[5] ?? 1
  if (!b || tick <= a[0]) return { x: a[1], y: a[2], face: a[3], pose, scale }
  const p = Math.min(1, (tick - a[0]) / (b[0] - a[0]))
  return {
    x: a[1] + (b[1] - a[1]) * p,
    y: a[2] + (b[2] - a[2]) * p,
    face: a[3],
    pose,
    scale,
  }
}
