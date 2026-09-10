<template>
  <section
    ref="pickerRoot"
    class="flex w-full min-w-0 flex-col gap-2 text-base-content"
  >
    <div class="flex min-w-0 items-center gap-2">
      <button
        type="button"
        class="btn btn-sm min-w-0 flex-1 justify-between rounded-2xl border-base-content/15 bg-base-100"
        :class="expanded ? 'btn-primary' : 'btn-outline'"
        @click="handleBrowseClick"
      >
        <span class="flex min-w-0 items-center gap-2">
          <Icon name="kind-icon:gallery" class="kr-icon-4 shrink-0" />
          <span class="truncate text-left">
            <span class="font-black">{{ title }}:</span>
            {{ selectedSummary }}
          </span>
        </span>
        <Icon
          :name="expanded ? 'kind-icon:chevron-up' : 'kind-icon:chevron-down'"
          class="kr-icon-4 shrink-0"
        />
      </button>

      <button
        v-if="hasSelection"
        type="button"
        class="btn btn-ghost btn-sm shrink-0 rounded-2xl"
        title="Use all available art"
        @click="useAllArt"
      >
        <Icon name="kind-icon:trash" class="kr-icon-4" />
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
            <span class="kr-text-black-sm">All available art</span>
            <Icon
              :name="!hasSelection ? 'kind-icon:check-circle' : 'kind-icon:circle'"
              class="kr-icon-5 shrink-0"
            />
          </span>
          <span class="kr-text-dim-xs-60 mt-2">
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
            <span class="kr-text-black-sm line-clamp-2">
              {{ getCollectionLabel(collection) }}
            </span>
            <Icon
              :name="
                isSelected(collection.id)
                  ? 'kind-icon:check-circle'
                  : 'kind-icon:circle'
              "
              class="kr-icon-5 shrink-0"
            />
          </span>

          <span class="kr-text-dim-xs-60 mt-2">
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

    <Teleport v-if="isSplashPicker" to=".splash-screen">
      <section
        :id="galleryId"
        class="deck-gallery-shell shrink-0 border-t border-yellow-700/30 bg-base-300/98 px-4 py-6 text-base-content sm:px-6 lg:px-8"
      >
        <div class="mx-auto flex w-full max-w-7xl flex-col gap-4">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="kr-text-black-lg">🖼️ Browse the dungeon shelves</p>
              <p class="kr-text-dim-sm mt-1 max-w-2xl">
                All art is the default. Pick one or more collections if you want a particular mood, or ignore this entirely and enter the dungeon.
              </p>
            </div>
            <span class="badge badge-primary badge-outline font-bold">
              {{ selectedSummary }}
            </span>
          </div>

          <div class="deck-gallery-grid grid gap-3">
            <button
              type="button"
              class="group flex min-h-44 flex-col items-start rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
              :class="
                !hasSelection
                  ? 'border-primary bg-primary/15 text-primary shadow-lg'
                  : 'border-base-content/10 bg-base-100 text-base-content'
              "
              @click="useAllArt"
            >
              <div
                class="mb-2 grid h-24 w-full grid-cols-3 overflow-hidden rounded-xl bg-base-200"
              >
                <template v-if="allArtPreviewPaths.length">
                  <img
                    v-for="(imagePath, index) in allArtPreviewPaths"
                    :key="`${imagePath}-${index}`"
                    :src="imagePath"
                    alt=""
                    class="h-24 w-full object-cover"
                    loading="lazy"
                    @error="hideBrokenPreview"
                  />
                </template>
                <div
                  v-else
                  class="col-span-3 flex h-24 items-center justify-center text-base-content/30"
                >
                  <Icon name="kind-icon:gallery" class="h-9 w-9" />
                </div>
              </div>

              <span class="flex w-full items-start justify-between gap-2">
                <span class="kr-text-black-sm">All available art</span>
                <Icon
                  :name="!hasSelection ? 'kind-icon:check-circle' : 'kind-icon:circle'"
                  class="kr-icon-5 shrink-0"
                />
              </span>
              <span class="kr-text-dim-xs-60 mt-2">
                Let the dungeon roam across the whole playable art library.
              </span>
            </button>

            <button
              v-for="collection in availableCollections"
              :key="`gallery-${collection.id}`"
              type="button"
              class="group flex min-h-44 flex-col items-start rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-xl"
              :class="
                isSelected(collection.id)
                  ? 'border-primary bg-primary/15 text-primary shadow-lg'
                  : 'border-base-content/10 bg-base-100 text-base-content'
              "
              @click="toggleCollection(collection.id)"
            >
              <div
                class="mb-2 grid h-24 w-full grid-cols-3 overflow-hidden rounded-xl bg-base-200"
              >
                <template v-if="getCollectionPreviewPaths(collection).length">
                  <img
                    v-for="(imagePath, index) in getCollectionPreviewPaths(collection)"
                    :key="`${collection.id}-${imagePath}-${index}`"
                    :src="imagePath"
                    alt=""
                    class="h-24 w-full object-cover"
                    loading="lazy"
                    @error="hideBrokenPreview"
                  />
                </template>
                <div
                  v-else
                  class="col-span-3 flex h-24 items-center justify-center text-base-content/30"
                >
                  <Icon name="kind-icon:gallery" class="h-9 w-9" />
                </div>
              </div>

              <span class="flex w-full items-start justify-between gap-2">
                <span class="kr-text-black-sm line-clamp-2">
                  {{ getCollectionLabel(collection) }}
                </span>
                <Icon
                  :name="
                    isSelected(collection.id)
                      ? 'kind-icon:check-circle'
                      : 'kind-icon:circle'
                  "
                  class="kr-icon-5 shrink-0"
                />
              </span>
              <span class="kr-text-dim-xs-60 mt-2">
                {{ getCollectionMeta(collection) }}
              </span>
            </button>
          </div>

          <p
            v-if="!availableCollections.length"
            class="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-semibold text-warning-content"
          >
            No collection shelves are ready yet. All available art remains a perfectly good default.
          </p>
        </div>
      </section>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { resolveArtImageThumbSrc } from '@/utils/artImageSrc'

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

