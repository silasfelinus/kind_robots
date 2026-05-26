<!-- /components/art/collection-picker.vue -->
<template>
  <section
    class="flex w-full flex-col gap-3 rounded-2xl border border-base-content/15 bg-base-100/85 p-3 text-base-content shadow-xl backdrop-blur-md"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:gallery" class="h-5 w-5 text-primary" />
        <div>
          <h3 class="text-sm font-black uppercase tracking-widest">
            {{ title }}
          </h3>
          <p class="text-xs text-base-content/60">
            {{ selectedSummary }}
          </p>
        </div>
      </div>

      <button
        v-if="allowMultiple"
        type="button"
        class="btn btn-xs rounded-2xl"
        :class="expanded ? 'btn-primary' : 'btn-outline'"
        @click="expanded = !expanded"
      >
        <Icon
          :name="expanded ? 'kind-icon:collapse' : 'kind-icon:collection'"
          class="h-4 w-4"
        />
        {{ expanded ? 'Done' : 'Choose' }}
      </button>
    </div>

    <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
      <select
        v-model="localMode"
        class="select select-bordered select-sm w-full rounded-2xl bg-base-200"
        @change="handleModeChange"
      >
        <option value="all">All available art</option>
        <option value="generated">Generated art</option>
        <option value="collection">One collection</option>
        <option v-if="allowMultiple" value="collections">
          Multiple collections
        </option>
      </select>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="hasSelection ? 'btn-outline' : 'btn-disabled'"
        :disabled="!hasSelection"
        @click="clearSelection"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
        Clear
      </button>
    </div>

    <select
      v-if="localMode === 'collection'"
      v-model.number="localCollectionId"
      class="select select-bordered select-sm w-full rounded-2xl bg-base-200"
      @change="emitSingleSelection"
    >
      <option :value="0">Choose a collection</option>
      <option
        v-for="collection in availableCollections"
        :key="collection.id"
        :value="collection.id"
      >
        {{ getCollectionLabel(collection) }}
      </option>
    </select>

    <div
      v-if="allowMultiple && localMode === 'collections'"
      class="flex flex-col gap-2"
    >
      <button
        type="button"
        class="flex items-center justify-between rounded-2xl border border-base-content/15 bg-base-200 px-3 py-2 text-left text-sm font-bold"
        @click="expanded = !expanded"
      >
        <span>
          {{ selectedCollectionIds.length || 'No' }}
          collection{{ selectedCollectionIds.length === 1 ? '' : 's' }}
          selected
        </span>
        <Icon
          :name="expanded ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
          class="h-5 w-5"
        />
      </button>

      <Transition name="picker-panel">
        <div
          v-if="expanded"
          class="grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-base-content/10 bg-base-200/70 p-2 sm:grid-cols-2 lg:grid-cols-3"
        >
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
        </div>
      </Transition>
    </div>

    <div
      v-if="showPreview && selectedCollections.length"
      class="flex flex-wrap gap-1.5"
    >
      <span
        v-for="collection in selectedCollections"
        :key="collection.id"
        class="badge badge-primary badge-outline gap-1 rounded-2xl"
      >
        {{ getCollectionLabel(collection) }}
        <button
          type="button"
          class="ml-1 rounded-full hover:text-error"
          @click="removeCollection(collection.id)"
        >
          ×
        </button>
      </span>
    </div>

    <p v-if="emptyMessage" class="text-xs font-semibold text-warning">
      {{ emptyMessage }}
    </p>
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

