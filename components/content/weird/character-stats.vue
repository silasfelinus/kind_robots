<template>
  <div class="w-full md:w-1/2 p-4">
    <h2 class="text-lg font-medium">Stats</h2>
    <div class="grid grid-cols-2 gap-6">
      <!-- Increased gap for spacing -->
      <template v-for="i in 6" :key="'stat-' + i">
        <div>
          <!-- Stat Name Input -->
          <label
            class="block text-lg font-bold uppercase truncate"
            :for="'statName' + i"
          >
            <input
              v-model="
                characterStore.characterForm[`statName${i}` as keyof Character]
              "
              type="text"
              class="w-full p-4 rounded-lg border text-lg"
            />
          </label>
          <!-- Stat Value Input -->
          <input
            :id="'statValue' + i"
            :value="
              characterStore.characterForm[`statValue${i}` as keyof Character]
            "
            type="number"
            class="w-full p-4 rounded-lg border text-center text-lg"
            disabled
          />
        </div>
      </template>
    </div>
    <button class="btn btn-secondary mt-4" @click="rerollStats">
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
