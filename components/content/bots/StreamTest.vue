<template>
  <div class="container rounded-2xl mx-auto p-2 bg-base-300">
    <!-- Message Interaction Area -->
    <div class="message-container bg-base-300 p-1 rounded-2xl">
      <div class="prompt-area p-2 rounded-lg">
        <label for="newMessage" class="block mb-1 font-semibold text-md">
          <div v-if="currentBot" class="user-intro p-1 rounded-md">
            <p class="text-base">{{ currentBot.userIntro ?? 'User Intro' }}</p>
          </div>
        </label>
        <textarea
          id="newMessage"
          v-model="message"
          rows="3"
          class="message-input w-full p-1 rounded-md border-2 resize-none"
          placeholder="Type your message..."
          @keyup.enter="sendMessage"
        ></textarea>
        <div class="flex justify-between items-center mt-1">
          <button
            class="btn btn-primary text-sm px-4 py-1"
            :disabled="isLoading"
            @click="sendMessage"
          >
            Send
          </button>
          <span v-if="error" class="text-red-500 text-sm">{{ error }}</span>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loader flex justify-center mt-2">
        <ami-butterfly />
      </div>

      <!-- Conversations Display -->
      <ConversationDisplay
        :conversations="conversations"
        :active-conversation-index="activeConversationIndex"
        :current-bot="currentBot"
        :is-reply-loading="isReplyLoading"
        @reply-message="continueConversation"
        @delete-conversation="deleteConversation"
        @toggle-reaction="toggleReaction"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBotStore } from '../../../stores/botStore'
import { useUserStore } from '../../../stores/userStore'
import { useChatStore } from '../../../stores/chatStore'

const shouldShowMilestoneCheck = ref(false)
const config = useRuntimeConfig()
const userKey = config.public.OPENAI_KEY
const chatStore = useChatStore()
const showPopup = ref<{ [key: number]: { [key: string]: boolean } }>({})

interface Message {
  role: 'user' | 'assistant'
  content: string
  avatarImage?: string
  botName?: string
  subtitle?: string
}

const conversations = ref<Message[][]>([])
const activeConversationIndex = ref<number | null>(null)
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
const isReplyLoading = ref(false)

// Send message
const sendMessage = async () => {
  isLoading.value = true
  try {
    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${message.value}`
      : message.value
    shouldShowMilestoneCheck.value = true

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

    if (!res.ok) throw new Error('Failed to send message')

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
        avatarImage: currentBot.value?.avatarImage ?? undefined,
        botName: currentBot.value?.name ?? 'Kind Robot',
        subtitle: currentBot.value?.subtitle ?? undefined,
      },
    ])

    message.value = ''
  } catch (err) {
    console.error(err)
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}

// Continue conversation
const continueConversation = async (index: number, replyMessage: string) => {
  isReplyLoading.value = true
  try {
    const sanitizedMessages = conversations.value[index].map((msg) => ({
      ...msg,
    }))

    const fullMessage = currentBot.value?.userIntro
      ? `${currentBot.value.userIntro} ${replyMessage}`
      : replyMessage

    sanitizedMessages.push({ role: 'user', content: fullMessage })

    const res = await fetch('/api/botcafe/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: sanitizedMessages,
        stream: false,
      }),
    })

    if (!res.ok) throw new Error('Failed to continue conversation')

    const data = await res.json()

    conversations.value[index].push({
      role: 'user',
      content: replyMessage,
    })
    conversations.value[index].push({
      role: 'assistant',
      content: data.choices[0].message.content,
    })
  } catch (err) {
    console.error(err)
  } finally {
    isReplyLoading.value = false
  }
}

// Delete conversation
const deleteConversation = (index: number) => {
  conversations.value.splice(index, 1)
  activeConversationIndex.value = null
}

const toggleReaction = async (index: number, reactionType: ReactionType) => {
  const exchangeId = chatStore.getExchangeById(index)?.id
  if (!exchangeId) return

  const res = await fetch('/api/reactions/toggle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      chatExchangeId: exchangeId,
      reactionType,
    }),
  })

  if (res.ok) {
    showPopup.value[index] = { [reactionType]: true }

    // Hide popup after 2 seconds
    setTimeout(() => {
      showPopup.value[index][reactionType] = false
    }, 2000)
  }
}
</script>
