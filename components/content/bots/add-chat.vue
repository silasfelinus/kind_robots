<template>
  <div class="mx-auto max-w-screen-lg bg-base-200 rounded-2xl border">
    <h1 class="text-4xl text-center mb-6">Stream Tester</h1>

    <!-- Toggle for Streaming -->
    <div class="mb-4 flex justify-center">
      <label class="flex items-center gap-2">
        <input v-model="useStreaming" type="checkbox" class="checkbox" />
        <span>Enable Streaming</span>
      </label>
    </div>

    <!-- Recipient Selector -->
    <div class="mb-4">
      <h2 class="text-lg font-semibold mb-2">Select Recipient:</h2>
      <div class="flex gap-4 items-center">
        <label class="flex items-center gap-2">
          <input
            v-model="recipientType"
            type="radio"
            value="bot"
            class="radio"
          />
          <span>Bot</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="recipientType"
            type="radio"
            value="character"
            class="radio"
          />
          <span>Character</span>
        </label>
        <label class="flex items-center gap-2">
          <input
            v-model="recipientType"
            type="radio"
            value="user"
            class="radio"
          />
          <span>User</span>
        </label>
      </div>
      <div class="mt-4">
        <bot-selector
          v-if="recipientType === 'bot'"
          v-model="recipientId"
        />
        <character-selector
          v-else-if="recipientType === 'character'"
          v-model="recipientId"
        />
        <user-selector
          v-else-if="recipientType === 'user'"
          v-model="recipientId"
        />
      </div>
    </div>

    <!-- Prompt Input -->
    <div class="mb-6">
      <label for="prompt" class="block text-lg font-medium mb-2"
        >Enter Prompt:</label
      >
      <input
        id="prompt"
        v-model="prompt"
        type="text"
        class="w-full p-3 rounded-lg border"
        placeholder="Type your prompt here..."
      />
    </div>

    <!-- Submit Button -->
    <div class="flex justify-center mb-6">
      <button
        :disabled="loading || !prompt.trim() || !recipientId"
        class="btn btn-primary w-full sm:w-auto transition duration-300 ease-in-out"
        @click="submitPrompt"
      >
        <span v-if="!loading">Submit Prompt</span>
        <span
          v-else
          class="spinner-border spinner-border-sm"
          role="status"
        ></span>
      </button>
    </div>

    <!-- Display Chat Card -->
    <div v-if="chat">
      <h2 class="text-xl font-semibold mb-4">Chat Card:</h2>
      <chat-card :chat="chat" />
    </div>

    <!-- Display Raw Bot Response -->
    <div v-if="responseText" class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h2 class="text-xl font-semibold mb-2">Raw Bot Response:</h2>
      <p>{{ responseText }}</p>
    </div>

    <!-- Error Message Display -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

const chatStore = useChatStore()
const userStore = useUserStore()

// State
const recipientType = ref<'bot' | 'character' | 'user'>('bot')
const recipientId = ref<number | null>(null)
const prompt = ref('')
const responseText = ref('')
const loading = ref(false)
const errorMessage = ref('')
const useStreaming = ref(false)
const chat = ref<Chat | null>(null)

const userId = computed(() => userStore.userId)

// Submit Prompt Function
async function submitPrompt() {
  if (!prompt.value.trim() || !recipientId.value) return

  loading.value = true
  errorMessage.value = ''
  responseText.value = ''

  try {
    // Step 1: Create a new chat object in the database
    const newChat = await chatStore.addChat({
      content: prompt.value,
      userId: userId.value,
      botId: recipientType.value === 'bot' ? recipientId.value : null,
      characterId: recipientType.value === 'character' ? recipientId.value : null,
      recipientId: recipientType.value === 'user' ? recipientId.value : null,
      type: recipientType.value === 'bot' ? 'ToBot' : 'ToUser',
    })
    chat.value = newChat

    const apiEndpoint = '/api/botcafe/chat'
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt.value }],
        temperature: 1,
        max_tokens: 300,
        stream: useStreaming.value,
      }),
    }

    if (useStreaming.value) {
      await fetchStream(apiEndpoint, requestOptions, newChat.id)
    } else {
      await fetchNonStream(apiEndpoint, requestOptions, newChat.id)
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Error during API request:', error)
  } finally {
    loading.value = false
  }
}
</script>
