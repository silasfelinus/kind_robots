/**
 * Iris and Norb as cut-out rigs (conductor monstress-convention/t-018).
 *
 * Vector parts drawn over each lead's neutral A-pose in a 100x220 frame, feet
 * on y 214, three-quarter view facing right, following the canonical krea2
 * faces (ArtImage 280896 Iris, 280897 Norb). The stage draws the painted
 * parts cut from round CH1-LEADS-RIG-R1 (bottom of this file) through
 * `withPaintedParts`, with the same part ids, z-order and clips; the vector
 * rigs remain the fallback when a painted part fails to load.
 */
import {
  MERGED,
  sampleChannel,
  withPaintedParts,
  type CutoutRig,
  type RigBox,
  type RigChannel,
  type RigChannelProp,
  type RigImageSource,
  type RigKey,
  type RigLayout,
  type RigPaint,
  type RigPoint,
  type RigShape,
  type RigVectorSource,
} from './rig'

const INK = '#1a1016'
const FRAME = { w: 100, h: 220, ground: 214 }

type Paint = Record<string, string | number>
const path = (d: string, fill: string, more: Paint = {}): RigShape => ({
  tag: 'path',
  attrs: { d, fill, ...more },
})
const line = (d: string, stroke: string, width: number): RigShape =>
  path(d, 'none', {
    stroke,
    'stroke-width': width,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  })
const inked = (width = 0.9): Paint => ({
  stroke: INK,
  'stroke-width': width,
  'stroke-linejoin': 'round',
})
const circle = (
  cx: number,
  cy: number,
  r: number,
  fill: string,
  more: Paint = {},
): RigShape => ({ tag: 'circle', attrs: { cx, cy, r, fill, ...more } })
const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fill: string,
  more: Paint = {},
): RigShape => ({ tag: 'ellipse', attrs: { cx, cy, rx, ry, fill, ...more } })
const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  more: Paint = {},
): RigShape => ({ tag: 'rect', attrs: { x, y, width, height, fill, ...more } })
const svg = (...shapes: RigShape[]): RigVectorSource => ({
  kind: 'svg',
  shapes,
})

const ch = (
  part: string,
  prop: RigChannelProp,
  ...keys: RigKey[]
): RigChannel => ({ part, prop, keys })
const hold = (part: string, prop: RigChannelProp, value: number) =>
  ch(part, prop, [0, value], [1, value])

function fishnet(x: number, top: number, width: number, bottom: number) {
  let d = ''
  for (let y = top; y < bottom; y += 8) {
    const y2 = Math.min(bottom, y + 8)
    d += `M${x} ${y} L${x + width} ${y2} M${x + width} ${y} L${x} ${y2} `
  }
  return line(d.trim(), '#120c10', 0.45)
}

/** A walk's leg swing in degrees; the feet counter-turn to stay near level. */
interface LegSwing {
  thigh: number
  knee: number
}
const FOOT_LEVEL = 0.8
function stride({ thigh, knee }: LegSwing): RigChannel[] {
  const legs: [string, RigKey[], RigKey[]][] = [
    [
      'Front',
      [
        [0, -thigh],
        [0.5, thigh],
        [1, -thigh],
      ],
      [
        [0, 0],
        [0.5, 0],
        [0.75, knee],
        [1, 0],
      ],
    ],
    [
      'Back',
      [
        [0, thigh],
        [0.5, -thigh],
        [1, thigh],
      ],
      [
        [0, 0],
        [0.25, knee],
        [0.5, 0],
        [1, 0],
      ],
    ],
  ]
  return legs.flatMap(([side, thighKeys, kneeKeys]) => {
    const foot = Array.from({ length: 9 }, (_, i): RigKey => {
      const phase = i / 8
      const angle =
        sampleChannel(thighKeys, phase) + sampleChannel(kneeKeys, phase)
      return [phase, Math.round(-angle * FOOT_LEVEL * 10) / 10 || 0]
    })
    return [
      ch('thigh' + side, 'rotate', ...thighKeys),
      ch('shin' + side, 'rotate', ...kneeKeys),
      ch('foot' + side, 'rotate', ...foot),
    ]
  })
}
const IRIS_LEGS: LegSwing = { thigh: 22, knee: 30 }
const NORB_LEGS: LegSwing = { thigh: 26, knee: 30 }

const IRIS_SKIN = '#e2ab92'
const IRIS_HAIR = '#121016'
const ROSE = '#b04a6e'
const PLUM = '#6d2a5a'
const BERRY = '#a3204a'
const NET = '#3a2a33'

const irisEyesOpen = svg(
  ellipse(45, 26.5, 3, 3.4, '#fff', inked(0.6)),
  ellipse(57.5, 26.5, 3, 3.4, '#fff', inked(0.6)),
  circle(46, 27, 1.8, '#2a1a14'),
  circle(58.5, 27, 1.8, '#2a1a14'),
  line('M41.5 24.5 Q45 22 48.5 24 L50 22.8', '#111', 1),
  line('M54.2 24 Q57.5 22 61 24 L62.6 22.8', '#111', 1),
  line('M41 20.5 Q45 17.8 49 20 M54 19.6 Q58 17.6 62 20', IRIS_HAIR, 1.3),
)
const irisEyesBlink = svg(
  line('M42 27 Q45 29.5 48 27 L50 25.8', '#111', 1.1),
  line('M54.5 27 Q57.5 29.5 60.5 27 L62.6 25.8', '#111', 1.1),
  line('M41 21.2 Q45 18.8 49 20.8 M54 20.4 Q58 18.4 62 20.8', IRIS_HAIR, 1.3),
)

