<template>
  <div class="flex items-center justify-between p-4 shadow-lg">
    <!-- Horizontal Nav Icons with Words Above -->
    <div class="flex space-x-6">
      <div
        v-for="(item, index) in hardcodedLinks"
        :key="index"
        class="group flex flex-col items-center"
        style="min-width: 60px"
      >
        <!-- Always Visible Text Above Icon -->
        <span
          class="text-sm whitespace-nowrap text-center overflow-hidden"
          style="max-width: 60px"
        >
          {{ item.title }}
        </span>
        <button
          class="text-primary hover:scale-110 transition-transform"
          @click="navigateTo(item.path)"
        >
          <icon :name="item.icon" class="w-8 h-8 text-accent" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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
    icon: 'mdi:brain',
  },
  { title: 'Wonderlab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'Dashboard', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
  {
    title: 'Weirder Game',
    path: '/weirdlandia',
    icon: 'game-icons:alien-stare',
  }, // Added Weirder Game
])

// Access Vue Router
const router = useRouter()

// Navigation function
const navigateTo = (path: string) => {
  router.push(path) // Use Vue Router for navigation to avoid page refresh
}
</script>

<style scoped>
/* Hover effect for scaling the icons */
.group:hover button {
  transform: scale(1.1);
}

/* Additional styles to ensure consistent icon and text alignment */
.group {
  width: 60px; /* Ensure all items have the same width */
}

span {
  max-width: 60px; /* Fix text width to avoid affecting the layout */
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
