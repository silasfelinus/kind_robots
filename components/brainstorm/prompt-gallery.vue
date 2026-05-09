<!-- /components/content/brainstorm/prompt-gallery.vue -->
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

        <div class="flex shrink-0 items-center gap-2">
          <span
            v-if="!isLoading && !promptStore.loading"
            class="badge badge-ghost"
          >
            {{ filteredPrompts.length }}
          </span>

          <button
            v-if="allowAdd && !isDropdownMode"
            class="btn btn-primary btn-sm rounded-xl"
            type="button"
            @click="startAddingPrompt"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            <span class="hidden sm:inline">Add</span>
          </button>

          <button
            v-if="allowRefresh && !isDropdownMode"
            class="btn btn-ghost btn-sm rounded-xl"
            type="button"
            :disabled="isLoading || promptStore.loading"
            @click="refreshPrompts(true)"
          >
            <span
              v-if="isLoading || promptStore.loading"
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
          v-model.number="selectedPitchId"
          class="select select-bordered select-sm w-full bg-base-100 lg:w-auto"
          aria-label="Filter prompts by pitch"
        >
          <option :value="0">Any pitch</option>

          <option
            v-for="pitch in pitchOptions"
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

        <button
          class="btn btn-ghost btn-sm rounded-xl lg:w-auto"
          type="button"
          :disabled="!promptStore.selectedPrompt"
          @click="clearSelectedPrompt"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          Clear
        </button>
      </div>
    </header>

    <section
      v-if="showPromptForm"
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
          @click="closePromptForm"
        >
          <Icon name="kind-icon:x" class="h-4 w-4" />
          <span class="hidden sm:inline">Close</span>
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

      <div v-else-if="isDropdownMode" class="flex flex-col gap-3">
        <div
          class="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="flex min-w-0 items-start gap-3">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-base-300 bg-primary/10"
              >
                <Icon name="kind-icon:quote" class="h-6 w-6 text-primary" />
              </div>

              <div class="min-w-0">
                <p class="text-xs font-bold uppercase text-base-content/50">
                  Current Prompt
                </p>

                <h3 class="truncate text-base font-black text-base-content">
                  {{ selectedPromptLabel }}
                </h3>

                <p class="truncate text-sm text-base-content/60">
                  {{ selectedPromptSubtitle }}
                </p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="canPromoteSelected"
                class="btn btn-info btn-sm rounded-xl"
                type="button"
                @click="promoteSelectedPrompt"
              >
                <Icon name="kind-icon:idea" class="h-4 w-4" />
                <span class="hidden sm:inline">Promote</span>
              </button>

              <button
                v-if="canCloneSelected"
                class="btn btn-accent btn-sm rounded-xl"
                type="button"
                @click="cloneSelectedPrompt"
              >
                <Icon name="kind-icon:copy" class="h-4 w-4" />
                <span class="hidden sm:inline">Clone</span>
              </button>

              <button
                v-if="canEditSelected"
                class="btn btn-secondary btn-sm rounded-xl"
                type="button"
                @click="startEditingSelectedPrompt"
              >
                <Icon name="kind-icon:pencil" class="h-4 w-4" />
                <span class="hidden sm:inline">Edit</span>
              </button>
            </div>
          </div>

          <select
            class="select select-bordered w-full bg-base-200"
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

            <option v-if="allowAdd" disabled>──────────</option>

            <option v-if="allowAdd" value="__add__">Add Prompt</option>
          </select>

          <div
            v-if="promptStore.selectedPrompt"
            class="rounded-2xl border border-base-300 bg-base-200 p-3 text-xs text-base-content/70"
          >
            <p class="line-clamp-3">
              {{ selectedPromptDescription }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="promptStore.selectedPrompt.isPublic"
                class="badge badge-info badge-sm"
              >
                Public
              </span>

              <span v-else class="badge badge-ghost badge-sm"> Private </span>

              <span
                v-if="promptStore.selectedPrompt.isMature"
                class="badge badge-warning badge-sm"
              >
                Mature
              </span>

              <span
                v-if="promptStore.selectedPrompt.pitchId"
                class="badge badge-secondary badge-sm"
              >
                Pitch {{ promptStore.selectedPrompt.pitchId }}
              </span>

              <span
                v-if="promptStore.selectedPrompt.botId"
                class="badge badge-accent badge-sm"
              >
                Bot {{ promptStore.selectedPrompt.botId }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else-if="filteredPrompts.length === 0"
        class="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-base-content/60"
      >
        <Icon name="kind-icon:quote" class="h-12 w-12 text-primary" />

        <div>
          <p class="text-lg font-bold">No prompts found.</p>

          <p class="mt-1 text-sm">
            No public or owned prompts match this gallery.
          </p>
        </div>

        <button
          v-if="allowAdd"
          class="btn btn-primary btn-sm rounded-xl"
          type="button"
          @click="startAddingPrompt"
        >
          <Icon name="kind-icon:plus" class="h-4 w-4" />
          Create Prompt
        </button>
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
import { useUserStore } from '@/stores/userStore'

type GalleryVariant = 'dashboard' | 'row' | 'dropdown'

const props = withDefaults(
  defineProps<{
    variant?: GalleryVariant
    title?: string
    subtitle?: string
    showHeader?: boolean
    showControls?: boolean
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
    showHeader: true,
    showControls: true,
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
const userStore = useUserStore()
const navStore = useNavStore()

const selectedPitchId = ref(0)
const searchQuery = ref('')
const isLoading = ref(false)
const showPromptForm = ref(false)
const formMode = ref<'add' | 'edit'>('add')

const isDropdownMode = computed(() => props.variant === 'dropdown')

const isCompact = computed(() => {
  return props.compact || props.variant === 'row' || isDropdownMode.value
})

const layoutClass = computed(() => {
  return props.variant === 'row' ? 'prompt-row' : 'prompt-grid'
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

const selectedPrompt = computed(() => {
  return promptStore.selectedPrompt
})

const selectedPromptLabel = computed(() => {
  return selectedPrompt.value
    ? getPromptLabel(selectedPrompt.value)
    : 'No prompt selected'
})

const selectedPromptSubtitle = computed(() => {
  const prompt = selectedPrompt.value

  if (!prompt) return 'Choose a prompt or add a new one.'

  const pitch = getPromptPitch(prompt)

  return (
    pitch?.title || pitch?.pitch || prompt.creationSource || 'Prompt selected.'
  )
})

const selectedPromptDescription = computed(() => {
  return selectedPrompt.value?.prompt || 'No prompt text yet.'
})

const formTitle = computed(() => {
  return formMode.value === 'edit' ? 'Edit Prompt' : 'Add Prompt'
})

const formSubtitle = computed(() => {
  return formMode.value === 'edit'
    ? 'Tune this phrase before it becomes a tiny idea missile.'
    : 'Create a reusable phrase, fragment, or prompt seed.'
})

const canEditSelected = computed(() => {
  const prompt = selectedPrompt.value

  if (!props.allowEdit || !prompt?.id) return false
  if (userStore.isAdmin) return true

  return prompt.userId === currentUserId.value
})

const canCloneSelected = computed(() => {
  return Boolean(props.allowClone && selectedPrompt.value?.id)
})

const canPromoteSelected = computed(() => {
  return Boolean(selectedPrompt.value?.id)
})

const pitchOptions = computed<Pitch[]>(() => {
  return pitchStore.pitches.filter((pitch) => {
    if (!userStore.isAdmin) {
      const canSeePitch = pitch.isPublic || pitch.userId === currentUserId.value

      if (!canSeePitch) return false
    }

    if (!showMature.value && pitch.isMature) return false

    return true
  })
})

const galleryPrompts = computed<Prompt[]>(() => {
  let prompts = promptStore.prompts

  if (!userStore.isAdmin) {
    prompts = prompts.filter((prompt) => {
      return prompt.isPublic || prompt.userId === currentUserId.value
    })
  }

  if (!showMature.value) {
    prompts = prompts.filter((prompt) => !prompt.isMature)
  }

  return prompts
})

const filteredPrompts = computed<Prompt[]>(() => {
  let prompts = galleryPrompts.value

  if (selectedPitchId.value > 0) {
    prompts = prompts.filter((prompt) => {
      return prompt.pitchId === selectedPitchId.value
    })
  }

  const query = searchQuery.value.trim().toLowerCase()

  if (query) {
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
  const text = prompt.prompt || `Prompt ${prompt.id}`

  return text.length > 80 ? `${text.slice(0, 80)}...` : text
}

function getPitchLabel(pitch: Pitch) {
  return pitch.title || pitch.pitch || `Pitch ${pitch.id}`
}

function getPromptPitch(prompt: Prompt) {
  if (!prompt.pitchId) return null

  return pitchStore.pitches.find((pitch) => pitch.id === prompt.pitchId) || null
}

function selectPromptFromEvent(event: Event) {
  const target = event.target as HTMLSelectElement

  if (target.value === '__add__') {
    startAddingPrompt()
    return
  }

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
</style>
