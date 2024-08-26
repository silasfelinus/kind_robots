<template>
  <div class="flex flex-col items-center p-1 m-1 h-screen bg-primary">
    <!-- Bot selector as a swipeable component -->
    <bot-bubble />

    <!-- Always display the component area, but conditionally show content -->
    <div class="relative w-full max-h-1/2 overflow-y-auto rounded-2xl m-1 p-1">
      <component :is="currentComponent" />
    </div>

    <!-- Conditionally displayed icons on the left and right, with increased z-index -->
    <div class="fixed w-12 h-12 bottom-8 right-8 p-2 shadow-md z-50">
      <icon :name="iconLeftClass" @click="flipChannel('left')" />
    </div>
    <div class="fixed w-12 h-12 bottom-8 left-8 icon-accent border z-50">
      <icon :name="iconRightClass" @click="flipChannel('right')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import BotBubble from './BotBubble.vue'
import BotChat from './BotChat.vue'
import AddBot from './AddBot.vue'
import BotMessages from './BotMessages.vue'

const botStore = useBotStore()
const currentChannel = ref('chat') // Default to showing the chat window
const components = { chat: BotChat, addBot: AddBot, viewMessages: BotMessages }
const currentComponent = computed(() => components[currentChannel.value])

const iconLeftClass = computed(() => currentChannel.value === 'chat' ? 'fluent--bot-add-20-regular' : 'arcticons--folder-messages')
const iconRightClass = computed(() => currentChannel.value === 'viewMessages' ? 'flowbite:messages-solid' : 'fluent--bot-add-20-regular')

function flipChannel(direction) {
  const channels = Object.keys(components);
  const currentIndex = channels.indexOf(currentChannel.value);
  const nextIndex = direction === 'right' ? (currentIndex + 1) % channels.length : (currentIndex - 1 + channels.length) % channels.length;
  currentChannel.value = channels[nextIndex];
}
</script>