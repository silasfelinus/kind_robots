// /stores/muralStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ColoringPageDefinition } from '@/stores/helpers/coloring'

export interface MuralColor {
  id: string
  name: string
  value: string
}

export interface MuralSection {
  id: string
  label: string
  groupId: string
  colorId: string
  d: string
}

export interface MuralGroup {
  id: string
  label: string
  sectionIds: string[]
  colorId: string
}

const storageKey = 'kindRobotsMuralState'
const isClient = typeof window !== 'undefined'

const defaultColors: MuralColor[] = [
  { id: 'wine-red', name: 'Wine Red', value: '#6f2746' },
  { id: 'leaf-yellow', name: 'Yellow Green', value: '#8aa63f' },
  { id: 'leaf-true', name: 'True Green', value: '#3f7f4a' },
  { id: 'leaf-blue', name: 'Blue Green', value: '#2f7c74' },
  { id: 'catbus-orange', name: 'Catbus Orange', value: '#d87428' },
  { id: 'catbus-brown', name: 'Catbus Brown', value: '#7b4b2a' },
  { id: 'window-teal', name: 'Window Teal', value: '#55a9b5' },
  { id: 'butterfly-purple', name: 'Butterfly Purple', value: '#7d4dc2' },
  { id: 'butterfly-violet', name: 'Butterfly Violet', value: '#a05dc8' },
  { id: 'warm-yellow', name: 'Warm Yellow', value: '#f5c451' },
  { id: 'soft-white', name: 'Soft White', value: '#f0ead9' },
  { id: 'robot-gray', name: 'Robot Gray', value: '#9aa0a6' },
  { id: 'line-black', name: 'Linework Black', value: '#171312' },
]

