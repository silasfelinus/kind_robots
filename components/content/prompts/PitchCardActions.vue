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

    <!-- Save Button (appears only in editing mode) -->
    <button
      v-if="isEditing"
      class="rounded-full p-2 bg-green-500 hover:bg-green-600 text-white"
      aria-label="Save Changes"
      @click="emitSave"
    >
      <Icon name="mdi:content-save" class="w-6 h-6" />
    </button>

    <!-- Delete Button with Confirmation -->
    <button
      class="rounded-full p-2 bg-red-500 hover:bg-red-600 text-white"
      aria-label="Delete Pitch"
      @click="confirmDelete"
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

    <!-- Confirmation Dialog -->
    <div v-if="showDeleteConfirmation" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <p class="text-lg font-semibold mb-4">Are you sure you want to delete this pitch?</p>
        <div class="flex justify-end space-x-4">
          <button @click="cancelDelete" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Cancel</button>
          <button @click="emitDelete" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, type Pitch } from '../../../stores/pitchStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'

const props = defineProps<{
  pitch?: Pitch // Make it optional
  isEditing: boolean
}>()

// Define emits for actions
const emit = defineEmits(['toggle-edit', 'save', 'delete'])

// Emit functions for actions
const emitToggleEdit = () => emit('toggle-edit')
const emitSave = () => emit('save')

// Show or hide delete confirmation dialog
const showDeleteConfirmation = ref(false)

const confirmDelete = () => {
  showDeleteConfirmation.value = true
}

const cancelDelete = () => {
  showDeleteConfirmation.value = false
}

// Finalize delete action if confirmed
const emitDelete = () => {
  emit('delete')
  showDeleteConfirmation.value = false
}

// Store references
const pitchStore = usePitchStore()
const errorStore = useErrorStore()

// Toggle mature content visibility
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

// Toggle public visibility
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

// Request more brainstorm ideas
const getMoreBrainstorms = async () => {
  errorStore.clearError()
  try {
    await pitchStore.fetchBrainstormPitches()
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error fetching brainstorm pitches:', error)
  }
}
</script>
