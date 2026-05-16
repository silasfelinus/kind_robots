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
            Collection folders with safe Art shells and real ArtImage cards.
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
            v-if="artStore.currentArt || artStore.currentArtImage"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            @click="clearSelected"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Clear Selected
          </button>
        </div>
      </div>

      <div
        class="mt-3 grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
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
          <span class="label-text text-xs font-bold">Show Mature</span>
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

        <select
          v-model.number="perFolderLimit"
          class="select select-bordered select-sm bg-base-100"
          title="Cards per collapsed folder"
        >
          <option :value="6">6 cards</option>
          <option :value="12">12 cards</option>
          <option :value="24">24 cards</option>
          <option :value="48">48 cards</option>
        </select>
      </div>

      <div
        class="mt-3 flex flex-wrap items-center gap-2 text-xs text-base-content/60"
      >
        <span class="badge badge-ghost">
          Collections {{ visibleGroups.length }}
        </span>

        <span class="badge badge-ghost"> Art {{ visibleArtCount }} </span>

        <span class="badge badge-ghost"> Images {{ visibleImageCount }} </span>

        <span v-if="isHydratingImages" class="badge badge-info gap-1">
          <span class="loading loading-spinner loading-xs" />
          Hydrating visible images
        </span>

        <span v-if="artStore.currentArt" class="badge badge-primary">
          Selected art #{{ artStore.currentArt.id }}
        </span>

        <span v-if="artStore.currentArtImage" class="badge badge-secondary">
          Selected image #{{ artStore.currentArtImage.id }}
        </span>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          :disabled="folderPage === 0"
          @click="folderPage--"
        >
          <Icon name="kind-icon:arrow-left" class="h-3 w-3" />
          Prev
        </button>

        <span> Page {{ folderPage + 1 }} / {{ folderPageCount }} </span>

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
        class="flex min-h-56 flex-col items-center justify-center text-center text-base-content/60"
      >
        <Icon name="kind-icon:gallery" class="h-12 w-12 text-primary" />
        <p class="mt-2 text-lg font-black">Nothing to show.</p>
        <p class="text-sm">
          No collections, art, or images match the current filter.
        </p>
      </div>

      <div v-else class="flex flex-col gap-4">
        <article
          v-for="group in pagedGroups"
          :key="group.key"
          class="rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <header
            class="flex flex-col gap-3 border-b border-base-300 pb-3 lg:flex-row lg:items-start lg:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <Icon
                  name="kind-icon:folder"
                  class="h-5 w-5 shrink-0 text-primary"
                />

                <h3 class="truncate text-lg font-black text-base-content">
                  {{ group.title }}
                </h3>

                <span
                  v-if="group.isVirtual"
                  class="badge badge-accent badge-sm"
                >
                  Virtual
                </span>

                <span v-if="group.isPublic" class="badge badge-info badge-sm">
                  Public
                </span>

                <span v-else class="badge badge-ghost badge-sm">Private</span>

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

            <div class="flex shrink-0 flex-wrap gap-2">
              <span class="badge badge-ghost">
                {{ group.art.length }} art
              </span>

              <span class="badge badge-ghost">
                {{ group.images.length }} images
              </span>

              <span class="badge badge-primary">
                {{ group.cards.length }} cards
              </span>

              <button
                v-if="group.cards.length > perFolderLimit"
                class="btn btn-ghost btn-xs rounded-xl"
                type="button"
                @click="toggleExpanded(group.key)"
              >
                <Icon
                  :name="
                    isExpanded(group.key)
                      ? 'kind-icon:chevron-up'
                      : 'kind-icon:chevron-down'
                  "
                  class="h-3 w-3"
                />
                {{ isExpanded(group.key) ? 'Show less' : 'Show all' }}
              </button>
            </div>
          </header>

          <div
            v-if="getVisibleCards(group).length === 0"
            class="flex min-h-32 flex-col items-center justify-center text-center text-base-content/55"
          >
            <Icon name="kind-icon:image" class="h-9 w-9 text-primary" />
            <p class="mt-2 text-sm font-bold">Empty collection.</p>
          </div>

          <div
            v-else
            class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
          >
            <article
              v-for="card in getVisibleArtCards(group)"
              :key="card.key"
              class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
              :class="
                artStore.currentArt?.id === card.art.id
                  ? 'ring-2 ring-primary'
                  : ''
              "
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs font-bold uppercase text-primary/70">Art</p>

                  <h3
                    class="line-clamp-2 text-base font-black text-base-content"
                  >
                    {{ getArtTitle(card.art) }}
                  </h3>

                  <p class="mt-1 line-clamp-3 text-sm text-base-content/60">
                    {{ getArtDescription(card.art) }}
                  </p>
                </div>

                <span class="badge badge-ghost shrink-0">
                  #{{ card.art.id }}
                </span>
              </div>

              <div class="flex flex-wrap gap-2">
                <span
                  v-if="card.art.isPublic"
                  class="badge badge-info badge-sm"
                >
                  Public
                </span>

                <span v-else class="badge badge-ghost badge-sm">Private</span>

                <span
                  v-if="card.art.isMature"
                  class="badge badge-warning badge-sm"
                >
                  Mature
                </span>

                <span
                  v-if="card.art.userId"
                  class="badge badge-secondary badge-sm"
                >
                  User {{ card.art.userId }}
                </span>

                <span
                  v-if="getArtImageId(card.art)"
                  class="badge badge-success badge-sm"
                >
                  Image #{{ getArtImageId(card.art) }}
                </span>
              </div>

              <div
                v-if="getArtPreviewUrl(card.art)"
                class="overflow-hidden rounded-2xl border border-base-300 bg-base-300"
              >
                <img
                  :src="getArtPreviewUrl(card.art)"
                  :alt="getArtTitle(card.art)"
                  class="h-48 w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div class="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  class="btn btn-sm rounded-xl"
                  :class="
                    artStore.currentArt?.id === card.art.id
                      ? 'btn-primary text-white'
                      : 'btn-outline'
                  "
                  type="button"
                  @click.stop="selectArt(card.art)"
                >
                  <Icon name="kind-icon:check" class="h-4 w-4" />
                  {{
                    artStore.currentArt?.id === card.art.id
                      ? 'Selected'
                      : 'Select'
                  }}
                </button>

                <button
                  v-if="canModifyArt(card.art)"
                  class="btn btn-secondary btn-sm rounded-xl"
                  type="button"
                  @click.stop="startEditingArt(card.art.id)"
                >
                  <Icon name="kind-icon:pencil" class="h-4 w-4" />
                  Edit
                </button>
              </div>
            </article>

            <image-card
              v-for="card in getVisibleImageCards(group)"
              :key="card.key"
              :art-image="card.image"
              :selected="artStore.currentArtImage?.id === card.image.id"
              :compact="true"
              :show-actions="true"
              :show-prompt="true"
              :show-meta="true"
              :show-generation-meta="true"
              :show-select-button="true"
              :allow-delete="canModifyImage(card.image)"
              :allow-edit="canModifyImage(card.image)"
              :auto-load-image="false"
              @select="selectImage"
              @edit="startEditingImage"
              @delete="handleImageDeleted"
            />
          </div>

          <footer
            v-if="!isExpanded(group.key) && group.cards.length > perFolderLimit"
            class="mt-3 rounded-2xl bg-base-200 p-3 text-center text-xs text-base-content/60"
          >
            Showing {{ perFolderLimit }} of {{ group.cards.length }} cards. Open
            the folder to render the rest without summoning the lag kraken.
          </footer>
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

