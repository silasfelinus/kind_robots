<template>
  <div class="container mx-auto px-4">
    <h1 class="text-2xl font-bold my-4">Public Wall</h1>
    <div
      v-for="message in publicMessages"
      :key="message.id"
      class="message-card bg-white shadow-md rounded-2xl p-4 mb-4"
    >
      <div class="message-header flex items-center mb-2">
        <h3 class="text-lg font-semibold">
          {{ message.username }} (Bot: {{ message.botName }})
        </h3>
      </div>
      <p class="user-prompt mb-1 text-gray-600">{{ message.userPrompt }}</p>
      <p class="bot-response font-medium">{{ message.botResponse }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from './../../../stores/chatStore'

const chatStore = useChatStore()

const publicMessages = computed(() => {
  return chatStore.chatExchanges.filter((exchange) => exchange.isPublic)
})

onMounted(async () => {
  await chatStore.getPublic()
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
