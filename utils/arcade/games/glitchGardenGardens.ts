// /utils/arcade/games/glitchGardenGardens.ts
//
// Glitch Garden's gardens as data (conductor kr-arcade/t-088, depth slice 1). A garden is an
// authored lamp layout (with its sprinkler cans) and a run of waves; a wave says how the worm comes
// (body length, loose heads, speed), which other foes join it, how many fresh cans are planted and,
// on a special wave, the objective. The update loop reads these and never branches on a wave
// number. Past a garden's authored waves the last one is remixed: one more head and one fewer body
// segment each wave (the classic's rule), a hungrier beetle, and a fresh can every other wave.

/** Layout letters: a mushroom lamp and a sprinkler can; anything else is open lawn. */
export const LAYOUT_LAMP = 'o'
export const LAYOUT_CAN = 'C'

export type GardenObjective = {
  /** Bloom at least one flower in each marked lane (column) before the wave is fixed. */
  kind: 'bloom-lanes'
  title: string
  hint: string
  lanes: readonly number[]
  bonus: number
}

export type GardenWave = {
  /** Segments in the main glitch-worm, head included. */
  segments: number
  /** Loose one-segment heads that come with it. */
  heads: number
  /** Pixels per tick (1, 1.5 or 2, so the spacing stays whole). */
  speed: number
  /** Ticks between beetle runs, or null for none this wave. */
  beetleEvery: number | null
  moth: boolean
  snail: boolean
  /** Fresh sprinkler cans planted near the top as the wave starts. */
  cans: number
  sub: string
  objective?: GardenObjective
}

export type Garden = {
  id: string
  name: string
  season: 'spring' | 'summer' | 'autumn' | 'winter' | 'midnight'
  /** One string per row, one letter per cell (30 x 36). */
  layout: readonly string[]
  waves: readonly GardenWave[]
}

export const MAX_HEADS = 6
export const MIN_BODY = 6
export const MIN_BEETLE_EVERY = 360

/**
 * Spring 1, the Kitchen Plot: the old lawn, planted in tidy staggered rows with open lanes
 * between them, three sprinkler cans in the middle beds, and the flowerbed left clear.
 */
export const KITCHEN_PLOT: Garden = {
  id: 'kitchen-plot',
  name: 'KITCHEN PLOT',
  season: 'spring',
  layout: [
    '..............................',
    '..............................',
    '...o.......o......o.......o...',
    '..............................',
    '.......o.......o......o.......',
    '..............................',
    '.o.........o.......o........o.',
    '..............................',
    '.....o........o.........o.....',
    '..............................',
    '...o.....o........o.......o...',
    '..............................',
    '........C....o.......o........',
    '..............................',
    '.o.........o.....o.........o..',
    '..............C...............',
    '.....o.................o......',
    '..............................',
    '...o..........o.....o.....o...',
    '.........................C....',
    '........o........o............',
    '..............................',
    '............o.................',
    '..............................',
    '....o.........................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
    '..............................',
  ],
  waves: [
    {
      segments: 12,
      heads: 0,
      speed: 1,
      beetleEvery: null,
      moth: false,
      snail: false,
      cans: 0,
      sub: 'FIX THE GLITCH-WORM',
    },
    {
      segments: 12,
      heads: 0,
      speed: 1.5,
      beetleEvery: 900,
      moth: true,
      snail: false,
      cans: 1,
      sub: 'SPRAY A CAN: SPLASH!',
    },
    {
      segments: 11,
      heads: 1,
      speed: 1.5,
      beetleEvery: 810,
      moth: true,
      snail: true,
      cans: 1,
      sub: 'FIRST BLOOM',
      objective: {
        kind: 'bloom-lanes',
        title: 'FIRST BLOOM!',
        hint: 'BLOOM A FLOWER IN EACH LANE',
        lanes: [3, 11, 18, 26],
        bonus: 2500,
      },
    },
    {
      segments: 10,
      heads: 2,
      speed: 2,
      beetleEvery: 720,
      moth: true,
      snail: true,
      cans: 1,
      sub: 'MIND THE SLIME SNAIL',
    },
    {
      segments: 9,
      heads: 3,
      speed: 2,
      beetleEvery: 630,
      moth: true,
      snail: true,
      cans: 1,
      sub: 'THE WHOLE PLOT AT ONCE',
    },
  ],
}

export const GARDENS: readonly Garden[] = [KITCHEN_PLOT]

/** The wave's plan: authored, or past the end a remix of the garden's last wave. */
export function gardenWave(garden: Garden, wave: number): GardenWave {
  const n = Math.max(1, Math.floor(wave))
  const authored = garden.waves[n - 1]
  if (authored) return authored
  const last = garden.waves[garden.waves.length - 1]!
  const extra = n - garden.waves.length
  const heads = Math.min(MAX_HEADS, last.heads + extra)
  return {
    segments: Math.max(MIN_BODY, last.segments - (heads - last.heads)),
    heads,
    speed: last.speed,
    beetleEvery: Math.max(
      MIN_BEETLE_EVERY,
      (last.beetleEvery ?? 900) - 45 * extra,
    ),
    moth: true,
    snail: true,
    cans: extra % 2 === 1 ? 1 : 0,
    sub: 'REMIX: EVERYTHING SO FAR',
  }
}

/** Every cell of the layout holding `letter`, as [col, row]. */
export function layoutCells(
  garden: Garden,
  letter: string,
): Array<[number, number]> {
  const cells: Array<[number, number]> = []
  garden.layout.forEach((row, r) => {
    for (let c = 0; c < row.length; c++)
      if (row[c] === letter) cells.push([c, r])
  })
  return cells
}
