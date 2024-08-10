<template>
  <!-- Chat Toggle Container -->
  <div class="flex justify-center items-center">
    <!-- Chat Toggle Button -->
    <button
      :class="[
        'flex justify-center items-center m-2 w-6 h-6 md:w-16 md:h-16 cursor-pointer transition-all ease-in-out hover:scale-110 hover:shadow-lg rounded-full',
        { 'bg-accent': isChatVisible },
      ]"
      @click="toggleChat"
    >
      <!-- Chat Icon -->
      <icon
        :name="isChatVisible ? 'mdi:chat' : 'mdi:chat-off'"
        :title="isChatVisible ? 'Hide Chat' : 'Show Chat'"
        class="w-full h-full"
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFilterStore } from '@/stores/filterStore'

const filterStore = useFilterStore()

// Computed property to get the current state of the chat visibility
const isChatVisible = computed(() => filterStore.showChat)

// Function to toggle the chat visibility
const toggleChat = () => {
  filterStore.toggleChat()
}
</script>
