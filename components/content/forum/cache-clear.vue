<script setup>
import { ref } from "vue";

// State for showing a confirmation message
const clearMessage = ref("");

// Function to clear local storage and update the message
const clearCache = () => {
  localStorage.clear(); // Clear all local storage items
  clearMessage.value = "Cache cleared successfully!";
  setTimeout(() => {
    clearMessage.value = ""; // Reset message after 3 seconds
  }, 3000);
};
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <!-- Clear Cache Button -->
    <button 
      class="btn btn-accent rounded-lg text-lg px-6 py-2 transition hover:scale-105"
      @click="clearCache"
    >
      Clear Cache
    </button>
    
    <!-- Success Message -->
    <p 
      v-if="clearMessage" 
      class="text-success text-sm bg-success-content p-2 rounded-md shadow-md"
    >
      {{ clearMessage }}
    </p>
  </div>
</template>

<style scoped>
/* Optional: Add hover animation for button */
button:hover {
  transform: scale(1.05);
}
</style>
