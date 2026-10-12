// /utils/arcade/batteryMaze/mazes.ts
//
// Battery Maze's mazes as data (conductor kr-arcade/t-039, spec: conductor
// projects/kr-arcade/depth-pass/CABINETS.md section 2). Every layout is 23 x 21
// tiles around the same charging dock, so the cabinet keeps one size; the game
// parses a layout once and reads everything from the parsed maze.
//
// Legend:
//   '#' wall               '.' spark              'o' power cell
//   '-' dock door          'G' charging dock      'P' robot start
//   ' ' empty floor (a row whose two edges are floor wraps as a tunnel)
//   's' Rewire switch (a spark on it too)
//   'a' a gate that is open while its switch is up (shut when flipped)
//   'b' a gate that is shut while its switch is up (open when flipped)
//   '<' '>' '^' 'v' a conveyor carrying things that way (a spark on it too)
//   't' 'T' a toaster slot: toast pops up and blocks it on the board's beat,
//       't' slots on the first half of the beat and 'T' on the second (a spark on it too)
// Power Phases 2 and 3 (slice 3, t-041) add:
//   'V' a vine bud: a vine grows across it in time, until a watering can clears it (a spark)
//   'f' a flower gate, shut until every bed spark nearest it is eaten; 'e' a bed spark
//   'i' ice: things on it slide to the next junction (a spark)
//   '}' '{' a fan in the left or right wall, blowing along its row
//   'L' a cabinet lamp, lit by eating a spark near it (a spark)
//   'k' a locked shortcut that opens when the gatekeeper is rebooted
//   'p' a solar panel whose spark comes back in the sun
//   'M' a mirror junction: a switch the clock turns (a spark)
// Each gate belongs to the switch (or mirror) nearest it (within four tiles).

export type Tile = { x: number; y: number }

export type MazeLayout = {
  id: string
  name: string
  rows: readonly string[]
}

export type MazeGate = Tile & {
  /** The switch state (0 up, 1 flipped) in which this gate is open. */
  openIn: 0 | 1
}

export type MazeSwitch = Tile & {
  gates: readonly MazeGate[]
  /** A mirror junction: it turns on the clock and can't be thrown. */
  auto: boolean
}

/** A flower gate and the bed of sparks that opens it. */
export type FlowerGate = Tile & { bed: readonly Tile[] }

/** A fan in a wall, blowing along its row. */
export type Fan = { row: number; dir: 1 | -1 }

export type Conveyor = Tile & { dir: Tile }

/** A toaster slot and which half of the beat its toast pops on. */
export type ToastSlot = Tile & { group: 0 | 1 }

export type Maze = {
  id: string
  name: string
  rows: readonly string[]
  cols: number
  height: number
  start: Tile
  door: Tile
  /** The tile above the door, where gremlins step out into the maze. */
  dockExit: Tile
  /** The middle of the dock, where rebooted gremlins land. */
  dockHome: Tile
  /** The dock's tiles, left to right (one gremlin waits on each). */
  dockPads: readonly Tile[]
  sparks: readonly Tile[]
  cells: readonly Tile[]
  switches: readonly MazeSwitch[]
  conveyors: readonly Conveyor[]
  toast: readonly ToastSlot[]
  vines: readonly Tile[]
  flowers: readonly FlowerGate[]
  ice: readonly Tile[]
  fans: readonly Fan[]
  lamps: readonly Tile[]
  locks: readonly Tile[]
  panels: readonly Tile[]
  /** Rows that wrap from one edge to the other. */
  tunnelRows: readonly number[]
}

const CONVEYOR_DIRS: Record<string, Tile> = {
  '<': { x: -1, y: 0 },
  '>': { x: 1, y: 0 },
  '^': { x: 0, y: -1 },
  v: { x: 0, y: 1 },
}
/** Tiles that carry a spark. */
const SPARKY = new Set([
  '.',
  's',
  't',
  'T',
  'V',
  'e',
  'i',
  'L',
  'p',
  'M',
  ...Object.keys(CONVEYOR_DIRS),
])

export const MAZE_COLS = 23
export const MAZE_ROWS = 21

