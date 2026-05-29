<!-- /components/content/art/art-gallery.vue -->
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
            class="btn btn-ghost btn-xs rounded-lg"
            type="button"
            @click="clearActiveGroup"
          >
            <Icon name="kind-icon:arrow-left" class="h-3.5 w-3.5" />
            Back
          </button>

          <button
            class="btn btn-xs rounded-lg"
            :class="bulkSelectEnabled ? 'btn-primary' : 'btn-ghost'"
            type="button"
            @click="toggleBulkSelect"
          >
            <Icon name="kind-icon:checklist" class="h-3.5 w-3.5" />
            {{ bulkSelectEnabled ? 'Selecting' : 'Select' }}
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
            @click="refreshGallery"
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
      class="shrink-0 flex items-center gap-2 rounded-xl border border-error/40 bg-error/10 px-3 py-2 text-xs font-semibold text-error"
    >
      <icon name="kind-icon:alert" class="h-3.5 w-3.5 shrink-0" />
      {{ errorMessage }}
    </div>

    <div
      v-if="successMessage"
      class="shrink-0 flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-xs font-semibold text-success"
    >
      <icon name="kind-icon:check" class="h-3.5 w-3.5 shrink-0" />
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
        <Icon name="kind-icon:folder" class="h-12 w-12 text-primary" />
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

        <div
          v-if="bulkSelectEnabled"
          class="flex flex-col gap-2 rounded-xl border border-primary/30 bg-base-100 p-3 shadow-sm"
        >
          <div class="flex flex-wrap items-center gap-2">
            <span class="badge badge-primary badge-sm">
              {{ selectedImageCount }} selected
            </span>

            <button
              class="btn btn-xs rounded-xl"
              type="button"
              :disabled="isBatchWorking"
              @click="selectPagedImages"
            >
              <Icon name="kind-icon:checklist" class="h-3.5 w-3.5" />
              Select page
            </button>

            <button
              class="btn btn-xs rounded-xl"
              type="button"
              :disabled="isBatchWorking"
              @click="selectAllFilteredImages"
            >
              <Icon name="kind-icon:gallery" class="h-3.5 w-3.5" />
              Select all filtered
            </button>

            <button
              class="btn btn-ghost btn-xs rounded-xl"
              type="button"
              :disabled="isBatchWorking || !selectedImageCount"
              @click="clearImageSelection"
            >
              <Icon name="kind-icon:x" class="h-3.5 w-3.5" />
              Clear
            </button>

            <button
              class="btn btn-ghost btn-xs ml-auto rounded-xl"
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
              class="btn btn-secondary btn-xs rounded-xl"
              type="button"
              :disabled="
                isBatchWorking ||
                !selectedImageCount ||
                !selectedBatchCollectionId
              "
              @click="addSelectedToCollection"
            >
              <Icon name="kind-icon:plus" class="h-3.5 w-3.5" />
              Add
            </button>

            <button
              class="btn btn-warning btn-xs rounded-xl"
              type="button"
              :disabled="
                isBatchWorking ||
                !selectedImageCount ||
                !selectedBatchCollectionId
              "
              @click="removeSelectedFromCollection"
            >
              <Icon name="kind-icon:minus" class="h-3.5 w-3.5" />
              Remove
            </button>

            <button
              v-if="activeGroup && activeGroup.id > 0"
              class="btn btn-warning btn-xs rounded-xl"
              type="button"
              :disabled="isBatchWorking || !selectedImageCount"
              @click="removeSelectedFromActiveCollection"
            >
              <Icon name="kind-icon:folder" class="h-3.5 w-3.5" />
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
              class="btn btn-info btn-xs rounded-xl"
              type="button"
              :disabled="isBatchWorking || !canBatchModifyImages"
              @click="applySelectedImageFlags"
            >
              <Icon name="kind-icon:edit" class="h-3.5 w-3.5" />
              Apply edits
            </button>

            <button
              class="btn btn-error btn-xs rounded-xl"
              type="button"
              :disabled="isBatchWorking || !canBatchModifyImages"
              @click="deleteSelectedImages"
            >
              <span
                v-if="isBatchWorking"
                class="loading loading-spinner loading-xs"
              />
              <Icon v-else name="kind-icon:trash" class="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
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

        <div v-else class="grid gap-2" :class="imageGridClass">
          <div
            v-for="image in pagedActiveImages"
            :key="image.id"
            class="relative"
          >
            <button
              v-if="bulkSelectEnabled"
              class="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-xl border shadow-lg transition"
              :class="
                isImageSelected(image.id)
                  ? 'border-primary bg-primary text-primary-content'
                  : 'border-base-300 bg-base-100/90 text-base-content hover:bg-base-200'
              "
              type="button"
              :title="
                isImageSelected(image.id) ? 'Deselect image' : 'Select image'
              "
              @click.stop="toggleImageSelection(image)"
            >
              <Icon
                :name="
                  isImageSelected(image.id)
                    ? 'kind-icon:check'
                    : 'kind-icon:plus'
                "
                class="h-4 w-4"
              />
            </button>

            <image-card
              :art-image="hydratedImages[image.id] || image"
              :selected="
                isImageSelected(image.id) ||
                selectedImageForOverlay?.id === image.id
              "
              :compact="viewSize === 'xs' || viewSize === 'sm'"
              :show-actions="
                !bulkSelectEnabled && selectedImageForOverlay?.id === image.id
              "
              :show-prompt="viewSize !== 'xs'"
              :show-meta="viewSize === 'md' || viewSize === 'lg'"
              :show-generation-meta="false"
              :show-image-status="false"
              :show-select-button="false"
              :allow-delete="canModifyImage(image) && !bulkSelectEnabled"
              :allow-edit="false"
              :auto-load-image="false"
              :size="viewSize"
              @select="handleImageCardClick"
              @delete="handleImageDeleted"
            />
          </div>
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
            <div class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary"
              >
                <icon name="kind-icon:image" class="h-4 w-4" />
              </span>
              <div class="min-w-0">
                <p
                  class="text-[0.6rem] font-black uppercase tracking-widest text-base-content/40"
                >
                  Selected Image
                </p>
                <h3 class="truncate text-sm font-black text-base-content">
                  #{{ selectedImageForOverlay.id }}
                </h3>
              </div>
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
        class="btn btn-ghost btn-xs rounded-xl gap-1"
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
        class="btn btn-ghost btn-xs rounded-xl gap-1"
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
      class="shrink-0 flex items-center gap-3 rounded-xl border border-base-300 bg-base-200/80 px-3 py-2 text-xs text-base-content/50"
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
// /components/content/art/art-gallery.vue
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { ErrorType, useErrorStore } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

