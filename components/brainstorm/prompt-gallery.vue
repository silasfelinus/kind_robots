<!-- /components/content/brainstorm/prompt-gallery.vue -->
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
            v-if="promptStore.selectedPrompt"
            class="truncate text-sm text-base-content/70"
          >
            Selected:
            <span class="font-semibold text-primary">
              {{ selectedPromptLabel }}
            </span>
          </p>

          <p v-else class="text-sm text-base-content/60">
            {{ subtitle }}
          </p>
        </div>

        <span v-if="!isLoading" class="badge badge-ghost shrink-0">
          {{ filteredPrompts.length }}
        </span>
      </div>

      <div
        v-if="showControls"
        class="flex flex-col gap-2 lg:flex-row lg:items-center"
      >
        <select
          v-model="scope"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter prompts by scope"
        >
          <option value="visible">Visible</option>
          <option value="mine">Mine</option>
          <option value="loose">No pitch</option>
          <option value="pitch">Attached to pitch</option>
          <option value="bot">Bot prompts</option>
          <option value="all">All loaded</option>
        </select>

        <select
          v-model.number="selectedPitchId"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter prompts by pitch"
        >
          <option :value="0">Any pitch</option>

          <option
            v-for="pitch in pitchStore.visiblePitches"
            :key="pitch.id"
            :value="pitch.id"
          >
            {{ getPitchLabel(pitch) }}
          </option>
        </select>

        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search prompts..."
          class="input input-bordered input-sm w-full bg-base-100"
          aria-label="Search prompts"
        />
      </div>

      <div v-if="showToolbar" class="grid grid-cols-2 gap-2 sm:grid-cols-6">
        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingPrompt"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Add
        </button>

        <button
          v-if="allowEdit"
          class="btn btn-secondary btn-sm rounded-xl"
          type="button"
          :disabled="!promptStore.selectedPrompt"
          @click="startEditingSelectedPrompt"
        >
          <Icon name="kind-icon:pencil" class="h-4 w-4" />
          Edit
        </button>

        <button
          v-if="allowClone"
          class="btn btn-accent btn-sm rounded-xl"
          type="button"
          :disabled="!promptStore.selectedPrompt"
          @click="cloneSelectedPrompt"
        >
          <Icon name="kind-icon:copy" class="h-4 w-4" />
          Clone
        </button>

        <button
          class="btn btn-info btn-sm rounded-xl"
          type="button"
          :disabled="!promptStore.selectedPrompt"
          @click="promoteSelectedPrompt"
        >
          <Icon name="kind-icon:idea" class="h-4 w-4" />
          Promote
        </button>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="!promptStore.selectedPrompt"
          @click="clearSelectedPrompt"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>

        <button
          v-if="allowRefresh"
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          :disabled="isLoading || promptStore.loading"
          @click="refreshPrompts(true)"
        >
          <Icon name="kind-icon:refresh" class="h-4 w-4" />
          Refresh
        </button>
      </div>
    </header>

    <section
      v-if="showPromptForm"
      class="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-md"
    >
      <div class="mb-3 flex items-center justify-between gap-2">
        <h3 class="text-sm font-bold text-base-content">
          {{ formTitle }}
        </h3>

        <button
          class="btn btn-ghost btn-xs rounded-xl"
          type="button"
          @click="closePromptForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
        </button>
      </div>

      <add-prompt
        :mode="formMode"
        @saved="handlePromptSaved"
        @cancel="closePromptForm"
      />
    </section>

    <section class="min-h-0 flex-1 overflow-auto">
      <div
        v-if="isLoading || promptStore.loading"
        class="flex h-full items-center justify-center py-12"
      >
        <span class="loading loading-spinner loading-lg text-primary"></span>
      </div>

      <div
        v-else-if="promptStore.lastError"
        class="flex h-full items-center justify-center rounded-2xl border border-error/40 bg-error/10 p-6 text-center text-error"
      >
        <p class="text-lg font-bold">
          {{ promptStore.lastError }}
        </p>
      </div>

      <div
        v-else-if="filteredPrompts.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:quote" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No prompts found.</p>
          <p class="mt-1 text-sm">
            The phrase shelf is empty. A tragic shortage of tiny idea missiles.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingPrompt"
        >
          Create the first prompt
        </button>
      </div>

      <div v-else-if="variant === 'dropdown'" class="flex flex-col gap-2">
        <select
          class="select select-bordered w-full bg-base-100"
          :value="promptStore.selectedPrompt?.id ?? ''"
          aria-label="Select prompt"
          @change="selectPromptFromEvent"
        >
          <option value="">Choose a prompt</option>

          <option
            v-for="prompt in filteredPrompts"
            :key="prompt.id"
            :value="prompt.id"
          >
            {{ getPromptLabel(prompt) }}
          </option>
        </select>
      </div>

      <div v-else :class="layoutClass">
        <prompt-card
          v-for="prompt in filteredPrompts"
          :key="prompt.id"
          :prompt="prompt"
          :selected="promptStore.selectedPrompt?.id === prompt.id"
          :compact="isCompact"
          :show-actions="showCardActions"
          :show-meta="showMeta"
          :show-pitch="showPitch"
          :show-art-count="showArtCount"
          :show-launch-button="showLaunchButton"
          :show-debug="showDebug"
          :allow-edit="allowEdit"
          :allow-clone="allowClone"
          :allow-delete="allowDelete"
          @edit="startEditingPromptById"
          @clone="clonePromptById"
          @delete="handlePromptDeleted"
          @promote="handlePromptPromoted"
        />
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Pitch, Prompt } from '~/prisma/generated/prisma/client'
import { useNavStore } from '@/stores/navStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'
type PromptScope = 'visible' | 'mine' | 'loose' | 'pitch' | 'bot' | 'all'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showControls?: boolean
    showToolbar?: boolean
    showCardActions?: boolean
    showMeta?: boolean
    showPitch?: boolean
    showArtCount?: boolean
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
    title: 'Prompts',
    subtitle: 'Browse, select, add, edit, clone, promote, or use prompts.',
    showControls: true,
    showToolbar: true,
    showCardActions: true,
    showMeta: true,
    showPitch: true,
    showArtCount: true,
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

