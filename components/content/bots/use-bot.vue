<template>
  <div
    class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 grid gap-6 max-w-screen-lg"
  >
    <h1 class="text-4xl text-center col-span-full">Use a Bot</h1>

    <!-- Bot Selector at the Top -->
    <div class="w-full flex justify-center mb-4">
      <bot-selector />
    </div>

    <!-- Error Message Display -->
    <p v-if="errorMessage" class="text-red-500 text-center mt-4">
      {{ errorMessage }}
    </p>

    <!-- Avatar and Bot Information -->
    <div
      v-if="botStore.currentBot"
      class="flex flex-wrap justify-center col-span-full gap-6"
    >
      <div class="w-full md:w-1/3 p-4">
        <img
          v-if="botStore.currentBot.avatarImage"
          :src="botStore.currentBot.avatarImage"
          alt="Bot Avatar"
          class="rounded-full w-full h-auto"
        />
      </div>
      <div class="w-full md:w-2/3 p-4 text-center">
        <h2 class="text-2xl">{{ botStore.currentBot.name }}</h2>
        <p class="text-lg text-gray-600">{{ botStore.currentBot.subtitle }}</p>
        <p class="text-gray-700 mt-4">{{ botStore.currentBot.description }}</p>
        <p class="text-gray-700 mt-4">{{ botStore.currentBot.botIntro }}</p>
      </div>
    </div>
    <div
      v-if="botStore.currentBot"
      class="flex flex-col gap-4 items-center mt-6 w-full"
    >
      <div class="flex flex-wrap gap-2 justify-center">
        <div
          v-for="prompt in parsedUserPrompts"
          :key="prompt.id"
          class="w-auto"
        >
          <button
            :disabled="loading"
            class="btn btn-outline btn-info rounded-full px-4 py-2 transition duration-300 ease-in-out"
            @click="sendPrompt(prompt.text)"
          >
            <span v-if="!loading">{{ prompt.text }}</span>
            <span
              v-else
              class="spinner-border spinner-border-sm"
              role="status"
            ></span>
          </button>
        </div>
      </div>

      <div class="flex flex-col w-full sm:w-1/2 mt-6">
        <label for="customPrompt" class="block text-lg font-medium mb-2"
          >Custom Prompt:</label
        >
        <input
          id="customPrompt"
          v-model="chatStore.currentPrompt"
          type="text"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter your custom prompt here"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <div class="w-full flex justify-center mt-6">
      <button
        :disabled="loading || !chatStore.currentPrompt.trim()"
        class="btn btn-primary w-full sm:w-auto transition duration-300 ease-in-out"
        @click="submitCustomPrompt"
      >
        <span v-if="!loading">Submit Prompt</span>
        <span
          v-else
          class="spinner-border spinner-border-sm"
          role="status"
        ></span>
      </button>
    </div>

    <!-- Active Chat Cards -->
    <div v-if="activeChatCards.length" class="mt-8 w-full grid gap-4">
      <chat-card
        v-for="(exchange, index) in activeChatCards"
        :key="index"
        :chat-exchange-id="exchange.id"
      />
    </div>
    <p v-else class="text-center text-gray-600 mt-6">No active chats yet.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBotStore } from '@/stores/botStore'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { usePromptStore } from '@/stores/promptStore'

const botStore = useBotStore()
const chatStore = useChatStore()
const userStore = useUserStore()
const promptStore = usePromptStore()

const loading = ref(false) // Loading state
const errorMessage = ref()

const parsedUserPrompts = computed(() => {
  return botStore.currentBot?.userIntro
    ? botStore.currentBot.userIntro.split('|').map((text, index) => ({
        text: text.trim(),
        id: index + 1, // Assign a unique id to each prompt
      }))
    : []
})

// Function to handle sending a selected prompt
async function sendPrompt(prompt: string) {
  if (!prompt) return console.warn('Prompt is empty, cannot send.')

  // Set the selected prompt to chatStore.currentPrompt to display it in the input field
  chatStore.currentPrompt = prompt

  loading.value = true // Start loading
  try {
    const { id: userId } = userStore.user || {}
    const { id: botId } = botStore.currentBot || {}

    if (userId && botId) {
      console.log('Preparing prompt packet:', {
        prompt,
        userId,
        botId,
      })

      // Generate a new prompt ID by creating the prompt in the backend
      const newPrompt = await promptStore.addPrompt(prompt, userId, botId)
      const promptId = newPrompt.id
      if (!promptId) {
        throw new Error('Failed to generate a prompt ID.')
      }

      console.log('Sending prompt packet with promptId:', promptId)

      // Call addExchange with the generated promptId
      await chatStore.addExchange(prompt, userId, botId, undefined, promptId)

      // Clear the prompt field after successful submission
      chatStore.currentPrompt = ''
    } else {
      console.warn('Missing user or bot ID, cannot proceed.')
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while sending the prompt.'
    console.error('Error sending prompt:', error)
  } finally {
    loading.value = false // End loading
  }
}

// Function to handle submitting a custom or modified prompt
async function submitCustomPrompt() {
  const trimmedPrompt = chatStore.currentPrompt.trim()
  if (!trimmedPrompt) {
    errorMessage.value = 'Custom prompt is empty. Please enter text.'
    return // Prevent empty submissions
  }

  loading.value = true // Start loading
  try {
    const { id: userId } = userStore.user || {}
    const { id: botId } = botStore.currentBot || {}

    if (userId && botId) {
      console.log('Submitting custom prompt packet:', {
        prompt: trimmedPrompt,
        userId,
        botId,
      })

      await chatStore.addExchange(trimmedPrompt, userId, botId)

      // Clear the prompt field after successful submission
      chatStore.currentPrompt = ''
    } else {
      errorMessage.value = 'Please select a bot and ensure you are logged in.'
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while submitting the custom prompt.'
    console.error('Error submitting custom prompt:', error)
  } finally {
    loading.value = false // End loading
  }
}

// Get active chat cards for the current bot
const activeChatCards = computed(() => {
  return botStore.currentBot
    ? chatStore.activeChatsByBotId(botStore.currentBot.id)
    : []
})

// Initialize stores
onMounted(async () => {
  await botStore.loadStore()
  await chatStore.initialize()
})
</script>

<style scoped>
.spinner-border {
  border-width: 2px;
  width: 1rem;
  height: 1rem;
  border-color: white;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

@keyframes spin {
  100% {
    transform: rotate(360deg);
  }
}
</style>
