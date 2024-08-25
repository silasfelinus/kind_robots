<template>
  <div class="bot-messages-container">
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!chatExchanges.length" class="no-messages">
      No messages yet!
    </div>
    <ul v-else>
      <li
        v-for="exchange in chatExchanges"
        :key="exchange.id"
        class="message-item"
      >
        {{ exchange.userPrompt }}
        <!-- Here you can also add UI elements for reactions etc. -->
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useChatStore, type ChatExchange } from './../../../stores/chatStore'

const chatStore = useChatStore()
const loading = ref(true)
const chatExchanges = ref<ChatExchange[]>([])

onMounted(async () => {
  try {
    await chatStore.fetchChatExchanges()
    chatExchanges.value = chatStore.chatExchanges
  } catch (error) {
    console.error('Error loading chat exchanges:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.bot-messages-container {
  padding: 10px;
  background: #f0f0f0;
}
.loading {
  color: #888;
  text-align: center;
}
.no-messages {
  color: #aaa;
  text-align: center;
}
.message-item {
  margin-bottom: 10px;
  padding: 5px;
  border-bottom: 1px solid #ddd;
}
</style>
