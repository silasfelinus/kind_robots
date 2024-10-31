<template>
  <div
    class="chat-card p-6 bg-base-200 rounded-xl shadow-md w-full max-w-lg mx-auto mt-6"
  >
    <!-- Header with User and Bot Details -->
    <div class="header flex items-center mb-4">
      <img
        v-if="botAvatar"
        :src="botAvatar"
        alt="Bot Avatar"
        class="w-10 h-10 rounded-full mr-3"
      />
      <div>
        <p class="text-lg font-semibold">
          {{ username }}
          <span class="text-sm text-gray-500">to</span>
          {{ botName }}
        </p>
      </div>
    </div>

    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div class="message p-2 mb-2 rounded-md bg-gray-100">
        <p class="text-sm text-gray-700"><strong>User:</strong></p>
        <p class="text-base">{{ userPrompt }}</p>
      </div>
      <div class="message p-2 mb-2 rounded-md bg-gray-100">
        <p class="text-sm text-gray-700"><strong>Bot:</strong></p>
        <p class="text-base">{{ botResponse }}</p>
      </div>
    </div>

    <!-- Debug JSON Display (for development purposes) -->
    <pre class="bg-gray-100 p-3 rounded-md mt-4 text-xs overflow-auto">
exchange:
      {{ fullChatExchange }}
    </pre>

    <!-- Reactions and Sharing with ReactionCard component -->
    <ReactionCard :chat-exchange-id="props.chatExchangeId" />

    <!-- Reply Section -->
    <div v-if="showReply" class="reply-container mt-4">
      <textarea
        v-model="replyMessage"
        placeholder="Type your reply here..."
        class="w-full p-3 border rounded-md mb-2"
      />
      <button class="btn btn-primary w-full" @click="sendReply">
        Send Reply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useBotStore } from '@/stores/botStore'

const props = defineProps({
  chatExchangeId: {
    type: Number,
    required: true,
  },
})

// Stores
const chatStore = useChatStore()
const botStore = useBotStore()

// Local state
const showReply = ref(false)
const replyMessage = ref('')

// Computed properties for chat exchange and messages
const chatExchange = computed(() =>
  chatStore.chatExchanges.find(
    (exchange) => exchange.id === props.chatExchangeId,
  ),
)

const fullChatExchange = computed(() =>
  JSON.stringify(chatExchange.value, null, 2),
)
const userPrompt = computed(
  () => chatExchange.value?.userPrompt || 'No prompt available',
)
const botResponse = computed(() => chatExchange.value?.botResponse || '')
const username = computed(() => chatExchange.value?.username || 'User')
const botName = computed(() => chatExchange.value?.botName || 'Bot')
const botAvatar = computed(() => botStore.currentBot?.avatarImage || '')

// Send a reply
const sendReply = async () => {
  if (replyMessage.value.trim()) {
    try {
      await chatStore.continueExchange(props.chatExchangeId, replyMessage.value)
      replyMessage.value = ''
      showReply.value = false
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }
}
</script>

<style scoped>
.reply-container textarea {
  resize: vertical;
}
</style>