<!-- /components/content/art/collection-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>

          <p class="text-sm text-base-content/60">
            {{ selectedSummary }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ visibleCollections.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="grid grid-cols-1 gap-2 md:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
      >
        <select
          v-model="scope"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Filter collections by scope"
        >
          <option value="visible">Visible</option>
          <option value="mine">Mine</option>
          <option value="public">Public</option>
          <option value="all">All loaded</option>
        </select>

        <select
          v-model="matureFilter"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Filter mature collections"
        >
          <option value="allowed">Allowed</option>
          <option value="safe">Safe only</option>
          <option value="mature">Mature only</option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search collections..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search collections"
        />

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshCollections"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingCollection"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!activeCollection || !canEditCollection(activeCollection)"
          @click="startEditingCollection()"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="selectedCollectionIds.length === 0"
          @click="clearSelectedCollections"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          @click="selectUnassignedCollection"
        >
          <Icon name="kind-icon:gallery" class="h-4 w-4" />
          Unassigned
        </button>
      </div>
    </header>

    <section
      v-if="showCollectionForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closeCollectionForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <div class="grid gap-3">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Label</span>
          </span>

          <input
            v-model="collectionForm.label"
            class="input input-bordered bg-base-200"
            placeholder="Collection name"
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Description</span>
          </span>

          <textarea
            v-model="collectionForm.description"
            class="textarea textarea-bordered min-h-24 bg-base-200"
            placeholder="What belongs in this collection?"
          />
        </label>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Public</span>

            <input
              v-model="collectionForm.isPublic"
              type="checkbox"
              class="toggle toggle-success"
            />
          </label>

          <label
            class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
          >
            <span class="label-text font-bold">Mature</span>

            <input
              v-model="collectionForm.isMature"
              type="checkbox"
              class="toggle toggle-warning"
            />
          </label>
        </div>

        <div
          v-if="formMessage"
          class="rounded-2xl border p-3 text-sm"
          :class="
            formTone === 'error'
              ? 'border-error/40 bg-error/10 text-error'
              : 'border-success/40 bg-success/10 text-success'
          "
        >
          {{ formMessage }}
        </div>

        <div class="flex justify-end gap-2">
          <button
            class="btn btn-ghost rounded-xl"
            type="button"
            @click="closeCollectionForm"
          >
            Cancel
          </button>

          <button
            class="btn btn-primary rounded-xl text-white"
            type="button"
            :disabled="isSavingCollection || !collectionForm.label?.trim()"
            @click="saveCollectionForm"
          >
            <span
              v-if="isSavingCollection"
              class="loading loading-spinner loading-sm"
            />
            Save Collection
          </button>
        </div>
      </div>
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div v-else-if="selectedCollections.length" class="flex flex-col gap-4">
        <article
          v-for="collection in selectedCollections"
          :key="collection.id"
          class="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-md"
        >
          <div
            class="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
          >
            <div class="min-w-0 flex-1">
              <div
                v-if="
                  editingTitle === collection.id &&
                  canEditCollection(collection)
                "
                class="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <input
                  v-model="collection.label"
                  class="input input-bordered input-sm w-full max-w-md bg-base-200 text-lg font-bold"
                  placeholder="Untitled Collection"
                />

                <button
                  class="btn btn-primary btn-sm rounded-xl text-white"
                  type="button"
                  @click="saveCollectionLabel(collection)"
                >
                  Save
                </button>

                <button
                  class="btn btn-ghost btn-sm rounded-xl"
                  type="button"
                  @click="editingTitle = null"
                >
                  Cancel
                </button>
              </div>

              <h2
                v-else
                class="truncate text-2xl font-black text-primary"
                :class="canEditCollection(collection) ? 'cursor-pointer' : ''"
                @click="
                  canEditCollection(collection) &&
                  (editingTitle = collection.id)
                "
              >
                {{ collection.label || 'Untitled Collection' }}
              </h2>

              <p class="mt-1 text-sm text-base-content/70">
                {{ collection.description || 'No description yet.' }}
              </p>

              <div class="mt-2 flex flex-wrap gap-2">
                <span class="badge badge-outline badge-sm">
                  {{ getArtFromCollection(collection).length }} art
                </span>

                <span class="badge badge-primary badge-sm">
                  {{ collection.username || 'Unknown user' }}
                </span>

                <span
                  class="badge badge-sm"
                  :class="
                    collection.isPublic ? 'badge-success' : 'badge-warning'
                  "
                >
                  {{ collection.isPublic ? 'Public' : 'Private' }}
                </span>

                <span
                  v-if="collection.isMature"
                  class="badge badge-error badge-sm"
                >
                  Mature
                </span>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                class="btn btn-ghost btn-sm rounded-xl"
                type="button"
                title="Back to collections"
                @click="removeCollection(collection.id)"
              >
                <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
                Back
              </button>

              <button
                v-if="canEditCollection(collection)"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingCollection(collection)"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                Edit
              </button>

              <button
                v-if="canEditCollection(collection)"
                class="btn btn-error btn-sm rounded-xl text-white"
                type="button"
                @click="confirmRemoveAllArt(collection)"
              >
                <Icon name="kind-icon:trash" class="h-4 w-4" />
                Empty
              </button>
            </div>
          </div>

          <div
            v-if="canEditCollection(collection)"
            class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <span class="label-text font-bold">Public</span>

              <input
                v-model="collection.isPublic"
                type="checkbox"
                class="toggle toggle-success"
                @change="saveCollectionVisibility(collection)"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <span class="label-text font-bold">Mature</span>

              <input
                v-model="collection.isMature"
                type="checkbox"
                class="toggle toggle-warning"
                @change="saveCollectionVisibility(collection)"
              />
            </label>
          </div>

          <div class="max-h-[60vh] overflow-auto pr-1">
            <div
              v-if="getArtFromCollection(collection).length"
              class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4"
            >
              <button
                class="relative aspect-square overflow-hidden rounded-2xl border border-base-300 bg-base-200 transition hover:shadow-lg"
                type="button"
                title="Back to collections"
                @click="removeCollection(collection.id)"
              >
                <img
                  src="/images/backtree.webp"
                  class="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity hover:opacity-80"
                  alt="Back"
                />

                <div
                  class="absolute inset-0 flex flex-col items-center justify-center text-center"
                >
                  <Icon
                    name="kind-icon:arrow-left"
                    class="h-8 w-8 text-base-content"
                  />

                  <span class="mt-1 text-xs font-bold text-base-content">
                    Back
                  </span>
                </div>
              </button>

              <art-card
                v-for="art in getArtFromCollection(collection).slice(
                  0,
                  visibleCount,
                )"
                :key="art.id"
                :art="art"
                :compact="true"
                :show-actions="true"
                :show-prompt="false"
                :show-meta="false"
                :show-select-button="false"
                @edit="startEditingArt"
              />
            </div>

            <div
              v-else
              class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
            >
              <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

              <p class="mt-2 text-lg font-bold">No art in this collection.</p>

              <p class="mt-1 text-sm">
                The gallery goblin found only vibes and lint.
              </p>
            </div>
          </div>
        </article>
      </div>

      <div v-else :class="layoutClass">
        <collection-card
          v-for="collection in visibleCollections"
          :key="collection.id"
          :collection="collection"
          :compact="isCompact"
          :show-mature="showMature"
          :show-stats="showStats"
          :show-select-button="false"
          :show-actions="showCardActions"
          @edit="startEditingCollectionById"
          @delete="handleCollectionDeleted"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

