<template>
  <div>
    <!-- Display messages for the selected chat exchange -->
    <div v-if="chatExchange" class="message-thread">
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
  chatExchangeId: {
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
const chatExchange = computed(() => {
  return chatStore.chatExchanges.find(
    (exchange) => exchange.id === props.chatExchangeId,
  )
})

// Build the conversation messages based on chatExchange
const chatMessages = computed(() => {
  if (chatExchange.value) {
    return [
      { role: 'user', content: chatExchange.value.userPrompt },
      { role: 'bot', content: chatExchange.value.botResponse },
    ]
  }
  return []
})
</script>
