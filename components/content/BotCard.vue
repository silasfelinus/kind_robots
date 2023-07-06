<template>
  <div
    class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-8 bg-gray-200 rounded-lg shadow-lg text-black items-start"
  >
    <div v-if="activeBot" class="col-span-full sm:col-span-1">
      <h1 class="text-5xl font-semibold mb-4 text-black">{{ activeBot.name }}</h1>
      <div class="w-96 h-96 bg-secondary-300 rounded-full overflow-hidden">
        <img
          :src="activeBot.avatarImage ? activeBot.avatarImage : 'path/to/default/image.png'"
          class="object-cover w-full h-full"
          alt="Bot Avatar"
        />
      </div>
    </div>
    <div v-if="activeBot" class="col-span-full sm:col-span-1">
      <p class="mt-4 text-2xl text-black">{{ activeBot.description }}</p>
      <div v-if="activeBot.model || activeBot.post" class="flex flex-wrap gap-2">
        <p v-if="activeBot.model" class="text-gray-700">Model: {{ activeBot.model }}</p>
        <p v-if="activeBot.post" class="text-gray-700">Post: {{ activeBot.post }}</p>
      </div>
      <div v-if="activeBot.temperature" class="mt-4">
        <label for="temperature" class="block text-sm font-medium text-gray-700">Temperature</label>
        <div class="mt-1 relative rounded-md shadow-sm">
          <input
            id="temperature"
            v-model="activeBot.temperature"
            type="range"
            step="0.1"
            min="0"
            max="1"
            class="slider bg-primary h-1 w-full overflow-hidden cursor-pointer rounded-full"
          />
        </div>
        <p class="text-sm text-primary">More Creative - More Consistent</p>
      </div>
      <p v-if="activeBot.maxTokens" class="text-accent">Max Tokens: {{ activeBot.maxTokens }}</p>
      <p class="text-accent">Prompt: {{ activeBot.prompt }}</p>
      <p v-if="activeBot.image" class="text-accent">Image: {{ activeBot.image }}</p>
      <p v-if="activeBot.mask" class="text-accent">Mask: {{ activeBot.mask }}</p>
      <p v-if="activeBot.style" class="text-accent">Style: {{ activeBot.style }}</p>
      <div v-if="activeBot.n" class="mt-4">
        <label for="iterations" class="block text-sm font-medium text-primary"
          >Number of Iterations</label
        >
        <input id="iterations" v-model="activeBot.n" type="number" class="input input-primary" />
      </div>
      <p v-if="activeBot.createdAt" class="text-accent">Created At: {{ activeBot.createdAt }}</p>
      <p v-if="activeBot.intro" class="text-accent">Intro: {{ activeBot.intro }}</p>
      <p v-if="activeBot.size" class="text-accent">Size: {{ activeBot.size }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()

const activeBot = computed(() => botsStore.getActiveBot)
</script>

<style scoped>
body {
  font-family: Arial, sans-serif;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4caf50;
  cursor: pointer;
}
</style>
