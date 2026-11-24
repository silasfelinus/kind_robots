// /utils/arcade/games/rainbowDetourPlanes.ts
//
// Rainbow Bullet Hell Space Princess, conductor rainbow t-028 (GEN2-ROUND-2): the four detour Acts' own painted
// skies and keyed far/mid/near bands, flown in place of the origin Act's painted strips while a detour plays.
// Reviewed 2026-11-23 PT: every plane is a Krea 2 render. X2's mid (a field of skull-faced asteroids) and X4's mid
// (leaping fish, beside a fish guardian) were refused because moving creatures in a backdrop read as enemies.
// The layers sit over the dark code-drawn backdrop at partial strength, so pastel craft and haloed pellets read.
import { rainbowLoadedArt, rainbowStageTileLayout } from './rainbowGameArt'

export type RainbowDetour = 'x1' | 'x2' | 'x3' | 'x4'
export type RainbowDetourDepth = 'far' | 'mid' | 'near'

type Band = {
  depth: RainbowDetourDepth
  height: number
  speed: number
  alpha: number
}

const BANDS: Readonly<Record<RainbowDetourDepth, Omit<Band, 'depth'>>> = {
  far: { height: 120, speed: 0.12, alpha: 0.5 },
  mid: { height: 92, speed: 0.3, alpha: 0.62 },
  near: { height: 64, speed: 0.6, alpha: 0.78 },
}

/** Each detour's painted layers, back to front, and how strongly its sky shows over the dark base. */
export const RAINBOW_DETOUR_PLANES: Readonly<
  Record<RainbowDetour, { sky: number; bands: readonly RainbowDetourDepth[] }>
> = {
  x1: { sky: 0.55, bands: ['far', 'mid', 'near'] },
  x2: { sky: 0.42, bands: ['far', 'near'] },
  x3: { sky: 0.55, bands: ['far', 'mid', 'near'] },
  x4: { sky: 0.4, bands: ['far', 'near'] },
}

export function rainbowDetourPlanePath(
  detour: RainbowDetour,
  layer: 'sky' | RainbowDetourDepth,
): string {
  return `alt/${detour}-${layer}`
}

/** Every painted file the detours fly, for the art checks. */
export function rainbowDetourPlanePaths(): string[] {
  return (Object.keys(RAINBOW_DETOUR_PLANES) as RainbowDetour[]).flatMap(
    (detour) => [
      rainbowDetourPlanePath(detour, 'sky'),
      ...RAINBOW_DETOUR_PLANES[detour].bands.map((depth) =>
        rainbowDetourPlanePath(detour, depth),
      ),
    ],
  )
}

/**
 * The sky drifts too, slowest of every layer (presentation review P-04: the top half of X3 moved 0 px). A detour
 * sky holds one landmark (X3's moon), so rather than tile it (which would show a mirrored second moon) the sky is
 * drawn a little larger than the field and pans slowly back and forth across that margin.
 */
export const RAINBOW_DETOUR_SKY_PAN = { overscan: 1.2, period: 4800 } as const

/** How far left of the field's edge the oversized sky sits this frame, 0 to (overscan - 1) x width. */
export function rainbowDetourSkyOffset(
  frame: number,
  drift: number,
  width = 480,
): number {
  const { overscan, period } = RAINBOW_DETOUR_SKY_PAN
  const turn = ((frame * drift) / period) * Math.PI * 2
  return ((overscan - 1) * width * (1 - Math.cos(turn))) / 2
}

/** Tile `img` across the width at (scroll, y), `height` tall, mirroring every other tile. */
function drawMirroredTiles(
  g: CanvasRenderingContext2D,
  img: HTMLImageElement,
  scroll: number,
  y: number,
  height: number,
  width: number,
) {
  const tile = (height * img.naturalWidth) / img.naturalHeight
  for (const { x, mirrored } of rainbowStageTileLayout(scroll, tile, width)) {
    if (mirrored) {
      g.save()
      g.translate(x + tile, 0)
      g.scale(-1, 1)
      g.drawImage(img, 0, y, tile, height)
      g.restore()
    } else g.drawImage(img, x, y, tile, height)
  }
}

/** The bands to draw this frame: where each sits, how far it has scrolled and how strongly it shows. */
export function rainbowDetourBands(
  detour: RainbowDetour,
  frame: number,
  drift: number,
  viewportHeight = 270,
): (Band & { y: number; scroll: number })[] {
  return RAINBOW_DETOUR_PLANES[detour].bands.map((depth) => ({
    depth,
    ...BANDS[depth],
    y: viewportHeight - BANDS[depth].height,
    scroll: frame * drift * BANDS[depth].speed,
  }))
}

/**
 * Draw the detour's sky and bands over whatever backdrop is already down; false while the sky is still loading.
 * A band that has not loaded yet is skipped, so the code-drawn backdrop shows through.
 */
export function drawRainbowDetourPlanes(
  g: CanvasRenderingContext2D,
  detour: RainbowDetour,
  frame: number,
  drift: number,
  width = 480,
  height = 270,
): boolean {
  const sky = rainbowLoadedArt(rainbowDetourPlanePath(detour, 'sky'))
  if (!sky || sky.naturalHeight <= 0) return false
  g.save()
  g.globalAlpha = RAINBOW_DETOUR_PLANES[detour].sky
  const { overscan } = RAINBOW_DETOUR_SKY_PAN
  g.drawImage(
    sky,
    -rainbowDetourSkyOffset(frame, drift, width),
    (-(overscan - 1) * height) / 2,
    width * overscan,
    height * overscan,
  )
  for (const band of rainbowDetourBands(detour, frame, drift, height)) {
    const img = rainbowLoadedArt(rainbowDetourPlanePath(detour, band.depth))
    if (!img || img.naturalHeight <= 0) continue
    g.globalAlpha = band.alpha
    drawMirroredTiles(g, img, band.scroll, band.y, band.height, width)
  }
  g.restore()
  return true
}
