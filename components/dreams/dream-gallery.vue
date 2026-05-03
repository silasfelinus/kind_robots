<!-- /components/content/dream/dream-gallery.vue -->
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
            v-if="dreamStore.selectedDream"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{
                dreamStore.selectedDream.title ||
                `Dream ${dreamStore.selectedDream.id}`
              }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredDreams.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="scope"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter dreams by scope"
          @change="refreshDreams()"
        >
          <option value="all">All visible</option>
          <option value="mine">My dreams</option>
          <option value="public">Public only</option>
          <option value="active">Active only</option>
        </select>

        <label
          class="label cursor-pointer justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-3 py-2"
        >
          <span class="label-text text-sm font-semibold">Mature</span>
          <input
            v-model="includeMature"
            type="checkbox"
            class="toggle toggle-warning toggle-sm"
            @change="refreshDreams()"
          />
        </label>

        <label
          class="label cursor-pointer justify-between gap-3 rounded-xl border border-base-300 bg-base-100 px-3 py-2"
        >
          <span class="label-text text-sm font-semibold">Inactive</span>
          <input
            v-model="showInactive"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
            @change="refreshDreams()"
          />
        </label>

        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search dreams"
          placeholder="Search dreams..."
          class="input input-bordered input-sm w-full bg-base-100"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!dreamStore.selectedDream"
          @click="startEditingDream"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          v-if="allowClone"
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!dreamStore.selectedDream"
          @click="cloneSelectedDream"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Clone
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!dreamStore.selectedDream"
          @click="clearSelectedDream"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading"
          @click="refreshDreams(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showDreamForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closeDreamForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-dream :mode="formMode" @saved="handleDreamSaved" />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || dreamStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="dreamStore.error"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ dreamStore.error }}
        </p>
      </div>

      <div
        v-else-if="filteredDreams.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:moon" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No dreams found.</p>
          <p class="mt-1 text-sm">
            The dream shelf is empty, or the filters are being theatrical.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingDream"
        >
          Add a dream
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="dreamStore.selectedDream?.id ?? ''"
          aria-label="Select dream"
          @change="selectDreamFromEvent"
        >
          <option value="">Choose a dream</option>

          <option
            v-for="dream in filteredDreams"
            :key="dream.id"
            :value="dream.id"
          >
            {{ dream.title || `Dream ${dream.id}` }}
          </option>
        </select>
      </div>

      <div v-else :class="layoutClass">
        <dream-card
          v-for="dream in filteredDreams"
          :key="dream.id"
          :dream="dream"
          :selected="dreamStore.selectedDream?.id === dream.id"
          :compact="isCompact"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-description="showDescriptions"
          :show-meta="showMeta"
          :show-stats="showStats"
          :show-open-button="showOpenButton"
          :show-debug="showDebug"
          :allow-edit="allowEdit"
          :allow-clone="allowClone"
          :allow-delete="allowDelete"
          @select="selectDream"
          @edit="startEditingDreamById"
          @clone="cloneDreamById"
          @delete="handleDreamDeleted"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type DreamScope = 'all' | 'mine' | 'public' | 'active'

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
    showStats?: boolean
    showOpenButton?: boolean
    showDebug?: boolean
    allowAdd?: boolean
    allowEdit?: boolean
    allowClone?: boolean
    allowDelete?: boolean
    allowRefresh?: boolean
    compact?: boolean
    autoLoad?: boolean
  }>(),
  {
    variant: 'dashboard',
    title: 'Dreams',
    subtitle: 'Browse, select, edit, and continue shared dreams.',
    showImages: true,
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showDescriptions: true,
    showMeta: true,
    showStats: true,
    showOpenButton: true,
    showDebug: false,
    allowAdd: true,
    allowEdit: true,
    allowClone: true,
    allowDelete: true,
    allowRefresh: true,
    compact: false,
    autoLoad: true,
  },
)

