<!-- /components/content/art/art-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <!-- ── Breadcrumb / back nav (always visible in arts mode) ── -->
    <nav
      v-if="mode === 'arts' && !isDropdownMode"
      class="flex shrink-0 items-center gap-1 rounded-xl bg-base-200 px-3 py-2 text-sm"
      aria-label="Gallery navigation"
    >
      <button
        class="flex items-center gap-1 font-bold text-primary hover:underline"
        type="button"
        @click="exitCollection"
      >
        <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
        Collections
      </button>

      <Icon
        name="kind-icon:chevron-right"
        class="h-4 w-4 text-base-content/40"
      />

      <span class="min-w-0 truncate font-semibold text-base-content">
        {{ activeCollection?.label || 'Untitled Collection' }}
      </span>

      <span class="ml-auto shrink-0 badge badge-ghost text-xs">
        {{ currentGalleryItems.length }} art
      </span>
    </nav>

    <!-- ── Header ── -->
    <header
      v-if="showHeader"
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ headerTitle }}
          </h2>

          <p class="truncate text-sm text-base-content/60">
            {{ headerSubtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span v-if="!isLoading" class="badge badge-ghost">
            {{ displayCount }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode && mode === 'collections'"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingCollection"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading"
            @click="refresh"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Search / filter controls (collections mode only) -->
      <div
        v-if="showControls && !isDropdownMode && mode === 'collections'"
        class="grid grid-cols-1 gap-2 md:grid-cols-[auto_minmax(0,1fr)_auto]"
      >
        <label
          v-if="userStore.isAdmin"
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <span class="label-text font-bold">Show Mature</span>

          <input
            v-model="showMature"
            type="checkbox"
            class="toggle toggle-accent toggle-sm"
          />
        </label>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search collections..."
          class="input input-bordered input-sm w-full bg-base-100"
        />

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!activeCollection"
          @click="clearSelectedCollection"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>

      <!-- Search inside a collection -->
      <div
        v-if="showControls && !isDropdownMode && mode === 'arts'"
        class="flex gap-2"
      >
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search prompts, checkpoints..."
          class="input input-bordered input-sm w-full bg-base-100"
        />
      </div>
    </header>

    <!-- ── Collection action buttons (arts mode) ── -->
    <div
      v-if="mode === 'arts' && !isDropdownMode && canEditActive"
      class="flex shrink-0 flex-wrap gap-2"
    >
      <button
        v-if="allowEdit"
        class="btn btn-secondary btn-sm rounded-xl"
        type="button"
        @click="startEditingActiveCollection"
      >
        <Icon name="kind-icon:pencil" class="h-4 w-4" />
        Edit
      </button>

      <button
        v-if="allowMerge && mergeTargetOptions.length > 0"
        class="btn btn-accent btn-sm rounded-xl"
        type="button"
        @click="toggleMergePanel"
      >
        <Icon name="kind-icon:gallery" class="h-4 w-4" />
        Merge Into…
      </button>

      <button
        v-if="allowDelete"
        class="btn btn-error btn-sm rounded-xl text-white"
        type="button"
        @click="confirmDeleteCollection"
      >
        <Icon name="kind-icon:trash" class="h-4 w-4" />
        Delete
      </button>
    </div>

    <!-- ── Collection form ── -->
    <section
      v-if="showCollectionForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ collectionFormTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ collectionFormSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeCollectionForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
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

        <div class="grid grid-cols-2 gap-3">
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

    <!-- ── Merge panel ── -->
    <section
      v-if="showMergePanel && activeCollection"
      class="shrink-0 rounded-2xl border border-accent/40 bg-accent/10 p-3 shadow-md"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-accent">
          Merge "{{ activeCollection.label || 'Untitled' }}" into…
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="showMergePanel = false"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <p class="mb-3 text-xs text-base-content/60">
        All art moves to the target. This collection is then deleted.
      </p>

      <div class="flex gap-2">
        <select
          v-model="mergeTargetId"
          class="select select-bordered select-sm flex-1 bg-base-100"
        >
          <option :value="null">Select target…</option>

          <option
            v-for="collection in mergeTargetOptions"
            :key="collection.id"
            :value="collection.id"
          >
            {{ collection.label || `Collection #${collection.id}` }}
          </option>
        </select>

        <button
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!mergeTargetId || isMerging"
          @click="executeMerge"
        >
          <span v-if="isMerging" class="loading loading-spinner loading-xs" />
          Confirm Merge
        </button>
      </div>
    </section>

    <!-- ── Selected art panel ── -->
    <section
      v-if="showSelectedPanel && selectedArt && !isDropdownMode"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase text-primary/70">
            Selected Art
          </p>

          <h3 class="truncate text-base font-black text-base-content">
            Art #{{ selectedArt.id }}
          </h3>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          title="Clear selected art"
          @click="clearSelectedArt"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

      <art-interact />
    </section>

    <!-- ── Main scrollable content ── -->
    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <!-- Dropdown mode -->
      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:gallery" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Collection
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedCollectionLabel }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedCollectionSubtitle }}
                </p>
              </div>
            </div>

            <button
              v-if="canEditActive"
              class="btn btn-secondary btn-sm rounded-xl"
              type="button"
              @click="startEditingActiveCollection"
            >
              <Icon name="kind-icon:pencil" class="h-4 w-4" />
              <span class="hidden sm:inline">Edit</span>
            </button>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
            :value="activeCollection?.id ?? ''"
            aria-label="Select collection"
            @change="selectCollectionFromEvent"
          >
            <option value="">Choose a collection</option>

            <option
              v-for="collection in visibleCollections"
              :key="collection.id"
              :value="collection.id"
            >
              {{ collection.label || `Collection #${collection.id}` }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Collection</option>
          </select>

          <div
            v-if="activeCollection"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ activeCollection.description || 'No description yet.' }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="activeCollection.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm">Private</span>

              <span
                v-if="activeCollection.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span class="badge badge-secondary badge-sm">
                {{ selectedCollectionArtCount }} art
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Collections grid -->
      <div v-else-if="mode === 'collections'">
        <div
          v-if="visibleCollections.length === 0"
          class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:gallery" class="h-12 w-12 text-primary" />

          <p class="mt-2 text-lg font-bold">No collections found.</p>

          <p class="mt-1 text-sm">
            Nothing matches your search, or none exist yet.
          </p>

          <button
            v-if="allowAdd"
            class="btn btn-primary btn-sm mt-4 rounded-xl"
            type="button"
            @click="startAddingCollection"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            Create Collection
          </button>
        </div>

        <div v-else :class="layoutClass">
          <button
            v-for="collection in visibleCollections"
            :key="collection.id"
            class="cursor-pointer text-left"
            type="button"
            @click="enterCollection(collection)"
          >
            <collection-card
              :collection="collection"
              :compact="isCompact"
              :show-mature="showMature"
              :show-stats="false"
              :show-select-button="false"
              :show-actions="false"
            />
          </button>
        </div>
      </div>

      <!-- Arts grid -->
      <div v-else class="flex flex-col gap-3">
        <div
          v-if="activeCollection && canEditActive"
          class="flex flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <label
            class="label cursor-pointer gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
          >
            <span class="label-text text-xs font-bold">Public</span>

            <input
              v-model="activeCollection.isPublic"
              type="checkbox"
              class="toggle toggle-success toggle-xs"
              @change="saveActiveCollectionFlags"
            />
          </label>

          <label
            class="label cursor-pointer gap-2 rounded-xl border border-base-300 bg-base-200 px-3 py-2"
          >
            <span class="label-text text-xs font-bold">Mature</span>

            <input
              v-model="activeCollection.isMature"
              type="checkbox"
              class="toggle toggle-warning toggle-xs"
              @change="saveActiveCollectionFlags"
            />
          </label>
        </div>

        <div
          v-if="currentGalleryItems.length === 0"
          class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

          <p class="mt-2 text-lg font-bold">Nothing here yet.</p>

          <p class="mt-1 text-sm">This collection is empty.</p>

          <button
            class="btn btn-ghost btn-sm mt-4 rounded-xl"
            type="button"
            @click="exitCollection"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Back to Collections
          </button>
        </div>

        <div v-else class="art-grid">
          <div
            v-for="item in currentGalleryItems"
            :key="item.key"
            class="group relative"
          >
            <ImageCard
              v-if="item.artImage"
              :art-image="item.artImage"
              :selected="artStore.currentArtImage?.id === item.artImage.id"
              :compact="true"
              :show-actions="true"
              :show-prompt="false"
              :show-meta="false"
              :show-generation-meta="false"
              :show-select-button="false"
              :allow-delete="item.canDelete"
              :allow-edit="item.canEdit"
              @select="selectImage"
              @edit="startEditingImage"
              @delete="handleImageDeleted"
            />

            <art-card
              v-else-if="item.art"
              :art="item.art"
              :selected="selectedArt?.id === item.art.id"
              :compact="true"
              :show-actions="true"
              :show-prompt="false"
              :show-meta="false"
              :show-select-button="false"
              :allow-delete="item.canDelete"
              :allow-edit="item.canEdit"
              @select="artStore.selectArtRecord(item.art, item.artImage)"
              @edit="startEditingArt"
              @delete="handleArtDeleted"
            />

            <div
              v-if="item.art && !item.artImage"
              class="absolute left-2 top-2 z-10 rounded-full bg-warning px-2 py-1 text-xs font-bold text-warning-content shadow"
              title="This Art record does not have a resolved ArtImage yet"
            >
              Legacy Art
            </div>

            <button
              v-if="
                activeCollection && activeCollection.id !== -1 && canEditActive
              "
              class="absolute right-2 top-2 z-10 rounded-full bg-base-100/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
              type="button"
              title="Remove from collection"
              @click.stop="removeItemFromCollection(item)"
            >
              <Icon name="kind-icon:x" class="h-3 w-3 text-base-content/70" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Error strip ── -->
    <div
      v-if="localError"
      class="shrink-0 rounded-2xl bg-warning/10 p-2 text-xs text-warning"
    >
      {{ localError }}
    </div>
  </section>
