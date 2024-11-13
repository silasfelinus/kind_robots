<template>
  <div class="pitch-card bg-base-300 rounded-2xl p-4 shadow-lg">
    <!-- Header: Title and Designer -->
    <div class="header flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">
        <span v-if="isEditing">
          <input
            v-model="editablePitch.title"
            class="bg-transparent border-b-2 focus:outline-none"
            placeholder="Edit Title"
          />
        </span>
        <span v-else>{{ pitch.title }}</span>
      </h2>
      <p class="text-sm text-gray-500">{{ pitch.designer }}</p>
    </div>

    <!-- Pitch and Description -->
    <div class="mb-4">
      <p v-if="isEditing">
        <textarea
          v-model="editablePitch.pitch"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Pitch"
        ></textarea>
      </p>
      <p v-else>{{ pitch.pitch }}</p>

      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Description</label>
      <textarea
        v-if="isEditing"
        v-model="editablePitch.description"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Description"
      ></textarea>
      <p v-else>{{ pitch.description }}</p>
    </div>

    <!-- Title Examples Component -->
    <title-examples v-if="isEditing" />

    <!-- Actions -->
    <pitch-card-actions
      v-if="isUserAllowedToEdit"
      :pitch="pitch"
      :is-editing="isEditing"
      @toggle-edit="toggleEdit"
      @save="saveChanges"
      @cancel="cancelEdit"
      @delete="deletePitch"
    />
    
    <!-- Save Button (Visible when changes are detected) -->
    <button
      v-if="isChanged"
      @click="saveChanges"
      class="fixed bottom-4 right-4 bg-green-500 text-white p-3 rounded-full shadow-lg"
    >
      <Icon name="mdi:content-save" class="w-6 h-6" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'
import { useUserStore } from '~/stores/userStore'
import type { Pitch } from '~/stores/pitchStore'

const props = defineProps<{
  pitch: Pitch
}>()

// Define emits for toggle-edit, save, cancel, and delete
const emit = defineEmits(['toggle-edit', 'save', 'cancel', 'delete'])

const pitchStore = usePitchStore()
const userStore = useUserStore()

// Check if the user is allowed to edit or delete (matches user ID or has ADMIN role)
const isUserAllowedToEdit = computed(() =>
  props.pitch.userId === userStore.userId || userStore.userRole === 'ADMIN'
)

// Editing state and editable copy of the pitch
const isEditing = ref(false)
const editablePitch = ref({ ...props.pitch })
const isChanged = ref(false)

// Watch for changes in examples to mark `isChanged` as true
const markAsChanged = () => {
  isChanged.value = true
}

// Save changes to the pitch
const saveChanges = async () => {
  if (!editablePitch.value) return

  const response = await pitchStore.updatePitch(props.pitch.id, editablePitch.value)
  if (response && response.success) {
    emit('save') // Emit the save event
    isChanged.value = false
    isEditing.value = false
  } else {
    console.error('Failed to save changes') // Handle error (display message or log)
  }
}

// Toggle editing mode with user check
const toggleEdit = () => {
  if (!isUserAllowedToEdit.value) {
    console.warn('User not authorized to edit this pitch')
    return
  }
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editablePitch.value = { ...props.pitch } // Create a fresh copy for editing
  }
}

// Cancel editing and reset changes
const cancelEdit = () => {
  isEditing.value = false
  isChanged.value = false
  editablePitch.value = { ...props.pitch } // Reset changes
  emit('cancel') // Emit the cancel event
}

// Delete the pitch
const deletePitch = async () => {
  if (!isUserAllowedToEdit.value) {
    console.warn('User not authorized to delete this pitch')
    return
  }
  const response = await pitchStore.deletePitch(props.pitch.id)
  if (response.success) {
    emit('delete') // Emit the delete event
  } else {
    console.error('Failed to delete pitch') // Handle error (display message or log)
  }
}
</script>

<style scoped>
.highlighted {
  font-weight: bold;
  background-color: rgba(255, 223, 88, 0.3); /* Highlight color */
}
</style>
