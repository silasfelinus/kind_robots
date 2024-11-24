<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">AI Chat Interface</h1>

    <!-- API Key Input -->
    <div v-if="!isConnected">
      <label class="block text-lg mb-2">Enter your OpenAI API Key:</label>
      <input
        v-model="apiKey"
        type="password"
        placeholder="API Key"
        class="w-full p-3 border rounded mb-4"
      />
      <button
        class="btn btn-primary w-full"
        :disabled="!apiKey && !userIsAdmin"
        @click="connectToWhisper"
      >
        Connect to Whisper API
      </button>
    </div>

    <!-- Chat Interface -->
    <div v-else class="chat-interface mt-6">
      <div class="messages bg-base-200 p-4 h-80 overflow-y-scroll rounded">
        <div v-for="(message, index) in messages" :key="index" class="mb-3">
          <p>{{ message }}</p>
        </div>
      </div>

      <div class="input mt-4 flex items-center">
        <input
          v-model="userInput"
          type="text"
          placeholder="Type a message..."
          class="flex-grow p-3 border rounded mr-2"
        />
        <button class="btn btn-accent" @click="sendMessage">Send</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

const userIsAdmin = ref(false) // Replace with your admin check logic.
const apiKey = ref('')
const messages = ref<string[]>([]) // Ensure correct typing as ref array
const userInput = ref('')
const isConnected = ref(false)
const socket = ref<WebSocket | null>(null)

const connectToWhisper = () => {
  const config = useRuntimeConfig()
  if (!apiKey.value && !userIsAdmin.value) return

  const keyToUse = apiKey.value || config.OPENAI_API_KEY

  socket.value = new WebSocket('wss://api.openai.com/v1/realtime')

  socket.value.onopen = () => {
    console.log('Connected to Whisper API')
    isConnected.value = true

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
  }

  socket.value.onerror = (error) => {
    console.error('Error with Whisper API:', error)
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
</script>

<style>
.chat-interface {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
