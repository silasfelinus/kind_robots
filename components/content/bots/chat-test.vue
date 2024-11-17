<template>
  <div class="container mx-auto p-6 bg-base-300 rounded-2xl">
    <h2 class="text-2xl mb-4 text-center">Chat Store Tester</h2>

    <!-- Feedback Message -->
    <p v-if="feedbackMessage" :class="feedbackClass" class="text-center mb-4">
      {{ feedbackMessage }}
    </p>

    <!-- Add a new exchange -->
    <div class="mb-6">
      <label class="block mb-1 text-lg">New Exchange Prompt</label>
      <input
        v-model="newPrompt"
        type="text"
        placeholder="Type your prompt here"
        class="w-full p-2 border rounded-md mb-2"
      />
      <button class="btn btn-primary w-full" @click="addChatWithStream">
        Add New Exchange
      </button>
    </div>

    <!-- Display existing exchanges or placeholder if none -->
    <div class="border-t pt-4">
      <h3 class="text-lg mb-2">Chat Exchanges</h3>
      <div v-if="Array.isArray(chats) && chats.length" class="space-y-4">
        <chat-card
          v-for="chat in chats"
          :key="chat.id"
          :chat="chat"
          @continue="continueChat"
          @edit="editChat"
          @delete="deleteChat"
        />
      </div>
      <p v-else class="text-center text-gray-500">
        No exchanges yet. Add one above to get started!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { useBotStore } from '@/stores/botStore'

const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()

async function continueChat(chat: Chat) {
  const newChat = await chatStore.addChat({
    content: 'User reply content here...',
    userId: userStore.userId,
    botId: botStore.currentBot?.id,
    botName: botStore.currentBot?.name,
    recipientId: chat.recipientId,
    previousEntryId: chat.id,
    originId: chat.originId || chat.id,
  })

  await chatStore.streamResponse(newChat.id)
}

async function editChat(chat: Chat, newContent: string) {
  await chatStore.editChat(chat.id, { content: newContent })
}

async function deleteChat(chat: Chat) {
  await chatStore.deleteChat(chat.id)
}

const newPrompt = ref('')
const feedbackMessage = ref<string | null>(null)
const feedbackClass = ref('text-green-500')

onMounted(async () => {
  try {
    await chatStore.initialize()
    console.log('All stores initialized successfully.')
  } catch (error) {
    showFeedback('Failed to initialize chat store.', true)
    console.error(error)
  }
})

const chats = computed(() => chatStore.chats || [])

function showFeedback(message: string, isError: boolean = false) {
  feedbackMessage.value = message
  feedbackClass.value = isError ? 'text-red-500' : 'text-green-500'
  setTimeout(() => (feedbackMessage.value = null), 3000)
}

async function addChatWithStream() {
  if (!newPrompt.value.trim()) {
    return showFeedback('Prompt cannot be empty.', true)
  }

  const userId = userStore.user?.id || 1
  const botId = botStore.currentBot?.id || null
  const botName = botStore.currentBot?.name || 'Unknown Bot'
  const recipientId = botId || null

  try {
    const newChat = await chatStore.addChat({
      content: newPrompt.value,
      userId,
      botId,
      botName,
      recipientId,
    })

    showFeedback('Chat added successfully! Streaming response...')
    await chatStore.streamResponse(newChat.id)
  } catch (error) {
    showFeedback('Failed to add chat.', true)
    console.error(error)
  }

  newPrompt.value = ''
}
</script>