export const IRIS_VECTOR_RIG: CutoutRig = {
  id: 'iris',
  name: 'Iris Quill',
  frame: FRAME,
  seed: 280896,
  handlesItems: true,
  strideHeights: 0.61,
  legs: ['thighBack', 'thighFront'],
  parts: [
    {
      id: 'hips',
      parent: null,
      pivot: [50, 118],
      box: { x: 26, y: 100, w: 48, h: 60 },
      z: 8,
      art: svg(
        path('M34 102 L42 104 L40 158 L27 156 Z', ROSE, inked()),
        path('M58 104 L66 102 L73 156 L60 158 Z', ROSE, inked()),
        path('M36 102 L64 102 L66 150 L34 150 Z', '#141414', inked()),
        line('M62 106 L69 154', '#8f3a5c', 0.8),
      ),
    },
    {
      id: 'torso',
      parent: 'hips',
      pivot: [50, 106],
      box: { x: 30, y: 44, w: 40, h: 66 },
      z: 10,
      art: svg(
        path('M36 52 Q50 46 64 52 L67 106 L33 106 Z', ROSE, inked()),
        path('M44 52 L56 52 L54.5 90 L45.5 90 Z', '#141414'),
        path('M45 52 L55 52 L50 60 Z', IRIS_SKIN),
        rect(45.5, 89.5, 9, 6.5, IRIS_SKIN),
        path('M36 52 L44 51 L48 80 L41 71 Z', PLUM, inked(0.7)),
        path('M64 52 L56 51 L52 80 L59 71 Z', PLUM, inked(0.7)),
        rect(33, 96, 34, 6, PLUM, inked(0.7)),
        rect(46.5, 96.5, 6, 5, 'none', {
          stroke: '#c9a34a',
          'stroke-width': 1,
        }),
        rect(55, 102, 5, 7, '#f6f4ee', {
          stroke: '#8b8b8b',
          'stroke-width': 0.5,
        }),
      ),
    },
    {
      id: 'hairBack',
      parent: 'head',
      pivot: [50, 48],
      box: { x: 26, y: 4, w: 50, h: 52 },
      z: 2,
      art: svg(
        path(
          'M30 30 Q27 6 51 5 Q76 5 73 28 Q76 40 72 50 L68 47 L65 53 L60 49 L56 54 L48 50 L42 54 L38 48 L33 51 L32 44 Q27 38 30 30 Z',
          IRIS_HAIR,
        ),
      ),
    },
    {
      id: 'head',
      parent: 'torso',
      pivot: [50, 48],
      box: { x: 28, y: 4, w: 46, h: 50 },
      z: 20,
      art: svg(
        rect(46.5, 38, 7, 12, IRIS_SKIN),
        path('M51 44 L55.5 42.5 L56.5 45.5 L52 47 Z', '#e7c3a0', {
          stroke: '#b08868',
          'stroke-width': 0.5,
        }),
        circle(36, 30, 3, IRIS_SKIN, inked(0.6)),
        ellipse(51, 28, 16, 17.5, IRIS_SKIN, inked(1)),
        circle(36.5, 36, 2.6, 'none', { stroke: '#d8a530', 'stroke-width': 1 }),
        circle(65.5, 35, 2.4, 'none', { stroke: '#d8a530', 'stroke-width': 1 }),
        ellipse(61, 33, 3, 1.5, '#e46f7d', { opacity: 0.45 }),
        line('M57 28 Q59 31 56.5 32', '#a86f5a', 0.9),
        path(
          'M34 32 Q33 9 51 8 Q68 8 70 26 Q64 16 56 17 Q50 13 44 19 Q39 23 36 34 Z',
          IRIS_HAIR,
        ),
        path(
          'M50 8.5 Q60 8 66 15 Q60 13.5 55 16 Q52 13 47 15 Q47 10 50 8.5 Z',
          '#f4f1ea',
        ),
      ),
    },
    {
      id: 'eyes',
      parent: 'head',
      pivot: [51, 26],
      box: { x: 39, y: 16, w: 25, h: 15 },
      z: 22,
      art: {
        kind: 'swap',
        channel: 'eyes',
        states: { open: irisEyesOpen, blink: irisEyesBlink },
      },
    },
    {
      id: 'mouth',
      parent: 'head',
      pivot: [51.5, 36.5],
      box: { x: 45, y: 32, w: 13, h: 10 },
      z: 23,
      art: {
        kind: 'swap',
        channel: 'mouth',
        states: {
          rest: svg(line('M47 35.5 Q51.5 38.5 56 35', BERRY, 1.6)),
          open: svg(
            path(
              'M47 35 Q51.5 34 56 34.5 Q55 40.5 51.5 40.5 Q48 40.5 47 35 Z',
              '#5a1620',
              { stroke: BERRY, 'stroke-width': 1.1 },
            ),
            path('M48 35.2 L55.2 34.8 L55 36 L48.3 36.2 Z', '#fff'),
          ),
          oh: svg(
            ellipse(51.5, 37, 2.2, 2.8, '#5a1620', {
              stroke: BERRY,
              'stroke-width': 1.1,
            }),
          ),
        },
      },
    },
    {
      id: 'armBackUpper',
      parent: 'torso',
      pivot: [37, 55],
      box: { x: 27, y: 50, w: 16, h: 42 },
      z: 9,
      art: svg(path('M33 52 L41 54 L37.5 89 L29.5 87.5 Z', ROSE, inked())),
    },
    {
      id: 'armBackLower',
      parent: 'armBackUpper',
      pivot: [33.5, 88],
      box: { x: 25, y: 83, w: 15, h: 40 },
      z: 9,
      art: svg(
        path('M29.5 86 L37.5 88 L35.5 111 L28 111 Z', ROSE, inked()),
        path('M27.8 108 L35.7 108 L35.5 112.5 L27.6 112.5 Z', PLUM, inked(0.6)),
      ),
    },
    {
      id: 'handBack',
      parent: 'armBackLower',
      pivot: [31.5, 112],
      box: { x: 26, y: 110, w: 11, h: 13 },
      z: 9,
      art: svg(
        path(
          'M28.5 112 Q27 118 30 121 Q33 122 35 118 Q35.5 114 34.8 112 Z',
          IRIS_SKIN,
          inked(0.6),
        ),
      ),
    },
    {
      id: 'camera',
      parent: 'torso',
      pivot: [41, 52],
      box: { x: 39, y: 50, w: 33, h: 60 },
      z: 15,
      art: svg(
        line('M41 52 L58 98', '#111', 1.2),
        rect(52, 97, 17, 11, '#2b2b30', { ...inked(0.8), rx: 2 }),
        circle(59.5, 103, 4, '#6b7f9a', { stroke: '#ddd', 'stroke-width': 1 }),
        rect(63, 92, 5, 5, '#e8e8e8', inked(0.5)),
        circle(65.5, 90.5, 2.5, '#f6f3d8', inked(0.5)),
      ),
    },
    {
      id: 'armFrontUpper',
      parent: 'torso',
      pivot: [63, 55],
      box: { x: 57, y: 50, w: 16, h: 42 },
      z: 16,
      art: svg(path('M59 54 L67 52 L70.5 87.5 L62.5 89 Z', ROSE, inked())),
    },
    {
      id: 'armFrontLower',
      parent: 'armFrontUpper',
      pivot: [66.5, 88],
      box: { x: 60, y: 83, w: 15, h: 40 },
      z: 16,
      art: svg(
        path('M62.5 88 L70.5 86 L72 111 L64.5 111 Z', ROSE, inked()),
        path('M64.3 108 L72.2 108 L72.4 112.5 L64.5 112.5 Z', PLUM, inked(0.6)),
      ),
    },
    {
      id: 'handFront',
      parent: 'armFrontLower',
      pivot: [68.5, 112],
      box: { x: 64, y: 110, w: 10, h: 13 },
      z: 16,
      art: svg(
        path(
          'M65.2 112 Q65 118 68 121 Q71 122 72.5 118 Q73 114 71.6 112 Z',
          IRIS_SKIN,
          inked(0.6),
        ),
      ),
    },
    {
      id: 'thighBack',
      parent: 'hips',
      pivot: [44.5, 124],
      box: { x: 38, y: 120, w: 13, h: 52 },
      z: 5,
      art: svg(
        rect(39.5, 122, 10, 48, NET, { ...inked(0.8), rx: 4 }),
        fishnet(40, 126, 9, 168),
      ),
    },
    {
      id: 'shinBack',
      parent: 'thighBack',
      pivot: [44.5, 168],
      box: { x: 37, y: 164, w: 20, h: 51 },
      z: 4,
      art: svg(
        rect(40, 166, 9, 30, NET, { ...inked(0.8), rx: 3.5 }),
        fishnet(40.5, 168, 8, 192),
      ),
    },
    {
      id: 'footBack',
      parent: 'shinBack',
      pivot: [44.5, 204],
      box: { x: 38, y: 188, w: 19, h: 27 },
      z: 3.5,
      art: svg(
        path(
          'M39.3 190 L49.7 190 L50 207 Q55 208 55.5 213.5 L39 213.5 Z',
          '#18141a',
          inked(0.8),
        ),
      ),
    },
    {
      id: 'thighFront',
      parent: 'hips',
      pivot: [55.5, 124],
      box: { x: 49, y: 120, w: 13, h: 52 },
      z: 7,
      art: svg(
        rect(50.5, 122, 10, 48, NET, { ...inked(0.8), rx: 4 }),
        fishnet(51, 126, 9, 168),
      ),
    },
    {
      id: 'shinFront',
      parent: 'thighFront',
      pivot: [55.5, 168],
      box: { x: 48, y: 164, w: 20, h: 51 },
      z: 6,
      art: svg(
        rect(51, 166, 9, 30, NET, { ...inked(0.8), rx: 3.5 }),
        fishnet(51.5, 168, 8, 192),
      ),
    },
    {
      id: 'footFront',
      parent: 'shinFront',
      pivot: [55.5, 204],
      box: { x: 49, y: 188, w: 19, h: 27 },
      z: 5.5,
      art: svg(
        path(
          'M50.3 190 L60.7 190 L61 207 Q66 208 66.5 213.5 L50 213.5 Z',
          '#18141a',
          inked(0.8),
        ),
      ),
    },
  ],
  gestures: { point: 'point', reach: 'reach', recoil: 'recoil' },
  clips: {
    idle: {
      durationMs: 3400,
      loop: true,
      drive: 'time',
      stillAt: 0,
      channels: [
        ch('torso', 'sy', [0, 1], [0.5, 1.012], [1, 1]),
        ch('head', 'y', [0, 0], [0.5, -0.7], [1, 0]),
        ch('head', 'rotate', [0, 0], [0.5, 1.5], [1, 0]),
        ch('armFrontUpper', 'rotate', [0, 0], [0.5, -1.5], [1, 0]),
        ch('armBackUpper', 'rotate', [0, 0], [0.5, 1.5], [1, 0]),
        ch('camera', 'rotate', [0, 0], [0.5, -1], [1, 0]),
      ],
    },
    walk: {
      durationMs: 1000,
      loop: true,
      drive: 'distance',
      stillAt: 0.25,
      channels: [
        ...stride(IRIS_LEGS),
        ch('hips', 'y', [0, 1.5], [0.25, -1], [0.5, 1.5], [0.75, -1], [1, 1.5]),
        hold('torso', 'rotate', 3),
        hold('head', 'rotate', -2),
        ch('armFrontUpper', 'rotate', [0, 10], [0.5, -10], [1, 10]),
        ch('armBackUpper', 'rotate', [0, -10], [0.5, 10], [1, -10]),
        ch('armFrontLower', 'rotate', [0, -3], [0.5, -10], [1, -3]),
        ch('armBackLower', 'rotate', [0, -10], [0.5, -3], [1, -10]),
        ch('camera', 'rotate', [0, 3], [0.5, -3], [1, 3]),
      ],
    },
    talk: {
      durationMs: 1300,
      loop: true,
      drive: 'time',
      stillAt: 0,
      channels: [
        ch('head', 'rotate', [0, 0], [0.25, 2.5], [0.5, -1], [0.75, 2], [1, 0]),
        ch('armFrontUpper', 'rotate', [0, 0], [0.3, -10], [0.7, -4], [1, 0]),
        ch('armFrontLower', 'rotate', [0, 0], [0.3, -22], [0.6, -8], [1, 0]),
      ],
    },
    point: {
      durationMs: 1200,
      loop: false,
      drive: 'time',
      stillAt: 0.5,
      channels: [
        ch('armFrontUpper', 'rotate', [0, 0], [0.3, -85], [1, -85]),
        ch('armFrontLower', 'rotate', [0, 0], [0.3, -8], [1, -8]),
        ch('torso', 'rotate', [0, 0], [0.3, 4], [1, 4]),
        ch('head', 'rotate', [0, 0], [0.3, -4], [1, -4]),
      ],
    },
    reach: {
      durationMs: 950,
      loop: false,
      drive: 'time',
      stillAt: 0.55,
      channels: [
        ch('torso', 'rotate', [0, 0], [0.45, 16], [1, 16]),
        ch('hips', 'y', [0, 0], [0.45, 2], [1, 2]),
        ch('head', 'rotate', [0, 0], [0.45, -6], [1, -6]),
        ch('armFrontUpper', 'rotate', [0, 0], [0.45, -60], [1, -60]),
        ch('armFrontLower', 'rotate', [0, 0], [0.45, -20], [1, -20]),
      ],
    },
    recoil: {
      durationMs: 850,
      loop: false,
      drive: 'time',
      stillAt: 0.5,
      mouth: 'oh',
      eyes: 'open',
      channels: [
        ch('torso', 'rotate', [0, 0], [0.25, -12], [1, -10]),
        ch('hips', 'x', [0, 0], [0.25, -2.5], [1, -2.5]),
        ch('head', 'rotate', [0, 0], [0.25, -8], [1, -6]),
        ch('armFrontUpper', 'rotate', [0, 0], [0.25, -45], [1, -40]),
        ch('armFrontLower', 'rotate', [0, 0], [0.25, -110], [1, -100]),
        ch('armBackUpper', 'rotate', [0, 0], [0.25, -35], [1, -30]),
        ch('armBackLower', 'rotate', [0, 0], [0.25, -100], [1, -90]),
      ],
    },
  },
}