type FolderCard =
  | {
      key: string
      type: 'art'
      art: Art
    }
  | {
      key: string
      type: 'image'
      image: ArtImage
    }

type FolderGroup = {
  key: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isVirtual: boolean
  art: Art[]
  images: ArtImage[]
  cards: FolderCard[]
}

type CollectionWithMedia = ArtCollection & {
  art?: Art[]
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
const folderPageSize = ref(6)
const perFolderLimit = ref(12)
const hydratedImages = ref<Record<number, ArtImage>>({})
const expandedGroupKeys = ref<string[]>([])

const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

const appUrl = computed(() => {
  const config = useRuntimeConfig()
  const value =
    config.public?.appUrl ||
    config.public?.APP_URL ||
    config.public?.siteUrl ||
    config.public?.SITE_URL ||
    ''

  if (typeof value === 'string' && value.trim()) {
    return value.trim().replace(/\/+$/, '')
  }

  if (import.meta.client && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '')
  }

  return ''
})

const collectionGroups = computed<FolderGroup[]>(() => {
  const groups = collectionStore.collections.map((collection) =>
    normalizeCollectionGroup(collection),
  )

  const assignedArtIds = new Set<number>()
  const assignedImageIds = new Set<number>()

  for (const group of groups) {
    for (const art of group.art) {
      assignedArtIds.add(art.id)
    }

    for (const image of group.images) {
      assignedImageIds.add(image.id)
    }
  }

  const unassignedArt = artStore.art.filter(
    (art) => !assignedArtIds.has(art.id),
  )

  const unassignedImages = artStore.artImages
    .map((image) => hydratedImages.value[image.id] || image)
    .filter((image) => !assignedImageIds.has(image.id))

  const unassignedGroup = makeFolderGroup({
    key: 'collection-unassigned',
    id: -1,
    title: 'Unassigned',
    description:
      'Art and images that are not currently assigned to a collection.',
    userId: currentUserId.value,
    isPublic: false,
    isMature: false,
    isVirtual: true,
    art: unassignedArt,
    images: unassignedImages,
  })

  return [unassignedGroup, ...groups]
})

