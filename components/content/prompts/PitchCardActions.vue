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
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
const emitDelete = () => emit('delete')

// Other logic and methods (toggleMature, togglePublic, getMoreBrainstorms) remain unchanged
</script>
