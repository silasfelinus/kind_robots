<!-- /components/content/art/add-art.vue -->
<template>
  <div
    class="bg-base-300 shadow-xl rounded-3xl border border-base-200 text-lg max-w-xl mx-auto transform transition-all duration-300 hover:scale-105 p-6 space-y-8"
  >
    <!-- Header -->
    <h1 class="text-3xl font-bold text-center text-primary">
      🎨 Welcome to the Art-Maker
    </h1>

    <!-- Random Theme Selector -->
    <checkpoint-gallery />

    <!-- Prompt Input -->
    <div class="space-y-2">
      <label class="font-semibold text-base-content">📝 Prompt</label>
      <input
        v-model="promptStore.promptField"
        placeholder="Enter your creative prompt..."
        class="input input-bordered w-full text-lg bg-base-200 placeholder-gray-500 shadow-inner"
        :disabled="loading"
        @input="syncPrompt"
      />
    </div>

    <!-- CFG Controls -->
    <div v-if="!isFlux" class="space-y-2">
      <label class="block font-semibold text-center">
        🎚 CFG Scale: {{ localCfg }}
      </label>
      <input
        type="range"
        min="0"
        max="30"
        step="0.5"
        v-model.number="localCfg"
        class="range range-primary w-full"
      />
    </div>

    <!-- Steps Slider -->
    <div class="space-y-2">
      <label class="block font-semibold text-center">
        🧮 Steps: {{ artStore.artForm.steps }}
      </label>
      <input
        type="range"
        min="5"
        max="50"
        step="1"
        v-model.number="artStore.artForm.steps"
        class="range range-secondary w-full"
      />
    </div>

    <!-- isPublic Toggle -->
    <div class="flex items-center justify-center space-x-4">
      <span class="font-semibold">🔓 Public?</span>
      <input
        type="checkbox"
        class="toggle toggle-success"
        v-model="artStore.artForm.isPublic"
      />
    </div>

    <!-- Generate Art Button -->
    <button
      class="btn w-full font-semibold text-white transition duration-300"
      :class="isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'"
      :disabled="isGenerating || !promptStore.promptField"
      @click="generateArt"
    >
      <span>🖌️ Create Art</span>
    </button>

    <!-- Error Message -->
    <div v-if="localError" class="text-error text-center space-y-1">
      <p>{{ localError }}</p>
      <p v-if="lastError">{{ lastError }}</p>
    </div>

    <!-- Generated Art Gallery -->
    <div v-if="generatedArt.length" class="space-y-4">
      <ArtCard v-for="art in generatedArt" :key="art.id" :art="art" />
    </div>

    <!-- Art Gallery Toggle -->
    <div class="pt-4 text-center">
      <button
        class="btn btn-sm btn-outline"
        @click="showGallery = !showGallery"
      >
        {{ showGallery ? 'Hide Gallery' : 'Show Full Gallery' }}
      </button>
    </div>

    <art-gallery v-if="showGallery" />
  </div>
</template>

<script setup lang="ts">
// /components/content/art/add-art.vue
import { ref, computed, onMounted, watch } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useUserStore } from '@/stores/userStore'

const artStore = useArtStore()
const userStore = useUserStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const collectionStore = useCollectionStore()
const checkpointStore = useCheckpointStore()

const localError = ref<string | null>(null)
const isGenerating = ref(false)
const loading = computed(() => artStore.loading)
const lastError = computed(() => errorStore.getError)
const showGallery = ref(false)

const localCfg = ref<number>(
  (artStore.artForm.cfg ?? 3) + (artStore.artForm.cfgHalf ? 0.5 : 0),
)

const isFlux = computed(
  () => checkpointStore.selectedCheckpoint?.generation === 'Flux',
)

watch(isFlux, (flux) => {
  if (flux) {
    artStore.artForm.cfg = 0
    artStore.artForm.cfgHalf = false
    localCfg.value = 0
  }
})

watch(localCfg, (val) => {
  artStore.artForm.cfg = Math.floor(val)
  artStore.artForm.cfgHalf = val % 1 >= 0.5
})

const syncPrompt = () => {
  promptStore.syncToLocalStorage()
  artStore.artForm.promptString = promptStore.promptField
}

watch(
  () => checkpointStore.selectedCheckpoint?.isMature,
  (isMature) => {
    artStore.artForm.isMature = !!isMature
  },
  { immediate: true },
)

const generatedArtCollection = computed(() =>
  collectionStore.findCollectionByUserAndLabel(
    userStore.userId,
    'Generated Art',
  ),
)

const generatedArt = computed(() =>
  generatedArtCollection.value
    ? [...generatedArtCollection.value.art].reverse()
    : [],
)

const generateArt = async () => {
  localError.value = null
  isGenerating.value = true
  displayStore.toggleRandomAnimation()

  if (!promptStore.validatePromptString(promptStore.promptField)) {
    localError.value = 'Invalid characters in prompt.'
    errorStore.addError(ErrorType.VALIDATION_ERROR, localError.value)
    isGenerating.value = false
    return
  }

  artStore.artForm.promptString = promptStore.promptField

  try {
    const result = await artStore.generateArt()
    if (result.success) {
      await milestoneStore.rewardMilestone(11)
    } else {
      localError.value = result.message || 'Unknown error occurred.'
      errorStore.addError(ErrorType.GENERAL_ERROR, localError.value)
    }
  } catch (error) {
    localError.value =
      error instanceof Error ? error.message : 'Failed to generate art.'
    errorStore.addError(ErrorType.NETWORK_ERROR, localError.value)
  } finally {
    displayStore.stopAnimation()
    isGenerating.value = false
  }
}

onMounted(async () => {
  if (!artStore.artForm.promptString) {
    artStore.artForm.promptString = promptStore.promptField
  }
})
</script>
