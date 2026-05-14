<!-- /components/content/brainstorm/pitch-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-3 rounded-2xl bg-base-300 p-3"
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
            v-if="pitchStore.selectedPitch"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ selectedPitchLabel }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="!isLoading && !pitchStore.loading"
            class="badge badge-ghost"
          >
            {{ filteredPitches.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingPitch"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || pitchStore.loading"
            @click="refreshPitches(true)"
          >
            <span
              v-if="isLoading || pitchStore.loading"
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

        <select
          v-model="selectedPitchType"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter pitches by pitch type"
        >
          <option value="">All types</option>

          <option
            v-for="pitchType in pitchStore.pitchTypes"
            :key="pitchType"
            :value="pitchType"
          >
            {{ pitchType }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search pitches..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search pitches"
        />

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!pitchStore.selectedPitch"
          @click="clearSelectedPitch"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showPitchForm"
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
          @click="closePitchForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
        </button>
      </div>

      <add-pitch
        :mode="formMode"
        @saved="handlePitchSaved"
        @cancel="closePitchForm"
      />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || pitchStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="pitchStore.lastError"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ pitchStore.lastError }}
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
                <Icon name="kind-icon:idea" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Pitch
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedPitchLabel }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedPitchSubtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canBrainstormSelected"
                class="btn btn-info btn-sm rounded-xl"
                type="button"
                @click="brainstormSelectedPitch"
              >
                <Icon name="kind-icon:brain" class="h-4 w-4" />
                <span class="hidden sm:inline">Brainstorm</span>
              </button>

              <button
                v-if="canCloneSelected"
                class="btn btn-accent btn-sm rounded-xl"
                type="button"
                @click="cloneSelectedPitch"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                <span class="hidden sm:inline">Clone</span>
              </button>

              <button
                v-if="canEditSelected"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingSelectedPitch"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                <span class="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
            :value="pitchStore.selectedPitch?.id ?? ''"
            aria-label="Select pitch"
            @change="selectPitchFromEvent"
          >
            <option value="">Choose a pitch</option>

            <option
              v-for="pitch in filteredPitches"
              :key="pitch.id"
              :value="pitch.id"
            >
              {{ getPitchLabel(pitch) }}
            </option>

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Pitch</option>
          </select>

          <div
            v-if="pitchStore.selectedPitch"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedPitchDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="pitchStore.selectedPitch.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="pitchStore.selectedPitch.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span class="badge badge-secondary badge-sm">
                {{ pitchStore.selectedPitch.PitchType }}
              </span>

              <span
                v-if="pitchStore.selectedPitch.creationSource"
                class="badge badge-outline badge-sm"
              >
                {{ pitchStore.selectedPitch.creationSource }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredPitches.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:idea" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No pitches found.</p>

          <p class="mt-1 text-sm">
            No public or owned pitches match this gallery.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingPitch"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Create Pitch
        </button>
      </div>

      <div v-else :class="layoutClass">
        <pitch-card
          v-for="pitch in filteredPitches"
          :key="pitch.id"
          :pitch="pitch"
          :selected="pitchStore.selectedPitch?.id === pitch.id"
          :compact="isCompact"
          :show-image="showImages"
          :show-actions="showCardActions"
          :show-pitch="showPitch"
          :show-description="showDescriptions"
          :show-flavor="showFlavor"
          :show-examples="showExamples"
          :show-prompts="showPrompts"
          :show-meta="showMeta"
          :show-launch-button="showLaunchButton"
          :show-debug="showDebug"
          :allow-edit="allowEdit"
          :allow-clone="allowClone"
          :allow-delete="allowDelete"
          @edit="startEditingPitchById"
          @clone="clonePitchById"
          @delete="handlePitchDeleted"
          @brainstorm="handlePitchBrainstorm"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Pitch } from '~/prisma/generated/prisma/client'
import { useNavStore } from '@/stores/navStore'
import { PitchType, usePitchStore } from '@/stores/pitchStore'
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
    showPitch?: boolean
    showDescriptions?: boolean
    showFlavor?: boolean
    showExamples?: boolean
    showPrompts?: boolean
    showMeta?: boolean
    showLaunchButton?: boolean
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
    title: 'Pitches',
    subtitle: 'Browse, select, add, edit, clone, or brainstorm big ideas.',
    showHeader: true,
    showImages: true,
    showControls: true,
    showCardActions: true,
    showPitch: true,
    showDescriptions: true,
    showFlavor: true,
    showExamples: true,
    showPrompts: true,
    showMeta: true,
    showLaunchButton: true,
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

const pitchStore = usePitchStore()
const userStore = useUserStore()
const navStore = useNavStore()

