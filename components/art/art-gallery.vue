<!-- /components/content/art/art-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-2 rounded-2xl bg-base-300 p-2"
  >
    <div
      v-if="showGalleryChooser"
      class="grid min-h-0 flex-1 grid-cols-2 gap-3 p-2"
      aria-label="Choose a gallery"
    >
      <button
        type="button"
        class="group relative min-h-72 overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg"
        @click="chooseGallery('public')"
      >
        <img
          v-if="chooserPreviewSource(0)"
          :src="chooserPreviewSource(0)"
          alt="Safe public gallery preview"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          v-else
          class="absolute inset-0 flex items-center justify-center bg-base-200"
        >
          <span v-if="chooserLoading" class="kr-spinner-lg-primary" />
          <Icon v-else name="kind-icon:gallery" class="kr-icon-primary-12" />
        </div>
        <div
          class="absolute inset-0 bg-gradient-to-t from-base-300/95 via-base-300/20 to-transparent"
        />
        <div class="absolute inset-x-0 bottom-0 p-5">
          <p class="kr-text-black-lg text-base-content">Gallery</p>
          <p class="mt-1 text-sm text-base-content/70">
            Public, non-mature art by default.
          </p>
        </div>
      </button>

      <button
        type="button"
        class="group relative min-h-72 overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-secondary/50 hover:shadow-lg"
        @click="chooseGallery('private')"
      >
        <img
          v-if="chooserPreviewSource(1)"
          :src="chooserPreviewSource(1)"
          alt="Safe private gallery preview"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div
          v-else
          class="absolute inset-0 flex items-center justify-center bg-base-200"
        >
          <span v-if="chooserLoading" class="kr-spinner-lg-primary" />
          <Icon v-else name="kind-icon:archive" class="kr-icon-primary-12" />
        </div>
        <div
          class="absolute inset-0 bg-gradient-to-t from-base-300/95 via-base-300/20 to-transparent"
        />
        <div class="absolute inset-x-0 bottom-0 p-5">
          <p class="kr-text-black-lg text-base-content">Private Gallery</p>
          <p class="mt-1 text-sm text-base-content/70">
            Your private archive, loaded only after you choose it.
          </p>
        </div>
      </button>
    </div>

    <header
      v-if="showHeader && !showGalleryChooser"
      class="shrink-0 kr-panel-muted-compact-row"
    >
      <div class="flex items-center gap-2">
        <Icon name="kind-icon:gallery" class="kr-icon-primary-5 shrink-0" />
        <h2 class="kr-text-black-base min-w-0 truncate text-base-content">
          {{
            activeGroup
              ? activeGroup.title
              : galleryScope === 'private'
                ? 'Private Gallery'
                : 'Gallery'
          }}
        </h2>
        <p class="kr-text-dim-xs hidden min-w-0 truncate sm:block">
          {{ headerSummary }}
        </p>

        <div class="flex-1" />

        <div class="flex shrink-0 items-center gap-1">
          <div class="flex overflow-hidden rounded-lg border border-base-300">
            <button
              v-for="s in SIZE_OPTIONS"
              :key="s.value"
              class="flex h-7 w-7 items-center justify-center text-[0.6rem] font-black transition"
              :class="
                viewSize === s.value
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100 text-base-content/50 hover:bg-base-200'
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
            class="kr-btn-ghost-xs-lg"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="kr-icon-3-5" />
            Back
          </button>

          <button
            v-if="activeGroup"
            class="kr-btn-xs-lg"
            :class="bulkSelectEnabled ? 'btn-primary' : 'btn-ghost'"
            type="button"
            @click="toggleBulkSelect"
          >
            <Icon name="kind-icon:checklist" class="kr-icon-3-5" />
            {{ bulkSelectEnabled ? 'Selecting' : 'Select' }}
          </button>

          <button
            v-if="canChoosePrivateGallery && !activeGroup"
            class="kr-btn-ghost-xs-lg"
            type="button"
            @click="returnToGalleryChooser"
          >
            <Icon name="kind-icon:gallery" class="kr-icon-3-5" />
            Switch gallery
          </button>

          <add-collection
            v-if="!activeGroup"
            :compact="true"
            :show-flags="false"
            @created="handleCollectionCreated"
          />

          <button
            class="kr-btn-primary-xs-lg"
            type="button"
            :disabled="isLoading"
            @click="refreshGallery"
          >
            <span v-if="isLoading" class="kr-spinner-xs" />
            <Icon v-else name="kind-icon:refresh" class="kr-icon-3-5" />
          </button>

          <button
            v-if="selectedImageForOverlay"
            class="kr-btn-ghost-xs-lg"
            type="button"
            @click="clearSelectedImage"
          >
            <Icon name="kind-icon:x" class="kr-icon-3-5" />
          </button>
        </div>
      </div>

      <div class="mt-2 flex items-center gap-2">
        <label
          class="input input-bordered input-xs flex-1 flex items-center gap-1.5 bg-base-100 pr-2"
        >
          <icon
            name="kind-icon:search"
            class="h-3.5 w-3.5 shrink-0 text-base-content/40"
          />
          <input
            v-model="searchQuery"
            type="search"
            class="min-w-0 flex-1 bg-transparent"
            :placeholder="
              activeGroup ? 'Search images…' : 'Search collections…'
            "
          />
        </label>

        <div
          class="flex items-center gap-1 rounded-lg border border-base-300 bg-base-100 p-1"
          aria-label="Gallery maturity filter"
        >
          <span class="kr-text-dim-xs-70 px-1 font-bold">Show</span>
          <button
            v-for="option in MATURITY_FILTER_OPTIONS"
            :key="option.value"
            type="button"
            class="btn btn-xs rounded-md"
            :class="
              maturityFilter === option.value
                ? 'btn-primary'
                : 'btn-ghost text-base-content/60'
            "
            :aria-pressed="maturityFilter === option.value"
            @click="maturityFilter = option.value"
          >
            {{ option.label }}
          </button>
        </div>

        <span
          class="kr-text-dim-xs ml-auto hidden flex-wrap items-center gap-1.5 sm:flex"
        >
          <span class="kr-badge-ghost-sm">
            {{ visibleGroups.length }} collections
          </span>
          <span class="kr-badge-ghost-sm"> {{ totalImageCount }} images </span>
          <span v-if="activeGroup" class="kr-badge-primary-sm">
            {{ filteredActiveImages.length }} in view
          </span>
        </span>
      </div>
    </header>

    <div
      v-if="!showGalleryChooser && errorMessage"
      class="shrink-0 flex items-center gap-2 kr-note kr-note-error rounded-xl px-3 py-2 text-xs"
    >
      <icon name="kind-icon:alert" class="kr-icon-3-5 shrink-0" />
      {{ errorMessage }}
    </div>

    <div
      v-if="!showGalleryChooser && successMessage"
      class="shrink-0 flex items-center gap-2 kr-note kr-note-success rounded-xl px-3 py-2 text-xs"
    >
      <icon name="kind-icon:check" class="kr-icon-3-5 shrink-0" />
      {{ successMessage }}
    </div>

    <div
      v-if="!showGalleryChooser && isLoading"
      class="flex min-h-56 flex-1 items-center justify-center rounded-xl bg-base-200"
    >
      <span class="kr-spinner-lg-primary" />
    </div>

    <section
      v-else-if="!showGalleryChooser"
      class="relative min-h-0 flex-1 overflow-auto rounded-xl bg-base-200 p-2"
    >
      <div
        v-if="!activeGroup && visibleGroups.length === 0"
        class="flex min-h-56 flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:folder" class="kr-icon-primary-12" />
        <p class="kr-text-black-lg mt-2 text-base-content">Nothing to show.</p>
        <p class="text-sm">No collections match the current filters.</p>
      </div>

      <kr-gallery
        v-else-if="!activeGroup"
        :items="collectionGalleryItems"
        :modes="[]"
        :density="viewSize"
        empty-label="collections"
      >
        <template #item="{ item }">
          <template
            v-for="group in [groupByKey.get(String(item.id))]"
            :key="group?.key ?? item.id"
          >
            <collection-card
              v-if="group"
              :collection="group.collection"
              :selected="activeGroupKey === group.key"
              :earned-karma="earnedKarmaByCollectionId[group.id]"
              :compact="viewSize === 'xs' || viewSize === 'sm'"
              :show-stats="false"
              :show-select-button="false"
              :show-reaction="group.id > 0"
              :allow-edit="group.id > 0"
              :allow-delete="group.id > 0"
              :show-mature="showMature"
              :size="viewSize"
              :preview-art-image="getPreviewImage(group)"
              @vue:mounted="hydrateCollectionTile(group)"
              @open="selectGroup(group.key)"
              @delete="handleCollectionDeleted"
            />
          </template>
        </template>
      </kr-gallery>

      <div v-else class="flex min-h-0 flex-col gap-2">
        <div class="flex items-center gap-2 kr-panel-compact-row">
          <Icon
            :name="
              activeGroup.isVirtual ? 'kind-icon:archive' : 'kind-icon:folder'
            "
            class="kr-icon-primary-4 shrink-0"
          />
          <h3 class="kr-text-black-sm min-w-0 truncate text-base-content">
            {{ activeGroup.title }}
          </h3>
          <span
            v-if="activeGroup.isVirtual"
            class="badge badge-accent badge-sm shrink-0"
          >
            Unsorted
          </span>
          <span class="kr-badge-primary-sm shrink-0">
            {{ filteredActiveImages.length }}
          </span>
          <button
            class="btn btn-ghost btn-xs ml-auto rounded-lg"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="kr-icon-3-5" />
            Collections
          </button>
        </div>

        <div
          v-if="bulkSelectEnabled"
          class="flex flex-col gap-2 rounded-xl border border-primary/30 bg-base-100 p-3 shadow-sm"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="kr-badge-primary-sm">
              {{ selectedImageCount }} selected
            </span>

            <button
              class="kr-btn-xs"
              type="button"
              :disabled="isBatchWorking"
              @click="selectAllFilteredImages"
            >
              <Icon name="kind-icon:gallery" class="kr-icon-3-5" />
              Select all filtered
            </button>

            <button
              class="kr-btn-ghost-xs"
              type="button"
              :disabled="isBatchWorking || !selectedImageCount"
              @click="clearImageSelection"
            >
              <Icon name="kind-icon:x" class="kr-icon-3-5" />
              Clear
            </button>

            <button
              class="kr-btn-xs btn-ghost ml-auto"
              type="button"
              :disabled="isBatchWorking"
              @click="toggleBulkSelect"
            >
              Done
            </button>
          </div>

          <div
            class="grid gap-2 lg:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]"
          >
            <select
              v-model.number="batchCollectionId"
              class="select select-bordered select-xs bg-base-200"
              :disabled="isBatchWorking"
            >
              <option :value="null">Choose collection...</option>
              <option
                v-for="group in mutableCollectionGroups"
                :key="group.key"
                :value="group.id"
              >
                {{ group.title }}
              </option>
            </select>

            <button
              class="kr-btn-xs btn-secondary"
              type="button"
              :disabled="
                isBatchWorking ||
                !selectedImageCount ||
                !selectedBatchCollectionId
              "
              @click="addSelectedToCollection"
            >
              <Icon name="kind-icon:plus" class="kr-icon-3-5" />
              Add
            </button>

            <button
              class="kr-btn-xs btn-warning"
              type="button"
              :disabled="
                isBatchWorking ||
                !selectedImageCount ||
                !selectedBatchCollectionId
              "
              @click="removeSelectedFromCollection"
            >
              <Icon name="kind-icon:minus" class="kr-icon-3-5" />
              Remove
            </button>

            <button
              v-if="activeGroup && activeGroup.id > 0"
              class="kr-btn-xs btn-warning"
              type="button"
              :disabled="isBatchWorking || !selectedImageCount"
              @click="removeSelectedFromActiveCollection"
            >
              <Icon name="kind-icon:folder" class="kr-icon-3-5" />
              Remove from here
            </button>
          </div>

          <div class="grid gap-2 md:grid-cols-[1fr_1fr_auto_auto]">
            <select
              v-model="batchIsPublic"
              class="select select-bordered select-xs bg-base-200"
              :disabled="isBatchWorking"
            >
              <option value="keep">Visibility: keep</option>
              <option value="true">Set public</option>
              <option value="false">Set private</option>
            </select>

            <select
              v-model="batchIsMature"
              class="select select-bordered select-xs bg-base-200"
              :disabled="isBatchWorking"
            >
              <option value="keep">Maturity: keep</option>
              <option value="true">Set mature</option>
              <option value="false">Set safe</option>
            </select>

            <button
              class="kr-btn-xs btn-info"
              type="button"
              :disabled="isBatchWorking || !canBatchModifyImages"
              @click="applySelectedImageFlags"
            >
              <Icon name="kind-icon:edit" class="kr-icon-3-5" />
              Apply edits
            </button>

            <button
              class="kr-btn-xs btn-error"
              type="button"
              :disabled="isBatchWorking || !canBatchModifyImages"
              @click="deleteSelectedImages"
            >
              <span v-if="isBatchWorking" class="kr-spinner-xs" />
              <Icon v-else name="kind-icon:trash" class="kr-icon-3-5" />
              Delete
            </button>
          </div>
        </div>

        <kr-gallery
          :items="galleryItems"
          :modes="[]"
          :density="viewSize"
          empty-label="art images"
        >
          <template #item="{ item }">
            <template
              v-for="image in [imageById.get(Number(item.id))]"
              :key="image?.id ?? item.id"
            >
              <div v-if="image" class="relative">
                <button
                  v-if="bulkSelectEnabled"
                  class="kr-icon-8 absolute left-2 top-2 z-10 flex items-center justify-center rounded-xl border shadow-lg transition"
                  :class="
                    isImageSelected(image.id)
                      ? 'border-primary bg-primary text-primary-content'
                      : 'border-base-300 bg-base-100/90 text-base-content hover:bg-base-200'
                  "
                  type="button"
                  :title="
                    isImageSelected(image.id)
                      ? 'Deselect image'
                      : 'Select image'
                  "
                  @click.stop="toggleImageSelection(image)"
                >
                  <Icon
                    :name="
                      isImageSelected(image.id)
                        ? 'kind-icon:check'
                        : 'kind-icon:plus'
                    "
                    class="kr-icon-4"
                  />
                </button>

                <kr-mature-cover
                  :is-mature="image.isMature"
                  :owner-id="image.userId"
                  :label="
                    image.promptString || image.fileName || `image #${image.id}`
                  "
                >
                  <image-card
                    :art-image="hydratedImages[image.id] || image"
                    :selected="
                      isImageSelected(image.id) ||
                      selectedImageForOverlay?.id === image.id
                    "
                    :compact="viewSize === 'xs' || viewSize === 'sm'"
                    :show-actions="
                      !bulkSelectEnabled &&
                      selectedImageForOverlay?.id === image.id
                    "
                    :show-prompt="viewSize !== 'xs'"
                    :show-meta="viewSize === 'md' || viewSize === 'lg'"
                    :show-generation-meta="false"
                    :show-image-status="false"
                    :show-select-button="false"
                    :allow-delete="canModifyImage(image) && !bulkSelectEnabled"
                    :allow-edit="false"
                    :auto-load-image="true"
                    :defer-load-until-visible="true"
                    :size="viewSize"
                    :earned-karma="earnedKarmaByImageId[image.id]"
                    @loaded="handleImageLoaded"
                    @open="handleImageCardClick"
                    @delete="handleImageDeleted"
                  />
                </kr-mature-cover>
              </div>
            </template>
          </template>

          <template #empty>
            <div
              class="flex min-h-56 w-full flex-col items-center justify-center rounded-xl border border-base-300 bg-base-100 p-6 text-center text-base-content/60"
            >
              <Icon name="kind-icon:image" class="kr-icon-primary-12" />
              <p class="kr-text-black-lg mt-2 text-base-content">
                No images here.
              </p>
              <p class="text-sm">No art images match the current filters.</p>
            </div>
          </template>
        </kr-gallery>
      </div>

      <div
        v-if="selectedImageForOverlay"
        class="fixed inset-0 z-50 flex items-center justify-center bg-base-300/80 p-3 backdrop-blur-sm"
      >
        <div
          class="flex max-h-full w-full max-w-6xl flex-col overflow-hidden kr-panel-flat shadow-2xl"
        >
          <header
            class="flex shrink-0 items-center justify-between gap-3 border-b border-base-300 bg-base-200 px-4 py-2"
          >
            <div class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary"
              >
                <icon name="kind-icon:image" class="kr-icon-4" />
              </span>
              <div class="min-w-0">
                <p
                  class="kr-text-eyebrow text-[0.6rem] tracking-widest text-base-content/40"
                >
                  Selected Image
                </p>
                <h3 class="kr-text-black-sm truncate text-base-content">
                  #{{ selectedImageForOverlay.id }}
                </h3>
              </div>
            </div>
            <button
              class="kr-btn-ghost"
              type="button"
              @click="clearSelectedImage"
            >
              <Icon name="kind-icon:x" class="kr-icon-4" />
              Close
            </button>
          </header>
          <div class="min-h-0 flex-1 overflow-auto p-3">
            <art-interact />
          </div>
        </div>
      </div>
    </section>

    <footer
      v-if="!showGalleryChooser"
      class="kr-text-dim-xs shrink-0 flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/80 px-3 py-2"
    >
      <span>
        <span class="kr-text-bold-content">
          {{ collectionStore.collections.length }}
        </span>
        collections
      </span>
      <span>
        <span class="kr-text-bold-content">{{ totalImageCount }}</span>
        images
      </span>
      <span v-if="activeGroup">
        <span class="kr-text-bold-content">
          {{ filteredActiveImages.length }}
        </span>
        shown
      </span>
      <span v-if="activeGroup" class="ml-auto truncate font-bold text-primary">
        {{ activeGroup.title }}
      </span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import {
  GALLERY_DENSITIES,
  IS_GALLERY_DENSITY,
  type GalleryDensity,
} from '@/utils/galleryVocabulary'
import { useArtStore } from '@/stores/artStore'
import {
  useArtCollectionBrowseStore,
  type BrowseArtCollection,
  type GalleryPrivacyFilter,
} from '@/stores/artCollectionBrowseStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'
import { performFetch } from '@/stores/utils'
import { resolveArtImageThumbSrc } from '@/utils/artImageSrc'

