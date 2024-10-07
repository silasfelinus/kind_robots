<template>
  <nav class="vertical-nav-container p-2 space-y-4">
    <div
      v-for="link in hardcodedLinks"
      :key="link.title"
      class="vertical-link flex items-center space-x-4 cursor-pointer"
      @click.prevent="navigate(link.path)"
    >
      <Icon :name="link.icon" class="w-6 h-6 text-accent" />
      <span class="text-lg font-semibold">{{ link.title }}</span>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Hardcoded sidebar links
const hardcodedLinks = [
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
]

// Function to navigate to a route
const navigate = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.vertical-nav-container {
  display: flex;
  flex-direction: column;
}
.vertical-link {
  transition: all 0.3s ease;
}
.vertical-link:hover {
  background-color: var(--primary);
  scale: 1.05;
  border-radius: 8px;
}
</style>
