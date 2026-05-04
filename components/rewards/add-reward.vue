<!-- /components/content/rewards/add-reward.vue -->
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
      v-if="mode === 'edit' && !rewardStore.selectedReward"
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Select a reward before editing.
    </div>

    <template v-else>
      <section class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Reward Text</span>
          </span>

          <input
            v-model="rewardStore.rewardForm.text"
            type="text"
            placeholder="The Coin of Questionable Wisdom"
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Collection</span>
          </span>

          <input
            v-model="rewardStore.rewardForm.collection"
            type="text"
            placeholder="starter, weirdlandia, relics..."
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control lg:col-span-2">
          <span class="label">
            <span class="label-text font-bold">Power</span>
          </span>

          <textarea
            v-model="rewardStore.rewardForm.power"
            placeholder="Describe what this reward does in the story..."
            class="textarea textarea-bordered min-h-28 w-full bg-base-100"
          />
        </label>
      </section>

      <section class="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Icon</span>
          </span>

          <input
            v-model="rewardStore.rewardForm.icon"
            type="text"
            placeholder="kind-icon:gift"
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Label</span>
            <span class="label-text-alt text-base-content/50">Optional</span>
          </span>

          <input
            v-model="rewardStore.rewardForm.label"
            type="text"
            placeholder="Cursed, Helpful, Legendary..."
            class="input input-bordered w-full bg-base-100"
          />
        </label>

        <label class="form-control">
          <span class="label">
            <span class="label-text font-bold">Rarity</span>
          </span>

          <input
            v-model.number="rewardStore.rewardForm.rarity"
            type="number"
            min="0"
            step="1"
            class="input input-bordered w-full bg-base-100"
          />
        </label>
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">Reward Essence</h2>

            <p class="text-sm text-base-content/70">
              Use reusable choices to shape what kind of story prompt this
              reward becomes.
            </p>
          </div>

          <Icon
            :name="rewardStore.rewardForm.icon || 'kind-icon:gift'"
            class="h-10 w-10 text-primary"
          />
        </div>

        <choice-manager label="rewardEssence" model="Reward" />
      </section>

      <section class="rounded-2xl border border-base-300 bg-base-100 p-4">
        <div
          class="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 class="text-xl font-bold text-base-content">Reward Art</h2>

            <p class="text-sm text-base-content/70">
              Upload, generate, or attach an image for the item.
            </p>
          </div>

          <gallery-selector />
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
          <div class="flex flex-col items-center gap-3">
            <img
              :src="resolvedActiveImage"
              alt="Reward Image"
              class="h-64 w-48 rounded-2xl border border-base-300 bg-base-200 object-cover"
            />

            <image-upload class="w-full" />

            <div
              v-if="rewardStore.rewardForm.artImageId"
              class="w-full rounded-2xl border border-base-300 bg-base-200 px-3 py-2 text-xs text-base-content/60"
            >
              Linked ArtImage #{{ rewardStore.rewardForm.artImageId }}
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <label class="form-control">
              <span class="label">
                <span class="label-text font-bold">Image Prompt</span>
              </span>

              <textarea
                v-model="rewardStore.rewardForm.imagePrompt"
                placeholder="Describe the reward's appearance..."
                class="textarea textarea-bordered min-h-32 w-full bg-base-200"
                :disabled="isGeneratingArt"
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
          :disabled="rewardStore.isSaving"
          @click="saveReward"
        >
          <span
            v-if="rewardStore.isSaving"
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
import { useRewardStore } from '@/stores/rewardStore'
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
const rewardStore = useRewardStore()
const uploadStore = useUploadStore()
const userStore = useUserStore()

const isGeneratingArt = ref(false)
const statusMessage = ref('')
const statusTone = ref<'success' | 'error'>('success')

const defaultPlaceholder = '/images/chest1.webp'

const mode = computed(() => props.mode)

const heading = computed(() =>
  mode.value === 'edit' ? 'Edit Reward' : 'Create Reward',
)

const subtitle = computed(() =>
  mode.value === 'edit'
    ? 'Tune the artifact, curse, boon, or narrative goblin bait.'
    : 'Create a story item that can change what happens next.',
)

const saveLabel = computed(() =>
  mode.value === 'edit' ? 'Save Changes' : 'Save Reward',
)

const resolvedActiveImage = computed(() => {
  if (uploadStore.lastArtImage?.imageData) {
    return uploadStore.lastArtImage.imageData
  }

  return rewardStore.rewardForm.imagePath || defaultPlaceholder
})

onMounted(async () => {
  await prepareForm()
  configureRewardImageUpload()
})

watch(
  () => props.mode,
  async () => {
    await prepareForm()
    configureRewardImageUpload()
  },
)

