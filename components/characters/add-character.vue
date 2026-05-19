<!-- /components/content/brainstorm/add-prompt.vue -->
<template>
  <section
    class="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="text-center">
      <h1 class="text-3xl font-bold text-primary md:text-4xl">
        {{ title }}
      </h1>

      <p class="mt-2 text-sm text-base-content/70">
        {{ subtitle }}
      </p>
    </header>

    <div
      v-if="mode === 'edit' && !promptStore.selectedPrompt"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a prompt before editing.
    </div>

    <template v-else>
      <section
        class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div
            class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold text-base-content">Prompt Text</h2>

              <p class="text-sm text-base-content/70">
                A single phrase, instruction, or image/text generation seed.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="seedPrompt"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Seed
            </button>
          </div>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Prompt</span>
            </span>

            <textarea
              v-model="promptStore.promptForm.prompt"
              class="textarea textarea-bordered min-h-56 w-full bg-base-200 text-base leading-relaxed"
              placeholder="lavender armadillo in a raincoat, cinematic lighting, mischievous expression"
              :disabled="isKept('prompt')"
            />
          </label>

          <div class="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <button
              class="btn btn-primary rounded-xl text-white"
              type="button"
              :disabled="!promptStore.promptForm.prompt?.trim()"
              @click="useInPromptField"
            >
              <Icon name="kind-icon:wand" class="h-4 w-4" />
              Use Now
            </button>

            <button
              class="btn btn-accent rounded-xl"
              type="button"
              :disabled="isGeneratingVariation || !basePromptText"
              @click="generateVariation"
            >
              <span
                v-if="isGeneratingVariation"
                class="loading loading-spinner loading-sm"
              />
              <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
              Variation
            </button>
          </div>
        </div>

        <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Links</h2>

              <p class="text-sm text-base-content/70">
                Optional model relationships, including an uploaded reference
                image.
              </p>
            </div>

            <Icon name="kind-icon:link" class="h-8 w-8 text-primary" />
          </div>

          <div class="grid gap-3">
            <image-upload />

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Pitch</span>
              </span>

              <select
                v-model.number="pitchIdModel"
                class="select select-bordered w-full bg-base-200"
              >
                <option :value="null">No pitch</option>

                <option
                  v-for="pitch in pitchStore.visiblePitches"
                  :key="pitch.id"
                  :value="pitch.id"
                >
                  {{ getPitchLabel(pitch) }}
                </option>
              </select>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Gallery ID</span>
              </span>
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Bot ID</span>
              </span>

              <input
                v-model.number="botIdModel"
                type="number"
                class="input input-bordered w-full bg-base-200"
                placeholder="Optional"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Art Image ID</span>
              </span>

              <input
                v-model.number="artImageIdModel"
                type="number"
                class="input input-bordered w-full bg-base-200"
                placeholder="Optional"
              />
            </label>
          </div>
        </aside>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">
              AI Update Controls
            </h2>

            <p class="text-sm text-base-content/70">
              Prompts only really have one soul, but we can still protect or
              refresh it.
            </p>
          </div>

          <button
            class="btn btn-sm btn-accent rounded-xl"
            type="button"
            :disabled="fieldsToUpgrade.length === 0 || isGeneratingFields"
            @click="generateSelectedFields"
          >
            <span
              v-if="isGeneratingFields"
              class="loading loading-spinner loading-xs"
            />
            <Icon v-else name="kind-icon:sparkles" class="h-4 w-4" />
            Update Selected
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="field in aiFields"
            :key="field.key"
            class="rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-bold text-base-content">
                  {{ field.label }}
                </p>

                <p class="text-xs text-base-content/60">
                  {{ field.description }}
                </p>
              </div>

              <Icon :name="field.icon" class="h-5 w-5 shrink-0 text-primary" />
            </div>

            <div class="mt-3 grid grid-cols-2 gap-2">
              <label
                class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm"
              >
                <span>AI update</span>

                <input
                  v-model="useGenerated[field.key]"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-secondary"
                  :disabled="isKept(field.key)"
                />
              </label>

              <label
                class="flex cursor-pointer items-center justify-between gap-2 rounded-xl bg-base-100 px-3 py-2 text-sm"
              >
                <span>Keep</span>

                <input
                  v-model="keepField[field.key]"
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-primary"
                  @change="handleKeepFieldChange(field.key)"
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <h2 class="mb-3 text-xl font-bold text-base-content">Metadata</h2>

        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">Creation Source</span>
            </span>

            <select
              v-model="promptStore.promptForm.creationSource"
              class="select select-bordered w-full bg-base-200"
            >
              <option value="HUMAN">HUMAN</option>
              <option value="AI">AI</option>
              <option value="HYBRID">HYBRID</option>
              <option value="UPLOAD">UPLOAD</option>
              <option value="UNKNOWN">UNKNOWN</option>
            </select>
          </label>

          <label class="form-control">
            <span class="label">
              <span class="label-text font-bold">User ID</span>
            </span>

            <input
              v-model.number="promptStore.promptForm.userId"
              type="number"
              class="input input-bordered w-full bg-base-200"
            />
          </label>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <p
              class="text-xs font-bold uppercase tracking-wide text-base-content/50"
            >
              Current Prompt Field
            </p>

            <p class="mt-2 line-clamp-3 text-sm text-base-content/70">
              {{ promptStore.promptField || 'No prompt field yet.' }}
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="promptStore.lastError"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ promptStore.lastError }}
      </div>

      <div
        v-if="statusMessage"
        class="rounded-2xl border p-3 text-sm"
        :class="
          statusTone === 'error'
            ? 'border-error/40 bg-error/10 text-error'
            : 'border-success/40 bg-success/10 text-success'
        "
      >
        {{ statusMessage }}
      </div>

      <footer class="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="emit('cancel')"
        >
          Cancel
        </button>

        <button
          v-if="mode === 'edit'"
          class="btn btn-secondary rounded-xl"
          type="button"
          @click="resetFromSelected"
        >
          Revert
        </button>

        <button
          v-else
          class="btn btn-secondary rounded-xl"
          type="button"
          @click="resetForAdd"
        >
          Reset
        </button>

        <button
          class="btn btn-info rounded-xl"
          type="button"
          :disabled="!promptStore.selectedPrompt"
          @click="promotePrompt"
        >
          <Icon name="kind-icon:idea" class="h-4 w-4" />
          Promote to Pitch
        </button>

        <button
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="promptStore.isSaving || !canSave"
          @click="savePrompt"
        >
          <span
            v-if="promptStore.isSaving"
            class="loading loading-spinner loading-sm"
          />
          {{ saveLabel }}
        </button>
      </footer>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Pitch } from '~/prisma/generated/prisma/client'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore, type PromptForm } from '@/stores/promptStore'
