<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-center text-primary">
      AI Chat Interface
    </h1>

    <!-- API Key Input -->
    <div
      v-if="!isConnected && !userIsAdmin"
      class="bg-base-100 p-6 shadow-lg rounded-lg"
    >
      <p class="text-md text-warning mb-4">
        To use this chat, you must provide a valid OpenAI API key. Whisper
        requires an active OpenAI account (it may require payment). You are
        responsible for tracking and paying any costs incurred while using
        Whisper through this website.
      </p>
      <label for="api-key" class="block text-lg font-semibold mb-2"
        >Enter your OpenAI API Key:</label
      >
      <input
        id="api-key"
        v-model="apiKey"
        type="password"
        placeholder="API Key"
        class="w-full p-3 border rounded mb-4 bg-base-200 text-base-content"
        aria-label="OpenAI API Key"
      />
      <button
        class="btn btn-primary w-full"
        :disabled="!apiKey"
        aria-label="Connect to Whisper API"
        @click="connectToWhisper"
      >
        Connect to Whisper API
      </button>
    </div>

    <!-- Chat Interface -->
    <div
      v-else
      class="chat-interface mt-6 bg-base-100 p-6 shadow-lg rounded-lg"
    >
      <div v-if="isLoading" class="loading text-center mb-4">
        <p class="text-info">Connecting to Whisper API...</p>
      </div>

      <div
        class="messages bg-base-200 p-4 h-80 overflow-y-scroll rounded mb-4 shadow-inner"
      >
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="mb-3 bg-accent text-accent-content p-2 rounded"
        >
          <p>{{ message }}</p>
        </div>
      </div>

      <div class="input flex items-center">
        <input
          v-model="userInput"
          type="text"
          placeholder="Type a message..."
          class="flex-grow p-3 border rounded mr-2 bg-base-200 text-base-content"
          aria-label="Type your message"
        />
        <button
          class="btn btn-accent"
          aria-label="Send message"
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRuntimeConfig } from '#app'

const userIsAdmin = ref(false) // Replace with your admin check logic.
const apiKey = ref('')
const messages = ref<string[]>([]) // Ensure correct typing as ref array
const userInput = ref('')
const isConnected = ref(false)
const isLoading = ref(false) // Added isLoading state
const socket = ref<WebSocket | null>(null)

const connectToWhisper = () => {
  const config = useRuntimeConfig()

  const keyToUse = userIsAdmin.value ? config.OPENAI_API_KEY : apiKey.value

  if (!keyToUse) return // Prevent connection if no API key is available

  isLoading.value = true // Start loading state
  socket.value = new WebSocket('wss://api.openai.com/v1/realtime')

  socket.value.onopen = () => {
    console.log('Connected to Whisper API')
    isConnected.value = true
    isLoading.value = false // Stop loading state

    // Send initial connection payload with API key
    socket.value?.send(
      JSON.stringify({
        api_key: keyToUse, // Use keyToUse here
        action: 'connect',
      }),
    )
  }

  socket.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.text) {
        ;(messages.value as string[]).push(data.text) // Ensure messages is treated as array
      } else {
        ;(messages.value as string[]).push('Received data without text.')
      }
    } catch (error) {
      ;(messages.value as string[]).push('Error parsing data from API.')
      console.error('Error parsing WebSocket message:', error)
    }
  }

  socket.value.onclose = () => {
    console.log('Disconnected from Whisper API')
    isConnected.value = false
    isLoading.value = false // Stop loading on close
  }

  socket.value.onerror = (error) => {
    console.error('Error with Whisper API:', error)
    isLoading.value = false // Stop loading on error
  }
}

const sendMessage = () => {
  if (userInput.value.trim() === '' || !isConnected.value) return

  const config = useRuntimeConfig()
  const keyToUse = apiKey.value || config.OPENAI_API_KEY

  socket.value?.send(
    JSON.stringify({
      api_key: keyToUse, // Use keyToUse consistently
      input: userInput.value,
    }),
  )
  ;(messages.value as string[]).push(`You: ${userInput.value}`) // Correctly push message
  userInput.value = ''
}

// Automatically connect for admin users
onMounted(() => {
  if (userIsAdmin.value) {
    connectToWhisper()
  }
})
</script>

<style>
.chat-interface {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.loading p {
  font-size: 1.25rem;
  color: var(--color-info);
}
</style>
