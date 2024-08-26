<template>
  <div class="flex flex-col items-center bg-primary p-1 m-1 h-screen">
    <!-- Bot selector as a swipeable component -->
    <bot-bubble />
    <!-- Chat window, switching based on currentChannel -->
    <div
      v-if="currentBot"
      class="relative w-full max-h-1/2 overflow-y-auto rounded-2xl bg-primary m-1 p-1"
    >
      <component :is="currentComponent" />
    </div>

    <!-- Conditionally displayed icons on the left and right, with increased z-index -->
    <div class="fixed inset-x-0 bottom-0 flex justify-between z-50 m-2">
      <icon :name="iconLeftClass" :size="iconSize" @click="flipCard('left')" />
      <icon
        :name="iconRightClass"
        :size="iconSize"
        @click="flipCard('right')"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useBotStore } from './../../../stores/botStore'
import BotBubble from './BotBubble.vue'
import BotChat from './BotChat.vue'
import AddBot from './AddBot.vue'
import BotMessages from './BotMessages.vue'

const botStore = useBotStore()
const currentBot = computed(() => botStore.currentBot)
const currentChannel = ref('chat') // Default to showing the chat window
const components = { chat: BotChat, addBot: AddBot, viewMessages: BotMessages }
const currentComponent = computed(() => components[currentChannel.value])

const scrollContainer = ref(null)
const iconSize = ref(0)

function updateIconSize() {
  if (scrollContainer.value) {
    // Calculate the icon size as a fraction of the scroll container's width
    iconSize.value = scrollContainer.value.offsetWidth / 6
  }
}

onMounted(() => {
  nextTick(() => {
    updateIconSize()
    // Set up a ResizeObserver to watch for changes in the container size
    const resizeObserver = new ResizeObserver(updateIconSize)
    resizeObserver.observe(scrollContainer.value)
  })
})

onUnmounted(() => {
  // Clean up if necessary, though specifics depend on setup
})

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
