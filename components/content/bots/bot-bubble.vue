<template>
  <div
    :class="[
      'bot-bubble',
      isSelected ? 'flex-row items-start' : 'flex-col items-center',
    ]"
    class="cursor-pointer p-2 rounded-lg bg-base-200 shadow transition-all duration-300 ease-in-out w-full"
    @click="selectBot(bot.id)"
  >
    <!-- Bot Avatar -->
    <img
      :src="bot.avatarImage"
      alt="Bot's Avatar"
      class="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 rounded-full object-cover transition-all duration-300 ease-in-out"
    />

    <!-- Conditional Bot Info -->
    <div v-if="isSelected" class="bot-info pl-4 flex-grow">
      <h3 class="text-lg font-semibold">{{ bot.name }}</h3>
      <p class="text-sm text-gray-600">{{ bot.tagline }}</p>
    </div>

    <!-- Always visible Bot Name -->
    <h3 v-else class="text-lg font-semibold mt-2">{{ bot.name }}</h3>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBotStore } from './../../../stores/botStore' // Ensure the path is correct
import type { Bot } from './../../../stores/botStore'

// Define props and capture them in a variable for later use
const props = defineProps<{
  bot: Bot
}>()

const botStore = useBotStore()
const isSelected = computed(() => botStore.selectedBotId === props.bot.id)

function selectBot(botId: number) {
  botStore.selectBot(botId)
}
</script>
