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
          <!-- Toggle Public Button for user messages -->
          <button
            class="ml-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
            @click="togglePublic(message.id)"
          >
            {{ message.isPublic ? 'Unshare' : 'Share' }}
          </button>
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
import { computed, onMounted } from 'vue'
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

// Function to toggle the visibility of the user's own chat exchanges
const togglePublic = async (exchangeId: number) => {
  try {
    await chatStore.togglePublic(exchangeId)
  } catch (error) {
    console.error('Error toggling public state:', error)
  }
}

// Fetch public messages and user's own exchanges on mount
onMounted(async () => {
  await chatStore.getPublic() // Fetch public messages
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
