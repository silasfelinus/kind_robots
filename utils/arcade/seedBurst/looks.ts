// /utils/arcade/seedBurst/looks.ts
//
// Each season's tile set (conductor kr-arcade/t-137, depth-pass CABINETS.md section 24): its
// ground, its pillars, its garden wall and the backdrop details painted into the cached field.
//
//   Spring, the Kitchen Allotment: mown grass in stripes, mossy stone pillars, an old red-brick
//     kitchen-garden wall, and little cabbages, carrot tops and seed-row labels between the beds.
//   Summer, the Glasshouse Rows: warm terracotta tiles with grass between, white iron columns
//     with glass caps, a glasshouse wall of white frames and sky-blue panes, potted plants and
//     sunlight falling through the roof.
//
// Painting only (no game state); everything random comes from `rand`, a cosmetic backdrop rng.

import { INK, RAMPS, bandedGradient, bevel, rgba } from '../snes'
import type { Ramp } from '../snes'
import type { SeasonId } from './plots'

const TILE = 16

export type SeasonLook = {
  /** Ground colours, darkest first. */
  ground: Ramp
  /** The little flowers dotted in the ground. */
  flowers: readonly string[]
  /** The season's title-card sky, top to bottom. */
  sky: readonly string[]
  /** The title card's accent. */
  accent: Ramp
}

const STONE: Ramp = ['#1e1a30', '#3c3852', '#6a6884', '#a4a2bc', '#e2e0f0']
const TERRACOTTA: Ramp = ['#4a2414', '#7a3e22', '#a85a34', '#cf8150', '#f2b88a']
const GLASS: Ramp = ['#173a5a', '#2c6a96', '#6fb4dc', '#b8e4f8', '#f0fbff']

export const SEASON_LOOKS: Record<SeasonId, SeasonLook> = {
  spring: {
    ground: ['#173f22', '#24602e', '#3a8a3c', '#5aac4c', '#94d470'],
    flowers: [RAMPS.pink[3], '#ffffff', RAMPS.gold[3]],
    sky: ['#9be3ff', '#c8f0ff', '#f0ffe8'],
    accent: RAMPS.leaf,
  },
  summer: {
    ground: TERRACOTTA,
    flowers: [RAMPS.gold[3], RAMPS.pink[3], '#ffffff'],
    sky: ['#ffd27a', '#ffe9b0', '#fff8e0'],
    accent: RAMPS.gold,
  },
}

/** One tile of ground, with the season's backdrop details. */
export function paintGround(
  k: CanvasRenderingContext2D,
  season: SeasonId,
  px: number,
  py: number,
  x: number,
  y: number,
  rand: () => number,
) {
  const look = SEASON_LOOKS[season]
  const g = look.ground
  const dark = (x + y) % 2 === 1
  if (season === 'summer') {
    // Terracotta tiles with grout lines and a few tufts of grass between them.
    bandedGradient(
      k,
      px,
      py,
      TILE,
      TILE,
      dark ? [g[2], g[2], g[1]] : [g[3], g[2], g[2]],
      3,
    )
    k.fillStyle = g[1]
    k.fillRect(px, py + TILE - 1, TILE, 1)
    k.fillRect(px + TILE - 1, py, 1, TILE)
    k.fillStyle = rgba(g[4], 0.6)
    k.fillRect(px + 1, py + 1, TILE - 3, 1)
    if (rand() < 0.35) {
      k.fillStyle = RAMPS.leaf[3]
      const tx = px + 1 + Math.floor(rand() * (TILE - 4))
      k.fillRect(tx, py + TILE - 3, 1, 2)
      k.fillRect(tx + 2, py + TILE - 4, 1, 3)
    }
    if (rand() < 0.08) {
      // A little potted plant on the tile.
      const cx = px + 4 + Math.floor(rand() * 8)
      const cy = py + 9
      bevel(k, cx - 2, cy, 5, 4, TERRACOTTA, { depth: 1 })
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(cx - 2, cy - 3, 2, 2)
      k.fillRect(cx + 1, cy - 4, 2, 3)
      k.fillStyle = RAMPS.leaf[2]
      k.fillRect(cx, cy - 2, 1, 2)
    }
    // Sunlight falling through the glass roof in long diagonal streaks.
    if ((x * 3 + y * 5) % 7 === 0) {
      k.fillStyle = rgba('#fff4c8', 0.12)
      k.fillRect(px, py, TILE, TILE)
    }
    return
  }
  bandedGradient(
    k,
    px,
    py,
    TILE,
    TILE,
    dark ? [g[2], g[1], g[1], g[0]] : [g[3], g[2], g[2], g[1]],
    4,
  )
  k.fillStyle = dark ? g[2] : g[3]
  k.fillRect(px, py, TILE, 1)
  for (let i = 0; i < 3; i++) {
    const tx = px + 2 + Math.floor(rand() * (TILE - 4))
    const ty = py + 3 + Math.floor(rand() * (TILE - 6))
    k.fillStyle = g[4]
    k.fillRect(tx, ty, 1, 2)
    k.fillStyle = dark ? g[3] : g[4]
    k.fillRect(tx - 1, ty + 1, 1, 1)
    k.fillRect(tx + 1, ty + 1, 1, 1)
  }
  const roll = rand()
  if (roll < 0.06) {
    // A little cabbage.
    const cx = px + 5 + Math.floor(rand() * 6)
    const cy = py + 6 + Math.floor(rand() * 5)
    k.fillStyle = RAMPS.leaf[1]
    k.fillRect(cx - 2, cy - 1, 5, 3)
    k.fillStyle = RAMPS.leaf[3]
    k.fillRect(cx - 1, cy - 2, 3, 3)
    k.fillStyle = RAMPS.leaf[4]
    k.fillRect(cx, cy - 1, 1, 1)
  } else if (roll < 0.11) {
    // Carrot tops in a row.
    const cy = py + 8
    for (let i = 0; i < 3; i++) {
      const cx = px + 3 + i * 4
      k.fillStyle = RAMPS.rust[3]
      k.fillRect(cx, cy + 2, 2, 1)
      k.fillStyle = RAMPS.leaf[3]
      k.fillRect(cx - 1, cy, 1, 2)
      k.fillRect(cx + 1, cy - 1, 1, 3)
      k.fillRect(cx + 2, cy, 1, 2)
    }
  } else if (roll < 0.13) {
    // A seed-row label on a stick.
    const cx = px + 6 + Math.floor(rand() * 4)
    k.fillStyle = RAMPS.earth[2]
    k.fillRect(cx + 1, py + 8, 1, 5)
    k.fillStyle = RAMPS.cream[4]
    k.fillRect(cx - 1, py + 5, 5, 3)
    k.fillStyle = RAMPS.earth[1]
    k.fillRect(cx, py + 6, 3, 1)
  } else if (roll < 0.3) {
    const fx = px + 3 + Math.floor(rand() * (TILE - 6))
    const fy = py + 3 + Math.floor(rand() * (TILE - 6))
    k.fillStyle = look.flowers[Math.floor(rand() * look.flowers.length)]!
    k.fillRect(fx - 1, fy, 3, 1)
    k.fillRect(fx, fy - 1, 1, 3)
    k.fillStyle = RAMPS.gold[4]
    k.fillRect(fx, fy, 1, 1)
  }
}

