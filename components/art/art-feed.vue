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

      <span class="kr-badge-ghost-sm shrink-0">
        {{ visibleImages.length }}{{ feedStore.hasMore ? '+' : '' }} images
      </span>
    </div>

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
        <p class="text-sm">No art matches the current filters.</p>
      </div>

      <div
        class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6"
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
              :aria-label="`Open ${imageLabel(image)}`"
              @click="openImage(image)"
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

            <button
              v-if="deleteMode && canModifyImage(image)"
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
import { useArtFeedStore, type ArtFeedImage } from '@/stores/artFeedStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

const SEARCH_DEBOUNCE_MS = 350

const artStore = useArtStore()
const browseStore = useArtCollectionBrowseStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const feedStore = useArtFeedStore()
const userStore = useUserStore()

const searchInput = ref(feedStore.filters.search)
const collectionId = ref<number | null>(feedStore.filters.collectionId)
const failedImageIds = ref(new Set<number>())
const selectedImage = ref<ArtFeedImage | null>(null)
const deletingImageId = ref<number | null>(null)
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

function markFailed(imageId: number) {
  failedImageIds.value = new Set(failedImageIds.value).add(imageId)
}

async function restartFeed() {
  failedImageIds.value = new Set()
  await feedStore.reset({
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
