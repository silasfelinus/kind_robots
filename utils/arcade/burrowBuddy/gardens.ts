// /utils/arcade/burrowBuddy/gardens.ts
//
// Burrow Buddy's gardens as data (conductor kr-arcade/t-106, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 17, "The Year Under the Garden"). A garden is a
// plan: where the tunnels, stones, cracked stones, turnips and slump blocks sit, which grumps start
// in which burrows, the objective and a par time. The first gardens are authored as ASCII; past them
// the endless loop rolls a plan of the same shape from the seeded rng, so every garden runs through
// one loader.
//
// Legend (13 rows of 16, the field's rows 1 to 13; row 0 is the lawn and always open):
//   '.' soil                 '#' tunnel               '@' where Buddy starts (a tunnel)
//   'S' a stone: it can't be dug, and only a slump can move it
//   'C' a cracked stone: push into it to crack it open for a bubble tool (`tools`, in reading order)
//   'T' a turnip in the soil
//   '1'..'9' the cells of slump block 1..9: cut a block free on both sides and undercut it, and it
//       slides down as one piece. `carried` puts a turnip or stone inside a block.
//   'g' grub   'b' beetle   'p' pill bug   'c' mole cricket   'm' mimic turnip (each in a tunnel)

import { levelCurve } from '../curve'

export const COLS = 16
export const ROWS = 14

export type Cell = { x: number; y: number }

export const GRUMP_KINDS = [
  'grub',
  'beetle',
  'pillbug',
  'cricket',
  'mimic',
] as const
export type GrumpKind = (typeof GRUMP_KINDS)[number]

export const TOOL_KINDS = [
  'wide',
  'long',
  'quick',
  'drill',
  'headlamp',
  'sprinkler',
] as const
export type ToolKind = (typeof TOOL_KINDS)[number]

/** Slice 1 runs today's rule; the Seasons add Plant the Seeds, Keepsakes and the rest. */
export type GardenObjective = 'puff-them-all'

export type Burrow = { at: Cell; kind: GrumpKind; across: boolean }

export type GardenPlan = {
  id: string
  name: string
  start: Cell
  tunnels: Cell[]
  stones: Cell[]
  cracked: { at: Cell; tool: ToolKind }[]
  turnips: Cell[]
  slumps: Cell[][]
  burrows: Burrow[]
  objective: GardenObjective
  /** Seconds a tidy dig takes. */
  par: number
  /** Ticks before the last grump left runs for the surface. */
  escapeAfter: number
}

export type GardenLayout = {
  id: string
  name: string
  rows: readonly string[]
  tools?: readonly ToolKind[]
  carried?: readonly { x: number; y: number; item: 'turnip' | 'stone' }[]
  par: number
  escapeAfter?: number
}

export const ESCAPE_AFTER = 300

export const BURROW_CURVES = {
  grubs: { start: 3, step: 1, limit: 5 },
  /** First beetle in garden 2 (the blurb's promise), then one more every two gardens. */
  beetles: { start: 0.5, step: 0.5, limit: 3 },
  pillbugs: { start: 0, step: 0.25, limit: 2 },
  crickets: { start: 0.2, step: 0.2, limit: 1 },
  mimics: { start: 0, step: 0.25, limit: 1 },
  /** Enemy speed in tiles per tick. */
  speed: { start: 1 / 22, step: 1 / 300, limit: 1 / 12 },
  /** Ticks before a grub gets bored and ghosts through the soil. */
  ghostEvery: { start: 520, step: -40, limit: 220 },
  turnips: { start: 3, step: 0.34, limit: 5 },
  stones: { start: 1, step: 0.34, limit: 5 },
  cracked: { start: 1, step: 0.125, limit: 2 },
  slumps: { start: 1, step: 0.25, limit: 3 },
} as const

const GRUMP_LETTERS: Record<string, GrumpKind> = {
  g: 'grub',
  b: 'beetle',
  p: 'pillbug',
  c: 'cricket',
  m: 'mimic',
}

export const cellKey = (x: number, y: number) => y * COLS + x