type BatchFlagValue = 'keep' | 'true' | 'false'
type GalleryMaturityFilter = 'all' | 'mature' | 'safe'
type ViewSize = GalleryDensity

type GalleryCollection = BrowseArtCollection & {
  art?: ArtImage[]
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
  imageCount: number
  previewArtImage: ArtImage | null
  images: ArtImage[]
  collection: GalleryCollection
}

const props = withDefaults(
  defineProps<{
    dropdownMode?: boolean
    showHeader?: boolean
  }>(),
  {
    dropdownMode: false,
    showHeader: true,
  },
)

const SIZE_OPTIONS = GALLERY_DENSITIES
const MATURITY_FILTER_OPTIONS: readonly {
  value: GalleryMaturityFilter
  label: string
}[] = [
  { value: 'all', label: 'Both' },
  { value: 'mature', label: 'Mature' },
  { value: 'safe', label: 'Not mature' },
]
const artStore = useArtStore()
const browseStore = useArtCollectionBrowseStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

const bulkSelectEnabled = ref(false)
const selectedImageIds = ref<number[]>([])
const batchCollectionId = ref<number | null>(null)
const batchIsPublic = ref<BatchFlagValue>('keep')
const batchIsMature = ref<BatchFlagValue>('keep')
const isBatchWorking = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const searchQuery = ref('')
const showMature = computed(() => Boolean(userStore.showMature))
const maturityFilter = ref<GalleryMaturityFilter>('safe')
const galleryScope = ref<GalleryPrivacyFilter | null>(null)
const chooserPreviews = ref<ArtImage[]>([])
const chooserLoading = ref(false)
const hydratedImages = ref<Record<number, ArtImage>>({})
const activeGroupKey = ref<string | null>(null)
const selectedImageForOverlay = ref<ArtImage | null>(null)
const viewSize = ref<ViewSize>('md')
const galleryReady = ref(false)

