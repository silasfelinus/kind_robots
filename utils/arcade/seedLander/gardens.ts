// /utils/arcade/seedLander/gardens.ts
//
// Living gardens (conductor kr-arcade/t-070, the Great Replanting's signature): what a seed bed
// grows when it is planted changes the island for the rest of the mission.
//   - a sunflower turns the bed into a refuelling pad;
//   - a beanstalk climbs from the bed to a tall perch, a landing ledge up where the high pads are;
//   - a mushroom turns the bed into a bouncer that boings the pod back up;
//   - a vine climbs a cliff as a ladder of small perches.
// The mission says what each bed will grow (its card and the bed's marker), and the order the
// beds are planted in is the puzzle.

import type { Pad, PlantKind, Terrain } from './terrain'

/** A beanstalk's top perch, up from the bed unless the bed says where. */
export const BEANSTALK = { rise: 72, width: 26 } as const
/** A vine's rungs: small perches up a cliff. */
export const VINE = {
  width: 16,
  rungs: [
    [24, -36],
    [-24, -72],
    [24, -108],
  ],
} as const
/** A mushroom throws the pod back up at least this fast. */
export const BOUNCE = { lift: 1.9, gain: 1.1 } as const

export const PLANT_NAMES: Record<PlantKind, string> = {
  flower: 'FLOWER',
  sunflower: 'SUNFLOWER',
  beanstalk: 'BEANSTALK',
  mushroom: 'MUSHROOM',
  vine: 'VINE',
}

/** A plant growing from a planted bed (art reads it; play reads the pads it made). */
export type Growth = {
  bed: string
  kind: PlantKind
  /** The bed's centre and top when it was planted. */
  x: number
  y: number
  /** Pads the plant made (a beanstalk's top, a vine's rungs). */
  made: string[]
  age: number
}

/** Plant `pad` and let it grow: change the bed's kind, or add the perches it climbs to. */
export function grow(terrain: Terrain, pad: Pad): Growth {
  const x = (pad.x0 + pad.x1) / 2
  const growth: Growth = {
    bed: pad.id,
    kind: pad.grows,
    x,
    y: pad.y,
    made: [],
    age: 0,
  }
  switch (pad.grows) {
    case 'sunflower':
      pad.kind = 'sun'
      break
    case 'mushroom':
      pad.kind = 'bounce'
      break
    case 'beanstalk': {
      const [dx, dy] = pad.reach[0] ?? [0, -BEANSTALK.rise]
      const top = terrain.addPad(
        {
          id: `${pad.id}-top`,
          x: x + dx,
          y: pad.y + dy,
          w: BEANSTALK.width,
          kind: 'perch',
          float: true,
        },
        `${pad.id}-top`,
      )
      growth.made.push(top.id)
      break
    }
    case 'vine': {
      const rungs = pad.reach.length ? pad.reach : VINE.rungs
      rungs.forEach(([dx, dy], i) => {
        const rung = terrain.addPad(
          {
            id: `${pad.id}-rung${i}`,
            x: x + dx,
            y: pad.y + dy,
            w: VINE.width,
            kind: 'perch',
            float: true,
          },
          `${pad.id}-rung${i}`,
        )
        growth.made.push(rung.id)
      })
      break
    }
    case 'flower':
      break
  }
  terrain.version++
  return growth
}

/** The pod's speed off a mushroom: thrown back up, a little harder than it came down. */
export function bounceSpeed(vy: number): number {
  return -Math.max(BOUNCE.lift, Math.abs(vy) * BOUNCE.gain)
}
