<template>
  <!-- Main container with reduced padding/margin, full height, and no scrolling -->
  <div
    class="flex flex-col items-center bg-base-300 p-2 m-1 h-screen overflow-hidden"
  >
    <bot-selector />

    <!-- Display bot details if a bot is selected -->
    <div
      v-if="currentBot"
      :data-theme="currentBot.theme"
      class="w-full bg-base-300 rounded-2xl h-full flex flex-col"
    >
      <!-- Bot name and ID, combining into a single line to reduce vertical space -->
      <div class="flex justify-between items-center m-2">
        <h1 class="text-2xl font-bold">
          {{ currentBot.name }}
          <span class="text-sm text-gray-600"
            >Bot ID#{{ currentBot.id - 1 }}</span
          >
        </h1>
        <span class="text-sm text-gray-600">Meet Them All!</span>
      </div>

      <!-- Responsive layout with fixed heights to prevent overflow -->
      <div
        class="flex flex-col md:flex-row justify-between w-full m-2 rounded-lg flex-grow"
      >
        <!-- Bot Avatar and Carousel -->
        <div class="w-full md:w-1/3 p-2 flex-shrink-0 max-h-full">
          <bot-carousel2 class="h-full" />
        </div>

        <!-- Bot Details and Stream Test in a single column for larger screens -->
        <div class="flex-1 flex flex-col w-full md:w-2/3 p-2 h-full">
          <!-- Bot Details -->
          <div class="text-center mb-2 flex-grow">
            <h2 class="text-2xl font-semibold">
              {{ currentBot.name ?? 'Unknown Bot' }}
            </h2>
            <p class="text-md text-gray-600">
              {{ currentBot.subtitle ?? 'Subtitle' }}
            </p>
            <div class="card mt-2 p-2 bg-base-300">
              {{ currentBot.description ?? 'Description' }}
            </div>
          </div>

          <!-- Stream Test component positioned below Bot Details and taking remaining space -->
          <div class="flex-grow flex items-end">
            <stream-test class="h-48 md:h-auto w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
</script>
