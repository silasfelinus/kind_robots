<!-- /components/content/weird/add-scenario.vue -->
<template>
  <div
    class="mx-auto flex w-full max-w-7xl flex-col gap-6 rounded-2xl border border-base-300 bg-base-200 p-4"
  >
    <header class="text-center">
      <h1 class="text-3xl font-bold text-primary md:text-4xl">
        {{ heading }}
      </h1>

      <p class="mt-2 text-sm text-base-content/70">
        {{ subtitle }}
      </p>
    </header>

    <div
      v-if="mode === 'edit' && !scenarioStore.selectedScenario"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a scenario before editing.
    </div>

    <template v-else>
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Title</span>
          </span>

          <input
            v-model="scenarioStore.scenarioForm.title"
            type="text"
            placeholder="The Casino Under the Moon"
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Locations</span>
          </span>

          <input
            v-model="scenarioStore.scenarioForm.locations"
            type="text"
            placeholder="foggy casino, moon library, cursed mall..."
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control lg:col-span-2">
          <span class="label">
            <span class="label-text font-bold">Description</span>
          </span>

          <textarea
            v-model="scenarioStore.scenarioForm.description"
            placeholder="Describe your scenario..."
            class="textarea textarea-bordered min-h-32 w-full bg-base-100"
          />
        </label>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-lg font-bold text-base-content">Locations</h2>

          <choice-manager label="locations" model="Scenario" />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-lg font-bold text-base-content">Genres</h2>

          <choice-manager label="genres" model="Scenario" />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
          <h2 class="mb-3 text-lg font-bold text-base-content">Inspirations</h2>

          <choice-manager label="inspirations" model="Scenario" />
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div class="mb-4 flex items-center justify-between gap-2">
          <div>
            <h2 class="text-xl font-bold text-base-content">Opening Choices</h2>

            <p class="text-sm text-base-content/70">
              These become the starting choices players can click when the
              scenario begins.
            </p>
          </div>

          <span class="badge badge-ghost">
            {{ intros.length }}
          </span>
        </div>

        <div
          class="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(160px,260px)_1fr_auto]"
        >
          <input
            v-model="introTitle"
            type="text"
            placeholder="INTRO TITLE"
            class="input input-bordered bg-base-200"
          />

          <textarea
            v-model="introPrompt"
            placeholder="Enter intro prompt..."
            class="textarea textarea-bordered min-h-12 bg-base-200"
          />

          <button
            class="btn btn-primary rounded-xl"
            type="button"
            @click="addIntro"
          >
            <Icon name="kind-icon:plus" class="h-4 w-4" />
            Add
          </button>
        </div>

        <div v-if="intros.length" class="mt-4 grid gap-2">
          <div
            v-for="(intro, index) in intros"
            :key="`${intro}-${index}`"
            class="flex items-start justify-between gap-3 rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <p class="text-sm text-base-content">
              {{ intro }}
            </p>

            <button
              class="btn btn-error btn-xs rounded-xl"
              type="button"
              @click="removeIntro(index)"
            >
              Remove
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">Scenario Art</h2>

            <p class="text-sm text-base-content/70">
              Upload, randomize, or generate a visual anchor.
            </p>
          </div>

          <gallery-selector />
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div class="flex flex-col items-center gap-3">
            <img
              :src="resolvedActiveImage"
              alt="Scenario Image"
              class="h-64 w-48 rounded-2xl border border-base-300 bg-base-200 object-cover"
            />

            <image-upload class="w-full" />

            <div
              v-if="scenarioStore.scenarioForm.artImageId"
              class="w-full rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-xs text-base-content/60"
            >
              Linked ArtImage #{{ scenarioStore.scenarioForm.artImageId }}
            </div>

            <button
              class="btn btn-accent btn-sm w-full rounded-xl"
              type="button"
              @click="changeToRandomImage"
            >
              Random Image
            </button>
          </div>

          <div class="flex flex-col gap-3">
            <CheckboxToggle v-model="keepArtPrompt" label="Freeze Art Prompt" />

            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Art Prompt</span>
              </span>

              <textarea
                v-model="scenarioStore.scenarioForm.artPrompt"
                placeholder="Describe your scenario's appearance..."
                class="textarea textarea-bordered min-h-32 w-full bg-base-200"
                :disabled="keepArtPrompt || isGeneratingArt"
              />
            </label>

            <button
              class="btn btn-primary rounded-xl"
              type="button"
              :disabled="isGeneratingArt"
              @click="generateArtImage"
            >
              <span
                v-if="isGeneratingArt"
                class="loading loading-spinner loading-sm"
              />
              {{ isGeneratingArt ? 'Generating...' : 'Generate Art' }}
            </button>
          </div>
        </div>
      </section>

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
          v-if="mode === 'edit'"
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="resetFromSelected"
        >
          Revert
        </button>

        <button
          v-else
          class="btn btn-ghost rounded-xl"
          type="button"
          @click="resetForAdd"
        >
          Reset
        </button>

        <button
          class="btn btn-success rounded-xl"
          type="button"
          :disabled="scenarioStore.isSaving"
          @click="saveScenario"
        >
          <span
            v-if="scenarioStore.isSaving"
            class="loading loading-spinner loading-sm"
          />
          {{ saveLabel }}
        </button>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useUploadStore } from '@/stores/uploadStore'
