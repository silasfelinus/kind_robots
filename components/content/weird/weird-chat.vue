<template>
  <div
    class="weird-chat-container bg-base-200 border rounded-2xl shadow-lg p-4 flex flex-col space-y-4 h-full"
  >
    <!-- Chat Header -->
    <div class="chat-header bg-primary text-white p-2 rounded-lg">
      <h2 class="text-lg font-bold">
        Chat with {{ activeCharacter?.name || 'Your Character' }}
      </h2>
    </div>

    <!-- Chat History -->
    <div
      class="chat-history bg-base-100 rounded-lg flex-grow p-4 overflow-y-auto"
    >
      <div v-for="(message, index) in chatHistory" :key="index" class="mb-4">
        <p
          :class="{
            'text-primary': message.sender === 'You',
            'text-secondary': message.sender !== 'You',
          }"
        >
          <strong>{{ message.sender }}:</strong> {{ message.content }}
        </p>
      </div>
    </div>

    <!-- Input Section -->
    <div
      class="chat-input bg-base-300 rounded-lg p-4 flex items-center space-x-4"
    >
      <input
        v-model="userMessage"
        type="text"
        class="input flex-grow"
        placeholder="Type your message..."
        @keypress.enter="sendMessage"
      />
      <button
        class="btn btn-primary"
        :disabled="!userMessage.trim() || loading"
        @click="sendMessage"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'

const weirdStore = useWeirdStore()

// State
const userMessage = ref('')
const loading = ref(false)

// Computed Properties
const activeCharacter = computed(() => weirdStore.activeCharacter)
const chatHistory = computed(() => weirdStore.history || [])

// Methods
const sendMessage = async () => {
  if (!userMessage.value.trim()) return
  loading.value = true

  try {
    // Add the user's message to the chat history
    await weirdStore.processAction(userMessage.value)

    // Clear input field
    userMessage.value = ''
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.weird-chat-container {
  width: 100%;
  max-width: 800px;
  height: 400px;
  margin: auto;
  display: flex;
  flex-direction: column;
}
.chat-header {
  text-align: center;
}
.chat-history {
  max-height: 300px;
}
.chat-input {
  display: flex;
}
.input {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.5rem;
}
</style>
