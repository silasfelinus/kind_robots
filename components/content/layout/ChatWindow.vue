<template>
  <div class="relative">
    <!-- Pulsing Chat Icon -->
    <div class="p-4 rounded-full bg-primary cursor-pointer animate-pulse" @click="toggleState">
      <icon name="mdi:chat" class="text-default text-2xl" />
    </div>

    <!-- Chat Window -->
    <div v-if="currentState === 'chat'" class="tooltip-container">
      <span class="font-semibold">
        <icon name="mdi:chat" class="text-default mr-2 text-2xl" />
        Silas Says: <span class="text-default text-xl">{{ streamedText }}</span>
      </span>
    </div>

    <!-- Bot Selector and Messaging -->
    <div v-if="currentState === 'bot'" class="tooltip-container">
      <bot-selector />
      <div class="mt-4">
        <span class="font-semibold">Chatting with: {{ botStore.currentBot }}</span>
        <textarea v-model="botMessage" class="w-full p-2 rounded border"></textarea>
        <button class="bg-primary text-default rounded p-2 mt-2" @click="sendMessageToBot">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useBotStore } from '@/stores/botStore'

const props = defineProps<{
  tooltip: string
}>()

const streamedText = ref('')
const botMessage = ref('')
const botStore = useBotStore()
let index = 0
let timer: number
const currentState = ref('chat') // 'chat' or 'bot'

const startStreaming = () => {
  timer = window.setInterval(() => {
    if (index < props.tooltip.length) {
      streamedText.value += props.tooltip[index]
      index++
    } else {
      clearInterval(timer)
    }
  }, 50)
}

const toggleState = () => {
  currentState.value = currentState.value === 'chat' ? 'bot' : 'chat'
}

const sendMessageToBot = () => {
  // Your logic to send the message to the selected bot
}

onMounted(() => {
  startStreaming()
})

watch(
  () => props.tooltip,
  () => {
    clearInterval(timer)
    streamedText.value = ''
    index = 0
    startStreaming()
  }
)
</script>

<style scoped>
.tooltip-container {
  background-color: var(--bg-base-400);
  color: var(--bg-primary);
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}
</style>
