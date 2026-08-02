<!-- /components/art/art-facet-selector.vue -->
<template>
  <section class="space-y-2 rounded-2xl border border-base-300 bg-base-100 p-3">
    <div class="flex items-center gap-2">
      <Icon name="kind-icon:tag" class="size-4 text-secondary" />
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-bold">{{ label }}</h3>
        <p v-if="!compact" class="text-xs text-base-content/50">
          Canonical creative direction recorded on the ArtJob and finished image.
        </p>
      </div>
      <button
        v-if="modelValue.length"
        type="button"
        class="btn btn-ghost btn-xs rounded-xl"
        @click="emitValue([])"
      >
        Clear
      </button>
    </div>

    <div v-if="selectedFacets.length" class="flex flex-wrap gap-1.5">
      <button
        v-for="facet in selectedFacets"
        :key="facet.id"
        type="button"
        class="badge badge-secondary h-auto min-h-7 gap-1 rounded-xl py-1 pl-1"
        :title="`${taxonomyLabel(facet.taxonomy)} · click to remove`"
        @click="removeFacet(facet.id)"
      >
        <span
          v-if="facetArtwork(facet)"
          class="size-5 overflow-hidden rounded-lg bg-base-200"
        >
          <img
            :src="facetArtwork(facet) || ''"
            :alt="`${facet.title} artwork`"
            class="size-full object-cover"
          />
        </span>
        {{ facet.title }}
        <span class="opacity-60">×</span>
      </button>
    </div>

    <div class="relative">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full rounded-xl bg-base-200"
        placeholder="Search or browse styles, themes, moods, materials, traits…"
        @focus="open = true"
        @keydown.esc="open = false"
      />
      <button
        v-if="open"
        type="button"
        class="fixed inset-0 z-30 cursor-default"
        aria-hidden="true"
        tabindex="-1"
        @click="open = false"
      />
      <div
        v-if="open"
        class="absolute z-40 mt-1 max-h-80 w-full overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-1 shadow-xl"
      >
        <template v-for="group in groupedResults" :key="group.taxonomy">
          <div
            class="sticky top-0 z-10 flex items-center gap-2 bg-base-100/95 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-base-content/45 backdrop-blur"
          >
            <Icon name="kind-icon:tag" class="size-3" />
            {{ group.label }}
            <span class="font-semibold text-base-content/25">{{ group.facets.length }}</span>
          </div>
          <div
            v-for="facet in group.facets"
            :key="facet.id"
            class="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-base-200"
          >
            <span
              class="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200"
            >
              <img
                v-if="facetArtwork(facet)"
                :src="facetArtwork(facet) || ''"
                :alt="`${facet.title} artwork`"
                class="size-full object-cover"
                loading="lazy"
              />
              <Icon v-else :name="facet.icon || 'kind-icon:tag'" class="size-4" />
            </span>
            <button
              type="button"
              class="min-w-0 flex-1 text-left disabled:opacity-40"
              :disabled="selectedSet.has(facet.id)"
              @click="addFacet(facet.id)"
            >
              <span class="block truncate text-sm font-semibold">{{ facet.title }}</span>
              <span
                v-if="facet.groupLabel"
                class="block truncate text-[11px] text-base-content/45"
              >
                {{ facet.groupLabel }}
              </span>
            </button>
            <button
              v-if="!facetArtwork(facet)"
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              :disabled="artRequests.requesting[facet.id]"
              :title="`Request curated artwork for ${facet.title}`"
              @click="requestArtwork(facet)"
            >
              <span
                v-if="artRequests.requesting[facet.id]"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:image" class="size-3.5" />
              {{ artRequests.requested[facet.id] ? 'Requested' : 'Art' }}
            </button>
            <button
              type="button"
              class="btn btn-ghost btn-xs btn-circle"
              :disabled="selectedSet.has(facet.id)"
              aria-label="Add Facet"
              @click="addFacet(facet.id)"
            >
              <Icon name="kind-icon:plus" class="size-3.5" />
            </button>
          </div>
        </template>
        <p v-if="!hasResults" class="px-3 py-3 text-xs text-base-content/45">
          {{ search.trim() ? 'No matching canonical Facet.' : 'No Facets available yet.' }}
        </p>
      </div>
    </div>

    <p v-if="requestMessage" class="text-xs" :class="requestMessageClass">
      {{ requestMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  useFacetCatalogStore,
  type FacetCatalogEntry,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { useFacetArtRequestStore } from '@/stores/facetArtRequestStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
import { resolveEntityArtwork } from '@/utils/artImageSrc'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    label?: string
    compact?: boolean
    taxonomies?: FacetTaxonomy[] | null
  }>(),
  {
    label: 'Creative Facets',
    compact: false,
    taxonomies: null,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const catalog = useFacetCatalogStore()
const artRequests = useFacetArtRequestStore()
const search = ref('')
const open = ref(false)
const requestMessage = ref('')
const requestMessageClass = ref('text-success')
const selectedSet = computed(() => new Set(props.modelValue))
const allowedTaxonomies = computed(() =>
  props.taxonomies?.length ? new Set(props.taxonomies) : null,
)

const selectedFacets = computed(() => {
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]))
  return props.modelValue
    .map((id) => byId.get(id))
    .filter((entry): entry is FacetCatalogEntry => Boolean(entry))
})