const promptStore = usePromptStore()
const pitchStore = usePitchStore()
const navStore = useNavStore()

const scope = ref<PromptScope>('visible')
const selectedPitchId = ref(0)
const searchQuery = ref('')
const isLoading = ref(false)
const showPromptForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isCompact = computed(() => {
<<<<<<< HEAD:components/brainstorm/prompt-gallery.vue
  return (
    props.compact || props.variant === 'row' || props.variant === 'dropdown'
  )
=======
  return props.compact || props.variant === 'row' || props.variant === 'dropdown'
>>>>>>> 91f616574b58b46ad7aff49741afe0cb44323572:components/prompts/prompt-gallery.vue
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Prompt' : 'Add Prompt'
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'prompt-row' : 'prompt-grid'
})

const selectedPromptLabel = computed(() => {
  const prompt = promptStore.selectedPrompt

  if (!prompt) return 'None'

  return getPromptLabel(prompt)
})

const basePrompts = computed<Prompt[]>(() => {
  if (scope.value === 'mine') return promptStore.ownedPrompts
  if (scope.value === 'loose') return promptStore.loosePrompts
  if (scope.value === 'pitch') return promptStore.pitchPrompts
  if (scope.value === 'bot') return promptStore.botPrompts
  if (scope.value === 'all') return promptStore.prompts

  return promptStore.visiblePrompts
})

const filteredPrompts = computed<Prompt[]>(() => {
  let prompts = basePrompts.value

  if (selectedPitchId.value > 0) {
    prompts = prompts.filter((prompt) => {
      return prompt.pitchId === selectedPitchId.value
    })
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.trim().toLowerCase()

    prompts = prompts.filter((prompt) => {
      const pitch = getPromptPitch(prompt)

      const haystack = [
        prompt.prompt,
        prompt.creationSource,
        pitch?.title,
        pitch?.pitch,
        String(prompt.id),
        String(prompt.pitchId || ''),
        String(prompt.botId || ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }

  return prompts
})

onMounted(async () => {
  if (props.autoLoad) {
    await refreshPrompts()
  }
})

async function refreshPrompts(force = false) {
  isLoading.value = true

  try {
    await Promise.all([
      promptStore.initialize({
        force,
        fetchRemote: true,
        createBlankForm: true,
      }),
      pitchStore.initialize({
        force,
        fetchRemote: true,
        createBlankForm: true,
      }),
    ])
  } finally {
    isLoading.value = false
  }
}

function getPromptLabel(prompt: Prompt) {
  return prompt.prompt || `Prompt ${prompt.id}`
}

function getPitchLabel(pitch: Pitch) {
  return pitch.title || pitch.pitch || `Pitch ${pitch.id}`
}

function getPromptPitch(prompt: Prompt) {
  if (!prompt.pitchId) return null

  return (
    pitchStore.pitches.find((pitch) => {
      return pitch.id === prompt.pitchId
    }) || null
  )
}

function selectPromptFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement
  const id = Number(target.value)

  if (!Number.isInteger(id) || id <= 0) {
    clearSelectedPrompt()
    return
  }

  void promptStore.selectPrompt(id)
}

function startAddingPrompt() {
  promptStore.startAddingPrompt()

  if (selectedPitchId.value > 0) {
    promptStore.setPromptForm({
      pitchId: selectedPitchId.value,
    })
  }

  formMode.value = 'add'
  showPromptForm.value = true
}

async function startEditingSelectedPrompt() {
  const id = promptStore.selectedPrompt?.id

  if (!id) return

  await startEditingPromptById(id)
}

async function startEditingPromptById(id: number) {
  const prompt = await promptStore.startEditingPrompt(id)

  if (!prompt) return

  formMode.value = 'edit'
  showPromptForm.value = true
}

function cloneSelectedPrompt() {
  const id = promptStore.selectedPrompt?.id

  if (!id) return

  void clonePromptById(id)
}

async function clonePromptById(id: number) {
  const prompt = await promptStore.startCloningPrompt(id)

  if (!prompt) return

  formMode.value = 'add'
  showPromptForm.value = true
}

async function promoteSelectedPrompt() {
  const id = promptStore.selectedPrompt?.id

  if (!id) return

  await handlePromptPromoted(id)
}

async function handlePromptPromoted(id: number) {
  const result = await promptStore.promoteToPitch(id)

  if (result.success) {
    navStore.setDashboardTab('brainstorm', 'pitches')
  }
}

function clearSelectedPrompt() {
  promptStore.deselectPrompt()
  showPromptForm.value = false
}

function closePromptForm() {
  showPromptForm.value = false
}

async function handlePromptSaved() {
  showPromptForm.value = false
  await refreshPrompts(true)
}

function handlePromptDeleted(id: number) {
  if (promptStore.selectedPrompt?.id === id) {
    promptStore.deselectPrompt()
  }
}
</script>

<style scoped>
.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 1rem;
}

.prompt-row {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.prompt-row > * {
  min-width: min(280px, 85vw);
  max-width: 380px;
}
<<<<<<< HEAD:components/brainstorm/prompt-gallery.vue
</style>
=======
</style>
>>>>>>> 91f616574b58b46ad7aff49741afe0cb44323572:components/prompts/prompt-gallery.vue
