<!-- /components/content/art/slim-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-2 rounded-2xl bg-base-300 p-2"
  >
    <!-- ── Header ─────────────────────────────────────────────────────── -->
    <header
      class="shrink-0 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
    >
      <!-- Title + controls row -->
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:gallery" class="h-5 w-5 shrink-0 text-primary" />
        <h2 class="min-w-0 truncate text-base font-black text-base-content">
          {{ activeGroup ? activeGroup.title : 'Gallery' }}
        </h2>
        <p
          class="hidden min-w-0 truncate text-xs text-base-content/50 sm:block"
        >
          {{ headerSummary }}
        </p>

        <div class="flex-1" />

        <div class="flex shrink-0 items-center gap-1">
          <!-- Size toggle -->
          <div class="flex overflow-hidden rounded-lg border border-base-300">
            <button
              v-for="s in SIZE_OPTIONS"
              :key="s.value"
              class="flex h-7 w-8 items-center justify-center text-xs font-bold transition"
              :class="
                viewSize === s.value
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100 text-base-content/60 hover:bg-base-300'
              "
              type="button"
              :title="s.label"
              @click="viewSize = s.value"
            >
              {{ s.value.toUpperCase() }}
            </button>
          </div>

          <div class="h-5 w-px bg-base-300" />

          <button
            v-if="activeGroup"
            class="btn btn-ghost btn-xs rounded-lg"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
            Back
          </button>

          <add-collection
            v-if="!activeGroup"
            :compact="true"
            :show-flags="false"
            @created="handleCollectionCreated"
          />

          <button
            class="btn btn-primary btn-xs rounded-lg"
            type="button"
            :disabled="isLoading"
            @click="initializeGallery"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-3.5 w-3.5" />
          </button>

          <button
            v-if="selectedImageForOverlay"
            class="btn btn-ghost btn-xs rounded-lg"
            type="button"
            @click="clearSelectedImage"
          >
            <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <!-- Search + filters row -->
      <div class="mt-2 flex items-center gap-2">
        <input
          v-model="searchQuery"
          type="search"
          class="input input-bordered input-xs flex-1 bg-base-100"
          :placeholder="activeGroup ? 'Search images…' : 'Search collections…'"
        />

        <label
          class="flex cursor-pointer items-center gap-1.5 rounded-lg border border-base-300 bg-base-100 px-2 py-1"
        >
          <span class="text-xs font-bold text-base-content/70">Mature</span>
          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-warning toggle-xs"
          />
        </label>

        <select
          v-if="!activeGroup"
          v-model.number="folderPageSize"
          class="select select-bordered select-xs bg-base-100"
          title="Collections per page"
        >
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="36">36</option>
          <option :value="48">48</option>
        </select>

        <select
          v-else
          v-model.number="imagePageSize"
          class="select select-bordered select-xs bg-base-100"
          title="Images per page"
        >
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="48">48</option>
          <option :value="96">96</option>
        </select>
      </div>

      <!-- Stats row (no pagination here — moved to bottom) -->
      <div
        class="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-base-content/50"
      >
        <span class="badge badge-ghost badge-sm"
          >{{ visibleGroups.length }} collections</span
        >
        <span class="badge badge-ghost badge-sm"
          >{{ visibleImageCount }} images</span
        >
        <span v-if="activeGroup" class="badge badge-primary badge-sm"
          >{{ activeGroup.images.length }} in view</span
        >
        <span v-if="isHydratingImages" class="badge badge-info badge-sm gap-1">
          <span class="loading loading-spinner loading-xs" />
          Loading
        </span>
      </div>
    </header>

    <!-- ── Alerts ──────────────────────────────────────────────────────── -->
    <div
      v-if="errorMessage"
      class="shrink-0 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs text-error"
    >
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="shrink-0 rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-xs text-success"
    >
      {{ successMessage }}
    </div>

    <!-- ── Loading ─────────────────────────────────────────────────────── -->
    <div
      v-if="isLoading"
      class="flex min-h-56 flex-1 items-center justify-center rounded-xl bg-base-200"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- ── Content ─────────────────────────────────────────────────────── -->
    <section
      v-else
      class="relative min-h-0 flex-1 overflow-auto rounded-xl bg-base-200 p-2"
    >
      <!-- Empty (folder view) -->
      <div
        v-if="!activeGroup && visibleGroups.length === 0"
        class="flex min-h-56 flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:folder-search" class="h-12 w-12 text-primary" />
        <p class="mt-2 text-lg font-black text-base-content">
          Nothing to show.
        </p>
        <p class="text-sm">No collections match the current filters.</p>
      </div>

      <!-- Collection grid — clicking a card auto-enters it (no Open button needed) -->
      <div v-else-if="!activeGroup" class="grid gap-2" :class="folderGridClass">
        <collection-card
          v-for="group in pagedGroups"
          :key="group.key"
          :collection="group.collection"
          :selected="activeGroupKey === group.key"
          :compact="viewSize === 'xs' || viewSize === 'sm'"
          :show-stats="false"
          :show-select-button="false"
          :show-mature="showMature"
          :size="viewSize"
          :preview-art-image="getPreviewImage(group)"
          @select="selectGroup(group.key)"
          @delete="handleCollectionDeleted"
        />
      </div>

      <!-- Image view -->
      <div v-else class="flex min-h-0 flex-col gap-2">
        <!-- Collection info bar -->
        <div
          class="flex items-center gap-2 rounded-xl border border-base-300 bg-base-100 px-3 py-2"
        >
          <Icon
            :name="
              activeGroup.isVirtual ? 'kind-icon:archive' : 'kind-icon:folder'
            "
            class="h-4 w-4 shrink-0 text-primary"
          />
          <h3 class="min-w-0 truncate text-sm font-black text-base-content">
            {{ activeGroup.title }}
          </h3>
          <span
            v-if="activeGroup.isVirtual"
            class="badge badge-accent badge-sm shrink-0"
            >Unsorted</span
          >
          <span class="badge badge-primary badge-sm shrink-0">{{
            filteredActiveImages.length
          }}</span>
          <button
            class="btn btn-ghost btn-xs ml-auto rounded-lg"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
            Collections
          </button>
        </div>

        <!-- Empty image state -->
        <div
          v-if="filteredActiveImages.length === 0"
          class="flex min-h-56 flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />
          <p class="mt-2 text-lg font-black text-base-content">
            No images here.
          </p>
          <p class="text-sm">No art images match the current filters.</p>
        </div>

        <!-- Image grid — clicking auto-selects and opens overlay -->
        <div v-else class="grid gap-2" :class="imageGridClass">
          <image-card
            v-for="image in pagedActiveImages"
            :key="image.id"
            :art-image="hydratedImages[image.id] || image"
            :selected="selectedImageForOverlay?.id === image.id"
            :compact="viewSize === 'xs' || viewSize === 'sm'"
            :show-actions="selectedImageForOverlay?.id === image.id"
            :show-prompt="viewSize !== 'xs'"
            :show-meta="viewSize === 'md' || viewSize === 'lg'"
            :show-generation-meta="false"
            :show-image-status="false"
            :show-select-button="false"
            :allow-delete="canModifyImage(image)"
            :allow-edit="false"
            :auto-load-image="false"
            :size="viewSize"
            @select="selectImage"
            @delete="handleImageDeleted"
          />
        </div>
      </div>

      <!-- Image overlay -->
      <div
        v-if="selectedImageForOverlay"
        class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 p-3 backdrop-blur-sm"
      >
        <div
          class="flex max-h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-2xl"
        >
          <header
            class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-200 px-4 py-2"
          >
            <div class="min-w-0">
              <p class="text-xs font-bold uppercase text-base-content/50">
                Selected
              </p>
              <h3 class="truncate text-base font-black text-base-content">
                #{{ selectedImageForOverlay.id }}
              </h3>
            </div>
            <button
              class="btn btn-ghost btn-sm rounded-xl"
              type="button"
              @click="clearSelectedImage"
            >
              <Icon name="kind-icon:x" class="h-4 w-4" />
              Close
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-auto p-3">
            <art-interact />
          </div>
        </div>
      </div>
    </section>

    <!-- ── Pagination (bottom) ─────────────────────────────────────────── -->
    <div
      v-if="currentPageCount > 1"
      class="shrink-0 flex items-center justify-center gap-2 rounded-xl bg-base-200 px-3 py-1.5"
    >
      <button
        class="btn btn-ghost btn-xs rounded-lg"
        type="button"
        :disabled="currentPage === 0"
        @click="currentPage--"
      >
        <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
        Prev
      </button>

      <!-- Page number pills -->
      <div class="flex items-center gap-1">
        <button
          v-for="p in pageRange"
          :key="p"
          class="btn btn-xs rounded-lg min-w-8"
          :class="p === currentPage ? 'btn-primary' : 'btn-ghost'"
          type="button"
          @click="currentPage = p"
        >
          {{ p + 1 }}
        </button>
      </div>

      <button
        class="btn btn-ghost btn-xs rounded-lg"
        type="button"
        :disabled="currentPage >= currentPageCount - 1"
        @click="currentPage++"
      >
        Next
        <Icon name="kind-icon:arrow-right" class="h-3.5 w-3.5" />
      </button>
    </div>

    <!-- ── Footer ─────────────────────────────────────────────────────── -->
    <footer
      class="shrink-0 flex items-center gap-3 rounded-xl bg-base-200 px-3 py-1.5 text-xs text-base-content/50"
    >
      <span
        ><span class="font-bold text-base-content">{{
          collectionStore.collections.length
        }}</span>
        collections</span
      >
      <span
        ><span class="font-bold text-base-content">{{
          artStore.artImages.length
        }}</span>
        images</span
      >
      <span
        ><span class="font-bold text-base-content">{{
          visibleImageCount
        }}</span>
        visible</span
      >
      <span
        v-if="activeGroup"
        class="ml-auto truncate font-bold text-primary"
        >{{ activeGroup.title }}</span
      >
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

type ViewSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_OPTIONS: { value: ViewSize; label: string }[] = [
  { value: 'xs', label: 'Extra compact' },
  { value: 'sm', label: 'Compact' },
  { value: 'md', label: 'Normal' },
  { value: 'lg', label: 'Large' },
]

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
const folderPageSize = ref(24) // default 24
const imagePageSize = ref(24)
const hydratedImages = ref<Record<number, ArtImage>>({})
const activeGroupKey = ref<string | null>(null)
const selectedImageForOverlay = ref<ArtImage | null>(null)
const viewSize = ref<ViewSize>('md')

// ── Grid classes ──────────────────────────────────────────────────────────────

const folderGridClass = computed(() => {
  switch (viewSize.value) {
    case 'xs':
      return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
    case 'sm':
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
    case 'lg':
      return 'grid-cols-1 xl:grid-cols-2'
    default:
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
  }
})

const imageGridClass = computed(() => {
  switch (viewSize.value) {
    case 'xs':
      return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
    case 'sm':
      return 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
    case 'lg':
      return 'grid-cols-1 md:grid-cols-1 xl:grid-cols-2'
    default:
      return 'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3'
  }
})

// ── Computed ──────────────────────────────────────────────────────────────────

const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

const activeGroup = computed(() => {
  if (!activeGroupKey.value) return null
  return (
    visibleGroups.value.find((g) => g.key === activeGroupKey.value) ||
    collectionGroups.value.find((g) => g.key === activeGroupKey.value) ||
    null
  )
})

