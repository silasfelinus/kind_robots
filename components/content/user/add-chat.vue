<template>
  <div
    class="mx-auto max-w-screen-lg bg-base-200 rounded-2xl border p-4 space-y-6"
  >
    <h1 class="text-3xl text-center font-bold text-primary">Chat Manager</h1>

    <!-- Streaming Toggle -->
    <div class="flex justify-center items-center gap-2">
      <input v-model="useStreaming" type="checkbox" class="checkbox" />
      <span class="text-lg">Enable Streaming</span>
    </div>

    <!-- Recipient Selection -->
    <div>
      <h2 class="text-xl font-semibold mb-2">Choose Recipient Type:</h2>
      <div class="flex flex-wrap gap-4">
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
        <bot-selector v-if="recipientType === 'bot'" />
        <character-selector v-else-if="recipientType === 'character'" />
        <recipient-selector v-else-if="recipientType === 'user'" />
      </div>
    </div>

    <!-- Prompt Input -->
    <div>
      <label class="block text-lg font-medium mb-1">Enter Prompt:</label>
      <input
        v-model="prompt"
        type="text"
        class="input input-bordered w-full"
        placeholder="Type your prompt here..."
      />
    </div>

    <!-- Submit Button -->
    <div class="text-center">
      <button
        :disabled="loading || !prompt.trim() || !recipientId"
        class="btn btn-primary w-full sm:w-auto"
        @click="submitPrompt"
      >
        <span v-if="!loading">Submit Prompt</span>
        <span v-else class="loading loading-spinner"></span>
      </button>
    </div>

    <!-- Chat Preview -->
    <div v-if="chat">
      <h2 class="text-xl font-semibold mb-2">Chat Summary</h2>
      <chat-card :chat="chat" />
    </div>

    <!-- Response Display -->
    <div v-if="responseText" class="bg-base-100 rounded-xl p-4">
      <h2 class="text-lg font-semibold mb-1">Bot Response:</h2>
      <p class="whitespace-pre-line">{{ responseText }}</p>
    </div>

    <!-- Error Message -->
    <p v-if="errorMessage" class="text-error text-center">{{ errorMessage }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'

const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()
const characterStore = useCharacterStore()

const recipientType = ref<'bot' | 'character' | 'user'>('bot')
const prompt = ref('')
const responseText = ref('')
const loading = ref(false)
const errorMessage = ref('')
const useStreaming = ref(false)
const chat = ref<Chat | null>(null)

const recipientId = computed(() => {
  if (recipientType.value === 'bot') return botStore.currentBot?.id || null
  if (recipientType.value === 'character')
    return characterStore.selectedCharacter?.id || null
  if (recipientType.value === 'user') return userStore.recipient?.id || null
  return null
})

async function submitPrompt() {
  if (!prompt.value.trim() || !recipientId.value) return

  loading.value = true
  errorMessage.value = ''
  responseText.value = ''

  try {
    if (recipientType.value === 'user') {
      const newChat = await chatStore.addChat({
        content: prompt.value,
        userId: userStore.userId,
        botId: null,
        characterId: null,
        recipientId: recipientId.value,
        type: 'ToUser',
      })
      chat.value = newChat
      responseText.value = `Message sent to user ${userStore.recipient?.username || 'Unknown'}.`
    } else {
      const newChat = await chatStore.addChat({
        content: prompt.value,
        userId: userStore.userId,
        botId: recipientType.value === 'bot' ? recipientId.value : null,
        characterId:
          recipientType.value === 'character' ? recipientId.value : null,
        recipientId: null,
        type: recipientType.value === 'bot' ? 'ToBot' : 'ToCharacter',
      })
      chat.value = newChat

      const apiEndpoint = '/api/botcafe/chat'
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt.value }],
          temperature: 1,
          max_tokens: 300,
          stream: useStreaming.value,
        }),
      }

      useStreaming.value
        ? await fetchStream(apiEndpoint, requestOptions, newChat.id)
        : await fetchNonStream(apiEndpoint, requestOptions, newChat.id)
    }
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'An unknown error occurred'
    console.error('Chat error:', error)
  } finally {
    loading.value = false
  }
}

async function fetchNonStream(
  url: string,
  options: RequestInit,
  chatId: number,
) {
  const response = await fetch(url, options)
  if (!response.ok)
    throw new Error(`Error ${response.status}: ${response.statusText}`)

  const data = await response.json()
  const botResponse =
    data.choices?.[0]?.message?.content || 'No response received'

  for (let i = 0; i < botResponse.length; i++) {
    await new Promise((r) => setTimeout(r, 30))
    responseText.value += botResponse[i]
    if (chat.value) chat.value.botResponse = responseText.value
    chatStore.updateChat(chatId, { botResponse: responseText.value })
  }

  await chatStore.editChat(chatId, { botResponse })
}

async function fetchStream(url: string, options: RequestInit, chatId: number) {
  const response = await fetch(url, options)
  if (!response.ok)
    throw new Error(`Error ${response.status}: ${response.statusText}`)

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

        if (chunk.startsWith('data:')) chunk = chunk.replace(/^data:\s*/, '')
        if (!chunk || chunk === '[DONE]') continue

        try {
          const parsed = JSON.parse(chunk)
          const content = parsed.choices[0]?.delta?.content
          if (content) {
            responseText.value += content
            if (chat.value) chat.value.botResponse = responseText.value
            chatStore.updateChat(chatId, { botResponse: responseText.value })
            await chatStore.editChat(chatId, {
              botResponse: responseText.value,
            })
          }
        } catch (err) {
          console.error('Stream chunk parse error:', err)
        }
      }
    }
  } else {
    throw new Error('Streaming unsupported in response')
  }
}
</script>
