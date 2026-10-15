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

/** Draw the seat's ship centred on the origin, nose to the right; false while the sprite is loading. */
export function drawRainbowShipSprite(
  g: CanvasRenderingContext2D,
  seat: number,
  width = 40,
): boolean {
  const img = loadedImage(rainbowShipSprite(seat))
  if (!img) return false
  const height = (width * img.naturalHeight) / img.naturalWidth
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