type CollectionGalleryVariant = 'dashboard' | 'row'
type CollectionScope = 'visible' | 'mine' | 'public' | 'all'
type MatureFilter = 'allowed' | 'safe' | 'mature'

const props = withDefaults(
  defineProps<{
    variant?: CollectionGalleryVariant
    title?: string
    subtitle?: string
    compact?: boolean
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showStats?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowRefresh?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Collections',
    subtitle: 'Browse art collections.',
    compact: false,
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showStats: false,
    allowAdd: true,
    allowEdit: true,
    allowRefresh: true,
    autoLoad: true,
  },
)

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()

const visibleCount = ref(50)
const editingTitle = ref<number | null>(null)
const isLoading = ref(false)
const showCollectionForm = ref(false)
const isSavingCollection = ref(false)
const editingCollectionId = ref<number | null>(null)
const formMessage = ref('')
const formTone = ref<'success' | 'error'>('success')
const scope = ref<CollectionScope>('visible')
const matureFilter = ref<MatureFilter>('allowed')
const searchQuery = ref('')

const collectionForm = reactive<Partial<ArtCollection>>({
  label: '',
  description: '',
  isPublic: true,
  isMature: false,
})

const isCompact = computed(() => {
  return props.compact || props.variant === 'row'
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'collection-row' : 'collection-grid'
})

