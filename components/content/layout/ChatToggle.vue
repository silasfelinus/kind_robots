<template>
  <div class="fixed bottom-4 right-4 p-4 m-2">
    <!-- Chat Icon -->
    <div v-if="!chatOpen" class="cursor-pointer" @click="toggleChat">
      <icon :name="page.icon || 'icon-park-twotone:butterfly'" class="animate-pulse" />
    </div>

    <!-- Chat Component -->
    <div v-else class="p-4 rounded-lg bg-base-200">
      <!-- Chatbot Bubble -->
      <div class="p-2 rounded-lg bg-primary mb-2">
        {{ page.title || 'Hello, Kind Guest!' }}
      </div>

      <!-- User Intro Bubble -->
      <div class="p-2 rounded-lg bg-secondary mb-2">
        {{ page.description || 'Welcome to the chat!' }}
      </div>

      <!-- Suggestion Bubbles -->
      <button class="p-2 rounded-lg bg-accent mb-2">
        {{ page.suggestion1 || 'Tell me more about this page.' }}
      </button>
      <button class="p-2 rounded-lg bg-accent mb-2">
        {{ page.suggestion2 || 'Tell me more about your fundraiser.' }}
      </button>

      <!-- Text Input -->
      <textarea v-model="userInput" class="w-full p-2 rounded-lg mb-2" placeholder="Type your message..."></textarea>

      <!-- User Avatar -->
      <div>
        <lazy-user-avatar />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'; // Added computed
import { useUserStore } from '@/stores/userStore';
const { page } = useContent();

const userStore = useUserStore();

// Create a computed property for the current user
const currentUser = computed(() => userStore.user);

const chatOpen = ref(false);
const userInput = ref('');

const toggleChat = () => {
  chatOpen.value = !chatOpen.value;
};
</script>
