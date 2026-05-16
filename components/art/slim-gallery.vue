<!-- /components/content/art/slim-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header class="shrink-0 rounded-2xl border border-base-300 bg-base-200 p-3">
      <div
        class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
      >
        <div class="min-w-0">
          <h2 class="text-lg font-black text-base-content">Slim Gallery</h2>

          <p class="text-sm text-base-content/60">
            Paginated gallery test with collections, art, and ArtImages
            separated.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
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
            v-if="activeTab === 'images' && artStore.currentArtImage"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearSelectedImage"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Clear Selected
          </button>
        </div>
      </div>

      <div class="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="btn btn-sm rounded-xl"
          :class="activeTab === tab.value ? 'btn-primary' : 'btn-ghost'"
          type="button"
          @click="activeTab = tab.value"
        >
          <Icon :name="tab.icon" class="h-4 w-4" />
          {{ tab.label }}
          <span class="badge badge-sm">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <div
        class="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <input
          v-model="searchQuery"
          type="search"
          class="input input-bordered input-sm w-full bg-base-100"
          placeholder="Search visible items..."
        />

        <label
          class="label cursor-pointer justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-3 py-1"
        >
          <span class="label-text text-xs font-bold">Show Mature</span>
          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-warning toggle-xs"
          />
        </label>

        <select
          v-model.number="pageSize"
          class="select select-bordered select-sm bg-base-100"
        >
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="48">48</option>
          <option :value="96">96</option>
        </select>
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-2 text-xs text-base-content/60"
      >
        <span class="badge badge-ghost">
          Showing {{ pagedItems.length }} / {{ visibleItems.length }}
        </span>

        <span
          v-if="activeTab === 'images' && artStore.currentArtImage"
          class="badge badge-primary"
        >
          Selected image #{{ artStore.currentArtImage.id }}
        </span>

        <span v-if="isHydratingImages" class="badge badge-info gap-1">
          <span class="loading loading-spinner loading-xs" />
          Hydrating page images
        </span>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          :disabled="page === 0"
          @click="page--"
        >
          <Icon name="kind-icon:arrow-left" class="h-3 w-3" />
          Prev
        </button>

        <span> Page {{ page + 1 }} / {{ pageCount }} </span>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          :disabled="page >= pageCount - 1"
          @click="page++"
        >
          Next
          <Icon name="kind-icon:arrow-right" class="h-3 w-3" />
        </button>
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
      class="min-h-0 flex-1 overflow-auto rounded-2xl bg-base-200 p-3"
    >
      <div
        v-if="visibleItems.length === 0"
        class="flex min-h-56 flex-col items-center justify-center text-center text-base-content/60"
      >
        <Icon name="kind-icon:gallery" class="h-12 w-12 text-primary" />
        <p class="mt-2 text-lg font-black">Nothing to show.</p>
        <p class="text-sm">
          Either the store is empty, the fetch failed, or the search filter is
          too spicy.
        </p>
      </div>

      <div
        v-else-if="activeTab === 'images'"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <image-card
          v-for="item in pagedImageItems"
          :key="item.image.id"
          :art-image="item.image"
          :selected="artStore.currentArtImage?.id === item.image.id"
          :compact="true"
          :show-actions="true"
          :show-prompt="true"
          :show-meta="true"
          :show-generation-meta="true"
          :show-select-button="true"
          :allow-delete="canModifyImage(item.image)"
          :allow-edit="canModifyImage(item.image)"
          :auto-load-image="false"
          @select="selectImage"
          @edit="startEditingImage"
          @delete="handleImageDeleted"
        />
      </div>

      <div
        v-else-if="activeTab === 'collections'"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <article
          v-for="item in pagedCollectionItems"
          :key="item.key"
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-primary/70">
                Collection
              </p>

              <h3 class="truncate text-base font-black text-base-content">
                {{ item.title }}
              </h3>

              <p class="mt-1 line-clamp-3 text-sm text-base-content/60">
                {{ item.description }}
              </p>
            </div>

            <span class="badge badge-ghost shrink-0"> #{{ item.id }} </span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-xl bg-base-200 p-2">
              <p class="font-bold uppercase text-base-content/50">Art</p>
              <p class="text-base font-black text-base-content">
                {{ item.artCount }}
              </p>
            </div>

            <div class="rounded-xl bg-base-200 p-2">
              <p class="font-bold uppercase text-base-content/50">Images</p>
              <p class="text-base font-black text-base-content">
                {{ item.imageCount }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <span v-if="item.isPublic" class="badge badge-info badge-sm">
              Public
            </span>

            <span v-else class="badge badge-ghost badge-sm"> Private </span>

            <span v-if="item.isMature" class="badge badge-warning badge-sm">
              Mature
            </span>

            <span v-if="item.userId" class="badge badge-secondary badge-sm">
              User {{ item.userId }}
            </span>
          </div>

          <div
            v-if="item.previewUrls.length"
            class="grid grid-cols-4 gap-1 overflow-hidden rounded-2xl bg-base-300 p-1"
          >
            <img
              v-for="url in item.previewUrls"
              :key="url"
              :src="url"
              :alt="item.title"
              class="aspect-square w-full rounded-xl object-cover"
              loading="lazy"
            />
          </div>
        </article>
      </div>

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in pagedArtItems"
          :key="item.key"
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-primary/70">Art</p>

              <h3 class="truncate text-base font-black text-base-content">
                {{ item.title }}
              </h3>

              <p class="mt-1 line-clamp-3 text-sm text-base-content/60">
                {{ item.description }}
              </p>
            </div>

            <span class="badge badge-ghost shrink-0"> #{{ item.id }} </span>
          </div>

          <div class="flex flex-wrap gap-2">
            <span v-if="item.isPublic" class="badge badge-info badge-sm">
              Public
            </span>

            <span v-else class="badge badge-ghost badge-sm"> Private </span>

            <span v-if="item.isMature" class="badge badge-warning badge-sm">
              Mature
            </span>

            <span v-if="item.userId" class="badge badge-secondary badge-sm">
              User {{ item.userId }}
            </span>

            <span v-if="item.artImageId" class="badge badge-success badge-sm">
              Image #{{ item.artImageId }}
            </span>
          </div>

          <div
            v-if="item.imageUrl"
            class="overflow-hidden rounded-2xl border border-base-300 bg-base-300"
          >
            <img
              :src="item.imageUrl"
              :alt="item.title"
              class="h-48 w-full object-cover"
              loading="lazy"
            />
          </div>
        </article>
      </div>
    </section>

    <footer
      class="shrink-0 rounded-2xl bg-base-200 p-3 text-xs text-base-content/60"
    >
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <p>
          Collections:
          <span class="font-bold text-base-content">
            {{ collectionStore.collections.length }}
          </span>
        </p>

        <p>
          Art:
          <span class="font-bold text-base-content">
            {{ artStore.art.length }}
          </span>
        </p>

        <p>
          Images:
          <span class="font-bold text-base-content">
            {{ artStore.artImages.length }}
          </span>
        </p>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/slim-gallery.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { Art, ArtImage } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

type SlimGalleryTab = 'collections' | 'art' | 'images'

type CollectionWithMedia = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
}

