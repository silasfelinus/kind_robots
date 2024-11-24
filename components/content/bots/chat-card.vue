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
    <div v-if="userId" class="header flex items-center mb-4 gap-4">
      <user-avatar :user-id="userId" />
      <img
        v-if="hasBot"
        :src="botImage || '/images/bot.webp'"
        alt="Bot Avatar"
        class="w-12 h-12 rounded-full border-2 border-secondary ml-auto"
      />

      <div>
        <p class="text-lg font-bold text-gray-800">
          {{ senderName }}
          <span class="text-sm text-gray-500">to</span>
          {{ botName }}
        </p>
        <p class="text-sm text-gray-400">{{ formattedDate }}</p>
      </div>
    </div>

    <!-- Message Thread -->
    <div class="message-thread mb-4">
      <div
        v-for="message in threadMessages"
        :key="message.id"
        class="message p-3 mb-2 rounded-lg flex gap-4"
        :class="messageClass(message)"
      >
        <div v-if="userId" class="header flex items-center mb-4 gap-4">
          <user-avatar :user-id="userId" />
          <img
            v-if="hasBot"
            :src="botImage || '/images/bot.webp'"
            alt="Bot Avatar"
            class="w-12 h-12 rounded-full border-2 border-secondary ml-auto"
          />
        </div>
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
import { ref, computed, watchEffect } from 'vue'
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

const chat = ref(props.chat)

// Local state
const showReply = ref(false)
const replyMessage = ref('')
const userImage = ref<string | undefined>(undefined)
const botImage = ref<string | undefined>(undefined)

// Stores
const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()
const artStore = useArtStore()

const userId = computed(() => chat.value.userId)

const hasBot = computed(() => !!botStore.getBotById(chat.value.botId ?? -1))
const threadMessages = computed(() =>
  chatStore.chats.filter(
    (message) =>
      message.originId === chat.value.id || message.id === chat.value.id,
  ),
)
const formattedDate = computed(() =>
  chat.value.createdAt
    ? new Date(chat.value.createdAt).toLocaleString()
    : 'Unknown Date',
)
const botResponse = computed(
  () => chat.value.botResponse || 'Awaiting response...',
)
const senderName = computed(() => chat.value.sender || 'User')
const botName = computed(() => chat.value.botName || 'Bot')

// Inside the watchEffect
watchEffect(async () => {
  const user = userStore.getUserById(chat.value.userId)
  if (user?.artImageId) {
    try {
      // Explicitly await and type the result
      const artImage = await artStore.getArtImageById(user.artImageId)

      userImage.value = artImage?.imageData || user.avatarImage || undefined
    } catch {
      userImage.value = user?.avatarImage || undefined
    }
  } else {
    userImage.value = user?.avatarImage || undefined
  }

  if (chat.value.botId !== null) {
    const bot = await botStore.getBotById(chat.value.botId)

    if (bot?.artImageId) {
      try {
        const artImage = await artStore.getArtImageById(bot.artImageId)
        botImage.value = artImage?.imageData || bot.avatarImage || undefined
      } catch {
        botImage.value = bot?.avatarImage || undefined
      }
    } else {
      botImage.value = bot?.avatarImage || undefined
    }
  }
})

const messageClass = (message: { sender: string }) => ({
  'flex-row-reverse bg-gray-900 text-gray-100':
    message.sender === chat.value.sender,
  'flex-row bg-blue-900 text-blue-100': message.sender !== chat.value.sender,
})

// Actions
const sendReply = async () => {
  if (replyMessage.value.trim()) {
    try {
      const newChat = await chatStore.addChat({
        content: replyMessage.value,
        userId: chat.value.userId ?? userStore.userId ?? 0,
        recipientId: chat.value.recipientId ?? 0,
        isPublic: chat.value.isPublic,
        originId: chat.value.originId ?? chat.value.id,
        previousEntryId: chat.value.id,
        botId: chat.value.botId ?? 0,
        botName: chat.value.botName ?? '',
        type: chat.value.type,
      })

      replyMessage.value = ''
      showReply.value = false

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
    await chatStore.deleteChat(chat.value.id)
  } catch (error) {
    console.error('Error deleting chat:', error)
  }
}
</script>
