// /utils/arcade/kindnessGauntlet/floors.ts
//
// The Deep Archive's authored floors (conductor kr-arcade t-052, depth-pass/CABINETS.md section 5,
// "Structure" and "The wings"). Below the server floors lies the memory of the Old Mainframe; each
// wing is an era of computing with its own tricks, glitches and Guardian. A wing is six floors (the
// fifth ends at a Big Bluescreen), a Lost & Found treasure floor and the Guardian's hall. Every
// floor is data: a map, its generator tiers, its charms and chips, its note (the hinted secret) and a
// par time. The game reads the map's letters; the procedural builder stays for floors past the last
// authored wing (and, in slice 4, for Endless).
//
// Map legend (every map is padded with racks to the 40 x 30 floor):
//   #  server rack            .  floor              @  where the bots start
//   >  stairs down            E  express lift (skips two floors, and their treasure)
//   C  card wall (sparks break it)                ~  static mat (stuns a bot that rolls on)
//   M  mirror rack (sparks bounce off it)         =  sticky tape (slows bots)
//   S  sliding shelf, shut in the first half of its beat;  s  shut in the second half
//   1-4  patch-cable transporter pads (each digit is a pair)
//   D  locked door (adjacent D tiles are one door)    k  key
//   *  snack   h  pulse   $  caged bot   ?  charm   ^  chip   K  keepsake   T  Hug Token
//   !  the floor's hidden secret (picked up, it solves a 'find' secret)
//   B  a Big Bluescreen (the stairs stay sealed until it is fixed)
//   generators: a glitch  b brute  p pop-up  i imp  t pickpocket  l leech  c coffee spill
//               n bug nest  m mimic vending  w worm
//   x  a mimic snack lying among the real ones

import type { GlitchKind, Tier } from './roster'
import type { Ramp } from '../snes'
import { RAMPS } from '../snes'

export const GENERATOR_LETTERS: Record<string, GlitchKind> = {
  a: 'glitch',
  b: 'brute',
  p: 'popup',
  i: 'imp',
  t: 'pickpocket',
  l: 'leech',
  c: 'spill',
  n: 'bug',
  m: 'mimic',
  w: 'worm',
}

export type CharmKind = 'ghost' | 'shell' | 'shoo' | 'hop' | 'mirror' | 'mega'
export type ChipKind = 'power' | 'speed' | 'armor' | 'range' | 'pulse' | 'zap'

/** The charms (timed, 20 seconds), after the classic's amulets. */
export const CHARMS: Record<CharmKind, { name: string; about: string }> = {
  ghost: { name: 'GHOST', about: 'GLITCHES LOSE TRACK OF YOU' },
  shell: { name: 'SHELL', about: 'CLINGING GLITCHES DRAIN NOTHING' },
  shoo: { name: 'SHOO', about: 'GLITCHES FLEE FROM YOU' },
  hop: { name: 'HOP', about: 'ROLL THROUGH ONE RACK' },
  mirror: { name: 'MIRROR', about: 'SPARKS BOUNCE OFF RACKS' },
  mega: { name: 'MEGA', about: 'SPARKS PIERCE EVERYTHING' },
}
export const CHARM_TICKS = 20 * 60

/** The chips: permanent for the run, one bot stat each (up to three of a kind). */
export const CHIPS: Record<ChipKind, { name: string; about: string }> = {
  power: { name: 'POWER CHIP', about: 'SPARKS HIT HARDER' },
  speed: { name: 'SPEED CHIP', about: 'FASTER WHEELS' },
  armor: { name: 'ARMOR CHIP', about: 'GLITCHES DRAIN LESS' },
  range: { name: 'RANGE CHIP', about: 'SPARKS FLY FURTHER' },
  pulse: { name: 'PULSE CHIP', about: 'PULSES JOLT GENERATORS' },
  zap: { name: 'ZAP CHIP', about: 'QUICKER SPARKS' },
}
export const MAX_CHIPS = 3

/** A floor's secret: what its note hints at, and what solving it means. */
export type Secret =
  /** Pick up the hidden '!' (behind cards, through a pad, past a shelf). */
  | { kind: 'find' }
  /** Leave by the express lift. */
  | { kind: 'express' }
  /** Leave by the stairs farther from the start. */
  | { kind: 'far' }
  /** Shut down every generator before leaving. */
  | { kind: 'clean' }
  /** Free every caged bot. */
  | { kind: 'rescue' }
  /** Leave without sparking a single snack. */
  | { kind: 'gentle' }
  /** Overload a generator with the Hug Token. */
  | { kind: 'overload' }
  /** Reach the stairs inside the floor's par time. */
  | { kind: 'swift' }

