<template>
  <div class="flex flex-col h-screen">
    <!-- Top Half: More compact and utilizing space efficiently -->
    <div class="flex flex-row h-1/3 w-full">
      <!-- Reduced height to 1/3 of screen -->
      <!-- Bot's Image: More margin control and size adjustment -->
      <div class="w-1/3 flex justify-center items-center p-2">
        <!-- Reduced width and padding -->
        <img
          :src="currentBot.avatarImage"
          alt="Bot's Avatar"
          class="w-full h-full rounded-full object-cover"
        />
      </div>
      <!-- Info Bits: Adjusted text sizes and paddings -->
      <div class="w-2/3 flex flex-col justify-center items-start p-2 text-left">
        <!-- Increased width for info -->
        <h2 class="text-xl font-bold">{{ currentBot.name }}</h2>
        <!-- Smaller font size -->
        <p class="text-md">{{ currentBot.description }}</p>
        <p class="text-sm mt-1">{{ currentBot.userIntro }}</p>
        <!-- Smaller font size and margin top -->
      </div>
    </div>
    <!-- Bottom Half - Bot Stream: Increased space for interaction -->
    <div class="h-2/3 w-full overflow-y-auto">
      <!-- Increased height for bot stream -->
      <bot-stream />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBotStore } from '@/stores/botStore'
import BotStream from './BotStream.vue'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
</script>

<style scoped>
/* Ensure visual consistency and responsiveness */
@media (max-width: 640px) {
  .text-xl {
    font-size: 1rem;
  } /* Adjust font sizes for mobile */
  .text-md {
    font-size: 0.875rem;
  }
  .text-sm {
    font-size: 0.75rem;
  }
}
</style>
