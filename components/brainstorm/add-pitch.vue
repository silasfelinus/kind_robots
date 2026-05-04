<!-- /components/content/brainstorm/add-pitch.vue -->
<template>
  <section
    class="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-2xl border border-base-300 bg-base-200 p-4"
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
      v-if="mode === 'edit' && !pitchStore.selectedPitch"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a pitch before editing.
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
              <h2 class="text-xl font-bold text-base-content">Identity</h2>

              <p class="text-sm text-base-content/70">
                Define the big idea, its type, and the phrase that powers it.
              </p>
            </div>

            <button
              class="btn btn-sm btn-secondary rounded-xl"
              type="button"
              @click="seedPitch"
            >
              <Icon name="kind-icon:dice" class="h-4 w-4" />
              Seed
            </button>
          </div>

          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Title</span>
              </span>

              <input
                v-model="pitchStore.pitchForm.title"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="Wild Colors"
                :disabled="isKept('title')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Pitch Type</span>
              </span>

              <select
                v-model="pitchStore.pitchForm.PitchType"
                class="select select-bordered w-full bg-base-200"
              >
                <option
                  v-for="pitchType in pitchStore.pitchTypes"
                  :key="pitchType"
                  :value="pitchType"
                >
                  {{ pitchType }}
                </option>
              </select>
            </label>

            <label class="form-control md:col-span-2">
              <span class="label">
                <span class="label-text font-bold">Pitch</span>
              </span>

              <textarea
                v-model="pitchStore.pitchForm.pitch"
                class="textarea textarea-bordered min-h-32 w-full bg-base-200"
                placeholder="Describe the idea, concept, collection, or vibe..."
                :disabled="isKept('pitch') || isTitleType"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label">
                <span class="label-text font-bold">Description</span>
              </span>

              <textarea
                v-model="pitchStore.pitchForm.description"
                class="textarea textarea-bordered min-h-28 w-full bg-base-200"
                placeholder="Add context, instructions, or useful design notes..."
                :disabled="isKept('description')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Designer</span>
              </span>

              <input
                v-model="pitchStore.pitchForm.designer"
                type="text"
                class="input input-bordered w-full bg-base-200"
                :disabled="!canEditDesigner"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Icon</span>
              </span>

              <input
                v-model="pitchStore.pitchForm.icon"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="kind-icon:idea"
                :disabled="isKept('icon')"
              />
            </label>

            <label class="form-control md:col-span-2">
              <span class="label">
                <span class="label-text font-bold">Flavor Text</span>
              </span>

              <input
                v-model="pitchStore.pitchForm.flavorText"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="A tiny vibe caption with unreasonable confidence."
                :disabled="isKept('flavorText')"
              />
            </label>
          </div>
        </div>

        <aside class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div class="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 class="text-xl font-bold text-base-content">Vibe Image</h2>

              <p class="text-sm text-base-content/70">
                Store a path, highlight image, or image prompt.
              </p>
            </div>

            <Icon name="kind-icon:image" class="h-8 w-8 text-primary" />
          </div>

          <div
            class="flex h-72 w-full items-center justify-center overflow-hidden rounded-2xl border border-base-300 bg-base-300"
          >
            <img
              :src="pitchImage"
              alt="Pitch preview"
              class="h-full w-full object-cover"
            />
          </div>

          <image-upload class="mt-4" />

          <div class="mt-4 flex flex-col gap-3">
            <label class="form-control">
              <span class="label">
                <p class="text-sm text-base-content/70">
                  Store a path, upload a highlight image, or write an image
                  prompt.
                </p>
              </span>

              <input
                v-model="pitchStore.pitchForm.highlightImage"
                type="text"
                class="input input-bordered w-full bg-base-200"
                placeholder="/images/backtree.webp"
                :disabled="isKept('highlightImage')"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Image Prompt</span>
              </span>

              <textarea
                v-model="pitchStore.pitchForm.imagePrompt"
                class="textarea textarea-bordered min-h-24 w-full bg-base-200"
                placeholder="Describe the image this pitch should inspire..."
                :disabled="isKept('imagePrompt')"
              />
            </label>

            <div
              class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
            >
              <span class="text-sm font-bold">Keep image fields</span>

              <input
                v-model="keepImageFields"
                type="checkbox"
                class="toggle toggle-primary"
                @change="toggleImageKeeps"
              />
            </div>
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
              Select fields for AI to refresh. Fields marked “keep” are
              protected.
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

        <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <div
            class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 class="text-xl font-bold text-base-content">Examples</h2>

              <p class="text-sm text-base-content/70">
                Prompts or sample lines that show how this pitch gets used.
              </p>
            </div>

            <button
              class="btn btn-sm btn-primary rounded-xl"
              type="button"
              @click="addExample"
            >
              <Icon name="kind-icon:plus" class="h-4 w-4" />
              Add Example
            </button>
          </div>

          <div v-if="examples.length" class="grid gap-2">
            <div
              v-for="(example, index) in examples"
              :key="`example-${index}`"
              class="grid grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border border-base-300 bg-base-200 p-2"
            >
              <input
                v-model="examples[index]"
                type="text"
                class="input input-bordered input-sm bg-base-100"
                placeholder="lavender armadillo with suspicious charisma"
                @input="syncExamplesToForm"
              />

              <div class="flex gap-1">
                <button
                  class="btn btn-ghost btn-sm rounded-xl"
                  type="button"
                  :disabled="index === 0"
                  @click="moveExample(index, -1)"
                >
                  <Icon name="kind-icon:chevron-up" class="h-4 w-4" />
                </button>

                <button
                  class="btn btn-ghost btn-sm rounded-xl"
                  type="button"
                  :disabled="index === examples.length - 1"
                  @click="moveExample(index, 1)"
                >
                  <Icon name="kind-icon:chevron-down" class="h-4 w-4" />
                </button>

                <button
                  class="btn btn-ghost btn-sm rounded-xl text-error"
                  type="button"
                  @click="removeExample(index)"
                >
                  <Icon name="kind-icon:trash" class="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            v-else
            class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm text-base-content/55"
          >
            No examples yet. The sample goblin is looking unemployed.
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-xl font-bold text-base-content">Publishing</h2>

          <div class="grid gap-3">
            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <span class="label-text font-bold">Public</span>

              <input
                v-model="pitchStore.pitchForm.isPublic"
                type="checkbox"
                class="toggle toggle-success"
              />
            </label>

            <label
              class="label cursor-pointer justify-between rounded-2xl border border-base-300 bg-base-200 px-4 py-3"
            >
              <span class="label-text font-bold">Mature</span>

              <input
                v-model="pitchStore.pitchForm.isMature"
                type="checkbox"
                class="toggle toggle-warning"
              />
            </label>

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Creation Source</span>
              </span>

              <select
                v-model="pitchStore.pitchForm.creationSource"
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
                <span class="label-text font-bold">Art Image ID</span>
              </span>

              <input
                v-model.number="pitchStore.pitchForm.artImageId"
                type="number"
                class="input input-bordered w-full bg-base-200"
                placeholder="Optional linked ArtImage ID"
              />
            </label>
          </div>
        </div>
      </section>

      <div
        v-if="pitchStore.lastError"
        class="rounded-2xl border border-error/40 bg-error/10 p-3 text-sm text-error"
      >
        {{ pitchStore.lastError }}
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
          class="btn btn-primary rounded-xl"
          type="button"
          :disabled="pitchStore.isSaving || !canSave"
          @click="savePitch"
        >
          <span
            v-if="pitchStore.isSaving"
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
import { PitchType, usePitchStore, type PitchForm } from '@/stores/pitchStore'
import { useUserStore } from '@/stores/userStore'
import { useUploadStore } from '@/stores/uploadStore'

