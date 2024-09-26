<template>
  <!-- Main container with reduced padding/margin and vertical scroll handling -->
  <div class="flex flex-col items-center bg-base-300 p-2 m-1 overflow-y-auto">
    <bot-selector />

    <!-- Display bot details if a bot is selected -->
    <div
      v-if="currentBot"
      :data-theme="currentBot.theme"
      class="w-full bg-base-300 rounded-2xl"
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

      <!-- Condense avatar, details, and stream-test into a single row -->
      <div
        class="flex flex-wrap items-start justify-between w-full m-2 rounded-lg"
      >
        <!-- Bot Avatar and Carousel -->
        <div class="w-1/3 p-2">
          <bot-carousel2 />
        </div>

        <!-- Bot Details -->
        <div class="flex-1 text-center p-2">
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

        <!-- Stream Test component placed next to Bot Details -->
        <div class="w-1/3 p-2">
          <stream-test />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue' // Import computed
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
</script>