/** Today's maze, kept as Classic Maze and as the first maze of the Cozy Charger. */
export const CLASSIC_LAYOUT: MazeLayout = {
  id: 'classic',
  name: 'THE FIRST CHARGER',
  rows: [
    '#######################',
    '#..........#..........#',
    '#o###.####.#.####.###o#',
    '#.....................#',
    '#.###.#.#######.#.###.#',
    '#.....#....#....#.....#',
    '#####.####.#.####.#####',
    '#####.#.........#.#####',
    '#####.#.###-###.#.#####',
    '     ...#GGGGG#...     ',
    '#####.#.#######.#.#####',
    '#####.#....P....#.#####',
    '#####.#.#######.#.#####',
    '#..........#..........#',
    '#.###.####.#.####.###.#',
    '#o..#.............#..o#',
    '###.#.#.#######.#.#.###',
    '#.....#....#....#.....#',
    '#.########.#.########.#',
    '#.....................#',
    '#######################',
  ],
}

/** Two tunnels, top and bottom, and long socket rows between them. */
export const OUTLET_LOOPS: MazeLayout = {
  id: 'outlet-loops',
  name: 'OUTLET LOOPS',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '###.###.###.###.###.###',
    '   .###.........###.   ',
    '###.###.###.###.###.###',
    '###.................###',
    '###.###.###-###.###.###',
    '###.....#GGGGG#.....###',
    '###.###.#######.###.###',
    '###........P........###',
    '#####.#####.#####.#####',
    '#.....................#',
    '#.#####.#######.#####.#',
    '   .###.........###.   ',
    '###.#####.###.#####.###',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#######################',
  ],
}

/** Three Rewire switches: one over the dock, two guarding the lower halls. */
export const SWITCHYARD: MazeLayout = {
  id: 'switchyard',
  name: 'THE SWITCHYARD',
  rows: [
    '#######################',
    '#.....###.....###.....#',
    '#o###.###.#b#.###.###o#',
    '#..........s..........#',
    '#.#####.###a###.#####.#',
    '#.........#.#.........#',
    '#.###.###.#.#.###.###.#',
    '#.....................#',
    '#####.#####-#####.#####',
    '   .....#GGGGG#.....   ',
    '#####.#.#######.#.#####',
    '#..........P..........#',
    '#.###.###.###.###.###.#',
    '#.....as.......sa.....#',
    '###.###b#######b###.###',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#.#####.###.###.#####.#',
    '#.....................#',
    '#######################',
  ],
}

// --- the Toaster Works -------------------------------------------------------

/** Conveyors run to the middle along the top and out along the bottom. */
export const CRUMB_TRAY: MazeLayout = {
  id: 'crumb-tray',
  name: 'THE CRUMB TRAY',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#....T.>>>>t<<<<.T....#',
    '#.#####.###.###.#####.#',
    '#.......###.###.......#',
    '###.###.###.###.###.###',
    '###.................###',
    '###.#######-#######.###',
    '   .....#GGGGG#.....   ',
    '###.###.#######.###.###',
    '#..........P..........#',
    '#.###.###.###.###.###.#',
    '#.........###.........#',
    '###.#####.###.#####.###',
    '#..>>>>>>..t..<<<<<<..#',
    '#.#####.###.###.#####.#',
    '#.......###.###.......#',
    '#o###.#.###.###.#.###o#',
    '#......T.......T......#',
    '#######################',
  ],
}

/** Breakfast Rush: eight toaster slots, and conveyors down both sides. */
export const BREAKFAST_BAR: MazeLayout = {
  id: 'breakfast-bar',
  name: 'THE BREAKFAST BAR',
  rows: [
    '#######################',
    '#.....................#',
    '#o###.###.###.###.###o#',
    '#.....###t...T###.....#',
    '###.#.###.###.###.#.###',
    '   ...###.....###...   ',
    '###.#.###.#.#.###.#.###',
    '###.................###',
    '#####.#####-#####.#####',
    '###.....#GGGGG#.....###',
    '###.###.#######.###.###',
    '#..........P..........#',
    '#v###.###.###.###.###v#',
    '#v...t..>>>.<<<..T...v#',
    '#v#####.###.###.#####v#',
    '#v......###.###......v#',
    '#o#.###.###.###.###.#o#',
    '#..T...............t..#',
    '#.#######.###.#######.#',
    '#........T...t........#',
    '#######################',
  ],
}

