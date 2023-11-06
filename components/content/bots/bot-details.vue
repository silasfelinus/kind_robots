<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-2 border-solid border-secondary bg-primary opacity-90 rounded-lg shadow-lg text-base-content items-start h-auto lg:h-screen"
  >
    <div v-if="currentBot" class="col-span-full lg:col-span-1 flex flex-col">
      <div class="card bg-base-200 text-base-content shadow-xl flex-grow overflow-auto">
        <div class="flex flex-col lg:flex-row items-stretch">
          <avatar-image />
        </div>
        <div class="card-body flex-grow overflow-auto">
          <h1 class="text-5xl font-semibold mb-4 card-title">{{ currentBot.name }}</h1>
          <p class="mt-4 text-2xl">{{ currentBot.description }}</p>
          <div class="w-40">
            <label for="n-selection" class="block text-sm font-medium text-gray-700">Variations:</label>
          </div>
        </div>
        <div class="mt-4">
          <temperature-slider />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useBotStore } from '../../../stores/botStore';

const botsStore = useBotStore();
const currentBot = computed(() => botsStore.currentBot);
const bots = computed(() => botsStore.bots);
</script>
