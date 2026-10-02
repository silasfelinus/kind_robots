// How many pieces of art the gallery frame shows at once and which tile shape
// it favours. Pure helpers (no Nuxt runtime) so plain-node tests can cover the
// clamping, persistence envelope, which entries a window shows, and how the
// grid is laid out; the store owns when they run.
export type ButterflyGalleryOrientation = 'landscape' | 'portrait'

export type ButterflyGalleryViewSettings = {
  count: number
  orientation: ButterflyGalleryOrientation
}

export const BUTTERFLY_VIEW_MIN = 1
export const BUTTERFLY_VIEW_MAX = 20

export const BUTTERFLY_VIEW_SETTINGS_KEY =
  'kind-robots:butterfly-gallery:view-settings:v1'

const TILE_ASPECT: Record<ButterflyGalleryOrientation, number> = {
  landscape: 4 / 3,
  portrait: 3 / 4,
}

export function defaultButterflyViewSettings(): ButterflyGalleryViewSettings {
  return { count: 1, orientation: 'landscape' }
}

export function clampButterflyViewCount(value: unknown): number {
  const parsed = Math.round(Number(value))
  if (!Number.isFinite(parsed)) return BUTTERFLY_VIEW_MIN
  return Math.min(BUTTERFLY_VIEW_MAX, Math.max(BUTTERFLY_VIEW_MIN, parsed))
}

function isOrientation(value: unknown): value is ButterflyGalleryOrientation {
  return value === 'landscape' || value === 'portrait'
}

export function parseButterflyViewSettings(
  raw: string | null,
): ButterflyGalleryViewSettings | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Record<string, unknown>
    return {
      count: clampButterflyViewCount(record.count),
      orientation: isOrientation(record.orientation)
        ? record.orientation
        : 'landscape',
    }
  } catch {
    return null
  }
}

export function loadButterflyViewSettings(
  storage: Pick<Storage, 'getItem'>,
): ButterflyGalleryViewSettings | null {
  return parseButterflyViewSettings(
    storage.getItem(BUTTERFLY_VIEW_SETTINGS_KEY),
  )
}

export function saveButterflyViewSettings(
  storage: Pick<Storage, 'setItem'>,
  settings: ButterflyGalleryViewSettings,
): void {
  storage.setItem(BUTTERFLY_VIEW_SETTINGS_KEY, JSON.stringify(settings))
}

/** The window of `count` entries to show. Starts at the top of the queue, and
 * slides forward only as far as needed to keep the selected entry visible, so
 * keyboard and pile selection never pick something the grid isn't showing. */
export function pickButterflyDisplayEntries<T extends { id: number }>(
  entries: T[],
  selectedId: number | null,
  count: number,
): T[] {
  const size = clampButterflyViewCount(count)
  const selectedIndex =
    selectedId === null
      ? -1
      : entries.findIndex((entry) => entry.id === selectedId)
  const start = selectedIndex >= size ? selectedIndex - size + 1 : 0
  return entries.slice(start, start + size)
}

/** Column count whose cells land closest to the preferred tile shape inside a
 * frame of the given width/height ratio. */
export function butterflyGridColumns(
  count: number,
  orientation: ButterflyGalleryOrientation,
  frameAspect: number,
): number {
  const tiles = clampButterflyViewCount(count)
  if (tiles === 1) return 1
  const frame =
    Number.isFinite(frameAspect) && frameAspect > 0 ? frameAspect : 1.5
  const target = TILE_ASPECT[orientation]
  let best = 1
  let bestScore = Infinity
  for (let columns = 1; columns <= tiles; columns += 1) {
    const rows = Math.ceil(tiles / columns)
    const cellAspect = (frame * rows) / columns
    const score = Math.abs(Math.log(cellAspect / target))
    if (score < bestScore - 1e-9) {
      best = columns
      bestScore = score
    }
  }
  return best
}
