import { loadedImage } from '../ghostTrail/bake'

/**
 * Painted art for the Rainbow Space Princess cabinet (Conductor rainbow t-022). Every image is optional:
 * until it has loaded, the engine keeps drawing its vector stand-in, so art never gates play and the
 * collision core never changes with the picture.
 */
export const RAINBOW_GAME_ART_ROOT = '/rainbow-princess-art'

export const RAINBOW_SHIP_SPRITES = [
  'petal-wing',
  'prism-lance',
  'halo-fin',
  'comet-crown',
] as const

export const RAINBOW_COMMS_SPEAKERS = {
  'Lilt-7': 'lilt',
  Maribel: 'maribel',
  Azure: 'azure',
  Solenne: 'solenne',
  Vivi: 'vivi',
  Purl: 'purl',
  Opal: 'opal',
  Nemi: 'nemi',
} as const

export type RainbowCommsKey =
  (typeof RAINBOW_COMMS_SPEAKERS)[keyof typeof RAINBOW_COMMS_SPEAKERS]

export function rainbowShipSprite(seat: number): string {
  const key = RAINBOW_SHIP_SPRITES[seat % RAINBOW_SHIP_SPRITES.length]!
  return `${RAINBOW_GAME_ART_ROOT}/ships/${key}.webp`
}

export function rainbowCommsKey(speaker: string): RainbowCommsKey | null {
  const first = speaker.trim().split(/\s+/)[0] ?? ''
  return (
    (RAINBOW_COMMS_SPEAKERS as Record<string, RainbowCommsKey>)[speaker] ??
    (RAINBOW_COMMS_SPEAKERS as Record<string, RainbowCommsKey>)[first] ??
    null
  )
}

export function rainbowCommsPortrait(speaker: string): string | null {
  const key = rainbowCommsKey(speaker)
  return key ? `${RAINBOW_GAME_ART_ROOT}/comms/${key}.webp` : null
}

/**
 * Draw the seat's ship centred on the origin, nose to the right; false while the sprite is loading. Ships
 * are sized to a common area, so a long, slim jet and a stubby delta read as the same weight on screen.
 */
export function drawRainbowShipSprite(
  g: CanvasRenderingContext2D,
  seat: number,
  area = 960,
): boolean {
  return drawFitted(g, rainbowShipSprite(seat), area, 34, 56)
}

/** The engine's enemy kinds, E01-E08 in the design doc, each with a round-9 sprite. */
export const RAINBOW_ENEMY_SPRITES = [
  'picket',
  'spiral',
  'anchor',
  'urchin',
  'lantern',
  'relay',
  'skimmer',
  'coral',
] as const

export function rainbowEnemySprite(kind: string): string | null {
  return (RAINBOW_ENEMY_SPRITES as readonly string[]).includes(kind)
    ? `${RAINBOW_GAME_ART_ROOT}/enemies/${kind}.webp`
    : null
}

/**
 * Draw an enemy centred on the origin, facing left; false when the kind has no sprite or it is loading.
 * The default area keeps the picture close to the 28x26 box player shots hit.
 */
export function drawRainbowEnemySprite(
  g: CanvasRenderingContext2D,
  kind: string,
  area = 1000,
): boolean {
  const src = rainbowEnemySprite(kind)
  return src ? drawFitted(g, src, area, 24, 46) : false
}

/** The engine's three pickups, painted from the U01 gem, U06 bubble shield and U08 star charms. */
export const RAINBOW_PICKUP_SPRITES = ['power', 'shield', 'charge'] as const

export function rainbowPickupSprite(kind: string): string | null {
  return (RAINBOW_PICKUP_SPRITES as readonly string[]).includes(kind)
    ? `${RAINBOW_GAME_ART_ROOT}/pickups/${kind}.webp`
    : null
}

/** Draw a pickup centred on (x, y) inside a size-by-size box; false when it has no sprite or is loading. */
export function drawRainbowPickupSprite(
  g: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  size = 22,
): boolean {
  const src = rainbowPickupSprite(kind)
  const img = src ? loadedImage(src) : null
  if (!img) return false
  const scale = size / Math.max(img.naturalWidth, img.naturalHeight)
  const width = img.naturalWidth * scale
  const height = img.naturalHeight * scale
  g.drawImage(img, x - width / 2, y - height / 2, width, height)
  return true
}

function drawFitted(
  g: CanvasRenderingContext2D,
  src: string,
  area: number,
  minWidth: number,
  maxWidth: number,
): boolean {
  const img = loadedImage(src)
  if (!img) return false
  const aspect = img.naturalWidth / img.naturalHeight
  const width = Math.min(maxWidth, Math.max(minWidth, Math.sqrt(area * aspect)))
  const height = width / aspect
  g.drawImage(img, -width / 2, -height / 2, width, height)
  return true
}

/** Draw the speaker's comms portrait into a square; false when there is none or it is loading. */
export function drawRainbowCommsPortrait(
  g: CanvasRenderingContext2D,
  speaker: string,
  x: number,
  y: number,
  size: number,
): boolean {
  const src = rainbowCommsPortrait(speaker)
  const img = src ? loadedImage(src) : null
  if (!img) return false
  g.drawImage(img, x, y, size, size)
  return true
}
