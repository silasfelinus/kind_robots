<!-- /components/facets/facet-gallery.vue -->
<template>
  <section class="kr-surface">
    <!-- The shell renders the page title from content frontmatter (the brief's
         one-header rule), so this only carries the count and the loading state.
         showHeader lets a host that wants nothing at all drop even that. -->
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

    <!-- Controls WRAP. dream-gallery's toolbar is `overflow-x-auto` with
         shrink-0 children, which is why its layout picker scrolls off the right
         edge on an iPad and Silas could not find it (2026-08-02 review). -->
    <div v-if="showControls" class="kr-toolbar shrink-0">
      <!-- An icon until you tap it. Silas, 2026-08-10: "Make them an ICON that
           expands to an input only when selected." At `w-full max-w-sm` this
           bar was 384px of a toolbar that also has to hold a taxonomy select,
           an "Illustrated only" toggle and a layout select — which is why those
           wrapped away from the search on anything narrower than a laptop. -->
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

    <!-- THE one scroll region. Everything above pins. -->
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

        <!-- One kr-gallery per taxonomy group. The shell owns no scroll region,
             so mounting it N times is structurally fine, and `:modes="[]"` drops
             its own mode bar -- the picker above drives every group at once, so
             the groups stay visually consistent instead of drifting apart. -->
        <!-- page-size 0: entries are already capped per taxonomy group by
             this file's own show-more (`slice(0, shown[taxonomy] ?? PAGE)`). -->
        <kr-gallery
          themed
          :items="group.entries.map(toGalleryItem)"
          :page-size="0"
          :mode="mode"
          :modes="[]"
          empty-label="facets"
          @open="selectFacet"
        />

        <button
          v-if="group.entries.length < group.total"
          type="button"
          class="btn btn-ghost btn-sm w-full rounded-xl border border-base-300"
          @click="showMore(group.taxonomy)"
        >
          Show more {{ taxonomyLabel(group.taxonomy) }} ({{
            group.entries.length
          }}
          of {{ group.total }})
        </button>
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
import { computed, onMounted, ref, watch } from 'vue'
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

/*
 * Read-only by contract. utils/scripts/verifyFacetGallery.ts forbids
 * createFacet / updateFacet / archiveFacet / FacetProfileEditor in this file --
 * this is the picker, and editing belongs to the detail view it opens. Emitting
 * a selection rather than mutating anything is what keeps that true.
 */
const emit = defineEmits<{ select: [facet: FacetCatalogEntry] }>()

const catalog = useFacetCatalogStore()

// Was a private copy of the mode list — the ninth such duplicate, and the one
// that survived the 2026-08-03 consolidation because it lived under a local
// name rather than a shared type. Importing it is what keeps `list`'s removal
// from having to be repeated per gallery.

const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const artOnly = ref(false)
const errorMessage = ref('')
const mode = ref<GalleryMode>('cards')

/*
 * WINDOWING. The Facet catalog is ~1611 rows and the old /facets surface
 * rendered every one of them in a single pass, which is the first thing Silas
 * flagged on review (2026-08-02). Cap each taxonomy group and let the reader ask
 * for more, so the initial paint is bounded no matter how far the catalog grows.
 */
const PAGE = 24
const shown = ref<Partial<Record<FacetTaxonomy, number>>>({})

function showMore(taxonomy: FacetTaxonomy): void {
  shown.value = {
    ...shown.value,
    [taxonomy]: (shown.value[taxonomy] ?? PAGE) + PAGE,
  }
}

function selectFacet(item: { id: string | number }): void {
  const facet = catalog.entries.find((entry) => entry.id === Number(item.id))
  if (facet) emit('select', facet)
}

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

/* Each group capped to what has been asked for. `total` is the full match count,
   so the button can say "24 of 310" and the badge stays honest. */
const visibleGroups = computed(() =>
  groups.value.map((group) => ({
    taxonomy: group.taxonomy,
    total: group.entries.length,
    entries: group.entries.slice(0, shown.value[group.taxonomy] ?? PAGE),
  })),
)

const visibleCount = computed(() =>
  groups.value.reduce((sum, group) => sum + group.entries.length, 0),
)

// A new search or filter should start from the top of every group again.
watch([search, taxonomyFilter, artOnly], () => {
  shown.value = {}
})

onMounted(async () => {
  try {
    await catalog.fetchCatalog({ take: 1000 })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})
</script>
