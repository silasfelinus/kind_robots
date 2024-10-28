<template>
  <div class="container mx-auto px-4">
    <h1 class="text-2xl font-bold my-4">Public Wall</h1>

    <!-- Show user-specific messages first -->
    <div>
      <h2 class="text-xl font-semibold my-2">Your Messages</h2>
      <div
        v-for="message in userMessages"
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

    <!-- Show public messages from other users -->
    <div>
      <h2 class="text-xl font-semibold my-2">Public Messages</h2>
      <div
        v-for="message in otherPublicMessages"
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from './../../../stores/chatStore'
import { useUserStore } from './../../../stores/userStore'

const chatStore = useChatStore()
const userStore = useUserStore()

// Computed property to get the user's own chat exchanges
const userMessages = computed(() => {
  return chatStore.chatExchanges.filter(
    (exchange: ChatExchange) => exchange.userId === userStore.user?.id,
  )
})

// Computed property to get other users' public chat exchanges
const otherPublicMessages = computed(() => {
  return chatStore.chatExchanges.filter(
    (exchange: ChatExchange) =>
      exchange.isPublic && exchange.userId !== userStore.user?.id,
  )
})

</script>

<style scoped>
.message-card {
  transition: transform 0.2s;
}
.message-card:hover {
  transform: translateY(-5px);
}
</style>
