<!-- /components/content/art/slim-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <Icon name="kind-icon:gallery" class="h-6 w-6 text-primary" />
            <h2 class="text-lg font-black text-base-content">
              {{ activeGroup ? activeGroup.title : 'Gallery' }}
            </h2>
          </div>

          <p class="mt-1 max-w-3xl text-sm text-base-content/60">
            {{ headerSummary }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <button
            v-if="activeGroup"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Back
          </button>

          <add-collection
            v-if="!activeGroup"
            :compact="true"
            :show-flags="false"
            @created="handleCollectionCreated"
          />

          <button
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            :disabled="isLoading"
            @click="initializeGallery"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            Refresh
          </button>

          <button
            v-if="selectedImageForOverlay"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearSelectedImage"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Deselect
          </button>
        </div>
      </div>

      <div
        class="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <input
          v-model="searchQuery"
          type="search"
          class="input input-bordered input-sm w-full bg-base-100"
          :placeholder="
            activeGroup
              ? 'Search images, prompts, filenames, checkpoints...'
              : 'Search collections...'
          "
        />

        <label
          class="label cursor-pointer justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-3 py-1"
        >
          <span class="label-text text-xs font-bold">Mature</span>
          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-warning toggle-xs"
          />
        </label>

        <select
          v-if="!activeGroup"
          v-model.number="folderPageSize"
          class="select select-bordered select-sm bg-base-100"
          title="Collections per page"
        >
          <option :value="6">6 cards</option>
          <option :value="9">9 cards</option>
          <option :value="12">12 cards</option>
          <option :value="18">18 cards</option>
        </select>

        <select
          v-else
          v-model.number="imagePageSize"
          class="select select-bordered select-sm bg-base-100"
          title="Images per page"
        >
          <option :value="12">12 images</option>
          <option :value="24">24 images</option>
          <option :value="48">48 images</option>
          <option :value="96">96 images</option>
        </select>
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-2 text-xs text-base-content/60"
      >
        <span class="badge badge-ghost">
          {{ visibleGroups.length }} collections
        </span>

        <span class="badge badge-ghost"> {{ visibleImageCount }} images </span>

        <span v-if="activeGroup" class="badge badge-primary">
          {{ activeGroup.images.length }} in view
        </span>

        <span v-if="isHydratingImages" class="badge badge-info gap-1">
          <span class="loading loading-spinner loading-xs" />
          Loading images
        </span>

        <span v-if="selectedImageForOverlay" class="badge badge-secondary">
          Image #{{ selectedImageForOverlay.id }} selected
        </span>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            :disabled="currentPage === 0"
            @click="currentPage--"
          >
            <Icon name="kind-icon:arrow-left" class="h-3 w-3" />
            Prev
          </button>

          <span>Page {{ currentPage + 1 }} / {{ currentPageCount }}</span>

          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            :disabled="currentPage >= currentPageCount - 1"
            @click="currentPage++"
          >
            Next
            <Icon name="kind-icon:arrow-right" class="h-3 w-3" />
          </button>
        </div>
      </div>
    </header>

    <div
      v-if="errorMessage"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="shrink-0 rounded-2xl border border-success/40 bg-success/10 p-3 text-sm text-success"
    >
      {{ successMessage }}
    </div>

    <div
      v-if="isLoading"
      class="flex min-h-56 flex-1 items-center justify-center rounded-2xl bg-base-200"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <section
      v-else
      class="relative min-h-0 flex-1 overflow-auto rounded-2xl bg-base-200 p-3"
    >
      <div
        v-if="!activeGroup && visibleGroups.length === 0"
        class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:folder-search" class="h-12 w-12 text-primary" />
        <p class="mt-2 text-lg font-black text-base-content">
          Nothing to show.
        </p>
        <p class="text-sm">No collections match the current filters.</p>
      </div>

      <div
        v-else-if="!activeGroup"
        class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        <collection-card
          v-for="group in pagedGroups"
          :key="group.key"
          :collection="group.collection"
          :selected="activeGroupKey === group.key"
          :compact="true"
          :show-stats="true"
          :show-select-button="true"
          :show-mature="showMature"
          :preview-art-image="getPreviewImage(group)"
          @select="selectGroup(group.key)"
          @delete="handleCollectionDeleted"
        />
      </div>

      <div v-else class="flex min-h-0 flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <Icon
                :name="
                  activeGroup.isVirtual
                    ? 'kind-icon:archive'
                    : 'kind-icon:folder-open'
                "
                class="h-5 w-5 text-primary"
              />

              <h3 class="truncate text-lg font-black text-base-content">
                {{ activeGroup.title }}
              </h3>

              <span v-if="activeGroup.isVirtual" class="badge badge-accent">
                Unsorted
              </span>

              <span class="badge badge-primary">
                {{ filteredActiveImages.length }} images
              </span>
            </div>

            <p class="mt-1 text-sm text-base-content/60">
              {{ activeGroup.description }}
            </p>
          </div>

          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Back to collections
          </button>
        </div>

        <div
          v-if="filteredActiveImages.length === 0"
          class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />
          <p class="mt-2 text-lg font-black text-base-content">
            No images here.
          </p>
          <p class="text-sm">
            This collection has no art images matching the current filters.
          </p>
        </div>

        <div
          v-else
          class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
        >
          <image-card
            v-for="image in pagedActiveImages"
            :key="image.id"
            :art-image="hydratedImages[image.id] || image"
            :selected="selectedImageForOverlay?.id === image.id"
            :compact="true"
            :show-actions="selectedImageForOverlay?.id === image.id"
            :show-prompt="true"
            :show-meta="true"
            :show-generation-meta="false"
            :show-image-status="false"
            :show-select-button="false"
            :allow-delete="canModifyImage(image)"
            :allow-edit="false"
            :auto-load-image="false"
            @select="selectImage"
            @delete="handleImageDeleted"
          />
        </div>
      </div>

      <div
        v-if="selectedImageForOverlay"
        class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 p-3 backdrop-blur-sm"
      >
        <div
          class="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
        >
          <header
            class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-200 p-3"
          >
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Selected Art Image
              </p>
              <h3 class="truncate text-lg font-black text-base-content">
                #{{ selectedImageForOverlay.id }}
              </h3>
            </div>

            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              @click="clearSelectedImage"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Deselect
            </button>
          </header>

          <div class="min-h-0 flex-1 overflow-auto p-3">
            <art-interact />
          </div>
        </div>
      </div>
    </section>

    <footer
      class="shrink-0 rounded-2xl bg-base-200 p-3 text-xs text-base-content/60"
    >
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <p>
          Collections:
          <span class="font-bold text-base-content">
            {{ collectionStore.collections.length }}
          </span>
        </p>

        <p>
          Images:
          <span class="font-bold text-base-content">
            {{ artStore.artImages.length }}
          </span>
        </p>

        <p>
          Visible:
          <span class="font-bold text-base-content">
            {{ visibleImageCount }}
          </span>
        </p>

        <p v-if="activeGroup">
          Viewing:
          <span class="font-bold text-primary">
            {{ activeGroup.title }}
          </span>
        </p>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/slim-gallery.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

type GalleryCollection = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
  images?: ArtImage[]
}