const selectedImageIdSet = computed(() => new Set(selectedImageIds.value))

const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)
const canChoosePrivateGallery = computed(
  () => !props.dropdownMode && Number(currentUserId.value) === 1,
)
const showGalleryChooser = computed(
  () => canChoosePrivateGallery.value && galleryScope.value === null,
)

const selectedImages = computed(() => {
  const ids = selectedImageIdSet.value
  return filteredActiveImages.value
    .map((image) => hydratedImages.value[image.id] || image)
    .filter((image) => ids.has(image.id))
})

const selectedImageCount = computed(() => selectedImageIds.value.length)

const selectedBatchCollectionId = computed(() => {
  const id = Number(batchCollectionId.value)
  return Number.isFinite(id) && id > 0 ? id : null
})

const collectionGroups = computed<GalleryGroup[]>(() => {
  const groups = collectionStore.collections
    .map(normalizeCollectionGroup)
    .sort((a, b) => a.title.localeCompare(b.title))

  if (props.dropdownMode) return groups

  const summary = browseStore.unsortedSummary
  if (
    browseStore.unsortedSummaryLoaded &&
    !summary.count &&
    !browseStore.unsortedImages.length
  ) {
    return groups
  }

  const fullImages = browseStore.unsortedImages
    .map((image) => hydratedImages.value[image.id] || image)
    .sort((a, b) => b.id - a.id)
  const preview = summary.previewArtImage
    ? hydratedImages.value[summary.previewArtImage.id] ||
      summary.previewArtImage
    : null
  const images = fullImages.length ? fullImages : preview ? [preview] : []
  const collection = makePseudoCollection({
    id: -1,
    title: 'Unsorted',
    description: 'Images not currently assigned to a collection.',
    images,
    imageCount: summary.count,
    previewArtImage: preview,
  })

  return [
    ...groups,
    {
      key: 'collection-unsorted',
      id: -1,
      title: 'Unsorted',
      description: 'Images not currently assigned to a collection.',
      userId: currentUserId.value ?? null,
      isPublic: false,
      isMature: false,
      isVirtual: true,
      imageCount: summary.count,
      previewArtImage: preview,
      images,
      collection,
    },
  ]
})

