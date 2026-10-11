// /utils/arcade/pipePals/scenes.ts
//
// Pipe Pals district backdrops and ledge tiles (conductor kr-arcade/t-024). Each
// scene paints once into a cached layer; the game adds its animated bits on top.

import {
  INK,
  RAMPS,
  backdropRng,
  bandedGradient,
  bevel,
  glow,
  mix,
  pixelSprite,
  rgba,
  shadedOrb,
} from '../snes'
import type { PixelSprite, Ramp } from '../snes'
import { H, W } from './districts'
import type { LedgeKind, SceneId } from './districts'

const GROUND_Y = 318

export const SCENE_SKY: Record<SceneId, readonly string[]> = {
  city: [
    RAMPS.night[0],
    RAMPS.night[1],
    RAMPS.night[2],
    mix(RAMPS.night[3], RAMPS.purple[1], 0.5),
    mix(RAMPS.purple[1], RAMPS.pink[1], 0.55),
  ],
  greenhouse: [
    mix(RAMPS.leaf[0], RAMPS.night[1], 0.5),
    RAMPS.leaf[0],
    mix(RAMPS.leaf[1], RAMPS.teal[1], 0.5),
    mix(RAMPS.teal[1], RAMPS.leaf[2], 0.4),
    mix(RAMPS.leaf[2], RAMPS.gold[3], 0.3),
  ],
  laundry: [
    mix(RAMPS.sky[0], RAMPS.night[1], 0.4),
    RAMPS.sky[0],
    mix(RAMPS.sky[1], RAMPS.purple[1], 0.4),
    mix(RAMPS.sky[1], RAMPS.water[2], 0.5),
    mix(RAMPS.water[2], RAMPS.cream[3], 0.25),
  ],
  cold: [
    mix(RAMPS.sky[0], RAMPS.night[0], 0.5),
    RAMPS.sky[0],
    mix(RAMPS.sky[1], RAMPS.water[1], 0.5),
    mix(RAMPS.water[2], RAMPS.sky[1], 0.5),
    mix(RAMPS.water[3], RAMPS.steel[3], 0.4),
  ],
  boiler: [
    mix(RAMPS.ember[0], RAMPS.night[0], 0.6),
    mix(RAMPS.ember[0], RAMPS.night[1], 0.3),
    mix(RAMPS.rust[1], RAMPS.ember[0], 0.5),
    mix(RAMPS.rust[1], RAMPS.ember[1], 0.5),
    mix(RAMPS.ember[2], RAMPS.rust[2], 0.5),
  ],
  clock: [
    mix(RAMPS.night[1], RAMPS.earth[0], 0.5),
    RAMPS.earth[0],
    mix(RAMPS.earth[1], RAMPS.night[2], 0.4),
    mix(RAMPS.earth[1], RAMPS.gold[1], 0.4),
    mix(RAMPS.gold[1], RAMPS.earth[2], 0.5),
  ],
  flooded: [
    mix(RAMPS.water[0], RAMPS.night[0], 0.5),
    RAMPS.water[0],
    mix(RAMPS.water[1], RAMPS.night[2], 0.5),
    mix(RAMPS.water[1], RAMPS.teal[1], 0.5),
    mix(RAMPS.teal[1], RAMPS.water[2], 0.5),
  ],
  storm: [
    RAMPS.night[0],
    RAMPS.night[0],
    RAMPS.night[1],
    mix(RAMPS.night[1], RAMPS.purple[0], 0.5),
    mix(RAMPS.night[2], RAMPS.purple[1], 0.4),
  ],
  golden: [
    mix(RAMPS.gold[1], RAMPS.purple[1], 0.5),
    mix(RAMPS.gold[1], RAMPS.pink[1], 0.4),
    mix(RAMPS.gold[2], RAMPS.pink[2], 0.4),
    RAMPS.gold[2],
    mix(RAMPS.gold[3], RAMPS.cream[3], 0.5),
  ],
}

