<!-- /components/dreams/dream-art-chooser.vue -->
<template>
  <section class="rounded-2xl border border-base-300 bg-base-200 p-3">
    <div class="flex flex-wrap items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h2 class="font-black text-primary">Dream Art Links</h2>

          <span
            v-if="activeArtImageId"
            class="badge badge-primary badge-sm rounded-xl"
          >
            Image #{{ activeArtImageId }}
          </span>

          <span
            v-if="activeCollectionId"
            class="badge badge-secondary badge-sm rounded-xl"
          >
            Collection #{{ activeCollectionId }}
          </span>
        </div>

        <p class="mt-1 text-xs text-base-content/60">
          Pick the Dream highlight image, or attach a whole art collection.
        </p>
      </div>

      <button
        type="button"
        class="btn btn-ghost btn-sm tooltip tooltip-left rounded-xl"
        :disabled="isLoadingAssets"
        data-tip="Refresh art collections"
        aria-label="Refresh art collections"
        @click="loadAssets(true)"
      >
        <span
          v-if="isLoadingAssets"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
      </button>
    </div>

    <div
      class="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,18rem)]"
    >
      <label
        class="input input-sm input-bordered flex items-center gap-2 rounded-2xl bg-base-100"
      >
        <Icon name="kind-icon:search" class="h-4 w-4 opacity-60" />
        <input
          v-model="searchQuery"
          type="search"
          class="min-w-0 flex-1"
          placeholder="Search art by prompt, title, or ID..."
        />
      </label>

      <select
        v-model="selectedCollectionValue"
        class="select select-bordered select-sm rounded-2xl bg-base-100"
      >
        <option value="all">All visible art</option>
        <option
          v-for="collection in collectionChoices"
          :key="collection.id"
          :value="String(collection.id)"
        >
          {{ collection.label || `Collection #${collection.id}` }} ·
          {{ collection.imageCount }}
        </option>
      </select>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-secondary btn-xs rounded-2xl"
        :disabled="!selectedCollectionId || isSaving"
        @click="attachSelectedCollection"
      >
        <span
          v-if="isSavingCollection"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:folder" class="h-4 w-4" />
        Attach Collection
      </button>

      <button
        type="button"
        class="btn btn-primary btn-xs rounded-2xl text-white"
        :disabled="!canUseRandomImage || isSaving"
        data-tip="Pick a random image from a connected collection"
        @click="useRandomCollectionImage"
      >
        <span v-if="isSavingImage" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:dice" class="h-4 w-4" />
        Random from Collection
      </button>

      <button
        type="button"
        class="btn btn-outline btn-xs rounded-2xl"
        :disabled="!activeCollectionId || isSaving"
        @click="clearDreamCollection"
      >
        <Icon name="kind-icon:close" class="h-4 w-4" />
        Detach Collection
      </button>

      <button
        type="button"
        class="btn btn-outline btn-xs rounded-2xl"
        :disabled="!activeArtImageId || isSaving"
        @click="clearHighlightImage"
      >
        <Icon name="kind-icon:close" class="h-4 w-4" />
        Clear Image
      </button>

      <p class="min-w-0 flex-1 truncate text-xs text-base-content/60">
        {{ statusLine }}
      </p>
    </div>

    <div
      v-if="collectionChoices.length"
      class="mt-3 flex gap-2 overflow-x-auto pb-1"
    >
      <button
        v-for="collection in collectionChoices.slice(0, 12)"
        :key="collection.id"
        type="button"
        class="btn btn-xs shrink-0 rounded-2xl"
        :class="
          selectedCollectionId === collection.id
            ? 'btn-primary text-white'
            : 'btn-ghost'
        "
        @click="selectedCollectionValue = String(collection.id)"
      >
        {{ collection.label || `#${collection.id}` }}
      </button>
    </div>

    <div
      class="mt-3 grid max-h-80 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <image-card
        v-for="image in visibleImages"
        :key="image.id"
        :art-image="image as ArtImage"
        size="sm"
        :show-actions="false"
        :show-meta="false"
        :show-prompt="false"
        :show-reaction="false"
        :selected="image.id === activeArtImageId"
        :class="isSaving ? 'pointer-events-none opacity-60' : ''"
        @select="setHighlightImage(image)"
      />

      <div
        v-if="!visibleImages.length"
        class="col-span-full flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-200 p-6 text-center text-sm text-base-content/60"
      >
        <Icon name="kind-icon:image" class="h-10 w-10 text-primary/60" />
        <p class="mt-2 font-bold">No art found for this filter.</p>
        <p class="text-xs">Try another collection, or clear the search.</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { ArtImage } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useDreamStore, type DreamForm } from '@/stores/dreamStore'