type ArtWithImage = Art & {
  artImageId?: number | null
  imagePath?: string | null
  imageUrl?: string | null
  artImage?: ArtImage | null
  ArtImage?: ArtImage | null
}

type SlimCollectionItem = {
  key: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  artCount: number
  imageCount: number
  previewUrls: string[]
}

type SlimArtItem = {
  key: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  artImageId: number | null
  imageUrl: string
}

type SlimImageItem = {
  key: string
  id: number
  image: ArtImage
}

type VisibleItem = SlimCollectionItem | SlimArtItem | SlimImageItem

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

const isLoading = ref(false)
const isHydratingImages = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const activeTab = ref<SlimGalleryTab>('images')
const showMature = ref(false)
const page = ref(0)
const pageSize = ref(24)
const hydratedImages = ref<Record<number, ArtImage>>({})

const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

const tabs = computed(() => [
  {
    value: 'collections' as const,
    label: 'Collections',
    icon: 'kind-icon:gallery',
    count: collectionItems.value.length,
  },
  {
    value: 'art' as const,
    label: 'Art',
    icon: 'kind-icon:image',
    count: artItems.value.length,
  },
  {
    value: 'images' as const,
    label: 'Images',
    icon: 'kind-icon:picture',
    count: imageItems.value.length,
  },
])

const collectionItems = computed<SlimCollectionItem[]>(() =>
  collectionStore.collections.map((collection) =>
    normalizeCollection(collection),
  ),
)

