<template>
  <div
    class="fixed z-50 bg-opacity-90 bg-black text-white p-4 rounded-lg"
    style="top: 50%; left: 50%; transform: translate(-50%, -50%);"
  >
    <h2 class="text-lg font-bold">Debug Info</h2>
    <ul class="text-sm space-y-2">
      <li><strong>Sidebar Left State:</strong> {{ sidebarLeftState }}</li>
      <li><strong>Sidebar Right State:</strong> {{ sidebarRightState }}</li>
      <li><strong>Footer State:</strong> {{ footerState }}</li>
      <li><strong>Is Mobile:</strong> {{ isMobile }}</li>
      <li><strong>Main Width:</strong> {{ mainWidth }}</li>
      <li><strong>Main Height:</strong> {{ mainHeight }}</li>
      <li><strong>Sidebar Left Width:</strong> {{ sidebarLeftWidth }}</li>
      <li><strong>Sidebar Right Width:</strong> {{ sidebarRightWidth }}</li>
      <li><strong>Header Height:</strong> {{ headerHeight }}</li>
      <li><strong>Footer Height:</strong> {{ footerHeight }}</li>
      <li><strong>Padding:</strong> {{ sectionPadding }}</li>
      <li><strong>Left Sidebar Multiplier:</strong> {{ sidebarLeftMultiplier }}</li>
      <li><strong>Right Sidebar Multiplier:</strong> {{ sidebarRightMultiplier }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for the values to debug
const displayStore = useDisplayStore()

const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)
const footerState = computed(() => displayStore.footerState)
const isMobile = computed(() => displayStore.isMobileViewport)
const mainWidth = computed(() => displayStore.mainWidth)
const mainHeight = computed(() => displayStore.mainHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const headerHeight = computed(() => `calc(var(--vh) * ${displayStore.headerVh})`)
const footerHeight = computed(() => `calc(var(--vh) * ${displayStore.footerVh})`)
const sectionPadding = '16px'
const sidebarLeftMultiplier = computed(() => (displayStore.sidebarLeftState !== 'hidden' && displayStore.sidebarLeftState !== 'disabled') ? 2 : 1)
const sidebarRightMultiplier = computed(() => (displayStore.sidebarRightState !== 'hidden' && displayStore.sidebarRightState !== 'disabled') ? 2 : 1)
</script>

<style scoped>
/* Minimal styles for better readability */
ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}
li {
  padding: 4px 0;
}
</style>