import { useUserStore } from '@/stores/userStore'

type ArtImageLike = Partial<ArtImage> & {
  id: number
  path?: string | null
  fileName?: string | null
  imageData?: string | null
  thumbnailData?: string | null
  promptString?: string | null
  title?: string | null
  collection?: string | null
  description?: string | null
}

type CollectionChoice = ArtCollection & {
  imageCount: number
}

const dreamStore = useDreamStore()
const artStore = useArtStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()

const searchQuery = ref('')
const selectedCollectionValue = ref('all')
const isLoadingAssets = ref(false)
const isSavingImage = ref(false)
const isSavingCollection = ref(false)
const message = ref('')

const isSaving = computed(() => {
  return isSavingImage.value || isSavingCollection.value || dreamStore.isSaving
})

const activeArtImageId = computed(() => {
  return dreamStore.selectedDream?.artImageId ?? null
})

const activeCollectionId = computed(() => {
  return dreamStore.selectedDream?.artCollectionId ?? null
})

// Collection ids tied to this Dream: the primary one plus any M2M-attached collections.
const dreamCollectionIds = computed<number[]>(() => {
  const ids = new Set<number>()

  const primary = dreamStore.selectedDream?.artCollectionId
  if (Number.isInteger(primary) && Number(primary) > 0) ids.add(Number(primary))

  const dream = dreamStore.selectedDream as unknown as {
    ArtCollection?: { id?: number } | null
    ArtCollections?: { id?: number }[] | null
  }

  if (dream?.ArtCollection?.id) ids.add(Number(dream.ArtCollection.id))
  for (const collection of dream?.ArtCollections ?? []) {
    if (collection?.id) ids.add(Number(collection.id))
  }

  return Array.from(ids).filter((id) => Number.isInteger(id) && id > 0)
})

// Random selection is available when at least one connected collection holds images.
const canUseRandomImage = computed(() => {
  return collectImagesFromCollections(dreamCollectionIds.value).length > 0
})

const selectedCollectionId = computed(() => {
  if (selectedCollectionValue.value === 'all') return null

  const id = Number(selectedCollectionValue.value)
  return Number.isInteger(id) && id > 0 ? id : null
})

const visibleCollections = computed(() => {
  const currentUserId = Number(userStore.userId ?? userStore.user?.id ?? 10)
  const canSeeMature = Boolean(userStore.showMature || userStore.isAdmin)

  return collectionStore.collections
    .filter((collection) => {
      if (collection.isMature && !canSeeMature) return false
      if (collection.userId === currentUserId) return true
      return Boolean(collection.isPublic)
    })
    .sort((a, b) => {
      const aOwn = a.userId === currentUserId ? 0 : 1
      const bOwn = b.userId === currentUserId ? 0 : 1
      if (aOwn !== bOwn) return aOwn - bOwn

      const aActive = a.id === activeCollectionId.value ? 0 : 1
      const bActive = b.id === activeCollectionId.value ? 0 : 1
      if (aActive !== bActive) return aActive - bActive

      return (a.label || '').localeCompare(b.label || '')
    })
})

const collectionChoices = computed<CollectionChoice[]>(() => {
  return visibleCollections.value.map((collection) => ({
    ...collection,
    imageCount: collectionStore.getCollectionArtImages(collection).length,
  }))
})