const dreamStore = useDreamStore()
const userStore = useUserStore()

const scope = ref<DreamScope>('all')
const includeMature = ref(false)
const showInactive = ref(false)
const searchQuery = ref('')
const isLoading = ref(false)
const showDreamForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const title = computed(() => props.title)
const subtitle = computed(() => props.subtitle)
const showImages = computed(() => props.showImages)
const showCardActions = computed(() => props.showCardActions)
const showDescriptions = computed(() => props.showDescriptions)
const showMeta = computed(() => props.showMeta)
const showStats = computed(() => props.showStats)
const showOpenButton = computed(() => props.showOpenButton)
const showDebug = computed(() => props.showDebug)
const allowEdit = computed(() => props.allowEdit)
const allowClone = computed(() => props.allowClone)
const allowDelete = computed(() => props.allowDelete)

const isCompact = computed(
  () =>
    props.compact || props.variant === 'row' || props.variant === 'dropdown',
)

const formTitle = computed(() =>
  formMode.value === 'edit' ? 'Edit Dream' : 'Add Dream',
)

const layoutClass = computed(() =>
  props.variant === 'row' ? 'dream-row' : 'dream-grid',
)

const filteredDreams = computed<DreamWithRelations[]>(() => {
  let dreams = dreamStore.dreams

  if (scope.value === 'mine') {
    dreams = dreams.filter((dream) => dream.userId === userStore.userId)
  }

  if (scope.value === 'public') {
    dreams = dreams.filter((dream) => dream.isPublic)
  }

  if (scope.value === 'active') {
    dreams = dreams.filter((dream) => dream.isActive)
  }

  if (!includeMature.value) {
    dreams = dreams.filter((dream) => !dream.isMature)
  }

  if (!showInactive.value) {
    dreams = dreams.filter((dream) => dream.isActive)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    dreams = dreams.filter((dream) => {
      const haystack = [
        dream.title,
        dream.slug,
        dream.description,
        dream.currentVibe,
        dream.currentPrompt,
        dream.User?.username,
        dream.Scenario?.title,
        dream.Pitch?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return dreams
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshDreams()
  }
})

async function refreshDreams(force = false) {
  isLoading.value = true

  try {
    await dreamStore.initialize(force)

    await dreamStore.fetchDreams({
      userOnly: scope.value === 'mine',
      includeMature: includeMature.value,
      showInactive: showInactive.value,
    })
  } finally {
    isLoading.value = false
  }
}

async function selectDream(id: number) {
  await dreamStore.selectDreamById(id)
}

function selectDreamFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedDream()
    return
  }

  void selectDream(id)
}

function startAddingDream() {
  dreamStore.startAddingDream()
  formMode.value = 'add'
  showDreamForm.value = true
}

async function startEditingDream() {
  const id = dreamStore.selectedDream?.id

  if (!id) return

  await startEditingDreamById(id)
}

async function startEditingDreamById(id: number) {
  const dream = await dreamStore.startEditingDream(id)

  if (!dream) return

  formMode.value = 'edit'
  showDreamForm.value = true
}

function cloneSelectedDream() {
  const id = dreamStore.selectedDream?.id

  if (!id) return

  cloneDreamById(id)
}

function cloneDreamById(id: number) {
  const dream = dreamStore.startCloningDream(id)

  if (!dream) return

  formMode.value = 'add'
  showDreamForm.value = true
}

function clearSelectedDream() {
  dreamStore.deselectDream()
  showDreamForm.value = false
}

function closeDreamForm() {
  showDreamForm.value = false
}

async function handleDreamSaved() {
  showDreamForm.value = false
  await refreshDreams(true)
}

function handleDreamDeleted(id: number) {
  if (dreamStore.selectedDream?.id === id) {
    dreamStore.deselectDream()
  }
}
</script>

<style scoped>
.dream-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
}

.dream-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.dream-row > * {
  min-width: min(260px, 85vw);
  max-width: 380px;
}
</style>
