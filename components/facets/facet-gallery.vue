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

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <article
          v-for="facet in group.entries"
          :key="facet.id"
          class="group overflow-hidden rounded-2xl border border-base-300 bg-base-100 transition-all hover:shadow-lg"
        >
          <div class="relative flex h-40 items-center justify-center bg-base-200">
            <img
              v-if="facetArtwork(facet)"
              :src="facetArtwork(facet) || ''"
              :alt="`${facet.title} artwork`"
              class="size-full object-cover"
              loading="lazy"
            />
            <div
              v-else
              class="flex size-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-base-200 to-base-300 text-base-content/40"
            >
              <Icon
                :name="iconName(facet)"
                class="size-8"
              />
              <span class="text-[10px] uppercase tracking-wide">
                {{ facet.artRequired ? 'art pending' : 'no art' }}
              </span>
            </div>
          </div>

          <div class="space-y-1.5 p-3">
            <div class="flex flex-wrap items-center gap-1">
              <span class="badge badge-outline badge-xs">
                {{ taxonomyLabel(facet.taxonomy) }}
              </span>
              <span v-if="facet.groupLabel" class="badge badge-ghost badge-xs">
                {{ facet.groupLabel }}
              </span>
            </div>
            <h3 class="truncate text-sm font-bold" :title="facet.title">
              {{ facet.title }}
            </h3>
            <p
              v-if="facet.description"
              class="line-clamp-2 text-xs text-base-content/60"
            >
              {{ facet.description }}
            </p>
            <p
              v-else-if="facet.flavorText"
              class="line-clamp-2 text-xs italic text-base-content/50"
            >
              {{ facet.flavorText }}
            </p>
            <p
              v-if="facet.aliases.length"
              class="truncate text-[11px] text-base-content/35"
              :title="facet.aliases.join(' · ')"
            >
              {{ facet.aliases.join(' · ') }}
            </p>

            <button
              v-if="canRequestArt && facet.artRequired && !facetArtwork(facet)"
              type="button"
              class="btn btn-outline btn-accent btn-xs w-full rounded-lg"
              :disabled="artRequestStore.requesting[facet.id]"
              @click="requestArt(facet)"
            >
              <span
                v-if="artRequestStore.requesting[facet.id]"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:palette" class="size-3.5" />
              {{
                artRequestStore.requested[facet.id]
                  ? 'Artwork requested'
                  : 'Request artwork'
              }}
            </button>
          </div>
        </article>
      </div>
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
import { useFacetArtRequestStore } from '@/stores/facetArtRequestStore'
import { useUserStore } from '@/stores/userStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

const catalog = useFacetCatalogStore()
const artRequestStore = useFacetArtRequestStore()
const userStore = useUserStore()

const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const artOnly = ref(false)
const errorMessage = ref('')

const canRequestArt = computed(() => userStore.isAdmin)

function facetArtwork(facet: FacetCatalogEntry): string | null {
  return facet.cardPath || facet.imagePath || facet.heroPath || null
}

function iconName(facet: FacetCatalogEntry): string {
  const icon = facet.icon?.trim()
  return icon && icon.includes(':') ? icon : 'kind-icon:tag'
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

async function requestArt(facet: FacetCatalogEntry): Promise<void> {
  errorMessage.value = ''
  const path = await artRequestStore.requestPrimaryArtwork(facet)
  if (!path && artRequestStore.errors[facet.id]) {
    errorMessage.value =
      artRequestStore.errors[facet.id] || 'Artwork request failed.'
  }
}

onMounted(async () => {
  try {
    await catalog.fetchCatalog({ take: 1000 })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})
</script>
