<template>
  <div class="fixed bottom-4 right-4 p-4 m-2">
    <!-- Chat Icon -->
    <div v-if="!chatOpen" class="cursor-pointer" @click="toggleChat">
      <Icon
        :name="page?.Icon || 'Icon-park-twotone:butterfly'"
        class="animate-pulse"
      />
    </div>

    <!-- Chat Component -->
    <div v-else class="p-4 rounded-lg bg-base-300">
      <!-- Chatbot Bubble -->
      <div class="p-2 rounded-lg bg-primary mb-2">
        {{ page?.title || 'Hello, Kind Guest!' }}
      </div>

      <!-- User Intro Bubble -->
      <div class="p-2 rounded-lg bg-secondary mb-2">
        {{ page?.description || 'Welcome to the chat!' }}
      </div>

      <!-- Suggestion Bubbles -->
      <button class="p-2 rounded-lg bg-accent mb-2">
        {{ page?.suggestion1 || 'Tell me more about this page.' }}
      </button>
      <button class="p-2 rounded-lg bg-accent mb-2">
        {{ page?.suggestion2 || 'Tell me more about your fundraiser.' }}
      </button>

      <!-- Text Input -->
      <textarea
        v-model="userInput"
        class="w-full p-2 rounded-lg mb-2"
        placeholder="Type your message..."
      />

      <!-- User Avatar -->
      <div>
        <lazy-user-avatar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'

// Get the route params
const route = useRoute()
const name = route.params.name as string

// Define the expected page structure
interface ChatPage {
  title?: string
  description?: string
  suggestion1?: string
  suggestion2?: string
  Icon?: string
}

// Fetch the chat page data using Nuxt Content v3
const { data: page } = await useAsyncData<ChatPage>(
  `chat-${name}`,
  async () => {
    const result = await queryCollection('content')
      .path(`/chat/${name}`)
      .first()
    return result || {}
  },
)

// Reactive state
const chatOpen = ref(false)
const userInput = ref('')

const toggleChat = () => {
  chatOpen.value = !chatOpen.value
}
</script>
