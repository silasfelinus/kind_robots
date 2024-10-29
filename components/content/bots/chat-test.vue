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
      <button class="btn btn-primary w-full" @click="addNewExchange">
        Add New Exchange
      </button>
    </div>

    <!-- Display existing exchanges or placeholder if none -->
    <div class="border-t pt-4">
      <h3 class="text-lg mb-2">Chat Exchanges</h3>
      <ul v-if="chatExchanges.length">
        <li
          v-for="exchange in chatExchanges"
          :key="exchange.id"
          class="p-3 border-b"
        >
          <div class="flex justify-between items-center">
            <div>
              <p><strong>User Prompt:</strong> {{ exchange.userPrompt }}</p>
              <p><strong>Bot Response:</strong> {{ exchange.botResponse }}</p>
              <p><strong>Exchange ID:</strong> {{ exchange.id }}</p>
              <p><strong>Previous Entry ID:</strong> {{ exchange.previousEntryId || 'None' }}</p>
            </div>
            <div class="space-x-2">
              <button
                class="btn btn-secondary"
                @click="continueExchange(exchange.id)"
              >
                Continue
              </button>
              <button
                class="btn btn-info"
                @click="editExchange(exchange.id, 'Updated prompt text')"
              >
                Edit
              </button>
              <button
                class="btn btn-error"
                @click="deleteExchange(exchange.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      </ul>
      <p v-else class="text-center text-gray-500">No exchanges yet. Add one above to get started!</p>
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
  await chatStore.initialize()
})

// Computed properties for chat exchanges
const chatExchanges = computed(() => chatStore.chatExchanges)

// Function to display feedback
function showFeedback(message: string, isError: boolean = false) {
  feedbackMessage.value = message
  feedbackClass.value = isError ? 'text-red-500' : 'text-green-500'
  setTimeout(() => (feedbackMessage.value = null), 3000)
}

// Add a new exchange
async function addNewExchange() {
  if (!newPrompt.value.trim()) return showFeedback('Prompt cannot be empty.', true)

  const userId = userStore.user?.id || 1 // Default user ID
  const botId = botStore.currentBot?.id || 1 // Default bot ID
  try {
    await chatStore.addExchange(newPrompt.value, userId, botId)
    showFeedback('Exchange added successfully!')
  } catch (error) {
    showFeedback('Failed to add exchange.', true)
    console.error(error)
  }
  newPrompt.value = ''
}

// Continue an existing exchange
async function continueExchange(exchangeId: number) {
  const existingPrompt = "I'm continuing the conversation!"
  try {
    await chatStore.continueExchange(exchangeId, existingPrompt)
    showFeedback('Continued conversation successfully!')
  } catch (error) {
    showFeedback('Failed to continue exchange.', true)
    console.error(error)
  }
}

// Edit an existing exchange
async function editExchange(exchangeId: number, updatedPrompt: string) {
  try {
    await chatStore.editExchange(exchangeId, { userPrompt: updatedPrompt })
    showFeedback('Exchange edited successfully!')
  } catch (error) {
    showFeedback('Failed to edit exchange.', true)
    console.error(error)
  }
}

// Delete an existing exchange
async function deleteExchange(exchangeId: number) {
  try {
    await chatStore.deleteExchange(exchangeId)
    showFeedback('Exchange deleted successfully!')
  } catch (error) {
    showFeedback('Failed to delete exchange.', true)
    console.error(error)
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
}
</style>
