<!-- /components/content/art/art-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <!-- ── Breadcrumb / back nav (arts/all mode, non-dropdown) ── -->
    <nav
      v-if="(mode === 'arts' || mode === 'all') && !isDropdownMode"
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
        {{
          mode === 'all'
            ? 'All Content'
            : activeCollection?.label || 'Untitled Collection'
        }}
      </span>

      <span class="ml-auto shrink-0 badge badge-ghost text-xs">
        {{ displayCount }} items
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

      <!-- Collections mode controls -->
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

        <div class="flex gap-2">
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="!activeCollection"
            @click="clearSelectedCollection"
          >
            <Icon name="kind-icon:x" class="h-4 w-4" />
            Clear
          </button>

          <button
            class="btn btn-outline btn-sm rounded-xl"
            type="button"
            @click="enterAllMode"
          >
            <Icon name="kind-icon:gallery" class="h-4 w-4" />
            All
          </button>
        </div>
      </div>

      <!-- Arts mode controls -->
      <div
        v-if="
          showControls && !isDropdownMode && (mode === 'arts' || mode === 'all')
        "
        class="flex flex-col gap-2"
      >
        <div class="flex gap-2">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search prompts, checkpoints..."
            class="input input-bordered input-sm w-full bg-base-100"
          />
        </div>

        <!-- Content type toggle -->
        <div class="flex items-center gap-1 rounded-xl bg-base-100 p-1">
          <button
            v-for="opt in contentModeOptions"
            :key="opt.value"
            class="btn btn-sm flex-1 rounded-lg"
            :class="contentMode === opt.value ? 'btn-primary' : 'btn-ghost'"
            type="button"
            @click="contentMode = opt.value"
          >
            <Icon :name="opt.icon" class="h-4 w-4" />
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- All-mode pagination controls -->
      <div
        v-if="showControls && !isDropdownMode && mode === 'all'"
        class="flex items-center gap-2"
      >
        <label class="label-text text-xs font-bold shrink-0">Per page:</label>
        <select
          v-model="allPageSize"
          class="select select-bordered select-xs bg-base-100"
        >
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span class="text-xs text-base-content/50 ml-auto">
          {{ allPageStart + 1 }}–{{ Math.min(allPageEnd, allItems.length) }} of
          {{ allItems.length }}
        </span>
        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          :disabled="allPage === 0"
          @click="allPage--"
        >
          <Icon name="kind-icon:arrow-left" class="h-3 w-3" />
        </button>
        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          :disabled="allPageEnd >= allItems.length"
          @click="allPage++"
        >
          <Icon name="kind-icon:arrow-right" class="h-3 w-3" />
        </button>
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
                {{ selectedCollectionArtCount }} items
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

      <!-- All-content paginated view -->
      <div v-else-if="mode === 'all'" class="flex flex-col gap-3">
        <div
          v-if="pagedAllItems.length === 0"
          class="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />
          <p class="mt-2 text-lg font-bold">Nothing here yet.</p>
          <p class="mt-1 text-sm">No art or images match the current filter.</p>
        </div>

        <div v-else class="art-grid">
          <div
            v-for="item in pagedAllItems"
            :key="item.key"
            class="group relative"
          >
            <image-card
              v-if="item.source === 'artImage' && item.artImage"
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
              v-else-if="item.source === 'art' && item.art"
              :art="item.art"
              :selected="selectedArt?.id === item.art.id"
              :compact="true"
              :show-actions="true"
              :show-prompt="false"
              :show-meta="false"
              :show-select-button="false"
              :allow-delete="item.canDelete"
              :allow-edit="item.canEdit"
              @select="artStore.selectArtRecord(item.art, null)"
              @edit="startEditingArt"
              @delete="handleArtDeleted"
            />
          </div>
        </div>

        <!-- Pagination footer -->
        <div
          v-if="allItems.length > allPageSize"
          class="flex shrink-0 items-center justify-center gap-2 pt-1"
        >
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="allPage === 0"
            @click="allPage--"
          >
            <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
            Prev
          </button>
          <span class="text-sm text-base-content/60">
            Page {{ allPage + 1 }} / {{ allPageCount }}
          </span>
          <button
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="allPageEnd >= allItems.length"
            @click="allPage++"
          >
            Next
            <Icon name="kind-icon:arrow-right" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Arts grid (collection detail view) -->
      <div v-else class="flex flex-col gap-3">
        <!-- Inline collection flags for editable collections -->
        <div
          v-if="activeCollection && canEditActive"
          class="flex shrink-0 flex-wrap items-center gap-2 rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
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
            <image-card
              v-if="item.source === 'artImage' && item.artImage"
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
              v-else-if="item.source === 'art' && item.art"
              :art="item.art"
              :selected="selectedArt?.id === item.art.id"
              :compact="true"
              :show-actions="true"
              :show-prompt="false"
              :show-meta="false"
              :show-select-button="false"
              :allow-delete="item.canDelete"
              :allow-edit="item.canEdit"
              @select="artStore.selectArtRecord(item.art, null)"
              @edit="startEditingArt"
              @delete="handleArtDeleted"
            />

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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { ArtCollection } from '@/stores/helpers/collectionHelper'
import type { Art, ArtImage } from '@/stores/artStore'
import { useArtStore } from '@/stores/artStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useUserStore } from '@/stores/userStore'

