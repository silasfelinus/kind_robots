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
            Minimal gallery test with image-card only on the Images tab.
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

      <input
        v-model="searchQuery"
        type="search"
        class="input input-bordered input-sm mt-3 w-full bg-base-100"
        placeholder="Search visible items..."
      />
    </header>

    <div
      v-if="errorMessage"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
    >
      {{ errorMessage }}
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
          v-for="image in visibleImages"
          :key="image.id"
          :art-image="image"
          :selected="artStore.currentArtImage?.id === image.id"
          :compact="true"
          :show-actions="false"
          :show-prompt="false"
          :show-meta="false"
          :show-generation-meta="false"
          :show-select-button="false"
          :allow-delete="false"
          :allow-edit="false"
          @select="selectImage"
        />
      </div>

      <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="item in visibleItems"
          :key="item.key"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-primary/70">
                {{ item.type }}
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

          <div class="mt-3 flex flex-wrap gap-2">
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
            v-if="item.imageUrl"
            class="mt-3 overflow-hidden rounded-2xl border border-base-300 bg-base-300"
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
import { computed, onMounted, ref } from 'vue'
import type { Art, ArtImage } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'

type SlimGalleryTab = 'collections' | 'art' | 'images'

type SlimGalleryItem = {
  key: string
  type: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  imageUrl: string
}

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()

const isLoading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const activeTab = ref<SlimGalleryTab>('images')

const tabs = computed(() => [
  {
    value: 'collections' as const,
    label: 'Collections',
    icon: 'kind-icon:gallery',
    count: collectionStore.collections.length,
  },
  {
    value: 'art' as const,
    label: 'Art',
    icon: 'kind-icon:image',
    count: artStore.art.length,
  },
  {
    value: 'images' as const,
    label: 'Images',
    icon: 'kind-icon:picture',
    count: artStore.artImages.length,
  },
])

const collectionItems = computed<SlimGalleryItem[]>(() =>
  collectionStore.collections.map((collection) =>
    normalizeCollection(collection),
  ),
)

const artItems = computed<SlimGalleryItem[]>(() =>
  artStore.art.map((art) => normalizeArt(art)),
)

const imageItems = computed<SlimGalleryItem[]>(() =>
  artStore.artImages.map((image) => normalizeArtImage(image)),
)

const visibleImages = computed<ArtImage[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return artStore.artImages

  return artStore.artImages.filter((image) =>
    [
      image.id,
      image.fileName,
      image.promptString,
      image.negativePrompt,
      image.designer,
      image.checkpoint,
      image.sampler,
      image.userId,
      image.isPublic ? 'public' : 'private',
      image.isMature ? 'mature' : '',
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

const currentItems = computed<SlimGalleryItem[]>(() => {
  if (activeTab.value === 'collections') return collectionItems.value
  if (activeTab.value === 'art') return artItems.value
  return imageItems.value
})

const visibleItems = computed<SlimGalleryItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) return currentItems.value

  return currentItems.value.filter((item) =>
    [
      item.type,
      item.id,
      item.title,
      item.description,
      item.userId,
      item.isPublic ? 'public' : 'private',
      item.isMature ? 'mature' : '',
    ]
      .filter((value) => value !== null && value !== undefined)
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
})

onMounted(async () => {
  await initializeGallery()
})

async function initializeGallery() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    await Promise.all([
      fetchCollectionsSafely(),
      fetchArtSafely(),
      fetchArtImagesSafely(),
    ])
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

function selectImage(image: ArtImage) {
  void artStore.selectArtImageRecord(image)
}

function normalizeCollection(collection: ArtCollection): SlimGalleryItem {
  return {
    key: `collection-${collection.id}`,
    type: 'Collection',
    id: collection.id,
    title: collection.label || `Collection #${collection.id}`,
    description: collection.description || 'No description yet.',
    userId: collection.userId ?? null,
    isPublic: Boolean(collection.isPublic),
    isMature: Boolean(collection.isMature),
    imageUrl: getCollectionImageUrl(collection),
  }
}

function normalizeArt(art: Art): SlimGalleryItem {
  return {
    key: `art-${art.id}`,
    type: 'Art',
    id: art.id,
    title: art.promptString || `Art #${art.id}`,
    description:
      [art.designer, art.checkpoint, art.sampler, art.negativePrompt]
        .filter(Boolean)
        .join(' • ') || 'No generation metadata.',
    userId: art.userId ?? null,
    isPublic: Boolean(art.isPublic),
    isMature: Boolean(art.isMature),
    imageUrl: getArtImageUrl(art),
  }
}

function normalizeArtImage(image: ArtImage): SlimGalleryItem {
  return {
    key: `image-${image.id}`,
    type: 'ArtImage',
    id: image.id,
    title: image.fileName || image.promptString || `Image #${image.id}`,
    description:
      [image.promptString, image.designer, image.checkpoint, image.sampler]
        .filter(Boolean)
        .join(' • ') || 'No image metadata.',
    userId: image.userId ?? null,
    isPublic: Boolean(image.isPublic),
    isMature: Boolean(image.isMature),
    imageUrl: getArtImageRecordUrl(image),
  }
}

function getCollectionImageUrl(collection: ArtCollection): string {
  const possible = collection as ArtCollection & {
    imagePath?: string | null
    imageUrl?: string | null
    artImages?: ArtImage[]
    ArtImages?: ArtImage[]
  }

  const direct = possible.imagePath || possible.imageUrl

  if (direct) return direct

  const firstImage = [
    ...(possible.artImages || []),
    ...(possible.ArtImages || []),
  ].find((image) => getArtImageRecordUrl(image))

  return firstImage ? getArtImageRecordUrl(firstImage) : ''
}

function getArtImageUrl(art: Art): string {
  const possible = art as Art & {
    imagePath?: string | null
    path?: string | null
    artImage?: ArtImage | null
    ArtImage?: ArtImage | null
  }

  return (
    possible.imagePath ||
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

  if (possible.imageData) {
    if (possible.imageData.startsWith('data:image/')) return possible.imageData

    const mimeType = possible.mimeType || possible.fileType || 'image/png'
    return `data:${mimeType};base64,${possible.imageData}`
  }

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
