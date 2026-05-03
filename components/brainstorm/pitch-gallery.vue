<!-- /components/content/brainstorm/pitch-gallery.vue -->
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

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredPitches.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="scope"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter pitches by scope"
        >
          <option value="visible">Visible</option>
          <option value="mine">Mine</option>
          <option value="public">Public</option>
          <option value="titles">Titles</option>
          <option value="brainstorms">Brainstorms</option>
          <option value="randomlists">Random Lists</option>
          <option value="all">All loaded</option>
        </select>

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

        <select
          v-model="matureFilter"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter mature pitches"
        >
          <option value="allowed">Allowed</option>
          <option value="safe">Safe only</option>
          <option value="mature">Mature only</option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search pitches..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search pitches"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingPitch"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!pitchStore.selectedPitch"
          @click="startEditingSelectedPitch"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          v-if="allowClone"
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!pitchStore.selectedPitch"
          @click="cloneSelectedPitch"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Clone
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!pitchStore.selectedPitch"
          @click="clearSelectedPitch"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading || pitchStore.loading"
          @click="refreshPitches(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showPitchForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closePitchForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
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

      <div
        v-else-if="filteredPitches.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:idea" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No pitches found.</p>
          <p class="mt-1 text-sm">
            Either the idea shelf is empty, or the filters are cosplaying as a
            locked door.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingPitch"
        >
          Create the first pitch
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
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
        </select>
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
type PitchScope =
  | 'visible'
  | 'mine'
  | 'public'
  | 'titles'
  | 'brainstorms'
  | 'randomlists'
  | 'all'
type MatureFilter = 'allowed' | 'safe' | 'mature'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showImages?: boolean
    showControls?: boolean
    showToolbar?: boolean
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
    showImages: true,
    showControls: true,
    showToolbar: true,
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

const scope = ref<PitchScope>('visible')
const matureFilter = ref<MatureFilter>('allowed')
const selectedPitchType = ref<PitchType | ''>('')
const searchQuery = ref('')
const isLoading = ref(false)
const showPitchForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || props.variant === 'dropdown'
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Pitch' : 'Add Pitch'
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'pitch-row' : 'pitch-grid'
})

const selectedPitchLabel = computed(() => {
  const pitch = pitchStore.selectedPitch

  if (!pitch) return 'None'

  return getPitchLabel(pitch)
})

const basePitches = computed<Pitch[]>(() => {
  if (scope.value === 'mine') return pitchStore.ownedPitches
  if (scope.value === 'public') return pitchStore.publicPitches
  if (scope.value === 'titles') return pitchStore.titles
  if (scope.value === 'brainstorms') return pitchStore.brainstormPitches
  if (scope.value === 'randomlists') return pitchStore.randomListPitches
  if (scope.value === 'all') return pitchStore.pitches

  return pitchStore.visiblePitches
})

const filteredPitches = computed<Pitch[]>(() => {
  let pitches = basePitches.value

  if (selectedPitchType.value) {
    pitches = pitches.filter((pitch) => {
      return pitch.PitchType === selectedPitchType.value
    })
  }

  if (matureFilter.value === 'safe') {
    pitches = pitches.filter((pitch) => !pitch.isMature)
  }

  if (matureFilter.value === 'mature') {
    pitches = pitches.filter((pitch) => pitch.isMature)
  }

  if (matureFilter.value === 'allowed' && !userStore.showMature) {
    pitches = pitches.filter((pitch) => !pitch.isMature)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    pitches = pitches.filter((pitch) => {
      const haystack = [
        pitch.title,
        pitch.pitch,
        pitch.description,
        pitch.flavorText,
        pitch.designer,
        pitch.imagePrompt,
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