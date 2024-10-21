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
  { title: 'Home', path: '/', icon: 'kind-icon:home' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'kind-icon:addbot' },
  {
    title: 'Prompt Factory',
    path: '/pitch',
    icon: 'kind-icon:chatbubbles',
  },
  { title: 'Art Lab', path: '/artmaker', icon: 'kind-icon:easel' },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'kind-icon:brain',
  },
  { title: 'Wonderlab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
  { title: 'Dashboard', path: '/dashboard', icon: 'kind-icon:settings' },
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
