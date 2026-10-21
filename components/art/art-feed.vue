<!-- /components/art/art-feed.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-2 rounded-2xl bg-base-300 p-2"
  >
    <div
      class="flex shrink-0 flex-wrap items-center gap-2 kr-panel-muted-compact-row"
    >
      <label
        class="input input-bordered input-sm flex min-w-48 flex-1 items-center gap-1.5 rounded-2xl bg-base-100"
      >
        <icon name="kind-icon:search" class="kr-icon-4 shrink-0 opacity-50" />
        <input
          v-model="searchInput"
          type="search"
          class="min-w-0 flex-1 bg-transparent"
          placeholder="Search prompts, file names, or #id"
        />
      </label>

      <select
        v-model="collectionId"
        class="select select-bordered select-sm max-w-64 rounded-2xl bg-base-100"
        aria-label="Filter by collection"
        @focus="loadCollectionOptions"
        @pointerdown="loadCollectionOptions"
      >
        <option :value="null">All images</option>
        <option
          v-for="option in collectionOptions"
          :key="option.id"
          :value="option.id"
        >
          {{ option.label }}
        </option>
      </select>

      <select
        v-model="range"
        class="select select-bordered select-sm shrink-0 rounded-2xl bg-base-100"
        aria-label="Art generation date range"
      >
        <option
          v-for="option in ART_FEED_RANGES"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <button
        type="button"
        class="btn btn-ghost btn-xs rounded-lg"
        aria-label="Refresh gallery images"
        :disabled="feedStore.isLoading"
        @click="restartFeed"
      >
        <icon name="kind-icon:refresh" class="kr-icon-3-5" />
      </button>

      <button
        v-if="canShowBulkSelect"
        type="button"
        class="btn btn-xs rounded-lg"
        :class="bulkSelectEnabled ? 'btn-primary' : 'btn-ghost'"
        :aria-pressed="bulkSelectEnabled"
        :disabled="isBatchWorking"
        @click="toggleBulkSelect"
      >
        <icon name="kind-icon:checklist" class="kr-icon-3-5" />
        {{ bulkSelectEnabled ? 'Selecting' : 'Select images' }}
      </button>

      <span class="kr-badge-ghost-sm shrink-0">
        {{ visibleImages.length }}{{ feedStore.hasMore ? '+' : '' }} images
      </span>
    </div>

    <div
      v-if="bulkSelectEnabled"
      class="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-base-100 p-2"
    >
      <span class="kr-badge-primary-sm">{{ selectedImageIds.length }} selected</span>
      <button
        type="button"
        class="kr-btn-xs"
        :disabled="isBatchWorking"
        @click="selectAllLoaded"
      >
        Select all loaded ({{ selectableImages.length }})
      </button>
      <button
        type="button"
        class="kr-btn-ghost-xs"
        :disabled="isBatchWorking || !selectedImageIds.length"
        @click="selectedImageIds = []"
      >
        Clear
      </button>
      <button
        type="button"
        class="kr-btn-xs btn-error ml-auto"
        :disabled="isBatchWorking || !selectedImageIds.length"
        @click="deleteSelectedImages"
      >
        <span v-if="isBatchWorking" class="kr-spinner-xs" />
        <icon v-else name="kind-icon:trash" class="kr-icon-3-5" />
        Move to Recycle Bin
      </button>
    </div>

    <p v-if="batchSuccess" class="kr-note kr-note-success shrink-0 rounded-xl px-3 py-1.5 text-xs">
      {{ batchSuccess }}
    </p>
    <p v-if="batchError" class="kr-note kr-note-error shrink-0 rounded-xl px-3 py-1.5 text-xs">
      {{ batchError }}
    </p>

    <div
      ref="scroller"
      class="relative min-h-0 flex-1 overflow-auto rounded-xl bg-base-200 p-2"
    >
      <div
        v-if="
          !visibleImages.length &&
          !feedStore.isLoading &&
          !feedStore.errorMessage
        "
        class="flex min-h-56 flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
      >
        <icon name="kind-icon:image" class="kr-icon-primary-12" />
        <p class="kr-text-black-lg mt-2 text-base-content">No images here.</p>
        <p class="text-sm">
          {{
            range === 'all'
              ? 'No art matches the current filters.'
              : `No images from the ${artFeedRangeLabel(range).toLowerCase()} match these filters.`
          }}
        </p>
        <button
          v-if="range !== 'all'"
          type="button"
          class="btn btn-primary btn-sm mt-3 rounded-xl"
          @click="range = 'all'"
        >
          View all images
        </button>
      </div>

      <div
        class="grid grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))] gap-2"
      >
        <kr-mature-cover
          v-for="image in visibleImages"
          :key="image.id"
          :is-mature="image.isMature"
          :owner-id="image.userId"
          :reveal-mature="feedStore.filters.maturity !== 'safe'"
          :label="imageLabel(image)"
        >
          <div
            class="group relative aspect-square overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
          >
            <button
              type="button"
              class="block h-full w-full"
              :class="bulkSelectEnabled && isImageSelected(image.id) ? 'ring-4 ring-inset ring-primary' : ''"
              :aria-label="
                bulkSelectEnabled
                  ? `${isImageSelected(image.id) ? 'Deselect' : 'Select'} ${imageLabel(image)}`
                  : `Open ${imageLabel(image)}`
              "
              :aria-pressed="bulkSelectEnabled ? isImageSelected(image.id) : undefined"
              :disabled="isBatchWorking || (bulkSelectEnabled && !canModifyImage(image))"
              @click="bulkSelectEnabled ? toggleImageSelection(image) : openImage(image)"
            >
              <img
                :src="image.thumbnailUrl"
                :alt="imageLabel(image)"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                @error="markFailed(image.id)"
              />
            </button>

            <p
              class="pointer-events-none text-xs absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-base-300/95 to-transparent px-2 pb-1.5 pt-6 text-base-content opacity-0 transition group-hover:opacity-100"
            >
              {{ imageLabel(image) }}
            </p>

            <span
              v-if="bulkSelectEnabled && canModifyImage(image)"
              class="pointer-events-none absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-lg border shadow"
              :class="isImageSelected(image.id) ? 'border-primary bg-primary text-primary-content' : 'border-base-300 bg-base-100/90 text-base-content'"
              aria-hidden="true"
            >
              <icon :name="isImageSelected(image.id) ? 'kind-icon:check' : 'kind-icon:plus'" class="kr-icon-4" />
            </span>

            <button
              v-if="deleteMode && !bulkSelectEnabled && canModifyImage(image)"
              class="absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-error/40 bg-base-100/95 text-error shadow-lg transition hover:bg-error hover:text-error-content disabled:cursor-wait disabled:opacity-70"
              type="button"
              :disabled="deletingImageId !== null"
              :aria-label="`Delete image #${image.id}`"
              @click.stop="deleteImage(image.id)"
            >
              <span v-if="deletingImageId === image.id" class="kr-spinner-xs" />
              <icon v-else name="kind-icon:trash" class="kr-icon-4" />
            </button>
          </div>
        </kr-mature-cover>
      </div>

      <kr-viewport-gate
        v-if="feedStore.hasMore && !feedStore.errorMessage"
        :key="`more-${feedStore.items.length}`"
        class="flex justify-center py-6"
        @hydrate="feedStore.loadMore()"
      >
        <span v-if="feedStore.isLoading" class="kr-spinner-lg-primary" />
        <span v-else class="h-8" />
      </kr-viewport-gate>

      <div
        v-if="feedStore.errorMessage"
        class="mt-3 flex items-center justify-center gap-3 kr-note kr-note-error rounded-xl px-3 py-2 text-sm"
      >
        <icon name="kind-icon:alert" class="kr-icon-4 shrink-0" />
        <span>{{ feedStore.errorMessage }}</span>
        <button
          type="button"
          class="btn btn-error btn-xs rounded-xl"
          @click="feedStore.retry()"
        >
          Try again
        </button>
      </div>
    </div>

    <footer
      v-if="failedImageIds.size"
      class="kr-text-dim-xs shrink-0 rounded-xl border border-base-300 bg-base-200/80 px-3 py-1.5"
    >
      {{ failedImageIds.size }} image{{ failedImageIds.size === 1 ? '' : 's' }}
      with missing files hidden.
    </footer>

    <div
      v-if="selectedImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 p-3 backdrop-blur-sm"
    >
      <div
        class="flex max-h-full w-full max-w-6xl flex-col overflow-hidden kr-panel-flat shadow-2xl"
      >
        <header
          class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-200 px-4 py-2"
        >
          <h3 class="kr-text-black-sm truncate text-base-content">
            #{{ selectedImage.id }}
          </h3>
          <button class="kr-btn-ghost" type="button" @click="closeImage">
            <icon name="kind-icon:x" class="kr-icon-4" />
            Close
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-auto p-3">
          <art-interact />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useArtCollectionBrowseStore } from '@/stores/artCollectionBrowseStore'