/** The greenhouse: glass roof panes, hanging baskets, potted palms and a sprinkler header. */
export function paintGreenhouse(k: CanvasRenderingContext2D) {
  const rand = backdropRng(77)
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.greenhouse, 4)
  // Sunlight through the glass.
  glow(k, W / 2, 20, 200, RAMPS.gold[4], 0.18)
  // Glass panes: a lattice of mullions with lit panes here and there.
  const mullion = mix(RAMPS.teal[1], RAMPS.night[1], 0.4)
  for (let x = 0; x < W; x += 56) {
    k.fillStyle = mullion
    k.fillRect(x, 0, 3, GROUND_Y)
    k.fillStyle = rgba(RAMPS.teal[4], 0.18)
    k.fillRect(x + 3, 0, 1, GROUND_Y)
  }
  for (let y = 24; y < GROUND_Y; y += 48) {
    k.fillStyle = mullion
    k.fillRect(0, y, W, 2)
  }
  for (let x = 0; x < W; x += 56)
    for (let y = 26; y < GROUND_Y; y += 48)
      if (rand() < 0.35) {
        k.fillStyle = rgba(RAMPS.teal[4], 0.07)
        k.fillRect(x + 4, y, 52, 46)
        k.fillStyle = rgba('#ffffff', 0.12)
        k.fillRect(x + 8, y + 4, 2, 18)
      }
  // Potted palms and ferns along the back, sunk into the haze.
  for (let x = 10; x < W; x += 40 + Math.floor(rand() * 30)) {
    const h = 40 + Math.floor(rand() * 70)
    const leaf = mix(RAMPS.leaf[1], RAMPS.night[1], 0.35)
    k.fillStyle = mix(RAMPS.earth[1], RAMPS.night[1], 0.4)
    k.fillRect(x - 6, GROUND_Y - 14, 14, 14)
    k.fillStyle = leaf
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.45
      for (let r = 0; r < h / 2; r++) {
        k.fillRect(
          Math.round(x + Math.cos(a) * r),
          Math.round(GROUND_Y - 14 - h / 2 + Math.sin(a) * r * 0.9),
          3,
          2,
        )
      }
    }
    k.fillRect(x, GROUND_Y - 14 - h / 2, 2, h / 2)
  }
  // Hanging baskets on chains.
  for (const x of [70, 200, 330]) {
    k.fillStyle = RAMPS.steel[1]
    k.fillRect(x, 0, 1, 40)
    shadedOrb(k, x, 46, 7, RAMPS.earth, { outline: INK })
    k.fillStyle = RAMPS.leaf[3]
    k.fillRect(x - 8, 38, 16, 3)
    k.fillStyle = RAMPS.pink[3]
    k.fillRect(x - 4, 36, 2, 2)
    k.fillRect(x + 3, 37, 2, 2)
  }
  // The sprinkler header across the roof.
  bevel(k, 0, 30, W, 6, RAMPS.steel)
  for (let x = 30; x < W; x += 64) bevel(k, x - 3, 34, 6, 6, RAMPS.steel)
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.earth[1], RAMPS.earth[0], INK],
    3,
  )
}

