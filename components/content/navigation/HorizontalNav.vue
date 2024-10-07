<template>
  <div class="flex items-center justify-between p-4 bg-base-100 shadow-lg">
    <!-- Horizontal Nav Icons -->
    <div class="flex space-x-6">
      <div
        v-for="(item, index) in hardcodedLinks"
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
          {{ item.title }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Hardcoded sidebar links
const hardcodedLinks = ref([
  { title: 'Home', path: '/', icon: 'line-md:home-md-twotone' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'fluent:bot-add-20-regular' },
  {
    title: 'Prompt Factory',
    path: '/pitch',
    icon: 'fluent:chat-bubbles-question-16-regular',
  },
  { title: 'Art Lab', path: '/artmaker', icon: 'game-icons:easel' },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'material-symbols:art-track-outline-rounded',
  },
  { title: 'Wonderlab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'Dashboard', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
  {
    title: 'Weirder Game',
    path: '/weirder-game',
    icon: 'game-icons:alien-stare',
  }, // Added Weirder Game
])

// Navigation function
const navigateTo = (path: string) => {
  window.location.href = path // Replace with Nuxt's navigateTo if using Nuxt
}
</script>

<style scoped>
.group:hover .icon {
  transform: scale(1.1); /* Hover scale effect */
}
</style>