function matchesMaturityFilter(record: { isMature?: boolean | null }): boolean {
  if (maturityFilter.value === 'all') return true
  if (maturityFilter.value === 'mature') return record.isMature === true
  return record.isMature !== true
}

function matchesPrivacyScope(record: {
  isPublic?: boolean | null
  userId?: number | null
}): boolean {
  if (galleryScope.value === 'all') return true
  if (galleryScope.value === 'public') return record.isPublic === true
  if (galleryScope.value !== 'private') return false

  const viewerId = Number(currentUserId.value)
  return (
    record.isPublic === false &&
    Number.isInteger(viewerId) &&
    viewerId > 0 &&
    Number(record.userId) === viewerId
  )
}

const visibleGroups = computed<GalleryGroup[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return collectionGroups.value.filter((group) => {
    // Unsorted is a mixed virtual bucket; keep the bucket itself and filter its
    // rows below. Real collections must match the selected public/private
    // gallery scope. The private scope is owner-only even for admins.
    if (!group.isVirtual && !matchesPrivacyScope(group)) return false
    if (!group.isVirtual && !matchesMaturityFilter(group)) return false
    if (query && !searchableGroupText(group).includes(query)) return false
    return true
  })
})

const activeGroup = computed(() => {
  if (!activeGroupKey.value) return null
  return (
    collectionGroups.value.find(
      (group) => group.key === activeGroupKey.value,
    ) || null
  )
})

