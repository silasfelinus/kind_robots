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

/**
 * Act III's painted craft, ready before the stage spawns them: E09 Clawstrike Shrimp, E10 Pistol Shrimp
 * Shuttle and E11 Angler Decoy (round-17 Kontext 247709, 247711, 247713).
 */
export const RAINBOW_ACT_THREE_ENEMY_SPRITES = [
  'clawstrike',
  'pistol',
  'angler',
] as const

export function rainbowEnemySprite(kind: string): string | null {
  return [...RAINBOW_ENEMY_SPRITES, ...RAINBOW_ACT_THREE_ENEMY_SPRITES].some(
    (name) => name === kind,
  )
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

/**
 * Calm, damaged (phase 2) and enraged (phase 3) pictures: B01 Pearl Seahorse and B02 Aurelia Array, which fly
 * today, and B03 Clawburst for Act III (round-18 Kontext 247730, round-20 phases 247765 and 247768).
 */
export const RAINBOW_BOSS_SPRITES = ['b01', 'b02', 'b03'] as const
export type RainbowBossKey = (typeof RAINBOW_BOSS_SPRITES)[number]

export function rainbowBossSprite(boss: RainbowBossKey, phase: number): string {
  const step = Math.min(3, Math.max(1, Math.round(phase)))
  return `${RAINBOW_GAME_ART_ROOT}/bosses/${boss}-phase${step}.webp`
}

/**
 * Draw the boss's phase picture centred on (x, y) at the given width, facing left. All three phases are
 * requested on the first draw, so a phase change rarely waits; until it has loaded the phase-1 picture
 * stands in. False when nothing has loaded yet, so the engine keeps its vector body.
 */
export function drawRainbowBossSprite(
  g: CanvasRenderingContext2D,
  boss: RainbowBossKey,
  phase: number,
  x: number,
  y: number,
  width: number,
): boolean {
  const pictures = [1, 2, 3].map((step) =>
    loadedImage(rainbowBossSprite(boss, step)),
  )
  const step = Math.min(3, Math.max(1, Math.round(phase)))
  const img = pictures[step - 1] ?? pictures[0]
  if (!img) return false
  const height = (width * img.naturalHeight) / img.naturalWidth
  g.drawImage(img, x - width / 2, y - height / 2, width, height)
  return true
}

/** Super cut-in banners (round-14 Kontext), one per pilot seat, cropped to 2.9:1 around face and power. */
export const RAINBOW_CUTIN_PILOTS = [
  'maribel',
  'azure',
  'solenne',
  'vivi',
] as const

export function rainbowSuperCutin(seat: number): string {
  const key = RAINBOW_CUTIN_PILOTS[seat % RAINBOW_CUTIN_PILOTS.length]!
  return `${RAINBOW_GAME_ART_ROOT}/cutins/${key}.webp`
}

/** Draw the seat's cut-in banner at (x, y) with the given height; returns its width, or 0 while loading. */
export function drawRainbowSuperCutin(
  g: CanvasRenderingContext2D,
  seat: number,
  x: number,
  y: number,
  height: number,
): number {
  const img = loadedImage(rainbowSuperCutin(seat))
  if (!img) return 0
  const width = (height * img.naturalWidth) / img.naturalHeight
  g.drawImage(img, x, y, width, height)
  return width
}

/**
 * Keyed foreground strips for all eight stages, each saved as the strip followed by its mirror so the tile
 * loops without a seam: S01/S02 coral from round-14 Kontext 247628 and 247630, and S03-S08 restyled from
 * that S01 strip in round 20 (247770, 247785, 247787, 247790, 247791, 247793). Only S01 and S02 fly today.
 */
export const RAINBOW_STAGE_STRIPS = [
  's01',
  's02',
  's03',
  's04',
  's05',
  's06',
  's07',
  's08',
] as const
export type RainbowStageStrip = (typeof RAINBOW_STAGE_STRIPS)[number]

export function rainbowStageStrip(stage: RainbowStageStrip): string {
  return `${RAINBOW_GAME_ART_ROOT}/stages/${stage}-fore.webp`
}

/** Tile the stage's strip across the playfield at (0, y), scrolled left by `scroll` logical pixels. */
export function drawRainbowStageStrip(
  g: CanvasRenderingContext2D,
  stage: RainbowStageStrip,
  scroll: number,
  y: number,
  height: number,
  width = 480,
): boolean {
  const img = loadedImage(rainbowStageStrip(stage))
  if (!img) return false
  const tile = (height * img.naturalWidth) / img.naturalHeight
  for (let x = -(((scroll % tile) + tile) % tile); x < width; x += tile) {
    g.drawImage(img, x, y, tile, height)
  }
  return true
}

/** Painted Act title cards (round-15/16 Kontext), shown as the Act intro splash. */
export function rainbowStageCard(stage: RainbowStageStrip): string {
  return `${RAINBOW_GAME_ART_ROOT}/stages/${stage}-card.webp`
}

/** Draw the stage's title card at (x, y) with the given width; returns its height, or 0 while loading. */
export function drawRainbowStageCard(
  g: CanvasRenderingContext2D,
  stage: RainbowStageStrip,
  x: number,
  y: number,
  width: number,
): number {
  const img = loadedImage(rainbowStageCard(stage))
  if (!img) return 0
  const height = (width * img.naturalHeight) / img.naturalWidth
  g.drawImage(img, x, y, width, height)
  return height
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
