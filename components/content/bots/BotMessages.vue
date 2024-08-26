<template>
  <div class="container mx-auto px-4">
    <div class="select-container my-4">
      <select
        v-model="selectedBotId"
        class="block w-full p-2 rounded-2xl border border-gray-300"
        @change="filterMessages"
      >
        <option value="">All Messages</option>
        <option v-for="bot in bots" :key="bot.id" :value="bot.id">
          {{ bot.name }}
        </option>
      </select>
    </div>

    <div
      v-for="message in filteredMessages"
      :key="message.id"
      class="message-card bg-white shadow-md rounded-2xl p-4 mb-4"
    >
      <div class="message-header flex items-center mb-2">
        <img
          v-if="message.avatar"
          :src="message.avatar"
          alt="User Avatar"
          class="w-10 h-10 rounded-full mr-2"
        />
        <h3 class="text-lg font-semibold">
          {{ message.username }} (Bot: {{ message.botName }})
        </h3>
      </div>
      <p class="user-prompt mb-1 text-gray-600">{{ message.userPrompt }}</p>
      <p class="bot-response font-medium">{{ message.botResponse }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useChatStore } from './../../../stores/chatStore'
import { useUserStore } from './../../../stores/userStore'
import { useBotStore } from './../../../stores/botStore'

const selectedBotId = computed(() => botStore.selectedBotId)
const userStore = useUserStore()
const botStore = useBotStore()
const userId = computed(() => userStore.userId)
const { chatExchanges, fetchChatExchangesByUserId } = useChatStore()

const bots = computed(() => botStore.bots)

onMounted(async () => {
  await fetchChatExchangesByUserId(userId)
})

const filteredMessages = computed(() => {
  if (!selectedBotId.value) {
    return chatExchanges
  }
  return chatExchanges.filter(
    (exchange) => exchange.botId === selectedBotId.value,
  )
})

function filterMessages() {
  // Additional client-side logic to refine how messages are filtered when a bot is selected
}
</script>

<style scoped>
.select-container select {
  background-color: white;
  transition: all 0.3s ease-in-out;
}
.select-container select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 1px #667eea;
}
.message-card {
  transition: transform 0.2s;
}
.message-card:hover {
  transform: translateY(-5px);
}
</style>
