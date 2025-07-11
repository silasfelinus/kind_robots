<!-- /components/content/bots/bot-messages.vue -->
<template>
  <div class="container mx-auto border rounded-2xl bg-base-300 px-4">
    <div class="select-container my-4">
      <select
        v-model="selectedBotId"
        class="block w-full p-2 rounded-2xl border border-gray-300"
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
        <h3 class="text-lg font-semibold">
          {{ message.sender }} (Bot: {{ message.botName }})
        </h3>
      </div>
      <p class="user-prompt mb-1 text-gray-600">{{ message.title }}</p>
      <p class="bot-response font-medium">{{ message.content }}</p>
    </div>
    <public-wall />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useChatStore } from './../../stores/chatStore'
import { useUserStore } from './../../stores/userStore'
import { useBotStore } from './../../stores/botStore'

// Get stores and necessary properties
const { userId } = useUserStore()
const { selectedBotId, bots } = useBotStore()
const { fetchChats, chats } = useChatStore()

// Fetch chat exchanges on mount
onMounted(async () => {
  if (userId) {
    try {
      await fetchChats(userId)
    } catch (error) {
      console.error('Failed to fetch chat exchanges:', error)
    }
  } else {
    console.error('userId is not available.')
  }
})

// Filter messages based on selectedBotId
const filteredMessages = computed(() => {
  if (!chats || chats.length === 0) return []

  return selectedBotId
    ? chats.filter((exchange: Chat) => exchange.botId === selectedBotId)
    : chats
})
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
