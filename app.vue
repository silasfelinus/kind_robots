<template>
  <div id="app" class="flex flex-col h-screen w-screen bg-base-200">
    <!-- KindLoader (Only runs once) -->
    <KindLoader v-if="!isPageReady" @page-ready="handlePageReady" />

    <!-- Header (refactored into MainHeader) -->
    <MainHeader :show-tutorial="showTutorial" @toggle-tutorial="toggleTutorial" />

    <!-- Main Layout Wrapper -->
    <div class="flex flex-grow relative overflow-hidden">
      <!-- Left Sidebar -->
      <kind-sidebar-simple class="h-full" :style="{ width: `${displayStore.sidebarLeftWidth}vw` }" />

      <!-- Main Content Area -->
      <main class="relative flex-grow overflow-y-auto flex justify-center items-center">
        <MainFlip :show-tutorial="showTutorial" />
      </main>

      <!-- Right Sidebar -->
      <kind-sidebar-right class="h-full" :style="{ width: `${displayStore.sidebarRightWidth}vw` }" />
    </div>

    <!-- Footer -->
    <footer class="w-full bg-base-200 flex items-center justify-center" :style="{ height: `${displayStore.footerVh}vh` }">
      created by Silas Knight silas@kindrobots.org
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplayStore } from '@/stores/displayStore'
import MainFlip from '@/components/MainFlip.vue'
import MainHeader from '@/components/MainHeader.vue'

// Initialize stores and states
const displayStore = useDisplayStore()
const showTutorial = ref(true)
const isPageReady = ref(false)
const router = useRouter()

// Handle when page is ready
const handlePageReady = (ready: boolean) => {
  isPageReady.value = ready
}

// Toggle between tutorial and main content
const toggleTutorial = () => {
  showTutorial.value = !showTutorial.value
}

// Auto-reset tutorial on route changes
router.beforeEach((to, from, next) => {
  showTutorial.value = true
  next()
})

onMounted(() => {
  displayStore.initialize()
})

onBeforeUnmount(() => {
  displayStore.removeViewportWatcher()
})
</script>