type BatchFlagValue = 'keep' | 'true' | 'false'

const bulkSelectEnabled = ref(false)
const selectedImageIds = ref<number[]>([])
const batchCollectionId = ref<number | null>(null)
const batchIsPublic = ref<BatchFlagValue>('keep')
const batchIsMature = ref<BatchFlagValue>('keep')
const isBatchWorking = ref(false)

const selectedImageIdSet = computed(() => new Set(selectedImageIds.value))

const selectedImages = computed(() => {
  const ids = selectedImageIdSet.value
  return filteredActiveImages.value
    .map((image) => hydratedImages.value[image.id] || image)
    .filter((image) => ids.has(image.id))
})

const selectedImageCount = computed(() => selectedImageIds.value.length)

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

const selectedBatchCollectionId = computed(() => {
  const id = Number(batchCollectionId.value)
  return Number.isFinite(id) && id > 0 ? id : null
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

function selectPagedImages() {
  const ids = pagedActiveImages.value
    .filter((image) => canModifyImage(image))
    .map((image) => image.id)

  selectedImageIds.value = [...new Set([...selectedImageIds.value, ...ids])]
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

async function handleImageCardClick(image: ArtImage) {
  if (bulkSelectEnabled.value) {
    toggleImageSelection(image)
    return
  }

  await selectImage(image)
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

  await fetchCollectionsSafely(true)
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

  await fetchCollectionsSafely(true)
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

  await fetchCollectionsSafely(true)
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

      if (!deleted) {
        throw new Error(`Failed to delete image #${imageId}.`)
      }

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
    await fetchCollectionsSafely(true)
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to delete selected images.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isBatchWorking.value = false
  }
}

type GalleryCollection = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
  images?: ArtImage[]
}

const props = withDefaults(
  defineProps<{
    dropdownMode?: boolean
  }>(),
  {
    dropdownMode: false,
  },
)

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
      return 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8'
    case 'sm':
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7'
    case 'lg':
      return 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
    default:
      return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
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

async function refreshGallery() {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  hydratedImages.value = {}

  try {
    await Promise.all([
      fetchCollectionsSafely(true),
      props.dropdownMode
        ? Promise.resolve()
        : artStore.fetchAllArtImages({
            force: true,
            includeImageData: false,
            includeThumbnailData: false,
            includePitches: false,
          }),
    ])

    await hydrateVisibleImages()
    successMessage.value = 'Gallery refreshed.'
  } catch (error) {
    const message = getErrorMessage(error, 'Gallery failed to refresh.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

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
  selectedImageIds.value = []
  bulkSelectEnabled.value = false
  batchCollectionId.value = null
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
    await fetchCollectionsSafely(false)

    if (!props.dropdownMode) {
      await fetchArtImagesSafely()
    }

    await hydrateVisibleImages()
  } catch (error) {
    const message = getErrorMessage(error, 'Gallery failed to initialize.')
    errorMessage.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

async function fetchCollectionsSafely(force = false) {
  if (typeof collectionStore.fetchCollections !== 'function') return
  await collectionStore.fetchCollections(force)
}

async function fetchArtImagesSafely() {
  if (typeof artStore.fetchAllArtImages !== 'function') return

  await artStore.fetchAllArtImages({
    force: false,
    includeImageData: false,
    includeThumbnailData: false,
    includePitches: false,
  })
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

async function selectGroup(key: string) {
  const group = collectionGroups.value.find((entry) => entry.key === key)
  if (!group) return

  if (props.dropdownMode) {
    collectionStore.setCurrentCollection(group.id > 0 ? group.id : null)
    collectionStore.setSelectedCollectionIds(group.id > 0 ? [group.id] : [])
    successMessage.value = `${group.title} selected.`
    return
  }

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
  if (typeof artStore.deselectArtImage === 'function')
    artStore.deselectArtImage()
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
