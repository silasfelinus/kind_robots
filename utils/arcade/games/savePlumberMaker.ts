import { GIANT_FOES, parseStage, type StageDef } from './savePlumberLevels'

export const MAKER_VERSION = 1
export const MAKER_ROWS = 24
export const MAKER_MIN_ROWS = 16
export const MAKER_MAX_ROWS = 48
export const MAKER_MIN_COLS = 32
export const MAKER_MAX_COLS = 96
export const MAKER_SAVE_KEY = 'kr:save-plumber:maker:v1'

export type MakerLevel = {
  v: 1
  title: string
  author: string
  theme: number
  dark: boolean
  rows: string[]
}

export type MakerGroup = {
  name: string
  icon: string
  tiles: { key: string; icon: string; label: string }[]
}

/** These are actual savePlumberLevels parser glyphs, never decorative placeholders. */
export const MAKER_GROUPS: MakerGroup[] = [
  {
    name: 'Terrain',
    icon: '▦',
    tiles: [
      { key: '#', icon: '▧', label: 'Ground' },
      { key: 'B', icon: '▣', label: 'Hard block' },
      { key: '=', icon: '━', label: 'One-way platform' },
      { key: '<', icon: '◀', label: 'Left conveyor' },
      { key: '>', icon: '▶', label: 'Right conveyor' },
      { key: ':', icon: '◇', label: 'Blinking bridge' },
      { key: 'w', icon: '≈', label: 'Water' },
      { key: 'c', icon: '▤', label: 'Movable crate' },
      { key: 'g', icon: '▥', label: 'Valve gate' },
    ],
  },
  {
    name: 'Gadgets',
    icon: '⚙',
    tiles: [
      { key: 'v', icon: '♧', label: 'Valve switch' },
      { key: 's', icon: '⇧', label: 'Springstep pad' },
      { key: 'P', icon: '↕', label: 'Moving piston' },
      { key: 'L', icon: '↔', label: 'Moving lift' },
      { key: 'F', icon: '◧', label: 'Raft' },
      { key: '~', icon: '≋', label: 'Wind corridor' },
      { key: 'Q', icon: '▥', label: 'Falling cargo' },
      { key: 'D', icon: '▥', label: 'Pipe entrance' },
      { key: 'E', icon: '▥', label: 'Pipe return' },
      { key: 'K', icon: '⚑', label: 'Checkpoint' },
      { key: '^', icon: '♨', label: 'Steam vent' },
    ],
  },
  {
    name: 'Foes',
    icon: '☠',
    tiles: [
      { key: 'p', icon: '●', label: 'Pumpbug' },
      { key: 'r', icon: '◉', label: 'Rivet roller' },
      { key: 'm', icon: '◈', label: 'Clockwork minnow' },
      { key: 'k', icon: '✦', label: 'Cork crab' },
      { key: 'u', icon: '◢', label: 'Glass gull' },
      { key: 'l', icon: '✺', label: 'Moss lantern' },
      { key: 'h', icon: '♞', label: 'Spring hare' },
      { key: 'j', icon: '▣', label: 'Gasket golem' },
      { key: 'y', icon: '◥', label: 'Paper kite' },
      { key: 'n', icon: '✳', label: 'Umbrella mite' },
      { key: 'i', icon: '◡', label: 'Puddle mimic' },
      { key: 'z', icon: '✷', label: 'Siphon sprite' },
      { key: 't', icon: '♨', label: 'Chimney spirit' },
      { key: 'T', icon: '♜', label: 'Tea-kettle knight' },
      { key: '!', icon: '➤', label: 'Dive glider' },
      { key: 'X', icon: '▩', label: 'Boss gate' },
      { key: 'M', icon: '♛', label: 'World boss' },
    ],
  },
  {
    name: 'Giants',
    icon: '♜',
    tiles: [
      { key: 'a', icon: '♜', label: 'Giant Pumpbug' },
      { key: 'A', icon: '◉', label: 'Giant Rivet Roller' },
      { key: 'C', icon: '◈', label: 'Giant Clockwork Minnow' },
      { key: 'H', icon: '♜', label: 'Giant Cork Crab' },
      { key: 'I', icon: '◢', label: 'Giant Glass Gull' },
      { key: 'J', icon: '✺', label: 'Giant Moss Lantern' },
      { key: 'N', icon: '♞', label: 'Giant Spring Hare' },
      { key: 'O', icon: '▣', label: 'Giant Gasket Golem' },
      { key: 'R', icon: '◥', label: 'Giant Paper Kite' },
      { key: 'S', icon: '✳', label: 'Giant Umbrella Mite' },
      { key: 'U', icon: '◡', label: 'Giant Puddle Mimic' },
      { key: 'V', icon: '✷', label: 'Giant Siphon Sprite' },
      { key: 'W', icon: '♨', label: 'Giant Chimney Spirit' },
      { key: 'Y', icon: '♛', label: 'Giant Tea-kettle Knight' },
    ],
  },
  {
    name: 'Rewards',
    icon: '★',
    tiles: [
      { key: 'o', icon: '●', label: 'Brass token' },
      { key: '*', icon: '✹', label: 'Golden gear' },
      { key: '1', icon: '⇧', label: 'Springstep power' },
      { key: '2', icon: '⚡', label: 'Bottled Storm' },
      { key: '3', icon: '▤', label: 'Pocket Lift' },
      { key: '+', icon: '♥', label: 'Water heart' },
    ],
  },
  {
    name: 'Course',
    icon: '⚑',
    tiles: [
      { key: '@', icon: '◆', label: 'Heroine start' },
      { key: 'G', icon: '⚑', label: 'Finish valve' },
      { key: '.', icon: '⌫', label: 'Eraser' },
    ],
  },
]
export const MAKER_TILES = new Set([
  ...Object.keys(GIANT_FOES),
  '.',
  ...MAKER_GROUPS.flatMap((group) => group.tiles.map((tile) => tile.key)),
])