const props = withDefaults(
  defineProps<{
    title?: string
    mode?: CollectionPickerMode
    collectionId?: number | null
    collectionIds?: number[]
    allowMultiple?: boolean
    showPreview?: boolean
    includeGenerated?: boolean
  }>(),
  {
    title: 'Card Source',
    mode: 'all',
    collectionId: null,
    collectionIds: () => [],
    allowMultiple: true,
    showPreview: true,
    includeGenerated: true,
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
const localMode = ref<CollectionPickerMode>(props.mode)
const localCollectionId = ref<number>(props.collectionId ?? 0)
const selectedCollectionIds = ref<number[]>([...props.collectionIds])

const availableCollections = computed<ArtCollection[]>(() => {
  return artStore.generationCollections
})

const selectedCollections = computed(() => {
  const ids = new Set(selectedCollectionIds.value)

  if (localMode.value === 'collection' && localCollectionId.value > 0) {
    return availableCollections.value.filter(
      (collection) => collection.id === localCollectionId.value,
    )
  }

  return availableCollections.value.filter((collection) =>
    ids.has(collection.id),
  )
})

const hasSelection = computed(() => {
  if (localMode.value === 'all') return false
  if (localMode.value === 'generated') return true
  if (localMode.value === 'collection') return localCollectionId.value > 0
  return selectedCollectionIds.value.length > 0
})

const emptyMessage = computed(() => {
  if (availableCollections.value.length) return ''
  return 'No usable collections found yet. The dungeon is browsing empty shelves.'
})

const selectedSummary = computed(() => {
  if (localMode.value === 'all') return 'Using all available art images.'
  if (localMode.value === 'generated') return 'Using recently generated art.'
  if (localMode.value === 'collection') {
    const collection = selectedCollections.value[0]
    return collection
      ? `Using ${getCollectionLabel(collection)}.`
      : 'Choose one collection.'
  }

  if (!selectedCollectionIds.value.length) {
    return 'Choose multiple collections.'
  }

  if (selectedCollectionIds.value.length === 1) {
    const collection = selectedCollections.value[0]
    return collection
      ? `Using ${getCollectionLabel(collection)}.`
      : 'Using one collection.'
  }

  return `Using ${selectedCollectionIds.value.length} collections.`
})

watch(
  () => props.mode,
  (value) => {
    localMode.value = value
  },
)

watch(
  () => props.collectionId,
  (value) => {
    localCollectionId.value = value ?? 0
  },
)

watch(
  () => props.collectionIds,
  (value) => {
    selectedCollectionIds.value = [...value]
  },
  { deep: true },
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
  emit('update:mode', localMode.value)
  emit(
    'update:collectionId',
    localMode.value === 'collection' && localCollectionId.value > 0
      ? localCollectionId.value
      : null,
  )
  emit(
    'update:collectionIds',
    localMode.value === 'collections' ? [...selectedCollectionIds.value] : [],
  )

  emit('change', {
    mode: localMode.value,
    collectionId:
      localMode.value === 'collection' && localCollectionId.value > 0
        ? localCollectionId.value
        : null,
    collectionIds:
      localMode.value === 'collections' ? [...selectedCollectionIds.value] : [],
  })
}

function handleModeChange() {
  if (localMode.value === 'all' || localMode.value === 'generated') {
    localCollectionId.value = 0
    selectedCollectionIds.value = []
  }

  if (localMode.value === 'collection') {
    selectedCollectionIds.value = []
  }

  if (localMode.value === 'collections') {
    localCollectionId.value = 0
    expanded.value = true
  }

  emitChange()
}

function emitSingleSelection() {
  selectedCollectionIds.value = []
  emitChange()
}

function isSelected(collectionId: number): boolean {
  return selectedCollectionIds.value.includes(collectionId)
}

function toggleCollection(collectionId: number) {
  selectedCollectionIds.value = isSelected(collectionId)
    ? selectedCollectionIds.value.filter((id) => id !== collectionId)
    : [...selectedCollectionIds.value, collectionId]

  emitChange()
}

function removeCollection(collectionId: number) {
  if (
    localMode.value === 'collection' &&
    localCollectionId.value === collectionId
  ) {
    localCollectionId.value = 0
  }

  selectedCollectionIds.value = selectedCollectionIds.value.filter(
    (id) => id !== collectionId,
  )

  emitChange()
}

function clearSelection() {
  localMode.value = 'all'
  localCollectionId.value = 0
  selectedCollectionIds.value = []
  expanded.value = false
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