import { useUploadStore } from '@/stores/uploadStore'
import { useUserStore } from '@/stores/userStore'

type PromptFieldKey = keyof PromptForm & string

const props = withDefaults(
  defineProps<{
    mode?: 'add' | 'edit'
  }>(),
  {
    mode: 'add',
  },
)

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const promptStore = usePromptStore()
const pitchStore = usePitchStore()
const uploadStore = useUploadStore()
const userStore = useUserStore()

const keepField = reactive<Record<string, boolean>>({})
const useGenerated = reactive<Record<string, boolean>>({})

const isGeneratingFields = ref(false)
const isGeneratingVariation = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const mode = computed(() => props.mode)

const title = computed(() => {
  return mode.value === 'edit' ? 'Edit Prompt' : 'Create Prompt'
})

const subtitle = computed(() => {
  return mode.value === 'edit'
    ? 'Tune this small but potent generation phrase.'
    : 'Create a text string that can generate art, text, chaos, or suspiciously marketable nonsense.'
})

const saveLabel = computed(() => {
  return mode.value === 'edit' ? 'Save Prompt' : 'Create Prompt'
})

const canSave = computed(() => {
  return Boolean(promptStore.promptForm.prompt?.trim())
})

const basePromptText = computed(() => {
  return (
    promptStore.promptForm.prompt?.trim() ||
    promptStore.currentPrompt.trim() ||
    promptStore.promptField.trim()
  )
})

const pitchIdModel = computed({
  get: () => promptStore.promptForm.pitchId ?? null,
  set: (value: number | null) => {
    promptStore.setPromptForm({
      pitchId: typeof value === 'number' && value > 0 ? value : null,
    })
  },
})

const botIdModel = computed({
  get: () => promptStore.promptForm.botId ?? null,
  set: (value: number | null) => {
    promptStore.setPromptForm({
      botId: typeof value === 'number' && value > 0 ? value : null,
    })
  },
})

const artImageIdModel = computed({
  get: () => promptStore.promptForm.artImageId ?? null,
  set: (value: number | null) => {
    promptStore.setPromptForm({
      artImageId: typeof value === 'number' && value > 0 ? value : null,
    })
  },
})

const aiFields: Array<{
  key: PromptFieldKey
  label: string
  description: string
  icon: string
}> = [
  {
    key: 'prompt',
    label: 'Prompt',
    description: 'Refresh the core generation phrase.',
    icon: 'kind-icon:quote',
  },
  {
    key: 'pitchId',
    label: 'Pitch Link',
    description: 'Protect or revise the parent pitch link.',
    icon: 'kind-icon:idea',
  },
  {
    key: 'artImageId',
    label: 'Art Image Link',
    description: 'Protect or revise the attached image link.',
    icon: 'kind-icon:image',
  },
]

const fieldsToUpgrade = computed(() => {
  return aiFields
    .filter((field) => {
      return Boolean(useGenerated[field.key]) && !Boolean(keepField[field.key])
    })
    .map((field) => field.key)
})

onMounted(async () => {
  await Promise.all([
    promptStore.initialize({
      fetchRemote: true,
      createBlankForm: true,
    }),
    pitchStore.initialize({
      fetchRemote: true,
      createBlankForm: true,
    }),
  ])

  await prepareForm()
  configurePromptImageUpload()
})

