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
          {{ senderName }}
          <span class="text-sm text-gray-500">to</span>
          {{ botName }}
        </p>
      </div>
    </div>

    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div
        v-for="message in threadMessages"
        :key="message.id"
        class="message p-2 mb-2 rounded-md"
        :class="message.sender === senderName ? 'bg-gray-100' : 'bg-blue-100'"
      >
        <p class="text-sm text-gray-700">
          <strong>{{ message.sender }}:</strong>
        </p>
        <p class="text-base">{{ message.content }}</p>
      </div>
    </div>

    <!-- Debug JSON Display (for development purposes) -->
    <pre class="bg-gray-100 p-3 rounded-md mt-4 text-xs overflow-auto">
exchange:
      {{ fullChat }}
    </pre>

    <!-- Reactions and Sharing with ReactionCard component -->
    <ReactionCard :chat-exchange-id="props.chatId" />

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
  chatId: {
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
const chat = computed(() =>
  chatStore.chats.find((exchange) => exchange.id === props.chatId),
)

const fullChat = computed(() => JSON.stringify(chat.value, null, 2))
const senderName = computed(() => chat.value?.sender || 'User')
const botName = computed(() => chat.value?.botName || 'Bot')
const botAvatar = computed(() => botStore.currentBot?.avatarImage || '')

// Threaded messages (all messages with the same originId)
const threadMessages = computed(() =>
  chatStore.chats.filter(
    (message) =>
      message.originId === chat.value?.originId || message.id === props.chatId,
  ),
)

// Send a reply
const sendReply = async () => {
  if (replyMessage.value.trim()) {
    try {
      const originId = chat.value?.originId || chat.value?.id
      const previousEntryId =
        chatStore.chats.filter((c) => c.originId === originId).slice(-1)[0]
          ?.id || chat.value?.id

      await chatStore.addChat(
        replyMessage.value,
        chat.value?.userId || 0, // Provide a valid userId or handle this with a fallback
        true, // isPublic set to true; adjust if needed
        originId,
        previousEntryId,
      )

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
