<template>
  <div v-if="props.pitch" class="flex flex-wrap gap-4">
    <!-- Mature Toggle -->
    <button
      class="rounded-full p-3 bg-blue-500 hover:bg-blue-600 text-white transition-transform transform hover:scale-110"
      aria-label="Toggle Mature Content"
      @click="toggleMature"
    >
      <Icon name="kind-icon:lips" class="w-6 h-6" />
    </button>

    <!-- Public Toggle -->
    <button
      class="rounded-full p-3 bg-blue-500 hover:bg-blue-600 text-white transition-transform transform hover:scale-110"
      aria-label="Toggle Public Visibility"
      @click="togglePublic"
    >
      <Icon name="kind-icon:eye" class="w-6 h-6" />
    </button>

    <!-- Save Button (appears when changes are ready to be saved) -->
    <button
      v-if="isChanged"
      class="rounded-full p-3 bg-green-500 hover:bg-green-600 text-white transition-transform transform hover:scale-110"
      aria-label="Save Changes"
      @click="emitSave"
    >
      <Icon name="mdi:content-save" class="w-6 h-6" />
    </button>

    <!-- Delete Button with Confirmation -->
    <button
      class="rounded-full p-3 bg-red-500 hover:bg-red-600 text-white transition-transform transform hover:scale-110"
      aria-label="Delete Pitch"
      @click="confirmDelete"
    >
      <Icon name="mdi:delete" class="w-6 h-6" />
    </button>

    <!-- Get More Brainstorms Button -->
    <button
      class="rounded-full p-3 bg-yellow-500 hover:bg-yellow-600 text-white transition-transform transform hover:scale-110"
      aria-label="Get More Brainstorms"
      @click="getMoreBrainstorms"
    >
      <Icon name="kind-icon:brain" class="w-6 h-6" />
    </button>

    <!-- Confirmation Dialog -->
    <div
      v-if="showDeleteConfirmation"
      class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <p class="text-lg font-semibold mb-4">
          Are you sure you want to delete this pitch?
        </p>
        <div class="flex justify-end gap-4">
          <button
            class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            @click="emitDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePitchStore, type Pitch } from '../../../stores/pitchStore'
import { useErrorStore, ErrorType } from '../../../stores/errorStore'

const props = defineProps<{
  pitch?: Pitch
}>()

const emit = defineEmits(['save', 'delete'])

const pitchStore = usePitchStore()
const errorStore = useErrorStore()

const showDeleteConfirmation = ref(false)
const isChanged = ref(false) // Tracks unsaved changes

const emitSave = () => {
  if (props.pitch) pitchStore.setSelectedTitle(props.pitch.id)
  emit('save')
  isChanged.value = false // Reset change state after saving
}

const confirmDelete = () => {
  if (props.pitch) pitchStore.setSelectedTitle(props.pitch.id)
  showDeleteConfirmation.value = true
}

const cancelDelete = () => {
  showDeleteConfirmation.value = false
}

const emitDelete = () => {
  if (props.pitch) pitchStore.setSelectedTitle(props.pitch.id)
  emit('delete')
  showDeleteConfirmation.value = false
}

// Toggle functions set `isChanged` to true when modified
const toggleMature = async () => {
  errorStore.clearError()
  try {
    if (!props.pitch) throw new Error('Pitch data is not available.')
    pitchStore.setSelectedTitle(props.pitch.id)
    await pitchStore.updatePitch(props.pitch.id, {
      isMature: !props.pitch.isMature,
    })
    isChanged.value = true
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error updating pitch:', error)
  }
}

const togglePublic = async () => {
  errorStore.clearError()
  try {
    if (!props.pitch) throw new Error('Pitch data is not available.')
    pitchStore.setSelectedTitle(props.pitch.id)
    await pitchStore.updatePitch(props.pitch.id, {
      isPublic: !props.pitch.isPublic,
    })
    isChanged.value = true
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error updating pitch:', error)
  }
}

const getMoreBrainstorms = async () => {
  errorStore.clearError()
  try {
    if (props.pitch) pitchStore.setSelectedTitle(props.pitch.id)
    await pitchStore.fetchTitleStormPitches()
  } catch (error) {
    errorStore.setError(ErrorType.UNKNOWN_ERROR, (error as Error).message)
    console.error('Error fetching brainstorm pitches:', error)
  }
}
</script>