/** The laundry basement: tiled walls, a row of washers, a clothesline of socks. */
export function paintLaundry(k: CanvasRenderingContext2D) {
  const rand = backdropRng(91)
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.laundry, 4)
  // Wall tiles.
  const grout = rgba(INK, 0.25)
  for (let y = 40; y < GROUND_Y; y += 12) {
    k.fillStyle = grout
    k.fillRect(0, y, W, 1)
    for (let x = (y / 12) % 2 ? 0 : 6; x < W; x += 12) k.fillRect(x, y, 1, 12)
  }
  // Small high windows with moonlight.
  for (const x of [60, 220, 380]) {
    bevel(k, x - 20, 10, 40, 22, RAMPS.steel)
    k.fillStyle = RAMPS.night[2]
    k.fillRect(x - 17, 13, 34, 16)
    glow(k, x, 22, 30, RAMPS.cream[4], 0.25)
    k.fillStyle = RAMPS.steel[2]
    k.fillRect(x - 1, 13, 2, 16)
  }
  // Washers along the back wall, round doors catching the light.
  const washer: Ramp = [
    mix(RAMPS.cream[0], RAMPS.night[1], 0.5),
    mix(RAMPS.cream[1], RAMPS.night[1], 0.4),
    mix(RAMPS.cream[2], RAMPS.night[1], 0.35),
    mix(RAMPS.cream[3], RAMPS.night[1], 0.3),
    mix(RAMPS.cream[4], RAMPS.night[1], 0.3),
  ]
  for (let x = 14; x < W - 40; x += 62) {
    bevel(k, x, GROUND_Y - 48, 46, 48, washer, { depth: 2 })
    shadedOrb(k, x + 23, GROUND_Y - 24, 13, RAMPS.steel)
    k.fillStyle = mix(RAMPS.water[1], RAMPS.night[1], 0.3)
    k.beginPath()
    k.arc(x + 23, GROUND_Y - 24, 9, 0, Math.PI * 2)
    k.fill()
    k.fillStyle = rgba(RAMPS.water[4], 0.4)
    k.fillRect(x + 18, GROUND_Y - 29, 3, 2)
    k.fillStyle = RAMPS.ember[2]
    k.fillRect(x + 36, GROUND_Y - 43, 3, 2)
  }
  // The clothesline: socks and shirts pegged along a wavy line.
  const cloth = [RAMPS.pink[2], RAMPS.gold[2], RAMPS.teal[2], RAMPS.purple[2]]
  for (let x = 0; x < W; x++) {
    k.fillStyle = rgba(RAMPS.cream[3], 0.5)
    k.fillRect(x, 58 + Math.round(Math.sin(x / 40) * 3), 1, 1)
  }
  for (let x = 20; x < W; x += 30 + Math.floor(rand() * 20)) {
    const y = 59 + Math.round(Math.sin(x / 40) * 3)
    k.fillStyle = mix(
      cloth[Math.floor(rand() * cloth.length)]!,
      RAMPS.night[1],
      0.35,
    )
    if (rand() < 0.6) {
      k.fillRect(x, y, 5, 12)
      k.fillRect(x, y + 10, 9, 4)
    } else {
      k.fillRect(x - 4, y, 16, 14)
    }
  }
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.steel[1], RAMPS.steel[0], INK],
    3,
  )
}

/** Cold storage: frosted shelving of crates, hanging lamps and a frosty haze. */
export function paintCold(k: CanvasRenderingContext2D) {
  const rand = backdropRng(103)
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.cold, 4)
  // Racks of crates on steel shelving.
  const shelf = mix(RAMPS.steel[1], RAMPS.night[1], 0.4)
  for (let y = 70; y < GROUND_Y; y += 60) {
    k.fillStyle = shelf
    k.fillRect(0, y, W, 3)
    for (let x = 6; x < W - 20; x += 26 + Math.floor(rand() * 10)) {
      const h = 18 + Math.floor(rand() * 18)
      const crate: Ramp = [
        mix(RAMPS.earth[0], RAMPS.sky[0], 0.6),
        mix(RAMPS.earth[1], RAMPS.sky[1], 0.6),
        mix(RAMPS.earth[2], RAMPS.sky[1], 0.55),
        mix(RAMPS.earth[3], RAMPS.sky[2], 0.55),
        mix(RAMPS.earth[4], RAMPS.sky[3], 0.5),
      ]
      bevel(k, x, y - h, 22, h, crate)
      k.fillStyle = rgba('#ffffff', 0.5)
      k.fillRect(x + 1, y - h, 20, 2)
    }
  }
  for (let x = 0; x < W; x += 112) {
    k.fillStyle = shelf
    k.fillRect(x + 4, 40, 4, GROUND_Y - 40)
  }
  // Hanging cold lamps.
  for (const x of [80, 224, 368]) {
    k.fillStyle = RAMPS.steel[1]
    k.fillRect(x, 0, 1, 26)
    bevel(k, x - 8, 26, 17, 5, RAMPS.steel)
    glow(k, x, 34, 40, RAMPS.water[4], 0.22)
  }
  // Frost creeping in from the corners.
  for (let i = 0; i < 60; i++) {
    const x = rand() < 0.5 ? rand() * 70 : W - rand() * 70
    const y = rand() * GROUND_Y
    k.fillStyle = rgba('#ffffff', 0.15 + rand() * 0.2)
    k.fillRect(Math.round(x), Math.round(y), 2, 1)
    k.fillRect(Math.round(x) + 1, Math.round(y) - 1, 1, 3)
  }
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.sky[1], RAMPS.sky[0], INK],
    3,
  )
}

