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
        placeholder="Add style, theme, mood, material, character trait…"
        @focus="open = true"
      />
      <div
        v-if="open && search.trim()"
        class="absolute z-40 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-1 shadow-xl"
      >
        <div
          v-for="facet in results"
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
            <span class="block truncate text-[11px] text-base-content/45">
              {{ taxonomyLabel(facet.taxonomy) }}
              <template v-if="facet.groupLabel"> · {{ facet.groupLabel }}</template>
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
        <p v-if="!results.length" class="px-3 py-3 text-xs text-base-content/45">
          No matching canonical Facet.
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

const results = computed(() => {
  const needle = normalizeFacetLookupKey(search.value)
  if (!needle) return []
  return catalog.entries
    .filter((facet) => {
      if (!facet.isActive) return false
      if (allowedTaxonomies.value && !allowedTaxonomies.value.has(facet.taxonomy)) {
        return false
      }
      return [
        facet.title,
        facet.canonicalValue,
        facet.slug || '',
        facet.taxonomy,
        facet.groupLabel || '',
        ...facet.aliases,
      ].some((value) => normalizeFacetLookupKey(value).includes(needle))
    })
    .slice(0, 40)
})

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
  return facet.cardPath || facet.imagePath || facet.heroPath || null
}

function taxonomyLabel(taxonomy: string): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}
</script>
