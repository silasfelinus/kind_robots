<template>
  <div v-if="bot" class="bot-card flex rounded-2xl bg-base-300 p-4">
    <img
      :src="bot.avatarImage || '/images/avatars/lingua1.webp'"
      alt="Bot Avatar"
      class="w-16 h-16 rounded-full"
    />
    <div class="ml-4">
      <h2 class="text-lg font-bold">
        {{ bot.name }}
      </h2>
      <p v-if="bot.subtitle" class="text-sm">
        {{ bot.subtitle }}
      </p>
      <p v-if="bot.personality" class="text-xs text-accent">
        {{ bot.personality }}
      </p>
      <button
        class="bg-primary text-white rounded px-2 py-1 mt-2"
        @click="selectBot(bot.id)"
      >
        Chat
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from './../../../stores/botStore'

const botStore = useBotStore()

// Get the currently selected bot
const bot = computed(() => botStore.currentBot)

// Function to select a bot by its ID
function selectBot(botId: number) {
  botStore.selectBot(botId)
}
</script>
