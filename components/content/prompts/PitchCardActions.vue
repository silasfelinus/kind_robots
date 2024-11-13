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

    <!-- Edit Button -->
    <button
      class="rounded-full p-2 bg-blue-500 hover:bg-blue-600 text-white"
      aria-label="Edit Pitch"
      @click="emitToggleEdit"
    >
      <Icon name="mdi:pencil" class="w-6 h-6" />
    </button>

    <!-- Delete Button -->
    <button
      class="rounded-full p-2 bg-red-500 hover:bg-red-600 text-white"
      aria-label="Delete Pitch"
      @click="emitDelete"
    >
      <Icon name="mdi:delete" class="w-6 h-6" />
    </button>

    <!-- Get More Brainstorms Button -->
    <button
      class="rounded-full p-2 bg-yellow-500 hover:bg-yellow-600 text-white"
      aria-label="Get More Brainstorms"
      @click="getMoreBrainstorms"
    >
      <Icon name="kind-icon:brain" class="w-6 h-6" />
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
import { useErrorStore, ErrorType } from '../../../stores/errorStore'

const props = defineProps<{
  pitch?: Pitch // Make it optional
}>()

// Define emits for toggle-edit, delete, and brainstorm actions
const emit = defineEmits(['toggle-edit', 'delete'])

// Emit functions for toggle-edit and delete
const emitToggleEdit = () => emit('toggle-edit')
const emitDelete = () => emit('delete')

const pitchStore = usePitchStore()
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
  props.pitch?.isMature ? 'fluent-emoji-high-contrast:lipstick' : 'ri:bear-smile-line'
)
const publicIcon = computed(() =>
  props.pitch?.isPublic ? 'kind-icon:earth' : 'kind-icon:earth-off'
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

const getMoreBrainstorms = async () => {
  errorStore.clearError()
  try {
    if (!props.pitch) throw new Error('Pitch data is not available.')
    const content = props.pitch.examples?.split('|') || [props.pitch.pitch]
    await pitchStore.fetchBrainstormSuggestions(content)
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error fetching brainstorm suggestions:', error)
  }
}
</script>
