<!-- /components/rewards/reward-facet-picker.vue -->
<template>
  <section class="space-y-3 kr-panel-flat p-4">
    <div class="flex flex-wrap items-center gap-2">
      <Icon name="kind-icon:tag" class="size-4 text-secondary" />
      <div class="min-w-0 flex-1">
        <h3 class="text-sm font-bold">Reward Facets</h3>
        <p class="text-xs text-base-content/50">
          Materials, colors, themes, and other reusable traits that shape the
          object independently of its name.
        </p>
      </div>
      <span v-if="loading || saving" class="loading loading-spinner loading-xs" />
      <span class="badge badge-ghost badge-sm">{{ selectedFacets.length }}</span>
    </div>

    <div v-if="selectedFacets.length" class="flex flex-wrap gap-2">
      <button
        v-for="facet in selectedFacets"
        :key="facet.id"
        type="button"
        class="badge badge-secondary badge-lg h-auto min-h-8 gap-1 rounded-xl py-1 pl-1"
        :disabled="saving"
        @click="removeFacet(facet.id)"
      >
        <span
          v-if="artwork(facet)"
          class="size-6 shrink-0 overflow-hidden rounded-lg bg-base-200"
        >
          <img
            :src="artwork(facet) || ''"
            :alt="`${facet.title} artwork`"
            class="size-full object-cover"
          />
        </span>
        <span>{{ facet.title }}</span>
        <span class="text-secondary-content/60">×</span>
      </button>
    </div>

    <div class="relative">
      <input
        v-model="search"
        type="search"
        class="input input-bordered input-sm w-full rounded-xl bg-base-200"
        placeholder="Search materials, colors, themes, styles..."
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
          class="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-base-200 disabled:opacity-40"
          :disabled="selectedIds.has(facet.id) || saving"
          @click="addFacet(facet.id)"
        >
          <span
            class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-base-200"
          >
            <img
              v-if="artwork(facet)"
              :src="artwork(facet) || ''"
              :alt="`${facet.title} artwork`"
              class="size-full object-cover"
            />
            <Icon
              v-else
              :name="facet.icon || 'kind-icon:tag'"
              class="size-5 text-base-content/40"
            />
          </span>
          <span class="badge badge-outline badge-xs shrink-0">
            {{ facet.taxonomy.replace(/_/g, ' ') }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold">{{ facet.title }}</span>
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
          No matching Facet.
        </p>
      </div>
    </div>

    <p v-if="!rewardId" class="text-xs text-base-content/45">
      These choices will attach when the new Reward is saved.
    </p>
    <p v-if="errorMessage" class="text-xs text-error">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  useFacetStore,
  type FacetWithAliases,
} from '@/stores/facetStore'
import { useRewardFacetStore } from '@/stores/rewardFacetStore'
import { normalizeFacetLookupKey } from '@/utils/facetAliases'
import { resolveEntityArtwork } from '@/utils/artImageSrc'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    rewardId?: number | null
  }>(),
  { rewardId: null },
)

const emit = defineEmits<{ 'update:modelValue': [value: number[]] }>()
const facetStore = useFacetStore()
const rewardFacetStore = useRewardFacetStore()
const search = ref('')
const showResults = ref(false)
const errorMessage = ref('')

const loading = computed(() =>
  rewardFacetStore.isLoadingReward(props.rewardId),
)
const saving = computed(() => rewardFacetStore.isSavingReward(props.rewardId))
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
      const values = [
        facet.title,
        facet.slug,
        facet.canonicalValue,
        facet.taxonomy,
        ...facet.aliases,
      ]
      return values.some((value) =>
        normalizeFacetLookupKey(value || '').includes(needle),
      )
    })
    .slice(0, 30)
})

function artwork(facet: FacetWithAliases): string | null {
  return resolveEntityArtwork(facet)
}

async function loadAssigned(): Promise<void> {
  if (!props.rewardId || props.rewardId <= 0) return
  errorMessage.value = ''

  const result = await rewardFacetStore.fetchRewardFacets(props.rewardId)
  if (!result.success || !result.data) {
    errorMessage.value = result.message || 'Reward Facets could not be loaded.'
    return
  }

  emit(
    'update:modelValue',
    result.data.map((facet) => facet.id),
  )
}

async function persist(next: number[]): Promise<void> {
  const previous = [...props.modelValue]
  emit('update:modelValue', next)
  if (!props.rewardId || props.rewardId <= 0) return
  errorMessage.value = ''

  const result = await rewardFacetStore.replaceRewardFacets(props.rewardId, next)
  if (!result.success || !result.data) {
    emit('update:modelValue', previous)
    errorMessage.value = result.message || 'Reward Facets could not be saved.'
    return
  }

  emit(
    'update:modelValue',
    result.data.map((facet) => facet.id),
  )
}

async function addFacet(facetId: number): Promise<void> {
  if (selectedIds.value.has(facetId)) return
  await persist([...props.modelValue, facetId])
  search.value = ''
  showResults.value = false
}

async function removeFacet(facetId: number): Promise<void> {
  await persist(props.modelValue.filter((id) => id !== facetId))
}

onMounted(async () => {
  if (!facetStore.loaded) await facetStore.fetchFacets()
  await loadAssigned()
})

watch(
  () => props.rewardId,
  async (next, previous) => {
    if (next && next !== previous) await loadAssigned()
  },
)
</script>
