<template>
  <div class="layout-container">
    <main class="main-content" :style="{ 'margin-left': sidebarMargin }">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watchEffect } from 'vue'
import { useLayoutStore } from './../stores/layoutStore'

const layoutStore = useLayoutStore()
const isSidebarOpen = computed(() => layoutStore.isSidebarOpen)

// Reactive sidebar margin calculation using watchEffect
const sidebarMargin = ref('0vw') // Initial value as a ref

watchEffect(() => {
  const width = window.innerWidth // Dynamically get window width

  if (width < 768) {
    sidebarMargin.value = isSidebarOpen.value ? '30vw' : '15vw'
  } else if (width >= 768 && width < 1025) {
    sidebarMargin.value = isSidebarOpen.value ? '23vw' : '8vw'
  } else if (width >= 1025 && width < 1441) {
    sidebarMargin.value = isSidebarOpen.value ? '15vw' : '8vw'
  } else {
    sidebarMargin.value = isSidebarOpen.value ? '8vw' : '5vw'
  }
})

// Setup event listener for window resize
let resizeListener
onMounted(() => {
  resizeListener = () => {
    // No need to manually update sidebarMargin here, watchEffect will handle it
  }
  window.addEventListener('resize', resizeListener)
})
onUnmounted(() => {
  window.removeEventListener('resize', resizeListener)
})
</script>

<style>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.main-content {
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
  transition: margin-left 0.3s ease-in-out;
}
</style>