export function newMakerLevel(cols = 64): MakerLevel {
  const width = Math.max(
    MAKER_MIN_COLS,
    Math.min(MAKER_MAX_COLS, Math.floor(cols)),
  )
  const rows = Array.from({ length: MAKER_ROWS }, (_, y) =>
    y >= 22 ? '#'.repeat(width) : '.'.repeat(width),
  )
  const start = rows[20]!.split('')
  start[3] = '@'
  start[width - 5] = 'G'
  rows[20] = start.join('')
  return {
    v: 1,
    title: 'An Unruly Afternoon',
    author: 'Guest Builder',
    theme: 1,
    dark: false,
    rows,
  }
}

function textField(value: unknown, max: number, fallback: string): string {
  if (typeof value !== 'string') return fallback
  return (
    value
      .trim()
      .replace(/\p{Cc}/gu, '')
      .slice(0, max) || fallback
  )
}

/** Validation is shared by local drafts and link imports, never trust URL or storage JSON. */
export function validateMakerLevel(input: unknown): MakerLevel {
  if (!input || typeof input !== 'object')
    throw new Error('Not a Save the Plumber level')
  const value = input as Record<string, unknown>
  if (value.v !== MAKER_VERSION) throw new Error('Unsupported level version')
  if (
    !Array.isArray(value.rows) ||
    value.rows.length < MAKER_MIN_ROWS ||
    value.rows.length > MAKER_MAX_ROWS ||
    !value.rows.every((row) => typeof row === 'string')
  )
    throw new Error('Course height must be 16 to 48 tiles')
  const rows = value.rows as string[]
  const width = rows[0]?.length ?? 0
  if (width < MAKER_MIN_COLS || width > MAKER_MAX_COLS)
    throw new Error('Course width must be 32 to 96 tiles')
  if (
    rows.some(
      (row) =>
        row.length !== width || [...row].some((tile) => !MAKER_TILES.has(tile)),
    )
  )
    throw new Error('Course contains invalid or uneven tiles')
  const symbols = rows.join('')
  if ((symbols.match(/@/g) ?? []).length !== 1)
    throw new Error('Place exactly one heroine start')
  if ((symbols.match(/G/g) ?? []).length !== 1)
    throw new Error('Place exactly one finish valve')
  if ((symbols.match(/D/g) ?? []).length !== (symbols.match(/E/g) ?? []).length)
    throw new Error('Pair every pipe entrance with a return')
  if ((symbols.match(/M/g) ?? []).length > 1)
    throw new Error('Only one boss can appear in a course')
  if (
    !Number.isInteger(value.theme) ||
    Number(value.theme) < 1 ||
    Number(value.theme) > 8
  )
    throw new Error('Choose one of the eight available worlds')
  const result: MakerLevel = {
    v: 1,
    title: textField(value.title, 64, 'Untitled Course'),
    author: textField(value.author, 32, 'Guest Builder'),
    theme: value.theme as number,
    dark: value.dark === true,
    rows: rows.slice(),
  }
  parseStage(toMakerStage(result))
  return result
}

