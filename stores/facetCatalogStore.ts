// /stores/facetCatalogStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
import type { BuilderChoice } from '@/stores/helpers/builderCards'

export const FACET_TAXONOMIES = [
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'SPECIES',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'ALIGNMENT',
  'GENDER',
  'AGE',
  'BUILD',
  'HAIR',
  'ORIGIN',
  'BOT_TYPE',
  'DREAM_TYPE',
  'REWARD_TYPE',
  'RARITY',
  'PERSONALITY',
  'BACKSTORY',
  'QUIRK',
  'MATERIAL',
  'PROMPT_ENHANCEMENT',
  'OTHER',
] as const

export type FacetTaxonomy = (typeof FACET_TAXONOMIES)[number]

export type FacetCatalogEntry = {
  id: number
  title: string
  slug: string | null
  kind: string
  taxonomy: FacetTaxonomy
  canonicalValue: string
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  imagePath: string | null
  icon: string | null
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: Record<string, unknown> | null
  aliases: string[]
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isActive: boolean
  allowReviews: boolean
}

type FacetCatalogQuery = {
  taxonomies?: FacetTaxonomy[]
  includeInactive?: boolean
  includeMature?: boolean
  randomizableOnly?: boolean
  search?: string
  take?: number
  skip?: number
}

type ArtFieldDefinition = {
  taxonomies: FacetTaxonomy[]
  groupKeys?: string[]
}

const FACET_CATALOG_PAGE_SIZE = 1000

export const CHARACTER_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  genre: ['GENRE'],
  species: ['ANIMAL', 'SPECIES'],
  class: ['OCCUPATION', 'ARCHETYPE', 'ROLE'],
  alignment: ['ALIGNMENT'],
  gender: ['GENDER'],
  // Embodiment axes. These are what a character LOOKS like, as opposed to the
  // fields above, which are what a character IS. Both belong on the Character
  // builder; only the second set existed before 2026-09-15.
  age: ['AGE'],
  build: ['BUILD'],
  hair: ['HAIR'],
  origin: ['ORIGIN'],
  personality: ['PERSONALITY'],
  backstory: ['BACKSTORY'],
  quirks: ['QUIRK'],
  role: ['ROLE'],
}

export const BOT_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  BotType: ['BOT_TYPE'],
  personality: ['PERSONALITY'],
}

export const SYSTEM_FIELD_TAXONOMIES: Record<string, FacetTaxonomy[]> = {
  dreamType: ['DREAM_TYPE'],
  rewardType: ['REWARD_TYPE'],
  rarity: ['RARITY'],
}

// Art workflow controls (mode, figure count, resources, and negative filters)
// remain operational configuration. Reusable visual vocabulary comes from the
// canonical catalog. Subject types use grouped ART_DIRECTION Facets rather than
// adding another top-level taxonomy solely for one Builder deck.
export const ART_FIELD_FACETS: Record<string, ArtFieldDefinition> = {
  subject: { taxonomies: ['ART_DIRECTION'], groupKeys: ['art-subject'] },
  figureSpecies: { taxonomies: ['ANIMAL', 'SPECIES'] },
  style: { taxonomies: ['STYLE'], groupKeys: ['style'] },
  punk: { taxonomies: ['STYLE'], groupKeys: ['punk'] },
  theme: { taxonomies: ['THEME'], groupKeys: ['theme'] },
  palette: { taxonomies: ['COLOR'], groupKeys: ['palette'] },
  emotion: { taxonomies: ['MOOD'], groupKeys: ['art-mood'] },
  prettifiers: {
    taxonomies: ['PROMPT_ENHANCEMENT'],
    groupKeys: ['__pretty__'],
  },
}

