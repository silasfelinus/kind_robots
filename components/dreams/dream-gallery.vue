<!-- /components/content/dream/dream-gallery.vue -->
<template>
  <section
    class="flex h-full w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
  >
    <header
      v-if="showHeader"
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
              {{ selectedDreamTitle }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="!isLoading && !dreamStore.loading"
            class="badge badge-ghost"
          >
            {{ filteredDreams.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingDream"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || dreamStore.loading"
            @click="refreshDreams(true)"
          >
            <span
              v-if="isLoading || dreamStore.loading"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <div
        v-if="showControls && !isDropdownMode"
        class="grid grid-cols-1 gap-2 lg:grid-cols-[auto_auto_minmax(0,1fr)_auto]"
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

        <label
          class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-100 px-4 py-2"
        >
          <span class="label-text font-bold">Inactive</span>

          <input
            v-model="showInactive"
            type="checkbox"
            class="toggle toggle-primary toggle-sm"
          />
        </label>

        <input
          v-model="searchQuery"
          type="search"
          aria-label="Search dreams"
          placeholder="Search dreams..."
          class="input input-bordered input-sm w-full bg-base-100"
        />

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!dreamStore.selectedDream"
          @click="clearSelectedDream"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showDreamForm"
      class="shrink-0 rounded-2xl border border-primary/30 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="truncate text-base font-black text-primary">
            {{ formTitle }}
          </h3>

          <p class="text-sm text-base-content/60">
            {{ formSubtitle }}
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="closeDreamForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
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

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:moon" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Dream
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedDreamTitle }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedDreamSubtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canCloneSelected"
                class="btn btn-accent btn-sm rounded-xl"
                type="button"
                @click="cloneSelectedDream"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                <span class="hidden sm:inline">Clone</span>
              </button>

              <button
                v-if="canEditSelected"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingDream"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                <span class="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
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
              {{ getDreamTitle(dream) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Dream</option>
          </select>

          <div
            v-if="dreamStore.selectedDream"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedDreamDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="dreamStore.selectedDream.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="dreamStore.selectedDream.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="dreamStore.selectedDream.isActive"
                class="badge badge-success badge-sm"
              >
                Active
              </span>

              <span v-else class="badge badge-neutral badge-sm">
                Inactive
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredDreams.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:moon" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No dreams found.</p>
          <p class="mt-1 text-sm">
            No public or owned dreams match this gallery.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingDream"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add Dream
        </button>
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
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DreamWithRelations } from '@/stores/dreamStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showHeader?: boolean
    showImages?: boolean
    showControls?: boolean
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
    showHeader: true,
    showImages: true,
    showControls: true,
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

const showInactive = ref(false)
const searchQuery = ref('')
const isLoading = ref(false)
const showDreamForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'dream-row' : 'dream-grid'
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

const selectedDream = computed(() => {
  return dreamStore.selectedDream
})

const selectedDreamTitle = computed(() => {
  return selectedDream.value
    ? getDreamTitle(selectedDream.value)
    : 'No dream selected'
})

const selectedDreamSubtitle = computed(() => {
  const dream = selectedDream.value

  if (!dream) return 'Choose a dream or add a new one.'

  return (
    dream.slug ||
    dream.Scenario?.title ||
    dream.Pitch?.title ||
    dream.description ||
    'Dream selected.'
  )
})

const selectedDreamDescription = computed(() => {
  const dream = selectedDream.value

  if (!dream) return 'No dream selected.'

  return (
    dream.description ||
    dream.currentVibe ||
    dream.currentPrompt ||
    'No dream description yet.'
  )
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Dream' : 'Add Dream'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this dream without waking the whole lab.'
    : 'Create a collaborative dream session.'
})

const canEditSelected = computed(() => {
  const dream = selectedDream.value

  if (!props.allowEdit || !dream?.id) return false
  if (userStore.isAdmin) return true

  return dream.userId === currentUserId.value
})

const canCloneSelected = computed(() => {
  return Boolean(props.allowClone && selectedDream.value?.id)
})

const galleryDreams = computed<DreamWithRelations[]>(() => {
  let dreams = dreamStore.dreams

  if (!userStore.isAdmin) {
    dreams = dreams.filter((dream) => {
      return dream.isPublic || dream.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    dreams = dreams.filter((dream) => !dream.isMature)
  }

  if (!showInactive.value) {
    dreams = dreams.filter((dream) => dream.isActive)
  }

  return dreams
})

const filteredDreams = computed<DreamWithRelations[]>(() => {
  let dreams = galleryDreams.value

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
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

function getDreamTitle(dream: DreamWithRelations) {
  return dream.title || `Dream ${dream.id}`
}

async function refreshDreams(force = false) {
  isLoading.value = true

  try {
    await dreamStore.initialize(force)

    await dreamStore.fetchDreams({
      userOnly: false,
      includeMature: showMature.value,
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

  if (target.value === '__add__') {
    startAddingDream()
    return
  }

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
