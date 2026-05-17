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
            <h2 class="text-lg font-black text-base-content">Gallery</h2>
          </div>

          <p class="mt-1 max-w-3xl text-sm text-base-content/60">
            Browse art image collections as folders. Open a folder to reveal its
            cards, then select an image to interact with it.
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <add-collection
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
            v-if="highlightedImageId"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearHighlight"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Deselect
          </button>
        </div>
      </div>

      <div
        class="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto]"
      >
        <input
          v-model="searchQuery"
          type="search"
          class="input input-bordered input-sm w-full bg-base-100"
          placeholder="Search collections, prompts, filenames, checkpoints..."
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
          v-model.number="folderPageSize"
          class="select select-bordered select-sm bg-base-100"
          title="Folders per page"
        >
          <option :value="3">3 folders</option>
          <option :value="6">6 folders</option>
          <option :value="9">9 folders</option>
          <option :value="12">12 folders</option>
        </select>
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-2 text-xs text-base-content/60"
      >
        <span class="badge badge-ghost">
          {{ visibleGroups.length }} folders
        </span>

        <span class="badge badge-ghost"> {{ visibleImageCount }} images </span>

        <span
          v-if="expandedGroupKeys.length"
          class="badge badge-primary badge-outline"
        >
          {{ expandedGroupKeys.length }} open
        </span>

        <span v-if="isHydratingImages" class="badge badge-info gap-1">
          <span class="loading loading-spinner loading-xs" />
          Loading images
        </span>

        <span v-if="highlightedImageId" class="badge badge-secondary">
          Image #{{ highlightedImageId }} highlighted
        </span>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            :disabled="folderPage === 0"
            @click="folderPage--"
          >
            <Icon name="kind-icon:arrow-left" class="h-3 w-3" />
            Prev
          </button>

          <span>Page {{ folderPage + 1 }} / {{ folderPageCount }}</span>

          <button
            class="btn btn-ghost btn-xs rounded-xl"
            type="button"
            :disabled="folderPage >= folderPageCount - 1"
            @click="folderPage++"
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
      class="min-h-0 flex-1 overflow-auto rounded-2xl bg-base-200 p-3"
    >
      <div
        v-if="visibleGroups.length === 0"
        class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:folder-search" class="h-12 w-12 text-primary" />
        <p class="mt-2 text-lg font-black text-base-content">
          Nothing to show.
        </p>
        <p class="text-sm">No folders or images match the current filter.</p>
      </div>

      <div v-else class="flex flex-col gap-3">
        <article
          v-for="group in pagedGroups"
          :key="group.key"
          class="overflow-hidden rounded-2xl border bg-base-100"
          :class="[
            activeCollectionKey === group.key
              ? 'border-primary/50 ring-2 ring-primary/30'
              : 'border-base-300',
            group.isVirtual ? 'bg-base-100/80' : 'bg-base-100',
          ]"
        >
          <button
            class="flex w-full flex-col gap-3 p-3 text-left transition hover:bg-base-200/70 lg:flex-row lg:items-center lg:justify-between"
            type="button"
            @click="toggleExpanded(group.key)"
          >
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                :class="group.isVirtual ? 'bg-accent/15' : 'bg-primary/15'"
              >
                <Icon
                  :name="
                    isExpanded(group.key)
                      ? 'kind-icon:folder-open'
                      : 'kind-icon:folder'
                  "
                  class="h-7 w-7"
                  :class="group.isVirtual ? 'text-accent' : 'text-primary'"
                />
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-lg font-black text-base-content">
                    {{ group.title }}
                  </h3>

                  <span
                    v-if="group.isVirtual"
                    class="badge badge-accent badge-sm"
                  >
                    Unsorted
                  </span>

                  <span v-if="group.isPublic" class="badge badge-info badge-sm">
                    Public
                  </span>

                  <span v-else class="badge badge-ghost badge-sm">
                    Private
                  </span>

                  <span
                    v-if="group.isMature"
                    class="badge badge-warning badge-sm"
                  >
                    Mature
                  </span>
                </div>

                <p class="mt-1 line-clamp-2 text-sm text-base-content/60">
                  {{ group.description }}
                </p>
              </div>
            </div>

            <div
              class="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end"
            >
              <span class="badge badge-primary">
                {{ group.images.length }} images
              </span>

              <span
                v-if="isExpanded(group.key)"
                class="badge badge-success badge-outline"
              >
                Open
              </span>

              <Icon
                :name="
                  isExpanded(group.key)
                    ? 'kind-icon:chevron-up'
                    : 'kind-icon:chevron-down'
                "
                class="h-5 w-5 text-base-content/50"
              />
            </div>
          </button>

          <div
            v-if="!isExpanded(group.key)"
            class="border-t border-base-300 bg-base-200/50 p-3"
          >
            <div
              class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="min-w-0">
                <p class="text-sm font-bold text-base-content">
                  {{ group.images.length }} images tucked inside.
                </p>

                <p class="text-xs text-base-content/60">
                  Open this folder to browse its art image cards.
                </p>
              </div>

              <button
                class="btn btn-primary btn-sm rounded-xl"
                type="button"
                @click.stop="toggleExpanded(group.key)"
              >
                <Icon name="kind-icon:folder-open" class="h-4 w-4" />
                Open folder
              </button>
            </div>
          </div>

          <div
            v-else-if="group.images.length === 0"
            class="border-t border-base-300 bg-base-200/50 p-6"
          >
            <div
              class="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/55"
            >
              <Icon name="kind-icon:image" class="h-10 w-10 text-primary" />
              <p class="mt-2 text-sm font-bold text-base-content">
                Empty collection.
              </p>
              <p class="text-xs text-base-content/60">
                No art images are attached to this folder yet.
              </p>
            </div>
          </div>

          <div v-else class="border-t border-base-300 bg-base-200/50 p-3">
            <div
              class="mb-3 flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p class="text-sm font-bold text-base-content">
                  Showing {{ getVisibleImages(group).length }} images
                </p>
                <p class="text-xs text-base-content/60">
                  Click a card to highlight it, then open it in the art
                  workspace.
                </p>
              </div>

              <button
                class="btn btn-ghost btn-sm rounded-xl"
                type="button"
                @click="toggleExpanded(group.key)"
              >
                <Icon name="kind-icon:folder" class="h-4 w-4" />
                Close folder
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3">
              <div
                v-for="image in getVisibleImages(group)"
                :key="image.id"
                class="relative rounded-2xl"
                :class="
                  highlightedImageId === image.id ? 'ring-2 ring-secondary' : ''
                "
              >
                <image-card
                  :art-image="hydratedImages[image.id] || image"
                  :selected="highlightedImageId === image.id"
                  :compact="true"
                  :show-actions="highlightedImageId === image.id"
                  :show-prompt="true"
                  :show-meta="true"
                  :show-generation-meta="false"
                  :show-select-button="false"
                  :allow-delete="canModifyImage(image)"
                  :allow-edit="false"
                  :auto-load-image="false"
                  @select="handleCardClick(image)"
                  @delete="handleImageDeleted"
                />

                <div
                  v-if="highlightedImageId === image.id"
                  class="mt-2 flex gap-2"
                >
                  <button
                    class="btn btn-primary btn-sm flex-1 rounded-xl text-white"
                    type="button"
                    @click="
                      openInArtInteract(hydratedImages[image.id] || image)
                    "
                  >
                    <Icon name="kind-icon:sparkles" class="h-4 w-4" />
                    Open
                  </button>

                  <button
                    v-if="canModifyImage(image)"
                    class="btn btn-error btn-sm rounded-xl"
                    type="button"
                    @click="handleImageDeleted(image.id)"
                  >
                    <Icon name="kind-icon:trash" class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
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

        <p v-if="highlightedImageId">
          Highlighted:
          <span class="font-bold text-secondary">
            #{{ highlightedImageId }}
          </span>
        </p>
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/slim-gallery.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '@/stores/artStore'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