function toQuery(options: FacetCatalogQuery): string {
  const query = new URLSearchParams()
  if (options.taxonomies?.length) {
    query.set('taxonomy', options.taxonomies.join(','))
  }
  if (options.includeInactive) query.set('includeInactive', 'true')
  if (options.includeMature) query.set('includeMature', 'true')
  if (options.randomizableOnly) query.set('randomizableOnly', 'true')
  if (options.search) query.set('search', options.search)
  if (options.take != null) query.set('take', String(options.take))
  if (options.skip != null) query.set('skip', String(options.skip))
  const value = query.toString()
  return value ? `?${value}` : ''
}

async function fetchAllCatalogPages(
  options: FacetCatalogQuery,
): Promise<FacetCatalogEntry[]> {
  const pageSize = Math.min(
    FACET_CATALOG_PAGE_SIZE,
    Math.max(1, options.take ?? FACET_CATALOG_PAGE_SIZE),
  )
  let skip = Math.max(0, options.skip ?? 0)
  const entriesById = new Map<number, FacetCatalogEntry>()

  while (true) {
    const response = await performFetch<FacetCatalogEntry[]>(
      `/api/facets/catalog${toQuery({ ...options, take: pageSize, skip })}`,
    )
    if (!response.success) {
      throw new Error(response.message || 'Failed to load canonical Facets.')
    }

    const page = response.data ?? []
    for (const entry of page) entriesById.set(entry.id, entry)

    if (page.length < pageSize) break
    skip += page.length
  }

  return Array.from(entriesById.values())
}

function weightedPick(entries: FacetCatalogEntry[]): FacetCatalogEntry | null {
  const viable = entries.filter(
    (entry) => entry.isRandomizable && entry.randomWeight > 0,
  )
  if (!viable.length) return null

  const total = viable.reduce((sum, entry) => sum + entry.randomWeight, 0)
  let roll = Math.random() * total
  for (const entry of viable) {
    roll -= entry.randomWeight
    if (roll <= 0) return entry
  }
  return viable.at(-1) ?? null
}

function metadataString(
  entry: FacetCatalogEntry,
  key: string | undefined,
): string | null {
  if (!key) return null
  const value = entry.metadata?.[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function metadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function metadataStrings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === 'string' && Boolean(entry.trim()),
      )
    : []
}

function builderChoiceForEntry(
  entry: FacetCatalogEntry,
  metadataValueKey?: string,
): BuilderChoice {
  return {
    value:
      metadataString(entry, metadataValueKey) ||
      entry.canonicalValue ||
      entry.title,
    label: entry.title,
    subtext: entry.description || entry.flavorText || undefined,
    image: entry.imagePath || undefined,
    icon: entry.icon || undefined,
    payload: {
      facetId: entry.id,
      taxonomy: entry.taxonomy,
      groupKey: entry.groupKey,
      groupLabel: entry.groupLabel,
      aliases: entry.aliases,
      structuralEnum: entry.metadata?.structuralEnum === true,
    },
  }
}

function supportsArtField(
  entry: FacetCatalogEntry,
  fieldKey: string,
  definition: ArtFieldDefinition,
): boolean {
  if (!definition.groupKeys?.length) return true
  if (entry.groupKey && definition.groupKeys.includes(entry.groupKey))
    return true
  return metadataStrings(entry.metadata?.artBuilderFields).includes(fieldKey)
}