/** Everything at once: conveyors, toast and three switches. */
export const POP_UP_PARLOUR: MazeLayout = {
  id: 'pop-up-parlour',
  name: 'THE POP-UP PARLOUR',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o#.#####.###.#####.#o#',
    '#.........>t<.........#',
    '#.###.#####.#####.###.#',
    '#.......#.....#.......#',
    '###.#b#.#.###.#.#b#.###',
    '#...as...........sa...#',
    '#.###.#####-#####.###.#',
    '  ###...#GGGGG#...###  ',
    '#.###.#.#######.#.###.#',
    '#.....<<<<<P>>>>>.....#',
    '###.#####.#b#.#####.###',
    '#..t.......s.......t..#',
    '#.###.#####a#####.###.#',
    '#.....................#',
    '###.###.#######.###.###',
    '#......T.......T......#',
    '#o###.###.###.###.###o#',
    '#.>>>>>>>.....<<<<<<<.#',
    '#######################',
  ],
}

/**
 * Gremlin Mama's den: a ring of wide halls she patrols (she is two tiles across and can't fit
 * the narrow corridors), a wide hall down to the dock she plugs, and the trap bay at the lower
 * right whose gates the switch beside it can shut behind her.
 */
export const MAMAS_DEN: MazeLayout = {
  id: 'mamas-den',
  name: "MAMA'S DEN",
  rows: [
    '#######################',
    '#.....................#',
    '#.....................#',
    '#..#######..########..#',
    '#..#.....#..#......#..#',
    '#..#.###.#..#.####.#..#',
    '#....###.#..#.####....#',
    '#..#.....#.......#.#..#',
    '#..#.#.####-####.#.#..#',
    '#....#.##GGGGG##.#....#',
    '#..#.#.#########.#.#..#',
    '#..#.......P.......#..#',
    '#..#.######.##.#####..#',
    '#.........#.#......#..#',
    '#..#.####.#.#.#..#.#..#',
    '#..#.####.#.#.#..#.#..#',
    '#..#..........#..#s...#',
    '#..####.#######aa###..#',
    '#.....................#',
    '#.....................#',
    '#######################',
  ],
}

// --- Power Phases 2 and 3, the bosses and the Battery Garden (slice 3, t-041) --------

/** Vines and two flower gates. */
export const SEEDLING_ROWS: MazeLayout = {
  id: 'seedling-rows',
  name: 'SEEDLING ROWS',
  rows: [
    '#######################',
    '#......efee.eefe......#',
    '#o###.###.###.###.###o#',
    '#.......#.....#.......#',
    '#.#.###.###.###.###.#.#',
    '#....V...........V....#',
    '###.###.#######.###.###',
    '#.....................#',
    '#.###.#####-#####.###.#',
    '   .....#GGGGG#.....   ',
    '###.###.#######.###.###',
    '#..V.......P.......V..#',
    '#.###.###.###.###.###.#',
    '#.........###.........#',
    '#.#####.#######.#####.#',
    '#.....................#',
    '###.#####.###.#####.###',
    '#........V...V........#',
    '#o###.#####.#####.###o#',
    '#.....................#',
    '#######################',
  ],
}

/** Bloom Run: six flower gates, and vines everywhere. */
export const FLOWER_BEDS: MazeLayout = {
  id: 'bloom-run',
  name: 'THE FLOWER BEDS',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#..efe...........efe..#',
    '###e###.###.###.###e###',
    '#..........V..........#',
    '#.###.###.###.###.###.#',
    '#....V...........V....#',
    '###.#######-#######.###',
    '   ...###GGGGG###...   ',
    '###.#.###########.#.###',
    '#........V.P.V........#',
    '#e#####.###.###.#####e#',
    '#efe...............efe#',
    '###.#####.###.#####.###',
    '#..........V..........#',
    '#o###.#####.#####.###o#',
    '#......efe...efe......#',
    '#.#.###e###.###e###.#.#',
    '#....V...........V....#',
    '#######################',
  ],
}

