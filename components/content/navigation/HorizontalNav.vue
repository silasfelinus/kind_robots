<template>
  <div class="flex items-center justify-between p-4 bg-base-100 shadow-lg">
    <!-- Horizontal Nav Icons -->
    <div class="flex space-x-6">
      <div
        v-for="(item, index) in navItems"
        :key="index"
        class="group relative"
      >
        <button
          class="text-primary hover:scale-110 transition-transform"
          @click="navigateTo(item.path)"
        >
          <icon :name="item.icon" class="w-8 h-8" />
        </button>
        <!-- Hover Text -->
        <span
          class="absolute top-10 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Navigation items array
const navItems = ref([
  { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
  { label: 'Profile', icon: 'user', path: '/profile' },
  { label: 'Settings', icon: 'cog', path: '/settings' },
  { label: 'Weirder Game', icon: 'game', path: '/weirder-game' }, // Added Weirder Game
])

// Navigation function
const navigateTo = (path: string) => {
  // Assuming you're using Nuxt, you can use navigateTo here.
  // Otherwise, replace this with your own navigation logic.
  window.location.href = path
}
</script>

<style scoped>
.group:hover .icon {
  transform: scale(1.1); /* Hover scale effect */
}
</style>
