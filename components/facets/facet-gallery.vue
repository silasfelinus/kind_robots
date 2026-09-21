<!-- /components/facets/facet-gallery.vue -->
<!--
  TAXONOMY FIRST, then the collection.

  Silas, 2026-09-21: "when we get facets, wouldn't it be better to be getting
  the types first, then loading the appropriate collection when a user selects
  to move down a level?"

  It was 1,736 rows downloaded and 1,717 cards built in one scroll, on a phone,
  to show 26 headings. The index now costs one small request to
  /api/facets/taxonomies (label, count, one tile image per taxonomy) and a
  drill-down costs exactly the taxonomy you asked for.

  The selection lives in the URL, same house rule as `?facet=<slug>`: every view
  is linkable, and the back button does the obvious thing.

  Search still reaches the whole catalog. It is served rather than filtered
  client-side, because filtering everything locally is the thing this screen
  stopped doing.
-->
<template>
  <section class="kr-surface">
    <header v-if="showHeader" class="kr-toolbar shrink-0 kr-panel-flat p-3">
      <Icon name="kind-icon:tag" class="size-5 text-secondary" />
      <div class="min-w-0 flex-1">
        <p class="font-black">{{ title }}</p>
        <p v-if="subtitle" class="kr-text-dim-xs-55">
          {{ subtitle }}
        </p>
      </div>
      <span v-if="loading" class="kr-spinner-sm" aria-label="Loading facets" />
      <span class="badge badge-ghost shrink-0">{{ shownLabel }}</span>
    </header>

    <div v-if="showControls" class="kr-toolbar shrink-0">
      <kr-search-field
        v-model="search"
        label="Search facets"
        placeholder="Search every taxonomy by title, alias or description..."
      />

      <button
        v-if="selectedTaxonomy"
        type="button"
        class="kr-btn-ghost shrink-0"
        @click="clearTaxonomy"
      >
        <Icon name="kind-icon:chevron-left" class="kr-icon-4" />
        All taxonomies
      </button>

      <label class="kr-text-dim-xs-60 ml-auto flex items-center gap-2">
        <input
          v-model="artOnly"
          type="checkbox"
          class="kr-toggle-secondary-xs"
        />
        Illustrated only
      </label>

      <select
        v-model="mode"
        class="kr-select-sm shrink-0"
        aria-label="Facet gallery layout"
      >
        <option
          v-for="entry in GALLERY_MODES"
          :key="entry.value"
          :value="entry.value"
        >
          {{ entry.label }}
        </option>
      </select>
    </div>

    <p v-if="errorMessage" class="kr-text-error-sm shrink-0">
      {{ errorMessage }}
    </p>

    <div class="kr-scroll space-y-6">
      <!-- LEVEL ONE: the taxonomies themselves. -->
      <kr-gallery
        v-if="showIndex"
        themed
        :items="taxonomyItems"
        :mode="mode"
        :modes="[]"
        :loading="loadingIndex"
        empty-label="taxonomies"
        @open="openTaxonomy"
      />

      <!-- LEVEL TWO: one taxonomy, or a search across all of them. -->
      <template v-else>
        <div v-if="!search" class="flex items-baseline gap-2">
          <h2 class="kr-text-black-lg">
            {{ taxonomyLabel(selectedTaxonomy) }}
          </h2>
          <span class="kr-badge-secondary-sm">{{ visibleEntries.length }}</span>
        </div>

        <kr-gallery
          themed
          :items="visibleEntries.map(toGalleryItem)"
          :mode="mode"
          :modes="[]"
          :loading="loading"
          empty-label="facets"
          @open="selectFacet"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FACET_TAXONOMIES,
  useFacetCatalogStore,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { performFetch } from '@/stores/utils'
import { resolveEntityArtwork } from '@/utils/artImageSrc'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import { GALLERY_MODES, type GalleryMode } from '@/utils/galleryVocabulary'

withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    showHeader?: boolean
    showControls?: boolean
  }>(),
  {
    title: 'Facets',
    subtitle: 'Pick a taxonomy, then a Facet.',
    showHeader: true,
    showControls: true,
  },
)

const emit = defineEmits<{ select: [facet: FacetCatalogEntry] }>()
const catalog = useFacetCatalogStore()
const route = useRoute()
const router = useRouter()

type TaxonomySummary = {
  taxonomy: FacetTaxonomy
  count: number
  imagePath: string | null
}