import { useUserStore } from '@/stores/userStore'

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
}>()

const artStore = useArtStore()
const choiceStore = useChoiceStore()
const scenarioStore = useScenarioStore()
const uploadStore = useUploadStore()
const userStore = useUserStore()

const isGeneratingArt = ref(false)
const keepArtPrompt = ref(false)
const introTitle = ref('')
const introPrompt = ref('')
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')
const uploadedPreviewImage = ref<string | null>(null)

const defaultPlaceholder = '/images/scenarios/space.webp'

const mode = computed(() => props.mode)

const heading = computed(() =>
  mode.value === 'edit' ? 'Edit Scenario' : 'Create Scenario',
)

const subtitle = computed(() =>
  mode.value === 'edit'
    ? 'Tune the world, sharpen the choices, and harass causality.'
    : 'Build a chatroom setting, story engine, or narrative trouble aquarium.',
)

const saveLabel = computed(() =>
  mode.value === 'edit' ? 'Save Changes' : 'Save Scenario',
)

const intros = computed<string[]>(() => {
  const raw = scenarioStore.scenarioForm.intros

  if (Array.isArray(raw)) return raw

  return scenarioStore.normalizeIntrosForForm(raw)
})

const resolvedActiveImage = computed(() => {
  return (
    uploadedPreviewImage.value ||
    scenarioStore.scenarioForm.imagePath ||
    defaultPlaceholder
  )
})

onMounted(async () => {
  await prepareForm()
  configureScenarioImageUpload()
})

watch(
  () => props.mode,
  async () => {
    await prepareForm()
    configureScenarioImageUpload()
  },
)

watch(
  () => scenarioStore.selectedScenario?.id,
  () => {
    configureScenarioImageUpload()
  },
)

function configureScenarioImageUpload() {
  uploadStore.setTarget({
    model: 'Scenario',
    modelId:
      scenarioStore.selectedScenario?.id ??
      scenarioStore.scenarioForm.id ??
      null,
    collectionLabel: 'scenarios',
    promptString:
      scenarioStore.scenarioForm.artPrompt ||
      scenarioStore.scenarioForm.title ||
      '[ScenarioImage]',
    path: '[ScenarioImage]',
    buttonLabel: 'Upload scenario art',
    icon: 'kind-icon:story',
    showPreview: false,
    applyImage: async ({ artImageId, imageData }) => {
      uploadedPreviewImage.value =
        imageData ?? scenarioStore.scenarioForm.imagePath ?? null

      scenarioStore.scenarioForm = {
        ...scenarioStore.scenarioForm,
        artImageId,
        imagePath: uploadedPreviewImage.value,
      }

      if (mode.value === 'edit' && scenarioStore.selectedScenario?.id) {
        const saved = await scenarioStore.saveScenario()

        if (!saved) {
          statusTone.value = 'error'
          statusMessage.value =
            scenarioStore.lastError ||
            'Image uploaded, but scenario update failed.'
          return
        }

        statusTone.value = 'success'
        statusMessage.value = 'Scenario art updated.'
        emit('saved')
        return
      }

      statusTone.value = 'success'
      statusMessage.value = 'Scenario art added to form.'
    },
  })
}

async function prepareForm() {
  if (mode.value === 'edit') {
    resetFromSelected()
    return
  }

  resetForAdd()
}

function resetForAdd() {
  scenarioStore.deselectScenario()

  scenarioStore.scenarioForm = {
    title: '',
    description: '',
    locations: '',
    genres: '',
    inspirations: '',
    intros: [],
    artPrompt: '',
    imagePath: null,
    artImageId: null,
    userId: userStore.userId || 10,
  }

  uploadedPreviewImage.value = null
  introTitle.value = ''
  introPrompt.value = ''
  statusMessage.value = ''
  configureScenarioImageUpload()
}