/** Vines, flower gates and two switches. */
export const POTTING_SHED: MazeLayout = {
  id: 'potting-shed',
  name: 'THE POTTING SHED',
  rows: [
    '#######################',
    '#..V...............V..#',
    '#.#####.#######.#####.#',
    '#.....eef.###.fee.....#',
    '#o#.#####e###e#####.#o#',
    '#.........as..........#',
    '#.###.#####b#####.###.#',
    '#.....................#',
    '#.###.#####-#####.###.#',
    '  ###...#GGGGG#...###  ',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '###.###.###.###.###.###',
    '#....V...........V....#',
    '#.###.###.###.###.###.#',
    '#.....................#',
    '###.#######b#######.###',
    '#..........sa.........#',
    '#o#####.###.###.#####o#',
    '#......V.......V......#',
    '#######################',
  ],
}

/** Long ice runs, and two fans. */
export const ICE_TRAY: MazeLayout = {
  id: 'ice-tray',
  name: 'THE ICE TRAY',
  rows: [
    '#######################',
    '#.....................#',
    '#o#####.#######.#####o#',
    '#.iiiiiiiiiiiiiiiiiii.#',
    '#.###.#####.#####.###.#',
    '}.....................#',
    '###.#####.###.#####.###',
    '###.................###',
    '###.#######-#######.###',
    '   ...###GGGGG###...   ',
    '###.#.###########.#.###',
    '#..........P..........#',
    '#.#####.#######.#####.#',
    '#.iiiiiiii...iiiiiiii.#',
    '#.###.#####.#####.###.#',
    '#.....................{',
    '###.#####.###.#####.###',
    '#.iiiiiiiiiiiiiiiiiii.#',
    '#o#####.#######.#####o#',
    '#.....................#',
    '#######################',
  ],
}

/** Thaw: the most ice, melting as its sparks are eaten. */
export const FREEZER: MazeLayout = {
  id: 'thaw',
  name: 'THE FREEZER',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.iiiiiiiiiiiiiiiiiii.{',
    '#.#####.###.###.#####.#',
    '#.iiiiiiiiiiiiiiiiiii.#',
    '###.#####.###.#####.###',
    '#.iiiiiii.....iiiiiii.#',
    '#.###.#####-#####.###.#',
    '  ###...#GGGGG#...###  ',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '###.#####.###.#####.###',
    '}.iiiiiiiiiiiiiiiiiii.#',
    '#.#####.###.###.#####.#',
    '#.iiiiiiiiiiiiiiiiiii.#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#.#.#######.#######.#.#',
    '#.iiiiiiiiiiiiiiiiiii.#',
    '#######################',
  ],
}

/** Ice, three fans and two switches. */
export const DEEP_FREEZE: MazeLayout = {
  id: 'deep-freeze',
  name: 'DEEP FREEZE',
  rows: [
    '#######################',
    '}.iiiiiii.....iiiiiii.#',
    '#.#######.###.#######.#',
    '#..........sa.........#',
    '###.###.###b###.###.###',
    '#.....................#',
    '#o###.###########.###o#',
    '#.iiiiiii.....iiiiiii.#',
    '###.#.#####-#####.#.###',
    '   ...###GGGGG###...   ',
    '###.#.###########.#.###',
    '#..........P..........#',
    '#.###.###.#b#.###.###.#',
    '#.........as..........#',
    '###.###.#######.###.###',
    '}.....................{',
    '#o#######.###.#######o#',
    '#.....................#',
    '#.###.#####.#####.###.#',
    '#.iiiiiiiii.iiiiiiiii.#',
    '#######################',
  ],
}

