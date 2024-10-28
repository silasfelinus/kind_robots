<template>
  <div
    class="chat-card p-6 bg-base-200 rounded-xl shadow-md w-full max-w-lg mx-auto mt-6"
  >
    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div
        v-for="(message, index) in chatExchangeMessages"
        :key="index"
        class="message p-2 mb-2 rounded-md bg-gray-100"
      >
        <p class="text-sm text-gray-700">
          <strong>{{ message.role }}:</strong>
        </p>
        <p class="text-base">{{ message.content }}</p>
      </div>
    </div>

    <!-- Last message -->
    <div class="message p-3 bg-gray-100 rounded-md mb-4">
      {{ getLastMessageContent }}
    </div>

    <!-- Actions -->
    <div class="actions flex justify-around mt-4">
      <button class="btn btn-secondary" @click="saveMessage">Save</button>
      <button class="btn btn-secondary" @click="share('facebook')">
        Share on Facebook
      </button>
      <button class="btn btn-secondary" @click="share('twitter')">
        Share on Twitter
      </button>
      <button class="btn btn-secondary" @click="react('like')">👍</button>
      <button class="btn btn-secondary" @click="react('dislike')">👎</button>
      <button class="btn btn-error" @click="deleteMessage">X</button>
      <button class="btn btn-accent" @click="toggleReply">Reply</button>
    </div>

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
import { ref, computed, defineProps } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import type { PropType } from 'vue'

// Props with correct type definitions
const props = defineProps({
  chatExchangeId: {
    type: Number,
    required: true,
  },
  sendMessage: {
    type: Function as PropType<
      (updatedMessages: { role: string; content: string }[]) => Promise<void>
    >,
    default: () => async () => {},
  },
})

// Stores
const chatStore = useChatStore()

// Local state
const showReply = ref(false)
const replyMessage = ref('')

// Computed properties for chat exchange and messages
const chatExchange = computed(() => {
  return chatStore.chatExchanges.find(
    (exchange) => exchange.id === props.chatExchangeId,
  )
})

const chatExchangeMessages = computed(() => {
  if (chatExchange.value) {
    return [
      { role: 'user', content: chatExchange.value.userPrompt },
      { role: 'bot', content: chatExchange.value.botResponse },
    ]
  }
  return []
})

const getLastMessageContent = computed(() => {
  return chatExchangeMessages.value.length
    ? chatExchangeMessages.value[chatExchangeMessages.value.length - 1].content
    : ''
})

// Toggle reply box
const toggleReply = () => {
  showReply.value = !showReply.value
}

// Send a reply, utilizing continueExchange
const sendReply = async () => {
  if (replyMessage.value.trim()) {
    try {
      const updatedMessages = [
        ...chatExchangeMessages.value,
        { role: 'user', content: replyMessage.value },
      ]
      await chatStore.continueExchange(props.chatExchangeId, replyMessage.value)
      await props.sendMessage(updatedMessages)
      replyMessage.value = ''
      showReply.value = false
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }
}

// Additional action functions (saveMessage, share, react, deleteMessage)
const saveMessage = async () => {
  if (chatExchange.value) {
    try {
      await chatStore.continueExchange(
        props.chatExchangeId,
        chatExchange.value.userPrompt,
      )
      console.log('Message saved successfully.')
    } catch (error) {
      console.error('Error saving message:', error)
    }
  }
}

const share = (platform: string) => {
  console.log(`Shared on ${platform}`)
}

const react = (reaction: string) => {
  console.log(`Reacted with ${reaction}`)
}

const deleteMessage = async () => {
  if (chatExchange.value) {
    try {
      await chatStore.deleteExchange(chatExchange.value.id)
      console.log('Message deleted successfully.')
    } catch (error) {
      console.error('Error deleting message:', error)
    }
  }
}
</script>

<style scoped>
.reply-container textarea {
  resize: vertical;
}
</style>
