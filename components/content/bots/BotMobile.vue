<template>
  <!-- Main container with dynamic theme -->
  <div
    :class="`flex flex-col items-center bg-base-200 p-1 m-1 theme-${currentBot?.theme || 'default'}`"
  >
    <!-- Bot selector bubble area -->
    <div class="bot-bubbles-container">
      <div
        v-for="bot in bots"
        :key="bot.id"
        class="bot-bubble"
        @click="selectBot(bot.id)"
      >
        <img :src="bot.avatarImage" alt="Bot's Avatar" class="bot-avatar" />
        <div class="bot-info">
          <h3>{{ bot.name }}</h3>
          <p>{{ bot.tagline }}</p>
        </div>
      </div>
    </div>

    <!-- Display bot details if a bot is selected -->
    <div
      v-if="currentBot"
      :class="`w-full rounded-2xl theme-${currentBot.theme}`"
    >
      <!-- Bot name and ID -->
      <div class="flex justify-between items-center m-4">
        <h1 class="text-3xl font-bold">
          {{ currentBot.name }}
        </h1>
        <span class="text-sm text-gray-600">
          Bot ID#{{ currentBot.id - 1 }} / Meet Them All!
        </span>
      </div>
      <stream-test />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from '../../../stores/botStore'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)

// Method to handle bot selection
function selectBot(botId: number) {
  botStore.getBotById(botId)
}
</script>

<style scoped>
.bot-bubbles-container {
  display: flex;
  overflow-x: scroll;
  padding: 10px;
  white-space: nowrap;
  background-color: #f0f0f0;
}
.bot-bubble {
  margin-right: 10px;
  text-align: center;
  cursor: pointer;
}
.bot-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