type PitchFieldKey = keyof PitchForm & string

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

const pitchStore = usePitchStore()
const userStore = useUserStore()
const uploadStore = useUploadStore()

const keepField = reactive<Record<string, boolean>>({})
const useGenerated = reactive<Record<string, boolean>>({})
const examples = ref<string[]>([])
const isGeneratingFields = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const mode = computed(() => props.mode)

const title = computed(() => {
  return mode.value === 'edit' ? 'Edit Pitch' : 'Create Pitch'
})

const subtitle = computed(() => {
  return mode.value === 'edit'
    ? 'Tune the concept, examples, vibe image, and generation notes.'
    : 'Build a big idea that can spawn prompts, art, dreams, and tiny merch gremlins.'
})

const saveLabel = computed(() => {
  return mode.value === 'edit' ? 'Save Pitch' : 'Create Pitch'
})

const isTitleType = computed(() => {
  return pitchStore.pitchForm.PitchType === PitchType.TITLE
})

const canSave = computed(() => {
  if (isTitleType.value) {
    return Boolean(pitchStore.pitchForm.title?.trim())
  }

  return Boolean(
    pitchStore.pitchForm.pitch?.trim() || pitchStore.pitchForm.title?.trim(),
  )
})

const canEditDesigner = computed(() => {
  return (
    !pitchStore.selectedPitch ||
    pitchStore.pitchForm.userId === userStore.userId ||
    userStore.isAdmin
  )
})

