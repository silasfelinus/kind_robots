<!-- /components/content/composition/composition-gallery.vue -->
<template>
  <div class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3">
    <header
      class="flex shrink-0 flex-col gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="truncate text-lg font-bold text-base-content">
            {{ title }}
          </h2>
          <p
            v-if="compositionStore.selected"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">{{
              compositionStore.selected.title || 'Untitled'
            }}</span>
          </p>
          <p v-else class="text-sm text-base-content/60">{{ subtitle }}</p>
        </div>
        <span v-if="!isLoading" class="badge badge-ghost shrink-0">{{
          filteredCompositions.length
        }}</span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="selectedScope"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
        >
          <option value="all">All</option>
          <option value="mine">Mine</option>
          <option value="public">Public</option>
        </select>
        <select
          v-model="selectedMode"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
        >
          <option value="all">All modes</option>
          <option value="both">Both</option>
          <option value="narrative">Narrative</option>
          <option value="art">Art</option>
        </select>
        <select
          v-model="synthesizedFilter"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
        >
          <option value="all">All states</option>
          <option value="synthesized">Synthesized</option>
          <option value="pending">Not synthesized</option>
        </select>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search compositions..."
          class="input input-bordered input-sm w-full bg-base-100"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingComposition"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" /> Add
        </button>
        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!compositionStore.selected"
          @click="startEditingComposition"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" /> Edit
        </button>
        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!compositionStore.selected"
          @click="clearSelected"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" /> Clear
        </button>
        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refresh(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" /> Refresh
        </button>
      </div>
    </header>

    <!-- Inline form -->
    <section
      v-if="showForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formMode === 'edit' ? 'Edit' : 'Add' }} Composition
        </h3>
        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closeForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>
      <add-composition :mode="formMode" @saved="handleSaved" />
    </section>

    <!-- List -->
    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>

      <div
        v-else-if="compositionStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">{{ compositionStore.error }}</p>
      </div>

      <div
        v-else-if="filteredCompositions.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:sparkles" class="h-10 w-10" />
        <p class="text-lg font-bold">No compositions found.</p>
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingComposition"
        >
          Create one
        </button>
      </div>

      <div v-else :class="layoutClass">
        <composition-card
          v-for="comp in filteredCompositions"
          :key="comp.id"
          :composition="comp"
          :selected="compositionStore.selected?.id === comp.id"
          :show-image="showImages"
          :compact="isCompact"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :allow-edit="allowEdit"
          :allow-delete="allowDelete"
          @edit="startEditingById"
          @delete="handleDeleted"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCompositionStore } from '@/stores/compositionStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showImages?: boolean
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showDescriptions?: boolean
    showMeta?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Compositions',
    subtitle: 'Select a composition to synthesize.',
    showImages: true,
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    allowAdd: true,
    allowEdit: true,
    allowDelete: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const compositionStore = useCompositionStore()
const userStore = useUserStore()

const selectedScope = ref<'all' | 'mine' | 'public'>('all')
const selectedMode = ref('all')
const synthesizedFilter = ref('all')
const searchQuery = ref('')
const isLoading = ref(false)
const showForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isCompact = computed(() => props.compact || props.variant === 'row')
const layoutClass = computed(() =>
  props.variant === 'row' ? 'composition-row' : 'composition-grid',
)

const filteredCompositions = computed(() => {
  let items = compositionStore.items

  if (selectedScope.value === 'mine')
    items = items.filter((c) => c.userId === userStore.userId)
  if (selectedScope.value === 'public') items = items.filter((c) => c.isPublic)
  if (selectedMode.value !== 'all')
    items = items.filter((c) => c.mode === selectedMode.value)

  if (synthesizedFilter.value === 'synthesized')
    items = items.filter((c) => c.narrativeText || c.artPrompt)
  if (synthesizedFilter.value === 'pending')
    items = items.filter((c) => !c.narrativeText && !c.artPrompt)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    items = items.filter(
      (c) =>
        (c.title || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.label || '').toLowerCase().includes(q),
    )
  }

  return items
})

onMounted(async () => {
  if (props.autoLoad) await refresh()
})

async function refresh(force = false) {
  isLoading.value = true
  try {
    await compositionStore.initialize({ force, fetchRemote: true })
  } finally {
    isLoading.value = false
  }
}

function startAddingComposition() {
  compositionStore.startAddingModel()
  formMode.value = 'add'
  showForm.value = true
}

async function startEditingComposition() {
  const id = compositionStore.selected?.id
  if (!id) return
  await startEditingById(id)
}

async function startEditingById(id: number) {
  const item = await compositionStore.startEditingModel(id)
  if (!item) return
  formMode.value = 'edit'
  showForm.value = true
}

function clearSelected() {
  compositionStore.deselectModel()
  showForm.value = false
}

function closeForm() {
  showForm.value = false
}

async function handleSaved() {
  showForm.value = false
  await refresh(true)
}

function handleDeleted(id: number) {
  if (compositionStore.selected?.id === id) compositionStore.deselectModel()
}
</script>

<style scoped>
.composition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
}
.composition-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}
.composition-row > * {
  min-width: min(260px, 85vw);
  max-width: 360px;
}
</style>
