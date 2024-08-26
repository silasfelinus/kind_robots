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
        <!-- Toggle Public Button -->
        <button
          class="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
          @click="togglePublic(message.id, !message.isPublic)"
        >
          {{ message.isPublic ? 'Unshare' : 'Share' }}
        </button>
      </div>
      <p class="user-prompt mb-1 text-gray-600">{{ message.userPrompt }}</p>
      <p class="bot-response font-medium">{{ message.botResponse }}</p>
    </div>
    <public-wall />
  </div>
</template>
<script setup>
import { computed, onMounted } from 'vue'
import { useChatStore } from './../../../stores/chatStore'
import { useUserStore } from './../../../stores/userStore'
import { useBotStore } from './../../../stores/botStore'
import PublicWall from './PublicWall.vue'

const userStore = useUserStore()
const botStore = useBotStore()
const chatStore = useChatStore()
const userId = computed(() => userStore.userId)
const selectedBotId = computed(() => botStore.selectedBotId)

onMounted(async () => {
  await chatStore.fetchChatExchangesByUserId(userId.value)
})

const filteredMessages = computed(() => {
  if (!selectedBotId.value) {
    return chatStore.chatExchanges
  }
  return chatStore.chatExchanges.filter(
    (exchange) => exchange.botId === selectedBotId.value,
  )
})

function togglePublic(id, newPublicStatus) {
  chatStore.togglePublic(id, newPublicStatus)
}

function filterMessages() {
  // Logic to refine message filtering when a bot is selected
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