const activeSearch = computed(() => normalizeFacetLookupKey(search.value))

const matches = computed(() => {
  const needle = activeSearch.value
  return catalog.entries.filter((facet) => {
    if (!facet.isActive) return false
    if (allowedTaxonomies.value && !allowedTaxonomies.value.has(facet.taxonomy)) {
      return false
    }
    if (!needle) return true
    return [
      facet.title,
      facet.canonicalValue,
      facet.slug || '',
      facet.taxonomy,
      facet.groupLabel || '',
      ...facet.aliases,
    ].some((value) => normalizeFacetLookupKey(value).includes(needle))
  })
})

// Group results by taxonomy so the picker reads as labelled categories. When
// browsing (no search) each group is capped so focusing the field previews the
// catalog without rendering hundreds of rows; a search widens each group.
const groupedResults = computed(() => {
  const browsing = !activeSearch.value
  const perGroupCap = browsing ? 6 : 24
  const groups = new Map<FacetTaxonomy, FacetCatalogEntry[]>()
  for (const facet of matches.value) {
    const list = groups.get(facet.taxonomy) ?? []
    if (list.length < perGroupCap) list.push(facet)
    groups.set(facet.taxonomy, list)
  }
  return Array.from(groups.entries())
    .map(([taxonomy, facets]) => ({
      taxonomy,
      label: taxonomyLabel(taxonomy),
      facets,
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(0, 14)
})

const hasResults = computed(() =>
  groupedResults.value.some((group) => group.facets.length > 0),
)

onMounted(async () => {
  if (!catalog.loaded) {
    await catalog.fetchCatalog({ includeMature: true, take: 1000 })
  }
})

function emitValue(ids: number[]): void {
  emit(
    'update:modelValue',
    [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))].slice(0, 50),
  )
}

function addFacet(id: number): void {
  emitValue([...props.modelValue, id])
  search.value = ''
  open.value = false
}

function removeFacet(id: number): void {
  emitValue(props.modelValue.filter((value) => value !== id))
}

async function requestArtwork(facet: FacetCatalogEntry): Promise<void> {
  const path = await artRequests.requestPrimaryArtwork(facet)
  requestMessageClass.value = path ? 'text-success' : 'text-error'
  requestMessage.value = path
    ? `Queued curated artwork for ${facet.title} → ${path}`
    : artRequests.errors[facet.id] || 'Artwork request failed.'
}

function facetArtwork(facet: FacetCatalogEntry): string | null {
  return resolveEntityArtwork(facet)
}

function taxonomyLabel(taxonomy: string): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>
