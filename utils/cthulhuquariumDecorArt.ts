// utils/cthulhuquariumDecorArt.ts
//
// The painted tank decorations and the Roaming Collector (conductor
// cthulhuquarium/t-110), drawn on the tank canvas and in the Relics shop in
// place of the emoji the tank used until they were painted. Canon ui/ui.yaml
// renders them as cut-outs (`decor-<kind>`, `swimmer-collector`); until a file
// exists the glyph from cthulhuquariumStage.ts still stands in, so nothing ever
// draws blank.

import { decorIcon } from './cthulhuquariumStage'

const modules = import.meta.glob<string>(
  '../assets/images/cthulhuquarium/ui/{decor-*,swimmer-*}.webp',
  { eager: true, query: '?url', import: 'default' },
)

const byName: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const stem = path
    .split('/')
    .pop()
    ?.replace(/\.webp$/, '')
  if (stem) byName[stem] = url
}

/** `pebble_bed` -> the painted `decor-pebble-bed` cut-out, or null. */
export function decorArt(kind: string | null | undefined): string | null {
  if (!kind) return null
  return byName[`decor-${kind.replace(/_/g, '-')}`] ?? null
}

/** The Roaming Collector's cut-out, or null. */
export function collectorArt(): string | null {
  return byName['swimmer-collector'] ?? null
}

const images = new Map<string, HTMLImageElement>()

function loaded(url: string | null): HTMLImageElement | null {
  if (!url || typeof Image === 'undefined') return null
  let image = images.get(url)
  if (!image) {
    image = new Image()
    image.src = url
    images.set(url, image)
  }
  return image.complete && image.naturalWidth > 0 ? image : null
}

/** Draw a decoration standing on its point (`x`, `y`), `height` stage px tall. */
export function drawCthulhuquariumDecor(
  context: CanvasRenderingContext2D,
  kind: string,
  x: number,
  y: number,
  height = 46,
): void {
  const image = loaded(decorArt(kind))
  if (image) {
    const width = (image.naturalWidth / image.naturalHeight) * height
    context.drawImage(image, x - width / 2, y - height * 0.62, width, height)
    return
  }
  context.font = '28px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(decorIcon(kind), x, y)
}

/** Draw the Roaming Collector centred on (0, 0), facing its direction of travel. */
export function drawCthulhuquariumCollector(
  context: CanvasRenderingContext2D,
  facing: 1 | -1,
  height = 30,
): void {
  const image = loaded(collectorArt())
  if (image) {
    const width = (image.naturalWidth / image.naturalHeight) * height
    context.save()
    context.scale(facing, 1)
    context.drawImage(image, -width / 2, -height / 2, width, height)
    context.restore()
    return
  }
  context.font = '22px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('🤖', 0, 0)
}