const headerSummary = computed(() => {
  if (activeGroup.value) {
    return `${filteredActiveImages.value.length} images — click to open`
  }
  return `${visibleGroups.value.length} collections · ${totalImageCount.value} images`
})

const groupByKey = computed(
  () => new Map(visibleGroups.value.map((group) => [group.key, group])),
)

const collectionGalleryItems = computed<GalleryItem[]>(() =>
  visibleGroups.value.map((group) => ({
    id: group.key,
    title: group.title,
    description: group.description,
  })),
)

const filteredActiveImages = computed(() => {
  if (!activeGroup.value) return []
  const query = searchQuery.value.trim().toLowerCase()
  return activeGroup.value.images.filter((image) => {
    if (!matchesPrivacyScope(image)) return false
    if (!matchesMaturityFilter(image)) return false
    return !query || searchableImageText(image).includes(query)
  })
})

const galleryItems = computed<GalleryItem[]>(() =>
  filteredActiveImages.value.map((image) => ({
    id: image.id,
    title: image.promptString || image.artPrompt || `Image ${image.id}`,
    description: image.artPrompt || undefined,
    source: image,
  })),
)

const imageById = computed(
  () => new Map(filteredActiveImages.value.map((image) => [image.id, image])),
)

const totalImageCount = computed(
  () => Number(browseStore.unsortedSummary.totalCount) || 0,
)

const mutableCollectionGroups = computed(() =>
  collectionGroups.value.filter((group) => {
    if (group.id <= 0) return false
    if (userStore.isAdmin) return true
    return Number(group.userId) === Number(currentUserId.value)
  }),
)

const canBatchModifyImages = computed(() => {
  if (!selectedImages.value.length) return false
  return selectedImages.value.every((image) => canModifyImage(image))
})

const { earnedKarma: earnedKarmaByImageId, refresh: refreshEarnedKarma } =
  userStore.trackEarnedKarma('artImage', () =>
    filteredActiveImages.value.map((image) => image.id),
  )

const { earnedKarma: earnedKarmaByCollectionId } = userStore.trackEarnedKarma(
  'artCollection',
  () =>
    visibleGroups.value
      .filter((group) => !group.isVirtual && group.id > 0)
      .map((group) => group.id),
)

watch(activeGroupKey, () => {
  selectedImageForOverlay.value = null
  selectedImageIds.value = []
  bulkSelectEnabled.value = false
  batchCollectionId.value = null
})

