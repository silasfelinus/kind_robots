<template>
  <div class="flex flex-col items-center bg-primary p-1 m-1">
    <!-- Bot selector as a swipeable component -->
    <div class="flex overflow-x-auto space-x-4">
      <bot-bubble
        v-for="bot in bots"
        :key="bot.id"
        :bot="bot"
        class="mr-1 w-auto"
        @click="selectBot(bot.id)"
      />
    </div>

    <!-- Chat window, switching based on currentChannel -->
    <div v-if="currentBot" class="relative w-full h-1/2 overflow-y-auto">
      Welcome to the Bot Cafe
      <bot-chat v-if="currentChannel === 'chat'" />
      <add-bot v-if="currentChannel === 'addBot'" />
      <bot-messages v-if="currentChannel === 'viewMessages'" />
    </div>

    <!-- Conditionally displayed icons on the left and right, with increased z-index -->
    <div
      class="icon-bar fixed inset-x-0 bottom-2 flex justify-between px-1 z-50"
    >
      <div v-if="currentChannel === 'chat'">
        <Icon
          name="arrow-left"
          class="fluent--bot-add-20-regular"
          @click="flipCard('left')"
        />
        <Icon
          name="arrow-right"
          class="arcticons--folder-messages"
          @click="flipCard('right')"
        />
      </div>
      <div v-if="currentChannel === 'addBot'">
        <Icon
          name="arrow-left"
          class="arcticons--folder-messages"
          @click="flipCard('left')"
        />
        <Icon
          name="arrow-right"
          class="flowbite:messages-solid"
          @click="flipCard('right')"
        />
      </div>
      <div v-if="currentChannel === 'viewMessages'">
        <Icon
          name="arrow-left"
          class="flowbite:messages-solid"
          @click="flipCard('left')"
        />
        <Icon
          name="arrow-right"
          class="fluent--bot-add-20-regular"
          @click="flipCard('right')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'
import BotBubble from './bot-bubble.vue'
import BotChat from './BotStream.vue'
import BotMessages from './bot-messages.vue'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const currentBot = computed(() => botStore.currentBot)
const currentChannel = ref('chat') // Default to showing the chat window

function selectBot(botId: number) {
  botStore.getBotById(botId)
  currentChannel.value = 'chat' // Reset to chat view when a new bot is selected
}

function flipCard(direction: 'left' | 'right') {
  if (direction === 'left') {
    if (currentChannel.value === 'chat') {
      currentChannel.value = 'addBot' // From chat to add bot
    } else if (currentChannel.value === 'viewMessages') {
      currentChannel.value = 'addBot' // Loop back from view messages to add bot
    } else {
      currentChannel.value = 'chat' // From add bot back to chat
    }
  } else if (direction === 'right') {
    if (currentChannel.value === 'chat') {
      currentChannel.value = 'addBot' // From chat to add bot
    } else if (currentChannel.value === 'addBot') {
      currentChannel.value = 'viewMessages' // From add bot to view messages
    } else {
      currentChannel.value = 'chat' // From view messages back to chat
    }
  }
}
</script>

<style scoped>
.bot-selector-swipe {
  display: flex;
  overflow-x: auto;
  padding: 1vw; /* was 10px */
  white-space: nowrap;
  scrollbar-width: none; /* Hide scrollbar for cleaner design */
}
.bot-bubble {
  margin-right: 1vw; /* was 10px */
  text-align: center;
  cursor: pointer;
}
.icon-bar {
  position: fixed;
  bottom: 2vh; /* was 20px */
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 1vw; /* was 10px */
}
.icon-left,
.icon-right {
  display: flex;
}
.chat-window {
  position: relative;
  max-height: 80vh; /* already in vh */
  overflow-y: auto;
}
.bot-avatar {
  width: 10vw; /* Adjusted from 80px */
  height: 10vw; /* Adjusted from 80px */
  border-radius: 50%;
  object-fit: cover;
}
</style>
