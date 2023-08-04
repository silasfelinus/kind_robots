<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import axios from 'axios'
import { useBotStore, Bot } from '../../../stores/botStore'

interface Message {
  role: string
  content: string
}

const botStore = useBotStore()
const currentBot = computed<Bot | null>(() => botStore.currentBot)
const message = ref('')
const response = ref(null)
const messages = ref<Message[]>([])

watchEffect(() => {
  if (currentBot.value && currentBot.value.prompt) {
    message.value = currentBot.value.prompt
  }
})
const isLoading = ref(false)

// Update the sendMessage method to handle the loading state
const sendMessage = async () => {
  isLoading.value = true
  try {
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message.value }]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
    messages.value = [
      ...messages.value,
      { role: 'assistant', content: res.data.choices[0].message.content }
    ]
    response.value = res.data.choices[0].message.content
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
    class="container flex flex-col justify-center items-center min-h-screen p-4 bg-gray-100"
    :data-theme="currentBot?.theme"
  >
    <div
      v-if="currentBot"
      class="avatar-container max-w-3xl w-full p-4 bg-white rounded-lg shadow-md"
    >
      <div class="flex flex-col md:flex-row items-center">
        <img
          :src="currentBot.avatarImage"
          alt="Bot Avatar"
          class="avatar-img md:w-1/4 rounded-full"
        />
        <div class="flex-1 text-center md:text-left p-4">
          <h1 class="text-3xl font-bold text-theme">{{ currentBot.name }}</h1>
          <p class="text-xl">{{ currentBot.subtitle }}</p>
          <p class="text-lg">{{ currentBot.botIntro }}</p>
        </div>
      </div>
      <div class="message-container mt-4">
        <textarea v-model="message" rows="5" class="message-input w-full p-2 rounded-md"></textarea>
        <button
          class="submit-button btn btn-primary mt-2"
          :disabled="isLoading"
          @click="sendMessage"
        >
          Send Message
        </button>

        <!-- Loading animation -->
        <div v-if="isLoading" class="loader flex justify-center">
          <div
            class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-900"
          ></div>
        </div>

        <div v-if="response" class="response-container mt-4 p-4 bg-gray-100 rounded-md">
          <h2>Response:</h2>
          <div class="response-card p-4 bg-white rounded-md shadow-md">
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
</style>
