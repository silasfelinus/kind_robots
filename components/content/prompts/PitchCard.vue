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

    <!-- Pitch and Flavor Text -->
    <div class="mb-4">
      <p v-if="isEditing">
        <textarea
          v-model="editablePitch.pitch"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Pitch"
        ></textarea>
      </p>
      <p v-else>{{ pitch.pitch }}</p>

      <p v-if="isEditing">
        <textarea
          v-model="editablePitch.flavorText"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Flavor Text"
        ></textarea>
      </p>
      <p v-else>{{ pitch.flavorText }}</p>
    </div>

    <!-- PitchType and Description -->
    <div class="mb-4">
      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Pitch Type</label>
      <select v-if="isEditing" v-model="editablePitch.PitchType" class="mb-4 p-2 rounded-md">
        <option v-for="type in pitchStore.pitchTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
      <p v-else class="text-sm text-gray-500">{{ pitch.PitchType }}</p>

      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Description</label>
      <textarea
        v-if="isEditing"
        v-model="editablePitch.description"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Description"
      ></textarea>
      <p v-else>{{ pitch.description }}</p>
    </div>

    <!-- Examples (Displayed or Editable as Title Examples) -->
    <div v-if="editablePitch.PitchType === PitchType.TITLE" class="mb-4">
      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Title Examples</label>
      <textarea
        v-if="isEditing"
        v-model="editablePitch.examples"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Examples (separate by '|')"
      ></textarea>
      <p v-else>{{ pitch.examples?.split('|').join(', ') }}</p>
    </div>

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
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore, PitchType } from '~/stores/pitchStore'
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

// Save changes to the pitch
const saveChanges = async () => {
  if (!editablePitch.value) return
  const response = await pitchStore.updatePitch(props.pitch.id, editablePitch.value)
  if (response && response.success) {
    emit('save') // Emit the save event
    isEditing.value = false
  } else {
    console.error('Failed to save changes') // Handle error (display message or log)
  }
}

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false
  emit('cancel') // Emit the cancel event
  editablePitch.value = { ...props.pitch } // Reset changes
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
