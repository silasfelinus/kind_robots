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

/** Who is on stage: the robot, a gremlin of some kind, or a prop. */
export type Cast =
  | 'robot'
  | 'chaser'
  | 'ambusher'
  | 'flanker'
  | 'wanderer'
  | 'oil-can'
  | 'puddle'
  | 'stars'

/** How an actor looks from a key on: a gremlin's 'sleepy', 'dizzy' or 'friend'; 'hidden' leaves. */
export type Pose = 'run' | 'sleepy' | 'dizzy' | 'friend' | 'hidden'

/** [tick, x, y, facing (-1 left, 1 right), pose, scale] -- position in stage pixels. */
export type Key = readonly [number, number, number, -1 | 1, Pose?, number?]

export type Actor = { cast: Cast; keys: readonly Key[] }

export type Caption = { from: number; to: number; text: string }

export type Scene = {
  id: string
  title: string
  ticks: number
  actors: readonly Actor[]
  captions: readonly Caption[]
}

/** The floor line actors walk along (stage pixels). */
export const STAGE_FLOOR = 157

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

export function sceneById(id: string): Scene {
  return SCENES.find((s) => s.id === id) ?? SCENES[0]!
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
