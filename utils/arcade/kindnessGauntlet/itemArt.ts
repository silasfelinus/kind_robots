// /utils/arcade/kindnessGauntlet/itemArt.ts
//
// The Deep Archive's goodies (conductor kr-arcade t-052): charms (the classic's amulets, here little
// glowing lockets), chips (upgrade boards), keepsakes (old floppies and gold chips the Mainframe lost)
// and a floor's hidden secret. Original pixel art on utils/arcade/snes.ts.

import { INK, RAMPS, pixelSprite } from '../snes'
import type { CharmKind } from './floors'

/** A charm: a locket on a loop, its gem in the charm's own colour. */
function locket(gem: readonly string[]) {
  return pixelSprite(
    [
      '..sss..',
      '.s...s.',
      '..GGG..',
      '.GhgGG.',
      '.GggdG.',
      '.GgddG.',
      '..GGG..',
    ],
    { s: RAMPS.steel[3], G: RAMPS.gold[3], h: gem[4]!, g: gem[3]!, d: gem[1]! },
  )
}

export const CHARM_SPRITES: Record<
  CharmKind,
  ReturnType<typeof pixelSprite>
> = {
  ghost: locket(RAMPS.steel),
  shell: locket(RAMPS.teal),
  shoo: locket(RAMPS.leaf),
  hop: locket(RAMPS.sky),
  mirror: locket(RAMPS.purple),
  mega: locket(RAMPS.ember),
}

export const CHARM_COLOURS: Record<CharmKind, string> = {
  ghost: RAMPS.steel[4],
  shell: RAMPS.teal[3],
  shoo: RAMPS.leaf[3],
  hop: RAMPS.sky[3],
  mirror: RAMPS.purple[3],
  mega: RAMPS.ember[3],
}

/** A chip: a green board with gold legs. */
export const CHIP_SPRITE = pixelSprite(
  [
    '.y.y.y.',
    'gggggggg',
    'gGGkkGGg',
    'gGkwkGGg',
    'gGGkkGGg',
    'gggggggg',
    '.y.y.y.',
  ],
  {
    y: RAMPS.gold[3],
    g: RAMPS.leaf[1],
    G: RAMPS.leaf[2],
    k: INK,
    w: RAMPS.leaf[4],
  },
)

/** Keepsakes: an old floppy disk, and a gold chip. */
export const KEEPSAKE_SPRITES = [
  pixelSprite(
    [
      'bbbbbbbb.',
      'bsswwssb',
      'bsswwssb',
      'bbbbbbbb',
      'bllllllb',
      'blkkkklb',
      'bllllllb',
      'bbbbbbbb',
    ],
    {
      b: RAMPS.sky[1],
      s: RAMPS.steel[3],
      w: RAMPS.steel[1],
      l: RAMPS.cream[3],
      k: RAMPS.cream[1],
    },
  ),
  pixelSprite(
    [
      '.y.y.y.',
      'yGGGGGy',
      'GHGGGgG',
      'yGGkGgy',
      'GGGgggG',
      'yGgggGy',
      '.y.y.y.',
    ],
    {
      y: RAMPS.gold[2],
      G: RAMPS.gold[3],
      H: '#ffffff',
      g: RAMPS.gold[1],
      k: RAMPS.gold[4],
    },
  ),
]

/** A floor's secret: a spinning star of memory. */
export const SECRET_SPRITE = pixelSprite(
  ['...y...', '...Y...', 'yYYwYYy', '.YwwwY.', '..YwY..', '.Y...Y.', 'y.....y'],
  { y: RAMPS.gold[2], Y: RAMPS.gold[4], w: '#ffffff' },
)