const search = ref('')
const artOnly = ref(false)
const errorMessage = ref('')
const mode = ref<GalleryMode>('cards')

const summaries = ref<TaxonomySummary[]>([])
const loadingIndex = ref(false)
const entries = ref<FacetCatalogEntry[]>([])
const loading = ref(false)

/* The drill-down lives in the URL, so a taxonomy is linkable and the back
   button climbs one level rather than leaving the gallery entirely. */
const selectedTaxonomy = computed<FacetTaxonomy | null>(() => {
  const value = route.query.taxonomy
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase() as FacetTaxonomy
  return FACET_TAXONOMIES.includes(normalized) ? normalized : null
})

const showIndex = computed(
  () => !selectedTaxonomy.value && !search.value.trim(),
)

const visibleEntries = computed(() =>
  artOnly.value
    ? entries.value.filter((facet) => Boolean(resolveEntityArtwork(facet)))
    : entries.value,
)

const shownLabel = computed(() =>
  showIndex.value
    ? `${summaries.value.length} taxonomies · ${totalFacets.value} facets`
    : `${visibleEntries.value.length} shown`,
)

const totalFacets = computed(() =>
  summaries.value.reduce((sum, row) => sum + row.count, 0),
)

function taxonomyLabel(taxonomy: string | null): string {
  return String(taxonomy ?? '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function toGalleryItem(facet: FacetCatalogEntry): GalleryItem {
  const badges = [
    { label: taxonomyLabel(facet.taxonomy), class: 'badge-outline' },
  ]
  if (facet.groupLabel)
    badges.push({ label: facet.groupLabel, class: 'badge-ghost' })

  return {
    id: facet.id,
    title: facet.title,
    description: facet.description || facet.flavorText || '',
    source: facet,
    badges,
    meta: facet.aliases.length ? facet.aliases.join(' · ') : '',
    placeholderIcon:
      facet.icon?.trim() && facet.icon.includes(':')
        ? facet.icon
        : 'kind-icon:tag',
    placeholderLabel: facet.artRequired ? 'art pending' : 'no art',
  }
}

const taxonomyItems = computed<GalleryItem[]>(() =>
  summaries.value.map((row) => ({
    id: row.taxonomy,
    title: taxonomyLabel(row.taxonomy),
    description: `${row.count} ${row.count === 1 ? 'Facet' : 'Facets'}`,
    card: row.imagePath || undefined,
    badges: [{ label: String(row.count), class: 'badge-outline' }],
    placeholderIcon: 'kind-icon:tag',
    placeholderLabel: 'no art',
  })),
)

function openTaxonomy(item: { id: string | number }): void {
  void router.push({ query: { ...route.query, taxonomy: String(item.id) } })
}

function clearTaxonomy(): void {
  const query = { ...route.query }
  delete query.taxonomy
  search.value = ''
  void router.push({ query })
}

function selectFacet(item: { id: string | number }): void {
  const facet = entries.value.find((entry) => entry.id === Number(item.id))
  if (facet) emit('select', facet)
}

async function loadIndex(): Promise<void> {
  if (summaries.value.length) return
  loadingIndex.value = true
  try {
    const response = await performFetch<TaxonomySummary[]>(
      '/api/facets/taxonomies',
    )
    if (!response.success) {
      errorMessage.value =
        response.message || 'Facet taxonomies failed to load.'
      return
    }
    summaries.value = response.data ?? []
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? error.message
        : 'Facet taxonomies failed to load.'
  } finally {
    loadingIndex.value = false
  }
}

/*
 * One taxonomy, or one search, never the whole catalog. `fetchCatalogSlice`
 * returns its rows instead of assigning the shared `entries` the builder decks
 * read -- narrowing that store would leave every other consumer holding a
 * fraction of the catalog and believing it complete.
 */
async function loadEntries(): Promise<void> {
  const needle = search.value.trim()
  const taxonomy = selectedTaxonomy.value
  if (!needle && !taxonomy) {
    entries.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    entries.value = await catalog.fetchCatalogSlice(
      needle ? { search: needle } : { taxonomies: [taxonomy as FacetTaxonomy] },
    )
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void loadEntries()
  }, 250)
})

watch(selectedTaxonomy, () => {
  void loadEntries()
})

onMounted(() => {
  void loadIndex()
  void loadEntries()
})
</script>
