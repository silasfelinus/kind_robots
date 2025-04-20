<template>
  <div
    class="main-layout bg-base-200 h-screen w-screen relative overflow-hidden box-border"
  >
    <!-- Loaders -->
    <div class="fixed z-50">
      <kind-loader />
      <animation-loader class="fixed z-50" />
      <milestone-popup />
    </div>

    <!-- Header -->
    <header
      class="fixed z-40 border-6 border-secondary transition-all duration-500 ease-in-out"
      :style="displayStore.headerStyle"
    >
      <kind-header class="h-full w-full rounded-xl" />
    </header>

    <!-- Main Content -->
    <main
      class="fixed z-30 border-6 border-secondary rounded-2xl p-1 overflow-auto box-border transition-all duration-600 ease-in-out"
      :style="displayStore.mainContentStyle"
    >
      <main-content />
    </main>
  </div>
</template>

<script setup lang="ts">
// /app.vue
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()
</script>