watch(viewSize, (value) => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('galleryViewSize', value)
  }
})

watch(maturityFilter, async () => {
  if (!galleryReady.value) return
  await reloadGalleryForVisibility()
})

onMounted(async () => {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem('galleryViewSize')
    if (stored && IS_GALLERY_DENSITY(stored)) viewSize.value = stored
  }

  if (props.dropdownMode) {
    galleryScope.value = 'all'
    maturityFilter.value = 'all'
    await initializeGallery(true)
    galleryReady.value = true
    return
  }

  if (canChoosePrivateGallery.value) {
    void loadChooserPreviews()
    galleryReady.value = true
    return
  }

  galleryScope.value = 'public'
  maturityFilter.value = 'safe'
  await initializeGallery(true)
  galleryReady.value = true
})

function toggleBulkSelect() {
  bulkSelectEnabled.value = !bulkSelectEnabled.value
  if (!bulkSelectEnabled.value) {
    selectedImageIds.value = []
    batchCollectionId.value = null
    batchIsPublic.value = 'keep'
    batchIsMature.value = 'keep'
  }
}

function isImageSelected(imageId: number): boolean {
  return selectedImageIdSet.value.has(imageId)
}

function toggleImageSelection(image: ArtImage) {
  const id = Number(image.id)
  if (!Number.isFinite(id) || id <= 0) return

  if (selectedImageIdSet.value.has(id)) {
    selectedImageIds.value = selectedImageIds.value.filter(
      (entry) => entry !== id,
    )
    return
  }

  selectedImageIds.value = [...selectedImageIds.value, id]
}

function selectAllFilteredImages() {
  const ids = filteredActiveImages.value
    .filter((image) => canModifyImage(image))
    .map((image) => image.id)
  selectedImageIds.value = [...new Set(ids)]
}

function clearImageSelection() {
  selectedImageIds.value = []
}

function handleImageLoaded(image: ArtImage) {
  hydratedImages.value = {
    ...hydratedImages.value,
    [image.id]: image,
  }
}

async function handleImageCardClick(id: number) {
  const image =
    hydratedImages.value[id] ||
    filteredActiveImages.value.find((entry) => entry.id === id)
  if (!image) return

  if (bulkSelectEnabled.value) {
    toggleImageSelection(image)
    return
  }

  await selectImage(image)
}

async function loadChooserPreviews(): Promise<void> {
  if (chooserPreviews.value.length || chooserLoading.value) return
  chooserLoading.value = true

  try {
    const response = await performFetch<ArtImage[]>('/api/art/gallery/chooser')
    if (response.success && Array.isArray(response.data)) {
      chooserPreviews.value = response.data
    }
  } finally {
    chooserLoading.value = false
  }
}

function chooserPreviewSource(index: number): string {
  const image = chooserPreviews.value[index] ?? chooserPreviews.value[0]
  return image ? resolveArtImageThumbSrc(image) : ''
}

async function chooseGallery(scope: 'public' | 'private'): Promise<void> {
  galleryReady.value = false
  galleryScope.value = scope
  maturityFilter.value = scope === 'private' ? 'all' : 'safe'
  activeGroupKey.value = null
  searchQuery.value = ''
  selectedImageForOverlay.value = null
  selectedImageIds.value = []
  browseStore.invalidateAll()

  try {
    await initializeGallery(true)
  } finally {
    galleryReady.value = true
  }
}

function returnToGalleryChooser(): void {
  if (!canChoosePrivateGallery.value) return
  activeGroupKey.value = null
  selectedImageForOverlay.value = null
  selectedImageIds.value = []
  errorMessage.value = ''
  successMessage.value = ''
  galleryScope.value = null
  browseStore.invalidateAll()
  void loadChooserPreviews()
}

