<!-- /components/facets/facet-gallery.vue -->
<template>
  <section class="kr-surface">
    <header v-if="showHeader" class="kr-toolbar shrink-0 kr-panel-flat p-3">
      <Icon name="kind-icon:tag" class="size-5 text-secondary" />
      <div class="min-w-0 flex-1">
        <p class="font-black">{{ title }}</p>
        <p v-if="subtitle" class="text-xs text-base-content/55">
          {{ subtitle }}
        </p>
      </div>
      <span
        v-if="catalog.loading"
        class="loading loading-spinner loading-sm"
        aria-label="Loading facets"
      />
      <span class="badge badge-ghost shrink-0">{{ visibleCount }} shown</span>
    </header>

    <div v-if="showControls" class="kr-toolbar shrink-0">
      <kr-search-field
        v-model="search"
        label="Search facets"
        placeholder="Search title, alias, description, or taxonomy..."
      />
      <select
        v-model="taxonomyFilter"
        class="select select-bordered select-sm rounded-xl"
        aria-label="Filter by taxonomy"
      >
        <option :value="null">All taxonomies ({{ totalCount }})</option>
        <option
          v-for="taxonomy in populatedTaxonomies"
          :key="taxonomy"
          :value="taxonomy"
        >
          {{ taxonomyLabel(taxonomy) }} ({{ counts[taxonomy] || 0 }})
        </option>
      </select>
      <label
        class="ml-auto flex items-center gap-2 text-xs text-base-content/60"
      >
        <input
          v-model="artOnly"
          type="checkbox"
          class="toggle toggle-secondary toggle-xs"
        />
        Illustrated only
      </label>

      <select
        v-model="mode"
        class="select select-bordered select-sm shrink-0 rounded-xl"
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

    <p v-if="errorMessage" class="shrink-0 text-sm text-error">
      {{ errorMessage }}
    </p>

    <div class="kr-scroll space-y-6">
      <div
        v-for="group in visibleGroups"
        :key="group.taxonomy"
        class="space-y-3"
      >
        <div class="flex items-baseline gap-2">
          <h2 class="text-lg font-black">
            {{ taxonomyLabel(group.taxonomy) }}
          </h2>
          <span class="badge badge-secondary badge-sm">{{ group.total }}</span>
        </div>

        <kr-gallery
          themed
          :items="group.entries.map(toGalleryItem)"
          :mode="mode"
          :modes="[]"
          empty-label="facets"
          @open="selectFacet"
        />
      </div>

      <p
        v-if="!catalog.loading && !visibleGroups.length"
        class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50"
      >
        No facets match these filters.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  FACET_TAXONOMIES,
  useFacetCatalogStore,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
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
    subtitle: 'The reusable building blocks every other object draws from.',
    showHeader: true,
    showControls: true,
  },
)

const emit = defineEmits<{ select: [facet: FacetCatalogEntry] }>()
const catalog = useFacetCatalogStore()

const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const artOnly = ref(false)
const errorMessage = ref('')
const mode = ref<GalleryMode>('cards')

function selectFacet(item: { id: string | number }): void {
  const facet = catalog.entries.find((entry) => entry.id === Number(item.id))
  if (facet) emit('select', facet)
}

function facetArtwork(facet: FacetCatalogEntry): string | null {
  return resolveEntityArtwork(facet)
}

function iconName(facet: FacetCatalogEntry): string {
  const icon = facet.icon?.trim()
  return icon && icon.includes(':') ? icon : 'kind-icon:tag'
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
    placeholderIcon: iconName(facet),
    placeholderLabel: facet.artRequired ? 'art pending' : 'no art',
  }
}

function taxonomyLabel(taxonomy: FacetTaxonomy): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function matchesSearch(facet: FacetCatalogEntry, needle: string): boolean {
  if (!needle) return true
  const values = [
    facet.title,
    facet.canonicalValue,
    facet.taxonomy,
    facet.groupLabel,
    facet.description,
    facet.flavorText,
    ...facet.aliases,
  ]
  return values.some((value) =>
    normalizeFacetLookupKey(value || '').includes(needle),
  )
}

const counts = computed(() => {
  const result: Partial<Record<FacetTaxonomy, number>> = {}
  for (const [taxonomy, entries] of catalog.byTaxonomy) {
    result[taxonomy] = entries.length
  }
  return result
})

const totalCount = computed(() => catalog.entries.length)

const populatedTaxonomies = computed(() =>
  FACET_TAXONOMIES.filter((taxonomy) => (counts.value[taxonomy] || 0) > 0),
)

const groups = computed(() => {
  const needle = normalizeFacetLookupKey(search.value)
  const result: { taxonomy: FacetTaxonomy; entries: FacetCatalogEntry[] }[] = []
  for (const taxonomy of FACET_TAXONOMIES) {
    if (taxonomyFilter.value && taxonomy !== taxonomyFilter.value) continue
    const entries = (catalog.byTaxonomy.get(taxonomy) || []).filter((facet) => {
      if (artOnly.value && !facetArtwork(facet)) return false
      return matchesSearch(facet, needle)
    })
    if (entries.length) result.push({ taxonomy, entries })
  }
  return result
})

const visibleGroups = computed(() =>
  groups.value.map((group) => ({
    taxonomy: group.taxonomy,
    total: group.entries.length,
    entries: group.entries,
  })),
)

const visibleCount = computed(() =>
  groups.value.reduce((sum, group) => sum + group.entries.length, 0),
)

onMounted(async () => {
  try {
    await catalog.fetchCatalog({ take: 1000 })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})
</script>
