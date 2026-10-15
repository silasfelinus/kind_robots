// /utils/arcade/cableCrawler/pictures.ts
//
// The Graphics Card's pictures (conductor kr-arcade/t-066): each picture board hides an 11 x 9
// pixel image under its sparks, one pixel per spark on the maze's odd-odd lattice. Slurping a spark
// reveals its pixel; slurping them all restores the picture. Paint is the Screensaver's 9 x 7
// heart, coloured in by driving over its pixels. Plain data and a lookup, no canvas.

export const PICTURE_W = 11
export const PICTURE_H = 9

/** One colour per art letter. */
export const PICTURE_COLOURS: Readonly<Record<string, string>> = {
  v: '#6b4fa3',
  p: '#f29bb8',
  o: '#f08a3c',
  y: '#ffd84a',
  r: '#e0455a',
  b: '#2f7fd1',
  c: '#8fd3f4',
  n: '#1c2354',
  w: '#ffffff',
  e: '#9aa7b8',
  k: '#3a4252',
  g: '#4caf68',
}

export type PictureArt = {
  id: string
  name: string
  rows: readonly string[]
}

export const PICTURES: readonly PictureArt[] = [
  {
    id: 'sunrise',
    name: 'SUNRISE',
    rows: [
      'vvvvvvvvvvv',
      'vvvvvvvvvvv',
      'ppppppppppp',
      'pppoooooppp',
      'ppooyyyoopp',
      'ooooyyyoooo',
      'bbbbbbbbbbb',
      'bbcbbbcbbcb',
      'nbbnbbbnbbn',
    ],
  },
  {
    id: 'lake',
    name: 'MOUNTAIN LAKE',
    rows: [
      'cccwwcccccc',
      'cccccccwwcc',
      'cccceccccce',
      'ccceeecceee',
      'cceeeeeeeee',
      'ggggggggggg',
      'bbbbbbbbbbb',
      'bbwbbbbwbbb',
      'nbbbnbbbbnb',
    ],
  },
  {
    id: 'robot',
    name: 'FRIENDLY ROBOT',
    rows: [
      'kkkkkekkkkk',
      'kkkkkykkkkk',
      'keeeeeeeeek',
      'keeceeeceek',
      'keeeeeeeeek',
      'keeeeeeeeek',
      'keewwwwweek',
      'keeeeeeeeek',
      'kkkkkkkkkkk',
    ],
  },
  {
    id: 'moon',
    name: 'MOONLIT NIGHT',
    rows: [
      'nnnnnnwnnnn',
      'nwnnnnnnnwn',
      'nnnnyyyynnn',
      'nnnyyyynnnn',
      'nnnyyynnnwn',
      'nnnyyyynnnn',
      'nnnnyyyynnn',
      'vvvvvvvvvvv',
      'kkkkkkkkkkk',
    ],
  },
  {
    id: 'rainbow',
    name: 'RAINBOW',
    rows: [
      'ccccccccccc',
      'ccrrrrrrrcc',
      'crrooooorrc',
      'crooyyyoorc',
      'rooyygyyoor',
      'roygggggyor',
      'roygbbbgyor',
      'wwcccccccww',
      'wwwcccccwww',
    ],
  },
]

/** The Paint Screensaver's heart: 9 x 7, a space is no pixel. */
export const PAINT_ART: readonly string[] = [
  ' rrr rrr ',
  'rpprrrrrr',
  'rrrrrrrrr',
  ' rrrrrrr ',
  '  rrrrr  ',
  '   rrr   ',
  '    r    ',
]

/** Where Paint's pixel columns and rows sit on the board (two cells apart). */
export const PAINT_X0 = 3
export const PAINT_Y0 = 3

export function pictureById(id: string | null): PictureArt | null {
  return PICTURES.find((p) => p.id === id) ?? null
}

/** The colour of the pixel under the lattice cell (x, y), or null off the lattice. */
export function pictureColour(id: string, x: number, y: number): string | null {
  const art = pictureById(id)
  if (!art || x % 2 === 0 || y % 2 === 0) return null
  const ch = art.rows[(y - 1) >> 1]?.[(x - 1) >> 1]
  return ch ? (PICTURE_COLOURS[ch] ?? null) : null
}

/** The colour of Paint's pixel at board cell (x, y), or null if there is none there. */
export function paintColour(x: number, y: number): string | null {
  const dx = x - PAINT_X0
  const dy = y - PAINT_Y0
  if (dx < 0 || dy < 0 || dx % 2 || dy % 2) return null
  const ch = PAINT_ART[dy >> 1]?.[dx >> 1]
  return ch && ch !== ' ' ? (PICTURE_COLOURS[ch] ?? null) : null
}
