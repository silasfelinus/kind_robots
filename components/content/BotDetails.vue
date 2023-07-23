<template>
  <div
    class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border-2 border-solid border-secondary bg-primary opacity-90 rounded-lg shadow-lg text-base-content items-start h-auto lg:h-screen"
  >
    <div v-if="activeBot" class="col-span-full lg:col-span-1 flex flex-col">
      <div class="card bg-base-100 text-base-content shadow-xl flex-grow overflow-auto">
        <div class="flex flex-col lg:flex-row items-stretch">
          <avatar-image />
        </div>
        <div class="card-body flex-grow overflow-auto">
          <h1 class="text-5xl font-semibold mb-4 card-title">{{ activeBot.name }}</h1>
          <p class="mt-4 text-2xl">{{ activeBot.description }}</p>
          <div class="w-40">
            <label for="n-selection" class="block text-sm font-medium text-gray-700"
              >Variations:</label
            >
            <select
              id="n-selection"
              v-model="activeBot.n"
              name="n-selection"
              class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option v-for="n in 12" :key="n" :value="n">
                {{ n }}
              </option>
            </select>
          </div>
          <div v-if="activeBot.size" class="mt-4">
            <label for="size-selection" class="block text-sm font-medium text-gray-700">
              Select Size:
            </label>
            <select
              id="size-selection"
              v-model="activeBot.size"
              name="size-selection"
              class="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="512x512">512x512</option>
              <option value="768x768">768x768</option>
              <option value="1028x1028">1024x1024</option>
            </select>
          </div>
          <div
            v-if="activeBot.model || activeBot.post || activeBot.size"
            class="flex flex-wrap gap-2"
          >
            <p v-if="activeBot.model" class="text-accent-700">Model: {{ activeBot.model }}</p>
            <p v-if="activeBot.post" class="text-accent-700">Post: {{ activeBot.post }}</p>
            <p v-if="activeBot.size" class="text-accent-700">Size: {{ activeBot.size }}</p>
          </div>
          <div class="mt-4">
            <temperature-slider v-if="activeBot.temperature !== null" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useBotStore } from '../../stores/botStore'

const botsStore = useBotStore()
let activeBot = computed(() => botsStore.getActiveBot)
const bots = ref(botsStore.getBots)
</script>
../../stores/botStore
