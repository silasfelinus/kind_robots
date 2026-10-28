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
  snow?: true
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
      { key: 'w', icon: '≈', label: 'Water hazard' },
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
    name: 'Winter',
    icon: '❄',
    tiles: [
      { key: 'f', icon: '❄', label: 'Slippery ice' },
      { key: 'b', icon: '▧', label: 'Snowbank · smash with wrench' },
      { key: 'd', icon: '◇', label: 'Fragile ice · cracks underfoot' },
      { key: 'e', icon: '▼', label: 'Falling icicle · proximity trigger' },
      { key: 'q', icon: '●', label: 'Rolling snowball · stomp to break' },
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
    ...(value.snow === true ? { snow: true as const } : {}),
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
    snow: level.snow === true,
  }
}

/** Extend east or skyward, keeping the ground and all existing geometry anchored. */
export function resizeMakerLevel(
  level: MakerLevel,
  cols: number,
  rows: number,
): MakerLevel {
  const source = validateMakerLevel(level)
  if (!Number.isInteger(cols) || cols < MAKER_MIN_COLS || cols > MAKER_MAX_COLS)
    throw new Error('Course width must be 32 to 96 tiles')
  if (!Number.isInteger(rows) || rows < MAKER_MIN_ROWS || rows > MAKER_MAX_ROWS)
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
  if (
    rows < oldRows &&
    source.rows.slice(0, oldRows - rows).some((line) => /[^.]/.test(line))
  )
    throw new Error('Clear tiles at the top before reducing height')
  const resized = source.rows.map((line) =>
    line.padEnd(cols, line.endsWith('#') ? '#' : '.').slice(0, cols),
  )
  if (rows > oldRows)
    resized.unshift(
      ...Array.from({ length: rows - oldRows }, () => '.'.repeat(cols)),
    )
  else if (rows < oldRows) resized.splice(0, oldRows - rows)
  return validateMakerLevel({ ...source, rows: resized })
}

export type MakerRect = { x1: number; y1: number; x2: number; y2: number }
export type MakerStamp = { rows: string[]; width: number; height: number }
export type MakerTemplate = 'harbor' | 'snowfield' | 'skybridge'

function regionBounds(rect: MakerRect) {
  return {
    left: Math.min(rect.x1, rect.x2),
    right: Math.max(rect.x1, rect.x2),
    top: Math.min(rect.y1, rect.y2),
    bottom: Math.max(rect.y1, rect.y2),
  }
}

function modifyMakerLevel(
  level: MakerLevel,
  paint: (grid: string[][]) => void,
): MakerLevel {
  const grid = level.rows.map((row) => row.split(''))
  paint(grid)
  const rows = grid.map((row) => row.join(''))
  if (rows.every((row, y) => row === level.rows[y])) return level
  return validateMakerLevel({ ...level, rows })
}

export function makerRectangle(
  level: MakerLevel,
  area: MakerRect,
  tile: string,
): MakerLevel {
  if (!MAKER_TILES.has(tile)) throw new Error('Unknown maker tile')
  const { left, right, top, bottom } = regionBounds(area)
  if (
    left < 0 ||
    top < 0 ||
    right >= level.rows[0]!.length ||
    bottom >= level.rows.length
  )
    throw new Error('Rectangle must stay within the course')
  if ((tile === '@' || tile === 'G') && (right !== left || top !== bottom))
    throw new Error('Start and finish markers occupy one tile')
  return modifyMakerLevel(level, (grid) => {
    if (tile === '@' || tile === 'G') {
      for (const row of grid)
        for (let x = 0; x < row.length; x++) if (row[x] === tile) row[x] = '.'
    }
    for (let y = top; y <= bottom; y++)
      for (let x = left; x <= right; x++) grid[y]![x] = tile
  })
}

export function makerFloodFill(
  level: MakerLevel,
  x: number,
  y: number,
  tile: string,
): MakerLevel {
  if (!MAKER_TILES.has(tile)) throw new Error('Unknown maker tile')
  const width = level.rows[0]!.length
  const height = level.rows.length
  if (x < 0 || y < 0 || x >= width || y >= height)
    throw new Error('Fill must start inside the course')
  const original = level.rows[y]![x]!
  if (original === tile) return level
  if (tile === '@' || tile === 'G')
    throw new Error('Use the brush to move the start or finish')
  return modifyMakerLevel(level, (grid) => {
    const visited = new Set<number>()
    const queue = [y * width + x]
    for (let head = 0; head < queue.length; head++) {
      const key = queue[head]!
      if (visited.has(key)) continue
      visited.add(key)
      const cx = key % width
      const cy = Math.floor(key / width)
      if (grid[cy]![cx] !== original) continue
      grid[cy]![cx] = tile
      if (cx > 0) queue.push(key - 1)
      if (cx + 1 < width) queue.push(key + 1)
      if (cy > 0) queue.push(key - width)
      if (cy + 1 < height) queue.push(key + width)
    }
  })
}