/** Lights out: six cabinet lamps. */
export const CLAW_ROW: MazeLayout = {
  id: 'claw-row',
  name: 'CLAW MACHINE ROW',
  rows: [
    '#######################',
    '#.....................#',
    '#o###.###.###.###.###o#',
    '#....L...........L....#',
    '###.###.#######.###.###',
    '#.........###.........#',
    '#.###.###.###.###.###.#',
    '#.....................#',
    '#.#########-#########.#',
    '  #.....#GGGGG#.....#  ',
    '#.#.###.#######.###.#.#',
    '#..........P..........#',
    '#.###.###.###.###.###.#',
    '#..L...............L..#',
    '###.###.###.###.###.###',
    '#.....................#',
    '#o###.###.###.###.###o#',
    '#.........###.........#',
    '#.#.#####.###.#####.#.#',
    '#........L...L........#',
    '#######################',
  ],
}

/** Lamp Lighter: eight lamps to relight. */
export const DARK_ARCADE: MazeLayout = {
  id: 'lamp-lighter',
  name: 'THE DARK ARCADE',
  rows: [
    '#######################',
    '#....L...........L....#',
    '#.#####.#######.#####.#',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#.#.#####.###.#####.#.#',
    '#L...................L#',
    '###.#######-#######.###',
    '   ...###GGGGG###...   ',
    '###.#.###########.#.###',
    '#..........P..........#',
    '#.#####.###.###.#####.#',
    '#....L...........L....#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#o###.#####.#####.###o#',
    '#.....................#',
    '#.#.###.#######.###.#.#',
    '#......L.......L......#',
    '#######################',
  ],
}

/** Lamps, a switch, and two locked shortcuts. */
export const HIGH_SCORE_HALL: MazeLayout = {
  id: 'high-score-hall',
  name: 'HIGH SCORE HALL',
  rows: [
    '#######################',
    '#..........k..........#',
    '#o###.###.###.###.###o#',
    '#....L...........L....#',
    '###.###.###.###.###.###',
    '#.....................#',
    '#.###.###.###.###.###.#',
    '#.....................#',
    '###.#.#####-#####.#.###',
    '   ...###GGGGG###...   ',
    '###.#.###########.#.###',
    '#..........P..........#',
    '#.###.###.###.###.###.#',
    '#.........as..........#',
    '###.###.###b###.###.###',
    '#....L...........L....#',
    '#o###.###.###.###.###o#',
    '#..........k..........#',
    '#.###.###########.###.#',
    '#..........L..........#',
    '#######################',
  ],
}

/** Solar panels and two mirror junctions. */
export const PANEL_ROWS: MazeLayout = {
  id: 'panel-rows',
  name: 'PANEL ROWS',
  rows: [
    '#######################',
    '#.ppppppp.....ppppppp.#',
    '#o###.###.###.###.###o#',
    '#.....................#',
    '#.#####.###b###.#####.#',
    '#.........aM..........#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#.###.#####-#####.###.#',
    '  ###...#GGGGG#...###  ',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#.###.#####b#####.###.#',
    '#..........Ma.........#',
    '###.###.#######.###.###',
    '#.....................#',
    '#o#######.###.#######o#',
    '#.ppppppp.....ppppppp.#',
    '#######################',
  ],
}

/** Sunset Charge: panels everywhere. */
export const SUN_DECK: MazeLayout = {
  id: 'sunset-charge',
  name: 'THE SUN DECK',
  rows: [
    '#######################',
    '#.pppppppp...pppppppp.#',
    '#.#####.###b###.#####.#',
    '#.........aM..........#',
    '#o#.#####.###.#####.#o#',
    '#.....ppppp.ppppp.....#',
    '#.###.#####.#####.###.#',
    '#.....................#',
    '###.#######-#######.###',
    '   ...###GGGGG###...   ',
    '###.#.###########.#.###',
    '#..........P..........#',
    '#.#####.###.###.#####.#',
    '#.ppppppppp.ppppppppp.#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#o###.#####.#####.###o#',
    '#..........Ma.........#',
    '#.#.#####.#b#.#####.#.#',
    '#.ppppppppp.ppppppppp.#',
    '#######################',
  ],
}