watch(
  () => rewardStore.selectedReward?.id,
  () => {
    configureRewardImageUpload()
  },
)

async function prepareForm() {
  if (mode.value === 'edit') {
    resetFromSelected()
    return
  }

  resetForAdd()
}

function configureRewardImageUpload() {
  uploadStore.setTarget({
    model: 'Reward',
    modelId:
      rewardStore.selectedReward?.id ?? rewardStore.rewardForm.id ?? null,
    galleryName: 'rewardUploads',
    collectionLabel: 'rewards',
    promptString:
      rewardStore.rewardForm.imagePrompt ||
      rewardStore.rewardForm.text ||
      '[RewardImage]',
    path: '[RewardImage]',
    buttonLabel: 'Upload reward art',
    icon: rewardStore.rewardForm.icon || 'kind-icon:gift',
    showPreview: false,
    applyImage: async ({ artImageId, imageData }) => {
      rewardStore.rewardForm = {
        ...rewardStore.rewardForm,
        artImageId,
        imagePath: imageData ?? rewardStore.rewardForm.imagePath ?? null,
      }

      if (mode.value === 'edit' && rewardStore.selectedReward?.id) {
        const saved = await rewardStore.saveReward()

        if (!saved) {
          statusTone.value = 'error'
          statusMessage.value =
            rewardStore.error || 'Image uploaded, but reward update failed.'
          return
        }

        statusTone.value = 'success'
        statusMessage.value = 'Reward art updated.'
        emit('saved')
        return
      }

      statusTone.value = 'success'
      statusMessage.value = 'Reward art added to form.'
    },
  })
}

function resetForAdd() {
  rewardStore.startAddingReward?.()

  if (!Object.keys(rewardStore.rewardForm || {}).length) {
    rewardStore.rewardForm = {
      text: '',
      power: '',
      collection: 'general',
      icon: 'kind-icon:gift',
      label: '',
      rarity: 5,
      userId: userStore.userId || 10,
      artImageId: null,
      imagePath: null,
      imagePrompt: '',
    }
  }

  statusMessage.value = ''
  configureRewardImageUpload()
}

function resetFromSelected() {
  if (!rewardStore.selectedReward) return

  rewardStore.rewardForm = rewardStore.toRewardForm(rewardStore.selectedReward)
  statusMessage.value = ''
  configureRewardImageUpload()
}

async function generateArtImage() {
  const imagePrompt = rewardStore.rewardForm.imagePrompt?.trim()

  if (!imagePrompt) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide an image prompt.'
    return
  }

  isGeneratingArt.value = true
  statusMessage.value = ''

  try {
    const response = await artStore.generateArt({
      promptString: imagePrompt,
      title: rewardStore.rewardForm.text || 'Untitled Reward',
      collection: 'rewards',
    })

    if (response.success && response.data) {
      rewardStore.rewardForm = {
        ...rewardStore.rewardForm,
        imagePath: null,
        artImageId: response.data.artImageId,
      }

      statusTone.value = 'success'
      statusMessage.value = 'Reward art generated.'
      configureRewardImageUpload()
      return
    }

    throw new Error(response.message || 'Failed to generate reward art.')
  } catch (error) {
    console.error('Error generating reward art:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Error generating reward art.'
  } finally {
    isGeneratingArt.value = false
  }
}

async function saveReward() {
  if (mode.value === 'edit' && !rewardStore.rewardForm.id) {
    statusTone.value = 'error'
    statusMessage.value = 'No reward selected or invalid ID.'
    return
  }

  if (!rewardStore.rewardForm.text?.trim()) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide reward text.'
    return
  }

  if (!rewardStore.rewardForm.power?.trim()) {
    statusTone.value = 'error'
    statusMessage.value = 'Please provide reward power.'
    return
  }

  try {
    choiceStore.applyToForm(rewardStore.rewardForm, 'rewardEssence', 'Reward')

    rewardStore.rewardForm = {
      ...rewardStore.rewardForm,
      collection: rewardStore.rewardForm.collection || 'general',
      icon: rewardStore.rewardForm.icon || 'kind-icon:gift',
      userId: rewardStore.rewardForm.userId || userStore.userId || 10,
    }

    const saved = await rewardStore.saveReward()

    if (!saved) {
      throw new Error(rewardStore.error || 'Failed to save reward.')
    }

    statusTone.value = 'success'
    statusMessage.value =
      mode.value === 'edit'
        ? 'Reward updated successfully.'
        : 'Reward saved successfully.'

    emit('saved')
  } catch (error) {
    console.error('Failed to save reward:', error)
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Failed to save reward.'
  }
}
</script>
