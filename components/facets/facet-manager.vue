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
          Canonical reusable concepts for Characters, Dreams, Scenarios, Art,
          and random generation. Aliases and curated artwork resolve to one
          record.
        </p>
      </div>
      <span
        v-if="facetStore.loading"
        class="loading loading-spinner loading-sm"
      />
      <span class="badge badge-ghost">{{ filteredFacets.length }} shown</span>
    </header>

    <div class="flex flex-wrap items-center gap-2">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full max-w-xs rounded-xl bg-base-200"
        placeholder="Search title, alias, taxonomy, group, or art path..."
      />
      <select
        v-model="taxonomyFilter"
        class="select select-bordered select-sm rounded-xl"
      >
        <option :value="null">All taxonomies</option>
        <option
          v-for="taxonomy in facetTaxonomies"
          :key="taxonomy"
          :value="taxonomy"
        >
          {{ taxonomyLabel(taxonomy) }} ({{ taxonomyCounts[taxonomy] || 0 }})
        </option>
      </select>
      <label
        class="ml-auto flex items-center gap-2 text-xs text-base-content/60"
      >
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
      <div
        class="grid gap-3 border-t border-base-300 p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <label class="form-control xl:col-span-2">
          <span class="label-text text-xs">Canonical title</span>
          <input
            v-model="newTitle"
            type="text"
            class="input input-bordered input-sm rounded-xl"
            placeholder="CowCore"
          />
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Taxonomy</span>
          <select
            v-model="newTaxonomy"
            class="select select-bordered select-sm rounded-xl"
          >
            <option
              v-for="taxonomy in facetTaxonomies"
              :key="taxonomy"
              :value="taxonomy"
            >
              {{ taxonomyLabel(taxonomy) }}
            </option>
          </select>
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Random weight</span>
          <input
            v-model.number="newRandomWeight"
            type="number"
            min="0"
            step="0.1"
            class="input input-bordered input-sm rounded-xl"
          />
        </label>
        <label class="form-control sm:col-span-2 xl:col-span-4">
          <span class="label-text text-xs">Aliases</span>
          <input
            v-model="newAliases"
            type="text"
            class="input input-bordered input-sm rounded-xl"
            placeholder="Aliases separated by commas"
          />
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Group key</span>
          <input
            v-model="newGroupKey"
            type="text"
            class="input input-bordered input-sm rounded-xl"
            placeholder="cosmic-species"
          />
        </label>
        <label class="form-control">
          <span class="label-text text-xs">Group label</span>
          <input
            v-model="newGroupLabel"
            type="text"
            class="input input-bordered input-sm rounded-xl"
            placeholder="Cosmic Species"
          />
        </label>
        <label class="form-control sm:col-span-2">
          <span class="label-text text-xs">Description</span>
          <textarea
            v-model="newDescription"
            class="textarea textarea-bordered min-h-20 rounded-xl"
            placeholder="What this reusable concept means..."
          />
        </label>

        <div
          class="rounded-2xl border border-base-300 bg-base-200/60 p-3 sm:col-span-2 xl:col-span-4"
        >
          <div class="mb-3 flex items-center gap-2">
            <Icon name="kind-icon:palette" class="size-4 text-accent" />
            <div>
              <h3 class="text-sm font-bold">Curated artwork</h3>
              <p class="text-xs text-base-content/50">
                Preserve the primary, card, and hero roles separately.
              </p>
            </div>
          </div>
          <div class="grid gap-3 lg:grid-cols-[12rem_1fr]">
            <div
              class="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-base-300/50"
            >
              <img
                v-if="newArtworkPreview"
                :src="newArtworkPreview"
                :alt="`${newTitle || 'New Facet'} artwork preview`"
                class="size-full object-contain"
                loading="lazy"
              />
              <Icon
                v-else
                name="kind-icon:image"
                class="size-10 text-base-content/20"
              />
            </div>
            <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <label class="form-control">
                <span class="label-text text-xs">Primary image path</span>
                <input
                  v-model="newImagePath"
                  type="text"
                  class="input input-bordered input-sm rounded-xl"
                  placeholder="/images/facets/example.webp"
                />
              </label>
              <label class="form-control">
                <span class="label-text text-xs">Card / portrait path</span>
                <input
                  v-model="newCardPath"
                  type="text"
                  class="input input-bordered input-sm rounded-xl"
                  placeholder="/images/facets/cards/example.webp"
                />
              </label>
              <label class="form-control">
                <span class="label-text text-xs">Hero / wide path</span>
                <input
                  v-model="newHeroPath"
                  type="text"
                  class="input input-bordered input-sm rounded-xl"
                  placeholder="/images/facets/heroes/example.webp"
                />
              </label>
              <label class="form-control sm:col-span-2 xl:col-span-3">
                <span class="label-text text-xs">Art prompt</span>
                <textarea
                  v-model="newArtPrompt"
                  class="textarea textarea-bordered min-h-20 rounded-xl"
                  placeholder="Prompt for generating or regenerating this Facet's artwork..."
                />
              </label>
            </div>
          </div>
        </div>

        <div
          class="flex flex-wrap items-center gap-5 text-xs sm:col-span-2 xl:col-span-4"
        >
          <label class="flex items-center gap-2">
            <input
              v-model="newIsRandomizable"
              type="checkbox"
              class="toggle toggle-secondary toggle-xs"
            />
            Available to randomizers
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="newArtRequired"
              type="checkbox"
              class="toggle toggle-accent toggle-xs"
            />
            Artwork expected
          </label>
          <label class="flex items-center gap-2">
            <input
              v-model="newIsPublic"
              type="checkbox"
              class="toggle toggle-primary toggle-xs"
            />
            Public
          </label>
        </div>
        <button
          type="button"
          class="btn btn-secondary btn-sm rounded-xl sm:col-span-2 xl:col-span-4"
          :disabled="!newTitle.trim() || facetStore.saving"
          @click="createFacet"
        >
          <span
            v-if="facetStore.saving"
            class="loading loading-spinner loading-xs"
          />
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
          editingId === facet.id ? 'ring-2 ring-secondary/60' : '',
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
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-1">
                <span class="badge badge-secondary badge-xs">
                  {{ taxonomyLabel(facet.taxonomy) }}
                </span>
                <span
                  v-if="facet.groupLabel"
                  class="badge badge-outline badge-xs"
                >
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
                {{ facet.aliases.join(' · ') }}
              </p>
            </div>
            <button
              type="button"
              class="btn btn-ghost btn-xs rounded-xl"
              :aria-label="
                editingId === facet.id ? 'Close editor' : `Edit ${facet.title}`
              "
              @click="toggleEdit(facet)"
            >
              <Icon
                :name="
                  editingId === facet.id ? 'kind-icon:x' : 'kind-icon:pencil'
                "
                class="size-4"
              />
            </button>
          </div>

          <p
            v-if="facet.description && editingId !== facet.id"
            class="mt-2 line-clamp-3 text-xs text-base-content/60"
          >
            {{ facet.description }}
          </p>

          <p
            v-if="facet.artPrompt && editingId !== facet.id"
            class="mt-2 line-clamp-2 text-[11px] italic text-base-content/45"
          >
            {{ facet.artPrompt }}
          </p>

          <div
            v-if="editingId !== facet.id"
            class="mt-3 flex flex-wrap gap-1 text-[11px]"
          >
            <span class="badge badge-ghost badge-xs">
              weight {{ facet.randomWeight }}
            </span>
            <span class="badge badge-ghost badge-xs">
              {{ facet.isRandomizable ? 'randomizable' : 'manual only' }}
            </span>
            <span class="badge badge-ghost badge-xs">
              {{ facet.artRequired ? 'art expected' : 'art optional' }}
            </span>
            <span v-if="facet.imagePath" class="badge badge-ghost badge-xs">
              primary art
            </span>
            <span v-if="facet.cardPath" class="badge badge-ghost badge-xs">
              card art
            </span>
            <span v-if="facet.heroPath" class="badge badge-ghost badge-xs">
              hero art
            </span>
          </div>

          <div
            v-if="editingId === facet.id"
            class="mt-3 grid gap-2 sm:grid-cols-2"
          >
            <input
              v-model="editForm.title"
              type="text"
              class="input input-bordered input-sm rounded-xl sm:col-span-2"
              placeholder="Title"
            />
            <select
              v-model="editForm.taxonomy"
              class="select select-bordered select-sm rounded-xl"
            >
              <option
                v-for="taxonomy in facetTaxonomies"
                :key="taxonomy"
                :value="taxonomy"
              >
                {{ taxonomyLabel(taxonomy) }}
              </option>
            </select>
            <input
              v-model.number="editForm.randomWeight"
              type="number"
              min="0"
              step="0.1"
              class="input input-bordered input-sm rounded-xl"
              aria-label="Random weight"
            />
            <input
              v-model="editForm.aliases"
              type="text"
              class="input input-bordered input-sm rounded-xl sm:col-span-2"
              placeholder="Aliases, comma separated"
            />
            <input
              v-model="editForm.groupKey"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Group key"
            />
            <input
              v-model="editForm.groupLabel"
              type="text"
              class="input input-bordered input-sm rounded-xl"
              placeholder="Group label"
            />
            <textarea
              v-model="editForm.description"
              class="textarea textarea-bordered min-h-20 rounded-xl sm:col-span-2"
              placeholder="Description"
            />

            <div
              class="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-base-200 sm:col-span-2"
            >
              <img
                v-if="editArtworkPreview"
                :src="editArtworkPreview"
                :alt="`${editForm.title || facet.title} artwork preview`"
                class="size-full object-contain"
                loading="lazy"
              />
              <Icon
                v-else
                name="kind-icon:image"
                class="size-9 text-base-content/20"
              />
            </div>
            <label class="form-control sm:col-span-2">
              <span class="label-text text-xs">Primary image path</span>
              <input
                v-model="editForm.imagePath"
                type="text"
                class="input input-bordered input-sm rounded-xl"
                placeholder="/images/facets/example.webp"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs">Card / portrait path</span>
              <input
                v-model="editForm.cardPath"
                type="text"
                class="input input-bordered input-sm rounded-xl"
                placeholder="/images/facets/cards/example.webp"
              />
            </label>
            <label class="form-control">
              <span class="label-text text-xs">Hero / wide path</span>
              <input
                v-model="editForm.heroPath"
                type="text"
                class="input input-bordered input-sm rounded-xl"
                placeholder="/images/facets/heroes/example.webp"
              />
            </label>
            <label class="form-control sm:col-span-2">
              <span class="label-text text-xs">Art prompt</span>
              <textarea
                v-model="editForm.artPrompt"
                class="textarea textarea-bordered min-h-20 rounded-xl"
                placeholder="Prompt for generating or regenerating this Facet's artwork..."
              />
            </label>

            <div class="flex flex-wrap gap-4 text-xs sm:col-span-2">
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.isRandomizable"
                  type="checkbox"
                  class="toggle toggle-secondary toggle-xs"
                />
                Randomizable
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.artRequired"
                  type="checkbox"
                  class="toggle toggle-accent toggle-xs"
                />
                Art expected
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.isPublic"
                  type="checkbox"
                  class="toggle toggle-secondary toggle-xs"
                />
                Public
              </label>
              <label class="flex items-center gap-1">
                <input
                  v-model="editForm.isMature"
                  type="checkbox"
                  class="toggle toggle-warning toggle-xs"
                />
                Mature
              </label>
            </div>
            <div class="flex gap-2 sm:col-span-2">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { FacetKind } from '~/prisma/generated/prisma/client'
import { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'
import {
  FACET_TAXONOMIES,
  type FacetTaxonomy,
} from '@/stores/facetCatalogStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

const facetStore = useFacetStore()
const facetTaxonomies = [...FACET_TAXONOMIES]

const search = ref('')
const taxonomyFilter = ref<FacetTaxonomy | null>(null)
const showArchived = ref(false)
const errorMessage = ref('')
const editingId = ref<number | null>(null)
const createOpen = ref(false)

const newTitle = ref('')
const newTaxonomy = ref<FacetTaxonomy>('OTHER')
const newAliases = ref('')
const newDescription = ref('')
const newGroupKey = ref('')
const newGroupLabel = ref('')
const newImagePath = ref('')
const newCardPath = ref('')
const newHeroPath = ref('')
const newArtPrompt = ref('')
const newRandomWeight = ref(1)
const newIsRandomizable = ref(true)
const newArtRequired = ref(true)
const newIsPublic = ref(true)

const editForm = reactive({
  title: '',
  taxonomy: 'OTHER' as FacetTaxonomy,
  aliases: '',
  description: '',
  groupKey: '',
  groupLabel: '',
  imagePath: '',
  cardPath: '',
  heroPath: '',
  artPrompt: '',
  randomWeight: 1,
  isRandomizable: true,
  artRequired: true,
  isPublic: true,
  isMature: false,
})

const broadKinds = new Set<FacetTaxonomy>([
  'GENRE',
  'ANIMAL',
  'COLOR',
  'THEME',
  'CORE',
  'MOOD',
  'STYLE',
  'SETTING',
  'ART_DIRECTION',
  'OTHER',
])

function kindForTaxonomy(taxonomy: FacetTaxonomy): FacetKind {
  if (taxonomy === 'PROMPT_ENHANCEMENT') return 'ART_DIRECTION'
  return broadKinds.has(taxonomy) ? (taxonomy as FacetKind) : 'OTHER'
}

watch(newTaxonomy, (taxonomy) => {
  newArtRequired.value = taxonomy !== 'COLOR'
})

const newArtworkPreview = computed(
  () =>
    newCardPath.value.trim() ||
    newImagePath.value.trim() ||
    newHeroPath.value.trim() ||
    null,
)

const editArtworkPreview = computed(
  () =>
    editForm.cardPath.trim() ||
    editForm.imagePath.trim() ||
    editForm.heroPath.trim() ||
    null,
)

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
    if (taxonomyFilter.value && facet.taxonomy !== taxonomyFilter.value) {
      return false
    }
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
      facet.artPrompt,
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
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})

