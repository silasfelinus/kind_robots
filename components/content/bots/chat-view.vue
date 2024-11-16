<template>
  <div class="p-6 m-4 mx-auto max-w-screen-lg bg-base-200 rounded-2xl border">
    <h1 class="text-4xl text-center mb-6">Chat Manager</h1>

    <!-- Chat Input -->
    <div class="mb-6">
      <label for="chatContent" class="block text-lg font-medium mb-2"
        >Enter Message:</label
      >
      <input
        id="chatContent"
        v-model="chatContent"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Type your message here..."
      />
    </div>

    <!-- Recipient Input -->
    <div class="mb-6">
      <label for="recipientId" class="block text-lg font-medium mb-2"
        >Recipient ID:</label
      >
      <input
        id="recipientId"
        v-model.number="recipientId"
        type="number"
        class="w-full p-3 rounded-lg border"
        placeholder="Enter recipient ID..."
      />
    </div>

    <!-- Submit Button -->
    <div class="flex justify-center mb-6">
      <button
        :disabled="loading || !chatContent.trim() || !recipientId"
        class="btn btn-primary w-full sm:w-auto transition duration-300 ease-in-out"
        @click="createChat"
      >
        <span v-if="!loading">Create Chat</span>
        <span
          v-else
          class="spinner-border spinner-border-sm"
          role="status"
        ></span>
      </button>
    </div>

    <!-- Chat Cards -->
    <div v-if="chats.length" class="grid grid-cols-1 gap-4">
      <chat-card
        v-for="chat in chats"
        :key="chat.id"
        :chat-id="chat.id"
        class="border p-4 rounded-lg"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

const chatContent = ref('')
const recipientId = ref<number | null>(null)
const loading = ref(false)
const chats = ref([])
const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()

async function createChat() {
  if (!chatContent.value.trim() || !recipientId.value) return

  loading.value = true

  try {
    // Add new chat
    const newChat = await chatStore.addChat({
      content: chatContent.value,
      userId: userStore.userId,
      botId: botStore.currentBot?.id || null, // Replace with actual botId logic
      recipientId: recipientId.value,
    })

    // Stream response for the created chat
    await chatStore.streamResponse(newChat.id)

    // Add new chat to the displayed chats
    chats.value.push(newChat)
  } catch (error) {
    console.error('Error creating chat:', error)
  } finally {
    chatContent.value = ''
    recipientId.value = null
    loading.value = false
  }
}
</script>

<style scoped>
.spinner-border {
  border-width: 2px;
  width: 1rem;
  height: 1rem;
  border-color: white;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
