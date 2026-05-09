<!-- /components/content/art/collection-gallery.vue -->
<!--
  Unified collection + art browser.
  Replaces both collection-gallery.vue and art-gallery.vue.

  Modes:
    'collections' — grid of collection-card entries (default)
    'arts'        — art grid within a selected collection

  Virtual collection id=-1 ("Unassigned Art") shows art not in any real collection.
  Permissions: edit/delete gated on userId match OR userStore.isAdmin.

  NOTE: removeArtFromCollection currently only updates local state via
  collectionStore.removeArtFromLocalCollection. Wire an API call there if
  the store gains a persistent endpoint.
-->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <!-- ── HEADER ─────────────────────────────────────────────────── -->
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <!-- Title row -->
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-center gap-2">
          <button
            v-if="mode === 'arts'"
            class="btn btn-ghost btn-sm shrink-0 rounded-xl"
            type="button"
            title="Back to collections"
            @click="exitCollection"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
          </button>

          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold text-base-content">
              {{ headerTitle }}
            </h2>

            <p class="text-sm text-base-content/60">
              {{ headerSubtitle }}
            </p>
          </div>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{
            mode === 'collections'
              ? visibleCollections.length
              : currentArtList.length
          }}
        </span>
      </div>

      <!-- Controls -->
      <div
        v-if="showControls"
        class="grid grid-cols-1 gap-2 md:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
      >
        <!-- Scope selector only meaningful in collection mode -->
        <select
          v-if="mode === 'collections'"
          v-model="scope"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Filter scope"
        >
          <option value="visible">Visible</option>
          <option value="mine">Mine</option>
          <option value="public">Public</option>
          <option value="all">All loaded</option>
        </select>

        <span v-else class="self-center text-sm text-base-content/50">
          {{ activeCollection?.username || 'Unknown user' }}
        </span>

        <select
          v-model="matureFilter"
          class="select select-bordered select-sm bg-base-100"
          aria-label="Mature filter"
        >
          <option value="allowed">Allowed</option>
          <option value="safe">Safe only</option>
          <option value="mature">Mature only</option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          :placeholder="
            mode === 'collections'
              ? 'Search collections…'
              : 'Search prompts, checkpoints…'
          "
          class="input input-bordered input-sm w-full bg-base-100"
        />

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refresh"
        >
          <span v-if="isLoading" class="loading loading-spinner loading-xs" />
          <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>

      <!-- Toolbar: collections mode -->
      <div
        v-if="showToolbar && mode === 'collections'"
        class="flex flex-wrap gap-2"
      >
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingCollection"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Collection
        </button>
      </div>

      <!-- Toolbar: arts mode (owner/admin only) -->
      <div
        v-if="showToolbar && mode === 'arts' && canEditActive"
        class="flex flex-wrap gap-2"
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
          Delete Collection
        </button>
      </div>
    </header>

    <!-- ── COLLECTION FORM ────────────────────────────────────────── -->
    <section
      v-if="showCollectionForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ editingCollectionId ? 'Edit Collection' : 'Add Collection' }}
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

    <!-- ── MERGE PANEL ────────────────────────────────────────────── -->
    <section
      v-if="showMergePanel && activeCollection"
      class="rounded-2xl border border-accent/40 bg-accent/10 p-3 shadow-md"
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
        All art moves to the target collection. This collection is then deleted.
      </p>

      <div class="flex gap-2">
        <select
          v-model="mergeTargetId"
          class="select select-bordered select-sm flex-1 bg-base-100"
        >
          <option :value="null">Select target…</option>

          <option v-for="c in mergeTargetOptions" :key="c.id" :value="c.id">
            {{ c.label || `Collection #${c.id}` }}
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

    <!-- ── MAIN CONTENT ───────────────────────────────────────────── -->
    <section class="min-h-0 flex-1 overflow-auto">
      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
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
            The filing goblin found only vibes and lint.
          </p>

          <button
            v-if="allowAdd"
            class="btn btn-primary btn-sm mt-4 rounded-xl"
            type="button"
            @click="startAddingCollection"
          >
            Create a Collection
          </button>
        </div>

        <div v-else :class="layoutClass">
          <div
            v-for="collection in visibleCollections"
            :key="collection.id"
            class="cursor-pointer"
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
          </div>
        </div>
      </div>

      <!-- Arts view -->
      <div v-else class="flex flex-col gap-3">
        <!-- Inline flags for owner/admin -->
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

        <!-- Empty state -->
        <div
          v-if="currentArtList.length === 0"
          class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

          <p class="mt-2 text-lg font-bold">No art here.</p>

          <p class="mt-1 text-sm">
            The gallery goblin found only vibes and lint.
          </p>
        </div>

        <!-- Art grid -->
        <div v-else class="art-grid">
          <div
            v-for="art in currentArtList"
            :key="art.id"
            class="group relative"
          >
            <art-card
              :art="art"
              :compact="true"
              :show-actions="true"
              :show-prompt="false"
              :show-meta="false"
              :show-select-button="false"
              :allow-delete="canDeleteArt(art)"
              :allow-edit="canDeleteArt(art)"
              @edit="startEditingArt"
              @delete="handleArtDeleted"
            />

            <!-- Remove-from-collection overlay (not shown for virtual unassigned collection) -->
            <button
              v-if="
                activeCollection && activeCollection.id !== -1 && canEditActive
              "
              class="absolute right-2 top-2 z-10 rounded-full bg-base-100/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100"
              type="button"
              title="Remove from collection (does not delete art)"
              @click.stop="removeArtFromCollection(art.id)"
            >
              <Icon name="kind-icon:x" class="h-3 w-3 text-base-content/70" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Error bar -->
    <div
      v-if="localError"
      class="shrink-0 rounded-2xl bg-warning/10 p-2 text-xs text-warning"
    >
      {{ localError }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Art } from '~/prisma/generated/prisma/client'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useUserStore } from '@/stores/userStore'

