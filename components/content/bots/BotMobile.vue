<template>
  <div :class="`flex flex-col items-center bg-base-200 p-1 m-1`">
    <!-- Bot selector as a swipeable component -->
    <div class="bot-selector-swipe">
      <bot-bubble
        v-for="bot in bots"
        :key="bot.id"
        :bot="bot"
        @click="selectBot(bot.id)"
      />
    </div>

    <!-- Chat window, switching based on currentChannel -->
    <div v-if="currentBot" class="chat-window">
      <bot-chat v-if="currentChannel === 'chat'" />
      <add-bot v-if="currentChannel === 'addBot'" />
      <bot-messages v-if="currentChannel === 'viewMessages'" />

      <!-- Conditionally displayed icons on the left and right -->
      <div class="icon-bar">
        <Icon name="arrow-left" @click="flipCard('left')" />
        <Icon name="arrow-right" @click="flipCard('right')" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'

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
  padding: 10px;
  white-space: nowrap;
  scrollbar-width: none; /* Hide scrollbar for cleaner design */
}
.bot-bubble {
  margin-right: 10px;
  text-align: center;
  cursor: pointer;
}
.icon-bar {
  display: flex;
  justify-content: space-between;
  padding: 10px;
}
.icon-left,
.icon-right {
  display: flex;
}
</style>