const artItems = computed<SlimArtItem[]>(() =>
  artStore.art.map((art) => normalizeArt(art)),
)

const imageItems = computed<SlimImageItem[]>(() =>
  artStore.artImages.map((image) => ({
    key: `image-${image.id}`,
    id: image.id,
    image: hydratedImages.value[image.id] || image,
  })),
)

const visibleCollectionItems = computed<SlimCollectionItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return collectionItems.value.filter((item) => {
    if (!showMature.value && item.isMature) return false
    if (!query) return true

    return searchableCollectionText(item).includes(query)
  })
})

const visibleArtItems = computed<SlimArtItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return artItems.value.filter((item) => {
    if (!showMature.value && item.isMature) return false
    if (!query) return true

    return searchableArtText(item).includes(query)
  })
})

const visibleImageItems = computed<SlimImageItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return imageItems.value.filter((item) => {
    const image = item.image

    if (!showMature.value && image.isMature) return false
    if (!query) return true

    return searchableImageText(image).includes(query)
  })
})

const visibleItems = computed<VisibleItem[]>(() => {
  if (activeTab.value === 'collections') return visibleCollectionItems.value
  if (activeTab.value === 'art') return visibleArtItems.value
  return visibleImageItems.value
})

const pageCount = computed(() =>
  Math.max(1, Math.ceil(visibleItems.value.length / pageSize.value)),
)

const pageStart = computed(() => page.value * pageSize.value)
const pageEnd = computed(() => pageStart.value + pageSize.value)

const pagedItems = computed<VisibleItem[]>(() =>
  visibleItems.value.slice(pageStart.value, pageEnd.value),
)

const pagedCollectionItems = computed<SlimCollectionItem[]>(() =>
  activeTab.value === 'collections'
    ? (pagedItems.value as SlimCollectionItem[])
    : [],
)

const pagedArtItems = computed<SlimArtItem[]>(() =>
  activeTab.value === 'art' ? (pagedItems.value as SlimArtItem[]) : [],
)

const pagedImageItems = computed<SlimImageItem[]>(() =>
  activeTab.value === 'images' ? (pagedItems.value as SlimImageItem[]) : [],
)

watch([activeTab, searchQuery, showMature, pageSize], () => {
  page.value = 0
})

