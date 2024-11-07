<template>
  <div
    class="container mx-auto p-4 bg-base-300 rounded-2xl flex flex-col h-full"
  >
    <!-- Message Interaction Area -->
    <div
      class="message-container flex flex-col bg-base-300 p-2 rounded-2xl flex-grow"
    >
      <!-- Scrollable conversation area -->
      <div class="conversation-area flex-grow overflow-y-auto p-4">
        <ConversationDisplay
          :chat-exchange-id="activechatId"
          :current-bot="currentBot"
          :is-reply-loading="isReplyLoading"
        />
      </div>

      <!-- Input area stays at the bottom -->
      <div class="prompt-area p-3 bg-base-200 rounded-lg flex-shrink-0">
        <label for="newMessage" class="block mb-1 font-semibold text-md">
          <div v-if="currentBot" class="user-intro p-1 rounded-md">
            <p class="text-base">{{ currentBot.userIntro ?? 'User Intro' }}</p>
          </div>
        </label>
        <!-- Message input area -->
        <textarea
          id="newMessage"
          v-model="message"
          rows="2"
          class="message-input w-full p-2 rounded-md border resize-none"
          placeholder="Type your message..."
          @keyup.enter="sendMessage"
        ></textarea>
        <!-- Button and error message -->
        <div class="flex justify-between items-center mt-2">
          <button
            class="btn btn-primary text-sm px-4 py-1"
            :disabled="isLoading"
            @click="sendMessage"
          >
            Send
          </button>
          <span v-if="error" class="text-red-500 text-sm">
            {{
              error === 'Failed to send the message. Please try again.'
                ? 'Could not connect to the chatbot API. Please check your internet connection or try again later.'
                : error
            }}
          </span>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loader flex justify-center mt-4">
        <ami-butterfly />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

// Store references
const botStore = useBotStore()
const chatStore = useChatStore()
const userStore = useUserStore()

// Define state for the message, loading indicators, and current bot
const message = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const isReplyLoading = ref(false)

// Computed properties
const conversations = computed(() => chatStore.chats)
const activeConversationIndex = ref<number | null>(null) // Use this to track the current conversation index

const defaultBot = {
  id: -1,
  name: 'Unknown Bot',
  subtitle: 'No subtitle available',
  description: 'No description available',
  userIntro: 'Hi Bot',
  prompt: 'I am a kind robot',
  avatarImage: '/images/amibotsquare1.webp',
}

// Use fallback values if activeConversationIndex or chat ID is null
const activechatId = computed(
  () =>
    activeConversationIndex.value !== null &&
    chatStore.chats[activeConversationIndex.value]
      ? chatStore.chats[activeConversationIndex.value].id
      : -1, // Fallback to -1 or any invalid ID if not set
)

// Use defaultBot when botStore.currentBot is null
const currentBot = computed(() => botStore.currentBot ?? defaultBot)

// Send message function
const sendMessage = async () => {
  if (!message.value.trim()) return

  isLoading.value = true
  error.value = null // Reset error on new send attempt

  try {
    const userId = userStore.user?.id
    const botId = botStore.currentBot?.id

    if (!userId || !botId)
      throw new Error('User or Bot information is missing.')

    // Add or continue conversation based on activeConversationIndex
    if (activeConversationIndex.value === null) {
      const newExchange = await chatStore.addExchange(
        message.value,
        userId,
        botId,
      )
      activeConversationIndex.value = newExchange
        ? chatStore.chats.length - 1
        : null
    } else {
      const previousExchange =
        conversations.value[activeConversationIndex.value!]
      await chatStore.continueExchange(previousExchange.id, message.value)
    }

    message.value = '' // Clear input after sending
  } catch (err) {
    console.error(err)
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