// ─── Types ───────────────────────────────────────────────────────────────────

type FolderGroup = {
  key: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isVirtual: boolean
  images: ArtImage[]
}

type CollectionWithMedia = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
}

// ─── Stores ──────────────────────────────────────────────────────────────────

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

// ─── State ───────────────────────────────────────────────────────────────────

const isLoading = ref(false)
const isHydratingImages = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const showMature = ref(false)
const folderPage = ref(0)
const folderPageSize = ref(6)
const perFolderLimit = ref(12)
const hydratedImages = ref<Record<number, ArtImage>>({})
const expandedGroupKeys = ref<string[]>([])

/** The currently highlighted image (single-click selection within the gallery). */
const highlightedImageId = ref<number | null>(null)

/**
 * The folder that was last intentionally focused by the user.
 * Persisted to sessionStorage so returning from art-interact restores context.
 */
const activeCollectionKey = ref<string>('')

const SESSION_KEY = 'slim-gallery-active-collection'

const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

// ─── Collection Groups ────────────────────────────────────────────────────────

const collectionGroups = computed<FolderGroup[]>(() => {
  const groups = collectionStore.collections
    .map(normalizeCollectionGroup)
    .sort((a, b) => {
      return a.title.localeCompare(b.title)
    })

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

  const unassigned: FolderGroup = {
    key: 'collection-unassigned',
    id: -1,
    title: 'Unsorted',
    description: 'Images not currently assigned to a collection.',
    userId: currentUserId.value,
    isPublic: false,
    isMature: false,
    isVirtual: true,
    images: unassignedImages,
  }

  return [...groups, unassigned]
})