const allArtImages = computed<ArtImageLike[]>(() => {
  const currentUserId = Number(userStore.userId ?? userStore.user?.id ?? 10)
  const canSeeMature = Boolean(userStore.showMature || userStore.isAdmin)
  const imageMap = new Map<number, ArtImageLike>()

  for (const image of artStore.artImages as ArtImageLike[]) {
    if (image.isMature && !canSeeMature) continue
    if (image.userId !== currentUserId && !image.isPublic) continue
    imageMap.set(image.id, image)
  }

  for (const image of collectionStore.allCollectionArtImages as ArtImageLike[]) {
    if (image.isMature && !canSeeMature) continue
    if (image.userId !== currentUserId && !image.isPublic) continue
    imageMap.set(image.id, image)
  }

  for (const image of dreamStore.selectedDreamCollectionArt as ArtImageLike[]) {
    if (!image.id) continue
    imageMap.set(image.id, image)
  }

  return Array.from(imageMap.values()).sort((a, b) => b.id - a.id)
})

const selectedCollectionImages = computed<ArtImageLike[]>(() => {
  if (!selectedCollectionId.value) return allArtImages.value

  return collectionStore
    .getCollectionImages(selectedCollectionId.value)
    .map((image) => image as ArtImageLike)
    .sort((a, b) => b.id - a.id)
})

