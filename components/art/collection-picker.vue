<template>
  <section class="flex w-full min-w-0 flex-col gap-2 text-base-content">
    <div class="flex min-w-0 items-center gap-2">
      <button
        type="button"
        class="btn btn-sm min-w-0 flex-1 justify-between rounded-2xl border-base-content/15 bg-base-100"
        :class="expanded ? 'btn-primary' : 'btn-outline'"
        @click="expanded = !expanded"
      >
        <span class="flex min-w-0 items-center gap-2">
          <Icon name="kind-icon:gallery" class="h-4 w-4 shrink-0" />
          <span class="truncate text-left">
            <span class="font-black">{{ title }}:</span>
            {{ selectedSummary }}
          </span>
        </span>
        <Icon
          :name="expanded ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
          class="h-4 w-4 shrink-0"
        />
      </button>

      <button
        v-if="hasSelection"
        type="button"
        class="btn btn-ghost btn-sm shrink-0 rounded-2xl"
        title="Use all available art"
        @click="useAllArt"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
        <span class="hidden sm:inline">All art</span>
      </button>
    </div>

    <Transition name="picker-panel">
      <div
        v-if="expanded"
        class="grid max-h-72 gap-2 overflow-y-auto rounded-2xl border border-base-content/10 bg-base-200/80 p-2 sm:grid-cols-2 lg:grid-cols-3"
      >
        <button
          type="button"
          class="flex min-h-18 flex-col items-start justify-between rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
          :class="
            !hasSelection
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-base-content/10 bg-base-100 text-base-content'
          "
          @click="useAllArt"
        >
          <span class="flex w-full items-start justify-between gap-2">
            <span class="text-sm font-black">All available art</span>
            <Icon
              :name="!hasSelection ? 'kind-icon:check-circle' : 'kind-icon:circle'"
              class="h-5 w-5 shrink-0"
            />
          </span>
          <span class="mt-2 text-xs text-base-content/60">
            Draw the dungeon deck from the whole playable art library.
          </span>
        </button>

        <button
          v-for="collection in availableCollections"
          :key="collection.id"
          type="button"
          class="group flex min-h-18 flex-col items-start justify-between rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-lg"
          :class="
            isSelected(collection.id)
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-base-content/10 bg-base-100 text-base-content'
          "
          @click="toggleCollection(collection.id)"
        >
          <span class="flex w-full items-start justify-between gap-2">
            <span class="line-clamp-2 text-sm font-black">
              {{ getCollectionLabel(collection) }}
            </span>
            <Icon
              :name="
                isSelected(collection.id)
                  ? 'kind-icon:check-circle'
                  : 'kind-icon:circle'
              "
              class="h-5 w-5 shrink-0"
            />
          </span>

          <span class="mt-2 text-xs text-base-content/60">
            {{ getCollectionMeta(collection) }}
          </span>
        </button>

        <p
          v-if="!availableCollections.length"
          class="col-span-full px-2 py-3 text-xs font-semibold text-warning"
        >
          No usable collections found yet. The dungeon is browsing empty shelves.
        </p>
      </div>
    </Transition>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'

export type CollectionPickerMode =
  | 'all'
  | 'generated'
  | 'collection'
  | 'collections'
  | 'manual'

const props = withDefaults(
  defineProps<{
    title?: string
    mode?: CollectionPickerMode
    collectionId?: number | null
    collectionIds?: number[]
  }>(),
  {
    title: 'Card Source',
    mode: 'all',
    collectionId: null,
    collectionIds: () => [],
  },
)

const emit = defineEmits<{
  'update:mode': [value: CollectionPickerMode]
  'update:collectionId': [value: number | null]
  'update:collectionIds': [value: number[]]
  change: [
    value: {
      mode: CollectionPickerMode
      collectionId: number | null
      collectionIds: number[]
    },
  ]
}>()

const artStore = useArtStore()

