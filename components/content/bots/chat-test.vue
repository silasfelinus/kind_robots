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
      <button class="btn btn-primary w-full" @click="addChat">
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
                <!-- Display bot reply here, if needed -->
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
                @click="editExchange(exchange.id, 'Updated prompt text')"
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

// Store references
const chatStore = useChatStore()
const userStore = useUserStore()
const botStore = useBotStore()

// Local state
const newPrompt = ref('')
const feedbackMessage = ref<string | null>(null)
const feedbackClass = ref('text-green-500')

// Initialize chatStore on component mount
onMounted(async () => {
  try {
    await chatStore.initialize()
    console.log('All stores initialized successfully.')
  } catch (error) {
    showFeedback('Failed to initialize chat store.', true)
    console.error(error)
  }
})

// Computed properties for chat exchanges with fallback to an empty array
const chats = computed(() => {
  try {
    return chatStore.chats || []
  } catch (error) {
    console.error('Error retrieving chat exchanges:', error)
    return [] // Fallback to an empty array
  }
})

// Function to display feedback
function showFeedback(message: string, isError: boolean = false) {
  feedbackMessage.value = message
  feedbackClass.value = isError ? 'text-red-500' : 'text-green-500'
  setTimeout(() => (feedbackMessage.value = null), 3000)
}

async function addChat() {
  if (!newPrompt.value.trim())
    return showFeedback('Prompt cannot be empty.', true)

  const userId = userStore.user?.id || 1 // Default user ID
  const botId = botStore.currentBot?.id || null
  const botName = botStore.currentBot?.name || 'Unknown Bot'
  const recipientId = botId || 1 // Assuming bot is the recipient

  try {
    await chatStore.addChat({
      content: newPrompt.value,
      userId,
      botId,
      botName,
      recipientId,
    })
    showFeedback('Chat added successfully!')
  } catch (error) {
    showFeedback('Failed to add chat.', true)
    console.error(error)
  }
  newPrompt.value = ''
}

async function continueChat(chatId: number) {
  const existingContent = 'Continuing conversation!'
  const botId = botStore.currentBot?.id || null
  const botName = botStore.currentBot?.name || 'Unknown Bot'
  const userId = userStore.user?.id || 1 // Default user ID
  const recipientId = botId || 1 // Assuming bot is the recipient

  try {
    const previousEntry = chatStore.chats.find((chat) => chat.id === chatId)
    if (!previousEntry) throw new Error('Chat not found')

    await chatStore.addChat({
      content: existingContent,
      userId,
      botId,
      botName,
      recipientId,
      originId: previousEntry.originId ?? previousEntry.id,
      previousEntryId: previousEntry.id,
    })
    showFeedback('Continued conversation successfully!')
  } catch (error) {
    showFeedback('Failed to continue chat.', true)
    console.error(error)
  }
}

// Edit an existing exchange
async function editExchange(exchangeId: number, updatedPrompt: string) {
  try {
    await chatStore.editChat(exchangeId, { content: updatedPrompt })
    showFeedback('Exchange edited successfully!')
  } catch (error) {
    showFeedback('Failed to edit exchange.', true)
    console.error(error)
  }
}

async function deleteChat(exchangeId: number) {
  try {
    const wasDeleted = await chatStore.deleteChat(exchangeId)
    if (wasDeleted) {
      showFeedback('Chat deleted successfully!')
    } else {
      showFeedback(
        'Failed to delete exchange due to authorization or other error.',
        true,
      )
    }
  } catch (error) {
    showFeedback('Failed to delete exchange.', true)
    console.error(error)
  }
}
</script>