const showMature = computed(() => {
  return Boolean(userStore.showMature && matureFilter.value !== 'safe')
})

const selectedCollectionIds = computed<number[]>(() => {
  return collectionStore.selectedCollectionIds || []
})

const activeCollection = computed<ArtCollection | null>(() => {
  return (
    collectionStore.currentCollection || selectedCollections.value[0] || null
  )
})

const selectedCollections = computed<ArtCollection[]>(() => {
  const selected = selectedCollectionIds.value.map((id) => {
    if (id === -1) return unassignedCollection.value

    return collectionStore.collections.find((collection) => {
      return collection.id === id
    })
  })

  return selected.filter(Boolean) as ArtCollection[]
})

const allUnassignedArt = computed<Art[]>(() => {
  const assignedIds = new Set<number>(
    collectionStore.collections.flatMap((collection) => {
      return (collection.art ?? [])
        .map((art) => art.id)
        .filter((id): id is number => typeof id === 'number')
    }),
  )

  return artStore.art.filter((art) => {
    return typeof art.id === 'number' && !assignedIds.has(art.id)
  })
})

const unassignedCollection = computed<ArtCollection>(() => {
  return {
    id: -1,
    label: 'All Images Without Collection',
    description: 'Art that is not currently assigned to a collection.',
    userId: userStore.userId || 10,
    username: userStore.username || 'Kind Guest',
    isPublic: false,
    isMature: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    art: allUnassignedArt.value,
  }
})

const baseCollections = computed<ArtCollection[]>(() => {
  const realCollections = collectionStore.collections || []

  if (scope.value === 'mine') {
    return realCollections.filter((collection) => {
      return collection.userId === userStore.userId
    })
  }

  if (scope.value === 'public') {
    return realCollections.filter((collection) => collection.isPublic)
  }

  if (scope.value === 'all') {
    return [unassignedCollection.value, ...realCollections]
  }

  return [
    unassignedCollection.value,
    ...realCollections.filter((collection) => {
      return (
        collection.isPublic ||
        collection.userId === userStore.userId ||
        userStore.isAdmin
      )
    }),
  ]
})

