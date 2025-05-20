<!-- /components/content/weird/character-goals.vue -->
<template>
  <div class="flex flex-wrap justify-around space-x-4">
    <div
      v-for="index in 4"
      :key="'goalStat-' + index"
      class="flex flex-col items-center space-y-2"
    >
      <!-- Label for the Goal Stat -->
      <div class="flex flex-col items-center">
        <span class="font-bold text-sm">
          {{ getStatName(`goalStat${index}Name` as GoalStatNameKey) }}
        </span>
      </div>

      <!-- Vertical Slider -->
      <input
        v-model="goalStatValues[`goalStat${index}Value` as GoalStatValueKey]"
        type="range"
        min="-100"
        max="100"
        step="1"
        class="appearance-none h-32 w-4 bg-gray-300 rounded-lg transform rotate-180"
        @input="updateStatValue(index)"
      />

      <!-- Current Value -->
      <span class="text-sm font-medium">
        {{ goalStatValues[`goalStat${index}Value` as GoalStatValueKey] }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

// Define specific keys for goal stats
type GoalStatNameKey =
  | 'goalStat1Name'
  | 'goalStat2Name'
  | 'goalStat3Name'
  | 'goalStat4Name'
type GoalStatValueKey =
  | 'goalStat1Value'
  | 'goalStat2Value'
  | 'goalStat3Value'
  | 'goalStat4Value'

// Access store
const characterStore = useCharacterStore()
const selectedCharacter = computed(() => characterStore.selectedCharacter)

// Computed property for goal stat values
const goalStatValues = computed(() => ({
  goalStat1Value: selectedCharacter.value?.goalStat1Value || 0,
  goalStat2Value: selectedCharacter.value?.goalStat2Value || 0,
  goalStat3Value: selectedCharacter.value?.goalStat3Value || 0,
  goalStat4Value: selectedCharacter.value?.goalStat4Value || 0,
}))

// Utility to retrieve stat names
function getStatName(field: GoalStatNameKey) {
  const value = selectedCharacter.value?.[field]
  return typeof value === 'string' ? value.split('|').join(' | ') : 'Stat'
}

function updateStatValue(index: number) {
  const field = `goalStat${index}Value` as GoalStatValueKey
  const value = goalStatValues.value[field]
  characterStore.updateField(field, value)
}
</script>