type GalleryGroup = {
  key: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isVirtual: boolean
  images: ArtImage[]
  collection: GalleryCollection
}

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

const isLoading = ref(false)
const isHydratingImages = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const showMature = ref(false)
const folderPage = ref(0)
const imagePage = ref(0)
const folderPageSize = ref(12)
const imagePageSize = ref(24)
const hydratedImages = ref<Record<number, ArtImage>>({})
const activeGroupKey = ref<string | null>(null)
const selectedImageForOverlay = ref<ArtImage | null>(null)

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const activeGroup = computed(() => {
  if (!activeGroupKey.value) return null

  return (
    visibleGroups.value.find((group) => group.key === activeGroupKey.value) ||
    collectionGroups.value.find(
      (group) => group.key === activeGroupKey.value,
    ) ||
    null
  )
})

const headerSummary = computed(() => {
  if (activeGroup.value) {
    return `${activeGroup.value.images.length} art images in this collection. Select an image to open the interaction overlay.`
  }

  return 'Browse collections as cards. Open a collection to view its art images.'
})

const collectionGroups = computed<GalleryGroup[]>(() => {
  const groups = collectionStore.collections
    .map(normalizeCollectionGroup)
    .sort((a, b) => a.title.localeCompare(b.title))

  const assignedImageIds = new Set<number>()

  for (const group of groups) {
    for (const image of group.images) {
      assignedImageIds.add(image.id)
    }
  }

  const unassignedImages = artStore.artImages
    .map((image) => hydratedImages.value[image.id] || image)
    .filter((image) => !assignedImageIds.has(image.id))
    .sort((a, b) => b.id - a.id)

  const unassignedCollection = makePseudoCollection({
    id: -1,
    title: 'Unsorted',
    description: 'Images not currently assigned to a collection.',
    images: unassignedImages,
  })

  return [
    ...groups,
    {
      key: 'collection-unsorted',
      id: -1,
      title: 'Unsorted',
      description: 'Images not currently assigned to a collection.',
      userId: currentUserId.value,
      isPublic: false,
      isMature: false,
      isVirtual: true,
      images: unassignedImages,
      collection: unassignedCollection,
    },
  ]
})