function resetFromSelected() {
  if (!scenarioStore.selectedScenario) return

  scenarioStore.scenarioForm = scenarioStore.toScenarioForm(
    scenarioStore.selectedScenario,
  )

  uploadedPreviewImage.value = null
  introTitle.value = ''
  introPrompt.value = ''
  statusMessage.value = ''
  configureScenarioImageUpload()
}

function setIntros(nextIntros: string[]) {
  scenarioStore.scenarioForm = {
    ...scenarioStore.scenarioForm,
    intros: nextIntros,
  }
}

function addIntro() {
  const title = introTitle.value.trim()
  const prompt = introPrompt.value.trim()

  if (!title || !prompt) {
    statusTone.value = 'error'
    statusMessage.value = 'Both intro title and prompt are required.'
    return
  }

  setIntros([...intros.value, `${title.toUpperCase()}: ${prompt}`])

  introTitle.value = ''
  introPrompt.value = ''
  statusMessage.value = ''
}

function removeIntro(index: number) {
  setIntros(intros.value.filter((_, entryIndex) => entryIndex !== index))
}

function getRandomArtImage() {
  const images = artStore.safeArtImages.length
    ? artStore.safeArtImages
    : artStore.artImages

  if (!images.length) return null

  const image = images[Math.floor(Math.random() * images.length)]

  if (!image) return null

  return {
    id: image.id,
    imagePath: image.imagePath || image.path || null,
  }
}

async function changeToRandomImage() {
  try {
    if (!artStore.artImages.length && !artStore.safeArtImages.length) {
      await artStore.initialize({
        fetchRemote: true,
        hydrateImages: false,
        initializeServerStore: false,
      })
    }

    const randomImage = getRandomArtImage()

    if (randomImage?.imagePath) {
      uploadedPreviewImage.value = randomImage.imagePath

      scenarioStore.scenarioForm = {
        ...scenarioStore.scenarioForm,
        imagePath: randomImage.imagePath,
        artImageId: randomImage.id,
      }

      statusTone.value = 'success'
      statusMessage.value = 'Random scenario image applied.'
      configureScenarioImageUpload()
      return
    }

    statusTone.value = 'error'
    statusMessage.value = 'No random image was available.'
  } catch (error) {
    console.error('Error picking random scenario image:', error)
    statusTone.value = 'error'
    statusMessage.value = 'Error picking random scenario image.'
  }
}
async function generateArtImage() {
  const artPrompt = scenarioStore.scenarioForm.artPrompt?.trim()

  if (!artPrompt) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide an art prompt.'
    return
  }

  isGeneratingArt.value = true
  statusMessage.value = ''

  try {
    const response = await artStore.generateArt({
      promptString: artPrompt,
      title: scenarioStore.scenarioForm.title || 'Untitled Scenario',
      collection: 'scenarios',
    })

    if (response.success && response.data) {
      uploadedPreviewImage.value =
        response.data.imagePath || response.data.path || null

      scenarioStore.scenarioForm = {
        ...scenarioStore.scenarioForm,
        imagePath: uploadedPreviewImage.value,
        artImageId: response.data.id,
      }

      statusTone.value = 'success'
      statusMessage.value = 'Scenario art generated.'
      configureScenarioImageUpload()
      return
    }

    throw new Error(response.message || 'Failed to generate scenario art.')
  } catch (error) {
    console.error('Error generating scenario art:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Error generating scenario art.'
  } finally {
    isGeneratingArt.value = false
  }
}

async function saveScenario() {
  if (mode.value === 'edit' && !scenarioStore.scenarioForm.id) {
    statusTone.value = 'error'
    statusMessage.value = 'No scenario selected or invalid ID.'
    return
  }

  if (!scenarioStore.scenarioForm.title?.trim()) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide a title.'
    return
  }

  if (!scenarioStore.scenarioForm.description?.trim()) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide a description.'
    return
  }

  try {
    choiceStore.applyToForm(scenarioStore.scenarioForm, 'locations', 'Scenario')
    choiceStore.applyToForm(scenarioStore.scenarioForm, 'genres', 'Scenario')
    choiceStore.applyToForm(
      scenarioStore.scenarioForm,
      'inspirations',
      'Scenario',
    )

    scenarioStore.scenarioForm = {
      ...scenarioStore.scenarioForm,
      userId: scenarioStore.scenarioForm.userId || userStore.userId || 10,
    }

    const saved = await scenarioStore.saveScenario()

    if (!saved) {
      throw new Error(scenarioStore.lastError || 'Failed to save scenario.')
    }

    statusTone.value = 'success'
    statusMessage.value =
      mode.value === 'edit'
        ? 'Scenario updated successfully.'
        : 'Scenario saved successfully.'

    emit('saved')
  } catch (error) {
    console.error('Failed to save scenario:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to save scenario.'
  }
}
</script>
