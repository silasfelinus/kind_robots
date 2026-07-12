<!-- /components/facets/facet-picker.vue -->
<template>
  <section class="space-y-3 rounded-2xl border border-base-300 bg-base-100 p-4">
    <div class="flex flex-wrap items-center gap-2">
      <Icon name="kind-icon:tag" class="size-4 text-secondary" />
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-bold">{{ label }}</h3>
        <p class="text-xs text-base-content/50">
          Reusable flavor shared by Dreams, Scenarios, and Art. Aliases resolve
          to one canonical Facet.
        </p>
      </div>
      <span
        v-if="saving || loadingAssignments"
        class="loading loading-spinner loading-xs"
      />
      <span class="badge badge-ghost badge-sm">{{
        selectedFacets.length
      }}</span>
    </div>

    <div v-if="selectedFacets.length" class="flex flex-wrap gap-2">
      <button
        v-for="facet in selectedFacets"
        :key="facet.id"
        type="button"
        class="badge badge-secondary badge-lg gap-1 rounded-xl"
        :title="facetTitle(facet)"
        :disabled="saving"
        @click="removeFacet(facet.id)"
      >
        <span>{{ facet.title }}</span>
        <span class="text-secondary-content/60">×</span>
      </button>
    </div>

    <div class="relative">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full rounded-xl bg-base-200"
        placeholder="Search title, slug, or alias — try cow, cows, cowCore..."
        @focus="showResults = true"
      />

      <div
        v-if="showResults && search.trim()"
        class="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-base-300 bg-base-100 p-1 shadow-xl"
      >
        <button
          v-for="facet in searchResults"
          :key="facet.id"
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-base-200 disabled:opacity-40"
          :disabled="selectedIds.has(facet.id) || saving"
          @click="addFacet(facet.id)"
        >
          <span class="badge badge-outline badge-xs shrink-0">{{
            kindLabel(facet.kind)
          }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold">{{
              facet.title
            }}</span>
            <span class="block truncate text-xs text-base-content/40">
              {{ facet.aliases.join(' · ') }}
            </span>
          </span>
          <Icon name="kind-icon:plus" class="size-3.5 shrink-0" />
        </button>

        <p
          v-if="!searchResults.length"
          class="px-3 py-3 text-xs text-base-content/40"
        >
          No matching Facet. Create one below.
        </p>
      </div>
    </div>

    <details class="rounded-xl border border-base-300 bg-base-200/60">
      <summary
        class="cursor-pointer px-3 py-2 text-xs font-bold text-base-content/60"
      >
        Create a new Facet
      </summary>
      <div class="grid gap-2 border-t border-base-300 p-3 sm:grid-cols-2">
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
        <button
          type="button"
          class="btn btn-secondary btn-sm rounded-xl sm:col-span-2"
          :disabled="!newTitle.trim() || facetStore.saving"
          @click="createAndAddFacet"
        >
          <span
            v-if="facetStore.saving"
            class="loading loading-spinner loading-xs"
          />
          <Icon v-else name="kind-icon:plus" class="size-3.5" />
          Create and attach
        </button>
      </div>
    </details>

    <p v-if="errorMessage" class="text-xs text-error">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { FacetKind } from '~/prisma/generated/prisma/client'
import {
  useFacetStore,
  type FacetOwnerType,
  type FacetWithAliases,
} from '@/stores/facetStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    ownerType: FacetOwnerType
    ownerId?: number | null
    label?: string
  }>(),
  {
    ownerId: null,
    label: 'Facets',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const facetStore = useFacetStore()
const search = ref('')
const showResults = ref(false)
const loadingAssignments = ref(false)
const errorMessage = ref('')
const newTitle = ref('')
const newAliases = ref('')
const newKind = ref<FacetKind>('OTHER')

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

const saving = computed(() => facetStore.saving)
const selectedIds = computed(() => new Set(props.modelValue))
const selectedFacets = computed(() =>
  props.modelValue
    .map((id) => facetStore.facets.find((facet) => facet.id === id))
    .filter((facet): facet is FacetWithAliases => Boolean(facet)),
)

const searchResults = computed(() => {
  const needle = normalizeFacetLookupKey(search.value)
  if (!needle) return []

  return facetStore.activeFacets
    .filter((facet) => {
      const values = [facet.title, facet.slug, ...facet.aliases]
      return values.some((value) =>
        normalizeFacetLookupKey(value || '').includes(needle),
      )
    })
    .slice(0, 30)
})

onMounted(async () => {
  try {
    if (!facetStore.loaded) await facetStore.fetchFacets()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be loaded.'
  }
})

watch(
  () => [props.ownerType, props.ownerId] as const,
  async ([ownerType, ownerId]) => {
    if (!ownerId || ownerId <= 0) return
    loadingAssignments.value = true
    errorMessage.value = ''
    try {
      const facets = await facetStore.fetchOwnerFacets(ownerType, ownerId)
      emit(
        'update:modelValue',
        facets.map((facet) => facet.id),
      )
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'Assigned Facets could not be loaded.'
    } finally {
      loadingAssignments.value = false
    }
  },
  { immediate: true },
)

function kindLabel(kind: FacetKind): string {
  return kind
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function facetTitle(facet: FacetWithAliases): string {
  return `${kindLabel(facet.kind)} · ${facet.aliases.join(', ')}`
}

async function persist(next: number[]) {
  emit('update:modelValue', next)
  if (!props.ownerId || props.ownerId <= 0) return

  errorMessage.value = ''
  try {
    await facetStore.setOwnerFacets(props.ownerType, props.ownerId, next)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facets could not be saved.'
  }
}

async function addFacet(facetId: number) {
  if (selectedIds.value.has(facetId)) return
  await persist([...props.modelValue, facetId])
  search.value = ''
  showResults.value = false
}

async function removeFacet(facetId: number) {
  await persist(props.modelValue.filter((id) => id !== facetId))
}

async function createAndAddFacet() {
  const title = newTitle.value.trim()
  if (!title) return

  errorMessage.value = ''
  try {
    const facet = await facetStore.createFacet({
      title,
      kind: newKind.value,
      aliases: newAliases.value
        .split(',')
        .map((alias) => alias.trim())
        .filter(Boolean),
      isPublic: true,
    })
    await addFacet(facet.id)
    newTitle.value = ''
    newAliases.value = ''
    newKind.value = 'OTHER'
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Facet could not be created.'
  }
}
</script>
