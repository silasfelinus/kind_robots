<template>
  <div v-if="props.pitch" class="flex space-x-4">
    <!-- Mature Toggle -->
    <button
      :class="matureButtonClass"
      aria-label="Toggle Mature Content"
      @click="toggleMature"
    >
      <Icon :name="matureIcon" class="w-6 h-6" />
    </button>
    <!-- Public Toggle -->
    <button
      :class="publicButtonClass"
      aria-label="Toggle Public Visibility"
      @click="togglePublic"
    >
      <Icon :name="publicIcon" class="w-6 h-6" />
    </button>
    <!-- Clap Button -->
    <button
      class="bg-info hover:bg-info-dark rounded-full p-2"
      aria-label="Add Clap"
      @click="addClap"
    >
      <Icon name="mdi:hand" class="w-6 h-6" />
    </button>
  </div>
  <div v-else>
    <!-- Placeholder or error message when pitch is null -->
    <span>Error: Pitch data not available.</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePitchStore, type Pitch } from '../../../stores/pitchStore'
import { useReactionStore } from '../../../stores/reactionStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'

const props = defineProps<{
  pitch?: Pitch // Make it optional
}>()

const pitchStore = usePitchStore()
const reactionStore = useReactionStore()
const errorStore = useErrorStore()

const matureButtonClass = computed(() => {
  if (!props.pitch) return 'rounded-full p-2 bg-accent'
  return [
    'rounded-full p-2',
    props.pitch.isMature ? 'bg-accent-dark' : 'bg-accent',
  ]
})

const publicButtonClass = computed(() => {
  if (!props.pitch) return 'rounded-full p-2 bg-primary'
  return [
    'rounded-full p-2',
    props.pitch.isPublic ? 'bg-primary-dark' : 'bg-primary',
  ]
})

const matureIcon = computed(() =>
  props.pitch?.isMature
    ? 'fluent-emoji-high-contrast:lipstick'
    : 'ri:bear-smile-line',
)
const publicIcon = computed(() =>
  props.pitch?.isPublic ? 'mdi:earth' : 'mdi:earth-off',
)

const toggleMature = async () => {
  errorStore.clearError()
  try {
    if (!props.pitch) throw new Error('Pitch data is not available.')
    await pitchStore.updatePitch(props.pitch.id, {
      isMature: !props.pitch.isMature,
    })
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error updating pitch:', error)
  }
}

const togglePublic = async () => {
  errorStore.clearError()
  try {
    if (!props.pitch) throw new Error('Pitch data is not available.')
    await pitchStore.updatePitch(props.pitch.id, {
      isPublic: !props.pitch.isPublic,
    })
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error updating pitch:', error)
  }
}

const addClap = async () => {
  errorStore.clearError()
  try {
    if (!props.pitch) throw new Error('Pitch data is not available.')
    await reactionStore.createReaction({
      pitchId: props.pitch.id,
      reactionType: ReactionType.CLAPPED, // Use reactionType instead of isClapped
      userId: 10, // Assuming a default userId, adjust as needed
      ReactionCategory: ReactionCategory.PITCH, // Ensure the correct category is used
    })
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error adding clap reaction:', error)
  }
}
</script>
