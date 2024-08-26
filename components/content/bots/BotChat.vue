<template>
  <div class="flex flex-col h-screen rounded-2xl m-1 p-1">
    <!-- Unified Top Half with image and info/stream side by side -->
    <div class="flex flex-row h-2/3 w-full">
      <!-- Allocate more space to the top half -->
      <!-- Bot's Image with oval aspect -->
      <div class="w-2/3 flex justify-center items-center">
        <img
          :src="currentBot.avatarImage"
          alt="Bot's Avatar"
          class="w-2/3 h-2/3 rounded-sm object-cover"
        />
      </div>
      <!-- Info and Stream in the same column -->
      <div
        class="w-2/3 h-2/3 overflow-y-scroll flex flex-col justify-between p-2"
      >
        <div class="text-left border rounded-2xl m-2 p-1 bg-primary">
          <h2 class="text-xl font-bold">{{ currentBot.name }}</h2>
          <p class="text-md">{{ currentBot.description }}</p>
        </div>
        <!-- Bot Stream placed directly under the info -->
        <bot-stream class="flex-grow overflow-y-auto" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useBotStore } from '../../../stores/botStore'
import BotStream from './BotStream.vue'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
</script>

<style scoped>
@media (max-width: 640px) {
  .text-xl {
    font-size: 1rem;
  }
  .text-md {
    font-size: 0.875rem;
  }
  .text-sm {
    font-size: 0.75rem;
  }
}
</style>

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
