<template>
  <main>
    <NuxtLayout :class="layoutName">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { LayoutKey } from './../stores/layoutStore'

const breakpoints = { mobile: 640, tablet: 1024 }

// Initialize deviceType with 'Desktop' corrected to match a value from LayoutKey
const deviceType = ref<LayoutKey | false>(LayoutKey.Desktop) // assuming LayoutKey is an enum

// Compute the layout name based directly on the device type or default to 'Desktop'
const layoutName = computed(() => deviceType.value || LayoutKey.Desktop)

// Function to check and update the device type based on window width
function checkSize() {
  const width = window.innerWidth
  if (width < breakpoints.mobile) {
    deviceType.value = LayoutKey.Mobile // Correct usage of enum
  } else if (width >= breakpoints.mobile && width < breakpoints.tablet) {
    deviceType.value = LayoutKey.Tablet // Correct usage of enum
  } else {
    deviceType.value = LayoutKey.Desktop // Correct usage of enum
  }
}

// Setup event listeners for resizing
onMounted(() => {
  window.addEventListener('resize', checkSize)
  checkSize() // Initial check to set the correct layout on load
})

onUnmounted(() => {
  window.removeEventListener('resize', checkSize)
})
</script>
