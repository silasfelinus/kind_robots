<template>
  <div class="flex flex-col min-h-screen">
    <!-- Navbar -->
    <nav class="flex justify-between items-center p-4 text-default">
      <div class="logo text-2xl font-bold">KindRobots</div>
      <new-dashboard class="flex flex-row bg-base-200 border rounded-2xl m-1" />
    </nav>

    <page-info />

    <!-- Main Content -->
    <main class="flex-1 p-4">
      <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2" />
    </main>

    <!-- Footer -->
    <footer class="p-4 bg-base-200 text-default text-center">
      <room-title />
      <random-link />

      <footer-toggle />
      KindRobots © 2023
    </footer>
  </div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'
const { page } = useContent()
const pageStore = usePageStore()

const shouldDisplayTooltip = computed(() => {
  if (pageStore.showInfo) {
    return pageStore.showInfo
  }
  return pageStore.showTooltip && page.tooltip
})
</script>
