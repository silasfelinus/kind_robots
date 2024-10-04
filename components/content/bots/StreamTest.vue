<template>
  <!-- Main container for the stream test, rounded and padded -->
  <div
    class="container rounded-2xl mx-auto p-2 bg-base-300 h-full flex flex-col"
  >
    <!-- Message Interaction Area -->
    <div
      class="message-container bg-base-300 p-1 rounded-2xl flex flex-col h-full"
    >
      <!-- Scrollable conversation area -->
      <div class="conversation-area flex-grow overflow-y-auto p-2">
        <ConversationDisplay
          :conversations="conversations"
          :active-conversation-index="activeConversationIndex"
          :current-bot="currentBot"
          :is-reply-loading="isReplyLoading"
        />
      </div>

      <!-- Input area stays at the bottom -->
      <div class="prompt-area p-2 rounded-lg flex-shrink-0 bg-base-200">
        <label for="newMessage" class="block mb-1 font-semibold text-md">
          <div v-if="currentBot" class="user-intro p-1 rounded-md">
            <p class="text-base">{{ currentBot.userIntro ?? 'User Intro' }}</p>
          </div>
        </label>
        <!-- Message input area -->
        <textarea
          id="newMessage"
          v-model="message"
          rows="3"
          class="message-input w-full p-1 rounded-md border-2 resize-none"
          placeholder="Type your message..."
          @keyup.enter="sendMessage"
        ></textarea>
        <!-- Button and error message -->
        <div class="flex justify-between items-center mt-1">
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
      <div v-if="isLoading" class="loader flex justify-center mt-2">
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

// Get conversations and activeConversationIndex from chatStore
const conversations = computed(() => chatStore.chatExchanges) // Assuming this holds your conversations
const activeConversationIndex = ref<number | null>(null) // Could track the active index if needed

// Define state for the message, loading indicators, and current bot
const message = ref('')
const isLoading = ref(false)
const error = ref<string | null>(null)
const isReplyLoading = ref(false)

// Computed value to get the current bot
const currentBot = computed(
  () =>
    botStore.currentBot ?? {
      name: 'Unknown Bot',
      subtitle: 'No subtitle available',
      description: 'No description available',
      userIntro: 'Hi Bot',
      prompt: 'I am a kind robot',
      avatarImage: '/images/amibotsquare1.webp',
    },
)

// Send message function
const sendMessage = async () => {
  if (!message.value.trim()) return
  isLoading.value = true
  try {
    const userId = userStore.user?.id
    const botId = botStore.currentBot?.id
    if (!userId || !botId)
      throw new Error('User or Bot information is missing.')

    // Use chatStore to handle sending the message
    await chatStore.addOrUpdateExchange(message.value, userId, botId)

    message.value = '' // Clear input after sending
  } catch (err) {
    console.error(err)
    error.value = 'Failed to send the message. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>