</template>

<script setup lang="ts">
// /components/content/art/art-gallery.vue
import { computed, onMounted, reactive, ref } from 'vue'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import type { Art, ArtImage } from '@/stores/artStore'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

type CollectionGalleryVariant = 'dashboard' | 'row' | 'dropdown'

type GalleryArtItem = {
  art: Art | null
  artImage: ArtImage | null
  key: string
  source: 'art' | 'artImage'
  canEdit: boolean
  canDelete: boolean
}

const props = withDefaults(
  defineProps<{
    variant?: CollectionGalleryVariant
    title?: string
    subtitle?: string
    compact?: boolean
    showHeader?: boolean
    showControls?: boolean
    showSelectedPanel?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowMerge?: boolean
    allowRefresh?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Collections',
    subtitle: 'Browse, create, edit, merge, and inspect art collections.',
    compact: false,
    showHeader: true,
    showControls: true,
    showSelectedPanel: false,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowMerge: true,
    allowRefresh: true,
    autoLoad: true,
  },
)

type CollectionWithImages = ArtCollection & {
  artImages?: ArtImage[]
  ArtImages?: ArtImage[]
}

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

const mode = ref<'collections' | 'arts'>('collections')
const activeCollection = ref<ArtCollection | null>(null)

const isLoading = ref(false)
const localError = ref('')
const searchQuery = ref('')