/** A pillar inside the garden. */
export function paintPillar(
  k: CanvasRenderingContext2D,
  season: SeasonId,
  px: number,
  py: number,
) {
  k.fillStyle = INK
  k.fillRect(px, py, TILE, TILE)
  if (season === 'summer') {
    // A white iron column with a glass cap catching the light.
    k.fillStyle = RAMPS.steel[2]
    k.fillRect(px + 4, py + 6, 8, 9)
    k.fillStyle = RAMPS.steel[4]
    k.fillRect(px + 5, py + 6, 2, 9)
    k.fillStyle = RAMPS.steel[1]
    k.fillRect(px + 10, py + 6, 2, 9)
    bevel(k, px + 1, py + 1, TILE - 2, 6, GLASS, { depth: 1, outline: null })
    k.fillStyle = '#ffffff'
    k.fillRect(px + 3, py + 2, 4, 1)
    return
  }
  k.fillStyle = STONE[1]
  k.fillRect(px + 1, py + 11, TILE - 2, 4)
  k.fillStyle = STONE[0]
  k.fillRect(px + 1, py + 14, TILE - 2, 1)
  k.fillRect(px + 5, py + 11, 1, 3)
  k.fillRect(px + 10, py + 11, 1, 3)
  bevel(k, px + 1, py + 1, TILE - 2, 10, STONE, { depth: 2, outline: null })
  k.fillStyle = STONE[3]
  k.fillRect(px + 4, py + 4, 3, 1)
  k.fillStyle = STONE[1]
  k.fillRect(px + 9, py + 6, 3, 1)
  k.fillRect(px + 11, py + 5, 1, 1)
  k.fillStyle = RAMPS.leaf[2]
  k.fillRect(px + 1, py + 1, 3, 1)
  k.fillRect(px + 1, py + 2, 1, 2)
  k.fillStyle = RAMPS.leaf[3]
  k.fillRect(px + 2, py + 1, 1, 1)
}

/** A tile of the garden wall. */
export function paintWall(
  k: CanvasRenderingContext2D,
  season: SeasonId,
  px: number,
  py: number,
  row: number,
) {
  if (season === 'summer') {
    // White glasshouse frames round sky-blue panes.
    k.fillStyle = RAMPS.steel[3]
    k.fillRect(px, py, TILE, TILE)
    k.fillStyle = GLASS[2]
    k.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
    k.fillStyle = GLASS[3]
    k.fillRect(px + 2, py + 2, TILE - 4, 3)
    k.fillStyle = rgba('#ffffff', 0.7)
    k.fillRect(px + 4, py + 6, 1, 4)
    k.fillRect(px + 5, py + 5, 1, 2)
    k.fillStyle = RAMPS.steel[4]
    k.fillRect(px, py, TILE, 1)
    k.fillStyle = RAMPS.steel[1]
    k.fillRect(px, py + TILE - 1, TILE, 1)
    return
  }
  const ramp = season === 'spring' ? RAMPS.rust : RAMPS.earth
  k.fillStyle = ramp[0]
  k.fillRect(px, py, TILE, TILE)
  for (let r = 0; r < 4; r++) {
    const shift = (r + row) % 2 ? 4 : 0
    for (let c = -1; c < 2; c++) {
      const bx = px + c * 8 + shift
      const left = Math.max(px, bx)
      const right = Math.min(px + TILE, bx + 8)
      if (right - left < 2) continue
      bevel(k, left, py + r * 4, right - left - 1, 3, ramp, {
        depth: 1,
        outline: null,
      })
    }
  }
  k.fillStyle = rgba(RAMPS.leaf[2], 0.8)
  if ((px / TILE + row) % 3 === 0) {
    k.fillRect(px + 3, py, 3, 1)
    k.fillRect(px + 4, py + 1, 1, 2)
  }
}
