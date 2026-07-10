// /stores/helpers/coloring.ts
//
// Shared coloring-engine types and storage helpers, extracted per
// conductor projects/coloring-book/docs/coloring-engine-spec.md.
// Consumed by coloringStore + ColoringCanvas (coloring-book app) and,
// after migration, by the mural color studio wrapper.

export interface ColoringColor {
  id: string
  name: string
  value: string
  /** Not removable/editable (e.g. line black, mural environment colors). */
  locked?: boolean
}

export interface ColoringRegion {
  id: string
  label?: string
  /** Group-fill bucket; regions without a group form no group. */
  group?: string
  /** Starting fill; 'blank' means paper/white. */
  defaultColorId?: string
  /** SVG path data (svg-regions mode). */
  d: string
}

export interface ColoringPageLayers {
  /** Asset path drawn beneath fills (e.g. mural's locked colored environment). */
  underlay?: string
  /** Asset path drawn ABOVE fills (crisp black outlines). */
  lineArt?: string
  /** Inline SVG path data stroked above fills (decorative strokes). */
  decor?: string
}

export interface ColoringPageDefinition {
  /** Globally unique: '<setSlug>/<pageId>' or 'mural/fence-v1'. */
  id: string
  version: 1
  title?: string
  viewBox: { width: number; height: number }
  /** Final v1 pipeline choice comes from coloring-book t-004. */
  mode: 'svg-regions' | 'raster-flood'
  layers: ColoringPageLayers
  /** svg-regions mode. */
  regions?: ColoringRegion[]
  /** raster-flood mode: white-regions bitmap the canvas floods. */
  fillBase?: string
  /** raster-flood mode: optional indexed-region PNG for stable region ids. */
  regionMap?: string
  palette: ColoringColor[]
}

/** Raster-flood mode: one replayable fill action in image coordinates. */
export interface ColoringFillOp {
  x: number
  y: number
  colorId: string
}

export interface ColoringSetPageRef {
  id: string
  title: string
  thumb?: string
  file: string
}

export interface ColoringSetManifest {
  slug: string
  title: string
  description?: string
  cover?: string
  rating?: string
  pages: ColoringSetPageRef[]
  attribution?: Array<{ pageId: string; source: string; note?: string }>
  /** Economy detail deferred to coloring-book t-008; reserved field. */
  access?: { tier: 'free' | 'purchase'; sku?: string }
}

/** The paper/no-fill sentinel color id. */
export const BLANK_COLOR_ID = 'blank'
export const BLANK_COLOR_VALUE = '#ffffff'

export const COLORING_STORAGE_PREFIX = 'kindRobots:coloring:'
export const COLORING_INDEX_KEY = 'kindRobots:coloring:index'

export const isColoringClient = typeof window !== 'undefined'

export function coloringStorageKey(pageId: string): string {
  return `${COLORING_STORAGE_PREFIX}${pageId}`
}

export function safeReadJson<T>(key: string): T | null {
  if (!isColoringClient) return null

  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as T) : null
  } catch {
    return null
  }
}

export function safeWriteJson(key: string, payload: unknown): void {
  if (!isColoringClient) return

  try {
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // Quota/private-mode failures are non-fatal; coloring continues unsaved.
  }
}

export function normalizeColorValue(value: string): string {
  const trimmed = value.trim()
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : BLANK_COLOR_VALUE
}

export function makeColorId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'saved-color'

  return `${slug}-${Date.now().toString(36)}`
}
