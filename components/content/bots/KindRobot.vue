<template>
  <!-- Main container with reduced padding/margin -->
  <div class="flex flex-col items-center bg-base-200 p-2 m-1">
    <bot-selector />

    <!-- Display bot details if a bot is selected -->
    <div
      v-if="currentBot"
      :data-theme="currentBot.theme"
      class="w-full bg-base-200 rounded-2xl"
    >
      <!-- Bot name and ID, combining into a single line to reduce vertical space -->
      <div class="flex justify-between items-center m-2">
        <h1 class="text-2xl font-bold">
          {{ currentBot.name }} <span class="text-sm text-gray-600">Bot ID#{{ currentBot.id - 1 }}</span>
        </h1>
        <span class="text-sm text-gray-600">Meet Them All!</span>
      </div>

      <!-- Condense avatar and details into a single flex-row to reduce space -->
      <div class="flex flex-wrap items-center justify-between w-full m-2 rounded-lg">
        <!-- Bot Avatar and Carousel, tighter space -->
        <div class="w-1/3 p-2">
          <bot-carousel2 />
        </div>

        <!-- Bot Details with reduced text sizes -->
        <div class="flex-1 text-center p-2">
          <h2 class="text-2xl font-semibold">{{ currentBot.name ?? 'Unknown Bot' }}</h2>
          <p class="text-md text-gray-600">{{ currentBot.subtitle ?? 'Subtitle' }}</p>
          <div class="card mt-2 p-2 bg-base-100">
            {{ currentBot.description ?? 'Description' }}
          </div>
        </div>
      </div>

      <!-- Stream Test component, streamlined to avoid pushing too much down -->
      <div class="mt-2">
        <stream-test />
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

<style>
.animate-typing {
  overflow: hidden;
  white-space: nowrap;
  border-right: 0.15em solid transparent;
  animation:
    typing 2s steps(30, end),
    blink-caret 0.75s step-end infinite;
}

@keyframes typing {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

@keyframes blink-caret {
  from,
  to {
    border-color: transparent;
  }
  50% {
    border-color: inherit;
  }
}
</style>