const visibleGroups = computed<FolderGroup[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return collectionGroups.value
    .map((group) => filterGroup(group, query))
    .filter((group) => {
      if (!showMature.value && group.isMature) return false
      if (!group.cards.length && query) return false
      if (!group.cards.length && group.id === -1) return false
      return true
    })
})

const visibleArtCount = computed(() =>
  visibleGroups.value.reduce((sum, group) => sum + group.art.length, 0),
)

const visibleImageCount = computed(() =>
  visibleGroups.value.reduce((sum, group) => sum + group.images.length, 0),
)

const folderPageCount = computed(() =>
  Math.max(1, Math.ceil(visibleGroups.value.length / folderPageSize.value)),
)

const folderPageStart = computed(() => folderPage.value * folderPageSize.value)

const folderPageEnd = computed(
  () => folderPageStart.value + folderPageSize.value,
)

const pagedGroups = computed(() =>
  visibleGroups.value.slice(folderPageStart.value, folderPageEnd.value),
)

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

    await hydrateVisibleFolderImages()
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

function normalizeCollectionGroup(collection: ArtCollection): FolderGroup {
  const media = collection as CollectionWithMedia
  const art = getCollectionArt(media)
  const images = getCollectionImages(media).map(
    (image) => hydratedImages.value[image.id] || image,
  )

  return makeFolderGroup({
    key: `collection-${collection.id}`,
    id: collection.id,
    title: collection.label || `Collection #${collection.id}`,
    description: collection.description || 'No description yet.',
    userId: collection.userId ?? null,
    isPublic: Boolean(collection.isPublic),
    isMature: Boolean(collection.isMature),
    isVirtual: false,
    art,
    images,
  })
}

function makeFolderGroup(input: {
  key: string
  id: number
  title: string
  description: string
  userId: number | null
  isPublic: boolean
  isMature: boolean
  isVirtual: boolean
  art: Art[]
  images: ArtImage[]
}): FolderGroup {
  const artCards: FolderCard[] = input.art.map((art) => ({
    key: `${input.key}-art-${art.id}`,
    type: 'art',
    art,
  }))

  const imageCards: FolderCard[] = input.images.map((image) => ({
    key: `${input.key}-image-${image.id}`,
    type: 'image',
    image,
  }))

  return {
    ...input,
    cards: [...imageCards, ...artCards],
  }
}

function filterGroup(group: FolderGroup, query: string): FolderGroup {
  const matureSafeArt = group.art.filter(
    (item) => showMature.value || !item.isMature,
  )

  const matureSafeImages = group.images.filter(
    (item) => showMature.value || !item.isMature,
  )

  if (!query) {
    return makeFolderGroup({
      ...group,
      art: matureSafeArt,
      images: matureSafeImages,
    })
  }

  const groupMatches = searchableGroupText(group).includes(query)

  if (groupMatches) {
    return makeFolderGroup({
      ...group,
      art: matureSafeArt,
      images: matureSafeImages,
    })
  }

  return makeFolderGroup({
    ...group,
    art: matureSafeArt.filter((item) =>
      searchableArtText(item).includes(query),
    ),
    images: matureSafeImages.filter((item) =>
      searchableImageText(item).includes(query),
    ),
  })
}

function getCollectionArt(collection: CollectionWithMedia): Art[] {
  return (collection.art || []).filter((art): art is Art => Boolean(art?.id))
}

function getCollectionImages(collection: CollectionWithMedia): ArtImage[] {
  return [
    ...(collection.artImages || []),
    ...(collection.ArtImages || []),
  ].filter((image): image is ArtImage => Boolean(image?.id))
}

function getVisibleCards(group: FolderGroup): FolderCard[] {
  if (isExpanded(group.key)) return group.cards
  return group.cards.slice(0, perFolderLimit.value)
}

function getVisibleArtCards(group: FolderGroup) {
  return getVisibleCards(group).filter(
    (card): card is Extract<FolderCard, { type: 'art' }> => card.type === 'art',
  )
}

function getVisibleImageCards(group: FolderGroup) {
  return getVisibleCards(group).filter(
    (card): card is Extract<FolderCard, { type: 'image' }> =>
      card.type === 'image',
  )
}