export type GuardianKind = 'sorter' | 'reels'

export type FloorPlan = {
  name: string
  map: readonly string[]
  /** Generator tiers in reading order (the last repeats; default all 2). */
  tiers?: string
  charms?: readonly CharmKind[]
  chips?: readonly ChipKind[]
  note: string
  secret: Secret
  /** Seconds a good clear takes (the swift secret, and the medal board later). */
  par: number
  /** A Lost & Found floor: keepsakes to grab against a 30-second clock. */
  lost?: boolean
  guardian?: GuardianKind
}

/** A wing's tileset: its racks, its raised floor, and what its rack fronts carry. */
export type Tileset = {
  wall: Ramp
  floor: Ramp
  face: 'cards' | 'reels' | 'bays'
  cable: Ramp
}

export type Wing = {
  id: string
  name: string
  /** The era it remembers, shown on its title card. */
  era: string
  tileset: Tileset
  /** Six floors, the Lost & Found, and the Guardian's hall. */
  floors: readonly FloorPlan[]
}

export const FLOORS_PER_WING = 8
export const LOST_TICKS = 30 * 60

// --- Wing 1: the Punch-Card Vault ----------------------------------------------------------------

const VAULT: Wing = {
  id: 'vault',
  name: 'THE PUNCH-CARD VAULT',
  era: 'BEIGE CABINETS AND CARD FEEDERS',
  tileset: {
    wall: ['#3a2a20', '#7a5c44', '#c9a77f', '#e8d3b0', '#fff5e0'],
    floor: ['#120c0a', '#231914', '#33251d', '#4a372b', '#6b5240'],
    face: 'cards',
    cable: RAMPS.rust,
  },
  floors: [
    {
      name: 'THE INTAKE HALL',
      note: 'SOME WALLS ARE ONLY CARDS',
      secret: { kind: 'find' },
      par: 100,
      tiers: '1121',
      map: [
        '##################################',
        '#.......#..........#.............#',
        '#..@.........a.....#......b....E.#',
        '#..................#.............#',
        '#.......####..######.....~~......#',
        '#...*...................#~~#######',
        '#.......####..######....#........#',
        '####..###.......#.......#..CCCC..#',
        '#.......#...$...#..a....#..C!.C..#',
        '#..b....#.......#.......#..CCCC..#',
        '#.......#.......####..###........#',
        '#.......#........................#',
        '#..h....######..#######..#########',
        '#.......#........................#',
        '#.......#..a.......*.......a.....#',
        '#..........................####>.#',
        '#.......#..........*.......#.....#',
        '##################################',
      ],
    },
    {
      name: 'THE SORTING ROOM',
      note: 'LEAVE BY THE FAR STAIRS',
      secret: { kind: 'far' },
      par: 120,
      tiers: '2122',
      charms: ['shell'],
      map: [
        '####################################',
        '#..........#.........#.............#',
        '#..@.......#....t....#.....a.......#',
        '#..........#.........#.............#',
        '#.....k....###.###...###.###.......#',
        '#..................................#',
        '#####.#####......~...........###D###',
        '#.........#..b...~....b......#.....#',
        '#..a......#......~...........#..>..#',
        '#.........#..................#.....#',
        '#.........####.......#########..?..#',
        '#..............CC....#.............#',
        '#####..#####...CC....#..*..........#',
        '#...........#..CC....#.......h.....#',
        '#...$.......#........#######.#######',
        '#..........................a.......#',
        '#..*........#..b...................#',
        '#...........#.....................>#',
        '####################################',
      ],
    },
    {
      name: 'THE TABULATOR ROWS',
      note: 'FREE EVERY CAGED BOT',
      secret: { kind: 'rescue' },
      par: 140,
      tiers: '2232',
      chips: ['power'],
      map: [
        '######################################',
        '#.....#...........~~...........#.....#',
        '#..@..#..p....................b#..$..#',
        '#.....#...........~~...........#.....#',
        '#.....##.###.###########.###.###.....#',
        '#....................................#',
        '#.....#.#.#.#.#.#.#.#.#.#.#.#.#......#',
        '#..*..#..............................#',
        '#.....#.#.#.#.#.#.#.#.#.#.#.#.#..a...#',
        '#.....#..........k...................#',
        '#.....#.#.#.#.#.#.#.#.#.#.#.#.#......#',
        '##D####..............................#',
        '#.....##################.#############',
        '#..$..#......a.........#.#.......^...#',
        '#.....#................#.#...........#',
        '#..h..#...t.....$......#.#....b......#',
        '#.....#................C.............#',
        '#.....#..........*.....#.....*.....>.#',
        '######################################',
      ],
    },
    {
      name: 'THE KEYPUNCH POOL',
      note: 'SHUT EVERY GENERATOR DOWN',
      secret: { kind: 'clean' },
      par: 150,
      tiers: '23223',
      charms: ['mirror'],
      map: [
        '########################################',
        '#.......#....................#.........#',
        '#..@....#..a.......~~......p.#....b....#',
        '#.......#..........~~........#.........#',
        '#.......##########.~~.########.........#',
        '#..*...............................k...#',
        '#.......####.##########.#####.##########',
        '########.......#.......#.......#.......#',
        '#..?.....t.....#...b...#...a...#...*...#',
        '#..............#.......#.......#.......#',
        '#####.#####.####CC.#####CC.#####.#######',
        '#......................................#',
        '#..p......~~~~~~~~...........h.....a...#',
        '#......................................#',
        '##########.######DD#########.###########',
        '#.......$...........#...........#.....##',
        '#.......#...........#....T.........>..##',
        '#..*....#.....a.....#...........#.....##',
        '########################################',
      ],
    },
    {
      name: 'THE BLUE SCREEN',
      note: 'FIX THE BIG BLUESCREEN',
      secret: { kind: 'swift' },
      par: 160,
      tiers: '2332',
      charms: ['mega'],
      map: [
        '########################################',
        '#.......#..............................#',
        '#..@....#....b.........~~......p.......#',
        '#.......#..............~~..............#',
        '#.......#####.######.#######.########.##',
        '#..*..........#..........#.........#...#',
        '#.......#.....#....?.....#....t....#...#',
        '####.####.....#..........#.........#.k.#',
        '#.........a...######.#####...a.....#...#',
        '#.....................................##',
        '###.###########.......########DD########',
        '#..............#.....#.................#',
        '#..h...........#..*..#........B........#',
        '#.....p........#.....#.................#',
        '#..............CCCCCC#.................#',
        '#..$...................................#',
        '#.......................*..........>...#',
        '########################################',
      ],
    },
    {
      name: 'THE CARD CATALOGUE',
      note: 'FIND THE CARD THAT IS NOT A CARD',
      secret: { kind: 'find' },
      par: 170,
      tiers: '3232',
      chips: ['speed'],
      map: [
        '########################################',
        '#......#.........#.........#...........#',
        '#..@...#..b...C..#...p.....#.....t.....#',
        '#......#......C..#.........C...........#',
        '#..............C............C..........#',
        '#..*...#.......C.#....~....#.C.....a...#',
        '########.......C.######~####..C........#',
        '#.....#...a....C.#.........#...C.......#',
        '#..k..#........C.#....$....#....C......#',
        '#.....#........C.#.........#.....C.....#',
        '#.....####.#######.........#......C....#',
        '#........................#####.#####CC.#',
        '#..h.....~~..........b...#.......#CC!C.#',
        '####D#####..#######......#..p....#C^CC.#',
        '#......................................#',
        '#..*.....a.......*.........T...........#',
        '#..................................>...#',
        '########################################',
      ],
    },
    {
      name: 'LOST AND FOUND: THE CARD BINS',
      note: 'GRAB EVERY KEEPSAKE IN 30 SECONDS',
      secret: { kind: 'find' },
      par: 30,
      lost: true,
      map: [
        '##################################',
        '#.......K......#........K........#',
        '#..K...........~...K.........K...#',
        '#.......####...~.......####......#',
        '#..K....#..#...~..K....#K.#...K..#',
        '#.......#K.C...........C..#......#',
        '#.......####.....@.....####......#',
        '#..K.............................#',
        '#.........K....CCCCC...K.....K...#',
        '#....~~~~......C.!.C.............#',
        '#..K...........CCCCC....~~~~..K..#',
        '#.........K.........K..........>.#',
        '##################################',
      ],
    },
    {
      name: 'THE CARD SORTER',
      note: 'FIND THE GAP',
      secret: { kind: 'gentle' },
      par: 150,
      guardian: 'sorter',
      map: [
        '##########################',
        '##########################',
        '##########################',
        '##########################',
        '#>.......................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#........................#',
        '#..*........@........*...#',
        '#........................#',
        '##########################',
      ],
    },
  ],
}