type CollectionGalleryVariant = 'dashboard' | 'row' | 'dropdown'
type ContentMode = 'art' | 'artImage' | 'both'

type GalleryItem = {
  art: Art | null
  artImage: ArtImage | null
  key: string
  source: 'art' | 'artImage'
  canEdit: boolean
  canDelete: boolean
}

const contentModeOptions: {
  value: ContentMode
  label: string
  icon: string
}[] = [
  { value: 'art', label: 'Art', icon: 'kind-icon:image' },
  { value: 'artImage', label: 'Images', icon: 'kind-icon:gallery' },
  { value: 'both', label: 'Both', icon: 'kind-icon:layers' },
]

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

const mode = ref<'collections' | 'arts' | 'all'>('collections')
const activeCollection = ref<ArtCollection | null>(null)
const contentMode = ref<ContentMode>('both')

// All-mode pagination
const allPage = ref(0)
const allPageSize = ref(20)

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
const isCompact = computed(
  () => props.compact || props.variant === 'row' || isDropdownMode.value,
)
const layoutClass = computed(() =>
  props.variant === 'row' ? 'collection-row' : 'collection-grid',
)
const currentUserId = computed(
  () => userStore.userId ?? userStore.user?.id ?? null,
)

const showMature = computed({
  get: () => userStore.user?.showMature ?? userStore.showMature ?? false,
  set: async (value: boolean) => {
    if (!userStore.user) return
    await userStore.updateUser({ showMature: value })
  },
})

// ── Collection helpers ───────────────────────────────────────────────────────

const allUnassignedArt = computed<Art[]>(() => {
  const assignedIds = new Set<number>(
    collectionStore.collections.flatMap((c) =>
      (c.art ?? [])
        .map((a) => a.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  )
  return artStore.art.filter(
    (a) => typeof a.id === 'number' && !assignedIds.has(a.id),
  )
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
  const real = (collectionStore.collections || []).filter(
    (c) => userStore.isAdmin || c.isPublic || c.userId === currentUserId.value,
  )
  return [unassignedCollection.value, ...real]
})

const visibleCollections = computed<ArtCollection[]>(() => {
  let list = baseCollections.value
  if (!showMature.value) list = list.filter((c) => !c.isMature)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter((c) =>
      [c.label, c.description, c.username, String(c.id)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }
  return list
})

function getCollectionImages(collection: CollectionWithImages): ArtImage[] {
  return (collection.artImages || collection.ArtImages || []).filter(
    (img): img is ArtImage => Boolean(img?.id),
  )
}

// ── Art / ArtImage lists for current collection ──────────────────────────────

const currentArtList = computed<Art[]>(() => {
  if (!activeCollection.value) return []
  const base =
    activeCollection.value.id === -1
      ? allUnassignedArt.value
      : (activeCollection.value.art || []).filter((a) => Boolean(a?.id))
  let list = [...base]
  if (!showMature.value) list = list.filter((a) => !a.isMature)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
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
        .includes(query),
    )
  }
  return list
})

const currentArtImageList = computed<ArtImage[]>(() => {
  if (!activeCollection.value || activeCollection.value.id === -1) return []
  const collection = activeCollection.value as CollectionWithImages
  let images = getCollectionImages(collection)
  if (!showMature.value) images = images.filter((img) => !img.isMature)
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    images = images.filter((img) =>
      [
        img.promptString,
        img.negativePrompt,
        img.designer,
        img.checkpoint,
        img.sampler,
        img.fileName,
        String(img.id),
        img.artId ? String(img.artId) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query),
    )
  }
  return images
})

// ── Gallery items for collection detail view ─────────────────────────────────

const currentGalleryItems = computed<GalleryItem[]>(() => {
  const artItems: GalleryItem[] =
    contentMode.value !== 'artImage'
      ? currentArtList.value.map((art) => ({
          art,
          artImage: null,
          key: `art-${art.id}`,
          source: 'art' as const,
          canEdit: canDeleteArt(art),
          canDelete: canDeleteArt(art),
        }))
      : []

  const imageItems: GalleryItem[] =
    contentMode.value !== 'art'
      ? currentArtImageList.value.map((artImage) => ({
          art: null,
          artImage,
          key: `direct-image-${artImage.id}`,
          source: 'artImage' as const,
          canEdit: canDeleteArtImage(artImage),
          canDelete: canDeleteArtImage(artImage),
        }))
      : []

  return [...artItems, ...imageItems]
})

// ── All-mode items ────────────────────────────────────────────────────────────

