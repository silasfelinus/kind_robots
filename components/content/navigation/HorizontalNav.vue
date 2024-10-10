<template>
  <div
    class="flex justify-center p-2 bg-base-200 box-border"
    :style="{ height: footerHeight }"
  >
    <!-- Horizontal Nav Icons with Words Above -->
    <div class="flex justify-evenly w-full space-x-3 box-border items-end">
      <div
        v-for="(item, index) in hardcodedLinks"
        :key="index"
        class="group flex flex-col items-center box-border justify-end"
        style="min-width: 30px"
      >
        <!-- Text Above Icon -->
        <span
          class="text-sm text-center whitespace-normal box-border"
          style="max-width: 60px; word-break: keep-all"
        >
          {{ item.title }}
        </span>
        <!-- Icon Positioned at the Bottom -->
        <button
          class="hover:scale-110 transition-transform mt-auto box-border"
          @click="navigateTo(item.path)"
        >
          <icon :name="item.icon" class="w-8 h-8 text-accent" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

// Use the footerHeight from the display store for height
const footerHeight = computed(() => displayStore.footerHeight)

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
  { title: 'Wonder Lab', path: '/wonderlab', icon: 'game-icons:gear-hammer' },
  { title: 'Dash', path: '/dashboard', icon: 'mingcute:settings-6-fill' },
  {
    title: 'Weird Land',
    path: '/weirdlandia',
    icon: 'game-icons:alien-stare',
  }, // Added Weirder Game
])

// Access Vue Router for navigation
const router = useRouter()

// Navigation function to handle navigation
const navigateTo = (path: string) => {
  router.push(path) // Use Vue Router for navigation to avoid page refresh
}
</script>
