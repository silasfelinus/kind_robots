<template>
  <div
    class="fixed z-50 bg-opacity-90 bg-black text-white p-4 rounded-lg"
    style="top: 50%; left: 50%; transform: translate(-50%, -50%)"
  >
    <h2 class="text-lg font-bold">Debug Info</h2>
    <ul class="text-sm space-y-2">
      <li><strong>Sidebar Left State:</strong> {{ sidebarLeftState }}</li>
      <li><strong>Sidebar Right State:</strong> {{ sidebarRightState }}</li>
      <li><strong>Footer State:</strong> {{ footerState }}</li>
      <li><strong>Is Mobile:</strong> {{ isMobile }}</li>

      <!-- Display numerical and string versions for dimensions -->
      <li><strong>Main Width (num):</strong> {{ mainVw }}vw</li>
      <li><strong>Main Width (str):</strong> {{ mainWidth }}</li>
      <li><strong>Main Height (num):</strong> {{ mainVh }}vh</li>
      <li><strong>Main Height (str):</strong> {{ mainHeight }}</li>

      <li><strong>Sidebar Left Width (num):</strong> {{ sidebarLeftVw }}vw</li>
      <li><strong>Sidebar Left Width (str):</strong> {{ sidebarLeftWidth }}</li>

      <li>
        <strong>Sidebar Right Width (num):</strong> {{ sidebarRightVw }}vw
      </li>
      <li>
        <strong>Sidebar Right Width (str):</strong> {{ sidebarRightWidth }}
      </li>

      <li><strong>Header Height (num):</strong> {{ headerVh }}vh</li>
      <li><strong>Header Height (str):</strong> {{ headerHeight }}</li>

      <li><strong>Footer Height (num):</strong> {{ footerVh }}vh</li>
      <li><strong>Footer Height (str):</strong> {{ footerHeight }}</li>

      <!-- Additional debug info -->
      <li><strong>Padding:</strong> {{ sectionPadding }}</li>
      <li>
        <strong>Left Sidebar Multiplier:</strong> {{ sidebarLeftMultiplier }}
      </li>
      <li>
        <strong>Right Sidebar Multiplier:</strong> {{ sidebarRightMultiplier }}
      </li>

      <!-- Toggle Element Positions -->
      <li><strong>Left Toggle Position:</strong> {{ leftTogglePosition }}</li>
      <li><strong>Right Toggle Position:</strong> {{ rightTogglePosition }}</li>
      <li>
        <strong>Footer Toggle Position:</strong> {{ footerTogglePosition }}
      </li>
      <li>
        <strong>Sidefoot Toggle Position:</strong> {{ sidefootTogglePosition }}
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for the values to debug
const displayStore = useDisplayStore()

// Accessing the states
const sidebarLeftState = computed(() => displayStore.sidebarLeftState)
const sidebarRightState = computed(() => displayStore.sidebarRightState)
const footerState = computed(() => displayStore.footerState)
const isMobile = computed(() => displayStore.isMobileViewport)

// Numerical values
const mainVw = computed(() => displayStore.mainVw)
const mainVh = computed(() => displayStore.mainVh)
const sidebarLeftVw = computed(() => displayStore.sidebarLeftVw)
const sidebarRightVw = computed(() => displayStore.sidebarRightVw)
const headerVh = computed(() => displayStore.headerVh)
const footerVh = computed(() => displayStore.footerVh)

// String values for dimensions
const mainWidth = computed(() => displayStore.mainWidth)
const mainHeight = computed(() => displayStore.mainHeight)
const sidebarLeftWidth = computed(() => displayStore.sidebarLeftWidth)
const sidebarRightWidth = computed(() => displayStore.sidebarRightWidth)
const headerHeight = computed(() => displayStore.headerHeight)
const footerHeight = computed(() => displayStore.footerHeight)

// Other variables
const sectionPadding = '16px'

// Multiplier values
const sidebarLeftMultiplier = computed(() =>
  displayStore.sidebarLeftState !== 'hidden' &&
  displayStore.sidebarLeftState !== 'disabled'
    ? 2
    : 1,
)
const sidebarRightMultiplier = computed(() =>
  displayStore.sidebarRightState !== 'hidden' &&
  displayStore.sidebarRightState !== 'disabled'
    ? 2
    : 1,
)
const footerMultiplier = computed(() => (footerState.value === 'open' ? 2 : 1))

// Toggle element positions (including calculations)
const leftTogglePosition = computed(() => {
  return `Top: calc(${headerHeight.value} + ${sectionPadding} * 2), Left: calc(${sidebarLeftWidth.value} + ${sectionPadding} * ${sidebarLeftMultiplier.value})`
})

const rightTogglePosition = computed(() => {
  return `Top: calc(${headerHeight.value} + ${sectionPadding} * 2), Right: calc(${sidebarRightWidth.value} + ${sectionPadding} * ${sidebarRightMultiplier.value})`
})

const footerTogglePosition = computed(() => {
  return `Bottom: calc(${footerHeight.value} + ${sectionPadding} * ${footerMultiplier.value}), Left: calc(${sidebarLeftWidth.value} + ${sectionPadding})`
})

const sidefootTogglePosition = computed(() => {
  return `Bottom: calc(${footerHeight.value} + ${sectionPadding} * ${footerMultiplier.value}), Right: calc(${sidebarRightWidth.value} + ${sectionPadding} * ${sidebarRightMultiplier.value})`
})
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
