<!-- /components/content/story/resonance-nav.vue -->
<template>
  <div class="flex flex-wrap items-center justify-center gap-4 w-full p-4">
    <div
      v-for="nav in resonanceNavItems"
      :key="nav.route"
      class="flex items-center justify-between bg-base-200 rounded-2xl border border-base-300 shadow-sm hover:shadow-md transition group max-w-xs w-full"
    >
      <!-- Icon Button -->
      <button
        @click="navigate(nav.route)"
        class="flex items-center justify-center p-3 cursor-pointer hover:bg-accent hover:text-white rounded-l-2xl transition w-14 h-14"
        :title="`Open ${nav.title}`"
      >
        <Icon :name="nav.icon" class="w-6 h-6" />
      </button>

      <!-- Divider -->
      <div class="w-px h-8 bg-base-300"></div>

      <!-- Text Button -->
      <button
        @click="navigate(nav.route)"
        class="flex-1 text-sm sm:text-base font-medium px-4 py-2 cursor-pointer text-center hover:text-accent transition"
        :title="nav.subtitle"
      >
        {{ nav.title }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const resonanceNavItems = [
  {
    title: 'Browse',
    subtitle: 'Explore all resonances',
    route: '/resonancebrowser',
    icon: 'kind-icon:resonance',
  },
  {
    title: 'Create',
    subtitle: 'Add a new resonance',
    route: '/addresonance',
    icon: 'kind-icon:resonance',
  },
  {
    title: 'Lab',
    subtitle: 'Tinker and experiment',
    route: '/resonancelab',
    icon: 'kind-icon:resonance',
  },
  {
    title: 'Visualizer',
    subtitle: 'Watch sound come alive',
    route: '/resonanceaudio',
    icon: 'kind-icon:resonance',
  },
  {
    title: 'Chapters',
    subtitle: 'Organize resonance flows',
    route: '/resonancechapters',
    icon: 'kind-icon:resonance',
  },
]

function navigate(path: string) {
  router.push(path)
}
</script>
