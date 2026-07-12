<!-- /components/facets/facet-manager.vue -->
<template>
  <section class="mx-auto w-full max-w-6xl space-y-4 p-4">
    <header
      class="flex flex-wrap items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <Icon name="kind-icon:tag" class="size-6 text-secondary" />
      <div class="min-w-0 flex-1">
        <h1 class="text-xl font-black">Facet Library</h1>
        <p class="text-sm text-base-content/60">
          The reusable flavor shared by Dreams, Scenarios, and Art. Aliases
          resolve to one canonical Facet.
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
        placeholder="Search title, slug, or alias..."
      />
      <div class="flex flex-wrap gap-1">
        <button
          type="button"
          class="btn btn-xs rounded-xl"
          :class="kindFilter === null ? 'btn-secondary' : 'btn-ghost'"
          @click="kindFilter = null"
        >
          All
        </button>
        <button
          v-for="kind in facetKinds"
          :key="kind"
          type="button"
          class="btn btn-xs rounded-xl"
          :class="kindFilter === kind ? 'btn-secondary' : 'btn-ghost'"
          @click="kindFilter = kindFilter === kind ? null : kind"
        >
          {{ kindLabel(kind) }}
          <span class="opacity-50">{{ kindCounts[kind] || 0 }}</span>
        </button>
      </div>
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
        + Create a new Facet
      </summary>
      <div class="grid gap-2 border-t border-base-300 p-4 sm:grid-cols-2">
        <input
          v-model="newTitle"
          type="text"
          class="input input-bordered input-sm rounded-xl"
          placeholder="Canonical title, e.g. CowCore"
        />
        <select
          v-model="newKind"
          class="select select-bordered select-sm rounded-xl"
        >
          <option v-for="kind in facetKinds" :key="kind" :value="kind">
            {{ kindLabel(kind) }}
          </option>
        </select>
        <input
          v-model="newAliases"
          type="text"
          class="input input-bordered input-sm rounded-xl sm:col-span-2"
          placeholder="Aliases separated by commas, e.g. cow, cows"
        />
        <textarea
          v-model="newDescription"
          class="textarea textarea-bordered min-h-16 rounded-xl sm:col-span-2"
          placeholder="What this facet means (optional)..."
        />
        <button
          type="button"
          class="btn btn-secondary btn-sm rounded-xl sm:col-span-2"
          :disabled="!newTitle.trim() || facetStore.saving"
          @click="createFacet"
        >
          <span
            v-if="facetStore.saving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:plus" class="size-3.5" />
          Create Facet
        </button>
      </div>
    </details>

    <p v-if="errorMessage" class="text-sm text-error">{{ errorMessage }}</p>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="facet in filteredFacets"
        :key="facet.id"
        class="rounded-2xl border bg-base-100 p-4 transition-all"
        :class="[
          facet.isActive ? 'border-base-300' : 'border-error/40 opacity-60',
          editingId === facet.id ? 'ring-2 ring-secondary/60' : '',
        ]"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <span class="badge badge-outline badge-xs shrink-0">
                {{ kindLabel(facet.kind) }}
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

        <div v-if="editingId === facet.id" class="mt-3 space-y-2">
          <input
            v-model="editForm.title"
            type="text"
            class="input input-bordered input-sm w-full rounded-xl"
            placeholder="Title"
          />
          <select
            v-model="editForm.kind"
            class="select select-bordered select-sm w-full rounded-xl"
          >
            <option v-for="kind in facetKinds" :key="kind" :value="kind">
              {{ kindLabel(kind) }}
            </option>
          </select>
          <input
            v-model="editForm.aliases"
            type="text"
            class="input input-bordered input-sm w-full rounded-xl"
            placeholder="Aliases, comma separated"
          />
          <textarea
            v-model="editForm.description"
            class="textarea textarea-bordered min-h-16 w-full rounded-xl"
            placeholder="Description"
          />
          <div class="flex items-center gap-3 text-xs">
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
              Save
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
      </article>
    </div>

    <p
      v-if="!facetStore.loading && !filteredFacets.length"
      class="rounded-2xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/50"
    >
      No facets match. Create one above to start the library.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { FacetKind } from '~/prisma/generated/prisma/client'
import { useFacetStore, type FacetWithAliases } from '@/stores/facetStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

const facetStore = useFacetStore()

const search = ref('')
const kindFilter = ref<FacetKind | null>(null)
const showArchived = ref(false)
const errorMessage = ref('')
const editingId = ref<number | null>(null)
const createOpen = ref(false)

const newTitle = ref('')
const newKind = ref<FacetKind>('OTHER')
const newAliases = ref('')
const newDescription = ref('')

const editForm = reactive({
  title: '',
  kind: 'OTHER' as FacetKind,
  aliases: '',
  description: '',
  isPublic: true,
  isMature: false,
})

const facetKinds: FacetKind[] = [
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
]

const visibleFacets = computed(() =>
  showArchived.value ? facetStore.facets : facetStore.activeFacets,
)

const kindCounts = computed(() => {
  const counts: Partial<Record<FacetKind, number>> = {}
  for (const facet of visibleFacets.value) {
    counts[facet.kind] = (counts[facet.kind] || 0) + 1
  }
  return counts
})

const filteredFacets = computed(() => {
  const needle = normalizeFacetLookupKey(search.value)
  return visibleFacets.value.filter((facet) => {
    if (kindFilter.value && facet.kind !== kindFilter.value) return false
    if (!needle) return true
    const values = [facet.title, facet.slug, ...facet.aliases]
    return values.some((value) =>
      normalizeFacetLookupKey(value || '').includes(needle),
    )
  })
})

onMounted(async () => {
  try {
    await facetStore.fetchFacets({ includeInactive: true })
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})

function kindLabel(kind: FacetKind): string {
  return kind
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

function toggleEdit(facet: FacetWithAliases) {
  if (editingId.value === facet.id) {
    editingId.value = null
    return
  }
  editingId.value = facet.id
  editForm.title = facet.title
  editForm.kind = facet.kind
  // The canonical slug leads the alias list; only the extra aliases are editable.
  editForm.aliases = facet.aliases
    .filter((alias) => alias !== facet.slug)
    .join(', ')
  editForm.description = facet.description || ''
  editForm.isPublic = facet.isPublic
  editForm.isMature = facet.isMature
}

async function createFacet() {
  errorMessage.value = ''
  try {
    await facetStore.createFacet({
      title: newTitle.value.trim(),
      kind: newKind.value,
      aliases: splitAliases(newAliases.value),
      description: newDescription.value.trim() || null,
      isPublic: true,
    })
    newTitle.value = ''
    newAliases.value = ''
    newDescription.value = ''
    newKind.value = 'OTHER'
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
      kind: editForm.kind,
      aliases: splitAliases(editForm.aliases),
      description: editForm.description.trim() || null,
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
