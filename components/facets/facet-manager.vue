<!-- /components/facets/facet-manager.vue -->
<template>
  <section class="mx-auto w-full max-w-7xl space-y-4 p-4">
    <header
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <Icon name="kind-icon:tag" class="size-6 text-secondary" />
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-black">Facet Library</h1>
        <p class="text-sm text-base-content/60">
          Complete canonical profiles for reusable concepts across Characters,
          Dreams, Rewards, Scenarios, art, and random generation.
        </p>
      </div>
      <span v-if="facetStore.loading" class="loading loading-spinner loading-sm" />
      <span class="badge badge-ghost">{{ filteredFacets.length }} shown</span>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full max-w-sm rounded-xl bg-base-200"
        placeholder="Search title, alias, taxonomy, metadata, or art path..."
      />
      <select
        v-model="taxonomyFilter"
        class="select select-bordered select-sm rounded-xl"
      >
        <option :value="null">All taxonomies</option>
        <option
          v-for="taxonomy in FACET_TAXONOMIES"
          :key="taxonomy"
          :value="taxonomy"
        >
          {{ taxonomyLabel(taxonomy) }} ({{ taxonomyCounts[taxonomy] || 0 }})
        </option>
      </select>
      <label class="ml-auto flex items-center gap-2 text-xs text-base-content/60">
        <input
          v-model="showArchived"
          type="checkbox"
          class="toggle toggle-secondary toggle-xs"
        />
        Show archived
      </label>
    </div>

    <details
      class="rounded-2xl border border-base-300 bg-base-100"
      :open="createOpen"
    >
      <summary
        class="cursor-pointer px-4 py-3 text-sm font-bold text-base-content/70"
        @click.prevent="createOpen = !createOpen"
      >
        + Create a canonical Facet
      </summary>
      <div class="space-y-4 border-t border-base-300 p-4">
        <FacetProfileEditor v-model="createForm" />
        <button
          type="button"
          class="btn btn-secondary btn-sm w-full rounded-xl"
          :disabled="!createForm.title.trim() || facetStore.saving"
          @click="createFacet"
        >
          <span v-if="facetStore.saving" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:plus" class="size-3.5" />
          Create canonical Facet
        </button>
      </div>
    </details>

    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="facet in filteredFacets"
        :key="facet.id"
        class="overflow-hidden rounded-2xl border bg-base-100 transition-all"
        :class="[
          facet.isActive ? 'border-base-300' : 'border-error/40 opacity-60',
          editingId === facet.id ? 'md:col-span-2 xl:col-span-3 ring-2 ring-secondary/60' : '',
        ]"
      >
        <div
          v-if="facetArtwork(facet)"
          class="flex h-44 items-center justify-center bg-base-200"
        >
          <img
            :src="facetArtwork(facet) || ''"
            :alt="`${facet.title} curated artwork`"
            class="size-full object-contain"
            loading="lazy"
          />
        </div>

        <div class="p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-1">
                <span class="badge badge-secondary badge-xs">
                  {{ taxonomyLabel(facet.taxonomy) }}
                </span>
                <span v-if="facet.groupLabel" class="badge badge-outline badge-xs">
                  {{ facet.groupLabel }}
                </span>
                <span v-if="!facet.isActive" class="badge badge-error badge-xs">
                  archived
                </span>
                <span v-if="!facet.isPublic" class="badge badge-ghost badge-xs">
                  private
                </span>
              </div>
              <h2 class="mt-1 truncate text-base font-bold">{{ facet.title }}</h2>
              <p class="truncate text-xs text-base-content/40">
                {{ facet.canonicalValue }}
                <template v-if="facet.aliases.length"> · {{ facet.aliases.join(' · ') }}</template>
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              :aria-label="editingId === facet.id ? 'Close editor' : `Edit ${facet.title}`"
              @click="toggleEdit(facet)"
            >
              <Icon
                :name="editingId === facet.id ? 'kind-icon:x' : 'kind-icon:pencil'"
                class="size-4"
              />
            </button>
          </div>

          <template v-if="editingId !== facet.id">
            <p
              v-if="facet.description"
              class="mt-2 line-clamp-3 text-xs text-base-content/60"
            >
              {{ facet.description }}
            </p>
            <p
              v-if="facet.artPrompt"
              class="mt-2 line-clamp-2 text-[11px] italic text-base-content/45"
            >
              {{ facet.artPrompt }}
            </p>
            <div class="mt-3 flex flex-wrap gap-1 text-[11px]">
              <span class="badge badge-ghost badge-xs">order {{ facet.sortOrder }}</span>
              <span class="badge badge-ghost badge-xs">weight {{ facet.randomWeight }}</span>
              <span class="badge badge-ghost badge-xs">rank {{ facet.sourceRank }}</span>
              <span class="badge badge-ghost badge-xs">
                {{ facet.isRandomizable ? 'randomizable' : 'manual only' }}
              </span>
              <span class="badge badge-ghost badge-xs">
                {{ facet.artRequired ? 'art expected' : 'art optional' }}
              </span>
              <span v-if="facet.metadata" class="badge badge-ghost badge-xs">metadata</span>
            </div>

          </template>

          <div v-else class="mt-4 space-y-4">
            <FacetProfileEditor v-model="editForm" />
            <EntityArtManager
              entity-type="facet"
              :entity="facet"
              :slots="[
                {
                  field: 'imagePath',
                  label: 'Image',
                  aspect: '1 / 1',
                  width: 1024,
                  height: 1024,
                },
                {
                  field: 'iconPath',
                  label: 'Icon',
                  aspect: '1 / 1',
                  width: 256,
                  height: 256,
                },
                {
                  field: 'cardPath',
                  label: 'Card',
                  aspect: '2 / 3',
                  width: 512,
                  height: 768,
                },
                {
                  field: 'heroPath',
                  label: 'Hero',
                  aspect: '16 / 9',
                  width: 1280,
                  height: 720,
                },
              ]"
            />
            <div class="flex gap-2">
              <button
                type="button"
                class="btn btn-secondary btn-sm flex-1 rounded-xl"
                :disabled="!editForm.title.trim() || facetStore.saving"
                @click="saveEdit(facet.id)"
              >
                <span
                  v-if="facetStore.saving"
                  class="loading loading-spinner loading-xs"
                />
                Save canonical profile
              </button>
              <button
                v-if="facet.isActive"
                type="button"
                class="btn btn-outline btn-error btn-sm rounded-xl"
                :disabled="facetStore.saving"
                @click="archive(facet.id)"
              >
                Archive
              </button>
              <button
                v-else
                type="button"
                class="btn btn-outline btn-sm rounded-xl"
                :disabled="facetStore.saving"
                @click="restore(facet.id)"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>

    <p
      v-if="!facetStore.loading && !filteredFacets.length"
      class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50"
    >
      No Facets match these filters.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'
