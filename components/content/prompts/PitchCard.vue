<template>
  <div v-if="selectedPitch" class="pitch-card bg-base-300 rounded-2xl p-4 shadow-lg">
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
        <span v-else>{{ selectedPitch.title }}</span>
      </h2>
      <p class="text-sm text-gray-500">{{ selectedPitch.designer }}</p>
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
      <p v-else>{{ selectedPitch.pitch }}</p>

      <p v-if="isEditing">
        <textarea
          v-model="editablePitch.flavorText"
          class="w-full bg-transparent border p-2 rounded-md"
          placeholder="Edit Flavor Text"
        ></textarea>
      </p>
      <p v-else>{{ selectedPitch.flavorText }}</p>
    </div>

    <!-- PitchType and Description -->
    <div class="mb-4">
      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Pitch Type</label>
      <select v-if="isEditing" v-model="editablePitch.PitchType" class="mb-4 p-2 rounded-md">
        <option v-for="type in pitchStore.pitchTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
      <p v-else class="text-sm text-gray-500">{{ selectedPitch.PitchType }}</p>

      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Description</label>
      <textarea
        v-if="isEditing"
        v-model="editablePitch.description"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Description"
      ></textarea>
      <p v-else>{{ selectedPitch.description }}</p>
    </div>

    <!-- Examples (Displayed or Editable as Title Examples) -->
    <div v-if="editablePitch.PitchType === pitchStore.PitchType.TITLE" class="mb-4">
      <label v-if="isEditing" class="block text-sm font-semibold mb-2">Title Examples</label>
      <textarea
        v-if="isEditing"
        v-model="editablePitch.examples"
        class="w-full bg-transparent border p-2 rounded-md"
        placeholder="Edit Examples (separate by '|')"
      ></textarea>
      <p v-else>{{ selectedPitch.examples?.split('|').join(', ') }}</p>
    </div>

    <!-- Actions -->
    <pitch-card-actions
      :pitch="selectedPitch"
      :is-editing="isEditing"
      @toggleEdit="toggleEdit"
      @save="saveChanges"
      @cancel="cancelEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePitchStore } from '../../../stores/pitchStore'

const pitchStore = usePitchStore()
const selectedPitch = computed(() => pitchStore.selectedPitch)
const userStore = useUserStore()

// Check if the user is allowed to edit (matches user ID)
const isUserAllowedToEdit = computed(() => selectedPitch.value?.userId === userStore.userId)

// Editing state and editable copy of the pitch
const isEditing = ref(false)
const editablePitch = ref({ ...selectedPitch.value })

// Toggle editing mode
const toggleEdit = () => {
  isEditing.value = !isEditing.value
  if (isEditing.value) {
    editablePitch.value = { ...selectedPitch.value } // Create a fresh copy for editing
  }
}

// Save changes to the pitch
const saveChanges = async () => {
  if (!editablePitch.value) return
  const response = await pitchStore.updatePitch(selectedPitch.value.id, editablePitch.value)
  if (response.success) {
    isEditing.value = false
  } else {
    // Handle error (display message or log)
  }
}

// Cancel editing
const cancelEdit = () => {
  isEditing.value = false
  editablePitch.value = { ...selectedPitch.value } // Reset changes
}
</script>
