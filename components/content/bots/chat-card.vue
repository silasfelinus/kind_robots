<template>
  <div class="chat-card p-6 bg-base-200 rounded-xl shadow-md w-full max-w-lg mx-auto mt-6">
    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div
        v-for="(message, index) in chatExchangeMessages"
        :key="index"
        class="message p-2 mb-2 rounded-md bg-gray-100"
      >
        <p class="text-sm text-gray-700"><strong>{{ message.role }}:</strong></p>
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
      <button @click="sendReply" class="btn btn-primary w-full">Send Reply</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'

// Props: chatExchangeId to fetch the relevant chat exchange
const props = defineProps({
  chatExchangeId: {
    type: Number,
    required: true,
  },
  sendMessage: {
    type: Function as unknown as () => (
      updatedMessages: { role: string; content: string }[],
    ) => Promise<void>,
    default: () => async () => {},
  },
})

// Stores
const chatStore = useChatStore()

// Local state
const showReply = ref(false)
const replyMessage = ref('')

// Fetch the chat exchange from the store based on the chatExchangeId prop
const chatExchange = computed(() => {
  return chatStore.chatExchanges.find((exchange) => exchange.id === props.chatExchangeId)
})

// Messages of the chat exchange
const chatExchangeMessages = computed(() => {
  if (chatExchange.value) {
    return [
      { role: 'user', content: chatExchange.value.userPrompt },
      { role: 'bot', content: chatExchange.value.botResponse },
    ]
  }
  return []
})

// Get the content of the last message
const getLastMessageContent = computed(() => {
  return chatExchangeMessages.value.length
    ? chatExchangeMessages.value[chatExchangeMessages.value.length - 1].content
    : ''
})

// Toggle the reply box
const toggleReply = () => {
  showReply.value = !showReply.value
}

// Send a reply
const sendReply = async () => {
  if (replyMessage.value.trim()) {
    const updatedMessages = [
      ...chatExchangeMessages.value,
      { role: 'user', content: replyMessage.value },
    ]
    await props.sendMessage(updatedMessages)
    replyMessage.value = ''
    showReply.value = false
  }
}

// Save message action
const saveMessage = () => {
  // Implement save logic here
  console.log('Message saved!')
}

// Share message action
const share = (platform: string) => {
  // Implement sharing logic based on the platform
  console.log(`Shared on ${platform}`)
}

// React to message
const react = (reaction: string) => {
  console.log(`Reacted with ${reaction}`)
}

// Delete message
const deleteMessage = () => {
  // Implement delete logic
  console.log('Message deleted!')
}
</script>

<style scoped>
.reply-container textarea {
  resize: vertical;
}
</style>
