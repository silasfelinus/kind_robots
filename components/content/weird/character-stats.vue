<template>
  <div class="w-full md:w-1/2 p-4">
    <h2 class="text-lg font-medium">Stats</h2>
    <div class="grid grid-cols-2 gap-6"> <!-- Increased gap for spacing -->
      <template v-for="i in 6" :key="'stat-' + i">
        <div>
          <!-- Stat Name Input -->
          <label
            class="block text-lg font-bold uppercase truncate" <!-- Larger font size, truncate for overflow -->
            :for="'statName' + i"
          >
            <input
              v-model="characterStore.characterForm[`statName${i}`]"
              type="text"
              class="w-full p-4 rounded-lg border text-lg" <!-- Larger padding and font size -->
            />
          </label>
          <!-- Stat Value Input -->
          <input
            :id="'statValue' + i"
            :value="characterStore.characterForm[`statValue${i}`]"
            type="number"
            class="w-full p-4 rounded-lg border text-center text-lg" <!-- Larger padding and font size -->
            disabled
          />
        </div>
      </template>
    </div>
    <button class="btn btn-secondary mt-4" @click="rerollStats"> <!-- Adjusted margin for spacing -->
      Reroll Stats
    </button>
  </div>
</template>


<script setup lang="ts">
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()

function rerollStats() {
  characterStore.rerollStats()
}
</script>