const pitchImage = computed(() => {
  return (
    pitchStore.pitchForm.highlightImage ||
    pitchStore.pitchForm.imagePrompt ||
    '/images/backtree.webp'
  )
})

const keepImageFields = computed({
  get: () => {
    return Boolean(keepField.highlightImage && keepField.imagePrompt)
  },
  set: (value: boolean) => {
    keepField.highlightImage = value
    keepField.imagePrompt = value

    if (value) {
      useGenerated.highlightImage = false
      useGenerated.imagePrompt = false
    }
  },
})

function configurePitchImageUpload() {
  uploadStore.setTarget({
    model: 'Pitch',
    modelId: pitchStore.selectedPitch?.id ?? pitchStore.pitchForm.id ?? null,
    galleryName: 'pitchUploads',
    collectionLabel: 'pitches',
    promptString: '[PitchImage]',
    path: '[PitchImage]',
    buttonLabel: 'Upload pitch image',
    icon: 'kind-icon:image',
    showPreview: false,
    applyImage: async ({ artImageId, imageData }) => {
      pitchStore.setPitchForm({
        artImageId,
        highlightImage: imageData ?? pitchStore.pitchForm.highlightImage ?? '',
        creationSource: pitchStore.pitchForm.creationSource ?? 'UPLOAD',
      })

      if (mode.value === 'edit' && pitchStore.selectedPitch?.id) {
        const result = await pitchStore.savePitch()

        if (!result.success) {
          statusTone.value = 'error'
          statusMessage.value =
            result.message || 'Image uploaded, but pitch update failed.'
          return
        }

        statusTone.value = 'success'
        statusMessage.value = 'Pitch image updated.'
        return
      }

      statusTone.value = 'success'
      statusMessage.value = 'Pitch image added to form.'
    },
  })
}

const aiFields: Array<{
  key: PitchFieldKey
  label: string
  description: string
  icon: string
}> = [
  {
    key: 'title',
    label: 'Title',
    description: 'Refresh the concept title.',
    icon: 'kind-icon:idea',
  },
  {
    key: 'pitch',
    label: 'Pitch',
    description: 'Refresh the core big idea.',
    icon: 'kind-icon:quote',
  },
  {
    key: 'description',
    label: 'Description',
    description: 'Refresh context and instructions.',
    icon: 'kind-icon:book',
  },
  {
    key: 'flavorText',
    label: 'Flavor Text',
    description: 'Refresh the punchy vibe caption.',
    icon: 'kind-icon:sparkles',
  },
  {
    key: 'imagePrompt',
    label: 'Image Prompt',
    description: 'Refresh the visual generation prompt.',
    icon: 'kind-icon:image',
  },
  {
    key: 'examples',
    label: 'Examples',
    description: 'Refresh sample prompts.',
    icon: 'kind-icon:list',
  },
  {
    key: 'icon',
    label: 'Icon',
    description: 'Suggest an icon name.',
    icon: 'kind-icon:star',
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
  await pitchStore.initialize({
    fetchRemote: true,
    createBlankForm: true,
  })

  await prepareForm()
  configurePitchImageUpload()
})

