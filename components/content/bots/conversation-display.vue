<!-- /components/content/bots/conversation-display.vue -->
<template>
  <div>
    <!-- Display messages for the selected chat exchange -->
    <div v-if="chat" class="message-thread">
      <div
        v-for="(message, index) in chatMessages"
        :key="index"
        class="message p-2 mb-2 rounded-md bg-gray-100"
      >
        <p class="text-sm text-gray-700">
          <strong>{{ message.role }}:</strong>
        </p>
        <p class="text-base">{{ message.content }}</p>
      </div>
    </div>
    <p v-else class="text-gray-600">No conversation found.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const props = defineProps({
  chatId: {
    type: Number,
    required: true,
  },
  isReplyLoading: {
    type: Boolean,
    default: false,
  },
  currentBot: {
    type: Object,
    required: true,
  },
})

const chatStore = useChatStore()

// Fetch chat exchange by ID
const chat = computed(() => {
  return chatStore.chats.find((exchange) => exchange.id === props.chatId)
})

const chatMessages = computed(() => {
  if (chat.value) {
    // Retrieve the bot response if available; otherwise, return a placeholder or an empty string
    const botResponse =
      chatStore.chats.find(
        (entry) =>
          entry.previousEntryId === chat.value?.id &&
          entry.type === 'BotResponse',
      )?.content || 'Bot response not available.'

    return [
      { role: 'user', content: chat.value.content || 'No content available' },
      { role: 'bot', content: botResponse },
    ]
  }
  return []
})
</script>