/** Panels, mirrors and a switch. */
export const THE_ROOFTOP: MazeLayout = {
  id: 'the-rooftop',
  name: 'THE ROOFTOP',
  rows: [
    '#######################',
    '#.........###.........#',
    '#o###.###.###.###.###o#',
    '#.ppppppp.....ppppppp.#',
    '#.#####.###b###.#####.#',
    '#.........aM..........#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#.###.#####-#####.###.#',
    '  ###...#GGGGG#...###  ',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '###.###.###b###.###.###',
    '#..........sa.........#',
    '#.###.###.###.###.###.#',
    '#.....................#',
    '#o#.#####.###.#####.#o#',
    '#.........aM..........#',
    '#.###.#####b#####.###.#',
    '#.ppppppp.....ppppppp.#',
    '#######################',
  ],
}

/** The Glitch Train's yard: two tunnels and three switches. */
export const TRAIN_YARD: MazeLayout = {
  id: 'train-yard',
  name: 'THE TRAIN YARD',
  rows: [
    '#######################',
    '#.....................#',
    '#o#####.###.###.#####o#',
    '#.....................#',
    '#.###.###.###.###.###.#',
    '   .................   ',
    '###.###.#######.###.###',
    '#...as...........sa...#',
    '#.###b#####-#####b###.#',
    '#.......#GGGGG#.......#',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '###.#####.###.#####.###',
    '#.........as..........#',
    '#.###.#####b#####.###.#',
    '   .................   ',
    '###.###.#######.###.###',
    '#.....................#',
    '#o#######.###.#######o#',
    '#.....................#',
    '#######################',
  ],
}

/** The Overload's core: four switches, and room to run. */
export const THE_CORE: MazeLayout = {
  id: 'the-core',
  name: 'THE CORE',
  rows: [
    '#######################',
    '#.....................#',
    '#.###.###.###.###.###.#',
    '#...as...........sa...#',
    '#.#.#b#.###.###.#b#.#.#',
    '#.....................#',
    '#.###.###.###.###.###.#',
    '#.....................#',
    '#.###.#####-#####.###.#',
    '#.......#GGGGG#.......#',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '#.###.###.###.###.###.#',
    '#.....................#',
    '#.#.###.###.###.###.#.#',
    '#...as...........sa...#',
    '#.###b###.###.###b###.#',
    '#.....................#',
    '#.#####.#######.#####.#',
    '#.....................#',
    '#######################',
  ],
}

/** The Battery Garden: four mirror junctions, always shifting. */
export const GARDEN_PATHS: MazeLayout = {
  id: 'garden-paths',
  name: 'THE GARDEN PATHS',
  rows: [
    '#######################',
    '#.....................#',
    '#o###.###.###.###.###o#',
    '#.......#..Ma.#.......#',
    '#.#.#b#.###b###.#b#.#.#',
    '#...aM...........Ma...#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#.###.#####-#####.###.#',
    '  ###...#GGGGG#...###  ',
    '#.#####.#######.#####.#',
    '#..........P..........#',
    '###.#####.###.#####.###',
    '#.........aM..........#',
    '#.#####.###b###.#####.#',
    '#.....................#',
    '###.#####.###.#####.###',
    '#.....................#',
    '#o###.#####.#####.###o#',
    '#.....................#',
    '#######################',
  ],
}

export const LAYOUTS: readonly MazeLayout[] = [
  CLASSIC_LAYOUT,
  OUTLET_LOOPS,
  SWITCHYARD,
  CRUMB_TRAY,
  BREAKFAST_BAR,
  POP_UP_PARLOUR,
  MAMAS_DEN,
  SEEDLING_ROWS,
  FLOWER_BEDS,
  POTTING_SHED,
  ICE_TRAY,
  FREEZER,
  DEEP_FREEZE,
  CLAW_ROW,
  DARK_ARCADE,
  HIGH_SCORE_HALL,
  PANEL_ROWS,
  SUN_DECK,
  THE_ROOFTOP,
  TRAIN_YARD,
  THE_CORE,
  GARDEN_PATHS,
]

const BLOCKED = new Set(['#', '-', 'G', '{', '}'])

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

function find(rows: readonly string[], char: string): Tile[] {
  const out: Tile[] = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === char) out.push({ x, y })
  })
  return out
}