const selectedPitchType = ref<PitchType | ''>('')
const searchQuery = ref('')
const isLoading = ref(false)
const showPitchForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'pitch-row' : 'pitch-grid'
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

const selectedPitch = computed(() => {
  return pitchStore.selectedPitch
})

const selectedPitchLabel = computed(() => {
  return selectedPitch.value
    ? getPitchLabel(selectedPitch.value)
    : 'No pitch selected'
})

const selectedPitchSubtitle = computed(() => {
  const pitch = selectedPitch.value

  if (!pitch) return 'Choose a pitch or add a new one.'

  return pitch.PitchType || pitch.creationSource || 'Pitch selected.'
})

const selectedPitchDescription = computed(() => {
  const pitch = selectedPitch.value

  if (!pitch) return 'No pitch selected.'

  return (
    pitch.description ||
    pitch.pitch ||
    pitch.flavorText ||
    pitch.examples ||
    'No pitch description yet.'
  )
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Pitch' : 'Add Pitch'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this big idea before the idea moths get attached.'
    : 'Create a big-picture idea for prompts, art, or story fuel.'
})

const canEditSelected = computed(() => {
  const pitch = selectedPitch.value

  if (!props.allowEdit || !pitch?.id) return false
  if (userStore.isAdmin) return true

  return pitch.userId === currentUserId.value
})

const canCloneSelected = computed(() => {
  return Boolean(props.allowClone && selectedPitch.value?.id)
})

const canBrainstormSelected = computed(() => {
  return Boolean(selectedPitch.value?.id)
})

const galleryPitches = computed<Pitch[]>(() => {
  let pitches = pitchStore.pitches

  if (!userStore.isAdmin) {
    pitches = pitches.filter((pitch) => {
      return pitch.isPublic || pitch.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    pitches = pitches.filter((pitch) => !pitch.isMature)
  }

  return pitches
})

const filteredPitches = computed<Pitch[]>(() => {
  let pitches = galleryPitches.value

  if (selectedPitchType.value) {
    pitches = pitches.filter((pitch) => {
      return pitch.PitchType === selectedPitchType.value
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
    pitches = pitches.filter((pitch) => {
      const haystack = [
        pitch.title,
        pitch.pitch,
        pitch.description,
        pitch.flavorText,
        pitch.designer,
        pitch.artPrompt,
        pitch.examples,
        pitch.PitchType,
        pitch.creationSource,
        String(pitch.id),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return pitches
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshPitches()
  }
})

async function refreshPitches(force = false) {
  isLoading.value = true

  try {
    await pitchStore.initialize({
      force,
      fetchRemote: true,
      createBlankForm: true,
    })
  } finally {
    isLoading.value = false
  }
}

function getPitchLabel(pitch: Pitch) {
  return pitch.title || pitch.pitch || `Pitch ${pitch.id}`
}

function selectPitchFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingPitch()
    return
  }

  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedPitch()
    return
  }

  pitchStore.setSelectedPitch(id)
}

function startAddingPitch() {
  pitchStore.startAddingPitch()
  formMode.value = 'add'
  showPitchForm.value = true
}

async function startEditingSelectedPitch() {
  const id = pitchStore.selectedPitch?.id

  if (!id) return

  await startEditingPitchById(id)
}

async function startEditingPitchById(id: number) {
  const pitch = await pitchStore.startEditingPitch(id)

  if (!pitch) return

  formMode.value = 'edit'
  showPitchForm.value = true
}

function cloneSelectedPitch() {
  const id = pitchStore.selectedPitch?.id

  if (!id) return

  void clonePitchById(id)
}

async function clonePitchById(id: number) {
  const pitch = await pitchStore.startCloningPitch(id)

  if (!pitch) return

  formMode.value = 'add'
  showPitchForm.value = true
}

function brainstormSelectedPitch() {
  const id = pitchStore.selectedPitch?.id

  if (!id) return

  handlePitchBrainstorm(id)
}

function clearSelectedPitch() {
  pitchStore.deselectPitch()
  showPitchForm.value = false
}

function closePitchForm() {
  showPitchForm.value = false
}

async function handlePitchSaved() {
  showPitchForm.value = false
  await refreshPitches(true)
}

function handlePitchDeleted(id: number) {
  if (pitchStore.selectedPitch?.id === id) {
    pitchStore.deselectPitch()
  }
}

function handlePitchBrainstorm(id: number) {
  pitchStore.setSelectedPitch(id)
  navStore.setDashboardTab('brainstorm', 'interact')
}
</script>

<style scoped>
.pitch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
}

.pitch-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.pitch-row > * {
  min-width: min(280px, 85vw);
  max-width: 380px;
}
</style>
