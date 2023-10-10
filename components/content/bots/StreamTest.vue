<template>
  <div class="container max-w-3xl mx-auto p-2 bg-base-200">
    <!-- Bot Avatar and Details -->
    <div v-if="currentBot" class="avatar-container w-full m-2 rounded-lg shadow-lg">
      <div class="flex flex-col md:flex-row items-center p-2">
        <img
          :src="currentBot.avatarImage ?? '/images/default-avatar.webp'"
          alt="Bot Avatar"
          class="avatar-img md:w-1/4 rounded-full border-4 border-theme shadow-md mb-4 md:mb-0"
        />
        <div class="flex-1 text-center">
          <h1 class="text-3xl font-bold">{{ currentBot.name ?? 'Unknown Bot' }}</h1>
          <p class="text-xl">{{ currentBot.subtitle ?? 'Subtitle' }}</p>
          <div class="card mt-2">{{ currentBot.description ?? 'Description' }}</div>
        </div>
      </div>
    </div>

    <!-- Message Interaction Area -->
    <div class="message-container bg-base-200 p-4 rounded-lg shadow-lg">
      <!-- New Message Prompt -->
      <div class="prompt-area mb-4 p-4 rounded-md shadow-md">
        <label for="newMessage" class="block mb-2 font-bold">
          <div v-if="currentBot" class="user-intro p-2 rounded-md shadow-inner mt-2">
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
        ></textarea>
        <button
          class="submit-button btn btn-primary mt-2"
          :disabled="isLoading"
          @click="sendMessage"
        >
          Send Message
        </button>
        <milestone-reward v-if="shouldShowMilestoneCheck" :id="4"></milestone-reward>
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
          :key="msgIndex"
          :class="{ 'flex-row-reverse': msg.role === 'user' }"
          class="flex items-center"
        >
          <ResponseEntry
            :role="msg.role"
            :content="msg.content"
            :avatar-image="msg.avatarImage ?? '/images/kindtitle.webp'"
            :bot-name="msg.botName ?? 'Kind Robot'"
            :subtitle="msg.subtitle ?? 'Your friendly neighborhood AI'"
          />
        </div>
        <div
          v-if="activeConversationIndex !== null && activeConversationIndex === index"
          class="mt-2 flex items-center"
        >
          <textarea
            v-model="replyMessage"
            type="text"
            rows="3"
            placeholder="Continue conversation..."
            class="flex-grow p-2 rounded-md border-2 text-lg resize-y"
            @keyup.enter="continueConversation(index)"
          />
          <button
            class="btn btn-primary ml-2"
            :disabled="isReplyLoading"
            @click="continueConversation(index)"
          >
            Reply
          </button>
          <div v-if="isReplyLoading" class="loader flex justify-center mt-2 ml-2">
            <ami-butterfly />
          </div>
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
import { useUserStore } from '@/stores/userStore'
import { errorHandler } from '@/server/api/utils/error'

const shouldShowMilestoneCheck = ref(false)
let userKey: string | null = null

onMounted(() => {
  userKey = localStorage.getItem('user_openai_key')
})

interface Message {
  role: 'user' | 'assistant'
  content: string
  avatarImage?: string
  botName?: string
  subtitle?: string
}

interface Conversation extends Array<Message> {}
const conversations = ref<Conversation[]>([])
const activeConversationIndex = ref<number | null>(null)
const botStore = useBotStore()
const userStore = useUserStore()
const currentBot = computed<Bot | null>(() => botStore.currentBot)
const message = ref('')
const replyMessage = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const userImage = computed(() => userStore.user?.avatarImage)
const isReplyLoading = ref(false)
const sendMessage = async () => {
  isLoading.value = true
  try {
    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${message.value}`
      : message.value
    shouldShowMilestoneCheck.value = true
    const res = await axios.post(
      '/api/botcafe/chat',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: fullMessage }],
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
      {
        role: 'user',
        content: message.value,
        avatarImage: userStore.user?.avatarImage ?? undefined
      },

      {
        role: 'assistant',
        content: res.data.choices[0].message.content,
        avatarImage: currentBot.value?.avatarImage,
        botName: currentBot.value?.name,
        subtitle: currentBot.value?.subtitle
      }
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
  isReplyLoading.value = true
  try {
    // Remove unexpected properties from each message
    const sanitizedMessages = conversations.value[index].map(
      ({ avatarImage, botName, subtitle, ...rest }) => rest
    )

    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${replyMessage.value}`
      : replyMessage.value

    // Add the new user message
    sanitizedMessages.push({ role: 'user', content: fullMessage })

    const res = await axios.post('/api/botcafe/chat', {
      model: 'gpt-3.5-turbo',
      messages: sanitizedMessages,
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
  }
  isReplyLoading.value = false
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
