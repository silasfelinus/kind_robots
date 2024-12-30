<template>
  <div class="container rounded-2xl mx-auto p-2">
    <!-- Message Interaction Area -->
    <div class="message-container bg-primary p-1 border rounded-2xl">
      <!-- New Message Prompt -->
      <div class="prompt-area p-2 rounded-2xl">
        <label for="newMessage" class="block mb-2 font-bold">
          <div v-if="currentBot" class="user-intro p-2 rounded-2xl m-2">
            <p class="text-lg">{{ currentBot.userIntro ?? 'User Intro' }}</p>
          </div>
        </label>
        <textarea
          id="newMessage"
          v-model="message"
          rows="5"
          class="message-input w-full p-2 rounded-md border-2 resize-none"
          placeholder="Type your message..."
          @keyup.enter="sendMessage"
        />
        <button
          class="submit-button btn btn-accent border border-base-200 rounded-2xl mt-2"
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
      >
        <div
          v-for="(msg, msgIndex) in conversation"
          :key="msgIndex"
          :class="{ 'flex-row-reverse': msg.role === 'user' }"
          class="flex items-center message-content"
        >
          <ResponseEntry
            :role="msg.role"
            :content="msg.content ?? ''"
            :avatar-image="msg.avatarImage ?? '/images/bot.webp'"
            :bot-name="msg.botName ?? 'Kind Robot'"
            :subtitle="msg.subtitle ?? 'Your friendly neighborhood AI'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import { useUserStore } from '../../../stores/userStore'

let userKey: string | null = null

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key')
})

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  avatarImage?: string | null
  botName?: string | null
  subtitle?: string | null
}

const conversations = ref<Message[][]>([])
const botStore = useBotStore()
const userStore = useUserStore()

const currentBot = computed(() => {
  return (
    botStore.currentBot ?? {
      name: 'Unknown Bot',
      subtitle: 'No subtitle available',
      description: 'No description available',
      userIntro: 'Hi Bot',
      prompt: 'I am a kind robot',
      avatarImage: '/images/amibotsquare1.webp',
    }
  )
})

const message = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)

const sendMessage = async () => {
  isLoading.value = true
  error.value = null

  try {
    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${message.value}`
      : message.value

    const res = await fetch('/api/botcafe/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: fullMessage }],
        stream: false,
        user_openai_key: userKey,
      }),
    })

    if (!res.ok) throw new Error(`Error: ${res.statusText}`)

    const data = await res.json()

    conversations.value.push([
      {
        role: 'user',
        content: message.value,
        avatarImage: userStore.user?.avatarImage ?? undefined,
      },
      {
        role: 'assistant',
        content: data.choices[0].message.content,
        avatarImage: currentBot.value?.avatarImage,
        botName: currentBot.value?.name,
        subtitle: currentBot.value?.subtitle,
      },
    ])
    message.value = '' // Clear message input
  } catch {
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.popup {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #3b82f6;
  padding: 4px;
  border-radius: 1rem;
  font-size: 1rem;
}

.message-content {
  white-space: pre-wrap;
}
</style>
