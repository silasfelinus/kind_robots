<template>
  <div class="container max-w-3xl mx-auto p-4 bg-gray-100">
    <!-- Bot Avatar and Details -->
    <div v-if="currentBot" class="avatar-container w-full mb-4 bg-white rounded-lg shadow-lg">
      <div class="flex flex-col md:flex-row items-center p-4">
        <img
          :src="currentBot.avatarImage"
          alt="Bot Avatar"
          class="avatar-img md:w-1/4 rounded-full border-4 border-theme shadow-md mb-4 md:mb-0"
        />
        <div class="flex-1 text-center md:text-left ml-0 md:ml-4">
          <h1 class="text-3xl font-bold text-theme">{{ currentBot.name }}</h1>
          <p class="text-xl">{{ currentBot.subtitle }}</p>
          <div class="card mt-2">{{ currentBot.description }}</div>
          <div class="user-intro p-2 bg-gray-200 rounded-md shadow-inner mt-2">
            <p class="text-lg">{{ currentBot.userIntro }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Interaction Area -->
    <div class="message-container bg-base-200 p-4 rounded-lg shadow-lg">
      <!-- New Message Prompt -->
      <div class="prompt-area mb-4 bg-white p-4 rounded-md shadow-md">
        <label for="newMessage" class="block mb-2 font-bold">Message ChatGPT Here:</label>
        <textarea
          id="newMessage"
          v-model="message"
          rows="5"
          class="message-input w-full p-2 rounded-md border-2 resize-none"
          placeholder="Type your message..."
          @keyup.enter="sendMessage"
        ></textarea>
        <button
          class="submit-button btn btn-primary mt-2"
          :disabled="isLoading"
          @click="sendMessage"
        >
          Send Message
        </button>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>

      <!-- Conversations -->
      <div
        v-for="(conversation, index) in conversations"
        :key="index"
        class="response-container m-2 p-4 bg-white rounded-md shadow-md relative flex flex-col items-start"
        @click="activeConversationIndex = index"
      >
        <div
          v-for="(msg, msgIndex) in conversation"
          :key="index + '-' + msgIndex"
          class="p-4 rounded-md mb-2"
          :class="msg.role === 'user' ? 'bg-primary text-default' : 'bg-secondary text-default'"
        >
          {{ msg.content }}
        </div>
        <div v-if="activeConversationIndex === index" class="mt-2">
          <input
            v-model="replyMessage"
            type="text"
            placeholder="Continue conversation..."
            class="p-2 rounded-md border-2 w-full"
            @keyup.enter="continueConversation(index)"
          />
        </div>
        <button
          class="absolute top-2 right-2 text-red-500 hover:text-red-700"
          @click.stop="deleteConversation(index)"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { useBotStore, Bot } from '../../../stores/botStore'

let userKey: string | null = null

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key')
})

interface Message {
  role: string
  content: string
}
const botStore = useBotStore()
const currentBot = computed<Bot | null>(() => botStore.currentBot)
const message = ref('')
const replyMessage = ref('')
const conversations = ref<Message[][]>([])
const isLoading = ref(false)
const activeConversationIndex = ref<number | null>(null)
const error = ref<string | null>(null)

const sendMessage = async () => {
  isLoading.value = true
  try {
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message.value }],
        stream: false,
        user_openai_key: userKey
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    )
    conversations.value.push([
      { role: 'user', content: message.value },
      { role: 'assistant', content: res.data.choices[0].message.content }
    ])
    message.value = ''
  } catch (err) {
    console.error(err)
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const continueConversation = async (index: number) => {
  isLoading.value = true
  try {
    const currentMessages = [
      ...conversations.value[index],
      { role: 'user', content: replyMessage.value }
    ]
    const res = await axios.post('/api/botcafe/chat', {
      model: 'gpt-3.5-turbo',
      messages: currentMessages,
      stream: false
    })
    conversations.value[index].push({ role: 'user', content: replyMessage.value })
    conversations.value[index].push({
      role: 'assistant',
      content: res.data.choices[0].message.content
    })
    replyMessage.value = ''
  } catch (err) {
    console.error(err)
  } finally {
    isLoading.value = false
  }
}
watchEffect(() => {
  if (currentBot.value && currentBot.value.prompt) {
    message.value = currentBot.value.prompt
  }
})

const deleteConversation = (index: number) => {
  conversations.value.splice(index, 1)
  activeConversationIndex.value = null // Reset the active conversation index after deletion
}
</script>

<style scoped>
.prompt-area {
  border: 2px solid #ccc;
  background-color: #f9f9f9;
}

.message-input {
  border: 2px solid #ccc;
  resize: none;
}

.submit-button {
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
}

.loader div {
  border-color: #f3f3f3;
  border-right-color: #4a90e2;
}

.error-message {
  font-size: 14px;
}
.avatar-img {
  max-width: 100%;
  height: auto;
}

.user-intro {
  border: 2px solid #ccc;
  margin-top: 10px;
}

.response-container {
  border-top: 2px solid #ccc;
}
</style>