const visibleImages = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const images = selectedCollectionImages.value

  if (!query) return images.slice(0, 80)

  return images
    .filter((image) => {
      return [
        image.id,
        image.title,
        image.promptString,
        image.description,
        image.collection,
        image.fileName,
        image.imagePath,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
    .slice(0, 80)
})

const statusLine = computed(() => {
  if (message.value) return message.value

  const scope = selectedCollectionId.value
    ? collectionChoices.value.find((collection) => {
        return collection.id === selectedCollectionId.value
      })?.label || `Collection #${selectedCollectionId.value}`
    : 'all visible art'

  return `${visibleImages.value.length}/${selectedCollectionImages.value.length} images from ${scope}`
})

watch(
  () => dreamStore.selectedDream?.id,
  () => syncCollectionSelection(),
  { immediate: true },
)

onMounted(async () => {
  await loadAssets(false)
  syncCollectionSelection()
})

function syncCollectionSelection() {
  const collectionId = dreamStore.selectedDream?.artCollectionId

  if (collectionId) {
    selectedCollectionValue.value = String(collectionId)
    return
  }

  if (selectedCollectionValue.value !== 'all') return

  const firstCollection = collectionChoices.value[0]
  selectedCollectionValue.value = firstCollection?.id
    ? String(firstCollection.id)
    : 'all'
}

async function loadAssets(force = false) {
  isLoadingAssets.value = true
  message.value = ''

  try {
    await Promise.all([
      collectionStore.fetchCollections(force, {
        includeImages: true,
        imageLimit: 80,
      }),
      artStore.fetchAllArtImages({ force }),
    ])
  } finally {
    isLoadingAssets.value = false
  }
}

function buildDreamArtPatch(updates: Partial<DreamForm>): DreamForm {
  const dream = dreamStore.selectedDream

  return {
    artImageId: dream?.artImageId ?? null,
    artCollectionId: dream?.artCollectionId ?? null,
    ...updates,
  }
}

async function setHighlightImage(image: ArtImageLike) {
  if (!dreamStore.selectedDreamId || !image.id) return

  isSavingImage.value = true
  message.value = ''

  try {
    const collectionId = selectedCollectionId.value ?? activeCollectionId.value
    const result = await dreamStore.updateSelectedDream(
      buildDreamArtPatch({
        artImageId: image.id,
        artCollectionId: collectionId ?? null,
        addArtToCollection: Boolean(collectionId),
        updateNote: `Selected Dream highlight image #${image.id}.`,
      }),
    )

    if (!result.success)
      throw new Error(result.message || 'Failed to set image.')

    if (collectionId) {
      collectionStore.setCurrentCollection(collectionId)
      collectionStore.setSelectedCollectionIds([collectionId])
    }

    await dreamStore.fetchArtForDream(dreamStore.selectedDreamId)
    message.value = `Highlight image set to #${image.id}.`
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Failed to set image.'
  } finally {
    isSavingImage.value = false
  }
}

async function attachSelectedCollection() {
  if (!dreamStore.selectedDreamId || !selectedCollectionId.value) return

  isSavingCollection.value = true
  message.value = ''

  try {
    const collectionId = selectedCollectionId.value
    const result = await dreamStore.updateSelectedDream(
      buildDreamArtPatch({
        artCollectionId: collectionId,
        updateNote: `Attached art collection #${collectionId}.`,
      }),
    )

    if (!result.success) {
      throw new Error(result.message || 'Failed to attach collection.')
    }

    collectionStore.setCurrentCollection(collectionId)
    collectionStore.setSelectedCollectionIds([collectionId])
    await dreamStore.fetchArtForDream(dreamStore.selectedDreamId)
    message.value = `Attached collection #${collectionId}.`
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Failed to attach collection.'
  } finally {
    isSavingCollection.value = false
  }
}

async function clearDreamCollection() {
  if (!dreamStore.selectedDreamId) return

  isSavingCollection.value = true
  message.value = ''

  try {
    const result = await dreamStore.updateSelectedDream(
      buildDreamArtPatch({
        artCollectionId: null,
        updateNote: 'Detached the Dream art collection.',
      }),
    )

    if (!result.success) {
      throw new Error(result.message || 'Failed to detach collection.')
    }

    collectionStore.clearSelectedCollections()
    selectedCollectionValue.value = 'all'
    message.value = 'Dream art collection detached.'
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Failed to detach collection.'
  } finally {
    isSavingCollection.value = false
  }
}

function collectImagesFromCollections(collectionIds: number[]): ArtImageLike[] {
  if (!collectionIds.length) return []

  const seen = new Map<number, ArtImageLike>()
  for (const collectionId of collectionIds) {
    const images = collectionStore.getCollectionImages(collectionId) ?? []
    for (const image of images as ArtImageLike[]) {
      if (image?.id) seen.set(image.id, image)
    }
  }

  return Array.from(seen.values())
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null
  const index = Math.floor(Math.random() * items.length)
  return items[index] ?? null
}

// Picks a random image from a random collection tied to the Dream and makes it
// the highlight image. Falls back to any connected-collection image if needed.
async function useRandomCollectionImage() {
  if (!dreamStore.selectedDreamId) return

  isSavingImage.value = true
  message.value = ''

  try {
    const collectionIds = dreamCollectionIds.value
    const shuffledCollections = [...collectionIds].sort(
      () => Math.random() - 0.5,
    )

    let chosen: ArtImageLike | null = null
    let chosenCollectionId: number | null = null

    for (const collectionId of shuffledCollections) {
      const images = collectionStore.getCollectionImages(collectionId) ?? []
      const picked = pickRandom(images as ArtImageLike[])
      if (picked?.id) {
        chosen = picked
        chosenCollectionId = collectionId
        break
      }
    }

    if (!chosen) {
      chosen = pickRandom(collectImagesFromCollections(collectionIds))
      chosenCollectionId = chosen ? (collectionIds[0] ?? null) : null
    }

    if (!chosen?.id) {
      message.value = 'No images available in the connected collections.'
      return
    }

    const result = await dreamStore.updateSelectedDream(
      buildDreamArtPatch({
        artImageId: chosen.id,
        artCollectionId: chosenCollectionId ?? activeCollectionId.value ?? null,
        addArtToCollection: Boolean(chosenCollectionId),
        updateNote: `Set random highlight image #${chosen.id}${
          chosenCollectionId ? ` from collection #${chosenCollectionId}` : ''
        }.`,
      }),
    )

    if (!result.success) {
      throw new Error(result.message || 'Failed to set random image.')
    }

    await dreamStore.fetchArtForDream(dreamStore.selectedDreamId)
    message.value = `Random highlight set to #${chosen.id}.`
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Failed to set random image.'
  } finally {
    isSavingImage.value = false
  }
}

async function clearHighlightImage() {
  if (!dreamStore.selectedDreamId) return

  isSavingImage.value = true
  message.value = ''

  try {
    const result = await dreamStore.updateSelectedDream(
      buildDreamArtPatch({
        artImageId: null,
        updateNote: 'Cleared the Dream highlight image.',
      }),
    )

    if (!result.success) {
      throw new Error(result.message || 'Failed to clear image.')
    }

    message.value = 'Dream highlight image cleared.'
  } catch (error) {
    message.value =
      error instanceof Error ? error.message : 'Failed to clear image.'
  } finally {
    isSavingImage.value = false
  }
}
</script>