/** The boiler works: two big boilers, gauges, pipes and a furnace glowing low. */
export function paintBoiler(k: CanvasRenderingContext2D) {
  const rand = backdropRng(117)
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.boiler, 4)
  const iron: Ramp = [
    mix(RAMPS.rust[0], RAMPS.night[0], 0.6),
    mix(RAMPS.rust[1], RAMPS.night[0], 0.55),
    mix(RAMPS.rust[2], RAMPS.night[1], 0.55),
    mix(RAMPS.rust[3], RAMPS.night[1], 0.5),
    mix(RAMPS.rust[4], RAMPS.night[1], 0.45),
  ]
  for (const cx of [110, 338]) {
    // A boiler drum, rivets and a gauge.
    bevel(k, cx - 46, 70, 92, GROUND_Y - 70, iron, { depth: 3 })
    for (let y = 80; y < GROUND_Y; y += 22) {
      k.fillStyle = iron[3]
      k.fillRect(cx - 44, y, 88, 1)
      for (let x = cx - 40; x < cx + 42; x += 10) {
        k.fillStyle = iron[4]
        k.fillRect(x, y + 3, 1, 1)
      }
    }
    shadedOrb(k, cx, 110, 10, RAMPS.steel)
    k.fillStyle = RAMPS.cream[4]
    k.beginPath()
    k.arc(cx, 110, 7, 0, Math.PI * 2)
    k.fill()
    k.fillStyle = INK
    k.fillRect(cx, 105, 1, 6)
  }
  // The furnace mouth, glowing.
  bevel(k, W / 2 - 30, GROUND_Y - 34, 60, 34, iron)
  k.fillStyle = RAMPS.ember[1]
  k.fillRect(W / 2 - 22, GROUND_Y - 24, 44, 24)
  glow(k, W / 2, GROUND_Y - 12, 60, RAMPS.ember[3], 0.5)
  // Pipes along the ceiling.
  for (let y = 20; y < 50; y += 12) {
    k.fillStyle = iron[2]
    k.fillRect(0, y, W, 5)
    k.fillStyle = iron[4]
    k.fillRect(0, y, W, 1)
  }
  for (let i = 0; i < 30; i++) {
    k.fillStyle = rgba(RAMPS.ember[4], 0.2 + rand() * 0.2)
    k.fillRect(Math.round(rand() * W), Math.round(60 + rand() * 200), 1, 1)
  }
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.earth[1], RAMPS.earth[0], INK],
    3,
  )
}

