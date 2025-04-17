<template>
  <div
    class="main-layout h-screen w-screen relative bg-primary overflow-hidden box-border"
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
      class="fixed z-10 border-3 rounded-2xl p-1 overflow-auto bg-base-300 box-border transition-all duration-600 ease-in-out"
      :style="displayStore.mainContentStyle"
    >
      <NuxtPage :key="$route.fullPath" />
    </main>

    <!-- Right Toggle Button -->
    <right-toggle
      class="fixed bottom-4 right-4 z-40"
      :class="{
        'bg-accent text-white shadow-xl': sidebarRightOpen,
        'bg-base-200 shadow': !sidebarRightOpen,
      }"
    />

    <!-- Right Chat Column -->
    <aside
      v-if="sidebarRightOpen"
      :style="displayStore.rightSidebarStyle"
      class="fixed z-40 bottom-16 right-4 bg-base-200 border-4 rounded-2xl shadow-xl border-accent overflow-hidden transition-all duration-500 ease-in-out flex flex-col"
    >
      <div class="h-[20%]">
        <mode-row class="w-full h-full" />
      </div>
      <div class="h-[80%] overflow-hidden">
        <splash-tutorial class="h-full w-full" />
      </div>
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
