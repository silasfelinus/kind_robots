<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()
let activeBot = computed(() => botsStore.getActiveBot)
const bots = ref(botsStore.getBots)
const toggled = ref(false)
</script>
<template>
  <div
    class="card-front grid grid-rows-4 gap-4 p-4 border-2 border-solid border-gray-300 bg-base-200 opacity-90 rounded-lg shadow-lg text-base-content items-start h-auto lg:h-screen my-4"
  >
    <div v-if="activeBot" class="row-span-full lg:row-span-1 flex flex-col items-center space-y-4">
      <div class="card bg-base-100 text-base-content shadow-xl flex-grow overflow-auto w-full">
        <div class="flex flex-col items-center p-4">
          <avatar-image class="w-64 h-64 object-cover rounded-full mb-4" />
          <h1 class="text-4xl font-semibold mb-2 card-title">{{ activeBot.name }}</h1>
          <p class="mt-2 text-xl">{{ activeBot.description }}</p>
          <div class="w-40">
            <label for="n-selection" class="block text-sm font-medium text-gray-700"
              >Select Number of Iterations:</label
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
          <div v-if="activeBot.size" class="flex flex-wrap gap-2">
            <p v-if="activeBot.size" class="text-accent-700">Size: {{ activeBot.size }}</p>
          </div>
          <div class="mt-4">
            <div class="mt-4">
              <temperature-slider v-if="activeBot.temperature !== null" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-front {
  perspective: 1000px;
}

.card-front .v-enter-active,
.card-front .v-leave-active {
  transition: transform 0.6s;
}

.card-front .v-enter,
.card-front .v-leave-to {
  transform: rotateY(180deg);
}
</style>