import {
  useArtFeedStore,
  type ArtFeedFilters,
  type ArtFeedImage,
} from '@/stores/artFeedStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { recycleGalleryImages } from '@/utils/artGalleryBulkRecycle'
import {
  ART_FEED_RANGES,
  DEFAULT_ART_FEED_RANGE,
  artFeedRangeLabel,
} from '~/utils/artFeedRange'

const SEARCH_DEBOUNCE_MS = 350

const artStore = useArtStore()
const browseStore = useArtCollectionBrowseStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const feedStore = useArtFeedStore()
const userStore = useUserStore()

const range = ref<ArtFeedFilters['range']>(DEFAULT_ART_FEED_RANGE)
const searchInput = ref(feedStore.filters.search)
const collectionId = ref<number | null>(feedStore.filters.collectionId)
const failedImageIds = ref(new Set<number>())
const selectedImage = ref<ArtFeedImage | null>(null)
const deletingImageId = ref<number | null>(null)
const bulkSelectEnabled = ref(false)
const selectedImageIds = ref<number[]>([])
const isBatchWorking = ref(false)
const batchError = ref('')
const batchSuccess = ref('')
const collectionsRequested = ref(false)
const ready = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const deleteMode = computed(() => browseStore.galleryDeleteMode)
const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