export function parseGarden(layout: GardenLayout): GardenPlan {
  if (layout.rows.length !== ROWS - 1)
    throw new Error(`${layout.id}: a garden has ${ROWS - 1} rows`)
  const plan: GardenPlan = {
    id: layout.id,
    name: layout.name,
    start: { x: -1, y: -1 },
    tunnels: [],
    stones: [],
    cracked: [],
    turnips: [],
    slumps: [],
    burrows: [],
    objective: 'puff-them-all',
    par: layout.par,
    escapeAfter: layout.escapeAfter ?? ESCAPE_AFTER,
  }
  const blocks = new Map<string, Cell[]>()
  const tools = [...(layout.tools ?? [])]
  const dug = new Set<number>()
  layout.rows.forEach((row, i) => {
    if (row.length !== COLS)
      throw new Error(`${layout.id}: row ${i + 1} is not ${COLS} wide`)
    const y = i + 1
    for (let x = 0; x < COLS; x++) {
      const ch = row[x]!
      const at = { x, y }
      if (ch === '.') continue
      if (ch === '#' || ch === '@' || GRUMP_LETTERS[ch]) {
        plan.tunnels.push(at)
        dug.add(cellKey(x, y))
        if (ch === '@') plan.start = at
      } else if (ch === 'S') plan.stones.push(at)
      else if (ch === 'C') {
        const tool = tools.shift()
        if (!tool) throw new Error(`${layout.id}: a cracked stone needs a tool`)
        plan.cracked.push({ at, tool })
      } else if (ch === 'T') plan.turnips.push(at)
      else if (ch >= '1' && ch <= '9') {
        const cells = blocks.get(ch) ?? []
        cells.push(at)
        blocks.set(ch, cells)
      } else throw new Error(`${layout.id}: unknown cell '${ch}'`)
    }
  })
  layout.rows.forEach((row, i) => {
    for (let x = 0; x < COLS; x++) {
      const kind = GRUMP_LETTERS[row[x]!]
      if (!kind) continue
      const y = i + 1
      const across = dug.has(cellKey(x - 1, y)) || dug.has(cellKey(x + 1, y))
      plan.burrows.push({ at: { x, y }, kind, across })
    }
  })
  if (plan.start.x < 0) throw new Error(`${layout.id}: no start`)
  plan.slumps = [...blocks.keys()].sort().map((k) => blocks.get(k)!)
  for (const item of layout.carried ?? []) {
    const inBlock = plan.slumps.some((cells) =>
      cells.some((c) => c.x === item.x && c.y === item.y),
    )
    if (!inBlock)
      throw new Error(`${layout.id}: a carried ${item.item} sits in a block`)
    const at = { x: item.x, y: item.y }
    if (item.item === 'turnip') plan.turnips.push(at)
    else plan.stones.push(at)
  }
  return plan
}

/** The opening gardens, each teaching one new thing. */
export const GARDEN_LAYOUTS: readonly GardenLayout[] = [
  {
    id: 'first-dig',
    name: 'THE FIRST DIG',
    par: 60,
    rows: [
      '.......#........',
      '.......#........',
      '..T....#....T...',
      '.......#........',
      '..111..#........',
      '..111..@........',
      '.g###...........',
      '................',
      '..........#g#...',
      '....T...........',
      '.............#..',
      '.............g..',
      '.............#..',
    ],
  },
  {
    id: 'stone-garden',
    name: 'THE STONE GARDEN',
    par: 75,
    tools: ['long'],
    carried: [
      { x: 11, y: 7, item: 'turnip' },
      { x: 13, y: 7, item: 'stone' },
    ],
    rows: [
      '.......#........',
      '...S...#......#.',
      '.......#...T..g.',
      '..C....#......#.',
      '.......#....S...',
      '.......@........',
      '...........111..',
      '..T........111..',
      '..........#b###.',
      '................',
      '.#g#......S.....',
      '................',
      '......#g#.......',
    ],
  },
  {
    id: 'pill-bug-patch',
    name: 'PILL BUG PATCH',
    par: 90,
    tools: ['wide', 'drill'],
    rows: [
      '.......#........',
      '.......#....T...',
      '...11..#........',
      '...11..#..C.....',
      '...22..#........',
      '...22..@........',
      '.#g##...........',
      '................',
      '.........#p#....',
      '..T...........T.',
      '............C...',
      '..#b#.....S.....',
      '.......#g#......',
    ],
  },
  {
    id: 'crickets-corner',
    name: "CRICKET'S CORNER",
    par: 100,
    tools: ['headlamp', 'sprinkler'],
    rows: [
      '.......#........',
      '.......#........',
      '..T....#...111..',
      '.......#...111..',
      '....C..#..#m##..',
      '.......@........',
      '................',
      '..#g#.....S.....',
      '................',
      '.........C...T..',
      '...S............',
      '.#c#......#b#...',
      '......#g#.......',
    ],
  },
]

export const AUTHORED_GARDENS: readonly GardenPlan[] =
  GARDEN_LAYOUTS.map(parseGarden)

const DEFAULT_START = { x: 7, y: 6 }

