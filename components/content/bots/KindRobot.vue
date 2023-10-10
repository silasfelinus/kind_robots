<template>
  <!-- Main container -->
  <div class="flex flex-col items-center bg-base-400 p-4">
    <!-- Display bot details if a bot is selected -->
    <div v-if="currentBot" :data-theme="currentBot.theme" class="w-full bg-base-400 rounded-2xl">
      <!-- Bot name and ID -->
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold">{{ currentBot.name }}</h1>
        <span class="text-sm text-gray-600">Bot ID#{{ currentBot.id }} Collect Them All!</span>
      </div>

      <!-- Stream test component -->
      <div class=""><stream-test /></div>
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
