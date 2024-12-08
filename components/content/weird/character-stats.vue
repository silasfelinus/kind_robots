<template>
  <div class="w-full md:w-1/2 p-4">
    <h2 class="text-lg font-medium">Stats</h2>
    <div class="grid grid-cols-2 gap-4">
      <template v-for="i in 6" :key="'stat-' + i">
        <div>
          <label
            class="block text-sm font-bold uppercase"
            :for="'statName' + i"
          >
            <input
              v-model="characterStore.characterForm[`statName${i}`]"
              type="text"
              class="w-full p-2 rounded-lg border"
            />
          </label>
          <input
            :id="'statValue' + i"
            :value="characterStore.characterForm[`statValue${i}`]"
            type="number"
            class="w-full p-2 rounded-lg border text-center"
            disabled
          />
        </div>
      </template>
    </div>
    <button class="btn btn-secondary mt-2" @click="rerollStats">
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
