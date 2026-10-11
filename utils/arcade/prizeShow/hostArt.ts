// /utils/arcade/prizeShow/hostArt.ts
//
// Portraits for Prize Show Panic's cut-ins (conductor kr-arcade t-028): TINSEL, the host, a robot with
// an old TV set for a head, a gold bow tie and a sparkly jacket; and LENS, the co-host, a boxy studio
// camera with one big lens and a headset. Two frames each (TINSEL's mouth, LENS's iris), plus the
// sponsors' care package. Pixel art on the 16-bit kit (utils/arcade/snes.ts).

import { INK, RAMPS, pixelSprite } from '../snes'
import type { PixelSprite } from '../snes'

/** Rows padded to one width. */
function even(art: readonly string[]): string[] {
  const w = Math.max(...art.map((r) => r.length))
  return art.map((r) => r.padEnd(w, '.'))
}

const HOST_PALETTE = {
  '1': RAMPS.steel[1],
  '2': RAMPS.steel[2],
  '3': RAMPS.steel[3],
  '4': RAMPS.steel[4],
  k: INK,
  s: RAMPS.teal[2],
  S: RAMPS.teal[3],
  T: RAMPS.teal[4],
  m: RAMPS.ember[2],
  M: RAMPS.ember[1],
  y: RAMPS.gold[3],
  Y: RAMPS.gold[2],
  h: RAMPS.gold[4],
  p: RAMPS.purple[3],
  P: RAMPS.purple[2],
  q: RAMPS.purple[1],
  w: '#ffffff',
  c: RAMPS.cream[3],
}

const TV_TOP = [
  '....h........h......',
  '.....1......1.......',
  '......1....1........',
  '..444444444444443...',
  '.43333333333333332..',
  '.43kkkkkkkkkkkkk21..',
  '.43kTSSSSSSSSSSk21..',
  '.43kSSkkSSSkkSSk21..',
  '.43kSSkwSSSkwSSk21..',
  '.43kSSSSSSSSSSSk21..',
]
const TV_MOUTHS = [
  ['.43kSSSmSSSSmSSk21..', '.43kSSSSmmmmSSSk21..', '.43kSSSSSSSSSSsk21..'],
  ['.43kSSSmmmmmmSSk21..', '.43kSSSMmmmmMSSk21..', '.43kSSSSmmmmSSsk21..'],
]
const TV_BOTTOM = [
  '.43kkkkkkkkkkkkk21y.',
  '.4322222222222222Y..',
  '..111111111111111...',
  '.......yYkYy........',
  '..pqPPPhYyhPPPqp....',
  '.pPPwPPPcPPPPwPPp...',
  '.pPPPPPPcPPPPPPPP23.',
  '.pPPPPwPPcPPPPPPq43.',
  '.qPPPPPPPcPPPPPPq11.',
]

/** TINSEL, mouth shut and mouth open. */
export const HOST_PORTRAIT: readonly PixelSprite[] = TV_MOUTHS.map((mouth) =>
  pixelSprite(even([...TV_TOP, ...mouth, ...TV_BOTTOM]), HOST_PALETTE),
)

const CAMERA_TOP = [
  '.....m..............',
  '...1444444444444432.',
  '..433333333333333321',
  '..432222kkkkk2222221',
]
const CAMERA_LENS = [
  [
    '..43222kssssk222221y',
    '..4322ksSSSSsk22221y',
    '..4322ksSkkSsk22221.',
    '..4322ksSkkSsk22221.',
    '..4322ksSSSTsk22221.',
    '..43222kssssk222221.',
  ],
  [
    '..43222kssssk222221y',
    '..4322ksSSSSsk22221y',
    '..4322ksSSkSsk22221.',
    '..4322ksSkSSsk22221.',
    '..4322ksSSSTsk22221.',
    '..43222kssssk222221.',
  ],
]
const CAMERA_BOTTOM = [
  '..432222kkkkk2222221',
  '..42222222222222221.',
  '...1111111111111111.',
  '......1.....1.......',
  '.....111...111......',
  '....qPPPPPPPPPPq....',
  '...qPPPPPPPPPPPPq...',
]

/** LENS, its iris open and narrowed. */
export const COHOST_PORTRAIT: readonly PixelSprite[] = CAMERA_LENS.map((lens) =>
  pixelSprite(even([...CAMERA_TOP, ...lens, ...CAMERA_BOTTOM]), HOST_PALETTE),
)

/** The sponsors' care package: a ribboned crate on a little striped parachute. */
export const PACKAGE_SPRITE = pixelSprite(
  even([
    '..wmwmwmwmw..',
    '.wmwmwmwmwmw.',
    'kkkkkkkkkkkkk',
    '.k....k....k.',
    '..k...k...k..',
    '...YYYmYYY...',
    '..YyyymyyyY..',
    '..YmmmmmmmY..',
    '..YyyymyyyY..',
    '..YYYYmYYYY..',
  ]),
  { ...HOST_PALETTE, w: '#ffffff', m: RAMPS.pink[2] },
)
