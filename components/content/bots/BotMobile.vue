<template>
  <div class="flex flex-col items-center bg-primary p-1 m-1 h-screen">
    <!-- Bot selector as a swipeable component -->
    <div class="flex overflow-x-auto space-x-4">
      <bot-bubble
        v-for="bot in bots"
        :key="bot.id"
        :bot="bot"
        :selected="bot.id === selectedBotId"
        class="w-auto"
        @click="selectBot(bot.id)"
      />
    </div>

    <!-- Chat window, switching based on currentChannel -->
    <div v-if="currentBot" class="relative w-full h-1/2 overflow-y-auto">
      Welcome to the Bot Cafe
      <component :is="currentComponent" />
    </div>

    <!-- Conditionally displayed icons on the left and right, with increased z-index -->
    <div class="fixed inset-x-0 bottom-2 flex justify-between px-1 z-50">
      <icon
        name="arrow-left"
        :class="iconLeftClass"
        @click="flipCard('left')"
      />
      <icon
        name="arrow-right"
        :class="iconRightClass"
        @click="flipCard('right')"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useBotStore } from '@/stores/botStore'
import BotBubble from './BotBubble.vue'
import BotChat from './BotChat.vue'
import AddBot from './AddBot.vue'
import BotMessages from './BotMessages.vue'

const botStore = useBotStore()
const bots = computed(() => botStore.bots)
const selectedBotId = computed(() => botStore.selectedBotId)
const currentBot = computed(() => botStore.currentBot)

const currentChannel = ref('chat') // Default to showing the chat window
const components = { chat: BotChat, addBot: AddBot, viewMessages: BotMessages }
const currentComponent = computed(() => components[currentChannel.value])

function selectBot(botId) {
  botStore.selectBot(botId) // Using the store's method to handle selection
}

function flipCard(direction) {
  const keys = Object.keys(components)
  const currentIndex = keys.indexOf(currentChannel.value)
  const nextIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1
  currentChannel.value = keys[(nextIndex + keys.length) % keys.length]
}

const iconLeftClass = computed(() =>
  currentChannel.value === 'chat'
    ? 'fluent--bot-add-20-regular'
    : 'arcticons--folder-messages',
)
const iconRightClass = computed(() =>
  currentChannel.value === 'viewMessages'
    ? 'fluent--bot-add-20-regular'
    : 'flowbite:messages-solid',
)
</script>
