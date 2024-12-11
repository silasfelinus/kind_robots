<template>
  <div
    class="weird-sheet bg-primary text-white flex flex-col items-center justify-start p-4 rounded-lg h-full"
  >
    <h2 class="text-lg font-bold mb-4">Character Sheet</h2>
    <div v-if="character" class="text-sm space-y-2">
      <p><strong>Name:</strong> {{ character.name || 'Unnamed' }}</p>
      <p><strong>Class:</strong> {{ character.class || 'Unknown' }}</p>
      <p><strong>Species:</strong> {{ character.species || 'Unknown' }}</p>
      <p><strong>Stats:</strong></p>
      <ul>
        <li v-for="i in 6" :key="`stat-${i}`">
          <strong>{{ character[`statName${i}`] || `Stat ${i}` }}:</strong>
          {{ character[`statValue${i}`] || 0 }}
        </li>
      </ul>
    </div>
    <p v-else>No Character Selected</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'

const weirdStore = useWeirdStore()
const character = computed(() => weirdStore.activeCharacter)
</script>