// --- Wing 2: the Tape Library ----------------------------------------------------------------------

const LIBRARY: Wing = {
  id: 'library',
  name: 'THE TAPE LIBRARY',
  era: 'REEL-TO-REEL STACKS',
  tileset: {
    wall: ['#1e1410', '#4a3022', '#7d5235', '#b07a4f', '#e3b98a'],
    floor: ['#071214', '#0d2125', '#132f33', '#1d4549', '#2f6a6d'],
    face: 'reels',
    cable: RAMPS.teal,
  },
  floors: [
    {
      name: 'THE REEL ROOM',
      note: 'SPARKS BOUNCE OFF THE MIRRORS',
      secret: { kind: 'find' },
      par: 130,
      tiers: '2223',
      map: [
        '######################################',
        '#.......#.............#..............#',
        '#..@....#....i........#.....a........#',
        '#.......#.............M..............#',
        '#.......####.####.....M....####.######',
        '#..*....#.......#.....#....#.........#',
        '#.......#..a....#.....#....#...b.....#',
        '####.####.......####.##....#.........#',
        '#...............................=====#',
        '#..h......===============.......=====#',
        '#.........=====.....=====.......=====#',
        '###.######.......k..........######.###',
        '#....#MMMMMMMM.#######.###############',
        '#....#.!.......#.......#.....$.......#',
        '#....#MMMMMMMMM#...t...D.............#',
        '#..*.................................#',
        '#.........a.........*...........>....#',
        '######################################',
      ],
    },
    {
      name: 'THE ARCHIVE STACKS',
      note: 'TAKE THE EXPRESS LIFT',
      secret: { kind: 'express' },
      par: 150,
      tiers: '22323',
      charms: ['ghost'],
      map: [
        '########################################',
        '#.......#......S.......#...............#',
        '#..@....#......S...w...#.....i.........#',
        '#.......#......S.......#...............#',
        '#.......#......s.......#.......E.......#',
        '#..*...........s.......................#',
        '#.......#......s.......#...............#',
        '##.######......S.......########.########',
        '#........sssss.SSSSS...#...............#',
        '#..a.....................?.......a.....#',
        '#........SSSSS.sssss...#...............#',
        '######.#########.#######.#####.#########',
        '#...............#......=====...........#',
        '#..$.....b......#..h...=====.....t.....#',
        '#...............#......=====...........#',
        '#.......................=====..........#',
        '#..*...........k#.......=====....>.....#',
        '########################################',
      ],
    },
    {
      name: 'THE SPLICING BENCH',
      note: 'RIDE THE PATCH CABLES',
      secret: { kind: 'find' },
      par: 150,
      tiers: '2332',
      chips: ['range'],
      map: [
        '######################################',
        '#.......#...........#.......#.......##',
        '#..@....#...c.......#...1...#.3...4.##',
        '#.......#...........#.......#.......##',
        '#.......#####.#######.......##########',
        '#..*........................#.......##',
        '#.......#####.#######.......#..!.^..##',
        '#.......#...........#.......#...4...##',
        '###.#####...i.......#########.......##',
        '#...........................##########',
        '#..1....=====.......w.......#.......##',
        '#.......=====...............#...2...##',
        '##########.########.###.#####.......##',
        '#.......#..........M...........b.....#',
        '#..2....#....a.....M.......$.........#',
        '#.......#..........M.................#',
        '#..h.3..#....*.....M...........>.....#',
        '######################################',
      ],
    },
    {
      name: 'THE COFFEE BREAK',
      note: 'NEVER SPARK A SNACK',
      secret: { kind: 'gentle' },
      par: 160,
      tiers: '23323',
      charms: ['shoo'],
      chips: ['armor'],
      map: [
        '########################################',
        '#.......#..............................#',
        '#..@....#...*....c..........*....c.....#',
        '#.......#..............................#',
        '#.......###.######SSSS######.###########',
        '#..*......................*............#',
        '#.......#####.#####ssss#####.####.######',
        '###.#####.....#..........#.......#.....#',
        '#.......#..i..#....?.....#...w...#..*..#',
        '#..*....#.....#....=.....#.......D.....#',
        '#.......#.....#....=.....#.......#..^..#',
        '#..k....#.....#....=.....#.......#.....#',
        '#.......###.######.=.##########.########',
        '#.........................*............#',
        '#..b..........====.........a.....$.....#',
        '#.....*.......====.....................#',
        '#...............................>......#',
        '########################################',
      ],
    },
    {
      name: 'THE STATIC STORM',
      note: 'TOKEN INTO A GENERATOR',
      secret: { kind: 'overload' },
      par: 170,
      tiers: '3332',
      charms: ['hop'],
      map: [
        '########################################',
        '#.......#.........M......M.............#',
        '#..@....#....i....M..T...M.....a.......#',
        '#.......#.........M......M.............#',
        '#.......###.####..M......M..####.#######',
        '#..*...........#............#..........#',
        '#.......#......#....w.......#....c.....#',
        '####.####......####.....#####..........#',
        '#.............................=====....#',
        '#..h..1..........S......S.....=====..2.#',
        '#................S..?...S..............#',
        '##########.######S......S######.########',
        '#........................#.............#',
        '#..k.....b.......$.......D.....B.......#',
        '#..................2.....#.............#',
        '#...*..........1.........#.......>.....#',
        '########################################',
      ],
    },
    {
      name: 'THE TAPE VAULT',
      note: 'THE HIDDEN REEL IS BEHIND THE GLASS',
      secret: { kind: 'find' },
      par: 180,
      tiers: '33233',
      chips: ['zap'],
      charms: ['mirror'],
      map: [
        '########################################',
        '#.......#...........#..........#.......#',
        '#..@....#...w.......#....i.....#...p...#',
        '#.......#...........S..........#.......#',
        '#.......#####.#######..........##.######',
        '#..*...........=====...#####...........#',
        '#.......#......=====...#...#....c......#',
        '###.#####..1...=====...#.k.#...........#',
        '#......................#...#####.#######',
        '#..?....#..t...........................#',
        '#.......#######.#######.################',
        '#.........#........#..........#MMMMMM..#',
        '#..i......#...a....s....$.....#M!..^s..#',
        '#.........#........#..........#MMMMMM..#',
        '#.........DD.......#..1................#',
        '#..h......#....*...#..........#....>...#',
        '########################################',
      ],
    },
    {
      name: 'LOST AND FOUND: THE OLD REELS',
      note: 'GRAB EVERY KEEPSAKE IN 30 SECONDS',
      secret: { kind: 'find' },
      par: 30,
      lost: true,
      map: [
        '##################################',
        '#..K.....S.......K.......S...K...#',
        '#........S...............S.......#',
        '#..K.....s.......@.......s...K...#',
        '#........s...............s.......#',
        '#..K.....====...K....====....K...#',
        '#........====........====........#',
        '#..1..............K...........2..#',
        '#MMMMM...K...........K.....MMMMM.#',
        '#.K.!.......................K1K..#',
        '#..2.........K.......K.........>.#',
        '##################################',
      ],
    },
    {
      name: 'THE TWIN REELS',
      note: 'RIDE THE GAPS',
      secret: { kind: 'swift' },
      par: 160,
      guardian: 'reels',
      map: [
        '################################',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..............................#',
        '#..*...........@...........*...#',
        '#.............................>#',
        '################################',
      ],
    },
  ],
}

export const WINGS: readonly Wing[] = [VAULT, LIBRARY]

/** The authored floor for an overall floor number (1-based), or null past the authored wings. */
export function planAt(
  level: number,
): { wing: number; step: number; plan: FloorPlan } | null {
  const wing = Math.floor((level - 1) / FLOORS_PER_WING)
  const step = (level - 1) % FLOORS_PER_WING
  const w = WINGS[wing]
  if (!w || level < 1) return null
  return { wing, step, plan: w.floors[step]! }
}

/** The first floor of a wing (0-based wing). */
export function wingStart(wing: number): number {
  return wing * FLOORS_PER_WING + 1
}

/** A generator tier from the plan's tier string (the last digit repeats). */
export function tierAt(plan: FloorPlan, index: number): Tier {
  const s = plan.tiers ?? '2'
  const d = Number(s[Math.min(index, s.length - 1)] ?? 2)
  return (d >= 3 ? 3 : d <= 1 ? 1 : 2) as Tier
}
