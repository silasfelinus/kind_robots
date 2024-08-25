<template>
  <div class="flex flex-col h-screen">
    <!-- Top Half -->
    <div class="flex flex-row h-1/2 w-full">
      <!-- Bot's Image -->
      <div class="w-1/2 flex justify-center items-center p-4">
        <img
          :src="currentBot.avatarImage"
          alt="Bot's Avatar"
          class="w-full h-auto max-h-full rounded-full"
        />
      </div>
      <!-- Info Bits -->
      <div class="w-1/2 flex flex-col justify-center items-start p-4 text-left">
        <h2 class="text-2xl font-bold">{{ currentBot.name }}</h2>
        <p class="text-lg">{{ currentBot.description }}</p>
        <p class="text-md mt-2">{{ currentBot.userIntro }}</p>
      </div>
    </div>
    <!-- Bottom Half - Bot Stream -->
    <div class="h-1/2 w-full overflow-y-auto">
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
