<template>
  <div class="chat-area w-full">
    <!-- Displaying each chat exchange -->
    <div v-if="chatStore.chatExchanges.length" class="chat-list grid gap-6">
      <response-card
        v-for="(exchange, index) in chatStore.chatExchangesByUserId"
        :key="index"
        :messages="[
          { role: 'user', content: exchange.userPrompt },
          { role: 'bot', content: exchange.botResponse }
        ]"
        :sendMessage="sendMessage"
      />
    </div>
    <p v-else class="text-center text-gray-600">No chat history yet.</p>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { ref, onMounted } from 'vue'

const chatStore = useChatStore()
const userStore = useUserStore()

// Ensure chat store is initialized
onMounted(async () => {
  await chatStore.initialize()
})

// Function to handle sending a message and updating chat store
const sendMessage = async (updatedMessages: { role: string; content: string }[]) => {
  const lastMessage = updatedMessages[updatedMessages.length - 1].content
  await chatStore.addOrUpdateExchange(lastMessage, userStore.user?.id ?? 0, chatStore.currentBotId)
}
</script>

<style scoped>
.chat-area {
  max-height: 500px;
  overflow-y: auto;
}
</style>
