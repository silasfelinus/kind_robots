// /stores/helpers/muralMigration.ts
//
// One-time translation of the legacy mural color-studio state
// (localStorage key 'kindRobotsMuralState') into the shared coloring-engine
// per-page format, per coloring-engine-spec.md section 2.4. The legacy key
// is left in place for one release so rollback stays safe.

import {
  coloringStorageKey,
  isColoringClient,
  normalizeColorValue,
  safeReadJson,
  safeWriteJson,
} from '@/stores/helpers/coloring'
import type {
  ColoringColor,
  ColoringPageDefinition,
} from '@/stores/helpers/coloring'

export const LEGACY_MURAL_STORAGE_KEY = 'kindRobotsMuralState'

/** Minimal shape of the legacy muralStore blob (decoupled from muralStore). */
export interface LegacyMuralState {
  colors?: Array<{ id: string; name: string; value: string }>
  sections?: Array<{ id: string; colorId: string }>
  activeColorId?: string
}

export interface MigratedColoringState {
  fills: Record<string, string>
  customColors: ColoringColor[]
  activeColorId?: string
  updatedAt: string
}

/**
 * Pure translation: legacy blob + page definition → per-page coloring state.
 * Returns null when the legacy blob holds nothing usable. Notes:
 * - fills carry over only for regions that still exist in the definition and
 *   whose color id is known (page palette or migrated custom color).
 * - custom colors are legacy colors whose id is not in the page palette.
 * - legacy deletions of base palette colors are not preserved — the page
 *   palette is authoritative in the shared engine.
 */
export function translateLegacyMuralState(
  legacy: LegacyMuralState | null,
  def: ColoringPageDefinition,
  now: string,
): MigratedColoringState | null {
  if (!legacy || (!legacy.sections?.length && !legacy.colors?.length)) {
    return null
  }

  const paletteIds = new Set(def.palette.map((color) => color.id))

  const customColors: ColoringColor[] = (legacy.colors ?? [])
    .filter((color) => color?.id && !paletteIds.has(color.id))
    .map((color) => ({
      id: color.id,
      name: color.name || 'Saved color',
      value: normalizeColorValue(color.value ?? ''),
    }))

  const knownColorIds = new Set([
    ...paletteIds,
    ...customColors.map((color) => color.id),
  ])

  const regionIds = new Set((def.regions ?? []).map((region) => region.id))
  const fills: Record<string, string> = {}

  for (const section of legacy.sections ?? []) {
    if (
      section?.id &&
      regionIds.has(section.id) &&
      section.colorId &&
      knownColorIds.has(section.colorId)
    ) {
      fills[section.id] = section.colorId
    }
  }

  const activeColorId =
    legacy.activeColorId && knownColorIds.has(legacy.activeColorId)
      ? legacy.activeColorId
      : undefined

  return { fills, customColors, activeColorId, updatedAt: now }
}

/**
 * Browser wrapper: migrate once, only when the new per-page key does not
 * exist yet. Leaves the legacy key untouched.
 */
export function runMuralMigration(def: ColoringPageDefinition): boolean {
  if (!isColoringClient) return false

  const targetKey = coloringStorageKey(def.id)
  if (localStorage.getItem(targetKey) !== null) return false

  const legacy = safeReadJson<LegacyMuralState>(LEGACY_MURAL_STORAGE_KEY)
  const migrated = translateLegacyMuralState(
    legacy,
    def,
    new Date().toISOString(),
  )

  if (!migrated) return false

  safeWriteJson(targetKey, migrated)
  return true
}