async function hydrateVisibleFolderImages() {
  const imagesNeedingData = pagedGroups.value
    .flatMap((group) => getVisibleImageCards(group).map((card) => card.image))
    .filter((image) => shouldHydrateImage(image))

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
      'Some visible images could not be hydrated.',
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

function isExpanded(key: string): boolean {
  return expandedGroupKeys.value.includes(key)
}

function toggleExpanded(key: string) {
  expandedGroupKeys.value = isExpanded(key)
    ? expandedGroupKeys.value.filter((item) => item !== key)
    : [...expandedGroupKeys.value, key]
}

function canModifyArt(art: Art): boolean {
  return userStore.isAdmin || Number(art.userId) === Number(currentUserId.value)
}

function canModifyImage(image: ArtImage): boolean {
  return (
    userStore.isAdmin || Number(image.userId) === Number(currentUserId.value)
  )
}

function selectArt(art: Art) {
  try {
    const safeArt = stripArtRelations(art)
    artStore.selectArtRecord(safeArt, null)
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to select art.')
    errorMessage.value = message
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  }
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

function startEditingArt(artId: number) {
  try {
    void artStore.selectArt(artId)
    successMessage.value = `Loaded art #${artId} for editing.`
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to load art for editing.')
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

function handleArtDeleted(artId: number) {
  if (artStore.currentArt?.id === artId) {
    artStore.deselectArt?.()
  }

  successMessage.value = `Art #${artId} removed from the current view.`
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

function clearSelected() {
  artStore.deselectArt?.()
  artStore.deselectArtImage()
  successMessage.value = ''
}

function stripArtRelations(art: Art): Art {
  const clone = { ...art } as Art & Record<string, unknown>

  delete clone.ArtImage
  delete clone.artImage
  delete clone.ArtImages
  delete clone.artImages
  delete clone.ArtCollections
  delete clone.artCollections
  delete clone.User
  delete clone.user
  delete clone.Gallery
  delete clone.gallery

  return clone as Art
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

function getArtDescription(art: Art): string {
  return (
    [art.promptString, art.designer, art.checkpoint, art.sampler]
      .filter(Boolean)
      .join(' • ') || 'No generation metadata.'
  )
}

function getArtImageId(art: Art): number | null {
  const possible = art as ArtWithImage
  return (
    possible.artImageId ??
    possible.artImage?.id ??
    possible.ArtImage?.id ??
    null
  )
}

function getArtPreviewUrl(art: Art): string {
  const possible = art as ArtWithImage

  return normalizeImageUrl(
    possible.imageUrl ||
      possible.imagePath ||
      getArtImageRecordUrl(possible.artImage || possible.ArtImage || null),
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
  }

  return (
    possible.imageUrl ||
    possible.imagePath ||
    possible.path ||
    possible.url ||
    possible.filePath ||
    (possible.imageData?.startsWith('data:image/') ? possible.imageData : '')
  )
}

function normalizeImageUrl(value?: string | null): string {
  if (!value) return ''

  const trimmed = value.trim()

  if (!trimmed || trimmed === 'UNDEFINED' || trimmed === 'undefined') return ''

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/')
  ) {
    return trimmed
  }

  const cleanPath = trimmed
    .replace(/^file:\/\//, '')
    .replace(/^\/mnt\/data\/+/, '')
    .replace(/^\/public\/+/, '')
    .replace(/^public\/+/, '')
    .replace(/^\/app\/public\/+/, '')
    .replace(/^app\/public\/+/, '')

  if (cleanPath.startsWith('/images/')) return withAppUrl(cleanPath)
  if (cleanPath.startsWith('images/')) return withAppUrl(`/${cleanPath}`)
  if (cleanPath.startsWith('/')) return withAppUrl(`/images${cleanPath}`)

  return withAppUrl(`/images/${cleanPath}`)
}

function withAppUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!appUrl.value) return normalizedPath

  return `${appUrl.value}${normalizedPath}`
}

function searchableGroupText(group: FolderGroup): string {
  return [
    group.id,
    group.title,
    group.description,
    group.userId,
    group.isPublic ? 'public' : 'private',
    group.isMature ? 'mature' : '',
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(' ')
    .toLowerCase()
}

function searchableArtText(art: Art): string {
  const possible = art as ArtWithImage

  return [
    art.id,
    art.promptString,
    art.path,
    art.designer,
    art.checkpoint,
    art.sampler,
    art.userId,
    possible.artImageId,
    art.isPublic ? 'public' : 'private',
    art.isMature ? 'mature' : '',
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