const NORB_SKIN = '#dcae94'
const JACKET = '#4a4a57'
const SLACKS = '#7d7f86'
const GLOVE = '#f2d64b'
const GLOVE_INK = '#a88f15'
const NORB_LID = '#c58f78'

const glove = (cx: number) => [
  path(
    `M${cx - 5} 122 L${cx + 5} 122 L${cx + 5.5} 128 L${cx - 5.5} 128 Z`,
    GLOVE,
    { stroke: GLOVE_INK, 'stroke-width': 0.8 },
  ),
  circle(cx, 132, 7, GLOVE, { stroke: GLOVE_INK, 'stroke-width': 0.9 }),
  line(
    `M${cx - 4} 134 L${cx - 5} 138 M${cx} 136 L${cx} 139.5 M${cx + 4} 134 L${cx + 5} 138`,
    GLOVE_INK,
    0.8,
  ),
]

const norbBags = line(
  'M36 52 Q42 55 48 52 M64 50 Q67 51.5 70 50',
  '#9b6c5a',
  0.7,
)

export const NORB_VECTOR_RIG: CutoutRig = {
  id: 'norb',
  name: 'Norb Vale',
  frame: FRAME,
  seed: 280897,
  handlesItems: false,
  strideHeights: 0.48,
  legs: ['thighBack', 'thighFront'],
  parts: [
    {
      id: 'hips',
      parent: null,
      pivot: [52, 146],
      box: { x: 30, y: 136, w: 44, h: 26 },
      z: 8,
      art: svg(
        path('M32 140 L72 140 L71 160 L33 160 Z', SLACKS, inked()),
        line('M32.5 141.5 L71.5 141.5', '#4b4c52', 2),
      ),
    },
    {
      id: 'torso',
      parent: 'hips',
      pivot: [52, 140],
      box: { x: 17, y: 70, w: 60, h: 76 },
      z: 10,
      art: svg(
        ellipse(32, 92, 14, 17, JACKET, inked()),
        path('M30 78 Q52 70 72 78 L75 144 L29 144 Z', JACKET, inked()),
        path('M42 78 L62 78 L64 142 L40 142 Z', '#e2468b', inked(0.6)),
        path('M42 78 L48 98 L39 90 Z', '#3a3a45'),
        path('M62 78 L56 98 L65 90 Z', '#3a3a45'),
        {
          tag: 'text',
          readable: true,
          text: 'MONSTRIQUE',
          attrs: {
            x: 52,
            y: 112,
            'text-anchor': 'middle',
            'font-size': 3.4,
            'font-weight': 900,
            textLength: 20,
            lengthAdjust: 'spacingAndGlyphs',
            fill: '#fff',
          },
        },
        path(
          'M45 76 L52 80 L45 84 Z M59 76 L52 80 L59 84 Z',
          '#6b6b74',
          inked(0.6),
        ),
        circle(52, 80, 1.8, '#5a5a63', inked(0.5)),
      ),
    },
    {
      id: 'head',
      parent: 'torso',
      pivot: [54, 76],
      box: { x: 19, y: 10, w: 70, h: 76 },
      z: 20,
      art: svg(
        ellipse(25, 50, 4.5, 7, NORB_SKIN, inked(0.8)),
        circle(55, 46, 30, NORB_SKIN, inked(1.2)),
        path('M33 60 Q55 84 78 58 Q70 72 55 74 Q40 72 33 60 Z', '#6e5a50', {
          opacity: 0.3,
        }),
        ellipse(37, 60, 5, 3, '#e47c7c', { opacity: 0.45 }),
        ellipse(75, 58, 4.5, 3, '#e47c7c', { opacity: 0.45 }),
        line('M40 26 Q55 22 70 26 M42 30 Q55 27 68 30', '#8a5e4c', 0.9),
        path(
          'M24 44 Q22 14 54 13 Q86 13 86 40 Q80 26 72 25 Q64 19 54 22 Q44 18 36 27 Q30 33 28 44 Z',
          '#4a3b2a',
        ),
        ellipse(26.5, 42, 2.8, 6, '#a49d94'),
        ellipse(84, 40, 2.4, 5.5, '#a49d94'),
        ellipse(56, 57, 8, 7, '#e8908a', inked(0.8)),
        circle(53.5, 54.5, 2, '#fff', { opacity: 0.45 }),
      ),
    },
    {
      id: 'eyes',
      parent: 'head',
      pivot: [54, 44],
      box: { x: 32, y: 33, w: 41, h: 23 },
      z: 22,
      art: {
        kind: 'swap',
        channel: 'eyes',
        states: {
          open: svg(
            circle(42, 44, 7.5, '#fff', inked(0.7)),
            circle(43.5, 45, 3.4, '#111'),
            circle(42.3, 43.6, 1, '#fff'),
            path(
              'M34.5 43 Q42 33.5 49.5 43 Q42 39 34.5 43 Z',
              NORB_LID,
              inked(0.7),
            ),
            circle(67, 45, 3.6, '#fff', inked(0.6)),
            circle(67.6, 45.4, 1.7, '#111'),
            path(
              'M63.4 44.2 Q67 40.3 70.6 44.2 Q67 42.6 63.4 44.2 Z',
              NORB_LID,
              inked(0.6),
            ),
            norbBags,
          ),
          blink: svg(
            circle(42, 44, 7.5, NORB_LID, inked(0.7)),
            line('M34.5 45 Q42 49 49.5 45', '#111', 1.3),
            circle(67, 45, 3.6, NORB_LID, inked(0.6)),
            line('M63.4 45.5 Q67 47.5 70.6 45.5', '#111', 1.1),
            norbBags,
          ),
        },
      },
    },
    {
      id: 'mouth',
      parent: 'head',
      pivot: [55, 68],
      box: { x: 42, y: 62, w: 26, h: 14 },
      z: 23,
      art: {
        kind: 'swap',
        channel: 'mouth',
        states: {
          rest: svg(
            line('M44 66 Q55 73 67 65', '#3a1d1d', 1.6),
            path(
              'M52 68.4 L58 68.4 L57.6 71.2 L52.4 71.2 Z',
              '#fff8e0',
              inked(0.5),
            ),
          ),
          open: svg(
            path(
              'M44 65.5 Q55 64.5 66.5 65 Q63 75 55 75.5 Q47 75 44 65.5 Z',
              '#4a1a1a',
              { stroke: '#3a1d1d', 'stroke-width': 1 },
            ),
            path('M51.5 65.2 L58.5 65.2 L58 68.8 L52 68.8 Z', '#fff8e0'),
          ),
          oh: svg(
            ellipse(55, 69, 3.6, 4.6, '#4a1a1a', {
              stroke: '#3a1d1d',
              'stroke-width': 1,
            }),
          ),
        },
      },
    },
    {
      id: 'glasses',
      parent: 'head',
      pivot: [54, 44],
      box: { x: 30, y: 32, w: 56, h: 24 },
      z: 24,
      art: svg(
        circle(42, 44, 10.5, '#dff1f7', {
          'fill-opacity': 0.3,
          stroke: '#2b2b2b',
          'stroke-width': 1.5,
        }),
        line('M36 40 L40 36', '#fff', 1.2),
        circle(67, 45, 7, '#dff1f7', {
          'fill-opacity': 0.25,
          stroke: '#2b2b2b',
          'stroke-width': 1.2,
        }),
        line('M52.5 44 Q55 42 60 44 M74 44 L84 41', '#2b2b2b', 1.2),
      ),
    },
    {
      id: 'armBackUpper',
      parent: 'torso',
      pivot: [33, 84],
      box: { x: 25, y: 80, w: 14, h: 31 },
      z: 9,
      art: svg(path('M29 82 L37 84 L35 109 L27 108 Z', JACKET, inked())),
    },
    {
      id: 'armBackLower',
      parent: 'armBackUpper',
      pivot: [31, 108],
      box: { x: 22, y: 104, w: 18, h: 37 },
      z: 17,
      art: svg(path('M27 107 L35 109 L34.5 124 L27.5 124 Z', JACKET, inked())),
    },
    {
      id: 'handBack',
      parent: 'armBackLower',
      pivot: [31, 124],
      box: { x: 23, y: 121, w: 16, h: 20 },
      z: 17,
      art: svg(...glove(31)),
    },
    {
      id: 'armFrontUpper',
      parent: 'torso',
      pivot: [71, 84],
      box: { x: 65, y: 80, w: 14, h: 31 },
      z: 16,
      art: svg(path('M67 84 L75 82 L77 108 L69 109 Z', JACKET, inked())),
    },
    {
      id: 'armFrontLower',
      parent: 'armFrontUpper',
      pivot: [73, 108],
      box: { x: 64, y: 104, w: 18, h: 37 },
      z: 16,
      art: svg(path('M69 109 L77 107 L76.5 124 L69.5 124 Z', JACKET, inked())),
    },
    {
      id: 'handFront',
      parent: 'armFrontLower',
      pivot: [73, 124],
      box: { x: 65, y: 121, w: 16, h: 20 },
      z: 16,
      art: svg(...glove(73)),
    },
    {
      id: 'thighBack',
      parent: 'hips',
      pivot: [43, 152],
      box: { x: 36, y: 148, w: 14, h: 36 },
      z: 5,
      art: svg(rect(37.5, 150, 11, 32, SLACKS, { ...inked(0.8), rx: 3 })),
    },
    {
      id: 'shinBack',
      parent: 'thighBack',
      pivot: [43, 180],
      box: { x: 34, y: 176, w: 24, h: 39 },
      z: 4,
      art: svg(rect(38, 178, 10, 28, '#6f7178', { ...inked(0.8), rx: 3 })),
    },
    {
      id: 'footBack',
      parent: 'shinBack',
      pivot: [43, 205],
      box: { x: 35, y: 201, w: 22, h: 14 },
      z: 3.5,
      art: svg(
        path(
          'M36 203 L49 203 L50 208 Q56 209 56.5 213.5 L35.5 213.5 Z',
          '#5a3b25',
          inked(0.8),
        ),
      ),
    },
    {
      id: 'thighFront',
      parent: 'hips',
      pivot: [59, 152],
      box: { x: 52, y: 148, w: 14, h: 36 },
      z: 7,
      art: svg(rect(53.5, 150, 11, 32, SLACKS, { ...inked(0.8), rx: 3 })),
    },
    {
      id: 'shinFront',
      parent: 'thighFront',
      pivot: [59, 180],
      box: { x: 50, y: 176, w: 24, h: 39 },
      z: 6,
      art: svg(rect(54, 178, 10, 28, '#6f7178', { ...inked(0.8), rx: 3 })),
    },
    {
      id: 'footFront',
      parent: 'shinFront',
      pivot: [59, 205],
      box: { x: 51, y: 201, w: 22, h: 14 },
      z: 5.5,
      art: svg(
        path(
          'M52 203 L65 203 L66 208 Q72 209 72.5 213.5 L51.5 213.5 Z',
          '#5a3b25',
          inked(0.8),
        ),
      ),
    },
  ],
  gestures: { point: 'point', reach: 'gloves-up', recoil: 'recoil' },
  clips: {
    idle: {
      durationMs: 3000,
      loop: true,
      drive: 'time',
      stillAt: 0,
      channels: [
        ch('torso', 'sy', [0, 1], [0.5, 1.015], [1, 1]),
        ch('head', 'y', [0, 0], [0.5, -0.6], [1, 0]),
        hold('head', 'rotate', 4),
        ch('armBackUpper', 'rotate', [0, -10], [0.5, -7], [1, -10]),
        ch('armBackLower', 'rotate', [0, -140], [0.5, -146], [1, -140]),
        ch('armFrontUpper', 'rotate', [0, 10], [0.5, 13], [1, 10]),
        ch('armFrontLower', 'rotate', [0, -160], [0.5, -154], [1, -160]),
      ],
    },
    walk: {
      durationMs: 1000,
      loop: true,
      drive: 'distance',
      stillAt: 0.25,
      channels: [
        ...stride(NORB_LEGS),
        ch('hips', 'y', [0, 2], [0.25, -1.5], [0.5, 2], [0.75, -1.5], [1, 2]),
        hold('torso', 'rotate', 5),
        hold('head', 'rotate', 6),
        ch('armBackUpper', 'rotate', [0, -16], [0.5, -4], [1, -16]),
        hold('armBackLower', 'rotate', -140),
        ch('armFrontUpper', 'rotate', [0, 4], [0.5, 16], [1, 4]),
        hold('armFrontLower', 'rotate', -160),
      ],
    },
    talk: {
      durationMs: 1200,
      loop: true,
      drive: 'time',
      stillAt: 0,
      channels: [
        ch('head', 'rotate', [0, 0], [0.25, 3], [0.5, -2], [0.75, 2], [1, 0]),
        ch('armFrontUpper', 'rotate', [0, 0], [0.3, -14], [0.6, -6], [1, 0]),
        ch('armFrontLower', 'rotate', [0, 0], [0.3, -12], [0.6, 6], [1, 0]),
      ],
    },
    point: {
      durationMs: 1300,
      loop: false,
      drive: 'time',
      stillAt: 0.5,
      channels: [
        ch('armFrontUpper', 'rotate', [0, 10], [0.3, -30], [1, -30]),
        ch('armFrontLower', 'rotate', [0, -160], [0.3, -150], [1, -150]),
        ch('head', 'rotate', [0, 4], [0.3, -2], [1, -2]),
      ],
    },
    'gloves-up': {
      durationMs: 900,
      loop: false,
      drive: 'time',
      stillAt: 0.5,
      mouth: 'oh',
      channels: [
        ch(
          'torso',
          'rotate',
          [0, 0],
          [0.2, -6],
          [0.3, -4.5],
          [0.4, -6],
          [0.5, -4.5],
          [1, -5],
        ),
        ch('hips', 'x', [0, 0], [0.2, -3], [1, -3]),
        ch('head', 'rotate', [0, 4], [0.2, -6], [1, -4]),
        ch('armFrontUpper', 'rotate', [0, 10], [0.2, 25], [1, 22]),
        ch('armFrontLower', 'rotate', [0, -160], [0.2, -185], [1, -180]),
        ch('armBackUpper', 'rotate', [0, -10], [0.2, 20], [1, 18]),
        ch('armBackLower', 'rotate', [0, -140], [0.2, -180], [1, -175]),
      ],
    },
    recoil: {
      durationMs: 900,
      loop: false,
      drive: 'time',
      stillAt: 0.4,
      mouth: 'oh',
      eyes: 'open',
      channels: [
        ch('hips', 'y', [0, 0], [0.15, -6], [0.35, 0], [1, 0]),
        ch('hips', 'x', [0, 0], [0.35, -4], [1, -4]),
        ch('torso', 'rotate', [0, 0], [0.2, -18], [1, -14]),
        ch('head', 'rotate', [0, 4], [0.2, -10], [1, -8]),
        ch('armFrontUpper', 'rotate', [0, 10], [0.2, 30], [1, 26]),
        ch('armFrontLower', 'rotate', [0, -160], [0.2, -195], [1, -188]),
        ch('armBackUpper', 'rotate', [0, -10], [0.2, 4], [1, 0]),
        ch('armBackLower', 'rotate', [0, -140], [0.2, -178], [1, -172]),
      ],
    },
  },
}