/** Past the authored gardens, a plan rolled from the seeded rng in the same shape. */
export function generateGarden(level: number, rng: () => number): GardenPlan {
  const start = DEFAULT_START
  const taken = new Uint8Array(COLS * ROWS)
  const dug = new Uint8Array(COLS * ROWS)
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 1 && x < COLS && y < ROWS
  const isDug = (x: number, y: number) =>
    inside(x, y) && dug[cellKey(x, y)] === 1
  const free = (x: number, y: number) =>
    inside(x, y) && !taken[cellKey(x, y)] && !dug[cellKey(x, y)]
  const nearStart = (x: number, y: number, r: number) =>
    Math.abs(x - start.x) < r && Math.abs(y - start.y) < r
  const tunnels: Cell[] = []
  for (let y = 1; y <= start.y; y++) {
    dug[cellKey(start.x, y)] = 1
    tunnels.push({ x: start.x, y })
  }

  const slumps: Cell[][] = []
  const slumpCount = Math.floor(levelCurve(level, BURROW_CURVES.slumps))
  for (let tries = 0; slumps.length < slumpCount && tries < 200; tries++) {
    const w = 2 + Math.floor(rng() * 2)
    const x0 = 1 + Math.floor(rng() * (COLS - w - 1))
    const y0 = 2 + Math.floor(rng() * (ROWS - 6))
    const cells: Cell[] = []
    for (let y = y0; y < y0 + 2; y++)
      for (let x = x0; x < x0 + w; x++) cells.push({ x, y })
    const clash = cells.some(
      ({ x, y }) =>
        Math.abs(x - start.x) < 2 ||
        [-1, 0, 1].some((dy) =>
          [-1, 0, 1].some(
            (dx) => !free(x + dx, y + dy) && inside(x + dx, y + dy),
          ),
        ),
    )
    if (clash) continue
    for (const c of cells) taken[cellKey(c.x, c.y)] = 1
    slumps.push(cells)
  }

  const burrows: Burrow[] = []
  const place = (kind: GrumpKind) => {
    for (let tries = 0; tries < 200; tries++) {
      const across = rng() < 0.5 || kind === 'beetle'
      const tx = 1 + Math.floor(rng() * (COLS - (across ? 4 : 2)))
      const ty = 3 + Math.floor(rng() * (ROWS - (across ? 4 : 6)))
      const cells: Array<[number, number]> = [0, 1, 2].map((i) =>
        across ? [tx + i, ty] : [tx, ty + i],
      )
      const clash = cells.some(
        ([x, y]) =>
          !free(x, y) ||
          isDug(x, y - 1) ||
          isDug(x, y + 1) ||
          isDug(x - 1, y) ||
          isDug(x + 1, y) ||
          nearStart(x, y, 3),
      )
      if (clash) continue
      for (const [x, y] of cells) {
        dug[cellKey(x, y)] = 1
        tunnels.push({ x, y })
      }
      const [sx, sy] = cells[1]!
      burrows.push({ at: { x: sx, y: sy }, kind, across })
      return
    }
  }
  const count = (curve: { start: number; step: number; limit: number }) =>
    Math.floor(levelCurve(level, curve))
  const pillbugs = count(BURROW_CURVES.pillbugs)
  const crickets = count(BURROW_CURVES.crickets)
  const grubs = Math.max(
    2,
    Math.round(levelCurve(level, BURROW_CURVES.grubs)) - pillbugs - crickets,
  )
  const roster: GrumpKind[] = [
    ...new Array<GrumpKind>(grubs).fill('grub'),
    ...new Array<GrumpKind>(count(BURROW_CURVES.beetles)).fill('beetle'),
    ...new Array<GrumpKind>(pillbugs).fill('pillbug'),
    ...new Array<GrumpKind>(crickets).fill('cricket'),
    ...new Array<GrumpKind>(count(BURROW_CURVES.mimics)).fill('mimic'),
  ]
  for (const kind of roster) place(kind)

  const scatter = (n: number, ok: (x: number, y: number) => boolean) => {
    const out: Cell[] = []
    for (let tries = 0; out.length < n && tries < 200; tries++) {
      const x = 1 + Math.floor(rng() * (COLS - 2))
      const y = 2 + Math.floor(rng() * (ROWS - 5))
      if (!free(x, y) || !ok(x, y) || nearStart(x, y, 2)) continue
      taken[cellKey(x, y)] = 1
      out.push({ x, y })
    }
    return out
  }
  const stones = scatter(
    Math.floor(levelCurve(level, BURROW_CURVES.stones)),
    (x, y) => !isDug(x, y + 1) && !isDug(x, y - 1),
  )
  const cracked = scatter(
    Math.floor(levelCurve(level, BURROW_CURVES.cracked)),
    () => true,
  ).map((at) => ({
    at,
    tool: TOOL_KINDS[Math.floor(rng() * TOOL_KINDS.length)]!,
  }))
  const turnips = scatter(
    Math.round(levelCurve(level, BURROW_CURVES.turnips)),
    (x, y) => !isDug(x, y + 1) && Math.abs(x - start.x) >= 2,
  )

  return {
    id: `garden-${level}`,
    name: `GARDEN ${level}`,
    start: { ...start },
    tunnels,
    stones,
    cracked,
    turnips,
    slumps,
    burrows,
    objective: 'puff-them-all',
    par: 60 + Math.min(60, level * 4),
    escapeAfter: ESCAPE_AFTER,
  }
}

export function gardenFor(level: number, rng: () => number): GardenPlan {
  const authored = AUTHORED_GARDENS[level - 1]
  return authored ? structuredClone(authored) : generateGarden(level, rng)
}