async function reloadGalleryForVisibility() {
  isLoading.value = true
  errorMessage.value = ''
  hydratedImages.value = {}

  try {
    const activeKey = activeGroupKey.value
    browseStore.invalidateAll()
    await fetchCollectionSummaries(true)

    const group = activeGroup.value
    if (
      group &&
      !group.isVirtual &&
      (!matchesPrivacyScope(group) || !matchesMaturityFilter(group))
    ) {
      clearActiveGroup()
    } else if (activeKey) {
      await loadGroupData(activeKey, true)
    }
    void refreshEarnedKarma()
  } catch (error) {
    const message = getErrorMessage(
      error,
      'Gallery visibility failed to refresh.',
    )
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

async function refreshGallery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  hydratedImages.value = {}

  try {
    const activeKey = activeGroupKey.value
    browseStore.invalidateAll()
    await fetchCollectionSummaries(true)
    if (activeKey) await loadGroupData(activeKey, true)
    void refreshEarnedKarma()
    successMessage.value = 'Gallery refreshed.'
  } catch (error) {
    const message = getErrorMessage(error, 'Gallery failed to refresh.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

async function initializeGallery(force = false) {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  hydratedImages.value = {}

  try {
    await fetchCollectionSummaries(force)
  } catch (error) {
    const message = getErrorMessage(error, 'Gallery failed to initialize.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

/*
 * kr-gallery only renders this slot once its kr-viewport-gate says the tile is
 * within 1800px, so mounting IS the "came into view" signal -- there is no
 * separate observer to wire. Tile hydration fetches only a one-image/count
 * summary; the full collection is fetched only after the user opens it.
 */
function hydrateCollectionTile(group: GalleryGroup | undefined): void {
  if (!group) return

  if (group.isVirtual && group.key === 'collection-unsorted') {
    void browseStore.fetchUnsortedSummary(
      false,
      maturityFilter.value,
      galleryScope.value ?? 'public',
    )
    return
  }

  if (group.id <= 0) return
  void browseStore.fetchCollectionSummary(
    group.id,
    false,
    maturityFilter.value,
    galleryScope.value ?? 'public',
  )
}

async function fetchCollectionSummaries(force = false) {
  if (typeof collectionStore.fetchCollections !== 'function') return
  await collectionStore.fetchCollections(force, {
    summary: true,
    includeImages: true,
    imageLimit: 1,
    // Filter at the QUERY, not after the response: filtering client-side still
    // makes the server count and preview every archive folder first, which is
    // the whole cost.
    privacy: galleryScope.value ?? 'public',
    includeMature: maturityFilter.value !== 'safe',
    maturity: maturityFilter.value,
    // Skeletons first: the list comes back as bare scalars so it paints
    // immediately, and each tile fetches its own count and preview when
    // kr-viewport-gate decides it is close enough to matter.
    counts: false,
  })
}

async function loadGroupData(key: string, force = false): Promise<void> {
  if (key === 'collection-unsorted') {
    await browseStore.fetchUnsortedImages(
      force,
      maturityFilter.value,
      galleryScope.value ?? 'public',
    )
    return
  }

  const group = collectionGroups.value.find((entry) => entry.key === key)
  if (!group || group.id <= 0) return
  const detail = await browseStore.fetchCollectionDetail(group.id, force)
  if (!detail) throw new Error(`Failed to load "${group.title}".`)
}

async function refreshBrowseData(): Promise<void> {
  const activeKey = activeGroupKey.value
  browseStore.invalidateAll()
  await fetchCollectionSummaries(true)
  if (activeKey) await loadGroupData(activeKey, true)
}

function normalizeCollectionGroup(collection: ArtCollection): GalleryGroup {
  const summary = collection as GalleryCollection
  const tileSummary = browseStore.collectionSummaries[collection.id] ?? summary
  const fullDetail = browseStore.collectionDetails[collection.id]
  const displaySource = fullDetail ?? tileSummary
  const displayImages = getCollectionImages(displaySource)
  const explicitCount = Number(
    tileSummary.artImageCount ??
      tileSummary._count?.ArtImages ??
      fullDetail?.artImageCount ??
      fullDetail?._count?.ArtImages,
  )
  const imageCount =
    Number.isInteger(explicitCount) && explicitCount >= 0
      ? explicitCount
      : displayImages.length
  const preview = tileSummary.previewArtImage
    ? hydratedImages.value[tileSummary.previewArtImage.id] ||
      tileSummary.previewArtImage
    : (displayImages[0] ?? null)
  const hasFullDetail = Boolean(fullDetail)
  const images = hasFullDetail
    ? displayImages
    : preview
      ? [preview]
      : displayImages
  const displayCollection = {
    ...displaySource,
    artImageCount: imageCount,
    previewArtImage: preview,
    art: images,
    artImages: images,
    ArtImages: images,
    images,
  } as GalleryCollection

  return {
    key: `collection-${collection.id}`,
    id: collection.id,
    title: collection.label || `Collection #${collection.id}`,
    description: collection.description || 'No description yet.',
    userId: collection.userId ?? null,
    isPublic: Boolean(collection.isPublic),
    isMature: Boolean(collection.isMature),
    isVirtual: false,
    imageCount,
    previewArtImage: preview,
    images,
    collection: displayCollection,
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
  imageCount: number
  previewArtImage: ArtImage | null
}): GalleryCollection {
  return {
    id: input.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: currentUserId.value ?? null,
    label: input.title,
    isMature: false,
    isPublic: false,
    isActive: true,
    artPrompt: null,
    description: input.description,
    username: null,
    art: input.images,
    artImageCount: input.imageCount,
    previewArtImage: input.previewArtImage,
    artImages: input.images,
    ArtImages: input.images,
    images: input.images,
  } as GalleryCollection
}

function getPreviewImage(group: GalleryGroup): ArtImage | null {
  const preview = group.previewArtImage
  if (
    preview &&
    matchesPrivacyScope(preview) &&
    matchesMaturityFilter(preview) &&
    (showMature.value || !preview.isMature)
  ) {
    return hydratedImages.value[preview.id] || preview
  }
  const image = group.images.find(
    (entry) =>
      matchesPrivacyScope(entry) &&
      matchesMaturityFilter(entry) &&
      (showMature.value || !entry.isMature),
  )
  return image ? hydratedImages.value[image.id] || image : null
}

async function selectGroup(key: string) {
  const group = collectionGroups.value.find((entry) => entry.key === key)
  if (!group) return

  if (props.dropdownMode) {
    collectionStore.setCurrentCollection(group.id > 0 ? group.id : null)
    collectionStore.setSelectedCollectionIds(group.id > 0 ? [group.id] : [])
    successMessage.value = `${group.title} selected.`
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  try {
    await loadGroupData(key)
    activeGroupKey.value = key
    searchQuery.value = ''
    if (group.id > 0) {
      collectionStore.setCurrentCollection(group.id)
      collectionStore.setSelectedCollectionIds([group.id])
    } else {
      collectionStore.setCurrentCollection(null)
      collectionStore.setSelectedCollectionIds([])
    }
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Failed to open collection.')
  } finally {
    isLoading.value = false
  }
}

function clearActiveGroup() {
  activeGroupKey.value = null
  selectedImageForOverlay.value = null
  searchQuery.value = ''
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
  if (typeof artStore.deselectArtImage === 'function') {
    artStore.deselectArtImage()
  }
}

async function runBatchAction(
  label: string,
  worker: (image: ArtImage) => Promise<void>,
) {
  if (!selectedImages.value.length) return

  errorMessage.value = ''
  successMessage.value = ''
  isBatchWorking.value = true

  try {
    await runLimited(selectedImages.value, 4, worker)
    successMessage.value = label
  } catch (error) {
    const message = getErrorMessage(error, 'Batch action failed.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isBatchWorking.value = false
  }
}

async function addSelectedToCollection() {
  const collectionId = selectedBatchCollectionId.value
  if (!collectionId) {
    errorMessage.value = 'Pick a collection first.'
    return
  }

  await runBatchAction(
    `Added ${selectedImageCount.value} image${selectedImageCount.value === 1 ? '' : 's'} to collection.`,
    async (image) => {
      const result = await artStore.updateArtImageConnections(image.id, {
        artCollectionIds: [collectionId],
      })
      if (!result.success) {
        throw new Error(result.message || `Failed to add image #${image.id}.`)
      }
    },
  )
  await refreshBrowseData()
}

async function removeSelectedFromCollection() {
  const collectionId = selectedBatchCollectionId.value
  if (!collectionId) {
    errorMessage.value = 'Pick a collection first.'
    return
  }

  await runBatchAction(
    `Removed ${selectedImageCount.value} image${selectedImageCount.value === 1 ? '' : 's'} from collection.`,
    async (image) => {
      const result = await artStore.updateArtImageConnections(image.id, {
        disconnectArtCollectionIds: [collectionId],
      })
      if (!result.success) {
        throw new Error(
          result.message || `Failed to remove image #${image.id}.`,
        )
      }
    },
  )
  await refreshBrowseData()
}

async function removeSelectedFromActiveCollection() {
  if (!activeGroup.value || activeGroup.value.id <= 0) return
  batchCollectionId.value = activeGroup.value.id
  await removeSelectedFromCollection()
}

async function applySelectedImageFlags() {
  const updates: Partial<ArtImage> = {}
  if (batchIsPublic.value !== 'keep') {
    updates.isPublic = batchIsPublic.value === 'true'
  }
  if (batchIsMature.value !== 'keep') {
    updates.isMature = batchIsMature.value === 'true'
  }
  if (!Object.keys(updates).length) {
    errorMessage.value = 'Choose at least one field to update.'
    return
  }

  await runBatchAction(
    `Updated ${selectedImageCount.value} image${selectedImageCount.value === 1 ? '' : 's'}.`,
    async (image) => {
      const result = await artStore.updateArtImage(image.id, updates)
      if (!result.success) {
        throw new Error(
          result.message || `Failed to update image #${image.id}.`,
        )
      }
    },
  )
  await refreshBrowseData()
}

async function deleteSelectedImages() {
  if (!canBatchModifyImages.value) return
  const ids = [...selectedImageIds.value]
  const confirmed = window.confirm(
    `Delete ${ids.length} selected image${ids.length === 1 ? '' : 's'}? This cannot be undone.`,
  )
  if (!confirmed) return

  errorMessage.value = ''
  successMessage.value = ''
  isBatchWorking.value = true
  try {
    await runLimited(ids, 3, async (imageId) => {
      const deleted = await artStore.deleteArtImage(imageId)
      if (!deleted) throw new Error(`Failed to delete image #${imageId}.`)
      const next = { ...hydratedImages.value }
      delete next[imageId]
      hydratedImages.value = next
    })

    if (
      selectedImageForOverlay.value &&
      ids.includes(selectedImageForOverlay.value.id)
    ) {
      selectedImageForOverlay.value = null
    }
    selectedImageIds.value = []
    successMessage.value = `Deleted ${ids.length} image${ids.length === 1 ? '' : 's'}.`
    await refreshBrowseData()
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to delete selected images.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isBatchWorking.value = false
  }
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

async function handleCollectionCreated() {
  successMessage.value = 'Collection created.'
  await refreshBrowseData()
}

async function handleCollectionDeleted(id: number) {
  successMessage.value = `Collection #${id} deleted.`
  if (activeGroup.value?.id === id) clearActiveGroup()
  await refreshBrowseData()
}

async function handleImageDeleted(imageId: number) {
  errorMessage.value = ''
  const deleted = await artStore.deleteArtImage(imageId)
  if (deleted) {
    if (selectedImageForOverlay.value?.id === imageId) {
      selectedImageForOverlay.value = null
    }
    selectedImageIds.value = selectedImageIds.value.filter(
      (id) => id !== imageId,
    )
    const next = { ...hydratedImages.value }
    delete next[imageId]
    hydratedImages.value = next
    successMessage.value = `Image #${imageId} deleted.`
    await refreshBrowseData()
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
    group.imageCount,
    group.isVirtual ? 'unsorted' : '',
    group.isPublic ? 'public' : 'private',
    group.isMature ? 'mature' : '',
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