/** A layout read into the tiles the game needs. Throws on a malformed layout. */
export function parseMaze(layout: MazeLayout): Maze {
  const { rows } = layout
  const cols = rows[0]!.length
  if (cols !== MAZE_COLS || rows.length !== MAZE_ROWS)
    throw new Error(`${layout.id}: a maze is ${MAZE_COLS} x ${MAZE_ROWS}`)
  if (rows.some((r) => r.length !== cols))
    throw new Error(`${layout.id}: ragged rows`)
  const [start] = find(rows, 'P')
  const [door] = find(rows, '-')
  const dockPads = find(rows, 'G')
  if (!start || !door || dockPads.length < 3)
    throw new Error(`${layout.id}: needs a start, a door and a dock`)
  const switchTiles = [...find(rows, 's'), ...find(rows, 'M')]
  const gates = [...find(rows, 'a'), ...find(rows, 'b')]
  const owned: MazeGate[][] = switchTiles.map(() => [])
  for (const gate of gates) {
    const ranked = switchTiles
      .map((s, i) => ({
        i,
        d: Math.abs(s.x - gate.x) + Math.abs(s.y - gate.y),
      }))
      .sort((p, q) => p.d - q.d)
    const best = ranked[0]
    if (!best || best.d > 4 || ranked[1]?.d === best.d)
      throw new Error(`${layout.id}: gate ${gate.x},${gate.y} has no switch`)
    owned[best.i]!.push({
      ...gate,
      openIn: rows[gate.y]![gate.x] === 'a' ? 0 : 1,
    })
  }
  const tunnelRows: number[] = []
  rows.forEach((row, y) => {
    if (!BLOCKED.has(row[0]!) && !BLOCKED.has(row[cols - 1]!))
      tunnelRows.push(y)
  })
  return {
    id: layout.id,
    name: layout.name,
    rows,
    cols,
    height: rows.length,
    start,
    door,
    dockExit: { x: door.x, y: door.y - 1 },
    dockHome: dockPads[Math.floor(dockPads.length / 2)]!,
    dockPads,
    sparks: rows.flatMap((row, y) =>
      [...row].flatMap((c, x) => (SPARKY.has(c) ? [{ x, y }] : [])),
    ),
    cells: find(rows, 'o'),
    switches: switchTiles.map((s, i) => ({
      ...s,
      gates: owned[i]!,
      auto: rows[s.y]![s.x] === 'M',
    })),
    conveyors: Object.entries(CONVEYOR_DIRS).flatMap(([c, dir]) =>
      find(rows, c).map((t) => ({ ...t, dir })),
    ),
    toast: [
      ...find(rows, 't').map((t) => ({ ...t, group: 0 as const })),
      ...find(rows, 'T').map((t) => ({ ...t, group: 1 as const })),
    ],
    vines: find(rows, 'V'),
    flowers: flowerGates(rows, layout.id),
    ice: find(rows, 'i'),
    fans: rows.flatMap((row, y): Fan[] =>
      row[0] === '}'
        ? [{ row: y, dir: 1 as const }]
        : row[cols - 1] === '{'
          ? [{ row: y, dir: -1 as const }]
          : [],
    ),
    lamps: find(rows, 'L'),
    locks: find(rows, 'k'),
    panels: find(rows, 'p'),
    tunnelRows,
  }
}

/** Each bed spark belongs to the flower gate nearest it. */
function flowerGates(rows: readonly string[], id: string): FlowerGate[] {
  const gates = find(rows, 'f').map((g) => ({ ...g, bed: [] as Tile[] }))
  for (const e of find(rows, 'e')) {
    const ranked = gates
      .map((g, i) => ({ i, d: Math.abs(g.x - e.x) + Math.abs(g.y - e.y) }))
      .sort((p, q) => p.d - q.d)
    const best = ranked[0]
    if (!best || ranked[1]?.d === best.d)
      throw new Error(`${id}: bed spark ${e.x},${e.y} has no flower gate`)
    gates[best.i]!.bed.push(e)
  }
  if (gates.some((g) => !g.bed.length))
    throw new Error(`${id}: a flower gate with no bed`)
  return gates
}