type CollectionGalleryVariant = 'dashboard' | 'row'
type CollectionScope = 'visible' | 'mine' | 'public' | 'all'
type MatureFilter = 'allowed' | 'safe' | 'mature'

const props = withDefaults(
  defineProps<{
    variant?: CollectionGalleryVariant
    title?: string
    compact?: boolean
    showControls?: boolean
    showToolbar?: boolean
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
    compact: false,
    showControls: true,
    showToolbar: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowMerge: true,
    allowRefresh: true,
    autoLoad: true,
  },
)

const artStore = useArtStore()
const collectionStore = useCollectionStore()
const errorStore = useErrorStore()
const userStore = useUserStore()

// ── Mode & active collection ────────────────────────────────────────
const mode = ref<'collections' | 'arts'>('collections')
const activeCollection = ref<ArtCollection | null>(null)

// ── UI state ────────────────────────────────────────────────────────
const isLoading = ref(false)
const localError = ref('')
const scope = ref<CollectionScope>('visible')
const matureFilter = ref<MatureFilter>('allowed')
const searchQuery = ref('')

// ── Collection form ─────────────────────────────────────────────────
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

// ── Merge state ─────────────────────────────────────────────────────
const showMergePanel = ref(false)
const mergeTargetId = ref<number | null>(null)
const isMerging = ref(false)

// ── Layout ──────────────────────────────────────────────────────────
const isCompact = computed(() => props.compact || props.variant === 'row')

const layoutClass = computed(() =>
  props.variant === 'row' ? 'collection-row' : 'collection-grid',
)

const showMature = computed(() =>
  Boolean(userStore.showMature && matureFilter.value !== 'safe'),
)

// ── Header ──────────────────────────────────────────────────────────
const headerTitle = computed(() => {
  if (mode.value === 'arts' && activeCollection.value) {
    return activeCollection.value.label || 'Untitled Collection'
  }
  return props.title
})

const headerSubtitle = computed(() => {
  if (mode.value === 'arts' && activeCollection.value) {
    return (
      activeCollection.value.description ||
      'Browse and manage art in this collection.'
    )
  }
  const n = visibleCollections.value.length
  return `${n} collection${n === 1 ? '' : 's'}`
})

// ── Permissions ─────────────────────────────────────────────────────
const canEditActive = computed(() => canEdit(activeCollection.value))

function canEdit(collection: ArtCollection | null): boolean {
  if (!collection || collection.id === -1) return false
  return userStore.isAdmin || collection.userId === userStore.userId
}

function canDeleteArt(art: Art): boolean {
  return userStore.isAdmin || art.userId === userStore.userId
}