const expanded = ref(false)
const localMode = ref<CollectionPickerMode>('all')
const selectedCollectionIds = ref<number[]>([])

const availableCollections = computed<ArtCollection[]>(() => {
  return artStore.generationCollections
})

const selectedCollections = computed(() => {
  const ids = new Set(selectedCollectionIds.value)
  return availableCollections.value.filter((collection) => ids.has(collection.id))
})

const hasSelection = computed(
  () => localMode.value === 'manual' || selectedCollectionIds.value.length > 0,
)

const selectedSummary = computed(() => {
  if (localMode.value === 'manual') return 'Custom art selection'
  if (!selectedCollectionIds.value.length) return 'All art'

  if (selectedCollectionIds.value.length === 1) {
    const collection = selectedCollections.value[0]
    return collection ? getCollectionLabel(collection) : '1 collection'
  }

  return `${selectedCollectionIds.value.length} collections`
})

function syncFromProps() {
  if (props.mode === 'manual') {
    localMode.value = 'manual'
    selectedCollectionIds.value = []
    return
  }

  if (props.mode === 'collection' && props.collectionId) {
    localMode.value = 'collections'
    selectedCollectionIds.value = [props.collectionId]
    return
  }

  if (props.mode === 'collections' && props.collectionIds.length) {
    localMode.value = 'collections'
    selectedCollectionIds.value = [...new Set(props.collectionIds)]
    return
  }

  localMode.value = 'all'
  selectedCollectionIds.value = []
}

watch(
  [() => props.mode, () => props.collectionId, () => props.collectionIds],
  syncFromProps,
  { deep: true, immediate: true },
)

onMounted(async () => {
  await artStore.initialize({
    fetchRemote: false,
    hydrateImages: false,
    initializeCollections: true,
  })
})

function getCollectionLabel(collection: ArtCollection): string {
  const record = collection as ArtCollection & {
    title?: string | null
    label?: string | null
    name?: string | null
  }

  return (
    record.title ||
    record.label ||
    record.name ||
    `Collection #${collection.id}`
  )
}

function getCollectionMeta(collection: ArtCollection): string {
  const record = collection as ArtCollection & {
    ArtImages?: unknown[]
    artImages?: unknown[]
    isPublic?: boolean | null
    isMature?: boolean | null
  }

  const images = Array.isArray(record.ArtImages)
    ? record.ArtImages
    : Array.isArray(record.artImages)
      ? record.artImages
      : []

  const visibility = record.isPublic ? 'public' : 'private'
  const rating = record.isMature ? 'mature' : 'safe'

  return `${images.length} image${images.length === 1 ? '' : 's'} · ${visibility} · ${rating}`
}

function emitChange() {
  const mode: CollectionPickerMode =
    localMode.value === 'manual'
      ? 'manual'
      : selectedCollectionIds.value.length
        ? 'collections'
        : 'all'

  localMode.value = mode

  emit('update:mode', mode)
  emit('update:collectionId', null)
  emit(
    'update:collectionIds',
    mode === 'collections' ? [...selectedCollectionIds.value] : [],
  )
  emit('change', {
    mode,
    collectionId: null,
    collectionIds:
      mode === 'collections' ? [...selectedCollectionIds.value] : [],
  })
}

function isSelected(collectionId: number): boolean {
  return selectedCollectionIds.value.includes(collectionId)
}

function toggleCollection(collectionId: number) {
  localMode.value = 'collections'
  selectedCollectionIds.value = isSelected(collectionId)
    ? selectedCollectionIds.value.filter((id) => id !== collectionId)
    : [...selectedCollectionIds.value, collectionId]

  if (!selectedCollectionIds.value.length) {
    localMode.value = 'all'
  }

  emitChange()
}

function useAllArt() {
  localMode.value = 'all'
  selectedCollectionIds.value = []
  emitChange()
}
</script>

<style scoped>
.picker-panel-enter-active,
.picker-panel-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.picker-panel-enter-from,
.picker-panel-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