const visibleGroups = computed<FolderGroup[]>(() => {
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

const visibleImageCount = computed(() =>
  visibleGroups.value.reduce((sum, group) => sum + group.images.length, 0),
)

const folderPageCount = computed(() =>
  Math.max(1, Math.ceil(visibleGroups.value.length / folderPageSize.value)),
)

const pagedGroups = computed(() => {
  const start = folderPage.value * folderPageSize.value
  return visibleGroups.value.slice(start, start + folderPageSize.value)
})

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch([searchQuery, showMature, folderPageSize], () => {
  folderPage.value = 0
})

watch(
  () => [
    folderPage.value,
    folderPageSize.value,
    perFolderLimit.value,
    searchQuery.value,
    showMature.value,
    expandedGroupKeys.value.join('|'),
  ],
  async () => {
    await hydrateVisibleFolderImages()
  },
)

watch(activeCollectionKey, (key) => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, key)
  }
})

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  showMature.value = Boolean(userStore.user?.showMature ?? userStore.showMature)

  // Restore previously active collection from sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    const saved = sessionStorage.getItem(SESSION_KEY)
    if (saved) activeCollectionKey.value = saved
  }

  await initializeGallery()
})

// ─── Initialization ───────────────────────────────────────────────────────────

async function initializeGallery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  hydratedImages.value = {}

  try {
    await Promise.all([fetchCollectionsSafely(), fetchArtImagesSafely()])

    await hydrateVisibleFolderImages()
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

// ─── Group Helpers ────────────────────────────────────────────────────────────

function normalizeCollectionGroup(collection: ArtCollection): FolderGroup {
  const media = collection as CollectionWithMedia
  const images = getCollectionImages(media).map(
    (image) => hydratedImages.value[image.id] || image,
  )

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
  }
}

function getCollectionImages(collection: CollectionWithMedia): ArtImage[] {
  return [
    ...(collection.artImages || []),
    ...(collection.ArtImages || []),
  ].filter((image): image is ArtImage => Boolean(image?.id))
}

function filterGroup(group: FolderGroup, query: string): FolderGroup {
  const matureSafe = group.images.filter(
    (image) => showMature.value || !image.isMature,
  )

  if (!query) return { ...group, images: matureSafe }

  const groupMatches = searchableGroupText(group).includes(query)
  if (groupMatches) return { ...group, images: matureSafe }

  return {
    ...group,
    images: matureSafe.filter((image) =>
      searchableImageText(image).includes(query),
    ),
  }
}

function getVisibleImages(group: FolderGroup): ArtImage[] {
  if (!isExpanded(group.key)) return []
  return group.images
}

function isExpanded(key: string): boolean {
  return expandedGroupKeys.value.includes(key)
}

function toggleExpanded(key: string) {
  expandedGroupKeys.value = isExpanded(key)
    ? expandedGroupKeys.value.filter((item) => item !== key)
    : [...expandedGroupKeys.value, key]
}

function setActiveCollection(key: string) {
  activeCollectionKey.value = key
}

// ─── Image Hydration ──────────────────────────────────────────────────────────

async function hydrateVisibleFolderImages() {
  const imagesNeedingData = pagedGroups.value
    .flatMap((group) => getVisibleImages(group))
    .filter(shouldHydrateImage)

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

// ─── Selection Logic ──────────────────────────────────────────────────────────

/**
 * Single-click: highlight the card within the gallery.
 * Clicking an already-highlighted card deselects it.
 * Does NOT navigate or touch navStore.
 */
function handleCardClick(image: ArtImage) {
  if (highlightedImageId.value === image.id) {
    highlightedImageId.value = null
  } else {
    highlightedImageId.value = image.id
  }
}

function clearHighlight() {
  highlightedImageId.value = null
}

/**
 * THE single place that navigates to art-interact for a selected image.
 * Calls selectArtImageRecord (sets currentArtImage in store),
 * then switches the dashboard tab to 'selected'.
 *
 * Nothing else in this component should touch navStore.
 */
async function openInArtInteract(image: ArtImage) {
  errorMessage.value = ''

  try {
    const result = await artStore.selectArtImageRecord(image)

    if (!result.success) {
      throw new Error(result.message || 'Failed to select image.')
    }

    navStore.setDashboardTab('art', 'selected')
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to open image.')
    errorMessage.value = message
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

function handleCollectionCreated() {
  successMessage.value = 'Collection created.'
  void fetchCollectionsSafely()
}

async function handleImageDeleted(imageId: number) {
  errorMessage.value = ''

  const deleted = await artStore.deleteArtImage(imageId)

  if (deleted) {
    if (highlightedImageId.value === imageId) highlightedImageId.value = null

    const next = { ...hydratedImages.value }
    delete next[imageId]
    hydratedImages.value = next

    successMessage.value = `Image #${imageId} deleted.`
  } else {
    errorMessage.value = `Failed to delete image #${imageId}.`
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────

function canModifyImage(image: ArtImage): boolean {
  return (
    userStore.isAdmin || Number(image.userId) === Number(currentUserId.value)
  )
}

// ─── Search Helpers ───────────────────────────────────────────────────────────

function searchableGroupText(group: FolderGroup): string {
  return [
    group.id,
    group.title,
    group.description,
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
