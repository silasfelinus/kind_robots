<!-- /components/facets/facet-gallery.vue -->
<template>
  <section class="mx-auto w-full max-w-7xl space-y-6 p-4">
    <header
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <Icon name="kind-icon:tag" class="size-6 text-secondary" />
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-black">Facets</h1>
        <p class="text-sm text-base-content/60">
          Browse the canonical creative building blocks — genres, species,
          archetypes, moods, styles and more — shared across Characters, Bots,
          Dreams, Scenarios, and Art.
        </p>
      </div>
      <span
        v-if="catalog.loading"
        class="loading loading-spinner loading-sm"
        aria-label="Loading facets"
      />
      <span class="badge badge-ghost">{{ visibleCount }} shown</span>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full max-w-sm rounded-xl bg-base-200"
        placeholder="Search title, alias, description, or taxonomy..."
        aria-label="Search facets"
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
    </div>

    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>

    <div
      v-for="group in groups"
      :key="group.taxonomy"
      class="space-y-3"
    >
      <div class="flex items-baseline gap-2">
        <h2 class="text-lg font-black">{{ taxonomyLabel(group.taxonomy) }}</h2>
        <span class="badge badge-secondary badge-sm">{{ group.entries.length }}</span>
      </div>

      <!-- One kr-gallery per taxonomy group. The shell owns no scroll region,
           so mounting it N times is structurally fine, and `:modes="[]"` drops
           the view-mode bar -- this gallery is a fixed-shape taxonomy showcase,
           not a mode-switching browser. -->
      <kr-gallery
        :items="group.entries.map(toGalleryItem)"
        mode="cards"
        :modes="[]"
        empty-label="facets"
      />
    </div>

    <p
      v-if="!catalog.loading && !groups.length"
      class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50"
    >
      No facets match these filters.
    </p>
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

const catalog = useFacetCatalogStore()

const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const artOnly = ref(false)
const errorMessage = ref('')

/*
 * Kept for the `artOnly` filter below, which needs to know whether a facet has
 * ANY art regardless of which variant the current view would pick. Rendering no
 * longer uses it -- kr-gallery resolves the variant itself from `source`, so
 * this file no longer carries its own copy of the cardPath||imagePath||heroPath
 * chain that six components were each repeating.
 */
// Feeds the "illustrated only" filter, which needs to know whether a facet has
// ANY art rather than whether the card view happens to resolve one.
function facetArtwork(facet: FacetCatalogEntry): string | null {
  return resolveEntityArtwork(facet)
}

function iconName(facet: FacetCatalogEntry): string {
  const icon = facet.icon?.trim()
  return icon && icon.includes(':') ? icon : 'kind-icon:tag'
}

function toGalleryItem(facet: FacetCatalogEntry): GalleryItem {
  const badges = [{ label: taxonomyLabel(facet.taxonomy), class: 'badge-outline' }]
  if (facet.groupLabel) badges.push({ label: facet.groupLabel, class: 'badge-ghost' })

  return {
    id: facet.id,
    title: facet.title,
    description: facet.description || facet.flavorText || '',
    source: facet,
    badges,
    meta: facet.aliases.length ? facet.aliases.join(' · ') : '',
    placeholderIcon: iconName(facet),
    // Distinguishes "queued for art" from "never getting art" — the catalog
    // marks which facets are meant to be illustrated.
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
