// /stores/coloringStore.ts
//
// Page-keyed coloring state per the shared-engine contract in conductor
// projects/coloring-book/docs/coloring-engine-spec.md (section 2.3/2.4).
// The ColoringCanvas component is controlled: it renders this store's
// fills and emits intents; all mutation, undo, and persistence live here.
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  BLANK_COLOR_ID,
  COLORING_INDEX_KEY,
  coloringStorageKey,
  isColoringClient,
  makeColorId,
  normalizeColorValue,
  safeReadJson,
  safeWriteJson,
} from '@/stores/helpers/coloring'
import type {
  ColoringColor,
  ColoringPageDefinition,
} from '@/stores/helpers/coloring'

interface UndoEntry {
  fills: Record<string, string>
}

interface PageColoringState {
  fills: Record<string, string>
  customColors: ColoringColor[]
  activeColorId: string
  selectedRegionIds: string[]
  undoStack: UndoEntry[]
  updatedAt: string
}

interface PersistedPageState {
  fills?: Record<string, string>
  customColors?: ColoringColor[]
  activeColorId?: string
  updatedAt?: string
}

interface ColoringIndex {
  pageIds: string[]
  updatedAt: string
}

const UNDO_LIMIT = 50

function defaultFills(def: ColoringPageDefinition): Record<string, string> {
  const fills: Record<string, string> = {}

  for (const region of def.regions ?? []) {
    fills[region.id] = region.defaultColorId ?? BLANK_COLOR_ID
  }

  return fills
}

