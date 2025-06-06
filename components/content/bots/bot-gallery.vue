<!-- /components/content/bots/bot-gallery.vue -->
<template>
  <div class="w-full h-[100dvh] relative bg-base-300 flex flex-col">
    <!-- Title -->
    <div class="p-6 text-center flex-shrink-0">
      <h1 class="text-3xl font-bold text-gray-700">Bot Gallery</h1>
      <p class="text-lg text-gray-500">Select a bot to activate it</p>
    </div>

    <!-- Scrollable Bot Cards -->
    <div class="flex-1 overflow-y-auto px-6 pb-6">
      <div
        v-for="bot in bots"
        :key="bot.id"
        :id="'bot-' + bot.id"
        class="flex flex-col items-center bg-white rounded-3xl shadow-lg p-6 mb-6 cursor-pointer hover:shadow-xl transition-shadow"
        @click="selectBot(bot)"
      >
        <img
          :src="bot.avatarImage || '/images/bot.webp'"
          alt="Bot Avatar"
          class="w-24 h-24 rounded-full"
        />
        <h2 class="text-xl font-semibold mt-4 text-gray-700">{{ bot.name }}</h2>
        <p class="text-sm text-gray-500 mt-2 text-center">
          {{ bot.description }}
        </p>
      </div>
    </div>

    <!-- Active Bot Display -->
    <div
      v-if="currentBot"
      class="fixed bottom-0 w-full bg-gray-100 p-4 shadow-md"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <img
            :src="currentBot.avatarImage || '/images/bot.webp'"
            alt="Active Bot Avatar"
            class="w-12 h-12 rounded-full"
          />
          <div class="ml-4">
            <p class="text-lg font-bold text-gray-700">
              Active Bot: {{ currentBot.name }}
            </p>
            <p class="text-sm text-gray-500">{{ currentBot.description }}</p>
          </div>
        </div>
        <button
          class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600"
          @click="clearCurrentBot"
        >
          Clear Selection
        </button>
      </div>
    </div>
  </div>
</template>


<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useBotStore } from '@/stores/botStore'

// Store
const botStore = useBotStore()

// Computed Properties
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

// Methods
const selectBot = (bot: Bot) => {
  botStore.selectBot(bot.id)
}

const clearCurrentBot = () => {
  botStore.currentBot = null
}
</script>