const allItems = computed<GalleryItem[]>(() => {
  const query = searchQuery.value.trim().toLowerCase()

  const artItems: GalleryItem[] =
    contentMode.value !== 'artImage'
      ? artStore.art
          .filter((a) => {
            if (!showMature.value && a.isMature) return false
            if (!query) return true
            return [
              a.promptString,
              a.designer,
              a.checkpoint,
              a.sampler,
              String(a.id),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(query)
          })
          .map((art) => ({
            art,
            artImage: null,
            key: `all-art-${art.id}`,
            source: 'art' as const,
            canEdit: canDeleteArt(art),
            canDelete: canDeleteArt(art),
          }))
      : []

  const imageItems: GalleryItem[] =
    contentMode.value !== 'art'
      ? artStore.artImages
          .filter((img) => {
            if (!showMature.value && img.isMature) return false
            if (!query) return true
            return [
              img.promptString,
              img.fileName,
              img.designer,
              img.checkpoint,
              String(img.id),
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
              .includes(query)
          })
          .map((artImage) => ({
            art: null,
            artImage,
            key: `all-image-${artImage.id}`,
            source: 'artImage' as const,
            canEdit: canDeleteArtImage(artImage),
            canDelete: canDeleteArtImage(artImage),
          }))
      : []

  return [...artItems, ...imageItems]
})

// Reset page when items or pagesize changes
watch([allItems, allPageSize], () => {
  allPage.value = 0
})

const allPageStart = computed(() => allPage.value * allPageSize.value)
const allPageEnd = computed(() => allPageStart.value + allPageSize.value)
const allPageCount = computed(() =>
  Math.max(1, Math.ceil(allItems.value.length / allPageSize.value)),
)
const pagedAllItems = computed(() =>
  allItems.value.slice(allPageStart.value, allPageEnd.value),
)

// ── Display helpers ───────────────────────────────────────────────────────────

const displayCount = computed(() => {
  if (isDropdownMode.value) return visibleCollections.value.length
  if (mode.value === 'all') return allItems.value.length
  if (mode.value === 'arts') return currentGalleryItems.value.length
  return visibleCollections.value.length
})

const headerTitle = computed(() => {
  if (mode.value === 'all' && !isDropdownMode.value) return 'All Content'
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
  if (mode.value === 'all') return 'All art and images across every collection.'
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
  if (activeCollection.value)
    return activeCollection.value.label || props.subtitle
  return props.subtitle
})

const selectedCollectionLabel = computed(
  () => activeCollection.value?.label || 'No collection selected',
)
const selectedCollectionSubtitle = computed(
  () =>
    activeCollection.value?.description ||
    'Choose a collection or add a new one.',
)

const selectedCollectionArtCount = computed(() => {
  if (!activeCollection.value) return 0
  if (activeCollection.value.id === -1) return allUnassignedArt.value.length
  const c = activeCollection.value as CollectionWithImages
  return (c.art?.length ?? 0) + getCollectionImages(c).length
})

const collectionFormTitle = computed(() =>
  editingCollectionId.value ? 'Edit Collection' : 'Add Collection',
)
const collectionFormSubtitle = computed(() =>
  editingCollectionId.value
    ? 'Update this collection without waking the gallery goblin.'
    : 'Create a new destination for generated art.',
)

const canEditActive = computed(() => canEdit(activeCollection.value))

const mergeTargetOptions = computed<ArtCollection[]>(() =>
  collectionStore.collections.filter(
    (c) => c.id !== activeCollection.value?.id,
  ),
)

// ── Permission helpers ────────────────────────────────────────────────────────

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

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (props.autoLoad) await refresh()
})

// ── Navigation ────────────────────────────────────────────────────────────────

function enterCollection(collection: ArtCollection) {
  activeCollection.value =
    collection.id === -1 ? unassignedCollection.value : collection
  mode.value = 'arts'
  searchQuery.value = ''
  showMergePanel.value = false
  showCollectionForm.value = false
  collectionStore.setCurrentCollection?.(collection.id)
}

function enterAllMode() {
  mode.value = 'all'
  allPage.value = 0
  searchQuery.value = ''
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

// ── Collection form ───────────────────────────────────────────────────────────

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

// ── Item actions ──────────────────────────────────────────────────────────────

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

async function removeItemFromCollection(item: GalleryItem) {
  if (!activeCollection.value || activeCollection.value.id === -1) return
  if (item.source === 'art' && item.art?.id) {
    removeArtFromCollection(item.art.id)
    return
  }
  if (item.source === 'artImage' && item.artImage?.id) {
    localError.value =
      'ArtImage collection disconnect route not yet implemented.'
  }
}

// ── Merge ─────────────────────────────────────────────────────────────────────

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

// ── Refresh ───────────────────────────────────────────────────────────────────

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
      artStore.fetchAllArtImages({ force: true, includeThumbnailData: true }),
      collectionStore.fetchCollections?.(true),
    ])
    if (activeCollection.value?.id && activeCollection.value.id !== -1) {
      const fresh = collectionStore.collections.find(
        (c) => c.id === activeCollection.value?.id,
      )
      if (fresh) {
        activeCollection.value = fresh
        collectionStore.setCurrentCollection?.(fresh.id)
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

// ── Utilities ─────────────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  if (typeof error === 'object' && error !== null) {
    const r = error as { message?: unknown; statusMessage?: unknown }
    const msg =
      typeof r.message === 'string'
        ? r.message.trim()
        : typeof r.statusMessage === 'string'
          ? r.statusMessage.trim()
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
