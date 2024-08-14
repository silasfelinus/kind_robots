<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useBotStore, type Bot } from '../../../stores/botStore'

interface Message {
  role: string
  content: string
}

const botStore = useBotStore()
const currentBot = computed<Bot | null>(() => botStore.currentBot)
const message = ref('')
const response = ref(null)
const messages = ref<Message[]>([])
const isLoading = ref(false)

let userKey: string | null = null

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key')
})

watchEffect(() => {
  if (currentBot.value && currentBot.value.prompt) {
    message.value = currentBot.value.prompt
  }
})

const sendMessage = async () => {
  isLoading.value = true
  messages.value.push({ role: 'user', content: message.value })
  try {
    const res = await fetch('/api/botcafe/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.value,
        userKey,
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to send message')
    }

    const data = await res.json()
    messages.value = [
      ...messages.value,
      { role: 'assistant', content: data.choices[0].message.content },
    ]
    response.value = data.choices[0].message.content
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}

const sendReply = async (updatedMessages: Message[]) => {
  try {
    messages.value = updatedMessages
    message.value = updatedMessages[updatedMessages.length - 1].content
    await sendMessage()
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div
    class="container flex flex-col justify-center items-center p-4 bg-gray-100"
    :data-theme="currentBot?.theme"
  >
    <div
      v-if="currentBot"
      class="avatar-container max-w-3xl w-full p-4 bg-white rounded-lg shadow-lg"
    >
      <div class="flex flex-col md:flex-row items-center">
        <img
          :src="currentBot.avatarImage"
          alt="Bot Avatar"
          class="avatar-img md:w-1/4 rounded-full border-4 border-theme shadow-md"
        />
        <div class="flex-1 text-center md:text-left p-4">
          <h1 class="text-3xl font-bold text-theme">
            {{ currentBot.name }}
          </h1>
          <p class="text-xl">
            {{ currentBot.subtitle }}
          </p>
          <div class="card">
            {{ currentBot.description }}
          </div>
          <div class="user-intro p-2 bg-gray-200 rounded-md shadow-inner">
            <p class="text-lg">
              {{ currentBot.userIntro }}
            </p>
          </div>
        </div>
      </div>
      <div class="message-container mt-4 border-t-2 border-theme">
        <div class="prompt-area p-4 bg-gray-200 rounded-md shadow-inner">
          <textarea
            v-model="message"
            rows="5"
            class="message-input w-full p-2 rounded-md border-2 border-theme"
          />
          <button
            class="submit-button btn btn-primary mt-2"
            :disabled="isLoading"
            @click="sendMessage"
          >
            Send Message
          </button>
        </div>

        <!-- Loading animation -->
        <div v-if="isLoading" class="loader flex justify-center mt-2">
          <div
            class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-900"
          />
        </div>

        <div
          v-if="response"
          class="response-container mt-4 p-4 bg-gray-100 rounded-md shadow-md"
        >
          <h2>Response:</h2>
          <div
            class="response-card p-4 bg-white rounded-md shadow-lg border-2 border-theme"
          >
            <ResponseCard :messages="messages" :send-message="sendReply" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-img {
  max-width: 100%;
  height: auto;
}

.user-intro {
  border: 2px solid #ccc;
  margin-top: 10px;
}

.prompt-area {
  border: 2px solid #ccc;
  background-color: #f9f9f9;
}

.message-input {
  border: 2px solid #ccc;
  resize: none; /* Disables resizing of the textarea */
}

.submit-button {
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.loader div {
  border-color: #f3f3f3;
  border-right-color: #4a90e2;
}

.response-container {
  border-top: 2px solid #ccc;
}
</style>
