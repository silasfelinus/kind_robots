<!-- /components/content/story/chat-button.vue -->
<template>
  <div class="mx-auto max-w-screen-lg bg-base-200 rounded-2xl border p-6">
    <h1 class="text-3xl text-center mb-6">Chat Manager</h1>

    <!-- Chat Button -->
    <button
      class="btn btn-primary w-full mb-6"
      :disabled="loading || !chatStore.selectedChat"
      @click="fetchBotResponse"
    >
      <span v-if="!loading">Get Bot Response</span>
      <span v-else>Loading...</span>
    </button>

    <!-- Streamed Bot Response -->
    <div
      v-if="responseText"
      class="p-4 bg-gray-100 rounded-lg border text-gray-800 mb-6"
    >
      <h2 class="text-lg font-semibold mb-2">Bot Response:</h2>
      <p>{{ responseText }}</p>
    </div>

    <!-- Text Input for User's Message -->
    <div v-if="responseCompleted" class="mt-4">
      <textarea
        v-model="userResponse"
        class="w-full p-3 rounded-lg border text-gray-800"
        rows="4"
        placeholder="Type your response..."
      ></textarea>
      <button
        class="btn btn-success mt-4 w-full"
        :disabled="!userResponse.trim()"
        @click="submitUserResponse"
      >
        Send Response
      </button>
    </div>

    <!-- Error Message -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'

// Store
const chatStore = useChatStore()

// State
const responseText = ref('')
const userResponse = ref('')
const loading = ref(false)
const responseCompleted = ref(false)
const errorMessage = ref('')

// Fetch Bot Response
async function fetchBotResponse() {
  const chat = chatStore.selectedChat
  if (!chat) {
    errorMessage.value = 'No chat selected.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  responseText.value = ''
  responseCompleted.value = false

  const apiEndpoint = '/api/botcafe/chat'
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: chat.content }],
      temperature: 1,
      max_tokens: 300,
      stream: true,
    }),
  }

  try {
    const response = await fetch(apiEndpoint, requestOptions)
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    if (response.body) {
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let boundary
        while ((boundary = buffer.indexOf('\n\n')) >= 0) {
          let chunk = buffer.slice(0, boundary).trim()
          buffer = buffer.slice(boundary + 2)

          if (chunk.startsWith('data:')) {
            chunk = chunk.replace(/^data:\s*/, '').replace(/^data:\s*/, '')
          }

          if (!chunk || chunk === '[DONE]') continue

          try {
            const parsed = JSON.parse(chunk)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              responseText.value += content

              // Update selectedChat.botResponse in real-time
              if (chatStore.selectedChat) {
                chatStore.selectedChat.botResponse =
                  (chatStore.selectedChat.botResponse || '') + content
              }
            }
          } catch (err) {
            console.error('Error parsing streamed data:', err)
          }
        }
      }

      responseCompleted.value = true
    } else {
      throw new Error('No response body available for streaming.')
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error during streaming:', error)
  } finally {
    loading.value = false
  }
}

// Submit User's Response
async function submitUserResponse() {
  if (!userResponse.value.trim()) return

  try {
    await chatStore.addChat({
      content: userResponse.value.trim(),
      userId: chatStore.selectedChat?.userId || 10,
      botId: null,
      characterId: null,
      recipientId: null,
      type: 'Weirdlandia',
    })

    // Clear input field
    userResponse.value = ''
    responseCompleted.value = false
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Failed to send user response.'
    console.error('Error during user response submission:', error)
  }
}
</script>
