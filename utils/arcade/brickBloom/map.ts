// /utils/arcade/brickBloom/map.ts
//
// Brick Bloom's house map screen and title cards (conductor kr-arcade/t-079, depth-pass CABINETS.md
// section 11, slice 2): each glasshouse's nine walls laid out as the branching vent map the player
// climbs, from the first wall at the bottom to the boss at the top. Pure layout; the cabinet draws.

import { houseWall } from './houses'
import type { House } from './houses'

export type MapNode = {
  id: string
  name: string
  /** Tier 0 is the first wall; the boss sits one tier above the last walls. */
  tier: number
  x: number
  y: number
}
export type MapEdge = {
  from: string
  to: string
  /** The right vent: usually the rich route. */
  rich: boolean
}
export type HouseMap = {
  nodes: MapNode[]
  edges: MapEdge[]
  boss: { x: number; y: number }
}

/**
 * Lay the house out in tiers by vent distance from its first wall, spread across `width` and
 * climbing from `bottom` to `top`.
 */
export function houseMap(
  h: House,
  width: number,
  top: number,
  bottom: number,
): HouseMap {
  const tierOf = new Map<string, number>([[h.start, 0]])
  const queue = [h.start]
  while (queue.length) {
    const id = queue.shift()!
    const w = houseWall(h, id)
    if (!w || w.vents === 'boss') continue
    for (const next of w.vents) {
      if (tierOf.has(next)) continue
      tierOf.set(next, tierOf.get(id)! + 1)
      queue.push(next)
    }
  }
  const tiers = Math.max(...tierOf.values()) + 2
  const step = (bottom - top) / (tiers - 1)
  const nodes: MapNode[] = []
  for (let t = 0; t < tiers - 1; t++) {
    const row = h.walls.filter((w) => tierOf.get(w.id) === t)
    row.forEach((w, i) => {
      nodes.push({
        id: w.id,
        name: w.name,
        tier: t,
        x: Math.round((width * (i + 1)) / (row.length + 1)),
        y: Math.round(bottom - t * step),
      })
    })
  }
  const edges: MapEdge[] = []
  for (const w of h.walls)
    if (w.vents !== 'boss')
      w.vents.forEach((to, side) =>
        edges.push({ from: w.id, to, rich: side === 1 }),
      )
  return { nodes, edges, boss: { x: Math.round(width / 2), y: top } }
}

/** The vents of the rich route: the right vent out of every wall. */
export function richRoute(h: House): string[] {
  const route: string[] = [h.start]
  let w = houseWall(h, h.start)
  while (w && w.vents !== 'boss') {
    route.push(w.vents[1])
    w = houseWall(h, w.vents[1])
  }
  return route
}

/** Each glasshouse's title card: its time of day, its pests and the seed it shows off. */
export const HOUSE_CARDS: Readonly<
  Record<string, { tagline: string; pests: string; seed: string }>
> = {
  seedling: {
    tagline: 'GLASSHOUSE 1 - DAWN',
    pests: 'GLOOM PUFFS AND POLLEN MITES',
    seed: 'R RAIN SPRAY',
  },
  'vine-hall': {
    tagline: 'GLASSHOUSE 2 - MORNING',
    pests: 'SNAIL BOTS AND LADYBOT RINGS',
    seed: 'T THORN BALL',
  },
  'cactus-dome': {
    tagline: 'GLASSHOUSE 3 - HIGH NOON',
    pests: 'TUMBLEWEEDS AND SHELL BEETLES',
    seed: 'V VENT',
  },
  'lily-pond': {
    tagline: 'GLASSHOUSE 4 - AFTERNOON RAIN',
    pests: 'FROG BOTS AND MIRROR BUGS',
    seed: 'D DUO PADDLE',
  },
  moonflower: {
    tagline: 'SECRET GLASSHOUSE - MOONLIGHT',
    pests: 'REMIXED GARDEN BOTS',
    seed: 'ALL TEN SEEDS',
  },
  'night-bloom': {
    tagline: 'GLASSHOUSE 5 - MIDNIGHT',
    pests: 'GLOOM PUFFS AND SHADOWS',
    seed: 'Q QUEENS COMPASS',
  },
}