watch(
  () => [
    activeTab.value,
    page.value,
    pageSize.value,
    searchQuery.value,
    showMature.value,
  ],
  async () => {
    if (activeTab.value === 'images') {
      await hydratePagedImages()
    }
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
    await Promise.all([
      fetchCollectionsSafely(),
      fetchArtSafely(),
      fetchArtImagesSafely(),
    ])

    if (activeTab.value === 'images') {
      await hydratePagedImages()
    }
  } catch (error) {
    const message = getErrorMessage(error, 'Slim gallery failed to initialize.')
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

async function fetchArtSafely() {
  if (typeof artStore.fetchAllArt !== 'function') return
  await artStore.fetchAllArt(true)
}

async function fetchArtImagesSafely() {
  if (typeof artStore.fetchAllArtImages !== 'function') return
  await artStore.fetchAllArtImages({ force: true })
}

async function hydratePagedImages() {
  const imagesNeedingData = pagedImageItems.value
    .map((item) => item.image)
    .filter((image) => shouldHydrateImage(image))
    .slice(0, pageSize.value)

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
    const message = getErrorMessage(
      error,
      'Some page images could not be hydrated.',
    )
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isHydratingImages.value = false
  }
}

function shouldHydrateImage(image: ArtImage): boolean {
  if (hydratedImages.value[image.id]) return false
  if (image.imageData) return false
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

function canModifyImage(image: ArtImage): boolean {
  return (
    userStore.isAdmin || Number(image.userId) === Number(currentUserId.value)
  )
}

function selectImage(image: ArtImage) {
  try {
    void artStore.selectArtImageRecord(image)
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to select image.')
    errorMessage.value = message
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  }
}

async function startEditingImage(imageId: number) {
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const image = await artStore.getArtImageById(imageId, {
      includeImageData: true,
      includeThumbnailData: true,
    })

    if (!image) {
      throw new Error(`Image #${imageId} could not be loaded.`)
    }

    hydratedImages.value = {
      ...hydratedImages.value,
      [image.id]: image,
    }

    await artStore.selectArtImageRecord(image)
    successMessage.value = `Loaded image #${imageId} for editing.`
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to load image for editing.')
    errorMessage.value = message
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  }
}

function handleImageDeleted(imageId: number) {
  if (artStore.currentArtImage?.id === imageId) {
    artStore.deselectArtImage()
  }

  const next = { ...hydratedImages.value }
  delete next[imageId]
  hydratedImages.value = next

  successMessage.value = `Image #${imageId} removed from the current view.`
}

function clearSelectedImage() {
  artStore.deselectArtImage()
  successMessage.value = ''
}

function normalizeCollection(collection: ArtCollection): SlimCollectionItem {
  const media = collection as CollectionWithMedia
  const art = collection.art || []
  const images = getCollectionImages(media)

  return {
    key: `collection-${collection.id}`,
    id: collection.id,
    title: collection.label || `Collection #${collection.id}`,
    description: collection.description || 'No description yet.',
    userId: collection.userId ?? null,
    isPublic: Boolean(collection.isPublic),
    isMature: Boolean(collection.isMature),
    artCount: art.length,
    imageCount: images.length,
    previewUrls: getCollectionPreviewUrls(media),
  }
}

function normalizeArt(art: Art): SlimArtItem {
  const artWithImage = art as ArtWithImage

  return {
    key: `art-${art.id}`,
    id: art.id,
    title: getArtTitle(art),
    description:
      [art.promptString, art.designer, art.checkpoint, art.sampler]
        .filter(Boolean)
        .join(' • ') || 'No generation metadata.',
    userId: art.userId ?? null,
    isPublic: Boolean(art.isPublic),
    isMature: Boolean(art.isMature),
    artImageId: artWithImage.artImageId ?? null,
    imageUrl: getArtImageUrl(art),
  }
}

function getCollectionImages(collection: CollectionWithMedia): ArtImage[] {
  return [
    ...(collection.artImages || []),
    ...(collection.ArtImages || []),
  ].filter((image): image is ArtImage => Boolean(image?.id))
}

function getCollectionPreviewUrls(collection: CollectionWithMedia): string[] {
  const imageUrls = getCollectionImages(collection)
    .map((image) => getArtImageRecordUrl(image))
    .filter(Boolean)

  const artUrls = (collection.art || [])
    .map((art) => getArtImageUrl(art))
    .filter(Boolean)

  return [...new Set([...imageUrls, ...artUrls])].slice(0, 4)
}

function getArtTitle(art: Art): string {
  if (art.promptString?.trim()) {
    return art.promptString.trim().slice(0, 80)
  }

  if (art.path?.trim()) {
    const parts = art.path.split('/')
    return parts.at(-1) || `Art #${art.id}`
  }

  return `Art #${art.id}`
}

function searchableCollectionText(item: SlimCollectionItem): string {
  return [
    item.id,
    item.title,
    item.description,
    item.userId,
    item.artCount,
    item.imageCount,
    item.isPublic ? 'public' : 'private',
    item.isMature ? 'mature' : '',
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
}

function searchableArtText(item: SlimArtItem): string {
  return [
    item.id,
    item.title,
    item.description,
    item.userId,
    item.artImageId,
    item.isPublic ? 'public' : 'private',
    item.isMature ? 'mature' : '',
  ]
    .filter((value) => value !== null && value !== undefined)
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
    image.galleryId,
    image.isPublic ? 'public' : 'private',
    image.isMature ? 'mature' : '',
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
}

function getArtImageUrl(art: Art): string {
  const possible = art as ArtWithImage

  return (
    possible.imagePath ||
    possible.imageUrl ||
    possible.path ||
    getArtImageRecordUrl(possible.artImage || possible.ArtImage || null)
  )
}

function getArtImageRecordUrl(image: ArtImage | null): string {
  if (!image) return ''

  const possible = image as ArtImage & {
    imageUrl?: string | null
    imagePath?: string | null
    path?: string | null
    url?: string | null
    filePath?: string | null
    imageData?: string | null
    fileType?: string | null
    mimeType?: string | null
  }

  if (possible.imageUrl) return possible.imageUrl
  if (possible.imagePath) return possible.imagePath
  if (possible.path) return possible.path
  if (possible.url) return possible.url
  if (possible.filePath) return possible.filePath

  if (possible.imageData?.startsWith('data:image/')) return possible.imageData

  return ''
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