const showCollectionForm = ref(false)
const isSavingCollection = ref(false)
const editingCollectionId = ref<number | null>(null)
const formMessage = ref('')
const formTone = ref<'success' | 'error'>('success')

const collectionForm = reactive<Partial<ArtCollection>>({
  label: '',
  description: '',
  isPublic: true,
  isMature: false,
})

const showMergePanel = ref(false)
const mergeTargetId = ref<number | null>(null)
const isMerging = ref(false)

const selectedArt = computed(() => artStore.currentArt)

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'collection-row' : 'collection-grid'
})

const currentUserId = computed(() => {
  return userStore.userId ?? userStore.user?.id ?? null
})

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return
    await userStore.updateUser({ showMature: value })
  },
})

const displayCount = computed(() => {
  if (isDropdownMode.value) return visibleCollections.value.length
  return mode.value === 'collections'
    ? visibleCollections.value.length
    : currentGalleryItems.value.length
})

const headerTitle = computed(() => {
  if (
    mode.value === 'arts' &&
    activeCollection.value &&
    !isDropdownMode.value
  ) {
    return activeCollection.value.label || 'Untitled Collection'
  }
  return props.title
})

const headerSubtitle = computed(() => {
  if (
    mode.value === 'arts' &&
    activeCollection.value &&
    !isDropdownMode.value
  ) {
    return (
      activeCollection.value.description ||
      'Browse and manage art in this collection.'
    )
  }
  if (activeCollection.value) {
    return activeCollection.value.label || props.subtitle
  }
  return props.subtitle
})