const visibleGroups = computed<GalleryGroup[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return collectionGroups.value
    .map((group) => filterGroup(group, query))
    .filter((group) => {
      if (!showMature.value && group.isMature) return false
      if (!group.images.length && query) return false
      if (!group.images.length && group.isVirtual) return false
      return true
    })
})

const filteredActiveImages = computed(() => {
  if (!activeGroup.value) return []

  const query = searchQuery.value.trim().toLowerCase()

  return activeGroup.value.images
    .filter((image) => showMature.value || !image.isMature)
    .filter((image) => {
      if (!query) return true
      return searchableImageText(image).includes(query)
    })
})

const visibleImageCount = computed(() => {
  return visibleGroups.value.reduce(
    (sum, group) => sum + group.images.length,
    0,
  )
})

const currentPage = computed({
  get() {
    return activeGroup.value ? imagePage.value : folderPage.value
  },
  set(value: number) {
    if (activeGroup.value) {
      imagePage.value = value
      return
    }

    folderPage.value = value
  },
})

const currentPageCount = computed(() => {
  if (activeGroup.value) {
    return Math.max(
      1,
      Math.ceil(filteredActiveImages.value.length / imagePageSize.value),
    )
  }

  return Math.max(
    1,
    Math.ceil(visibleGroups.value.length / folderPageSize.value),
  )
})

const pagedGroups = computed(() => {
  const start = folderPage.value * folderPageSize.value
  return visibleGroups.value.slice(start, start + folderPageSize.value)
})

const pagedActiveImages = computed(() => {
  const start = imagePage.value * imagePageSize.value
  return filteredActiveImages.value.slice(start, start + imagePageSize.value)
})

watch([searchQuery, showMature, folderPageSize], () => {
  folderPage.value = 0
  imagePage.value = 0
})

watch(imagePageSize, () => {
  imagePage.value = 0
})

watch(activeGroupKey, async () => {
  imagePage.value = 0
  selectedImageForOverlay.value = null
  await hydrateVisibleImages()
})

watch(
  () => [
    activeGroupKey.value,
    imagePage.value,
    imagePageSize.value,
    searchQuery.value,
    showMature.value,
  ],
  async () => {
    await hydrateVisibleImages()
  },
)

onMounted(async () => {
  showMature.value = Boolean(userStore.user?.showMature ?? userStore.showMature)
  await initializeGallery()
})

