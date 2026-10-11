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
  const rows =
    kind === 'vine' ? VINE_ROWS : kind === 'soap' ? SOAP_ROWS : BRICK_ROWS
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