/** Whether a gate is open with its switch in `state`. */
export function gateOpen(gate: MazeGate, state: 0 | 1): boolean {
  return gate.openIn === state
}

/**
 * Everything wrong with a maze, checked in every combination of its switches and with each half
 * of its toast up (flower gates and locks shut, vines down), then with every vine grown, then
 * with every flower gate and lock open: every spark and cell not under a blocked tile reachable
 * from the start, and no dead ends except beside a blocked tile (a shut gate, popped toast, a
 * vine, a flower gate or a lock makes dead ends on purpose: that is how gremlins get bowled into
 * them). Empty when the maze is good.
 */
export function mazeProblems(maze: Maze): string[] {
  const problems: string[] = []
  const { rows, cols } = maze
  const gateAt = new Map<string, { sw: number; gate: MazeGate }>()
  maze.switches.forEach((s, sw) => {
    for (const gate of s.gates) gateAt.set(`${gate.x},${gate.y}`, { sw, gate })
  })
  const keys = (tiles: readonly Tile[]) =>
    new Set(tiles.map((t) => `${t.x},${t.y}`))
  const vines = keys(maze.vines)
  const flowers = keys(maze.flowers)
  const locks = keys(maze.locks)
  type Scenario = {
    name: string
    state: (sw: number) => 0 | 1
    closed: (key: string) => boolean
  }
  const scenarios: Scenario[] = []
  const combos = 2 ** maze.switches.length
  const toastStates = maze.toast.length ? [-1, 0, 1] : [-1]
  for (let combo = 0; combo < combos; combo++)
    for (const popped of toastStates) {
      const up = keys(maze.toast.filter((t) => t.group === popped))
      scenarios.push({
        name: `${combo}/${popped}`,
        state: (sw) => ((combo >> sw) & 1) as 0 | 1,
        closed: (key) => up.has(key) || flowers.has(key) || locks.has(key),
      })
    }
  if (vines.size)
    scenarios.push({
      name: 'vines',
      state: () => 0,
      closed: (key) => vines.has(key) || flowers.has(key) || locks.has(key),
    })
  if (flowers.size || locks.size)
    scenarios.push({ name: 'open', state: () => 0, closed: () => false })
  for (const sc of scenarios) {
    const wrap = (x: number) => ((x % cols) + cols) % cols
    const shut = (x: number, y: number) => {
      const key = `${wrap(x)},${y}`
      if (sc.closed(key)) return true
      const g = gateAt.get(key)
      return !!g && !gateOpen(g.gate, sc.state(g.sw))
    }
    const open = (x: number, y: number) => {
      const cell = rows[y]?.[wrap(x)]
      if (cell === undefined || BLOCKED.has(cell)) return false
      return !shut(x, y)
    }
    const startKey = `${maze.start.x},${maze.start.y}`
    const seen = new Set([startKey])
    const queue = [maze.start]
    while (queue.length) {
      const { x, y } = queue.pop()!
      for (const [dx, dy] of NEIGHBOURS) {
        const nx = wrap(x + dx)
        const key = `${nx},${y + dy}`
        if (!seen.has(key) && open(nx, y + dy)) {
          seen.add(key)
          queue.push({ x: nx, y: y + dy })
        }
      }
    }
    for (const t of [...maze.sparks, ...maze.cells])
      if (!seen.has(`${t.x},${t.y}`) && !shut(t.x, t.y))
        problems.push(`${maze.id}[${sc.name}]: ${t.x},${t.y} is unreachable`)
    if (!seen.has(`${maze.dockExit.x},${maze.dockExit.y}`))
      problems.push(`${maze.id}[${sc.name}]: the dock exit is unreachable`)
    for (const key of seen) {
      const [x, y] = key.split(',').map(Number) as [number, number]
      const exits = NEIGHBOURS.filter(([dx, dy]) => open(x + dx, y + dy)).length
      const beside = NEIGHBOURS.some(([dx, dy]) => shut(x + dx, y + dy))
      if (exits < 2 && !beside)
        problems.push(`${maze.id}[${sc.name}]: dead end at ${key}`)
    }
  }
  return problems
}
