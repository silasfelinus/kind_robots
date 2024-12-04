<template>
  <div class="flex flex-wrap justify-between w-full">
    <div
      v-for="i in 6"
      :key="'stat-' + i"
      class="relative flex flex-col items-center justify-center w-[30%] bg-base-300 border-2 border-gray-500 rounded-lg shadow-md p-2"
    >
      <!-- Freeze Stat Checkbox -->
      <input
        :checked="keepField[`statName${i}`]"
        type="checkbox"
        title="Freeze Stat"
        class="absolute top-1 right-1 checkbox checkbox-primary"
        @change="updateKeepField(`statName${i}` as StatKey, $event)"
      />

      <!-- Stat Name -->
      <input
        :value="getStatValue(`statName${i}` as StatKey)"
        class="bg-transparent border-none text-sm font-bold uppercase text-gray-700 text-center focus:outline-none"
        :disabled="keepField[`statName${i}`]"
        @input="updateField(`statName${i}` as StatKey, $event)"
      />

      <!-- Stat Value -->
      <input
        :value="getStatValue(`statValue${i}` as StatKey)"
        class="bg-transparent border-none text-4xl font-bold text-center focus:outline-none"
        :disabled="keepField[`statValue${i}`]"
        @input="updateField(`statValue${i}` as StatKey, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore, type Character } from '@/stores/characterStore'

// Extend Character type for dynamic keys
type StatKey = `statName${number}` | `statValue${number}`

// Access the store
const characterStore = useCharacterStore()

// Computed properties
const selectedCharacter = computed<Character | null>(
  () => characterStore.selectedCharacter,
)
const keepField = computed(() => characterStore.keepField)
const useGenerated = computed(() => characterStore.useGenerated)

// Helper function to get stat value
function getStatValue(field: StatKey) {
  if (!selectedCharacter.value) return '' // Handle null character case
  return useGenerated.value[field]
    ? selectedCharacter.value[field as keyof Character] || ''
    : selectedCharacter.value[field as keyof Character] || ''
}

// Emit events to update keepField or stats
function updateKeepField(field: StatKey, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target) {
    characterStore.keepField[field] = target.checked
  }
}

function updateField(field: StatKey, event: Event) {
  const target = event.target as HTMLInputElement | null
  if (target && selectedCharacter.value) {
    selectedCharacter.value[field as keyof Character] = target.value as never // Cast to `never` for dynamic assignment
  }
}
</script>