async function initializeGallery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  hydratedImages.value = {}

  try {
    await fetchCollectionsSafely()
    await fetchArtImagesSafely()
    await hydrateVisibleImages()
  } catch (error) {
    const message = getErrorMessage(error, 'Gallery failed to initialize.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

async function fetchCollectionsSafely() {
  if (typeof collectionStore.fetchCollections !== 'function') return
  await collectionStore.fetchCollections(true)
}

async function fetchArtImagesSafely() {
  if (typeof artStore.fetchAllArtImages !== 'function') return
  await artStore.fetchAllArtImages({ force: true })
}

function normalizeCollectionGroup(collection: ArtCollection): GalleryGroup {
  const media = collection as GalleryCollection
  const images = getCollectionImages(media)

  return {
    key: `collection-${collection.id}`,
    id: collection.id,
    title: collection.label || `Collection #${collection.id}`,
    description: collection.description || 'No description yet.',
    userId: collection.userId ?? null,
    isPublic: Boolean(collection.isPublic),
    isMature: Boolean(collection.isMature),
    isVirtual: false,
    images,
    collection: {
      ...media,
      artImages: images,
      ArtImages: images,
      images,
    },
  }
}

function getCollectionImages(collection: GalleryCollection): ArtImage[] {
  const map = new Map<number, ArtImage>()

  for (const image of [
    ...(collection.artImages || []),
    ...(collection.ArtImages || []),
    ...(collection.images || []),
  ]) {
    if (image?.id) {
      map.set(image.id, hydratedImages.value[image.id] || image)
    }
  }

  return Array.from(map.values()).sort((a, b) => b.id - a.id)
}

function makePseudoCollection(input: {
  id: number
  title: string
  description: string
  images: ArtImage[]
}): GalleryCollection {
  return {
    id: input.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: currentUserId.value || 10,
    label: input.title,
    isMature: false,
    isPublic: false,
    isActive: true,
    artPrompt: null,
    description: input.description,
    username: null,
    art: [],
    artImages: input.images,
    ArtImages: input.images,
    images: input.images,
  } as GalleryCollection
}

function filterGroup(group: GalleryGroup, query: string): GalleryGroup {
  const matureSafeImages = group.images.filter((image) => {
    return showMature.value || !image.isMature
  })

  const baseGroup = {
    ...group,
    images: matureSafeImages,
    collection: {
      ...group.collection,
      artImages: matureSafeImages,
      ArtImages: matureSafeImages,
      images: matureSafeImages,
    },
  }

  if (!query) return baseGroup

  if (searchableGroupText(group).includes(query)) {
    return baseGroup
  }

  const images = matureSafeImages.filter((image) => {
    return searchableImageText(image).includes(query)
  })

  return {
    ...baseGroup,
    images,
    collection: {
      ...baseGroup.collection,
      artImages: images,
      ArtImages: images,
      images,
    },
  }
}

function getPreviewImage(group: GalleryGroup): ArtImage | null {
  const images = group.images.filter((image) => {
    return showMature.value || !image.isMature
  })

  if (!images.length) return null

  const index = Math.abs(group.id) % images.length
  const image = images[index] ?? images[0] ?? null

  if (!image) return null

  return hydratedImages.value[image.id] || image
}

function selectGroup(key: string) {
  const group = collectionGroups.value.find((entry) => entry.key === key)
  if (!group) return

  activeGroupKey.value = key

  if (group.id > 0) {
    collectionStore.setCurrentCollection(group.id)
    collectionStore.setSelectedCollectionIds([group.id])
  } else {
    collectionStore.setCurrentCollection(null)
    collectionStore.setSelectedCollectionIds([])
  }
}

function clearActiveGroup() {
  activeGroupKey.value = null
  selectedImageForOverlay.value = null
  imagePage.value = 0
}

async function selectImage(image: ArtImage) {
  errorMessage.value = ''
  selectedImageForOverlay.value = hydratedImages.value[image.id] || image

  const result = await artStore.selectArtImageRecord(
    hydratedImages.value[image.id] || image,
  )

  if (!result.success) {
    const message = result.message || 'Failed to select image.'
    errorMessage.value = message
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  }
}

function clearSelectedImage() {
  selectedImageForOverlay.value = null

  if (typeof artStore.deselectArt === 'function') {
    artStore.deselectArt()
  }
}

async function hydrateVisibleImages() {
  const imagesNeedingData = pagedActiveImages.value.filter(shouldHydrateImage)

  if (!imagesNeedingData.length) return

  isHydratingImages.value = true

  try {
    await runLimited(imagesNeedingData, 4, async (image) => {
      const fetched = await artStore.getArtImageById(image.id, {
        includeImageData: true,
        includeThumbnailData: true,
      })

      if (fetched) {
        hydratedImages.value = {
          ...hydratedImages.value,
          [fetched.id]: fetched,
        }
      }
    })
  } catch (error) {
    const message = getErrorMessage(error, 'Some images could not be loaded.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isHydratingImages.value = false
  }
}

function shouldHydrateImage(image: ArtImage): boolean {
  if (hydratedImages.value[image.id]) return false
  if ((image as ArtImage & { imageData?: string | null }).imageData)
    return false
  if (image.imagePath) return false
  return true
}

async function runLimited<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  const queue = [...items]
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const item = queue.shift()
        if (!item) return
        await worker(item)
      }
    },
  )

  await Promise.all(runners)
}

function handleCollectionCreated() {
  successMessage.value = 'Collection created.'
  void fetchCollectionsSafely()
}

function handleCollectionDeleted(id: number) {
  successMessage.value = `Collection #${id} deleted.`

  if (activeGroup.value?.id === id) {
    clearActiveGroup()
  }

  void fetchCollectionsSafely()
}

async function handleImageDeleted(imageId: number) {
  errorMessage.value = ''

  const deleted = await artStore.deleteArtImage(imageId)

  if (deleted) {
    if (selectedImageForOverlay.value?.id === imageId) {
      selectedImageForOverlay.value = null
    }

    const next = { ...hydratedImages.value }
    delete next[imageId]
    hydratedImages.value = next

    successMessage.value = `Image #${imageId} deleted.`
  } else {
    errorMessage.value = `Failed to delete image #${imageId}.`
  }
}

function canModifyImage(image: ArtImage): boolean {
  return (
    userStore.isAdmin || Number(image.userId) === Number(currentUserId.value)
  )
}

function searchableGroupText(group: GalleryGroup): string {
  return [
    group.id,
    group.title,
    group.description,
    group.isVirtual ? 'unsorted' : '',
    group.isPublic ? 'public' : 'private',
    group.isMature ? 'mature' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function searchableImageText(image: ArtImage): string {
  return [
    image.id,
    image.fileName,
    image.promptString,
    image.negativePrompt,
    image.designer,
    image.checkpoint,
    image.sampler,
    image.userId,
    image.artId,
    image.isPublic ? 'public' : 'private',
    image.isMature ? 'mature' : '',
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error

  if (typeof error === 'object' && error !== null) {
    const result = error as { message?: unknown; statusMessage?: unknown }
    const message =
      typeof result.message === 'string'
        ? result.message.trim()
        : typeof result.statusMessage === 'string'
          ? result.statusMessage.trim()
          : ''

    if (message) return message
  }

  return fallback
}
</script>
