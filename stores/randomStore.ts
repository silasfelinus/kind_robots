// /stores/randomStore.ts
import { computed, ref, watch, type WatchStopHandle } from 'vue'
import { defineStore } from 'pinia'
import { useArtStore } from '@/stores/artStore'
import {
  useFacetCatalogStore,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { handleError } from '@/stores/utils'
import { negativeList } from '@/stores/seeds/artList'
import type { ArtListEntry } from '@/stores/seeds/artList'

export type RandomListItem = {
  id: number
  title: string
  content: string[]
  examplesJson: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  source: 'facet'
  taxonomy?: FacetTaxonomy
  groupKey?: string | null
}

const isClient = typeof window !== 'undefined'

const RANDOM_KEY_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  animal: ['ANIMAL'],
  species: ['ANIMAL', 'SPECIES'],
  genre: ['GENRE'],
  occupation: ['OCCUPATION'],
  archetype: ['ARCHETYPE'],
  role: ['ROLE'],
  alignment: ['ALIGNMENT'],
  gender: ['GENDER'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirk: ['QUIRK'],
  material: ['MATERIAL'],
  theme: ['THEME'],
  style: ['STYLE'],
  palette: ['COLOR'],
  mood: ['MOOD'],
  setting: ['SETTING'],
  core: ['CORE'],
  artDirection: ['ART_DIRECTION', 'PROMPT_ENHANCEMENT'],
}

const ART_PRESETS: Array<{
  id: string
  title: string
  taxonomies: FacetTaxonomy[]
  presetType: ArtListEntry['presetType']
  allowMultiple: boolean
}> = [
  {
    id: 'style',
    title: 'Art Style',
    taxonomies: ['STYLE'],
    presetType: 'dropdown',
    allowMultiple: false,
  },
  {
    id: 'theme',
    title: 'Theme',
    taxonomies: ['THEME'],
    presetType: 'radio',
    allowMultiple: false,
  },
  {
    id: 'palette',
    title: 'Color Palette',
    taxonomies: ['COLOR'],
    presetType: 'dropdown',
    allowMultiple: true,
  },
  {
    id: '__pretty__',
    title: '✨ Make Pretty Enhancements',
    taxonomies: ['PROMPT_ENHANCEMENT', 'ART_DIRECTION'],
    presetType: 'auto',
    allowMultiple: true,
  },
]

function stableNegativeId(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return -(Math.abs(hash) || 1)
}

function canonicalValue(entry: FacetCatalogEntry): string {
  return entry.canonicalValue || entry.title
}

function uniqueValues(entries: FacetCatalogEntry[]): string[] {
  return Array.from(new Set(entries.map(canonicalValue).filter(Boolean)))
}

function weightedSample(
  entries: FacetCatalogEntry[],
  count: number,
): FacetCatalogEntry[] {
  const remaining = entries.filter(
    (entry) => entry.isRandomizable && entry.randomWeight > 0,
  )
  const selected: FacetCatalogEntry[] = []

  while (remaining.length && selected.length < count) {
    const total = remaining.reduce((sum, entry) => sum + entry.randomWeight, 0)
    let roll = Math.random() * total
    let pickedIndex = remaining.length - 1

    for (const [index, entry] of remaining.entries()) {
      roll -= entry.randomWeight
      if (roll <= 0) {
        pickedIndex = index
        break
      }
    }

    const [picked] = remaining.splice(pickedIndex, 1)
    if (picked) selected.push(picked)
  }

  return selected
}

export const useRandomStore = defineStore('randomStore', () => {
  const artStore = useArtStore()
  const facetCatalog = useFacetCatalogStore()

  const initialized = ref(false)
  const randomSelections = ref<Record<string, string>>({})
  let randomSelectionsWatcher: WatchStopHandle | null = null

  const supportedKeys = computed(() =>
    Object.keys(RANDOM_KEY_TAXONOMIES).filter((key) =>
      facetCatalog.facetsForTaxonomies(RANDOM_KEY_TAXONOMIES[key] ?? []).some(
        (entry) => entry.isRandomizable,
      ),
    ),
  )

  const catalogPresets = computed<ArtListEntry[]>(() => {
    const facetPresets = ART_PRESETS.map((preset) => ({
      id: preset.id,
      title: preset.title,
      presetType: preset.presetType,
      allowMultiple: preset.allowMultiple,
      content: uniqueValues(
        facetCatalog.facetsForTaxonomies(preset.taxonomies),
      ),
    }))

    return [
      ...facetPresets,
      {
        id: '__negative__',
        title: '🚫 Negative Prompt Filters',
        presetType: 'auto' as const,
        allowMultiple: true,
        // Negative prompts are generation configuration, not reusable Facets.
        content: [...negativeList],
      },
    ]
  })

  const presetLists = computed<RandomListItem[]>(() => {
    const grouped = new Map<string, FacetCatalogEntry[]>()
    for (const entry of facetCatalog.entries) {
      const groupKey = entry.groupKey || entry.taxonomy.toLowerCase()
      const key = `${entry.taxonomy}:${groupKey}`
      const values = grouped.get(key) ?? []
      values.push(entry)
      grouped.set(key, values)
    }

    return Array.from(grouped.entries()).map(([key, entries]) => {
      const first = entries[0]
      const content = uniqueValues(entries)
      return {
        id: stableNegativeId(key),
        title:
          first?.groupLabel ||
          first?.taxonomy.replaceAll('_', ' ').toLowerCase() ||
          key,
        content,
        examplesJson: JSON.stringify(content),
        userId: null,
        isPublic: true,
        isMature: entries.some((entry) => entry.isMature),
        source: 'facet' as const,
        taxonomy: first?.taxonomy,
        groupKey: first?.groupKey,
      }
    })
  })

  const filteredLists = computed(() => presetLists.value)

  function pickRandomFromArray(arr: string[], count: number): string[] {
    if (!Array.isArray(arr) || count <= 0) return []
    return [...arr]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, arr.length))
  }

  function getRandom(key: string, count = 1): string[] {
    const taxonomies = RANDOM_KEY_TAXONOMIES[key] ?? []
    if (!taxonomies.length) return []
    return weightedSample(
      facetCatalog.facetsForTaxonomies(taxonomies),
      Math.max(1, count),
    ).map(canonicalValue)
  }

  function toggleSelection(key: string): void {
    const [result] = getRandom(key, 1)
    if (!result) return

    if (randomSelections.value[key] === result) {
      const alternatives = getRandom(key, 2).filter(
        (value) => value !== result,
      )
      const next = alternatives[0]
      if (next) randomSelections.value[key] = next
      return
    }

    randomSelections.value[key] = result
  }

  function clearSelection(key: string): void {
    delete randomSelections.value[key]
  }

  function clearAllSelections(): void {
    randomSelections.value = {}
  }

  function getAllSelections(): Record<string, string> {
    return randomSelections.value
  }

  async function initialize(force = false): Promise<void> {
    if (initialized.value && !force) return

    if (!facetCatalog.loaded || force) {
      await facetCatalog.fetchCatalog({ includeMature: true, take: 1000 }, force)
    }

    if (isClient) {
      const stored = localStorage.getItem('artRandomizerRandomSelections')
      if (stored) {
        try {
          randomSelections.value = JSON.parse(stored) as Record<string, string>
        } catch (error) {
          handleError(error, 'Failed to parse random selections from localStorage')
        }
      }

      if (!randomSelectionsWatcher) {
        randomSelectionsWatcher = watch(
          randomSelections,
          (value) => {
            try {
              localStorage.setItem(
                'artRandomizerRandomSelections',
                JSON.stringify(value),
              )
            } catch (error) {
              handleError(error, 'Failed to save random selections')
            }
          },
          { deep: true },
        )
      }
    }

    initialized.value = true
  }

  function resetAll(): void {
    for (const key of Object.keys(artStore.artListSelections)) {
      artStore.updateArtListSelection(key, [])
    }
    clearAllSelections()
  }

  function applyMakePretty(): void {
    const pretty = catalogPresets.value.find((entry) => entry.id === '__pretty__')
    const negative = catalogPresets.value.find(
      (entry) => entry.id === '__negative__',
    )

    if (pretty) {
      artStore.updateArtListSelection(
        pretty.id,
        pickRandomFromArray(pretty.content, 4),
      )
    }
    if (negative) {
      artStore.updateArtListSelection(
        negative.id,
        pickRandomFromArray(negative.content, 4),
      )
    }
  }

  function applySurprise(): void {
    for (const entry of catalogPresets.value) {
      if (!entry.content.length) continue
      const count = entry.allowMultiple
        ? Math.max(1, Math.ceil(Math.random() * Math.min(entry.content.length, 6)))
        : 1
      artStore.updateArtListSelection(
        entry.id,
        pickRandomFromArray(entry.content, count),
      )
    }
  }

  return {
    initialize,
    initialized,
    getRandom,
    supportedKeys,
    pickRandomFromArray,
    toggleSelection,
    clearSelection,
    clearAllSelections,
    getAllSelections,
    applyMakePretty,
    applySurprise,
    resetAll,
    catalogPresets,
    presetLists,
    filteredLists,
    randomSelections,
  }
})