function taxonomyLabel(taxonomy: FacetTaxonomy): string {
  return taxonomy
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function splitAliases(value: string): string[] {
  return value
    .split(',')
    .map((alias) => alias.trim())
    .filter(Boolean)
}

function facetArtwork(facet: FacetWithAliases): string | null {
  return facet.cardPath || facet.imagePath || facet.heroPath || null
}

function toggleEdit(facet: FacetWithAliases) {
  if (editingId.value === facet.id) {
    editingId.value = null
    return
  }
  editingId.value = facet.id
  editForm.title = facet.title
  editForm.taxonomy = facet.taxonomy
  editForm.aliases = facet.aliases
    .filter((alias) => alias !== facet.slug)
    .join(', ')
  editForm.description = facet.description || ''
  editForm.groupKey = facet.groupKey || ''
  editForm.groupLabel = facet.groupLabel || ''
  editForm.imagePath = facet.imagePath || ''
  editForm.cardPath = facet.cardPath || ''
  editForm.heroPath = facet.heroPath || ''
  editForm.artPrompt = facet.artPrompt || ''
  editForm.randomWeight = facet.randomWeight
  editForm.isRandomizable = facet.isRandomizable
  editForm.artRequired = facet.artRequired
  editForm.isPublic = facet.isPublic
  editForm.isMature = facet.isMature
}

async function createFacet() {
  errorMessage.value = ''
  try {
    await facetStore.createFacet({
      title: newTitle.value.trim(),
      kind: kindForTaxonomy(newTaxonomy.value),
      taxonomy: newTaxonomy.value,
      aliases: splitAliases(newAliases.value),
      description: newDescription.value.trim() || null,
      groupKey: newGroupKey.value.trim() || null,
      groupLabel: newGroupLabel.value.trim() || null,
      imagePath: newImagePath.value.trim() || null,
      cardPath: newCardPath.value.trim() || null,
      heroPath: newHeroPath.value.trim() || null,
      artPrompt: newArtPrompt.value.trim() || null,
      randomWeight: Math.max(0, Number(newRandomWeight.value) || 0),
      isRandomizable: newIsRandomizable.value,
      artRequired: newArtRequired.value,
      isPublic: newIsPublic.value,
    })
    newTitle.value = ''
    newAliases.value = ''
    newDescription.value = ''
    newGroupKey.value = ''
    newGroupLabel.value = ''
    newImagePath.value = ''
    newCardPath.value = ''
    newHeroPath.value = ''
    newArtPrompt.value = ''
    createOpen.value = false
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be created.'
  }
}

async function saveEdit(id: number) {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(id, {
      title: editForm.title.trim(),
      kind: kindForTaxonomy(editForm.taxonomy),
      taxonomy: editForm.taxonomy,
      aliases: splitAliases(editForm.aliases),
      description: editForm.description.trim() || null,
      groupKey: editForm.groupKey.trim() || null,
      groupLabel: editForm.groupLabel.trim() || null,
      imagePath: editForm.imagePath.trim() || null,
      cardPath: editForm.cardPath.trim() || null,
      heroPath: editForm.heroPath.trim() || null,
      artPrompt: editForm.artPrompt.trim() || null,
      randomWeight: Math.max(0, Number(editForm.randomWeight) || 0),
      isRandomizable: editForm.isRandomizable,
      artRequired: editForm.artRequired,
      isPublic: editForm.isPublic,
      isMature: editForm.isMature,
    })
    editingId.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be saved.'
  }
}

async function archive(id: number) {
  errorMessage.value = ''
  try {
    await facetStore.archiveFacet(id)
    editingId.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be archived.'
  }
}

async function restore(id: number) {
  errorMessage.value = ''
  try {
    await facetStore.updateFacet(id, { isActive: true })
    editingId.value = null
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be restored.'
  }
}
</script>