const headerSummary = computed(() => {
  if (activeGroup.value)
    return `${activeGroup.value.images.length} images — click to open`
  return `${visibleGroups.value.length} collections · ${visibleImageCount.value} images`
})

const collectionGroups = computed<GalleryGroup[]>(() => {
  const groups = collectionStore.collections
    .map(normalizeCollectionGroup)
    .sort((a, b) => a.title.localeCompare(b.title))

  const assignedImageIds = new Set<number>()
  for (const group of groups) {
    for (const image of group.images) assignedImageIds.add(image.id)
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
    .filter((image) => !query || searchableImageText(image).includes(query))
})

const visibleImageCount = computed(() =>
  visibleGroups.value.reduce((sum, g) => sum + g.images.length, 0),
)

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

// Compact page range: max 7 page pills, ellipsis-free for simplicity
const pageRange = computed(() => {
  const total = currentPageCount.value
  const current = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const start = Math.max(0, Math.min(current - 3, total - 7))
  return Array.from({ length: Math.min(7, total) }, (_, i) => start + i)
})

const pagedGroups = computed(() => {
  const start = folderPage.value * folderPageSize.value
  return visibleGroups.value.slice(start, start + folderPageSize.value)
})

const pagedActiveImages = computed(() => {
  const start = imagePage.value * imagePageSize.value
  return filteredActiveImages.value.slice(start, start + imagePageSize.value)
})

// ── Watchers ──────────────────────────────────────────────────────────────────

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

watch(viewSize, (val) => {
  if (typeof localStorage !== 'undefined')
    localStorage.setItem('galleryViewSize', val)
})

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  showMature.value = Boolean(userStore.user?.showMature ?? userStore.showMature)
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('galleryViewSize') as ViewSize | null
    if (stored && ['xs', 'sm', 'md', 'lg'].includes(stored))
      viewSize.value = stored
  }
  await initializeGallery()
})

// ── Actions ───────────────────────────────────────────────────────────────────

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
    collection: { ...media, artImages: images, ArtImages: images, images },
  }
}

function getCollectionImages(collection: GalleryCollection): ArtImage[] {
  const map = new Map<number, ArtImage>()
  for (const image of [
    ...(collection.artImages || []),
    ...(collection.ArtImages || []),
    ...(collection.images || []),
  ]) {
    if (image?.id) map.set(image.id, hydratedImages.value[image.id] || image)
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
  const matureSafeImages = group.images.filter(
    (image) => showMature.value || !image.isMature,
  )
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
  if (searchableGroupText(group).includes(query)) return baseGroup
  const images = matureSafeImages.filter((image) =>
    searchableImageText(image).includes(query),
  )
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
  const images = group.images.filter(
    (image) => showMature.value || !image.isMature,
  )
  if (!images.length) return null
  const image = images[Math.abs(group.id) % images.length] ?? images[0] ?? null
  return image ? hydratedImages.value[image.id] || image : null
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
  if (typeof artStore.deselectArt === 'function') artStore.deselectArt()
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
      if (fetched)
        hydratedImages.value = {
          ...hydratedImages.value,
          [fetched.id]: fetched,
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
  if (activeGroup.value?.id === id) clearActiveGroup()
  void fetchCollectionsSafely()
}

async function handleImageDeleted(imageId: number) {
  errorMessage.value = ''
  const deleted = await artStore.deleteArtImage(imageId)
  if (deleted) {
    if (selectedImageForOverlay.value?.id === imageId)
      selectedImageForOverlay.value = null
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
    .filter((v) => v !== null && v !== undefined)
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