export function makerCopy(level: MakerLevel, area: MakerRect): MakerStamp {
  const { left, right, top, bottom } = regionBounds(area)
  if (
    left < 0 ||
    top < 0 ||
    right >= level.rows[0]!.length ||
    bottom >= level.rows.length
  )
    throw new Error('Selection must stay within the course')
  return {
    rows: level.rows
      .slice(top, bottom + 1)
      .map((row) => row.slice(left, right + 1)),
    width: right - left + 1,
    height: bottom - top + 1,
  }
}

export function makerPaste(
  level: MakerLevel,
  x: number,
  y: number,
  stamp: MakerStamp,
): MakerLevel {
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    !Number.isInteger(stamp.width) ||
    !Number.isInteger(stamp.height) ||
    stamp.width < 1 ||
    stamp.height < 1 ||
    stamp.rows.length !== stamp.height ||
    x + stamp.width > level.rows[0]!.length ||
    y + stamp.height > level.rows.length ||
    stamp.rows.some(
      (row) =>
        row.length !== stamp.width ||
        [...row].some((ch) => !MAKER_TILES.has(ch)),
    )
  )
    throw new Error('Copied region does not fit the course')
  return modifyMakerLevel(level, (grid) => {
    const movesStart = stamp.rows.some((row) => row.includes('@'))
    const movesGoal = stamp.rows.some((row) => row.includes('G'))
    if (movesStart || movesGoal)
      for (const row of grid)
        for (let cx = 0; cx < row.length; cx++)
          if ((movesStart && row[cx] === '@') || (movesGoal && row[cx] === 'G'))
            row[cx] = '.'
    for (let dy = 0; dy < stamp.height; dy++)
      for (let dx = 0; dx < stamp.width; dx++)
        grid[y + dy]![x + dx] = stamp.rows[dy]![dx]!
  })
}

export function makerTemplate(template: MakerTemplate): MakerLevel {
  const fresh = newMakerLevel()
  const grid = fresh.rows.map((row) => row.split(''))
  const put = (x: number, y: number, symbol: string) => {
    grid[y]![x] = symbol
  }
  if (template === 'harbor') {
    for (let y = 21; y < 24; y++) for (let x = 20; x <= 27; x++) put(x, y, 'w')
    for (let x = 18; x <= 30; x += 3) put(x, 18, '=')
    put(22, 16, 'F')
    put(30, 20, 'k')
    put(33, 19, 'K')
    for (let x = 8; x < 18; x += 2) put(x, 17, 'o')
  } else if (template === 'snowfield') {
    for (let y = 22; y < 24; y++) for (let x = 0; x < 64; x++) put(x, y, 'f')
    for (let x = 14; x < 32; x += 4) put(x, 17, '=')
    for (let x = 34; x < 40; x++) {
      put(x, 22, 'd')
      put(x, 23, '.')
    }
    put(18, 13, 'e')
    put(23, 20, 'b')
    put(49, 20, 'q')
    put(28, 20, 'h')
    put(40, 20, 'N')
    put(33, 20, 'K')
    put(17, 20, 's')
    for (let x = 10; x < 47; x += 5) put(x, 14, 'o')
  } else if (template === 'skybridge') {
    for (let x = 17; x < 44; x++) {
      put(x, 22, '.')
      put(x, 23, '.')
    }
    for (let x = 15; x < 46; x += 3) put(x, 19, '=')
    put(18, 18, 'L')
    put(31, 18, 'P')
    put(44, 20, 'K')
    put(35, 17, 'y')
    for (let x = 18; x < 45; x += 4) put(x, 15, 'o')
  } else throw new Error('Unknown starter layout')
  return validateMakerLevel({
    ...fresh,
    title:
      template === 'harbor'
        ? 'Tideglass Crossing'
        : template === 'snowfield'
          ? 'Frostglass Run'
          : 'Cloudrail Leap',
    theme: template === 'harbor' ? 2 : template === 'snowfield' ? 5 : 5,
    ...(template === 'snowfield' ? { snow: true } : {}),
    rows: grid.map((row) => row.join('')),
  })
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