const selectedCollectionLabel = computed(() => {
  return activeCollection.value?.label || 'No collection selected'
})

const selectedCollectionSubtitle = computed(() => {
  return (
    activeCollection.value?.description ||
    'Choose a collection or add a new one.'
  )
})

const selectedCollectionArtCount = computed(() => {
  if (!activeCollection.value) return 0
  if (activeCollection.value.id === -1) return allUnassignedArt.value.length

  const collection = activeCollection.value as CollectionWithImages
  const artCount = collection.art?.length ?? 0
  const imageCount = getCollectionImages(collection).length

  return artCount + imageCount
})

const collectionFormTitle = computed(() => {
  return editingCollectionId.value ? 'Edit Collection' : 'Add Collection'
})

const collectionFormSubtitle = computed(() => {
  return editingCollectionId.value
    ? 'Update this collection without waking the gallery goblin.'
    : 'Create a new destination for generated art.'
})

const canEditActive = computed(() => canEdit(activeCollection.value))

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

const unassignedCollection = computed<ArtCollection>(() => ({
  id: -1,
  label: 'Unassigned Art',
  description: 'Art not currently assigned to any collection.',
  userId: currentUserId.value || 10,
  username: userStore.username || 'Kind Guest',
  isPublic: false,
  isMature: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  art: allUnassignedArt.value,
}))

const baseCollections = computed<ArtCollection[]>(() => {
  const realCollections = collectionStore.collections || []
  const visibleRealCollections = realCollections.filter((collection) => {
    if (userStore.isAdmin) return true
    return collection.isPublic || collection.userId === currentUserId.value
  })
  return [unassignedCollection.value, ...visibleRealCollections]
})

