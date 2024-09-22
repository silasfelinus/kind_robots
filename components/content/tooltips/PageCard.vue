<template>
  <div v-if="show" class="p-4 rounded-lg border-2 flex items-center space-x-4" :class="bgClass">
    <!-- Bot Avatar -->
    <img :src="imageSrc" :alt="altText" class="w-12 h-12 rounded-full shadow-md" />
    
    <!-- Message Content -->
    <div class="flex flex-col">
      <span class="text-sm font-semibold">{{ username }}</span>
      <p class="text-sm">{{ message }}</p>
    </div>
    
    <!-- Close Button -->
    <button @click="$emit('remove-card')" class="text-gray-500 hover:text-gray-700 ml-auto">
      ✕
    </button>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  show: Boolean,
  bgClass: String,
  imageSrc: String,
  altText: String,
  username: String,
  message: String,
})
</script>

<style scoped>
/* Styling for the MessageCard component */
img {
  object-fit: cover;
}

button {
  cursor: pointer;
}
</style>