const pickerRoot = ref<HTMLElement | null>(null)
const expanded = ref(false)
const isSplashPicker = ref(false)
const localMode = ref<CollectionPickerMode>('all')
const selectedCollectionIds = ref<number[]>([])
const galleryId = 'memory-dungeon-deck-gallery'

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

const allArtPreviewPaths = computed(() => {
  return previewPathsFromImages(artStore.artImages, 3)
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
  isSplashPicker.value = Boolean(pickerRoot.value?.closest('.splash-screen'))

  await artStore.initialize({
    fetchRemote: false,
    hydrateImages: false,
    initializeCollections: true,
  })
})

function handleBrowseClick() {
  if (!isSplashPicker.value) {
    expanded.value = !expanded.value
    return
  }

  document.getElementById(galleryId)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

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

function getCollectionImages(collection: ArtCollection): ArtImage[] {
  const record = collection as ArtCollection & {
    ArtImages?: ArtImage[]
    artImages?: ArtImage[]
    images?: ArtImage[]
  }

  const imageMap = new Map<number, ArtImage>()

  for (const image of [
    ...(Array.isArray(record.art) ? record.art : []),
    ...(Array.isArray(record.ArtImages) ? record.ArtImages : []),
    ...(Array.isArray(record.artImages) ? record.artImages : []),
    ...(Array.isArray(record.images) ? record.images : []),
  ]) {
    if (image?.id) imageMap.set(image.id, image)
  }

  return [...imageMap.values()]
}

function previewPathsFromImages(images: ArtImage[], limit: number): string[] {
  const paths: string[] = []
  const seen = new Set<string>()

  for (const image of images) {
    if (!artStore.showMature && image.isMature) continue

    const path = resolveArtImageThumbSrc(image)
    if (!path || seen.has(path)) continue

    seen.add(path)
    paths.push(path)

    if (paths.length >= limit) break
  }

  return paths
}

function getCollectionPreviewPaths(collection: ArtCollection): string[] {
  return previewPathsFromImages(getCollectionImages(collection), 3)
}

function getCollectionMeta(collection: ArtCollection): string {
  const record = collection as ArtCollection & {
    isPublic?: boolean | null
    isMature?: boolean | null
  }

  const imageCount = getCollectionImages(collection).length
  const visibility = record.isPublic ? 'public' : 'private'
  const rating = record.isMature ? 'mature' : 'safe'

  return `${imageCount} image${imageCount === 1 ? '' : 's'} · ${visibility} · ${rating}`
}

function hideBrokenPreview(event: Event) {
  const image = event.currentTarget
  if (!(image instanceof HTMLImageElement)) return

  image.style.visibility = 'hidden'
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
.deck-gallery-shell {
  container-type: inline-size;
}

.deck-gallery-grid {
  grid-template-columns: minmax(0, 1fr);
}

@container (min-width: 32rem) {
  .deck-gallery-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@container (min-width: 64rem) {
  .deck-gallery-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@container (min-width: 80rem) {
  .deck-gallery-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

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