const visibleCollections = computed<ArtCollection[]>(() => {
  let collections = baseCollections.value

  if (!showMature.value) {
    collections = collections.filter((c) => !c.isMature)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    collections = collections.filter((c) =>
      [c.label, c.description, c.username, String(c.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }

  return collections
})

const currentArtList = computed<Art[]>(() => {
  if (!activeCollection.value) return []

  const base =
    activeCollection.value.id === -1
      ? allUnassignedArt.value
      : (activeCollection.value.art || []).filter((art) => Boolean(art?.id))

  let artList = [...base]

  if (!showMature.value) {
    artList = artList.filter((art) => !art.isMature)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    artList = artList.filter((art) =>
      [
        art.promptString,
        art.negativePrompt,
        art.designer,
        art.checkpoint,
        art.sampler,
        String(art.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }

  return artList
})

function getCollectionImages(collection: CollectionWithImages): ArtImage[] {
  const directImages = collection.artImages || collection.ArtImages || []

  return directImages.filter((image): image is ArtImage => {
    return Boolean(image?.id)
  })
}

const currentArtImageList = computed<ArtImage[]>(() => {
  if (!activeCollection.value || activeCollection.value.id === -1) return []

  const collection = activeCollection.value as CollectionWithImages
  let images = getCollectionImages(collection)

  if (!showMature.value) {
    images = images.filter((image) => !image.isMature)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    images = images.filter((image) =>
      [
        image.promptString,
        image.negativePrompt,
        image.designer,
        image.checkpoint,
        image.sampler,
        image.fileName,
        String(image.id),
        image.artId ? String(image.artId) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }

  return images
})

const artImageById = computed(() => {
  return new Map(
    artStore.artImages
      .filter((image): image is ArtImage => Boolean(image?.id))
      .map((image) => [image.id, image]),
  )
})

const artImageByArtId = computed(() => {
  const map = new Map<number, ArtImage>()
  for (const image of artStore.artImages) {
    if (image.artId) map.set(image.artId, image)
  }
  return map
})

const currentGalleryItems = computed<GalleryArtItem[]>(() => {
  const artItems = currentArtList.value.map((art) => {
    const artImage = getImageForArt(art)

    return {
      art,
      artImage,
      key: artImage ? `art-${art.id}-image-${artImage.id}` : `art-${art.id}`,
      source: 'art' as const,
      canEdit: canDeleteArt(art),
      canDelete: canDeleteArt(art),
    }
  })

  const imageItems = currentArtImageList.value.map((artImage) => {
    const linkedArt = artImage.artId
      ? artStore.art.find((art) => art.id === artImage.artId) || null
      : null

    return {
      art: linkedArt,
      artImage,
      key: `direct-image-${artImage.id}`,
      source: 'artImage' as const,
      canEdit: canDeleteArtImage(artImage),
      canDelete: canDeleteArtImage(artImage),
    }
  })

  return [...artItems, ...imageItems]
})

function getImageForArt(art: Art): ArtImage | null {
  if (art.artImageId) {
    const directImage = artImageById.value.get(art.artImageId)
    if (directImage) return directImage
  }
  return artImageByArtId.value.get(art.id) || null
}

const mergeTargetOptions = computed<ArtCollection[]>(() => {
  return collectionStore.collections.filter(
    (c) => c.id !== activeCollection.value?.id,
  )
})

onMounted(async () => {
  if (props.autoLoad) await refresh()
})

function canEdit(collection: ArtCollection | null): boolean {
  if (!collection || collection.id === -1) return false
  return (
    userStore.isAdmin ||
    Number(collection.userId) === Number(currentUserId.value)
  )
}

function canDeleteArt(art: Art): boolean {
  return userStore.isAdmin || art.userId === currentUserId.value
}

function canDeleteArtImage(image: ArtImage): boolean {
  return userStore.isAdmin || image.userId === currentUserId.value
}

async function refresh() {
  isLoading.value = true
  localError.value = ''

  try {
    await Promise.all([
      artStore.initialize({
        fetchRemote: true,
        force: true,
        hydrateImages: false,
      }),
      artStore.fetchAllArtImages({
        force: true,
        includeThumbnailData: true,
      }),
      collectionStore.fetchCollections?.(true),
    ])

    if (activeCollection.value?.id && activeCollection.value.id !== -1) {
      const freshCollection = collectionStore.collections.find((collection) => {
        return collection.id === activeCollection.value?.id
      })

      if (freshCollection) {
        activeCollection.value = freshCollection
        collectionStore.setCurrentCollection?.(freshCollection.id)
      }
    }
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to load data')
    localError.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

function selectCollectionFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  if (target.value === '__add__') {
    startAddingCollection()
    return
  }
  const id = Number(target.value)
  if (!Number.isInteger(id)) {
    clearSelectedCollection()
    return
  }
  const collection = visibleCollections.value.find((item) => item.id === id)
  if (!collection) return
  activeCollection.value =
    collection.id === -1 ? unassignedCollection.value : collection
  collectionStore.setCurrentCollection?.(collection.id)
}

function enterCollection(collection: ArtCollection) {
  activeCollection.value =
    collection.id === -1 ? unassignedCollection.value : collection
  mode.value = 'arts'
  searchQuery.value = ''
  showMergePanel.value = false
  showCollectionForm.value = false
  collectionStore.setCurrentCollection?.(collection.id)
}

function exitCollection() {
  activeCollection.value = null
  mode.value = 'collections'
  searchQuery.value = ''
  showMergePanel.value = false
  showCollectionForm.value = false
}

function clearSelectedCollection() {
  activeCollection.value = null
  mode.value = 'collections'
  showCollectionForm.value = false
  showMergePanel.value = false
  collectionStore.setCurrentCollection?.(null)
}

function clearSelectedArt() {
  artStore.deselectArt?.()
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

function startEditingActiveCollection() {
  const target = activeCollection.value
  if (!target || !canEdit(target)) return
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
    formMessage.value = 'Saved.'
    await refresh()
    closeCollectionForm()
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to save collection')
    formTone.value = 'error'
    formMessage.value = message
    errorStore.setError(ErrorType.GENERAL_ERROR, message)
  } finally {
    isSavingCollection.value = false
  }
}

async function createNewCollection() {
  const label = collectionForm.label?.trim() || 'Untitled Collection'
  const userId = currentUserId.value || 10
  const created = await collectionStore.createCollection(
    label,
    userId,
    Boolean(collectionForm.isPublic),
    Boolean(collectionForm.isMature),
  )
  if (!created?.id) throw new Error('Failed to create collection.')
  const description = collectionForm.description?.trim() || ''
  if (description) {
    const updated = await collectionStore.updateCollectionDetails(created.id, {
      description,
    })
    if (!updated)
      throw new Error('Collection created but description not saved.')
  }
  activeCollection.value = created
  collectionStore.setCurrentCollection?.(created.id)
}

async function saveExistingCollection(id: number) {
  const result = await collectionStore.updateCollectionDetails(id, {
    label: collectionForm.label?.trim() || 'Untitled Collection',
    description: collectionForm.description || '',
    isPublic: Boolean(collectionForm.isPublic),
    isMature: Boolean(collectionForm.isMature),
  })
  if (!result) throw new Error('Failed to update collection.')
  activeCollection.value = result
  collectionStore.setCurrentCollection?.(result.id)
}

async function confirmDeleteCollection() {
  const collection = activeCollection.value
  if (!collection || !canEdit(collection)) return
  const label = collection.label || 'Untitled Collection'
  if (
    !confirm(
      `Delete "${label}"? The collection is removed, but the art inside is kept.`,
    )
  ) {
    return
  }
  try {
    const result = await collectionStore.deleteCollectionById(collection.id)
    if (result) {
      exitCollection()
      await refresh()
    }
  } catch (error) {
    localError.value = getErrorMessage(error, 'Failed to delete collection')
    errorStore.setError(ErrorType.GENERAL_ERROR, localError.value)
  }
}

async function saveActiveCollectionFlags() {
  const collection = activeCollection.value
  if (!collection || !canEdit(collection)) return
  try {
    await collectionStore.updateCollectionFlags?.(collection.id, {
      isPublic: collection.isPublic,
      isMature: collection.isMature,
    })
  } catch (error) {
    errorStore.setError(
      ErrorType.GENERAL_ERROR,
      getErrorMessage(error, 'Failed to update collection flags'),
    )
  }
}

function removeArtFromCollection(artId: number) {
  const collection = activeCollection.value
  if (!collection || collection.id === -1) return
  collectionStore.removeArtFromLocalCollection?.(collection, artId)
}

function handleArtDeleted(artId: number) {
  if (artStore.currentArt?.id === artId) artStore.deselectArt?.()
}

function startEditingArt(artId: number) {
  void artStore.selectArt(artId)
}

async function startEditingImage(imageId: number) {
  const image = await artStore.getArtImageById(imageId, {
    includeImageData: true,
  })
  if (image) await artStore.selectArtImageRecord(image)
}

function selectImage(image: ArtImage) {
  void artStore.selectArtImageRecord(image)
}

function handleImageDeleted(imageId: number) {
  if (artStore.currentArtImage?.id === imageId) artStore.deselectArtImage()
}

function toggleMergePanel() {
  showMergePanel.value = !showMergePanel.value
  mergeTargetId.value = null
}

async function executeMerge() {
  const source = activeCollection.value
  const targetId = mergeTargetId.value
  if (!source || !targetId || !canEdit(source)) return
  isMerging.value = true
  localError.value = ''
  try {
    const artIds = (source.art || [])
      .map((art) => art.id)
      .filter((id): id is number => typeof id === 'number')
    await Promise.all(
      artIds.map((artId) =>
        collectionStore.addArtToCollection({ artId, collectionId: targetId }),
      ),
    )
    await collectionStore.deleteCollectionById(source.id)
    exitCollection()
    await refresh()
  } catch (error) {
    localError.value = getErrorMessage(error, 'Merge failed')
    errorStore.setError(ErrorType.GENERAL_ERROR, localError.value)
  } finally {
    isMerging.value = false
  }
}

async function removeItemFromCollection(item: GalleryArtItem) {
  if (!activeCollection.value || activeCollection.value.id === -1) return

  if (item.source === 'art' && item.art?.id) {
    await removeArtFromCollection(item.art.id)
    return
  }

  if (item.source === 'artImage' && item.artImage?.id) {
    localError.value =
      'This image is linked directly as an ArtImage. Removal support needs the ArtImage collection disconnect route next.'
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  if (typeof error === 'object' && error !== null) {
    const record = error as { message?: unknown; statusMessage?: unknown }
    const message =
      typeof record.message === 'string'
        ? record.message.trim()
        : typeof record.statusMessage === 'string'
          ? record.statusMessage.trim()
          : ''
    if (message) return message
  }
  return fallback
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

.art-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}
</style>