/**
 * Painted parts cut from the delivered rig source art (round
 * monstrique-leads-rig-1: Iris A-pose ArtImage 280967 and head sheet 280968,
 * Norb A-pose 280969 and head sheet 280970) by
 * scripts/cut_monstrique_rig_parts.py, which prints the two blocks below. A cut
 * is its webp's size in pixels, its box in rig space and the joint it turns
 * on; mouth and eye states sit over the painted face. Norb's painting is wider
 * than the vector frame, so his frame is too.
 */
interface Cut {
  sheet: [number, number]
  box: RigBox
  pivot: RigPoint
}
interface Swap {
  pivot: RigPoint
  states: Record<string, Cut>
}
type Painting = Record<string, Cut | Swap | typeof MERGED>
const cut = (
  sheet: [number, number],
  [x = 0, y = 0, w = 0, h = 0]: number[],
  pivot: RigPoint,
): Cut => ({ sheet, box: { x, y, w, h }, pivot })
const state = (sheet: [number, number], box: number[]): Cut =>
  cut(sheet, box, [0, 0])
const swap = (pivot: RigPoint, states: Record<string, Cut>): Swap => ({
  pivot,
  states,
})

const IRIS_PAINTING: Painting = {
  handBack: cut([81, 99], [2.01, 103.4, 19.95, 24.25], [15.08, 107.36]),
  handFront: cut([85, 90], [77.86, 99.45, 20.98, 22.02], [84.23, 102.89]),
  camera: cut([117, 124], [20.07, 85.86, 28.72, 30.44], [42.95, 92.57]),
  head: cut([197, 197], [25.58, 9.32, 48.33, 48.5], [52.58, 55.07]),
  armBackLower: cut([122, 145], [7.86, 74.85, 29.93, 35.6], [24.37, 80.53]),
  armBackUpper: cut([91, 140], [19.21, 49.22, 22.36, 34.4], [32.97, 57.82]),
  armFrontLower: cut([85, 106], [66.86, 77.78, 20.98, 25.97], [77.35, 81.22]),
  armFrontUpper: cut([54, 126], [63.76, 51.29, 13.24, 30.96], [69.09, 57.14]),
  torso: cut([195, 182], [28.33, 49.57, 47.99, 44.72], [54.3, 91.19]),
  hips: cut([268, 290], [16.12, 84.31, 65.88, 71.21], [54.3, 124.9]),
  thighBack: cut([98, 206], [24.72, 124.56, 24.08, 50.57], [37.44, 124.9]),
  shinBack: cut([72, 128], [23.34, 172.2, 17.72, 31.48], [33.32, 172.38]),
  footBack: cut([66, 59], [20.42, 200.76, 16.34, 14.62], [28.84, 201.62]),
  thighFront: cut([90, 205], [46.9, 124.56, 22.19, 50.4], [57.05, 124.9]),
  shinFront: cut([76, 126], [48.11, 167.56, 18.58, 30.96], [57.4, 172.03]),
  footFront: cut([115, 65], [49.48, 193.02, 28.21, 16.0], [57.74, 197.14]),
  eyes: swap([55.33, 30.99], {
    open: state([63, 27], [47.42, 27.55, 15.48, 6.71]),
    blink: state([63, 27], [47.42, 27.55, 15.48, 6.71]),
  }),
  mouth: swap([55.33, 39.94], {
    rest: state([44, 23], [50.0, 37.18, 10.84, 5.68]),
    open: state([37, 30], [50.86, 36.32, 9.12, 7.4]),
    oh: state([34, 29], [51.2, 36.5, 8.43, 7.05]),
  }),
  hairBack: MERGED,
}

