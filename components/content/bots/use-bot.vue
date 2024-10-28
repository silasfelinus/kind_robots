<template>
  <div class="rounded-2xl border p-6 m-4 mx-auto bg-base-200 grid gap-6 max-w-screen-lg">
    <h1 class="text-4xl text-center col-span-full">Use a Bot</h1>

    <!-- Bot Selector at the Top -->
    <div class="w-full flex justify-center mb-4">
      <bot-selector />
    </div>

    <!-- Avatar and Bot Information -->
    <div class="flex flex-wrap justify-center col-span-full gap-6">
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

    <!-- User Prompts and Custom Prompt Input -->
    <div class="flex flex-col gap-4 items-center mt-6 w-full">
      <div class="flex flex-wrap gap-2 justify-center">
        <div
          v-for="(prompt, index) in parsedUserPrompts"
          :key="index"
          class="w-auto"
        >
          <button
            @click="sendPrompt(prompt)"
            :disabled="loading"
            class="btn btn-outline btn-info rounded-full px-4 py-2 transition duration-300 ease-in-out"
          >
            <span v-if="!loading">{{ prompt }}</span>
            <span v-else class="spinner-border spinner-border-sm" role="status"></span>
          </button>
        </div>
      </div>

      <div class="flex flex-col w-full sm:w-1/2 mt-6">
        <label for="customPrompt" class="block text-lg font-medium mb-2">Custom Prompt:</label>
        <input
          v-model="chatStore.currentPrompt"
          id="customPrompt"
          type="text"
          class="w-full p-3 rounded-lg border"
          placeholder="Enter your custom prompt here"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <div class="w-full flex justify-center mt-6">
      <button
        @click="submitCustomPrompt"
        :disabled="loading"
        class="btn btn-primary w-full sm:w-auto transition duration-300 ease-in-out"
      >
        <span v-if="!loading">Submit Prompt</span>
        <span v-else class="spinner-border spinner-border-sm" role="status"></span>
      </button>
    </div>

    <!-- Active Chat Cards -->
    <div v-if="activeChatCards.length" class="mt-8 w-full grid gap-4">
      <chat-card
        v-for="(exchange, index) in activeChatCards"
        :key="index"
        :chatExchangeId="exchange.id"
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

const botStore = useBotStore()
const chatStore = useChatStore()
const userStore = useUserStore()

const loading = ref(false)  // Loading state

// Parse userIntro by splitting on "|"
const parsedUserPrompts = computed(() => {
  return botStore.currentBot?.userIntro ? botStore.currentBot.userIntro.split('|') : []
})

// Function to handle sending a selected prompt
async function sendPrompt(prompt: string) {
  loading.value = true  // Start loading
  try {
    if (userStore.user?.id) {
      await chatStore.addOrUpdateExchange(prompt, userStore.user.id, botStore.currentBot.id)
    }
  } finally {
    loading.value = false  // End loading
  }
}

// Function to handle submitting a custom prompt
async function submitCustomPrompt() {
  loading.value = true  // Start loading
  try {
    if (chatStore.currentPrompt && userStore.user?.id) {
      await chatStore.addOrUpdateExchange(chatStore.currentPrompt, userStore.user.id, botStore.currentBot.id)
      chatStore.currentPrompt = '' // Clear the input after submitting
    }
  } finally {
    loading.value = false  // End loading
  }
}

// Get active chat cards for the current bot
const activeChatCards = computed(() => {
  return chatStore.activeChatsByBotId(botStore.currentBot.id)
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
