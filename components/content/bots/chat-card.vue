<template>
  <div
    class="chat-card p-6 bg-base-200 rounded-xl shadow-lg w-full max-w-lg mx-auto mt-6 relative border border-primary hover:border-accent transition"
  >
    <!-- Top Right Delete Icon -->
    <button
      class="absolute top-4 right-4 text-error hover:text-error-content transition"
      @click="deleteChat"
    >
      <Icon name="kind-icon:delete" class="w-4 h-4" />
    </button>

    <!-- Header -->
    <div v-if="hasUser" class="header flex items-center mb-4 gap-4">
      <img
        :src="userImage"
        alt="User Avatar"
        class="w-12 h-12 rounded-full border-2 border-primary"
      />
      <div>
        <p class="text-lg font-bold text-gray-800">
          {{ senderName }}
          <span class="text-sm text-gray-500">to</span>
          {{ botName }}
        </p>
        <p class="text-sm text-gray-400">{{ formattedDate }}</p>
      </div>
      <img
        v-if="hasBot"
        :src="botImage"
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
        :class="messageClass(message)"
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
      <p class="text-base">{{ botResponse }}</p>
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
import { computed, ref } from 'vue'<script setup lang="ts">
import { computed, ref } from 'vue'
import { useChatStore, type Chat } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'
import { useArtStore } from '@/stores/artStore'

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
const artStore = useArtStore()

// Computed properties
const threadMessages = computed(() =>
  chatStore.chats.filter(
    (message) => message.originId === chat.originId || message.id === chat.id,
  ),
)

const formattedDate = computed(() => {
  if (!chat.createdAt) return 'Unknown Date'
  return new Date(chat.createdAt).toLocaleString()
})

const botResponse = computed(() => chat.botResponse || 'Awaiting response...')
const senderName = computed(() => chat.sender || 'User')
const botName = computed(() => chat.botName || 'Bot')

// Compute user avatar image dynamically
const userImage = computed(() => {
  const user = userStore.getUserById(chat.userId)
  if (user?.artImageId) {
    const artImage = artStore.getArtImageById(user.artImageId)
    return artImage?.imageData || user.avatarImage || null
  }
  return user?.avatarImage || null
})

// Compute bot avatar image dynamically
const botImage = computed(() => {
  const bot = botStore.getBotById(chat.botId)
  if (bot?.artImageId) {
    const artImage = artStore.getArtImageById(bot.artImageId)
    return artImage?.imageData || bot.avatarImage || null
  }
  return bot?.avatarImage || null
})

// Utility functions
const getImage = (sender: string) => {
  return sender === chat.sender ? userImage.value : botImage.value
}

const messageClass = (message: { sender: string }) => ({
  'flex-row-reverse bg-gray-900 text-gray-100': message.sender === chat.sender,
  'flex-row bg-blue-900 text-blue-100': message.sender !== chat.sender,
})

// Actions
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
        type: chat.type,
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