export function toMakerStage(level: MakerLevel): StageDef {
  return {
    code: String(level.theme) + '-1',
    name: level.title,
    rows: level.rows,
    dark: level.dark,
  }
}

/** Extend east or skyward, keeping the ground and all existing geometry anchored. */
export function resizeMakerLevel(
  level: MakerLevel,
  cols: number,
  rows: number,
): MakerLevel {
  const source = validateMakerLevel(level)
  if (
    !Number.isInteger(cols) ||
    cols < MAKER_MIN_COLS ||
    cols > MAKER_MAX_COLS
  )
    throw new Error('Course width must be 32 to 96 tiles')
  if (
    !Number.isInteger(rows) ||
    rows < MAKER_MIN_ROWS ||
    rows > MAKER_MAX_ROWS
  )
    throw new Error('Course height must be 16 to 48 tiles')
  const oldCols = source.rows[0]!.length
  const oldRows = source.rows.length
  if (
    cols < oldCols &&
    source.rows.some((line) =>
      [...line.slice(cols)].some(
        (tile) => tile !== '.' && !(tile === '#' && line[cols - 1] === '#'),
      ),
    )
  )
    throw new Error('Clear tiles at the right edge before reducing width')
  if (rows < oldRows && source.rows.slice(0, oldRows - rows).some((line) => /[^.]/.test(line)))
    throw new Error('Clear tiles at the top before reducing height')
  const resized = source.rows.map((line) =>
    line.padEnd(cols, line.endsWith('#') ? '#' : '.').slice(0, cols),
  )
  if (rows > oldRows)
    resized.unshift(...Array.from({ length: rows - oldRows }, () => '.'.repeat(cols)))
  else if (rows < oldRows) resized.splice(0, oldRows - rows)
  return validateMakerLevel({ ...source, rows: resized })
}

/** Compact, portable, versioned URL payload. Every import is validated on decoding. */
export function encodeMakerLevel(level: MakerLevel): string {
  const json = JSON.stringify(validateMakerLevel(level))
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeMakerLevel(code: string): MakerLevel {
  if (!/^[A-Za-z0-9_-]{1,12000}$/.test(code))
    throw new Error('Invalid or oversized share code')
  try {
    const binary = atob(
      code.replace(/-/g, '+').replace(/_/g, '/') +
        '='.repeat((4 - (code.length % 4)) % 4),
    )
    const bytes = Uint8Array.from(binary, (letter) => letter.charCodeAt(0))
    return validateMakerLevel(JSON.parse(new TextDecoder().decode(bytes)))
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? 'Cannot open course: ' + error.message
        : 'Cannot open course',
      { cause: error },
    )
  }
}

export function makerId(level: MakerLevel): string {
  const payload = JSON.stringify(validateMakerLevel(level))
  let hash = 2166136261
  for (let i = 0; i < payload.length; i++)
    hash = Math.imul(hash ^ payload.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}

export function paintMakerTile(
  level: MakerLevel,
  x: number,
  y: number,
  tile: string,
): MakerLevel {
  if (
    !MAKER_TILES.has(tile) ||
    y < 0 ||
    y >= level.rows.length ||
    x < 0 ||
    x >= level.rows[0]!.length
  )
    return level
  const rows = level.rows.slice()
  if (rows[y]![x] === tile) return level
  if (tile === '@' || tile === 'G') {
    rows.forEach((row, index) => {
      rows[index] = row.replace(tile, '.')
    })
  }
  rows[y] = rows[y]!.slice(0, x) + tile + rows[y]!.slice(x + 1)
  return { ...level, rows }
}
