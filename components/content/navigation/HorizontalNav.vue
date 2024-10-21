<template>
  <div
    class="relative flex justify-center bg-base-300 border-4 rounded-2xl z-5"
  >
    <div class="flex justify-evenly w-full space-x-4 items-end">
      <div
        v-for="(item, index) in hardcodedLinks"
        :key="index"
        class="group flex flex-col lg:flex-row items-center justify-end w-20 lg:w-auto lg:space-x-2"
      >
        <!-- Entire button acts as a clickable container -->
        <button
          :aria-label="item.title"
          class="group flex flex-col lg:flex-row items-center justify-center w-full lg:w-auto space-y-2 lg:space-y-0 lg:space-x-2 text-center transition-all transform rounded-2xl p-4 hover:scale-105 hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          @click="navigateTo(item.path)"
        >
          <!-- Title below icon on small screens, inline with icon on large screens -->
          <span
            class="text-xs md:text-md lg:text-lg font-semibold mt-1 text-center bg-secondary text-white px-2 py-1 rounded-lg"
          >
            {{ item.title }}
          </span>

          <!-- Stylized icon with hover and transition effects -->
          <icon
            :name="item.icon"
            class="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-accent transition-transform group-hover:scale-110"
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