const NORB_PAINTING: Painting = {
  handBack: cut([134, 197], [3.36, 107.16, 33.23, 49.07], [19.54, 112.21]),
  handFront: cut([111, 183], [95.06, 103.86, 27.67, 45.41], [104.11, 110.82]),
  head: cut([218, 244], [34.16, 13.03, 54.29, 60.55], [70.0, 72.19]),
  armBackLower: cut([113, 89], [5.28, 91.68, 28.19, 22.1], [20.94, 93.07]),
  armBackUpper: cut([122, 118], [10.32, 64.88, 30.45, 29.41], [27.55, 79.15]),
  armFrontLower: cut([68, 97], [92.1, 91.68, 16.88, 24.01], [97.5, 92.9]),
  armFrontUpper: cut([42, 80], [92.1, 74.45, 10.44, 19.84], [92.62, 77.41]),
  torso: cut([318, 388], [22.68, 59.66, 79.17, 96.4], [67.57, 137.96]),
  hips: cut([316, 134], [23.37, 132.39, 78.47, 33.41], [62.0, 155.71]),
  thighBack: cut([162, 147], [20.76, 142.49, 40.19, 36.54], [41.12, 155.71]),
  shinBack: cut([160, 84], [20.59, 174.68, 39.67, 20.88], [40.42, 176.94]),
  footBack: cut([139, 94], [21.46, 191.73, 34.63, 23.49], [38.68, 195.03]),
  thighFront: cut([142, 147], [58.35, 142.49, 35.32, 36.54], [75.92, 155.71]),
  shinFront: cut([145, 70], [58.35, 176.07, 36.02, 17.4], [75.22, 176.94]),
  footFront: cut([184, 80], [58.52, 186.86, 45.76, 20.01], [71.74, 190.86]),
  eyes: swap([70.0, 46.44], {
    open: state([83, 50], [58.17, 40.7, 20.53, 12.35]),
    blink: state([83, 50], [58.17, 40.7, 20.53, 12.35]),
  }),
  mouth: swap([70.35, 60.36], {
    rest: state([80, 33], [60.43, 57.05, 20.01, 8.18]),
    open: state([78, 47], [60.78, 55.31, 19.31, 11.66]),
    oh: state([48, 47], [64.45, 55.31, 11.97, 11.66]),
  }),
  glasses: MERGED,
}