const visibleCollections = computed<ArtCollection[]>(() => {
  let collections = baseCollections.value

  if (matureFilter.value === 'safe') {
    collections = collections.filter((collection) => !collection.isMature)
  }

  if (matureFilter.value === 'mature') {
    collections = collections.filter((collection) => collection.isMature)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    collections = collections.filter((collection) => {
      const haystack = [
        collection.label,
        collection.description,
        collection.username,
        String(collection.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return collections
})

const selectedSummary = computed(() => {
  if (selectedCollections.value.length === 1) {
    return selectedCollections.value[0]?.label || 'Selected collection'
  }

  if (selectedCollections.value.length > 1) {
    return `${selectedCollections.value.length} collections selected`
  }

  return props.subtitle
})

const formTitle = computed(() => {
  return editingCollectionId.value ? 'Edit Collection' : 'Add Collection'
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshCollections()
  }
})

async function refreshCollections() {
  isLoading.value = true

  try {
    await Promise.all([
      artStore.initialize({
        fetchRemote: true,
        hydrateImages: false,
        initializeCollections: false,
      }),
      collectionStore.fetchCollections?.(),
    ])
  } finally {
    isLoading.value = false
  }
}

function canEditCollection(collection: ArtCollection | null) {
  if (!collection || collection.id === -1 || !props.allowEdit) return false

  return userStore.isAdmin || collection.userId === userStore.userId
}

function getArtFromCollection(collection: ArtCollection) {
  return (collection.art || []).filter((art) => Boolean(art?.id))
}

function selectUnassignedCollection() {
  selectCollection(-1)
}

async function selectCollection() {
  if (isHiddenMature.value) return

  collectionStore.setCurrentCollection(props.collection.id)
  collectionStore.toggleSelectedCollectionId(props.collection.id)
}

function removeCollection(id: number) {
  collectionStore.selectedCollectionIds =
    collectionStore.selectedCollectionIds.filter((selectedId) => {
      return selectedId !== id
    })

  if (collectionStore.currentCollection?.id === id) {
    collectionStore.currentCollection = null
  }
}

function clearSelectedCollections() {
  collectionStore.selectedCollectionIds = []
  collectionStore.currentCollection = null
}

function startAddingCollection() {
  editingCollectionId.value = null
  formMessage.value = ''
  Object.assign(collectionForm, {
    label: '',
    description: '',
    isPublic: true,
    isMature: false,
  })
  showCollectionForm.value = true
}

function startEditingCollection(collection?: ArtCollection | null) {
  const target = collection || activeCollection.value

  if (!target || !canEditCollection(target)) return

  editingCollectionId.value = target.id
  formMessage.value = ''
  Object.assign(collectionForm, {
    label: target.label || '',
    description: target.description || '',
    isPublic: target.isPublic,
    isMature: target.isMature,
  })
  showCollectionForm.value = true
}

function startEditingCollectionById(id: number) {
  const collection = collectionStore.collections.find((entry) => {
    return entry.id === id
  })

  if (collection) {
    startEditingCollection(collection)
  }
}

function closeCollectionForm() {
  showCollectionForm.value = false
  editingCollectionId.value = null
  formMessage.value = ''
}

async function saveCollectionForm() {
  isSavingCollection.value = true
  formMessage.value = ''

  try {
    if (editingCollectionId.value) {
      await saveExistingCollection(editingCollectionId.value)
    } else {
      await createNewCollection()
    }

    formTone.value = 'success'
    formMessage.value = 'Collection saved.'
    await refreshCollections()
    closeCollectionForm()
  } catch (error) {
    formTone.value = 'error'
    formMessage.value =
      error instanceof Error ? error.message : 'Failed to save collection.'
  } finally {
    isSavingCollection.value = false
  }
}

async function createNewCollection() {
  if (typeof collectionStore.createCollection === 'function') {
    await collectionStore.createCollection({
      label: collectionForm.label || 'Untitled Collection',
      description: collectionForm.description || '',
      isPublic: Boolean(collectionForm.isPublic),
      isMature: Boolean(collectionForm.isMature),
      userId: userStore.userId || 10,
      username: userStore.username || 'Kind Guest',
    })
    return
  }

  throw new Error('collectionStore.createCollection is not available.')
}

async function saveExistingCollection(id: number) {
  if (typeof collectionStore.updateCollection === 'function') {
    await collectionStore.updateCollection(id, {
      label: collectionForm.label || 'Untitled Collection',
      description: collectionForm.description || '',
      isPublic: Boolean(collectionForm.isPublic),
      isMature: Boolean(collectionForm.isMature),
    })
    return
  }

  if (typeof collectionStore.updateCollectionLabel === 'function') {
    await collectionStore.updateCollectionLabel(
      id,
      collectionForm.label || 'Untitled Collection',
    )
    return
  }

  throw new Error('collectionStore.updateCollection is not available.')
}

async function saveCollectionLabel(collection: ArtCollection) {
  if (!canEditCollection(collection)) return

  if (typeof collectionStore.updateCollectionLabel === 'function') {
    await collectionStore.updateCollectionLabel(
      collection.id,
      collection.label || 'Untitled Collection',
    )
  }

  editingTitle.value = null
}

async function saveCollectionVisibility(collection: ArtCollection) {
  if (!canEditCollection(collection)) return

  if (typeof collectionStore.updateCollection === 'function') {
    await collectionStore.updateCollection(collection.id, {
      isPublic: collection.isPublic,
      isMature: collection.isMature,
    })
  }
}

function confirmRemoveAllArt(collection: ArtCollection) {
  if (!canEditCollection(collection)) return

  const confirmed = confirm(
    `Remove all art from "${collection.label || 'Untitled Collection'}"? This only affects this collection.`,
  )

  if (!confirmed) return

  const ids = (collection.art || [])
    .map((art) => art.id)
    .filter((id): id is number => typeof id === 'number')

  for (const id of ids) {
    collectionStore.removeArtFromLocalCollection?.(collection, id)
  }
}

function handleCollectionDeleted(id: number) {
  if (selectedCollectionIds.value.includes(id)) {
    removeCollection(id)
  }
}

function startEditingArt(id: number) {
  void artStore.selectArt(id)
}
</script>

<style scoped>
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}

.collection-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.collection-row > * {
  min-width: min(220px, 85vw);
  max-width: 340px;
}
</style>
