<!-- /components/content/resonance/resonance-nav.vue -->
<template>
  <div class="relative w-full px-4">
    <!-- Faded Edges -->
    <div
      class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-base-200 to-transparent z-10"
    ></div>
    <div
      class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-base-200 to-transparent z-10"
    ></div>

    <!-- Scrollable Nav Row -->
    <div
      ref="scrollContainer"
      class="flex items-center gap-4 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth snap-x"
    >
      <div
        v-for="nav in resonanceNavItems"
        :key="nav.route"
        class="flex items-center bg-base-200 rounded-2xl border border-base-300 shadow-sm hover:shadow-md transition group flex-shrink-0 min-w-[220px] max-w-xs snap-start"
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
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const resonanceNavItems = [
  {
    title: 'Gallery',
    subtitle: 'Explore all resonances',
    route: '/resonancegallery',
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
    route: '/resonance',
    icon: 'kind-icon:resonance',
  },
]

function navigate(path: string) {
  router.push(path)
}
</script>

<style scoped>
/* Optional: hide default scrollbars */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
