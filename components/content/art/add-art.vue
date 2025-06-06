<!-- /components/content/art/add-art.vue -->
<template>
  <div
    class="bg-base-300 shadow-xl rounded-3xl border border-base-200 overflow-y-auto text-lg max-w-xl mx-auto transform transition-all duration-300 hover:scale-105 p-6 space-y-6"
  >
    <!-- Header -->
    <h1 class="text-3xl font-bold text-center text-primary">
      🎨 Welcome to the Art-Maker
    </h1>

    <!-- Random Theme Selector -->
    <checkpoint-gallery />

    <!-- Prompt Input -->
    <div>
      <input
        v-model="promptStore.promptField"
        placeholder="Enter your creative prompt..."
        class="input input-bordered w-full text-lg bg-base-200 placeholder-gray-500 shadow-inner"
        :disabled="loading"
        @input="savePrompt"
      />
    </div>

    <!-- Generate Art Button -->
    <button
      class="btn w-full font-semibold text-white"
      :class="isGenerating ? 'bg-secondary' : 'bg-primary'"
      :disabled="isGenerating || !promptStore.promptField"
      @click="generateArt"
    >
      <span>🖌️ Create Art</span>
    </button>

    <!-- Error Message -->
    <div v-if="localError" class="text-error text-center">
      <p>{{ localError }}</p>
      <p v-if="lastError">{{ lastError }}</p>
    </div>

    <!-- Generated Art Gallery -->
    <div v-if="generatedArt.length" class="space-y-4">
      <ArtCard v-for="art in generatedArt" :key="art.id" :art="art" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useCollectionStore } from '@/stores/collectionStore'

const artStore = useArtStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const collectionStore = useCollectionStore()

const localError = ref<string | null>(null)
const isGenerating = ref(false)
const loading = computed(() => artStore.loading)
const lastError = computed(() => errorStore.getError)

const savePrompt = () => {
  promptStore.syncToLocalStorage()
}

const generatedArtCollection = computed(() =>
  artStore.collections.find((c) => c.label === 'Generated Art'),
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
  await artStore.initialize()
  await collectionStore.fetchCollections()
})
</script>