const visibleImages = computed(() =>
  feedStore.items.filter((image) => !failedImageIds.value.has(image.id)),
)

const selectableImages = computed(() =>
  visibleImages.value.filter(canModifyImage),
)
const canShowBulkSelect = computed(
  () => bulkSelectEnabled.value || selectableImages.value.length > 0,
)
const selectedImageIdSet = computed(() => new Set(selectedImageIds.value))

const collectionOptions = computed(() =>
  collectionStore.collections
    .filter((collection) => collection.id > 0)
    .map((collection) => ({
      id: collection.id,
      label: collection.label || `Collection #${collection.id}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)

function imageLabel(image: ArtFeedImage): string {
  return image.promptString || image.fileName || `Image #${image.id}`
}

function canModifyImage(image: ArtFeedImage): boolean {
  return (
    userStore.isAdmin || Number(image.userId) === Number(currentUserId.value)
  )
}

function isImageSelected(imageId: number): boolean {
  return selectedImageIdSet.value.has(imageId)
}

function toggleBulkSelect() {
  if (isBatchWorking.value) return
  bulkSelectEnabled.value = !bulkSelectEnabled.value
  selectedImageIds.value = []
  batchError.value = ''
}

function toggleImageSelection(image: ArtFeedImage) {
  if (isBatchWorking.value || !canModifyImage(image)) return
  selectedImageIds.value = isImageSelected(image.id)
    ? selectedImageIds.value.filter((id) => id !== image.id)
    : [...selectedImageIds.value, image.id]
}

function selectAllLoaded() {
  if (isBatchWorking.value) return
  selectedImageIds.value = selectableImages.value.map((image) => image.id)
}

async function deleteSelectedImages() {
  if (isBatchWorking.value) return
  const selectableIds = new Set(selectableImages.value.map((image) => image.id))
  const ids = selectedImageIds.value.filter((id) => selectableIds.has(id))
  if (!ids.length) return
  if (
    !window.confirm(
      `Move ${ids.length} selected image${ids.length === 1 ? '' : 's'} to the Recycle Bin? You can restore them from there.`,
    )
  ) {
    return
  }

  isBatchWorking.value = true
  batchError.value = ''
  batchSuccess.value = ''
  try {
    const result = await recycleGalleryImages(
      ids,
      (imageId) => artStore.deleteArtImage(imageId),
    )
    for (const id of result.recycledIds) {
      feedStore.removeImage(id)
      if (selectedImage.value?.id === id) closeImage()
    }
    selectedImageIds.value = result.failedIds
    if (result.recycledIds.length) {
      batchSuccess.value = `Moved ${result.recycledIds.length} image${result.recycledIds.length === 1 ? '' : 's'} to the Recycle Bin.`
    }
    if (result.failedIds.length) {
      batchError.value = `Could not move ${result.failedIds.length} image${result.failedIds.length === 1 ? '' : 's'} (#${result.failedIds.join(', #')}). They remain selected.`
    }
  } finally {
    isBatchWorking.value = false
  }
}

function markFailed(imageId: number) {
  failedImageIds.value = new Set(failedImageIds.value).add(imageId)
}

async function restartFeed() {
  selectedImageIds.value = []
  bulkSelectEnabled.value = false
  batchError.value = ''
  batchSuccess.value = ''
  failedImageIds.value = new Set()
  await feedStore.reset({
    range: range.value,
    privacy: browseStore.galleryPrivacyFilter,
    maturity: browseStore.galleryMaturityFilter,
    collectionId: collectionId.value,
    search: searchInput.value,
  })
}

async function loadCollectionOptions() {
  if (collectionsRequested.value) return
  collectionsRequested.value = true
  await collectionStore.fetchCollections(false, {
    summary: true,
    includeImages: false,
    privacy: browseStore.galleryPrivacyFilter,
    includeMature: browseStore.galleryMaturityFilter !== 'safe',
    maturity: browseStore.galleryMaturityFilter,
    counts: false,
  })
}

async function openImage(image: ArtFeedImage) {
  selectedImage.value = image
  const result = await artStore.selectArtImageRecord(image)
  if (!result.success) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      result.message || 'Failed to open image.',
    )
  }
}

function closeImage() {
  selectedImage.value = null
  artStore.deselectArtImage()
}

async function deleteImage(imageId: number) {
  if (deletingImageId.value !== null) return
  deletingImageId.value = imageId
  try {
    const deleted = await artStore.deleteArtImage(imageId)
    if (!deleted) {
      errorStore.setError(
        ErrorType.GENERAL_ERROR,
        `Failed to delete image #${imageId}.`,
      )
      return
    }
    feedStore.removeImage(imageId)
    selectedImageIds.value = selectedImageIds.value.filter((id) => id !== imageId)
    if (selectedImage.value?.id === imageId) closeImage()
  } finally {
    deletingImageId.value = null
  }
}

watch(searchInput, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (ready.value) void restartFeed()
  }, SEARCH_DEBOUNCE_MS)
})

watch(range, () => {
  if (ready.value) void restartFeed()
})

watch(collectionId, () => {
  if (ready.value) void restartFeed()
})

watch(
  () => [browseStore.galleryPrivacyFilter, browseStore.galleryMaturityFilter],
  () => {
    collectionsRequested.value = false
    if (ready.value) void restartFeed()
  },
)

watch(
  () => [currentUserId.value, userStore.isAdmin],
  () => {
    if (ready.value) void restartFeed()
  },
)

onMounted(async () => {
  await userStore.initialize()
  if (browseStore.galleryPrivacyFilter === 'private' && !userStore.isAdmin) {
    browseStore.setGalleryPrivacyFilter('public')
  }
  await restartFeed()
  ready.value = true
})

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer)
})
</script>