const defaultSections: MuralSection[] = [
  {
    id: 'background-sky',
    label: 'Wine sky',
    groupId: 'background',
    colorId: 'wine-red',
    d: 'M0 0H960V540H0Z',
  },
  {
    id: 'alien-ground',
    label: 'Alien garden ground',
    groupId: 'foliage',
    colorId: 'leaf-blue',
    d: 'M0 422C95 392 174 420 248 392C330 360 422 392 505 372C619 344 704 377 783 354C861 331 916 354 960 337V540H0Z',
  },
  {
    id: 'ivy-portal',
    label: 'Ivy portal',
    groupId: 'foliage',
    colorId: 'leaf-true',
    d: 'M78 137C125 77 221 82 268 147C306 199 306 276 262 329C218 382 127 382 78 329C26 274 28 198 78 137Z',
  },
  {
    id: 'portal-glow',
    label: 'Portal glow',
    groupId: 'portal',
    colorId: 'leaf-yellow',
    d: 'M110 164C145 119 215 124 247 171C274 211 271 270 237 309C202 349 142 347 108 307C73 266 76 205 110 164Z',
  },
  {
    id: 'totoro-body',
    label: 'Hidden spirit body',
    groupId: 'spirit',
    colorId: 'robot-gray',
    d: 'M151 203C155 162 213 158 224 202C242 207 254 228 249 252C244 287 218 316 184 316C149 316 123 288 118 253C115 229 129 207 151 203Z',
  },
  {
    id: 'totoro-belly',
    label: 'Spirit belly',
    groupId: 'spirit',
    colorId: 'soft-white',
    d: 'M151 257C160 235 210 235 220 257C226 276 211 297 185 299C158 297 145 276 151 257Z',
  },
  {
    id: 'catbus-body',
    label: 'Catbus body',
    groupId: 'catbus',
    colorId: 'catbus-orange',
    d: 'M527 219C584 148 763 143 838 215C890 265 874 341 804 363C713 391 589 374 530 328C495 300 497 257 527 219Z',
  },
  {
    id: 'catbus-roof',
    label: 'Catbus roof stripe',
    groupId: 'catbus',
    colorId: 'catbus-brown',
    d: 'M576 183C640 151 751 159 807 205C751 190 637 186 576 183Z',
  },
  {
    id: 'catbus-face',
    label: 'Catbus face',
    groupId: 'catbus',
    colorId: 'catbus-brown',
    d: 'M804 218C842 234 858 267 848 296C828 279 805 259 774 244C781 231 790 223 804 218Z',
  },
  {
    id: 'catbus-window-1',
    label: 'Window one',
    groupId: 'windows',
    colorId: 'window-teal',
    d: 'M578 215H626C637 215 644 224 642 236L636 281H568L561 236C559 224 567 215 578 215Z',
  },
  {
    id: 'catbus-window-2',
    label: 'Window two',
    groupId: 'windows',
    colorId: 'window-teal',
    d: 'M654 213H701C713 213 721 223 719 236L713 282H646L642 236C640 223 642 213 654 213Z',
  },
  {
    id: 'catbus-window-3',
    label: 'Window three',
    groupId: 'windows',
    colorId: 'window-teal',
    d: 'M730 221H775C789 221 798 232 795 246L786 288H722L717 246C715 232 717 221 730 221Z',
  },
  {
    id: 'catbus-eye-left',
    label: 'Left Catbus eye',
    groupId: 'catbus',
    colorId: 'warm-yellow',
    d: 'M813 252C829 242 845 250 846 265C832 275 817 270 813 252Z',
  },
  {
    id: 'catbus-eye-right',
    label: 'Right Catbus eye',
    groupId: 'catbus',
    colorId: 'warm-yellow',
    d: 'M782 248C797 239 812 246 814 260C802 270 787 266 782 248Z',
  },
  {
    id: 'robot-left',
    label: 'Garden robot left',
    groupId: 'robots',
    colorId: 'robot-gray',
    d: 'M344 322H390V366H344ZM354 296H380V322H354ZM335 339H344V353H335ZM390 339H399V353H390Z',
  },
  {
    id: 'robot-right',
    label: 'Garden robot right',
    groupId: 'robots',
    colorId: 'robot-gray',
    d: 'M436 346H475V387H436ZM446 322H466V346H446ZM426 359H436V373H426ZM475 359H485V373H475Z',
  },
  {
    id: 'butterfly-one',
    label: 'Purple butterfly',
    groupId: 'butterflies',
    colorId: 'butterfly-purple',
    d: 'M348 151C321 122 302 154 326 174C300 197 331 220 352 186C376 220 408 197 379 174C405 151 377 122 348 151Z',
  },
  {
    id: 'butterfly-two',
    label: 'Violet butterfly',
    groupId: 'butterflies',
    colorId: 'butterfly-violet',
    d: 'M676 110C654 85 636 111 656 129C632 150 660 170 680 140C700 170 729 150 705 129C725 111 703 85 676 110Z',
  },
  {
    id: 'butterfly-three',
    label: 'Yellow butterfly',
    groupId: 'butterflies',
    colorId: 'warm-yellow',
    d: 'M478 123C459 103 444 126 461 140C441 158 465 175 482 149C499 175 524 158 503 140C520 126 501 103 478 123Z',
  },
  {
    id: 'soot-sprites',
    label: 'Hidden soot sprites',
    groupId: 'sprites',
    colorId: 'line-black',
    d: 'M289 387C289 374 309 374 309 387C309 400 289 400 289 387ZM873 395C873 382 893 382 893 395C893 408 873 408 873 395ZM405 415C405 403 423 403 423 415C423 427 405 427 405 415Z',
  },
]

interface MuralStoredState {
  colors?: MuralColor[]
  sections?: MuralSection[]
  activeColorId?: string
  selectedSectionId?: string | null
}

// Geometry/palette now live in data (shared coloring-engine page format,
// step 4 of the migration in conductor coloring-book/docs/coloring-engine-spec.md).
// The inline constants above remain as the fallback so /mural keeps working
// if the data file is missing or malformed.
const MURAL_PAGE_URL = '/data/mural-design/mural-page.json'

// Whisker/smile strokes, mirrored from mural-page.json's layers.decor for
// the same-fallback reason as the geometry.
let baseColors: MuralColor[] = defaultColors
let baseSections: MuralSection[] = defaultSections
let baseDecor =
  'M139 211L156 226M215 211L199 226M169 274H201M592 300H777M565 358C576 386 612 386 621 361M677 365C687 392 725 392 734 364M784 358C793 382 829 382 837 357'