// ── Virtual "unassigned" collection ────────────────────────────────
const allUnassignedArt = computed<Art[]>(() => {
  const assignedIds = new Set<number>(
    collectionStore.collections.flatMap((c) =>
      (c.art ?? [])
        .map((a) => a.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  )
  return artStore.art.filter(
    (art) => typeof art.id === 'number' && !assignedIds.has(art.id),
  )
})

const unassignedCollection = computed<ArtCollection>(() => ({
  id: -1,
  label: 'Unassigned Art',
  description: 'Art not currently assigned to any collection.',
  userId: userStore.userId || 10,
  username: userStore.username || 'Kind Guest',
  isPublic: false,
  isMature: false,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  art: allUnassignedArt.value,
}))

// ── Collections list ────────────────────────────────────────────────
const baseCollections = computed<ArtCollection[]>(() => {
  const real = collectionStore.collections || []

  if (scope.value === 'mine') {
    return real.filter((c) => c.userId === userStore.userId)
  }
  if (scope.value === 'public') {
    return real.filter((c) => c.isPublic)
  }
  if (scope.value === 'all') {
    return [unassignedCollection.value, ...real]
  }
  // 'visible': user's own + public + admin sees all
  return [
    unassignedCollection.value,
    ...real.filter(
      (c) => c.isPublic || c.userId === userStore.userId || userStore.isAdmin,
    ),
  ]
})

const visibleCollections = computed<ArtCollection[]>(() => {
  let list = baseCollections.value

  if (matureFilter.value === 'safe') list = list.filter((c) => !c.isMature)
  if (matureFilter.value === 'mature') list = list.filter((c) => c.isMature)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((c) =>
      [c.label, c.description, c.username, String(c.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }

  return list
})

// ── Art within active collection ────────────────────────────────────
const currentArtList = computed<Art[]>(() => {
  if (!activeCollection.value) return []

  const base =
    activeCollection.value.id === -1
      ? allUnassignedArt.value
      : (activeCollection.value.art || []).filter((a) => Boolean(a?.id))

  let list = [...base]

  if (!showMature.value) list = list.filter((a) => !a.isMature)
  if (matureFilter.value === 'mature') list = list.filter((a) => a.isMature)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter((a) =>
      [
        a.promptString,
        a.negativePrompt,
        a.designer,
        a.checkpoint,
        a.sampler,
        String(a.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }

  return list
})

// ── Merge targets (other real collections) ─────────────────────────
const mergeTargetOptions = computed<ArtCollection[]>(() =>
  collectionStore.collections.filter(
    (c) => c.id !== activeCollection.value?.id,
  ),
)

// ── Lifecycle ───────────────────────────────────────────────────────
onMounted(async () => {
  if (props.autoLoad) await refresh()
})

// ── Data ────────────────────────────────────────────────────────────
async function refresh() {
  isLoading.value = true
  localError.value = ''

  try {
    await Promise.all([
      artStore.initialize({ fetchRemote: true, hydrateImages: false }),
      collectionStore.fetchCollections?.(),
    ])
  } catch (error) {
    const message = getErrorMessage(error, 'Failed to load data')
    localError.value = message
    errorStore.setError(ErrorType.NETWORK_ERROR, message)
  } finally {
    isLoading.value = false
  }
}

// ── Navigation ──────────────────────────────────────────────────────
function enterCollection(collection: ArtCollection) {
  // For the virtual unassigned collection, don't hold a stale ref —
  // currentArtList will derive from allUnassignedArt when id === -1.
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

// ── Collection CRUD ─────────────────────────────────────────────────
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
  const userId = userStore.userId || 10

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
}

async function saveExistingCollection(id: number) {
  const result = await collectionStore.updateCollectionDetails(id, {
    label: collectionForm.label?.trim() || 'Untitled Collection',
    description: collectionForm.description || '',
    isPublic: Boolean(collectionForm.isPublic),
    isMature: Boolean(collectionForm.isMature),
  })
  if (!result) throw new Error('Failed to update collection.')
}

async function confirmDeleteCollection() {
  const collection = activeCollection.value
  if (!collection || !canEdit(collection)) return

  const label = collection.label || 'Untitled Collection'
  if (
    !confirm(
      `Delete "${label}"? The collection is removed, but the art inside is kept.`,
    )
  )
    return

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

// ── Art in collection ───────────────────────────────────────────────
function removeArtFromCollection(artId: number) {
  const collection = activeCollection.value
  if (!collection || collection.id === -1) return
  // Updates local state only. Add an API call here if the store gains
  // a persistent removeArt endpoint.
  collectionStore.removeArtFromLocalCollection?.(collection, artId)
}

function handleArtDeleted(artId: number) {
  if (artStore.currentArt?.id === artId) {
    artStore.deselectArt?.()
  }
}

function startEditingArt(artId: number) {
  void artStore.selectArt(artId)
}

// ── Merge ───────────────────────────────────────────────────────────
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
      .map((a) => a.id)
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

// ── Helpers ─────────────────────────────────────────────────────────
function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error

  if (typeof error === 'object' && error !== null) {
    const rec = error as { message?: unknown; statusMessage?: unknown }
    const msg =
      typeof rec.message === 'string'
        ? rec.message.trim()
        : typeof rec.statusMessage === 'string'
          ? rec.statusMessage.trim()
          : ''
    if (msg) return msg
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
