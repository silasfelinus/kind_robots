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
      <ul v-if="Array.isArray(chats) && chats.length">
        <li v-for="exchange in chats" :key="exchange.id" class="p-3 border-b">
          <div class="flex justify-between items-center">
            <div>
              <p><strong>User Prompt:</strong> {{ exchange.content }}</p>
              <p>
                <strong>Bot Response:</strong>
                {{ exchange.botResponse || 'Awaiting response...' }}
              </p>
              <p><strong>Exchange ID:</strong> {{ exchange.id }}</p>
              <p>
                <strong>Previous Entry ID:</strong>
                {{ exchange.previousEntryId || 'None' }}
              </p>
            </div>
            <div class="space-x-2">
              <button
                class="btn btn-secondary"
                @click="continueChat(exchange.id)"
              >
                Continue
              </button>
              <button
                class="btn btn-info"
                @click="editChat(exchange.id, 'Updated prompt text')"
              >
                Edit
              </button>
              <button class="btn btn-error" @click="deleteChat(exchange.id)">
                Delete
              </button>
            </div>
          </div>
        </li>
      </ul>
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

async function continueChat(chatId: number) {
  const currentChat = chatStore.chats.find((chat) => chat.id === chatId)
  if (!currentChat) return

  const newChat = await chatStore.addChat({
    content: 'User reply content here...',
    userId: userStore.userId,
    botId: botStore.currentBot?.id,
    botName: botStore.currentBot?.name,
    recipientId: currentChat.recipientId,
    previousEntryId: currentChat.id,
    originId: currentChat.originId || currentChat.id,
  })

  // Optionally stream bot response for the new chat
  await chatStore.streamResponse(newChat.id)
}

async function editChat(chatId: number, newContent: string) {
  await chatStore.editChat(chatId, { content: newContent }) // Pass a valid Partial<Chat> object
}

async function deleteChat(chatId: number) {
  await chatStore.deleteChat(chatId)
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

    const updatedChat = await chatStore.editChat(newChat.id, {
      botResponse: chatStore.chats.find((chat) => chat.id === newChat.id)
        ?.content,
    })

    if (updatedChat) {
      showFeedback('Response received and chat updated successfully!')
    }
  } catch (error) {
    showFeedback('Failed to add or update chat.', true)
    console.error(error)
  }

  newPrompt.value = ''
}
</script>