let baseLoaded = false

async function hydrateBaseFromPageData(): Promise<void> {
  if (baseLoaded || !isClient) return
  baseLoaded = true

  try {
    const page = await $fetch<ColoringPageDefinition>(MURAL_PAGE_URL)

    if (!page?.regions?.length || !page.palette?.length) return

    baseSections = page.regions.map((region) => ({
      id: region.id,
      label: region.label ?? region.id,
      groupId: region.group ?? 'misc',
      colorId: region.defaultColorId ?? 'soft-white',
      d: region.d,
    }))

    baseColors = page.palette.map((color) => ({
      id: color.id,
      name: color.name,
      value: normalizeColorValue(color.value),
    }))

    if (page.layers?.decor) {
      baseDecor = page.layers.decor
    }
  } catch (error) {
    console.warn(
      '[muralStore] page data unavailable, using inline defaults:',
      error,
    )
  }
}

let cachedPageDefinition: ColoringPageDefinition | null = null

/**
 * The mural as a shared coloring-engine page definition. Prefers the data
 * file (step 4); falls back to the inline constants so /mural never breaks.
 */
export async function loadMuralPageDefinition(): Promise<ColoringPageDefinition> {
  if (cachedPageDefinition) return cachedPageDefinition

  await hydrateBaseFromPageData()

  cachedPageDefinition = {
    id: 'mural/fence-v1',
    version: 1,
    title: 'Fence Mural Color Studio',
    viewBox: { width: 960, height: 540 },
    mode: 'svg-regions',
    layers: { decor: baseDecor },
    regions: baseSections.map((section) => ({
      id: section.id,
      label: section.label,
      group: section.groupId,
      defaultColorId: section.colorId,
      d: section.d,
    })),
    palette: baseColors.map((color) => ({ ...color })),
  }

  return cachedPageDefinition
}

function safeReadState(): MuralStoredState | null {
  if (!isClient) return null

  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function safeWriteState(payload: MuralStoredState): void {
  if (!isClient) return

  try {
    localStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    // Quota/private-mode failures are non-fatal; coloring continues unsaved.
  }
}

function normalizeColorValue(value: string): string {
  const trimmed = value.trim()
  return /^#[0-9a-f]{6}$/i.test(trimmed) ? trimmed : '#ffffff'
}

function makeColorId(name: string): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'saved-color'

  return `${slug}-${Date.now().toString(36)}`
}

