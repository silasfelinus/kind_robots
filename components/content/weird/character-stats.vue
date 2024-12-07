<template>
  <div class="flex flex-wrap justify-between w-full">
    <div
      v-for="i in 6"
      :key="'stat-' + i"
      class="relative flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
    >
      <!-- Freeze Stat Checkbox -->
      <input
        v-if="characterStore.currentDisplayMode === 'generator'"
        :checked="keepField[`statName${i}`]"
        type="checkbox"
        title="Freeze Stat"
        class="absolute top-1 right-1 checkbox checkbox-primary"
        @change="updateKeepField(`statName${i}`, $event)"
      />

      <!-- Stat Name -->
      <input
        :value="getStatValue(`statName${i}`)"
        class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
        :disabled="characterStore.currentDisplayMode === 'normal'"
        @input="updateField(`statName${i}`, $event)"
      />

      <!-- Stat Value -->
      <div class="text-4xl font-bold text-center">
        <span v-if="characterStore.currentDisplayMode === 'normal'">
          {{ getStatValue(`statValue${i}`) }}
        </span>
        <input
          v-else
          :value="getStatValue(`statValue${i}`)"
          class="bg-transparent border-none text-4xl font-bold text-center focus:outline-none"
          :disabled="characterStore.currentDisplayMode === 'generator' && keepField[`statValue${i}`]"
          @input="updateField(`statValue${i}`, $event)"
        />
      </div>
    </div>

    <!-- Reroll Button -->
    <div class="w-full mt-4 flex justify-center">
      <button
        v-if="characterStore.currentDisplayMode === 'edit'"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        @click="rerollStats"
      >
        Reroll Stats
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore, type Character } from '@/stores/characterStore'

// Define dynamic stat key type
type StatKey = `statName${number}` | `statValue${number}`

// Access the store
const characterStore = useCharacterStore()

// Computed properties
const selectedCharacter = computed<Character | null>(
  () => characterStore.selectedCharacter,
)
const keepField = computed(() => characterStore.keepField)

// Helper function to get stat value
function getStatValue(field: StatKey) {
  if (!selectedCharacter.value) return '' // Handle null character case
  return selectedCharacter.value[field as keyof Character] || ''
}

// Update the `keepField` in the store
function updateKeepField(field: StatKey, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target) {
    characterStore.keepField[field] = target.checked
  }
}

// Update stat names or values in the store
function updateField(field: StatKey, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target && selectedCharacter.value) {
    characterStore.updateField(field, target.value) // Use store action to update
  }
}

// Trigger stat reroll for `edit` mode
function rerollStats() {
  characterStore.rerollStats() // Call store's reroll logic
}
</script>
