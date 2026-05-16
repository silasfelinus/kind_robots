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
            Full-ish image-card gallery test. Still no art-card,
            collection-card, or art-interact recursion goblins.
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
          v-if="activeTab === 'images'"
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
        v-if="activeTab === 'images'"
        class="mt-3 flex flex-wrap items-center gap-2 text-xs text-base-content/60"
      >
        <span class="badge badge-ghost">
          Showing {{ pagedImages.length }} / {{ visibleImages.length }}
        </span>

        <span v-if="artStore.currentArtImage" class="badge badge-primary">
          Selected image #{{ artStore.currentArtImage.id }}
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
          v-for="image in pagedImages"
          :key="image.id"
          :art-image="image"
          :selected="artStore.currentArtImage?.id === image.id"
          :compact="true"
          :show-actions="true"
          :show-prompt="true"
          :show-meta="true"
          :show-generation-meta="true"
          :show-select-button="true"
          :allow-delete="canModifyImage(image)"
          :allow-edit="canModifyImage(image)"
          @select="selectImage"
          @edit="startEditingImage"
          @delete="handleImageDeleted"
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
import { computed, onMounted, ref, watch } from 'vue'
import type { Art, ArtImage } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

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
const userStore = useUserStore()

const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const activeTab = ref<SlimGalleryTab>('images')
const showMature = ref(false)
const page = ref(0)
const pageSize = ref(24)

const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

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

  return artStore.artImages.filter((image) => {
    if (!showMature.value && image.isMature) return false

    if (!query) return true

    return [
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
      .includes(query)
  })
})

const currentItems = computed<SlimGalleryItem[]>(() => {
  if (activeTab.value === 'collections') return collectionItems.value
  if (activeTab.value === 'art') return artItems.value
  return imageItems.value
})

const visibleItems = computed<SlimGalleryItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  let items = currentItems.value

  if (!showMature.value) {
    items = items.filter((item) => !item.isMature)
  }

  if (!query) return items

  return items.filter((item) =>
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

const pageCount = computed(() =>
  Math.max(1, Math.ceil(visibleImages.value.length / pageSize.value)),
)

const pageStart = computed(() => page.value * pageSize.value)
const pageEnd = computed(() => pageStart.value + pageSize.value)

const pagedImages = computed(() =>
  visibleImages.value.slice(pageStart.value, pageEnd.value),
)

watch([visibleImages, pageSize], () => {
  page.value = 0
})

onMounted(async () => {
  showMature.value = Boolean(userStore.user?.showMature ?? userStore.showMature)
  await initializeGallery()
})

async function initializeGallery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

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
    })

    if (!image) {
      throw new Error(`Image #${imageId} could not be loaded.`)
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

  successMessage.value = `Image #${imageId} removed from the current view.`
}

function clearSelectedImage() {
  artStore.deselectArtImage()
  successMessage.value = ''
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
    title: getArtTitle(art),
    description:
      [art.promptString, art.designer, art.checkpoint, art.sampler]
        .filter(Boolean)
        .join(' • ') || 'No generation metadata.',
    userId: art.userId ?? null,
    isPublic: Boolean(art.isPublic),
    isMature: Boolean(art.isMature),
    imageUrl: getArtImageUrl(art),
  }
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
