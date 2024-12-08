<template>
  <div
    class="flex items-center justify-between bg-gray-100 p-1 rounded-lg shadow-md"
  >
    <!-- Character Selector -->
    <select
      v-model="selectedCharacterId"
      class="select select-primary w-1/3 text-sm"
    >
      <option disabled value="">Select a character</option>
      <option
        v-for="character in characterStore.characters"
        :key="character.id"
        :value="character.id"
      >
        {{ character.name || `Unnamed (${character.id})` }}
      </option>
      <option value="new">+ Create New Character</option>
    </select>

    <!-- Display Mode Toggle -->
    <div class="flex items-center space-x-2">
      <label class="flex items-center space-x-2">
        <span class="text-sm">Mode:</span>
        <input
          v-model="generationMode"
          type="checkbox"
          class="checkbox checkbox-primary"
        />
        <span class="text-sm">Enable Generation Mode</span>
      </label>
    </div>

    <!-- Management Buttons -->
    <div class="flex space-x-2">
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-sm rounded-lg"
        :disabled="isSaving"
        @click="saveCharacter"
      >
        {{ isSaving ? 'Saving...' : 'Save' }}
      </button>

      <!-- Delete Button -->
      <button
        v-if="selectedCharacterId !== 'new'"
        class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm rounded-lg"
        @click="deleteCharacter"
      >
        Delete
      </button>

      <!-- Reset Button -->
      <button
        class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 text-sm rounded-lg"
        @click="resetCharacter"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

// Access the store
const characterStore = useCharacterStore()

const selectedCharacterId = computed({
  get: () => characterStore.selectedCharacter?.id || 'new',
  set: (value: string | number) => {
    if (value === 'new') {
      characterStore.createCharacter({
        name: 'New Character',
        honorific: '',
        isPublic: false,
      })
    } else {
      characterStore.selectCharacter(Number(value))
    }
  },
})

// Computed property for generation mode
const generationMode = computed({
  get: () => characterStore.generationMode,
  set: (value: boolean) => {
    characterStore.generationMode = value
  },
})

// State for saving
const isSaving = ref(false)

// Save Character
async function saveCharacter() {
  isSaving.value = true
  try {
    const { selectedCharacter } = characterStore
    if (selectedCharacter) {
      if (selectedCharacter.id) {
        await characterStore.patchCharacter(
          selectedCharacter.id,
          selectedCharacter,
        )
      } else {
        await characterStore.createCharacter(selectedCharacter)
      }
      alert('Character saved successfully!')
    } else {
      throw new Error('No character selected.')
    }
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Failed to save character.')
  } finally {
    isSaving.value = false
  }
}

// Delete Character
async function deleteCharacter() {
  const { selectedCharacter } = characterStore
  if (
    selectedCharacter &&
    confirm('Are you sure you want to delete this character?')
  ) {
    try {
      await characterStore.deleteCharacter(selectedCharacter.id)
      alert('Character deleted successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete character.')
    }
  }
}

// Reset Character
function resetCharacter() {
  characterStore.selectedCharacter = null
  characterStore.generatedCharacter = null
  characterStore.generationMode = false
  alert('Character reset to defaults.')
}
</script>
