<template>
  <div
    class="chat-card p-6 bg-base-200 rounded-xl shadow-md w-full max-w-lg mx-auto mt-6"
  >
    <!-- Header with User and Bot Details -->
    <div class="header flex items-center mb-4">
      <div>
        <p class="text-lg font-semibold">
          {{ chat.sender || 'User' }}
          <span class="text-sm text-gray-500">to</span>
          {{ chat.botName || 'Bot' }}
        </p>
        <p class="text-sm text-gray-400">
          {{ formatDate(chat.createdAt) }}
        </p>
      </div>
    </div>

    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div
        v-for="message in threadMessages"
        :key="message.id"
        class="message p-2 mb-2 rounded-md"
        :class="message.sender === chat.sender ? 'bg-gray-100' : 'bg-blue-100'"
      >
        <p class="text-sm text-gray-700">
          <strong>{{ message.sender }}:</strong>
        </p>
        <p class="text-base">{{ message.content }}</p>
      </div>
    </div>

    <!-- Bot Response -->
    <div class="bot-response p-4 rounded-md bg-blue-100">
      <p class="text-sm text-gray-700 font-semibold">Bot Response:</p>
      <p class="text-base">
        {{ chat.botResponse || 'Awaiting response...' }}
      </p>
    </div>

    <!-- Debug JSON Display (optional) -->
    <pre class="bg-gray-100 p-3 rounded-md mt-4 text-xs overflow-auto">
exchange:
{{ JSON.stringify(chat, null, 2) }}
    </pre>

    <!-- Reactions and Sharing -->
    <ReactionCard :chat-exchange-id="chat.id" />

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

    <!-- Controls -->
    <div class="flex gap-2 mt-4 justify-end">
      <button class="btn btn-secondary" @click="continueChat">Continue</button>
      <button class="btn btn-info" @click="editChat">Edit</button>
      <button class="btn btn-error" @click="deleteChat">Delete</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'

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
.bot-response {
  background-color: #ebf8ff;
}
</style>
