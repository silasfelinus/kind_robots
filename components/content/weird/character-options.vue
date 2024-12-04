<template>
  <div
    class="flex items-center justify-between bg-gray-100 p-2 rounded-lg shadow"
  >
    <!-- Character Selector -->
    <select v-model="selectedCharacterId" class="select select-primary w-1/3">
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

    <!-- Toggles -->
    <div class="flex items-center space-x-4">
      <label class="flex items-center space-x-2">
        <input
          v-model="showKeepToggles"
          type="checkbox"
          class="checkbox checkbox-primary"
        />
        <span>Show Keep Toggles</span>
      </label>
      <label class="flex items-center space-x-2">
        <input
          v-model="showUpdateFields"
          type="checkbox"
          class="checkbox checkbox-primary"
        />
        <span>Show AI Suggestions</span>
      </label>
    </div>

    <!-- Management Buttons -->
    <div class="flex space-x-4">
      <button
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        :disabled="isSaving"
        @click="saveCharacter"
      >
        {{ isSaving ? 'Saving...' : 'Save' }}
      </button>
      <button
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        @click="deleteCharacter"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

// Access the store
const characterStore = useCharacterStore()

// Computed property for selected character ID
const selectedCharacterId = computed({
  get: () => characterStore.selectedCharacter?.id || 'new',
  set: (value: string | number) => {
    if (value === 'new') {
      characterStore.createNewCharacter()
    } else {
      characterStore.selectCharacter(Number(value))
    }
  },
})

// State for toggles and saving
const showKeepToggles = ref(false)
const showUpdateFields = ref(false)
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
</script>
