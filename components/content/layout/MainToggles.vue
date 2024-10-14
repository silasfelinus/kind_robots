<template>
  <div class="pointer-events-auto">
    <!-- Left Toggle -->
    <div class="w-5 h-5 fixed z-50 transition-all duration-600 ease-in-out" :style="leftToggleStyle">
      <left-toggle />
    </div>

    <!-- Sidefoot Toggle -->
    <div class="ww-5 h-5 fixed z-50 transition-all duration-600 ease-in-out" :style="sidefootToggleStyle">
      <sidefoot-toggle />
    </div>

    <!-- Right Toggle -->
    <div class="w-5 h-5 fixed z-50 transition-all duration-600 ease-in-out" :style="rightToggleStyle">
      <right-toggle />
    </div>

    <!-- Footer Toggle -->
    <div class="w-5 h-5 fixed z-50 transition-all duration-600 ease-in-out" :style="footerToggleStyle">
      <footer-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()

const sidebarLeftOpen = computed(
  () =>
    displayStore.sidebarLeftState !== 'hidden' &&
    displayStore.sidebarLeftState !== 'disabled',
)
const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)

// Toggle button styles fed from script
const leftToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerVh}vh + (${displayStore.sectionPadding} * 2 ))`,
  left: sidebarLeftOpen.value
    ? `calc(${displayStore.sidebarLeftVw}vw + (${displayStore.sectionPadding} * 2 ))`
    : displayStore.sectionPadding,
}))

const sidefootToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerVh}vh + (${displayStore.sectionPadding} * ${displayStore.footerMultiplier} ))`,
  left: sidebarLeftOpen.value
    ? `calc(${displayStore.sidebarLeftVw}vw + (${displayStore.sectionPadding} * 2 ))`
    : displayStore.sectionPadding,
}))

const rightToggleStyle = computed(() => ({
  top: `calc(${displayStore.headerVh}vh + (${displayStore.sectionPadding} * 2 ))`,
  right: sidebarRightOpen.value
    ? `calc(${displayStore.sidebarRightVw}vw + (${displayStore.sectionPadding} * 2 ))`
    : displayStore.sectionPadding,
}))

const footerToggleStyle = computed(() => ({
  bottom: `calc(${displayStore.footerVh}vh + (${displayStore.sectionPadding} * ${displayStore.footerMultiplier} ))`,
  right: sidebarRightOpen.value
    ? `calc(${displayStore.sidebarRightVw}vw + (${displayStore.sectionPadding} * 2 ))`
    : displayStore.sectionPadding,
}))
</script>