/** A cut's webp placed in `box`: its own box, or a swap's shared one. */
function image(
  lead: string,
  file: string,
  c: Cut,
  box = c.box,
): RigImageSource {
  const [w, h] = c.sheet
  const sx = w / c.box.w
  const sy = h / c.box.h
  return {
    kind: 'image',
    src: '/monstress-convention/rig/' + lead + '/' + file + '.webp',
    sheet: { w, h },
    rect: {
      x: (box.x - c.box.x) * sx,
      y: (box.y - c.box.y) * sy,
      w: box.w * sx,
      h: box.h * sy,
    },
  }
}

function union(boxes: RigBox[]): RigBox {
  const x = Math.min(...boxes.map((b) => b.x))
  const y = Math.min(...boxes.map((b) => b.y))
  const right = Math.max(...boxes.map((b) => b.x + b.w))
  const bottom = Math.max(...boxes.map((b) => b.y + b.h))
  return { x, y, w: right - x, h: bottom - y }
}

function painted(
  rig: CutoutRig,
  painting: Painting,
  frame: CutoutRig['frame'],
): CutoutRig {
  const art: Partial<Record<string, RigPaint>> = {}
  const parts: NonNullable<RigLayout['parts']> = {}
  for (const [id, entry] of Object.entries(painting)) {
    if (entry === MERGED) {
      art[id] = MERGED
    } else if ('states' in entry) {
      const box = union(Object.values(entry.states).map((c) => c.box))
      const states: Partial<Record<string, RigImageSource>> = {}
      for (const [name, c] of Object.entries(entry.states))
        states[name] = image(rig.id, id + '-' + name, c, box)
      art[id] = states
      parts[id] = { box, pivot: entry.pivot }
    } else {
      art[id] = image(rig.id, id, entry)
      parts[id] = { box: entry.box, pivot: entry.pivot }
    }
  }
  return withPaintedParts(rig, art, { frame, parts })
}

export const IRIS_RIG: CutoutRig = painted(IRIS_VECTOR_RIG, IRIS_PAINTING, {
  ...FRAME,
})
export const NORB_RIG: CutoutRig = painted(NORB_VECTOR_RIG, NORB_PAINTING, {
  ...FRAME,
  w: 124,
})

export const LEAD_RIGS = { iris: IRIS_RIG, norb: NORB_RIG } as const
export const LEAD_VECTOR_RIGS = {
  iris: IRIS_VECTOR_RIG,
  norb: NORB_VECTOR_RIG,
} as const
export type LeadId = keyof typeof LEAD_RIGS
/** The painted rig, or the vector stand-in when a painted part fails to load. */
export function leadRigFor(
  id: string,
  { painted = true }: { painted?: boolean } = {},
): CutoutRig | null {
  if (id !== 'iris' && id !== 'norb') return null
  return painted ? LEAD_RIGS[id] : LEAD_VECTOR_RIGS[id]
}
