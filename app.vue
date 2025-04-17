<template>
  <div
    class="main-layout h-screen w-screen relative overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
    </div>

    <!-- Header -->
    <header
      class="fixed z-40 transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content -->
    <main
      class="fixed z-40 border-3 rounded-2xl p-1 overflow-auto box-border transition-all duration-600 ease-in-out"
      :style="displayStore.mainContentStyle"
    >
      <NuxtPage :key="$route.fullPath" />
    </main>

    <!-- Right Toggle Button -->
    <right-toggle
      class="fixed bottom-4 right-4 z-30"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-200 shadow': !sidebarRightOpen,
      }"
    />

    <!-- Right Chat Column -->
    <aside
      v-if="sidebarRightOpen"
      class="fixed z-30"
      :style="displayStore.rightSidebarStyle"
    >
      <splash-tutorial />
    </aside>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
</script>