/** Inside the water tower: a great clock face and the shadows of turning gears. */
export function paintClock(k: CanvasRenderingContext2D) {
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.clock, 4)
  const brass: Ramp = [
    mix(RAMPS.gold[0], RAMPS.night[1], 0.6),
    mix(RAMPS.gold[1], RAMPS.night[1], 0.6),
    mix(RAMPS.gold[2], RAMPS.night[1], 0.6),
    mix(RAMPS.gold[3], RAMPS.night[1], 0.55),
    mix(RAMPS.gold[4], RAMPS.night[1], 0.5),
  ]
  // Background gear silhouettes.
  for (const [cx, cy, r] of [
    [60, 220, 50],
    [390, 200, 60],
    [200, 280, 36],
    [300, 120, 30],
  ] as const) {
    k.fillStyle = brass[1]
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6
      k.fillRect(
        Math.round(cx + Math.cos(a) * r) - 4,
        Math.round(cy + Math.sin(a) * r) - 4,
        8,
        8,
      )
    }
    k.beginPath()
    k.arc(cx, cy, r, 0, Math.PI * 2)
    k.fill()
    k.fillStyle = brass[0]
    k.beginPath()
    k.arc(cx, cy, r * 0.35, 0, Math.PI * 2)
    k.fill()
  }
  // The clock face, high on the back wall, with its little cuckoo door.
  shadedOrb(k, W / 2, 46, 26, RAMPS.gold)
  k.fillStyle = RAMPS.cream[4]
  k.beginPath()
  k.arc(W / 2, 46, 21, 0, Math.PI * 2)
  k.fill()
  k.fillStyle = INK
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6
    k.fillRect(
      Math.round(W / 2 + Math.cos(a) * 17),
      Math.round(46 + Math.sin(a) * 17),
      2,
      2,
    )
  }
  bevel(k, W / 2 - 6, 50, 12, 10, RAMPS.earth)
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.steel[1], RAMPS.steel[0], INK],
    3,
  )
}

/** Flooded mains: big round culverts, dripping pipes and a waterline stain. */
export function paintFlooded(k: CanvasRenderingContext2D) {
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.flooded, 4)
  const concrete: Ramp = [
    mix(RAMPS.steel[0], RAMPS.water[0], 0.5),
    mix(RAMPS.steel[1], RAMPS.water[0], 0.5),
    mix(RAMPS.steel[1], RAMPS.water[1], 0.4),
    mix(RAMPS.steel[2], RAMPS.water[1], 0.4),
    mix(RAMPS.steel[3], RAMPS.water[2], 0.4),
  ]
  for (const [cx, cy, r] of [
    [90, 200, 64],
    [358, 210, 70],
  ] as const) {
    shadedOrb(k, cx, cy, r, concrete, { outline: INK })
    k.fillStyle = mix(RAMPS.night[0], RAMPS.water[0], 0.4)
    k.beginPath()
    k.arc(cx, cy, r - 12, 0, Math.PI * 2)
    k.fill()
  }
  // A waterline stain where the floods reach.
  k.fillStyle = rgba(RAMPS.water[3], 0.18)
  k.fillRect(0, 222, W, 4)
  for (let x = 20; x < W; x += 60) {
    k.fillStyle = rgba(RAMPS.water[4], 0.25)
    k.fillRect(x, 40, 1, 90)
  }
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.steel[1], RAMPS.steel[0], INK],
    3,
  )
}

/** The storm drain at midnight: brick tunnel, a grate letting in the night sky. */
export function paintStorm(k: CanvasRenderingContext2D) {
  const rand = backdropRng(131)
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.storm, 4)
  const brick = mix(RAMPS.night[2], RAMPS.purple[0], 0.4)
  for (let y = 10; y < GROUND_Y; y += 10)
    for (let x = (y / 10) % 2 ? 0 : 12; x < W; x += 24) {
      k.fillStyle = brick
      k.fillRect(x, y, 22, 8)
    }
  // The street grate up top, with a sliver of sky and rain.
  bevel(k, W / 2 - 60, 0, 120, 30, RAMPS.steel)
  k.fillStyle = RAMPS.night[0]
  for (let x = W / 2 - 54; x < W / 2 + 54; x += 8) k.fillRect(x, 4, 4, 22)
  for (let i = 0; i < 12; i++) {
    k.fillStyle = rgba(RAMPS.purple[3], 0.3 + rand() * 0.3)
    k.fillRect(Math.round(rand() * W), Math.round(40 + rand() * 260), 1, 1)
  }
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.night[2], RAMPS.night[1], INK],
    3,
  )
}

