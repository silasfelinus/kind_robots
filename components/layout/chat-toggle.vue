<!-- /components/content/layout/chat-toggle.vue -->
<template>
  <div class="fixed bottom-4 right-4 p-4 m-2 z-50">
    <!-- Chat Icon (Toggle Button) -->
    <div v-if="!chatOpen" class="cursor-pointer" @click="toggleChat">
      <Icon
        :name="icon || 'kind-icon:butterfly'"
        class="animate-pulse h-10 w-10 text-accent"
      />
    </div>

    <!-- Chat Panel -->
    <div v-else class="p-4 rounded-lg bg-base-300 shadow-xl max-w-xs w-full">
      <!-- Chatbot Bubble -->
      <div class="p-2 rounded-lg bg-primary text-white mb-2 font-bold">
        {{ title || 'Hello, Kind Guest!' }}
      </div>

      <!-- Description -->
      <div class="p-2 rounded-lg bg-secondary text-white mb-2">
        {{ description || 'Welcome to the chat!' }}
      </div>

      <!-- Suggestion Bubbles -->
      <button class="p-2 rounded-lg bg-accent mb-2 w-full text-left">
        {{ suggestion1 || 'Tell me more about this page.' }}
      </button>
      <button class="p-2 rounded-lg bg-accent mb-2 w-full text-left">
        {{ suggestion2 || 'Tell me more about your fundraiser.' }}
      </button>

      <!-- User Input -->
      <textarea
        v-model="userInput"
        class="w-full p-2 rounded-lg mb-2 bg-base-200 text-base-content"
        placeholder="Type your message..."
      />

      <!-- Avatar / User Image -->
      <div class="flex justify-end">
        <lazy-user-avatar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()

const { title, description, icon, page } = storeToRefs(pageStore)

// Use page-specific suggestions or fallbacks
const suggestion1 = 'Test Suggestion 1'
const suggestion2 = 'test Suggestion 2'

const chatOpen = ref(false)
const userInput = ref('')

const toggleChat = () => {
  chatOpen.value = !chatOpen.value
}
</script>
