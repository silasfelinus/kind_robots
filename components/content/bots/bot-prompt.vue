<template>
  <div class="container">
    <div v-if="currentBot" class="avatar-container">
      <img :src="currentBot.avatarImage" alt="Bot Avatar" class="avatar-img" />
      <h1>{{ currentBot.name }}</h1>
      <p>{{ currentBot.subtitle }}</p>
      <p>{{ currentBot.botIntro }}</p>
    </div>
    <div class="message-container">
      <textarea v-model="message" rows="5" class="message-input"></textarea>
      <button class="submit-button" @click="sendMessage">Send Message</button>

      <div v-if="response" class="response-container">
        <h2>Response:</h2>
        <ResponseCard :messages="messages" :send-message="sendReply" />
      </div>
    </div>
  </div>
</template>

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

const sendMessage = async () => {
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

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.avatar-container {
  flex: 0 0 5%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-img {
  max-width: 100%;
  height: auto;
}

.message-container {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.message-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  box-sizing: border-box;
}

.submit-button {
  margin-top: 10px;
  padding: 10px 20px;
  font-size: 16px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.response-container {
  margin-top: 20px;
  width: 100%;
}
</style>