export const useMuralStore = defineStore('muralStore', () => {
  const colors = ref<MuralColor[]>(defaultColors.map((color) => ({ ...color })))
  const sections = ref<MuralSection[]>(
    defaultSections.map((section) => ({ ...section })),
  )
  const activeColorId = ref('leaf-true')
  const selectedSectionId = ref<string | null>(defaultSections[0]?.id ?? null)
  const initialized = ref(false)

  const colorMap = computed(() => {
    return new Map(colors.value.map((color) => [color.id, color]))
  })

  const activeColor = computed(() => {
    return colorMap.value.get(activeColorId.value) ?? colors.value[0] ?? null
  })

  const selectedSection = computed(() => {
    return (
      sections.value.find(
        (section) => section.id === selectedSectionId.value,
      ) ?? null
    )
  })

  const groups = computed<MuralGroup[]>(() => {
    const groupOrder: string[] = []
    const lookup = new Map<string, MuralSection[]>()

    for (const section of sections.value) {
      if (!lookup.has(section.groupId)) {
        lookup.set(section.groupId, [])
        groupOrder.push(section.groupId)
      }

      lookup.get(section.groupId)?.push(section)
    }

    return groupOrder.map((groupId) => {
      const groupSections = lookup.get(groupId) ?? []
      const firstColorId =
        groupSections[0]?.colorId ?? colors.value[0]?.id ?? ''
      const sameColor = groupSections.every(
        (section) => section.colorId === firstColorId,
      )

      return {
        id: groupId,
        label: groupId
          .split('-')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        sectionIds: groupSections.map((section) => section.id),
        colorId: sameColor ? firstColorId : 'mixed',
      }
    })
  })

  function getColorValue(colorId: string): string {
    return colorMap.value.get(colorId)?.value ?? '#ffffff'
  }

  function sync(): void {
    safeWriteState({
      colors: colors.value,
      sections: sections.value,
      activeColorId: activeColorId.value,
      selectedSectionId: selectedSectionId.value,
    })
  }

  async function initialize(force = false): Promise<void> {
    if (initialized.value && !force) return

    await hydrateBaseFromPageData()

    const saved = safeReadState()

    if (saved?.colors?.length) {
      colors.value = saved.colors.map((color) => ({
        ...color,
        value: normalizeColorValue(color.value),
      }))
    } else {
      colors.value = baseColors.map((color) => ({ ...color }))
    }

    if (saved?.sections?.length) {
      const savedSectionMap = new Map(
        saved.sections.map((section) => [section.id, section]),
      )

      sections.value = baseSections.map((section) => {
        const savedSection = savedSectionMap.get(section.id)

        return {
          ...section,
          colorId: savedSection?.colorId ?? section.colorId,
        }
      })
    } else {
      sections.value = baseSections.map((section) => ({ ...section }))
    }

    if (saved?.activeColorId && colorMap.value.has(saved.activeColorId)) {
      activeColorId.value = saved.activeColorId
    }

    if (
      saved?.selectedSectionId &&
      sections.value.some((section) => section.id === saved.selectedSectionId)
    ) {
      selectedSectionId.value = saved.selectedSectionId
    }

    initialized.value = true
    sync()
  }

  function setActiveColor(colorId: string): void {
    if (!colorMap.value.has(colorId)) return

    activeColorId.value = colorId
    sync()
  }

  function selectSection(sectionId: string): void {
    if (!sections.value.some((section) => section.id === sectionId)) return

    selectedSectionId.value = sectionId
    sync()
  }

  function setSectionColor(
    sectionId: string,
    colorId = activeColorId.value,
  ): void {
    if (!colorMap.value.has(colorId)) return

    sections.value = sections.value.map((section) =>
      section.id === sectionId ? { ...section, colorId } : section,
    )

    selectedSectionId.value = sectionId
    sync()
  }

  function setGroupColor(groupId: string, colorId = activeColorId.value): void {
    if (!colorMap.value.has(colorId)) return

    sections.value = sections.value.map((section) =>
      section.groupId === groupId ? { ...section, colorId } : section,
    )

    sync()
  }

  function addSavedColor(name: string, value: string): void {
    const trimmedName = name.trim() || 'Saved color'
    const normalizedValue = normalizeColorValue(value)

    const color: MuralColor = {
      id: makeColorId(trimmedName),
      name: trimmedName,
      value: normalizedValue,
    }

    colors.value = [...colors.value, color]
    activeColorId.value = color.id
    sync()
  }

  function removeSavedColor(colorId: string): void {
    if (colors.value.length <= 1) return

    const fallbackColorId = colors.value.find(
      (color) => color.id !== colorId,
    )?.id
    if (!fallbackColorId) return

    colors.value = colors.value.filter((color) => color.id !== colorId)
    sections.value = sections.value.map((section) =>
      section.colorId === colorId
        ? { ...section, colorId: fallbackColorId }
        : section,
    )

    if (activeColorId.value === colorId) {
      activeColorId.value = fallbackColorId
    }

    sync()
  }

  function resetMural(): void {
    colors.value = baseColors.map((color) => ({ ...color }))
    sections.value = baseSections.map((section) => ({ ...section }))
    activeColorId.value = 'leaf-true'
    selectedSectionId.value = baseSections[0]?.id ?? null
    initialized.value = true
    sync()
  }

  return {
    colors,
    sections,
    activeColorId,
    selectedSectionId,
    initialized,
    colorMap,
    activeColor,
    selectedSection,
    groups,
    getColorValue,
    initialize,
    setActiveColor,
    selectSection,
    setSectionColor,
    setGroupColor,
    addSavedColor,
    removeSavedColor,
    resetMural,
  }
})
