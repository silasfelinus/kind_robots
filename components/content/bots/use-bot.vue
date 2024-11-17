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

    <!-- Prompt Options -->
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

      <!-- Custom Prompt Input -->
      <div class="flex flex-col w-full sm:w-1/2 mt-6">
        <label for="customPrompt" class="block text-lg font-medium mb-2"
          >Custom Prompt:</label
        >
        <input
          id="customPrompt"
          v-model="promptStore.currentPrompt"
          type="text"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter your custom prompt here"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <div class="w-full flex justify-center mt-6">
      <button
        :disabled="loading || !promptStore.currentPrompt.trim()"
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
        v-for="(chat, index) in activeChatCards"
        :key="index"
        :chat="chat"
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

const loading = ref(false)
const errorMessage = ref<string | undefined>()
const parsedUserPrompts = ref<{ text: string; id: number }[]>([])

// Function to parse and update user prompts based on bot userIntro
function updateParsedUserPrompts() {
  const newUserIntro = botStore.currentBot?.userIntro

  parsedUserPrompts.value = newUserIntro
    ? newUserIntro.split('|').map((text, index) => ({
        text: text.trim(),
        id: index + 1,
      }))
    : []
}

async function sendPrompt(prompt: string) {
  if (!prompt) {
    console.warn('Prompt is empty, cannot send.')
    return
  }

  promptStore.currentPrompt = prompt
  loading.value = true

  try {
    const { id: userId } = userStore.user || {}
    if (!userId) {
      throw new Error('User ID is missing.')
    }

    const { id: botId } = botStore.currentBot || {}
    if (!botId) {
      throw new Error('Bot ID is missing.')
    }

    let newPrompt
    try {
      newPrompt = await promptStore.addPrompt(prompt, userId, botId)
    } catch (error) {
      console.error('Error generating prompt in promptStore:', error)
      throw new Error('Failed to add prompt to the prompt store.')
    }

    if (!newPrompt || !newPrompt.id) {
      throw new Error('Failed to generate a prompt ID.')
    }

    try {
      await chatStore.addChat({
        content: prompt,
        userId,
        botId,
        recipientId: botId,
        promptId: newPrompt.id,
      })
    } catch (error) {
      console.error('Error adding chat in chatStore:', error)
      throw new Error('Failed to add chat to the chat store.')
    }

    promptStore.currentPrompt = ''
  } catch (error) {
    console.error('Error in sendPrompt function:', error)
  } finally {
    loading.value = false
  }
}

async function submitCustomPrompt() {
  const trimmedPrompt = promptStore.currentPrompt.trim()
  if (!trimmedPrompt) {
    errorMessage.value = 'Custom prompt is empty. Please enter text.'
    return
  }

  loading.value = true
  try {
    const { id: userId } = userStore.user || {}
    const { id: botId } = botStore.currentBot || {}

    if (userId && botId) {
      await chatStore.addChat({
        content: trimmedPrompt,
        userId,
        botId,
        recipientId: botId,
      })
      promptStore.currentPrompt = ''
    } else {
      errorMessage.value = 'Please select a bot and ensure you are logged in.'
    }
  } catch (error) {
    errorMessage.value = 'An error occurred while submitting the custom prompt.'
    console.error('Error submitting custom prompt:', error)
  } finally {
    loading.value = false
  }
}

// Computed property for active chat cards for the current bot
const activeChatCards = computed(() => {
  return botStore.currentBot
    ? chatStore.activeChatsByBotId(botStore.currentBot.id)
    : []
})

// Initialize stores and parsed prompts on load
onMounted(async () => {
  await botStore.loadStore()
  await chatStore.initialize()
  updateParsedUserPrompts() // Populate parsed prompts initially
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
