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

    <!-- Header with User and Bot Images -->
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
        class="message p-3 mb-2 rounded-lg flex items-start gap-4"
        :class="{
          'bg-gray-900 text-gray-100': message.sender === chat.sender,
          'bg-blue-900 text-blue-100': message.sender !== chat.sender,
        }"
      >
        <p class="text-sm font-bold">{{ message.sender }}:</p>
        <p class="text-base">{{ message.content }}</p>
      </div>
    </div>

    <!-- Bot Response -->
    <div class="bot-response p-4 rounded-lg bg-accent">
      <p class="text-sm font-semibold text-accent-content">Bot Response:</p>
      <p class="text-base">{{ chat.botResponse || 'Awaiting response...' }}</p>
    </div>

    <!-- Reply Section -->
    <div v-if="showReply" class="reply-container mt-4">
      <textarea
        v-model="replyMessage"
        placeholder="Type your reply here..."
        class="w-full p-3 border rounded-lg bg-base-100"
      />
      <button class="btn btn-primary w-full mt-2" @click="sendReply">
        Send Reply
      </button>
    </div>

    <!-- Reactions and Sharing -->
    <ReactionCard :chat-exchange-id="chat.id" />

    <!-- Controls -->
    <div class="flex gap-2 mt-4 justify-end">
      <button class="btn btn-secondary" @click="continueChat">Continue</button>
      <button class="btn btn-info" @click="editChat">Edit</button>
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

// Methods
const sendReply = async () => {
  if (replyMessage.value.trim()) {
    try {
      const newChat = await chatStore.addChat({
        content: replyMessage.value,
        userId: chat.userId || userStore.userId || 9,
        recipientId: chat.recipientId || 0,
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

const continueChat = async () => {
  try {
    const newChat = await chatStore.addChat({
      content: 'User continuation message...',
      userId: chat.userId || userStore.user?.id || 9,
      recipientId: chat.recipientId || 0,
      isPublic: chat.isPublic,
      originId: chat.originId || chat.id,
      previousEntryId: chat.id,
      botId: chat.botId,
      botName: chat.botName,
    })

    // Stream the response for the continued chat
    await chatStore.streamResponse(newChat.id)
  } catch (error) {
    console.error('Error continuing chat:', error)
  }
}

const editChat = async () => {
  try {
    const updatedContent = 'Updated message content'
    await chatStore.editChat(chat.id, { content: updatedContent })
  } catch (error) {
    console.error('Error editing chat:', error)
  }
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