watch(
  () => props.mode,
  async () => {
    await prepareForm()
    configurePitchImageUpload()
  },
)

watch(
  () => pitchStore.selectedPitch?.id,
  () => {
    configurePitchImageUpload()
  },
)

watch(
  () => pitchStore.pitchForm.examples,
  () => {
    hydrateExamplesFromForm()
  },
)

watch(
  () => pitchStore.pitchForm.PitchType,
  () => {
    if (isTitleType.value && pitchStore.pitchForm.title) {
      pitchStore.setPitchForm({
        pitch: pitchStore.pitchForm.title,
      })
    }
  },
)

function prepareForm() {
  statusMessage.value = ''

  if (mode.value === 'edit') {
    void resetFromSelected()
    return
  }

  const hasFormData = Object.keys(pitchStore.pitchForm || {}).length > 0

  if (!hasFormData) {
    resetForAdd()
    return
  }

  hydrateExamplesFromForm()
}

function resetForAdd() {
  pitchStore.startAddingPitch()
  hydrateExamplesFromForm()
  statusMessage.value = ''
}

async function resetFromSelected() {
  await pitchStore.startEditingPitch()
  hydrateExamplesFromForm()
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

function toggleImageKeeps() {
  if (keepImageFields.value) {
    useGenerated.highlightImage = false
    useGenerated.imagePrompt = false
  }
}

function hydrateExamplesFromForm() {
  examples.value = String(pitchStore.pitchForm.examples || '')
    .split(/\||\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function syncExamplesToForm() {
  pitchStore.setPitchForm({
    examples: examples.value
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join('|'),
  })
}

function addExample() {
  examples.value.push('')
  syncExamplesToForm()
}

function removeExample(index: number) {
  examples.value.splice(index, 1)
  syncExamplesToForm()
}

function moveExample(index: number, direction: number) {
  const newIndex = index + direction

  if (newIndex < 0 || newIndex >= examples.value.length) return

  const current = examples.value[index]
  const target = examples.value[newIndex]

  if (current === undefined || target === undefined) return

  examples.value[index] = target
  examples.value[newIndex] = current
  syncExamplesToForm()
}

function seedPitch() {
  pitchStore.setPitchForm({
    title: pitchStore.pitchForm.title || 'Wild Colors',
    pitch:
      pitchStore.pitchForm.pitch ||
      'A collection of vivid, surreal image prompts built around impossible palettes, strange mascots, and delightful visual nonsense.',
    description:
      pitchStore.pitchForm.description ||
      'Use this as a seed concept for generating art prompts, product ideas, text assets, and strange little worldbuilding fragments.',
    flavorText:
      pitchStore.pitchForm.flavorText || 'Chromatic chaos, but make it useful.',
    imagePrompt:
      pitchStore.pitchForm.imagePrompt ||
      'a whimsical robot holding glowing paint jars, rainbow mist, cozy studio lighting',
    icon: pitchStore.pitchForm.icon || 'kind-icon:palette',
    examples:
      pitchStore.pitchForm.examples ||
      'lavender armadillo with neon sunglasses|green curd under a violet moon|rainbow sunburn on a polite robot',
  })

  hydrateExamplesFromForm()

  statusTone.value = 'success'
  statusMessage.value = 'Pitch seed applied.'
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
    const result = await pitchStore.generateFields(fieldsToUpgrade.value)

    if (!result.success) {
      throw new Error(result.message)
    }

    hydrateExamplesFromForm()
    statusTone.value = 'success'
    statusMessage.value = result.message
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error
        ? error.message
        : 'Failed to generate pitch fields.'
  } finally {
    isGeneratingFields.value = false
  }
}

async function savePitch() {
  if (isTitleType.value && pitchStore.pitchForm.title) {
    pitchStore.setPitchForm({
      pitch: pitchStore.pitchForm.title,
    })
  }

  syncExamplesToForm()

  const result = await pitchStore.savePitch()

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
