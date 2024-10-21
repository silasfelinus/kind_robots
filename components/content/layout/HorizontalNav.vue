<template>
  <div
    class="relative flex justify-center bg-base-300 border-4 rounded-2xl z-5"
  >
    <div
      class="flex flex-wrap justify-center w-full space-y-2 space-x-0 sm:space-x-4 items-center"
    >
      <div
        v-for="(item, index) in hardcodedLinks"
        :key="index"
        class="group flex flex-col items-center justify-center w-1/3 sm:w-1/5 lg:w-auto"
      >
        <!-- Entire button acts as a clickable container -->
        <button
          :aria-label="item.title"
          class="group flex flex-col items-center justify-center w-full space-y-1 text-center transition-all transform p-2 hover:scale-105 hover:bg-accent hover:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
          @click="navigateTo(item.path)"
        >
          <!-- Stylized icon with hover and transition effects -->
          <icon
            :name="item.icon"
            class="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 text-accent transition-transform group-hover:scale-110"
          />

          <!-- Title below icon on small screens, inline with icon on large screens -->
          <span
            class="text-xs md:text-sm lg:text-md font-semibold mt-1 text-center bg-secondary text-white px-2 py-1 rounded-lg"
          >
            {{ item.title }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

// Hardcoded sidebar links
const hardcodedLinks = ref([
  { title: 'Home', path: '/', icon: 'kind-icon:home' },
  { title: 'Bot Cafe', path: '/botcafe', icon: 'kind-icon:addbot' },
  {
    title: 'Prompt Factory',
    path: '/pitch',
    icon: 'kind-icon:chatbubble',
  },
  { title: 'Art Lab', path: '/artmaker', icon: 'kind-icon:easel' },
  { title: 'Memory Match', path: '/memory', icon: 'kind-icon:brain' },
  { title: 'Wonder Lab', path: '/wonderlab', icon: 'kind-icon:gearhammer' },
  { title: 'Dash', path: '/dashboard', icon: 'kind-icon:settings' },
  {
    title: 'Weird Land',
    path: '/weirdlandia',
    icon: 'kind-icon:alien',
  },
])

// Access Vue Router for navigation
const router = useRouter()

// Navigation function
const navigateTo = (path: string) => {
  router.push(path) // Navigate using Vue Router
}
</script>
