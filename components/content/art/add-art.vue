<!-- /components/content/art/add-art.vue -->
<template>
  <art-grid>
    <!-- Title -->
    <template #title>
      <h1 class="text-3xl font-bold text-primary">
        🎨 Welcome to the Art-Maker
      </h1>
    </template>

    <!-- Left Column -->
    <template #left>
      <checkpoint-gallery />
      <collection-handler />
    </template>

    <!-- Center Column -->
    <template #center>
      <prompt-handler />
      <art-randomizer />
    </template>

    <!-- Right Column -->
    <template #right>
      <!-- Generate Button -->
      <button
        class="btn w-full font-semibold text-white transition duration-300"
        :class="
          isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'
        "
        :disabled="isGenerating || !promptStore.promptField"
        @click="generateArt"
      >
        🖌️ Create Art
      </button>
      <div class="text-center">
        <button
          class="btn btn-sm btn-outline"
          @click="showGallery = !showGallery"
        >
          {{ showGallery ? '🖼️ Show Collection' : '🖼️ Show Gallery' }}
        </button>
      </div>

      <div v-if="showGallery">
        <art-gallery />
      </div>
      <div v-else>
        <collection-display />
      </div>
    </template>

    <!-- Extra Content Below -->
    <template #extra>
      <div
        v-if="generatedArt.length && !showGallery"
        class="space-y-4 xl:hidden"
      >
        <ArtCard v-for="art in generatedArt" :key="art.id" :art="art" />
      </div>
    </template>
  </art-grid>
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

// Core stores
const artStore = useArtStore()
const userStore = useUserStore()
const promptStore = usePromptStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const collectionStore = useCollectionStore()
const checkpointStore = useCheckpointStore()

const isGenerating = ref(false)
const showGallery = ref(false)

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
  isGenerating.value = true
  displayStore.toggleRandomAnimation()

  const result = await artStore.generateArt()
  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  } else {
    await milestoneStore.rewardMilestone(11)
  }

  displayStore.stopAnimation()
  isGenerating.value = false
}

onMounted(() => {
  if (!artStore.artForm.promptString) {
    artStore.artForm.promptString = promptStore.promptField
  }
})
</script>