export const useFacetCatalogStore = defineStore('facetCatalogStore', () => {
  const entries = ref<FacetCatalogEntry[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const byTaxonomy = computed(() => {
    const grouped = new Map<FacetTaxonomy, FacetCatalogEntry[]>()
    for (const taxonomy of FACET_TAXONOMIES) grouped.set(taxonomy, [])
    for (const entry of entries.value) {
      grouped.get(entry.taxonomy)?.push(entry)
    }
    return grouped
  })

  const byLookupKey = computed(() => {
    const index = new Map<string, FacetCatalogEntry>()
    for (const entry of entries.value) {
      const values = [
        entry.title,
        entry.canonicalValue,
        entry.slug ?? '',
        ...entry.aliases,
      ]
      for (const value of values) {
        const key = normalizeFacetLookupKey(value)
        if (key && !index.has(key)) index.set(key, entry)
      }
    }
    return index
  })

  /*
   * Which options actually change WHICH Facets come back.
   *
   * `take` and `skip` are paging hints and nothing else: fetchAllCatalogPages
   * walks every page regardless, so a request differing only in those returns
   * the identical set. Counting them as a different query is what made the
   * cache unreachable -- every caller but one passes `take: 1000`, which is
   * already FACET_CATALOG_PAGE_SIZE, so `!Object.keys(options).length` was
   * false for all of them and each one re-downloaded all 1,736 rows.
   *
   * On /facets that meant the client-side plugin fetched the whole catalog,
   * and then facet-gallery's own onMounted fetched it AGAIN a moment later --
   * two full downloads racing, the second replacing `entries` wholesale with
   * fresh objects while the first set was already on screen (measured against
   * production 2026-09-20: four /api/facets/catalog requests for one visit).
   */
  function narrowsTheQuery(options: FacetCatalogQuery): boolean {
    return Object.entries(options).some(
      ([key, value]) =>
        key !== 'take' &&
        key !== 'skip' &&
        value !== undefined &&
        value !== null,
    )
  }

  /*
   * A SLICE, returned rather than stored.
   *
   * fetchCatalog assigns `entries` wholesale, which is correct for the one
   * shared canonical catalog and catastrophic for a narrowed query: a gallery
   * drilling into ANIMAL would leave every other consumer -- the builder decks,
   * facetForValue, the random pickers -- holding 143 rows and believing that is
   * the catalog. So a narrowed read hands its rows back to the caller and
   * touches no shared state.
   *
   * Used by the taxonomy-first gallery, which loads one taxonomy at a time
   * instead of all 1,736 rows to render 26 headings (Silas, 2026-09-21:
   * "wouldn't it be better to be getting the types first, then loading the
   * appropriate collection when a user selects to move down a level?").
   */
  async function fetchCatalogSlice(
    options: FacetCatalogQuery = {},
  ): Promise<FacetCatalogEntry[]> {
    return fetchAllCatalogPages(options)
  }

  /*
   * One Facet by slug, for a deep link that arrives before any list has been
   * loaded. The gallery no longer downloads the whole catalog, so
   * `entries.find(slug)` is no longer a safe way to resolve `?facet=<slug>` --
   * a bookmarked Facet would render "no longer available" on a cold load.
   *
   * Cached into `entries` on the way through: adding a row a narrowed read did
   * not cover is additive, which is the opposite of the wholesale replacement
   * fetchCatalogSlice exists to avoid.
   */
  async function fetchFacetBySlug(
    slug: string,
  ): Promise<FacetCatalogEntry | null> {
    const wanted = slug.trim()
    if (!wanted) return null

    const known = entries.value.find((entry) => entry.slug === wanted)
    if (known) return known

    const response = await performFetch<FacetCatalogEntry[]>(
      `/api/facets/catalog${toQuery({ search: wanted, take: 25 })}`,
    )
    if (!response.success) return null

    const match = (response.data ?? []).find((entry) => entry.slug === wanted)
    if (!match) return null
    if (!entries.value.some((entry) => entry.id === match.id)) {
      entries.value = [...entries.value, match]
    }
    return match
  }

  async function fetchCatalog(
    options: FacetCatalogQuery = {},
    force = false,
  ): Promise<FacetCatalogEntry[]> {
    if (loaded.value && !force && !narrowsTheQuery(options)) {
      return entries.value
    }

    loading.value = true
    error.value = null
    try {
      entries.value = await fetchAllCatalogPages(options)
      loaded.value = true
      return entries.value
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
      throw cause
    } finally {
      loading.value = false
    }
  }

  function facetsForTaxonomies(
    taxonomies: readonly FacetTaxonomy[],
  ): FacetCatalogEntry[] {
    const allowed = new Set(taxonomies)
    return entries.value.filter((entry) => allowed.has(entry.taxonomy))
  }

  function facetsForCharacterField(fieldKey: string): FacetCatalogEntry[] {
    return facetsForTaxonomies(CHARACTER_FIELD_TAXONOMIES[fieldKey] ?? [])
  }

  function facetsForBotField(fieldKey: string): FacetCatalogEntry[] {
    return facetsForTaxonomies(BOT_FIELD_TAXONOMIES[fieldKey] ?? [])
  }

  function facetsForSystemField(fieldKey: string): FacetCatalogEntry[] {
    return facetsForTaxonomies(SYSTEM_FIELD_TAXONOMIES[fieldKey] ?? [])
  }

  function facetsForArtField(fieldKey: string): FacetCatalogEntry[] {
    const definition = ART_FIELD_FACETS[fieldKey]
    if (!definition) return []
    return facetsForTaxonomies(definition.taxonomies).filter((entry) =>
      supportsArtField(entry, fieldKey, definition),
    )
  }

  function facetForValue(value: string): FacetCatalogEntry | null {
    const key = normalizeFacetLookupKey(value)
    return key ? (byLookupKey.value.get(key) ?? null) : null
  }

  function randomFacetForField(fieldKey: string): FacetCatalogEntry | null {
    return weightedPick(facetsForCharacterField(fieldKey))
  }

  function randomFacetForBotField(fieldKey: string): FacetCatalogEntry | null {
    return weightedPick(facetsForBotField(fieldKey))
  }

  function builderChoicesForTaxonomies(
    taxonomies: readonly FacetTaxonomy[],
    metadataValueKey?: string,
  ): BuilderChoice[] {
    return facetsForTaxonomies(taxonomies).map((entry) =>
      builderChoiceForEntry(entry, metadataValueKey),
    )
  }

  function builderChoicesForField(fieldKey: string): BuilderChoice[] {
    return builderChoicesForTaxonomies(
      CHARACTER_FIELD_TAXONOMIES[fieldKey] ?? [],
    )
  }

  function builderChoicesForBotField(fieldKey: string): BuilderChoice[] {
    return builderChoicesForTaxonomies(
      BOT_FIELD_TAXONOMIES[fieldKey] ?? [],
      fieldKey === 'BotType' ? 'builderValue' : undefined,
    )
  }

  function builderChoicesForSystemField(fieldKey: string): BuilderChoice[] {
    return builderChoicesForTaxonomies(
      SYSTEM_FIELD_TAXONOMIES[fieldKey] ?? [],
      'enumValue',
    )
  }

  function builderChoicesForArtField(fieldKey: string): BuilderChoice[] {
    return facetsForArtField(fieldKey).map((entry) => {
      const choice = builderChoiceForEntry(entry)
      const artBuilder = metadataRecord(entry.metadata?.artBuilder)
      const fieldMetadata = metadataRecord(artBuilder?.[fieldKey])
      const builderValue = fieldMetadata?.builderValue
      const promptHint = fieldMetadata?.promptHint
      const loras = metadataStrings(fieldMetadata?.loras)

      return {
        ...choice,
        value:
          typeof builderValue === 'string' && builderValue.trim()
            ? builderValue.trim()
            : choice.value,
        payload: {
          ...(choice.payload ?? {}),
          source: 'facet-catalog',
          artField: fieldKey,
          ...(typeof promptHint === 'string' && promptHint.trim()
            ? { promptHint: promptHint.trim() }
            : {}),
          ...(loras.length ? { loras } : {}),
        },
      }
    })
  }

  return {
    entries,
    loading,
    loaded,
    error,
    byTaxonomy,
    byLookupKey,
    fetchCatalog,
    fetchCatalogSlice,
    fetchFacetBySlug,
    facetsForTaxonomies,
    facetsForCharacterField,
    facetsForBotField,
    facetsForSystemField,
    facetsForArtField,
    facetForValue,
    randomFacetForField,
    randomFacetForBotField,
    builderChoicesForTaxonomies,
    builderChoicesForField,
    builderChoicesForBotField,
    builderChoicesForSystemField,
    builderChoicesForArtField,
  }
})