import {
  FACET_TAXONOMIES,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
import {
  blankFacetProfileForm,
  facetProfilePayload,
  facetToProfileForm,
  type FacetProfileForm,
} from '@/utils/facetProfileForm'

const facetStore = useFacetStore()
const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const showArchived = ref(false)
const errorMessage = ref('')
const editingId = ref<number | null>(null)
const createOpen = ref(false)
const createForm = ref<FacetProfileForm>(blankFacetProfileForm())
const editForm = ref<FacetProfileForm>(blankFacetProfileForm())

const visibleFacets = computed(() =>
  showArchived.value ? facetStore.facets : facetStore.activeFacets,
)

const taxonomyCounts = computed(() => {
  const counts: Partial<Record<FacetTaxonomy, number>> = {}
  for (const facet of visibleFacets.value) {
    counts[facet.taxonomy] = (counts[facet.taxonomy] || 0) + 1
  }
  return counts
})

const filteredFacets = computed(() => {
  const needle = normalizeFacetLookupKey(search.value)
  return visibleFacets.value.filter((facet) => {
    if (taxonomyFilter.value && facet.taxonomy !== taxonomyFilter.value) return false
    if (!needle) return true
    const values = [
      facet.title,
      facet.canonicalValue,
      facet.slug,
      facet.taxonomy,
      facet.groupKey,
      facet.groupLabel,
      facet.imagePath,
      facet.cardPath,
      facet.heroPath,
      facet.iconPath,
      facet.artPrompt,
      facet.metadata ? JSON.stringify(facet.metadata) : '',
      ...facet.aliases,
    ]
    return values.some((value) =>
      normalizeFacetLookupKey(value || '').includes(needle),
    )
  })
})

onMounted(async () => {
  try {
    await facetStore.fetchFacets({ includeInactive: true, includeMature: true })
  } catch (error) {
    setError(error, 'Facets could not be loaded.')
  }
})

function taxonomyLabel(taxonomy: FacetTaxonomy): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function facetArtwork(facet: FacetWithAliases): string | null {
  return facet.cardPath || facet.imagePath || facet.heroPath || facet.iconPath || null
}

function setError(error: unknown, fallback: string): void {
  errorMessage.value = error instanceof Error ? error.message : fallback
}

function toggleEdit(facet: FacetWithAliases): void {
  if (editingId.value === facet.id) {
    editingId.value = null
    return
  }
  editingId.value = facet.id
  editForm.value = facetToProfileForm(facet)
  errorMessage.value = ''
}

async function createFacet(): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.createFacet(facetProfilePayload(createForm.value))
    createForm.value = blankFacetProfileForm()
    createOpen.value = false
  } catch (error) {
    setError(error, 'Facet could not be created.')
  }
}

async function saveEdit(id: number): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(id, facetProfilePayload(editForm.value))
    editingId.value = null
  } catch (error) {
    setError(error, 'Facet could not be saved.')
  }
}

async function archive(id: number): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.archiveFacet(id)
    editingId.value = null
  } catch (error) {
    setError(error, 'Facet could not be archived.')
  }
}

async function restore(id: number): Promise<void> {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(id, { isActive: true })
    editingId.value = null
  } catch (error) {
    setError(error, 'Facet could not be restored.')
  }
}
</script>