watch(
  () => props.mode,
  async () => {
    await prepareForm()
    configurePromptImageUpload()
  },
)

watch(
  () => promptStore.selectedPrompt?.id,
  () => {
    configurePromptImageUpload()
  },
)

async function prepareForm() {
  statusMessage.value = ''

  if (mode.value === 'edit') {
    await resetFromSelected()
    return
  }

  const hasFormData = Object.keys(promptStore.promptForm || {}).length > 0

  if (!hasFormData) {
    resetForAdd()
  }
}

function configurePromptImageUpload() {
  uploadStore.setTarget({
    model: 'Prompt',
    modelId:
      promptStore.selectedPrompt?.id ?? promptStore.promptForm.id ?? null,
    galleryName: 'promptUploads',
    collectionLabel: 'prompts',
    promptString: promptStore.promptForm.prompt || '[PromptImage]',
    path: '[PromptImage]',
    buttonLabel: 'Upload prompt image',
    icon: 'kind-icon:image',
    showPreview: false,
    applyImage: async ({ artImageId }) => {
      promptStore.setPromptForm({
        artImageId,
        creationSource: promptStore.promptForm.creationSource ?? 'UPLOAD',
      })

      if (mode.value === 'edit' && promptStore.selectedPrompt?.id) {
        const result = await promptStore.savePrompt()

        if (!result.success) {
          statusTone.value = 'error'
          statusMessage.value =
            result.message || 'Image uploaded, but prompt update failed.'
          return
        }

        statusTone.value = 'success'
        statusMessage.value = 'Prompt image updated.'
        return
      }

      statusTone.value = 'success'
      statusMessage.value = 'Prompt image added to form.'
    },
  })
}

function resetForAdd() {
  promptStore.startAddingPrompt()

  promptStore.setPromptForm({
    userId: userStore.userId || 10,
    creationSource: 'HUMAN',
  })

  statusMessage.value = ''
}

async function resetFromSelected() {
  await promptStore.startEditingPrompt()
  statusMessage.value = ''
}

function isKept(field: string) {
  return Boolean(keepField[field])
}

function handleKeepFieldChange(field: string) {
  if (keepField[field]) {
    useGenerated[field] = false
  }
}

function getPitchLabel(pitch: Pitch) {
  return pitch.title || pitch.pitch || `Pitch ${pitch.id}`
}

function seedPrompt() {
  promptStore.setPromptForm({
    prompt:
      promptStore.promptForm.prompt ||
      'a cheerful robot archivist cataloging impossible butterflies, cozy studio lighting, whimsical sci-fi',
    userId: promptStore.promptForm.userId ?? userStore.userId ?? 10,
    creationSource: promptStore.promptForm.creationSource || 'HUMAN',
  })

  statusTone.value = 'success'
  statusMessage.value = 'Prompt seed applied.'
}

function useInPromptField() {
  const prompt = promptStore.promptForm.prompt?.trim()

  if (!prompt) {
    statusTone.value = 'error'
    statusMessage.value = 'Write a prompt first.'
    return
  }

  promptStore.promptField = prompt
  promptStore.currentPrompt = prompt
  promptStore.syncToLocalStorage()

  statusTone.value = 'success'
  statusMessage.value = 'Prompt sent to the active prompt field.'
}

async function generateVariation() {
  if (!basePromptText.value) {
    statusTone.value = 'error'
    statusMessage.value = 'No prompt available to vary.'
    return
  }

  isGeneratingVariation.value = true
  statusMessage.value = ''

  try {
    const result = await promptStore.generateVariation()

    if (!result.success) {
      throw new Error(result.message)
    }

    statusTone.value = 'success'
    statusMessage.value = result.message
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to generate variation.'
  } finally {
    isGeneratingVariation.value = false
  }
}

async function generateSelectedFields() {
  if (fieldsToUpgrade.value.length === 0) {
    statusTone.value = 'error'
    statusMessage.value = 'Select at least one AI field to update.'
    return
  }

  isGeneratingFields.value = true
  statusMessage.value = ''

  try {
    const result = await promptStore.generateFields(fieldsToUpgrade.value)

    if (!result.success) {
      throw new Error(result.message)
    }

    statusTone.value = 'success'
    statusMessage.value = result.message
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to generate prompt fields.'
  } finally {
    isGeneratingFields.value = false
  }
}

async function promotePrompt() {
  const result = await promptStore.promoteToPitch()

  if (!result.success) {
    statusTone.value = 'error'
    statusMessage.value = result.message || 'Failed to promote prompt.'
    return
  }

  statusTone.value = 'success'
  statusMessage.value = 'Prompt promoted to pitch.'
}

async function savePrompt() {
  const result = await promptStore.savePrompt()

  if (!result.success) {
    statusTone.value = 'error'
    statusMessage.value = result.message
    return
  }

  statusTone.value = 'success'
  statusMessage.value = result.message
  emit('saved')
}
</script>
