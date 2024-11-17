<template>
  <div
    class="chat-card p-6 bg-base-200 rounded-xl shadow-lg w-full max-w-lg mx-auto mt-6 relative border border-primary hover:border-accent transition"
  >
    <!-- Top Right Delete Icon -->
    <button
      class="absolute top-4 right-4 text-error hover:text-error-content transition"
      @click="deleteChat"
    >
      <icon name="trash" class="w-6 h-6" />
    </button>

    <!-- Header -->
    <div v-if="chat.userId" class="header flex items-center mb-4 gap-4">
      <img
        :src="userStore.userImage(chat.userId)"
        alt="User Avatar"
        class="w-12 h-12 rounded-full border-2 border-primary"
      />
      <div>
        <p class="text-lg font-bold text-gray-800">
          {{ chat.sender || 'User' }}
          <span class="text-sm text-gray-500">to</span>
          {{ chat.botName || 'Bot' }}
        </p>
        <p class="text-sm text-gray-400">{{ formatDate(chat.createdAt) }}</p>
      </div>
      <img
        v-if="chat.botId"
        :src="botStore.botImage(chat.botId)"
        alt="Bot Avatar"
        class="w-12 h-12 rounded-full border-2 border-secondary ml-auto"
      />
    </div>

    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div
        v-for="message in threadMessages"
        :key="message.id"
        class="message p-3 mb-2 rounded-lg flex gap-4"
        :class="{
          'flex-row-reverse bg-gray-900 text-gray-100':
            message.sender === chat.sender,
          'flex-row bg-blue-900 text-blue-100': message.sender !== chat.sender,
        }"
      >
        <img
          :src="getImage(message.sender)"
          alt="Avatar"
          class="w-8 h-8 rounded-full border"
        />
        <div>
          <p class="text-sm font-bold">{{ message.sender }}:</p>
          <p class="text-base">{{ message.content }}</p>
        </div>
      </div>
    </div>

    <!-- Bot Response -->
    <div class="bot-response p-4 rounded-lg bg-accent mb-4">
      <p class="text-sm font-semibold text-accent-content">Bot Response:</p>
      <p class="text-base">{{ chat.botResponse || 'Awaiting response...' }}</p>
    </div>

    <!-- Continue Section -->
    <div v-if="showReply" class="continue-container mt-4">
      <textarea
        v-model="replyMessage"
        placeholder="Type your reply here..."
        class="w-full p-3 border rounded-lg bg-base-100"
      />
      <button class="btn btn-primary w-full mt-2" @click="sendReply">
        Send Reply
      </button>
    </div>

    <!-- Reactions -->
    <ReactionCard :chat-exchange-id="chat.id" class="mt-6" />

    <!-- Controls -->
    <div class="flex gap-2 mt-4 justify-end">
      <button class="btn btn-secondary" @click="toggleReply">Continue</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

// Props
const props = defineProps({
  chat: {
    type: Object as () => Chat,
    required: true,
  },
})

const chat = props.chat

// Local state
const showReply = ref(false)
const replyMessage = ref('')

// Stores
const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()

// Computed properties
const threadMessages = computed(() =>
  chatStore.chats.filter(
    (message) => message.originId === chat.originId || message.id === chat.id,
  ),
)

// Utility method for formatting dates
const formatDate = (date: Date | string | null) => {
  if (!date) return 'Unknown Date'
  return new Date(date).toLocaleString()
}

// Get image based on sender
const getImage = (sender: string) => {
  return sender === chat.sender
    ? userStore.userImage(chat.userId || 9)
    : botStore.botImage(chat.botId || 1)
}

const sendReply = async () => {
  if (replyMessage.value.trim()) {
    try {
      const newChat = await chatStore.addChat({
        content: replyMessage.value,
        userId: chat.userId || userStore.userId || 9, // Ensure a default number is used
        recipientId: chat.recipientId || 0, // Fallback to 0 or another default
        isPublic: chat.isPublic,
        originId: chat.originId || chat.id,
        previousEntryId: chat.id,
        botId: chat.botId,
        botName: chat.botName,
      })

      replyMessage.value = ''
      showReply.value = false

      // Optionally, stream the response
      await chatStore.streamResponse(newChat.id)
    } catch (error) {
      console.error('Error sending reply:', error)
    }
  }
}

const toggleReply = () => {
  showReply.value = !showReply.value
}

const deleteChat = async () => {
  try {
    await chatStore.deleteChat(chat.id)
  } catch (error) {
    console.error('Error deleting chat:', error)
  }
}
</script>

<style scoped>
.reply-container textarea {
  resize: vertical;
}
</style>
