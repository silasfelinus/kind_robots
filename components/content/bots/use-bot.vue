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
            class="btn btn-outline btn-info rounded-full px-4 py-2"
          >
            {{ prompt }}
          </button>
        </div>
      </div>

      <div class="flex flex-col w-full sm:w-1/2 mt-6">
        <label for="customPrompt" class="block text-lg font-medium mb-2"
          >Custom Prompt:</label
        >
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
        class="btn btn-primary w-full sm:w-auto"
      >
        Submit Prompt
      </button>
    </div>

    <!-- Chat Area -->
    <chat-area class="mt-8 w-full" />
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

// Parse userIntro by splitting on "|"
const parsedUserPrompts = computed(() => {
  return botStore.currentBot?.userIntro ? botStore.currentBot.userIntro.split('|') : []
})

// Function to handle sending a selected prompt
async function sendPrompt(prompt: string) {
  if (userStore.user?.id) {
    await chatStore.addOrUpdateExchange(prompt, userStore.user.id, botStore.currentBot.id)
  }
}

// Function to handle submitting a custom prompt
async function submitCustomPrompt() {
  if (chatStore.currentPrompt && userStore.user?.id) {
    await chatStore.addOrUpdateExchange(chatStore.currentPrompt, userStore.user.id, botStore.currentBot.id)
    chatStore.currentPrompt = '' // Clear the input after submitting
  }
}

onMounted(async () => {
  await botStore.loadStore()
  await chatStore.initialize()
})
</script>
