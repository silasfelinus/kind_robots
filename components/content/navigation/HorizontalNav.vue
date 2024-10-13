<template>
  <div class="flex justify-center bg-base-300 border-4 rounded-2xl">
    <div class="flex justify-evenly w-full space-x-4 items-end">
      <div
        v-for="(item, index) in hardcodedLinks"
        :key="index"
        class="group flex flex-col items-center justify-end w-20"
      >
        <!-- Title below the icon in a stylized format -->
        <span class="text-sm text-center whitespace-normal w-full bg-secondary text-white px-2 py-1 rounded-lg mb-2">
          {{ item.title }}
        </span>

        <!-- Stylized button with hover and transition effects -->
        <button
          :aria-label="item.title"
          class="hover:scale-110 transition-transform mt-auto rounded-full p-2 bg-accent text-white"
          @click="navigateTo(item.path)"
        >
          <icon
            :name="item.icon"
            class="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  { title: 'Memory Match', path: '/memory', icon: 'mdi:brain' },
  { title: 'Wonder Lab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'Dash', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
  {
    title: 'Weird Land',
    path: '/weirdlandia',
    icon: 'game-icons:alien-stare',
  },
])

// Access Vue Router for navigation
const router = useRouter()

// Navigation function
const navigateTo = (path: string) => {
  router.push(path) // Navigate using Vue Router
}
</script>