/** The Golden Main: a glowing gold skyline under a sunrise sky. */
export function paintGolden(k: CanvasRenderingContext2D) {
  const rand = backdropRng(149)
  bandedGradient(k, 0, 0, W, GROUND_Y, SCENE_SKY.golden, 4)
  glow(k, W / 2, 60, 120, RAMPS.cream[4], 0.35)
  for (let x = -6; x < W;) {
    const w = 14 + Math.floor(rand() * 26)
    const h = 40 + Math.floor(rand() * 120)
    k.fillStyle = mix(RAMPS.gold[1], RAMPS.purple[1], 0.35)
    k.fillRect(x, GROUND_Y - h, w, h)
    k.fillStyle = rgba(RAMPS.gold[4], 0.5)
    for (let wy = GROUND_Y - h + 4; wy < GROUND_Y - 4; wy += 6)
      for (let wx = x + 2; wx < x + w - 2; wx += 4)
        if (rand() < 0.3) k.fillRect(wx, wy, 1, 2)
    x += w + 2
  }
  bandedGradient(
    k,
    0,
    GROUND_Y,
    W,
    H - GROUND_Y,
    [RAMPS.gold[1], RAMPS.gold[0], INK],
    3,
  )
}

// --- ledge tiles ----------------------------------------------------------------------------

const BRICK_ROWS = [
  'HHHHHHHH',
  'LBBBBBBD',
  'BBBBBBSD',
  'SSSSSSSD',
  'BBDLBBBB',
  'BBDBBBBB',
  'SSDSSSSS',
  'DDDDDDDD',
]
const VINE_ROWS = [
  'HLHLLHLH',
  'LBLBBLBL',
  'BSBLLBSB',
  'SBSBBSBS',
  'BDBSSBDB',
  'D.DBBD.D',
  '..D..D..',
  '........',
]
const ICE_ROWS = [
  'wHHHHwHH',
  'HLLwLLLL',
  'LBLLLBLw',
  'BBBLBBBB',
  'BSBBBBSB',
  'SBBSBBBS',
  'SSSSSSSD',
  'DDDDDDDD',
]
const CRUMBLE_ROWS = [
  'HHLHHHLH',
  'LBBDLBBB',
  'BBSDBBSL',
  'SB.DSSB.',
  'BBDLB.BB',
  'B.DBBBS.',
  'SSDS.SSS',
  'D.DD.DDD',
]
const CONVEYOR_ROWS = [
  'HHHHHHHH',
  'DDDDDDDD',
  'LBBBLBBB',
  'BBBBBBBB',
  'SBBBSBBB',
  'DDDDDDDD',
  'SLSSSLSS',
  'DDDDDDDD',
]
const GEAR_ROWS = [
  'HHHHHHHH',
  'LLLLLLLL',
  'BBDBBBDB',
  'BLBBBLBB',
  'BBBBBBBB',
  'SSSSSSSS',
  'DSDSDSDS',
  'D.D.D.D.',
]
const SOAP_ROWS = [
  'HHHHHHHH',
  'LLwLLLLL',
  'BBBBwBBB',
  'BLBBBBBS',
  'BBBBBBSB',
  'SBBSBBBS',
  'SSSSSSSD',
  'DDDDDDDD',
]

export function ledgeTile(kind: LedgeKind, ramp: Ramp): PixelSprite {
  const rows = {
    brick: BRICK_ROWS,
    vine: VINE_ROWS,
    soap: SOAP_ROWS,
    ice: ICE_ROWS,
    crumble: CRUMBLE_ROWS,
    conveyor: CONVEYOR_ROWS,
    gear: GEAR_ROWS,
  }[kind]
  return pixelSprite(
    rows,
    {
      D: ramp[0],
      S: ramp[1],
      B: ramp[2],
      L: ramp[3],
      H: ramp[4],
      w: '#ffffff',
    },
    { outline: null },
  )
}
