<template>
  <div class="message-container mt-4 bg-base-200 p-4 min-h-screen">
    <div class="prompt-area mb-4 p-4 bg-white rounded-md shadow-md">
      <textarea
        v-model="message"
        rows="5"
        class="message-input w-full p-2 rounded-md border-2 border-theme resize-none"
        placeholder="Type your message..."
        @keyup.enter="sendMessage"
      ></textarea>
    </div>

    <div v-if="isLoading" class="loader flex justify-center mt-2">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-900"></div>
    </div>

    <div
      v-for="(conversation, index) in conversations"
      :key="index"
      class="response-container mt-4 p-4 bg-white rounded-md shadow-md relative"
    >
      <button
        class="absolute top-2 right-2 text-red-500 hover:text-red-700"
        @click="deleteConversation(index)"
      >
        ×
      </button>
      <div class="user-message p-4 rounded-md bg-primary text-white mb-2">
        {{ conversation.userMessage }}
      </div>
      <div
        v-if="conversation.assistantReply"
        class="assistant-reply p-4 rounded-md bg-secondary text-white"
      >
        {{ conversation.assistantReply }}
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

interface Conversation {
  userMessage: string
  assistantReply?: string
}

const message = ref('')
const conversations = ref<Conversation[]>([])
const isLoading = ref(false)
const error = ref('')

const sendMessage = async () => {
  isLoading.value = true
  conversations.value.push({ userMessage: message.value })
  try {
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message.value }], // Sending the latest message
        stream: true
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
    const lastConversation = conversations.value[conversations.value.length - 1]
    lastConversation.assistantReply = res.data.choices[0].message.content
    message.value = '' // Reset the message ref after sending
  } catch (err) {
    console.error(err)
    error.value = 'Failed to send the message. Please try again.' // Set the error message
  } finally {
    isLoading.value = false
  }
}

const deleteConversation = (index: number) => {
  conversations.value.splice(index, 1)
}
</script>
