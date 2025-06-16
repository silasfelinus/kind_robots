<template>
  <!-- Generate Button -->
  <button
    class="btn w-full font-semibold text-white transition duration-300"
    :class="isGenerating ? 'bg-secondary' : 'bg-primary hover:bg-primary/90'"
    :disabled="isGenerating || !promptStore.promptField"
    @click="generateArt"
  >
    🖌️ Create Art
  </button>
</template>

<script setup lang="ts">
import { useArtStore } from '@/stores/artStore'
import { usePromptStore } from '@/stores/promptStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useErrorStore, ErrorType } from '@/stores/errorStore'
import { useMilestoneStore } from '@/stores/milestoneStore'
import { useCheckpointStore } from '@/stores/checkpointStore'

const checkpointStore = useCheckpointStore()
const displayStore = useDisplayStore()
const errorStore = useErrorStore()
const milestoneStore = useMilestoneStore()
const artStore = useArtStore()
const promptStore = usePromptStore()

const isGenerating = ref(false)

const generateArt = async () => {
  isGenerating.value = true
  displayStore.toggleRandomAnimation()

  const result = await artStore.generateArt()
  if (!result.success) {
    errorStore.addError(ErrorType.GENERAL_ERROR, result.message)
  } else {
    await callOnce(async () => {
      await milestoneStore.rewardMilestone(11)
    })
  }

  displayStore.stopAnimation()
  isGenerating.value = false
}

watch(
  () => checkpointStore.selectedCheckpoint?.isMature,
  (isMature) => {
    artStore.artForm.isMature = !!isMature
  },
  { immediate: true },
)

onMounted(() => {
  if (!artStore.artForm.promptString) {
    artStore.artForm.promptString = promptStore.promptField
  }
})
</script>