export const useColoringStore = defineStore('coloringStore', () => {
  const pages = ref<Record<string, PageColoringState>>({})
  const definitions = ref<Record<string, ColoringPageDefinition>>({})
  const currentPageId = ref<string | null>(null)

  const currentDefinition = computed<ColoringPageDefinition | null>(() => {
    if (!currentPageId.value) return null
    return definitions.value[currentPageId.value] ?? null
  })

  const currentPage = computed<PageColoringState | null>(() => {
    if (!currentPageId.value) return null
    return pages.value[currentPageId.value] ?? null
  })

  const currentPalette = computed<ColoringColor[]>(() => {
    const def = currentDefinition.value
    const state = currentPage.value
    if (!def) return []

    return [...def.palette, ...(state?.customColors ?? [])]
  })

  const currentColorMap = computed(() => {
    return new Map(currentPalette.value.map((color) => [color.id, color]))
  })

  const inProgressPageIds = computed<string[]>(() => {
    const index = safeReadJson<ColoringIndex>(COLORING_INDEX_KEY)
    return index?.pageIds ?? []
  })

  function resolveColorValue(colorId: string): string {
    if (colorId === BLANK_COLOR_ID) return '#ffffff'
    return currentColorMap.value.get(colorId)?.value ?? '#ffffff'
  }

  function touchIndex(pageId: string) {
    const index = safeReadJson<ColoringIndex>(COLORING_INDEX_KEY) ?? {
      pageIds: [],
      updatedAt: '',
    }

    if (!index.pageIds.includes(pageId)) {
      index.pageIds = [...index.pageIds, pageId]
    }

    index.updatedAt = new Date().toISOString()
    safeWriteJson(COLORING_INDEX_KEY, index)
  }

  function persistPage(pageId: string) {
    const state = pages.value[pageId]
    const def = definitions.value[pageId]
    if (!state || !def || !isColoringClient) return

    // Persist only the diff from the definition's defaults.
    const base = defaultFills(def)
    const fillsDiff: Record<string, string> = {}

    for (const [regionId, colorId] of Object.entries(state.fills)) {
      if (base[regionId] !== colorId) {
        fillsDiff[regionId] = colorId
      }
    }

    const payload: PersistedPageState = {
      fills: fillsDiff,
      customColors: state.customColors,
      activeColorId: state.activeColorId,
      updatedAt: state.updatedAt,
    }

    safeWriteJson(coloringStorageKey(pageId), payload)
    touchIndex(pageId)
  }

  function openPage(def: ColoringPageDefinition) {
    definitions.value = { ...definitions.value, [def.id]: def }

    if (!pages.value[def.id]) {
      const fills = defaultFills(def)
      const stored = safeReadJson<PersistedPageState>(
        coloringStorageKey(def.id),
      )

      // Merge semantics: stored fills apply only where the region still
      // exists; unknown color ids fall back to the region default.
      if (stored?.fills) {
        const knownColorIds = new Set([
          BLANK_COLOR_ID,
          ...def.palette.map((color) => color.id),
          ...(stored.customColors ?? []).map((color) => color.id),
        ])

        for (const [regionId, colorId] of Object.entries(stored.fills)) {
          if (regionId in fills && knownColorIds.has(colorId)) {
            fills[regionId] = colorId
          }
        }
      }

      pages.value = {
        ...pages.value,
        [def.id]: {
          fills,
          customColors: stored?.customColors ?? [],
          activeColorId:
            stored?.activeColorId ?? def.palette[0]?.id ?? BLANK_COLOR_ID,
          selectedRegionIds: [],
          undoStack: [],
          updatedAt: stored?.updatedAt ?? new Date().toISOString(),
        },
      }
    }

    currentPageId.value = def.id
  }

  function closePage() {
    currentPageId.value = null
  }

  function pushUndo(state: PageColoringState) {
    state.undoStack = [
      ...state.undoStack.slice(-(UNDO_LIMIT - 1)),
      { fills: { ...state.fills } },
    ]
  }

  function mutateCurrent(mutator: (state: PageColoringState) => void) {
    const pageId = currentPageId.value
    if (!pageId) return

    const state = pages.value[pageId]
    if (!state) return

    mutator(state)
    state.updatedAt = new Date().toISOString()
    pages.value = { ...pages.value, [pageId]: { ...state } }
    persistPage(pageId)
  }

  function paintRegion(regionId: string, colorId?: string) {
    mutateCurrent((state) => {
      pushUndo(state)
      state.fills = {
        ...state.fills,
        [regionId]: colorId ?? state.activeColorId,
      }
    })
  }

  function paintGroup(group: string, colorId?: string) {
    const def = currentDefinition.value
    if (!def) return

    const members = (def.regions ?? []).filter(
      (region) => region.group === group,
    )
    if (!members.length) return

    mutateCurrent((state) => {
      pushUndo(state)
      const nextFills = { ...state.fills }

      for (const region of members) {
        nextFills[region.id] = colorId ?? state.activeColorId
      }

      state.fills = nextFills
    })
  }

  function setActiveColor(colorId: string) {
    mutateCurrent((state) => {
      state.activeColorId = colorId
    })
  }

  function selectRegion(regionId: string | null) {
    mutateCurrent((state) => {
      state.selectedRegionIds = regionId ? [regionId] : []
    })
  }

  function addColor(name: string, value: string): string {
    const color: ColoringColor = {
      id: makeColorId(name),
      name: name.trim() || 'Saved Color',
      value: normalizeColorValue(value),
    }

    mutateCurrent((state) => {
      state.customColors = [...state.customColors, color]
      state.activeColorId = color.id
    })

    return color.id
  }

  function removeColor(colorId: string) {
    mutateCurrent((state) => {
      const target = state.customColors.find((color) => color.id === colorId)
      if (!target || target.locked) return

      pushUndo(state)
      state.customColors = state.customColors.filter(
        (color) => color.id !== colorId,
      )

      const nextFills = { ...state.fills }
      for (const [regionId, fillId] of Object.entries(nextFills)) {
        if (fillId === colorId) nextFills[regionId] = BLANK_COLOR_ID
      }
      state.fills = nextFills

      if (state.activeColorId === colorId) {
        state.activeColorId =
          currentDefinition.value?.palette[0]?.id ?? BLANK_COLOR_ID
      }
    })
  }

  function editColor(colorId: string, value: string) {
    mutateCurrent((state) => {
      state.customColors = state.customColors.map((color) => {
        if (color.id !== colorId || color.locked) return color
        return { ...color, value: normalizeColorValue(value) }
      })
    })
  }

  /** Global swap: every region filled with A becomes B and vice versa. */
  function swapColors(aId: string, bId: string) {
    mutateCurrent((state) => {
      pushUndo(state)
      const nextFills = { ...state.fills }

      for (const [regionId, fillId] of Object.entries(nextFills)) {
        if (fillId === aId) nextFills[regionId] = bId
        else if (fillId === bId) nextFills[regionId] = aId
      }

      state.fills = nextFills
    })
  }

  function undo() {
    mutateCurrent((state) => {
      const last = state.undoStack[state.undoStack.length - 1]
      if (!last) return

      state.undoStack = state.undoStack.slice(0, -1)
      state.fills = last.fills
    })
  }

  function resetPage() {
    const def = currentDefinition.value
    if (!def) return

    mutateCurrent((state) => {
      pushUndo(state)
      state.fills = defaultFills(def)
    })
  }

  /** Assignment JSON: regionId -> colorId plus the palette (paint-spec export). */
  function exportAssignments(): string {
    const def = currentDefinition.value
    const state = currentPage.value
    if (!def || !state) return '{}'

    return JSON.stringify(
      {
        pageId: def.id,
        exportedAt: new Date().toISOString(),
        fills: state.fills,
        palette: [...def.palette, ...state.customColors],
      },
      null,
      2,
    )
  }

  function importAssignments(raw: string): boolean {
    const def = currentDefinition.value
    if (!def) return false

    try {
      const parsed = JSON.parse(raw) as {
        fills?: Record<string, string>
        palette?: ColoringColor[]
      }

      if (!parsed.fills) return false

      mutateCurrent((state) => {
        pushUndo(state)

        const importedCustom = (parsed.palette ?? []).filter((color) => {
          return !def.palette.some((base) => base.id === color.id)
        })

        state.customColors = importedCustom.map((color) => ({
          ...color,
          value: normalizeColorValue(color.value),
        }))

        const knownColorIds = new Set([
          BLANK_COLOR_ID,
          ...def.palette.map((color) => color.id),
          ...state.customColors.map((color) => color.id),
        ])

        const nextFills = defaultFills(def)
        for (const [regionId, colorId] of Object.entries(parsed.fills!)) {
          if (regionId in nextFills && knownColorIds.has(colorId)) {
            nextFills[regionId] = colorId
          }
        }
        state.fills = nextFills
      })

      return true
    } catch {
      return false
    }
  }

  return {
    pages,
    definitions,
    currentPageId,
    currentDefinition,
    currentPage,
    currentPalette,
    inProgressPageIds,
    resolveColorValue,
    openPage,
    closePage,
    paintRegion,
    paintGroup,
    setActiveColor,
    selectRegion,
    addColor,
    removeColor,
    editColor,
    swapColors,
    undo,
    resetPage,
    exportAssignments,
    importAssignments,
  }
})
